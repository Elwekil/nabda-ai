const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/authMiddleware');
const {
    getLatestVitals,
    getVitalsHistory,
    getVitalsByDateRange,
    addVitals,
    updateVitals,
    deleteVitals,
    getVitalsStats
} = require('../Controllers/vitalsController');

// All routes require authentication
router.use(protect);

// GET routes
router.get('/latest', getLatestVitals);
router.get('/history', getVitalsHistory);
router.get('/range', getVitalsByDateRange);
router.get('/stats', getVitalsStats);

// POST routes
router.post('/', addVitals);

// PUT and DELETE routes
router.put('/:id', updateVitals);
router.delete('/:id', deleteVitals);

module.exports = router;