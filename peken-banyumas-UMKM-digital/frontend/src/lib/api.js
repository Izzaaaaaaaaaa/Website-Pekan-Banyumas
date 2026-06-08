/**
 * API helper — semua request ke BE artisan.
 * Otomatis attach Bearer token (Supabase JWT) dari supabase.auth.getSession().
 * Fallback ke localStorage["token"] untuk kompatibilitas sementara.
 */
import { supabase } from "./supabase";

const BASE = import.meta.env.VITE_API_URL;

if (!BASE) {
  throw new Error("VITE_API_URL wajib diisi di frontend/.env");
}

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token ?? localStorage.getItem("token") ?? "";
}

async function authHeaders(extra = {}) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${await getToken()}`,
    ...extra,
  };
}

async function request(method, path, body = null, auth = true) {
  const headers = auth
    ? await authHeaders()
    : { "Content-Type": "application/json" };

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();

  if (!res.ok) {
    const msg = json?.message || json?.detail || "Terjadi kesalahan pada server";
    throw new Error(msg);
  }

  return json?.data ?? json;
}

export const api = {
  get:    (path)       => request("GET",    path),
  post:   (path, body) => request("POST",   path, body),
  put:    (path, body) => request("PUT",    path, body),
  patch:  (path, body) => request("PATCH",  path, body),
  delete: (path)       => request("DELETE", path),

  // Tanpa auth (register)
  postPublic: (path, body) => request("POST", path, body, false),
};
