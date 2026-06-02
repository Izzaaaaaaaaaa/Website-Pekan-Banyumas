from app.db.supabase import supabase_admin
from fastapi import HTTPException


def get_company_profile(section: str):
    """Get company profile section content."""
    try:
        res = supabase_admin.table("company_profile_sections").select("content").eq("section", section).execute()
        if not res.data:
            return None
        return res.data[0].get("content")

    except Exception as e:
        raise HTTPException(500, f"Error fetching company profile: {str(e)}")


def save_company_profile(section: str, content: dict | list):
    """Save company profile section content."""
    try:
        # Upsert the content
        res = supabase_admin.table("company_profile_sections").upsert({
            "section": section,
            "content": content
        }).execute()
        
        return {"message": "Company profile berhasil disimpan"}

    except Exception as e:
        raise HTTPException(500, f"Error saving company profile: {str(e)}")
