from pydantic import BaseModel
from typing import Optional


class DaftarEventSchema(BaseModel):
    """
    Artisan mendaftar ke event.
    posisi_event = stand_id yang diminta (cross-ref zones.stands[].id).
    Backend validasi ketersediaan stand sebelum insert ke artisan_requests.
    """
    event_id: str
    posisi_event: str       # contoh: 'A-3', 'B-1'


class ChangeStandSchema(BaseModel):
    """
    Artisan minta ubah posisi stand (hanya jika status_request='approved').
    Akan set status_request='pending_change' dan isi change_request.
    """
    artisan_request_id: str
    posisi_baru: str        # stand_id baru yang diminta
