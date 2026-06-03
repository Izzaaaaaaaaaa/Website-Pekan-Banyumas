/**
 * src/services/endpoints.js
 * ─────────────────────────
 * Resource-based endpoint objects. Every HTTP call made by the Gate app
 * goes through one of these — pages must NOT call apiClient directly.
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
 *        • `aktivitas`   for admin-moderation-scoped story endpoints
 *        • `story`       for author-scoped story endpoints (not present
 *                        in Gate — lives in Kolaborator's endpoints.js)
 *
 * Endpoint coverage matches the Phase 0 canonical catalogue for Gate's
 * consumer slice. Methods that exist in the catalogue but belong to
 * other projects (e.g., register, requestOtp, registerSelf, requestJoin,
 * artisanApi.me) are intentionally OMITTED here.
 */

import apiClient from './api.js';
import { extractData } from '../lib/unwrap.js';
import { supabase } from '../lib/supabase.js';

// ── authApi ─────────────────────────────────────────────────────────────────
// login/logout/me/updatePassword → Supabase direct (FE ↔ Supabase Auth).
// updateProfile custom fields (beyond nama/email) → BE via apiClient.
// Gate has no self-register — admins and petugas are created by superadmin.
export const authApi = {
  /**
   * Login via Supabase signInWithPassword.
   * Gate accepts role 'admin' atau 'petugas'. Jika role artisan/kolaborator,
   * langsung signOut dan throw agar user mendapat pesan jelas.
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
    if (!['admin', 'petugas'].includes(role)) {
      await supabase.auth.signOut();
      const err = new Error('Akun ini tidak memiliki akses ke panel Gate');
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

  /** Logout via Supabase signOut — revokes refresh token server-side. */
  logout: async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
    }
    return { message: 'Logout berhasil' };
  },

  /** Ambil user dari Supabase session (verified server-side, bukan localStorage). */
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
   * Field custom lainnya (kolom users_profile) → BE via apiClient.
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
};

// ── dashboardApi ────────────────────────────────────────────────────────────
export const dashboardApi = {
  /** GET /api/dashboard/stats → { di_dalam, total_masuk, total_keluar, total_harian, event_id, nama_event } */
  stats: async () => {
    const response = await apiClient.get('/api/dashboard/stats');
    return extractData(response);
  },

  /**
   * GET /api/visitors → Array<Visitor>
   * @param {{ tanggal: string, event_id?: string }} params
   */
  visitors: async (params) => {
    const response = await apiClient.get('/api/visitors', { params });
    return extractData(response);
  },

  /** POST /api/visitors/manual → { message } */
  manualEntry: async ({ aksi, event_id }) => {
    const response = await apiClient.post('/api/visitors/manual', { aksi, event_id });
    return extractData(response);
  },

  /**
   * POST /api/visitors/tap → { aksi, nama, ... }
   * Replaces the raw `fetch('/tap')` currently in Dashboard.jsx so the
   * NFC-tap flow goes through the same interceptors (auth header, 401
   * handling, consistent error parsing) as every other call.
   */
  visitorTap: async ({ uid, timestamp }) => {
    const response = await apiClient.post('/api/visitors/tap', { uid, timestamp });
    return extractData(response);
  },
};

// ── reportsApi ──────────────────────────────────────────────────────────────
export const reportsApi = {
  /**
   * GET /api/reports → { nama, tanggal_range: [...], rows: [...], total_masuk, total_keluar, ... }
   * @param {{ event_id?: string, tanggal?: string }} params
   */
  list: async (params) => {
    const response = await apiClient.get('/api/reports', { params });
    return extractData(response);
  },

  /**
   * GET /api/reports/export → Blob (xlsx or pdf)
   * The apiClient preserves responseType:'blob' and the Blob passes
   * through extractData() unchanged. The caller is responsible for
   * creating an object URL and triggering the download.
   *
   * @param {{ format: 'excel'|'pdf', event_id?: string, tanggal?: string }} params
   */
  export: async (params) => {
    const response = await apiClient.get('/api/reports/export', {
      params,
      responseType: 'blob',
    });
    return extractData(response);
  },

  /** GET /api/reports/artisan?event_id=... → Array<ArtisanReportRow> */
  artisan: async (params) => extractData(await apiClient.get('/api/reports/artisan', { params })),

  /** GET /api/reports/accumulation → Array<EventAccumRow> */
  accumulation: async (params) => extractData(await apiClient.get('/api/reports/accumulation', { params })),
};

// ── eventApi (admin slice — Gate does not consume the self-register methods) ─
export const eventApi = {
  list:   async (params)      => extractData(await apiClient.get('/api/events', { params })),
  detail: async (id)          => extractData(await apiClient.get(`/api/events/${id}`)),
  create: async (data)        => extractData(await apiClient.post('/api/events', data)),
  update: async (id, data)    => extractData(await apiClient.put(`/api/events/${id}`, data)),
  delete: async (id)          => extractData(await apiClient.delete(`/api/events/${id}`)),
  status: async (id, status)  => extractData(await apiClient.patch(`/api/events/${id}/status`, { status })),

  // Event ↔ Kolaborator relations.
  // Path segment is `/kolaborator` (singular, canonical) — the legacy
  // `/kolaborators` path name is dropped as of the Phase 0 contract.
  kolaborators:      async (id)              => extractData(await apiClient.get(`/api/events/${id}/kolaborator`)),
  assignKolaborator: async (id, data)        => extractData(await apiClient.post(`/api/events/${id}/kolaborator`, data)),
  updateKolaborator: async (id, kid, data)   => extractData(await apiClient.patch(`/api/events/${id}/kolaborator/${kid}`, data)),
  removeKolaborator: async (id, kid)         => extractData(await apiClient.delete(`/api/events/${id}/kolaborator/${kid}`)),

  // Event ↔ Artisan relations.
  // Path segment is `/artisan` (canonical) — the legacy `/artisans` path
  // name is dropped as of the Phase 0 contract.
  artisans:      async (id)              => extractData(await apiClient.get(`/api/events/${id}/artisan`)),
  assignArtisan: async (id, data)        => extractData(await apiClient.post(`/api/events/${id}/artisan`, data)),
  updateArtisan: async (id, aid, data)   => extractData(await apiClient.patch(`/api/events/${id}/artisan/${aid}`, data)),
  removeArtisan: async (id, aid)         => extractData(await apiClient.delete(`/api/events/${id}/artisan/${aid}`)),
};

// ── kolaboratorApi (admin management of kolaborator records) ───────────────
export const kolaboratorApi = {
  list:       async (params)      => extractData(await apiClient.get('/api/kolaborator', { params })),
  detail:     async (id)          => extractData(await apiClient.get(`/api/kolaborator/${id}`)),
  update:     async (id, data)    => extractData(await apiClient.patch(`/api/kolaborator/${id}`, data)),
  status:     async (id, status)  => extractData(await apiClient.patch(`/api/kolaborator/${id}/status`, { status })),
  events:      async (id)              => extractData(await apiClient.get(`/api/kolaborator/${id}/events`)),
  requests:    async (id)              => extractData(await apiClient.get(`/api/kolaborator/${id}/requests`)),
  portofolio:  async (id)              => extractData(await apiClient.get(`/api/kolaborator/${id}/portofolio`)),
  stories:     async (id)              => extractData(await apiClient.get(`/api/kolaborator/${id}/stories`)),
  featurePorto: async (id, pid, featured) => extractData(await apiClient.patch(`/api/kolaborator/${id}/portofolio/${pid}`, { featured })),
  deletePorto:  async (id, pid)           => extractData(await apiClient.delete(`/api/kolaborator/${id}/portofolio/${pid}`)),
};

// ── artisanApi (admin slice — the /me self-slice is Artisan's; omitted here) ──
export const artisanApi = {
  list:    async (params)      => extractData(await apiClient.get('/api/artisan', { params })),
  detail:  async (id)          => extractData(await apiClient.get(`/api/artisan/${id}`)),
  update:  async (id, data)    => extractData(await apiClient.patch(`/api/artisan/${id}`, data)),
  status:  async (id, status)  => extractData(await apiClient.patch(`/api/artisan/${id}/status`, { status })),
  events:  async (id)          => extractData(await apiClient.get(`/api/artisan/${id}/events`)),
  requests: async (id)         => extractData(await apiClient.get(`/api/artisan/${id}/requests`)),
  // Admin finance view (read-only aggregates per artisan)
  kas:     async (id, params)  => extractData(await apiClient.get(`/api/artisan/${id}/kas`, { params })),
  riwayat: async (id, params)  => extractData(await apiClient.get(`/api/artisan/${id}/riwayat`, { params })),
  promo:   async (id)          => extractData(await apiClient.get(`/api/artisan/${id}/promo`)),
  stok:    async (id)          => extractData(await apiClient.get(`/api/artisan/${id}/stok`)),
  qris:    async (id)          => extractData(await apiClient.get(`/api/artisan/${id}/qris`)),
};

// ── aktivitasApi (admin moderation of all stories, cross-author) ───────────
export const aktivitasApi = {
  list: async (params) => extractData(await apiClient.get('/api/aktivitas', { params })),

  /**
   * DELETE /api/aktivitas/:id → { message }
   * Path changed from the legacy `/api/admin/stories/:id` per the
   * Phase 0 contract — the `aktivitas` vocabulary is canonical for
   * admin-moderation-scoped story endpoints.
   */
  delete: async (id) => extractData(await apiClient.delete(`/api/aktivitas/${id}`)),
};

// ── companyProfileApi (kelola konten company profile per section) ───────────
export const companyProfileApi = {
  /** GET /api/company-profile?section=home|about|tim|programs|works|gallery → content JSONB */
  get: async (section) => extractData(await apiClient.get('/api/company-profile', { params: { section } })),
  /** PUT /api/company-profile → { message } */
  save: async (section, content) => extractData(await apiClient.put('/api/company-profile', { section, content })),
};

// ── zonesApi (venue zone & stand management) ─────────────────────────────────
export const zonesApi = {
  /** GET /api/zones → Array<Zone> (global venue layout) */
  listGlobal:    async ()                           => extractData(await apiClient.get('/api/zones')),
  /** PUT /api/zones → { message } */
  saveGlobal:    async (zones)                      => extractData(await apiClient.put('/api/zones', { zones })),
  /** GET /api/events/:id/zones → Array<Zone> with per-event occupied state */
  listForEvent:  async (id)                         => extractData(await apiClient.get(`/api/events/${id}/zones`)),
  /** POST /api/events/:eid/artisan/:aid/stand → { message } */
  assignStand:   async (eventId, artisanId, standId) => extractData(await apiClient.post(`/api/events/${eventId}/artisan/${artisanId}/stand`, { stand_id: standId })),
};

// ── petugasApi (admin management of petugas accounts) ─────────────────────────
export const petugasApi = {
  list:          async (params)      => extractData(await apiClient.get('/api/petugas', { params })),
  detail:        async (id)          => extractData(await apiClient.get(`/api/petugas/${id}`)),
  create:        async (data)        => extractData(await apiClient.post('/api/petugas', data)),
  update:        async (id, data)    => extractData(await apiClient.patch(`/api/petugas/${id}`, data)),
  status:        async (id, status)  => extractData(await apiClient.patch(`/api/petugas/${id}/status`, { status })),
  resetPassword: async (id, mode)    => extractData(await apiClient.post(`/api/petugas/${id}/reset-password`, { mode })),
};

// ── notifikasiApi (admin notification inbox) ──────────────────────────────────
export const notifikasiApi = {
  /** GET /api/notifikasi → Array<Notifikasi> */
  list:      async ()   => extractData(await apiClient.get('/api/notifikasi')),
  /** PATCH /api/notifikasi/:id/baca → { id, read: true } */
  baca:      async (id) => extractData(await apiClient.patch(`/api/notifikasi/${id}/baca`)),
  /** PATCH /api/notifikasi/baca-semua → { count } */
  bacaSemua: async ()   => extractData(await apiClient.patch('/api/notifikasi/baca-semua')),
};

// ── eventApi: artisan-request approval endpoints ───────────────────────────
// Append to the existing eventApi. These let admin respond to self-join requests.
// (eventApi itself is defined earlier in this file; the extra methods below
//  would ideally be merged there, but are added here to avoid a large diff.)
Object.assign(eventApi, {
  /** GET /api/events/:id/artisan-requests → Array<ArtisanRequest> */
  artisanRequests:        async (id)           => extractData(await apiClient.get(`/api/events/${id}/artisan-requests`)),
  /** PATCH /api/events/:id/artisan-requests/:rid → { message } — action:'approve'|'reject' */
  respondArtisanRequest:  async (id, rid, data) => extractData(await apiClient.patch(`/api/events/${id}/artisan-requests/${rid}`, data)),
  /** PATCH /api/events/:id/artisan-requests/:rid/change → { message } — respond to change_request */
  respondPositionChange:  async (id, rid, data) => extractData(await apiClient.patch(`/api/events/${id}/artisan-requests/${rid}/change`, data)),

  /** GET /api/events/:id/kolaborator-requests → Array<KolaboratorRequest> */
  kolaboratorRequests:          async (id)           => extractData(await apiClient.get(`/api/events/${id}/kolaborator-requests`)),
  /** PATCH /api/events/:id/kolaborator-requests/:rid → { message } — action:'approve'|'reject' */
  respondKolaboratorRequest:    async (id, rid, data) => extractData(await apiClient.patch(`/api/events/${id}/kolaborator-requests/${rid}`, data)),
});
