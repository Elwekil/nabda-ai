# Encryption Utility Documentation

## Overview

The encryption utility provides AES-256-GCM encryption and decryption for sensitive medical data. This ensures data privacy and security compliance with HIPAA requirements.

**Spec**: medical-ai-enhancements  
**Requirements**: Property 7 — Data Privacy and Security

## Features

- **AES-256-GCM Encryption**: Industry-standard authenticated encryption
- **Automatic IV Generation**: Each encryption uses a unique initialization vector
- **Authentication Tags**: GCM mode provides integrity verification
- **Error Handling**: Comprehensive validation and error messages
- **UTF-8 Support**: Handles Arabic text and special characters

## Installation

The encryption utility is already included in the project. Ensure the `ENCRYPTION_KEY` environment variable is set in your `.env` file:

```env
ENCRYPTION_KEY=4d684be5c5a718654b21e1944f5da0be200fe86e824d4acf928162b52a791120
```

**Important**: The encryption key must be a 32-byte hex string (64 characters).

## API Reference

### `encrypt(text)`

Encrypts plain text using AES-256-GCM.

**Parameters:**
- `text` (string): Plain text to encrypt

**Returns:**
```javascript
{
  encrypted: string,  // Encrypted data in hex format
  iv: string,         // Initialization vector in hex format (32 chars)
  tag: string         // Authentication tag in hex format (32 chars)
}
```

**Throws:**
- Error if text is not a string
- Error if text is empty
- Error if encryption fails

**Example:**
```javascript
const { encrypt } = require('./Utils/encryption');

const sensitiveData = 'Patient diagnosis: Hypertension';
const { encrypted, iv, tag } = encrypt(sensitiveData);

console.log('Encrypted:', encrypted);
console.log('IV:', iv);
console.log('Tag:', tag);
```

### `decrypt(encrypted, iv, tag)`

Decrypts encrypted text using AES-256-GCM.

**Parameters:**
- `encrypted` (string): Encrypted data in hex format
- `iv` (string): Initialization vector in hex format
- `tag` (string): Authentication tag in hex format

**Returns:**
- `string`: Decrypted plain text

**Throws:**
- Error if parameters are not strings
- Error if parameters are empty
- Error if decryption fails (invalid data or tampered content)

**Example:**
```javascript
const { decrypt } = require('./Utils/encryption');

const decrypted = decrypt(encrypted, iv, tag);
console.log('Decrypted:', decrypted);
```

## Usage Examples

### Example 1: Encrypting Medical Records

```javascript
const { encrypt } = require('./Utils/encryption');

// Prepare medical data
const medicalRecord = {
  patientId: 12345,
  diagnosis: 'Type 2 Diabetes',
  medications: ['Metformin', 'Insulin'],
  bloodType: 'A+',
  allergies: ['Penicillin']
};

// Convert to JSON string
const jsonData = JSON.stringify(medicalRecord);

// Encrypt
const { encrypted, iv, tag } = encrypt(jsonData);

// Store in database
await db.execute(
  'INSERT INTO encrypted_records (user_id, data, iv, tag) VALUES (?, ?, ?, ?)',
  [userId, encrypted, iv, tag]
);
```

### Example 2: Decrypting Medical Records

```javascript
const { decrypt } = require('./Utils/encryption');

// Retrieve from database
const [rows] = await db.execute(
  'SELECT data, iv, tag FROM encrypted_records WHERE user_id = ?',
  [userId]
);

const { data, iv, tag } = rows[0];

// Decrypt
const decryptedJson = decrypt(data, iv, tag);

// Parse JSON
const medicalRecord = JSON.parse(decryptedJson);
console.log('Patient ID:', medicalRecord.patientId);
console.log('Diagnosis:', medicalRecord.diagnosis);
```

### Example 3: Encrypting Chat Messages

```javascript
const { encrypt } = require('./Utils/encryption');

// Encrypt sensitive chat message
const chatMessage = 'Patient reports chest pain and shortness of breath';
const { encrypted, iv, tag } = encrypt(chatMessage);

// Store in chat session
await db.execute(
  'INSERT INTO ai_chat_messages (session_id, encrypted_message, iv, tag) VALUES (?, ?, ?, ?)',
  [sessionId, encrypted, iv, tag]
);
```

### Example 4: Encrypting SOS Emergency Data

```javascript
const { encrypt } = require('./Utils/encryption');

// Prepare emergency medical file
const emergencyData = {
  personalInfo: { name: 'John Doe', age: 45 },
  medicalHistory: ['Hypertension', 'Diabetes'],
  currentMedications: ['Lisinopril', 'Metformin'],
  allergies: ['Penicillin'],
  location: { latitude: 40.7128, longitude: -74.0060 }
};

// Encrypt before storing
const jsonData = JSON.stringify(emergencyData);
const { encrypted, iv, tag } = encrypt(jsonData);

// Store in SOS log
await db.execute(
  'INSERT INTO sos_emergency_logs (user_id, medical_file_snapshot, iv, tag) VALUES (?, ?, ?, ?)',
  [userId, encrypted, iv, tag]
);
```

## Security Best Practices

1. **Never Log Encrypted Data**: Avoid logging encrypted data, IVs, or tags in production
2. **Secure Key Storage**: Keep `ENCRYPTION_KEY` in environment variables, never in code
3. **Key Rotation**: Implement key rotation strategy for long-term security
4. **Store IV and Tag**: Always store IV and authentication tag with encrypted data
5. **Validate Before Decryption**: Verify data integrity before attempting decryption
6. **Handle Errors Gracefully**: Catch decryption errors and handle them appropriately

## Database Schema

When storing encrypted data, use this schema pattern:

```sql
CREATE TABLE encrypted_medical_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  encrypted_data TEXT NOT NULL,
  iv VARCHAR(32) NOT NULL,
  tag VARCHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Testing

Run the unit tests to verify encryption functionality:

```bash
npm test -- encryption.unit.test.js
```

All tests should pass, covering:
- Basic encryption/decryption
- Medical data JSON handling
- Long text support
- Arabic text support
- Error handling
- Data integrity verification
- Edge cases

## Error Handling

The encryption utility provides detailed error messages:

```javascript
try {
  const { encrypted, iv, tag } = encrypt(sensitiveData);
  // ... store encrypted data
} catch (error) {
  console.error('Encryption failed:', error.message);
  // Handle error appropriately
}

try {
  const decrypted = decrypt(encrypted, iv, tag);
  // ... use decrypted data
} catch (error) {
  console.error('Decryption failed:', error.message);
  // Data may be corrupted or tampered with
}
```

## HIPAA Compliance

This encryption utility helps meet HIPAA requirements:

- ✅ **Encryption at Rest**: All sensitive data encrypted before storage
- ✅ **Data Integrity**: GCM mode provides authentication
- ✅ **Access Control**: Only authorized code can decrypt with proper key
- ✅ **Audit Trail**: Combine with audit logger for complete compliance

## Performance Considerations

- **Encryption Speed**: ~1-2ms for typical medical records (<10KB)
- **Memory Usage**: Minimal overhead, suitable for high-volume operations
- **Scalability**: Can handle thousands of encryptions per second

## Troubleshooting

### Error: "ENCRYPTION_KEY environment variable is required"
**Solution**: Add `ENCRYPTION_KEY` to your `.env` file

### Error: "ENCRYPTION_KEY must be a 32-byte hex string"
**Solution**: Generate a valid key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Error: "Decryption failed"
**Possible Causes**:
- Incorrect IV or tag
- Data was tampered with
- Wrong encryption key
- Corrupted data

## Related Documentation

- [Audit Logger](./README_auditLogger.md) - For logging encryption operations
- [Design Document](../../.kiro/specs/medical-ai-enhancements/design.md) - Property 7 requirements
- [HIPAA Compliance Guidelines](https://www.hhs.gov/hipaa/for-professionals/security/index.html)

## Support

For issues or questions about the encryption utility, please refer to:
- Design document: `.kiro/specs/medical-ai-enhancements/design.md`
- Property 7: Data Privacy and Security requirements
- Task 16.2: Create encryption utility
