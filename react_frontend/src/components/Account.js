import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Account.css';

const API_URL = 'http://localhost:8000/api';

const Account = () => {
  const [profile, setProfile] = useState({});
  const [achievements, setAchievements] = useState([]);
  const [upcomingPredictions, setUpcomingPredictions] = useState([]);
  const [tournamentStats, setTournamentStats] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
        };

        const profileResponse = await axios.get(`${API_URL}/users/me`, config);
        setProfile(profileResponse.data);

        const achievementsResponse = await axios.get(`${API_URL}/users/me/achievements`, config);
        setAchievements(achievementsResponse.data);

        const predictionsResponse = await axios.get(`${API_URL}/users/me/upcoming-predictions`, config);
        setUpcomingPredictions(predictionsResponse.data);

        const statsResponse = await axios.get(`${API_URL}/users/me/tournament-stats`, config);
        setTournamentStats(statsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handlePredictionSubmit = async (gameId, team1Score, team2Score) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      };
      await axios.post(`${API_URL}/bets`, {
        game_id: gameId,
        team1_score: team1Score,
        team2_score: team2Score
      }, config);
      // Refresh predictions after submission
      const predictionsResponse = await axios.get(`${API_URL}/users/me/upcoming-predictions`, config);
      setUpcomingPredictions(predictionsResponse.data);
    } catch (error) {
      console.error('Error submitting prediction:', error);
    }
  };

  return (
    <div className="container">
      <div className="header-container">
        <h1>MY ACCOUNT</h1>
        <div>
          <a href="/" className="back-button">BACK TO MAIN</a>
          {profile.is_admin && <a href="/dashboard" className="admin-button">ADMIN</a>}
        </div>
      </div>

      <div className="profile-achievements">
        <div className="profile-section">
          <h2>Profile Information</h2>
          <p><strong>Username:</strong> {profile.username}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Member Since:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
        </div>

        <div className="achievements-section">
          <h2>Achievements</h2>
          {achievements.map((achievement, index) => (
            <div key={index} className="achievement">
              <div className="achievement-icon">{achievement.icon}</div>
              <div className="achievement-info">
                <div className="achievement-title">{achievement.title}</div>
                <div className="achievement-description">{achievement.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="predictions-section">
        <h2>Upcoming Predictions</h2>
        <div className="predictions-grid">
          {upcomingPredictions.map((prediction, index) => (
            <div key={index} className="prediction-card">
              <h3>{prediction.tournament_name}</h3>
              <div className="match-info">
                <div className="team">{prediction.team1}</div>
                <span>vs</span>
                <div className="team">{prediction.team2}</div>
              </div>
              <div className="prediction-input">
                <input type="number" min="0" max="99" placeholder="0" id={`team1-score-${prediction.id}`} />
                <span>:</span>
                <input type="number" min="0" max="99" placeholder="0" id={`team2-score-${prediction.id}`} />
              </div>
              <button className="submit-prediction" onClick={() => handlePredictionSubmit(
                prediction.id,
                document.getElementById(`team1-score-${prediction.id}`).value,
                document.getElementById(`team2-score-${prediction.id}`).value
              )}>Submit</button>
            </div>
          ))}
        </div>
      </div>

      <div className="tournaments-stats-section">
        <h2>TOURNAMENTS STATS</h2>
        {tournamentStats.map((tournament, index) => (
          <div key={index} className="tournament-row">
            <img src={tournament.logo} alt={tournament.name} className="tournament-icon" />
            <div className="tournament-info">
              <div className="tournament-name">{tournament.name} {tournament.is_winner && <span className="winner-badge">WINNER</span>}</div>
              <div className="tournament-stats">
                <div className="stat">
                  <div className="stat-value">{tournament.rank}</div>
                  <div className="stat-label">RANK</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{tournament.points}</div>
                  <div className="stat-label">POINTS</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{tournament.accuracy}%</div>
                  <div className="stat-label">ACCURACY</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Account;