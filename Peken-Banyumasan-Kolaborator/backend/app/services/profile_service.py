from app.db.supabase import supabase, supabase_admin

# Columns safe to return to the kolaborator portal.
# no_hp and internal_notes are intentionally excluded (admin-only).
#
# PENTING: `status` sengaja diikutkan di sini.
# Ini adalah solusi alternatif BUG-1 (sisi Gate BE): FE dapat membaca
# status aktual dari tabel (bukan dari JWT yang mungkin basi) melalui
# endpoint GET /api/kolaborator/me, sehingga UI bisa tetap akurat
# walau JWT belum di-refresh setelah aktivasi admin.
_KOLABORATOR_SELECT = (
    "id, slug, email, nama, kota, bio, foto_url, cover_url, "
    "subsektor, status, tanggal_daftar, total_karya, total_story, total_event"
)


def _compute_total_event(client, user_id: str) -> int:
    """Compute total approved/active event registrations for a kolaborator.

    We count DISTINCT events where:
      - kolaborator_requests.status == 'approved' (self-join approved), OR
      - event_kolaborators.status_kehadiran != 'dibatalkan' (direct assignment / attendance table)

    This avoids stale `kolaborators.total_event` values.
    """
    try:
        req_res = (
            client.table("kolaborator_requests")
            .select("event_id")
            .eq("kolaborator_id", user_id)
            .eq("status", "approved")
            .execute()
        )
        req_ids = {r.get("event_id") for r in (req_res.data or []) if r.get("event_id")}

        reg_res = (
            client.table("event_kolaborators")
            .select("event_id")
            .eq("kolaborator_id", user_id)
            .neq("status_kehadiran", "dibatalkan")
            .execute()
        )
        reg_ids = {r.get("event_id") for r in (reg_res.data or []) if r.get("event_id")}

        ids = list(req_ids | reg_ids)
        if not ids:
            return 0

        # Count only events that are visible in consumer apps (exclude draft).
        ev_res = (
            client.table("events")
            .select("id")
            .in_("id", ids)
            .in_("status", ["published", "berlangsung", "selesai"])
            .execute()
        )
        return len({e.get("id") for e in (ev_res.data or []) if e.get("id")})
    except Exception:
        # Fail soft: never break profile endpoint because of aggregate counts.
        return 0


def get_profile(user_payload: dict) -> dict:
    """GET /api/kolaborator/me — return own kolaborator record."""
    user_id = user_payload.get("user_id")
    if not user_id:
        return {}

    client = supabase_admin or supabase
    result = (
        client.table("kolaborators")
        .select(_KOLABORATOR_SELECT)
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        return {}

    data = result.data[0]
    data["total_event"] = _compute_total_event(client, user_id)
    return data


def update_profile(user_payload: dict, payload: dict) -> dict:
    """PATCH /api/kolaborator/me — update own kolaborator record.

    Allowed fields: nama, email, kota, bio, foto_url, cover_url, subsektor.
    Forbidden fields (silently dropped): status, total_*, tanggal_daftar.
    """
    user_id = user_payload.get("user_id")
    if not user_id:
        return {}

    allowed = {"nama", "email", "kota", "bio", "foto_url", "cover_url", "subsektor"}
    update_fields = {k: v for k, v in payload.items() if k in allowed and v is not None}

    if not update_fields:
        return get_profile(user_payload)

    client = supabase_admin or supabase

    # If nama is updated, also sync to users_profile table
    if "nama" in update_fields:
        try:
            client.table("users_profile").update({"nama": update_fields["nama"]}).eq("id", user_id).execute()
        except Exception:
            pass

    # Update kolaborators table
    client.table("kolaborators").update(update_fields).eq("id", user_id).execute()

    return get_profile(user_payload)
