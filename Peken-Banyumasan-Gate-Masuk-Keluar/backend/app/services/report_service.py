from app.db.supabase import supabase
import csv
import io


# 🔥 EXPORT CSV (TETAP)
def export_gate_logs_csv(event_id: str):
    res = supabase.table("gate_logs") \
        .select("scan_time, gate_type, users(nama)") \
        .eq("event_id", event_id) \
        .order("scan_time", desc=True) \
        .execute()

    logs = res.data

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["Nama", "Waktu", "Status"])

    for log in logs:
        nama = log["users"]["nama"] if log.get("users") else "-"
        waktu = log["scan_time"]
        status = log["gate_type"]

        writer.writerow([nama, waktu, status])

    output.seek(0)
    return output


# 🔥 LIST REPORTS (FIXED)
def get_reports(event_id=None, tanggal=None):
    query = supabase.table("gate_logs") \
        .select("id, gate_type, scan_time, users(nama), events(nama)") \
        .order("scan_time", desc=True)

    if event_id:
        query = query.eq("event_id", event_id)

    # 🔥 FIX DI SINI
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