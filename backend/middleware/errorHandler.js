const { ERROR_CODES } = require('../utils/constants');

// Custom error class
class AppError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Error handler middleware
function errorHandler(err, req, res, next) {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
    });

    // Default error
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal server error';
    let code = error.code || ERROR_CODES.INTERNAL_ERROR;

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: {
            message: message,
            code: code,
            statusCode: statusCode
        }
    });
}

module.exports = {
    AppError,
    errorHandler
};
