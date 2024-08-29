from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..db.database import Base


# class Game(Base):
#     __tablename__ = "games"
#
#     id = Column(Integer, primary_key=True, index=True, autoincrement=True)
#     data_id = Column(Integer, unique=True, nullable=True, default=None)
#     tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
#     title = Column(String)
#     start_time = Column(DateTime, nullable=False)
#     team1 = Column(String, nullable=False)
#     team1_id = Column(Integer, unique=True, nullable=True, default=None)
#     team2 = Column(String, nullable=False)
#     team2_id = Column(Integer, unique=True, nullable=True, default=None)
#     finished = Column(Boolean, default=False)
#     team1_score = Column(Integer, default=0)
#     team2_score = Column(Integer, default=0)
#
#     tournament = relationship("Tournament", back_populates="games")
#     bets = relationship("Bet", back_populates="game")


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    data_id = Column(Integer, unique=True, nullable=True, default=None)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    title = Column(String)
    start_time = Column(DateTime, nullable=False)
    team1 = Column(String, nullable=False)
    team1_id = Column(Integer, ForeignKey("teams.data_id"), unique=False, nullable=True)
    team2 = Column(String, nullable=False)
    team2_id = Column(Integer, ForeignKey("teams.data_id"), unique=False, nullable=True)
    finished = Column(Boolean, default=False)
    team1_score = Column(Integer, default=0)
    team2_score = Column(Integer, default=0)

    tournament = relationship("Tournament", back_populates="games")
    bets = relationship("Bet", back_populates="game")
    team1_info = relationship("Team", foreign_keys=[team1_id], primaryjoin="Game.team1_id == Team.data_id")
    team2_info = relationship("Team", foreign_keys=[team2_id], primaryjoin="Game.team2_id == Team.data_id")
#
#
# class Game(Base):
#     __tablename__ = "games"
#
#     id = Column(Integer, primary_key=True, index=True, autoincrement=True)
#     data_id = Column(Integer, unique=True, nullable=True, default=None)
#     tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
#     title = Column(String)
#     start_time = Column(DateTime, nullable=False)
#     team1 = Column(String, nullable=False)
#     team1_id = Column(Integer, ForeignKey("teams.data_id"), nullable=True)
#     team2 = Column(String, nullable=False)
#     team2_id = Column(Integer, ForeignKey("teams.data_id"), nullable=True)
#     finished = Column(Boolean, default=False)
#     team1_score = Column(Integer, default=0)
#     team2_score = Column(Integer, default=0)
#
#     tournament = relationship("Tournament", back_populates="games")
#     bets = relationship("Bet", back_populates="game")
#     team1_info = relationship("Team", foreign_keys=[team1_id])
#     team2_info = relationship("Team", foreign_keys=[team2_id])