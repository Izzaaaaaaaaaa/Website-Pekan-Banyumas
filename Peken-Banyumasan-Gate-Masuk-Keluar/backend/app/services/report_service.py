from app.db.supabase import supabase_admin
from fastapi import HTTPException
import csv
import io


def get_visitor_report(event_id: str = None, tanggal: str = None):
    """Get visitor report for an event/date."""
    try:
        query = supabase_admin.table("visitors").select("*").order("waktu_masuk", desc=True)

        if event_id:
            query = query.eq("event_id", event_id)

        if tanggal:
            query = query.gte("waktu_masuk", f"{tanggal}T00:00:00") \
                        .lt("waktu_masuk", f"{tanggal}T23:59:59")

        res = query.execute()
        logs = res.data if res.data else []

        total_masuk = len(logs)
        total_keluar = len([l for l in logs if l.get("status") == "keluar"])
        di_dalam = len([l for l in logs if l.get("status") == "di_dalam"])

        # Get event name if event_id provided
        event_name = ""
        if event_id:
            event_res = supabase_admin.table("events").select("nama").eq("id", event_id).single().execute()
            event_name = event_res.data.get("nama", "") if event_res.data else ""

        return {
            "nama": event_name,
            "tanggal_range": [tanggal] if tanggal else [],
            "rows": logs,
            "total_masuk": total_masuk,
            "total_keluar": total_keluar,
            "di_dalam": di_dalam
        }

    except Exception as e:
        raise HTTPException(500, f"Error fetching visitor report: {str(e)}")


def get_artisan_report(event_id: str = None):
    """Get artisan revenue report."""
    try:
        # Query artisans with financial summary
        artisans_query = supabase_admin.table("artisans").select("*")
        if event_id:
            # Only get artisans assigned to this event
            ea_data = supabase_admin.table("event_artisans") \
                .select("artisan_id") \
                .eq("event_id", event_id) \
                .eq("status_request", "approved") \
                .execute().data or []
                
            artisan_ids = [ea["artisan_id"] for ea in ea_data if ea.get("artisan_id")]
            if not artisan_ids:
                return []
                
            artisans_query = artisans_query.in_("id", artisan_ids)

        res = artisans_query.execute()
        artisans = res.data if res.data else []

        report_rows = []
        for artisan in artisans:
            artisan_id = artisan["id"]
            
            # Get last stand assignment
            stand_res = supabase_admin.table("event_artisans") \
                .select("stand_id") \
                .eq("artisan_id", artisan_id) \
                .order("created_at", desc=True) \
                .limit(1) \
                .execute()

            stand_terakhir = stand_res.data[0].get("stand_id") if stand_res.data else None

            # Count transactions from kas
            kas_res = supabase_admin.table("kas") \
                .select("id") \
                .eq("artisan_id", artisan_id) \
                .eq("jenis", "masuk") \
                .execute()
            transaksi_count = len(kas_res.data or [])
            
            # Count events
            events_res = supabase_admin.table("event_artisans") \
                .select("id") \
                .eq("artisan_id", artisan_id) \
                .eq("status_request", "approved") \
                .execute()
            event_count = len(events_res.data or [])

            row = {
                "id": artisan_id,
                "nama_usaha": artisan.get("nama_usaha"),
                "kategori": ", ".join(artisan.get("kategori_usaha") or []),
                "omset": artisan.get("total_penjualan", 0),
                "komisi_persen": artisan.get("komisi_persen", 0),
                "transaksi": transaksi_count,
                "event_count": event_count,
                "stand_terakhir": stand_terakhir
            }
            report_rows.append(row)

        return report_rows

    except Exception as e:
        raise HTTPException(500, f"Error fetching artisan report: {str(e)}")


def get_accumulation_report(event_id: str = None):
    """Get event accumulation report."""
    try:
        events_query = supabase_admin.table("events").select("*")
        if event_id:
            events_query = events_query.eq("id", event_id)

        res = events_query.order("tanggal", desc=True).execute()
        events = res.data if res.data else []

        report_rows = []
        for event in events:
            # Count visitors
            visitors_res = supabase_admin.table("visitors") \
                .select("id") \
                .eq("event_id", event["id"]) \
                .execute()
            pengunjung = len(visitors_res.data or [])

            # Count approved artisans
            artisans_res = supabase_admin.table("event_artisans") \
                .select("artisan_id") \
                .eq("event_id", event["id"]) \
                .eq("status_request", "approved") \
                .execute()
            artisan_count = len(set(a.get("artisan_id") for a in (artisans_res.data or [])))

            # Count kolaborators
            kolabs_res = supabase_admin.table("event_kolaborators") \
                .select("kolaborator_id") \
                .eq("event_id", event["id"]) \
                .neq("status_kehadiran", "dibatalkan") \
                .execute()
            kolaborator_count = len(set(k.get("kolaborator_id") for k in (kolabs_res.data or [])))

            row = {
                "id": event.get("id"),
                "nama": event.get("nama"),
                "tanggal": event.get("tanggal"),
                "status": event.get("status"),
                "pengunjung": pengunjung,
                "artisan_count": artisan_count,
                "kolaborator_count": kolaborator_count
            }
            report_rows.append(row)

        return report_rows

    except Exception as e:
        raise HTTPException(500, f"Error fetching accumulation report: {str(e)}")


def export_visitor_report_csv(event_id: str = None, tanggal: str = None):
    """Export visitor report as CSV."""
    try:
        report = get_visitor_report(event_id, tanggal)
        logs = report.get("rows", [])

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Nama", "Waktu Masuk", "Waktu Keluar", "Status"])

        for log in logs:
            writer.writerow([
                log.get("nama"),
                log.get("waktu_masuk"),
                log.get("waktu_keluar"),
                log.get("status")
            ])

        return output.getvalue()

    except Exception as e:
        raise HTTPException(500, f"Error exporting visitor report: {str(e)}")
