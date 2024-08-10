import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
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
          <form id="add-game-form">
            <div className="form-group">
              <label htmlFor="game-tournament">Tournament:</label>
              <select id="game-tournament" name="game-tournament" required>
                <option value="">Select Tournament</option>
                <option value="premier-league">PREMIER LEAGUE 2023/24</option>
                <option value="champions-league">CHAMPIONS LEAGUE 2023/24</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="team1">Team 1:</label>
              <input type="text" id="team1" name="team1" required />
            </div>
            <div className="form-group">
              <label htmlFor="team2">Team 2:</label>
              <input type="text" id="team2" name="team2" required />
            </div>
            <div className="form-group">
              <label htmlFor="game-datetime">Game Date and Time:</label>
              <input type="datetime-local" id="game-datetime" name="game-datetime" required />
            </div>
            <button type="submit">Add Game</button>
          </form>
        </div>
        <div className="game-list">
          <h3>Upcoming Games</h3>
          <div className="game-item">
            <div className="game-details">
              <div className="game-tournament">PREMIER LEAGUE 2023/24</div>
              <div className="game-teams">
                <span>ARSENAL</span>
                <span>vs</span>
                <span>CHELSEA</span>
              </div>
              <div className="game-datetime">2023-08-15 20:00</div>
            </div>
            <div className="game-actions">
              <button className="edit-button">Edit</button>
              <button className="delete-button">Delete</button>
              <button className="finish-button">FINISH</button>
            </div>
          </div>
          <div className="game-item">
            <div className="game-details">
              <div className="game-tournament">CHAMPIONS LEAGUE 2023/24</div>
              <div className="game-teams">
                <span>REAL MADRID</span>
                <span>vs</span>
                <span>BAYERN MUNICH</span>
              </div>
              <div className="game-datetime">2023-09-20 20:45</div>
            </div>
            <div className="game-actions">
              <button className="edit-button">Edit</button>
              <button className="delete-button">Delete</button>
              <button className="finish-button">FINISH</button>
            </div>
          </div>
        </div>
      </div>

      <div className="divider"></div>

      <div className="admin-section">
        <h2>MANAGE TOURNAMENTS</h2>
        <div className="admin-form">
          <h3>Add New Tournament</h3>
          <form id="add-tournament-form">
            <div className="form-group">
              <label htmlFor="tournament-name">Tournament Name:</label>
              <input type="text" id="tournament-name" name="tournament-name" required />
            </div>
            <div className="form-group">
              <label htmlFor="tournament-logo">Tournament Logo:</label>
              <input type="file" id="tournament-logo" name="tournament-logo" accept="image/*" required />
            </div>
            <button type="submit">Add Tournament</button>
          </form>
        </div>
        <div className="tournament-list">
          <h3>Existing Tournaments</h3>
          <div className="tournament-category">
            <h4>CURRENT TOURNAMENTS</h4>
            <div className="tournament-item">
              <span className="tournament-name">PREMIER LEAGUE 2023/24</span>
              <button className="edit-button">Edit</button>
              <button className="delete-button">Delete</button>
              <button className="finish-button">FINISHED</button>
            </div>
            <div className="tournament-item">
              <span className="tournament-name">CHAMPIONS LEAGUE 2023/24</span>
              <button className="edit-button">Edit</button>
              <button className="delete-button">Delete</button>
              <button className="finish-button">FINISHED</button>
            </div>
          </div>
          <div className="tournament-category">
            <h4>FINISHED TOURNAMENTS</h4>
            <div className="tournament-item">
              <span className="tournament-name">WORLD CUP 2022</span>
              <button className="edit-button">Edit</button>
              <button className="delete-button">Delete</button>
            </div>
            <div className="tournament-item">
              <span className="tournament-name">EURO 2020</span>
              <button className="edit-button">Edit</button>
              <button className="delete-button">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
