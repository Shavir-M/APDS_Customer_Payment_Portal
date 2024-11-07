import React, { useEffect, useState } from 'react';
import './UserDash.css';
import { useNavigate } from 'react-router-dom';
import BankLogo from '../images/BankLogo.png';

function UserDash() {
  const [fullName, setFullName] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({
    amount: '',
    currency: 'USD',
    provider: 'SWIFT',
    recipientAccount: '',
    swiftCode: ''
  });
  const [payments, setPayments] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const storedFullName = sessionStorage.getItem('fullName') || 'User';
    const userId = sessionStorage.getItem('userId');
    setFullName(storedFullName);

    // Fetch payments every 1 second
    const interval = setInterval(() => {
      fetchPayments(userId);
    }, 20000); // 10 second interval for real-time updates

    document.body.classList.add('dashboard-body');

    // Cleanup interval when the component unmounts
    return () => {
      document.body.classList.remove('dashboard-body');
      clearInterval(interval); // Clear the interval to avoid memory leaks
    };
  }, []);

  const fetchPayments = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/payments/${userId}`);
      const data = await response.json();
      if (response.ok) {
        setPayments(data); // Update the payments state with fetched data
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      sessionStorage.clear();
      navigate('/login');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'amount') {
      // Whitelist numbers and up to two decimal places for amount
      const amountPattern = /^\d*\.?\d{0,2}$/;
      if (amountPattern.test(value)) {
        setPaymentDetails((prevDetails) => ({
          ...prevDetails,
          [name]: value
        }));
      }
    } else if (name === 'recipientAccount') {
      // Whitelist only digits for the recipient account
      const recipientAccountPattern = /^\d*$/;
      if (recipientAccountPattern.test(value)) {
        setPaymentDetails((prevDetails) => ({
          ...prevDetails,
          [name]: value
        }));
      }
    } else if (name === 'swiftCode') {
      // Whitelist alphanumeric characters for SWIFT code
      const swiftCodePattern = /^[A-Za-z0-9]*$/;
      if (swiftCodePattern.test(value)) {
        setPaymentDetails((prevDetails) => ({
          ...prevDetails,
          [name]: value
        }));
      }
    } else {
      // For other fields like currency and provider
      setPaymentDetails((prevDetails) => ({
        ...prevDetails,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = sessionStorage.getItem('userId'); // Get the userId from sessionStorage

    if (!userId) {
      alert("User is not authenticated");
      return;
    }

    const paymentData = {
      ...paymentDetails,
      userId, // Attach userId to the payment data
      date: new Date().toISOString(),
      status: 'Pending',
    };

    try {
      const response = await fetch(`http://localhost:5000/payments/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear the form after successful payment
        setPaymentDetails({
          amount: '',
          currency: 'USD',
          provider: 'SWIFT',
          recipientAccount: '',
          swiftCode: ''
        });

        // Fetch updated payments after successful payment
        fetchPayments(userId);
        alert("Payment submitted successfully");
      } else {
        console.error('Error:', data.message);
        alert(data.message || 'Failed to submit payment');
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      alert('Error submitting payment');
    }
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-navbar">
        <div className="navbar-left">
          <img src={BankLogo} alt="Bank Logo" className="dashboard-logo" />
          <span className="dashboard-bank-name">Welcome to Your Dashboard, {fullName}</span>
        </div>
        <div className="navbar-right">
          <button className="nav-link logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="payment-form">
          <h2>Make a Payment</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="amount">Amount:</label>
              <input
                type="text" // Changed to "text" for better regex control
                id="amount"
                name="amount"
                value={paymentDetails.amount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="currency">Currency:</label>
              <select
                id="currency"
                name="currency"
                value={paymentDetails.currency}
                onChange={handleChange}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="ZAR">ZAR</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="provider">Provider:</label>
              <select
                id="provider"
                name="provider"
                value={paymentDetails.provider}
                onChange={handleChange}
              >
                <option value="SWIFT">SWIFT</option>
                <option value="IBAN">IBAN</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="recipientAccount">Recipient Account:</label>
              <input
                type="text" // Changed to "text" for better regex control
                id="recipientAccount"
                name="recipientAccount"
                value={paymentDetails.recipientAccount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="swiftCode">SWIFT Code:</label>
              <input
                type="text"
                id="swiftCode"
                name="swiftCode"
                value={paymentDetails.swiftCode}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="pay-now-button">Pay Now</button>
          </form>
        </div>

        <div className="future-feature">
          <h2>Transaction History</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Recipient Account</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, index) => (
                  <tr key={index}>
                    <td>{new Date(payment.date).toLocaleDateString()}</td>
                    <td>{payment.amount}</td>
                    <td>{payment.currency}</td>
                    <td>{payment.recipientAccount}</td>
                    <td className={
                      payment.status === 'Approved' ? 'status-approved' :
                      payment.status === 'Denied' ? 'status-denied' : 'status-pending'
                    }>
                      {payment.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDash;
