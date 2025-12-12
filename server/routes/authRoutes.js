const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Authentication
router.post('/register', authController.register);
router.post('/login', authController.login);

// Email Verification
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// Password Reset
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;