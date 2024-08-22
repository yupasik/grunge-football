from pydantic import BaseModel


class NotificationLog(BaseModel):
    id: int
    game_id: int
