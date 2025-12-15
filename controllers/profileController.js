const db = require('../config/db');
const UserModel = require('../models/userModel');

/**
 * Upload profile photo
 */
const uploadPhoto = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }
    
    // Get the relative path for storage
    const photoUrl = '/uploads/profiles/' + req.file.filename;
    
    // Update user's photo_url in database
    await db.execute(
      'UPDATE users SET photo_url = ? WHERE user_id = ?',
      [photoUrl, userId]
    );
    
    return res.json({ 
      message: 'Photo uploaded successfully',
      photoUrl: photoUrl
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return res.status(500).json({ message: 'Failed to upload photo' });
  }
};

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [rows] = await db.execute(
      'SELECT user_id, name, email, phone, role, photo_url, verification_status, created_at FROM users WHERE user_id = ?',
      [userId]
    );
    
    if (!rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.json(rows[0]);
  } catch (error) {
    console.error('Error getting profile:', error);
    return res.status(500).json({ message: 'Failed to get profile' });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, phone } = req.body;
    
    const updates = [];
    const values = [];
    
    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (phone) {
      updates.push('phone = ?');
      values.push(phone);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    values.push(userId);
    
    await db.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );
    
    return res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
};

/**
 * Submit identity verification documents
 */
const submitVerification = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!req.files || !req.files.idDocument || !req.files.selfie) {
      return res.status(400).json({ message: 'Both ID document and selfie are required' });
    }
    
    const idDocumentPath = '/uploads/verification/' + req.files.idDocument[0].filename;
    const selfiePath = '/uploads/verification/' + req.files.selfie[0].filename;
    
    // Store verification documents
    await db.execute(
      `UPDATE users SET 
        id_document_url = ?, 
        selfie_url = ?, 
        verification_status = 'pending' 
       WHERE user_id = ?`,
      [idDocumentPath, selfiePath, userId]
    );
    
    return res.json({ 
      message: 'Verification documents submitted. Awaiting admin review.',
      status: 'pending'
    });
  } catch (error) {
    console.error('Error submitting verification:', error);
    return res.status(500).json({ message: 'Failed to submit verification documents' });
  }
};

/**
 * Admin: Get pending verifications
 */
const getPendingVerifications = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT user_id, name, email, role, id_document_url, selfie_url, verification_status, created_at 
       FROM users 
       WHERE verification_status = 'pending'
       ORDER BY created_at DESC`
    );
    
    return res.json(rows);
  } catch (error) {
    console.error('Error getting pending verifications:', error);
    return res.status(500).json({ message: 'Failed to get pending verifications' });
  }
};

/**
 * Admin: Verify or reject user identity
 */
const processVerification = async (req, res) => {
  try {
    const { userId, action, reason } = req.body;
    
    if (!userId || !action) {
      return res.status(400).json({ message: 'userId and action are required' });
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be approve or reject' });
    }
    
    const status = action === 'approve' ? 'verified' : 'rejected';
    
    await db.execute(
      'UPDATE users SET verification_status = ?, verification_notes = ? WHERE user_id = ?',
      [status, reason || null, userId]
    );
    
    return res.json({ 
      message: `User verification ${action}d successfully`,
      status: status
    });
  } catch (error) {
    console.error('Error processing verification:', error);
    return res.status(500).json({ message: 'Failed to process verification' });
  }
};

module.exports = {
  uploadPhoto,
  getProfile,
  updateProfile,
  submitVerification,
  getPendingVerifications,
  processVerification
};
