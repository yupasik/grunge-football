from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class BetBase(BaseModel):
    game_id: int
    predicted_score: str
    points: int


class BetCreate(BetBase):
    pass


class BetRead(BetBase):
    id: int
    owner_id: int

    class Config:
        orm_mode = True


class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserInDB(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    bets: List[BetRead] = []

    class Config:
        orm_mode = True


class User(UserInDB):
    pass


class UserSignIn(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserBase(BaseModel):
    username: str
    email: EmailStr


# Схема для создания игры
class GameCreate(BaseModel):
    title: str
    description: str
    start_time: datetime
    team1: str
    team2: str


class GameRead(GameCreate):
    id: int

    class Config:
        orm_mode = True


class TournamentCreate(BaseModel):
    name: str
    logo: str


class TournamentRead(TournamentCreate):
    id: int

    class Config:
        orm_mode = True
