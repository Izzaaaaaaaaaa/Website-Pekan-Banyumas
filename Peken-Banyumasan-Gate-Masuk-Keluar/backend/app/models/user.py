def map_user(data):
    return {
        "id": data["id"],
        "nama": data["nama"],
        "email": data["email"],
        "role": data["role"]
    }