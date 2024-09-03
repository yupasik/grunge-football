from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.models.bet import Bet
from app.models.game import Game
from app.models.team import Team
from app.models.tournament import Tournament
from app.schemas.user import UserCreate, UserInDB, UserSignIn, Token, UserUpdate
from app.schemas.bet import BetRead
from app.core.security import (
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
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    users = db.query(User).all()
    return users


@router.post("/signup", response_model=UserInDB)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = hash_password(user.password)
    new_user = User(username=user.username, email=user.email, hashed_password=hashed_pw, is_active=False)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/admin/signup", response_model=UserInDB)
def signup_admin(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = hash_password(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pw,
        is_admin=True,
        is_active=True,
        is_superadmin=True,
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
    if not db_user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive")
    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@router.put("/users/{user_id}", response_model=UserInDB)
async def update_user(
    user_id: int, user_update: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_update.is_active is not None:
        db_user.is_active = user_update.is_active

    if user_update.is_admin is not None:
        db_user.is_admin = user_update.is_admin

    db.commit()
    db.refresh(db_user)

    return db_user


@router.get("/users/me", response_model=UserInDB)
def read_user_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tournament_ids = [prize.tournament_id for prize in current_user.prizes]
    tournaments = db.query(Tournament).filter(Tournament.id.in_(tournament_ids)).all()

    tournament_logos = {tournament.id: tournament.logo for tournament in tournaments}

    for prize in current_user.prizes:
        prize.logo = tournament_logos.get(prize.tournament_id)

    return current_user


@router.get("/users/me/bets", response_model=list[BetRead])
async def get_user_bets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Join Bet with Game and Tournament tables
    query = db.query(Bet).join(Game, Bet.game_id == Game.id).join(Tournament, Game.tournament_id == Tournament.id)

    # Filter by the current user's bets
    query = query.filter(Bet.owner_id == current_user.id)

    # Select the necessary fields and enrich the response
    bets = query.with_entities(
        Bet,
        Game.team1.label("team1"),
        Game.team2.label("team2"),
        Game.title.label("title"),
        Game.team1_score.label("team1_score"),
        Game.team2_score.label("team2_score"),
        Game.start_time.label("start_time"),
        Tournament.name.label("tournament_name"),
        Tournament.logo.label("logo"),
        Tournament.id.label("tournament_id"),
        Game.team1_id.label("team1_id"),
        Game.team2_id.label("team2_id"),
        Team.emblem.label("team1_emblem"),
        Team.emblem.label("team2_emblem")
    ).all()

    enriched_bets = []
    for bet, team1, team2, title, team1_score, team2_score, start_time, tournament_name, logo, tournament_id, team1_id, team2_id, team1_emblem, team2_emblem in bets:

        # Enrich the Bet object with additional details
        bet.team1 = team1
        bet.team2 = team2
        bet.title = title
        bet.actual_team1_score = team1_score
        bet.actual_team2_score = team2_score
        bet.start_time = str(start_time)
        bet.tournament_name = tournament_name
        bet.logo = logo
        bet.tournament_id = tournament_id
        bet.team1_emblem = team1_emblem
        bet.team2_emblem = team2_emblem
        enriched_bets.append(bet)

    return enriched_bets