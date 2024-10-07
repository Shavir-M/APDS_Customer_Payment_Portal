require('dotenv').config();

// Log the session secret to verify it is loaded correctly
console.log("Session Secret:", process.env.SESSION_SECRET);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
<<<<<<< Updated upstream
const bcrypt = require('bcrypt'); // Import bcrypt for hashing
const User = require('./src/models/User'); // Import the User model
const Payment = require('./src/models/Payment'); // Import the Payment model
const paymentRoutes = require('./src/routes/paymentRoutes'); // Import payment routes
const adminRoutes = require('./src/routes/adminRoutes');
=======
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const fs = require('fs');
const https = require('https');
const path = require('path');
const ExpressBrute = require('express-brute');
const MongooseStore = require('express-brute-mongoose');
const BruteForceSchema = require('express-brute-mongoose/dist/schema');
const moment = require('moment');
const session = require('express-session');  // For session management
const xss = require('xss');  // For input sanitization
const rateLimit = require('express-rate-limit');  // For rate limiting
const { IpFilter } = require('express-ipfilter');  // IP filtering

const User = require('./src/models/User');
const Payment = require('./src/models/Payment');
const adminRoutes = require('./src/routes/adminRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
>>>>>>> Stashed changes

const app = express();
app.use(express.json());
<<<<<<< Updated upstream
app.use(cors());
app.use('/admin', adminRoutes);
=======
app.use(helmet({
  frameguard: { action: 'deny' },  // Prevent clickjacking
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    }
  },
}));
app.use(cors({
  origin: 'https://localhost:3000',
  credentials: true,
}));
>>>>>>> Stashed changes

// Secure session management
app.use(session({
  secret: process.env.SESSION_SECRET,  // Use secret from .env file
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,  // Only transmit cookie over HTTPS
    httpOnly: true,  // Prevent client-side access to cookie
    sameSite: 'lax',  // Prevent CSRF
    maxAge: 1800000,  // Session expires after 30 minutes of inactivity
  },
}));

// Rate limiting to prevent DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// IP Blacklisting (example)
const blacklist = ['192.168.0.1', '10.0.0.1'];
app.use(IpFilter(blacklist, { mode: 'deny' }));

// Enforce HTTPS and set HSTS
app.use((req, res, next) => {
  if (req.protocol === 'http') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// MongoDB connection
mongoose.connect('mongodb+srv://rylanthomas614:Poespoes123@zero.wmruq.mongodb.net/CustomerPaymentsDB?retryWrites=true&w=majority&appName=Zero')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('Error connecting to MongoDB: ', err));

<<<<<<< Updated upstream
// Register route with password hashing
app.post('/register', async (req, res) => {
  const { fullName, idNumber, accountNumber, password } = req.body;

  // Basic validation
  if (!fullName || !idNumber || !accountNumber || !password) {
=======
// Express Brute (for brute force protection)
const model = mongoose.model("bruteforce", BruteForceSchema);
const store = new MongooseStore(model);
const bruteforce = new ExpressBrute(store, {
  freeRetries: 5,
  minWait: 5 * 60 * 1000,  // 5 minutes
  maxWait: 60 * 60 * 1000,  // 1 hour
  failCallback: function (req, res, next, nextValidRequestDate) {
    res.status(429).json({
      message: 'Too many failed attempts. User is blocked.',
      nextValidRequestDate: moment(nextValidRequestDate).format('MMMM Do YYYY, h:mm:ss a'),
      remainingAttempts: 0
    });
  },
});

// Routes
app.use('/admin', adminRoutes);
app.use('/payments', paymentRoutes);

// Register route with password hashing and input sanitization
app.post('/register', async (req, res) => {
  const { fullName, idNumber, accountNumber, password } = req.body;

  // Sanitize input
  const sanitizedFullName = xss(fullName);
  const sanitizedIdNumber = xss(idNumber);
  const sanitizedAccountNumber = xss(accountNumber);

  if (!sanitizedFullName || !sanitizedIdNumber || !sanitizedAccountNumber || !password) {
>>>>>>> Stashed changes
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if the user already exists (by ID number or Account number)
    const existingUser = await User.findOne({
      $or: [{ idNumber: sanitizedIdNumber }, { accountNumber: sanitizedAccountNumber }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this ID number or Account number already exists' });
    }

    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds

    // Create new user
    const newUser = new User({
<<<<<<< Updated upstream
      fullName,
      idNumber,
      accountNumber,
      password: hashedPassword // Store the hashed password
=======
      fullName: sanitizedFullName,
      idNumber: sanitizedIdNumber,
      accountNumber: sanitizedAccountNumber,
      password: hashedPassword
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  // Basic validation
  if (!username || !accountNumber || !password) {
=======
  // Sanitize input
  const sanitizedUsername = xss(username);
  const sanitizedAccountNumber = xss(accountNumber);

  if (!sanitizedUsername || !sanitizedAccountNumber || !password) {
>>>>>>> Stashed changes
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
<<<<<<< Updated upstream
    // Find the user by full name (username) and account number
    const user = await User.findOne({ fullName: username, accountNumber });
=======
    const user = await User.findOne({ fullName: sanitizedUsername, accountNumber: sanitizedAccountNumber });
>>>>>>> Stashed changes

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

  // Validate the userId as a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId format' });
  }

  if (!userId) {
      return res.status(400).json({ message: 'User is not authenticated' });
  }

  // Create a new payment associated with the logged-in user
  const newPayment = new Payment({
<<<<<<< Updated upstream
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
=======
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
>>>>>>> Stashed changes
  } catch (error) {
      console.error('Error saving payment:', error);
      res.status(500).json({ message: 'Failed to submit payment' });
  }
});

// Fetch payments for the logged-in user
app.get('/payments/:userId', async (req, res) => {
    const { userId } = req.params;

<<<<<<< Updated upstream
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
=======
    // Validate the userId as a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid userId format' });
    }

    try {
        const payments = await Payment.find({ userId }).sort({ date: -1 });
        res.status(200).json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ message: 'Internal server error' });
>>>>>>> Stashed changes
    }
});

<<<<<<< Updated upstream
// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
=======
// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// Catch-all route to serve the React frontend's `index.html`
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// SSL certificate and private key
const sslKey = fs.readFileSync(path.join('C:/Program Files/OpenSSL-Win64/bin/APDS.key'), 'utf8');
const sslCert = fs.readFileSync(path.join('C:/Program Files/OpenSSL-Win64/bin/mycertificate.crt'), 'utf8');

// HTTPS options
const options = {
  key: sslKey,
  cert: sslCert
};

const httpPort = 8081;  // Updated to port 8081
const httpsPort = 3000;

app.listen(httpPort, () => {
  console.log(`HTTP server running on port ${httpPort}, redirecting to HTTPS`);
});

https.createServer(options, app).listen(httpsPort, () => {
  console.log(`HTTPS server running on https://localhost:${httpsPort}`);
>>>>>>> Stashed changes
});
