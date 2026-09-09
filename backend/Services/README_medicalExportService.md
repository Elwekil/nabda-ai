# Medical Export Service

## Overview

The `medicalExportService.js` provides functionality to export a user's complete medical file as a PDF document and send it via email. This service is part of Feature 4 of the Medical AI Enhancements specification.

## Features

- **Complete Medical File Export**: Generates a comprehensive PDF containing all user medical data
- **Email Delivery**: Sends the generated PDF as an email attachment
- **AI Diagnosis Integration**: Optionally includes AI diagnosis results from chat sessions
- **Robust Error Handling**: Returns PDF path even if email delivery fails
- **Database Tracking**: Records all export operations in the database

## API

### `exportMedicalFileToPDF(userId, email, sessionId)`

Main function to export a user's medical file to PDF and send via email.

**Parameters:**
- `userId` (number, required): The user's ID
- `email` (string, required): Email address to send the PDF to
- `sessionId` (string, optional): Chat session ID to include AI diagnosis

**Returns:**
- `Promise<Object>`: Export result object
  - `success` (boolean): Whether the export was successful
  - `emailSent` (boolean): Whether the email was sent successfully
  - `pdfPath` (string): Path to the generated PDF file
  - `timestamp` (Date): Timestamp of the export

**Example:**
```javascript
const { exportMedicalFileToPDF } = require('./Services/medicalExportService');

const result = await exportMedicalFileToPDF(123, 'user@example.com');
console.log('PDF generated at:', result.pdfPath);
console.log('Email sent:', result.emailSent);
```

### `fetchCompleteMedicalFile(userId)`

Fetches complete medical data for a user from the database.

**Parameters:**
- `userId` (number, required): The user's ID

**Returns:**
- `Promise<Object>`: Complete medical file data including:
  - `personalInfo`: User profile information
  - `medications`: List of current medications
  - `appointments`: Recent medical appointments
  - `vitals`: Recent vital signs
  - `documents`: Uploaded medical documents
  - `chronicConditions`: Array of chronic conditions
  - `allergies`: Array of allergies
  - `emergencyContacts`: Emergency contact information

### `fetchChatSession(sessionId)`

Fetches AI chat session data including diagnosis results.

**Parameters:**
- `sessionId` (string, required): The chat session ID

**Returns:**
- `Promise<Object|null>`: Chat session data or null if not found

## PDF Contents

The generated PDF includes the following sections:

1. **Header**: Title, user name, and generation date
2. **Personal Information**: Name, age, blood type, contact details
3. **Medical History**: Chronic conditions, allergies, family doctor
4. **Current Medications**: All active medications with dosage and frequency
5. **Recent Vital Signs**: Blood pressure, heart rate, blood sugar, etc.
6. **Medical Appointments**: Recent and upcoming appointments
7. **Medical Documents**: List of uploaded documents
8. **AI Diagnosis** (optional): AI-generated diagnosis if sessionId provided
9. **Emergency Contacts**: Emergency contact information
10. **Footer**: Disclaimer and generation info

## Database Tables

The service requires the following database tables:

### `medical_file_exports`
Tracks all export operations.

```sql
CREATE TABLE medical_file_exports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  session_id VARCHAR(36),
  email VARCHAR(255) NOT NULL,
  pdf_path VARCHAR(500),
  file_size INT,
  exported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_exports (user_id, exported_at)
);
```

### `ai_chat_sessions`
Stores AI chat sessions and diagnosis results.

```sql
CREATE TABLE ai_chat_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  session_id VARCHAR(36) UNIQUE NOT NULL,
  messages JSON NOT NULL,
  medical_context JSON NOT NULL,
  diagnosis_result JSON,
  exported BOOLEAN DEFAULT FALSE,
  exported_at TIMESTAMP NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_session (user_id, session_id),
  INDEX idx_status (status)
);
```

## Setup

### 1. Install Dependencies

The service requires `pdfkit` which is already included in package.json:

```bash
npm install
```

### 2. Create Database Tables

Run the migration script to create required tables:

```bash
mysql -u your_user -p health_sync < migrations/add_medical_export_tables.sql
```

### 3. Configure Email Service

Ensure the following environment variables are set in `.env`:

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 4. Create Exports Directory

The service automatically creates the `Backend/exports/` directory if it doesn't exist.

## Error Handling

The service handles various error scenarios:

1. **Invalid Email Format**: Throws error if email format is invalid
2. **Missing Parameters**: Throws error if userId or email is missing
3. **User Not Found**: Throws error if user doesn't exist in database
4. **Email Failure**: Returns success with `emailSent: false` but still provides PDF path
5. **Missing Tables**: Gracefully handles missing database tables with warnings

## File Storage

Generated PDF files are stored in:
```
Backend/exports/medical_file_{userId}_{timestamp}.pdf
```

Example: `Backend/exports/medical_file_123_1704067200000.pdf`

## Security Considerations

1. **Access Control**: Ensure proper authentication before calling this service
2. **Email Validation**: Service validates email format before processing
3. **File Cleanup**: Consider implementing periodic cleanup of old PDF files
4. **Sensitive Data**: PDFs contain sensitive medical information - ensure secure storage
5. **Email Security**: Use app-specific passwords for email service

## Testing

Run the test suite:

```bash
npm test -- medicalExportService
```

## Integration Example

```javascript
// In your controller
const { exportMedicalFileToPDF } = require('../Services/medicalExportService');

router.post('/api/export-medical-file', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, sessionId } = req.body;
        
        const result = await exportMedicalFileToPDF(userId, email, sessionId);
        
        res.json({
            success: true,
            message: result.emailSent 
                ? 'Medical file sent to your email' 
                : 'Medical file generated but email failed',
            data: {
                pdfPath: result.pdfPath,
                emailSent: result.emailSent,
                timestamp: result.timestamp
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
```

## Future Enhancements

1. Add support for Arabic fonts in PDF for better RTL text rendering
2. Implement PDF encryption for enhanced security
3. Add option to include medical images in the PDF
4. Support multiple export formats (PDF, DOCX, HTML)
5. Implement PDF compression to reduce file size
6. Add watermarking for authenticity verification
