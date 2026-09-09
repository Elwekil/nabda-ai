/**
 * Drug Interaction Database — in-memory LRU cache singleton.
 *
 * Uses a Map for O(1) lookups. LRU eviction is implemented by deleting and
 * re-inserting the accessed key so the Map's insertion-order property keeps
 * the least-recently-used entry at the front.
 *
 * Max capacity: 10,000 entries.
 */

const { drugInteractions, drugAlternatives } = require('../Data/drugInteractions');

const MAX_CACHE_SIZE = 10_000;

/** @type {Map<string, object>} */
const cache = new Map();

/** @type {Map<string, object[]>} */
const alternativesIndex = new Map();

let loaded = false;

// ─── LRU helpers ─────────────────────────────────────────────────────────────

/**
 * Build a canonical, order-independent cache key for a drug pair.
 * @param {string} drug1
 * @param {string} drug2
 * @returns {string}
 */
function cacheKey(drug1, drug2) {
  const a = drug1.toLowerCase().trim();
  const b = drug2.toLowerCase().trim();
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Insert or refresh an entry in the LRU cache.
 * @param {string} key
 * @param {object} value
 */
function lruSet(key, value) {
  if (cache.has(key)) {
    cache.delete(key); // remove to re-insert at the "most recent" end
  } else if (cache.size >= MAX_CACHE_SIZE) {
    // Evict the least-recently-used entry (first key in insertion order)
    const lruKey = cache.keys().next().value;
    cache.delete(lruKey);
  }
  cache.set(key, value);
}

/**
 * Retrieve an entry from the LRU cache, promoting it to most-recently-used.
 * @param {string} key
 * @returns {object|undefined}
 */
function lruGet(key) {
  if (!cache.has(key)) return undefined;
  const value = cache.get(key);
  // Promote to most-recently-used
  cache.delete(key);
  cache.set(key, value);
  return value;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Load all drug interaction pairs and alternatives into the in-memory cache.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
function loadDrugInteractionDatabase() {
  if (loaded) return;

  for (const interaction of drugInteractions) {
    const key = cacheKey(interaction.drug1, interaction.drug2);
    lruSet(key, interaction);
  }

  // Build alternatives index keyed by original drug name (lower-cased)
  for (const alt of drugAlternatives) {
    const name = alt.originalDrug.toLowerCase().trim();
    if (!alternativesIndex.has(name)) {
      alternativesIndex.set(name, []);
    }
    alternativesIndex.get(name).push(alt);
  }

  loaded = true;
  console.log(
    `✅ Drug interaction database loaded: ${cache.size} interactions, ` +
    `${alternativesIndex.size} drugs with alternatives`
  );
}

/**
 * Query the database for an interaction between two drugs.
 * The lookup is bidirectional — order of arguments does not matter.
 *
 * @param {string} drug1
 * @param {string} drug2
 * @returns {object|null} Interaction record or null if none found.
 */
function query(drug1, drug2) {
  if (!drug1 || !drug2) return null;
  const key = cacheKey(drug1, drug2);
  return lruGet(key) ?? null;
}

/**
 * Retrieve alternative medications for a given drug.
 *
 * @param {string} drugName
 * @returns {object[]} Array of alternative medication records (may be empty).
 */
function getDrugAlternatives(drugName) {
  if (!drugName) return [];
  const name = drugName.toLowerCase().trim();
  return alternativesIndex.get(name) ?? [];
}

/**
 * Expose cache size for diagnostics / testing.
 * @returns {{ interactions: number, isLoaded: boolean }}
 */
function getDatabaseStats() {
  return { interactions: cache.size, isLoaded: loaded };
}

module.exports = { loadDrugInteractionDatabase, query, getDrugAlternatives, getDatabaseStats };
