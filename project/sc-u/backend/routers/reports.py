from fastapi import APIRouter
from database import get_supabase

router = APIRouter()

@router.get("/")
def list_reports():
    sb = get_supabase()
    return sb.table("reports").select("*, facilities(name, building)").execute().data

@router.post("/")
def create_report(data: dict):
    sb = get_supabase()
    return sb.table("reports").insert(data).execute().data

@router.patch("/{id}/approve")
def approve_report(id: str):
    from datetime import datetime, timezone
    sb = get_supabase()
    return sb.table("reports").update({
        "status": "approved",
        "approved_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", id).execute().data

@router.patch("/{id}/resolve")
def resolve_report(id: str):
    from datetime import datetime, timezone
    sb = get_supabase()
    return sb.table("reports").update({
        "status": "resolved",
        "resolved_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", id).execute().data
