const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt'); 
const fs = require('fs'); 
const https = require('https'); 
const path = require('path'); 

const User = require('./src/models/User'); 
const Payment = require('./src/models/Payment'); 
const adminRoutes = require('./src/routes/adminRoutes'); 

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'https://localhost:3000', 
  credentials: true
}));

 // Set up admin routes
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

  if (!fullName || !idNumber || !accountNumber || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({
      $or: [{ idNumber }, { accountNumber }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this ID number or Account number already exists' });
    }

    // Hash the user's password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Register the new user
    const newUser = new User({
      fullName,
      idNumber,
      accountNumber,
      password: hashedPassword
    });

    // Call the methode to store the registered user in our db
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', userId: newUser._id });
  } catch (error) {
    console.error('Error registering user: ', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login route with password comparison
app.post('/login', async (req, res) => {
  const { username, accountNumber, password } = req.body;

  if (!username || !accountNumber || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const user = await User.findOne({ fullName: username, accountNumber });

    if (!user) {
      return res.status(404).json({ message: 'Account does not exist' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username, account number, or password' });
    }

    res.status(200).json({
      message: 'Logged in successfully',
      userId: user._id,
      isAdmin: user.isAdmin 
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

  const newPayment = new Payment({
    userId,
    amount,
    currency,
    provider,
    recipientAccount,
    swiftCode,
    date: new Date(),
    status: 'pending'
  });

  try {
    await newPayment.save();
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
    const payments = await Payment.find({ userId }).sort({ date: -1 });
    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// Catch-all route to serve the React frontend's `index.html`
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// SSL certificate and private key
const sslKey = fs.readFileSync(path.join('cust/APDS.key'), 'utf8');
const sslCert = fs.readFileSync(path.join('C:/Program Files/OpenSSL-Win64/bin/mycertificate.crt'), 'utf8');

// HTTPS options
const options = {
  key: sslKey,
  cert: sslCert
};

// Start HTTPS server
const PORT = 3000;
https.createServer(options, app).listen(PORT, () => {
  console.log(`HTTPS server running on https://localhost:${PORT}`);
});
