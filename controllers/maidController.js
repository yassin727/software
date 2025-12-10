const maidModel = require('../models/maidModel');

const listMaids = async (_req, res) => {
  try {
    const maids = await maidModel.getAllMaids();
    return res.json(maids);
  } catch (err) {
    console.error('List maids error', err);
    return res.status(500).json({ message: 'Failed to fetch maids' });
  }
};

const createMaid = async (req, res) => {
  try {
    const { name, phone, address, experience_years = 0 } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }
    const maid = await maidModel.createMaid({ name, phone, address, experience_years });
    return res.status(201).json(maid);
  } catch (err) {
    console.error('Create maid error', err);
    return res.status(500).json({ message: 'Failed to create maid' });
  }
};

module.exports = {
  listMaids,
  createMaid,
};

