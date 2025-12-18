const express = require('express');
const router = express.Router();
const dailyMissionController = require('../controllers/dailyMissionController');
const { verifyUserToken } = require('../middleware/authMiddleware');

// Protected routes (require JWT authentication)
router.get('/:userId', verifyUserToken, dailyMissionController.getDailyMissions);
router.get('/plant-health/:userId', verifyUserToken, dailyMissionController.getPlantHealth);
router.post('/claim', verifyUserToken, dailyMissionController.claimDailyMission);

// Cron job endpoint (no auth - should be called from internal scheduler)
router.post('/reset-health', dailyMissionController.resetHealthDaily);

module.exports = router;
