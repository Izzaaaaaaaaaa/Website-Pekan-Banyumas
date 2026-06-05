/**
 * API helper — semua request ke BE artisan.
 * Otomatis attach Bearer token dari localStorage.
 * Response selalu dalam envelope { status, message, data }.
 */

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders(extra = {}) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
    ...extra,
  };
}

async function request(method, path, body = null, auth = true) {
  const headers = auth ? authHeaders() : { "Content-Type": "application/json" };
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();

  // BE selalu pakai envelope { status, message, data }
  if (!res.ok) {
    const msg = json?.message || json?.detail || "Terjadi kesalahan pada server";
    throw new Error(msg);
  }

  // Kembalikan isi data saja (strip envelope)
  return json?.data ?? json;
}

export const api = {
  get:    (path)         => request("GET",    path),
  post:   (path, body)   => request("POST",   path, body),
  put:    (path, body)   => request("PUT",    path, body),
  patch:  (path, body)   => request("PATCH",  path, body),
  delete: (path)         => request("DELETE", path),

  // Tanpa auth (register, OTP)
  postPublic: (path, body) => request("POST", path, body, false),
};
