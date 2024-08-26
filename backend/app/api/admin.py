from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..models.user import User
from ..models.game import Game
from ..models.admin import NotificationLog
from ..models.tournament import Tournament
from ..notifications.send import send_notifications


router = APIRouter()


def get_last_processed_game_id(db: Session) -> int:
    last_processed_game = db.query(NotificationLog).order_by(NotificationLog.id.desc()).first()
    return last_processed_game.game_id if last_processed_game else 0


def fetch_new_games(db: Session, last_game_id: int):
    return (
        db.query(Game, Tournament.name.label("tournament_name"))
        .join(Tournament, Game.tournament_id == Tournament.id)
        .filter(Game.id > last_game_id)
        .all()
    )


def fetch_all_users(db: Session):
    return db.query(User).all()


@router.post("/notify")
async def notify_new_games(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    last_game_id = get_last_processed_game_id(db)
    new_games = fetch_new_games(db, last_game_id)

    if not new_games:
        raise HTTPException(status_code=404, detail="No new games to notify.")

    users = fetch_all_users(db)
    background_tasks.add_task(send_notifications, new_games, users, db)

    return {"detail": "Notification task started in the background."}
