from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.bet import Bet
from app.models.game import Game
from app.models.tournament import Tournament
from .. import ANTHROPIC_API_KEY, SONNET_BOT_ID, HIDDEN
import json


class SonnetAIBot:
    def __init__(self):
        self.client = Anthropic(api_key=ANTHROPIC_API_KEY)

    def _get_or_create_ai_user(self, db: Session):
        ai_user = db.query(User).filter(User.id == SONNET_BOT_ID).first()
        if not ai_user:
            ai_user = User(username="🤖- S", email="sonnet@example.com", hashed_password="AI_generated_password", is_active=True)
            db.add(ai_user)
            db.commit()
            db.refresh(ai_user)
        return ai_user

    def generate_prediction(self, game_info):
        prompt = f"{HUMAN_PROMPT} As a football expert, predict the score for this match:\n\n"
        prompt += f"Home team: {game_info['home_team']}\n"
        prompt += f"Away team: {game_info['away_team']}\n"
        prompt += f"League: {game_info['league']}\n"
        prompt += f"Date: {game_info['date']}\n\n"
        prompt += """
        with a emphasis on the emotional and psychological aspects:
        
        1. Team morale and confidence:
           - Recent results and their impact on team spirit
           - Public statements from players, coaches, and management
           - Any off-field issues affecting the team's mindset
        
        2. Pressure and motivation:
           - Stakes of the match (e.g., relegation battle, title race, derby)
           - Historical significance of the fixture
           - Individual player motivations (e.g., facing former team, contract negotiations)
        
        3. Team dynamics:
           - Leadership on the field
           - Chemistry between players
           - Impact of any recent changes in the squad or coaching staff\n
        """
        prompt += "Please provide your prediction ONLY in JSON format () with the following structure: {'home_score': <predicted score for home team>,'away_score': <predicted score for away team>'.\n"
        prompt += f"{AI_PROMPT} Based on the information provided, here's my prediction for the match:"
        print(prompt)

        print(prompt)
        response = self.client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=300,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        return self._parse_prediction(response.content[0].text)

    def _parse_prediction(self, prediction_text):
        print("FFFFFF")
        print(prediction_text)
        prediction_text = "{" + prediction_text.split("{")[1].split("}")[0] + "}"
        print(prediction_text)
        try:
            prediction_json = json.loads(prediction_text)
            print(prediction_json)
            print("FUCK")
            print(prediction_json['home_score'])
            print(prediction_json['away_score'])
            return {
                'home_score': int(prediction_json['home_score']),
                'away_score': int(prediction_json['away_score']),
                'explanation': prediction_text
            }
        except (json.JSONDecodeError, KeyError, ValueError):
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
        print(prediction)

        if prediction:
            ai_user = self._get_or_create_ai_user(db)
            ai_bet = Bet(
                game_id=game_id,
                owner_id=ai_user.id,
                owner_name=ai_user.username,
                team1_score=prediction['home_score'],
                team2_score=prediction['away_score'],
                hidden=HIDDEN,
            )
            db.add(ai_bet)
            db.commit()

            return ai_bet, prediction['explanation']
        else:
            return None, "Failed to generate a valid prediction"