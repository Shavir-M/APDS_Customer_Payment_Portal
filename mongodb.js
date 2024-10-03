const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Import bcrypt for hashing
const User = require('./src/models/User'); // Import the User model
const Payment = require('./src/models/Payment'); // Import the Payment model
const paymentRoutes = require('./src/routes/paymentRoutes'); // Import payment routes
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();
app.use(express.json());
app.use(cors());
app.use('/admin', adminRoutes);

// MongoDB connection string
const mongoURI = 'mongodb+srv://rylanthomas614:Poespoes123@zero.wmruq.mongodb.net/CustomerPaymentsDB?retryWrites=true&w=majority&appName=Zero';

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('Error connecting to MongoDB: ', err));

// Register route with password hashing
app.post('/register', async (req, res) => {
  const { fullName, idNumber, accountNumber, password } = req.body;

  // Basic validation
  if (!fullName || !idNumber || !accountNumber || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if the user already exists (by ID number or Account number)
    const existingUser = await User.findOne({
      $or: [{ idNumber }, { accountNumber }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this ID number or Account number already exists' });
    }

    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds

    // Create new user
    const newUser = new User({
      fullName,
      idNumber,
      accountNumber,
      password: hashedPassword // Store the hashed password
    });

    // Save the user to the database
    await newUser.save();

    // Send success response
    res.status(201).json({ message: 'User registered successfully', userId: newUser._id });

  } catch (error) {
    console.error('Error registering user: ', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login route with password comparison
app.post('/login', async (req, res) => {
  const { username, accountNumber, password } = req.body;

  // Basic validation
  if (!username || !accountNumber || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Find the user by full name (username) and account number
    const user = await User.findOne({ fullName: username, accountNumber });

    if (!user) {
      return res.status(404).json({ message: 'Account does not exist' });
    }

    // Compare the entered password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username, account number, or password' });
    }

    // If successful, return success message and userId
    res.status(200).json({
      message: 'Logged in successfully',
      userId: user._id,
      isAdmin: user.isAdmin // Add the isAdmin field to the response
    });
  } catch (error) {
    console.error('Error during login: ', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Payment submission route
app.post('/payments/submit', async (req, res) => {
  const { amount, currency, provider, recipientAccount, swiftCode, userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User is not authenticated' });
  }

  // Create a new payment associated with the logged-in user
  const newPayment = new Payment({
    userId, // Attach the userId to the payment
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

// Fetch payments for the logged-in user
app.get('/payments/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const payments = await Payment.find({ userId }).sort({ date: -1 }); // Fetch payments and sort by date
    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update payment status by ID
app.patch('/admin/payments/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const payment = await Payment.findByIdAndUpdate(id, { status }, { new: true });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.status(200).json({ message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
