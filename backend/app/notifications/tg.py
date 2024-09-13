import os
from telegram import Bot
from ..config import load_config

app_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
config = load_config(config_file=os.path.join(app_path, "config.yaml"))

TG_TOKEN = config.telegram.token.get_secret_value()
CHANEL_ID = config.telegram.channel_id
NOTIFY = config.telegram.notify


bot = Bot(token=TG_TOKEN)


async def send_telegram(new_games):
    if NOTIFY:
        for game, tournament_name in new_games:
            formatted_message = (
                "<b>🏆 New Game Notification!</b>\n\n"
                f"<b>📅 Date & Time:</b> {game.start_time.strftime('%Y-%m-%d %H:%M')} MSK\n\n"
                f"<b>ℹ️ Info:</b> {game.title}\n\n"
                f"<b>🏟 Game:</b> {game.team1.upper()} <i>vs</i> {game.team2.upper()}\n\n"
                f"<b>⚽️ Tournament:</b> {tournament_name}\n\n"
                '<a href="https://win-bet-ball.ru/account"> Make a bet!</a>\n'
            )
            await bot.send_message(chat_id=CHANEL_ID, text=formatted_message, parse_mode="HTML")
