import os, sys, requests
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()

from database import get_supabase

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
EMBED_MODEL = "nomic-embed-text"

sb = get_supabase()

facilities = sb.table("facilities").select("id, name, building, floor, description, type").execute().data

for f in facilities:
    text = f"{f['name']} {f['building']} {f['floor']}층 {f['description']} 유형:{f['type']}"
    
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/embeddings",
            json={"model": EMBED_MODEL, "prompt": text}
        )
        response.raise_for_status()
        embedding = response.json()["embedding"]
        
        sb.table("facilities").update({"embedding": embedding}).eq("id", f["id"]).execute()
        print(f"Success: {f['name']}")
    except Exception as e:
        print(f"Error: {f['name']} - {str(e)}")

print("All embeddings completed!")
