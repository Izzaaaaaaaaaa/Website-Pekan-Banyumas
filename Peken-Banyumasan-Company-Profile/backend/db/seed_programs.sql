-- =============================================================================
-- Seed: Programs — Peken Banyumasan (6 program resmi)
-- Jalankan di: Supabase SQL Editor
-- Idempotent: ON CONFLICT (slug) DO UPDATE
-- =============================================================================

DELETE FROM public.programs;

INSERT INTO public.programs (slug, nama, icon, icon_url, deskripsi, konten, urutan, aktif) VALUES
(
  'banyumasan-fashionshow',
  'Banyumasan Fashionshow',
  '👗',
  '/assets/program-fashion.jpg',
  'Peragaan busana bertema kebudayaan Banyumas dengan materi tenun, batik, dan karya desainer lokal.',
  '# Banyumasan Fashionshow

Peragaan busana yang menampilkan karya desainer lokal Banyumas dengan bahan tenun dan batik khas daerah. Setiap edisi menghadirkan koleksi baru yang memadukan tradisi dan kontemporer.',
  1,
  true
),
(
  'bring-your-own-bowl',
  'Bring Your Own Bowl',
  '🥣',
  '/assets/program-byob.jpg',
  'Gerakan zero-waste — pengunjung membawa wadah sendiri, tenant kuliner melayani tanpa kemasan sekali pakai.',
  '# Bring Your Own Bowl

Gerakan zero-waste Peken Banyumasan. Pengunjung diajak membawa wadah makan sendiri, sementara seluruh tenant kuliner berkomitmen melayani tanpa kemasan plastik sekali pakai.',
  2,
  true
),
(
  'local-market',
  'Local Market',
  '🛍️',
  '/assets/program-local-market.jpg',
  'Pasar produk kerajinan, makanan, dan kebutuhan rumah tangga dari UMKM Banyumasan.',
  '# Local Market

Pasar yang menampilkan produk-produk unggulan UMKM Banyumas — dari kerajinan tangan, makanan tradisional, hingga kebutuhan rumah tangga. Semua produk dipilih dari pelaku usaha lokal.',
  3,
  true
),
(
  'pitutur-banyumasan',
  'Pitutur Banyumasan',
  '🎭',
  '/assets/program-pitutur.jpg',
  'Panggung cerita lisan: kidung, wayang, geguritan. Dipandu oleh para pelaku pertunjukan setempat.',
  '# Pitutur Banyumasan

Panggung seni pertunjukan yang menampilkan kekayaan seni lisan Banyumas — kidung, wayang, geguritan, dan cerita rakyat. Dipandu oleh seniman dan pelaku pertunjukan lokal.',
  4,
  true
),
(
  'coffee-and-conversation',
  'Coffee & Conversation',
  '☕',
  '/assets/program-coffee.jpg',
  'Ruang ngopi lambat untuk percakapan lintas komunitas: seniman, perajin, pemerintah, akademisi.',
  '# Coffee & Conversation

Ruang diskusi santai sambil menikmati kopi lokal Banyumas. Mempertemukan seniman, perajin, pemerintah, dan akademisi dalam percakapan yang hangat dan produktif.',
  5,
  true
),
(
  'makers-workshop',
  'Makers Workshop',
  '🔨',
  '/assets/program-makers.jpg',
  'Workshop dua-jam: batik ecoprint, tenun mini, aksara Jawa, sablon manual. Terbuka untuk pengunjung.',
  '# Makers Workshop

Workshop praktis dua jam yang terbuka untuk semua pengunjung. Pilihan workshop meliputi batik ecoprint, tenun mini, aksara Jawa, dan sablon manual — dipandu langsung oleh pengrajin lokal.',
  6,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  nama       = EXCLUDED.nama,
  icon       = EXCLUDED.icon,
  icon_url   = EXCLUDED.icon_url,
  deskripsi  = EXCLUDED.deskripsi,
  konten     = EXCLUDED.konten,
  urutan     = EXCLUDED.urutan,
  aktif      = EXCLUDED.aktif,
  updated_at = NOW();
