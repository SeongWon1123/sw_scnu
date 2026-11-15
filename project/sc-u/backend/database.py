import os
from supabase import create_client, Client

_sb_clients = {}

def get_supabase() -> Client:
    """Lazy-initialized Supabase client singleton."""
    if "sb" not in _sb_clients:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_KEY", "")
        if not url or not key or url.startswith("YOUR_"):
            raise RuntimeError(
                "Supabase credentials not configured. "
                "Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env"
            )
        _sb_clients["sb"] = create_client(url, key)
    return _sb_clients["sb"]
