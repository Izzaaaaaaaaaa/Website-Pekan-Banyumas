from pydantic import BaseModel


class MarkReadSchema(BaseModel):
    notif_id: str
