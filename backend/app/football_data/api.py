import os
import httpx
from httpx._exceptions import HTTPError
import logging
from ..config import load_config

app_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
config = load_config(config_file=os.path.join(app_path, "config.yaml"))

API_KEY = config.data.token.get_secret_value()


class FootballDataAPI:
    BASE_URL = "https://api.football-data.org/v4"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {"X-Auth-Token": self.api_key}

    async def _send_request(self, endpoint: str, params: dict = None):
        url = f"{self.BASE_URL}/{endpoint}"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers, params=params)
                response.raise_for_status()
                return response.json()
            except HTTPError as http_err:
                logging.error(f"HTTP error occurred: {http_err}")
            except Exception as err:
                logging.error(f"An error occurred: {err}")

    async def get_competitions(self):
        """Retrieve a list of available competitions."""
        return await self._send_request("competitions")

    async def get_competition(self, competition_id: int):
        """Retrieve a list of available competitions."""
        return await self._send_request(f"competitions/{competition_id}")

    async def get_teams(self, competition_id: int):
        """Retrieve a list of teams in a competition."""
        return await self._send_request(f"competitions/{competition_id}/teams")

    async def get_standings(self, competition_id: int):
        """Retrieve the standings for a competition."""
        return await self._send_request(f"competitions/{competition_id}/standings")

    async def get_matches(self, competition_id: int):
        """Retrieve the matches for a competition."""
        return await self._send_request(f"competitions/{competition_id}/matches")

    async def get_team_info(self, team_id: int):
        """Retrieve information about a specific team."""
        return await self._send_request(f"teams/{team_id}")

    async def get_player_info(self, player_id: int):
        """Retrieve information about a specific player."""
        return await self._send_request(f"players/{player_id}")

    async def get_matches_for_team(self, team_id: int):
        """Retrieve the matches for a specific team."""
        return await self._send_request(f"teams/{team_id}/matches")

    async def get_scorers(self, competition_id: int):
        """Retrieve top scorers for a competition."""
        return await self._send_request(f"competitions/{competition_id}/scorers")

    async def get_match(self, match_id: int):
        """Retrieve information about a specific match."""
        return await self._send_request(f"matches/{match_id}")


async def get_football_data_api() -> FootballDataAPI:
    return FootballDataAPI(api_key=API_KEY)
