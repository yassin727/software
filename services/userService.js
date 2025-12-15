const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('../models/User');
const Maid = require('../models/Maid');

dotenv.config();

class UserService {
  /**
   * Register a new user (homeowner or maid).
   */
  static async register({ name, email, phone, password, role }) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const err = new Error('Email already registered');
      err.status = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      phone,
      password_hash: passwordHash,
      role,
    });

    const savedUser = await user.save();

    // If this is a maid, create maid profile with pending approval
    if (role === 'maid') {
      const maid = new Maid({
        user_id: savedUser._id,
        approval_status: 'pending'
      });
      await maid.save();
    }

    return { id: savedUser._id, name, email, role };
  }

  /**
   * Login: validate credentials and return JWT + user info.
   * For maids, check approval status before allowing login.
   */
  static async login({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    // Check maid approval status
    if (user.role === 'maid') {
      const maidProfile = await Maid.findOne({ user_id: user._id });
      if (!maidProfile) {
        const err = new Error('Maid profile not found');
        err.status = 500;
        throw err;
      }
      
      if (maidProfile.approval_status === 'pending') {
        const err = new Error('Your account is pending admin approval. Please wait for approval.');
        err.status = 403;
        throw err;
      }
      
      if (maidProfile.approval_status === 'rejected') {
        const err = new Error('Your account was rejected. Please contact support for more information.');
        err.status = 403;
        throw err;
      }
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return {
      token,
      user: { id: user._id, name: user.name, role: user.role },
    };
  }
}

module.exports = UserService;