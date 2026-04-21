from app.db.supabase import supabase

# GET ALL MEMBERS
def get_members():
    res = supabase.table("users") \
        .select("*") \
        .eq("role", "pengunjung") \
        .execute()

    return res.data


# GET MEMBER BY ID
def get_member_by_id(member_id: str):
    res = supabase.table("users") \
        .select("*") \
        .eq("id", member_id) \
        .single() \
        .execute()

    return res.data


# CREATE MEMBER + NFC
def create_member(data):
    # 1. insert user
    user = supabase.table("users").insert({
        "nama": data["nama"],
        "email": data["email"],
        "role": "pengunjung"
    }).execute()

    user_id = user.data[0]["id"]

    # 2. insert nfc card
    if data.get("card_uid"):
        supabase.table("nfc_cards").insert({
            "user_id": user_id,
            "card_uid": data["card_uid"]
        }).execute()

    return {
        "message": "Member berhasil dibuat",
        "user_id": user_id
    }


# UPDATE MEMBER
def update_member(member_id: str, data):
    supabase.table("users") \
        .update(data) \
        .eq("id", member_id) \
        .execute()

    return {"message": "Member berhasil diupdate"}


# DELETE MEMBER
def delete_member(member_id: str):
    supabase.table("users") \
        .delete() \
        .eq("id", member_id) \
        .execute()

    return {"message": "Member berhasil dihapus"}