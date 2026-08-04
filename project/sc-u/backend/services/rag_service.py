import os
import requests
from database import get_supabase

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_MODEL = "gemma4:e4b"
EMBED_MODEL = "nomic-embed-text"

SYSTEM_PROMPT = """당신은 국립순천대학교 캠퍼스 장애인 접근성 안내 AI 'SC&U'입니다.
반드시 아래 제공된 데이터만 사용하여 한국어로 친절하고 구체적으로 답변하세요.
데이터에 없는 정보는 "확인된 정보가 없습니다"라고 답하세요."""

def embed_text(text: str) -> list:
    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/embeddings",
        json={"model": EMBED_MODEL, "prompt": text}
    )
    response.raise_for_status()
    return response.json()["embedding"]

def search_facilities(query: str, k: int = 5) -> list:
    sb = get_supabase()
    embedding = embed_text(query)
    result = sb.rpc("match_facilities", {
        "query_embedding": embedding,
        "match_count": k
    }).execute()
    return result.data

def generate_answer(query: str, context_items: list) -> str:
    context = "\n".join([
        f"- {item['name']} ({item['building']} {item['floor']}층): {item['description']}"
        for item in context_items
    ])
    
    prompt = f"{SYSTEM_PROMPT}\n\n[데이터]\n{context}\n\n[질문]\n{query}"
    
    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json={
            "model": LLM_MODEL,
            "prompt": prompt,
            "stream": False
        }
    )
    response.raise_for_status()
    return response.json()["response"]

def ask(query: str) -> str:
    try:
        items = search_facilities(query)
        if not items:
            return "관련 시설 정보를 찾을 수 없습니다."
        return generate_answer(query, items)
    except Exception as e:
        return f"AI 서비스 호출 중 오류가 발생했습니다: {str(e)}"
