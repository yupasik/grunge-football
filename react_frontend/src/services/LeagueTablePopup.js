import React, { useRef, useEffect } from 'react';
import './LeagueTablePopup.css';

const LeagueTablePopup = ({ standings, seasonInfo, tournamentInfo, onClose }) => {

  const popupRef = useRef(null);

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

  return (
    <div className="league-table-overlay">
        <div className="league-table-popup">
            <div className="tournament-header-table">
                {tournamentInfo.logo && (
                    <img src={tournamentInfo.logo} alt={`${tournamentInfo.name} logo`} className="tournament-logo-table"/>
                )}
                <h2>{tournamentInfo.name}</h2>
            </div>

            <div className="season-info">
                <p><strong>Current Matchday:</strong> {seasonInfo.currentMatchday}</p>
                <p><strong>Start Date:</strong> {new Date(seasonInfo.startDate).toLocaleDateString()}</p>
                <p><strong>End Date:</strong> {new Date(seasonInfo.endDate).toLocaleDateString()}</p>
            </div>

            <div className="table-container">
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
            </div>
            <div className="legend">
                <div className="legend-item">
                    <div className="legend-color champions-league"></div>
                    <span>UCL</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color europa-league"></div>
                    <span>UEL</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color relegation"></div>
                    <span>REL</span>
                </div>
            </div>
            <button className="close-button-table" onClick={onClose}>Close</button>
        </div>
    </div>
  );
};

export default LeagueTablePopup;