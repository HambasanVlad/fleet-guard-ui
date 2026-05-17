import React, { useState } from 'react';
import './Auth.css'; // We will style this later if needed

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Use your Render URL if testing production, or localhost if testing locally
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/auth';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const endpoint = isLogin ? '/login' : '/register';
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (isLogin) {
        // Save the JWT token and role to localStorage to maintain the session
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        onLogin(data.token); // Tell App.js that we are logged in!
      } else {
        // If register is successful, switch to the login screen
        alert('Registration successful! Please log in.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>{isLogin ? 'Login to Fleet Guard' : 'Register New Crew Member'}</h2>
      {error && <p className="error-msg" style={{ color: 'red' }}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Password:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
      </form>
      
      <button 
        className="toggle-btn" 
        onClick={() => setIsLogin(!isLogin)}
        style={{ marginTop: '15px', background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}
      >
        {isLogin ? 'Need an account? Register here' : 'Already have an account? Login'}
      </button>
    </div>
  );
};

export default Auth;