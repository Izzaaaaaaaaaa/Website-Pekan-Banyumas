from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, Union, Dict, List, Any

from app.api.deps import get_admin_only
from app.services import company_profile_service
from app.utils.response import success_response, error_response
from pydantic import BaseModel

router = APIRouter(prefix="/api/company-profile", tags=["company-profile"])


class CompanyProfileSave(BaseModel):
    section: str
    content: Union[Dict[str, Any], List[Any]]


@router.get("", response_model=dict)
def get_company_profile(
    section: str = Query(...),
    user=Depends(get_admin_only)
):
    """Get company profile section content (admin only)."""
    try:
        valid_sections = ["home", "about", "tim", "programs", "works", "gallery"]
        if section not in valid_sections:
            raise HTTPException(400, detail=error_response(f"Section tidak valid. Harus salah satu dari: {', '.join(valid_sections)}", 400))
            
        content = company_profile_service.get_company_profile(section)
        return success_response(content)
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.put("", response_model=dict)
def save_company_profile(
    data: CompanyProfileSave,
    user=Depends(get_admin_only)
):
    """Save company profile section content (admin only)."""
    try:
        valid_sections = ["home", "about", "tim", "programs", "works", "gallery"]
        if data.section not in valid_sections:
            raise HTTPException(422, detail=error_response(
                "Section tidak valid",
                422,
                {"section": [f"Harus salah satu dari: {', '.join(valid_sections)}"]}
            ))

        result = company_profile_service.save_company_profile(data.section, data.content)
        return success_response(None, message=result.get("message"))
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))
