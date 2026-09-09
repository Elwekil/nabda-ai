# AuditLogger Utility

## Overview

The `AuditLogger` utility provides HIPAA-compliant audit logging for all medical data operations in the Health Sync application. It logs user actions, system events, and data access for security tracking and compliance purposes.

## Features

- ✅ Logs all medical data operations to `audit_logs` table
- ✅ Captures userId, event type, event data, IP address, and user agent
- ✅ Automatic timestamp recording
- ✅ Graceful error handling (doesn't break main application flow)
- ✅ Helper methods for Express.js integration
- ✅ JSON storage for flexible event data

## Database Schema

The `audit_logs` table is created by the migration `add_audit_logs_table.sql`:

```sql
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_event_type (event_type),
  INDEX idx_timestamp (timestamp)
);
```

## Usage

### Basic Usage

```javascript
const AuditLogger = require('./Utils/auditLogger');

// Log a simple event
await AuditLogger.log({
  userId: 123,
  type: 'IMAGE_ANALYSIS',
  data: { documentId: 456, imageType: 'lab_report' },
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0'
});
```

### Express.js Integration

```javascript
const AuditLogger = require('./Utils/auditLogger');

// In a controller
router.post('/api/documents/analyze-local', requireAuth, async (req, res) => {
  try {
    // Perform the operation
    const result = await analyzeDocument(req.file);
    
    // Log the audit event
    await AuditLogger.logFromRequest(req, 'IMAGE_ANALYSIS', {
      documentId: result.id,
      imageType: result.type,
      confidence: result.confidence
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Event Types

Common event types used in the application:

- `IMAGE_ANALYSIS` - Medical image analysis performed
- `SOS_TRIGGERED` - Emergency SOS button activated
- `DRUG_INTERACTION_CHECK` - Drug interaction check performed
- `MEDICAL_FILE_EXPORT` - Medical file exported/downloaded
- `AI_CHAT_DIAGNOSIS` - AI chatbot diagnosis session
- `MEDICAL_DATA_ACCESS` - User accessed their medical data
- `MEDICAL_DATA_UPDATE` - User updated their medical data
- `MEDICAL_DATA_DELETE` - User deleted their medical data

## API Reference

### `AuditLogger.log(event)`

Logs an audit event to the database.

**Parameters:**
- `event` (Object) - The audit event object
  - `userId` (number, required) - The user ID performing the action
  - `type` (string, required) - The event type
  - `data` (Object, optional) - Additional event data (stored as JSON)
  - `ipAddress` (string, optional) - The IP address of the request
  - `userAgent` (string, optional) - The user agent string

**Returns:** `Promise<void>`

**Example:**
```javascript
await AuditLogger.log({
  userId: 1,
  type: 'SOS_TRIGGERED',
  data: { location: { lat: 30.0444, lng: 31.2357 } },
  ipAddress: '10.0.0.1',
  userAgent: 'Mozilla/5.0'
});
```

### `AuditLogger.logFromRequest(req, type, data)`

Convenience method to log from an Express request object. Automatically extracts IP address and user agent.

**Parameters:**
- `req` (Object) - Express request object
- `type` (string) - Event type
- `data` (Object, optional) - Additional event data

**Returns:** `Promise<void>`

**Example:**
```javascript
await AuditLogger.logFromRequest(req, 'DRUG_INTERACTION_CHECK', {
  medications: ['Aspirin', 'Warfarin'],
  severity: 'critical'
});
```

### `AuditLogger.getIpAddress(req)`

Helper method to extract IP address from Express request.

**Parameters:**
- `req` (Object) - Express request object

**Returns:** `string | null`

### `AuditLogger.getUserAgent(req)`

Helper method to extract user agent from Express request.

**Parameters:**
- `req` (Object) - Express request object

**Returns:** `string | null`

## HIPAA Compliance

The audit logger is designed to meet HIPAA compliance requirements:

- ✅ **Audit Controls (§164.312(b))** - Logs all access and modifications to PHI
- ✅ **Integrity Controls (§164.312(c)(1))** - Maintains audit trail integrity
- ✅ **Person or Entity Authentication (§164.312(d))** - Records user identity
- ✅ **Transmission Security (§164.312(e)(1))** - Logs data transmission events
- ✅ **7-Year Retention** - Audit logs should be retained for 7 years per HIPAA requirements

## Error Handling

The audit logger uses graceful error handling to ensure that logging failures don't break the main application flow:

```javascript
try {
  // Logging logic
} catch (error) {
  // Errors are logged but not thrown
  console.error('❌ AuditLogger error:', error.message);
}
```

This means:
- If the database is unavailable, the application continues to work
- Logging errors are logged to console for debugging
- The main application flow is never interrupted by audit logging failures

## Migration

To create the `audit_logs` table, run the migration:

```bash
node Utils/runMigration.js add_audit_logs_table.sql
```

Or manually execute the SQL file:

```bash
mysql -u root -p health_sync < migrations/add_audit_logs_table.sql
```

## Testing

Run the integration tests:

```bash
npm test -- auditLogger.integration.test.js
```

Or run the standalone test script:

```bash
node Utils/testAuditLogger.js
```

## Best Practices

1. **Always log sensitive operations** - Any operation involving PHI should be logged
2. **Include relevant context** - Store meaningful data in the `data` field
3. **Use consistent event types** - Use predefined event type constants
4. **Don't log sensitive data** - Avoid logging passwords, tokens, or full PHI in event data
5. **Log at the right level** - Log after successful operations, not before

## Example Integration

Here's a complete example of integrating audit logging into a controller:

```javascript
const AuditLogger = require('../Utils/auditLogger');
const { requireAuth } = require('../Middleware/authMiddleware');

router.post('/api/sos/emergency', requireAuth, async (req, res) => {
  try {
    const { location } = req.body;
    
    // Trigger emergency
    const result = await triggerSOSEmergency(req.user.id, location);
    
    // Log the audit event
    await AuditLogger.logFromRequest(req, 'SOS_TRIGGERED', {
      emergencyId: result.emergencyId,
      location: location,
      contactsNotified: result.contactsNotified
    });
    
    res.json({
      success: true,
      emergencyId: result.emergencyId,
      message: 'تم إرسال طلب الطوارئ بنجاح'
    });
  } catch (error) {
    console.error('SOS error:', error);
    res.status(500).json({ error: 'فشل إرسال طلب الطوارئ' });
  }
});
```

## Maintenance

### Querying Audit Logs

```sql
-- Get all logs for a specific user
SELECT * FROM audit_logs WHERE user_id = 123 ORDER BY timestamp DESC;

-- Get logs by event type
SELECT * FROM audit_logs WHERE event_type = 'IMAGE_ANALYSIS' ORDER BY timestamp DESC;

-- Get logs within a date range
SELECT * FROM audit_logs 
WHERE timestamp BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY timestamp DESC;

-- Get logs with specific event data
SELECT * FROM audit_logs 
WHERE JSON_EXTRACT(event_data, '$.severity') = 'critical'
ORDER BY timestamp DESC;
```

### Archiving Old Logs

For HIPAA compliance, audit logs should be retained for 7 years. Consider implementing an archiving strategy:

```sql
-- Archive logs older than 7 years to a separate table
INSERT INTO audit_logs_archive 
SELECT * FROM audit_logs 
WHERE timestamp < DATE_SUB(NOW(), INTERVAL 7 YEAR);

-- Delete archived logs from main table
DELETE FROM audit_logs 
WHERE timestamp < DATE_SUB(NOW(), INTERVAL 7 YEAR);
```

## Support

For issues or questions about the audit logger, please refer to:
- Design document: `.kiro/specs/medical-ai-enhancements/design.md`
- Property 7: Data Privacy and Security requirements
- HIPAA compliance guidelines
