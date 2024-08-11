from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime
from sqlalchemy import exists
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..models.bet import Bet
from ..schemas.bet import BetCreate, BetRead
from ..models.user import User
from ..models.game import Game
from ..core.security import get_current_user
from . import MSK, ZERO

router = APIRouter()


@router.post("/bets", response_model=BetRead)
async def create_bet(
    bet: BetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_game = db.query(Game).filter(Game.id == bet.game_id).first()
    if not db_game:
        raise HTTPException(status_code=404, detail="Game not found")
    if datetime.fromtimestamp(db_game.start_time.timestamp(), tz=ZERO) <= datetime.now(tz=MSK):
        raise HTTPException(
            status_code=400,
            detail="Cannot place or change bet after the game has started",
        )

    # Check if the user has already placed a bet on this game
    if db.query(exists().where(Bet.game_id == bet.game_id).where(Bet.owner_id == current_user.id)).scalar():
        raise HTTPException(
            status_code=400,
            detail="You have already placed a bet on this game",
        )

    new_bet = Bet(
        game_id=bet.game_id,
        owner_id=current_user.id,
        team1_score=bet.team1_score,
        team2_score=bet.team2_score,
        points=0,
    )
    db.add(new_bet)
    db.commit()
    db.refresh(new_bet)
    return new_bet


@router.put("/bets/{bet_id}", response_model=BetRead)
async def update_bet(
    bet_id: int,
    bet: BetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_bet = (
        db.query(Bet).filter(
            Bet.id == bet_id,
            Bet.owner_id == current_user.id,
        ).first()
    )
    if not db_bet:
        raise HTTPException(status_code=404, detail="Bet not found")

    db_game = db.query(Game).filter(Game.id == db_bet.game_id).first()
    if datetime.fromtimestamp(db_game.start_time.timestamp(), tz=ZERO) <= datetime.now(tz=MSK):
        raise HTTPException(
            status_code=400,
            detail="Cannot place or change bet after the game has started",
        )

    db_bet.team1_score = bet.team1_score
    db_bet.team2_score = bet.team2_score
    db.commit()
    db.refresh(db_bet)
    return db_bet


# @router.get("/bets", response_model=list[BetRead])
# async def get_bets(db: Session = Depends(get_db)):
#     bets = db.query(Bet).all()
#     return bets


@router.get("/bets", response_model=list[BetRead])
async def get_bets(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    game_id: Optional[int] = Query(None, description="Filter by game ID"),
    tournament_id: Optional[int] = Query(None, description="Filter by tournament ID"),
    db: Session = Depends(get_db),
):
    query = db.query(Bet)

    if user_id:
        query = query.filter(Bet.owner_id == user_id)

    if game_id:
        query = query.filter(Bet.game_id == game_id)

    if tournament_id:
        # Assuming that the Bet model has a relationship to Game, and Game has a relationship to Tournament
        query = query.join(Bet.game).filter(
            Bet.game.has(Game.tournament_id == tournament_id)
        )

    bets = query.all()
    return bets


@router.get("/bets/{bet_id}", response_model=BetRead)
async def get_bet(bet_id: int, db: Session = Depends(get_db)):
    bet = db.query(Bet).filter(Bet.id == bet_id).first()
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")
    return bet
