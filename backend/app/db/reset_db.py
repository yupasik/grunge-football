from sqlalchemy import create_engine
from app.db.database import Base
from app.models.user import User
from app.models.bet import Bet
from app.models.game import Game
from app.models.tournament import Tournament

# URL вашей базы данных
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"  # Или URL вашей базы данных PostgreSQL

# Создание движка
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Удаление существующих таблиц и создание новых
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)

print("Database reset successfully!")
