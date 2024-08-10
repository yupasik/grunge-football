from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..models.game import Game
from ..schemas.game import GameCreate, GameRead
from ..models.bet import Bet
from ..schemas.bet import BetCreate, BetRead
from ..models.user import User
from ..models.tournament import Tournament
from ..core.security import get_current_user

router = APIRouter()


@router.post("/games", response_model=GameRead)
async def create_game(
    game: GameCreate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
):
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Not enough permissions")

    tournament = (
        db.query(Tournament)
        .filter(Tournament.id == game.tournament_id, Tournament.finished == False)
        .first()
    )
    if not tournament:
        raise HTTPException(
            status_code=400, detail="Tournament must be open to add games"
        )

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


@router.get("/{game_id}", response_model=GameRead)
async def get_game(game_id: int, db: Session = Depends(get_db)):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.put("/{game_id}", response_model=GameRead)
async def update_game(
    game_id: int,
    game: GameCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_game = db.query(Game).filter(Game.id == game_id).first()
    if not db_game:
        raise HTTPException(status_code=404, detail="Game not found")
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    db_game.title = game.title
    db_game.start_time = game.start_time
    db_game.team1 = game.team1
    db_game.team2 = game.team2
    db.commit()
    db.refresh(db_game)
    return db_game


@router.delete("/games/{game_id}", response_model=GameRead)
async def delete_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_game = db.query(Game).filter(Game.id == game_id).first()
    if not db_game:
        raise HTTPException(status_code=404, detail="Game not found")
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    db.delete(db_game)
    db.commit()
    return db_game


@router.post("/games/{game_id}/finish", response_model=GameRead)
async def finish_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_game = db.query(Game).filter(Game.id == game_id).first()
    if not db_game:
        raise HTTPException(status_code=404, detail="Game not found")
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    bets = db.query(Bet).filter(Bet.game_id == game_id).all()
    for bet in bets:
        if bet.predicted_score == db_game.score:
            bet.points = 3
        else:
            bet.points = 0
        db.commit()

    db_game.finished = True
    db.commit()
    db.refresh(db_game)
    return db_game


@router.get("/games/{game_id}/bets", response_model=list[BetRead])
async def get_game_bets(game_id: int, db: Session = Depends(get_db)):
    bets = db.query(Bet).filter(Bet.game_id == game_id).all()
    return bets
