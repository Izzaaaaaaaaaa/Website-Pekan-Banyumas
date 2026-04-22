from pydantic import BaseModel

class ReportFilter(BaseModel):
    event_id: str