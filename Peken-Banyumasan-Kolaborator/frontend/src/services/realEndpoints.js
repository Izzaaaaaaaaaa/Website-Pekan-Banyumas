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
 * Method names that are Kolaborator-specific: `requestJoin` (POST to
 * kolaborator-requests queue, pending admin approval) and `myRequests`
 * (GET self-join request history). The old facade names (`daftar`,
 * `registerSelf`, `unregisterSelf`) are dropped — canonical names only.
 */

import apiClient from './api.js';
import { extractData } from '../lib/unwrap.js';
import { supabase } from '../lib/supabase.js';

// ── authApi ─────────────────────────────────────────────────────────────────
// login/logout/me/updatePassword → Supabase direct (FE ↔ Supabase Auth).
// register → BE intermediary (BE pakai Supabase Admin SDK, atomik: auth+profil+foto).
// updateProfile custom fields → BE via apiClient.
// OTP password-reset → BE intermediary (WA gateway via Fonnte/Twilio) — STUB.
export const authApi = {
  /**
   * Login via Supabase signInWithPassword.
   * Kolaborator hanya menerima role 'kolaborator'. Jika role lain, signOut + throw.
   * user.status dikembalikan agar Login.jsx bisa redirect ke /status jika pending.
   */
  login: async ({ email, password }) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi — isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const err = new Error(error.message);
      err.response = { status: error.status ?? 401, data: { status: 'error', message: error.message } };
      throw err;
    }
    if (!data.session) throw new Error('Sesi gagal dibuat. Coba lagi.');
    const role = data.user.app_metadata?.role;
    if (role !== 'kolaborator') {
      await supabase.auth.signOut();
      const err = new Error('Akun Anda bukan akun kolaborator');
      err.response = { status: 403, data: { status: 'error', message: err.message } };
      throw err;
    }
    return {
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        nama: data.user.user_metadata?.nama ?? data.user.email,
        role,
        status: data.user.app_metadata?.status ?? 'aktif',
      },
    };
  },

  /** POST /api/auth/register → { message, status } — via BE (atomik: auth+profil+foto). */
  register: async (data) => {
    const response = await apiClient.post('/api/auth/register', data);
    return extractData(response);
  },

  /** Logout via Supabase signOut — revokes refresh token server-side. */
  logout: async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
    }
    return { message: 'Logout berhasil' };
  },

  /** Ambil user dari Supabase session (verified server-side). */
  me: async () => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw new Error(error.message);
    return {
      id: user.id,
      email: user.email,
      nama: user.user_metadata?.nama ?? user.email,
      role: user.app_metadata?.role ?? null,
      status: user.app_metadata?.status ?? 'aktif',
    };
  },

  /**
   * Update profile. nama/email → Supabase updateUser.
   * Field custom (subsektor, kota, bio, dll) → BE via apiClient.
   */
  updateProfile: async (data) => {
    if (!supabase) {
      const response = await apiClient.put('/api/auth/profile', data);
      return extractData(response);
    }
    const supabaseUpdate = {};
    if (data.nama) supabaseUpdate.data = { nama: data.nama };
    if (data.email) supabaseUpdate.email = data.email;
    if (Object.keys(supabaseUpdate).length > 0) {
      const { error } = await supabase.auth.updateUser(supabaseUpdate);
      if (error) throw new Error(error.message);
    }
    const beFields = { ...data };
    delete beFields.nama;
    delete beFields.email;
    if (Object.keys(beFields).length > 0) {
      const response = await apiClient.put('/api/auth/profile', beFields);
      return extractData(response);
    }
    return { message: 'Profile berhasil diupdate' };
  },

  /**
   * Ganti password. Butuh re-auth dengan password lama karena Supabase
   * tidak menyediakan endpoint verify-only.
   */
  updatePassword: async ({ password_lama, password_baru }) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesi tidak valid.');
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: user.email, password: password_lama,
    });
    if (verifyErr) throw new Error('Password lama salah.');
    const { error: updateErr } = await supabase.auth.updateUser({ password: password_baru });
    if (updateErr) throw new Error(updateErr.message);
    return { message: 'Password berhasil diubah' };
  },

  // ── OTP password-reset flow (STUBS — via BE WA gateway) ──────────────────
  // BE akan pakai Fonnte/Twilio untuk kirim OTP via WhatsApp, kemudian
  // supabase.auth.admin.updateUserById() untuk update password.
  // Saat backend siap: hapus throw dan uncomment apiClient calls.

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
    // 1. Sync auth metadata directly with Supabase
    if (supabase) {
      const supabaseUpdate = {};
      if (data.nama) supabaseUpdate.data = { nama: data.nama };
      if (data.email) supabaseUpdate.email = data.email;
      if (Object.keys(supabaseUpdate).length > 0) {
        const { error } = await supabase.auth.updateUser(supabaseUpdate);
        if (error) throw new Error(error.message);
      }
    }
    // 2. Sync all profile fields with the Kolaborator table
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

  /** PATCH /api/kolaborator/me/story/:id → Story */
  update: async (id, data) => {
    const response = await apiClient.patch(`/api/kolaborator/me/story/${id}`, data);
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

  /** POST /api/events/:id/kolaborator-requests → { id, status:'pending', peran } */
  requestJoin: async (id, peran = 'peserta') => {
    const response = await apiClient.post(`/api/events/${id}/kolaborator-requests`, { peran });
    return extractData(response);
  },

  /** GET /api/events/my-requests → Array<{ event_id, peran, status }> */
  myRequests: async () => {
    const response = await apiClient.get('/api/events/my-requests');
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
