import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const LiveMatchWidget = ({ matchId }) => {
  const [matchData, setMatchData] = useState(null);

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
    <div className="live-match-widget">
      <h3>Live Match</h3>
      <div className="teams">
        <span>{matchData.homeTeam.name}</span>
        <span>{matchData.score.fullTime.home} - {matchData.score.fullTime.away}</span>
        <span>{matchData.awayTeam.name}</span>
      </div>
      <div className="match-info">
        <p>Minute: {matchData.minute}'</p>
        <p>Venue: {matchData.venue}</p>
      </div>
      <div className="recent-events">
        <h4>Recent Events</h4>
        {matchData.goals.slice(-3).reverse().map((goal, index) => (
          <p key={index}>{goal.minute}' Goal: {goal.scorer.name} ({goal.team.name})</p>
        ))}
      </div>
    </div>
  );
};

export default LiveMatchWidget;