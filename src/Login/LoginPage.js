import React, { useState } from 'react';
import './LoginPage.css'; 
import { Link, useNavigate } from 'react-router-dom';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic form validation with RegEx whitelisting
    const usernameRegex = /^[A-Za-z\s]+$/; // Whitelist letters and spaces only
    const accountNumberRegex = /^[0-9]{12}$/; // Whitelist exactly 12 digits
    const passwordRegex = /^[A-Za-z0-9!@#$%^&*()_+={}\[\]:;"'<>,.?\/\\|-]+$/; // Alphanumeric and special characters

    if (!username || !accountNumber || !password) {
      setErrorMessage('All fields are required');
      return;
    }
    if (!usernameRegex.test(username)) {
      setErrorMessage('Invalid username. Only letters and spaces are allowed.');
      return;
    }
    if (!accountNumberRegex.test(accountNumber)) {
      setErrorMessage('Account number must be exactly 12 digits.');
      return;
    }
    if (!passwordRegex.test(password)) {
      setErrorMessage('Invalid password. Special characters are allowed.');
      return;
    }

    try {
      // Update fetch request to use HTTPS and the correct port
      const response = await fetch('https://localhost:3000/login', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          accountNumber,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the userId and fullName in sessionStorage
        sessionStorage.setItem('userId', data.userId); // Assuming the backend returns userId
        sessionStorage.setItem('fullName', username); // Store full name

        // Check if the user is an admin
        if (data.isAdmin) {
          // Redirect to admin dashboard
          navigate('/admin-dashboard');
        } else {
          // Redirect to the user dashboard
          navigate('/user-dashboard');
        }
      } else {
        setErrorMessage(data.message); // Display error message
      }
    } catch (error) {
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Full Name:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="accountNumber">Account Number:</label>
          <input
            type="text"
            id="accountNumber"
            name="accountNumber"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            maxLength="12"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        {errorMessage && <p className="error-message" style={{ display: 'block' }}>{errorMessage}</p>}

        <button type="submit">Login</button>
      </form>
      <p>Don't have an account? <Link to="/register">Register</Link></p>
    </div>
  );
}

export default LoginPage;
