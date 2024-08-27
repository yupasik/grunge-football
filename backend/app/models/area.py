from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..db.database import Base


class Area(Base):
    __tablename__ = "areas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)
    flag = Column(String, nullable=True)  # Assuming flag is a URL string

    # Relationship with teams
    teams = relationship("Team", back_populates="area")
