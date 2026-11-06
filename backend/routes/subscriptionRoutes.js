const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const { validateSubscriptionInput, validateQueryFilters } = require('../controllers/validate');

// GET all subscriptions + computed pattern analytics
router.get('/', validateQueryFilters, async (req, res, next) => {
  try {
    const { plan, tenureBand } = req.query;
    const filter = {};
    if (plan) filter.plan = plan;
    if (tenureBand) filter.tenureBand = tenureBand;

    const records = await Subscription.find(filter).sort({ createdAt: -1 });

    // Compute comparative cancellation rates
    const total = records.length;
    const cancelledRecords = records.filter(r => r.status === 'Cancelled');
    const overallCancelRate = total > 0 ? ((cancelledRecords.length / total) * 100).toFixed(1) : 0;

    // 1. Cancellation rate by Plan
    const plans = ['Basic', 'Standard', 'Premium'];
    const byPlan = plans.map(p => {
      const sub = records.filter(r => r.plan === p);
      const canc = sub.filter(r => r.status === 'Cancelled').length;
      return {
        plan: p,
        total: sub.length,
        cancelled: canc,
        rate: sub.length > 0 ? Number(((canc / sub.length) * 100).toFixed(1)) : 0
      };
    });

    // 2. Cancellation rate by Tenure Band
    const bands = ['0-3 Months', '4-12 Months', '12+ Months'];
    const byTenure = bands.map(b => {
      const sub = records.filter(r => r.tenureBand === b);
      const canc = sub.filter(r => r.status === 'Cancelled').length;
      return {
        tenureBand: b,
        total: sub.length,
        cancelled: canc,
        rate: sub.length > 0 ? Number(((canc / sub.length) * 100).toFixed(1)) : 0
      };
    });

    // 3. Distribution by Cancellation Reason
    const reasons = ['Too Expensive', 'Missing Features', 'Switched Competitor', 'Technical Issues'];
    const byReason = reasons.map(reason => {
      const count = cancelledRecords.filter(r => r.cancellationReason === reason).length;
      return {
        reason,
        count,
        shareOfCancelled: cancelledRecords.length > 0
          ? Number(((count / cancelledRecords.length) * 100).toFixed(1))
          : 0
      };
    });

    res.json({
      success: true,
      summary: {
        totalRecords: total,
        activeCount: total - cancelledRecords.length,
        cancelledCount: cancelledRecords.length,
        overallCancelRate: Number(overallCancelRate)
      },
      patterns: { byPlan, byTenure, byReason },
      records
    });
  } catch (err) {
    next(err);
  }
});

// POST add a new subscription record
router.post('/', validateSubscriptionInput, async (req, res, next) => {
  try {
    const { customerId, plan, tenureMonths, status, cancellationReason } = req.body;
    const newSub = await Subscription.create({
      customerId,
      plan,
      tenureMonths: Number(tenureMonths),
      status,
      cancellationReason: status === 'Active' ? 'Not Applicable' : cancellationReason
    });
    res.status(201).json({ success: true, data: newSub });
  } catch (err) {
    next(err);
  }
});

// POST bulk upload from CSV
router.post('/bulk', async (req, res, next) => {
  try {
    const records = req.body;
    const inserted = await Subscription.insertMany(records, { ordered: false });
    res.status(201).json({ success: true, count: inserted.length });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(201).json({ 
        success: true, 
        message: 'Upload complete (skipped duplicate Customer IDs).' 
      });
    }
    next(err);
  }
});

// POST seed synthetic dataset
router.post('/seed', async (req, res, next) => {
  try {
    await Subscription.deleteMany({});
    const syntheticData = [
      { customerId: 'CUST-101', plan: 'Basic', tenureMonths: 1, status: 'Cancelled', cancellationReason: 'Missing Features' },
      { customerId: 'CUST-102', plan: 'Basic', tenureMonths: 2, status: 'Cancelled', cancellationReason: 'Too Expensive' },
      { customerId: 'CUST-103', plan: 'Basic', tenureMonths: 3, status: 'Active', cancellationReason: 'Not Applicable' },
      { customerId: 'CUST-104', plan: 'Basic', tenureMonths: 6, status: 'Cancelled', cancellationReason: 'Switched Competitor' },
      { customerId: 'CUST-105', plan: 'Basic', tenureMonths: 14, status: 'Active', cancellationReason: 'Not Applicable' },
      { customerId: 'CUST-106', plan: 'Standard', tenureMonths: 2, status: 'Cancelled', cancellationReason: 'Technical Issues' },
      { customerId: 'CUST-107', plan: 'Standard', tenureMonths: 5, status: 'Active', cancellationReason: 'Not Applicable' },
      { customerId: 'CUST-108', plan: 'Standard', tenureMonths: 8, status: 'Active', cancellationReason: 'Not Applicable' },
      { customerId: 'CUST-109', plan: 'Standard', tenureMonths: 10, status: 'Cancelled', cancellationReason: 'Too Expensive' },
      { customerId: 'CUST-110', plan: 'Standard', tenureMonths: 18, status: 'Active', cancellationReason: 'Not Applicable' },
      { customerId: 'CUST-111', plan: 'Standard', tenureMonths: 24, status: 'Active', cancellationReason: 'Not Applicable' },
      { customerId: 'CUST-112', plan: 'Premium', tenureMonths: 1, status: 'Cancelled', cancellationReason: 'Too Expensive' },
      { customerId: 'CUST-113', plan: 'Premium', tenureMonths: 4, status: 'Active', cancellationReason: 'Not Applicable' },
      { customerId: 'CUST-114', plan: 'Premium', tenureMonths: 9, status: 'Active', cancellationReason: 'Not Applicable' },
      { customerId: 'CUST-115', plan: 'Premium', tenureMonths: 15, status: 'Active', cancellationReason: 'Not Applicable' },
      { customerId: 'CUST-116', plan: 'Premium', tenureMonths: 20, status: 'Cancelled', cancellationReason: 'Switched Competitor' },
      { customerId: 'CUST-117', plan: 'Premium', tenureMonths: 30, status: 'Active', cancellationReason: 'Not Applicable' },
      { customerId: 'CUST-118', plan: 'Basic', tenureMonths: 2, status: 'Cancelled', cancellationReason: 'Missing Features' },
      { customerId: 'CUST-119', plan: 'Standard', tenureMonths: 3, status: 'Cancelled', cancellationReason: 'Too Expensive' },
      { customerId: 'CUST-120', plan: 'Premium', tenureMonths: 12, status: 'Active', cancellationReason: 'Not Applicable' }
    ];

    const inserted = await Subscription.create(syntheticData);
    res.status(201).json({
      success: true,
      message: 'Synthetic dataset loaded successfully.',
      count: inserted.length
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;