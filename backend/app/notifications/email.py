import os
from pydantic import EmailStr
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from ..config import load_config

app_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
config = load_config(config_file=os.path.join(app_path, "config.yaml"))

MAIL_USERNAME = config.mail.username
MAIL_PASSWORD = config.mail.password.get_secret_value()
MAIL_FROM = config.mail.mail_from


CONF = ConnectionConfig(
    MAIL_USERNAME=MAIL_USERNAME,
    MAIL_PASSWORD=MAIL_PASSWORD,
    MAIL_FROM=MAIL_FROM,
    MAIL_PORT=465,
    MAIL_SERVER="smtp.yandex.ru",
    MAIL_STARTTLS=False,
    MAIL_SSL_TLS=True,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)


async def send_email(recipients: list[EmailStr], body: str):
    message = MessageSchema(subject="WIN-BET-BALL", recipients=recipients, body=body, subtype=MessageType.html)
    fm = FastMail(CONF)
    await fm.send_message(message)
