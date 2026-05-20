from supabase import create_client
from app.core.config import SUPABASE_URL, SUPABASE_KEY
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Gunakan service_role_key agar backend bisa mem-bypass RLS untuk operasi CRUD
supabase_key = SUPABASE_SERVICE_ROLE_KEY if SUPABASE_SERVICE_ROLE_KEY else os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, supabase_key)