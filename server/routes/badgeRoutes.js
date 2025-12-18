const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');
const { verifyUserToken } = require('../middleware/authMiddleware');

// Protected routes (require JWT authentication)
router.get('/', verifyUserToken, badgeController.getAllBadges);
router.post('/check', verifyUserToken, badgeController.checkAndAwardBadges);
router.get('/user/:userId', verifyUserToken, badgeController.getUserBadges);

module.exports = router;
