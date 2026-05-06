/**
 * src/lib/unwrap.js
 * ─────────────────
 * Response/error unwrapping helpers. Every endpoint method in
 * services/endpoints.js pipes its response through `extractData`, and
 * every page's catch block surfaces errors via `extractError`. Keeping
 * envelope knowledge in this single file means a backend envelope change
 * is a one-line edit instead of a cross-project find-and-replace.
 *
 * Backend envelope: `{ status, message, data: <payload> }`.
 */

/**
 * Strip the `{ status, message, data }` envelope and return the payload.
 *
 *   • Returns `response.data.data` when the envelope shape is detected.
 *   • Returns the raw `response.data` otherwise (e.g., endpoints that
 *     respond without the envelope, or arrays at the top level).
 *   • Returns `response.data` unchanged when it is a Blob (file downloads
 *     such as reportsApi.export must not be tampered with).
 *   • Returns `null` if the response object itself is missing.
 *
 * @param {import('axios').AxiosResponse} response
 * @returns {any}
 */
export function extractData(response) {
  if (!response) return null;
  const body = response.data;

  // Blob responses (responseType: 'blob') pass through untouched.
  if (body instanceof Blob) return body;

  // Envelope unwrap: objects with a `data` key get unwrapped to that payload.
  // Arrays and primitives fall through and are returned as-is.
  if (body !== null && typeof body === 'object' && !Array.isArray(body) && 'data' in body) {
    return body.data;
  }

  return body;
}

/**
 * Pull the top-level `message` field off a successful response. Useful
 * for surfacing backend-provided success copy in toasts without having
 * to hardcode strings in the frontend.
 *
 * @param {import('axios').AxiosResponse} response
 * @param {string} [fallback='']
 * @returns {string}
 */
export function extractMessage(response, fallback = '') {
  const message = response?.data?.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
}

/**
 * Axios's auto-generated message for non-2xx responses. We skip it when
 * deciding what to show the user — it leaks HTTP details and is not
 * translated.
 */
const AXIOS_BOILERPLATE_RE = /^Request failed with status code \d+$/;

/**
 * Produce a single human-readable error message for any error thrown by
 * an endpoint method. Priority order:
 *
 *   1. Backend envelope message     (`err.response.data.message`)
 *   2. Error.message                (unless it is axios's boilerplate)
 *   3. Network-error message        (no response object at all)
 *   4. Generic Indonesian fallback  (or the caller-supplied one)
 *
 * Blob-encoded error bodies are handled by the response interceptor in
 * apiClient.js, which copies the parsed message onto `err.message`. By
 * the time this function runs, `err.message` is the right thing to show
 * for blob errors — so step 2 covers that case.
 *
 * @param {unknown} err
 * @param {string} [fallback='Terjadi kesalahan. Silakan coba lagi.']
 * @returns {string}
 */
export function extractError(err, fallback = 'Terjadi kesalahan. Silakan coba lagi.') {
  // 1. Prefer the backend envelope's message when directly available.
  const backendMessage = err?.response?.data?.message;
  if (typeof backendMessage === 'string' && backendMessage.trim()) {
    return backendMessage;
  }

  // 2. Network-level failures (server down, CORS, timeout, DNS) — must run
  //    BEFORE the err.message branch because axios surfaces these as
  //    English strings ('Network Error', 'ECONNREFUSED ...', 'timeout of
  //    Xms exceeded') that would otherwise leak straight to the user.
  //    Detected via either: no response at all, or one of axios's network
  //    error codes.
  const isNetworkError =
    err && typeof err === 'object' &&
    !err.response &&
    (err.request || err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT');
  if (isNetworkError) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
  }

  // 3. Fall back to err.message, but only if it is a real message — not
  //    axios's "Request failed with status code N" boilerplate.
  const raw = err?.message;
  if (typeof raw === 'string' && raw.trim() && !AXIOS_BOILERPLATE_RE.test(raw)) {
    return raw;
  }

  // 4. Generic fallback.
  return fallback;
}
