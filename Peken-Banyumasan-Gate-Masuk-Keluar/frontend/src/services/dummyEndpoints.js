/**
 * src/services/dummyEndpoints.js — Gate
 * ──────────────────────────────────────
 * Dummy implementasi pengganti endpoints.js saat VITE_DUMMY_MODE=true.
 * Diaktifkan via vite.config.js resolve.alias — endpoints.js tidak diubah.
 *
 * Kontrak sama persis dengan endpoints.js:
 *   • Setiap method me-return payload yang SUDAH di-unwrap (bukan { status, message, data }).
 *   • Setiap method THROW on failure (tidak ada try/catch di sini).
 *   • Shape return value identik dengan yang diharapkan halaman.
 */

import { getUser, setUser } from '../lib/auth.js';
import {
  DUMMY_USER, DUMMY_STATS, DUMMY_VISITORS,
  DUMMY_EVENTS, DUMMY_REPORT,
} from '../data/dummy.js';

const delay = (ms = 150) => new Promise(r => setTimeout(r, ms));

// ── authApi ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: async () => {
    await delay();
    return { token: 'dummy-token-demo-mode', user: DUMMY_USER };
  },
  logout: async () => {
    await delay();
    return { message: 'OK' };
  },
  me: async () => {
    await delay();
    return getUser() || DUMMY_USER;
  },
  updateProfile: async ({ nama }) => {
    await delay();
    const updated = { ...(getUser() || DUMMY_USER), nama };
    setUser(updated);
    return updated;
  },
  updatePassword: async () => {
    await delay();
    return { message: 'Password berhasil diubah (demo)' };
  },
};

// ── dashboardApi ─────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: async () => {
    await delay();
    return { ...DUMMY_STATS };
  },
  visitors: async () => {
    await delay();
    return [...DUMMY_VISITORS];
  },
  manualEntry: async () => {
    await delay();
    return { message: 'OK' };
  },
  visitorTap: async ({ uid }) => {
    await delay();
    return { aksi: 'masuk', nama: 'Pengunjung Demo', uid };
  },
};

// ── eventApi ─────────────────────────────────────────────────────────────────
let _events = [...DUMMY_EVENTS];

export const eventApi = {
  list:   async ()           => { await delay(); return [..._events]; },
  detail: async (id)         => { await delay(); return _events.find(e => e.id === id) || _events[0]; },
  create: async (data)       => { await delay(); const e = { id: `e-${Date.now()}`, ...data }; _events.unshift(e); return e; },
  update: async (id, data)   => { await delay(); _events = _events.map(e => e.id === id ? { ...e, ...data } : e); return _events.find(e => e.id === id); },
  delete: async (id)         => { await delay(); _events = _events.filter(e => e.id !== id); return { message: 'OK' }; },
  status: async (id, status) => { await delay(); _events = _events.map(e => e.id === id ? { ...e, status } : e); return { id, status }; },

  kolaborators:      async ()          => { await delay(); return []; },
  assignKolaborator: async ()          => { await delay(); return { message: 'OK' }; },
  updateKolaborator: async ()          => { await delay(); return { message: 'OK' }; },
  removeKolaborator: async ()          => { await delay(); return { message: 'OK' }; },

  artisans:      async ()              => { await delay(); return []; },
  assignArtisan: async ()              => { await delay(); return { message: 'OK' }; },
  updateArtisan: async ()              => { await delay(); return { message: 'OK' }; },
  removeArtisan: async ()              => { await delay(); return { message: 'OK' }; },
};

// ── reportsApi ───────────────────────────────────────────────────────────────
export const reportsApi = {
  list:   async ()       => { await delay(); return { ...DUMMY_REPORT }; },
  export: async (params) => {
    await delay(300);
    const fmt = params?.format || 'excel';
    const content = `[DEMO] Laporan Gate\nEvent: ${DUMMY_REPORT.nama}\nTotal Masuk: ${DUMMY_REPORT.total_masuk}\nTotal Keluar: ${DUMMY_REPORT.total_keluar}`;
    const type = fmt === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    return new Blob([content], { type });
  },
};

// ── kolaboratorApi ───────────────────────────────────────────────────────────
export const kolaboratorApi = {
  list:       async () => { await delay(); return []; },
  detail:     async () => { await delay(); return {}; },
  status:     async () => { await delay(); return {}; },
  events:     async () => { await delay(); return []; },
  portofolio: async () => { await delay(); return []; },
  stories:    async () => { await delay(); return []; },
};

// ── artisanApi ───────────────────────────────────────────────────────────────
export const artisanApi = {
  list:   async () => { await delay(); return []; },
  detail: async () => { await delay(); return {}; },
  update: async () => { await delay(); return {}; },
  status: async () => { await delay(); return {}; },
  events: async () => { await delay(); return []; },
};

// ── aktivitasApi ─────────────────────────────────────────────────────────────
export const aktivitasApi = {
  list:   async () => { await delay(); return []; },
  delete: async () => { await delay(); return { message: 'OK' }; },
};
