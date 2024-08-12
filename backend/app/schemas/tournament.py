from pydantic import BaseModel
from typing import List


class TournamentBase(BaseModel):
    name: str
    logo: str


class TournamentCreate(TournamentBase):
    pass


class TournamentRead(TournamentBase):
    id: int
    finished: bool
    games: List["GameRead"] = []
    prizes: List["PrizeRead"] = []

    class Config:
        from_attributes = True


from .game import GameRead
from .prize import PrizeRead
