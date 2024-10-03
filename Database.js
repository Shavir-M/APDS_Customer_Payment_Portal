const express = require('express');
const cors = require('cors');
const connectToDatabase = require('./mongodb');

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
