const Payment = require('../models/Payment');
const Job = require('../models/Job');
const Maid = require('../models/Maid');

// Helper to get userId from req.user
const getUserId = (req) => req.user?.userId || req.user?.id;

/**
 * Create a cash payment for a booking
 */
const createCashPayment = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const job = await Job.findById(bookingId).populate('maid_id');
    if (!job) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (String(job.homeowner_id) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ booking_id: bookingId });
    if (existingPayment) {
      return res.json({ payment: existingPayment, message: 'Payment already exists' });
    }

    // Get maid user ID
    const maid = await Maid.findById(job.maid_id);
    if (!maid) {
      return res.status(404).json({ message: 'Maid not found' });
    }

    const amount = job.hourly_rate * (job.estimated_duration || 4);

    const payment = await Payment.create({
      booking_id: bookingId,
      homeowner_id: userId,
      maid_id: maid.user_id,
      method: 'cash',
      provider: 'cash',
      amount,
      status: 'pending'
    });

    res.status(201).json({ payment, message: 'Cash payment created' });
  } catch (error) {
    console.error('Create cash payment error:', error);
    res.status(500).json({ message: 'Failed to create payment' });
  }
};

/**
 * Get payments for homeowner
 */
const getHomeownerPayments = async (req, res) => {
  try {
    const userId = getUserId(req);
    const payments = await Payment.find({ homeowner_id: userId })
      .populate('booking_id', 'title scheduled_datetime status')
      .sort({ createdAt: -1 });

    res.json({ payments });
  } catch (error) {
    console.error('Get homeowner payments error:', error);
    res.status(500).json({ message: 'Failed to get payments' });
  }
};

/**
 * Get earnings for maid
 */
const getMaidEarnings = async (req, res) => {
  try {
    const userId = getUserId(req);
    const payments = await Payment.find({ maid_id: userId })
      .populate('booking_id', 'title scheduled_datetime status')
      .populate('homeowner_id', 'name')
      .sort({ createdAt: -1 });

    // Calculate totals
    const totalEarned = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const pendingAmount = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({ 
      payments, 
      totalEarned, 
      pendingAmount,
      totalPayments: payments.length
    });
  } catch (error) {
    console.error('Get maid earnings error:', error);
    res.status(500).json({ message: 'Failed to get earnings' });
  }
};

/**
 * Get all payments (admin)
 */
const getAllPayments = async (req, res) => {
  try {
    const { status, method, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (method) filter.method = method;

    const payments = await Payment.find(filter)
      .populate('booking_id', 'title scheduled_datetime')
      .populate('homeowner_id', 'name email')
      .populate('maid_id', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(filter);

    // Calculate stats
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.json({ 
      payments, 
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      stats
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ message: 'Failed to get payments' });
  }
};

/**
 * Mark payment as paid (admin - for cash confirmation)
 */
const markPaymentPaid = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status === 'paid') {
      return res.json({ payment, message: 'Payment already marked as paid' });
    }

    payment.status = 'paid';
    payment.paid_at = new Date();
    await payment.save();

    // Update job status if needed
    const job = await Job.findById(payment.booking_id);
    if (job && job.status === 'in_progress') {
      job.status = 'completed';
      await job.save();
    }

    res.json({ payment, message: 'Payment marked as paid' });
  } catch (error) {
    console.error('Mark payment paid error:', error);
    res.status(500).json({ message: 'Failed to update payment' });
  }
};

/**
 * Get payment statistics (admin)
 */
const getPaymentStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [totalPaid, totalPending, paidThisMonth, dueThisWeek] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'paid', paid_at: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'pending', createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      totalPaid: totalPaid[0]?.total || 0,
      totalPending: totalPending[0]?.total || 0,
      paidThisMonth: paidThisMonth[0]?.total || 0,
      dueThisWeek: dueThisWeek[0]?.total || 0
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ message: 'Failed to get payment stats' });
  }
};

/**
 * Process card/Apple Pay payment for a completed job
 */
const processPayment = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { jobId, paymentMethod } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    const job = await Job.findById(jobId).populate('maid_id');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (String(job.homeowner_id) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (job.payment_status === 'paid') {
      return res.json({ message: 'Payment already completed', payment: null });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ message: 'Job must be completed before payment' });
    }

    // Get maid user ID
    const maid = await Maid.findById(job.maid_id);
    if (!maid) {
      return res.status(404).json({ message: 'Maid not found' });
    }

    const amount = job.hourly_rate * (job.actual_duration || job.estimated_duration || 4);
    const method = paymentMethod || job.payment_method || 'card';

    // In a real app, this would integrate with Stripe/Apple Pay
    // For now, we simulate successful payment
    const payment = await Payment.create({
      booking_id: jobId,
      homeowner_id: userId,
      maid_id: maid.user_id,
      method: method,
      provider: method === 'apple_pay' ? 'apple_pay' : 'stripe',
      amount,
      status: 'paid',
      paid_at: new Date()
    });

    // Update job payment status
    job.payment_status = 'paid';
    await job.save();

    // Notify maid of payment received
    const NotificationService = require('../services/notificationService');
    await NotificationService.notifyPaymentReceived(
      maid.user_id,
      job,
      amount
    );

    res.json({ 
      payment, 
      message: 'Payment processed successfully',
      amount: amount
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ message: 'Failed to process payment' });
  }
};

/**
 * Get pending payments for homeowner (jobs awaiting payment)
 */
const getPendingPayments = async (req, res) => {
  try {
    const userId = getUserId(req);
    
    const pendingJobs = await Job.find({
      homeowner_id: userId,
      status: 'completed',
      payment_status: 'awaiting_payment'
    })
    .populate({
      path: 'maid_id',
      populate: { path: 'user_id', select: 'name' }
    })
    .sort({ updatedAt: -1 });

    const pendingPayments = pendingJobs.map(job => ({
      jobId: job._id,
      title: job.title,
      maidName: job.maid_id?.user_id?.name || 'Unknown',
      amount: job.hourly_rate * (job.actual_duration || job.estimated_duration || 4),
      paymentMethod: job.payment_method,
      completedAt: job.updatedAt
    }));

    res.json({ pendingPayments });
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({ message: 'Failed to get pending payments' });
  }
};

module.exports = {
  createCashPayment,
  getHomeownerPayments,
  getMaidEarnings,
  getAllPayments,
  markPaymentPaid,
  getPaymentStats,
  processPayment,
  getPendingPayments
};
