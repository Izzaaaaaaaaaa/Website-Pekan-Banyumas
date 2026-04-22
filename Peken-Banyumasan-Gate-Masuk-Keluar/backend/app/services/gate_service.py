from app.db.supabase import supabase
from fastapi import HTTPException
from datetime import datetime, timedelta


# 🔥 SCAN NFC (CORE SYSTEM)
def scan_nfc(card_uid: str, event_id: str):
    # 1. cari kartu
    nfc = supabase.table("nfc_cards") \
        .select("*") \
        .eq("card_uid", card_uid) \
        .execute()

    if not nfc.data:
        raise HTTPException(404, "Kartu tidak terdaftar")

    user_id = nfc.data[0]["user_id"]

    # 2. ambil user
    user = supabase.table("users") \
        .select("*") \
        .eq("id", user_id) \
        .execute()

    if not user.data:
        raise HTTPException(404, "User tidak ditemukan")

    user_data = user.data[0]

    # 3. cek log terakhir (per event 🔥)
    last_log = supabase.table("gate_logs") \
        .select("*") \
        .eq("user_id", user_id) \
        .eq("event_id", event_id) \
        .order("scan_time", desc=True) \
        .limit(1) \
        .execute()

    # 🔥 ANTI DOUBLE SCAN (5 detik)
    if last_log.data:
        last_time = datetime.fromisoformat(last_log.data[0]["scan_time"])
        now = datetime.utcnow()

        if now - last_time < timedelta(seconds=5):
            raise HTTPException(400, "Terlalu cepat scan ulang")

    # 4. tentukan masuk / keluar
    if last_log.data and last_log.data[0]["gate_type"] == "masuk":
        next_type = "keluar"
    else:
        next_type = "masuk"

    # 5. insert log
    supabase.table("gate_logs").insert({
        "user_id": user_id,
        "gate_type": next_type,
        "event_id": event_id
    }).execute()

    return {
        "status": next_type,
        "user": {
            "id": user_data["id"],
            "nama": user_data["nama"]
        }
    }


# 🔥 GET GATE LOGS
def get_gate_logs(gate_type=None, limit=20, event_id=None):
    query = supabase.table("gate_logs") \
        .select("*, users(nama)") \
        .order("scan_time", desc=True) \
        .limit(limit)

    if gate_type:
        query = query.eq("gate_type", gate_type)

    if event_id:
        query = query.eq("event_id", event_id)

    res = query.execute()

    # 🔥 mapping biar clean
    return [
        {
            "id": g["id"],
            "nama": g["users"]["nama"] if g.get("users") else None,
            "status": g["gate_type"],
            "waktu": g["scan_time"]
        }
        for g in res.data
    ]