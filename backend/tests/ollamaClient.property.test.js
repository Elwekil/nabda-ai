/**
 * Property-Based Tests: Ollama Client Graceful Error Handling
 *
 * Property 9: AI Model Availability — graceful error when Ollama unavailable
 * Validates: Requirements Feature 1, 3, 4
 *
 * Tests that:
 * 1. queryOllama() throws an error with code 'OLLAMA_UNAVAILABLE' (never crashes)
 *    when Ollama is unreachable (ECONNREFUSED), for any prompt/model combination.
 * 2. checkOllamaHealth() always returns { healthy: false } (never throws)
 *    when Ollama is unreachable, for any input.
 */

'use strict';

const fc = require('fast-check');

// ─── Mock global fetch before requiring the module ───────────────────────────

/**
 * Build a fetch mock that always rejects with an ECONNREFUSED-style error.
 */
function makeEconnrefusedFetch() {
  return jest.fn().mockImplementation(() => {
    const err = new Error('connect ECONNREFUSED 127.0.0.1:11434');
    err.code = 'ECONNREFUSED';
    return Promise.reject(err);
  });
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Non-empty printable ASCII strings (covers typical prompts) */
const promptArb = fc.string({ minLength: 1, maxLength: 500 });

/** Model name strings: alphanumeric + colon + hyphen (e.g. "llama2:7b") */
const modelArb = fc
  .stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9:._-]{0,49}$/)
  .filter((s) => s.length >= 1);

/** Chat message arrays (role + content) */
const chatMessagesArb = fc.array(
  fc.record({
    role: fc.constantFrom('user', 'assistant', 'system'),
    content: fc.string({ minLength: 1, maxLength: 200 }),
  }),
  { minLength: 1, maxLength: 5 }
);

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Property 9 — AI Model Availability (Ollama unavailable)', () => {
  let originalFetch;

  beforeEach(() => {
    // Save and replace global fetch
    originalFetch = global.fetch;
    global.fetch = makeEconnrefusedFetch();

    // Clear module cache so ollamaClient picks up the mocked fetch
    jest.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  // ── Property 1: queryOllama with string prompt ──────────────────────────

  it(
    'queryOllama(prompt, model) always throws OLLAMA_UNAVAILABLE for any string prompt/model',
    async () => {
      /**
       * **Validates: Requirements Feature 1, 3, 4**
       *
       * For every (prompt, model) pair, when fetch rejects with ECONNREFUSED,
       * queryOllama must:
       *   - throw (not crash the process)
       *   - the thrown error must have code === 'OLLAMA_UNAVAILABLE'
       */
      await fc.assert(
        fc.asyncProperty(promptArb, modelArb, async (prompt, model) => {
          // Re-require inside property so module cache is fresh per run
          const { queryOllama } = require('../Utils/ollamaClient');

          let threw = false;
          let errorCode = null;

          try {
            await queryOllama(prompt, model);
          } catch (err) {
            threw = true;
            errorCode = err.code;
          }

          expect(threw).toBe(true);
          expect(errorCode).toBe('OLLAMA_UNAVAILABLE');
        }),
        // Each run takes ~3.5s (3 retries × exponential backoff); keep numRuns small
        { numRuns: 10, verbose: false }
      );
    },
    // 10 runs × ~4s each = ~40s; give 90s headroom
    90000
  );

  // ── Property 2: queryOllama with chat messages array ───────────────────

  it(
    'queryOllama(messages, model) always throws OLLAMA_UNAVAILABLE for any chat messages/model',
    async () => {
      /**
       * **Validates: Requirements Feature 1, 3, 4**
       *
       * Same guarantee when prompt is an array of chat messages.
       */
      await fc.assert(
        fc.asyncProperty(chatMessagesArb, modelArb, async (messages, model) => {
          const { queryOllama } = require('../Utils/ollamaClient');

          let threw = false;
          let errorCode = null;

          try {
            await queryOllama(messages, model);
          } catch (err) {
            threw = true;
            errorCode = err.code;
          }

          expect(threw).toBe(true);
          expect(errorCode).toBe('OLLAMA_UNAVAILABLE');
        }),
        // Each run takes ~3.5s; keep numRuns small
        { numRuns: 10, verbose: false }
      );
    },
    90000
  );

  // ── Property 3: checkOllamaHealth never throws ─────────────────────────

  it(
    'checkOllamaHealth() always returns { healthy: false } and never throws for any input',
    async () => {
      /**
       * **Validates: Requirements Feature 1, 3, 4**
       *
       * checkOllamaHealth() takes no user input, but we run it many times
       * (with varied ECONNREFUSED mocks) to confirm it never throws and
       * always returns { healthy: false }.
       */
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          const { checkOllamaHealth } = require('../Utils/ollamaClient');

          let result;
          let threw = false;

          try {
            result = await checkOllamaHealth();
          } catch {
            threw = true;
          }

          expect(threw).toBe(false);
          expect(result).toBeDefined();
          expect(result.healthy).toBe(false);
        }),
        { numRuns: 20, verbose: false }
      );
    },
    30000
  );

  // ── Property 4: checkOllamaHealth result shape is always valid ─────────

  it(
    'checkOllamaHealth() result always has healthy=false and optional error string when unreachable',
    async () => {
      /**
       * **Validates: Requirements Feature 1, 3, 4**
       *
       * The returned object must conform to the expected shape:
       *   { healthy: false, error?: string }
       * It must never include { healthy: true } when Ollama is unreachable.
       */
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          const { checkOllamaHealth } = require('../Utils/ollamaClient');
          const result = await checkOllamaHealth();

          // healthy must be exactly false
          expect(result.healthy).toBe(false);

          // error field, if present, must be a string
          if ('error' in result) {
            expect(typeof result.error).toBe('string');
          }

          // models field must NOT be present when unhealthy
          expect(result.models).toBeUndefined();
        }),
        { numRuns: 20, verbose: false }
      );
    },
    30000
  );
});
