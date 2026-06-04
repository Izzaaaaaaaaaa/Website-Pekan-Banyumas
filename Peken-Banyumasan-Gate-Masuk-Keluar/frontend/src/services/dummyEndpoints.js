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

import { getUser, setToken, setUser } from '../lib/auth.js';
import {
  DUMMY_USER, DUMMY_STATS, DUMMY_VISITORS,
  DUMMY_EVENTS, DUMMY_REPORT,
  DUMMY_KOLABORATOR, DUMMY_KOLABORATOR_EVENTS, DUMMY_KOLABORATOR_PORTO, DUMMY_KOLABORATOR_AKTIVITAS,
  DUMMY_ARTISANS, DUMMY_ARTISAN_EVENTS,
  DUMMY_EVENT_KOLABORATOR, DUMMY_EVENT_ARTISAN,
  DUMMY_ARTISAN_REQUESTS, DUMMY_KOLABORATOR_REQUESTS, DUMMY_ZONES_GLOBAL, DUMMY_NOTIFIKASI_ADMIN,
  DUMMY_ARTISAN_KAS, DUMMY_ARTISAN_RIWAYAT, DUMMY_ARTISAN_STOK,
  DUMMY_ARTISAN_PROMO, DUMMY_ARTISAN_QRIS,
} from '../data/dummy.js';

const delay = (ms = 150) => new Promise(r => setTimeout(r, ms));

// Deep clone at module init — isolates mutations from the fixture source.
const clone = (v) => JSON.parse(JSON.stringify(v));

// ── authApi ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: async () => {
    await delay();
    setToken('dummy-token-demo-mode');
    setUser(DUMMY_USER);
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
  setNewPassword: async () => {
    await delay();
    return { message: 'Password berhasil diperbarui (demo)' };
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

// ── In-memory stores (reset on page reload) ──────────────────────────────────
let _events            = clone(DUMMY_EVENTS);
let _kolaborators      = clone(DUMMY_KOLABORATOR);
let _artisans          = clone(DUMMY_ARTISANS);
let _kolabEvents       = clone(DUMMY_KOLABORATOR_EVENTS);
let _kolabPorto        = clone(DUMMY_KOLABORATOR_PORTO);
let _kolabAktivitas    = clone(DUMMY_KOLABORATOR_AKTIVITAS);
let _artisanEvents     = clone(DUMMY_ARTISAN_EVENTS);
let _eventKolaborator  = clone(DUMMY_EVENT_KOLABORATOR);
let _eventArtisan      = clone(DUMMY_EVENT_ARTISAN);
let _artisanRequests       = clone(DUMMY_ARTISAN_REQUESTS);
let _kolaboratorRequests   = clone(DUMMY_KOLABORATOR_REQUESTS);
let _zonesGlobal       = clone(DUMMY_ZONES_GLOBAL);
let _notifikasi        = clone(DUMMY_NOTIFIKASI_ADMIN);
let _artisanKas        = clone(DUMMY_ARTISAN_KAS);
let _artisanRiwayat    = clone(DUMMY_ARTISAN_RIWAYAT);
let _artisanStok       = clone(DUMMY_ARTISAN_STOK);
let _artisanPromo      = clone(DUMMY_ARTISAN_PROMO);
let _artisanQris       = clone(DUMMY_ARTISAN_QRIS);

// ── eventApi ─────────────────────────────────────────────────────────────────
export const eventApi = {
  list:   async ()           => { await delay(); return [..._events]; },
  detail: async (id)         => { await delay(); return _events.find(e => e.id === id) || _events[0]; },
  create: async (data)       => {
    await delay();
    const e = { id: `e-${Date.now()}`, peserta_count: 0, kategori_usaha: [], galeri: [], banner_url: '', ...data };
    _events.unshift(e);
    _eventKolaborator[e.id] = [];
    _eventArtisan[e.id]     = [];
    _artisanRequests[e.id]  = [];
    return e;
  },
  update: async (id, data)   => { await delay(); _events = _events.map(e => e.id === id ? { ...e, ...data } : e); return _events.find(e => e.id === id); },
  delete: async (id)         => {
    await delay();
    _events = _events.filter(e => e.id !== id);
    delete _eventKolaborator[id];
    delete _eventArtisan[id];
    delete _artisanRequests[id];
    return { message: 'OK' };
  },
  status: async (id, status) => { await delay(); _events = _events.map(e => e.id === id ? { ...e, status } : e); return { id, status }; },

  // Event ↔ Kolaborator
  kolaborators: async (id) => { await delay(); return [...(_eventKolaborator[id] || [])]; },
  assignKolaborator: async (id, data) => {
    await delay();
    const k = _kolaborators.find(x => x.id === data.kolaborator_id);
    const row = {
      id: `em-${Date.now()}`,
      kolaborator_id: data.kolaborator_id,
      nama: k?.nama || '—',
      subsektor: k?.subsektor || [],
      peran: data.peran || 'performer',
      status_kehadiran: 'terdaftar',
      assigned_by: 'admin',
    };
    _eventKolaborator[id] = [...(_eventKolaborator[id] || []), row];
    return row;
  },
  updateKolaborator: async (id, kid, data) => {
    await delay();
    _eventKolaborator[id] = (_eventKolaborator[id] || []).map(r => r.id === kid ? { ...r, ...data } : r);
    return { message: 'OK' };
  },
  removeKolaborator: async (id, kid) => {
    await delay();
    _eventKolaborator[id] = (_eventKolaborator[id] || []).filter(r => r.id !== kid);
    return { message: 'OK' };
  },

  // Event ↔ Artisan
  artisans: async (id) => { await delay(); return [...(_eventArtisan[id] || [])]; },
  assignArtisan: async (id, data) => {
    await delay();
    const a = _artisans.find(x => x.id === data.artisan_id);
    const row = {
      id: `et-${Date.now()}`,
      artisan_id: data.artisan_id,
      nama_usaha: a?.nama_usaha || '—',
      kategori_usaha: a?.kategori_usaha || [],
      stand_id: data.stand_id || null,
      posisi_event: data.stand_id || data.posisi_event || '',
      status_request: 'approved',
      assigned_by: 'admin',
    };
    _eventArtisan[id] = [...(_eventArtisan[id] || []), row];
    return row;
  },
  updateArtisan: async (id, aid, data) => {
    await delay();
    _eventArtisan[id] = (_eventArtisan[id] || []).map(r => r.id === aid ? { ...r, ...data } : r);
    return { message: 'OK' };
  },
  removeArtisan: async (id, aid) => {
    await delay();
    _eventArtisan[id] = (_eventArtisan[id] || []).filter(r => r.id !== aid);
    return { message: 'OK' };
  },

  // Artisan self-join requests
  artisanRequests: async (id) => { await delay(); return [...(_artisanRequests[id] || [])]; },
  respondArtisanRequest: async (id, rid, data) => {
    await delay();
    const reqs = _artisanRequests[id] || [];
    const req  = reqs.find(r => r.id === rid);
    if (!req) throw new Error('Request tidak ditemukan');
    if (data.action === 'approve') {
      // Move from pending requests into confirmed artisan list
      const row = {
        id: `et-${Date.now()}`,
        artisan_id: req.artisan_id,
        nama_usaha: req.nama_usaha,
        kategori_usaha: req.kategori_usaha || [],
        stand_id: data.stand_id || req.posisi_event || null,
        posisi_event: data.stand_id || req.posisi_event || '',
        status_request: 'approved',
        assigned_by: 'self',
      };
      _eventArtisan[id] = [...(_eventArtisan[id] || []), row];
      _artisanRequests[id] = reqs.filter(r => r.id !== rid);
    } else {
      // Reject: update status_request → 'rejected'
      _artisanRequests[id] = reqs.map(r => r.id === rid ? { ...r, status_request: 'rejected' } : r);
    }
    return { message: 'OK' };
  },
  respondPositionChange: async (id, rid, data) => {
    await delay();
    const reqs = _artisanRequests[id] || [];
    const req  = reqs.find(r => r.id === rid);
    if (!req) throw new Error('Request tidak ditemukan');
    if (data.action === 'approve') {
      // Apply the change_request posisi to the confirmed artisan row
      _eventArtisan[id] = (_eventArtisan[id] || []).map(r =>
        r.artisan_id === req.artisan_id
          ? { ...r, stand_id: req.change_request, posisi_event: req.change_request }
          : r
      );
      _artisanRequests[id] = reqs.filter(r => r.id !== rid);
    } else {
      _artisanRequests[id] = reqs.map(r => r.id === rid ? { ...r, status_request: 'approved', change_request: null } : r);
    }
    return { message: 'OK' };
  },

  // Kolaborator self-join requests
  kolaboratorRequests: async (id) => { await delay(); return [...(_kolaboratorRequests[id] || [])]; },
  respondKolaboratorRequest: async (id, rid, data) => {
    await delay();
    const reqs = _kolaboratorRequests[id] || [];
    const req  = reqs.find(r => r.id === rid);
    if (!req) throw new Error('Request tidak ditemukan');
    if (data.action === 'approve') {
      const row = {
        id: `em-${Date.now()}`,
        kolaborator_id: req.kolaborator_id,
        nama: req.nama,
        subsektor: req.subsektor || [],
        peran: req.peran || 'peserta',
        status_kehadiran: 'terdaftar',
        assigned_by: 'self',
      };
      _eventKolaborator[id] = [...(_eventKolaborator[id] || []), row];
      _kolaboratorRequests[id] = reqs.filter(r => r.id !== rid);
    } else {
      _kolaboratorRequests[id] = reqs.map(r => r.id === rid ? { ...r, status: 'rejected' } : r);
    }
    return { message: 'OK' };
  },
};

const DEMO_ARTISAN_ROWS = [
  { id:'t1', nama_usaha:'Batik Sari Rahayu',    kategori:'Kriya & Fashion', omset:4850000, komisi_persen:15, transaksi:42, event_count:3, stand_terakhir:'A-3' },
  { id:'t2', nama_usaha:'Keripik Tempe Mrisi',  kategori:'F&B / Kuliner',   omset:2340000, komisi_persen:15, transaksi:98, event_count:2, stand_terakhir:'B-2' },
  { id:'t3', nama_usaha:'Calung Mas',           kategori:'Lainnya',         omset:1200000, komisi_persen:10, transaksi:24, event_count:4, stand_terakhir:'C-1' },
  { id:'t4', nama_usaha:'Tenun Lurik Cilacap',  kategori:'Kriya & Fashion', omset:3650000, komisi_persen:15, transaksi:31, event_count:2, stand_terakhir:'A-5' },
  { id:'t5', nama_usaha:'Dawet Ayu Bu Tari',    kategori:'F&B / Kuliner',   omset:1980000, komisi_persen:12, transaksi:76, event_count:3, stand_terakhir:'B-7' },
  { id:'t6', nama_usaha:'Anyam Bambu Banyumas', kategori:'Kriya',           omset:890000,  komisi_persen:15, transaksi:15, event_count:1, stand_terakhir:'A-2' },
];

const DEMO_ACCUM_ROWS = [
  { id:'e1', nama:'Festival Budaya Banyumasan 2025', tanggal:'2025-05-17', status:'mendatang',  pengunjung:0,    artisan_count:8,  kolaborator_count:12, omset_artisan:0,        komisi:0 },
  { id:'e2', nama:'Workshop Batik & Tenun Nusantara', tanggal:'2025-04-26', status:'mendatang', pengunjung:0,    artisan_count:3,  kolaborator_count:5,  omset_artisan:0,        komisi:0 },
  { id:'e4', nama:'Peken Banyumasan #12',             tanggal:'2025-03-20', status:'selesai',   pengunjung:1247, artisan_count:24, kolaborator_count:18, omset_artisan:28450000, komisi:4267500 },
];

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
  artisan:     async (params) => { await delay(); return [...DEMO_ARTISAN_ROWS]; },
  accumulation: async (params) => {
    await delay();
    const rows = [...DEMO_ACCUM_ROWS];
    if (params?.event_id) return rows.filter(r => r.id === params.event_id);
    return rows;
  },
};

// ── kolaboratorApi ───────────────────────────────────────────────────────────
export const kolaboratorApi = {
  list:   async () => { await delay(); return [..._kolaborators]; },
  detail: async (id) => { await delay(); return _kolaborators.find(k => k.id === id) || {}; },
  update: async (id, data) => {
    await delay();
    _kolaborators = _kolaborators.map(k => k.id === id ? { ...k, ...data } : k);
    return _kolaborators.find(k => k.id === id) || {};
  },
  status: async (id, status) => {
    await delay();
    _kolaborators = _kolaborators.map(k => k.id === id ? { ...k, status } : k);
    return { id, status };
  },
  delete: async (id) => {
    await delay();
    _kolaborators = _kolaborators.filter(k => k.id !== id);
    return { message: 'OK' };
  },
  events:     async (id) => { await delay(); return [...(_kolabEvents[id]    || [])]; },
  requests:   async ()   => { await delay(); return []; },
  portofolio: async (id) => { await delay(); return [...(_kolabPorto[id]     || [])]; },
  stories:    async (id) => { await delay(); return [...(_kolabAktivitas[id] || [])]; },
  featurePorto: async (id, pid, featured) => {
    await delay();
    if (_kolabPorto[id]) {
      _kolabPorto[id] = _kolabPorto[id].map(p => p.id === pid ? { ...p, featured } : p);
    }
    return { id: pid, featured };
  },
  deletePorto: async (id, pid) => {
    await delay();
    if (_kolabPorto[id]) _kolabPorto[id] = _kolabPorto[id].filter(p => p.id !== pid);
    return { message: 'OK' };
  },
};

// ── artisanApi ───────────────────────────────────────────────────────────────
export const artisanApi = {
  list:   async () => { await delay(); return [..._artisans]; },
  detail: async (id) => { await delay(); return _artisans.find(a => a.id === id) || {}; },
  update: async (id, data) => {
    await delay();
    _artisans = _artisans.map(a => a.id === id ? { ...a, ...data } : a);
    return _artisans.find(a => a.id === id) || {};
  },
  status: async (id, status) => {
    await delay();
    _artisans = _artisans.map(a => a.id === id ? { ...a, status } : a);
    return { id, status };
  },
  delete: async (id) => {
    await delay();
    _artisans = _artisans.filter(a => a.id !== id);
    return { message: 'OK' };
  },
  events:  async (id)          => { await delay(); return [...(_artisanEvents[id] || [])]; },
  requests: async ()           => { await delay(); return []; },
  kas:     async (id)          => { await delay(); return [...(_artisanKas[id]    || [])]; },
  riwayat: async (id)          => { await delay(); return [...(_artisanRiwayat[id]|| [])]; },
  promo:   async (id)          => { await delay(); return [...(_artisanPromo[id]  || [])]; },
  stok:    async (id)          => { await delay(); return [...(_artisanStok[id]   || [])]; },
  qris:    async (id)          => { await delay(); return _artisanQris[id] ?? null; },
};

// ── aktivitasApi ─────────────────────────────────────────────────────────────
// Admin moderation feed: flattened stories across all kolaborator authors.
export const aktivitasApi = {
  list: async () => {
    await delay();
    return Object.entries(_kolabAktivitas).flatMap(([kolabId, rows]) => {
      const k = _kolaborators.find(x => x.id === kolabId);
      return rows.map(s => ({
        ...s,
        kolaborator_id: kolabId,
        nama_kolaborator: k?.nama || '—',
      }));
    });
  },
  delete: async (id) => {
    await delay();
    Object.keys(_kolabAktivitas).forEach(kid => {
      _kolabAktivitas[kid] = (_kolabAktivitas[kid] || []).filter(s => s.id !== id);
    });
    return { message: 'OK' };
  },
};

// ── companyProfileApi ─────────────────────────────────────────────────────────
// Dummy: persists to localStorage (same keys as legacy `persist()` pattern — cp_<section>).
export const companyProfileApi = {
  get: async (section) => {
    await delay();
    const raw = localStorage.getItem(`cp_${section}`);
    return raw ? JSON.parse(raw) : null;
  },
  save: async (section, content) => {
    await delay();
    localStorage.setItem(`cp_${section}`, JSON.stringify(content));
    return { message: 'OK' };
  },
};

// ── zonesApi ──────────────────────────────────────────────────────────────────
export const zonesApi = {
  listGlobal: async () => {
    await delay();
    return clone(_zonesGlobal);
  },
  saveGlobal: async (zones) => {
    await delay();
    _zonesGlobal = clone(zones);
    return { message: 'OK' };
  },
  listForEvent: async (eventId) => {
    await delay();
    // Build occupied set from confirmed artisan stands for this event.
    const occupiedStands = new Set(
      (_eventArtisan[eventId] || []).map(r => r.stand_id).filter(Boolean)
    );
    return clone(_zonesGlobal).map(zone => ({
      ...zone,
      stands: zone.stands.map(stand => ({
        ...stand,
        occupied: occupiedStands.has(stand.id),
      })),
    }));
  },
  assignStand: async (eventId, artisanId, standId) => {
    await delay();
    _eventArtisan[eventId] = (_eventArtisan[eventId] || []).map(r =>
      r.artisan_id === artisanId ? { ...r, stand_id: standId, posisi_event: standId } : r
    );
    return { message: 'OK' };
  },
};

// ── petugasApi ────────────────────────────────────────────────────────────────
const DUMMY_PETUGAS_SEED = [
  { id: 'ptg-0001', nama: 'Rina Kusuma',   jabatan: 'Petugas Pintu Masuk',  email: 'rina@pekenbanyumasan.id',   status: 'aktif',    created_at: '2026-01-10T08:00:00.000Z', last_sign_in_at: '2026-05-03T09:15:00.000Z' },
  { id: 'ptg-0002', nama: 'Dani Prasetyo', jabatan: 'Petugas Scan Tiket',   email: 'dani@pekenbanyumasan.id',   status: 'aktif',    created_at: '2026-02-14T08:00:00.000Z', last_sign_in_at: '2026-05-04T07:45:00.000Z' },
  { id: 'ptg-0003', nama: 'Sari Lestari',  jabatan: null,                   email: 'sari.l@pekenbanyumasan.id', status: 'disabled', created_at: '2026-03-01T08:00:00.000Z', last_sign_in_at: '2026-04-01T10:00:00.000Z' },
];

let _petugas = clone(DUMMY_PETUGAS_SEED);

export const petugasApi = {
  list: async () => { await delay(); return [..._petugas]; },
  detail: async (id) => { await delay(); return _petugas.find(p => p.id === id) || {}; },
  create: async (data) => {
    await delay();
    const p = {
      id: `ptg-${Date.now()}`,
      nama: data.nama,
      jabatan: data.jabatan || null,
      email: data.email,
      status: 'aktif',
      created_at: new Date().toISOString(),
      last_sign_in_at: null,
    };
    _petugas.unshift(p);
    return p;
  },
  update: async (id, data) => {
    await delay();
    _petugas = _petugas.map(p => p.id === id ? { ...p, ...data } : p);
    return _petugas.find(p => p.id === id) || {};
  },
  status: async (id, status) => {
    await delay();
    _petugas = _petugas.map(p => p.id === id ? { ...p, status } : p);
    return { id, status };
  },
  delete: async (id) => {
    await delay();
    _petugas = _petugas.filter(p => p.id !== id);
    return { message: 'OK' };
  },
  resetPassword: async (id, mode) => {
    await delay();
    if (mode === 'temp_password') return { temp_password: 'Demo@1234' };
    return { message: 'Link reset password telah dikirim ke email petugas (demo).' };
  },
};

// ── notifikasiApi ─────────────────────────────────────────────────────────────
export const notifikasiApi = {
  list:      async ()   => { await delay(); return [..._notifikasi]; },
  baca:      async (id) => {
    await delay();
    _notifikasi = _notifikasi.map(n => n.id === id ? { ...n, read: true } : n);
    return { id, read: true };
  },
  bacaSemua: async ()   => {
    await delay();
    const count = _notifikasi.filter(n => !n.read).length;
    _notifikasi = _notifikasi.map(n => ({ ...n, read: true }));
    return { count };
  },
};
