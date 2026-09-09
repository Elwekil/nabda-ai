/**
 * Property-Based Tests: AI Chat Service — Emergency Detection
 *
 * Property 5: Chatbot Emergency Detection
 *   - Messages with emergency keywords always produce urgencyLevel='emergency'
 *   - When urgencyLevel='emergency', response always contains emergency instructions
 *   - detectUrgency never throws for any string input
 *
 * Validates: Requirements Feature 4 urgency detection
 */

'use strict';

const fc = require('fast-check');

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../Utils/ollamaClient', () => ({
  queryOllama: jest.fn().mockResolvedValue('This is a normal AI response about your symptoms.'),
}));

jest.mock('../Config/db', () => ({
  pool: {
    query: jest.fn().mockResolvedValue([[{ id: 1, session_id: 'mock-session' }]]),
    execute: jest.fn().mockResolvedValue([{ insertId: 1 }]),
  },
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

const { detectUrgency, chatWithMedicalAI } = require('../Services/aiChatService');

// ─── Emergency keywords (mirrors the service) ────────────────────────────────

const EMERGENCY_KEYWORDS_AR = [
  'ألم شديد', 'صعوبة تنفس', 'ضيق تنفس', 'إغماء', 'نزيف',
  'حادث', 'طوارئ', 'مساعدة', 'لا أستطيع التنفس', 'ألم في الصدر', 'سكتة', 'جلطة',
];

const EMERGENCY_KEYWORDS_EN = [
  'chest pain', "can't breathe", 'difficulty breathing', 'unconscious',
  'bleeding', 'emergency', 'heart attack', 'stroke', 'severe pain', 'help me',
];

const ALL_EMERGENCY_KEYWORDS = [...EMERGENCY_KEYWORDS_AR, ...EMERGENCY_KEYWORDS_EN];

// ─── Arbitraries ──────────────────────────────────────────────────────────────

/** Pick a random emergency keyword */
const emergencyKeywordArb = fc.constantFrom(...ALL_EMERGENCY_KEYWORDS);

/** A message that contains an emergency keyword (keyword + optional surrounding text) */
const messageWithEmergencyKeywordArb = fc.tuple(
  fc.string({ minLength: 0, maxLength: 30 }),
  emergencyKeywordArb,
  fc.string({ minLength: 0, maxLength: 30 })
).map(([prefix, keyword, suffix]) => `${prefix} ${keyword} ${suffix}`.trim());

/** Any arbitrary string (for the "never throws" property) */
const anyStringArb = fc.string({ minLength: 0, maxLength: 500 });

/** Minimal medical context */
const contextArb = fc.record({
  userId: fc.integer({ min: 1, max: 1000 }),
  age: fc.integer({ min: 1, max: 100 }),
  gender: fc.constantFrom('male', 'female'),
  bloodType: fc.constantFrom('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'),
  chronicConditions: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 3 }),
  allergies: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 3 }),
  currentMedications: fc.array(fc.record({ name: fc.string({ minLength: 1, maxLength: 20 }) }), { maxLength: 3 }),
  recentVitals: fc.constant([]),
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Property 5a — detectUrgency returns emergency for any message with emergency keyword', () => {
  /**
   * For any message that contains an emergency keyword,
   * detectUrgency must return 'emergency'.
   */
  it(
    'detectUrgency returns "emergency" when message contains any emergency keyword',
    () => {
      fc.assert(
        fc.property(messageWithEmergencyKeywordArb, (message) => {
          const urgency = detectUrgency(message, '', {});
          expect(urgency).toBe('emergency');
        }),
        { numRuns: 200 }
      );
    }
  );

  it(
    'detectUrgency returns "emergency" when AI response contains any emergency keyword',
    () => {
      fc.assert(
        fc.property(emergencyKeywordArb, (keyword) => {
          const urgency = detectUrgency('I feel unwell', keyword, {});
          expect(urgency).toBe('emergency');
        }),
        { numRuns: 50 }
      );
    }
  );
});

describe('Property 5b — Emergency response always contains emergency instructions', () => {
  /**
   * When chatWithMedicalAI returns urgencyLevel='emergency',
   * the response message must contain the emergency alert text.
   */
  it(
    'response message contains emergency instructions when urgencyLevel is emergency',
    async () => {
      await fc.assert(
        fc.asyncProperty(emergencyKeywordArb, contextArb, async (keyword, context) => {
          const message = `I have ${keyword}`;
          const result = await chatWithMedicalAI(message, [], context);

          if (result.urgencyLevel === 'emergency') {
            // Must contain the emergency alert marker
            expect(result.message).toMatch(/EMERGENCY ALERT|تنبيه طوارئ/i);
          }
        }),
        { numRuns: 30 }
      );
    },
    30000
  );
});

describe('Property 5c — detectUrgency never throws for any string input', () => {
  /**
   * detectUrgency must never throw regardless of input.
   */
  it(
    'detectUrgency never throws for any message string',
    () => {
      fc.assert(
        fc.property(anyStringArb, anyStringArb, (message, aiResponse) => {
          let threw = false;
          try {
            detectUrgency(message, aiResponse, {});
          } catch {
            threw = true;
          }
          expect(threw).toBe(false);
        }),
        { numRuns: 500 }
      );
    }
  );

  it(
    'detectUrgency always returns a valid urgency level string',
    () => {
      const validLevels = ['low', 'medium', 'high', 'emergency'];
      fc.assert(
        fc.property(anyStringArb, anyStringArb, (message, aiResponse) => {
          const result = detectUrgency(message, aiResponse, {});
          expect(validLevels).toContain(result);
        }),
        { numRuns: 300 }
      );
    }
  );
});
