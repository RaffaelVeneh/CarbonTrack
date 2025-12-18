const express = require('express');
const router = express.Router();
const weeklyMissionController = require('../controllers/weeklyMissionController');
const { verifyUserToken } = require('../middleware/authMiddleware');

// Protected routes (require JWT authentication)
router.get('/:userId', verifyUserToken, weeklyMissionController.getWeeklyMissions);
router.post('/claim', verifyUserToken, weeklyMissionController.claimWeeklyMission);

module.exports = router;
