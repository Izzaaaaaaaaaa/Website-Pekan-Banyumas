/**
 * src/services/endpoints.js — Conditional re-export (Kolaborator)
 * ─────────────────────────────────────────────────────────────────
 * Saat VITE_DUMMY_MODE=true  → semua API diarahkan ke dummyEndpoints.js
 * Saat VITE_DUMMY_MODE=false → semua API diarahkan ke realEndpoints.js (backend asli)
 *
 * PENTING: realEndpoints.js berisi implementasi asli — tidak ada yang diubah di sana.
 * Endpoint URL, parameter, dan payload semua ada di realEndpoints.js.
 */

import * as real  from './realEndpoints.js';
import * as dummy from './dummyEndpoints.js';

const _mod = import.meta.env.VITE_DUMMY_MODE === 'true' ? dummy : real;

export const authApi       = _mod.authApi;
export const profilApi     = _mod.profilApi;
export const portofolioApi = _mod.portofolioApi;
export const storyApi      = _mod.storyApi;
export const eventApi      = _mod.eventApi;
export const notifikasiApi = _mod.notifikasiApi;
