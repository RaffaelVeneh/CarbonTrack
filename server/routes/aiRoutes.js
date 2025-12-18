const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyUserToken } = require('../middleware/authMiddleware');

// Protected routes (require JWT authentication)
router.post('/ask', verifyUserToken, aiController.askAssistant);

module.exports = router;