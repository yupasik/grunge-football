import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API_URL = 'http://localhost:8000/api';

const Dashboard = () => {
  const [games, setGames] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [newGame, setNewGame] = useState({ tournament_id: '', team1: '', team2: '', start_time: '' });
  const [newTournament, setNewTournament] = useState({ name: '', logo: null });

  useEffect(() => {
    fetchGames();
    fetchTournaments();
  }, []);

  const fetchGames = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      };
      const response = await axios.get(`${API_URL}/games`, config);
      setGames(response.data);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const fetchTournaments = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      };
      const response = await axios.get(`${API_URL}/tournaments`, config);
      setTournaments(response.data);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  const handleAddGame = async (e) => {
    e.preventDefault();
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      };
      await axios.post(`${API_URL}/games`, newGame, config);
      setNewGame({ tournament_id: '', team1: '', team2: '', start_time: '' });
      fetchGames();
    } catch (error) {
      console.error('Error adding game:', error);
    }
  };

  const handleAddTournament = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', newTournament.name);
      formData.append('logo', newTournament.logo);

      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'multipart/form-data'
        }
      };
      await axios.post(`${API_URL}/tournaments`, formData, config);
      setNewTournament({ name: '', logo: null });
      fetchTournaments();
    } catch (error) {
      console.error('Error adding tournament:', error);
    }
  };

  const handleFinishGame = async (gameId) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      };
      await axios.post(`${API_URL}/games/${gameId}/finish`, {}, config);
      fetchGames();
    } catch (error) {
      console.error('Error finishing game:', error);
    }
  };

  const handleFinishTournament = async (tournamentId) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      };
      await axios.post(`${API_URL}/tournaments/${tournamentId}/finish`, {}, config);
      fetchTournaments();
    } catch (error) {
      console.error('Error finishing tournament:', error);
    }
  };

  return (
    <div className="container">
      <div className="header-container">
        <h1>ADMIN DASHBOARD</h1>
        <a href="/account" className="back-button">BACK TO ACCOUNT</a>
      </div>

      <div className="admin-section">
        <h2>MANAGE GAMES</h2>
        <div className="admin-form">
          <h3>Add New Game</h3>
          <form onSubmit={handleAddGame}>
            <div className="form-group">
              <label htmlFor="game-tournament">Tournament:</label>
              <select
                id="game-tournament"
                name="game-tournament"
                value={newGame.tournament_id}
                onChange={(e) => setNewGame({...newGame, tournament_id: e.target.value})}
                required
              >
                <option value="">Select Tournament</option>
                {tournaments.map(tournament => (
                  <option key={tournament.id} value={tournament.id}>{tournament.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="team1">Team 1:</label>
              <input
                type="text"
                id="team1"
                name="team1"
                value={newGame.team1}
                onChange={(e) => setNewGame({...newGame, team1: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="team2">Team 2:</label>
              <input
                type="text"
                id="team2"
                name="team2"
                value={newGame.team2}
                onChange={(e) => setNewGame({...newGame, team2: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="game-datetime">Game Date and Time:</label>
              <input
                type="datetime-local"
                id="game-datetime"
                name="game-datetime"
                value={newGame.start_time}
                onChange={(e) => setNewGame({...newGame, start_time: e.target.value})}
                required
              />
            </div>
            <button type="submit">Add Game</button>
          </form>
        </div>
        <div className="game-list">
          <h3>Upcoming Games</h3>
          {games.map(game => (
            <div key={game.id} className="game-item">
              <div className="game-details">
                <div className="game-tournament">{game.tournament_name}</div>
                <div className="game-teams">
                  <span>{game.team1}</span>
                  <span>vs</span>
                  <span>{game.team2}</span>
                </div>
                <div className="game-datetime">{new Date(game.start_time).toLocaleString()}</div>
              </div>
              <div className="game-actions">
                <button className="finish-button" onClick={() => handleFinishGame(game.id)}>FINISH</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="divider"></div>

      <div className="admin-section">
        <h2>MANAGE TOURNAMENTS</h2>
        <div className="admin-form">
          <h3>Add New Tournament</h3>
          <form onSubmit={handleAddTournament}>
            <div className="form-group">
              <label htmlFor="tournament-name">Tournament Name:</label>
              <input
                type="text"
                id="tournament-name"
                name="tournament-name"
                value={newTournament.name}
                onChange={(e) => setNewTournament({...newTournament, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="tournament-logo">Tournament Logo:</label>
              <input
                type="file"
                id="tournament-logo"
                name="tournament-logo"
                accept="image/*"
                onChange={(e) => setNewTournament({...newTournament, logo: e.target.files[0]})}
                required
              />
            </div>
            <button type="submit">Add Tournament</button>
          </form>
        </div>
        <div className="tournament-list">
          <h3>Existing Tournaments</h3>
          <div className="tournament-category">
            <h4>CURRENT TOURNAMENTS</h4>
            {tournaments.filter(t => !t.finished).map(tournament => (
              <div key={tournament.id} className="tournament-item">
                <span className="tournament-name">{tournament.name}</span>
                <button className="finish-button" onClick={() => handleFinishTournament(tournament.id)}>FINISH</button>
              </div>
            ))}
          </div>
          <div className="tournament-category">
            <h4>FINISHED TOURNAMENTS</h4>
            {tournaments.filter(t => t.finished).map(tournament => (
              <div key={tournament.id} className="tournament-item">
                <span className="tournament-name">{tournament.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;