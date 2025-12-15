const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

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

const connectDB = async () => {
  try {
    // Mongoose 6+ doesn't need useNewUrlParser/useUnifiedTopology
    await mongoose.connect(connectionString);
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;