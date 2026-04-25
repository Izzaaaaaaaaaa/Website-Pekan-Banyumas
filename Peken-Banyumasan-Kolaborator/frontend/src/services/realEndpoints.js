/**
 * src/services/endpoints.js
 * ─────────────────────────
 * Resource-based endpoint objects. Every HTTP call made by the Kolaborator
 * app goes through one of these — pages must NOT call apiClient directly.
 *
 * Contract (enforced by convention, reviewed per PR):
 *   1. Every method returns the UNWRAPPED payload. `extractData(response)`
 *      strips the `{ status, message, data }` envelope so pages never
 *      read `response.data.data` again.
 *   2. Every method THROWS on failure. There is no try/catch inside this
 *      file — the error propagates to the page's catch block, which
 *      surfaces it via `extractError(err)` to a toast.
 *   3. Paths include `/api/` exactly once. The client's baseURL is the
 *      origin only.
 *   4. Vocabulary is canonical:
 *        • `kolaborator` for the creative-collaborator role (never legacy `member` or `kreator`)
 *        • `artisan`     for the small-business role        (never legacy `tenant`  or `umkm`)
 *        • `aktivitas`   (admin-moderation-scoped story list)
 *        • `story`       (author-scoped story CRUD)
 *
 * Endpoint coverage matches the Phase 0 canonical catalogue for the
 * Kolaborator consumer slice: authApi, profilApi, portofolioApi,
 * storyApi, eventApi (self-register methods only — admin CRUD lives
 * in Gate), notifikasiApi.
 *
 * Method names that are Kolaborator-specific but catalogued as part
 * of eventApi use the catalogue names (`registerSelf`, `unregisterSelf`).
 * The old dummy-facade method names (`daftar`, `batal`) are intentionally
 * dropped here; consumer pages are being migrated to the new names.
 */

import apiClient from './api.js';
import { extractData } from '../lib/unwrap.js';

// ── authApi ─────────────────────────────────────────────────────────────────
export const authApi = {
  /** POST /api/auth/login → { token, user: { id, nama, email, role } } */
  login: async ({ email, password }) => {
    const response = await apiClient.post('/api/auth/login', { email, password });
    return extractData(response);
  },

  /** POST /api/auth/register → { message, status } (moderation-queued) */
  register: async (data) => {
    const response = await apiClient.post('/api/auth/register', data);
    return extractData(response);
  },

  /** POST /api/auth/logout → { message } */
  logout: async () => {
    const response = await apiClient.post('/api/auth/logout');
    return extractData(response);
  },

  /** GET /api/auth/me → { id, nama, email, role, ... } */
  me: async () => {
    const response = await apiClient.get('/api/auth/me');
    return extractData(response);
  },

  /** PUT /api/auth/profile → updated user subset */
  updateProfile: async (data) => {
    const response = await apiClient.put('/api/auth/profile', data);
    return extractData(response);
  },

  /** PUT /api/auth/password → { message } */
  updatePassword: async ({ password_lama, password_baru }) => {
    const response = await apiClient.put('/api/auth/password', { password_lama, password_baru });
    return extractData(response);
  },

  /** POST /api/auth/otp/request → { message } — STUB */
  requestOtp: async (/* { phone } */) => {
    throw new Error('Not implemented yet');
    // const response = await apiClient.post('/api/auth/otp/request', { phone });
    // return extractData(response);
  },

  /** POST /api/auth/otp/verify → { reset_token } — STUB */
  verifyOtp: async (/* { phone, otp } */) => {
    throw new Error('Not implemented yet');
    // const response = await apiClient.post('/api/auth/otp/verify', { phone, otp });
    // return extractData(response);
  },

  /** POST /api/auth/password/reset → { message } — STUB */
  resetPassword: async (/* { reset_token, password_baru } */) => {
    throw new Error('Not implemented yet');
    // const response = await apiClient.post('/api/auth/password/reset', { reset_token, password_baru });
    // return extractData(response);
  },
};

// ── profilApi (kolaborator self-profile) ────────────────────────────────────
export const profilApi = {
  /** GET /api/kolaborator/me → self-Kolaborator record */
  get: async () => {
    const response = await apiClient.get('/api/kolaborator/me');
    return extractData(response);
  },

  /** PATCH /api/kolaborator/me → updated self-record */
  update: async (data) => {
    const response = await apiClient.patch('/api/kolaborator/me', data);
    return extractData(response);
  },
};

// ── portofolioApi (kolaborator portfolio items, self-owned) ────────────────
export const portofolioApi = {
  /** GET /api/kolaborator/me/portofolio → Array<PortofolioItem> */
  list: async () => {
    const response = await apiClient.get('/api/kolaborator/me/portofolio');
    return extractData(response);
  },

  /** POST /api/kolaborator/me/portofolio → PortofolioItem */
  create: async (data) => {
    const response = await apiClient.post('/api/kolaborator/me/portofolio', data);
    return extractData(response);
  },

  /** PATCH /api/kolaborator/me/portofolio/:id → PortofolioItem */
  update: async (id, data) => {
    const response = await apiClient.patch(`/api/kolaborator/me/portofolio/${id}`, data);
    return extractData(response);
  },

  /** DELETE /api/kolaborator/me/portofolio/:id → { message } */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/kolaborator/me/portofolio/${id}`);
    return extractData(response);
  },
};

// ── storyApi (kolaborator stories, author-scoped CRUD) ──────────────────────
export const storyApi = {
  /** GET /api/kolaborator/me/story → Array<Story> */
  list: async () => {
    const response = await apiClient.get('/api/kolaborator/me/story');
    return extractData(response);
  },

  /** POST /api/kolaborator/me/story → Story */
  create: async (data) => {
    const response = await apiClient.post('/api/kolaborator/me/story', data);
    return extractData(response);
  },

  /** DELETE /api/kolaborator/me/story/:id → { message } */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/kolaborator/me/story/${id}`);
    return extractData(response);
  },
};

// ── eventApi (Kolaborator's self-register slice — admin CRUD lives in Gate) ─
export const eventApi = {
  /** GET /api/events → Array<Event> */
  list: async (params) => {
    const response = await apiClient.get('/api/events', { params });
    return extractData(response);
  },

  /** GET /api/events/:id → Event */
  detail: async (id) => {
    const response = await apiClient.get(`/api/events/${id}`);
    return extractData(response);
  },

  /** POST /api/events/:id/register → { message } (self as kolaborator) */
  registerSelf: async (id) => {
    const response = await apiClient.post(`/api/events/${id}/register`);
    return extractData(response);
  },

  /** DELETE /api/events/:id/register → { message } (cancel self-registration) */
  unregisterSelf: async (id) => {
    const response = await apiClient.delete(`/api/events/${id}/register`);
    return extractData(response);
  },
};

// ── notifikasiApi (per-user notification inbox) ────────────────────────────
export const notifikasiApi = {
  /** GET /api/notifikasi → Array<Notif> */
  list: async () => {
    const response = await apiClient.get('/api/notifikasi');
    return extractData(response);
  },

  /** PATCH /api/notifikasi/:id/baca → { id, read: true } */
  baca: async (id) => {
    const response = await apiClient.patch(`/api/notifikasi/${id}/baca`);
    return extractData(response);
  },

  /** PATCH /api/notifikasi/baca-semua → { count } */
  bacaSemua: async () => {
    const response = await apiClient.patch('/api/notifikasi/baca-semua');
    return extractData(response);
  },
};
