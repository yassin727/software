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
const adminRoutes = require('./routes/adminRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const locationRoutes = require('./routes/locationRoutes');
const profileRoutes = require('./routes/profileRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4000;

// Global middleware
app.use(cors());
app.use(express.json());

// Serve static files from public folder (CSS, JS, HTML, images)
app.use(express.static(path.join(__dirname, 'public')));

// Route mounting
console.log('authRoutes type:', typeof authRoutes);
console.log('jobRoutes type:', typeof jobRoutes);
console.log('maidRoutes type:', typeof maidRoutes);
console.log('reviewRoutes type:', typeof reviewRoutes);
console.log('menuRoutes type:', typeof menuRoutes);
console.log('adminRoutes type:', typeof adminRoutes);
console.log('dashboardRoutes type:', typeof dashboardRoutes);
console.log('locationRoutes type:', typeof locationRoutes);
console.log('profileRoutes type:', typeof profileRoutes);
console.log('notificationRoutes type:', typeof notificationRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/maids', maidRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve homepage (landing page)
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
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