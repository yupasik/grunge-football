from pydantic import BaseModel
from typing import Optional


class PrizeRead(BaseModel):
    id: int
    place: int
    points: int
    user_id: int
    tournament_id: int
    tournament_name: str
    logo: Optional[str] = None

    class Config:
        from_attributes = True
