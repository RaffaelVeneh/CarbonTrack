const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { verifyUserToken } = require('../middleware/authMiddleware');

// Protected routes (require JWT authentication)
router.get('/activities', verifyUserToken, logController.getActivities);
router.post('/', verifyUserToken, logController.createLog);
router.get('/summary/:userId', verifyUserToken, logController.getDashboardSummary);
router.get('/history/:userId', verifyUserToken, logController.getHistoryLogs);
router.get('/daily/:userId', verifyUserToken, logController.getDailyLogs);

module.exports = router;