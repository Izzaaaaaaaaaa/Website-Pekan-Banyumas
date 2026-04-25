/**
 * src/data/dummy.js — Gate dummy data (hanya aktif saat VITE_DUMMY_MODE=true)
 * Diimpor oleh src/services/dummyEndpoints.js — tidak dipakai di produksi.
 *
 * Shape setiap entitas mengikuti kontrak canonical:
 *   • Kolaborator: foto_url, cover_url, subsektor[], status enum, total_karya, total_story, total_event
 *   • Artisan:     foto_url, cover_url, qris_url, subsektor[] (array, bukan string singular), status enum
 *   • Karya:       gambar_url, subsektor (string), featured (boolean, bukan is_featured)
 *   • Event:       status enum('draft','published','berlangsung','selesai') — 'upcoming' adalah state FE derived
 *   • Notifikasi:  type, title, message, read, created_at, link, detail
 *   • EventArtisan: subsektor[], stand_id, status_request, posisi_event (alias display)
 */

// ── Auth / dashboard ─────────────────────────────────────────────────────────
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

// ── Events ───────────────────────────────────────────────────────────────────
// status DB: 'draft' | 'published' | 'berlangsung' | 'selesai'
// FE derives 'upcoming' from: status='published' && tanggal > now — jangan simpan 'upcoming' ke DB.
export const DUMMY_EVENTS = [
  { id:'e1', nama:'Festival Budaya Banyumasan 2025',   tanggal:'2025-05-17', jam_mulai:'08:00', jam_selesai:'22:00', tanggal_selesai:'2025-05-19', lokasi:'Alun-Alun Purwokerto',        status:'published',   kapasitas:200, peserta_count:34,  deskripsi:'Festival tahunan menampilkan seni, kuliner, dan kerajinan khas Banyumas.', konten_lengkap:'Festival Budaya Banyumasan mempertemukan seniman, pengrajin, dan pelaku kuliner dari seluruh eks-Karesidenan Banyumas.', subsektor:['Kriya','Musik','Seni Pertunjukan','Kuliner'], banner_url:'', galeri:[] },
  { id:'e2', nama:'Workshop Batik & Tenun Nusantara',  tanggal:'2025-04-26', jam_mulai:'09:00', jam_selesai:'17:00', tanggal_selesai:'2025-04-27', lokasi:'Gedung Kebudayaan Cilacap',    status:'published',   kapasitas:30,  peserta_count:18,  deskripsi:'Pelatihan intensif 2 hari teknik batik tulis dan tenun lurik.',             konten_lengkap:'Workshop intensif dibimbing maestro batik dari Banyumas.',                                                        subsektor:['Kriya','Fashion'],                               banner_url:'', galeri:[] },
  { id:'e3', nama:'Pameran Kriya Ekraf Regional',      tanggal:'2025-06-10', jam_mulai:'10:00', jam_selesai:'21:00', tanggal_selesai:'2025-06-12', lokasi:'Mall Cilacap Raya',           status:'draft',       kapasitas:500, peserta_count:0,   deskripsi:'Pameran dan bazaar produk ekonomi kreatif se-eks Karesidenan Banyumas.',    konten_lengkap:'Pameran terbesar menampilkan lebih dari 100 produk unggulan.',                                                    subsektor:['Kriya','Desain Produk','Fashion'],               banner_url:'', galeri:[] },
  { id:'e4', nama:'Peken Banyumasan #12',              tanggal:'2025-03-20', jam_mulai:'16:00', jam_selesai:'22:00', tanggal_selesai:'2025-03-20', lokasi:'Amphitheater GOR Satria',     status:'selesai',     kapasitas:500, peserta_count:145, deskripsi:'Pasar budaya mingguan dengan penampilan seniman lokal.',                     konten_lengkap:'Peken Banyumasan edisi ke-12 sukses digelar.',                                                                   subsektor:['Musik','Kuliner','Seni Pertunjukan'],            banner_url:'', galeri:[] },
];

// ── Reports ──────────────────────────────────────────────────────────────────
export const DUMMY_REPORT = {
  nama: 'Festival Budaya Banyumasan 2025',
  tanggal_range: ['2025-05-17', '2025-05-19'],
  total_masuk: 158,
  total_keluar: 116,
  di_dalam: 42,
  rows: DUMMY_VISITORS.map(v => ({ ...v, tanggal: v.waktu_masuk.slice(0, 10) })),
};

// ── Kolaborator list + maps ──────────────────────────────────────────────────
// Canonical: foto_url, cover_url, subsektor[], status, tanggal_daftar, total_karya, total_story, total_event
export const DUMMY_KOLABORATOR = [
  { id:'m1', nama:'Sari Dewi Rahayu',  email:'sari@email.com',  kota:'Banyumas',     subsektor:['Kriya','Fashion'],            status:'aktif',     tanggal_daftar:'2024-03-15', foto_url:null, cover_url:null, total_karya:18, total_story:24, total_event:6,  bio:'Pengrajin batik tulis Banyumas dengan fokus motif lokal.' },
  { id:'m2', nama:'Ahmad Fauzi',        email:'ahmad@email.com', kota:'Purwokerto',  subsektor:['Musik','Seni Pertunjukan'],    status:'aktif',     tanggal_daftar:'2024-04-02', foto_url:null, cover_url:null, total_karya:12, total_story:15, total_event:4,  bio:'Musisi tradisional dan penggiat kesenian calung Banyumas.' },
  { id:'m3', nama:'Rizky Pramesti',     email:'rizky@email.com', kota:'Banyumas',    subsektor:['Fotografi'],                  status:'pending',   tanggal_daftar:'2025-04-08', foto_url:null, cover_url:null, total_karya:0,  total_story:0,  total_event:0,  bio:'Fotografer dokumentasi budaya dan event lokal.' },
  { id:'m4', nama:'Nurul Hidayah',      email:'nurul@email.com', kota:'Cilacap',     subsektor:['Kuliner'],                    status:'aktif',     tanggal_daftar:'2024-05-10', foto_url:null, cover_url:null, total_karya:5,  total_story:8,  total_event:2,  bio:'Pengembang kuliner tradisional berbasis bahan lokal Banyumas.' },
  { id:'m5', nama:'Dimas Arya',         email:'dimas@email.com', kota:'Purbalingga', subsektor:['Desain Produk','Kriya'],      status:'pending',   tanggal_daftar:'2025-04-09', foto_url:null, cover_url:null, total_karya:0,  total_story:0,  total_event:0,  bio:'Desainer produk kriya berbahan dasar bambu dan rotan.' },
  { id:'m6', nama:'Laras Wulandari',    email:'laras@email.com', kota:'Banyumas',    subsektor:['Seni Rupa'],                  status:'suspended', tanggal_daftar:'2024-02-01', foto_url:null, cover_url:null, total_karya:8,  total_story:12, total_event:3,  bio:'Pelukis dengan medium cat air berbasis motif wayang.' },
  { id:'m7', nama:'Budi Santoso',       email:'budi@email.com',  kota:'Purwokerto',  subsektor:['Film & Animasi'],             status:'aktif',     tanggal_daftar:'2024-06-20', foto_url:null, cover_url:null, total_karya:3,  total_story:7,  total_event:2,  bio:'Sineas dokumenter budaya lokal Banyumas.' },
];

// Events per kolaborator — shape returned by `kolaboratorApi.events(id)`.
export const DUMMY_KOLABORATOR_EVENTS = {
  m1: [
    { id:'em1', event_id:'e1', nama:'Festival Budaya Banyumasan 2025', tanggal:'2025-05-17', jam_mulai:'08:00', jam_selesai:'22:00', peran:'performer', status_kehadiran:'terdaftar', assigned_by:'admin' },
    { id:'em2', event_id:'e4', nama:'Peken Banyumasan #12',             tanggal:'2025-03-20', jam_mulai:'16:00', jam_selesai:'22:00', peran:'performer', status_kehadiran:'hadir',     assigned_by:'admin' },
  ],
  m2: [
    { id:'em3', event_id:'e1', nama:'Festival Budaya Banyumasan 2025', tanggal:'2025-05-17', jam_mulai:'08:00', jam_selesai:'22:00', peran:'performer', status_kehadiran:'terdaftar', assigned_by:'admin' },
    { id:'em4', event_id:'e4', nama:'Peken Banyumasan #12',             tanggal:'2025-03-20', jam_mulai:'16:00', jam_selesai:'22:00', peran:'performer', status_kehadiran:'hadir',     assigned_by:'admin' },
  ],
  m4: [
    { id:'em5', event_id:'e2', nama:'Workshop Batik & Tenun Nusantara', tanggal:'2025-04-26', jam_mulai:'09:00', jam_selesai:'17:00', peran:'peserta',   status_kehadiran:'terdaftar', assigned_by:'admin' },
  ],
};

// Karya/portofolio per kolaborator — shape returned by `kolaboratorApi.portofolio(id)`.
// Canonical: gambar_url, subsektor, featured (bukan is_featured), deskripsi
export const DUMMY_KOLABORATOR_PORTO = {
  m1: [
    { id:'p1', judul:'Batik Sekar Jagad Kontemporer', subsektor:'Kriya',   deskripsi:'Karya batik tulis dengan motif sekar jagad yang dipadukan dengan warna-warna natural dari tumbuhan lokal.', tahun:2024, gambar_url:null, featured:true  },
    { id:'p2', judul:'Koleksi Tenun Banyumas Vol.3',  subsektor:'Fashion', deskripsi:'Tenun lurik dengan motif diagonal hasil kolaborasi dengan pengrajin dari Cilacap.',                           tahun:2024, gambar_url:null, featured:false },
    { id:'p3', judul:'Instalasi Bambu Gedek',         subsektor:'Kriya',   deskripsi:'Instalasi seni dari bambu gedek dengan pola anyaman yang terinspirasi ornamen candi.',                       tahun:2023, gambar_url:null, featured:false },
  ],
  m2: [
    { id:'p4', judul:'Album Calung Kontemporer',      subsektor:'Musik',   deskripsi:'Karya musik calung kontemporer yang memadukan unsur tradisional dan modern.',                                  tahun:2024, gambar_url:null, featured:true  },
  ],
};

// Stories per kolaborator — shape returned by `kolaboratorApi.stories(id)`.
// Flattened = `aktivitasApi.list()` (admin moderation cross-author feed).
export const DUMMY_KOLABORATOR_AKTIVITAS = {
  m1: [
    { id:'s1', konten:'Proses pembuatan batik tulis hari ini...', media_url:null, tags:['Kriya','Batik'],    like_count:34, status:'aktif', created_at:'2025-04-10T08:00:00.000Z' },
    { id:'s2', konten:'Workshop batik shibori bersama siswa SMA!', media_url:null, tags:['Kriya','Workshop'], like_count:61, status:'aktif', created_at:'2025-04-07T10:00:00.000Z' },
  ],
  m2: [
    { id:'s3', konten:'Latihan calung untuk festival minggu depan...', media_url:null, tags:['Musik'],        like_count:22, status:'aktif', created_at:'2025-04-09T09:00:00.000Z' },
  ],
};

// ── Artisans list + maps ─────────────────────────────────────────────────────
// Canonical: subsektor[] (array), foto_url, cover_url, qris_url
export const DUMMY_ARTISANS = [
  { id:'t1', nama_usaha:'Batik Sari Rahayu',     pemilik:'Sari Dewi',      subsektor:['Kriya','Fashion'],       kota:'Banyumas',     no_hp:'08111234567', email:'sari@batik.com',    status:'aktif',   tanggal_daftar:'2024-03-10', foto_url:null, cover_url:null, qris_url:null, komisi_persen:15, total_penjualan:4500000, komisi_terkumpul:675000,  deskripsi:'Batik tulis dan printing motif Banyumasan.' },
  { id:'t2', nama_usaha:'Calung Mas',             pemilik:'Budi Hartono',   subsektor:['Seni Pertunjukan'],      kota:'Purwokerto',   no_hp:'08122345678', email:'calung@mas.com',    status:'aktif',   tanggal_daftar:'2024-04-01', foto_url:null, cover_url:null, qris_url:null, komisi_persen:10, total_penjualan:2800000, komisi_terkumpul:280000,  deskripsi:'Pertunjukan calung dan angklung tradisional.' },
  { id:'t3', nama_usaha:'Dawet Ayu Banjarnegara', pemilik:'Nia Rahma',      subsektor:['Kuliner'],               kota:'Banjarnegara', no_hp:'08133456789', email:'dawet@ayu.com',     status:'pending', tanggal_daftar:'2025-04-09', foto_url:null, cover_url:null, qris_url:null, komisi_persen:0,  total_penjualan:0,       komisi_terkumpul:0,       deskripsi:'Dawet ayu asli Banjarnegara.' },
  { id:'t4', nama_usaha:'Tenun Lurik Cilacap',    pemilik:'Hendra W.',      subsektor:['Kriya','Fashion'],       kota:'Cilacap',      no_hp:'08144567890', email:'lurik@cilacap.com', status:'aktif',   tanggal_daftar:'2024-05-15', foto_url:null, cover_url:null, qris_url:null, komisi_persen:12, total_penjualan:3200000, komisi_terkumpul:384000,  deskripsi:'Tenun lurik dengan corak khas pesisir selatan.' },
  { id:'t5', nama_usaha:'Keripik Tempe Mrisi',    pemilik:'Sulastri K.',    subsektor:['Kuliner'],               kota:'Purbalingga',  no_hp:'08155678901', email:'tempe@mrisi.com',   status:'aktif',   tanggal_daftar:'2024-06-20', foto_url:null, cover_url:null, qris_url:null, komisi_persen:10, total_penjualan:1900000, komisi_terkumpul:190000,  deskripsi:'Keripik tempe dan aneka olahan kedelai.' },
  { id:'t6', nama_usaha:'Wayang Golek Banyumas',  pemilik:'Dalang Suratno', subsektor:['Seni Pertunjukan'],      kota:'Banyumas',     no_hp:'08166789012', email:'wayang@dalang.com', status:'pending', tanggal_daftar:'2025-04-10', foto_url:null, cover_url:null, qris_url:null, komisi_persen:0,  total_penjualan:0,       komisi_terkumpul:0,       deskripsi:'Pertunjukan wayang golek gaya Banyumasan.' },
];

// Events per artisan — shape returned by `artisanApi.events(id)`.
export const DUMMY_ARTISAN_EVENTS = {
  t1: [
    { id:'et1', event_id:'e1', nama:'Festival Budaya Banyumasan 2025', tanggal:'2025-05-17', jam_mulai:'08:00', jam_selesai:'22:00', stand_id:'A-3', posisi_event:'A-3', status_request:'approved', assigned_by:'admin' },
    { id:'et2', event_id:'e4', nama:'Peken Banyumasan #12',             tanggal:'2025-03-20', jam_mulai:'16:00', jam_selesai:'22:00', stand_id:'A-2', posisi_event:'A-2', status_request:'approved', assigned_by:'admin' },
  ],
  t2: [
    { id:'et3', event_id:'e4', nama:'Peken Banyumasan #12',             tanggal:'2025-03-20', jam_mulai:'16:00', jam_selesai:'22:00', stand_id:'P-1', posisi_event:'P-1', status_request:'approved', assigned_by:'admin' },
  ],
  t5: [
    { id:'et4', event_id:'e1', nama:'Festival Budaya Banyumasan 2025', tanggal:'2025-05-17', jam_mulai:'08:00', jam_selesai:'22:00', stand_id:'B-1', posisi_event:'B-1', status_request:'approved', assigned_by:'self'  },
  ],
};

// ── Event-side relations ─────────────────────────────────────────────────────
// Kolaborator per event — shape returned by `eventApi.kolaborators(event_id)`.
export const DUMMY_EVENT_KOLABORATOR = {
  e1: [
    { id:'em1', kolaborator_id:'m1', nama:'Sari Dewi Rahayu', subsektor:['Kriya'], peran:'performer', status_kehadiran:'terdaftar', assigned_by:'admin' },
    { id:'em2', kolaborator_id:'m2', nama:'Ahmad Fauzi',      subsektor:['Musik'], peran:'performer', status_kehadiran:'terdaftar', assigned_by:'self'  },
  ],
  e2: [
    { id:'em5', kolaborator_id:'m4', nama:'Nurul Hidayah', subsektor:['Kuliner'], peran:'panitia', status_kehadiran:'terdaftar', assigned_by:'admin' },
  ],
  e3: [],
  e4: [
    { id:'em3', kolaborator_id:'m1', nama:'Sari Dewi Rahayu', subsektor:['Kriya'], peran:'performer', status_kehadiran:'hadir', assigned_by:'admin' },
    { id:'em4', kolaborator_id:'m2', nama:'Ahmad Fauzi',      subsektor:['Musik'], peran:'performer', status_kehadiran:'hadir', assigned_by:'admin' },
  ],
};

// Artisan per event — shape returned by `eventApi.artisans(event_id)`.
// Canonical: subsektor[], stand_id, status_request, posisi_event (alias untuk display)
export const DUMMY_EVENT_ARTISAN = {
  e1: [
    { id:'et1', artisan_id:'t1', nama_usaha:'Batik Sari Rahayu',   subsektor:['Kriya','Fashion'],  stand_id:'A-3', posisi_event:'A-3', status_request:'approved', assigned_by:'admin' },
    { id:'et4', artisan_id:'t5', nama_usaha:'Keripik Tempe Mrisi', subsektor:['Kuliner'],           stand_id:'B-1', posisi_event:'B-1', status_request:'approved', assigned_by:'self'  },
  ],
  e2: [],
  e3: [
    { id:'et3', artisan_id:'t4', nama_usaha:'Tenun Lurik Cilacap', subsektor:['Kriya','Fashion'],  stand_id:'A-1', posisi_event:'A-1', status_request:'approved', assigned_by:'admin' },
  ],
  e4: [
    { id:'et2', artisan_id:'t1', nama_usaha:'Batik Sari Rahayu',   subsektor:['Kriya','Fashion'],  stand_id:'A-2', posisi_event:'A-2', status_request:'approved', assigned_by:'admin' },
  ],
};

// ── Artisan Requests (permintaan artisan self-join per event) ─────────────────
// Shape dari `eventApi.artisanRequests(event_id)` — admin melihat & merespons ini.
export const DUMMY_ARTISAN_REQUESTS = {
  e1: [
    { id:'ar1', artisan_id:'t3', nama_usaha:'Dawet Ayu Banjarnegara', subsektor:['Kuliner'],          posisi_event:'B-3', status_request:'pending',        assigned_by:'self', change_request:null, created_at: new Date(now - 86_400_000).toISOString() },
    { id:'ar2', artisan_id:'t6', nama_usaha:'Wayang Golek Banyumas',  subsektor:['Seni Pertunjukan'], posisi_event:'C-2', status_request:'pending',        assigned_by:'self', change_request:null, created_at: new Date(now - 43_200_000).toISOString() },
  ],
  e2: [],
  e3: [
    { id:'ar3', artisan_id:'t3', nama_usaha:'Dawet Ayu Banjarnegara', subsektor:['Kuliner'],          posisi_event:'A-3', status_request:'pending_change', assigned_by:'self', change_request:'B-2', created_at: new Date(now - 7_200_000).toISOString() },
  ],
  e4: [],
};

// ── Canonical zone layout (A/B/C/P — harus sama dengan gate eventZones.js DEFAULT_GLOBAL_ZONES) ──
export const DUMMY_ZONES_GLOBAL = [
  { zona:'A', label:'Zona A – Kriya & Fashion',    warna:'#8B5E3C', stands: Array.from({ length: 8 },  (_, i) => ({ id:`A-${i+1}`, occupied:false })) },
  { zona:'B', label:'Zona B – Kuliner',             warna:'#D97706', stands: Array.from({ length: 10 }, (_, i) => ({ id:`B-${i+1}`, occupied:false })) },
  { zona:'C', label:'Zona C – Seni & Pertunjukan',  warna:'#7C3AED', stands: Array.from({ length: 4 },  (_, i) => ({ id:`C-${i+1}`, occupied:false })) },
  { zona:'P', label:'Zona P – Panggung',            warna:'#1D4ED8', stands: Array.from({ length: 2 },  (_, i) => ({ id:`P-${i+1}`, occupied:false })) },
];

// ── Admin notifikasi feed ─────────────────────────────────────────────────────
export const DUMMY_NOTIFIKASI_ADMIN = [
  { id:'na1', type:'artisan_request',      title:'Permintaan Join Event',      message:'Dawet Ayu Banjarnegara mengajukan permintaan ke Festival Budaya Banyumasan 2025.', read:false, link:'/events/e1', detail:null, created_at: new Date(now - 86_400_000).toISOString() },
  { id:'na2', type:'kolaborator_approved', title:'Kolaborator Baru Disetujui', message:'Rizky Pramesti berhasil disetujui menjadi kolaborator.',                            read:false, link:'/kolaborator', detail:null, created_at: new Date(now - 43_200_000).toISOString() },
  { id:'na3', type:'event_published',      title:'Event Dipublikasikan',       message:'Pameran Kriya Ekraf Regional berhasil dipublikasikan dan dapat dilihat publik.',    read:true,  link:'/events/e3', detail:null, created_at: new Date(now - 172_800_000).toISOString() },
];

// ── Artisan finance data (admin view) — returned by artisanApi.kas/stok/promo/qris ──
export const DUMMY_ARTISAN_KAS = {
  t1: [
    { id:'k1', jenis:'masuk',  kategori:'Penjualan',   pelanggan:'Pak Rudi',  barang:'Batik Sekar Jagad', qty:2, metode:'tunai',    ket:'', nominal:600000, tgl:'2025-04-10', saldo_after:1200000, bukti_url:null },
    { id:'k2', jenis:'keluar', kategori:'Bahan Baku',  pelanggan:null,        barang:'Malam batik',       qty:5, metode:'transfer', ket:'Beli malam', nominal:150000, tgl:'2025-04-08', saldo_after:600000, bukti_url:null },
  ],
  t2: [
    { id:'k3', jenis:'masuk',  kategori:'Penjualan',   pelanggan:'Ibu Sari',  barang:'Pertunjukan Calung',qty:1, metode:'tunai',    ket:'', nominal:500000, tgl:'2025-04-09', saldo_after:900000, bukti_url:null },
  ],
};

export const DUMMY_ARTISAN_RIWAYAT = {
  t1: [
    { id:'r1', pelanggan:'Pak Rudi',  barang:'Batik Sekar Jagad', qty:2, total:600000, metode:'tunai',    tgl:'2025-04-10' },
    { id:'r2', pelanggan:'Ibu Dewi',  barang:'Kain Jumputan',     qty:1, total:150000, metode:'transfer', tgl:'2025-04-05' },
  ],
  t2: [
    { id:'r3', pelanggan:'Ibu Sari',  barang:'Pertunjukan Calung',qty:1, total:500000, metode:'tunai',    tgl:'2025-04-09' },
  ],
};

export const DUMMY_ARTISAN_STOK = {
  t1: [
    { id:'s1', nama:'Batik Sekar Jagad', harga:300000, stok:12, kategori:'Kriya',   satuan:'lembar', deskripsi:'Batik tulis sekar jagad', stok_min:5 },
    { id:'s2', nama:'Kain Jumputan',     harga:150000, stok:8,  kategori:'Fashion', satuan:'meter',  deskripsi:'Kain jumputan pewarna alam', stok_min:3 },
  ],
  t2: [
    { id:'s3', nama:'Paket Pertunjukan Calung', harga:1500000, stok:5, kategori:'Seni Pertunjukan', satuan:'session', deskripsi:'Pertunjukan 60 menit', stok_min:1 },
  ],
};

export const DUMMY_ARTISAN_PROMO = {
  t1: [
    { id:'pr1', nama:'Promo Hari Batik', produk:'Batik Sekar Jagad', diskon:10, kategori:'Kriya', deskripsi:'Diskon 10% untuk Hari Batik Nasional', berlaku_start:'2025-10-02', berlaku_end:'2025-10-04', aktif:true },
  ],
  t2: [],
};

export const DUMMY_ARTISAN_QRIS = {
  t1: null,
  t2: null,
  t4: null,
  t5: null,
};
