"""
Supabase client instances.

- `supabase`       — anon-key client (used for RLS-governed reads)
- `supabase_admin` — service-role-key client (bypasses RLS; used for
                     register, admin writes, OTP, password reset)
"""

from supabase import create_client

from app.core.config import SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set")

# Anon key client — respects RLS policies
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Service-role key client — bypasses RLS (used for admin operations)
supabase_admin = None
if SUPABASE_SERVICE_ROLE_KEY:
    supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
