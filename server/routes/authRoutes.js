const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
    validateRegister,
    validateLogin,
    validateEmail,
    validatePasswordReset
} = require('../middleware/validators');

// Check Availability
router.get('/check-availability', authController.checkAvailability);

// Authentication (with validation)
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/google-auth', authController.googleAuth); // OAuth doesn't need validation

// Email Verification
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', validateEmail, authController.resendVerification);

// Password Reset (with validation)
router.post('/forgot-password', validateEmail, authController.forgotPassword);
router.post('/reset-password', validatePasswordReset, authController.resetPassword);

// Token Management
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

module.exports = router;