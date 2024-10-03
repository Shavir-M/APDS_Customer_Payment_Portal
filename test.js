// Import the database connection module
const db = require('./Database');

// Call the function to connect to the database
async function testConnection() {
  try {
    // Connect to the database
    await db.connectToDatabase();
    console.log('Test connection successful');
  } catch (error) {
    console.error('Error during test connection:', error);
  } finally {
    // Close the connection to avoid keeping the connection open
    await db.closeConnection();
  }
}

// Run the test
testConnection();
