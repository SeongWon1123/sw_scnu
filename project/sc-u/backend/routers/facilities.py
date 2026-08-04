from fastapi import APIRouter
from database import get_supabase

router = APIRouter()

@router.get("/")
def list_facilities(type: str = None, building: str = None):
    sb = get_supabase()
    q = sb.table("facilities").select("*").eq("is_active", True)
    if type:
        q = q.eq("type", type)
    if building:
        q = q.ilike("building", f"%{building}%")
    return q.execute().data

@router.get("/{id}")
def get_facility(id: str):
    sb = get_supabase()
    return sb.table("facilities").select("*").eq("id", id).single().execute().data

@router.post("/")
def create_facility(data: dict):
    sb = get_supabase()
    return sb.table("facilities").insert(data).execute().data

@router.put("/{id}")
def update_facility(id: str, data: dict):
    sb = get_supabase()
    return sb.table("facilities").update(data).eq("id", id).execute().data

@router.delete("/{id}")
def delete_facility(id: str):
    sb = get_supabase()
    return sb.table("facilities").update({"is_active": False}).eq("id", id).execute().data
