import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO, isBefore, compareAsc } from 'date-fns';
import './Account.css';
import { Link } from "react-router-dom";

const MOSCOW_TIMEZONE_OFFSET = 3; // Moscow is UTC+3
const API_URL = process.env.REACT_APP_API_URL || '/api';

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
  const [selectedUpcomingTournament, setSelectedUpcomingTournament] = useState(null);
  const [allBets, setAllBets] = useState([]);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errors, setErrors] = useState({});
  const [hiddenBets, setHiddenBets] = useState({});

  useEffect(() => {
    fetchData();
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (selectedTournament !== null && allBets.length > 0) {
      filterBets();
    }
  }, [selectedTournament, finishedBets]);

  useEffect(() => {
    if (tournaments.length > 0 && selectedUpcomingTournament === null) {
      setSelectedUpcomingTournament(null);  // Изначально выбираем "All Tournaments"
    }
  }, [tournaments]);

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
      setTournamentStats(tournamentStats);

      const gamesResponse = await axios.get(`${API_URL}/games?finished=false`, config);
      const allUpcomingGames = gamesResponse.data;
      setUpcomingGames(allUpcomingGames);

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

  const filterUpcomingPredictions = () => {
    if (!selectedUpcomingTournament) {
      // Для "All Tournaments" создаем уникальный список игр
      const allGames = [...upcomingGames];
      upcomingPredictions.forEach(bet => {
        const gameIndex = allGames.findIndex(game => game.id === bet.game_id);
        if (gameIndex !== -1) {
          allGames[gameIndex] = { ...allGames[gameIndex], bet };
        } else {
          allGames.push({ ...bet, id: bet.game_id });
        }
      });
      return allGames;
    }

    const filteredPredictions = upcomingPredictions.filter(bet => bet.tournament_id === selectedUpcomingTournament);
    const filteredGames = upcomingGames.filter(game => game.tournament_id === selectedUpcomingTournament);

    const allGames = [...filteredGames];

    filteredPredictions.forEach(bet => {
      const gameIndex = allGames.findIndex(game => game.id === bet.game_id);
      if (gameIndex !== -1) {
        allGames[gameIndex] = { ...allGames[gameIndex], bet };
      } else {
        allGames.push({ ...bet, id: bet.game_id });
      }
    });

    return allGames;
  };

  const handleTournamentChange = (e) => {
    setSelectedTournament(Number(e.target.value));
  };

  const handleUpcomingTournamentChange = (e) => {
    const value = e.target.value;
    setSelectedUpcomingTournament(value === "" ? null : Number(value));
  };

  const handleHiddenChange = (cardId, checked) => {
    setHiddenBets(prev => ({ ...prev, [cardId]: checked }));
  };

  const formatDateTime = (dateTimeString) => {
    return format(parseISO(dateTimeString), 'dd MMM yyyy HH:mm') + " MSK";
  };

  const getMoscowTime = () => {
    const now = new Date();
    const currentTimeMs = now.getTime();
    const localOffset = now.getTimezoneOffset();
    const utcTimeMs = currentTimeMs + localOffset * 60 * 1000;
    const moscowTimeMs = utcTimeMs + MOSCOW_TIMEZONE_OFFSET * 60 * 60 * 1000;
    return new Date(moscowTimeMs);
  };

  const isGameStarted = (startTime) => {
    const moscowTime = getMoscowTime();
    return isBefore(parseISO(startTime), moscowTime);
  };

  const sortPredictions = (predictions) => {
    return predictions.sort((a, b) => compareAsc(parseISO(a.start_time), parseISO(b.start_time)));
  };

  const handlePredictionSubmit = async (betId, team1Score, team2Score, startTime, gameId, hidden, tournamentId) => {
    if (isGameStarted(startTime)) {
      console.log("Game has already started. Cannot submit prediction.");
      return;
    }

    const submissionId = betId || gameId;
    setSubmittingBets(prev => ({ ...prev, [gameId]: true }));
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      };
      const data = {
        team1_score: team1Score,
        team2_score: team2Score,
        hidden: hidden
      };

      let response;

      if (betId) {
        response = await axios.put(`${API_URL}/bets/${betId}`, data, config);
      } else {
        response = await axios.post(`${API_URL}/bets`, { ...data, game_id: gameId }, config);
      }

      console.log("Bet submitted successfully", response.data);

      const newBet = {
        ...response.data,
        tournament_id: tournamentId
      };

      setUpcomingPredictions(prev => {
        const existingBetIndex = prev.findIndex(b => b.id === betId);
        if (existingBetIndex !== -1) {
          return prev.map((bet, index) => index === existingBetIndex ? newBet : bet);
        } else {
          return [...prev, newBet];
        }
      });

      setAllBets(prev => {
        const existingBetIndex = prev.findIndex(b => b.id === betId);
        if (existingBetIndex !== -1) {
          return prev.map((bet, index) => index === existingBetIndex ? newBet : bet);
        } else {
          return [...prev, newBet];
        }
      });

      const button = document.getElementById(`submit-button-${submissionId}`);
      button.classList.add('submitted');
      setTimeout(() => {
        button.classList.remove('submitted');
      }, 500);
    } catch (error) {
      console.error('Error submitting prediction:', error);
    } finally {
      setSubmittingBets(prev => ({ ...prev, [gameId]: false }));
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
      return <img src={logo} alt={name} className="tournament-icon" />;
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

  const validateScores = (score1, score2, cardId) => {
    if (score1 === '' || score2 === '') {
      setErrors(prev => ({ ...prev, [cardId]: 'Please enter a score for both teams' }));
      return false;
    }
    setErrors(prev => ({ ...prev, [cardId]: '' }));
    return true;
  };

  const renderPredictionCard = (item) => {
    const isPrediction = 'bet' in item;
    const cardClass = isPrediction ? 'bet-made' : 'no-bet';
    const { id, tournament_name, start_time, team1, team2, team1_score, team2_score, game_id, hidden } = isPrediction ? item.bet : item;
    const gameStarted = isGameStarted(start_time);
    const cardId = isPrediction ? id : `game-${id}`;
    const isSubmitting = submittingBets[cardId];
    const submissionId = isPrediction ? id : id;

    const getButtonText = () => {
      if (isSubmitting) return 'Submitting...';
      if (gameStarted) return 'Game Started';
      return isPrediction ? 'Update bet' : 'Submit bet';
    };

    const handleSubmit = () => {
      const team1Score = document.getElementById(`team1-score-${cardId}`).value;
      const team2Score = document.getElementById(`team2-score-${cardId}`).value;

      if (!validateScores(team1Score, team2Score, cardId)) {
        return;
      }

      const isHidden = document.getElementById(`hidden-${cardId}`).checked;

      handlePredictionSubmit(
        isPrediction ? id : null,
        team1Score,
        team2Score,
        start_time,
        isPrediction ? game_id : id,
        isHidden,
        item.tournament_id
      );
    };

    return (
      <div key={cardId} className={`prediction-card ${cardClass}`}>
        <h3 className="tournament-name">
          <span>{tournament_name}</span>
          <br />
          <br />
          <span className="game-date">[ {formatDateTime(start_time)} ]</span>
        </h3>
        <div className="match-info">
          <div className="team">{team1}</div>
          <span className="vs">vs</span>
          <div className="team">{team2}</div>
        </div>
        <div className="prediction-input">
          <input
            type="number"
            min="0"
            max="99"
            placeholder="0"
            id={`team1-score-${cardId}`}
            className="score-input"
            defaultValue={isPrediction ? team1_score : ''}
            aria-label={`Score for ${team1}`}
          />
          <span className="separator">:</span>
          <input
            type="number"
            min="0"
            max="99"
            placeholder="0"
            id={`team2-score-${cardId}`}
            className="score-input"
            defaultValue={isPrediction ? team2_score : ''}
            aria-label={`Score for ${team2}`}
          />
        </div>
        {errors[cardId] && <div className="error-message" role="alert">{errors[cardId]}</div>}
        <div className="prediction-actions">
          <div className="hidden-checkbox">
            <input
                type="checkbox"
                id={`hidden-${cardId}`}
                defaultChecked={hidden}
                onChange={(e) => handleHiddenChange(cardId, e.target.checked)}
            />
            <label htmlFor={`hidden-${cardId}`}>hidden</label>
          </div>
          <button
              id={`submit-button-${submissionId}`}
              className={`submit-prediction ${gameStarted ? 'game-started' : ''}`}
              onClick={handleSubmit}
              disabled={isSubmitting || gameStarted}
          >
              {getButtonText()}
          </button>

          {errors[submissionId] && (
            <div className={`message ${errors[submissionId].includes('successfully') ? 'success' : 'error'}`} role="alert">
              {errors[submissionId]}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="header-container">
        <h1>MY ACCOUNT</h1>
        <div>
          <a href="/" className="back-button">BACK TO MAIN</a>
          {!isAuthenticated && (
            <Link to="/signin" className="login-button">LOGIN</Link>
          )}
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
        <select
            id="upcoming-tournament-select"
            className="tournament-account-select"
            onChange={handleUpcomingTournamentChange}
            value={selectedUpcomingTournament === null ? "" : selectedUpcomingTournament}
        >
          <option value="">All Tournaments</option>
          {tournaments.map(tournament => (
              <option key={tournament.id} value={tournament.id}>{tournament.name}</option>
          ))}
        </select>
        <div className="predictions-grid">
          {sortPredictions(filterUpcomingPredictions()).map(item =>
              renderPredictionCard(item)
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