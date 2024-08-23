from sqlalchemy.orm import Session
from ..models.admin import NotificationLog
from .html import BODY_TEMPLATE, GAME_TEMPLATE
from .email import send_email
from .tg import send_telegram


async def send_notifications(games, users, db: Session):
    # Create email content and send it to users
    emails = [user.email for user in users]

    games_data = []
    max_id = 0

    for game, tournament_name in games:
        if game.id > max_id:
            max_id = game.id
        games_data.append(
            GAME_TEMPLATE.format(
                tournament_name=tournament_name,
                title=game.title,
                team1=game.team1,
                team2=game.team2,
                date = game.start_time,
            )
        )
    message = BODY_TEMPLATE.format(games="".join(games_data))

    # result = await send_email(recipients=emails, body=message)
    await send_telegram(games)

    # Log the last processed game ID
    log_entry = NotificationLog(game_id=max_id)
    db.add(log_entry)
    db.commit()