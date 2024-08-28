from typing import Optional

from pydantic import BaseModel

from app.schemas.team import TeamRead


class TournamentBase(BaseModel):
    name: Optional[str] = None
    logo: Optional[str] = None
    data_id: Optional[int] = None
    season_id: Optional[int] = None


class TournamentCreate(TournamentBase):
    pass


class TournamentRead(TournamentBase):
    id: int
    finished: bool
    games: list["GameRead"] = []
    prizes: list["PrizeRead"] = []
    teams: list["TeamReadSimple"] = []

    class Config:
        from_attributes = True


from .game import GameRead
from .prize import PrizeRead
from .team import TeamReadSimple
