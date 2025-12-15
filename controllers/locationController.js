const Location = require('../models/Location');
const Maid = require('../models/Maid');
const Job = require('../models/Job');

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
    
    // Get maid from user_id
    const maid = await Maid.findOne({ user_id: userId });
    if (!maid) {
      return res.status(404).json({ message: 'Maid profile not found' });
    }
    
    // Update or create location
    await Location.findOneAndUpdate(
      { maid_id: maid._id },
      { latitude, longitude },
      { upsert: true, new: true }
    );
    
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
    
    // Find the job and verify ownership
    const job = await Job.findOne({ _id: jobId, homeowner_id: homeownerId })
      .populate({
        path: 'maid_id',
        populate: { path: 'user_id', select: 'name' }
      });
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found or location unavailable' });
    }
    
    // Get maid's location
    const location = await Location.findOne({ maid_id: job.maid_id._id });
    
    const maidName = job.maid_id.user_id ? job.maid_id.user_id.name : 'Unknown';
    
    if (!location || !location.latitude || !location.longitude) {
      return res.json({ 
        message: 'Maid has not shared location yet',
        maidName: maidName,
        location: null
      });
    }
    
    return res.json({
      maidName: maidName,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        updatedAt: location.updatedAt
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
