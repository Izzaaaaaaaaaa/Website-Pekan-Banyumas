def map_gate_log(data):
    return {
        "id": data["id"],
        "nama": data["users"]["nama"] if data.get("users") else None,
        "status": data["gate_type"],
        "waktu": data["scan_time"]
    }