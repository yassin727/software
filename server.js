const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const maidRoutes = require('./routes/maidRoutes');
const jobRoutes = require('./routes/jobRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const menuRoutes = require('./routes/menuRoutes');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4000;

// Global middleware
app.use(cors());
app.use(express.json());

// Route mounting
console.log('authRoutes type:', typeof authRoutes);
console.log('jobRoutes type:', typeof jobRoutes);
console.log('maidRoutes type:', typeof maidRoutes);
console.log('reviewRoutes type:', typeof reviewRoutes);
console.log('menuRoutes type:', typeof menuRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/maids', maidRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/menu', menuRoutes);

// Serve homepage
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check route (fixed)
app.get('/health', (_req, res) => {
  res.json({ message: 'HMTS API is running' });
});

// Centralized error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

// Start server ONLY if not testing
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = app;