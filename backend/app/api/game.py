from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from ..db.database import get_db
from ..models.game import Game
from ..schemas.game import GameCreate, GameRead, GameUpdate
from ..models.bet import Bet
from ..schemas.bet import BetRead
from ..models.user import User
from ..models.tournament import Tournament
from ..core.security import get_current_user
from . import MSK, ZERO

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
async def get_games(db: Session = Depends(get_db)):
    games = db.query(Game).all()
    return games


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

    try:
        with db.begin():
            db.query(Bet).filter(Bet.game_id == game_id).delete()
            db.delete(db_game)
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="An error occurred while deleting the game")

    return db_game


@router.post("/games/{game_id}/finish", response_model=GameRead)
async def finish_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db_game = db.query(Game).filter(Game.id == game_id).first()
    if not db_game:
        raise HTTPException(status_code=404, detail="Game not found")
    if db_game.finished:
        raise HTTPException(status_code=400, detail="Game is already finished")

    if datetime.fromtimestamp(db_game.start_time.timestamp(), tz=ZERO) > datetime.now(tz=MSK):
        raise HTTPException(status_code=400, detail="Cannot finish not started game")

    try:
        with db.begin():
            bets = db.query(Bet).filter(Bet.game_id == game_id).all()
            for bet in bets:
                if bet.team1_score == db_game.team1_score and bet.team2_score == db_game.team2_score:
                    bet.points = 5
                elif bet.team1_score - bet.team2_score == db_game.team1_score - db_game.team2_score:
                    bet.points = 3
                elif (bet.team1_score > bet.team2_score and db_game.team1_score > db_game.team2_score) or (
                    bet.team1_score < bet.team2_score and db_game.team1_score < db_game.team2_score
                ):
                    bet.points = 1
                else:
                    bet.points = 0
                bet.finished = True
                db.query(User).filter(User.id == bet.owner_id).update({"total_points": User.total_points + bet.points})

            db_game.finished = True
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="An error occurred while finishing the game")

    db.refresh(db_game)
    return db_game


@router.get("/games/{game_id}/bets", response_model=list[BetRead])
async def get_game_bets(game_id: int, db: Session = Depends(get_db)):
    bets = db.query(Bet).filter(Bet.game_id == game_id).all()
    return bets
