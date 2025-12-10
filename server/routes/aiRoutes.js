const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Route untuk tanya AI
router.post('/ask', aiController.askAssistant);

module.exports = router;