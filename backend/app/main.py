import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from contextlib import asynccontextmanager
from .api.routers import admin, game, bet, user, data, tournament, team
from .db.database import engine, Base, get_db
from app.models.game import Game
from app.football_data.api import get_football_data_api
from app.utils.bet_utils import process_bets_for_finished_game


origins = [
    "http://localhost:80",
    "http://localhost",
    "http://127.0.0.1:80",
    "http://127.0.0.1",
    "http://localhost:5000",
    "https://win-bet-ball.ru",
]


# Game status updater function
# Game status updater function
async def update_game_statuses():
    print("PERIODIC TASK")
    db = next(get_db())
    football_api = await get_football_data_api()

    unfinished_games = db.query(Game).filter(Game.finished == False).all()

    for unfinished_game in unfinished_games:
        print(unfinished_game.team1)
        print(unfinished_game.team2)
        time.sleep(2)
        if unfinished_game.data_id:
            game_data = await data.get_match_info(unfinished_game.data_id, api=football_api)
            if game_data:
                if game_data['status'] in ['IN_PLAY', 'PAUSED', 'FINISHED']:
                    unfinished_game.team1_score = game_data['score']['fullTime']['home']
                    unfinished_game.team2_score = game_data['score']['fullTime']['away']

                    if game_data['status'] == 'FINISHED':
                        await process_bets_for_finished_game(db, unfinished_game)
                elif game_data['status'] == 'POSTPONED':
                    # Handle postponed games
                    # game.start_time = datetime.strptime(game_data['utcDate'], "%Y-%m-%dT%H:%M:%SZ") + timedelta(hours=3)
                    pass
        else:
            pass
        print(unfinished_game.finished)
    db.commit()
    db.close()


# Setup APScheduler
scheduler = AsyncIOScheduler()
scheduler.add_job(
    update_game_statuses,
    CronTrigger(minute="*/5"),  # Run every 5 minutes
    max_instances=1,
    coalesce=True,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("STARTUP TASK")
    scheduler.start()
    yield
    print("SHUTDOWN TASK")
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan,)

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
app.include_router(admin.router, prefix="/api", tags=["admin"])
app.include_router(data.router, prefix="/api/data", tags=["data"])
app.include_router(team.router, prefix="/api", tags=["team"])

