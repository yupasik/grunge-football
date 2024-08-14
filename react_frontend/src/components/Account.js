import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Account.css';

const API_URL = 'http://localhost:8000/api';

const Account = () => {
  const [profile, setProfile] = useState({});
  const [achievements, setAchievements] = useState([]);
  const [upcomingPredictions, setUpcomingPredictions] = useState([]);
  const [currentBets, setCurrentBets] = useState([]);
  const [tournamentStats, setTournamentStats] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
        };

        const profileResponse = await axios.get(`${API_URL}/users/me`, config);

        setProfile(profileResponse.data);

        // Filter prizes to only include those with place <= 3
        const filteredAchievements = profileResponse.data.prizes.filter(prize => prize.place <= 3);
        setAchievements(filteredAchievements);

        const betsResponse = await axios.get(`${API_URL}/users/me/bets`, config);

        // Filter bets to only include those that are not finished
        const filteredBets = betsResponse.data.filter(bet => !bet.finished);
        setCurrentBets(filteredBets);

        // Set upcoming predictions similarly to currentBets
        setUpcomingPredictions(filteredBets);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const formatDateTime = (dateTimeString) => {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    return new Date(dateTimeString).toLocaleDateString('en-GB', options);
};

  const handlePredictionSubmit = async (betId, team1Score, team2Score) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      };
      await axios.put(`${API_URL}/bets/${betId}`, {
        team1_score: team1Score,
        team2_score: team2Score
      }, config);

      // Refresh predictions after submission
      const predictionsResponse = await axios.get(`${API_URL}/users/me/bets`, config);
      const filteredBets = predictionsResponse.data.filter(bet => !bet.finished);
      setUpcomingPredictions(filteredBets);
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
          <p><strong>Username:</strong> <span className="red-text">{profile.username}</span></p>
          <p><strong>Email:</strong> <span className="red-text">{profile.email}</span></p>
          <p><strong>Total Points:</strong> <span className="red-text">{profile.total_points}</span></p>
        </div>

        <div className="achievements-section">
          <h2>Achievements</h2>
          {achievements.map((achievement, index) => (
              <div key={index} className="achievement">
                <div className="achievement-icon">🏆</div>
                {/* Assuming a trophy icon for all achievements */}
                <div className="achievement-info">
                <div className="achievement-title">Place: {achievement.place}</div>
                <div className="achievement-description">
                  Tournament: {achievement.tournament_name}
                </div>
                <div className="achievement-points">
                  Points: {achievement.points}
                </div>
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
                <h3 className="tournament-name">
                  <span className="tournament-name">{prediction.tournament_name}</span>
                  <br/> {}
                  <br/> {}
                  <span className="game-date">[{formatDateTime(prediction.start_time)}]</span>
                </h3>
                <div className="match-info">
                <div className="team">{prediction.team1}</div>
                  <span className="vs">vs</span>
                  <div className="team">{prediction.team2}</div>
                </div>
                <div className="prediction-input">
                  <input
                      type="number"
                      min="0"
                      max="99"
                      placeholder="0"
                      id={`team1-score-${prediction.id}`}
                      className="score-input"
                      defaultValue={prediction.team1_score}  // Pre-fill with existing score
                  />
                  <span className="separator">:</span>
                  <input
                      type="number"
                      min="0"
                      max="99"
                      placeholder="0"
                      id={`team2-score-${prediction.id}`}
                      className="score-input"
                      defaultValue={prediction.team2_score}  // Pre-fill with existing score
                  />
                </div>
                <button
                    className="submit-prediction"
                    onClick={() => handlePredictionSubmit(
                        prediction.id,
                        document.getElementById(`team1-score-${prediction.id}`).value,
                        document.getElementById(`team2-score-${prediction.id}`).value
                    )}
                >
                  Submit
                </button>
              </div>
          ))}
        </div>
      </div>


    </div>
  );
};

export default Account;
