/**
 * Property-Based Tests: Audit Logger
 *
 * Property 7: Data Privacy and Security
 *   - All medical data operations are audit-logged with userId, event type, and timestamp
 *   - Every log entry must have a valid userId, non-empty event type, and valid timestamp
 *   - Event data is properly stored as JSON
 *   - Audit logging never throws errors (graceful degradation)
 *
 * **Validates: Requirements security and HIPAA compliance**
 */

'use strict';

const fc = require('fast-check');
const AuditLogger = require('../Utils/auditLogger');
const { pool } = require('../Config/db');

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Valid user IDs (positive integers) */
const userIdArb = fc.integer({ min: 1, max: 999999 });

/** Medical data event types */
const eventTypeArb = fc.constantFrom(
  'IMAGE_ANALYSIS',
  'SOS_TRIGGERED',
  'DRUG_INTERACTION_CHECK',
  'AI_CHAT_SESSION',
  'MEDICAL_FILE_EXPORT',
  'DOCUMENT_UPLOAD',
  'VITAL_SIGNS_UPDATE',
  'MEDICATION_ADDED',
  'APPOINTMENT_CREATED'
);

/** Event data objects (various medical data structures) */
const eventDataArb = fc.oneof(
  fc.record({
    documentId: fc.integer({ min: 1, max: 10000 }),
    imageType: fc.constantFrom('lab_report', 'xray', 'prescription', 'medical_report'),
  }),
  fc.record({
    location: fc.record({
      lat: fc.float({ min: -90, max: 90, noNaN: true }),
      lng: fc.float({ min: -180, max: 180, noNaN: true }),
    }),
  }),
  fc.record({
    medications: fc.array(fc.string(), { minLength: 1, maxLength: 5 }),
    severity: fc.constantFrom('none', 'mild', 'moderate', 'severe', 'critical'),
  }),
  fc.record({
    sessionId: fc.uuid(),
    messageCount: fc.integer({ min: 1, max: 50 }),
  }),
  fc.record({
    exportFormat: fc.constantFrom('PDF', 'JSON'),
    fileSize: fc.integer({ min: 1024, max: 10485760 }),
  })
);

/** IP addresses (IPv4 format) */
const ipAddressArb = fc.tuple(
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 })
).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

/** User agent strings */
const userAgentArb = fc.constantFrom(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  'TestAgent/1.0',
  null
);

/** Complete audit event object */
const auditEventArb = fc.record({
  userId: userIdArb,
  type: eventTypeArb,
  data: eventDataArb,
  ipAddress: fc.option(ipAddressArb, { nil: null }),
  userAgent: userAgentArb,
});

// ─── Test Setup ──────────────────────────────────────────────────────────────

describe('Property 7 — Data Privacy and Security: Audit Logging', () => {
  // Clean up test data after each test
  afterEach(async () => {
    try {
      await pool.execute('DELETE FROM audit_logs WHERE user_id >= 1 AND user_id <= 999999');
    } catch (error) {
      console.error('Cleanup error:', error.message);
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  /**
   * **Validates: Requirements security and HIPAA compliance**
   *
   * For every medical data operation (represented by an audit event):
   *   - The log entry is successfully created in the database
   *   - The stored userId matches the input userId
   *   - The stored event_type matches the input type
   *   - The timestamp is a valid date within the last minute
   */
  it(
    'all medical data operations are audit-logged with userId, event type, and timestamp',
    async () => {
      await fc.assert(
        fc.asyncProperty(auditEventArb, async (event) => {
          const beforeLog = new Date();

          // Log the event
          await AuditLogger.log(event);

          const afterLog = new Date();

          // Verify the log entry was created
          const [rows] = await pool.execute(
            'SELECT * FROM audit_logs WHERE user_id = ? AND event_type = ? ORDER BY created_at DESC LIMIT 1',
            [event.userId, event.type]
          );

          expect(rows.length).toBeGreaterThan(0);

          const logEntry = rows[0];

          // Property 7: userId, event type, and timestamp must be present
          expect(logEntry.user_id).toBe(event.userId);
          expect(logEntry.event_type).toBe(event.type);
          expect(logEntry.created_at).toBeDefined();

          // Timestamp must be valid and recent
          const logTimestamp = new Date(logEntry.created_at);
          expect(logTimestamp.getTime()).toBeGreaterThanOrEqual(beforeLog.getTime() - 1000);
          expect(logTimestamp.getTime()).toBeLessThanOrEqual(afterLog.getTime() + 1000);
        }),
        { numRuns: 50 }
      );
    },
    60000
  );

  /**
   * **Validates: Requirements security and HIPAA compliance**
   *
   * For every audit event with event data:
   *   - The event_data field is stored as valid JSON
   *   - The parsed JSON matches the original data structure
   *   - All nested properties are preserved
   */
  it(
    'event data is properly stored as JSON and can be retrieved',
    async () => {
      await fc.assert(
        fc.asyncProperty(auditEventArb, async (event) => {
          await AuditLogger.log(event);

          const [rows] = await pool.execute(
            'SELECT * FROM audit_logs WHERE user_id = ? AND event_type = ? ORDER BY created_at DESC LIMIT 1',
            [event.userId, event.type]
          );

          expect(rows.length).toBeGreaterThan(0);

          const logEntry = rows[0];

          // Event data must be valid JSON
          expect(logEntry.event_data).toBeDefined();
          const parsedData = JSON.parse(logEntry.event_data);

          // Verify data structure is preserved
          expect(typeof parsedData).toBe('object');

          // Check that original data properties are present in parsed data
          if (event.data) {
            Object.keys(event.data).forEach((key) => {
              expect(parsedData).toHaveProperty(key);
            });
          }
        }),
        { numRuns: 50 }
      );
    },
    60000
  );

  /**
   * **Validates: Requirements security and HIPAA compliance**
   *
   * For every audit event with IP address and user agent:
   *   - The ip_address field is stored correctly
   *   - The user_agent field is stored correctly
   *   - Null values are handled gracefully
   */
  it(
    'IP address and user agent are stored correctly',
    async () => {
      await fc.assert(
        fc.asyncProperty(auditEventArb, async (event) => {
          await AuditLogger.log(event);

          const [rows] = await pool.execute(
            'SELECT * FROM audit_logs WHERE user_id = ? AND event_type = ? ORDER BY created_at DESC LIMIT 1',
            [event.userId, event.type]
          );

          expect(rows.length).toBeGreaterThan(0);

          const logEntry = rows[0];

          // IP address and user agent should match input (or be null)
          if (event.ipAddress) {
            expect(logEntry.ip_address).toBe(event.ipAddress);
          } else {
            expect(logEntry.ip_address).toBeNull();
          }

          if (event.userAgent) {
            expect(logEntry.user_agent).toBe(event.userAgent);
          } else {
            expect(logEntry.user_agent).toBeNull();
          }
        }),
        { numRuns: 50 }
      );
    },
    60000
  );

  /**
   * **Validates: Requirements security and HIPAA compliance**
   *
   * Audit logging must never throw errors or break the main application flow.
   * Even with invalid data, the log method should handle errors gracefully.
   */
  it(
    'audit logging never throws errors (graceful degradation)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.option(fc.oneof(userIdArb, fc.constant(null), fc.constant(undefined)), {
              nil: null,
            }),
            type: fc.option(fc.oneof(eventTypeArb, fc.constant(''), fc.constant(null)), {
              nil: null,
            }),
            data: fc.option(eventDataArb, { nil: null }),
            ipAddress: fc.option(ipAddressArb, { nil: null }),
            userAgent: userAgentArb,
          }),
          async (event) => {
            // This should never throw, even with invalid data
            await expect(AuditLogger.log(event)).resolves.not.toThrow();
          }
        ),
        { numRuns: 30 }
      );
    },
    60000
  );

  /**
   * **Validates: Requirements security and HIPAA compliance**
   *
   * Multiple audit events for the same user must all be logged independently.
   * Each event must have its own unique entry with correct timestamp ordering.
   */
  it(
    'multiple audit events for the same user are all logged independently',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          fc.array(eventTypeArb, { minLength: 2, maxLength: 5 }),
          async (userId, eventTypes) => {
            // Log multiple events for the same user
            for (const type of eventTypes) {
              await AuditLogger.log({
                userId,
                type,
                data: { test: true },
                ipAddress: '127.0.0.1',
                userAgent: 'TestAgent',
              });
            }

            // Verify all events were logged
            const [rows] = await pool.execute(
              'SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at ASC',
              [userId]
            );

            expect(rows.length).toBeGreaterThanOrEqual(eventTypes.length);

            // Verify timestamps are in ascending order
            for (let i = 1; i < rows.length; i++) {
              const prevTimestamp = new Date(rows[i - 1].created_at);
              const currTimestamp = new Date(rows[i].created_at);
              expect(currTimestamp.getTime()).toBeGreaterThanOrEqual(prevTimestamp.getTime());
            }
          }
        ),
        { numRuns: 20 }
      );
    },
    60000
  );

  /**
   * **Validates: Requirements security and HIPAA compliance**
   *
   * The logFromRequest helper method must correctly extract userId, IP address,
   * and user agent from Express request objects and log them properly.
   */
  it(
    'logFromRequest helper correctly extracts and logs request data',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          eventTypeArb,
          ipAddressArb,
          fc.string({ minLength: 10, maxLength: 100 }),
          async (userId, eventType, ipAddress, userAgent) => {
            // Mock Express request object
            const mockReq = {
              user: { id: userId },
              ip: ipAddress,
              get: (header) => (header === 'user-agent' ? userAgent : null),
            };

            await AuditLogger.logFromRequest(mockReq, eventType, { test: true });

            const [rows] = await pool.execute(
              'SELECT * FROM audit_logs WHERE user_id = ? AND event_type = ? ORDER BY created_at DESC LIMIT 1',
              [userId, eventType]
            );

            expect(rows.length).toBeGreaterThan(0);

            const logEntry = rows[0];
            expect(logEntry.user_id).toBe(userId);
            expect(logEntry.event_type).toBe(eventType);
            expect(logEntry.ip_address).toBe(ipAddress);
            expect(logEntry.user_agent).toBe(userAgent);
          }
        ),
        { numRuns: 30 }
      );
    },
    60000
  );
});
