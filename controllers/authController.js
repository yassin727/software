const UserService = require('../services/userService');
const MaidService = require('../services/maidService');

const ALLOWED_ROLES = ['homeowner', 'maid'];

const register = async (req, res) => {
  try {
    const { name, email, phone, password, role, ...maidDetails } = req.body;

    // Basic input checks (validation middleware will handle details)
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Name, email, and password are required' });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res
        .status(400)
        .json({ message: 'Role must be homeowner or maid' });
    }

    const user = await UserService.register({ name, email, phone, password, role });
    
    // If this is a maid, update the maid profile with additional details
    if (role === 'maid' && user.id) {
      // Get the maid profile that was created during registration
      const maidProfile = await MaidService.getMaidByUserId(user.id);
      if (maidProfile && maidProfile._id) {
        const updatedMaidProfile = await MaidService.updateMaidProfile(maidProfile._id, maidDetails);
        user.maidProfile = updatedMaidProfile;
      }
    }

    return res.status(201).json({ user });
  } catch (err) {
    console.error('Register error', err);
    const status = err.status || 500;
    const message = err.status ? err.message : 'Failed to register user';
    return res.status(status).json({ message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    }

    const result = await UserService.login({ email, password });

    // result = { token, user: { id, name, role } }
    return res.json(result);
  } catch (err) {
    console.error('Login error', err);
    const status = err.status || 500;
    const message = err.status ? err.message : 'Failed to login';
    return res.status(status).json({ message });
  }
};

module.exports = {
  register,
  login,
};