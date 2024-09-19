import os
from typing import Dict, Any
import httpx
import json
import logging
import time
from ..config import load_config

app_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
config = load_config(config_file=os.path.join(app_path, "config.yaml"))

API_KEY = config.data.token.get_secret_value()

class FootballDataAPI:
    BASE_URL = "https://api.football-data.org/v4"
    _instance = None

    def __new__(cls, token=None):
        if cls._instance is None:
            cls._instance = super(FootballDataAPI, cls).__new__(cls)
            cls._instance.initialize(token=token)
        return cls._instance

    def initialize(self, token=None):
        self.api_key = token or API_KEY
        self.headers = {"X-Auth-Token": self.api_key}
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.cache_ttl = 600  # 10 minutes

    def _get_cache(self, key: str) -> Dict[str, Any] | None:
        if key in self.cache:
            cached_data, timestamp = self.cache[key]
            if time.time() - timestamp < self.cache_ttl:
                logging.info(f"Cache hit for key: {key}")
                return cached_data
            else:
                logging.info(f"Cache expired for key: {key}")
                del self.cache[key]
        return None

    def _set_cache(self, key: str, value: Dict[str, Any]) -> None:
        logging.info(f"Setting cache for key: {key}")
        self.cache[key] = (value, time.time())

    async def _send_cached_request(self, endpoint: str, params: dict = None) -> Dict[str, Any] | None:
        url = f"{self.BASE_URL}/{endpoint}"
        cache_key = f"{endpoint}:{json.dumps(params, sort_keys=True)}"

        cached_data = self._get_cache(cache_key)
        if cached_data:
            return cached_data

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers, params=params)
                print(response)
                response.raise_for_status()
                data = response.json()
                self._set_cache(cache_key, data)
                return data
            except httpx.HTTPError as http_err:
                logging.error(f"HTTP error occurred: {http_err}")
            except Exception as err:
                logging.error(f"An error occurred: {err}")
        return None

    async def _send_request(self, endpoint: str, params: dict = None):
        url = f"{self.BASE_URL}/{endpoint}"
        async with httpx.AsyncClient() as client:
            try:
                print(self.headers)
                response = await client.get(url, headers=self.headers, params=params)
                response.raise_for_status()
                return response.json()
            except Exception as err:
                logging.error(f"An error occurred: {err}")


    async def get_competitions(self):
        """Retrieve a list of available competitions."""
        return await self._send_cached_request("competitions")

    async def get_competition(self, competition_id: int):
        """Retrieve a list of available competitions."""
        return await self._send_cached_request(f"competitions/{competition_id}")

    async def get_teams(self, competition_id: int):
        """Retrieve a list of teams in a competition."""
        return await self._send_cached_request(f"competitions/{competition_id}/teams")

    async def get_standings(self, competition_id: int):
        """Retrieve the standings for a competition."""
        return await self._send_cached_request(f"competitions/{competition_id}/standings")

    async def get_matches(self, competition_id: int):
        """Retrieve the matches for a competition."""
        return await self._send_cached_request(f"competitions/{competition_id}/matches")

    async def get_team_info(self, team_id: int):
        """Retrieve information about a specific team."""
        return await self._send_cached_request(f"teams/{team_id}")

    async def get_player_info(self, player_id: int):
        """Retrieve information about a specific player."""
        return await self._send_cached_request(f"players/{player_id}")

    async def get_matches_for_team(self, team_id: int):
        """Retrieve the matches for a specific team."""
        return await self._send_cached_request(f"teams/{team_id}/matches")

    async def get_scorers(self, competition_id: int):
        """Retrieve top scorers for a competition."""
        return await self._send_cached_request(f"competitions/{competition_id}/scorers")

    async def get_match(self, match_id: int):
        """Retrieve information about a specific match."""
        return await self._send_request(f"matches/{match_id}")


football_data_api = FootballDataAPI()

async def get_football_data_api() -> FootballDataAPI:
    return football_data_api
