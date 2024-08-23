import os
from dotenv import load_dotenv
from pydantic import EmailStr
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType


load_dotenv()

MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_FROM = os.getenv("MAIL_FROM")


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