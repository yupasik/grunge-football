import React from 'react';
import './MatchPopup.css';

const MatchPopup = ({ matchData, onClose }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    date.setHours(date.getHours());

    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Moscow'
    };
    return date.toLocaleString('en-GB', options) + ' MSK';
  };

  return (
    <div className="match-popup-overlay" onClick={onClose}>
      <div className="match-popup" onClick={e => e.stopPropagation()}>
        <div className="match-header">
          <div className="team-popup home-team">
            <div className="team-emblem-container">
              <img src={matchData.homeTeam.crest} alt={matchData.homeTeam.name} className="team-emblem"/>
            </div>
            <h2>{matchData.homeTeam.shortName}</h2>
          </div>
          <div className="score">
            <span className="score-value">{matchData.score.fullTime.home}</span>
            <span className="score-separator"> - </span>
            <span className="score-value">{matchData.score.fullTime.away}</span>
          </div>
          <div className="team-popup away-team">
            <div className="team-emblem-container">
              <img src={matchData.awayTeam.crest} alt={matchData.awayTeam.name} className="team-emblem"/>
            </div>
            <h2>{matchData.awayTeam.shortName}</h2>
          </div>
        </div>
        <br/>
        <div className="match-info">
          <p><strong>Date:</strong> {formatDate(matchData.utcDate)}</p>
          <p><strong>Stadium:</strong> {matchData.venue}</p>
          <p><strong>Referee:</strong> {matchData.referees[0]?.name}</p>
        </div>
        <div className="match-events">
          <h3>MATCH EVENTS</h3>
          {matchData.goals.map((goal, index) => (
              <div key={`goal-${index}`} className="event goal">
                <span className="event-time">{goal.minute}'</span>
                <span className="event-description">
                ⚽ Goal: {goal.scorer.name} ({goal.team.name})
                  {goal.assist && <span className="assist"> - Assist: {goal.assist.name}</span>}
              </span>
              </div>
          ))}
          {matchData.bookings.map((booking, index) => (
              <div key={`booking-${index}`} className="event booking">
                <span className="event-time">{booking.minute}'</span>
                <span className="event-description">
                {booking.card === 'YELLOW' ? '🟨' : '🟥'} {booking.player.name} ({booking.team.name})
              </span>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatchPopup;