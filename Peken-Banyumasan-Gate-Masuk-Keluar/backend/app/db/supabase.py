from supabase import create_client
from app.core.config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY
from dotenv import load_dotenv
import os

load_dotenv()

from supabase.client import ClientOptions

# Public client - pakai anon key, untuk read operations & respek RLS
_public_instance = None

def get_supabase_public():
    """Get public Supabase client (anon key) - respects RLS policies."""
    global _public_instance
    if _public_instance is None:
        opts = ClientOptions(postgrest_client_timeout=30)
        _public_instance = create_client(SUPABASE_URL, SUPABASE_KEY, options=opts)
    return _public_instance

# Admin client - pakai service role key, untuk write operations bypass RLS
_admin_instance = None

def get_supabase_admin():
    """Get admin Supabase client (service role key) - bypasses RLS for writes."""
    global _admin_instance
    if _admin_instance is None:
        if not SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError("SUPABASE_SERVICE_ROLE_KEY is not set in environment")
        opts = ClientOptions(postgrest_client_timeout=30)
        _admin_instance = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, options=opts)
    return _admin_instance

def recreate_supabase_public():
    """Recreate public Supabase connection."""
    global _public_instance
    print("SUPABASE PUBLIC CLIENT RECONNECTED")
    opts = ClientOptions(postgrest_client_timeout=30)
    _public_instance = create_client(SUPABASE_URL, SUPABASE_KEY, options=opts)
    return _public_instance

def recreate_supabase_admin():
    """Recreate admin Supabase connection."""
    global _admin_instance
    print("SUPABASE ADMIN CLIENT RECONNECTED")
    if not SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("SUPABASE_SERVICE_ROLE_KEY is not set in environment")
    opts = ClientOptions(postgrest_client_timeout=30)
    _admin_instance = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, options=opts)
    return _admin_instance

# Backward compatibility proxy - now uses public client
class SupabaseProxy:
    def __getattr__(self, name):
        return getattr(get_supabase_public(), name)

supabase = SupabaseProxy()
supabase_admin = get_supabase_admin()  # Export admin client for use in services

def execute_with_retry(query_func, max_retries=3, is_admin=False):
    import time
    for attempt in range(max_retries):
        try:
            return query_func()
        except Exception as e:
            err_str = str(e)
            is_conn_error = any(msg in err_str for msg in [
                "ConnectionTerminated", "Server disconnected", 
                "StreamIDTooLowError", "EOF occurred", "ReadError", "RemoteProtocolError"
            ])
            if is_conn_error and attempt < max_retries - 1:
                print(f"SUPABASE CONNECTION ERROR: {err_str}. Retrying ({attempt+1}/{max_retries})...")
                if is_admin:
                    recreate_supabase_admin()
                else:
                    recreate_supabase_public()
                time.sleep(0.1)
                continue
            raise