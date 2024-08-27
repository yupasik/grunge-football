from fastapi import APIRouter, Depends, BackgroundTasks
from app.football_data.api import FootballDataAPI, get_football_data_api

router = APIRouter()


@router.get("/competitions")
async def get_competitions(api: FootballDataAPI = Depends(get_football_data_api)):
    return await api.get_competitions()


@router.get("/competitions/{competition_symbol}")
async def get_competition(competition_symbol: str, api: FootballDataAPI = Depends(get_football_data_api)):
    return await api.get_competition(competition_symbol)


@router.get("/competitions/{competition_id}/teams")
async def get_teams(competition_id: int, api: FootballDataAPI = Depends(get_football_data_api)):
    return await api.get_teams(competition_id)


@router.get("/competitions/{competition_id}/games")
async def get_teams(competition_id: int, api: FootballDataAPI = Depends(get_football_data_api)):
    return await api.get_matches(competition_id)


@router.get("/teams/{team_id}")
async def get_team_info(team_id: int, api: FootballDataAPI = Depends(get_football_data_api)):
    return await api.get_team_info(team_id)
