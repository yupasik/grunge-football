from pydantic import BaseModel


class BetBase(BaseModel):
    game_id: int
    team1_score: int
    team2_score: int


class BetCreate(BetBase):
    pass


class BetRead(BetBase):
    id: int
    owner_id: int
    points: int

    class Config:
        from_attributes = True
