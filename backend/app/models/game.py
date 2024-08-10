from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..db.database import Base


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    title = Column(String)
    start_time = Column(DateTime, nullable=False)
    team1 = Column(String, nullable=False)
    team2 = Column(String, nullable=False)
    finished = Column(Boolean, default=False)
    team1_score = Column(Integer, default=0)
    team2_score = Column(Integer, default=0)

    tournament = relationship("Tournament", back_populates="games")
    bets = relationship("Bet", back_populates="game")
