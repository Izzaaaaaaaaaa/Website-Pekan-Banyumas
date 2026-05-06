/**
 * src/lib/storageKeys.js
 * ──────────────────────
 * Single source of truth for every browser-storage key and CustomEvent
 * name used by the Kolaborator app. Do not use string literals for
 * localStorage keys anywhere else in the codebase — always import from here.
 *
 * Naming conventions:
 *   • Auth keys ('token', 'user') are private to lib/auth.js (TOKEN_KEY /
 *     USER_KEY). They are NOT listed here so external code cannot bypass
 *     the auth module and read/write auth state directly.
 *   • All other keys use the `peken_` prefix so that multiple Peken apps
 *     sharing an origin (dev, preview deployments) cannot collide.
 *
 * Kolaborator-specific scope:
 *   Kolaborator stores only auth state + a per-role notification queue.
 *   It does NOT persist zones, active-event, or pending-artisan data —
 *   those are Gate-only concerns.
 */

// ── Canonical keys (use these for all new writes) ──────────────────────────
// Auth storage keys (TOKEN_KEY / USER_KEY = 'token' / 'user') are private to
// lib/auth.js — they are no longer part of this public API so that external
// code cannot bypass auth.js and touch auth state directly.
export const STORAGE_KEYS = Object.freeze({
  // Register-flow state — tracks signup approval status.
  REGISTER_STATUS: 'peken_kolaborator_register_status',
});

/**
 * Prefix-based key builders for keys whose suffix is dynamic.
 * Always call these helpers — never concatenate prefixes manually.
 */
export const STORAGE_PREFIXES = Object.freeze({
  NOTIF: 'peken_notif_', // suffix: role → peken_notif_kolaborator
});

export const notifKey = (role) => `${STORAGE_PREFIXES.NOTIF}${role}`;

// ── Window CustomEvent names ───────────────────────────────────────────────
// Cross-component pub/sub where state lives in localStorage: a writer
// mutates the storage key, then dispatches the matching event so sibling
// components can re-read without prop drilling.
export const STORAGE_EVENTS = Object.freeze({
  NOTIF_UPDATE: 'peken_notif_update',
  USER_UPDATE:  'peken_user_update',
});

// ── Per-user cleanup list (consumed by lib/auth.js#clearAuth) ──────────────
/**
 * Concrete keys that must be removed on logout, in addition to TOKEN
 * and USER.
 */
export const PER_USER_STORAGE_KEYS = Object.freeze([
  STORAGE_KEYS.REGISTER_STATUS,
]);

/**
 * Prefix patterns for keys to remove on logout. clearAuth() iterates
 * localStorage and removes any entry whose key starts with one of these.
 */
export const PER_USER_STORAGE_PREFIXES = Object.freeze([
  STORAGE_PREFIXES.NOTIF,
]);
