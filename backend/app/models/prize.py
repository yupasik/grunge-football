from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class Prize(Base):
    __tablename__ = "prizes"

    id = Column(Integer, primary_key=True, index=True)
    place = Column(Integer, nullable=False)
    points = Column(Integer, nullable=False)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"))
    tournament_name = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="prizes")
    tournament = relationship("Tournament", back_populates="prizes")
