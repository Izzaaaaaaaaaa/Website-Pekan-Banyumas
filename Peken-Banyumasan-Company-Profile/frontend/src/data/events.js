/**
 * Static fallback events — dipakai saat backend belum live atau tidak bisa diakses.
 * Data ini muncul di Beranda (Agenda Terdekat) via getUpcomingEvent().
 * Update tanggal setiap tahun agar agenda tidak menampilkan event lampau.
 */
export const EVENTS = [
  {
    id: 'ev-static-01',
    nama: 'Peken Banyumasan — Edisi Mei 2026',
    tanggal: '2026-05-17',
    tanggal_selesai: '2026-05-17',
    jam_mulai: '15:00',
    jam_selesai: '22:00',
    lokasi: 'Kawasan Kota Lama · Taman Sari, Banyumas',
    deskripsi:
      'Edisi Mei Peken Banyumasan menghadirkan pertunjukan seni lisan, pasar kriya lokal, ' +
      'dan sesi Coffee & Conversation. Terbuka untuk semua pengunjung — masuk gratis.',
    peserta_count: 0,
    kapasitas: 500,
    status: 'published',
  },
  {
    id: 'ev-static-02',
    nama: 'Peken Banyumasan — Edisi Juni 2026',
    tanggal: '2026-06-07',
    tanggal_selesai: '2026-06-07',
    jam_mulai: '15:00',
    jam_selesai: '22:00',
    lokasi: 'Kawasan Kota Lama · Taman Sari, Banyumas',
    deskripsi:
      'Edisi Juni menampilkan Banyumasan Fashionshow, workshop Makers, dan panggung ' +
      'Pitutur Banyumasan. Artisan dan kolaborator baru dipersilakan mendaftar.',
    peserta_count: 0,
    kapasitas: 500,
    status: 'published',
  },
  {
    id: 'ev-static-03',
    nama: 'Peken Banyumasan — Edisi Juli 2026',
    tanggal: '2026-07-05',
    tanggal_selesai: '2026-07-05',
    jam_mulai: '15:00',
    jam_selesai: '22:00',
    lokasi: 'Kawasan Kota Lama · Taman Sari, Banyumas',
    deskripsi:
      'Edisi pertengahan tahun dengan program Local Market yang diperluas — lebih dari ' +
      '60 artisan lokal Banyumasan berpartisipasi.',
    peserta_count: 0,
    kapasitas: 500,
    status: 'published',
  },
];

/**
 * Mengembalikan event upcoming terdekat dari EVENTS.
 * "Upcoming" = status published DAN tanggal >= hari ini.
 * @param {number} limit - jumlah event yang dikembalikan (default 1)
 * @returns {Array} sorted ascending by tanggal
 */
export function getUpcomingEvent(limit = 1) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return EVENTS
    .filter(e => e.status === 'published' && new Date(e.tanggal) >= today)
    .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))
    .slice(0, limit);
}
