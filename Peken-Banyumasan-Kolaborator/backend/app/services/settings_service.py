def get_settings(user_payload: dict) -> dict:
    return {
        "user_id": user_payload.get("user_id"),
        "notifications": True,
        "language": "id",
    }
