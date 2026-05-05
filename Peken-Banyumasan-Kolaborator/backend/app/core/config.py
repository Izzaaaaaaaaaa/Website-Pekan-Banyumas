import os
from dotenv import load_dotenv

load_dotenv()

APP_NAME = os.getenv("APP_NAME", "Peken Banyumasan Kolaborator API")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # anon key
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Supabase JWT secret — used to verify tokens issued by Supabase Auth.
# Found in Supabase Dashboard → Project Settings → API → JWT Secret.
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
