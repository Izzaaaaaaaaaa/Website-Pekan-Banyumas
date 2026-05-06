/**
 * src/lib/domainStorage.js
 * ────────────────────────
 * Tiny helpers for reading/writing the Kolaborator domain localStorage keys
 * (register status, etc.).
 *
 * Kolaborator has no legacy key generations — there is only the canonical
 * `peken_kolaborator_*` schema. The helpers below accept the canonical key
 * and, optionally, zero legacy keys (variadic for API parity with artisan's
 * domainStorage so call-sites are interchangeable).
 */

/**
 * Read a localStorage key, optionally falling back through legacy keys.
 * On first successful fallback, migrates the value into the canonical key
 * and removes all legacy entries.
 *
 * @param {string} canonicalKey
 * @param  {...string} legacyKeys  zero or more legacy keys (none for kolaborator)
 * @returns {string|null}
 */
export function readRaw(canonicalKey, ...legacyKeys) {
  try {
    const raw = localStorage.getItem(canonicalKey);
    if (raw !== null) {
      _scrubLegacy(legacyKeys);
      return raw;
    }
    for (const legacyKey of legacyKeys) {
      if (!legacyKey) continue;
      const legacy = localStorage.getItem(legacyKey);
      if (legacy !== null) {
        try { localStorage.setItem(canonicalKey, legacy); } catch {}
        _scrubLegacy(legacyKeys);
        return legacy;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function _scrubLegacy(legacyKeys) {
  for (const legacyKey of legacyKeys) {
    if (!legacyKey) continue;
    try { localStorage.removeItem(legacyKey); } catch {}
  }
}

/**
 * Parsed JSON variant of readRaw. Returns `null` on missing key or parse failure.
 *
 * @param {string} canonicalKey
 * @param  {...string} legacyKeys
 * @returns {unknown|null}
 */
export function readJSON(canonicalKey, ...legacyKeys) {
  const raw = readRaw(canonicalKey, ...legacyKeys);
  if (raw === null) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/**
 * Write a raw string under the canonical key.
 *
 * @param {string} canonicalKey
 * @param {string} value
 */
export function writeRaw(canonicalKey, value) {
  try { localStorage.setItem(canonicalKey, value); } catch {}
}

/**
 * Write a value as JSON under the canonical key.
 *
 * @param {string} canonicalKey
 * @param {unknown} value
 */
export function writeJSON(canonicalKey, value) {
  try { localStorage.setItem(canonicalKey, JSON.stringify(value)); } catch {}
}

/**
 * Remove a canonical key (and, optionally, any number of legacy variants).
 *
 * @param {string} canonicalKey
 * @param  {...string} legacyKeys
 */
export function removeKey(canonicalKey, ...legacyKeys) {
  try { localStorage.removeItem(canonicalKey); } catch {}
  _scrubLegacy(legacyKeys);
}
