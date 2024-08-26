from sqlalchemy import Column, Integer
from sqlalchemy.orm import declarative_base
from ..db.database import Base


class NotificationLog(Base):
    __tablename__ = "notification_log"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, nullable=False)  # This stores the last processed game ID

    def __init__(self, game_id: int):
        self.game_id = game_id
        super().__init__()
