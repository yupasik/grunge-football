from pydantic import BaseModel


class TournamentBase(BaseModel):
    name: str
    logo: str


class TournamentCreate(TournamentBase):
    pass


class TournamentRead(TournamentBase):
    id: int
    finished: bool
    games: list["GameRead"] = []
    prizes: list["PrizeRead"] = []

    class Config:
        from_attributes = True


from .game import GameRead
from .prize import PrizeRead
