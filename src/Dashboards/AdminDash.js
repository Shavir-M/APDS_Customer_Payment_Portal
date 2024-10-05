import React, { useEffect, useState } from 'react';
import './AdminDash.css';
import BankLogo from '../images/BankLogo.png'; // Assuming the path to your logo
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [fullName, setFullName] = useState('');
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null); // Track the selected payment

  const navigate = useNavigate();

  useEffect(() => {
    const storedFullName = sessionStorage.getItem('fullName') || 'Admin';
    setFullName(storedFullName);

    // Fetch payments every second
    const interval = setInterval(() => {
      fetchPayments();
    }, 1000); 

    document.body.classList.add('dashboard-body');

    // Cleanup interval when the component unmounts
    return () => {
      document.body.classList.remove('dashboard-body');
      clearInterval(interval); 
    };
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch('https://localhost:3000/admin/payments');
      const data = await response.json();
      if (response.ok) {
        setPayments(data);
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

  // Handle row selection
  const handleSelectPayment = (payment) => {
    setSelectedPayment(payment);
  };

  // Approve the selected payment
  const handleApprovePayment = async () => {
    if (!selectedPayment) return;

    try {
      const response = await fetch(`https://localhost:3000/admin/payments/${selectedPayment._id}`, {
        method: 'PATCH', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Approved' }),
      });

      if (response.ok) {
        fetchPayments(); 
        setSelectedPayment(null); 
      }
    } catch (error) {
      console.error('Error approving payment:', error);
    }
  };

  // Mark the selected payment as "Denied"
  const handleDenyPayment = async () => {
    if (!selectedPayment) return;

    try {
      const response = await fetch(`https://localhost:3000/admin/payments/${selectedPayment._id}`, {
        method: 'PATCH', // Use PATCH for partial updates
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Denied' }),
      });

      if (response.ok) {
        fetchPayments(); // Refresh payments to reflect the changes
        setSelectedPayment(null); // Deselect the payment after the action
      }
    } catch (error) {
      console.error('Error denying payment:', error);
    }
  };

  return (
    <div className="admin-dashboard-container">
      <nav className="dashboard-navbar">
        <div className="navbar-left">
          <img src={BankLogo} alt="Bank Logo" className="dashboard-logo" />
          <span className="dashboard-bank-name">Admin Dashboard - Welcome, {fullName}</span>
        </div>
        <div className="navbar-right">
          <button className="nav-link logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="admin-dashboard-content" style={{ marginTop: '60px' }}>
        <h2>All Payments</h2>
        {/* Buttons for Approve and Deny */}
        <div className="admin-actions">
          <button 
            className="action-button" 
            onClick={handleApprovePayment} 
            disabled={!selectedPayment}
          >
            Approve
          </button>
          <button 
            className="action-button" 
            onClick={handleDenyPayment} 
            disabled={!selectedPayment}
          >
            Deny
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Recipient Account</th>
                <th>Status</th>
                <th>User ID</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => (
                <tr 
                  key={index}
                  onClick={() => handleSelectPayment(payment)} 
                  className={selectedPayment && selectedPayment._id === payment._id ? 'selected-row' : ''}
                >
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
                  <td>{payment.userId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
