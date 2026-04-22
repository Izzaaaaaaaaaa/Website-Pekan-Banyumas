from app.db.supabase import supabase
import csv
import io

def export_gate_logs_csv(event_id: str):
    # ambil data
    res = supabase.table("gate_logs") \
        .select("scan_time, gate_type, users(nama)") \
        .eq("event_id", event_id) \
        .order("scan_time", desc=True) \
        .execute()

    logs = res.data

    # buat CSV di memory
    output = io.StringIO()
    writer = csv.writer(output)

    # header
    writer.writerow(["Nama", "Waktu", "Status"])

    # isi data
    for log in logs:
        nama = log["users"]["nama"] if log.get("users") else "-"
        waktu = log["scan_time"]
        status = log["gate_type"]

        writer.writerow([nama, waktu, status])

    output.seek(0)
    return output