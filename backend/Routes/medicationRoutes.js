const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/authMiddleware');
const {
    getMedications,
    getMedicationById,
    addMedication,
    updateMedication,
    updateMedicationStatus,
    deleteMedication,
    getMedicationStats,
    analyzeMedicationAI,
    checkInteractionsLocal
} = require('../Controllers/medicationController');

router.use(protect);

router.get('/', getMedications);
router.get('/stats', getMedicationStats);
router.post('/', addMedication);
router.post('/analyze', analyzeMedicationAI);
router.post('/check-interactions-local', checkInteractionsLocal);
router.get('/:id', getMedicationById);
router.put('/:id', updateMedication);
router.put('/:id/status', updateMedicationStatus);
router.delete('/:id', deleteMedication);

module.exports = router;