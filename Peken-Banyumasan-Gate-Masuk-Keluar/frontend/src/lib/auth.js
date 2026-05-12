/**
 * src/lib/auth.js
 */

import { supabase } from './supabase.js';
import {
  STORAGE_EVENTS,
  PER_USER_STORAGE_KEYS,
  PER_USER_STORAGE_PREFIXES,
} from './storageKeys.js';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

// ── Supabase session sync ──────────────────────────────────────────────────

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
          window.dispatchEvent(
            new CustomEvent(STORAGE_EVENTS.USER_UPDATE, {
              detail: user,
            })
          );
        } catch {}
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);

        _clearPerUserStorage();

        try {
          window.dispatchEvent(
            new CustomEvent(STORAGE_EVENTS.USER_UPDATE, {
              detail: null,
            })
          );
        } catch {}
      }
    } catch {}
  });
}

// ── Private cleanup helper ──────────────────────────────────────────────────

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
  } catch {}
}

// ── Token ───────────────────────────────────────────────────────────────────

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (!token) {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }

    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

// ── User ────────────────────────────────────────────────────────────────────

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUser(user) {
  try {
    if (!user) {
      localStorage.removeItem(USER_KEY);
    } else {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    try {
      window.dispatchEvent(
        new CustomEvent(STORAGE_EVENTS.USER_UPDATE, {
          detail: user ?? null,
        })
      );
    } catch {}
  } catch {}
}

// ── Clear auth ──────────────────────────────────────────────────────────────

export function clearAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    _clearPerUserStorage();

    try {
      window.dispatchEvent(
        new CustomEvent(STORAGE_EVENTS.USER_UPDATE, {
          detail: null,
        })
      );
    } catch {}

    if (supabase) {
      supabase.auth.signOut();
    }
  } catch {}
}

// ── Query helpers ───────────────────────────────────────────────────────────

export function isAuthenticated() {
  return Boolean(getToken());
}

export function getUserRole() {
  return getUser()?.role ?? null;
}

export function hasRole(role) {
  return getUserRole() === role;
}