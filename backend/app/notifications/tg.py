import os
from dotenv import load_dotenv
from telegram import Bot

load_dotenv()

TG_TOKEN = os.getenv("TG_TOKEN")
CHANEL_ID = os.getenv("CHANEL_ID")


bot = Bot(token=TG_TOKEN)


async def send_telegram(new_games):
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