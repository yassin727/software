const express = require('express');
const PaymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

const router = express.Router();

// Homeowner routes
router.post('/cash', auth(['homeowner']), PaymentController.createCashPayment);
router.post('/process', auth(['homeowner']), PaymentController.processPayment);
router.get('/homeowner', auth(['homeowner']), PaymentController.getHomeownerPayments);
router.get('/homeowner/pending', auth(['homeowner']), PaymentController.getPendingPayments);
router.get('/breakdown/:jobId', auth(['homeowner']), PaymentController.getPaymentBreakdown);

// Maid routes
router.get('/maid', auth(['maid']), PaymentController.getMaidEarnings);

// Admin routes
router.get('/admin', auth(['admin']), PaymentController.getAllPayments);
router.get('/admin/stats', auth(['admin']), PaymentController.getPaymentStats);
router.get('/admin/commission-report', auth(['admin']), PaymentController.getCommissionReport);
router.get('/admin/:paymentId', auth(['admin']), PaymentController.getPaymentDetails);
router.post('/admin/:paymentId/mark-paid', auth(['admin']), PaymentController.markPaymentPaid);

module.exports = router;
