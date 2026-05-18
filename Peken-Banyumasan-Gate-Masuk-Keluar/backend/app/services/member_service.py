from app.db.supabase import supabase
from fastapi import HTTPException
from app.schemas.user_schema import UserResponse


# GET ALL MEMBERS
def get_members():
    res = supabase.table("users") \
        .select("*") \
        .eq("role", "pengunjung") \
        .execute()

    return [UserResponse(**u) for u in res.data]


# GET MEMBER BY ID
def get_member_by_id(member_id: str):
    res = supabase.table("users") \
        .select("*") \
        .eq("id", member_id) \
        .execute()

    if not res.data:
        raise HTTPException(404, "Member tidak ditemukan")

    return UserResponse(**res.data[0])


# CREATE MEMBER + NFC
def create_member(data):
    # 🔍 cek email duplicate
    existing = supabase.table("users") \
        .select("id") \
        .eq("email", data["email"]) \
        .execute()

    if existing.data:
        raise HTTPException(400, "Email sudah terdaftar")

    # 1. insert user
    user = supabase.table("users").insert({
        "nama": data["nama"],
        "email": data["email"],
        "role": "pengunjung"
    }).execute()

    user_id = user.data[0]["id"]

    # 🔍 cek NFC duplicate
    if data.get("card_uid"):
        nfc_exist = supabase.table("nfc_cards") \
            .select("id") \
            .eq("card_uid", data["card_uid"]) \
            .execute()

        if nfc_exist.data:
            raise HTTPException(400, "NFC sudah terdaftar")

        # insert NFC
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
    res = supabase.table("users") \
        .update(data) \
        .eq("id", member_id) \
        .execute()

    if not res.data:
        raise HTTPException(404, "Member tidak ditemukan")

    return {"message": "Member berhasil diupdate"}


# DELETE MEMBER
def delete_member(member_id: str):
    res = supabase.table("users") \
        .delete() \
        .eq("id", member_id) \
        .execute()

    if not res.data:
        raise HTTPException(404, "Member tidak ditemukan")

    return {"message": "Member berhasil dihapus"}