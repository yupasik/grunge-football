from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import user, game, tournament, bet
from .db.database import engine, Base


origins = [
    "http://localhost:80",
    "http://localhost",
    "http://127.0.0.1:80",
    "http://127.0.0.1",
    "http://localhost:5000",
    "http://win-bet-ball.ru",
    "https://win-bet-ball.ru",
]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(user.router, prefix="/api", tags=["users"])
app.include_router(game.router, prefix="/api", tags=["games"])
app.include_router(tournament.router, prefix="/api", tags=["tournaments"])
app.include_router(bet.router, prefix="/api", tags=["bets"])
