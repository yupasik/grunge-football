from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import desc, func
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..models.tournament import Tournament
from ..schemas.tournament import TournamentCreate, TournamentRead
from ..schemas.user import UserPoints
from ..models.user import User
from ..models.game import Game
from ..models.bet import Bet
from ..models.prize import Prize
from ..core.security import get_current_user

router = APIRouter()


@router.post("/tournaments", response_model=TournamentRead)
async def create_tournament(
    tournament: TournamentCreate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
):
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Not enough permissions")

    existing_tournament = (
        db.query(Tournament).filter(Tournament.name == tournament.name).first()
    )
    if existing_tournament:
        raise HTTPException(
            status_code=400, detail="Tournament with this name already exists"
        )

    new_tournament = Tournament(
        name=tournament.name, logo=tournament.logo, finished=False
    )
    db.add(new_tournament)
    db.commit()
    db.refresh(new_tournament)
    return new_tournament


@router.get("/tournaments", response_model=list[TournamentRead])
async def get_tournaments(db: Session = Depends(get_db)):
    print("Fetching tournaments")
    tournaments = db.query(Tournament).all()
    print(f"Fetched {len(tournaments)} tournaments")
    return tournaments


@router.get("/tournaments/{tournament_id}", response_model=TournamentRead)
async def get_tournament(tournament_id: int, db: Session = Depends(get_db)):
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return tournament


@router.put("/tournaments/{tournament_id}", response_model=TournamentRead)
async def update_tournament(
    tournament_id: int,
    tournament: TournamentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    if db_tournament.name != tournament.name:
        existing_tournament = (
            db.query(Tournament).filter(Tournament.name == tournament.name).first()
        )
        if existing_tournament:
            raise HTTPException(
                status_code=400, detail="Tournament with this name already exists"
            )

    db_tournament.name = tournament.name
    db_tournament.logo = tournament.logo
    db.commit()
    db.refresh(db_tournament)
    return db_tournament


@router.post("/tournaments/{tournament_id}/finish", response_model=TournamentRead)
async def finish_tournament(
    tournament_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Ensure all games in the tournament are finished
    unfinished_games = (
        db.query(Game)
        .filter(Game.tournament_id == tournament_id, Game.finished == False)
        .all()
    )
    if unfinished_games:
        raise HTTPException(
            status_code=400,
            detail="Cannot finish the tournament until all games are finished",
        )

    # Query top 3 users with highest points
    users_points = (
        db.query(User.id, User.username, User.total_points)
        .join(Bet, Bet.owner_id == User.id)
        .join(Game, Game.id == Bet.game_id)
        .filter(Game.tournament_id == tournament_id)
        .group_by(User.id)
        .order_by(desc(User.total_points))
        .limit(3)
        .all()
    )

    for place, user_data in enumerate(users_points, start=1):
        prize = Prize(
            place=place,
            points=user_data.total_points,
            tournament_id=tournament_id,
            user_id=user_data.id,
        )
        db.add(prize)

    db_tournament.finished = True
    db.commit()
    db.refresh(db_tournament)
    return db_tournament


@router.delete("/tournaments/{tournament_id}", response_model=TournamentRead)
async def delete_tournament(
    tournament_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    db.delete(db_tournament)
    db.commit()
    return db_tournament


@router.get("/tournaments/{tournament_id}/leaderboard", response_model=list[UserPoints])
async def get_leaderboard(tournament_id: int, db: Session = Depends(get_db)):
    leaderboard = (
        db.query(User.username, func.sum(Bet.points).label("total_points"))
        .join(Bet, Bet.owner_id == User.id)
        .join(Game, Game.id == Bet.game_id)
        .filter(Game.tournament_id == tournament_id)
        .group_by(User.username)
        .order_by(desc("total_points"))
        .all()
    )
    return leaderboard
