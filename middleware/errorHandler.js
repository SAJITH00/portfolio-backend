const errorHandler = (err, req, res, next) => {
  if (err.code === 'CORS_ORIGIN_BLOCKED') {
    return res.status(403).json({
      success: false,
      message: 'Origin is not allowed by CORS policy.',
    });
  }

  console.error('[Unhandled Server Error]', err.message || err);

  if (err.name === 'MongooseError' || err.name === 'MongoServerSelectionError') {
    return res.status(503).json({
      success: false,
      message: 'Database service currently unavailable. Please verify MongoDB connection string in .env.',
    });
  }

  const statusCode = err.statusCode || err.status || (res.statusCode === 200 ? 500 : res.statusCode);
  const response = {
    success: false,
    message: err.message || 'Internal Server Error occurred. Please try again later.',
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
