import React, { useState } from 'react';
import axios from 'axios';
import './SignUp.css';

const API_URL = 'http://localhost:8000';

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

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setMessageClass('error');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/signup`, {
        username,
        email,
        password
      });

      const data = response.data;

      if (data.success) {
        setMessage('Account created successfully! Redirecting to login...');
        setMessageClass('success');
        setTimeout(() => window.location.href = '/signin.html', 2000);
      } else {
        setMessage(data.message || 'Registration failed.');
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
      <h1>Sign Up</h1>
      <form id="signupForm" onSubmit={handleSubmit}>
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
      <div id="message" className={messageClass}>{message}</div>
      <div className="login-link">
        Already have an account? <a href="/signin.html">Sign In</a>
      </div>
    </div>
  );
};

export default SignUp;
