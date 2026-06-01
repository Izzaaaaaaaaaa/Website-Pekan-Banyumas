import sys
sys.path.insert(0, '.')
from app.db import supabase_admin

sections = [
    {
        "section": "about",
        "content": {
            "hero_title": "Peken lahir dari keinginan untuk menghidupkan kembali denyut kota lama melalui seni, pasar, dan kebersamaan.",
            "manifesto_left": "Peken Banyumasan tumbuh dari percakapan kecil di sudut Kota Lama — antara seniman pertunjukan, pelaku UMKM, dan warga sekitar yang ingin menghidupkan kembali ruang publik sebagai tempat bertemu, bukan sekadar berdagang.\n\nDari obrolan itu, lahir gerakan dwi-mingguan yang konsisten sejak Februari 2022 — sebuah ritual kolektif yang mempertemukan tradisi, kerajinan, dan kuliner Banyumasan dalam satu malam.",
            "manifesto_right": "Kami percaya kebudayaan tidak perlu dipajang di balik kaca. Ia hidup ketika dirayakan secara rutin, dalam skala kecil, oleh orang-orang yang merasa memilikinya.\n\nSetiap edisi Peken adalah usaha sederhana untuk menjaga warisan tetap berdetak — sambil membuka ruang bagi karya baru tumbuh di atasnya.",
            "intro": "Peken Banyumasan bukan event satu-malam — ia adalah mirapat, kata Banyumasan yang berarti perjumpaan rutin yang dijaga bersama. Setiap edisi mempertemukan seniman pertunjukan tradisional, perajin muda, pelaku UMKM, akademisi, hingga warga sekitar dalam satu ruang yang sama.",
            "quote": "Bukan pasar yang menjadi tujuan, melainkan perjumpaan yang menjadikan pasar itu bermakna.",
            "visi": "Menjadi ekosistem budaya dan ekonomi kreatif yang menjaga kearifan lokal Banyumas tetap berdetak — relevan, hidup, dan berkelanjutan.",
            "tujuan": "Menyediakan ruang publik dwi-mingguan yang mempertemukan pelaku seni, UMKM, dan masyarakat — sehingga warisan budaya Banyumasan dirawat melalui praktik bersama, bukan sekadar dipamerkan.",
            "sasaran": "Seniman pertunjukan tradisional, perajin & UMKM Banyumas, komunitas kreatif muda, akademisi, mitra pemerintah dan swasta, serta pengunjung lokal-regional yang menjadi audiens sekaligus pelaku.",
            "stats": [
                {"n": "86",   "label": "Edisi Peken diselenggarakan"},
                {"n": "240",  "label": "Seniman & kolektif tampil"},
                {"n": "1.2k", "label": "UMKM & tenant terlibat"},
                {"n": "38k",  "label": "Pengunjung setiap edisi"},
            ],
            "pillars": [
                {"n": "01", "label": "CULTURE",  "body": "Melestarikan kearifan lokal, seni pertunjukan tradisional, dan warisan budaya takbenda Banyumas sebagai fondasi gerakan."},
                {"n": "02", "label": "CREATIVE", "body": "Memberikan ruang bagi seniman, perajin, dan kolektif muda untuk berkarya dan bertemu audiens yang sebenarnya."},
                {"n": "03", "label": "CIRCULAR", "body": "Mendorong ekonomi berputar di dalam komunitas — dari tenant lokal, bahan lokal, hingga pengunjung lokal."},
            ],
            "helix": [
                {"name": "Government", "body": "Pemerintah Kabupaten Banyumas dan instansi terkait sebagai mitra kebijakan dan ruang publik."},
                {"name": "Academia",   "body": "Kampus dan lembaga riset sebagai sumber kajian, kurikulum, dan tenaga kurasi muda."},
                {"name": "Industry",   "body": "Pelaku usaha skala UMKM hingga korporasi sebagai mitra ekonomi dan ekosistem produk."},
                {"name": "Community",  "body": "Warga, kolektif seni, dan komunitas hobi sebagai inti gerakan dan audiens setia Peken."},
                {"name": "Media",      "body": "Jejaring media independen dan jurnalisme budaya sebagai penjaga narasi gerakan."},
                {"name": "Finance",    "body": "Mitra pembiayaan — bank, koperasi, hingga skema gotong royong — yang menjaga sirkulasi ekonomi tetap sehat."},
            ],
            "legalitas_dukungan": "Peken Banyumasan didukung oleh jaringan mitra lintas sektor: Pemerintah Kabupaten Banyumas dan Dinas Kebudayaan sebagai mitra kebijakan; Universitas Jenderal Soedirman sebagai mitra riset dan pendampingan kurasi; Bank BPD Jawa Tengah sebagai mitra pembiayaan UMKM; Komunitas Kota Lama Banyumas sebagai mitra penyelenggara di lokasi.",
            "legalitas_hukum": "Peken Banyumasan beroperasi di bawah payung Yayasan Peken Banyumasan, dengan landasan hukum nasional pada UU No. 5/2017 tentang Pemajuan Kebudayaan dan UU No. 24/2019 tentang Ekonomi Kreatif, serta payung daerah pada Peraturan Daerah Kabupaten Banyumas No. 6/2020 tentang Pemajuan Kebudayaan Daerah.",
        }
    },
    {
        "section": "tim",
        "content": {
            "members": [
                {
                    "photo": "/assets/tokoh-portrait-1.png",
                    "role": "FOUNDER",
                    "name": "Gilang Ramadhan, S.Sn., M.Ds.",
                    "title": "Founder & Program Director",
                    "bio": "Menggagas Peken pada Februari 2022 dan mengawal kurasi setiap edisi sejak. Latar belakang antropologi pertunjukan, dengan fokus pada kesenian Banyumasan kontemporer.",
                },
                {
                    "photo": "/assets/tokoh-portrait-2.png",
                    "role": "CURATOR",
                    "name": "Galih Putra Pamungkas, S.Sn., M.Sn.",
                    "title": "Curator — Artisan & UMKM",
                    "bio": "Mengkurasi tenant artisan dan UMKM yang masuk ke setiap edisi Peken. Sebelumnya menjalankan kolektif batik di Sokaraja; membangun program pendampingan tenant dari hulu ke hilir.",
                },
                {
                    "photo": "/assets/tokoh-portrait-3.png",
                    "role": "STRATEGIC PARTNER",
                    "name": "Jakarta Tisam S.STP, M.Si",
                    "title": "Strategic Partner & Community Lead",
                    "bio": "Menjaga jaringan kolaborator, sponsor, dan mitra institusi — kampus, pemerintah daerah, swasta. Memegang rasio kolaborasi yang sehat antar enam helix.",
                },
            ]
        }
    },
    {
        "section": "gallery",
        "content": {
            "images": [
                {"src": "/assets/gallery-1.jpg",         "label": "Edisi #01", "tahun": "2022"},
                {"src": "/assets/gallery-2.jpg",         "label": "Edisi #02", "tahun": "2022"},
                {"src": "/assets/gallery-3.jpg",         "label": "Edisi #03", "tahun": "2023"},
                {"src": "/assets/gallery-4.jpg",         "label": "Edisi #04", "tahun": "2023"},
                {"src": "/assets/gallery-5.jpg",         "label": "Edisi #05", "tahun": "2024"},
                {"src": "/assets/gallery-6.jpg",         "label": "Edisi #06", "tahun": "2024"},
                {"src": "/assets/gallery-perform-1.jpg", "label": "Edisi #07", "tahun": "2025"},
                {"src": "/assets/gallery-perform-2.jpg", "label": "Edisi #08", "tahun": "2025"},
                {"src": "/assets/banner-home-1.jpg",     "label": "Edisi #09", "tahun": "2025"},
                {"src": "/assets/banner-home-2.jpg",     "label": "Edisi #10", "tahun": "2026"},
            ]
        }
    }
]

for s in sections:
    res = supabase_admin.table("company_profile_sections").upsert(
        {"section": s["section"], "content": s["content"]},
        on_conflict="section"
    ).execute()
    print(f"Upserted section: {s['section']}")

print("Done.")
