import os
from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT
from .. import ANTHROPIC_API_KEY

class AnthropicWrapper:
    def __init__(self):
        self.client = Anthropic(api_key=ANTHROPIC_API_KEY)

    def generate_prediction(self, game_info):
        prompt = f"{HUMAN_PROMPT} As a football expert, predict the score for this match:\n\n"
        prompt += f"Home team: {game_info['home_team']}\n"
        prompt += f"Away team: {game_info['away_team']}\n"
        prompt += f"League: {game_info['league']}\n"
        prompt += f"Date: {game_info['date']}\n\n"
        prompt += "Please provide your prediction in the format 'Home Team Score - Away Team Score' and a brief explanation.\n"
        prompt += f"{AI_PROMPT} Based on the information provided, here's my prediction for the match:"

        response = self.client.completions.create(
            model="claude-3-opus-20240229",
            max_tokens_to_sample=3000,
            prompt=prompt,
        )

        return self._parse_prediction(response.completion)

    def _parse_prediction(self, prediction_text):
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