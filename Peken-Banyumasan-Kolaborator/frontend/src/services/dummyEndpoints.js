/**
 * src/services/dummyEndpoints.js — Kolaborator
 * ──────────────────────────────────────────────
 * Dummy implementasi pengganti endpoints.js saat VITE_DUMMY_MODE=true.
 * Diaktifkan via vite.config.js resolve.alias — endpoints.js tidak diubah.
 *
 * Data bersumber dari src/data/dummy.js (sudah ada di proyek ini).
 * Mutasi (create/update/delete) bekerja pada salinan lokal in-memory.
 */

import { getUser, setUser } from '../lib/auth.js';
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
    return { token: 'dummy-token-demo-mode', user: { ...currentUser, role: 'kolaborator' } };
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
};

// ── profilApi ─────────────────────────────────────────────────────────────────
export const profilApi = {
  get: async () => {
    await delay();
    return getUser() || { ...currentUser, role: 'kolaborator' };
  },
  update: async (data) => {
    await delay();
    const merged = { ...(getUser() || currentUser), ...data };
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
    const item = { id: `p-${Date.now()}`, featured: false, gambar: null, tahun: new Date().getFullYear(), ...data };
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
    const s = { id: `s-${Date.now()}`, like_count: 0, created_at: new Date().toISOString(), tags: [], ...data };
    _stories.unshift(s);
    return s;
  },
  delete: async (id) => {
    await delay();
    _stories = _stories.filter(s => s.id !== id);
    return { message: 'OK' };
  },
  like: async (id) => {
    await delay();
    const s = _stories.find(s => s.id === id);
    const like_count = (s?.like_count || 0) + 1;
    _stories = _stories.map(s => s.id === id ? { ...s, like_count } : s);
    return { like_count };
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
  registerSelf: async (id) => {
    await delay();
    _events = _events.map(e => e.id === id ? { ...e, terdaftar: true, peran: 'peserta', assigned_by: 'self' } : e);
    return { message: 'Berhasil mendaftar ke event (demo)' };
  },
  unregisterSelf: async (id) => {
    await delay();
    _events = _events.map(e => e.id === id ? { ...e, terdaftar: false, peran: undefined, assigned_by: undefined } : e);
    return { message: 'Pendaftaran dibatalkan (demo)' };
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
    _notifikasi = _notifikasi.map(n => n.id === id ? { ...n, dibaca: true } : n);
    return { id, read: true };
  },
  bacaSemua: async () => {
    await delay();
    _notifikasi = _notifikasi.map(n => ({ ...n, dibaca: true }));
    return { count: _notifikasi.length };
  },
};
