/**
 * Property-Based Tests: Diagnosis Treatment Ranking
 *
 * Property 10: Treatment Suggestion Ranking
 *   - Always exactly 3 treatments ranked by effectiveness descending
 *   - shouldSeeDoctor=true when any condition probability > 70% or urgency is high/emergency
 *   - disclaimer is always present
 *
 * Validates: Requirements Feature 4 diagnosis results
 */

'use strict';

const fc = require('fast-check');

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../Utils/ollamaClient', () => ({
  queryOllama: jest.fn(),
}));

jest.mock('../Config/db', () => ({
  pool: {
    query: jest.fn().mockResolvedValue([[{ id: 1, session_id: 'mock-session', messages: '[]' }]]),
    execute: jest.fn().mockResolvedValue([{ insertId: 1 }]),
  },
}));

const { queryOllama } = require('../Utils/ollamaClient');
const { diagnoseSymptomsLocally } = require('../Services/aiChatService');

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const symptomArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 30 }),
  severity: fc.constantFrom('mild', 'moderate', 'severe'),
  duration: fc.constantFrom('1 day', '3 days', '1 week', '2 weeks'),
});

/** At least 3 symptoms */
const symptomsArb = fc.array(symptomArb, { minLength: 3, maxLength: 8 });

const contextArb = fc.record({
  userId: fc.integer({ min: 1, max: 1000 }),
  age: fc.integer({ min: 1, max: 100 }),
  gender: fc.constantFrom('male', 'female'),
  bloodType: fc.constantFrom('A+', 'B+', 'O+', 'AB+'),
  chronicConditions: fc.constant([]),
  allergies: fc.constant([]),
  currentMedications: fc.constant([]),
  recentVitals: fc.constant([]),
});

/** Build a valid Ollama JSON response with N treatments */
function buildMockResponse(treatmentCount, urgencyLevel = 'low', maxProbability = 50) {
  const treatments = Array.from({ length: treatmentCount }, (_, i) => ({
    rank: i + 1,
    name: `Treatment ${i + 1}`,
    description: `Description ${i + 1}`,
    medications: [],
    lifestyle: ['rest'],
    duration: '1 week',
    effectiveness: 90 - i * 10,
  }));

  return JSON.stringify({
    possibleConditions: [
      { name: 'Condition A', probability: maxProbability, description: 'desc', symptoms: [] },
    ],
    recommendedTreatments: treatments,
    urgencyLevel,
    shouldSeeDoctor: false,
    disclaimer: 'AI disclaimer text.',
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Property 10 — Treatment Suggestion Ranking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 10a: Always exactly 3 treatments
  it(
    'always returns exactly 3 treatments regardless of how many Ollama returns',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          symptomsArb,
          contextArb,
          fc.integer({ min: 0, max: 6 }), // Ollama may return 0–6 treatments
          async (symptoms, context, treatmentCount) => {
            queryOllama.mockResolvedValueOnce(buildMockResponse(treatmentCount));

            const result = await diagnoseSymptomsLocally(symptoms, context);

            expect(result.recommendedTreatments).toHaveLength(3);
          }
        ),
        { numRuns: 50 }
      );
    },
    60000
  );

  // 10b: Treatments ranked by effectiveness descending
  it(
    'treatments are always ranked by effectiveness in descending order',
    async () => {
      await fc.assert(
        fc.asyncProperty(symptomsArb, contextArb, async (symptoms, context) => {
          queryOllama.mockResolvedValueOnce(buildMockResponse(3));

          const result = await diagnoseSymptomsLocally(symptoms, context);
          const treatments = result.recommendedTreatments;

          expect(treatments).toHaveLength(3);
          // Each treatment's effectiveness must be >= the next one's
          for (let i = 0; i < treatments.length - 1; i++) {
            expect(treatments[i].effectiveness ?? 0).toBeGreaterThanOrEqual(
              treatments[i + 1].effectiveness ?? 0
            );
          }
        }),
        { numRuns: 50 }
      );
    },
    60000
  );

  // 10c: rank fields are 1, 2, 3
  it(
    'treatment rank fields are always 1, 2, 3',
    async () => {
      await fc.assert(
        fc.asyncProperty(symptomsArb, contextArb, async (symptoms, context) => {
          queryOllama.mockResolvedValueOnce(buildMockResponse(3));

          const result = await diagnoseSymptomsLocally(symptoms, context);
          const ranks = result.recommendedTreatments.map((t) => t.rank);

          expect(ranks).toEqual([1, 2, 3]);
        }),
        { numRuns: 30 }
      );
    },
    60000
  );

  // 10d: shouldSeeDoctor=true when any condition probability > 70%
  it(
    'shouldSeeDoctor is true when any condition probability > 70%',
    async () => {
      await fc.assert(
        fc.asyncProperty(symptomsArb, contextArb, async (symptoms, context) => {
          // probability = 80 > 70 → shouldSeeDoctor must be true
          queryOllama.mockResolvedValueOnce(buildMockResponse(3, 'low', 80));

          const result = await diagnoseSymptomsLocally(symptoms, context);

          expect(result.shouldSeeDoctor).toBe(true);
        }),
        { numRuns: 30 }
      );
    },
    60000
  );

  // 10e: shouldSeeDoctor=true when urgency is high or emergency
  it(
    'shouldSeeDoctor is true when urgencyLevel is high or emergency',
    async () => {
      for (const urgency of ['high', 'emergency']) {
        await fc.assert(
          fc.asyncProperty(symptomsArb, contextArb, async (symptoms, context) => {
            queryOllama.mockResolvedValueOnce(buildMockResponse(3, urgency, 30));

            const result = await diagnoseSymptomsLocally(symptoms, context);

            expect(result.shouldSeeDoctor).toBe(true);
          }),
          { numRuns: 20 }
        );
      }
    },
    60000
  );

  // 10f: disclaimer is always present
  it(
    'disclaimer is always a non-empty string',
    async () => {
      await fc.assert(
        fc.asyncProperty(symptomsArb, contextArb, async (symptoms, context) => {
          queryOllama.mockResolvedValueOnce(buildMockResponse(3));

          const result = await diagnoseSymptomsLocally(symptoms, context);

          expect(typeof result.disclaimer).toBe('string');
          expect(result.disclaimer.length).toBeGreaterThan(0);
        }),
        { numRuns: 30 }
      );
    },
    60000
  );

  // 10g: throws when fewer than 3 symptoms provided
  it(
    'throws when fewer than 3 symptoms are provided',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(symptomArb, { minLength: 0, maxLength: 2 }),
          contextArb,
          async (symptoms, context) => {
            let threw = false;
            try {
              await diagnoseSymptomsLocally(symptoms, context);
            } catch {
              threw = true;
            }
            expect(threw).toBe(true);
          }
        ),
        { numRuns: 30 }
      );
    },
    30000
  );

  // 10h: graceful degradation when Ollama is unavailable
  it(
    'returns exactly 3 treatments even when Ollama is unavailable',
    async () => {
      const unavailableError = new Error('Ollama unavailable');
      unavailableError.code = 'OLLAMA_UNAVAILABLE';

      await fc.assert(
        fc.asyncProperty(symptomsArb, contextArb, async (symptoms, context) => {
          queryOllama.mockRejectedValueOnce(unavailableError);

          const result = await diagnoseSymptomsLocally(symptoms, context);

          expect(result.recommendedTreatments).toHaveLength(3);
          expect(result.shouldSeeDoctor).toBe(true);
          expect(typeof result.disclaimer).toBe('string');
        }),
        { numRuns: 20 }
      );
    },
    30000
  );
});
