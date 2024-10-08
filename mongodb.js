require('dotenv').config();
 
// Log the session secret to verify it is loaded correctly
console.log("Session Secret:", process.env.SESSION_SECRET);
 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
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
 
require('dotenv').config();
 
const User = require('./src/models/User');
const Payment = require('./src/models/Payment');
const adminRoutes = require('./src/routes/adminRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
 
 
const app = express();
 
// Middleware
app.use(express.json());
 
app.use(helmet({
  frameguard: { action: 'deny' },
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
 
// Secure session management
 
app.use(session({
  secret: process.env.SESSION_SECRET,  
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,  
    httpOnly: true,  
    sameSite: 'lax',
    maxAge: 1800000,  
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

// Add this route in your server code to handle payment status updates
app.patch('/admin/payments/:id', async (req, res) => {
  const { id } = req.params; // Payment ID from the request URL
  const { status } = req.body; // Status to update ('Approved' or 'Denied')

  try {
    // Find the payment by ID and update its status
    const updatedPayment = await Payment.findByIdAndUpdate(id, { status }, { new: true });

    // Check if the payment was found and updated
    if (!updatedPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Send a success response with the updated payment details
    res.status(200).json({ message: 'Payment status updated successfully', updatedPayment });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
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
    return res.status(400).json({ message: 'All fields are required' });
  }
 
  try {
    const existingUser = await User.findOne({
      $or: [{ idNumber: sanitizedIdNumber }, { accountNumber: sanitizedAccountNumber }]
    });
 
    if (existingUser) {
      return res.status(400).json({ message: 'User with this ID number or Account number already exists' });
    }
 
    // Hash the user's password
    const hashedPassword = await bcrypt.hash(password, 10);
 
    // Register the new user
    const newUser = new User({
      fullName: sanitizedFullName,
      idNumber: sanitizedIdNumber,
      accountNumber: sanitizedAccountNumber,
      password: hashedPassword
    });
 
    await newUser.save();
 
    res.status(201).json({ message: 'User registered successfully', userId: newUser._id });
  } catch (error) {
    console.error('Error registering user: ', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
 
// Login route with brute force protection
app.post('/login', bruteforce.getMiddleware({
  key: function (req, res, next) {
    next(req.ip);
  }
}), async (req, res) => {
  const { username, accountNumber, password } = req.body;
 
  // Sanitize input
  const sanitizedUsername = xss(username);
  const sanitizedAccountNumber = xss(accountNumber);
 
  if (!sanitizedUsername || !sanitizedAccountNumber || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
 
  try {
    const user = await User.findOne({ fullName: sanitizedUsername, accountNumber: sanitizedAccountNumber });
 
    const count = req.brute.count;
    const remainingAttempts = Math.max(0, bruteforce.freeRetries - count);
 
    if (!user) {
      return res.status(404).json({
        message: 'Account does not exist',
        remainingAttempts: remainingAttempts
      });
    }
 
    const isMatch = await bcrypt.compare(password, user.password);
 
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid username, account number, or password',
        remainingAttempts: remainingAttempts
      });
    }
 
    req.brute.reset();
 
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
 
  // Validate the userId as a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId format' });
  }
 
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
//const mongoose = require('mongoose');
 
app.get('/payments/:userId', async (req, res) => {
    const { userId } = req.params;
 
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
    }
});
 
 
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
 
// Start HTTPS server
const PORT = 3000;
https.createServer(options, app).listen(PORT, () => {
  console.log(`HTTPS server running on https://localhost:${PORT}`);
});