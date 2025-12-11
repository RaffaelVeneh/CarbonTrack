const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');

// GET /api/badges - Get all badges dengan status locked/unlocked
router.get('/', badgeController.getAllBadges);

// POST /api/badges/check - Check dan award badges (dipanggil setelah mission/activity)
router.post('/check', badgeController.checkAndAwardBadges);

// GET /api/badges/user/:userId - Get badges yang sudah unlocked oleh user
router.get('/user/:userId', badgeController.getUserBadges);

module.exports = router;
