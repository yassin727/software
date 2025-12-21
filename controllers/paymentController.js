const Payment = require('../models/Payment');
const Job = require('../models/Job');
const Maid = require('../models/Maid');

// Platform commission rate (can be moved to config/env)
const PLATFORM_COMMISSION_RATE = 15; // 15%

// Helper to get userId from req.user
const getUserId = (req) => req.user?.userId || req.user?.id;

/**
 * Calculate payment breakdown
 */
function calculatePaymentBreakdown(amount, commissionRate = PLATFORM_COMMISSION_RATE) {
  const commission = Math.round((amount * commissionRate / 100) * 100) / 100;
  const maidEarnings = Math.round((amount - commission) * 100) / 100;
  return { commission, maidEarnings, commissionRate };
}

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
    const { commission, maidEarnings, commissionRate } = calculatePaymentBreakdown(amount);

    const payment = await Payment.create({
      booking_id: bookingId,
      homeowner_id: userId,
      maid_id: maid.user_id,
      method: 'cash',
      provider: 'cash',
      amount,
      commission_rate: commissionRate,
      commission_amount: commission,
      maid_earnings: maidEarnings,
      status: 'pending'
    });

    res.status(201).json({ 
      payment, 
      message: 'Cash payment created',
      breakdown: {
        total: amount,
        platformFee: commission,
        maidEarnings: maidEarnings,
        commissionRate: `${commissionRate}%`
      }
    });
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
 * Get earnings for maid (shows actual earnings after platform commission)
 */
const getMaidEarnings = async (req, res) => {
  try {
    const userId = getUserId(req);
    const payments = await Payment.find({ maid_id: userId })
      .populate('booking_id', 'title scheduled_datetime status')
      .populate('homeowner_id', 'name')
      .sort({ createdAt: -1 });

    // Calculate totals using maid_earnings (after commission)
    const totalEarned = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.maid_earnings || p.amount), 0);
    
    const pendingAmount = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.maid_earnings || p.amount), 0);

    // Total commission paid to platform
    const totalCommissionPaid = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.commission_amount || 0), 0);

    res.json({ 
      payments: payments.map(p => ({
        ...p.toObject(),
        displayAmount: p.maid_earnings || p.amount, // Show maid's actual earnings
        platformFee: p.commission_amount || 0
      })), 
      totalEarned: Math.round(totalEarned * 100) / 100, 
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      totalCommissionPaid: Math.round(totalCommissionPaid * 100) / 100,
      totalPayments: payments.length,
      commissionRate: `${PLATFORM_COMMISSION_RATE}%`
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
 * Get payment statistics (admin) - includes commission earnings
 */
const getPaymentStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [totalPaid, totalPending, paidThisMonth, dueThisWeek, commissionStats] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' }, commission: { $sum: '$commission_amount' }, maidEarnings: { $sum: '$maid_earnings' } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' }, commission: { $sum: '$commission_amount' } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'paid', paid_at: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' }, commission: { $sum: '$commission_amount' } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'pending', createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // Commission by month for chart
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { 
          $group: { 
            _id: { $dateToString: { format: '%Y-%m', date: '$paid_at' } },
            totalAmount: { $sum: '$amount' },
            totalCommission: { $sum: '$commission_amount' },
            totalMaidEarnings: { $sum: '$maid_earnings' },
            count: { $sum: 1 }
          } 
        },
        { $sort: { _id: -1 } },
        { $limit: 6 }
      ])
    ]);

    res.json({
      totalPaid: totalPaid[0]?.total || 0,
      totalPending: totalPending[0]?.total || 0,
      paidThisMonth: paidThisMonth[0]?.total || 0,
      dueThisWeek: dueThisWeek[0]?.total || 0,
      // Commission/Platform earnings
      totalCommissionEarned: totalPaid[0]?.commission || 0,
      commissionThisMonth: paidThisMonth[0]?.commission || 0,
      pendingCommission: totalPending[0]?.commission || 0,
      totalMaidPayouts: totalPaid[0]?.maidEarnings || 0,
      commissionRate: `${PLATFORM_COMMISSION_RATE}%`,
      monthlyBreakdown: commissionStats.reverse()
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ message: 'Failed to get payment stats' });
  }
};

/**
 * Get admin commission report
 */
const getCommissionReport = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    
    const filter = { status: 'paid' };
    if (startDate || endDate) {
      filter.paid_at = {};
      if (startDate) filter.paid_at.$gte = new Date(startDate);
      if (endDate) filter.paid_at.$lte = new Date(endDate);
    }

    const payments = await Payment.find(filter)
      .populate('booking_id', 'title')
      .populate('homeowner_id', 'name')
      .populate('maid_id', 'name')
      .sort({ paid_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(filter);

    // Calculate totals for the filtered period
    const totals = await Payment.aggregate([
      { $match: filter },
      { 
        $group: { 
          _id: null, 
          totalAmount: { $sum: '$amount' },
          totalCommission: { $sum: '$commission_amount' },
          totalMaidEarnings: { $sum: '$maid_earnings' }
        } 
      }
    ]);

    res.json({
      payments: payments.map(p => ({
        id: p._id,
        date: p.paid_at,
        booking: p.booking_id?.title || 'N/A',
        homeowner: p.homeowner_id?.name || 'N/A',
        maid: p.maid_id?.name || 'N/A',
        totalAmount: p.amount,
        commission: p.commission_amount,
        maidEarnings: p.maid_earnings,
        commissionRate: p.commission_rate,
        method: p.method
      })),
      totals: {
        totalAmount: totals[0]?.totalAmount || 0,
        totalCommission: totals[0]?.totalCommission || 0,
        totalMaidEarnings: totals[0]?.totalMaidEarnings || 0
      },
      pagination: {
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get commission report error:', error);
    res.status(500).json({ message: 'Failed to get commission report' });
  }
};

/**
 * Get payment breakdown preview (before payment)
 */
const getPaymentBreakdown = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = getUserId(req);

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (String(job.homeowner_id) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const amount = job.hourly_rate * (job.actual_duration || job.estimated_duration || 4);
    const { commission, maidEarnings, commissionRate } = calculatePaymentBreakdown(amount);

    res.json({
      jobId: job._id,
      hourlyRate: job.hourly_rate,
      duration: job.actual_duration || job.estimated_duration || 4,
      subtotal: amount,
      platformFee: commission,
      platformFeePercent: commissionRate,
      maidEarnings: maidEarnings,
      total: amount,
      paymentMethod: job.payment_method
    });
  } catch (error) {
    console.error('Get payment breakdown error:', error);
    res.status(500).json({ message: 'Failed to get payment breakdown' });
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
    const { commission, maidEarnings, commissionRate } = calculatePaymentBreakdown(amount);

    // In a real app, this would integrate with Stripe/Apple Pay
    // For now, we simulate successful payment
    const payment = await Payment.create({
      booking_id: jobId,
      homeowner_id: userId,
      maid_id: maid.user_id,
      method: method,
      provider: method === 'apple_pay' ? 'apple_pay' : 'stripe',
      amount,
      commission_rate: commissionRate,
      commission_amount: commission,
      maid_earnings: maidEarnings,
      status: 'paid',
      paid_at: new Date()
    });

    // Update job payment status
    job.payment_status = 'paid';
    await job.save();

    // Notify maid of payment received (show their actual earnings)
    const NotificationService = require('../services/notificationService');
    await NotificationService.notifyPaymentReceived(
      maid.user_id,
      job,
      maidEarnings // Send maid's actual earnings, not total amount
    );

    res.json({ 
      payment, 
      message: 'Payment processed successfully',
      breakdown: {
        total: amount,
        platformFee: commission,
        maidEarnings: maidEarnings,
        commissionRate: `${commissionRate}%`
      }
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

/**
 * Get single payment details (admin)
 */
const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('booking_id', 'title scheduled_datetime status hourly_rate actual_duration estimated_duration address')
      .populate('homeowner_id', 'name email phone')
      .populate('maid_id', 'name email phone');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({
      id: payment._id,
      invoiceId: `PAY-${payment._id.toString().slice(-6).toUpperCase()}`,
      // Payment info
      amount: payment.amount,
      commissionRate: payment.commission_rate,
      commissionAmount: payment.commission_amount,
      maidEarnings: payment.maid_earnings,
      method: payment.method,
      provider: payment.provider,
      status: payment.status,
      currency: payment.currency,
      // Dates
      createdAt: payment.createdAt,
      paidAt: payment.paid_at,
      // Booking info
      booking: payment.booking_id ? {
        id: payment.booking_id._id,
        title: payment.booking_id.title,
        scheduledDate: payment.booking_id.scheduled_datetime,
        status: payment.booking_id.status,
        hourlyRate: payment.booking_id.hourly_rate,
        duration: payment.booking_id.actual_duration || payment.booking_id.estimated_duration || 4,
        address: payment.booking_id.address
      } : null,
      // Homeowner info
      homeowner: payment.homeowner_id ? {
        id: payment.homeowner_id._id,
        name: payment.homeowner_id.name,
        email: payment.homeowner_id.email,
        phone: payment.homeowner_id.phone
      } : null,
      // Maid info
      maid: payment.maid_id ? {
        id: payment.maid_id._id,
        name: payment.maid_id.name,
        email: payment.maid_id.email,
        phone: payment.maid_id.phone
      } : null,
      // Commission settlement
      commissionSettled: payment.commission_settled,
      commissionSettledAt: payment.commission_settled_at
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({ message: 'Failed to get payment details' });
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
  getPendingPayments,
  getCommissionReport,
  getPaymentBreakdown,
  getPaymentDetails,
  PLATFORM_COMMISSION_RATE
};
