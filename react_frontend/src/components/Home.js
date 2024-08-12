import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Home.css';

const API_URL = 'http://localhost:8000/api';

function Home() {
  const [tournaments, setTournaments] = useState([]);
  const [currentTournamentId, setCurrentTournamentId] = useState(null);
  const [tournamentData, setTournamentData] = useState(null);
  const [isSortedByPoints, setIsSortedByPoints] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (currentTournamentId) {
      fetchTournamentData(currentTournamentId);
    }
  }, [currentTournamentId]);

  const fetchTournaments = async () => {
    try {
      const response = await axios.get(`${API_URL}/tournaments`);
      setTournaments(response.data);
      if (response.data.length > 0) {
        setCurrentTournamentId(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  const fetchTournamentData = async (tournamentId) => {
    try {
      const response = await axios.get(`${API_URL}/tournaments/${tournamentId}`);
      setTournamentData(response.data);
    } catch (error) {
      console.error('Error fetching tournament data:', error);
    }
  };

  const formatDateTime = (dateTimeString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateTimeString).toLocaleDateString('en-GB', options);
  };

  const calculateTotalPoints = (userId) => {
    if (!tournamentData || !tournamentData.games) return 0;
    return tournamentData.games.reduce((total, game) => {
      const bet = game.bets.find(b => b.owner_id === userId);
      return total + (bet ? bet.points : 0);
    }, 0);
  };

  const getParticipants = () => {
    if (!tournamentData || !tournamentData.games) return [];
    const participantSet = new Set();
    tournamentData.games.forEach(game => {
      game.bets.forEach(bet => {
        participantSet.add(bet.owner_id);
      });
    });
    return Array.from(participantSet).map(id => ({ id, username: `User ${id}` }));
  };

  const sortParticipantsByTotalPoints = () => {
    const participants = getParticipants();
    return participants.sort((a, b) => calculateTotalPoints(b.id) - calculateTotalPoints(a.id));
  };

  const sortParticipantsAlphabetically = () => {
    const participants = getParticipants();
    return participants.sort((a, b) => a.username.localeCompare(b.username));
  };

  const findLeader = () => {
    const participants = getParticipants();
    let maxPoints = -1;
    let leaderId = null;
    participants.forEach(participant => {
      const points = calculateTotalPoints(participant.id);
      if (points > maxPoints) {
        maxPoints = points;
        leaderId = participant.id;
      }
    });
    return leaderId;
  };

  const toggleSort = () => {
    setIsSortedByPoints(!isSortedByPoints);
  };

  const handleTournamentChange = (e) => {
    setCurrentTournamentId(parseInt(e.target.value));
    setIsSortedByPoints(false);
  };

  const renderPredictionsTable = () => {
    if (!tournamentData || !tournamentData.games) return null;

    const sortedParticipants = isSortedByPoints
      ? sortParticipantsByTotalPoints()
      : sortParticipantsAlphabetically();

    const leaderId = findLeader();

    return (
      <div className="predictions-table-container">
        <table className="predictions-table">
          <thead>
            <tr>
              <th>DATE & TIME</th>
              <th>GAME</th>
              <th>ACTUAL SCORE</th>
              {sortedParticipants.map(participant => (
                <th
                  key={participant.id}
                  data-participant-id={participant.id}
                  className={participant.id === leaderId ? 'leader-column' : ''}
                >
                  {participant.username}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tournamentData.games.map(game => (
              <tr key={game.id} className={game.finished ? '' : 'future-match'}>
                <td data-label="DATE & TIME">{formatDateTime(game.start_time)}</td>
                <td data-label="GAME">{`${game.team1} vs ${game.team2}`}</td>
                <td data-label="ACTUAL SCORE">
                  {game.finished ? `${game.team1_score}-${game.team2_score}` : 'TBD'}
                </td>
                {sortedParticipants.map(participant => {
                  const bet = game.bets.find(b => b.owner_id === participant.id);
                  let predictionClass = bet ? (bet.points === 3 ? 'correct-prediction' : 'incorrect-prediction') : 'no-bet';
                  return (
                    <td
                      key={participant.id}
                      data-label={participant.username}
                      className={`${predictionClass} ${participant.id === leaderId ? 'leader-column' : ''}`}
                    >
                      {bet ? `${bet.team1_score}-${bet.team2_score} (${bet.points})` : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="total-points">
              <td colSpan={3}>TOTAL POINTS</td>
              {sortedParticipants.map(participant => (
                <td
                  key={participant.id}
                  className={participant.id === leaderId ? 'leader-column' : ''}
                >
                  {calculateTotalPoints(participant.id)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="header-container">
        <h1>GRUNGE FOOTBALL PREDICTIONS</h1>
        <a href="/account" className="account-button">MY ACCOUNT</a>
      </div>

      <div className="football-banner">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="grass" patternUnits="userSpaceOnUse" width="10" height="10">
              <path d="M0 0L10 10M10 0L0 10" stroke="#2a2a2a" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect x="50" y="20" width="1100" height="160" fill="url(#grass)"/>
          <rect x="50" y="20" width="1100" height="160" fill="none" stroke="#ddd" strokeWidth="4"/>
          <line x1="600" y1="20" x2="600" y2="180" stroke="#ddd" strokeWidth="2"/>
          <circle cx="600" cy="100" r="50" fill="none" stroke="#ddd" strokeWidth="2"/>
          <rect x="30" y="60" width="20" height="80" fill="#ff3333"/>
          <rect x="1150" y="60" width="20" height="80" fill="#ff3333"/>
          <rect x="50" y="60" width="100" height="80" fill="none" stroke="#ddd" strokeWidth="2"/>
          <rect x="1050" y="60" width="100" height="80" fill="none" stroke="#ddd" strokeWidth="2"/>
          <rect x="50" y="40" width="200" height="120" fill="none" stroke="#ddd" strokeWidth="2"/>
          <rect x="950" y="40" width="200" height="120" fill="none" stroke="#ddd" strokeWidth="2"/>
          <g className="flashing-light">
            <circle cx="50" cy="20" r="10" fill="#ff3333"/>
            <circle cx="1150" cy="20" r="10" fill="#ff3333"/>
            <circle cx="50" cy="180" r="10" fill="#ff3333"/>
            <circle cx="1150" cy="180" r="10" fill="#ff3333"/>
          </g>
          <text x="600" y="100" fontFamily="Special Elite, cursive" fontSize="48" fill="#ff3333" textAnchor="middle" dominantBaseline="middle">PREDICT & WIN</text>
        </svg>
      </div>

      <div className="controls">
        <div className="tournament-select-container">
          <img
            className="tournament-logo"
            src={tournamentData ? tournamentData.logo : ''}
            alt="Tournament logo"
          />
          <select
            className="tournament-select"
            value={currentTournamentId || ''}
            onChange={handleTournamentChange}
          >
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <button className="sort-button" onClick={toggleSort}>
          {isSortedByPoints ? 'SORT ALPHABETICALLY' : 'SORT BY POINTS'}
        </button>
      </div>

      {renderPredictionsTable()}
    </div>
  );
}

export default Home;