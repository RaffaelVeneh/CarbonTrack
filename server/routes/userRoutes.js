const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyUserToken } = require('../middleware/authMiddleware');

// Public route (no auth required)
router.get('/leaderboard', userController.getLeaderboard);

// Protected routes (require JWT authentication)
router.get('/profile/:userId', verifyUserToken, userController.getUserProfile);
router.get('/account-info/:userId', verifyUserToken, userController.getAccountInfo);
router.put('/update', verifyUserToken, userController.updateProfile);
router.put('/privacy', verifyUserToken, userController.updatePrivacy);
router.put('/change-password', verifyUserToken, userController.changePassword);

module.exports = router;