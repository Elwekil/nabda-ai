const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../Middleware/authMiddleware');
const {
    getDocuments,
    getDocumentById,
    uploadDocument,
    deleteDocument,
    getDocumentAnalysis,
    runAIAnalysis,
    analyzeLocalImage,
} = require('../Controllers/documentController');

// Multer config - save to uploads/ (disk storage for regular uploads)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        const unique = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${unique}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'text/plain'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('نوع الملف غير مدعوم. يُسمح فقط بـ PDF, JPEG, PNG, TXT'), false);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

// Multer config - memory storage for local AI analysis (buffer needed directly)
const analyzeFileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('نوع الملف غير مدعوم. يُسمح فقط بـ JPEG, PNG, PDF'), false);
};

const uploadMemory = multer({
    storage: multer.memoryStorage(),
    fileFilter: analyzeFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.use(protect);

router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.get('/:id/analysis', getDocumentAnalysis);

// Upload with multer error handling
router.post('/', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, message: 'حجم الملف كبير جداً. الحد الأقصى 10MB' });
            }
            return res.status(400).json({ success: false, message: err.message || 'خطأ في رفع الملف' });
        }
        next();
    });
}, uploadDocument);

// Local AI image analysis — uses memory storage so buffer is available directly
router.post('/analyze-local', (req, res, next) => {
    uploadMemory.single('file')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, message: 'حجم الملف كبير جداً. الحد الأقصى 10MB' });
            }
            return res.status(400).json({ success: false, message: err.message || 'خطأ في رفع الملف' });
        }
        next();
    });
}, analyzeLocalImage);

router.post('/:id/analyze', runAIAnalysis);
router.delete('/:id', deleteDocument);

module.exports = router;
