from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.core.config import JWT_ALGORITHM, JWT_EXPIRE_MINUTES, JWT_SECRET_KEY


def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload.update({"exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)})
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None
