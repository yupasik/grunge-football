import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';
import {isBefore, parseISO} from "date-fns";

const API_URL = '/api';
const SORT_BY_POINTS = 'SORT BY POINTS';
const SORT_ALPHABETICALLY = 'SORT ALPHABETICALLY';
const MOSCOW_TIMEZONE_OFFSET = 3; // Moscow is UTC+3

function Home() {
    const [tournaments, setTournaments] = useState([]);
    const [currentTournamentId, setCurrentTournamentId] = useState(null);
    const [tournamentData, setTournamentData] = useState(null);
    const [isSortedByPoints, setIsSortedByPoints] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        fetchTournaments();
        checkAuthentication();
    }, []);

    useEffect(() => {
        if (currentTournamentId) {
            fetchTournamentData(currentTournamentId);
        }
    }, [currentTournamentId]);

    const fetchTournaments = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}/tournaments`);
            setTournaments(response.data);
            if (response.data.length > 0) {
                setCurrentTournamentId(response.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching tournaments:', error);
            setError('An error occurred while fetching tournaments. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTournamentData = async (tournamentId) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}/tournaments/${tournamentId}`);
            setTournamentData(response.data);
        } catch (error) {
            console.error('Error fetching tournament data:', error);
            setError('An error occurred while fetching tournament data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const checkAuthentication = () => {
        const token = localStorage.getItem('access_token');
        setIsAuthenticated(!!token);
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

    const isGameStarted = (game) => {
      const moscowTime = getMoscowTime();
      return isBefore(parseISO(game.start_time), moscowTime) && !game.finished;
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
        const participantMap = new Map();
        tournamentData.games.forEach(game => {
            game.bets.forEach(bet => {
                if (!participantMap.has(bet.owner_id)) {
                    participantMap.set(bet.owner_id, { id: bet.owner_id, username: bet.owner_name || `User ${bet.owner_id}` });
                }
            });
        });
        return Array.from(participantMap.values());
    };

    const sortParticipantsByTotalPoints = (participants) => {
        return [...participants].sort((a, b) => calculateTotalPoints(b.id) - calculateTotalPoints(a.id));
    };

    const sortParticipantsAlphabetically = (participants) => {
        return [...participants].sort((a, b) => a.username.localeCompare(b.username));
    };

    const findLeader = (participants) => {
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

    const debouncedHandleTournamentChange = useMemo(
        () => debounce((value) => {
            setCurrentTournamentId(parseInt(value));
            setIsSortedByPoints(false);
        }, 300),
        []
    );

    const participants = useMemo(() => getParticipants(), [tournamentData]);
    const sortedParticipants = useMemo(() =>
        isSortedByPoints ? sortParticipantsByTotalPoints(participants) : sortParticipantsAlphabetically(participants),
        [participants, isSortedByPoints]
    );
    const leaderId = useMemo(() => findLeader(participants), [participants]);

    const renderPredictionsTable = () => {
        if (!tournamentData || !tournamentData.games) return null;

        return (
            <div className="predictions-table-container">
                <table className="predictions-table">
                    <thead>
                        <tr>
                            <th>DATE & TIME</th>
                            <th>GAME</th>
                            <th>SCORE</th>
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
                        {tournamentData.games
                            .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                            .map(game => {
                                const gameStarted = isGameStarted(game);
                                return (
                                    <tr key={game.id} className={gameStarted ? 'current-match' : (!game.finished ? 'future-match' : '')}>
                                        <td data-label="DATE & TIME">{formatDateTime(game.start_time)} MSK</td>
                                        <td data-label="GAME">
                                            {game.team1?.toUpperCase() || 'TBA'} <span
                                            className="vs">vs</span> {game.team2?.toUpperCase() || 'TBA'}
                                        </td>
                                        <td data-label="SCORE" className={gameStarted ? 'live-score' : ''}>
                                        {game.finished || gameStarted ? `${game.team1_score}-${game.team2_score}` : '—'}
                                        </td>
                                        {sortedParticipants.map(participant => {
                                            const bet = game.bets.find(b => b.owner_id === participant.id);
                                            let predictionClass = 'no-bet';
                                            if (bet) {
                                            if (game.finished) {
                                                if (bet.points === 1) predictionClass = 'correct-prediction';
                                                else if (bet.points === 3) predictionClass = 'diff-prediction';
                                                else if (bet.points === 5) predictionClass = 'exact-prediction';
                                                else predictionClass = 'incorrect-prediction';
                                            } else if (gameStarted) {
                                                predictionClass = 'pending-prediction';
                                            }
                                        }
                                            return (
                                                <td
                                                    key={participant.id}
                                                    data-label={participant.username}
                                                    className={`${predictionClass} ${participant.id === leaderId ? 'leader-column' : ''}`}
                                                >
                                                    {bet ? `${bet.team1_score}-${bet.team2_score}${game.finished ? ` (${bet.points})` : ''}` : '-'}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
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
                <h1>FOOTBALL PREDICTIONS</h1>
                {isAuthenticated ? (
                    <Link to="/account" className="account-button">MY ACCOUNT</Link>
                ) : (
                    <>
                        <Link to="/signin" className="login-button">LOGIN</Link>
                        <Link to="/signup" className="login-button">REGISTER</Link>
                    </>
                )}
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
                    <div className="tournament-logo-container">
                        <img
                            className="tournament-logo"
                            src={tournamentData ? tournamentData.logo : ''}
                            alt="Tournament logo"
                            aria-label={tournamentData ? `Logo of ${tournamentData.name}` : 'Tournament logo'}
                        />
                    </div>
                    <select
                        className="tournament-select"
                        value={currentTournamentId || ''}
                        onChange={(e) => debouncedHandleTournamentChange(e.target.value)}
                        aria-label="Select tournament"
                    >
                        {tournaments.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
                <button className="sort-button" onClick={toggleSort} aria-label="Toggle sort order">
                    {isSortedByPoints ? SORT_ALPHABETICALLY : SORT_BY_POINTS}
                </button>
            </div>

            {isLoading && <p>Loading...</p>}
            {error && <p className="error">{error}</p>}
            {!isLoading && !error && renderPredictionsTable()}
        </div>
    );
}

Home.propTypes = {
    // Add props here if any
};

export default Home;
