import os
from ..config import load_config

app_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
config = load_config(config_file=os.path.join(app_path, "config.yaml"))

ANTHROPIC_API_KEY = config.sonnet.token.get_secret_value()
CHATGPT_API_KEY = config.chatgpt.token.get_secret_value()
SONNET_BOT_ID = config.sonnet.id
CHATGPT_BOT_ID = config.chatgpt.id