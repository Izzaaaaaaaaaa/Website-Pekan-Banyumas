from fastapi.responses import JSONResponse


def _envelope(data, message: str | None = None, status_code: int = 200) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"status": "success", "message": message, "data": data},
    )


def _error_envelope(
    message: str,
    status_code: int = 400,
    errors: dict | None = None,
) -> JSONResponse:
    """Bungkus response error dalam canonical envelope {status, message, data, errors?}."""
    content: dict = {"status": "error", "message": message, "data": None}
    if errors:
        content["errors"] = errors
    return JSONResponse(status_code=status_code, content=content)
