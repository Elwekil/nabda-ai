/**
 * Ollama Client Utility
 * Provides local AI inference via Ollama running at localhost:11434
 * All AI processing is local — no external API calls are made.
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

/**
 * Sleep helper for exponential backoff
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determine whether an error is a connection-refused / network error
 * that warrants a retry or graceful degradation.
 * @param {Error} err
 * @returns {boolean}
 */
function isConnectionError(err) {
  return (
    err.code === 'ECONNREFUSED' ||
    err.code === 'ENOTFOUND' ||
    err.code === 'ECONNRESET' ||
    err.message?.includes('ECONNREFUSED') ||
    err.message?.includes('fetch failed') ||
    err.message?.includes('Failed to fetch')
  );
}

/**
 * Send a prompt to a local Ollama model with retry + exponential backoff.
 *
 * @param {string|Array} prompt  Plain string prompt, or an array of
 *                               {role, content} chat messages.
 * @param {string} [model]       Ollama model name (default: llama2).
 * @returns {Promise<string>}    The model's text response.
 * @throws {Error}               When Ollama is unavailable after all retries,
 *                               throws an error with code 'OLLAMA_UNAVAILABLE'.
 */
async function queryOllama(prompt, model = 'llama2') {
  const isChat = Array.isArray(prompt);
  const endpoint = isChat
    ? `${OLLAMA_URL}/api/chat`
    : `${OLLAMA_URL}/api/generate`;

  const body = isChat
    ? { model, messages: prompt, stream: false }
    : { model, prompt, stream: false };

  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000), // 30 s per attempt
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Ollama HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();

      // /api/generate returns { response: "..." }
      // /api/chat    returns { message: { content: "..." } }
      const content = isChat
        ? data?.message?.content
        : data?.response;

      if (typeof content !== 'string') {
        throw new Error('Unexpected Ollama response shape');
      }

      return content;
    } catch (err) {
      lastError = err;

      if (isConnectionError(err)) {
        // Ollama is not running — no point retrying immediately
        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 500, 1000, 2000 …
          await sleep(delay);
        }
      } else {
        // Non-connection error (e.g. bad model name) — fail fast
        throw err;
      }
    }
  }

  // All retries exhausted
  const unavailableError = new Error(
    'Ollama is unavailable. Please ensure Ollama is running on ' + OLLAMA_URL
  );
  unavailableError.code = 'OLLAMA_UNAVAILABLE';
  unavailableError.cause = lastError;
  throw unavailableError;
}

/**
 * Check whether the local Ollama server is reachable.
 *
 * @returns {Promise<{healthy: boolean, models?: string[], error?: string}>}
 */
async function checkOllamaHealth() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { healthy: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    const models = (data?.models || []).map((m) => m.name);
    return { healthy: true, models };
  } catch (err) {
    if (isConnectionError(err)) {
      return {
        healthy: false,
        error: 'Ollama is not running (ECONNREFUSED). AI features will be degraded.',
      };
    }
    return { healthy: false, error: err.message };
  }
}

module.exports = { queryOllama, checkOllamaHealth };
