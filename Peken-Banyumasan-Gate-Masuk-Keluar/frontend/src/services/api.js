/**
 * src/services/apiClient.js
 * ─────────────────────────
 * The single axios instance shared by every endpoint in services/endpoints.js.
 * This file contains ONLY the transport layer (baseURL, interceptors,
 * auth-header injection, 401 handling). Endpoint definitions live in
 * endpoints.js. Pages must never import this file directly — always go
 * through endpoints.js.
 *
 * Design rules:
 *   • baseURL is ORIGIN ONLY (no /api suffix). Every endpoint path in
 *     endpoints.js begins with `/api/…`. A defensive `normalizeBaseUrl`
 *     strips a trailing `/api` if the env variable still carries one,
 *     with a dev-mode warning, so legacy .env files don't silently
 *     produce /api/api/ double-prefix bugs.
 *   • On 401, this client does NOT perform navigation itself — it calls
 *     a caller-registered `onUnauthorized` handler. The router layer
 *     (App.jsx) wires that handler during bootstrap. This keeps the
 *     client router-agnostic (works with HashRouter, BrowserRouter, or
 *     no router at all).
 *   • Blob responses (responseType: 'blob') pass through intact, including
 *     when the body is an error blob — the interceptor reads the blob as
 *     text, parses JSON, and copies the `message` field onto `error.message`
 *     so consumers see the real backend error text.
 *   • FormData bodies (multipart uploads) are detected and the default
 *     JSON Content-Type header is removed so the browser can set the
 *     correct multipart boundary itself.
 */

import axios from 'axios';
import { getToken } from '../lib/auth.js';

// ── 401 handler injection ───────────────────────────────────────────────────

/**
 * Replaced at app bootstrap (App.jsx) with a router-aware redirect.
 * Default no-op so the module is importable in environments without
 * a router (tests, SSR, etc.) without throwing.
 *
 * @type {(error: unknown) => void}
 */
let onUnauthorized = () => {};

// Dedupe guard: the handler typically toasts then waits ~1.5s before clearing
// auth, so a burst of parallel 401s would each pass the token check and stack
// up toasts ("session expired" filling the screen). This flag ensures the
// handler runs once per expiry; it resets whenever a handler is (re)registered.
let unauthorizedInFlight = false;

/**
 * Register the function to run whenever the backend returns 401. The
 * handler is invoked ONCE per 401 response, guarded by a token check so
 * parallel 401s (e.g., fetchStats + fetchActivities firing together)
 * don't trigger duplicate redirects.
 *
 * Typical handler: toast an error, wait briefly so the UI paints it,
 * clear auth, navigate to /login.
 *
 * @param {(error: unknown) => void} handler
 */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = typeof handler === 'function' ? handler : () => {};
  unauthorizedInFlight = false;  // fresh registration ⇒ allow one handler run
}

// ── baseURL normalization ──────────────────────────────────────────────────

/**
 * Accept `https://host` or `https://host/api` (with or without trailing
 * slash) and return the canonical origin-only form. Warns in dev mode
 * when stripping `/api` so the misconfiguration is visible.
 */
function normalizeBaseUrl(url) {
  if (typeof url !== 'string' || !url) return '';
  const trimmed = url.replace(/\/+$/, '');
  if (/\/api$/.test(trimmed)) {
    if (import.meta.env?.DEV) {
      console.warn(
        '[apiClient] VITE_API_URL ends with "/api". The canonical convention is ' +
        'origin-only (e.g., https://example.com) because every endpoint path in ' +
        'services/endpoints.js already carries the /api/ prefix. Stripping the ' +
        'trailing /api to prevent /api/api/ double-prefix bugs.'
      );
    }
    return trimmed.replace(/\/api$/, '');
  }
  return trimmed;
}

// ── Blob-error body parsing ─────────────────────────────────────────────────

/**
 * When responseType is 'blob' (e.g., the /reports/export download) and
 * the server returns an error, axios wraps the body as a Blob instead
 * of a JSON object. Read the blob as text, try to parse JSON, and pull
 * the `message` field.
 *
 * Returns `null` on any parsing failure — the caller must treat that
 * as "no backend message available" and fall through to other error
 * sources.
 */
async function parseBackendMessage(error) {
  try {
    const data = error?.response?.data;
    if (!data) return null;
    if (data instanceof Blob) {
      const text = await data.text();
      try {
        const parsed = JSON.parse(text);
        return typeof parsed?.message === 'string' ? parsed.message : null;
      } catch {
        return null;
      }
    }
    if (typeof data === 'object' && typeof data.message === 'string') {
      return data.message;
    }
    return null;
  } catch {
    return null;
  }
}

// ── The client ──────────────────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env?.VITE_API_URL),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach the Bearer token on every call, and strip
// the manual Content-Type on FormData bodies so the browser can set the
// multipart boundary.
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }

  return config;
});

// Response interceptor: copy the backend's error message onto
// `error.message` (handling JSON and Blob bodies), dispatch to the 401
// handler on auth failures, and re-reject so endpoint methods throw.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // No response object means network-level failure (server down,
    // CORS, DNS, timeout). Propagate as-is; extractError will tag these
    // with a friendly message downstream.
    if (!error.response) {
      return Promise.reject(error);
    }

    // Promote the backend message onto `error.message` so consumers can
    // rely on a single field regardless of transport (JSON vs. blob).
    const backendMessage = await parseBackendMessage(error);
    if (backendMessage) {
      error.message = backendMessage;
    }

    switch (error.response.status) {
      case 401:
        // Token missing, expired, or invalid. Guard with a token check AND a
        // one-shot in-flight flag so a burst of parallel 401s fires the
        // handler (and its toast) exactly once. The handler owns navigation.
        if (getToken() && !unauthorizedInFlight) {
          unauthorizedInFlight = true;
          try {
            onUnauthorized(error);
          } catch {
            /* never let the handler itself break the rejection chain */
          }
        }
        break;

      case 403:
        // Authenticated but role-insufficient (e.g., petugas hitting an
        // admin-only endpoint). Do NOT redirect or alert — pages own
        // their own toast via the catch block. Alerting here would
        // double-notify.
        break;

      default:
        break;
    }

    return Promise.reject(error);
  }
);

export default apiClient;
