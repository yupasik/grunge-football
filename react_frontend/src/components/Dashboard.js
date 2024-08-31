import React, { useState, useEffect } from "react";
import { format, parseISO, addHours, isBefore, compareAsc } from "date-fns";
import axios from "axios";
import "./Dashboard.css";
import {Link} from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "/api";
const MOSCOW_TIMEZONE_OFFSET = 3; // Moscow is UTC+3

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("games");
  const [games, setGames] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedTournament, setSelectedTournament] = useState("");

  const getMoscowTime = () => {
    const now = new Date();
    const currentTimeMs = now.getTime();
    const localOffset = now.getTimezoneOffset() * 60 * 1000;
    const utcTimeMs = currentTimeMs + localOffset;
    const moscowTimeMs = utcTimeMs + MOSCOW_TIMEZONE_OFFSET * 60 * 60 * 1000;
    return new Date(moscowTimeMs);
  };

  const isGameStarted = (startTime) => {
    const moscowTime = getMoscowTime();
    return isBefore(parseISO(startTime), moscowTime);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      };
      const [gamesResponse, tournamentsResponse, usersResponse, teamsResponse] =
        await Promise.all([
          axios.get(`${API_URL}/games?finished=false`, config),
          axios.get(`${API_URL}/tournaments?finished=false`, config),
          axios.get(`${API_URL}/users`, config),
          axios.get(`${API_URL}/teams`, config),
        ]);
      setGames(gamesResponse.data);
      setTournaments(tournamentsResponse.data);
      setUsers(usersResponse.data);
      setTeams(teamsResponse.data);
      // Extract unique countries from teams
      const uniqueCountries = [...new Set(teamsResponse.data.map(team => team.area.name))];
      setCountries(uniqueCountries);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const GamesManagement = () => {
    const [showCreateGame, setShowCreateGame] = useState(false);
    const config = {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    };
    const handleDeleteGame = async (gameId) => {
      if (window.confirm("Are you sure you want to delete this game?")) {
        try {
          await axios.delete(`${API_URL}/games/${gameId}`, config);
          fetchData();
        } catch (error) {
          console.error("Error deleting game:", error);
        }
      }
    };

    const handleFinishGame = async (gameId) => {
      if (window.confirm("Are you sure you want to finish this game?")) {
        try {
          await axios.post(
            `${API_URL}/games/finish`,
            { id: parseInt(gameId) },
            config
          );
          fetchData();
        } catch (error) {
          console.error("Error finishing game:", error);
        }
      }
    };

    const handleUpdateScore = async (gameId) => {
      const team1ScoreInput = document.getElementById(`team1-score-${gameId}`);
      const team2ScoreInput = document.getElementById(`team2-score-${gameId}`);
      const team1Score = team1ScoreInput.value;
      const team2Score = team2ScoreInput.value;
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      };
      try {
        await axios.put(
          `${API_URL}/games/${gameId}`,
          {
            team1_score: parseInt(team1Score),
            team2_score: parseInt(team2Score),
          },
          config
        );
        fetchData();
      } catch (error) {
        console.error("Error updating game score:", error);
      }
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${day} ${month} ${year} ${hours}:${minutes}`;
    };

    const sortedGames = [...games].sort(
      (a, b) => new Date(a.start_time) - new Date(b.start_time)
    );

    return (
      <div className="games-management">
        <button
          className="create-button"
          onClick={() => setShowCreateGame(true)}
        >
          Create New Game
        </button>
        <div className="games-grid">
          {sortedGames.map((game) => (
            <div
              key={game.id}
              className={`game-card ${
                isGameStarted(game.start_time) ? "game-card-started" : ""
              }`}
            >
              <div className="game-header">
                <h3>
                  {game.tournament_name} - {game.title}
                </h3>
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
                <button onClick={() => handleUpdateScore(game.id)}>
                  UPDATE SCORE
                </button>
                <button onClick={() => handleDeleteGame(game.id)}>
                  DELETE
                </button>
                {!game.is_finished && (
                  <button onClick={() => handleFinishGame(game.id)}>
                    FINISH GAME
                  </button>
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
    const [editingTournament, setEditingTournament] = useState(null);

    const handleDeleteTournament = async (tournamentId) => {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      };
      if (window.confirm("Are you sure you want to delete this tournament?")) {
        try {
          await axios.delete(`${API_URL}/tournaments/${tournamentId}`, config);
          fetchData();
        } catch (error) {
          console.error("Error deleting tournament:", error);
        }
      }
    };

    const handleFinishTournament = async (tournamentId) => {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      };
      if (window.confirm("Are you sure you want to finish this tournament?")) {
        try {
          await axios.post(
            `${API_URL}/tournaments/${tournamentId}/finish`,
            config
          );
          fetchData();
        } catch (error) {
          console.error("Error finishing tournament:", error);
        }
      }
    };

    const handleEditTournament = (tournament) => {
      setEditingTournament(tournament);
    };

    return (
      <div className="tournaments-management">
        <button
          className="create-button"
          onClick={() => setShowCreateTournament(true)}
        >
          Create New Tournament
        </button>
        <div className="tournaments-grid">
          {tournaments.map((tournament) => (
            <div key={tournament.id} className="tournament-card">
              <div className="tournament-header">
                <div className="tournament-logo-admin-container">
                  <img
                    src={tournament.logo}
                    alt={tournament.name}
                    className="tournament-logo"
                  />
                </div>
                <h3 className="tournament-name">{tournament.name}</h3>
              </div>
              <div className="tournament-actions">
                <button onClick={() => handleEditTournament(tournament)}>EDIT</button>
                <button onClick={() => handleDeleteTournament(tournament.id)}>DELETE</button>
                <button onClick={() => handleFinishTournament(tournament.id)}>FINISH TOURNAMENT</button>
              </div>
            </div>
          ))}
        </div>
        {showCreateTournament && (
          <CreateTournamentForm
            onClose={() => setShowCreateTournament(false)}
            fetchData={fetchData}
          />
        )}
        {editingTournament && (
          <EditTournamentForm
            tournament={editingTournament}
            onClose={() => setEditingTournament(null)}
            fetchData={fetchData}
          />
        )}
      </div>
    );
  };

  const UsersManagement = () => {
    const handleToggleActive = async (userId, isActive) => {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      };
      try {
        await axios.put(
          `${API_URL}/users/${userId}`,
          { is_active: isActive },
          config
        );
        fetchData();
      } catch (error) {
        console.error("Error updating user:", error);
      }
    };

    const handleToggleAdmin = async (userId, isAdmin) => {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      };
      try {
        await axios.put(
          `${API_URL}/users/${userId}`,
          { is_admin: isAdmin },
          config
        );
        fetchData();
      } catch (error) {
        console.error("Error updating user:", error);
      }
    };

    const notifyUsers = async () => {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      };
      try {
        const response = await axios.post(`${API_URL}/notify`, {}, config);
        alert(response.data.detail);
      } catch (error) {
        console.error("Error notifying users:", error);
        alert("Failed to send notifications. Please try again.");
      }
    };

    return (
      <div className="users-management">
        <button className="create-button" onClick={notifyUsers}>
          Notify Users
        </button>
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
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={user.is_active}
                      onChange={() =>
                        handleToggleActive(user.id, !user.is_active)
                      }
                    />
                    <span className="slider round"></span>
                  </label>
                </td>
                <td>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={user.is_admin}
                      onChange={() =>
                        handleToggleAdmin(user.id, !user.is_admin)
                      }
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

  const TeamsManagement = () => {
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);

    const filteredTeams = teams.filter(team =>
      (!selectedCountry || team.area.name === selectedCountry) &&
      (!selectedTournament || team.tournaments.includes(selectedTournament))
    );

    const handleTeamClick = (team) => {
      setEditingTeam(team);
    };

    return (
      <div className="teams-management">
        <div className="teams-controls">
          <button className="create-button" onClick={() => setShowCreateTeam(true)}>
            Create New Team
          </button>
          <br/>
          <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
          >
            <option value="">All Countries</option>
            {countries.map(country => (
                <option key={country} value={country}>{country}</option>
            ))}
          </select>
          <br/>
          <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
          >
            <option value="">All Tournaments</option>
            {tournaments.map(tournament => (
                <option key={tournament.id} value={tournament.name}>{tournament.name}</option>
            ))}
          </select>
        </div>
        <div className="teams-grid">
          {filteredTeams.map(team => (
              <div key={team.id} className="team-card" onClick={() => handleTeamClick(team)}>
                <img src={team.emblem} alt={team.name} className="team-emblem"/>
                <h3>{team.name}</h3>
                <p>{team.area.name}</p>
                <p className="team-tournaments">
                  Tournaments: {team.tournaments.length > 0
                    ? team.tournaments.join(', ')
                    : 'None'}
                </p>
              </div>
          ))}
        </div>
        {showCreateTeam && (
          <CreateTeamForm onClose={() => setShowCreateTeam(false)} fetchData={fetchData} />
        )}
        {editingTeam && (
          <EditTeamForm
            team={editingTeam}
            onClose={() => setEditingTeam(null)}
            fetchData={fetchData}
          />
        )}
      </div>
    );
  };

  const MatchesManagement = () => {
    const [selectedTournament, setSelectedTournament] = useState("");
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (selectedTournament) {
        fetchMatches(selectedTournament);
      }
    }, [selectedTournament]);

    const fetchMatches = async (tournamentId) => {
      setLoading(true);
      try {
        const tournament = tournaments.find(t => t.data_id === parseInt(tournamentId));
        if (!tournament) {
          console.error('Tournament not found');
          return;
        }
        const response = await axios.get(`${API_URL}/tournaments/${tournament.data_id}/games`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
        });
        setMatches(response.data.matches);
      } catch (error) {
        console.error('Error fetching matches:', error);
      }
      setLoading(false);
    };

    const addMatch = async (match) => {
      console.log(match.competition);
      const tournament = tournaments.find(t => t.data_id === parseInt(match.competition.id));
      console.log(tournament);
      console.log(match);
      try {
        await axios.post(`${API_URL}/games`, {
          data_id: match.id,
          tournament_id: tournament.id,
          title: `Matchday: ${match.matchday}`,
          start_time: match.utcDate,
          team1: match.homeTeam.name,
          team1_id: match.homeTeam.id,
          team2: match.awayTeam.name,
          team2_id: match.awayTeam.id
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
        });
        fetchMatches(selectedTournament);
      } catch (error) {
        console.error('Error adding match:', error);
      }
    };

    return (
      <div className="matches-management">
        <select
          value={selectedTournament}
          onChange={(e) => setSelectedTournament(e.target.value)}
        >
          <option value="">Select Tournament</option>
          {tournaments.map(t => (
            <option key={t.id} value={t.data_id}>{t.name}</option>
          ))}
        </select>

        {loading ? (
          <p>Loading matches...</p>
        ) : (
          <table className="matches-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Home Team</th>
                <th>Away Team</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {matches.map(match => (
                <tr key={match.id}>
                  <td>{new Date(match.utcDate).toLocaleString()}</td>
                  <td>{match.homeTeam.name}</td>
                  <td>{match.awayTeam.name}</td>
                  <td>{match.status}</td>
                  <td>
                    <button onClick={() => addMatch(match)}>Add Match</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  const CreateGameForm = ({onClose, fetchData, tournaments}) => {
    const [formData, setFormData] = useState({
      title: "",
      start_time: "",
      team1: "",
      team2: "",
      tournament_id: "",
      data_id: ''
    });

    const handleChange = (e) => {
      setFormData({...formData, [e.target.name]: e.target.value});
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      };
      try {
        await axios.post(`${API_URL}/games`, formData, config);
        fetchData();
        onClose();
      } catch (error) {
        console.error("Error creating game:", error);
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
              placeholder="Title (optional)"
            />
            <input
              type="datetime-local"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
            />
            <input
              type="text"
              name="team1"
              value={formData.team1}
              onChange={handleChange}
              placeholder="Team 1 (optional)"
            />
            <input
              type="text"
              name="team2"
              value={formData.team2}
              onChange={handleChange}
              placeholder="Team 2 (optional)"
            />
            <select
              name="tournament_id"
              value={formData.tournament_id}
              onChange={handleChange}
            >
              <option value="">Select Tournament (optional)</option>
              {tournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              name="data_id"
              value={formData.data_id}
              onChange={handleChange}
              placeholder="Football-data.org ID (optional)"
            />
            <button type="submit">Create Game</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </form>
        </div>
      </div>
    );
  };

  const CreateTournamentForm = ({ onClose, fetchData }) => {
    const [formData, setFormData] = useState({
      name: '',
      logo: '',
      data_id: ''
    });

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      };
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
              placeholder="Tournament Name (optional)"
            />
            <input
              type="text"
              name="logo"
              value={formData.logo}
              onChange={handleChange}
              placeholder="Logo URL (optional)"
            />
            <input
              type="number"
              name="data_id"
              value={formData.data_id}
              onChange={handleChange}
              placeholder="Football-data.org ID (optional)"
            />
            <button type="submit">Create Tournament</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </form>
        </div>
      </div>
    );
  };

  const CreateTeamForm = ({ onClose, fetchData }) => {
    const [formData, setFormData] = useState({
      name: '',
      emblem: '',
      country: '',
      data_id: ''
    });

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      };
      try {
        await axios.post(`${API_URL}/teams`, formData, config);
        fetchData();
        onClose();
      } catch (error) {
        console.error('Error creating team:', error);
      }
    };

    return (
      <div className="modal">
        <div className="modal-content">
          <h2>Create New Team</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Team Name (optional)"
            />
            <input
              type="text"
              name="emblem"
              value={formData.emblem}
              onChange={handleChange}
              placeholder="Emblem URL (optional)"
            />
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Country (optional)"
            />
            <input
              type="number"
              name="data_id"
              value={formData.data_id}
              onChange={handleChange}
              placeholder="Football-data.org ID (optional)"
            />
            <button type="submit">Create Team</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </form>
        </div>
      </div>
    );
  };

  const EditTournamentForm = ({ tournament, onClose, fetchData }) => {
    const [formData, setFormData] = useState({
      name: tournament.name || '',
      logo: tournament.logo || '',
      data_id: tournament.data_id || ''
    });

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      };
      try {
        await axios.put(`${API_URL}/tournaments/${tournament.id}`, formData, config);
        fetchData();
        onClose();
      } catch (error) {
        console.error('Error updating tournament:', error);
      }
    };

    return (
      <div className="modal">
        <div className="modal-content">
          <h2>Edit Tournament</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Tournament Name (optional)"
            />
            <input
              type="text"
              name="logo"
              value={formData.logo}
              onChange={handleChange}
              placeholder="Logo URL (optional)"
            />
            <input
              type="number"
              name="data_id"
              value={formData.data_id}
              onChange={handleChange}
              placeholder="Football-data.org ID"
              required
            />
            <button type="submit">Update Tournament</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </form>
        </div>
      </div>
    );
  };

  const EditTeamForm = ({ team, onClose, fetchData }) => {
    const [formData, setFormData] = useState({
      name: team.name,
      emblem: team.emblem,
      country: team.area.name,
      data_id: team.data_id
    });

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      };
      try {
        await axios.put(`${API_URL}/teams/${team.id}`, formData, config);
        fetchData();
        onClose();
      } catch (error) {
        console.error('Error updating team:', error);
      }
    };

    return (
      <div className="modal">
        <div className="modal-content">
          <h2>Edit Team</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Team Name"
              required
            />
            <input
              type="text"
              name="emblem"
              value={formData.emblem}
              onChange={handleChange}
              placeholder="Emblem URL"
              required
            />
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Country"
              required
            />
            <input
              type="number"
              name="data_id"
              value={formData.data_id}
              onChange={handleChange}
              placeholder="Football-data.org ID (optional)"
            />
            <button type="submit">Update Team</button>
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
        <br/>
        <div>
          <a href="/" className="back-button">BACK TO MAIN</a>
          <a href="/account" className="back-button">MY ACCOUNT</a>
        </div>
      </div>

      <div className="tab-container">
        <button
            className={`tab-button ${activeTab === "games" ? "active" : ""}`}
            onClick={() => setActiveTab("games")}
        >
          Games
        </button>
        <button
            className={`tab-button ${activeTab === "tournaments" ? "active" : ""}`}
            onClick={() => setActiveTab("tournaments")}
        >
          Tournaments
        </button>
        <button
            className={`tab-button ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
        >
          Teams
        </button>
        <button
            className={`tab-button ${activeTab === "matches" ? "active" : ""}`}
            onClick={() => setActiveTab("matches")}
        >
          Matches
        </button>
        <button
            className={`tab-button ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
        >
          Users
        </button>
      </div>

      {activeTab === "games" && <GamesManagement/>}
      {activeTab === "tournaments" && <TournamentsManagement/>}
      {activeTab === "teams" && <TeamsManagement />}
      {activeTab === "matches" && <MatchesManagement />}
      {activeTab === "users" && <UsersManagement />}
    </div>
  );
};

export default Dashboard;