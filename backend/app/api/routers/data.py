from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.football_data.api import FootballDataAPI, get_football_data_api

router = APIRouter()


@router.get("/competitions")
async def get_competitions(api: FootballDataAPI = Depends(get_football_data_api)):
    return await api.get_competitions()


@router.get("/competitions/{competition_id}")
async def get_competition(competition_id: int, api: FootballDataAPI = Depends(get_football_data_api)):
    return await api.get_competition(competition_id)


@router.get("/competitions/{competition_id}/teams")
async def get_teams(competition_id: int, api: FootballDataAPI = Depends(get_football_data_api)):
    return await api.get_teams(competition_id)


@router.get("/competitions/{competition_id}/games")
async def get_games(competition_id: int, api: FootballDataAPI = Depends(get_football_data_api)):
    return await api.get_matches(competition_id)


@router.get("/competitions/{competition_id}/standings")
async def get_standings(competition_id: int, api: FootballDataAPI = Depends(get_football_data_api)):
    return await api.get_standings(competition_id)


@router.get("/competitions/{competition_id}/scores")
async def get_standings(competition_id: int, api: FootballDataAPI = Depends(get_football_data_api)):
    return await api.get_scorers(competition_id)


@router.get("/teams/{team_id}")
async def get_team_info(team_id: int, api: FootballDataAPI = Depends(get_football_data_api)):
    return await api.get_team_info(team_id)


@router.get("/matches/{match_id}")
async def get_match_info(match_id: int, api: FootballDataAPI = Depends(get_football_data_api)):
    return await api.get_match(match_id)
