const LocationModel = require('../models/locationModel');
const MaidModel = require('../models/maidModel');

/**
 * Maid updates their location
 */
const updateLocation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { latitude, longitude } = req.body;
    
    // Validate coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
    
    // Get maid_id from user_id
    const maid = await MaidModel.getByUserId(userId);
    if (!maid) {
      return res.status(404).json({ message: 'Maid profile not found' });
    }
    
    await LocationModel.updateLocation(maid.maid_id, latitude, longitude);
    
    return res.json({ 
      message: 'Location updated successfully',
      location: { latitude, longitude, updatedAt: new Date() }
    });
  } catch (error) {
    console.error('Error updating location:', error);
    return res.status(500).json({ message: 'Failed to update location' });
  }
};

/**
 * Homeowner views maid location for their active job
 */
const getMaidLocation = async (req, res) => {
  try {
    const { jobId } = req.params;
    const homeownerId = req.user.userId;
    
    const location = await LocationModel.getLocationByJobId(jobId, homeownerId);
    
    if (!location) {
      return res.status(404).json({ message: 'Job not found or location unavailable' });
    }
    
    if (!location.latitude || !location.longitude) {
      return res.json({ 
        message: 'Maid has not shared location yet',
        maidName: location.maidName,
        location: null
      });
    }
    
    return res.json({
      maidName: location.maidName,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        updatedAt: location.updated_at
      }
    });
  } catch (error) {
    console.error('Error getting maid location:', error);
    return res.status(500).json({ message: 'Failed to get location' });
  }
};

module.exports = {
  updateLocation,
  getMaidLocation
};
