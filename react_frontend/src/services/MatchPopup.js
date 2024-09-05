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

  const sortedEvents = [
    ...matchData.goals.map(goal => ({
      ...goal,
      type: 'goal',
      time: goal.minute
    })),
    ...matchData.bookings.map(booking => ({
      ...booking,
      type: 'booking',
      time: booking.minute
    })),
    ...matchData.substitutions.map(sub => ({
      ...sub,
      type: 'substitution',
      time: sub.minute
    }))
  ].sort((a, b) => a.time - b.time);

  const getTeamEmblem = (teamId) => {
    if (teamId === matchData.homeTeam.id) return matchData.homeTeam.crest;
    if (teamId === matchData.awayTeam.id) return matchData.awayTeam.crest;
    return null;
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
          {sortedEvents.map((event, index) => (
            <div key={`event-${index}`} className={`event ${event.type}`}>
              <span className="event-time">{event.time}'</span>
              <span className="event-description">
                {event.type === 'goal' && (
                  <>
                    ⚽ Goal: {event.scorer.name}
                    <span className="team-name">
                      <img src={getTeamEmblem(event.team.id)} alt={event.team.name} className="event-team-emblem"/>
                      {event.team.name}
                    </span>
                    {event.assist && <span className="assist"> - Assist: {event.assist.name}</span>}
                  </>
                )}
                {event.type === 'booking' && (
                  <>
                    {event.card === 'YELLOW' ? '🟨' : '🟥'} {event.player.name}
                    <span className="team-name">
                      <img src={getTeamEmblem(event.team.id)} alt={event.team.name} className="event-team-emblem"/>
                      {event.team.name}
                    </span>
                  </>
                )}
                {event.type === 'substitution' && (
                  <>
                    🔄 <span
                        className="event-out">{event.playerOut.name}</span> ⬇️ <span
                        className="event-in">{event.playerIn.name}</span> ⬆️
                    <span className="team-name">
                      <img src={getTeamEmblem(event.team.id)} alt={event.team.name} className="event-team-emblem"/>
                      {event.team.name}
                    </span>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatchPopup;