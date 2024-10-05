const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Payment = require('../models/Payment');

// Fetch all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Fetch all payments
router.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ date: -1 });
    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Error fetching payments' });
  }
});

// PATCH route to update payment status (Approve/Deny)
router.patch('/payments/:id', async (req, res) => {
  const { id } = req.params; // Get the payment ID from the URL
  const { status } = req.body; // Get the status (Approved/Denied) from the request body

  try {
    // Find the payment by ID and update the status
    const payment = await Payment.findByIdAndUpdate(id, { status }, { new: true });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json({ message: 'Payment status updated successfully', payment });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Error updating payment status' });
  }
});

module.exports = router;
