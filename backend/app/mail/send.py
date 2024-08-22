import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from pydantic import EmailStr
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from ..models.admin import NotificationLog
from .html import BODY_TEMPLATE, GAME_TEMPLATE


load_dotenv()

MAIL_USERNAME = os.getenv("MAIL_USERNAME", "admin@win-bet-ball.ru")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "Scratchy2Myau")
MAIL_FROM = os.getenv("MAIL_FROM", "admin@win-bet-ball.ru")


CONF = ConnectionConfig(
    MAIL_USERNAME = MAIL_USERNAME,
    MAIL_PASSWORD = MAIL_PASSWORD,
    MAIL_FROM = MAIL_FROM,
    MAIL_PORT = 465,
    MAIL_SERVER = "smtp.yandex.ru",
    MAIL_STARTTLS = False,
    MAIL_SSL_TLS = True,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)


async def send_email(recipients: list[EmailStr], body: str):
    message = MessageSchema(
        subject="WIN-BET-BALL",
        recipients=recipients,
        body=body,
        subtype=MessageType.html
    )
    fm = FastMail(CONF)
    await fm.send_message(message)



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

    result = await send_email(recipients=emails, body=message)

    # Log the last processed game ID
    log_entry = NotificationLog(game_id=max_id)
    db.add(log_entry)
    db.commit()