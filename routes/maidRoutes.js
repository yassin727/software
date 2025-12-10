const express = require('express');
const { listMaids, createMaid } = require('../controllers/maidController');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.get('/', listMaids);
router.post('/', authenticate, createMaid);

module.exports = router;

