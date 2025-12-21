const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

/**
 * SINGLETON PATTERN IMPLEMENTATION
 * 
 * The Singleton Pattern ensures that a class has only one instance
 * and provides a global point of access to it.
 * 
 * In this case, we ensure only one MongoDB connection exists
 * throughout the application lifecycle.
 */

let connectionInstance = null;
let connectionString;

// Handle different hosting platforms
if (process.env.MONGO_URL) {
  // Railway MongoDB
  connectionString = process.env.MONGO_URL;
} else if (process.env.MONGODB_URI) {
  // Generic MongoDB URI (Heroku, etc.)
  connectionString = process.env.MONGODB_URI;
} else if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('mongodb')) {
  // Generic MongoDB URL
  connectionString = process.env.DATABASE_URL;
} else {
  // Local development
  connectionString = process.env.MONGODB_LOCAL || 'mongodb://localhost:27017/hmts';
}

/**
 * Connect to MongoDB (Singleton)
 * Returns existing connection if already connected
 */
const connectDB = async () => {
  // Singleton check - return existing connection if available
  if (connectionInstance && mongoose.connection.readyState === 1) {
    console.log('✅ Using existing MongoDB connection (Singleton)');
    return connectionInstance;
  }
  
  try {
    // Mongoose 6+ doesn't need useNewUrlParser/useUnifiedTopology
    connectionInstance = await mongoose.connect(connectionString);
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    return connectionInstance;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

/**
 * Get the current connection instance (Singleton accessor)
 */
const getConnection = () => {
  if (!connectionInstance) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return connectionInstance;
};

/**
 * Check if database is connected
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = connectDB;
module.exports.getConnection = getConnection;
module.exports.isConnected = isConnected;