/**
 * Centralized Error Handling Utility
 * Provides standardized error handling, logging, and user-friendly messages
 */

const ExpressError = require('./ExpressError');

/**
 * Error logger with context
 */
const logError = (error, context = {}) => {
    const timestamp = new Date().toISOString();
    const errorLog = {
        timestamp,
        message: error.message,
        stack: error.stack,
        context
    };
    console.error(JSON.stringify(errorLog, null, 2));
    return errorLog;
};

/**
 * Handle MongoDB Cast Errors (invalid ObjectId)
 */
const handleCastError = (err) => {
    const message = `Invalid ID: ${err.path}`;
    return new ExpressError(400, message);
};

/**
 * Handle MongoDB Validation Errors
 */
const handleValidationError = (err) => {
    const messages = Object.values(err.errors)
        .map(val => val.message)
        .join(', ');
    return new ExpressError(400, `Validation Error: ${messages}`);
};

/**
 * Handle MongoDB Duplicate Key Errors
 */
const handleDuplicateKeyError = (err) => {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    return new ExpressError(400, message);
};

/**
 * Handle JWT Errors
 */
const handleJWTError = () => {
    return new ExpressError(401, 'Invalid token. Please log in again.');
};

/**
 * Handle JWT Expired Errors
 */
const handleJWTExpiredError = () => {
    return new ExpressError(401, 'Token expired. Please log in again.');
};

/**
 * Convert Mongoose errors to ExpressError
 */
const convertMongooseError = (err) => {
    if (err.name === 'CastError') {
        return handleCastError(err);
    }
    if (err.name === 'ValidationError') {
        return handleValidationError(err);
    }
    if (err.code === 11000) {
        return handleDuplicateKeyError(err);
    }
    if (err.name === 'JsonWebTokenError') {
        return handleJWTError();
    }
    if (err.name === 'TokenExpiredError') {
        return handleJWTExpiredError();
    }
    return null;
};

/**
 * Async error wrapper - wraps async route handlers to catch errors
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Standardized error response
 */
const sendErrorResponse = (err, req, res) => {
    const { statusCode = 500, message = 'Something went wrong!' } = err;
    
    // Log the error
    logError(err, {
        method: req.method,
        url: req.originalUrl,
        userId: req.user?._id,
        statusCode
    });
    
    // Don't expose internal server details in production
    const userMessage = statusCode === 500 && process.env.NODE_ENV === 'production' 
        ? 'Internal server error. Please try again later.'
        : message;
    
    // For JSON requests, send JSON response
    if (req.accepts('json')) {
        return res.status(statusCode).json({
            success: false,
            error: userMessage,
            statusCode
        });
    }
    
    // For HTML requests, render error page
    res.status(statusCode).render('error', { 
        message: userMessage,
        statusCode 
    });
};

/**
 * Validation error helper - formats Joi validation errors
 */
const formatValidationError = (error) => {
    if (!error) return null;
    
    const messages = error.details
        .map(detail => detail.message)
        .join('; ');
    
    return new ExpressError(400, messages);
};

module.exports = {
    logError,
    handleCastError,
    handleValidationError,
    handleDuplicateKeyError,
    handleJWTError,
    handleJWTExpiredError,
    convertMongooseError,
    catchAsync,
    sendErrorResponse,
    formatValidationError
};
