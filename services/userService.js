const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('../models/userModel');
const Maid = require('../models/maidModel');

dotenv.config();

class UserService {
  /**
   * Register a new user (homeowner or maid).
   */
  static async register({ name, email, phone, password, role }) {
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      const err = new Error('Email already registered');
      err.status = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userId = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role,
    });

    // If this is a maid, create maid profile with pending approval
    if (role === 'maid') {
      await Maid.create(userId);
    }

    return { id: userId, name, email, role };
  }

  /**
   * Login: validate credentials and return JWT + user info.
   * For maids, check approval status before allowing login.
   */
  static async login({ email, password }) {
    const user = await User.findByEmail(email);
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
      const maidProfile = await Maid.getByUserId(user.user_id);
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
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return {
      token,
      user: { id: user.user_id, name: user.name, role: user.role },
    };
  }
}

module.exports = UserService;