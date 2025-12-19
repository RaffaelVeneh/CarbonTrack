const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyUserToken } = require('../middleware/authMiddleware');
const { validateAIQuestion } = require('../middleware/validators');

// Protected routes (require JWT authentication + validation)
router.post('/ask', verifyUserToken, validateAIQuestion, aiController.askAssistant);

module.exports = router;