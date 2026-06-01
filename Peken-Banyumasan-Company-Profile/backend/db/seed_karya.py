import sys
sys.path.insert(0, '.')
from app.db import supabase_admin

# Hapus semua karya lama (data test base64)
supabase_admin.table('karya').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
print('Cleared old karya')

# Ambil ID kolaborator yang ada
kol_res = supabase_admin.table('kolaborators').select('id, nama, slug').eq('status', 'aktif').execute()
kolaborators = kol_res.data or []
print(f'Found {len(kolaborators)} aktif kolaborators')

# Ambil ID artisan yang ada
art_res = supabase_admin.table('artisans').select('id, nama_usaha, slug').eq('status', 'aktif').execute()
artisans = art_res.data or []
print(f'Found {len(artisans)} aktif artisans')

if not kolaborators and not artisans:
    print('No aktif kolaborators or artisans found. Skipping karya seed.')
    print('Please add kolaborators/artisans with status=aktif first.')
    exit(0)

karya_list = []

# Seed karya untuk kolaborator pertama (jika ada)
if kolaborators:
    kol = kolaborators[0]
    karya_list += [
        {
            'owner_type': 'kolaborator',
            'owner_id': kol['id'],
            'judul': 'Senja di Pasar Lama',
            'subsektor': 'Fotografi',
            'deskripsi': 'Seri foto malam di kawasan Pasar Lama Banyumas. Diambil dengan kamera analog format 35mm.',
            'tahun': 2026,
            'gambar_url': '/assets/gallery-1.jpg',
            'featured': True,
        },
        {
            'owner_type': 'kolaborator',
            'owner_id': kol['id'],
            'judul': 'Wajah-Wajah Peken',
            'subsektor': 'Fotografi',
            'deskripsi': 'Potret para pedagang dan pengunjung Peken dalam momen kebersamaan yang autentik.',
            'tahun': 2025,
            'gambar_url': '/assets/gallery-perform-1.jpg',
            'featured': False,
        },
        {
            'owner_type': 'kolaborator',
            'owner_id': kol['id'],
            'judul': 'Ritual Panggung #47',
            'subsektor': 'Seni Pertunjukan',
            'deskripsi': 'Dokumentasi pertunjukan Pitutur Banyumasan edisi ke-47 di Taman Sari.',
            'tahun': 2025,
            'gambar_url': '/assets/gallery-perform-2.jpg',
            'featured': False,
        },
    ]

# Seed karya untuk artisan pertama (jika ada)
if artisans:
    art = artisans[0]
    karya_list += [
        {
            'owner_type': 'artisan',
            'owner_id': art['id'],
            'judul': 'Tenun Lurik Modular',
            'subsektor': 'Tekstil',
            'deskripsi': 'Eksperimen tenun lurik dengan modul lebar tetap untuk memudahkan kombinasi warna oleh desainer pakaian.',
            'tahun': 2025,
            'gambar_url': '/assets/gallery-2.jpg',
            'featured': True,
        },
        {
            'owner_type': 'artisan',
            'owner_id': art['id'],
            'judul': 'Wadah Bambu Lipat',
            'subsektor': 'Kriya',
            'deskripsi': 'Wadah makanan bambu lipat untuk mendukung Bring Your Own Bowl. Dibuat tanpa lem sintetis.',
            'tahun': 2024,
            'gambar_url': '/assets/gallery-4.jpg',
            'featured': False,
        },
    ]

# Karya tambahan pakai kolaborator pertama jika ada
if kolaborators:
    kol = kolaborators[0]
    karya_list += [
        {
            'owner_type': 'kolaborator',
            'owner_id': kol['id'],
            'judul': 'Mural Kota Lama',
            'subsektor': 'Seni Publik',
            'deskripsi': 'Mural permanen pada dinding selatan Taman Sari, dilukis selama dua minggu.',
            'tahun': 2024,
            'gambar_url': '/assets/gallery-5.jpg',
            'featured': False,
        },
        {
            'owner_type': 'kolaborator',
            'owner_id': kol['id'],
            'judul': 'Aksara Jawa Banyumasan',
            'subsektor': 'Desain Grafis',
            'deskripsi': 'Tipografi aksara Jawa varian Banyumasan, dirilis sebagai font terbuka.',
            'tahun': 2023,
            'gambar_url': '/assets/gallery-6.jpg',
            'featured': False,
        },
        {
            'owner_type': 'kolaborator',
            'owner_id': kol['id'],
            'judul': 'Edisi #54 — Geguritan Malam',
            'subsektor': 'Seni Pertunjukan',
            'deskripsi': 'Dokumentasi panggung geguritan malam pada Peken Edisi #54.',
            'tahun': 2025,
            'gambar_url': '/assets/gallery-3.jpg',
            'featured': False,
        },
    ]

if karya_list:
    res = supabase_admin.table('karya').insert(karya_list).execute()
    print(f'Inserted {len(res.data)} karya:')
    for k in res.data:
        print(f'  - {k["judul"]} ({k["owner_type"]}) -> {k["gambar_url"]}')
else:
    print('No karya to insert.')
