const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const { validate } = require('../middleware/validate');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  validate([
    body('name').notEmpty().withMessage('Name is required').isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
    body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Email must be valid'),
    body('phone').optional().isLength({ min: 8 }).withMessage('Phone must be at least 8 characters'),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').notEmpty().withMessage('Role is required').isIn(['homeowner', 'maid']).withMessage('Role must be homeowner or maid'),
  ]),
  AuthController.register
);

// POST /api/auth/login
router.post(
  '/login',
  validate([
    body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Email must be valid'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  AuthController.login
);

module.exports = router;