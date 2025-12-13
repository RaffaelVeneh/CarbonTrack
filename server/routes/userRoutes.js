const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Route untuk Leaderboard
router.get('/leaderboard', userController.getLeaderboard);

// Route untuk Profil
router.get('/profile/:userId', userController.getUserProfile);

// Route untuk Settings
router.get('/account-info/:userId', userController.getAccountInfo);
router.put('/update', userController.updateProfile);
router.put('/privacy', userController.updatePrivacy);
router.put('/change-password', userController.changePassword);

module.exports = router;