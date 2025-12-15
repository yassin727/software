const express = require('express');
const ProfileController = require('../controllers/profileController');
const auth = require('../middleware/auth');
const { uploadProfile, uploadVerification } = require('../middleware/upload');

const router = express.Router();

// GET /api/profile - Get current user profile
router.get('/', auth(['admin', 'homeowner', 'maid']), ProfileController.getProfile);

// PUT /api/profile - Update profile
router.put('/', auth(['admin', 'homeowner', 'maid']), ProfileController.updateProfile);

// POST /api/profile/photo - Upload profile photo
router.post('/photo', auth(['admin', 'homeowner', 'maid']), uploadProfile, ProfileController.uploadPhoto);

// POST /api/profile/verify - Submit verification documents
router.post('/verify', auth(['homeowner', 'maid']), uploadVerification, ProfileController.submitVerification);

// Admin endpoints
// GET /api/profile/verifications/pending - Get pending verifications
router.get('/verifications/pending', auth(['admin']), ProfileController.getPendingVerifications);

// POST /api/profile/verifications/process - Approve/reject verification
router.post('/verifications/process', auth(['admin']), ProfileController.processVerification);

module.exports = router;
