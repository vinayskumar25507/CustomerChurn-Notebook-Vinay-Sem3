const VALID_PLANS = ['Basic', 'Standard', 'Premium'];
const VALID_STATUSES = ['Active', 'Cancelled'];
const VALID_REASONS = ['Too Expensive', 'Missing Features', 'Switched Competitor', 'Technical Issues', 'Not Applicable'];
const VALID_BANDS = ['0-3 Months', '4-12 Months', '12+ Months'];

const validateSubscriptionInput = (req, res, next) => {
  const { customerId, plan, tenureMonths, status, cancellationReason } = req.body;
  const errors = [];

  if (!customerId || typeof customerId !== 'string' || customerId.trim() === '') {
    errors.push('Valid customerId is required.');
  }
  if (!VALID_PLANS.includes(plan)) {
    errors.push(`Plan must be one of: ${VALID_PLANS.join(', ')}`);
  }
  if (tenureMonths === undefined || isNaN(tenureMonths) || Number(tenureMonths) < 1) {
    errors.push('tenureMonths must be a number greater than or equal to 1.');
  }
  if (!VALID_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  if (status === 'Cancelled' && (!cancellationReason || cancellationReason === 'Not Applicable' || !VALID_REASONS.includes(cancellationReason))) {
    errors.push('A valid cancellationReason is required when status is Cancelled.');
  }

  if (errors.length > 0) {
    const error = new Error(errors.join(' '));
    error.statusCode = 400;
    return next(error);
  }
  next();
};

const validateQueryFilters = (req, res, next) => {
  const { plan, tenureBand } = req.query;
  if (plan && !VALID_PLANS.includes(plan)) {
    const error = new Error(`Invalid plan filter. Allowed: ${VALID_PLANS.join(', ')}`);
    error.statusCode = 400;
    return next(error);
  }
  if (tenureBand && !VALID_BANDS.includes(tenureBand)) {
    const error = new Error(`Invalid tenureBand filter. Allowed: ${VALID_BANDS.join(', ')}`);
    error.statusCode = 400;
    return next(error);
  }
  next();
};

module.exports = { validateSubscriptionInput, validateQueryFilters };