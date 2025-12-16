const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/mongodb');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

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
const homeownerRoutes = require('./routes/homeownerRoutes');
const maidDashboardRoutes = require('./routes/maidDashboardRoutes');
const messageRoutes = require('./routes/messageRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4000;

// Global middleware
app.use(cors());
app.use(express.json());

// Serve static files from public folder with cache control
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Disable caching for HTML files to always get latest
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    // Short cache for JS/CSS (1 hour) to allow updates
    else if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
}));

// Route mounting

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
app.use('/api/homeowner', homeownerRoutes);
app.use('/api/maid', maidDashboardRoutes);
app.use('/api/conversations', messageRoutes);
app.use('/api/payments', paymentRoutes);

// Serve homepage (landing page)
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Health check route
app.get('/health', (_req, res) => {
  res.json({ message: 'HMTS API is running' });
});

// Version endpoint for cache verification
app.get('/api/version', (_req, res) => {
  res.json({ 
    version: '2.0.0',
    deployed: new Date().toISOString(),
    features: ['real-api', 'notifications', 'maid-approval', 'admin-dashboard']
  });
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
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Database: ${process.env.MONGO_URL ? 'MongoDB Connected' : 'No Database'}`);
  });
}

module.exports = app;
// Deployed: 2025-12-16 00:51:37
