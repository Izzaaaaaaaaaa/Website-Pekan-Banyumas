/**
 * Public profile registry — maps work owners to their public profile data.
 * In production: replace with API fetch to /api/@:slug
 */

export const PROFILES = [
  {
    id: 'aji-pradana', slug: 'aji-pradana', nama: 'Aji Pradana',
    role: 'Kolaborator', subsektor: ['Fotografi', 'Dokumentasi'],
    kota: 'Banyumas', verified: true, foto: null, cover: null,
    bio: 'Fotografer dokumenter yang berfokus pada kebudayaan lokal Banyumas. Bekerja sama dengan Peken Banyumasan sejak 2022 sebagai fotografer tetap setiap edisi.',
    tahun_bergabung: '2022',
    stats: { karya: 12, story: 28, event: 4 },
    karya: [
      { id: 'k1', judul: 'Senja di Pasar Lama', img: '/assets/gallery-1.jpg', subsektor: 'Fotografi', tahun: '2026', deskripsi: 'Seri foto malam di kawasan Pasar Lama Banyumas. Diambil dengan kamera analog format 35mm.' },
      { id: 'k2', judul: 'Wajah-Wajah Peken', img: '/assets/gallery-perform-1.jpg', subsektor: 'Fotografi', tahun: '2025', deskripsi: 'Potret para pedagang dan pengunjung Peken dalam momen kebersamaan yang autentik.' },
      { id: 'k3', judul: 'Ritual Panggung #47', img: '/assets/gallery-perform-2.jpg', subsektor: 'Fotografi', tahun: '2025', deskripsi: 'Dokumentasi pertunjukan Pitutur Banyumasan edisi ke-47 di Taman Sari.' },
    ],
    story: [
      { id: 's1', konten: 'Malam ini mengabadikan Peken edisi ke-86. Selalu ada sudut baru yang belum pernah saya foto sebelumnya — itulah yang membuat saya terus kembali setiap edisi.', tanggal: '2025-04-10' },
      { id: 's2', konten: 'Menggunakan kamera film Kodak Ultramax 400 untuk seluruh seri "Senja di Pasar Lama". Ada sesuatu yang tidak bisa ditiru digital dari butiran film analog.', tanggal: '2025-03-22' },
    ],
    events: [
      { id: 'e1', nama: 'Peken Edisi #86', tanggal: '2025-04-10', lokasi: 'Taman Sari, Banyumas', status: 'selesai', peran: 'Fotografer Resmi', deskripsi: 'Dokumentasi penuh edisi ke-86 Peken Banyumasan.' },
      { id: 'e2', nama: 'Workshop Foto Analog', tanggal: '2025-06-15', lokasi: 'Studio Wignya, Purwokerto', status: 'upcoming', peran: 'Fasilitator', deskripsi: 'Workshop praktik fotografi analog untuk komunitas kreatif Banyumas.' },
    ],
  },
  {
    id: 'sanggar-lestari-sokaraja', slug: 'sanggar-lestari-sokaraja', nama: 'Sanggar Lestari Sokaraja',
    role: 'Artisan', subsektor: ['Tekstil', 'Tenun', 'Kriya'],
    kota: 'Sokaraja, Banyumas', verified: true, foto: null, cover: null,
    bio: 'Sanggar tenun lurik yang dijalankan oleh tiga generasi keluarga penenun dari Sokaraja. Berkomitmen menjaga teknik tenun tradisional sembari mengeksplorasi desain kontemporer.',
    tahun_bergabung: '2022',
    stats: { karya: 9, story: 14, event: 5 },
    karya: [
      { id: 'k1', judul: 'Tenun Lurik Modular', img: '/assets/gallery-2.jpg', subsektor: 'Tekstil', tahun: '2025', deskripsi: 'Eksperimen tenun lurik dengan modul lebar tetap untuk memudahkan kombinasi warna oleh desainer pakaian.' },
      { id: 'k2', judul: 'Lurik Diagonal Cilacap', img: '/assets/banner-home-1.jpg', subsektor: 'Tekstil', tahun: '2024', deskripsi: 'Koleksi tenun lurik dengan pola diagonal hasil kolaborasi dengan pengrajin Cilacap.' },
    ],
    story: [
      { id: 's1', konten: 'Tiga generasi, satu alat tenun. Nenek saya memulai ini 60 tahun lalu. Saya hanya meneruskan, tapi dengan visi yang lebih jauh ke depan. 🧵', tanggal: '2025-04-05' },
    ],
    events: [
      { id: 'e1', nama: 'Pameran Tenun Nusantara', tanggal: '2025-05-20', lokasi: 'Gedung Kesenian Banyumas', status: 'upcoming', peran: 'Peserta Pameran', deskripsi: 'Pameran koleksi tenun lurik bersama pengrajin dari berbagai daerah.' },
      { id: 'e2', nama: 'Peken Edisi #80', tanggal: '2024-10-12', lokasi: 'Taman Sari, Banyumas', status: 'selesai', peran: 'Artisan Resmi', deskripsi: 'Booth tenun lurik di edisi ke-80 Peken Banyumasan.' },
    ],
  },
  {
    id: 'komunitas-pitutur', slug: 'komunitas-pitutur', nama: 'Komunitas Pitutur',
    role: 'Kolaborator', subsektor: ['Seni Pertunjukan', 'Budaya Lokal'],
    kota: 'Banyumas', verified: true, foto: null, cover: null,
    bio: 'Komunitas pelestari seni lisan Banyumasan — kidung, wayang, geguritan. Tampil rutin di setiap edisi Peken sejak awal berdirinya gerakan ini.',
    tahun_bergabung: '2022',
    stats: { karya: 24, story: 31, event: 10 },
    karya: [
      { id: 'k1', judul: 'Edisi #54 — Geguritan Malam', img: '/assets/gallery-3.jpg', subsektor: 'Seni Pertunjukan', tahun: '2025', deskripsi: 'Dokumentasi panggung geguritan malam pada Peken Edisi #54.' },
      { id: 'k2', judul: 'Kidung Banyumasan #39', img: '/assets/gallery-perform-2.jpg', subsektor: 'Seni Pertunjukan', tahun: '2024', deskripsi: 'Penampilan kidung Banyumasan dipandu dalang muda dari Kecamatan Sokaraja.' },
    ],
    story: [
      { id: 's1', konten: 'Geguritan bukan hanya puisi — ia adalah cara orang Banyumas berbicara tentang dukanya, syukurnya, dan harapannya. Kami menjaga agar ia tetap hidup di telinga generasi baru.', tanggal: '2025-03-18' },
    ],
    events: [
      { id: 'e1', nama: 'Festival Seni Lisan Banyumasan', tanggal: '2025-07-08', lokasi: 'Pendopo Banyumas', status: 'upcoming', peran: 'Penampil Utama', deskripsi: 'Festival tahunan seni lisan Banyumasan.' },
      { id: 'e2', nama: 'Peken Edisi #54', tanggal: '2025-01-18', lokasi: 'Taman Sari', status: 'selesai', peran: 'Penampil', deskripsi: 'Penampilan geguritan malam di Peken #54.' },
    ],
  },
  {
    id: 'reka-studio', slug: 'reka-studio', nama: 'Reka Studio',
    role: 'Kolaborator', subsektor: ['Mode', 'Desain Kontemporer'],
    kota: 'Purwokerto, Banyumas', verified: true, foto: null, cover: null,
    bio: 'Studio desain mode yang mengadaptasi warisan batik dan tenun Banyumasan ke siluet pakaian kontemporer. Debut di Banyumasan Fashionshow Peken edisi ke-48.',
    tahun_bergabung: '2023',
    stats: { karya: 7, story: 19, event: 3 },
    karya: [
      { id: 'k1', judul: 'Banyumasan Streetwear Cap.1', img: '/assets/program-fashion.jpg', subsektor: 'Mode', tahun: '2025', deskripsi: 'Lini streetwear pertama dari Reka Studio yang mengadaptasi motif batik banyumasan.' },
    ],
    story: [
      { id: 's1', konten: 'Koleksi terbaru sudah siap. Kami menggabungkan motif kawung dengan siluet oversized — percaya atau tidak, hasilnya sangat Banyumas tapi juga sangat saat ini.', tanggal: '2025-04-08' },
    ],
    events: [
      { id: 'e1', nama: 'Banyumasan Fashionshow #48', tanggal: '2025-03-22', lokasi: 'Taman Sari', status: 'selesai', peran: 'Perancang Utama', deskripsi: 'Debut koleksi streetwear Banyumasan oleh Reka Studio.' },
    ],
  },
  {
    id: 'artisan-tirta-karya', slug: 'artisan-tirta-karya', nama: 'Artisan Tirta Karya',
    role: 'Artisan', subsektor: ['Kriya', 'Kerajinan Bambu'],
    kota: 'Banyumas', verified: true, foto: null, cover: null,
    bio: 'Usaha kerajinan bambu ramah lingkungan yang mendukung gerakan zero-waste Peken melalui produksi wadah makanan tanpa lem sintetis.',
    tahun_bergabung: '2023',
    stats: { karya: 5, story: 8, event: 3 },
    karya: [
      { id: 'k1', judul: 'Wadah Bambu Lipat', img: '/assets/gallery-4.jpg', subsektor: 'Kriya', tahun: '2024', deskripsi: 'Wadah makanan bambu lipat untuk mendukung Bring Your Own Bowl.' },
    ],
    story: [
      { id: 's1', konten: 'Setiap wadah bambu yang kami buat menggantikan sekitar 200 wadah plastik sekali pakai selama masa pakainya. Kecil, tapi nyata dampaknya. 🌿', tanggal: '2025-02-14' },
    ],
    events: [
      { id: 'e1', nama: 'Peken Zero-Waste Challenge', tanggal: '2024-12-07', lokasi: 'Taman Sari', status: 'selesai', peran: 'Mitra BYOB', deskripsi: 'Penyediaan wadah bambu untuk kampanye zero-waste Peken.' },
    ],
  },
  {
    id: 'kolektif-coret', slug: 'kolektif-coret', nama: 'Kolektif Coret',
    role: 'Kolaborator', subsektor: ['Seni Publik', 'Mural'],
    kota: 'Banyumas', verified: true, foto: null, cover: null,
    bio: 'Enam seniman muda yang percaya seni milik jalan, bukan galeri. Mural permanen mereka di Taman Sari menjadi latar ikonik Peken Banyumasan.',
    tahun_bergabung: '2023',
    stats: { karya: 6, story: 22, event: 3 },
    karya: [
      { id: 'k1', judul: 'Mural Kota Lama', img: '/assets/gallery-5.jpg', subsektor: 'Seni Publik', tahun: '2024', deskripsi: 'Mural permanen pada dinding selatan Taman Sari, dilukis selama dua minggu.' },
    ],
    story: [
      { id: 's1', konten: 'Dua minggu, enam tangan, satu tembok. Mural Kota Lama bukan hanya lukisan — ia adalah percakapan antara tradisi dan masa depan.', tanggal: '2024-11-02' },
    ],
    events: [
      { id: 'e1', nama: 'Open Call Mural Banyumas', tanggal: '2025-08-01', lokasi: 'Kota Lama Banyumas', status: 'upcoming', peran: 'Seniman Terpilih', deskripsi: 'Open call karya mural untuk ruang publik baru di kota lama.' },
    ],
  },
  {
    id: 'petani-kopi-baturraden', slug: 'petani-kopi-baturraden', nama: 'Petani Kopi Baturraden',
    role: 'Artisan', subsektor: ['Kuliner', 'Kopi Specialty'],
    kota: 'Baturraden, Banyumas', verified: true, foto: null, cover: null,
    bio: 'Kelompok tani kopi di ketinggian 800 mdpl lereng Gunung Slamet. Robusta single-origin yang disangrai sendiri dan disajikan rutin di Coffee & Conversation Peken.',
    tahun_bergabung: '2023',
    stats: { karya: 3, story: 11, event: 4 },
    karya: [
      { id: 'k1', judul: 'Kopi Robusta Banyumas', img: '/assets/program-coffee.jpg', subsektor: 'Kuliner', tahun: '2024', deskripsi: 'Robusta single-origin dari ketinggian 800 mdpl di Baturraden.' },
    ],
    story: [
      { id: 's1', konten: 'Musim panen kali ini luar biasa. Kondisi cuaca yang sempurna menghasilkan biji kopi dengan rasa lebih clean dan fruity dari biasanya.', tanggal: '2025-03-30' },
    ],
    events: [
      { id: 'e1', nama: 'Coffee & Conversation #12', tanggal: '2025-05-03', lokasi: 'Taman Sari', status: 'upcoming', peran: 'Penyedia Kopi', deskripsi: 'Sesi diskusi santai sambil menikmati kopi Baturraden.' },
      { id: 'e2', nama: 'Harvest Open Farm', tanggal: '2025-04-20', lokasi: 'Kebun Kopi, Baturraden', status: 'berlangsung', peran: 'Tuan Rumah', deskripsi: 'Kunjungan terbuka ke kebun kopi saat panen raya.' },
    ],
  },
  {
    id: 'studio-wignya', slug: 'studio-wignya', nama: 'Studio Wignya',
    role: 'Kolaborator', subsektor: ['Desain Grafis', 'Tipografi'],
    kota: 'Purwokerto, Banyumas', verified: true, foto: null, cover: null,
    bio: 'Studio desain yang berspesialisasi dalam identitas budaya Banyumasan. Merilis tipografi aksara Jawa sebagai font terbuka hasil riset bersama Universitas Jenderal Soedirman.',
    tahun_bergabung: '2022',
    stats: { karya: 4, story: 17, event: 3 },
    karya: [
      { id: 'k1', judul: 'Aksara Jawa Banyumasan', img: '/assets/gallery-6.jpg', subsektor: 'Desain Grafis', tahun: '2023', deskripsi: 'Tipografi aksara Jawa varian Banyumasan, dirilis sebagai font terbuka.' },
    ],
    story: [
      { id: 's1', konten: 'Font aksara Jawa Banyumasan sudah diunduh lebih dari 3.000 kali di seluruh dunia. Identitas lokal ternyata bisa berdampak global jika dikemas dengan baik. ✍️', tanggal: '2025-01-15' },
    ],
    events: [
      { id: 'e1', nama: 'Peken Brand Identity Workshop', tanggal: '2025-02-08', lokasi: 'Co-working UNSOED', status: 'selesai', peran: 'Fasilitator', deskripsi: 'Workshop identitas visual untuk Artisan lokal Banyumas.' },
    ],
  },
  {
    id: 'bu-tasrip-komunitas', slug: 'bu-tasrip-komunitas', nama: 'Bu Tasrip & Komunitas',
    role: 'Artisan', subsektor: ['Kriya', 'Anyaman'],
    kota: 'Desa Banjarsari, Banyumas', verified: false, foto: null, cover: null,
    bio: 'Komunitas perempuan Desa Banjarsari yang mengembangkan kerajinan anyaman pandan modular. Karya mereka bisa dirangkai menjadi berbagai produk fungsional.',
    tahun_bergabung: '2023',
    stats: { karya: 3, story: 6, event: 2 },
    karya: [
      { id: 'k1', judul: 'Anyaman Pandan Modular', img: '/assets/gallery-perform-1.jpg', subsektor: 'Kriya', tahun: '2023', deskripsi: 'Anyaman pandan modular yang bisa dirangkai menjadi tas, alas duduk, atau partisi ruang.' },
    ],
    story: [
      { id: 's1', konten: 'Dua puluh perempuan di desa kami kini punya penghasilan dari kerajinan anyaman pandan. Kecil tapi pasti — dan itu lebih dari cukup untuk membuat kami terus berkarya.', tanggal: '2024-09-20' },
    ],
    events: [
      { id: 'e1', nama: 'Peken Makers Market', tanggal: '2024-08-17', lokasi: 'Taman Sari', status: 'selesai', peran: 'Peserta', deskripsi: 'Penjualan anyaman pandan di pasar makers Peken.' },
    ],
  },
];

export const getProfileByOwner = (ownerNameOrSlug) => {
  if (!ownerNameOrSlug) return null;
  const slug = ownerNameOrSlug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return PROFILES.find(p => p.slug === slug) || {
    id: slug, slug,
    nama: ownerNameOrSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    role: 'Kolaborator', subsektor: [], kota: 'Banyumas', verified: false,
    foto: null, cover: null,
    bio: 'Kolaborator yang berkolaborasi dengan Peken Banyumasan.',
    tahun_bergabung: '2024',
    stats: { karya: 0, story: 0, event: 0 },
    karya: [], story: [], events: [],
  };
};

export const getProfileBySlug = (slug) => PROFILES.find(p => p.slug === slug) || null;
