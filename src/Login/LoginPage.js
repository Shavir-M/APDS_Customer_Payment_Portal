import React, { useState } from 'react';
import './LoginPage.css';
import { Link, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';  // Import DOMPurify
import moment from 'moment';  // Added from secondary file
 
function LoginPage() {
  const [username, setUsername] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(null);  // Added from secondary file
  const [nextAttemptTime, setNextAttemptTime] = useState(null);  // Added from secondary file
 
  const navigate = useNavigate();
 
  // Handle input sanitization using DOMPurify
  const handleInputChange = (e) => {
    const sanitizedValue = DOMPurify.sanitize(e.target.value);  // Sanitize user input
    const { name } = e.target;
 
    if (name === 'username') setUsername(sanitizedValue);
    if (name === 'accountNumber') setAccountNumber(sanitizedValue);
    if (name === 'password') setPassword(sanitizedValue);
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
 
    // Basic form validation with RegEx whitelisting
    const usernameRegex = /^[A-Za-z\s]+$/;  // Whitelist letters and spaces only
    const accountNumberRegex = /^[0-9]{12}$/;  // Whitelist exactly 12 digits
    const passwordRegex = /^[A-Za-z0-9!@#$%^&*()_+={}\[\]:;"'<>,.?\/\\|-]+$/;  // Alphanumeric and special characters
 
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
      // Using HTTPS and correct port
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
        sessionStorage.setItem('userId', data.userId);
        sessionStorage.setItem('fullName', username);
 
        // Check if the user is an admin
        if (data.isAdmin) {
          navigate('/admin-dashboard');
        } else {
          navigate('/user-dashboard');
        }
      } else {
        setErrorMessage(data.message);  // Display error message
        setRemainingAttempts(data.remainingAttempts);  // Added from secondary file
 
        if (data.nextValidRequestDate) {  // Added from secondary file
          const nextAttempt = moment(data.nextValidRequestDate, 'MMMM Do YYYY, h:mm:ss a');
          if (nextAttempt.isValid()) {
            const timeUntilNextAttempt = moment.duration(nextAttempt.diff(moment()));
            setNextAttemptTime(`Try again in ${timeUntilNextAttempt.humanize()}`);
          } else {
            setNextAttemptTime('Try again later');
          }
        } else {
          setNextAttemptTime(null);
        }
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
            onChange={handleInputChange}  // Sanitize inputs on change
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
            onChange={handleInputChange}  // Sanitize inputs on change
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
            onChange={handleInputChange}  // Sanitize inputs on change
            required
          />
        </div>
 
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {remainingAttempts !== null && remainingAttempts > 0 && (
          <p className="attempts-message">Remaining attempts: {remainingAttempts}</p>
        )}
        {nextAttemptTime && (
          <p className="blocked-message">{nextAttemptTime}</p>
        )}
 
        <button type="submit" disabled={nextAttemptTime !== null}>Login</button>
      </form>
      <p>Don't have an account? <Link to="/register">Register</Link></p>
    </div>
  );
}
 
export default LoginPage;