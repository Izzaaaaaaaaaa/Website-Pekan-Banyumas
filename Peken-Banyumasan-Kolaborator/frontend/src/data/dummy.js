// dummy.js — Single source of truth untuk semua dummy data frontend-member
// Ganti setiap fungsi di api.js dengan real API call saat backend siap

export const currentUser = {
  id: 'u001',
  nama: 'Sari Dewi Rahayu',
  email: 'sari.dewi@email.com',
  foto_url: null,
  bio: 'Pengrajin batik dari Banyumas. Sudah 12 tahun berkarya dengan motif-motif khas lokal yang menggabungkan filosofi Jawa dan estetika kontemporer.',
  subsektor: ['Kriya', 'Fashion'],
  kota: 'Banyumas',
  status: 'aktif',
  tanggal_daftar: '2024-03-15',
  total_karya: 18,
  total_aktivitas: 24,
  total_event: 6,
};

export const SUBSEKTORS = [
  'Kuliner','Kriya','Fashion','Musik','Seni Pertunjukan','Film & Animasi',
  'Fotografi','Desain Produk','Arsitektur','Periklanan','Penerbitan',
  'Seni Rupa','Televisi & Radio','Game','Aplikasi Digital','Riset & Pengembangan','Lainnya',
];

export const dummyPortofolio = [
  { id:'p1', judul:'Batik Sekar Jagad Kontemporer', subsektor:'Kriya', deskripsi:'Karya batik tulis dengan motif sekar jagad yang dipadukan dengan warna-warna natural dari tumbuhan lokal.', tahun:2024, gambar:null, featured:true },
  { id:'p2', judul:'Koleksi Tenun Banyumas Vol.3', subsektor:'Fashion', deskripsi:'Tenun lurik dengan motif diagonal hasil kolaborasi dengan pengrajin dari Cilacap.', tahun:2024, gambar:null, featured:false },
  { id:'p3', judul:'Instalasi Bambu Gedek', subsektor:'Kriya', deskripsi:'Instalasi seni dari bambu gedek dengan pola anyaman yang terinspirasi ornamen candi.', tahun:2023, gambar:null, featured:false },
  { id:'p4', judul:'Kain Jumputan Banyumasan Fusion', subsektor:'Fashion', deskripsi:'Eksplorasi teknik shibori Jepang pada kain katun lokal dengan pewarna alam.', tahun:2023, gambar:null, featured:false },
  { id:'p5', judul:'Lukisan Wayang Kontemporer', subsektor:'Seni Rupa', deskripsi:'Interpretasi ulang tokoh wayang Arjuna dalam gaya lukisan ekspresionistik.', tahun:2022, gambar:null, featured:false },
  { id:'p6', judul:'Aksesori Kayu Jati Minimalis', subsektor:'Kriya', deskripsi:'Rangkaian aksesori dari kayu jati sisa produksi dengan finishing natural oil.', tahun:2022, gambar:null, featured:false },
];

export const dummyAktivitas = [
  { id:'s1', konten:'Proses pembuatan batik tulis memang panjang, tapi setiap tetes malam di atas kain adalah bentuk meditasi bagi saya. Hari ini mengerjakan pesanan dari Jakarta — motif kawung dengan sentuhan warna indigo tua. 🌿', created_at:'2025-04-10', tags:['Kriya','Batik'], like_count:34 },
  { id:'s2', konten:'Workshop batik shibori bersama 15 siswa SMA kemarin luar biasa! Mereka sangat antusias belajar teknik ikat-celup. Senang sekali bisa berbagi pengetahuan kerajinan leluhur kepada generasi muda.', created_at:'2025-04-07', tags:['Kriya','Workshop'], like_count:61 },
  { id:'s3', konten:'Bahan-bahan alami untuk pewarna: daun indigo, kulit kayu mahoni, dan buah mangrove. Sudah seminggu mengeksplorasi campuran baru. Hasilnya... tunggu karya terbaru saya di galeri bulan depan! 🎨', created_at:'2025-04-02', tags:['Kriya','Riset'], like_count:45 },
  { id:'s4', konten:'Alhamdulillah, karya "Batik Sekar Jagad Kontemporer" resmi masuk koleksi Museum Tekstil Indonesia. Perjalanan panjang 3 tahun riset dan pengerjaan terbayar sudah. Terima kasih atas dukungan semua!', created_at:'2025-03-28', tags:['Kriya','Pencapaian'], like_count:189 },
];

// Single canonical event list — includes terdaftar, peran, assigned_by, dll.
// Dipakai oleh: Dashboard, Event page
export const dummyEvents = [
  {
    id:'e1', nama:'Festival Budaya Banyumasan 2025',
    tanggal:'2025-05-17', jam_mulai:'08:00', jam_selesai:'22:00', tanggal_selesai:'2025-05-19',
    lokasi:'Alun-Alun Purwokerto',
    status:'upcoming',                   // upcoming | berlangsung | selesai
    terdaftar:true, peran:'performer', assigned_by:'admin',
    deskripsi:'Festival tahunan menampilkan seni, kuliner, dan kerajinan khas Banyumas.',
    konten_lengkap:'Festival Budaya Banyumasan menghadirkan lebih dari 80 penampil dan 50 stand Artisan dari seluruh eks-Karesidenan Banyumas.',
    kapasitas:200, peserta_count:34,
    subsektor:['Kriya','Musik','Kuliner'],
    banner_url: null,
    lineup:[ {id:'m1', nama:'Sari Dewi'}, {id:'m2', nama:'Ahmad Fauzi'} ],
    artisan:[ {id:'t1', nama_usaha:'Batik Sari Rahayu', kategori:'Kriya & Fashion'} ],
    galeri:[],
  },
  {
    id:'e2', nama:'Workshop Batik & Tenun Nusantara',
    tanggal:'2025-04-26', jam_mulai:'09:00', jam_selesai:'17:00', tanggal_selesai:'2025-04-27',
    lokasi:'Gedung Kebudayaan Cilacap',
    status:'upcoming',
    terdaftar:true, peran:'panitia', assigned_by:'admin',
    deskripsi:'Pelatihan intensif 2 hari teknik batik tulis dan tenun lurik.',
    konten_lengkap:'Workshop ini dirancang untuk kolaborator yang ingin memperdalam teknik batik tulis dan tenun.',
    kapasitas:30, peserta_count:18,
    subsektor:['Kriya','Fashion'],
    banner_url: null,
    lineup:[], artisan:[], galeri:[],
  },
  {
    id:'e3', nama:'Pameran Kriya Ekraf Regional',
    tanggal:'2025-06-10', jam_mulai:'10:00', jam_selesai:'21:00', tanggal_selesai:'2025-06-12',
    lokasi:'Mall Cilacap Raya',
    status:'upcoming',
    terdaftar:false,
    deskripsi:'Pameran dan bazaar produk ekonomi kreatif se-eks Karesidenan Banyumas.',
    konten_lengkap:'Pameran terbesar tahun ini menampilkan lebih dari 100 produk unggulan.',
    kapasitas:500, peserta_count:12,
    subsektor:['Kriya','Desain Produk'],
    banner_url: null,
    lineup:[], artisan:[], galeri:[],
  },
  {
    id:'e4', nama:'Peken Banyumasan #12',
    tanggal:'2025-03-20', jam_mulai:'16:00', jam_selesai:'22:00', tanggal_selesai:'2025-03-20',
    lokasi:'Amphitheater GOR Satria',
    status:'selesai',
    terdaftar:true, peran:'performer', assigned_by:'self',
    deskripsi:'Pasar budaya mingguan dengan penampilan seniman lokal.',
    konten_lengkap:'Peken Banyumasan edisi ke-12 sukses digelar dengan ratusan pengunjung.',
    kapasitas:500, peserta_count:145,
    subsektor:['Musik','Kuliner'],
    banner_url: null,
    lineup:[], artisan:[], galeri:[],
  },
];

// Keep old names as aliases so nothing breaks
/** @deprecated gunakan dummyEvents */
export const dummyEvent = dummyEvents;
/** @deprecated gunakan dummyEvents */
export const dummyEventExtended = dummyEvents;

export const dummyNotifikasi = [
  { id:'n1', tipe:'event', pesan:'Pendaftaran kamu untuk "Festival Budaya Banyumasan 2025" telah dikonfirmasi.', waktu:'2 jam lalu', dibaca:false },
  { id:'n2', tipe:'system', pesan:'Profil kamu telah diverifikasi oleh admin. Sekarang tampil di direktori publik.', waktu:'1 hari lalu', dibaca:false },
  { id:'n3', tipe:'event', pesan:'"Workshop Batik & Tenun Nusantara" akan dimulai 3 hari lagi. Jangan lupa hadir!', waktu:'2 hari lalu', dibaca:true },
  { id:'n4', tipe:'system', pesan:'Karya portofolio "Batik Sekar Jagad Kontemporer" telah disetujui dan tampil di beranda.', waktu:'5 hari lalu', dibaca:true },
];
