/**
 * Centralized Express error handler.
 * Must be registered as the LAST middleware (4 args).
 */
const errorHandler = (err, req, res, next) => {
    console.error('[Error]', err.message, err.stack);

    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const code = err.code || 'INTERNAL_ERROR';

    // Never leak stack traces to the client in production
    const body = {
        success: false,
        message: process.env.NODE_ENV === 'production' && status === 500
            ? 'Internal Server Error'
            : message,
        code,
    };

    if (err.errors) body.errors = err.errors;

    res.status(status).json(body);
};

/**
 * Wraps async route handlers so thrown errors propagate to Express error handler.
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Create a structured application error.
 */
const createError = (message, status = 500, code = 'ERROR') => {
    const err = new Error(message);
    err.status = status;
    err.code = code;
    return err;
};

module.exports = { errorHandler, asyncHandler, createError };
