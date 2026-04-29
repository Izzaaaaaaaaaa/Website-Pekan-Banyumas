/**
 * src/services/api.js — Public site API client
 * Lightweight fetch wrapper. No auth headers — public read-only endpoints.
 * Base URL from VITE_API_URL env (falls back to '' for same-origin dev proxy).
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  const json = await res.json();
  // Unwrap { status, message, data } envelope if present.
  return 'data' in json ? json.data : json;
}

export default apiFetch;
