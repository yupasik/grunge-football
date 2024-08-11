from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class GameBase(BaseModel):
    title: str
    start_time: datetime
    team1: str
    team2: str
    tournament_id: int


class GameCreate(GameBase):
    ...


class GameUpdate(BaseModel):
    team1_score: int
    team2_score: int


class GameRead(GameBase):
    id: int
    finished: bool
    team1_score: int
    team2_score: int
    bets: List["BetRead"] = []

    class Config:
        from_attributes = True


from .bet import (
    BetRead,
)
