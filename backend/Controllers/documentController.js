const { pool } = require('../Config/db');
const ResponseFormatter = require('../Utils/responseFormatter');
const path = require('path');
const fs = require('fs');

// Inline audit logger — writes to audit_logs table (created by migrateAI.js)
async function logAuditEvent(userId, eventType, eventData, req) {
    try {
        await pool.execute(
            `INSERT INTO audit_logs (user_id, event_type, event_data, ip_address, user_agent, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [
                userId,
                eventType,
                JSON.stringify(eventData || {}),
                (req && req.ip) || null,
                (req && req.headers && req.headers['user-agent']) || null,
            ]
        );
    } catch (err) {
        // Non-fatal — log to console but don't block the response
        console.error('Audit log failed:', err.message);
    }
}

// @desc    Get all documents
// @route   GET /api/documents
// @access  Private
const getDocuments = async (req, res) => {
    try {
        const [documents] = await pool.execute(
            `SELECT id, file_name, file_path, file_type, file_size, document_type, upload_date, ai_analysis, created_at
             FROM medical_documents 
             WHERE user_id = ? 
             ORDER BY upload_date DESC`,
            [req.user.id]
        );
        return ResponseFormatter.list(res, documents, null, null, null, 'Documents retrieved successfully');
    } catch (error) {
        console.error('Get documents error:', error);
        return ResponseFormatter.error(res, 'Failed to retrieve documents', 500);
    }
};

// @desc    Get document by ID
// @route   GET /api/documents/:id
// @access  Private
const getDocumentById = async (req, res) => {
    try {
        const { id } = req.params;
        const [documents] = await pool.execute(
            `SELECT id, file_name, file_path, file_type, file_size, document_type, upload_date, ai_analysis
             FROM medical_documents WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );
        if (documents.length === 0) return ResponseFormatter.notFound(res, 'Document');
        return ResponseFormatter.success(res, documents[0], 'Document retrieved successfully');
    } catch (error) {
        console.error('Get document error:', error);
        return ResponseFormatter.error(res, 'Failed to retrieve document', 500);
    }
};

// @desc    Upload document (with actual file)
// @route   POST /api/documents
// @access  Private
const uploadDocument = async (req, res) => {
    try {
        const { document_type, upload_date } = req.body;

        if (!req.file) {
            return ResponseFormatter.validationError(res, { file: 'File is required' });
        }

        const file_name = req.file.originalname;
        const file_type = req.file.mimetype;
        const file_size = req.file.size;
        const file_path = `/uploads/${req.file.filename}`;

        const [result] = await pool.execute(
            `INSERT INTO medical_documents (user_id, file_name, file_path, file_type, file_size, document_type, upload_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, file_name, file_path, file_type, file_size, document_type || 'other',
             upload_date || new Date().toISOString().split('T')[0]]
        );

        const [newDocument] = await pool.execute(
            'SELECT id, file_name, file_path, file_type, document_type, upload_date FROM medical_documents WHERE id = ?',
            [result.insertId]
        );

        return ResponseFormatter.created(res, newDocument[0], 'Document uploaded successfully');
    } catch (error) {
        console.error('Upload document error FULL:', error.message, error.sqlMessage || '', error.code || '');
        return ResponseFormatter.error(res, error.message || 'Failed to upload document', 500);
    }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const [docs] = await pool.execute(
            'SELECT file_path FROM medical_documents WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        const [result] = await pool.execute(
            'DELETE FROM medical_documents WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (result.affectedRows === 0) return ResponseFormatter.notFound(res, 'Document');

        if (docs.length > 0) {
            const absPath = path.join(__dirname, '..', docs[0].file_path);
            if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
        }

        return ResponseFormatter.success(res, { id }, 'Document deleted successfully');
    } catch (error) {
        console.error('Delete document error:', error);
        return ResponseFormatter.error(res, 'Failed to delete document', 500);
    }
};

// @desc    Get AI analysis for document
// @route   GET /api/documents/:id/analysis
// @access  Private
const getDocumentAnalysis = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch the document (ensures ownership)
        const [documents] = await pool.execute(
            'SELECT id, file_name, ai_analysis FROM medical_documents WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        if (documents.length === 0) return ResponseFormatter.notFound(res, 'Document');

        // Also check medical_image_analysis table for local AI results
        let localAnalysis = null;
        try {
            const [rows] = await pool.execute(
                `SELECT id, image_type, extracted_text, extracted_values, analysis,
                        treatment_suggestions, confidence, warnings, analyzed_at
                 FROM medical_image_analysis
                 WHERE document_id = ? AND user_id = ?
                 ORDER BY analyzed_at DESC
                 LIMIT 1`,
                [id, req.user.id]
            );
            if (rows.length > 0) {
                const row = rows[0];
                localAnalysis = {
                    id: row.id,
                    imageType: row.image_type,
                    extractedText: row.extracted_text,
                    extractedValues: typeof row.extracted_values === 'string'
                        ? JSON.parse(row.extracted_values) : row.extracted_values,
                    analysis: row.analysis,
                    treatmentSuggestions: typeof row.treatment_suggestions === 'string'
                        ? JSON.parse(row.treatment_suggestions) : row.treatment_suggestions,
                    confidence: row.confidence,
                    warnings: typeof row.warnings === 'string'
                        ? JSON.parse(row.warnings) : row.warnings,
                    analyzedAt: row.analyzed_at,
                };
            }
        } catch (err) {
            // Table may not exist yet — degrade gracefully
            console.warn('medical_image_analysis table not available:', err.message);
        }

        return ResponseFormatter.success(res, {
            documentId: id,
            fileName: documents[0].file_name,
            analysis: documents[0].ai_analysis || null,
            analyzed: !!(documents[0].ai_analysis || localAnalysis),
            localAnalysis,
        }, 'Document analysis retrieved successfully');
    } catch (error) {
        console.error('Get document analysis error:', error);
        return ResponseFormatter.error(res, 'Failed to retrieve document analysis', 500);
    }
};

// @desc    Analyze an uploaded image/PDF locally using AI (no document record required)
// @route   POST /api/documents/analyze-local
// @access  Private
const analyzeLocalImage = async (req, res) => {
    try {
        if (!req.file) {
            return ResponseFormatter.badRequest(res, 'الملف مطلوب');
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return ResponseFormatter.badRequest(res, 'نوع الملف غير مدعوم. يُسمح فقط بـ JPEG, PNG, PDF');
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (req.file.size > maxSize) {
            return ResponseFormatter.badRequest(res, 'حجم الملف كبير جداً. الحد الأقصى 10MB');
        }

        const documentType = (req.body && req.body.documentType) || 'unknown';
        const userId = req.user.id;

        // Use the buffer directly from multer memoryStorage
        const fileBuffer = req.file.buffer;

        const { analyzeImageLocally } = require('../Services/localImageAnalysisService');
        const result = await analyzeImageLocally(fileBuffer, documentType, userId);

        // Audit log
        await logAuditEvent(userId, 'IMAGE_ANALYSIS', {
            documentType,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            confidence: result.confidence,
        }, req);

        return ResponseFormatter.success(res, result, 'تم تحليل الصورة بنجاح');
    } catch (error) {
        console.error('Analyze local image error:', error);
        if (error.code === 'OLLAMA_UNAVAILABLE' || error.message?.includes('Ollama')) {
            return ResponseFormatter.error(res, 'خدمة الذكاء الاصطناعي غير متاحة. تأكد من تشغيل Ollama محلياً.', 503);
        }
        return ResponseFormatter.error(res, 'فشل في تحليل الصورة', 500);
    }
};

// @desc    Run AI analysis on document
// @route   POST /api/documents/:id/analyze
// @access  Private
const runAIAnalysis = async (req, res) => {
    try {
        const { id } = req.params;

        const [documents] = await pool.execute(
            'SELECT id, file_name, file_path, file_type, document_type FROM medical_documents WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        if (documents.length === 0) return ResponseFormatter.notFound(res, 'Document');

        const doc = documents[0];
        const absPath = path.join(__dirname, '..', doc.file_path);

        const { analyzeMedicalDocument } = require('../Utils/aiAnalysis');
        const analysis = await analyzeMedicalDocument(absPath, doc.file_name, doc.file_type, doc.document_type);

        await pool.execute(
            'UPDATE medical_documents SET ai_analysis = ? WHERE id = ?',
            [analysis, id]
        );

        return ResponseFormatter.success(res, { analysis }, 'تم تحليل المستند بنجاح');
    } catch (error) {
        console.error('AI analysis error:', error);
        if (error.message?.includes('Ollama') || error.message?.includes('fetch')) {
            return ResponseFormatter.error(res, 'خدمة الذكاء الاصطناعي غير متاحة. تأكد من تشغيل Ollama محلياً.', 503);
        }
        return ResponseFormatter.error(res, 'فشل في تحليل المستند', 500);
    }
};

module.exports = {
    getDocuments,
    getDocumentById,
    uploadDocument,
    deleteDocument,
    getDocumentAnalysis,
    runAIAnalysis,
    analyzeLocalImage,
};
