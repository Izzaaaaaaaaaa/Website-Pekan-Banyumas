/**
 * src/lib/storageKeys.js
 * ──────────────────────
 * Single source of truth for every browser-storage key and CustomEvent
 * name used by the Gate app. Do not use string literals for localStorage
 * keys anywhere else in the codebase — always import from here.
 *
 * Naming conventions:
 *   • Auth keys ('token', 'user') are private to lib/auth.js (TOKEN_KEY /
 *     USER_KEY). They are NOT listed here so external code cannot bypass
 *     the auth module and read/write auth state directly.
 *   • All other keys use the `peken_` prefix so that multiple Peken apps
 *     sharing an origin (dev, preview deployments) cannot collide.
 *   • Legacy `pekan_` keys (spelling bug from pre-standardization builds)
 *     are listed under LEGACY_* for the one-time read-migration handled
 *     by lib/eventZones.js in Phase 2.
 */

// ── Canonical keys (use these for all new writes) ──────────────────────────
// Auth storage keys (TOKEN_KEY / USER_KEY = 'token' / 'user') are private to
// lib/auth.js — they are no longer part of this public API so that external
// code cannot bypass auth.js and touch auth state directly.
export const STORAGE_KEYS = Object.freeze({
  // Dashboard / scanner state — which event the petugas is currently scanning for.
  ACTIVE_EVENT: 'peken_active_event',

  // Admin-only badge counter — number of artisan applications awaiting approval.
  // Written by pages/Artisan.jsx, read by layouts/AdminLayout.jsx.
  PENDING_ARTISAN: 'peken_pending_artisan',

  // Zone & stand configuration (venue-level, shared across users on a device).
  ZONES_GLOBAL:           'peken_zones_global',
  ZONES_DEFAULT_OVERRIDE: 'peken_zones_default_override',
});

/**
 * Prefix-based key builders for keys whose suffix is dynamic.
 * Always call these helpers — never concatenate prefixes manually.
 */
export const STORAGE_PREFIXES = Object.freeze({
  OCCUPIED: 'peken_occupied_', // suffix: eventId       → peken_occupied_e1
  NOTIF:    'peken_notif_',    // suffix: role          → peken_notif_admin
});

export const occupiedKey = (eventId) => `${STORAGE_PREFIXES.OCCUPIED}${eventId}`;
export const notifKey    = (role)    => `${STORAGE_PREFIXES.NOTIF}${role}`;

// ── Legacy keys (READ-ONLY fallback; do NOT write to these) ────────────────
// Phase 2's eventZones.js migration reads from these once, copies into the
// canonical keys above, then deletes the legacy entries.
export const LEGACY_STORAGE_KEYS = Object.freeze({
  ZONES_GLOBAL:           'pekan_zones_global',
  ZONES_DEFAULT_OVERRIDE: 'pekan_zones_default_override',
});

export const LEGACY_STORAGE_PREFIXES = Object.freeze({
  OCCUPIED: 'pekan_occupied_',
});

export const legacyOccupiedKey = (eventId) => `${LEGACY_STORAGE_PREFIXES.OCCUPIED}${eventId}`;

// ── Window CustomEvent names ───────────────────────────────────────────────
// Cross-component pub/sub where state lives in localStorage: a writer
// mutates the storage key, then dispatches the matching event so sibling
// components can re-read without prop drilling.
export const STORAGE_EVENTS = Object.freeze({
  ZONES_UPDATE:           'peken_zones_update', // canonical spelling
  NOTIF_UPDATE:           'peken_notif_update',
  EVENT_UPDATE:           'peken_event_update',
  USER_UPDATE:            'peken_user_update',
  PENDING_ARTISAN_UPDATE: 'peken_pending_artisan_update',
});

export const LEGACY_STORAGE_EVENTS = Object.freeze({
  ZONES_UPDATE: 'pekan_zones_update', // old spelling — eventZones.js still dispatches this for backward compat during the migration window
});

// ── Per-user cleanup list (consumed by lib/auth.js#clearAuth) ──────────────
/**
 * Concrete keys that must be removed on logout, in addition to TOKEN
 * and USER. Venue-level config (zones, occupied state) is INTENTIONALLY
 * excluded — that data belongs to the device/event, not the user.
 */
export const PER_USER_STORAGE_KEYS = Object.freeze([
  STORAGE_KEYS.ACTIVE_EVENT,
  STORAGE_KEYS.PENDING_ARTISAN,
]);

/**
 * Prefix patterns for keys to remove on logout. clearAuth() iterates
 * localStorage and removes any entry whose key starts with one of these.
 * Used for the per-role notification queue (peken_notif_admin, etc.).
 */
export const PER_USER_STORAGE_PREFIXES = Object.freeze([
  STORAGE_PREFIXES.NOTIF,
]);
