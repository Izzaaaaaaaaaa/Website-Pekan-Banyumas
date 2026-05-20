import os
import sys
from dotenv import load_dotenv

# Load .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

from supabase import create_client, Client

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

email = "admin@pekenbanyumasan.id"
password = "AdminPassword123!"

try:
    # We will search for the user by email using list_users (or we can just update directly if we know ID)
    # Actually supabase-py admin api allows updating user by id, but not easily by email.
    # Let's get the user ID first.
    users = supabase.auth.admin.list_users()
    admin_id = None
    for u in users:
        if u.email == email:
            admin_id = u.id
            break

    if admin_id:
        supabase.auth.admin.update_user_by_id(admin_id, {
            "password": password,
            "user_metadata": {
                "nama": "Administrator",
                "role": "admin"
            },
            "app_metadata": {
                "role": "admin",
                "status": "aktif"
            }
        })
        print("Admin user updated successfully!")
    else:
        print("Admin user not found in list")
except Exception as e:
    print(f"Failed to update user: {e}")
