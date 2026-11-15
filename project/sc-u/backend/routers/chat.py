from fastapi import APIRouter
from pydantic import BaseModel, Field
from services.rag_service import ask
from database import get_supabase
from typing import Optional
import uuid

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

@router.post("/")
def chat(req: ChatRequest):
    sb = get_supabase()
    session_id = req.session_id or str(uuid.uuid4())
    answer = ask(req.message)
    sb.table("chat_logs").insert([
        {"session_id": session_id, "role": "user", "content": req.message},
        {"session_id": session_id, "role": "assistant", "content": answer}
    ]).execute()
    return {"answer": answer, "session_id": session_id}
