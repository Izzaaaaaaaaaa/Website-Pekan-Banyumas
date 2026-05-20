"""
Add tipe_pengunjung column to visitors table via Supabase Management API.
Since we can't run raw SQL through the client library, we use the REST API.
"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Use Supabase REST API to execute SQL
sql = """
ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS tipe_pengunjung text DEFAULT 'manual';
"""

headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Execute via the Supabase SQL endpoint (rpc)
url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"

# Alternative: use the management API
# Since we can't directly run DDL through PostgREST, let's try a different approach
# We'll use the supabase-py client to create an RPC function first, or just
# directly call the management API

# Simplest approach: use httpx to call the Supabase Management API
mgmt_url = f"{SUPABASE_URL}/rest/v1/"

print("Attempting to add tipe_pengunjung column...")
print("Since PostgREST doesn't support DDL, please run this SQL in Supabase Dashboard:")
print()
print("=" * 60)
print(sql.strip())
print("=" * 60)
print()

# Try inserting a row with tipe_pengunjung to see if column exists
from supabase import create_client
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

try:
    # Test if column exists by trying to select it
    res = supabase.table("visitors").select("tipe_pengunjung").limit(1).execute()
    print("Column 'tipe_pengunjung' already exists!")
except Exception as e:
    if "tipe_pengunjung" in str(e):
        print("Column does NOT exist yet. Please add it via Supabase Dashboard SQL Editor.")
        print("Go to: https://supabase.com/dashboard > SQL Editor > New Query")
    else:
        print(f"Error: {e}")
