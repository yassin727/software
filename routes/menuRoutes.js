const express = require('express');
const MenuController = require('../controllers/menuController');
const auth = require('../middleware/auth');

const router = express.Router();

// Any authenticated user gets menu based on their role
router.get('/my', auth(), MenuController.getMyMenu);

module.exports = router;