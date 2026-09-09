/**
 * Drug Interaction Service
 * Checks interactions between medications using a local database and Ollama AI.
 * All processing is local — no external API calls are made.
 */

const { loadDrugInteractionDatabase, query, getDrugAlternatives } = require('../Utils/drugDatabase');
const { queryOllama } = require('../Utils/ollamaClient');

// ─── Severity ordering ────────────────────────────────────────────────────────

const SEVERITY_LEVELS = { none: 0, mild: 1, moderate: 2, severe: 3, critical: 4 };

/**
 * Return the numeric rank of a severity string.
 * @param {string} severity
 * @returns {number}
 */
function severityLevel(severity) {
  return SEVERITY_LEVELS[severity] ?? 0;
}

/**
 * Return the higher of two severity strings (monotonically increasing).
 * @param {string} current
 * @param {string} candidate
 * @returns {string}
 */
function maxSeverityOf(current, candidate) {
  return severityLevel(candidate) > severityLevel(current) ? candidate : current;
}

// ─── Prompt helpers ───────────────────────────────────────────────────────────

/**
 * Build an Ollama prompt for a specific drug pair interaction.
 * @param {string} drug1
 * @param {string} drug2
 * @param {object} interactionData  Raw record from the local database.
 * @returns {string}
 */
function buildInteractionPrompt(drug1, drug2, interactionData) {
  return (
    `You are a clinical pharmacist. Analyze the interaction between ${drug1} and ${drug2}.\n` +
    `Known data: severity=${interactionData.severity}, ` +
    `description="${interactionData.description}", ` +
    `mechanism="${interactionData.mechanism || 'unknown'}".\n` +
    `Provide a concise clinical recommendation in 1-2 sentences.`
  );
}

/**
 * Parse the raw Ollama text into a DrugInteraction object.
 * Falls back to database data when the AI response is unusable.
 *
 * @param {string|null} aiText
 * @param {string} drug1
 * @param {string} drug2
 * @param {object} dbRecord
 * @returns {object} DrugInteraction
 */
function parseInteractionAnalysis(aiText, drug1, drug2, dbRecord) {
  const recommendation =
    typeof aiText === 'string' && aiText.trim().length > 0
      ? aiText.trim()
      : dbRecord.recommendation;

  return {
    drug1,
    drug2,
    severity: dbRecord.severity,
    description: dbRecord.description,
    effects: Array.isArray(dbRecord.effects) ? dbRecord.effects : [],
    mechanism: dbRecord.mechanism || '',
    recommendation,
  };
}

// ─── Recommendations ──────────────────────────────────────────────────────────

/**
 * Generate human-readable recommendations based on detected interactions.
 * @param {object[]} interactions
 * @param {string} maxSeverity
 * @returns {string[]}
 */
function generateRecommendations(interactions, maxSeverity) {
  if (interactions.length === 0) return [];

  const recs = interactions.map(
    (i) => `${i.drug1} + ${i.drug2} (${i.severity}): ${i.recommendation}`
  );

  if (maxSeverity === 'critical') {
    recs.unshift('⚠️ CRITICAL: One or more combinations are life-threatening. Do NOT take together without immediate medical supervision.');
  } else if (maxSeverity === 'severe') {
    recs.unshift('⚠️ SEVERE: Dangerous interaction detected. Consult your doctor before taking these medications together.');
  } else if (maxSeverity === 'moderate') {
    recs.unshift('⚠️ MODERATE: Significant interaction detected. Monitor closely and consult your healthcare provider.');
  } else if (maxSeverity === 'mild') {
    recs.unshift('ℹ️ MILD: Minor interaction detected. Use with caution and inform your doctor.');
  }

  return recs;
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Check drug interactions for a list of medications.
 *
 * Algorithm 3 from design:
 * 1. Assert medications.length >= 2
 * 2. Initialize interactions=[], maxSeverity='none'
 * 3. Load drug interaction database
 * 4. For every pair (i, j) where i < j:
 *    a. Query local database for drug pair
 *    b. If interaction found, call Ollama for detailed analysis
 *    c. Add to interactions array
 *    d. Update maxSeverity (monotonically increasing — never decreases)
 * 5. Set safeToTake = false if maxSeverity is 'severe' or 'critical'
 * 6. Fetch alternatives for unsafe combinations
 * 7. Return InteractionResult
 *
 * Graceful degradation: if Ollama is unavailable, database data is used directly.
 *
 * @param {Array<{name: string}>} medications  At least 2 medication objects.
 * @returns {Promise<{
 *   hasInteractions: boolean,
 *   severity: string,
 *   interactions: object[],
 *   safeToTake: boolean,
 *   recommendations: string[],
 *   alternatives: object[]
 * }>}
 */
async function checkDrugInteractionsLocally(medications) {
  // Early return for fewer than 2 medications
  if (!Array.isArray(medications) || medications.length < 2) {
    return {
      hasInteractions: false,
      severity: 'none',
      interactions: [],
      safeToTake: true,
      recommendations: [],
      alternatives: [],
    };
  }

  // Step 1 — initialise
  const interactions = [];
  let maxSeverity = 'none';

  // Step 2 — load database (no-op if already loaded)
  loadDrugInteractionDatabase();

  // Step 3 — check all pairs
  for (let i = 0; i < medications.length - 1; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const drug1 = medications[i].name;
      const drug2 = medications[j].name;

      if (!drug1 || !drug2) continue;

      // Query local interaction matrix
      const interactionData = query(drug1, drug2);

      if (interactionData !== null) {
        // Try Ollama for detailed analysis; degrade gracefully on failure
        let aiText = null;
        try {
          const prompt = buildInteractionPrompt(drug1, drug2, interactionData);
          aiText = await queryOllama(prompt, 'medical-llm');
        } catch {
          // Ollama unavailable — use database data directly (graceful degradation)
        }

        const detailedInteraction = parseInteractionAnalysis(aiText, drug1, drug2, interactionData);
        interactions.push(detailedInteraction);

        // Update maxSeverity monotonically (never decreases)
        maxSeverity = maxSeverityOf(maxSeverity, detailedInteraction.severity);
      }
    }
  }

  // Step 4 — determine safety
  const safeToTake = maxSeverity !== 'severe' && maxSeverity !== 'critical';

  // Step 5 — fetch alternatives for unsafe combinations
  const alternatives = [];
  if (!safeToTake) {
    for (const interaction of interactions) {
      if (interaction.severity === 'severe' || interaction.severity === 'critical') {
        const alts1 = getDrugAlternatives(interaction.drug1);
        const alts2 = getDrugAlternatives(interaction.drug2);
        alternatives.push(...alts1, ...alts2);
      }
    }
  }

  // Step 6 — generate recommendations
  const recommendations = generateRecommendations(interactions, maxSeverity);

  return {
    hasInteractions: interactions.length > 0,
    severity: maxSeverity,
    interactions,
    safeToTake,
    recommendations,
    alternatives,
  };
}

module.exports = { checkDrugInteractionsLocally };
