import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API_URL = 'http://localhost:8000/api';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('games');
  const [games, setGames] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      };
      const [gamesResponse, tournamentsResponse, usersResponse] = await Promise.all([
        axios.get(`${API_URL}/games?finished=false`, config),
        axios.get(`${API_URL}/tournaments?finished=false`, config),
        axios.get(`${API_URL}/users`, config)
      ]);
      setGames(gamesResponse.data);
      setTournaments(tournamentsResponse.data);
      setUsers(usersResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const GamesManagement = () => {
    const [showCreateGame, setShowCreateGame] = useState(false);

    const handleDeleteGame = async (gameId) => {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      };
      if (window.confirm('Are you sure you want to delete this game?')) {
        try {
          await axios.delete(`${API_URL}/games/${gameId}`, config);
          fetchData();
        } catch (error) {
          console.error('Error deleting game:', error);
        }
      }
    };

    const handleFinishGame = async (gameId) => {
      if (window.confirm('Are you sure you want to finish this game?')) {
        const config = {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
        };
        try {
          await axios.post(`${API_URL}/games/${gameId}/finish`, config);
          fetchData();
        } catch (error) {
          console.error('Error finishing game:', error);
        }
      }
    };

    const handleUpdateScore = async (gameId) => {
      const team1ScoreInput = document.getElementById(`team1-score-${gameId}`);
      const team2ScoreInput = document.getElementById(`team2-score-${gameId}`);
      const team1Score = team1ScoreInput.value;
      const team2Score = team2ScoreInput.value;
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      };
      try {
        await axios.put(`${API_URL}/games/${gameId}`, {
          team1_score: parseInt(team1Score),
          team2_score: parseInt(team2Score)
        }, config);
        fetchData();
      } catch (error) {
        console.error('Error updating game score:', error);
      }
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day} ${month} ${year} ${hours}:${minutes}`;
    };

    const sortedGames = [...games].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    return (
      <div className="games-management">
        <button className="create-button" onClick={() => setShowCreateGame(true)}>Create New Game</button>
        <div className="games-grid">
          {sortedGames.map(game => (
            <div key={game.id} className="game-card">
              <div className="game-header">
                <h3>{game.tournament_name} - {game.title}</h3>
                <p>{formatDate(game.start_time)}</p>
              </div>
              <div className="game-teams">
                <div className="team">{game.team1}</div>
                <div className="vs">vs</div>
                <div className="team">{game.team2}</div>
              </div>
              <div className="game-score">
                <input
                  type="number"
                  id={`team1-score-${game.id}`}
                  defaultValue={game.team1_score}
                />
                <span>:</span>
                <input
                  type="number"
                  id={`team2-score-${game.id}`}
                  defaultValue={game.team2_score}
                />
              </div>
              <div className="game-actions">
                <button onClick={() => handleUpdateScore(game.id)}>UPDATE SCORE</button>
                <button onClick={() => handleDeleteGame(game.id)}>DELETE</button>
                {!game.is_finished && (
                  <button onClick={() => handleFinishGame(game.id)}>FINISH GAME</button>
                )}
              </div>
            </div>
          ))}
        </div>
        {showCreateGame && (
          <CreateGameForm
            onClose={() => setShowCreateGame(false)}
            fetchData={fetchData}
            tournaments={tournaments}
          />
        )}
      </div>
    );
  };

  const TournamentsManagement = () => {
    const [showCreateTournament, setShowCreateTournament] = useState(false);

    const handleDeleteTournament = async (tournamentId) => {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      };
      if (window.confirm('Are you sure you want to delete this tournament?')) {
        try {
          await axios.delete(`${API_URL}/tournaments/${tournamentId}`, config);
          fetchData();
        } catch (error) {
          console.error('Error deleting tournament:', error);
        }
      }
    };

    const handleFinishTournament = async (tournamentId) => {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      };
      if (window.confirm('Are you sure you want to finish this tournament?')) {
        try {
          await axios.post(`${API_URL}/tournaments/${tournamentId}/finish`, config);
          fetchData();
        } catch (error) {
          console.error('Error finishing tournament:', error);
        }
      }
    };

    return (
        <div className="tournaments-management">
          <button className="create-button" onClick={() => setShowCreateTournament(true)}>Create New Tournament</button>
          <div className="tournaments-grid">
            {tournaments.map(tournament => (
                <div key={tournament.id} className="tournament-card">
                  <div className="tournament-header">
                    <div className="tournament-logo-container">
                      <img src={tournament.logo} alt={tournament.name} className="tournament-logo"/>
                    </div>
                    <h3 className="tournament-name">{tournament.name}</h3>
                  </div>
                  <div className="tournament-actions">
                    <button onClick={() => handleDeleteTournament(tournament.id)}>DELETE</button>
                    <button onClick={() => handleFinishTournament(tournament.id)}>FINISH TOURNAMENT</button>
                  </div>
                </div>
            ))}
          </div>
          {showCreateTournament &&
              <CreateTournamentForm onClose={() => setShowCreateTournament(false)} fetchData={fetchData}/>}
        </div>
    );
  };

  const UsersManagement = () => {
    const handleToggleActive = async (userId, isActive) => {
      const config = {
        headers: {Authorization: `Bearer ${localStorage.getItem('access_token')}`}
      };
      try {
        await axios.put(`${API_URL}/users/${userId}`, {is_active: isActive}, config);
        fetchData();
      } catch (error) {
        console.error('Error updating user:', error);
      }
    };

    const handleToggleAdmin = async (userId, isAdmin) => {
      const config = {
        headers: {Authorization: `Bearer ${localStorage.getItem('access_token')}`}
      };
      console.log(isAdmin);
      try {
          await axios.put(`${API_URL}/users/${userId}`, { is_admin: isAdmin }, config);
          fetchData();
        } catch (error) {
          console.error('Error updating user:', error);
        }
      };

    return (
      <div className="users-management">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Active</th>
              <th>Admin</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <label className="switch">
                      <input
                          type="checkbox"
                          checked={user.is_active}
                          onChange={() => handleToggleActive(user.id, !user.is_active)}
                      />
                      <span className="slider round"></span>
                  </label>
                </td>
                  <td>
                  <label className="switch">
                      <input
                          type="checkbox"
                          checked={user.is_admin}
                          onChange={() => handleToggleAdmin(user.id, !user.is_admin)}
                      />
                      <span className="slider round"></span>
                  </label>
                  </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const CreateGameForm = ({ onClose, fetchData }) => {
    const [formData, setFormData] = useState({
      title: '',
      start_time: '',
      team1: '',
      team2: '',
      tournament_id: ''
    });

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const config = {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    };
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await axios.post(`${API_URL}/games`, formData, config);
        fetchData();
        onClose();
      } catch (error) {
        console.error('Error creating game:', error);
      }
    };

    return (
      <div className="modal">
        <div className="modal-content">
          <h2>Create New Game</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Title"
              required
            />
            <input
              type="datetime-local"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="team1"
              value={formData.team1}
              onChange={handleChange}
              placeholder="Team 1"
              required
            />
            <input
              type="text"
              name="team2"
              value={formData.team2}
              onChange={handleChange}
              placeholder="Team 2"
              required
            />
            <select
              name="tournament_id"
              value={formData.tournament_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Tournament</option>
              {tournaments.map(tournament => (
                <option key={tournament.id} value={tournament.id}>{tournament.name}</option>
              ))}
            </select>
            <button type="submit">Create Game</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </form>
        </div>
      </div>
    );
  };

  const CreateTournamentForm = ({ onClose, fetchData }) => {
    const [formData, setFormData] = useState({
      name: '',
      logo: ''
    });

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const config = {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    };
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await axios.post(`${API_URL}/tournaments`, formData, config);
        fetchData();
        onClose();
      } catch (error) {
        console.error('Error creating tournament:', error);
      }
    };

    return (
      <div className="modal">
        <div className="modal-content">
          <h2>Create New Tournament</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Tournament Name"
              required
            />
            <input
              type="text"
              name="logo"
              value={formData.logo}
              onChange={handleChange}
              placeholder="Logo URL"
              required
            />
            <button type="submit">Create Tournament</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="header-container">
        <h1>ADMIN DASHBOARD</h1>
        <a href="/" className="back-button">BACK TO MAIN</a>
      </div>

      <div className="tab-container">
        <button
          className={`tab-button ${activeTab === 'games' ? 'active' : ''}`}
          onClick={() => setActiveTab('games')}
        >
          Games
        </button>
        <button
          className={`tab-button ${activeTab === 'tournaments' ? 'active' : ''}`}
          onClick={() => setActiveTab('tournaments')}
        >
          Tournaments
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </div>

      {activeTab === 'games' && <GamesManagement />}
      {activeTab === 'tournaments' && <TournamentsManagement />}
      {activeTab === 'users' && <UsersManagement />}
    </div>
  );
};

export default Dashboard;