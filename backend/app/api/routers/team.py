from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.schemas.team import TeamCreate, TeamUpdate, TeamRead, Area
from app.api.crud.team import create_team, get_team, get_teams, update_team, delete_team
from app.football_data.api import FootballDataAPI, get_football_data_api
from app.core.security import get_current_user


router = APIRouter()


@router.post("/teams", response_model=TeamRead)
async def create_new_team(
    team: TeamCreate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
    football_api: FootballDataAPI = Depends(get_football_data_api),
):
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Not enough permissions")
    if team.data_id:
        # Fetch team details from football-data.org API
        team_data = await football_api.get_team_info(team_id=team.data_id)
        if not team_data:
            raise HTTPException(status_code=404, detail="Team not found in external API")

        # Create team using data from the API
        team = TeamCreate(
            data_id=team.data_id,
            name=team_data["name"].rstrip(" FC"),
            emblem=team_data["crest"],
            area=Area(
                id=team_data["area"]["id"],
                name=team_data["area"]["name"],
                code=team_data["area"]["code"],
                flag=team_data["area"]["flag"],
            ),
        )

    else:
        if team.name is None or team.emblem is None:
            raise HTTPException(status_code=400, detail="Team should have name and emblem")

    return create_team(db, team)


@router.get("/teams/{team_id}", response_model=TeamRead)
async def read_team(
    team_id: int,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
):
    db_team = get_team(db, team_id)

    if not db_team:
        raise HTTPException(status_code=404, detail="Team not found")

    tournament_list = [t.name for t in db_team.tournaments if not t.finished]

    team_response = TeamRead(
        id=db_team.id,
        name=db_team.name,
        emblem=db_team.emblem,
        area=Area(
            id=db_team.area.id,
            name=db_team.area.name,
            code=db_team.area.code,
            flag=db_team.area.flag,
        ) if db_team.area else None,
        tournaments=tournament_list
    )

    return team_response


@router.get("/teams", response_model=list[TeamRead])
async def read_teams(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
):
    db_teams = get_teams(db, skip=skip, limit=limit)

    teams_response = []
    for db_team in db_teams:
        tournament_list = [t.name for t in db_team.tournaments if not t.finished]

        team_response = TeamRead(
            id=db_team.id,
            data_id=db_team.data_id,
            name=db_team.name,
            emblem=db_team.emblem,
            area=Area(
                id=db_team.area.id,
                name=db_team.area.name,
                code=db_team.area.code,
                flag=db_team.area.flag,
            ) if db_team.area else None,
            tournaments=tournament_list
        )

        teams_response.append(team_response)

    return teams_response


@router.put("/teams/{team_id}", response_model=TeamRead)
async def update_existing_team(
    team_id: int,
    team: TeamUpdate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
    football_api: FootballDataAPI = Depends(get_football_data_api),
):
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Not enough permissions")

    if team.data_id:
        # Fetch team details from football-data.org API
        team_data = await football_api.get_team_info(team_id=team.data_id)
        if not team_data:
            raise HTTPException(status_code=404, detail="Team not found in external API")

        # Create team using data from the API
        team = TeamUpdate(
            id=team_id,
            data_id=team.data_id,
            name=team_data["name"].rstrip(" FC"),
            emblem=team_data["crest"],
            area=Area(
                id=team_data["area"]["id"],
                name=team_data["area"]["name"],
                code=team_data["area"]["code"],
                flag=team_data["area"]["flag"],
            ),
        )

    else:
        if team.name is None or team.emblem is None:
            raise HTTPException(status_code=400, detail="Team should have name and emblem")

    db_team = update_team(db, team_id, team)
    if not db_team:
        raise HTTPException(status_code=404, detail="Team not found")
    return db_team


@router.delete("/teams/{team_id}", response_model=TeamRead)
async def delete_existing_team(
    team_id: int,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
):
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Not enough permissions")
    db_team = delete_team(db, team_id)
    if not db_team:
        raise HTTPException(status_code=404, detail="Team not found")
    return db_team
