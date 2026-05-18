from pydantic import BaseModel

class ScanRequest(BaseModel):
    card_uid: str
    event_id: str