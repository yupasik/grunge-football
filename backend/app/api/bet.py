from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime
from sqlalchemy import exists
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from ..db.database import get_db
from ..models.bet import Bet
from ..schemas.bet import BetCreate, BetRead, BetUpdate
from ..models.tournament import Tournament
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
    try:
        user_id = current_user.id
        user_name = current_user.username
        with db.begin():
            db_game = db.query(Game).filter(Game.id == bet.game_id).first()
            if not db_game:
                raise HTTPException(status_code=404, detail="Game not found")
            if datetime.fromtimestamp(db_game.start_time.timestamp(), tz=ZERO) <= datetime.now(tz=MSK):
                raise HTTPException(
                    status_code=400,
                    detail="Cannot place or change bet after the game has started",
                )

            # Check if the user has already placed a bet on this game
            if db.query(exists().where(Bet.game_id == bet.game_id).where(Bet.owner_id == user_id)).scalar():
                raise HTTPException(
                    status_code=400,
                    detail="You have already placed a bet on this game",
                )

            new_bet = Bet(
                game_id=bet.game_id,
                owner_id=user_id,
                owner_name=user_name,
                team1_score=bet.team1_score,
                team2_score=bet.team2_score,
                points=0,
            )
            db.add(new_bet)
            db.flush()  # This will assign an ID to new_bet if it's using auto-increment

        db.refresh(new_bet)
        return new_bet

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="An error occurred while creating the bet")


@router.put("/bets/{bet_id}", response_model=BetRead)
async def update_bet(
    bet_id: int,
    bet: BetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_bet = (
        db.query(Bet)
        .filter(
            Bet.id == bet_id,
            Bet.owner_id == current_user.id,
        )
        .first()
    )
    if not db_bet:
        raise HTTPException(status_code=404, detail="Bet not found")

    db_game = db.query(Game).filter(Game.id == db_bet.game_id).first()
    if datetime.fromtimestamp(db_game.start_time.timestamp(), tz=ZERO) <= datetime.now(
            tz=MSK
    ):
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
    # Explicitly define join conditions
    query = db.query(Bet).join(Game, Bet.game_id == Game.id).join(Tournament, Game.tournament_id == Tournament.id)

    if user_id:
        query = query.filter(Bet.owner_id == user_id)

    if game_id:
        query = query.filter(Bet.game_id == game_id)

    if tournament_id:
        query = query.filter(Game.tournament_id == tournament_id)

    # Select the necessary fields to avoid fetching too much data
    bets = query.with_entities(
        Bet,
        Game.team1.label('team1'),
        Game.team2.label('team2'),
        Game.start_time.label('start_time'),
        Tournament.name.label('tournament_name')
    ).all()

    # Enrich the Bet objects with the additional data
    enriched_bets = []
    for bet, team1, team2, start_time, tournament_name in bets:
        bet.team1 = team1
        bet.team2 = team2
        bet.start_time = str(start_time)
        bet.tournament_name = tournament_name
        enriched_bets.append(bet)

    return enriched_bets



@router.get("/bets/{bet_id}", response_model=BetRead)
async def get_bet(bet_id: int, db: Session = Depends(get_db)):
    bet = db.query(Bet).filter(Bet.id == bet_id).first()
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")
    db_game = db.query(Game).filter(Game.id == bet.game_id).first()
    if db_game:
        # Fetch tournament details
        tournament = db.query(Tournament).filter(Tournament.id == db_game.tournament_id).first()
        # Enrich the bet with these details
        bet.tournament_name = tournament.name if tournament else None
        bet.team1 = db_game.team1
        bet.team2 = db_game.team2
        bet.start_time = str(db_game.start_time)
    return bet
