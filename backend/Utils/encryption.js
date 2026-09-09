/**
 * Encryption Utility for Medical Data
 * 
 * Provides AES-256-GCM encryption/decryption for sensitive medical data.
 * Uses ENCRYPTION_KEY from environment variables.
 * 
 * Requirements: Property 7 — Data Privacy and Security
 * Spec: medical-ai-enhancements
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Validate encryption key on module load
if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}

if (ENCRYPTION_KEY.length !== 64) {
  throw new Error('ENCRYPTION_KEY must be a 32-byte hex string (64 characters)');
}

/**
 * Encrypts text using AES-256-GCM
 * 
 * @param {string} text - Plain text to encrypt
 * @returns {{ encrypted: string, iv: string, tag: string }} Encrypted data with IV and auth tag
 * @throws {Error} If text is not a string or encryption fails
 */
const encrypt = (text) => {
  if (typeof text !== 'string') {
    throw new Error('Text to encrypt must be a string');
  }

  if (text.length === 0) {
    throw new Error('Text to encrypt cannot be empty');
  }

  try {
    // Generate random initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher with key and IV
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag for GCM mode
    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
};

/**
 * Decrypts text using AES-256-GCM
 * 
 * @param {string} encrypted - Encrypted text in hex format
 * @param {string} iv - Initialization vector in hex format
 * @param {string} tag - Authentication tag in hex format
 * @returns {string} Decrypted plain text
 * @throws {Error} If parameters are invalid or decryption fails
 */
const decrypt = (encrypted, iv, tag) => {
  if (typeof encrypted !== 'string' || typeof iv !== 'string' || typeof tag !== 'string') {
    throw new Error('Encrypted data, IV, and tag must be strings');
  }

  if (!encrypted || !iv || !tag) {
    throw new Error('Encrypted data, IV, and tag cannot be empty');
  }

  try {
    // Create decipher with key and IV
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      Buffer.from(iv, 'hex')
    );

    // Set authentication tag
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

module.exports = {
  encrypt,
  decrypt
};
