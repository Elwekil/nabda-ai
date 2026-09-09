import api from './api';

export const getAllDocuments = async () => {
    const response = await api.get('/documents');
    return response.data.data;
};

export const uploadDocument = async (formData) => {
    // formData is a FormData object with actual file
    const response = await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
};

export const deleteDocument = async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data.data;
};

export const getDocumentAnalysis = async (id) => {
    const response = await api.get(`/documents/${id}/analysis`);
    return response.data.data;
};

export const runAIAnalysis = async (id) => {
    const response = await api.post(`/documents/${id}/analyze`);
    return response.data.data;
};

/**
 * Analyze a medical image locally using AI (no Ollama required)
 * Works 100% offline using Tesseract.js OCR and rule-based analysis
 * @param {File} file - The image/PDF file to analyze
 * @param {string} documentType - Type of document: 'lab_report', 'prescription', 'xray', 'medical_report'
 * @returns {Promise<Object>} Analysis result
 */
export const analyzeImageLocally = async (file, documentType = 'unknown') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    
    const response = await api.post('/documents/analyze-local', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
};

const documentService = {
    getAll: getAllDocuments,
    upload: uploadDocument,
    delete: deleteDocument,
    getAnalysis: getDocumentAnalysis,
    analyze: runAIAnalysis,
    analyzeLocal: analyzeImageLocally
};

export default documentService;
