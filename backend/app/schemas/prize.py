from pydantic import BaseModel


class PrizeRead(BaseModel):
    id: int
    place: int
    points: int
    user_id: int
    tournament_id: int
    tournament_name: str

    class Config:
        from_attributes = True
