/**
 * Unit tests for aiController.js - Feature 4 actions
 * Tests chatDiagnosis, exportMedicalFilePDF, and getMedicalContext
 */

const { pool } = require('../Config/db');
const { chatWithMedicalAI } = require('../Services/aiChatService');
const { exportMedicalFileToPDF, fetchCompleteMedicalFile } = require('../Services/medicalExportService');

// Mock dependencies
jest.mock('../Config/db');
jest.mock('../Services/aiChatService');
jest.mock('../Services/medicalExportService');

describe('aiController - Feature 4 Actions', () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: { id: 1 },
            body: {},
            ip: '127.0.0.1',
            get: jest.fn(() => 'test-agent'),
            connection: { remoteAddress: '127.0.0.1' }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        // Reset mocks
        jest.clearAllMocks();
    });

    describe('chatDiagnosis', () => {
        test('should validate message is non-empty', async () => {
            const { chatDiagnosis } = require('../Controllers/aiController');
            
            req.body = { message: '', history: [] };

            await chatDiagnosis(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('الرسالة مطلوبة')
                })
            );
        });

        test('should validate message max length (2000 chars)', async () => {
            const { chatDiagnosis } = require('../Controllers/aiController');
            
            req.body = { 
                message: 'a'.repeat(2001), 
                history: [] 
            };

            await chatDiagnosis(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('طويلة جداً')
                })
            );
        });

        test('should sanitize message and call chatWithMedicalAI', async () => {
            const { chatDiagnosis } = require('../Controllers/aiController');
            
            req.body = { 
                message: '<script>alert("xss")</script>I have a headache', 
                history: [] 
            };

            // Mock database responses
            pool.execute = jest.fn()
                .mockResolvedValueOnce([[ // users query
                    { 
                        age: 30, 
                        gender: 'male', 
                        blood_type: 'O+', 
                        chronic_conditions: 'diabetes', 
                        allergies: 'peanuts' 
                    }
                ]])
                .mockResolvedValueOnce([[ // medications query
                    { name: 'Metformin', dosage: '500mg' }
                ]])
                .mockResolvedValueOnce([[ // vitals query
                    { blood_sugar: 120, heart_rate: 75, recorded_date: '2024-01-01' }
                ]])
                .mockResolvedValueOnce([]); // audit log insert

            // Mock chatWithMedicalAI
            chatWithMedicalAI.mockResolvedValue({
                message: 'You should rest and drink water',
                followUpQuestions: ['How long have you had this headache?'],
                requiresMoreInfo: true,
                urgencyLevel: 'low'
            });

            await chatDiagnosis(req, res);

            // Verify sanitization removed script tags
            expect(chatWithMedicalAI).toHaveBeenCalledWith(
                expect.not.stringContaining('<script>'),
                [],
                expect.objectContaining({
                    userId: 1,
                    age: 30,
                    gender: 'male'
                })
            );

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        message: expect.any(String),
                        urgencyLevel: 'low'
                    })
                })
            );
        });
    });

    describe('exportMedicalFilePDF', () => {
        test('should validate email format', async () => {
            const { exportMedicalFilePDF } = require('../Controllers/aiController');
            
            req.body = { email: 'invalid-email' };

            await exportMedicalFilePDF(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('صيغة البريد الإلكتروني غير صحيحة')
                })
            );
        });

        test('should call exportMedicalFileToPDF and add audit log', async () => {
            const { exportMedicalFilePDF } = require('../Controllers/aiController');
            
            req.body = { 
                email: 'test@example.com',
                sessionId: 'session-123'
            };

            // Mock exportMedicalFileToPDF
            exportMedicalFileToPDF.mockResolvedValue({
                success: true,
                emailSent: true,
                pdfPath: '/exports/medical_file_1_123456.pdf',
                timestamp: new Date()
            });

            // Mock audit log insert
            pool.execute = jest.fn().mockResolvedValue([]);

            await exportMedicalFilePDF(req, res);

            expect(exportMedicalFileToPDF).toHaveBeenCalledWith(
                1,
                'test@example.com',
                'session-123'
            );

            expect(pool.execute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO audit_logs'),
                expect.arrayContaining([
                    1,
                    'MEDICAL_FILE_EXPORT',
                    expect.any(String)
                ])
            );

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        emailSent: true
                    })
                })
            );
        });
    });

    describe('getMedicalContext', () => {
        test('should fetch and return complete medical context', async () => {
            const { getMedicalContext } = require('../Controllers/aiController');

            // Mock fetchCompleteMedicalFile
            fetchCompleteMedicalFile.mockResolvedValue({
                personalInfo: {
                    full_name: 'John Doe',
                    age: 30,
                    gender: 'male',
                    blood_type: 'O+',
                    phone: '1234567890',
                    email: 'john@example.com',
                    city: 'Cairo',
                    family_doctor_name: 'Dr. Smith',
                    family_doctor_phone: '0987654321'
                },
                chronicConditions: ['diabetes'],
                allergies: ['peanuts'],
                medications: [
                    { name: 'Metformin', dosage: '500mg', frequency: 'twice daily', status: 'active' },
                    { name: 'Old Med', dosage: '100mg', frequency: 'once', status: 'inactive' }
                ],
                vitals: [
                    { 
                        blood_sugar: 120, 
                        blood_pressure_systolic: 120, 
                        blood_pressure_diastolic: 80,
                        heart_rate: 75, 
                        temperature: 37.0,
                        recorded_date: '2024-01-01' 
                    }
                ],
                emergencyContacts: [
                    { name: 'Jane Doe', phone: '1111111111', relationship: 'spouse' }
                ]
            });

            await getMedicalContext(req, res);

            expect(fetchCompleteMedicalFile).toHaveBeenCalledWith(1);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        personalInfo: expect.objectContaining({
                            fullName: 'John Doe',
                            age: 30,
                            bloodType: 'O+'
                        }),
                        chronicConditions: ['diabetes'],
                        allergies: ['peanuts'],
                        currentMedications: expect.arrayContaining([
                            expect.objectContaining({
                                name: 'Metformin',
                                dosage: '500mg'
                            })
                        ]),
                        recentVitals: expect.arrayContaining([
                            expect.objectContaining({
                                bloodSugar: 120,
                                bloodPressure: '120/80',
                                heartRate: 75
                            })
                        ]),
                        familyDoctor: expect.objectContaining({
                            name: 'Dr. Smith',
                            phone: '0987654321'
                        })
                    })
                })
            );

            // Verify only active medications are returned
            const responseData = res.json.mock.calls[0][0].data;
            expect(responseData.currentMedications).toHaveLength(1);
            expect(responseData.currentMedications[0].name).toBe('Metformin');
        });

        test('should return 404 if medical file not found', async () => {
            const { getMedicalContext } = require('../Controllers/aiController');

            fetchCompleteMedicalFile.mockResolvedValue(null);

            await getMedicalContext(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('Medical file')
                })
            );
        });
    });
});
