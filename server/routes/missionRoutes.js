const express = require('express');
const router = express.Router();
const missionController = require('../controllers/missionController');

router.get('/:userId', missionController.getMissions);
router.post('/claim', missionController.claimMission);

module.exports = router;