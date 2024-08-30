from datetime import datetime

from pydantic import BaseModel
from typing import Optional


class BetBase(BaseModel):
    game_id: int
    team1_score: int
    team2_score: int
    hidden: Optional[bool] = False


class BetUpdate(BaseModel):
    team1_score: int
    team2_score: int
    hidden: Optional[bool] = False


class BetCreate(BetBase):
    pass


class BetRead(BetBase):
    id: int
    game_id: int
    team1_score: int
    team2_score: int
    hidden: bool
    finished: bool
    owner_id: int
    owner_name: str
    points: int
    team1: Optional[str] = ""
    team2: Optional[str] = ""
    tournament_name: Optional[str] = ""
    tournament_id: Optional[int] = None
    start_time: Optional[datetime] = None
    logo: Optional[str] = ""
    actual_team1_score: Optional[int] = None
    actual_team2_score: Optional[int] = None

    class Config:
        from_attributes = True
        orm_mode = True
