from sqlalchemy import Column, Integer, String, BigInteger, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.db.database import Base


# Association table for the many-to-many relationship between Tournament and Team
tournament_team_association = Table(
    "tournament_team_association",
    Base.metadata,
    Column("tournament_id", Integer, ForeignKey("tournaments.id")),
    Column("team_id", Integer, ForeignKey("teams.id")),
)


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    emblem = Column(String, unique=True, nullable=True)
    data_id = Column(BigInteger, unique=True, nullable=True, default=None)

    # Foreign key to link to the Area model
    area_id = Column(Integer, ForeignKey("areas.id"))

    # Relationship with Area
    area = relationship("Area", back_populates="teams")

    # Many-to-many relationship with tournaments
    tournaments = relationship("Tournament", secondary="tournament_team_association", back_populates="teams")
