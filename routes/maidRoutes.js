const express = require('express');
const { body } = require('express-validator');
const MaidController = require('../controllers/maidController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// GET /api/maids/pending → list pending maids
router.get('/pending', auth(['admin']), MaidController.listPendingMaids);

// GET /api/maids/active → list active/approved maids (admin)
router.get('/active', auth(['admin']), MaidController.listActiveMaids);

// POST /api/maids/approve → approve maid
router.post(
  '/approve',
  auth(['admin']),
  validate([
    body('maidId').notEmpty().withMessage('maidId is required'),
  ]),
  MaidController.approveMaid
);
router.get('/recommend', auth(['homeowner']), MaidController.recommendMaids);

module.exports = router;