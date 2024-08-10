import React from 'react';
import './Account.css';

const Account = () => {
  return (
    <div className="container">
      <div className="header-container">
        <h1>MY ACCOUNT</h1>
        <div>
          <a href="/" className="back-button">BACK TO MAIN</a>
          <a href="/dashboard" className="admin-button">ADMIN</a>
        </div>
      </div>

      <div className="profile-achievements">
        <div className="profile-section">
          <h2>Profile Information</h2>
          <p><strong>Username:</strong> GrungePredictor92</p>
          <p><strong>Email:</strong> grungepredictor92@email.com</p>
          <p><strong>Member Since:</strong> May 15, 2022</p>
        </div>

        <div className="achievements-section">
          <h2>Achievements</h2>
          <div className="achievement">
            <div className="achievement-icon">🏆</div>
            <div className="achievement-info">
              <div className="achievement-title">PREMIER LEAGUE 2022/23</div>
              <div className="achievement-description">2nd Place</div>
            </div>
          </div>
          <div className="achievement">
            <div className="achievement-icon">🏅</div>
            <div className="achievement-info">
              <div className="achievement-title">WORLD CUP 2022</div>
              <div className="achievement-description">3rd Place</div>
            </div>
          </div>
          <div className="achievement">
            <div className="achievement-icon">🥇</div>
            <div className="achievement-info">
              <div className="achievement-title">CHAMPIONS LEAGUE 2021/22</div>
              <div className="achievement-description">1st Place</div>
            </div>
          </div>
        </div>
      </div>

      <div className="predictions-section">
        <h2>Upcoming Predictions</h2>
        <div className="predictions-grid">
          <div className="prediction-card">
            <h3>PREMIER LEAGUE 2023/24</h3>
            <div className="match-info">
              <div className="team">ARSENAL</div>
              <span>vs</span>
              <div className="team">CHELSEA</div>
            </div>
            <div className="prediction-input">
              <input type="number" min="0" max="99" placeholder="0" />
              <span>:</span>
              <input type="number" min="0" max="99" placeholder="0" />
            </div>
            <button className="submit-prediction">Submit</button>
          </div>
          <div className="prediction-card">
            <h3>CHAMPIONS LEAGUE 2023/24</h3>
            <div className="match-info">
              <div className="team">REAL MADRID</div>
              <span>vs</span>
              <div className="team">BAYERN MUNICH</div>
            </div>
            <div className="prediction-input">
              <input type="number" min="0" max="99" placeholder="0" />
              <span>:</span>
              <input type="number" min="0" max="99" placeholder="0" />
            </div>
            <button className="submit-prediction">Submit</button>
          </div>
          <div className="prediction-card">
            <h3>LA LIGA 2023/24</h3>
            <div className="match-info">
              <div className="team">BARCELONA</div>
              <span>vs</span>
              <div className="team">ATLETICO MADRID</div>
            </div>
            <div className="prediction-input">
              <input type="number" min="0" max="99" placeholder="0" />
              <span>:</span>
              <input type="number" min="0" max="99" placeholder="0" />
            </div>
            <button className="submit-prediction">Submit</button>
          </div>
        </div>
      </div>

      <div className="history-section">
        <h2>Prediction History</h2>
        <select id="tournament-select" className="tournament-select">
          <option value="">Select a tournament</option>
          <option value="world-cup-2022">WORLD CUP 2022</option>
          <option value="premier-league-2022-23">PREMIER LEAGUE 2022/23</option>
          <option value="champions-league-2022-23">CHAMPIONS LEAGUE 2022/23</option>
        </select>
        <div id="history-table-container"></div>
      </div>

      <div className="tournaments-stats-section">
        <h2>TOURNAMENTS STATS</h2>
        <div className="tournament-row">
          <img src="https://example.com/premier-league-icon.png" alt="Premier League" className="tournament-icon" />
          <div className="tournament-info">
            <div className="tournament-name">PREMIER LEAGUE 2022/23 <span className="winner-badge">WINNER</span></div>
            <div className="tournament-stats">
              <div className="stat">
                <div className="stat-value">1st</div>
                <div className="stat-label">RANK</div>
              </div>
              <div className="stat">
                <div className="stat-value">87</div>
                <div className="stat-label">POINTS</div>
              </div>
              <div className="stat">
                <div className="stat-value">92%</div>
                <div className="stat-label">ACCURACY</div>
              </div>
            </div>
          </div>
        </div>
        <div className="tournament-row">
          <img src="https://example.com/champions-league-icon.png" alt="Champions League" className="tournament-icon" />
          <div className="tournament-info">
            <div className="tournament-name">CHAMPIONS LEAGUE 2022/23</div>
            <div className="tournament-stats">
              <div className="stat">
                <div className="stat-value">3rd</div>
                <div className="stat-label">RANK</div>
              </div>
              <div className="stat">
                <div className="stat-value">72</div>
                <div className="stat-label">POINTS</div>
              </div>
              <div className="stat">
                <div className="stat-value">85%</div>
                <div className="stat-label">ACCURACY</div>
              </div>
            </div>
          </div>
        </div>
        <div className="tournament-row">
          <img src="https://example.com/world-cup-icon.png" alt="World Cup" className="tournament-icon" />
          <div className="tournament-info">
            <div className="tournament-name">WORLD CUP 2022</div>
            <div className="tournament-stats">
              <div className="stat">
                <div className="stat-value">5th</div>
                <div className="stat-label">RANK</div>
              </div>
              <div className="stat">
                <div className="stat-value">65</div>
                <div className="stat-label">POINTS</div>
              </div>
              <div className="stat">
                <div className="stat-value">76%</div>
                <div className="stat-label">ACCURACY</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
