from app.db.supabase import supabase

def scan_nfc(card_uid: str):
    # 1. cari kartu
    nfc = supabase.table("nfc_cards") \
        .select("*") \
        .eq("card_uid", card_uid) \
        .execute()

    if not nfc.data:
        return {"error": "Kartu tidak terdaftar"}

    user_id = nfc.data[0]["user_id"]

    # 2. ambil user
    user = supabase.table("users") \
        .select("*") \
        .eq("id", user_id) \
        .execute()

    if not user.data:
        return {"error": "User tidak ditemukan"}

    # 3. cek log terakhir
    last_log = supabase.table("gate_logs") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("scan_time", desc=True) \
        .limit(1) \
        .execute()

    if last_log.data and last_log.data[0]["gate_type"] == "masuk":
        next_type = "keluar"
    else:
        next_type = "masuk"

    # 4. insert log baru
    supabase.table("gate_logs").insert({
        "user_id": user_id,
        "gate_type": next_type
    }).execute()

    return {
        "status": next_type,
        "user": user.data[0]
    }