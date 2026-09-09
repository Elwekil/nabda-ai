const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../Middleware/authMiddleware');
const { getProfile, updateProfile, uploadProfileImage, getDashboardStats, getHealthReport, exportMedicalFile } = require('../Controllers/userController');
const { getMedicalContext } = require('../Controllers/aiController');

// Multer for profile images
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/profiles');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `profile_${req.user?.id || Date.now()}${ext}`);
    }
});

const profileUpload = multer({
    storage: profileStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only images allowed'), false);
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/image', (req, res, next) => {
    profileUpload.single('image')(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, message: err.message });
        next();
    });
}, uploadProfileImage);
router.get('/dashboard-stats', getDashboardStats);
router.get('/health-report', getHealthReport);

// Export medical file to email
router.post('/export-medical-file', exportMedicalFile);

// Feature 4 - Get medical context for AI chatbot
router.get('/medical-context', getMedicalContext);

module.exports = router;
