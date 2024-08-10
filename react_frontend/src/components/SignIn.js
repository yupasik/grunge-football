import React, { useState } from 'react';
import axios from 'axios';
import './SignIn.css';

const API_URL = 'http://localhost:8000';

const SignIn = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageClass, setMessageClass] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageClass('');

    try {
      const response = await axios.post(`${API_URL}/api/signin`, {
        username,
        password
      });

      const data = response.data;

      if (data.access_token) {
        setMessage('Login successful! Redirecting to your account...');
        setMessageClass('success');
        localStorage.setItem('access_token', data.access_token);
        setTimeout(() => window.location.href = '/account', 2000);
      } else {
        setMessage(data.detail || 'Login failed. Please check your credentials.');
        setMessageClass('error');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred. Please try again later.');
      setMessageClass('error');
    }
  };

  return (
    <div className="container">
      <h1>Sign In</h1>
      <form id="signinForm" onSubmit={handleSubmit}>
        <label htmlFor="username">
          Username or Email:
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label htmlFor="password">
          Password:
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit">Sign In</button>
      </form>
      <div id="message" className={messageClass}>{message}</div>
      <div className="signup-link">
        Don't have an account? <a href="/signup">Sign Up</a>
      </div>
    </div>
  );
};

export default SignIn;
