/**
 * The six Peken programs — single source of truth shared between
 * HomeScreen tiles and ProgramScreen rows so they always match.
 */
export const PROGRAMS = [
  {
    n: '01',
    slug: 'banyumasan-fashionshow',
    title: 'Banyumasan Fashionshow',
    image_url: '/assets/program-fashion.jpg',
    body: 'Peragaan busana bertema kebudayaan Banyumas dengan materi tenun, batik, dan karya desainer lokal.',
  },
  {
    n: '02',
    slug: 'bring-your-own-bowl',
    title: 'Bring Your Own Bowl',
    image_url: '/assets/program-byob.jpg',
    body: 'Gerakan zero-waste — pengunjung membawa wadah sendiri, artisan kuliner melayani tanpa kemasan sekali pakai.',
  },
  {
    n: '03',
    slug: 'local-market',
    title: 'Local Market',
    image_url: '/assets/program-local-market.jpg',
    body: 'Pasar produk kerajinan, makanan, dan kebutuhan rumah tangga dari Artisan Banyumasan.',
  },
  {
    n: '04',
    slug: 'pitutur-banyumasan',
    title: 'Pitutur Banyumasan',
    image_url: '/assets/program-pitutur.jpg',
    body: 'Panggung cerita lisan: kidung, wayang, geguritan. Dipandu oleh para pelaku pertunjukan setempat.',
  },
  {
    n: '05',
    slug: 'coffee-and-conversation',
    title: 'Coffee & Conversation',
    image_url: '/assets/program-coffee.jpg',
    body: 'Ruang ngopi lambat untuk percakapan lintas komunitas: seniman, perajin, pemerintah, akademisi.',
  },
  {
    n: '06',
    slug: 'makers-workshop',
    title: 'Makers Workshop',
    image_url: '/assets/program-makers.jpg',
    body: 'Workshop dua-jam: batik ecoprint, tenun mini, aksara Jawa, sablon manual. Terbuka untuk pengunjung.',
  },
];

/**
 * Shorter-copy variant used on HomeScreen tiles. Same IDs/titles
 * so clicking a tile can route to PROGRAM and the user sees the
 * expanded copy there.
 */
export const HOME_PROGRAMS = [
  {
    n: '01',
    slug: 'banyumasan-fashionshow',
    title: 'Banyumasan Fashionshow',
    image_url: '/assets/program-fashion.jpg',
    body: 'Peragaan busana bertema kebudayaan Banyumas — tenun, batik, karya desainer lokal.',
  },
  {
    n: '02',
    slug: 'bring-your-own-bowl',
    title: 'Bring Your Own Bowl',
    image_url: '/assets/program-byob.jpg',
    body: 'Gerakan zero-waste — pengunjung membawa wadah sendiri, artisan kuliner tanpa kemasan sekali pakai.',
  },
  {
    n: '03',
    slug: 'local-market',
    title: 'Local Market',
    image_url: '/assets/program-local-market.jpg',
    body: 'Pasar produk kerajinan, makanan, dan kebutuhan rumah tangga dari Artisan Banyumasan.',
  },
  {
    n: '04',
    slug: 'pitutur-banyumasan',
    title: 'Pitutur Banyumasan',
    image_url: '/assets/program-pitutur.jpg',
    body: 'Panggung cerita lisan: kidung, wayang, geguritan, dipandu pelaku pertunjukan setempat.',
  },
  {
    n: '05',
    slug: 'coffee-and-conversation',
    title: 'Coffee & Conversation',
    image_url: '/assets/program-coffee.jpg',
    body: 'Ruang ngopi lambat untuk percakapan lintas komunitas — seniman, perajin, akademisi.',
  },
  {
    n: '06',
    slug: 'makers-workshop',
    title: 'Makers Workshop',
    image_url: '/assets/program-makers.jpg',
    body: 'Workshop dua-jam: batik ecoprint, tenun mini, aksara Jawa, sablon manual.',
  },
];
