from typing import Optional

from pydantic import BaseModel
from datetime import datetime


class GameBase(BaseModel):
    title: Optional[str] = None
    team1: Optional[str] = None
    team2: Optional[str] = None
    team1_emblem: Optional[str] = None
    team2_emblem: Optional[str] = None
    start_time: Optional[datetime] = None
    tournament_id: int
    tournament_name: Optional[str] = ""
    data_id: Optional[int] = None


class GameCreate(GameBase): ...


class GameUpdate(BaseModel):
    team1_score: int
    team2_score: int


class GameFinish(BaseModel):
    id: int


class GameRead(GameBase):
    id: int
    data_id: Optional[int] = None
    tournament_id: int
    tournament_name: Optional[str] = ""
    tournament_logo: Optional[str] = None
    title: Optional[str] = None
    start_time: datetime
    team1: str
    team2: str
    team1_id: Optional[int] = None
    team2_id: Optional[int] = None
    team1_emblem: Optional[str] = None
    team2_emblem: Optional[str] = None
    finished: bool
    team1_score: int
    team2_score: int
    bets: list["BetRead"] = []

    class Config:
        from_attributes = True
        orm_mode = True



from .bet import (
    BetRead,
)
