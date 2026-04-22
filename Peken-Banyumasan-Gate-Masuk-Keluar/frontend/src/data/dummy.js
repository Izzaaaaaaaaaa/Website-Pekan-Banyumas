/**
 * src/data/dummy.js — Gate dummy data (hanya aktif saat VITE_DUMMY_MODE=true)
 * Diimpor oleh src/services/dummyEndpoints.js — tidak dipakai di produksi.
 */

export const DUMMY_USER = {
  id: 'u-admin-01',
  nama: 'Admin Demo',
  email: 'admin@pekenbanyumas.com',
  role: 'admin',
};

export const DUMMY_STATS = {
  di_dalam: 42,
  total_masuk: 158,
  total_keluar: 116,
  total_harian: 158,
  event_id: 'e1',
  nama_event: 'Festival Budaya Banyumasan 2025',
};

const now = Date.now();
export const DUMMY_VISITORS = [
  { id: 'v1', nama: 'Andi Setiawan',   waktu_masuk: new Date(now - 3_600_000).toISOString(), waktu_keluar: null,                                   status: 'di_dalam' },
  { id: 'v2', nama: 'Rini Hartati',    waktu_masuk: new Date(now - 7_200_000).toISOString(), waktu_keluar: new Date(now - 3_000_000).toISOString(), status: 'keluar'   },
  { id: 'v3', nama: 'Budi Santoso',    waktu_masuk: new Date(now - 1_800_000).toISOString(), waktu_keluar: null,                                   status: 'di_dalam' },
  { id: 'v4', nama: 'Siti Aminah',     waktu_masuk: new Date(now - 5_400_000).toISOString(), waktu_keluar: new Date(now - 1_200_000).toISOString(), status: 'keluar'   },
  { id: 'v5', nama: 'Joko Widiatmoko', waktu_masuk: new Date(now -   900_000).toISOString(), waktu_keluar: null,                                   status: 'di_dalam' },
  { id: 'v6', nama: 'Dewi Lestari',    waktu_masuk: new Date(now - 2_100_000).toISOString(), waktu_keluar: new Date(now -   600_000).toISOString(), status: 'keluar'   },
];

export const DUMMY_EVENTS = [
  { id: 'e1', nama: 'Festival Budaya Banyumasan 2025', tanggal: '2025-05-17', tanggal_selesai: '2025-05-19', lokasi: 'Alun-Alun Purwokerto',   status: 'berlangsung', kapasitas: 500, peserta_count: 158 },
  { id: 'e2', nama: 'Workshop Batik & Tenun Nusantara', tanggal: '2025-04-26', tanggal_selesai: '2025-04-27', lokasi: 'Gedung Kebudayaan Cilacap', status: 'upcoming',     kapasitas: 30,  peserta_count: 18  },
  { id: 'e3', nama: 'Pameran Kriya Ekraf Regional',     tanggal: '2025-06-10', tanggal_selesai: '2025-06-12', lokasi: 'Mall Cilacap Raya',          status: 'upcoming',     kapasitas: 500, peserta_count: 12  },
];

export const DUMMY_REPORT = {
  nama: 'Festival Budaya Banyumasan 2025',
  tanggal_range: ['2025-05-17', '2025-05-19'],
  total_masuk: 158,
  total_keluar: 116,
  di_dalam: 42,
  rows: DUMMY_VISITORS.map(v => ({ ...v, tanggal: v.waktu_masuk.slice(0, 10) })),
};
