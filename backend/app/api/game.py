from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..db.database import get_db
from ..models.game import Game
from ..schemas.game import GameCreate, GameRead, GameUpdate, GameFinish
from ..models.bet import Bet
from ..schemas.bet import BetRead
from ..models.user import User
from ..models.tournament import Tournament
from ..core.security import get_current_user

router = APIRouter()


@router.post("/games", response_model=GameRead)
async def create_game(
    game: GameCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    tournament = db.query(Tournament).filter(Tournament.id == game.tournament_id, Tournament.finished == False).first()
    if not tournament:
        raise HTTPException(status_code=400, detail="Tournament must be open to add games")

    new_game = Game(
        tournament_id=game.tournament_id,
        title=game.title,
        start_time=game.start_time,
        team1=game.team1,
        team2=game.team2,
        finished=False,
    )
    db.add(new_game)
    db.commit()
    db.refresh(new_game)
    return new_game


@router.get("/games", response_model=list[GameRead])
async def get_games(
    finished: Optional[bool] = Query(None),  # Optional query parameter for finished status
    db: Session = Depends(get_db),
):
    query = db.query(Game, Tournament.name.label("tournament_name")).join(
        Tournament, Game.tournament_id == Tournament.id
    )

    if finished is not None:
        query = query.filter(Game.finished == finished)

    games = query.all()
    result = []
    for game, tournament_name in games:
        game_data = GameRead.from_orm(game)
        game_data.tournament_name = tournament_name

        # Присваиваем start_time каждой ставке в игре
        for bet in game.bets:
            bet_data = BetRead.from_orm(bet)
            bet_data.start_time = game.start_time  # Добавляем start_time для каждой ставки
            game_data.bets.append(bet_data)

        result.append(game_data)

    return result


@router.get("/games/{game_id}", response_model=GameRead)
async def get_game(game_id: int, db: Session = Depends(get_db)):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.put("/games/{game_id}", response_model=GameRead)
async def update_game(
    game_id: int,
    game: GameUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_game = db.query(Game).filter(Game.id == game_id).first()
    if not db_game:
        raise HTTPException(status_code=404, detail="Game not found")
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if db_game.finished:
        raise HTTPException(status_code=400, detail="Cannot update finished game")

    db_game.team1_score = game.team1_score
    db_game.team2_score = game.team2_score

    db.commit()
    db.refresh(db_game)
    return db_game


@router.delete("/games/{game_id}", response_model=GameRead)
async def delete_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db_game = db.query(Game).filter(Game.id == game_id).first()
    if not db_game:
        raise HTTPException(status_code=404, detail="Game not found")

    # Delete all bets associated with this game
    db.query(Bet).filter(Bet.game_id == game_id).delete()

    # Now delete the game
    db.delete(db_game)
    db.commit()


@router.post("/games/finish", response_model=GameRead)
async def finish_game(
    game: GameFinish,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    game_id = game.id
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db_game = db.query(Game).filter(Game.id == game_id).first()
    if not db_game:
        raise HTTPException(status_code=404, detail="Game not found")
    if db_game.finished:
        raise HTTPException(status_code=400, detail="Game is already finished")

    if db_game.start_time - timedelta(hours=3) > datetime.utcnow():
        raise HTTPException(status_code=400, detail="Cannot finish not started game")

    bets = db.query(Bet).filter(Bet.game_id == game_id).all()
    for bet in bets:
        if bet.team1_score == db_game.team1_score and bet.team2_score == db_game.team2_score:
            bet.points = 5  # Exact score match
        elif bet.team1_score - bet.team2_score == db_game.team1_score - db_game.team2_score:
            bet.points = 3  # Correct goal difference but not exact score
        elif (bet.team1_score > bet.team2_score and db_game.team1_score > db_game.team2_score) or (
            bet.team1_score < bet.team2_score and db_game.team1_score < db_game.team2_score
        ):
            bet.points = 1  # Correct outcome (win/loss)
        else:
            bet.points = 0  # Incorrect prediction
        bet.finished = True  # Mark bet as finished

    db.commit()

    # Batch update users' total points
    for bet in bets:
        db.query(User).filter(User.id == bet.owner_id).update({"total_points": User.total_points + bet.points})

    db_game.finished = True
    db.commit()
    db.refresh(db_game)

    return db_game


@router.get("/games/{game_id}/bets", response_model=list[BetRead])
async def get_game_bets(game_id: int, db: Session = Depends(get_db)):
    bets = db.query(Bet).filter(Bet.game_id == game_id).all()
    return bets
