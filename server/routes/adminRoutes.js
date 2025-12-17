const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.post('/login', adminController.login);

// Protected routes (require authentication)
router.get('/profile', verifyToken, isAdmin, adminController.getProfile);
router.get('/dashboard/stats', verifyToken, isAdmin, adminController.getDashboardStats);
router.get('/users', verifyToken, isAdmin, adminController.getAllUsers);
router.get('/users/:userId', verifyToken, isAdmin, adminController.getUserDetails);
router.put('/change-password', verifyToken, isAdmin, adminController.changePassword);

module.exports = router;
