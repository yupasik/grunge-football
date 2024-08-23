BODY_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Games Notification</title>
</head>
<body style="font-family: 'Arial', sans-serif; background-color: #1a1a1a; color: #ddd; margin: 0; padding: 20px; line-height: 1.6;">
    <h1 style="color: #ff3333; text-transform: uppercase; text-align: center; margin: 0; border-bottom: 1px solid #444; font-size: 24px; padding-bottom: 20px;">
        ⚽️ ⚽️ ⚽️ New Games Notification ⚽️ ⚽️ ⚽️
    </h1>
{games}    
</body>
</html>
"""

GAME_TEMPLATE = """
    <div class="container" style="max-width: 450px; margin: 0 auto; background-color: #222; border: 1px solid #444; margin-top: 20px; padding: 20px;">
        <h1 style="color: #ff3333; text-transform: uppercase; margin: 0; border-bottom: 1px solid #444; font-size: 24px; padding-bottom: 20px;">
            {tournament_name}
        </h1>
        <div class="game-card" style="background-color: #2a2a2a; border: 1px solid #444; border-radius: 5px; padding: 15px; margin-top: 20px;">
            <div class="game-header" style="background-color: #1a1a1a; padding: 10px; border-bottom: 1px solid #444;">
                <h3 style="color: #ff3333; margin: 0; font-size: 18px;">{title}</h3>
                <p style="color: #888; margin: 5px 0 0; font-size: 14px;">{date} MSK</p>
            </div>
            <div class="game-teams" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; color: #fff; width: 100%;">
                <div class="team" style="font-size: 17px; color: #ddd; text-transform: uppercase;">{team1}</div>
                <div class="vs" style="color: #ff3333; font-size: 28px; margin: 0 10px;">vs</div>
                <div class="team" style="font-size: 17px; color: #ddd; text-transform: uppercase;">{team2}</div>
            </div>
        </div>
    </div>
    <br />

"""
