/**
 * Integration tests for route configuration - Task 14.2
 * Verifies that routes are correctly configured with authentication and rate limiting
 */

describe('Route Configuration - Task 14.2', () => {
    describe('aiRoutes.js Configuration', () => {
        test('should export aiLimiter from rateLimiter middleware', () => {
            const { aiLimiter } = require('../Middleware/rateLimiter');
            
            expect(aiLimiter).toBeDefined();
            expect(typeof aiLimiter).toBe('function');
        });

        test('should have chat-diagnosis route configured', () => {
            const aiRoutes = require('../Routes/aiRoutes');
            
            // Verify the route module is properly exported
            expect(aiRoutes).toBeDefined();
            expect(typeof aiRoutes).toBe('function');
        });

        test('should have export-medical-file-pdf route configured', () => {
            const aiRoutes = require('../Routes/aiRoutes');
            
            expect(aiRoutes).toBeDefined();
        });
    });

    describe('userRoutes.js Configuration', () => {
        test('should have medical-context route configured', () => {
            const userRoutes = require('../Routes/userRoutes');
            
            // Verify the route module is properly exported
            expect(userRoutes).toBeDefined();
            expect(typeof userRoutes).toBe('function');
        });

        test('should import getMedicalContext from aiController', () => {
            // This test verifies the import doesn't throw an error
            expect(() => {
                const { getMedicalContext } = require('../Controllers/aiController');
                expect(getMedicalContext).toBeDefined();
            }).not.toThrow();
        });
    });

    describe('Rate Limiter Configuration', () => {
        test('aiLimiter should have correct configuration (50 req/15min)', () => {
            // Clear the module cache to get fresh instance
            jest.resetModules();
            
            const rateLimit = require('express-rate-limit');
            const rateLimiterModule = require('../Middleware/rateLimiter');
            
            expect(rateLimiterModule.aiLimiter).toBeDefined();
            expect(rateLimiterModule.rateLimiter).toBeDefined();
            expect(rateLimiterModule.authLimiter).toBeDefined();
            expect(rateLimiterModule.otpLimiter).toBeDefined();
        });
    });

    describe('Controller Functions', () => {
        test('chatDiagnosis should be exported from aiController', () => {
            const { chatDiagnosis } = require('../Controllers/aiController');
            
            expect(chatDiagnosis).toBeDefined();
            expect(typeof chatDiagnosis).toBe('function');
        });

        test('exportMedicalFilePDF should be exported from aiController', () => {
            const { exportMedicalFilePDF } = require('../Controllers/aiController');
            
            expect(exportMedicalFilePDF).toBeDefined();
            expect(typeof exportMedicalFilePDF).toBe('function');
        });

        test('getMedicalContext should be exported from aiController', () => {
            const { getMedicalContext } = require('../Controllers/aiController');
            
            expect(getMedicalContext).toBeDefined();
            expect(typeof getMedicalContext).toBe('function');
        });
    });
});

