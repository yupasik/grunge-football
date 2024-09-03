import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MatchPopup from './MatchPopup';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const LiveMatchWidget = ({ matchId }) => {
  const [matchData, setMatchData] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/data/matches/${matchId}`);
        setMatchData(response.data);
      } catch (error) {
        console.error('Error fetching match data:', error);
      }
    };

    fetchMatchData();
    const interval = setInterval(fetchMatchData, 60000); // Обновляем данные каждую минуту

    return () => clearInterval(interval);
  }, [matchId]);

  if (!matchData) return <div>Loading...</div>;

  return (
    <>
      <div className="live-match-widget" onClick={() => setShowPopup(true)}>
        <h3>{matchData.homeTeam.shortName} vs {matchData.awayTeam.shortName}</h3>
        <div className="match-score">
          {matchData.score.fullTime.home} - {matchData.score.fullTime.away}
        </div>
        <div className="match-time">
          {matchData.minute}'
        </div>
      </div>
      {showPopup && (
        <MatchPopup matchData={matchData} onClose={() => setShowPopup(false)} />
      )}
    </>
  );
};

export default LiveMatchWidget;