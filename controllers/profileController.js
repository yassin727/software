const User = require('../models/User');
const Maid = require('../models/Maid');
const bcrypt = require('bcrypt');

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
    await User.findByIdAndUpdate(userId, { photo_url: photoUrl });
    
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
    
    const user = await User.findById(userId)
      .select('name email phone role photo_url verification_status createdAt');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.json(user);
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
    const userRole = req.user.role;
    const { name, phone, location, specializations, hourly_rate, bio } = req.body;
    
    const updates = {};
    
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    
    // Update user basic info
    if (Object.keys(updates).length > 0) {
      await User.findByIdAndUpdate(userId, updates);
    }
    
    // Update maid-specific fields if user is a maid
    if (userRole === 'maid') {
      const maidUpdates = {};
      if (location) maidUpdates.location = location;
      if (specializations) maidUpdates.specializations = specializations;
      if (hourly_rate) maidUpdates.hourly_rate = parseFloat(hourly_rate);
      if (bio) maidUpdates.bio = bio;
      
      if (Object.keys(maidUpdates).length > 0) {
        await Maid.findOneAndUpdate({ user_id: userId }, maidUpdates);
      }
    }
    
    return res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
};

/**
 * Get maid profile details
 */
const getMaidProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const maid = await Maid.findOne({ user_id: userId });
    
    if (!maid) {
      return res.status(404).json({ message: 'Maid profile not found' });
    }
    
    return res.json({
      location: maid.location,
      specializations: maid.specializations,
      hourly_rate: maid.hourly_rate,
      bio: maid.bio,
      experience_years: maid.experience_years,
      average_rating: maid.average_rating,
      total_reviews: maid.total_reviews,
      is_verified: maid.is_verified,
      is_online: maid.is_online
    });
  } catch (error) {
    console.error('Error getting maid profile:', error);
    return res.status(500).json({ message: 'Failed to get maid profile' });
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
    await User.findByIdAndUpdate(userId, {
      id_document_url: idDocumentPath,
      selfie_url: selfiePath,
      verification_status: 'pending'
    });
    
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
    const users = await User.find({ verification_status: 'pending' })
      .select('name email role id_document_url selfie_url verification_status createdAt')
      .sort({ createdAt: -1 });
    
    return res.json(users);
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
    
    await User.findByIdAndUpdate(userId, {
      verification_status: status,
      verification_notes: reason || null
    });
    
    return res.json({ 
      message: `User verification ${action}d successfully`,
      status: status
    });
  } catch (error) {
    console.error('Error processing verification:', error);
    return res.status(500).json({ message: 'Failed to process verification' });
  }
};

/**
 * Change user password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    // Get user with password hash
    const user = await User.findById(userId).select('+password_hash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await User.findByIdAndUpdate(userId, { password_hash: newPasswordHash });
    
    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ message: 'Failed to change password' });
  }
};

module.exports = {
  uploadPhoto,
  getProfile,
  updateProfile,
  getMaidProfile,
  changePassword,
  submitVerification,
  getPendingVerifications,
  processVerification
};
