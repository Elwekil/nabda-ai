/**
 * Property-Based Tests: Drug Interaction Service
 *
 * Property 4: Drug Interaction Severity Invariant
 *   4a: When checkDrugInteractionsLocally returns severity 'severe' or 'critical',
 *       safeToTake is always false
 *   4b: When safeToTake is false, alternatives array is always non-empty
 *   4c: maxSeverity is monotonically increasing — the returned severity is always
 *       >= the severity of any individual interaction
 *   4d: With fewer than 2 medications, always returns { safeToTake: true, hasInteractions: false }
 *
 * **Validates: Requirements Feature 3 severity and safety**
 */

'use strict';

const fc = require('fast-check');

// ─── Mock setup ──────────────────────────────────────────────────────────────
// Mock ollamaClient only — use real drug database

jest.mock('../Utils/ollamaClient', () => ({
  queryOllama: jest.fn().mockResolvedValue('Clinical recommendation: monitor closely.'),
}));

// ─── Import service (after mocks are registered) ─────────────────────────────

const { checkDrugInteractionsLocally } = require('../Services/drugInteractionService');

// ─── Severity ordering (mirrors the service) ─────────────────────────────────

const SEVERITY_LEVELS = { none: 0, mild: 1, moderate: 2, severe: 3, critical: 4 };

function severityLevel(s) {
  return SEVERITY_LEVELS[s] ?? 0;
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/**
 * Array of medication objects drawn from the real drug database names.
 * minLength: 2 ensures we always have at least one pair to check.
 */
const medicationsArb = fc.array(
  fc.record({
    name: fc.constantFrom(
      'warfarin', 'aspirin', 'ssri', 'maoi', 'metformin',
      'ibuprofen', 'digoxin', 'amiodarone'
    ),
  }),
  { minLength: 2, maxLength: 5 }
);

/**
 * Array with 0 or 1 medication — should always be safe with no interactions.
 */
const tooFewMedicationsArb = fc.oneof(
  fc.constant([]),
  fc.array(
    fc.record({ name: fc.constantFrom('warfarin', 'aspirin', 'metformin') }),
    { minLength: 1, maxLength: 1 }
  )
);

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Property 4a — Severe/Critical severity always means safeToTake is false', () => {
  /**
   * **Validates: Requirements Feature 3 severity and safety**
   *
   * For any combination of medications:
   *   - If the returned severity is 'severe' or 'critical', safeToTake must be false
   */
  it(
    'safeToTake is false whenever severity is severe or critical',
    async () => {
      await fc.assert(
        fc.asyncProperty(medicationsArb, async (medications) => {
          const result = await checkDrugInteractionsLocally(medications);

          if (result.severity === 'severe' || result.severity === 'critical') {
            expect(result.safeToTake).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    },
    60000
  );

  it(
    'safeToTake is true when severity is none, mild, or moderate',
    async () => {
      await fc.assert(
        fc.asyncProperty(medicationsArb, async (medications) => {
          const result = await checkDrugInteractionsLocally(medications);

          if (
            result.severity === 'none' ||
            result.severity === 'mild' ||
            result.severity === 'moderate'
          ) {
            expect(result.safeToTake).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    },
    60000
  );
});

describe('Property 4b — When safeToTake is false, alternatives are always provided', () => {
  /**
   * **Validates: Requirements Feature 3 severity and safety**
   *
   * For any combination of medications:
   *   - If safeToTake is false, alternatives array must be non-empty
   */
  it(
    'alternatives array is non-empty whenever safeToTake is false',
    async () => {
      await fc.assert(
        fc.asyncProperty(medicationsArb, async (medications) => {
          const result = await checkDrugInteractionsLocally(medications);

          if (!result.safeToTake) {
            expect(Array.isArray(result.alternatives)).toBe(true);
            expect(result.alternatives.length).toBeGreaterThan(0);
          }
        }),
        { numRuns: 100 }
      );
    },
    60000
  );

  it(
    'alternatives array is always an array (even when safeToTake is true)',
    async () => {
      await fc.assert(
        fc.asyncProperty(medicationsArb, async (medications) => {
          const result = await checkDrugInteractionsLocally(medications);
          expect(Array.isArray(result.alternatives)).toBe(true);
        }),
        { numRuns: 50 }
      );
    },
    60000
  );
});

describe('Property 4c — maxSeverity is monotonically increasing', () => {
  /**
   * **Validates: Requirements Feature 3 severity and safety**
   *
   * The returned severity must be >= the severity of every individual interaction.
   * This confirms the monotonic invariant: severity never decreases as pairs are checked.
   */
  it(
    'returned severity is >= severity of every individual interaction',
    async () => {
      await fc.assert(
        fc.asyncProperty(medicationsArb, async (medications) => {
          const result = await checkDrugInteractionsLocally(medications);

          const maxLevel = severityLevel(result.severity);

          for (const interaction of result.interactions) {
            const interactionLevel = severityLevel(interaction.severity);
            expect(maxLevel).toBeGreaterThanOrEqual(interactionLevel);
          }
        }),
        { numRuns: 100 }
      );
    },
    60000
  );

  it(
    'severity is always one of the valid severity levels',
    async () => {
      await fc.assert(
        fc.asyncProperty(medicationsArb, async (medications) => {
          const result = await checkDrugInteractionsLocally(medications);
          const validLevels = ['none', 'mild', 'moderate', 'severe', 'critical'];
          expect(validLevels).toContain(result.severity);
        }),
        { numRuns: 50 }
      );
    },
    60000
  );

  it(
    'hasInteractions is true if and only if interactions array is non-empty',
    async () => {
      await fc.assert(
        fc.asyncProperty(medicationsArb, async (medications) => {
          const result = await checkDrugInteractionsLocally(medications);
          expect(result.hasInteractions).toBe(result.interactions.length > 0);
        }),
        { numRuns: 50 }
      );
    },
    60000
  );
});

describe('Property 4d — Fewer than 2 medications always returns safe with no interactions', () => {
  /**
   * **Validates: Requirements Feature 3 severity and safety**
   *
   * With 0 or 1 medications, the service must return:
   *   { safeToTake: true, hasInteractions: false }
   */
  it(
    'returns safeToTake=true and hasInteractions=false for fewer than 2 medications',
    async () => {
      await fc.assert(
        fc.asyncProperty(tooFewMedicationsArb, async (medications) => {
          const result = await checkDrugInteractionsLocally(medications);

          expect(result.safeToTake).toBe(true);
          expect(result.hasInteractions).toBe(false);
          expect(result.interactions).toEqual([]);
          expect(result.alternatives).toEqual([]);
        }),
        { numRuns: 50 }
      );
    },
    60000
  );

  it(
    'returns severity=none for fewer than 2 medications',
    async () => {
      await fc.assert(
        fc.asyncProperty(tooFewMedicationsArb, async (medications) => {
          const result = await checkDrugInteractionsLocally(medications);
          expect(result.severity).toBe('none');
        }),
        { numRuns: 50 }
      );
    },
    60000
  );
});

describe('Property 4 — Graceful degradation when Ollama is unavailable', () => {
  /**
   * **Validates: Requirements Feature 3 severity and safety**
   *
   * When Ollama throws OLLAMA_UNAVAILABLE, the service must still return
   * a valid result using the local database data (graceful degradation).
   * All severity invariants must still hold.
   */
  beforeEach(() => {
    const { queryOllama } = require('../Utils/ollamaClient');
    const unavailableError = new Error('Ollama is unavailable');
    unavailableError.code = 'OLLAMA_UNAVAILABLE';
    queryOllama.mockRejectedValue(unavailableError);
  });

  afterEach(() => {
    const { queryOllama } = require('../Utils/ollamaClient');
    queryOllama.mockResolvedValue('Clinical recommendation: monitor closely.');
  });

  it(
    'still returns valid result with correct severity invariants when Ollama is unavailable',
    async () => {
      await fc.assert(
        fc.asyncProperty(medicationsArb, async (medications) => {
          const result = await checkDrugInteractionsLocally(medications);

          // Must still return a valid result
          expect(result).toBeDefined();
          expect(typeof result.safeToTake).toBe('boolean');
          expect(typeof result.hasInteractions).toBe('boolean');
          expect(Array.isArray(result.interactions)).toBe(true);
          expect(Array.isArray(result.alternatives)).toBe(true);

          // Severity invariant must still hold
          if (result.severity === 'severe' || result.severity === 'critical') {
            expect(result.safeToTake).toBe(false);
          }

          // Alternatives invariant must still hold
          if (!result.safeToTake) {
            expect(result.alternatives.length).toBeGreaterThan(0);
          }
        }),
        { numRuns: 30 }
      );
    },
    60000
  );
});
