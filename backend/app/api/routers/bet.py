from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timedelta
from sqlalchemy import exists
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.bet import Bet
from app.schemas.bet import BetCreate, BetRead, BetUpdate
from app.models.tournament import Tournament
from app.models.user import User
from app.models.game import Game
from app.models.team import Team
from app.core.security import get_current_user

router = APIRouter()


@router.post("/bets", response_model=BetRead)
async def create_bet(
    bet: BetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_id = current_user.id
    user_name = current_user.username
    db_game = db.query(Game).filter(Game.id == bet.game_id).first()
    if not db_game:
        raise HTTPException(status_code=404, detail="Game not found")
    if db_game.start_time - timedelta(hours=3) <= datetime.utcnow():
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
        hidden=bet.hidden,
        points=0,
    )
    db.add(new_bet)
    db.commit()
    db.refresh(new_bet)

    # Fetch team emblems from the Team model
    team1 = db.query(Team).filter(Team.data_id == db_game.team1_id).first()
    team2 = db.query(Team).filter(Team.data_id == db_game.team2_id).first()

    bet_response = BetRead.model_validate(new_bet)
    bet_response.start_time = db_game.start_time
    bet_response.team1 = db_game.team1
    bet_response.team2 = db_game.team2
    bet_response.team1_emblem = team1.emblem
    bet_response.team2_emblem = team2.emblem
    bet_response.tournament_name = db_game.tournament.name
    bet_response.tournament_logo = db_game.tournament.logo
    bet_response.title = db_game.title

    return bet_response


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
    if db_game.start_time - timedelta(hours=3) <= datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="Cannot place or change bet after the game has started",
        )

    # Update the bet
    db_bet.team1_score = bet.team1_score
    db_bet.team2_score = bet.team2_score
    db_bet.hidden = bet.hidden
    db.commit()
    db.refresh(db_bet)

    # Fetch team emblems from the Team model
    team1 = db.query(Team).filter(Team.data_id == db_game.team1_id).first()
    team2 = db.query(Team).filter(Team.data_id == db_game.team2_id).first()

    # Fetch additional details for response
    bet_response = BetRead.model_validate(db_bet)
    bet_response.start_time = db_game.start_time
    bet_response.team1 = db_game.team1
    bet_response.team2 = db_game.team2
    bet_response.team1_emblem = team1.emblem
    bet_response.team2_emblem = team2.emblem
    bet_response.tournament_name = db_game.tournament.name
    bet_response.tournament_logo = db_game.tournament.logo
    bet_response.title = db_game.title

    return bet_response


@router.get("/bets", response_model=list[BetRead])
async def get_bets(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    game_id: Optional[int] = Query(None, description="Filter by game ID"),
    tournament_id: Optional[int] = Query(None, description="Filter by tournament ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Explicitly define join conditions
    query = db.query(Bet) \
        .join(Game, Bet.game_id == Game.id) \
        .join(Tournament, Game.tournament_id == Tournament.id) \
        .join(Team, Game.team1_id == Team.data_id, isouter=True) \
        .join(Team, Game.team2_id == Team.data_id, isouter=True)

    if user_id:
        query = query.filter(Bet.owner_id == user_id)

    if game_id:
        query = query.filter(Bet.game_id == game_id)

    if tournament_id:
        query = query.filter(Game.tournament_id == tournament_id)

    # Select the necessary fields to avoid fetching too much data
    bets = query.with_entities(
        Bet,
        Game.team1.label("team1"),
        Game.team1.label("team1"),
        Game.team2.label("team2"),
        Game.title.label("title"),
        Game.team1_score.label("team1_score"),
        Game.team2_score.label("team2_score"),
        Game.start_time.label("start_time"),
        Tournament.name.label("tournament_name"),
        Tournament.logo.label("logo"),
        Tournament.id.label("tournament_id"),
        Team.emblem.label("team1_emblem"),
        Team.emblem.label("team2_emblem")
    ).all()

    # Enrich the Bet objects with the additional data
    enriched_bets = []
    for bet, team1, team2, title, team1_score, team2_score, start_time, tournament_name, logo, tournament_id, team1_emblem, team2_emblem in bets:
        bet.team1 = team1
        bet.team2 = team2
        bet.title = title
        bet.actual_team1_score = team1_score
        bet.actual_team2_score = team2_score
        bet.start_time = str(start_time)
        bet.tournament_name = tournament_name
        bet.logo = logo
        bet.tournament_id = tournament_id
        bet.team1_emblem = team1_emblem
        bet.team2_emblem = team2_emblem
        enriched_bets.append(bet)

    return enriched_bets


@router.get("/bets/{bet_id}", response_model=BetRead)
async def get_bet(bet_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
        bet.actual_team1_score = db_game.team1_score
        bet.actual_team2_score = db_game.team2_score
        bet.start_time = str(db_game.start_time)
        bet.tournament_name = tournament.name
        bet.logo = tournament.logo
        bet.tournament_id = tournament.id

    return bet
