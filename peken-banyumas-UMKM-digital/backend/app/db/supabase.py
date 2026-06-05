import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from postgrest.exceptions import APIError

# ── Load .env dari root folder backend ───────────────────────────────────────
_env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=_env_path)

# ── Inisialisasi Supabase client ─────────────────────────────────────────────
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
# Service role key bypass RLS — hanya dipakai di backend (tidak pernah ke client)
SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "SUPABASE_URL dan SUPABASE_KEY wajib diisi di file .env\n"
        f"  .env path: {_env_path}"
    )

# Pakai service_role key kalau tersedia, fallback ke anon key
_active_key = SUPABASE_SERVICE_KEY if SUPABASE_SERVICE_KEY else SUPABASE_KEY
supabase: Client = create_client(SUPABASE_URL, _active_key)


# ── Helper: SELECT ────────────────────────────────────────────────────────────
def db_select(table: str, filters: dict = None, single: bool = False):
    """
    Ambil data dari tabel Supabase.
    """
    global supabase
    try:
        query = supabase.table(table).select("*")

        if filters:
            for col, val in filters.items():
                query = query.eq(col, val)

        if single:
            try:
                response = query.maybe_single().execute()
            except APIError as api_err:
                # postgrest-py melempar APIError code '204' saat tidak ada baris
                if str(api_err.code) == "204":
                    return None
                raise
            if response is None:
                return None
            return response.data
        else:
            response = query.execute()
            return response.data
    except APIError as api_err:
        if str(api_err.code) == "204":
            return None
        raise
    except Exception as e:
        # reconnect dan retry sekali jika koneksi terputus
        if "disconnected" in str(e).lower() or "RemoteProtocol" in str(type(e).__name__):
            supabase = create_client(SUPABASE_URL, _active_key)
            query = supabase.table(table).select("*")
            if filters:
                for col, val in filters.items():
                    query = query.eq(col, val)
            if single:
                try:
                    response = query.maybe_single().execute()
                except APIError as api_err:
                    if str(api_err.code) == "204":
                        return None
                    raise
                return response.data if response else None
            else:
                response = query.execute()
                return response.data
        raise


# ── Helper: INSERT ────────────────────────────────────────────────────────────
def db_insert(table: str, data: dict):
    """
    Insert satu baris ke tabel Supabase.

    Args:
        table : nama tabel di Supabase
        data  : dict data yang akan diinsert

    Returns:
        dict — baris yang baru diinsert
    """
    response = supabase.table(table).insert(data).execute()
    return response.data[0] if response.data else None


# ── Helper: UPDATE ────────────────────────────────────────────────────────────
def db_update(table: str, filters: dict, data: dict):
    """
    Update baris di tabel Supabase berdasarkan filter.

    Args:
        table   : nama tabel
        filters : dict kolom-nilai untuk filter .eq()
        data    : dict kolom yang akan diupdate

    Returns:
        list[dict] — baris yang terupdate
    """
    query = supabase.table(table).update(data)

    for col, val in filters.items():
        query = query.eq(col, val)

    response = query.execute()
    return response.data


# ── Helper: DELETE ────────────────────────────────────────────────────────────
def db_delete(table: str, filters: dict):
    """
    Hapus baris dari tabel Supabase berdasarkan filter.

    Args:
        table   : nama tabel
        filters : dict kolom-nilai untuk filter .eq()

    Returns:
        list[dict] — baris yang dihapus
    """
    query = supabase.table(table).delete()

    for col, val in filters.items():
        query = query.eq(col, val)

    response = query.execute()
    return response.data
