import React, { useEffect, useState } from 'react';
import './Home.css';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function Home() {
  const [currentTournamentId, setCurrentTournamentId] = useState(null);
  const [isSortedByPoints, setIsSortedByPoints] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [tournaments, setTournaments] = useState([]);

  // Fetch tournaments from the API
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/tournaments')
      .then(response => {
        if (Array.isArray(response.data)) {
          setTournaments(response.data);
          if (response.data.length > 0) {
            setCurrentTournamentId(response.data[0].id);
          }
        } else {
          console.error("Unexpected data format:", response.data);
        }
      })
      .catch(error => {
        console.error('Error fetching tournaments:', error);
      });
  }, []);

  useEffect(() => {
    if (currentTournamentId) {
      const initialParticipants = sortParticipantsAlphabetically(currentTournamentId);
      setParticipants(initialParticipants);
    }
  }, [currentTournamentId]);

  const sortParticipantsByTotalPoints = (tournamentId) => {
    // Your sorting logic here
  };

  const sortParticipantsAlphabetically = (tournamentId) => {
    // Your sorting logic here
  };

  const calculateTotalPoints = (participantId, tournamentId) => {
    // Your calculation logic here
  };

  const toggleSort = () => {
    const sorted = isSortedByPoints ? sortParticipantsAlphabetically(currentTournamentId) : sortParticipantsByTotalPoints(currentTournamentId);
    setParticipants(sorted);
    setIsSortedByPoints(!isSortedByPoints);
  };

  const handleTournamentChange = (e) => {
    setCurrentTournamentId(parseInt(e.target.value));
    setIsSortedByPoints(false);
  };

  return (
    <div className="container">
      <div className="header-container">
        <h1>GRUNGE FOOTBALL PREDICTIONS</h1>
        <a href="/account" className="account-button">MY ACCOUNT</a>
      </div>

      <div className="football-banner">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMid meet">
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
          <text x="50%" y="50%" font-family="Special Elite, cursive" font-size="48" fill="#ff3333" text-anchor="middle"
                dominant-baseline="middle">
            PREDICT & WIN
          </text>
        </svg>
      </div>

      <div className="controls">
        <div className="tournament-select-container">
          <img id="tournamentLogo" className="tournament-logo"
               src={tournaments.length > 0 && currentTournamentId
                   ? tournaments.find(t => t.id === currentTournamentId).logo
                   : ''}
               alt="Tournament logo"/>
          <select id="tournamentSelect" className="tournament-select" value={currentTournamentId || ''}
                  onChange={handleTournamentChange}>
            {Array.isArray(tournaments) && tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <button id="sortButton" className="sort-button" onClick={toggleSort}>
          {isSortedByPoints ? 'SORT ALPHABETICALLY' : 'SORT BY POINTS'}
        </button>
      </div>

      <table className="predictions-table">
        <thead>
          {/* Table head will be rendered here */}
        </thead>
        <tbody>
          {/* Table body will be rendered here */}
        </tbody>
      </table>
    </div>
  );
}

export default Home;
