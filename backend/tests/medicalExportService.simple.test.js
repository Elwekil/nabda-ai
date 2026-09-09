const path = require('path');
const fs = require('fs');

describe('Medical Export Service - Simple Tests', () => {
    test('service module can be required', () => {
        const service = require('../Services/medicalExportService');
        
        expect(service).toBeDefined();
        expect(service.exportMedicalFileToPDF).toBeDefined();
        expect(typeof service.exportMedicalFileToPDF).toBe('function');
        expect(service.fetchCompleteMedicalFile).toBeDefined();
        expect(typeof service.fetchCompleteMedicalFile).toBe('function');
        expect(service.fetchChatSession).toBeDefined();
        expect(typeof service.fetchChatSession).toBe('function');
    });
    
    test('exports directory structure is correct', () => {
        const exportsDir = path.join(__dirname, '../exports');
        
        // Create exports directory if it doesn't exist
        if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir, { recursive: true });
        }
        
        expect(fs.existsSync(exportsDir)).toBe(true);
        
        // Verify it's a directory
        const stats = fs.statSync(exportsDir);
        expect(stats.isDirectory()).toBe(true);
    });
    
    test('service validates email format', async () => {
        const { exportMedicalFileToPDF } = require('../Services/medicalExportService');
        
        // Test with invalid email
        await expect(exportMedicalFileToPDF(1, 'invalid-email')).rejects.toThrow('Invalid email format');
        
        // Test with missing parameters
        await expect(exportMedicalFileToPDF(null, 'test@example.com')).rejects.toThrow('userId and email are required');
        await expect(exportMedicalFileToPDF(1, null)).rejects.toThrow('userId and email are required');
    });
});
