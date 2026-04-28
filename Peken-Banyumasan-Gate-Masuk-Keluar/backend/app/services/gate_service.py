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
    
def get_gate_logs(event_id=None, tanggal=None, user_id=None, limit=20):
    try:
        query = supabase.table("gate_logs") \
            .select("id, gate_type, scan_time, users(nama), events(nama)") \
            .order("scan_time", desc=True) \
            .limit(limit)

        # 🔥 filter event
        if event_id:
            query = query.eq("event_id", event_id)

        # 🔥 filter user
        if user_id:
            query = query.eq("user_id", user_id)

        # 🔥 filter tanggal (FIX TIMESTAMP)
        if tanggal:
            query = query.gte("scan_time", f"{tanggal}T00:00:00") \
                         .lte("scan_time", f"{tanggal}T23:59:59")

        res = query.execute()

        data = res.data if res.data else []

        return [
            {
                "id": r["id"],
                "nama": r["users"]["nama"] if r.get("users") else None,
                "event": r["events"]["nama"] if r.get("events") else None,
                "status": r["gate_type"],
                "waktu": r["scan_time"]
            }
            for r in data
        ]

    except Exception as e:
        print("ERROR GATE LOGS:", e)
        return {"error": str(e)}