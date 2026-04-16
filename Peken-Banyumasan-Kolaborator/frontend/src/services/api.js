// api.js — DUMMY MODE (siap ganti Axios ke VITE_API_URL saat backend ready)
import * as dummy from '../data/dummy';

const delay = (ms = 250) => new Promise(r => setTimeout(r, ms));

export const getToken  = () => localStorage.getItem('token');
export const getUser   = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };
export const setToken  = t  => localStorage.setItem('token', t);
export const setUser   = u  => localStorage.setItem('user', JSON.stringify(u));
export const clearAuth = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); };

const api = {
  auth: {
    login: async (email, password) => {
      await delay();
      if (!email || !password) throw new Error('Email dan password wajib diisi');
      const u = { ...dummy.currentUser, email };
      setToken('dummy-token-2025');
      setUser(u);
      return { data: { user: u, token: 'dummy-token-2025' } };
    },
    register: async (data) => {
      await delay(600);
      return { data: { message: 'Pendaftaran berhasil. Menunggu verifikasi admin.' } };
    },
  },

  profil: {
    get:    async ()     => { await delay(); return { data: dummy.currentUser }; },
    update: async (data) => { await delay(400); setUser({ ...getUser(), ...data }); return { data }; },
  },

  portofolio: {
    list:   async ()       => { await delay(); return { data: dummy.dummyPortofolio }; },
    create: async (d)      => { await delay(500); return { data: { id:'p'+Date.now(), featured:false, ...d } }; },
    update: async (id, d)  => { await delay(400); return { data: d }; },
    delete: async (id)     => { await delay(300); return { data: {} }; },
  },

  aktivitas: {
    list:   async ()  => { await delay(); return { data: dummy.dummyAktivitas }; },
    create: async (d) => {
      await delay(500);
      return { data: { id:'s'+Date.now(), like_count:0, created_at:new Date().toISOString(), ...d } };
    },
    delete: async ()  => { await delay(300); return { data: {} }; },
    like:   async ()  => { await delay(150); return { data: {} }; },
  },

  event: {
    // Returns the canonical event list with all fields
    list:   async ()   => { await delay(); return { data: dummy.dummyEvents }; },
    detail: async (id) => {
      await delay();
      const ev = dummy.dummyEvents.find(e => e.id === id) || null;
      if (!ev) throw new Error('Event tidak ditemukan');
      return { data: ev };
    },
    daftar: async (id) => { await delay(400); return { data: { message: 'Berhasil mendaftar event.' } }; },
    batal:  async (id) => { await delay(400); return { data: {} }; },
  },

  notifikasi: {
    list: async ()   => { await delay(); return { data: dummy.dummyNotifikasi }; },
    baca: async (id) => { await delay(); return { data: {} }; },
  },
};

export default api;
