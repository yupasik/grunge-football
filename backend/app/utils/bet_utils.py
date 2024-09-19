from app.models.bet import Bet
from app.models.game import Game
from app.models.user import User
from sqlalchemy.orm import Session
from typing import List


def calculate_bet_points(bet: Bet, game: Game) -> int:
    if bet.team1_score == game.team1_score and bet.team2_score == game.team2_score:
        return 5  # Exact score match
    elif bet.team1_score - bet.team2_score == game.team1_score - game.team2_score:
        return 3  # Correct goal difference but not exact score
    elif (bet.team1_score > bet.team2_score and game.team1_score > game.team2_score) or (
            bet.team1_score < bet.team2_score and game.team1_score < game.team2_score
    ):
        return 1  # Correct outcome (win/loss)
    else:
        return 0  # Incorrect prediction


async def process_bets_for_finished_game(db: Session, game: Game) -> None:
    bets = db.query(Bet).filter(Bet.game_id == game.id).all()
    for bet in bets:
        bet.points = calculate_bet_points(bet, game)
        bet.finished = True

    # Batch update users' total points
    user_points = {}
    for bet in bets:
        user_points[bet.owner_id] = user_points.get(bet.owner_id, 0) + bet.points

    for user_id, points in user_points.items():
        db.query(User).filter(User.id == user_id).update({"total_points": User.total_points + points})

    game.finished = True