import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import helmet from 'helmet';
import bcrypt from 'bcrypt';
import fs from 'fs';
import https from 'https';
import session from 'express-session';
import xss from 'xss';
import rateLimit from 'express-rate-limit';
import { IpFilter } from 'express-ipfilter';
import ExpressBrute from 'express-brute';
import MongoStore from 'express-brute-mongo';

// SSL certificate paths (example)
const privateKey = fs.readFileSync('C:/Program Files/OpenSSL-Win64/bin/APDS.key', 'utf8');
const certificate = fs.readFileSync('C:/Program Files/OpenSSL-Win64/bin/mycertificate.crt', 'utf8');

const credentials = { key: privateKey, cert: certificate};

// MongoDB connection setup
const dbUrl = 'mongodb+srv://rylanthomas614:Poespoes123@zero.wmruq.mongodb.net/CustomerPaymentsDB?retryWrites=true&w=majority&appName=Zero';
const dbName = 'Zero';
let db;

async function connectToDatabase() {
    if (!db) {
        const client = new MongoClient(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        db = client.db(dbName);
    }
    return db;
}

// Create Express app
const app = express();
app.use(express.json());

// Secure headers with Helmet
app.use(helmet({
    frameguard: { action: 'deny' },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
}));

// Use session management with secure options
app.use(session({
    secret: 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 3600000,
    }
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later',
});
app.use(limiter);

// IP Blacklisting
const blacklist = ['192.168.0.1', '10.0.0.1'];
app.use(ipfilter(blacklist, { mode: 'deny' }));

// Configure CORS securely
app.use(cors({
    origin: 'https://localhost:3000',
    optionsSuccessStatus: 200
}));

// Enforce HTTPS and set HSTS header
app.use((req, res, next) => {
    if (req.protocol === 'https') {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    next();
});

// Setup MongoDB Store for Express-Brute
const bruteStore = new MongoStore((ready) => {
    connectToDatabase().then(db => {
        ready(null, db.collection('bruteforce-store'));
    }).catch(err => ready(err));
});

// Configure Express-Brute for protecting against brute-force attacks
const bruteForce = new ExpressBrute(bruteStore, {
    freeRetries: 5,
    minWait: 5000,  // 5 seconds
    maxWait: 60000, // 1 minute
    lifetime: 60 * 60 // 1 hour in seconds
});

// Optional custom failure callback for more detailed error handling
const failCallback = function (req, res, next, nextValidRequestDate) {
    res.status(429).json({
        message: 'Too many failed attempts, please try again later.',
        retryAfter: nextValidRequestDate
    });
};

// Breached accounts data (for demo purposes, use external source in production)
const breachedAccounts = [
    { email: 'breached@example.com', github: 'breachedUser', name: 'John Doe', twitter: '@breachedUser' },
    { email: 'exposed@example.com', github: 'exposedUser', name: 'Jane Doe', twitter: '@exposedUser' }
];

// Middleware to check if user email is breached
function checkBreach(req, res, next) {
    const { email } = req.body;
    const breached = breachedAccounts.find(account => account.email === email);

    if (breached) {
        res.status(200).json({
            message: `Warning: Your email ${email} has been exposed in a known data breach.`,
            details: breached
        });
    } else {
        next(); // Proceed if no breach detected
    }
}

// Register API: MongoDB Queries with Input Validation and SQL Injection Prevention
app.post('/register', bruteForce.prevent, checkBreach, async (req, res) => {
    const { fullName, idNumber, accountNumber, password, email } = req.body;

    // Sanitize user input
    const sanitizedFullName = xss(fullName);
    const sanitizedIdNumber = xss(idNumber);
    const sanitizedAccountNumber = xss(accountNumber);

    if (!sanitizedFullName || !sanitizedIdNumber || !sanitizedAccountNumber || !password || !email) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const db = await connectToDatabase();

        // Manually generate a salt with 10 rounds
        const salt = await bcrypt.genSalt(10);

        // Manually hash the password using the generated salt
        const hashedPassword = await bcrypt.hash(password, salt);

        // Check if the user already exists in the database
        const existingUser = await db.collection('Customers').findOne({ idNumber: sanitizedIdNumber });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Insert new user into the MongoDB database
        const result = await db.collection('Customers').insertOne({
            fullName: sanitizedFullName,
            idNumber: sanitizedIdNumber,
            accountNumber: sanitizedAccountNumber,
            password: hashedPassword,
            email,
            isAdmin: false,
        });

        res.status(201).json({ message: 'User registered successfully', userId: result.insertedId });
    } catch (err) {
        console.error('Error inserting user: ', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add login (auth) route and apply brute-force protection
app.post('/auth', bruteForce.prevent, async (req, res) => {
    const { username, password } = req.body;
    
    // Retrieve the user from the database (replace this with your own logic)
    const user = await db.collection('Customers').findOne({ username });
    
    if (user && await bcrypt.compare(password, user.password)) {
        req.brute.reset(() => {
            res.status(200).json({ message: 'Login successful' });
        });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Security alert route
app.get('/security-alert', (req, res) => {
    res.status(200).json({
        warning: 'This website has experienced a data breach.',
        breachDetails: breachedAccounts,
        message: 'If your data is part of this breach, change your password immediately.'
    });
});

// Start HTTPS server
const PORT = 3000;
https.createServer(credentials, app).listen(PORT, () => {
    console.log(`Secure server running on HTTPS port ${PORT}`);
});

export default app; 
