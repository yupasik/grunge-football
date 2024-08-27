from typing import Optional, Dict

from pydantic import BaseModel, HttpUrl


class Area(BaseModel):
    id: int
    name: str
    code: str
    flag: HttpUrl


class TeamBase(BaseModel):
    name: Optional[str] = None
    emblem: Optional[str] = None
    data_id: Optional[int] = None
    area: Optional[Area] = None


class TeamCreate(TeamBase):
    pass


class TeamUpdate(TeamCreate):
    pass


class TeamRead(TeamCreate):
    id: int

    class Config:
        from_attributes = True
