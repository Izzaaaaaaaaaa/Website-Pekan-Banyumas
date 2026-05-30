/**
 * src/services/dummyEndpoints.js — Kolaborator
 * ──────────────────────────────────────────────
 * Dummy implementasi pengganti endpoints.js saat VITE_DUMMY_MODE=true.
 * Diaktifkan via vite.config.js resolve.alias — endpoints.js tidak diubah.
 *
 * Data bersumber dari src/data/dummy.js (sudah ada di proyek ini).
 * Mutasi (create/update/delete) bekerja pada salinan lokal in-memory.
 */

import { getUser, setToken, setUser } from '../lib/auth.js';
import {
  currentUser,
  dummyPortofolio,
  dummyStory,
  dummyEvents,
  dummyNotifikasi,
} from '../data/dummy.js';

const delay = (ms = 150) => new Promise(r => setTimeout(r, ms));

// ── Salinan mutable untuk simulasi CRUD in-memory ────────────────────────────
let _portofolio  = [...dummyPortofolio];
let _stories     = [...dummyStory];
let _events      = [...dummyEvents];
let _notifikasi  = [...dummyNotifikasi];

// ── authApi ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: async () => {
    await delay();
    const user = { ...currentUser, role: 'kolaborator' };
    setToken('dummy-token-demo-mode');
    setUser(user);
    return { token: 'dummy-token-demo-mode', user };
  },
  register: async () => {
    await delay();
    return { message: 'Pendaftaran berhasil dikirim (demo)', status: 'pending' };
  },
  logout: async () => {
    await delay();
    return { message: 'OK' };
  },
  me: async () => {
    await delay();
    return getUser() || { ...currentUser, role: 'kolaborator' };
  },
  updateProfile: async (data) => {
    await delay();
    return { ...(getUser() || currentUser), ...data };
  },
  updatePassword: async () => {
    await delay();
    return { message: 'Password berhasil diubah (demo)' };
  },
  requestPasswordReset: async () => {
    await delay();
    return { message: 'Jika email terdaftar, tautan reset telah dikirim (demo).' };
  },
  completePasswordReset: async () => {
    await delay();
    return { message: 'Password berhasil diubah (demo).' };
  },
};

// ── profilApi ─────────────────────────────────────────────────────────────────
export const profilApi = {
  get: async () => {
    await delay();
    const u = getUser() || { ...currentUser, role: 'kolaborator' };
    // Keep dummy mode consistent with Dashboard: count only approved/registered events.
    return { ...u, total_event: _events.filter(e => e.terdaftar).length };
  },
  update: async (data) => {
    await delay();
    const merged = { ...(getUser() || currentUser), ...data };
    merged.total_event = _events.filter(e => e.terdaftar).length;
    setUser(merged);
    return merged;
  },
};

// ── portofolioApi ─────────────────────────────────────────────────────────────
export const portofolioApi = {
  list: async () => {
    await delay();
    return [..._portofolio];
  },
  create: async (data) => {
    await delay();
    const item = { id: `p-${Date.now()}`, featured: false, gambar_url: null, tahun: new Date().getFullYear(), ...data };
    _portofolio.unshift(item);
    return item;
  },
  update: async (id, data) => {
    await delay();
    _portofolio = _portofolio.map(p => p.id === id ? { ...p, ...data } : p);
    return _portofolio.find(p => p.id === id);
  },
  delete: async (id) => {
    await delay();
    _portofolio = _portofolio.filter(p => p.id !== id);
    return { message: 'OK' };
  },
};

// ── storyApi ──────────────────────────────────────────────────────────────────
export const storyApi = {
  list: async () => {
    await delay();
    return [..._stories];
  },
  create: async (data) => {
    await delay();
    const s = { id: `s-${Date.now()}`, like_count: 0, media_url: null, status: 'aktif', created_at: new Date().toISOString(), tags: [], ...data };
    _stories.unshift(s);
    return s;
  },
  delete: async (id) => {
    await delay();
    _stories = _stories.filter(s => s.id !== id);
    return { message: 'OK' };
  },
};

// ── eventApi ──────────────────────────────────────────────────────────────────
export const eventApi = {
  list: async () => {
    await delay();
    return [..._events];
  },
  detail: async (id) => {
    await delay();
    return _events.find(e => e.id === id) || _events[0];
  },
  requestJoin: async (id, peran = 'peserta') => {
    await delay();
    _events = _events.map(e => e.id === id
      ? { ...e, terdaftar: false, pending_request: true, pending_peran: peran }
      : e);
    return { id: `kreq-${Date.now()}`, status: 'pending', peran, event_id: id };
  },
  myRequests: async () => {
    await delay();
    return _events
      .filter(e => e.pending_request)
      .map(e => ({ event_id: e.id, peran: e.pending_peran || 'peserta', status: 'pending' }));
  },
};

// ── notifikasiApi ─────────────────────────────────────────────────────────────
export const notifikasiApi = {
  list: async () => {
    await delay();
    return [..._notifikasi];
  },
  baca: async (id) => {
    await delay();
    _notifikasi = _notifikasi.map(n => n.id === id ? { ...n, read: true } : n);
    return { id, read: true };
  },
  bacaSemua: async () => {
    await delay();
    const count = _notifikasi.filter(n => !n.read).length;
    _notifikasi = _notifikasi.map(n => ({ ...n, read: true }));
    return { count };
  },
};
