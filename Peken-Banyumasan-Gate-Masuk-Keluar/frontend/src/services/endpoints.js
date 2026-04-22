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

const _mod = import.meta.env.VITE_DUMMY_MODE === 'true' ? dummy : real;

export const authApi        = _mod.authApi;
export const dashboardApi   = _mod.dashboardApi;
export const eventApi       = _mod.eventApi;
export const reportsApi     = _mod.reportsApi;
export const kolaboratorApi = _mod.kolaboratorApi;
export const artisanApi     = _mod.artisanApi;
export const aktivitasApi   = _mod.aktivitasApi;
