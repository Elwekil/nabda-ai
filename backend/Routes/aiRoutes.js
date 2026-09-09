const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/authMiddleware');
const { aiLimiter } = require('../Middleware/rateLimiter');
const { 
    checkDrugInteraction, 
    medicalChat, 
    exportMedicalFile, 
    chatDiagnosis, 
    exportMedicalFilePDF, 
    getMedicalContext 
} = require('../Controllers/aiController');

// All routes require authentication
router.use(protect);

// Existing routes
router.post('/drug-interaction', checkDrugInteraction);
router.post('/chat', medicalChat);
router.post('/export-medical-file', exportMedicalFile);

// Feature 4 - AI Chatbot Diagnosis with rate limiting (50 req/15min)
router.post('/chat-diagnosis', aiLimiter, chatDiagnosis);

// Feature 4 - Export medical file as PDF
router.post('/export-medical-file-pdf', exportMedicalFilePDF);

module.exports = router;
