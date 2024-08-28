from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from sqlalchemy import desc, func
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.db.database import get_db
from app.models.tournament import Tournament
from app.schemas.tournament import TournamentCreate, TournamentRead
from app.schemas.user import UserPoints
from app.models.user import User
from app.models.game import Game
from app.models.bet import Bet
from app.models.prize import Prize
from app.models.team import Team
from app.models.area import Area
from app.core.security import get_current_user
from app.football_data.api import FootballDataAPI, get_football_data_api

router = APIRouter()
security = HTTPBearer(scheme_name="Bearer", description="Enter your JWT token", auto_error=False)


@router.post("/tournaments", response_model=TournamentRead)
async def create_tournament(
    tournament: TournamentCreate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
    football_api: FootballDataAPI = Depends(get_football_data_api),
):
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Not enough permissions")

    existing_tournament = db.query(Tournament).filter(Tournament.name == tournament.name).first()
    if existing_tournament:
        raise HTTPException(status_code=400, detail="Tournament with this name already exists")

    if tournament.data_id is not None:
        # Fetch team details from football-data.org API
        tournament_data = await football_api.get_competition(competition_id=tournament.data_id)
        if tournament_data:

            start_year = tournament_data.get("currentSeason", {}).get("startDate", "").split("-")[0]
            end_year = tournament_data.get("currentSeason", {}).get("endDate", "").split("-")[0]
            season_id = tournament_data.get("currentSeason", {}).get("id")

            if not start_year and not end_year:
                name = tournament.name
            else:
                if start_year == end_year:
                    name = f"{tournament_data['name']} [{start_year}]"
                else:
                    name = f"{tournament_data['name']} [{start_year}/{end_year}]"

            # Create team using data from the API
            tournament = TournamentCreate(
                data_id=tournament.data_id,
                season_id=season_id,
                name=name,
                logo=tournament_data["emblem"],
            )
        else:
            if tournament.name is None or tournament.logo is None:
                raise HTTPException(status_code=400, detail="Tournament should have name and emblem")
    else:
        if tournament.name is None or tournament.logo is None:
            raise HTTPException(status_code=400, detail="Tournament should have name and emblem")

    new_tournament = Tournament(name=tournament.name, logo=tournament.logo, data_id=tournament.data_id, season_id=tournament.season_id, finished=False)
    try:
        db.add(new_tournament)
        db.commit()
        db.refresh(new_tournament)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="An error occurred while creating the tournament")

    # Fetch teams associated with the tournament from the external API
    teams_data = await football_api.get_teams(competition_id=new_tournament.data_id)
    if teams_data:
        for team_data in teams_data.get("teams", []):
            # Check if the area for the team exists in the database
            area = db.query(Area).filter(Area.id == team_data["area"]["id"]).first()

            if not area:
                # If the area doesn't exist, create a new entry
                area = Area(
                    id=team_data["area"]["id"],
                    name=team_data["area"]["name"],
                    code=team_data["area"]["code"],
                    flag=team_data["area"]["flag"],
                )
                db.add(area)
                db.commit()  # Commit the new area to the database

            # Check if the team already exists in the database
            existing_team = db.query(Team).filter(Team.data_id == team_data["id"]).first()

            if existing_team:
                # If the team already exists, update the details
                existing_team.name = team_data["name"].rstrip(" FC")
                existing_team.emblem = team_data["crest"]
                existing_team.area_id = area.id
                db.add(existing_team)
                new_tournament.teams.append(existing_team)
            else:
                # If the team does not exist, create a new entry
                new_team = Team(
                    data_id=team_data["id"],
                    name=team_data["name"].rstrip(" FC"),
                    emblem=team_data["crest"],
                    area_id=area.id,
                )
                db.add(new_team)

                # Associate the team with the tournament
                new_tournament.teams.append(new_team)

        db.commit()  # Commit the changes to the database

    return new_tournament


@router.get("/tournaments", response_model=list[TournamentRead])
async def get_tournaments(
    finished: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Tournament)

    if finished is not None:
        query = query.filter(Tournament.finished == finished)

    tournaments = query.all()
    return tournaments


@router.get("/tournaments/{tournament_id}", response_model=TournamentRead)
async def get_tournament(
    tournament_id: int,
    db: Session = Depends(get_db),
):
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return tournament


@router.put("/tournaments/{tournament_id}", response_model=TournamentRead)
async def update_tournament(
    tournament_id: int,
    tournament: TournamentCreate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
    football_api: FootballDataAPI = Depends(get_football_data_api),
):
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Not enough permissions")

    db_tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    if db_tournament.name != tournament.name:
        existing_tournament = db.query(Tournament).filter(Tournament.name == tournament.name).first()
        if existing_tournament:
            raise HTTPException(status_code=400, detail="Tournament with this name already exists")

    if tournament.data_id is not None:
        # Fetch tournament details from football-data.org API
        tournament_data = await football_api.get_competition(competition_id=tournament.data_id)
        if tournament_data:

            start_year = tournament_data.get("currentSeason", {}).get("startDate", "").split("-")[0]
            end_year = tournament_data.get("currentSeason", {}).get("endDate", "").split("-")[0]
            season_id = tournament_data.get("currentSeason", {}).get("id")

            if not start_year and not end_year:
                name = tournament.name
            else:
                if start_year == end_year:
                    name = f"{tournament_data['name']} [{start_year}]"
                else:
                    name = f"{tournament_data['name']} [{start_year}/{end_year}]"

            tournament = TournamentCreate(
                data_id=tournament.data_id,
                season_id=season_id,
                name=name,
                logo=tournament_data.get("emblem"),
            )
        else:
            if tournament.name is None or tournament.logo is None:
                raise HTTPException(status_code=400, detail="Tournament should have name and emblem")

    else:
        if tournament.name is None or tournament.logo is None:
            raise HTTPException(status_code=400, detail="Tournament should have name and emblem")

    try:
        db_tournament.name = tournament.name
        db_tournament.logo = tournament.logo
        db_tournament.data_id = tournament.data_id
        db.commit()
        db.refresh(db_tournament)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="An error occurred while updating the tournament")

    # Fetch teams associated with the tournament from the external API
    teams_data = await football_api.get_teams(competition_id=db_tournament.data_id)
    if teams_data:
        for team_data in teams_data.get("teams", []):
            # Check if the area for the team exists in the database
            area = db.query(Area).filter(Area.id == team_data["area"]["id"]).first()

            if not area:
                # If the area doesn't exist, create a new entry
                area = Area(
                    id=team_data["area"]["id"],
                    name=team_data["area"]["name"],
                    code=team_data["area"]["code"],
                    flag=team_data["area"]["flag"],
                )
                db.add(area)
                db.commit()  # Commit the new area to the database

            # Check if the team already exists in the database
            existing_team = db.query(Team).filter(Team.data_id == team_data["id"]).first()

            if existing_team:
                # If the team already exists, update the details
                existing_team.name = team_data["name"].rstrip(" FC")
                existing_team.emblem = team_data["crest"]
                existing_team.area_id = area.id
                db_tournament.teams.append(existing_team)
            else:
                # If the team does not exist, create a new entry
                new_team = Team(
                    data_id=team_data["id"],
                    name=team_data["name"].rstrip(" FC"),
                    emblem=team_data["crest"],
                    area_id=area.id,  # Link the team to the area
                )
                db.add(new_team)
                # Associate the team with the tournament
                db_tournament.teams.append(new_team)

        db.commit()  # Commit the changes to the database

    return db_tournament


@router.post("/tournaments/{tournament_id}/finish", response_model=TournamentRead)
async def finish_tournament(
    tournament_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db_tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    if db_tournament.finished:
        raise HTTPException(status_code=400, detail="Tournament is already finished")

    unfinished_games = db.query(Game).filter(Game.tournament_id == tournament_id, Game.finished == False).all()
    if unfinished_games:
        raise HTTPException(status_code=400, detail="Cannot finish the tournament until all games are finished")

    # Remove the tournament from teams' list of tournaments
    for team in db_tournament.teams:
        team.tournaments.remove(db_tournament)

    user_points = {}

    for game in db_tournament.games:
        bets = db.query(Bet).filter(Bet.game_id == game.id).all()
        for bet in bets:
            user = bet.owner_id
            if user not in user_points:
                user_points[user] = {
                    "total_points": 0,
                    "exact_score_count": 0,
                    "goal_difference_count": 0,
                    "correct_outcome_count": 0,
                }

            user_points[user]["total_points"] += bet.points

            if bet.points == 5:
                user_points[user]["exact_score_count"] += 1
            elif bet.points == 3:
                user_points[user]["goal_difference_count"] += 1
            elif bet.points == 1:
                user_points[user]["correct_outcome_count"] += 1

    # Rank users based on points and additional criteria
    ranked_users = sorted(
        user_points.items(),
        key=lambda x: (
            x[1]["total_points"],
            x[1]["exact_score_count"],
            x[1]["goal_difference_count"],
            x[1]["correct_outcome_count"],
        ),
        reverse=True,
    )

    # Here, you can decide to create a record for the top 3 users as "prizes" in your Prize model
    for rank, (user_id, points_data) in enumerate(ranked_users, start=1):
        prize = Prize(
            user_id=user_id,
            tournament_id=tournament_id,
            place=rank,
            points=points_data["total_points"],
            tournament_name=db_tournament.name,
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
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db_tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    try:
        db.delete(db_tournament)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="An error occurred while deleting the tournament")
    return db_tournament


@router.get("/tournaments/{tournament_id}/leaderboard", response_model=list[UserPoints])
async def get_leaderboard(
    tournament_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
