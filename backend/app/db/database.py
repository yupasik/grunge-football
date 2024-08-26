import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from ..config import load_config

app_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
config = load_config(config_file=os.path.join(app_path, "config.yaml"))

DB_USER = config.db.user
DB_PASSWORD = config.db.password.get_secret_value()
DB_HOST = config.db.host
DB_PORT = config.db.port
DB_NAME = config.db.name
IS_TEST = config.is_test

if IS_TEST:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
else:
    SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
Base.metadata.create_all(engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
