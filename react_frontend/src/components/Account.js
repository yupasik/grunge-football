import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO, addHours, isBefore, compareAsc } from 'date-fns';
import './Account.css';

const MOSCOW_TIMEZONE_OFFSET = 3; // Moscow is UTC+3
const API_URL = 'http://localhost:8000/api';

const Account = () => {
  const [profile, setProfile] = useState({});
  const [achievements, setAchievements] = useState([]);
  const [upcomingPredictions, setUpcomingPredictions] = useState([]);
  const [currentBets, setCurrentBets] = useState([]);
  const [tournamentStats, setTournamentStats] = useState([]);
  const [finishedBets, setFinishedBets] = useState([]);
  const [submittingBets, setSubmittingBets] = useState({});
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
        };

        const profileResponse = await axios.get(`${API_URL}/users/me`, config);

        setProfile(profileResponse.data);

        const filteredAchievements = profileResponse.data.prizes.filter(prize => prize.place <= 3);
        setAchievements(filteredAchievements);

        const betsResponse = await axios.get(`${API_URL}/users/me/bets`, config);
        setCurrentBets(betsResponse.data.filter(bet => !bet.finished));
        setFinishedBets(betsResponse.data.filter(bet => bet.finished));

        setUpcomingPredictions(betsResponse.data.filter(bet => !bet.finished));
        const tournamentsResponse = await axios.get(`${API_URL}/tournaments`, config);
        setTournaments(tournamentsResponse.data);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleTournamentChange = (e) => {
    setSelectedTournament(e.target.value);
  };

  const filteredFinishedBets = selectedTournament
    ? finishedBets.filter(bet => bet.tournament_id === selectedTournament)
    : finishedBets;

  const formatDateTime = (dateTimeString) => {
    return format(parseISO(dateTimeString), 'dd MMM yyyy HH:mm');
  };

  const isGameStarted = (startTime) => {
  const moscowTime = addHours(new Date(), MOSCOW_TIMEZONE_OFFSET);
  return isBefore(parseISO(startTime), moscowTime);

};

  const sortPredictions = (predictions) => {
    return predictions.sort((a, b) => {
      return compareAsc(parseISO(a.start_time), parseISO(b.start_time));
    });
  };

  const handlePredictionSubmit = async (betId, team1Score, team2Score, startTime) => {
    if (isGameStarted(startTime)) {
      console.log("Game has already started. Cannot submit prediction.");
      return;
    }
    setSubmittingBets(prev => ({ ...prev, [betId]: true }));
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      };
      await axios.put(`${API_URL}/bets/${betId}`, {
        team1_score: team1Score,
        team2_score: team2Score
      }, config);

      const button = document.getElementById(`submit-button-${betId}`);
      button.classList.add('submitted');

      setTimeout(() => {
        button.classList.remove('submitted');
      }, 500);

      const predictionsResponse = await axios.get(`${API_URL}/users/me/bets`, config);
      const filteredBets = predictionsResponse.data.filter(bet => !bet.finished);
      setUpcomingPredictions(filteredBets);
    } catch (error) {
      console.error('Error submitting prediction:', error);
    } finally {
      setSubmittingBets(prev => ({ ...prev, [betId]: false }));
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
            {sortPredictions(upcomingPredictions).map((prediction, index) => (
                <div key={index} className="prediction-card">
                  <h3 className="tournament-name">
                    <span className="tournament-name">{prediction.tournament_name}</span>
                    <br/>
                    <br/>
                    <span className="game-date">[ {formatDateTime(prediction.start_time)} ]</span>
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
                      id={`submit-button-${prediction.id}`}
                      className={`submit-prediction ${isGameStarted(prediction.start_time) ? 'game-started' : ''}`}
                      onClick={() => handlePredictionSubmit(
                          prediction.id,
                          document.getElementById(`team1-score-${prediction.id}`).value,
                          document.getElementById(`team2-score-${prediction.id}`).value,
                          prediction.start_time
                      )}
                      disabled={submittingBets[prediction.id] || isGameStarted(prediction.start_time)}
                  >
                    {submittingBets[prediction.id] ? 'Submitting...' : isGameStarted(prediction.start_time) ? 'Game Started' : 'Submit bet'}
                  </button>
                </div>
            ))}
          </div>
        </div>

        <div className="history-section">
          <h2>Prediction History</h2>
          <select id="tournament-select" className="tournament-account-select" onChange={handleTournamentChange}>
            <option value="">Select a tournament</option>
            {tournaments.map(tournament => (
                <option key={tournament.id} value={tournament.id}>{tournament.name}</option>
            ))}
          </select>
          <table className="history-table">
            <thead>
            <tr>
              <th>DATE & TIME</th>
              <th>GAME</th>
              <th>YOUR PREDICTION</th>
              <th>ACTUAL RESULT</th>
              <th>POINTS</th>
            </tr>
            </thead>
            <tbody>
            {filteredFinishedBets.map(bet => (
                <tr key={bet.id}>
                  <td>{formatDateTime(bet.start_time)}</td>
                  <td>{bet.team1} vs {bet.team2}</td>
                  <td>{bet.team1_score}–{bet.team2_score}</td>
                  <td>{bet.actual_team1_score}–{bet.actual_team2_score}</td>
                  <td>{bet.points}</td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>

        <div className="tournaments-stats-section">
          <h2>TOURNAMENTS STATS</h2>
          <div className="tournament-row">
            <img src="https://example.com/premier-league-icon.png" alt="Premier League" className="tournament-icon"/>
            <div className="tournament-info">
              <div className="tournament-name">PREMIER LEAGUE 2022/23 <span className="winner-badge">WINNER</span></div>
              <div className="tournament-stats">
                <div className="stat">
                  <div className="stat-value">1st</div>
                  <div className="stat-label">RANK</div>
                </div>
                <div className="stat">
                  <div className="stat-value">87</div>
                  <div className="stat-label">POINTS</div>
                </div>
                <div className="stat">
                  <div className="stat-value">92%</div>
                  <div className="stat-label">ACCURACY</div>
                </div>
              </div>
            </div>
          </div>
          <div className="tournament-row">
            <img src="https://example.com/champions-league-icon.png" alt="Champions League"
                 className="tournament-icon"/>
            <div className="tournament-info">
              <div className="tournament-name">CHAMPIONS LEAGUE 2022/23</div>
              <div className="tournament-stats">
                <div className="stat">
                  <div className="stat-value">3rd</div>
                  <div className="stat-label">RANK</div>
                </div>
                <div className="stat">
                  <div className="stat-value">72</div>
                  <div className="stat-label">POINTS</div>
                </div>
                <div className="stat">
                  <div className="stat-value">85%</div>
                  <div className="stat-label">ACCURACY</div>
                </div>
              </div>
            </div>
          </div>
          <div className="tournament-row">
            <img src="https://example.com/world-cup-icon.png" alt="World Cup" className="tournament-icon"/>
            <div className="tournament-info">
              <div className="tournament-name">WORLD CUP 2022</div>
              <div className="tournament-stats">
                <div className="stat">
                  <div className="stat-value">5th</div>
                  <div className="stat-label">RANK</div>
                </div>
                <div className="stat">
                  <div className="stat-value">65</div>
                  <div className="stat-label">POINTS</div>
                </div>
                <div className="stat">
                  <div className="stat-value">76%</div>
                  <div className="stat-label">ACCURACY</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Account;
