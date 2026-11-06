const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: [true, 'Customer ID is required'],
    unique: true,
    trim: true
  },
  plan: {
    type: String,
    required: [true, 'Subscription plan is required'],
    enum: ['Basic', 'Standard', 'Premium']
  },
  tenureMonths: {
    type: Number,
    required: [true, 'Tenure in months is required'],
    min: [1, 'Tenure must be at least 1 month']
  },
  tenureBand: {
    type: String,
    enum: ['0-3 Months', '4-12 Months', '12+ Months']
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Cancelled'],
    default: 'Active'
  },
  cancellationReason: {
    type: String,
    enum: ['Too Expensive', 'Missing Features', 'Switched Competitor', 'Technical Issues', 'Not Applicable'],
    default: 'Not Applicable'
  }
}, { timestamps: true });

// Automatically compute tenureBand before saving
subscriptionSchema.pre('validate', function(next) {
  if (this.tenureMonths <= 3) {
    this.tenureBand = '0-3 Months';
  } else if (this.tenureMonths <= 12) {
    this.tenureBand = '4-12 Months';
  } else {
    this.tenureBand = '12+ Months';
  }

  if (this.status === 'Active') {
    this.cancellationReason = 'Not Applicable';
  }
  next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema);