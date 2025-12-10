const express = require('express');
const router = express.Router();
const missionController = require('../controllers/missionControllerV2');

router.get('/:userId', missionController.getMissions);
router.post('/claim', missionController.claimMission);
router.get('/history/:userId', missionController.getMissionHistory);

module.exports = router;