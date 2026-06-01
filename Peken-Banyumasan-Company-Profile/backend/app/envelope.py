from typing import Any


def ok(data: Any, message: str | None = None) -> dict:
    return {"status": "success", "message": message, "data": data}


def err(message: str, status_code: int = 500) -> dict:
    return {"status": "error", "message": message, "data": None}
