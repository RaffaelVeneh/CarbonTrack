/**
 * 🔍 INPUT VALIDATION MIDDLEWARE
 * Validates and sanitizes all user inputs to prevent:
 * - XSS attacks (script injection)
 * - SQL injection (parameterized queries help, but extra layer)
 * - Invalid data formats
 * - Malicious inputs
 */

const { body, param, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 * Returns 400 with detailed error messages
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// ==============================================
// 🔐 AUTH VALIDATIONS
// ==============================================

/**
 * Register Validation Rules
 * - Username: 3-20 chars, alphanumeric + underscore only
 * - Email: valid email format
 * - Password: min 6 chars
 */
const validateRegister = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('Username harus 3-20 karakter')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username hanya boleh huruf, angka, dan underscore')
        .escape(), // Sanitize HTML
    
    body('email')
        .trim()
        .isEmail()
        .withMessage('Email tidak valid')
        .normalizeEmail(),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password minimal 6 karakter')
        .matches(/^(?=.*[a-zA-Z])(?=.*[0-9])/)
        .withMessage('Password harus mengandung huruf dan angka'),
    
    handleValidationErrors
];

/**
 * Login Validation Rules
 * - Email: valid email format
 * - Password: not empty
 */
const validateLogin = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Email tidak valid')
        .normalizeEmail(),
    
    body('password')
        .notEmpty()
        .withMessage('Password tidak boleh kosong'),
    
    handleValidationErrors
];

/**
 * Email Validation (Forgot Password)
 */
const validateEmail = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Email tidak valid')
        .normalizeEmail(),
    
    handleValidationErrors
];

/**
 * Password Reset Validation
 */
const validatePasswordReset = [
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password minimal 6 karakter')
        .matches(/^(?=.*[a-zA-Z])(?=.*[0-9])/)
        .withMessage('Password harus mengandung huruf dan angka'),
    
    handleValidationErrors
];

// ==============================================
// 📝 ACTIVITY LOG VALIDATIONS
// ==============================================

/**
 * Activity Log Validation
 * - user_id: must be positive integer
 * - activity_id: must be positive integer
 * - input_value: must be positive number (no negative km, kWh, etc)
 * - date: valid date format (YYYY-MM-DD)
 */
const validateActivityLog = [
    body('user_id')
        .isInt({ min: 1 })
        .withMessage('User ID tidak valid'),
    
    body('activity_id')
        .isInt({ min: 1 })
        .withMessage('Activity ID tidak valid'),
    
    body('input_value')
        .isFloat({ min: 0.01, max: 10000 })
        .withMessage('Input value harus antara 0.01 - 10000')
        .toFloat(),
    
    body('date')
        .optional()
        .isDate()
        .withMessage('Format tanggal tidak valid (gunakan YYYY-MM-DD)'),
    
    handleValidationErrors
];

// ==============================================
// 👤 USER PROFILE VALIDATIONS
// ==============================================

/**
 * Username Update Validation
 * - Username: 3-20 chars, alphanumeric + underscore only
 * - No script tags or HTML
 */
const validateUsernameUpdate = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('Username harus 3-20 karakter')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username hanya boleh huruf, angka, dan underscore')
        .escape(),
    
    handleValidationErrors
];

// ==============================================
// 🎯 MISSION VALIDATIONS
// ==============================================

/**
 * Mission Claim Validation
 * - userId: positive integer
 * - missionId: positive integer
 */
const validateMissionClaim = [
    body('userId')
        .isInt({ min: 1 })
        .withMessage('User ID tidak valid'),
    
    body('missionId')
        .isInt({ min: 1 })
        .withMessage('Mission ID tidak valid'),
    
    handleValidationErrors
];

// ==============================================
// 🤖 AI VALIDATIONS
// ==============================================

/**
 * AI Question Validation
 * - question: 3-500 chars, sanitized
 */
const validateAIQuestion = [
    body('question')
        .trim()
        .isLength({ min: 3, max: 500 })
        .withMessage('Pertanyaan harus 3-500 karakter')
        .escape(),
    
    handleValidationErrors
];

// ==============================================
// 👨‍💼 ADMIN VALIDATIONS
// ==============================================

/**
 * Admin Login Validation
 */
const validateAdminLogin = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username tidak boleh kosong')
        .escape(),
    
    body('password')
        .notEmpty()
        .withMessage('Password tidak boleh kosong'),
    
    handleValidationErrors
];

/**
 * User Status Update Validation (Ban/Unban)
 */
const validateUserStatusUpdate = [
    param('userId')
        .isInt({ min: 1 })
        .withMessage('User ID tidak valid'),
    
    body('status')
        .isIn(['online', 'offline', 'banned', 'idle'])
        .withMessage('Status harus: online, offline, banned, atau idle'),
    
    handleValidationErrors
];

// ==============================================
// 📤 EXPORTS
// ==============================================

module.exports = {
    // Auth
    validateRegister,
    validateLogin,
    validateEmail,
    validatePasswordReset,
    
    // Activity
    validateActivityLog,
    
    // User
    validateUsernameUpdate,
    
    // Mission
    validateMissionClaim,
    
    // AI
    validateAIQuestion,
    
    // Admin
    validateAdminLogin,
    validateUserStatusUpdate,
    
    // Generic
    handleValidationErrors
};
