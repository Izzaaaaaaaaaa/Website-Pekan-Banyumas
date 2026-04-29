/**
 * src/services/endpoints.js — Public company profile endpoints
 * All paths are under /api/public/ — no authentication required.
 * Every method returns the unwrapped payload (envelope stripped by apiFetch).
 * Every method throws on failure — callers handle errors.
 */

import apiFetch from './api.js';

/** GET /api/public/company-profile?section=home|about|tim|programs|works|gallery */
export const companyProfileApi = {
  get: (section) => apiFetch(`/api/public/company-profile?section=${encodeURIComponent(section)}`),
};

/** GET /api/public/programs → Array<Program> */
/** GET /api/public/programs/:slug → Program */
export const programsApi = {
  list: () => apiFetch('/api/public/programs'),
  detail: (slug) => apiFetch(`/api/public/programs/${encodeURIComponent(slug)}`),
};

/** GET /api/public/karya → Array<Karya> */
export const karyaApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/public/karya${qs ? `?${qs}` : ''}`);
  },
};

/** GET /api/public/profiles/:slug → Profile */
export const profileApi = {
  bySlug: (slug) => apiFetch(`/api/public/profiles/${encodeURIComponent(slug)}`),
};

/** GET /api/public/events → Array<Event> */
export const eventsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/public/events${qs ? `?${qs}` : ''}`);
  },
  /** GET /api/public/events/upcoming?limit=N → Array<Event> (ordered by tanggal asc) */
  upcoming: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/public/events/upcoming${qs ? `?${qs}` : ''}`);
  },
};

/** GET /api/public/stats → { edisi_count, kolaborator_aktif, artisan_aktif, pengunjung_total } */
export const statsApi = {
  public: () => apiFetch('/api/public/stats'),
};

