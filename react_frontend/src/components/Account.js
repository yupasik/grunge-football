import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO, addHours, isBefore, compareAsc } from 'date-fns';
import './Account.css';
import {Link} from "react-router-dom";

const MOSCOW_TIMEZONE_OFFSET = 3; // Moscow is UTC+3
const API_URL = '/api';

const Account = () => {
  const [profile, setProfile] = useState({});
  const [achievements, setAchievements] = useState([]);
  const [upcomingPredictions, setUpcomingPredictions] = useState([]);
  const [tournamentStats, setTournamentStats] = useState([]);
  const [filteredBets, setFilteredBets] = useState([]);
  const [submittingBets, setSubmittingBets] = useState({});
  const [tournaments, setTournaments] = useState([]);
  const [finishedBets, setFinishedBets] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [allBets, setAllBets] = useState([]);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetchData();
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (selectedTournament !== null && allBets.length > 0) {
      filterBets();
    }
  }, [selectedTournament, finishedBets]);

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
      const allBets = betsResponse.data;
      setAllBets(allBets);
      const upcomingBets = allBets.filter(bet => !bet.finished);
      setUpcomingPredictions(upcomingBets);
      setFinishedBets(allBets.filter(bet => bet.finished));

      const tournamentsResponse = await axios.get(`${API_URL}/tournaments`, config);
      setTournaments(tournamentsResponse.data);

      if (tournamentsResponse.data.length > 0) {
        setSelectedTournament(tournamentsResponse.data[0].id);
      }

      const tournamentStats = processPrizesToStats(profileResponse.data.prizes);
      console.log(tournamentStats);
      setTournamentStats(tournamentStats);

      // Fetch upcoming games
      const gamesResponse = await axios.get(`${API_URL}/games?finished=false`, config);
      const allUpcomingGames = gamesResponse.data;

      // Filter out games that already have bets
      const gamesWithoutBets = allUpcomingGames.filter(game =>
        !upcomingBets.some(bet => bet.game_id === game.id)
      );

      setUpcomingGames(gamesWithoutBets);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const checkAuthentication = () => {
        const token = localStorage.getItem('access_token');
        setIsAuthenticated(!!token);
    };

  const Achievement = ({ place, tournamentName, points }) => {
    const getIcon = (place) => {
      switch (place) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return '🏆';
      }
    };

    const getPlaceText = (place) => {
      switch (place) {
        case 1: return '1st Place';
        case 2: return '2nd Place';
        case 3: return '3rd Place';
        default: return `${place}th Place`;
      }
    };

    return (
      <div className="achievement-card">
        <div className="achievement-icon">{getIcon(place)}</div>
        <div className="achievement-info">
          <div className="achievement-tournament">{tournamentName}</div>
          <div className="achievement-place">{getPlaceText(place)}</div>
        </div>
      </div>
    );
  };

  const processPrizesToStats = (prizes) => {
    const groupedPrizes = prizes.reduce((acc, prize) => {
      if (!acc[prize.tournament_id]) {
        acc[prize.tournament_id] = [];
      }
      acc[prize.tournament_id].push(prize);
      return acc;
    }, {});

    return Object.values(groupedPrizes).map(tournamentPrizes => {
      const latestPrize = tournamentPrizes[tournamentPrizes.length - 1];
      return {
        name: latestPrize.tournament_name,
        logo: latestPrize.logo || '',
        is_winner: latestPrize.place === 1,
        rank: getOrdinal(latestPrize.place),
        points: latestPrize.points,
      };
    });
  };

  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const filterBets = () => {
    const filtered = allBets.filter(bet => bet.finished && bet.tournament_id === selectedTournament);
    setFilteredBets(filtered);
  };

  const handleTournamentChange = (e) => {
    setSelectedTournament(Number(e.target.value));
  };

  const formatDateTime = (dateTimeString) => {
    return format(parseISO(dateTimeString), 'dd MMM yyyy HH:mm');
  };

  const getMoscowTime = () => {
    const now = new Date();
    const currentTimeMs = now.getTime();
    const localOffset = now.getTimezoneOffset();
    const utcTimeMs = currentTimeMs + localOffset * 60 * 1000;
    const moscowTimeMs = utcTimeMs + MOSCOW_TIMEZONE_OFFSET * 60 * 60 * 1000;
    const moscow = new Date(moscowTimeMs);
    return moscow;
  };

  const isGameStarted = (startTime) => {
    const moscowTime = getMoscowTime();
    return isBefore(parseISO(startTime), moscowTime);
  };

  const sortPredictions = (predictions) => {
    return predictions.sort((a, b) => {
      return compareAsc(parseISO(a.start_time), parseISO(b.start_time));
    });
  };

  const handlePredictionSubmit = async (betId, team1Score, team2Score, startTime, gameId) => {
    if (isGameStarted(startTime)) {
      console.log("Game has already started. Cannot submit prediction.");
      return;
    }
    setSubmittingBets(prev => ({ ...prev, [gameId]: true }));
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      };
      if (betId) {
        // Update existing bet
        await axios.put(`${API_URL}/bets/${betId}`, {
          team1_score: team1Score,
          team2_score: team2Score
        }, config);
      } else {
        // Create new bet
        await axios.post(`${API_URL}/bets`, {
          game_id: gameId,
          team1_score: team1Score,
          team2_score: team2Score
        }, config);
      }

      const button = document.getElementById(`submit-button-${betId}`);
      button.classList.add('submitted');

      setTimeout(() => {
        button.classList.remove('submitted');
      }, 500);

      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error submitting prediction:', error);
    } finally {
      setSubmittingBets(prev => ({ ...prev, [betId]: false }));
    }
  };

  const TournamentStat = ({ label, value }) => (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );

  const TournamentRow = ({ name, logo, is_winner, rank, points }) => {
    const renderLogo = () => {
      if (!logo) {
        return <div className="tournament-icon-placeholder">No Logo</div>;
      }

      if (logo.startsWith('data:image')) {
        return <img src={logo} alt={name} className="tournament-icon" />;
      } else {
        return <img src={logo} alt={name} className="tournament-icon" />;
      }
    };

    return (
      <div className="tournament-card">
        {renderLogo()}
        <div className="tournament-info">
          <div className="tournament-name">
            {name}
            {is_winner && <span className="winner-badge">WINNER</span>}
          </div>
          <div className="tournament-stats">
            <TournamentStat label="RANK" value={rank} />
            <TournamentStat label="POINTS" value={points} />
          </div>
        </div>
      </div>
    );
  };

  const renderPredictionCard = (item, isPrediction = false) => {
    const cardClass = isPrediction ? 'bet-made' : 'no-bet';

    return (
      <div key={isPrediction ? item.id : `game-${item.id}`} className={`prediction-card ${cardClass}`}>
        <h3 className="tournament-name">
          <span className="tournament-name">{item.tournament_name}</span>
          <br/>
          <br/>
          <span className="game-date">[ {formatDateTime(item.start_time)} ]</span>
        </h3>
        <div className="match-info">
          <div className="team">{item.team1}</div>
          <span className="vs">vs</span>
          <div className="team">{item.team2}</div>
        </div>
        <div className="prediction-input">
          <input
            type="number"
            min="0"
            max="99"
            placeholder="0"
            id={`team1-score-${isPrediction ? item.id : `game-${item.id}`}`}
            className="score-input"
            defaultValue={isPrediction ? item.team1_score : ''}
          />
          <span className="separator">:</span>
          <input
            type="number"
            min="0"
            max="99"
            placeholder="0"
            id={`team2-score-${isPrediction ? item.id : `game-${item.id}`}`}
            className="score-input"
            defaultValue={isPrediction ? item.team2_score : ''}
          />
        </div>
        <button
          id={`submit-button-${isPrediction ? item.id : `game-${item.id}`}`}
          className={`submit-prediction ${isGameStarted(item.start_time) ? 'game-started' : ''}`}
          onClick={() => handlePredictionSubmit(
            isPrediction ? item.id : null,
            document.getElementById(`team1-score-${isPrediction ? item.id : `game-${item.id}`}`).value,
            document.getElementById(`team2-score-${isPrediction ? item.id : `game-${item.id}`}`).value,
            item.start_time,
            isPrediction ? item.game_id : item.id
          )}
          disabled={submittingBets[isPrediction ? item.id : item.id] || isGameStarted(item.start_time)}
        >
          {submittingBets[isPrediction ? item.id : item.id] ? 'Submitting...' : isGameStarted(item.start_time) ? 'Game Started' : isPrediction ? 'Update bet' : 'Submit bet'}
        </button>
      </div>
    );
  };

  return (
      <div className="container">
        <div className="header-container">
          <h1>MY ACCOUNT</h1>
          <div>
            <a href="/" className="back-button">BACK TO MAIN</a>
            if (!isAuthenticated) {
              <a href="/signin" className="login-button">LOGIN</a>
            }
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
            <h2>ACHIEVEMENTS</h2>
            {achievements.map((achievement, index) => (
                <Achievement
                    key={index}
                    place={achievement.place}
                    tournamentName={achievement.tournament_name}
                    points={achievement.points}
                />
            ))}
          </div>
        </div>

        <div className="predictions-section">
          <h2>Upcoming Predictions</h2>
          <div className="predictions-grid">
            {sortPredictions([...upcomingPredictions, ...upcomingGames]).map(item =>
                renderPredictionCard(item, 'game_id' in item)
            )}
          </div>
        </div>

        <div className="history-section">
          <h2>Predictions History</h2>
          <select
              id="tournament-select"
              className="tournament-account-select"
              onChange={handleTournamentChange}
              value={selectedTournament || ''}
          >
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
            {filteredBets.map(bet => (
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
          <h2>TOURNAMENTS HISTORY</h2>
          <div className="tournament-grid">
            {tournamentStats.length > 0 ? (
                tournamentStats.map((tournament, index) => (
                    <TournamentRow key={index} {...tournament} />
                ))
            ) : (
                <p>No tournament stats available</p>
            )}
          </div>
        </div>
      </div>
  );
};

export default Account;
