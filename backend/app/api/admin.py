from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..models.user import User
from ..models.game import Game
from ..models.admin import NotificationLog
from ..models.tournament import Tournament
from ..notifications.send import send_notifications


router = APIRouter()


@router.post("/notify")
async def notify_new_games(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Get the last processed game ID from NotificationLog or any other storage
    last_processed_game = db.query(NotificationLog).order_by(NotificationLog.id.desc()).first()
    last_game_id = last_processed_game.game_id if last_processed_game else 0

    # Fetch all games with IDs greater than the last processed one
    new_games = (
        db.query(Game, Tournament.name.label("tournament_name"))
        .join(Tournament, Game.tournament_id == Tournament.id)
        .filter(Game.id > last_game_id)
        .all()
    )

    if not new_games:
        raise HTTPException(status_code=404, detail="No new games to notify.")

    # Fetch all users
    users = db.query(User).all()

    # Add the notification task to the background tasks
    background_tasks.add_task(send_notifications, new_games, users, db)

    return {"detail": "Notification task started in the background."}
