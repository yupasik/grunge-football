from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..models.user import User
from ..models.bet import Bet
from ..schemas.user import UserCreate, UserInDB, UserSignIn, Token
from ..schemas.bet import BetRead
from ..core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_user,
)

router = APIRouter()


@router.get("/users", response_model=list[UserInDB])
async def get_all_users(
        db: Session = Depends(get_db),
        # current_user: User = Depends(get_current_user),
):
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Not enough permissions")

    users = db.query(User).all()
    return users


@router.post("/signup", response_model=UserInDB)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = hash_password(user.password)
    new_user = User(username=user.username, email=user.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/admin/signup", response_model=UserInDB)
def signup_admin(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = hash_password(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pw,
        is_admin=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/signin", response_model=Token)
async def signin(user: UserSignIn, db: Session = Depends(get_db)):
    db_user = get_user(user.username, db)
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/users/me", response_model=UserInDB)
def read_user_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/users/me/bets", response_model=list[BetRead])
async def get_user_bets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    bets = db.query(Bet).filter(Bet.owner_id == current_user.id).all()
    return bets
