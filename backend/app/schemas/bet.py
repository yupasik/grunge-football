from pydantic import BaseModel
from typing import Optional


class BetBase(BaseModel):
    game_id: int
    team1_score: int
    team2_score: int


class BetUpdate(BaseModel):
    team1_score: int
    team2_score: int


class BetCreate(BetBase):
    pass


class BetRead(BetBase):
    id: int
    finished: bool
    owner_id: int
    owner_name: str
    points: int
    team1: Optional[str] = ""
    team2: Optional[str] = ""
    tournament_name: Optional[str] = ""
    start_time: Optional[str] = ""

    class Config:
        from_attributes = True
