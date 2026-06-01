# Backend — Peken Banyumas UMKM Digital

FastAPI + Supabase backend untuk platform artisan Peken Banyumas.

## Stack
- **Framework**: FastAPI
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT (python-jose) + bcrypt
- **Python**: 3.11+

## Struktur
```
backend/
├── app/
│   ├── db/
│   │   ├── __init__.py
│   │   └── supabase.py        # Supabase client + helper db_select / db_insert
│   ├── models/
│   │   ├── __init__.py
│   │   └── model.py           # Pydantic response models
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py            # Login, Register, Lupa Password
│   │   ├── stok.py            # Manajemen Stok
│   │   ├── kas.py             # Buku Kas
│   │   ├── riwayat.py         # Riwayat Transaksi
│   │   ├── event.py           # Event & Pendaftaran Stand
│   │   ├── notifikasi.py      # Notifikasi
│   │   └── pengaturan.py      # Pengaturan Akun (profil, password, QRIS)
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── stok.py
│   │   ├── kas.py
│   │   ├── riwayat.py
│   │   ├── event.py
│   │   ├── notifikasi.py
│   │   └── pengaturan.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── stok_service.py
│   │   ├── kas_service.py
│   │   ├── riwayat_service.py
│   │   ├── event_service.py
│   │   ├── notifikasi_service.py
│   │   └── pengaturan_service.py
│   ├── __init__.py
│   ├── main.py
│   ├── middleware.py
│   └── notif_helper.py
├── .env
├── .gitignore
├── README.md
└── requirements.txt
```

## Cara Jalankan

```bash
# 1. Buat virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# 2. Install dependencies
pip install -r requirements.txt

# 3. Isi .env dengan kredensial Supabase kamu

# 4. Jalankan server
uvicorn app.main:app --reload
```

API docs tersedia di: http://localhost:8000/docs
