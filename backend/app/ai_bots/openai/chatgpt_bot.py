from openai import OpenAI
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.bet import Bet
from app.models.game import Game
from app.models.tournament import Tournament
from app.ai_bots import CHATGPT_API_KEY, CHATGPT_BOT_ID


class ChatGPTBot:
    def __init__(self):
        self.client = OpenAI(
            # This is the default and can be omitted
            api_key=CHATGPT_API_KEY,
        )

    def _get_or_create_ai_user(self, db: Session):
        ai_user = db.query(User).filter(User.id == CHATGPT_BOT_ID).first()
        if not ai_user:
            ai_user = User(username="🤖- C", email="chatgpt_bot@win-bet-ball", hashed_password="AI_generated_password", is_active=True)
            db.add(ai_user)
            db.commit()
            db.refresh(ai_user)
        return ai_user

    def generate_prediction(self, game_info):
        prompt = f"As a football expert, predict the score for this match:\n\n"
        prompt += f"Home team: {game_info['home_team']}\n"
        prompt += f"Away team: {game_info['away_team']}\n"
        prompt += f"League: {game_info['league']}\n"
        prompt += f"Date: {game_info['date']}\n\n"
        prompt += "Please provide your prediction in the format 'Home Team Score - Away Team Score' and a brief explanation.\n"

        response = self.client.chat.completions.create(
            model="gpt-3.5-turbo",  # или "gpt-4", если у вас есть доступ
            messages=[
                {"role": "system", "content": "You are a football expert providing match predictions."},
                {"role": "user", "content": prompt}
            ]
        )

        return self._parse_prediction(response['choices'][0]['message']['content'])

    async def _parse_prediction(self, prediction_text):
        print(prediction_text)
        lines = prediction_text.strip().split('\n')
        score_line = lines[0]
        explanation = '\n'.join(lines[1:])

        try:
            home_score, away_score = map(int, score_line.split('-'))
            return {
                'home_score': home_score,
                'away_score': away_score,
                'explanation': explanation.strip()
            }
        except ValueError:
            return None

    def make_prediction(self, db: Session, game_id: int):
        game = db.query(Game).filter(Game.id == game_id).first()
        if not game:
            raise ValueError(f"Game with id {game_id} not found")

        tournament = db.query(Tournament).filter(Tournament.id == game.tournament_id).first()

        game_info = {
            'home_team': game.team1,
            'away_team': game.team2,
            'league': tournament.name,
            'date': game.start_time.strftime("%Y-%m-%d")
        }

        prediction = self.generate_prediction(game_info)

        if prediction:
            ai_user = self._get_or_create_ai_user(db)
            ai_bet = Bet(
                game_id=game_id,
                owner_id=ai_user.id,
                owner_name=ai_user.username,
                team1_score=prediction['home_score'],
                team2_score=prediction['away_score'],
                hidden=False
            )
            db.add(ai_bet)
            db.commit()

            return ai_bet, prediction['explanation']
        else:
            return None, "Failed to generate a valid prediction"