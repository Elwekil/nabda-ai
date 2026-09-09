/**
 * Property-Based Tests: Image Analysis Confidence Score
 *
 * Property 2: Image Analysis Confidence — confidence always between 0 and 100,
 * low confidence triggers warning
 * Validates: Requirements Feature 1 confidence scoring
 *
 * Tests that:
 * 1. calculateConfidence(text, values, features) always returns a number between 0 and 100
 *    for any input combination.
 * 2. When confidence < 50, analyzeImageLocally result always includes a low confidence
 *    warning in result.warnings.
 * 3. detectAbnormalValues(values) always returns an array (never throws) for any array
 *    of medical values.
 */

'use strict';

const fc = require('fast-check');

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Any string (including empty) for OCR text */
const textArb = fc.string({ minLength: 0, maxLength: 1000 });

/** A single medical value object with arbitrary fields */
const medicalValueArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  value: fc.oneof(
    fc.float({ min: 0, max: 1000, noNaN: true }).map(String),
    fc.string({ minLength: 1, maxLength: 10 })
  ),
  unit: fc.string({ minLength: 0, maxLength: 20 }),
  normalRange: fc.record({
    min: fc.float({ min: 0, max: 500, noNaN: true }),
    max: fc.float({ min: 0, max: 1000, noNaN: true }),
  }),
  isAbnormal: fc.boolean(),
});

/** Array of medical value objects (0–10 items) */
const medicalValuesArb = fc.array(medicalValueArb, { minLength: 0, maxLength: 10 });

/** TF feature object with numeric fields */
const featuresArb = fc.record({
  mean: fc.float({ min: 0, max: 1, noNaN: true }),
  std: fc.float({ min: 0, max: 1, noNaN: true }),
  min: fc.float({ min: 0, max: 1, noNaN: true }),
  max: fc.float({ min: 0, max: 1, noNaN: true }),
  shape: fc.constant([224, 224, 3]),
});

/** Nullable/undefined features (edge cases) */
const featuresOrNullArb = fc.oneof(featuresArb, fc.constant(null), fc.constant(undefined));

/** Document types supported by the service */
const documentTypeArb = fc.constantFrom(
  'lab_report',
  'xray',
  'prescription',
  'medical_report',
  'unknown'
);

// ─── Module setup with mocks ──────────────────────────────────────────────────

// Mock the database pool so no real DB connection is needed
jest.mock('../Config/db', () => ({
  pool: {
    execute: jest.fn().mockResolvedValue([[], []]),
  },
}));

// Mock Ollama client to avoid real network calls
jest.mock('../Utils/ollamaClient', () => ({
  queryOllama: jest.fn().mockResolvedValue(
    JSON.stringify({
      analysis: 'Mock analysis',
      treatmentSuggestions: [],
      warnings: [],
    })
  ),
}));

// Mock heavy native modules used inside the service
jest.mock('tesseract.js', () => ({
  recognize: jest.fn().mockResolvedValue({ data: { text: '' } }),
}));

jest.mock('@tensorflow/tfjs-node', () => ({
  node: { decodeImage: jest.fn() },
  image: { resizeBilinear: jest.fn() },
  moments: jest.fn(),
}));

jest.mock('sharp', () =>
  jest.fn().mockReturnValue({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock')),
  })
);

jest.mock('pdf-parse', () => jest.fn().mockResolvedValue({ text: '' }));

// ─── Import pure functions under test ────────────────────────────────────────

const {
  calculateConfidence,
  detectAbnormalValues,
  parseValuesFromText,
} = require('../Services/localImageAnalysisService');

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Property 2 — Image Analysis Confidence Score', () => {
  // ── Property 2a: calculateConfidence always returns [0, 100] ─────────────

  it(
    'calculateConfidence(text, values, features) always returns a number between 0 and 100',
    () => {
      /**
       * **Validates: Requirements Feature 1 confidence scoring**
       *
       * For every combination of text, values array, and features object,
       * calculateConfidence must:
       *   - return a number (not NaN, not Infinity)
       *   - be >= 0
       *   - be <= 100
       */
      fc.assert(
        fc.property(textArb, medicalValuesArb, featuresOrNullArb, (text, values, features) => {
          const confidence = calculateConfidence(text, values, features);

          expect(typeof confidence).toBe('number');
          expect(Number.isFinite(confidence)).toBe(true);
          expect(confidence).toBeGreaterThanOrEqual(0);
          expect(confidence).toBeLessThanOrEqual(100);
        }),
        { numRuns: 200 }
      );
    }
  );

  // ── Property 2b: low confidence always triggers warning ──────────────────

  it(
    'analyzeImageLocally result always includes low confidence warning when confidence < 50',
    async () => {
      /**
       * **Validates: Requirements Feature 1 confidence scoring**
       *
       * We construct inputs that deterministically produce confidence < 50:
       *   - empty/short text (≤10 chars → 0 text points)
       *   - empty values array (0 value points)
       *   - low std features (std ≤ 0.05 → 0 TF points)
       * Total score = 0 < 50, so the low-confidence warning must appear.
       */
      const { analyzeImageLocally } = require('../Services/localImageAnalysisService');

      // Inputs that guarantee confidence = 0 (all scoring branches return 0)
      const shortTexts = ['', 'hi', 'abc'];

      for (const text of shortTexts) {
        // Patch OCR to return our controlled short text
        const Tesseract = require('tesseract.js');
        Tesseract.recognize.mockResolvedValueOnce({ data: { text } });

        // Use a real JPEG-like buffer (not PDF) so the image path is taken
        const imageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]); // JPEG magic bytes

        const result = await analyzeImageLocally(imageBuffer, 'lab_report', 1);

        // confidence must be in [0, 100]
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(100);

        // When confidence < 50, the low-confidence warning must be present
        if (result.confidence < 50) {
          const hasLowConfidenceWarning = result.warnings.some((w) =>
            w.includes('مستوى الثقة منخفض')
          );
          expect(hasLowConfidenceWarning).toBe(true);
        }
      }
    },
    30000
  );

  it(
    'analyzeImageLocally always includes low confidence warning for any input producing confidence < 50',
    async () => {
      /**
       * **Validates: Requirements Feature 1 confidence scoring**
       *
       * Property-based version: for any text shorter than 11 chars with no
       * parsed values, confidence will be < 50 and the warning must appear.
       */
      const { analyzeImageLocally } = require('../Services/localImageAnalysisService');
      const Tesseract = require('tesseract.js');

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 0, maxLength: 10 }), // short text → 0 text score
          async (shortText) => {
            Tesseract.recognize.mockResolvedValueOnce({ data: { text: shortText } });

            const imageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
            const result = await analyzeImageLocally(imageBuffer, 'lab_report', 1);

            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(100);

            if (result.confidence < 50) {
              const hasWarning = result.warnings.some((w) =>
                w.includes('مستوى الثقة منخفض')
              );
              expect(hasWarning).toBe(true);
            }
          }
        ),
        { numRuns: 30 }
      );
    },
    60000
  );

  // ── Property 2c: detectAbnormalValues always returns an array ────────────

  it(
    'detectAbnormalValues(values) always returns an array and never throws for any medical values array',
    () => {
      /**
       * **Validates: Requirements Feature 1 confidence scoring**
       *
       * For every array of medical value objects (including malformed ones),
       * detectAbnormalValues must:
       *   - not throw
       *   - return an Array
       */
      fc.assert(
        fc.property(medicalValuesArb, (values) => {
          let result;
          let threw = false;

          try {
            result = detectAbnormalValues(values);
          } catch {
            threw = true;
          }

          expect(threw).toBe(false);
          expect(Array.isArray(result)).toBe(true);
        }),
        { numRuns: 200 }
      );
    }
  );

  it(
    'detectAbnormalValues returns only warnings for values where isAbnormal is true',
    () => {
      /**
       * **Validates: Requirements Feature 1 confidence scoring**
       *
       * The number of warnings returned must equal the count of values
       * where isAbnormal === true.
       */
      fc.assert(
        fc.property(medicalValuesArb, (values) => {
          const result = detectAbnormalValues(values);
          const abnormalCount = values.filter((v) => v.isAbnormal).length;
          expect(result.length).toBe(abnormalCount);
        }),
        { numRuns: 200 }
      );
    }
  );

  // ── Bonus: parseValuesFromText always returns an array ───────────────────

  it(
    'parseValuesFromText(text, features) always returns an array and never throws',
    () => {
      /**
       * **Validates: Requirements Feature 1 confidence scoring**
       *
       * For any text and features combination, parseValuesFromText must not
       * throw and must return an Array.
       */
      fc.assert(
        fc.property(textArb, featuresOrNullArb, (text, features) => {
          let result;
          let threw = false;

          try {
            result = parseValuesFromText(text, features);
          } catch {
            threw = true;
          }

          expect(threw).toBe(false);
          expect(Array.isArray(result)).toBe(true);
        }),
        { numRuns: 200 }
      );
    }
  );
});
