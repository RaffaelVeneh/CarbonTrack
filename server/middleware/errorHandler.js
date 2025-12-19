/**
 * 🙈 ERROR HANDLING MIDDLEWARE
 * Hides error details in production, shows full details in development
 * Prevents information leakage to potential attackers
 */

/**
 * Global Error Handler
 * Catches all errors and provides appropriate responses
 * 
 * @param {Error} err - Error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
const errorHandler = (err, req, res, next) => {
    // Log full error details to console (for developers)
    console.error('\n❌ ERROR OCCURRED:');
    console.error('Time:', new Date().toISOString());
    console.error('Path:', req.method, req.originalUrl);
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    
    // Determine status code
    const statusCode = err.statusCode || res.statusCode || 500;
    
    // Check if we're in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Response object
    const errorResponse = {
        success: false,
        message: isProduction 
            ? 'Terjadi kesalahan pada server' 
            : err.message || 'Server Error',
        status: statusCode
    };
    
    // In development, include additional debug info
    if (!isProduction) {
        errorResponse.stack = err.stack;
        errorResponse.path = req.originalUrl;
        errorResponse.method = req.method;
        errorResponse.timestamp = new Date().toISOString();
    }
    
    res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found Handler
 * Handles requests to non-existent routes
 */
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Route not found - ${req.originalUrl}`);
    error.statusCode = 404;
    
    // Log 404 attempts (could be scanning/probing)
    console.warn('\n⚠️ 404 NOT FOUND:');
    console.warn('Path:', req.method, req.originalUrl);
    console.warn('IP:', req.ip || req.connection.remoteAddress);
    console.warn('User-Agent:', req.get('user-agent'));
    
    next(error);
};

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch promise rejections
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Safe Error Logger
 * Logs errors without exposing sensitive data
 * 
 * @param {Error} err - Error to log
 * @param {Object} context - Additional context
 */
const logError = (err, context = {}) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Always log to console
    console.error('\n❌ APPLICATION ERROR:');
    console.error('Message:', err.message);
    console.error('Time:', new Date().toISOString());
    
    if (context.userId) {
        console.error('User ID:', context.userId);
    }
    
    if (context.action) {
        console.error('Action:', context.action);
    }
    
    // Stack trace only in development
    if (!isProduction) {
        console.error('Stack:', err.stack);
    }
    
    // In production, you could send to error tracking service
    // Example: Sentry.captureException(err, { extra: context });
};

/**
 * Sanitize Error Message
 * Removes sensitive information from error messages
 * 
 * @param {string} message - Original error message
 * @returns {string} Sanitized message
 */
const sanitizeErrorMessage = (message) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
        // In production, use generic messages
        if (message.includes('ECONNREFUSED') || message.includes('database')) {
            return 'Layanan tidak tersedia saat ini';
        }
        
        if (message.includes('timeout')) {
            return 'Permintaan memakan waktu terlalu lama';
        }
        
        if (message.includes('validation') || message.includes('invalid')) {
            return 'Data yang diberikan tidak valid';
        }
        
        if (message.includes('unauthorized') || message.includes('forbidden')) {
            return 'Akses ditolak';
        }
        
        if (message.includes('not found')) {
            return 'Data tidak ditemukan';
        }
        
        // Default generic message
        return 'Terjadi kesalahan pada server';
    }
    
    // In development, return original message
    return message;
};

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    logError,
    sanitizeErrorMessage
};
