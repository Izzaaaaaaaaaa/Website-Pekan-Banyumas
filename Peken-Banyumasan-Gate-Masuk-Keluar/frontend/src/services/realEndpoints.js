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

// ── authApi ─────────────────────────────────────────────────────────────────
export const authApi = {
  /** POST /api/auth/login → { token, user: { id, nama, email, role } } */
  login: async ({ email, password }) => {
    const response = await apiClient.post('/api/auth/login', { email, password });
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

  /** PUT /api/auth/profile → updated user subset (currently { nama }) */
  updateProfile: async (data) => {
    const response = await apiClient.put('/api/auth/profile', data);
    return extractData(response);
  },

  /** PUT /api/auth/password → { message } */
  updatePassword: async ({ password_lama, password_baru }) => {
    const response = await apiClient.put('/api/auth/password', { password_lama, password_baru });
    return extractData(response);
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
  status:     async (id, status)  => extractData(await apiClient.patch(`/api/kolaborator/${id}/status`, { status })),
  events:     async (id)          => extractData(await apiClient.get(`/api/kolaborator/${id}/events`)),
  portofolio: async (id)          => extractData(await apiClient.get(`/api/kolaborator/${id}/portofolio`)),
  stories:    async (id)          => extractData(await apiClient.get(`/api/kolaborator/${id}/stories`)),
};

// ── artisanApi (admin slice — the /me self-slice is Artisan's; omitted here) ──
export const artisanApi = {
  list:    async (params)      => extractData(await apiClient.get('/api/artisan', { params })),
  detail:  async (id)          => extractData(await apiClient.get(`/api/artisan/${id}`)),
  update:  async (id, data)    => extractData(await apiClient.patch(`/api/artisan/${id}`, data)),
  status:  async (id, status)  => extractData(await apiClient.patch(`/api/artisan/${id}/status`, { status })),
  events:  async (id)          => extractData(await apiClient.get(`/api/artisan/${id}/events`)),
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
});
