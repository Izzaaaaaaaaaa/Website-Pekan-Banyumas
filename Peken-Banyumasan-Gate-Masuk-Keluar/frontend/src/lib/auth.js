/**
 * src/lib/auth.js
 * ───────────────
 * Authoritative API for reading and mutating auth state. Every reference
 * to `localStorage.getItem('token' | 'user')` in the Gate codebase must
 * eventually go through this file — consumers never touch the storage
 * layer directly.
 *
 * Shape:
 *   • `token`  — opaque string issued by POST /api/auth/login
 *   • `user`   — JSON object of at least `{ id, nama, email, role }`
 *
 * Side effects on writes:
 *   setUser()   dispatches `STORAGE_EVENTS.USER_UPDATE` so listeners
 *               (e.g., the sidebar avatar) react without prop drilling.
 *   clearAuth() removes token + user + every per-user storage key
 *               declared in storageKeys.js, then dispatches USER_UPDATE
 *               with `detail: null` to signal logout.
 *
 * All localStorage interactions are guarded with try/catch to survive
 * Safari private mode and quota-exceeded errors without crashing render.
 */

import {
  STORAGE_KEYS,
  STORAGE_EVENTS,
  PER_USER_STORAGE_KEYS,
  PER_USER_STORAGE_PREFIXES,
} from './storageKeys.js';

// ── Token ───────────────────────────────────────────────────────────────────

/** @returns {string|null} */
export function getToken() {
  try {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch {
    return null;
  }
}

/** @param {string|null|undefined} token */
export function setToken(token) {
  try {
    if (token == null || token === '') {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    } else {
      localStorage.setItem(STORAGE_KEYS.TOKEN, String(token));
    }
  } catch {
    /* private mode / quota — fail silently so UI doesn't crash on login */
  }
}

// ── User ────────────────────────────────────────────────────────────────────

/** @returns {object|null} the parsed user object, or null if absent/corrupt */
export function getUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Write the user object and broadcast a USER_UPDATE event so sibling
 * components can re-render without prop drilling.
 *
 * @param {object|null|undefined} user
 */
export function setUser(user) {
  try {
    if (user == null) {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
  } catch {
    /* ignore — continue to dispatch regardless so live UI stays in sync */
  }
  try {
    window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.USER_UPDATE, { detail: user ?? null }));
  } catch {
    /* SSR / non-browser contexts */
  }
}

// ── Combined lifecycle ──────────────────────────────────────────────────────

/**
 * Clear all auth state and every per-user storage key declared in
 * storageKeys.js. Venue-level config (zones, occupied state) is
 * intentionally preserved — that data is device-scoped, not user-scoped.
 */
export function clearAuth() {
  try {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);

    // Concrete per-user keys.
    for (const key of PER_USER_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }

    // Prefix-based per-user keys (e.g., peken_notif_admin, peken_notif_kolaborator).
    // Collect matches first, then remove in a second pass — mutating
    // localStorage while iterating by index skips entries.
    if (PER_USER_STORAGE_PREFIXES.length > 0) {
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (PER_USER_STORAGE_PREFIXES.some((p) => key.startsWith(p))) {
          toRemove.push(key);
        }
      }
      for (const key of toRemove) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.USER_UPDATE, { detail: null }));
  } catch {
    /* SSR / non-browser contexts */
  }
}

// ── Query helpers (used by route guards, conditional UI) ───────────────────

/** @returns {boolean} */
export function isAuthenticated() {
  return Boolean(getToken());
}

/** @returns {string|null} */
export function getUserRole() {
  return getUser()?.role ?? null;
}

/**
 * @param {string} role
 * @returns {boolean}
 */
export function hasRole(role) {
  return getUserRole() === role;
}
