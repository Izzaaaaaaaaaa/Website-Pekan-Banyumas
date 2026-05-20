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
    user = supabase.table("users_profile") \
        .select("*") \
        .eq("id", user_id) \
        .execute()

    if not user.data:
        raise HTTPException(404, "User tidak ditemukan")

    user_data = user.data[0]

    # 3. cek log terakhir (per event)
    last_log = supabase.table("visitors") \
        .select("waktu_masuk, waktu_keluar, status") \
        .eq("uid", card_uid) \
        .eq("event_id", event_id) \
        .order("waktu_masuk", desc=True) \
        .limit(1) \
        .execute()

    # 🔥 ANTI DOUBLE SCAN
    if last_log.data:
        last_action_str = last_log.data[0].get("waktu_keluar") if last_log.data[0].get("status") == "keluar" else last_log.data[0].get("waktu_masuk")
        if last_action_str:
            # Handle possible 'Z' in ISO format
            last_action_str = last_action_str.replace("Z", "+00:00")
            last_time = datetime.fromisoformat(last_action_str)
            now = datetime.now(last_time.tzinfo)
            if now - last_time < timedelta(seconds=5):
                raise HTTPException(400, "Terlalu cepat scan ulang")

    # Delegate to process_nfc_tap
    from app.services.dashboard_service import process_nfc_tap
    res = process_nfc_tap(uid=card_uid, timestamp=datetime.utcnow().isoformat(), event_id=event_id)

    return {
        "status": res.aksi,
        "event": event["nama"],
        "user": {
            "id": user_data["id"],
            "nama": user_data["nama"]
        }
    }
    
def get_gate_logs(event_id=None, tanggal=None, user_id=None, limit=20):
    try:
        query = supabase.table("visitors") \
            .select("*") \
            .order("waktu_masuk", desc=True) \
            .limit(limit)

        # 🔥 filter event
        if event_id:
            query = query.eq("event_id", event_id)

        # 🔥 filter tanggal (FIX TIMESTAMP)
        if tanggal:
            query = query.gte("waktu_masuk", f"{tanggal}T00:00:00") \
                         .lte("waktu_masuk", f"{tanggal}T23:59:59")

        res = query.execute()

        data = res.data if res.data else []

        return [
            {
                "id": r["id"],
                "nama": r.get("nama") or "Tamu",
                "event": "Event",
                "status": r["status"],
                "waktu": r["waktu_masuk"]
            }
            for r in data
        ]

    except Exception as e:
        print("ERROR GATE LOGS:", e)
        return {"error": str(e)}