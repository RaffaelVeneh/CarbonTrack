const express = require('express');
const router = express.Router();
const dailyMissionController = require('../controllers/dailyMissionController');

// GET daily missions untuk user
router.get('/:userId', dailyMissionController.getDailyMissions);

// GET plant health untuk user
router.get('/plant-health/:userId', dailyMissionController.getPlantHealth);

// POST claim daily mission
router.post('/claim', dailyMissionController.claimDailyMission);

// POST reset health (cron job endpoint)
router.post('/reset-health', dailyMissionController.resetHealthDaily);

module.exports = router;
