from typing import Optional

from pydantic import BaseModel
from datetime import datetime


class GameBase(BaseModel):
    title: str
    start_time: datetime
    team1: str
    team2: str
    tournament_id: int
    tournament_name: Optional[str] = ""


class GameCreate(GameBase): ...


class GameUpdate(BaseModel):
    team1_score: int
    team2_score: int


class GameFinish(BaseModel):
    id = int


class GameRead(GameBase):
    id: int
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
