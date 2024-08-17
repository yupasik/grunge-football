import React, { useState } from 'react';
import axios from 'axios';
import './SignUp.css';

const API_URL = 'http:/localhost:8000/api';

const SignUp = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageClass, setMessageClass] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageClass('');

    // Username validation: only Latin letters and numbers
    const usernamePattern = /^[a-zA-Z0-9]+$/;
    if (!usernamePattern.test(username)) {
      setMessage('Username must contain only Latin letters and numbers.');
      setMessageClass('error');
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setMessageClass('error');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/signup`, {
        username,
        email,
        password
      });

      setMessage('Account created successfully! Redirecting to login...');
      setMessageClass('success');
      setTimeout(() => window.location.href = '/signin', 2000);
    } catch (error) {
      console.error('Error:', error);
      if (error.response) {
        setMessage(error.response.data.detail || 'Registration failed.');
      } else if (error.request) {
        setMessage('No response from server. Please try again later.');
      } else {
        setMessage('An error occurred. Please try again.');
      }
      setMessageClass('error');
    }
  };

  return (
    <div className="container">
      <h1>Sign Up</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="username">
          Username:
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label htmlFor="email">
          Email:
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
        <label htmlFor="confirmPassword">
          Confirm Password:
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit">Sign Up</button>
      </form>
      <div className={messageClass}>{message}</div>
      <div className="login-link">
        Already have an account? <a href="/signin">Sign In</a>
      </div>
    </div>
  );
};

export default SignUp;
