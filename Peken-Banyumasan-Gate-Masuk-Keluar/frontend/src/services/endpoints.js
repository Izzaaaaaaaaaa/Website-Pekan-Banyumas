/**
 * src/services/endpoints.js — Conditional re-export (Gate)
 * ──────────────────────────────────────────────────────────
 * Saat VITE_DUMMY_MODE=true  → semua API diarahkan ke dummyEndpoints.js
 * Saat VITE_DUMMY_MODE=false → semua API diarahkan ke realEndpoints.js (backend asli)
 *
 * PENTING: realEndpoints.js berisi implementasi asli — tidak ada yang diubah di sana.
 * Endpoint URL, parameter, dan payload semua ada di realEndpoints.js.
 */

import * as real  from './realEndpoints.js';
import * as dummy from './dummyEndpoints.js';
import api from './api.js';


// Defensive parse: accept 'true' / 'TRUE' / ' True ' / etc. Anything else → real mode.
const _rawDummy = import.meta.env.VITE_DUMMY_MODE;
const _isDummy  = typeof _rawDummy === 'string' && _rawDummy.trim().toLowerCase() === 'true';
const _mod      = _isDummy ? dummy : real;

export const authApi = {
  login: async (payload) => {

    const response = await api.post(
      '/api/auth/login',
      payload
    );

    console.log('LOGIN RESPONSE:', response.data);

    // kalau backend pakai envelope:
    //return response.data.data;

    // kalau backend return langsung:
    return response.data;
  },
};

export const dashboardApi      = _mod.dashboardApi;
export const eventApi          = _mod.eventApi;
export const reportsApi        = _mod.reportsApi;
export const kolaboratorApi    = _mod.kolaboratorApi;
export const artisanApi        = _mod.artisanApi;
export const aktivitasApi      = _mod.aktivitasApi;
export const companyProfileApi = _mod.companyProfileApi;
export const zonesApi          = _mod.zonesApi;
export const notifikasiApi     = _mod.notifikasiApi;
export const petugasApi        = _mod.petugasApi;
