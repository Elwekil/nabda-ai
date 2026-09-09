const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/authMiddleware');
const { triggerSOS, triggerEmergency } = require('../Controllers/sosController');
const { sosLimiter } = require('../Middleware/rateLimiter');

router.use(protect);

// Apply rate limiting to SOS endpoints to prevent abuse
router.post('/', sosLimiter, triggerSOS);
router.post('/emergency', sosLimiter, triggerEmergency);

module.exports = router;
