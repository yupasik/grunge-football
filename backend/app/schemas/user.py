from pydantic import BaseModel, EmailStr
from typing import Optional


class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserInDB(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    is_superadmin: Optional[bool] = False
    total_points: int
    bets: list["BetRead"] = []
    prizes: list["PrizeRead"] = []

    class Config:
        from_attributes = True


class User(UserInDB):
    pass


class UserSignIn(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserPoints(BaseModel):
    username: str
    total_points: int

    class Config:
        from_attributes = True


from .bet import BetRead
from .prize import PrizeRead
