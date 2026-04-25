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
  DUMMY_KOLABORATOR, DUMMY_KOLABORATOR_EVENTS, DUMMY_KOLABORATOR_PORTO, DUMMY_KOLABORATOR_AKTIVITAS,
  DUMMY_ARTISANS, DUMMY_ARTISAN_EVENTS,
  DUMMY_EVENT_KOLABORATOR, DUMMY_EVENT_ARTISAN,
  DUMMY_ARTISAN_REQUESTS, DUMMY_ZONES_GLOBAL, DUMMY_NOTIFIKASI_ADMIN,
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
let _artisanRequests   = clone(DUMMY_ARTISAN_REQUESTS);
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
    const e = { id: `e-${Date.now()}`, peserta_count: 0, subsektor: [], galeri: [], banner_url: '', ...data };
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
      subsektor: a?.subsektor || [],
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
        subsektor: req.subsektor,
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
  list:   async () => { await delay(); return [..._kolaborators]; },
  detail: async (id) => { await delay(); return _kolaborators.find(k => k.id === id) || {}; },
  status: async (id, status) => {
    await delay();
    _kolaborators = _kolaborators.map(k => k.id === id ? { ...k, status } : k);
    return { id, status };
  },
  events:     async (id) => { await delay(); return [...(_kolabEvents[id]    || [])]; },
  portofolio: async (id) => { await delay(); return [...(_kolabPorto[id]     || [])]; },
  stories:    async (id) => { await delay(); return [...(_kolabAktivitas[id] || [])]; },
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
  events:  async (id)          => { await delay(); return [...(_artisanEvents[id] || [])]; },
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
