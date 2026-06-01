import sys
sys.path.insert(0, '.')
from app.db import supabase_admin

# Hapus semua programs lama
supabase_admin.table('programs').delete().neq('slug', '').execute()
print('Cleared old programs')

programs = [
    {
        'slug': 'banyumasan-fashionshow',
        'nama': 'Banyumasan Fashionshow',
        'icon': '',
        'icon_url': '/assets/program-fashion.jpg',
        'deskripsi': 'Peragaan busana bertema kebudayaan Banyumas dengan materi tenun, batik, dan karya desainer lokal.',
        'konten': '# Banyumasan Fashionshow\n\nPeragaan busana yang menampilkan karya desainer lokal Banyumas.',
        'urutan': 1,
        'aktif': True,
    },
    {
        'slug': 'bring-your-own-bowl',
        'nama': 'Bring Your Own Bowl',
        'icon': '',
        'icon_url': '/assets/program-byob.jpg',
        'deskripsi': 'Gerakan zero-waste — pengunjung membawa wadah sendiri, tenant kuliner melayani tanpa kemasan sekali pakai.',
        'konten': '# Bring Your Own Bowl\n\nGerakan zero-waste Peken Banyumasan.',
        'urutan': 2,
        'aktif': True,
    },
    {
        'slug': 'local-market',
        'nama': 'Local Market',
        'icon': '',
        'icon_url': '/assets/program-local-market.jpg',
        'deskripsi': 'Pasar produk kerajinan, makanan, dan kebutuhan rumah tangga dari UMKM Banyumasan.',
        'konten': '# Local Market\n\nPasar produk unggulan UMKM Banyumas.',
        'urutan': 3,
        'aktif': True,
    },
    {
        'slug': 'pitutur-banyumasan',
        'nama': 'Pitutur Banyumasan',
        'icon': '',
        'icon_url': '/assets/program-pitutur.jpg',
        'deskripsi': 'Panggung cerita lisan: kidung, wayang, geguritan. Dipandu oleh para pelaku pertunjukan setempat.',
        'konten': '# Pitutur Banyumasan\n\nPanggung seni pertunjukan kekayaan seni lisan Banyumas.',
        'urutan': 4,
        'aktif': True,
    },
    {
        'slug': 'coffee-and-conversation',
        'nama': 'Coffee & Conversation',
        'icon': '',
        'icon_url': '/assets/program-coffee.jpg',
        'deskripsi': 'Ruang ngopi lambat untuk percakapan lintas komunitas: seniman, perajin, pemerintah, akademisi.',
        'konten': '# Coffee & Conversation\n\nRuang diskusi santai sambil menikmati kopi lokal Banyumas.',
        'urutan': 5,
        'aktif': True,
    },
    {
        'slug': 'makers-workshop',
        'nama': 'Makers Workshop',
        'icon': '',
        'icon_url': '/assets/program-makers.jpg',
        'deskripsi': 'Workshop dua-jam: batik ecoprint, tenun mini, aksara Jawa, sablon manual. Terbuka untuk pengunjung.',
        'konten': '# Makers Workshop\n\nWorkshop praktis dua jam terbuka untuk semua pengunjung.',
        'urutan': 6,
        'aktif': True,
    },
]

res = supabase_admin.table('programs').insert(programs).execute()
print(f'Inserted {len(res.data)} programs:')
for p in res.data:
    print(f'  {p["urutan"]}. {p["nama"]} -> {p["icon_url"]}')
