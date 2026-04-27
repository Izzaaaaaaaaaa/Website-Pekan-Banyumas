from app.db.supabase import supabase
from fastapi import HTTPException
from datetime import datetime, timedelta

# 🔥 import event service
from app.services.event_service import get_active_event


def scan_nfc(card_uid: str):
    # 🔥 ambil event aktif
    event = get_active_event()

    if not event:
        raise HTTPException(404, "Tidak ada event aktif")

    event_id = event["id"]

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

    # 3. cek log terakhir (per event)
    last_log = supabase.table("gate_logs") \
        .select("*") \
        .eq("user_id", user_id) \
        .eq("event_id", event_id) \
        .order("scan_time", desc=True) \
        .limit(1) \
        .execute()

    # 🔥 ANTI DOUBLE SCAN
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
        "event": event["nama"],
        "user": {
            "id": user_data["id"],
            "nama": user_data["nama"]
        }
    }
    
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

    return [
        {
            "id": g["id"],
            "nama": g["users"]["nama"] if g.get("users") else None,
            "status": g["gate_type"],
            "waktu": g["scan_time"]
        }
        for g in res.data
    ]