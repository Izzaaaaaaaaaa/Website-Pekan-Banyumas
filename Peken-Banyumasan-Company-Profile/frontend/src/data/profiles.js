/**
 * Public profile registry — maps work owners to their public profile data.
 * In production: replace with API fetch to /api/public/profiles/:slug
 *
 * Shape canonical:
 *   - status enum('pending','aktif','suspended','rejected') — verified derived di FE: status === 'aktif'
 *   - tanggal_daftar: DATE string 'YYYY-MM-DD'
 *   - total_karya, total_story, total_event: flat (bukan nested stats:{})
 *   - karya[].tahun: INT
 *   - story[]: include media_url, tags[], like_count, status
 *   - events[].status: 'draft'|'published'|'berlangsung'|'selesai' — FE derives 'upcoming'
 *   - Kolaborator: subsektor[] (BEKRAF 17), karya[].subsektor STRING
 *   - Artisan:     kategori_usaha[] (UMKM 9), karya[].kategori_usaha STRING
 */

import { toSlug } from '../lib/slug.js';

export const PROFILES = [
  {
    id: 'aji-pradana', slug: 'aji-pradana', nama: 'Aji Pradana',
    role: 'kolaborator', subsektor: ['Fotografi', 'Lainnya'],
    kota: 'Banyumas', status: 'aktif', foto_url: null, cover_url: null,
    bio: 'Fotografer dokumenter yang berfokus pada kebudayaan lokal Banyumas. Bekerja sama dengan Peken Banyumasan sejak 2022 sebagai fotografer tetap setiap edisi.',
    tanggal_daftar: '2022-03-01',
    total_karya: 12, total_story: 28, total_event: 4,
    karya: [
      { id: 'k1', judul: 'Senja di Pasar Lama', gambar_url: '/assets/gallery-1.jpg', subsektor: 'Fotografi', tahun: 2026, deskripsi: 'Seri foto malam di kawasan Pasar Lama Banyumas. Diambil dengan kamera analog format 35mm.', featured: true },
      { id: 'k2', judul: 'Wajah-Wajah Peken', gambar_url: '/assets/gallery-perform-1.jpg', subsektor: 'Fotografi', tahun: 2025, deskripsi: 'Potret para pedagang dan pengunjung Peken dalam momen kebersamaan yang autentik.', featured: false },
      { id: 'k3', judul: 'Ritual Panggung #47', gambar_url: '/assets/gallery-perform-2.jpg', subsektor: 'Fotografi', tahun: 2025, deskripsi: 'Dokumentasi pertunjukan Pitutur Banyumasan edisi ke-47 di Taman Sari.', featured: false },
    ],
    story: [
      { id: 's1', konten: 'Malam ini mengabadikan Peken edisi ke-86. Selalu ada sudut baru yang belum pernah saya foto sebelumnya — itulah yang membuat saya terus kembali setiap edisi.', media_url: null, tags: ['Fotografi', 'Peken'], like_count: 42, status: 'aktif', created_at: '2025-04-10' },
      { id: 's2', konten: 'Menggunakan kamera film Kodak Ultramax 400 untuk seluruh seri "Senja di Pasar Lama". Ada sesuatu yang tidak bisa ditiru digital dari butiran film analog.', media_url: null, tags: ['Fotografi', 'Analog'], like_count: 31, status: 'aktif', created_at: '2025-03-22' },
    ],
    events: [
      { id: 'e1', nama: 'Peken Edisi #86', tanggal: '2025-04-10', lokasi: 'Taman Sari, Banyumas', status: 'selesai', peran: 'Fotografer Resmi', deskripsi: 'Dokumentasi penuh edisi ke-86 Peken Banyumasan.' },
      { id: 'e2', nama: 'Workshop Foto Analog', tanggal: '2025-06-15', lokasi: 'Studio Wignya, Purwokerto', status: 'published', peran: 'Fasilitator', deskripsi: 'Workshop praktik fotografi analog untuk komunitas kreatif Banyumas.' },
    ],
  },
  {
    id: 'sanggar-lestari-sokaraja', slug: 'sanggar-lestari-sokaraja', nama: 'Sanggar Lestari Sokaraja',
    role: 'artisan', kategori_usaha: ['Kriya'],
    kota: 'Sokaraja, Banyumas', status: 'aktif', foto_url: null, cover_url: null,
    bio: 'Sanggar tenun lurik yang dijalankan oleh tiga generasi keluarga penenun dari Sokaraja. Berkomitmen menjaga teknik tenun tradisional sembari mengeksplorasi desain kontemporer.',
    tanggal_daftar: '2022-05-15',
    total_karya: 9, total_story: 14, total_event: 5,
    karya: [
      { id: 'k1', judul: 'Tenun Lurik Modular', gambar_url: '/assets/gallery-2.jpg', kategori_usaha: 'Kriya', tahun: 2025, deskripsi: 'Eksperimen tenun lurik dengan modul lebar tetap untuk memudahkan kombinasi warna oleh desainer pakaian.', featured: true },
      { id: 'k2', judul: 'Lurik Diagonal Cilacap', gambar_url: '/assets/banner-home-1.jpg', kategori_usaha: 'Kriya', tahun: 2024, deskripsi: 'Koleksi tenun lurik dengan pola diagonal hasil kolaborasi dengan pengrajin Cilacap.', featured: false },
    ],
    story: [
      { id: 's1', konten: 'Tiga generasi, satu alat tenun. Nenek saya memulai ini 60 tahun lalu. Saya hanya meneruskan, tapi dengan visi yang lebih jauh ke depan. 🧵', media_url: null, tags: ['Tenun', 'Tradisi'], like_count: 58, status: 'aktif', created_at: '2025-04-05' },
    ],
    events: [
      { id: 'e1', nama: 'Pameran Tenun Nusantara', tanggal: '2025-05-20', lokasi: 'Gedung Kesenian Banyumas', status: 'published', peran: 'Peserta Pameran', deskripsi: 'Pameran koleksi tenun lurik bersama pengrajin dari berbagai daerah.' },
      { id: 'e2', nama: 'Peken Edisi #80', tanggal: '2024-10-12', lokasi: 'Taman Sari, Banyumas', status: 'selesai', peran: 'Artisan Resmi', deskripsi: 'Booth tenun lurik di edisi ke-80 Peken Banyumasan.' },
    ],
  },
  {
    id: 'komunitas-pitutur', slug: 'komunitas-pitutur', nama: 'Komunitas Pitutur',
    role: 'kolaborator', subsektor: ['Seni Pertunjukan', 'Lainnya'],
    kota: 'Banyumas', status: 'aktif', foto_url: null, cover_url: null,
    bio: 'Komunitas pelestari seni lisan Banyumasan — kidung, wayang, geguritan. Tampil rutin di setiap edisi Peken sejak awal berdirinya gerakan ini.',
    tanggal_daftar: '2022-02-10',
    total_karya: 24, total_story: 31, total_event: 10,
    karya: [
      { id: 'k1', judul: 'Edisi #54 — Geguritan Malam', gambar_url: '/assets/gallery-3.jpg', subsektor: 'Seni Pertunjukan', tahun: 2025, deskripsi: 'Dokumentasi panggung geguritan malam pada Peken Edisi #54.', featured: true },
      { id: 'k2', judul: 'Kidung Banyumasan #39', gambar_url: '/assets/gallery-perform-2.jpg', subsektor: 'Seni Pertunjukan', tahun: 2024, deskripsi: 'Penampilan kidung Banyumasan dipandu dalang muda dari Kecamatan Sokaraja.', featured: false },
    ],
    story: [
      { id: 's1', konten: 'Geguritan bukan hanya puisi — ia adalah cara orang Banyumas berbicara tentang dukanya, syukurnya, dan harapannya. Kami menjaga agar ia tetap hidup di telinga generasi baru.', media_url: null, tags: ['Seni Pertunjukan', 'Geguritan'], like_count: 87, status: 'aktif', created_at: '2025-03-18' },
    ],
    events: [
      { id: 'e1', nama: 'Festival Seni Lisan Banyumasan', tanggal: '2025-07-08', lokasi: 'Pendopo Banyumas', status: 'published', peran: 'Penampil Utama', deskripsi: 'Festival tahunan seni lisan Banyumasan.' },
      { id: 'e2', nama: 'Peken Edisi #54', tanggal: '2025-01-18', lokasi: 'Taman Sari', status: 'selesai', peran: 'Penampil', deskripsi: 'Penampilan geguritan malam di Peken #54.' },
    ],
  },
  {
    id: 'reka-studio', slug: 'reka-studio', nama: 'Reka Studio',
    role: 'kolaborator', subsektor: ['Fashion', 'Desain Produk'],
    kota: 'Purwokerto, Banyumas', status: 'aktif', foto_url: null, cover_url: null,
    bio: 'Studio desain mode yang mengadaptasi warisan batik dan tenun Banyumasan ke siluet pakaian kontemporer. Debut di Banyumasan Fashionshow Peken edisi ke-48.',
    tanggal_daftar: '2023-01-20',
    total_karya: 7, total_story: 19, total_event: 3,
    karya: [
      { id: 'k1', judul: 'Banyumasan Streetwear Cap.1', gambar_url: '/assets/program-fashion.jpg', subsektor: 'Fashion', tahun: 2025, deskripsi: 'Lini streetwear pertama dari Reka Studio yang mengadaptasi motif batik banyumasan.', featured: true },
    ],
    story: [
      { id: 's1', konten: 'Koleksi terbaru sudah siap. Kami menggabungkan motif kawung dengan siluet oversized — percaya atau tidak, hasilnya sangat Banyumas tapi juga sangat saat ini.', media_url: null, tags: ['Mode', 'Batik'], like_count: 73, status: 'aktif', created_at: '2025-04-08' },
    ],
    events: [
      { id: 'e1', nama: 'Banyumasan Fashionshow #48', tanggal: '2025-03-22', lokasi: 'Taman Sari', status: 'selesai', peran: 'Perancang Utama', deskripsi: 'Debut koleksi streetwear Banyumasan oleh Reka Studio.' },
    ],
  },
  {
    id: 'artisan-tirta-karya', slug: 'artisan-tirta-karya', nama: 'Artisan Tirta Karya',
    role: 'artisan', kategori_usaha: ['Kriya'],
    kota: 'Banyumas', status: 'aktif', foto_url: null, cover_url: null,
    bio: 'Usaha kerajinan bambu ramah lingkungan yang mendukung gerakan zero-waste Peken melalui produksi wadah makanan tanpa lem sintetis.',
    tanggal_daftar: '2023-04-01',
    total_karya: 5, total_story: 8, total_event: 3,
    karya: [
      { id: 'k1', judul: 'Wadah Bambu Lipat', gambar_url: '/assets/gallery-4.jpg', kategori_usaha: 'Kriya', tahun: 2024, deskripsi: 'Wadah makanan bambu lipat untuk mendukung Bring Your Own Bowl.', featured: true },
    ],
    story: [
      { id: 's1', konten: 'Setiap wadah bambu yang kami buat menggantikan sekitar 200 wadah plastik sekali pakai selama masa pakainya. Kecil, tapi nyata dampaknya. 🌿', media_url: null, tags: ['Kriya', 'ZeroWaste'], like_count: 45, status: 'aktif', created_at: '2025-02-14' },
    ],
    events: [
      { id: 'e1', nama: 'Peken Zero-Waste Challenge', tanggal: '2024-12-07', lokasi: 'Taman Sari', status: 'selesai', peran: 'Mitra BYOB', deskripsi: 'Penyediaan wadah bambu untuk kampanye zero-waste Peken.' },
    ],
  },
  {
    id: 'kolektif-coret', slug: 'kolektif-coret', nama: 'Kolektif Coret',
    role: 'kolaborator', subsektor: ['Seni Rupa', 'Desain Produk'],
    kota: 'Banyumas', status: 'aktif', foto_url: null, cover_url: null,
    bio: 'Enam seniman muda yang percaya seni milik jalan, bukan galeri. Mural permanen mereka di Taman Sari menjadi latar ikonik Peken Banyumasan.',
    tanggal_daftar: '2023-07-10',
    total_karya: 6, total_story: 22, total_event: 3,
    karya: [
      { id: 'k1', judul: 'Mural Kota Lama', gambar_url: '/assets/gallery-5.jpg', subsektor: 'Seni Rupa', tahun: 2024, deskripsi: 'Mural permanen pada dinding selatan Taman Sari, dilukis selama dua minggu.', featured: true },
    ],
    story: [
      { id: 's1', konten: 'Dua minggu, enam tangan, satu tembok. Mural Kota Lama bukan hanya lukisan — ia adalah percakapan antara tradisi dan masa depan.', media_url: null, tags: ['Mural', 'Seni Publik'], like_count: 112, status: 'aktif', created_at: '2024-11-02' },
    ],
    events: [
      { id: 'e1', nama: 'Open Call Mural Banyumas', tanggal: '2025-08-01', lokasi: 'Kota Lama Banyumas', status: 'published', peran: 'Seniman Terpilih', deskripsi: 'Open call karya mural untuk ruang publik baru di kota lama.' },
    ],
  },
  {
    id: 'petani-kopi-baturraden', slug: 'petani-kopi-baturraden', nama: 'Petani Kopi Baturraden',
    role: 'artisan', kategori_usaha: ['F&B / Kuliner'],
    kota: 'Baturraden, Banyumas', status: 'aktif', foto_url: null, cover_url: null,
    bio: 'Kelompok tani kopi di ketinggian 800 mdpl lereng Gunung Slamet. Robusta single-origin yang disangrai sendiri dan disajikan rutin di Coffee & Conversation Peken.',
    tanggal_daftar: '2023-09-05',
    total_karya: 3, total_story: 11, total_event: 4,
    karya: [
      { id: 'k1', judul: 'Kopi Robusta Banyumas', gambar_url: '/assets/program-coffee.jpg', kategori_usaha: 'F&B / Kuliner', tahun: 2024, deskripsi: 'Robusta single-origin dari ketinggian 800 mdpl di Baturraden.', featured: true },
    ],
    story: [
      { id: 's1', konten: 'Musim panen kali ini luar biasa. Kondisi cuaca yang sempurna menghasilkan biji kopi dengan rasa lebih clean dan fruity dari biasanya.', media_url: null, tags: ['Kopi', 'Panen'], like_count: 29, status: 'aktif', created_at: '2025-03-30' },
    ],
    events: [
      { id: 'e1', nama: 'Coffee & Conversation #12', tanggal: '2025-05-03', lokasi: 'Taman Sari', status: 'published', peran: 'Penyedia Kopi', deskripsi: 'Sesi diskusi santai sambil menikmati kopi Baturraden.' },
      { id: 'e2', nama: 'Harvest Open Farm', tanggal: '2025-04-20', lokasi: 'Kebun Kopi, Baturraden', status: 'berlangsung', peran: 'Tuan Rumah', deskripsi: 'Kunjungan terbuka ke kebun kopi saat panen raya.' },
    ],
  },
  {
    id: 'studio-wignya', slug: 'studio-wignya', nama: 'Studio Wignya',
    role: 'kolaborator', subsektor: ['Desain Produk', 'Seni Rupa'],
    kota: 'Purwokerto, Banyumas', status: 'aktif', foto_url: null, cover_url: null,
    bio: 'Studio desain yang berspesialisasi dalam identitas budaya Banyumasan. Merilis tipografi aksara Jawa sebagai font terbuka hasil riset bersama Universitas Jenderal Soedirman.',
    tanggal_daftar: '2022-08-20',
    total_karya: 4, total_story: 17, total_event: 3,
    karya: [
      { id: 'k1', judul: 'Aksara Jawa Banyumasan', gambar_url: '/assets/gallery-6.jpg', subsektor: 'Desain Produk', tahun: 2023, deskripsi: 'Tipografi aksara Jawa varian Banyumasan, dirilis sebagai font terbuka.', featured: true },
    ],
    story: [
      { id: 's1', konten: 'Font aksara Jawa Banyumasan sudah diunduh lebih dari 3.000 kali di seluruh dunia. Identitas lokal ternyata bisa berdampak global jika dikemas dengan baik. ✍️', media_url: null, tags: ['Desain Grafis', 'Aksara'], like_count: 63, status: 'aktif', created_at: '2025-01-15' },
    ],
    events: [
      { id: 'e1', nama: 'Peken Brand Identity Workshop', tanggal: '2025-02-08', lokasi: 'Co-working UNSOED', status: 'selesai', peran: 'Fasilitator', deskripsi: 'Workshop identitas visual untuk Artisan lokal Banyumas.' },
    ],
  },
  {
    id: 'bu-tasrip-komunitas', slug: 'bu-tasrip-komunitas', nama: 'Bu Tasrip & Komunitas',
    role: 'artisan', kategori_usaha: ['Kriya'],
    kota: 'Desa Banjarsari, Banyumas', status: 'pending', foto_url: null, cover_url: null,
    bio: 'Komunitas perempuan Desa Banjarsari yang mengembangkan kerajinan anyaman pandan modular. Karya mereka bisa dirangkai menjadi berbagai produk fungsional.',
    tanggal_daftar: '2023-06-01',
    total_karya: 3, total_story: 6, total_event: 2,
    karya: [
      { id: 'k1', judul: 'Anyaman Pandan Modular', gambar_url: '/assets/gallery-perform-1.jpg', kategori_usaha: 'Kriya', tahun: 2023, deskripsi: 'Anyaman pandan modular yang bisa dirangkai menjadi tas, alas duduk, atau partisi ruang.', featured: true },
    ],
    story: [
      { id: 's1', konten: 'Dua puluh perempuan di desa kami kini punya penghasilan dari kerajinan anyaman pandan. Kecil tapi pasti — dan itu lebih dari cukup untuk membuat kami terus berkarya.', media_url: null, tags: ['Kriya', 'Komunitas'], like_count: 94, status: 'aktif', created_at: '2024-09-20' },
    ],
    events: [
      { id: 'e1', nama: 'Peken Makers Market', tanggal: '2024-08-17', lokasi: 'Taman Sari', status: 'selesai', peran: 'Peserta', deskripsi: 'Penjualan anyaman pandan di pasar makers Peken.' },
    ],
  },
];

export const getProfileByOwner = (ownerNameOrSlug) => {
  if (!ownerNameOrSlug) return null;
  const slug = toSlug(ownerNameOrSlug);
  return PROFILES.find(p => p.slug === slug) || {
    id: slug, slug,
    nama: ownerNameOrSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    role: 'kolaborator', subsektor: [], kota: 'Banyumas', status: 'aktif',
    foto_url: null, cover_url: null,
    bio: 'Kolaborator yang berkolaborasi dengan Peken Banyumasan.',
    tanggal_daftar: '2024-01-01',
    total_karya: 0, total_story: 0, total_event: 0,
    karya: [], story: [], events: [],
  };
};

export const getProfileBySlug = (slug) => PROFILES.find(p => p.slug === slug) || null;
