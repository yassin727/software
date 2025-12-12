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