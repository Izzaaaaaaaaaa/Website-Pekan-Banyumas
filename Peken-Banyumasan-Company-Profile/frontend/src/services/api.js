/**
 * src/services/api.js — Public site API client
 * Lightweight fetch wrapper. No auth headers — public read-only endpoints.
 * Base URL from VITE_API_URL env (falls back to '' for same-origin dev proxy).
 */

/**
 * Canonical origin-only backend base URL. Prepend https:// when the env var
 * omits the scheme — otherwise fetch() resolves a scheme-less value as a
 * RELATIVE path against the Pages origin, and (with the SPA _redirects
 * catch-all) gets index.html back instead of JSON, blanking the page. Also
 * strip any trailing slash so `${BASE_URL}${path}` never doubles the slash.
 */
function normalizeBaseUrl(url) {
  if (typeof url !== 'string' || !url) return '';
  let trimmed = url.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(trimmed)) trimmed = `https://${trimmed}`;
  return trimmed;
}

const BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL);

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
