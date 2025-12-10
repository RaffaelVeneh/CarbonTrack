const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Route untuk Leaderboard
router.get('/leaderboard', userController.getLeaderboard);

// Route untuk Profil
router.get('/profile/:userId', userController.getUserProfile);

router.put('/update', userController.updateProfile);

module.exports = router;