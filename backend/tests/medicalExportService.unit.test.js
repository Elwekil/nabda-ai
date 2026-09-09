const { exportMedicalFileToPDF, fetchCompleteMedicalFile } = require('../Services/medicalExportService');
const { pool } = require('../Config/db');
const fs = require('fs');
const path = require('path');

describe('Medical Export Service - Unit Tests', () => {
    let testUserId;
    
    beforeAll(async () => {
        // Create a test user
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.query(
                `INSERT INTO users (full_name, email, password, age, blood_type, phone, city) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                ['Test User', 'test@example.com', 'hashedpassword', 30, 'A+', '1234567890', 'Test City']
            );
            testUserId = result.insertId;
            
            // Add some test data
            await connection.query(
                `INSERT INTO medications (user_id, name, dosage, frequency, status) 
                VALUES (?, ?, ?, ?, ?)`,
                [testUserId, 'Test Medication', '10mg', 'Twice daily', 'active']
            );
            
            await connection.query(
                `INSERT INTO vitals (user_id, blood_sugar, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, recorded_date, recorded_time) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [testUserId, 120, 120, 80, 75, '2024-01-01', '10:00:00']
            );
        } finally {
            connection.release();
        }
    });
    
    afterAll(async () => {
        // Clean up test data
        const connection = await pool.getConnection();
        try {
            await connection.query('DELETE FROM users WHERE id = ?', [testUserId]);
            
            // Clean up generated PDF files
            const exportsDir = path.join(__dirname, '../exports');
            if (fs.existsSync(exportsDir)) {
                const files = fs.readdirSync(exportsDir);
                files.forEach(file => {
                    if (file.startsWith(`medical_file_${testUserId}_`)) {
                        fs.unlinkSync(path.join(exportsDir, file));
                    }
                });
            }
        } finally {
            connection.release();
        }
        
        await pool.end();
    });
    
    describe('fetchCompleteMedicalFile', () => {
        test('should fetch complete medical file for valid user', async () => {
            const medicalFile = await fetchCompleteMedicalFile(testUserId);
            
            expect(medicalFile).toBeDefined();
            expect(medicalFile.personalInfo).toBeDefined();
            expect(medicalFile.personalInfo.full_name).toBe('Test User');
            expect(medicalFile.personalInfo.email).toBe('test@example.com');
            expect(medicalFile.medications).toBeDefined();
            expect(medicalFile.medications.length).toBeGreaterThan(0);
            expect(medicalFile.vitals).toBeDefined();
            expect(medicalFile.vitals.length).toBeGreaterThan(0);
        });
        
        test('should throw error for non-existent user', async () => {
            await expect(fetchCompleteMedicalFile(999999)).rejects.toThrow('User not found');
        });
    });
    
    describe('exportMedicalFileToPDF', () => {
        test('should export medical file to PDF successfully', async () => {
            const result = await exportMedicalFileToPDF(testUserId, 'test@example.com');
            
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.pdfPath).toBeDefined();
            expect(result.timestamp).toBeDefined();
            
            // Verify PDF file exists
            expect(fs.existsSync(result.pdfPath)).toBe(true);
            
            // Verify file size is reasonable
            const stats = fs.statSync(result.pdfPath);
            expect(stats.size).toBeGreaterThan(0);
        }, 15000); // Increase timeout for PDF generation
        
        test('should throw error for invalid email', async () => {
            await expect(exportMedicalFileToPDF(testUserId, 'invalid-email')).rejects.toThrow('Invalid email format');
        });
        
        test('should throw error for missing userId', async () => {
            await expect(exportMedicalFileToPDF(null, 'test@example.com')).rejects.toThrow('userId and email are required');
        });
        
        test('should return pdfPath even if email fails', async () => {
            // Use invalid email credentials to simulate email failure
            const originalEmailUser = process.env.EMAIL_USER;
            const originalEmailPass = process.env.EMAIL_PASS;
            
            process.env.EMAIL_USER = 'invalid@example.com';
            process.env.EMAIL_PASS = 'invalid';
            
            const result = await exportMedicalFileToPDF(testUserId, 'test@example.com');
            
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.pdfPath).toBeDefined();
            expect(fs.existsSync(result.pdfPath)).toBe(true);
            
            // Restore original credentials
            process.env.EMAIL_USER = originalEmailUser;
            process.env.EMAIL_PASS = originalEmailPass;
        }, 15000);
    });
});
