from typing import Optional, Dict, Any, List
from fastapi import HTTPException


def success_response(data: Any = None, message: Optional[str] = None) -> Dict[str, Any]:
    """Wrap successful response in standard envelope."""
    return {
        "success": True,
        "status": "success",
        "message": message,
        "data": data,
    }


def error_response(
    message: str,
    status_code: int = 400,
    errors: Optional[Dict[str, List[str]]] = None,
    data: Any = None
) -> Dict[str, Any]:
    """Wrap error response in standard envelope."""
    response = {
        "success": False,
        "status": "error",
        "message": message,
        "data": data,
    }
    if errors:
        response["errors"] = errors
    return response


def raise_error(message: str, status_code: int = 400, errors: Optional[Dict[str, List[str]]] = None):
    """Raise HTTPException with error envelope."""
    raise HTTPException(
        status_code=status_code,
        detail=error_response(message, status_code, errors)
    )
