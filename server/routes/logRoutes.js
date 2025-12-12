const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');

router.get('/activities', logController.getActivities); // Ambil list aktivitas
router.post('/', logController.createLog);              // Submit log baru
router.get('/summary/:userId', logController.getDashboardSummary);
router.get('/history/:userId', logController.getHistoryLogs);
router.get('/daily/:userId', logController.getDailyLogs); // NEW: Get daily logs for recent activities

module.exports = router;