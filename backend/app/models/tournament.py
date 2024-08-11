from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from ..db.database import Base


class Tournament(Base):
    __tablename__ = "tournaments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, unique=True, index=True, nullable=False)
    logo = Column(String)
    finished = Column(Boolean, default=False)
    games = relationship("Game", back_populates="tournament")
    prizes = relationship("Prize", back_populates="tournament")
