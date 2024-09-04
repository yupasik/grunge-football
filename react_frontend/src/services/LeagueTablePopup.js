import React, { useRef, useEffect, useState } from 'react';
import './LeagueTablePopup.css';

const LeagueTablePopup = ({ standings, seasonInfo, tournamentInfo, scorers, onClose }) => {

  const popupRef = useRef(null);
  const [activeTab, setActiveTab] = useState('standings');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  const renderScorersTable = () => (
    <table className="scorers-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Player</th>
          <th>Team</th>
          <th>Goals</th>
          <th>Assists</th>
          <th>Penalties</th>
        </tr>
      </thead>
      <tbody>
        {scorers.map((scorer, index) => (
          <tr key={scorer.player.id}>
            <td>{index + 1}</td>
            <td>{scorer.player.name}</td>
            <td>
              <img src={scorer.team.crest} alt={scorer.team.name} className="team-crest" />
              {scorer.team.shortName}
            </td>
            <td>{scorer.goals}</td>
            <td>{scorer.assists || '-'}</td>
            <td>{scorer.penalties || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="league-table-overlay">
        <div className="league-table-popup">
            <div className="tournament-header-table">
                {tournamentInfo.logo && (
                    <img src={tournamentInfo.logo} alt={`${tournamentInfo.name} logo`}
                         className="tournament-logo-table"/>
                )}
                <h2>{tournamentInfo.name}</h2>
            </div>

            <div className="season-info">
                <p><strong>Current Matchday:</strong> {seasonInfo.currentMatchday}</p>
                <p><strong>Start Date:</strong> {new Date(seasonInfo.startDate).toLocaleDateString()}</p>
                <p><strong>End Date:</strong> {new Date(seasonInfo.endDate).toLocaleDateString()}</p>
            </div>

            <div className="tabs-popup">
                <button
                    className={`tab-button-popup ${activeTab === 'standings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('standings')}
                >
                    Standings
                </button>
                <button
                    className={`tab-button-popup ${activeTab === 'scorers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('scorers')}
                >
                    Top Scorers
                </button>
            </div>

            <div className="table-container">
                {activeTab === 'standings' ? (
                    <table className="league-table">
                        <thead>
                        <tr>
                            <th>Position</th>
                            <th>Team</th>
                            <th>Played</th>
                            <th>Won</th>
                            <th>Draw</th>
                            <th>Lost</th>
                            <th>Goal Diff</th>
                            <th>Points</th>
                        </tr>
                        </thead>
                        <tbody>
                        {standings.map((team) => (
                            <tr key={team.team.id}>
                                <td>{team.position}</td>
                                <td className="team-name-table">
                                    <img src={team.team.crest} alt={team.team.name} className="team-crest"/>
                                    <span className="team-short-name">{team.team.shortName}</span>
                                </td>
                                <td>{team.playedGames}</td>
                                <td>{team.won}</td>
                                <td>{team.draw}</td>
                                <td>{team.lost}</td>
                                <td>{team.goalDifference}</td>
                                <td className="points">{team.points}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    renderScorersTable()
                )}
            </div>
            <button className="close-button-table" onClick={onClose}>Close</button>
        </div>
    </div>
  );
};

export default LeagueTablePopup;