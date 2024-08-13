from sqlalchemy import Column, Integer, Boolean, ForeignKey, String
from sqlalchemy.orm import relationship
from ..db.database import Base


class Bet(Base):
    __tablename__ = "bets"
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"))
    team1_score = Column(Integer)
    team2_score = Column(Integer)
    points = Column(Integer, default=0)
    finished = Column(Boolean, default=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner_name = Column(String)
    owner = relationship("User", back_populates="bets")
    game = relationship("Game", back_populates="bets")
