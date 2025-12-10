const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Create a connection pool for efficient reuse across requests
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hmts',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Export promise-based pool API
module.exports = pool.promise();

