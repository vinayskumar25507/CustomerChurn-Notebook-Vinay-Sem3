const errorHandler = (err, req, res, next) => {
  console.error(`[Error]: ${err.message}`);

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate Customer ID. Every subscription record must have a unique customerId.'
    });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      error: messages.join(', ')
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;