/**
 * Unit Tests for Encryption Utility
 * 
 * Tests the encrypt() and decrypt() functions for AES-256-GCM encryption.
 * 
 * Requirements: Property 7 — Data Privacy and Security
 */

// Load environment variables before importing encryption module
require('dotenv').config();

const { encrypt, decrypt } = require('../Utils/encryption');

describe('Encryption Utility - Unit Tests', () => {
  describe('encrypt()', () => {
    test('should encrypt a simple string', () => {
      const text = 'Hello, World!';
      const result = encrypt(text);

      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('tag');
      expect(typeof result.encrypted).toBe('string');
      expect(typeof result.iv).toBe('string');
      expect(typeof result.tag).toBe('string');
      expect(result.encrypted.length).toBeGreaterThan(0);
    });

    test('should encrypt medical data JSON', () => {
      const medicalData = JSON.stringify({
        patientId: 123,
        diagnosis: 'Hypertension',
        medications: ['Lisinopril', 'Amlodipine']
      });
      const result = encrypt(medicalData);

      expect(result.encrypted).toBeTruthy();
      expect(result.iv).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(result.tag).toHaveLength(32); // 16 bytes = 32 hex chars
    });

    test('should generate different IV for each encryption', () => {
      const text = 'Same text';
      const result1 = encrypt(text);
      const result2 = encrypt(text);

      expect(result1.iv).not.toBe(result2.iv);
      expect(result1.encrypted).not.toBe(result2.encrypted);
    });

    test('should throw error for non-string input', () => {
      expect(() => encrypt(123)).toThrow('Text to encrypt must be a string');
      expect(() => encrypt(null)).toThrow('Text to encrypt must be a string');
      expect(() => encrypt(undefined)).toThrow('Text to encrypt must be a string');
      expect(() => encrypt({})).toThrow('Text to encrypt must be a string');
    });

    test('should throw error for empty string', () => {
      expect(() => encrypt('')).toThrow('Text to encrypt cannot be empty');
    });

    test('should handle long text', () => {
      const longText = 'A'.repeat(10000);
      const result = encrypt(longText);

      expect(result.encrypted).toBeTruthy();
      expect(result.encrypted.length).toBeGreaterThan(0);
    });

    test('should handle special characters', () => {
      const text = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const result = encrypt(text);

      expect(result.encrypted).toBeTruthy();
    });

    test('should handle Arabic text', () => {
      const text = 'مرحبا بك في النظام الطبي';
      const result = encrypt(text);

      expect(result.encrypted).toBeTruthy();
    });
  });

  describe('decrypt()', () => {
    test('should decrypt encrypted text correctly', () => {
      const originalText = 'Sensitive medical data';
      const { encrypted, iv, tag } = encrypt(originalText);
      const decrypted = decrypt(encrypted, iv, tag);

      expect(decrypted).toBe(originalText);
    });

    test('should decrypt medical data JSON correctly', () => {
      const medicalData = {
        patientId: 456,
        bloodType: 'O+',
        allergies: ['Penicillin', 'Peanuts']
      };
      const originalText = JSON.stringify(medicalData);
      const { encrypted, iv, tag } = encrypt(originalText);
      const decrypted = decrypt(encrypted, iv, tag);

      expect(decrypted).toBe(originalText);
      expect(JSON.parse(decrypted)).toEqual(medicalData);
    });

    test('should decrypt long text correctly', () => {
      const longText = 'Medical record: ' + 'X'.repeat(5000);
      const { encrypted, iv, tag } = encrypt(longText);
      const decrypted = decrypt(encrypted, iv, tag);

      expect(decrypted).toBe(longText);
    });

    test('should decrypt Arabic text correctly', () => {
      const arabicText = 'تشخيص المريض: ارتفاع ضغط الدم';
      const { encrypted, iv, tag } = encrypt(arabicText);
      const decrypted = decrypt(encrypted, iv, tag);

      expect(decrypted).toBe(arabicText);
    });

    test('should throw error for invalid encrypted data', () => {
      const { iv, tag } = encrypt('test');
      expect(() => decrypt('invalid_hex', iv, tag)).toThrow('Decryption failed');
    });

    test('should throw error for invalid IV', () => {
      const { encrypted, tag } = encrypt('test');
      expect(() => decrypt(encrypted, 'invalid_iv', tag)).toThrow('Decryption failed');
    });

    test('should throw error for invalid tag', () => {
      const { encrypted, iv } = encrypt('test');
      expect(() => decrypt(encrypted, iv, 'invalid_tag')).toThrow('Decryption failed');
    });

    test('should throw error for tampered encrypted data', () => {
      const { encrypted, iv, tag } = encrypt('test');
      const tamperedEncrypted = encrypted.slice(0, -2) + 'ff';
      expect(() => decrypt(tamperedEncrypted, iv, tag)).toThrow('Decryption failed');
    });

    test('should throw error for non-string parameters', () => {
      expect(() => decrypt(123, 'iv', 'tag')).toThrow('Encrypted data, IV, and tag must be strings');
      expect(() => decrypt('encrypted', 123, 'tag')).toThrow('Encrypted data, IV, and tag must be strings');
      expect(() => decrypt('encrypted', 'iv', 123)).toThrow('Encrypted data, IV, and tag must be strings');
    });

    test('should throw error for empty parameters', () => {
      expect(() => decrypt('', 'iv', 'tag')).toThrow('Encrypted data, IV, and tag cannot be empty');
      expect(() => decrypt('encrypted', '', 'tag')).toThrow('Encrypted data, IV, and tag cannot be empty');
      expect(() => decrypt('encrypted', 'iv', '')).toThrow('Encrypted data, IV, and tag cannot be empty');
    });
  });

  describe('Encryption/Decryption Round-trip', () => {
    test('should maintain data integrity through multiple encryptions', () => {
      const originalText = 'Patient record #12345';
      
      // First round
      const { encrypted: enc1, iv: iv1, tag: tag1 } = encrypt(originalText);
      const dec1 = decrypt(enc1, iv1, tag1);
      
      // Second round
      const { encrypted: enc2, iv: iv2, tag: tag2 } = encrypt(dec1);
      const dec2 = decrypt(enc2, iv2, tag2);

      expect(dec1).toBe(originalText);
      expect(dec2).toBe(originalText);
    });

    test('should handle edge case: single character', () => {
      const text = 'A';
      const { encrypted, iv, tag } = encrypt(text);
      const decrypted = decrypt(encrypted, iv, tag);

      expect(decrypted).toBe(text);
    });

    test('should handle edge case: whitespace', () => {
      const text = '   ';
      const { encrypted, iv, tag } = encrypt(text);
      const decrypted = decrypt(encrypted, iv, tag);

      expect(decrypted).toBe(text);
    });

    test('should handle edge case: newlines and tabs', () => {
      const text = 'Line 1\nLine 2\tTabbed';
      const { encrypted, iv, tag } = encrypt(text);
      const decrypted = decrypt(encrypted, iv, tag);

      expect(decrypted).toBe(text);
    });
  });
});
