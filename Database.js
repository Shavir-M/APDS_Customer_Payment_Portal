const express = require('express');
const cors = require('cors');
const connectToDatabase = require('./mongodb');

<<<<<<< Updated upstream
=======
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
>>>>>>> Stashed changes
const app = express();
app.use(express.json());
app.use(cors());

// Register API: MongoDB Queries
app.post('/register', async (req, res) => {
    const { fullName, idNumber, accountNumber, password } = req.body;

    // Basic validation
    if (!fullName || !idNumber || !accountNumber || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const db = await connectToDatabase();

        // Insert user into MongoDB
        const result = await db.collection('Customers').insertOne({
            fullName,
            idNumber,
            accountNumber,
            password,
            isAdmin: false,
        });

        res.status(201).json({ message: 'User registered successfully', userId: result.insertedId });
    } catch (err) {
        console.error('Error inserting user: ', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
