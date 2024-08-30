from typing import Optional, Dict

from pydantic import BaseModel, HttpUrl


class Area(BaseModel):
    id: int
    name: str
    code: str
    flag: HttpUrl



class AreaRead(Area):

    class Config:
        from_attributes = True


class TeamBase(BaseModel):
    name: Optional[str] = None
    emblem: Optional[str] = None
    data_id: Optional[int] = None
    area: Optional[AreaRead] = None


class TeamCreate(TeamBase):
    pass


class TeamUpdate(TeamCreate):
    id: int
    pass


class TeamReadSimple(TeamCreate):
    id: int

    class Config:
        from_attributes = True


class TeamRead(TeamCreate):
    id: int
    tournaments: list

    class Config:
        from_attributes = True
