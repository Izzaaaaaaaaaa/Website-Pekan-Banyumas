import os

from supabase import create_client

from app.core.config import SUPABASE_URL
from app.db.supabase import supabase, supabase_admin, execute_with_retry
from fastapi import HTTPException

EMAIL_NOT_REGISTERED = "EMAIL_NOT_REGISTERED"
WRONG_PASSWORD = "WRONG_PASSWORD"

_supabase_admin = None


def get_supabase_admin():
    global _supabase_admin

    if _supabase_admin is None:
        service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not SUPABASE_URL or not service_role_key:
            raise RuntimeError("Supabase service role key belum dikonfigurasi")

        _supabase_admin = create_client(SUPABASE_URL, service_role_key)

    return _supabase_admin

def recreate_supabase_admin():
    global _supabase_admin
    import time
    print("SUPABASE ADMIN RECONNECTED")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not SUPABASE_URL or not service_role_key:
        raise RuntimeError("Supabase service role key belum dikonfigurasi")
    _supabase_admin = create_client(SUPABASE_URL, service_role_key)
    return _supabase_admin

def execute_admin_with_retry(query_func, max_retries=3):
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
                print(f"SUPABASE ADMIN CONNECTION ERROR: {err_str}. Retrying ({attempt+1}/{max_retries})...")
                recreate_supabase_admin()
                time.sleep(0.1)
                continue
            raise


def check_user_exists(email: str):
    try:
        admin_client = get_supabase_admin()
        normalized_email = email.strip().lower()
        page = 1
        per_page = 1000

        while True:
            def _list_users():
                return get_supabase_admin().auth.admin.list_users(page=page, per_page=per_page)
                
            users_response = execute_admin_with_retry(_list_users)
            users = getattr(users_response, "users", users_response)

            for user in users:
                user_email = getattr(user, "email", None)

                if user_email and user_email.lower() == normalized_email:
                    return True

            if len(users) < per_page:
                return False

            page += 1
    except Exception as exc:
        raise RuntimeError(
            "Gagal memeriksa user Supabase Auth menggunakan service role key"
        ) from exc


def login_user(email: str, password: str):
    is_exists = check_user_exists(email)

    if not is_exists:
        raise Exception(EMAIL_NOT_REGISTERED)

    try:
        def _sign_in():
            return supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
        response = execute_with_retry(_sign_in)

        return response
    except Exception:
        raise Exception(WRONG_PASSWORD)


def update_profile(user_id: str, data: dict):
    """
    Update own users_profile row (nama/jabatan/extra).

    Identity comes from the verified JWT (user_id). The write MUST use the
    service-role client: users_profile has no UPDATE RLS policy (SELECT-only
    by design), so the anon client always matched 0 rows here — that is why
    name changes never reached the DB.
    Returns the updated subset so the FE can refresh its stored user.
    """
    try:
        # Filter out None values
        update_data = {k: v for k, v in data.items() if v is not None}

        if not update_data:
            return {"message": "Tidak ada data yang diupdate"}

        res = execute_with_retry(lambda: supabase_admin.table("users_profile") \
            .update(update_data) \
            .eq("id", user_id) \
            .execute(), is_admin=True)

        if not res.data:
            raise HTTPException(404, "User tidak ditemukan")

        row = res.data[0]
        return {"nama": row.get("nama"), "jabatan": row.get("jabatan")}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error updating profile: {str(e)}")
