const express = require('express');
const PaymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

const router = express.Router();

// Homeowner routes
router.post('/cash', auth(['homeowner']), PaymentController.createCashPayment);
router.get('/homeowner', auth(['homeowner']), PaymentController.getHomeownerPayments);

// Maid routes
router.get('/maid', auth(['maid']), PaymentController.getMaidEarnings);

// Admin routes
router.get('/admin', auth(['admin']), PaymentController.getAllPayments);
router.get('/admin/stats', auth(['admin']), PaymentController.getPaymentStats);
router.post('/admin/:paymentId/mark-paid', auth(['admin']), PaymentController.markPaymentPaid);

module.exports = router;
