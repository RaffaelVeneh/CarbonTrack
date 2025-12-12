const express = require('express');
const router = express.Router();
const weeklyMissionController = require('../controllers/weeklyMissionController');

// GET weekly missions untuk user
router.get('/:userId', weeklyMissionController.getWeeklyMissions);

// POST claim weekly mission
router.post('/claim', weeklyMissionController.claimWeeklyMission);

module.exports = router;
