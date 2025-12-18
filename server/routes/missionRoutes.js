const express = require('express');
const router = express.Router();
const missionController = require('../controllers/missionControllerV2');
const { verifyUserToken } = require('../middleware/authMiddleware');

// Protected routes (require JWT authentication)
router.get('/:userId', verifyUserToken, missionController.getMissions);
router.post('/claim', verifyUserToken, missionController.claimMission);
router.get('/history/:userId', verifyUserToken, missionController.getMissionHistory);

module.exports = router;