const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { verifyUserToken } = require('../middleware/authMiddleware');
const { validateActivityLog } = require('../middleware/validators');

// Protected routes (require JWT authentication + validation)
router.get('/activities', verifyUserToken, logController.getActivities);
router.post('/', verifyUserToken, validateActivityLog, logController.createLog);
router.get('/summary/:userId', verifyUserToken, logController.getDashboardSummary);
router.get('/history/:userId', verifyUserToken, logController.getHistoryLogs);
router.get('/daily/:userId', verifyUserToken, logController.getDailyLogs);

module.exports = router;