/**
 * Property-Based Tests: SOS Emergency Service
 *
 * Property 3: SOS Emergency Notification Guarantee
 *   - Every SOS request with at least one emergency contact notifies at least one contact
 *   - Creates an emergency log entry
 *   - Stores a medical file snapshot
 * Validates: Requirements Feature 2
 *
 * Property 8: Geolocation Validity
 *   - Coordinates stored exactly as received within valid GPS ranges
 *   - latitude: -90 to 90, longitude: -180 to 180
 *   - The stored location in the emergency log matches the input coordinates
 * Validates: Requirements Feature 2 location handling
 */

'use strict';

const fc = require('fast-check');

// ─── Mock setup ──────────────────────────────────────────────────────────────

// Capture INSERT calls so we can inspect stored coordinates / snapshot
let lastInsertArgs = null;

jest.mock('../Config/db', () => {
  const mockExecute = jest.fn();
  return { pool: { execute: mockExecute } };
});

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  }),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build the sequence of mock return values that pool.execute needs for one
 * triggerSOSEmergency call.
 *
 * Query order inside the service:
 *   1. fetchCompleteMedicalFile → users SELECT
 *   2. fetchCompleteMedicalFile → medications SELECT
 *   3. fetchCompleteMedicalFile → appointments SELECT
 *   4. fetchCompleteMedicalFile → vitals SELECT
 *   5. fetchCompleteMedicalFile → documents SELECT
 *   6. fetchCompleteMedicalFile → emergency_contacts SELECT
 *   7. fetchEmergencyContacts   → emergency_contacts SELECT (second call)
 *   8. INSERT INTO sos_emergency_logs
 */
function setupMockExecute(contactCount = 1) {
  const { pool } = require('../Config/db');

  const mockUser = {
    id: 1,
    full_name: 'Test User',
    phone: '0500000000',
    age: 30,
    blood_type: 'A+',
    gender: 'male',
    city: 'Riyadh',
    chronic_conditions: null,
    allergies: null,
    family_doctor_name: null,
    family_doctor_phone: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
  };

  const mockContacts = Array.from({ length: contactCount }, (_, i) => ({
    id: i + 1,
    name: `Contact ${i + 1}`,
    phone: `050000000${i}`,
    email: `contact${i + 1}@example.com`,
    relationship: 'family',
    is_primary: i === 0 ? 1 : 0,
  }));

  pool.execute.mockReset();

  // Track INSERT calls
  pool.execute.mockImplementation((sql, params) => {
    if (sql.trim().toUpperCase().startsWith('INSERT')) {
      lastInsertArgs = { sql, params };
      return Promise.resolve([{ insertId: 1, affectedRows: 1 }]);
    }
    // SELECT queries — return appropriate data based on FROM clause
    if (/FROM users/i.test(sql))            return Promise.resolve([[mockUser]]);
    if (/FROM medications/i.test(sql))      return Promise.resolve([[]]);
    if (/FROM appointments/i.test(sql))     return Promise.resolve([[]]);
    if (/FROM vitals/i.test(sql))           return Promise.resolve([[]]);
    if (/FROM medical_documents/i.test(sql))return Promise.resolve([[]]);
    if (/FROM emergency_contacts/i.test(sql))return Promise.resolve([mockContacts]);
    return Promise.resolve([[]]);
  });
}

// ─── Import service (after mocks are registered) ─────────────────────────────

const { triggerSOSEmergency } = require('../Services/sosService');

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Valid GPS latitude: -90 to 90 */
const latArb = fc.float({ min: -90, max: 90, noNaN: true });

/** Valid GPS longitude: -180 to 180 */
const lngArb = fc.float({ min: -180, max: 180, noNaN: true });

/** Valid location object */
const locationArb = fc.record({
  latitude: latArb,
  longitude: lngArb,
  accuracy: fc.float({ min: 0, max: 100, noNaN: true }),
});

/** Number of emergency contacts (1–3) */
const contactCountArb = fc.integer({ min: 1, max: 3 });

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Property 3 — SOS Emergency Notification Guarantee', () => {
  /**
   * **Validates: Requirements Feature 2**
   *
   * For every valid location and any number of emergency contacts >= 1:
   *   - result.success === true
   *   - result.contactsNotified >= 1
   *   - result.emergencyId is a valid UUID (36-char string)
   *   - The INSERT to sos_emergency_logs was called (emergency log created)
   *   - The medical_file_snapshot stored in the log is non-empty JSON
   */
  it(
    'every SOS request with at least one contact notifies >= 1 contact, creates log, and stores snapshot',
    async () => {
      await fc.assert(
        fc.asyncProperty(locationArb, contactCountArb, async (location, contactCount) => {
          lastInsertArgs = null;
          setupMockExecute(contactCount);

          const result = await triggerSOSEmergency(1, location);

          // Core guarantees
          expect(result.success).toBe(true);
          expect(result.contactsNotified).toBeGreaterThanOrEqual(1);

          // emergencyId must be a valid UUID
          expect(typeof result.emergencyId).toBe('string');
          expect(result.emergencyId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          );

          // Emergency log INSERT must have been called
          expect(lastInsertArgs).not.toBeNull();
          expect(lastInsertArgs.sql).toMatch(/INSERT INTO sos_emergency_logs/i);

          // Medical file snapshot (params[5]) must be non-empty JSON
          const snapshotJson = lastInsertArgs.params[5];
          expect(typeof snapshotJson).toBe('string');
          const snapshot = JSON.parse(snapshotJson);
          expect(snapshot).toBeTruthy();
          expect(snapshot.personalInfo).toBeDefined();
        }),
        { numRuns: 50 }
      );
    },
    60000
  );

  it(
    'result always has a timestamp that is a valid Date',
    async () => {
      await fc.assert(
        fc.asyncProperty(locationArb, async (location) => {
          setupMockExecute(1);
          const result = await triggerSOSEmergency(1, location);

          expect(result.timestamp).toBeInstanceOf(Date);
          expect(Number.isFinite(result.timestamp.getTime())).toBe(true);
        }),
        { numRuns: 30 }
      );
    },
    60000
  );
});

describe('Property 8 — Geolocation Coordinate Validity', () => {
  /**
   * **Validates: Requirements Feature 2 location handling**
   *
   * For every valid GPS coordinate pair:
   *   - The latitude stored in sos_emergency_logs equals the input latitude
   *   - The longitude stored in sos_emergency_logs equals the input longitude
   *   - Both values remain within valid GPS ranges after storage
   */
  it(
    'coordinates stored in emergency log exactly match the input coordinates',
    async () => {
      await fc.assert(
        fc.asyncProperty(latArb, lngArb, async (latitude, longitude) => {
          lastInsertArgs = null;
          setupMockExecute(1);

          const location = { latitude, longitude, accuracy: 10 };
          await triggerSOSEmergency(1, location);

          expect(lastInsertArgs).not.toBeNull();

          // INSERT params layout (from sosService.js):
          // [userId, emergencyId, latitude, longitude, accuracy, snapshot, contacts, notificationStatus]
          const storedLat = lastInsertArgs.params[2];
          const storedLng = lastInsertArgs.params[3];

          expect(storedLat).toBe(latitude);
          expect(storedLng).toBe(longitude);

          // Stored values must remain within valid GPS ranges
          expect(storedLat).toBeGreaterThanOrEqual(-90);
          expect(storedLat).toBeLessThanOrEqual(90);
          expect(storedLng).toBeGreaterThanOrEqual(-180);
          expect(storedLng).toBeLessThanOrEqual(180);
        }),
        { numRuns: 100 }
      );
    },
    60000
  );

  it(
    'snapshot inside the log also contains the original coordinates',
    async () => {
      await fc.assert(
        fc.asyncProperty(latArb, lngArb, async (latitude, longitude) => {
          lastInsertArgs = null;
          setupMockExecute(1);

          const location = { latitude, longitude, accuracy: 5 };
          await triggerSOSEmergency(1, location);

          const snapshotJson = lastInsertArgs.params[5];
          const snapshot = JSON.parse(snapshotJson);

          // JSON serialization normalises -0 → 0, so we compare numerically
          // rather than with Object.is to avoid false failures on -0 edge case.
          expect(snapshot.location.latitude).toBeCloseTo(latitude, 10);
          expect(snapshot.location.longitude).toBeCloseTo(longitude, 10);
        }),
        { numRuns: 100 }
      );
    },
    60000
  );
});
