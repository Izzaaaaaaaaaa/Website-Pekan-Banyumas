/**
 * src/lib/auth.js — Kolaborator Portal
 * ──────────────────────────────────────
 * Authoritative API for reading and mutating auth state. Every reference
 * to `localStorage.getItem('token' | 'user')` in the Kolaborator codebase
 * must eventually go through this file — consumers never touch the
 * storage layer directly.
 *
 * Shape:
 *   • `token`  — Supabase access_token (JWT) stored under TOKEN_KEY ('token')
 *                so route guards and api.js interceptor read it synchronously.
 *                (for Kolaborator app: role is always 'kolaborator')
 *   • `user`   — { id, email, nama, role, status } derived from Supabase
 *                session, stored under USER_KEY ('user').
 *
 * Supabase integration (real mode — env vars set):
 *   - onAuthStateChange mirrors the access_token into TOKEN_KEY on
 *     every SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT, and INITIAL_SESSION event.
 *     Auto-refreshed tokens are automatically available to api.js interceptor.
 *   - clearAuth() calls supabase.auth.signOut() as fire-and-forget so the
 *     refresh token is revoked on Supabase's side.
 *
 * Legacy / DUMMY mode (supabase null or VITE_DUMMY_MODE=true):
 *   - No listener is registered. setToken() / setUser() write directly to
 *     localStorage exactly as before Supabase integration. No behavioral change.
 *
 * Side effects on writes:
 *   setUser()   dispatches `STORAGE_EVENTS.USER_UPDATE` so listeners
 *               react without prop drilling.
 *   clearAuth() removes token + user + every per-user storage key declared
 *               in storageKeys.js, then dispatches USER_UPDATE with null.
 *
 * All localStorage interactions are guarded with try/catch to survive
 * Safari private mode and quota-exceeded errors without crashing render.
 */

import { supabase } from './supabase.js';
import {
  STORAGE_EVENTS,
  PER_USER_STORAGE_KEYS,
  PER_USER_STORAGE_PREFIXES,
} from './storageKeys.js';

// Private auth storage keys — not exported from storageKeys.js so external
// code must go through this module's functions rather than touching auth
// state in localStorage directly.
const TOKEN_KEY = 'token';
const USER_KEY  = 'user';

// ── Supabase session sync ──────────────────────────────────────────────────
// When autoRefreshToken fires (TOKEN_REFRESHED), mirrors the new access_token
// into TOKEN_KEY so api.js interceptor picks it up on the next
// request without any async overhead.
// Guard: skip when supabase is null (env vars absent) or in DUMMY mode to
// prevent the INITIAL_SESSION(null) event from clearing a dummy session.
if (supabase && import.meta.env.VITE_DUMMY_MODE !== 'true') {
  supabase.auth.onAuthStateChange((event, session) => {
    try {
      if (session) {
        localStorage.setItem(TOKEN_KEY, session.access_token);
        const user = {
          id: session.user.id,
          email: session.user.email,
          nama: session.user.user_metadata?.nama ?? session.user.email,
          role: session.user.app_metadata?.role ?? null,
          status: session.user.app_metadata?.status ?? 'aktif',
        };
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        try {
          window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.USER_UPDATE, { detail: user }));
        } catch { /* SSR / non-browser */ }
      } else {
        // SIGNED_OUT or TOKEN_REFRESH failure — wipe auth state.
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        _clearPerUserStorage();
        try {
          window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.USER_UPDATE, { detail: null }));
        } catch { /* SSR / non-browser */ }
      }
    } catch { /* private mode / quota */ }
  });
}

// ── Private cleanup helper ──────────────────────────────────────────────────
// Removes all per-user storage keys declared in storageKeys.js.
// Shared by onAuthStateChange and clearAuth() to avoid duplication.
function _clearPerUserStorage() {
  try {
    for (const key of PER_USER_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
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
  } catch { /* private mode / quota */ }
}

// ── Token ───────────────────────────────────────────────────────────────────

/** @returns {string|null} */
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** @param {string|null|undefined} token */
export function setToken(token) {
  try {
    if (token == null || token === '') {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      localStorage.setItem(TOKEN_KEY, String(token));
    }
  } catch {
    /* private mode / quota — fail silently so UI doesn't crash on login */
  }
}

// ── User ────────────────────────────────────────────────────────────────────

/** @returns {object|null} the parsed user object, or null if absent/corrupt */
export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
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
      localStorage.removeItem(USER_KEY);
    } else {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
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
 * Clear all auth state synchronously (route guards react immediately), then
 * sign out from Supabase in the background to revoke the refresh token.
 */
export function clearAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    _clearPerUserStorage();
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.USER_UPDATE, { detail: null }));
  } catch {
    /* SSR / non-browser contexts */
  }
  // Fire-and-forget: revoke refresh token on Supabase side.
  if (supabase && import.meta.env.VITE_DUMMY_MODE !== 'true') {
    supabase.auth.signOut().catch(() => {});
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
