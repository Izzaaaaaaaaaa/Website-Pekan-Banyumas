from supabase import create_client
from app.core.config import SUPABASE_URL, SUPABASE_KEY
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Gunakan service_role_key agar backend bisa mem-bypass RLS untuk operasi CRUD
supabase_key = SUPABASE_SERVICE_ROLE_KEY if SUPABASE_SERVICE_ROLE_KEY else os.getenv("SUPABASE_KEY")

_client_instance = None

def get_supabase():
    global _client_instance
    if _client_instance is None:
        _client_instance = create_client(SUPABASE_URL, supabase_key)
    return _client_instance

def recreate_supabase():
    global _client_instance
    print("SUPABASE RECONNECTED")
    _client_instance = create_client(SUPABASE_URL, supabase_key)
    return _client_instance

class SupabaseProxy:
    def __getattr__(self, name):
        return getattr(get_supabase(), name)

supabase = SupabaseProxy()

def execute_with_retry(query_func, max_retries=3):
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
                recreate_supabase()
                time.sleep(0.1)
                continue
            raise