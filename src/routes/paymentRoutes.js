const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');

// Route to handle payment submissions
router.post('/submit', async (req, res) => {
  const { amount, currency, provider, recipientAccount, swiftCode, userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User is not authenticated' });
  }

  // Create a new payment associated with the logged-in user
  const newPayment = new Payment({
    userId, // Attach the userId (from session or storage) to the payment
    amount,
    currency,
    provider,
    recipientAccount,
    swiftCode,
    date: new Date(), // Record the current date
    status: 'pending' // Default status is 'pending'
  });

  try {
    await newPayment.save(); // Save the payment in the database
    res.status(201).json({ message: 'Payment submitted successfully' });
  } catch (error) {
    console.error('Error saving payment:', error);
    res.status(500).json({ message: 'Failed to submit payment' });
  }
});

// New route to fetch payments for a specific user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const payments = await Payment.find({ userId }).sort({ date: -1 }); // Fetch payments and sort by date
    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
