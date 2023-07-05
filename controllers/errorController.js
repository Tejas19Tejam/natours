const AppError = require('../utils/appError');

module.exports = (err, req, res, next) => {
  // 500 ==> Internal Server Error
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Error Separation for Production and Development  Environment
  const errorForProd = function (err, req, res) {
    // A) API (If URL starts with /api )
    if (req.originalUrl.startsWith('/api')) {
      // 1) Operational Error (If error is operational error or Expected error  then send this response to the client)
      if (err.isOperational) {
        return res.status(err.statusCode).json({
          status: err.status,
          message: err.message,
        });
      }
      // 2 ) Programming Error or Unknown Error : Don't leak information to client
      console.error(err);
      return res.status(500).json({
        status: 'error',
        message: 'Something went very wrong !',
      });
    }
    // B ) Rendering Pages
    // 1 ) Operational
    if (err.isOperational) {
      return res.status(err.statusCode).render('error', {
        title: 'Something went wrong !',
        msg: err.message,
      });
    }
    // 2) Programming Error or Unknown Error : Don't leak information to client
    console.error(err);
    return res.status(500).render('error', {
      title: 'Something went very wrong !',
      msg: 'Please try after some time',
    });
  };

  const errorForDev = function (err, req, res) {
    // API
    if (req.originalUrl.startsWith('/api')) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        isOperational: err.isOperational,
        stack: err.stack,
        error: err,
      });
      // RENDERED WEBSITES
    } else {
      return res.status(err.statusCode).render('error', {
        title: 'Something went wrong !',
        msg: err.message,
      });
    }
  };

  const handleCastErrorDB = function (err) {
    const message = `Invalid ${err.path}:${err.value}.`;
    return new AppError(message, 400);
  };

  const handleDuplicateFieldErrorDB = function (err) {
    const fieldName = err.keyValue.name;
    const message = `${fieldName} tour is already exist`;
    return new AppError(message, 400);
  };

  const handleValidationErrorDB = function (err) {
    const errors = Object.values(err.errors).map((elm) => elm.message);
    const message = `Invalid input data . ${errors.join('. ')}`;
    return new AppError(message, 400);
  };

  const handleJWTInvalidError = (err) =>
    new AppError('Invalid Token,please try to login again !', 401);

  const handleJWTExpError = (err) =>
    new AppError('Your token is expired,please login again !', 404);

  // PRODUCTION
  if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    // Handling CastError (Invalid ID )
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    // Handling Duplicate Entry
    if (error.code === 11000) error = handleDuplicateFieldErrorDB(error);
    // Validation Error
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    // Handle Web token incorrect error
    if (error.name === 'JsonWebTokenError')
      error = handleJWTInvalidError(error);
    // Handle JWT expire Error
    if (error.name === 'TokenExpiredError') error = handleJWTExpError(error);

    errorForProd(error, req, res);
  }
  // DEVELOPMENT
  else if (process.env.NODE_ENV === 'development') {
    errorForDev(err, req, res);
  }
};
