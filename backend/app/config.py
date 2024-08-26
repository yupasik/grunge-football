import yaml
from pydantic import BaseModel, EmailStr, SecretStr
from pydantic_settings import BaseSettings


class DBConfig(BaseModel):
    user: str
    password: SecretStr
    host: str
    port: int
    name: str


class MailConfig(BaseModel):
    username: str
    password: SecretStr
    mail_from: EmailStr


class DataConfig(BaseModel):
    token: SecretStr


class TelegramConfig(BaseModel):
    token: SecretStr
    channel_id: str


class Config(BaseSettings):
    is_test: bool = False
    secret_key: SecretStr
    jwt_secret_key: SecretStr
    db: DBConfig
    mail: MailConfig
    telegram: TelegramConfig
    data: DataConfig


def load_config(config_file: str = "config.yaml") -> Config:
    with open(config_file, "r") as file:
        config_data = yaml.safe_load(file)
    return Config(**config_data)
