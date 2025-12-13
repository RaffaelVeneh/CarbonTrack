const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Check Availability
router.get('/check-availability', authController.checkAvailability);

// Authentication
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google-auth', authController.googleAuth);

// Email Verification
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// Password Reset
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;