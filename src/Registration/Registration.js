import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Registration.css';

function Registration() {
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if ID number is exactly 13 digits
    if (idNumber.length !== 13) {
      setMessage('ID Number must be exactly 13 digits');
      return;
    }

    // Check if account number is exactly 12 digits
    if (accountNumber.length !== 12) {
      setMessage('Account Number must be exactly 12 digits');
      return;
    }

    try {
      const response = await fetch('https://localhost:3000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          idNumber,
          accountNumber,
          password,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Thank you for registering!');
        navigate('/login'); // Redirect to login page on success
      } else {
        setMessage(data.message); // Display error message if user exists
      }
    } catch (error) {
      setMessage('Something went wrong');
    }
  };

  return (
    <div className="registration-container">
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fullName">Full Name:</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onKeyPress={(e) => {
              const pattern = /^[A-Za-z\s]*$/; // Whitelisting letters and spaces only
              if (!pattern.test(e.key)) {
                e.preventDefault();
              }
            }}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="idNumber">ID Number:</label>
          <input
            type="text"
            id="idNumber"
            name="idNumber"
            value={idNumber}
            onChange={(e) => {
              const value = e.target.value;
              // Allow only numbers and restrict length to 13
              if (/^\d*$/.test(value) && value.length <= 13) {
                setIdNumber(value);
              }
            }}
            maxLength={13} // Maximum 13 digits
            minLength={13} // Minimum 13 digits (required)
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
            onChange={(e) => {
              const value = e.target.value;
              // Whitelist only digits
              if (/^\d*$/.test(value) && value.length <= 12) {
                setAccountNumber(value);
              }
            }}
            maxLength={12} // Maximum 12 digits
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

        {message && <p className="error-message">{message}</p>}

        <button type="submit">Register</button>
      </form>
      <p>Already have an account? <a href="/login">Login</a></p>
    </div>
  );
}

export default Registration;
