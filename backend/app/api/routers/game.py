from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta
from app.db.database import get_db
from app.models.game import Game
from app.schemas.game import GameCreate, GameRead, GameUpdate, GameFinish
from app.models.bet import Bet
from app.schemas.bet import BetRead
from app.schemas.team import TeamCreate, Area, AreaRead
from app.models.user import User
from app.models.team import Team
from app.models.tournament import Tournament
from app.core.security import get_current_user
from app.notifications.send import send_notifications
from app.api.crud.team import create_team
from app.football_data.api import FootballDataAPI, get_football_data_api
from app.ai_bots.sonnet.sonnet_ai_bot import SonnetAIBot
from app.ai_bots.openai.chatgpt_bot import ChatGPTBot

router = APIRouter()


@router.post("/games", response_model=GameRead)
async def create_game(
    game: GameCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    football_api: FootballDataAPI = Depends(get_football_data_api),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    tournament = db.query(Tournament).filter(Tournament.id == game.tournament_id, Tournament.finished == False).first()

    if not tournament:
        raise HTTPException(status_code=400, detail="Tournament must be open to add games")

    if game.data_id:
        db_game = db.query(Game).filter(Game.data_id == game.data_id).first()
        if db_game:
            raise HTTPException(status_code=400, detail="Game exists already")

        game_data = await football_api.get_match(match_id=game.data_id)
        if game_data:
            # Use API data to populate game details
            team1_id = game_data["homeTeam"]["id"]
            team2_id = game_data["awayTeam"]["id"]

            # Fetch teams from the database by their data_id
            for i, team_id in enumerate([team1_id, team2_id]):
                db_team = db.query(Team).filter(Team.data_id == team_id).first()
                if not db_team:
                    team_data = await football_api.get_team_info(team_id=team_id)
                    if team_data:
                        team = TeamCreate(
                            data_id=team_id,
                            name=team_data["name"].rstrip(" FC"),
                            emblem=team_data["crest"],
                            area=AreaRead(
                                id=team_data["area"]["id"],
                                name=team_data["area"]["name"],
                                code=team_data["area"]["code"],
                                flag=team_data["area"]["flag"],
                            ),
                        )
                        db_team = create_team(db, team)
                    else:
                        if i == 0:
                            team_name = game_data["homeTeam"]["name"].rstrip(" FC")
                            team_emblem = game_data["homeTeam"]["crest"]
                        else:
                            team_name = game_data["awayTeam"]["name"].rstrip(" FC")
                            team_emblem = game_data["awayTeam"]["crest"]
                        team = TeamCreate(
                            data_id=team_id,
                            name=team_name,
                            emblem=team_emblem,
                        )
                        db_team = create_team(db, team)
                if team_id not in [t.data_id for t in tournament.teams]:
                    tournament.teams.append(db_team)

            new_game = Game(
                data_id=game.data_id,
                tournament_id=game.tournament_id,
                title=f"{game_data['stage']} - Matchday: {game_data['matchday']}",
                team1=game_data["homeTeam"]["name"].rstrip(" FC"),
                team1_id=team1_id,
                start_time=datetime.strptime(game_data["utcDate"], "%Y-%m-%dT%H:%M:%SZ") + timedelta(hours=3),
                team2=game_data["awayTeam"]["name"].rstrip(" FC"),
                team2_id=team2_id,
                finished=False,
            )
        else:
            new_game = Game(
                tournament_id=game.tournament_id,
                title=game.title,
                start_time=game.start_time,
                team1=game.team1,
                team2=game.team2,
                finished=False,
            )
    else:
        new_game = Game(
            tournament_id=game.tournament_id,
            title=game.title,
            start_time=game.start_time,
            team1=game.team1,
            team2=game.team2,
            finished=False,
        )
    db.add(new_game)
    db.commit()
    db.refresh(new_game)

    background_tasks.add_task(send_notifications, [(new_game, tournament.name)], [], db)

    # Generate AI prediction
    ai_bot = SonnetAIBot()
    ai_bot.make_prediction(db, new_game.id)

    return new_game


@router.get("/games", response_model=list[GameRead])
async def get_games(
    finished: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
):
    query = db.query(Game).options(
        joinedload(Game.tournament),
        joinedload(Game.team1_info),
        joinedload(Game.team2_info),
        joinedload(Game.bets)
    )

    if finished is not None:
        query = query.filter(Game.finished == finished)

    games = query.all()
    result = []
    for game in games:
        game_data = GameRead.model_validate(game)
        game_data.tournament_name = game.tournament.name
        game_data.tournament_id = game.tournament.id
        game_data.tournament_logo = game.tournament.logo
        game_data.team1_emblem = game.team1_info.emblem if game.team1_info else None
        game_data.team2_emblem = game.team2_info.emblem if game.team2_info else None

        enriched_bets = []
        for bet in game.bets:
            bet_data = BetRead.model_validate(bet)
            bet_data.start_time = game.start_time
            bet_data.team1 = game.team1
            bet_data.team2 = game.team2
            bet_data.tournament_name = game.tournament.name
            bet_data.tournament_id = game.tournament.id
            bet_data.logo = game.tournament.logo
            enriched_bets.append(bet_data)

        game_data.bets = enriched_bets
        result.append(game_data)

    return result


@router.get("/games/{game_id}", response_model=GameRead)
async def get_game(game_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.put("/games/{game_id}", response_model=GameRead)
async def update_game(
    game_id: int,
    game: GameUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_game = db.query(Game).filter(Game.id == game_id).first()
    if not db_game:
        raise HTTPException(status_code=404, detail="Game not found")
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if db_game.finished:
        raise HTTPException(status_code=400, detail="Cannot update finished game")

    db_game.team1_score = game.team1_score
    db_game.team2_score = game.team2_score

    db.commit()
    db.refresh(db_game)
    return db_game


@router.delete("/games/{game_id}", response_model=GameRead)
async def delete_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db_game = db.query(Game).filter(Game.id == game_id).first()
    if not db_game:
        raise HTTPException(status_code=404, detail="Game not found")

    # Delete all bets associated with this game
    db.query(Bet).filter(Bet.game_id == game_id).delete()

    # Now delete the game
    db.delete(db_game)
    db.commit()
    return db_game


@router.post("/games/finish", response_model=GameRead)
async def finish_game(
    game: GameFinish,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    game_id = game.id
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db_game = db.query(Game).filter(Game.id == game_id).first()
    if not db_game:
        raise HTTPException(status_code=404, detail="Game not found")
    if db_game.finished:
        raise HTTPException(status_code=400, detail="Game is already finished")

    if db_game.start_time - timedelta(hours=3) > datetime.utcnow():
        raise HTTPException(status_code=400, detail="Cannot finish not started game")

    bets = db.query(Bet).filter(Bet.game_id == game_id).all()
    for bet in bets:
        if bet.team1_score == db_game.team1_score and bet.team2_score == db_game.team2_score:
            bet.points = 5  # Exact score match
        elif bet.team1_score - bet.team2_score == db_game.team1_score - db_game.team2_score:
            bet.points = 3  # Correct goal difference but not exact score
        elif (bet.team1_score > bet.team2_score and db_game.team1_score > db_game.team2_score) or (
            bet.team1_score < bet.team2_score and db_game.team1_score < db_game.team2_score
        ):
            bet.points = 1  # Correct outcome (win/loss)
        else:
            bet.points = 0  # Incorrect prediction
        bet.finished = True  # Mark bet as finished

    db.commit()

    # Batch update users' total points
    for bet in bets:
        db.query(User).filter(User.id == bet.owner_id).update({"total_points": User.total_points + bet.points})

    db_game.finished = True
    db.commit()
    db.refresh(db_game)

    return db_game


@router.get("/games/{game_id}/bets", response_model=list[BetRead])
async def get_game_bets(game_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bets = db.query(Bet).filter(Bet.game_id == game_id).all()
    return bets


@router.post("/games/{game_id}/ai_prediction", response_model=BetRead)
async def generate_ai_prediction(
    game_id: int,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
):
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Not enough permissions")

    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    if game.finished:
        raise HTTPException(status_code=400, detail="Cannot make prediction for finished game")

    sonnet_bot = SonnetAIBot()
    # chatgpt_bot = ChatGPTBot()
    # bet, explanation = ai_bot.make_prediction(db, game_id)
    bet, explanation = sonnet_bot.make_prediction(db, game_id)

    if bet:
        bet_read = BetRead.model_validate(bet)
        return bet_read
    else:
        raise HTTPException(status_code=500, detail="Failed to generate AI prediction")