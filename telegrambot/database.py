import os
from dotenv import load_dotenv
from supabase import acreate_client, AsyncClient

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
#supabase: Client = create_client(url, key)
supabase: AsyncClient = None

async def init_supabase():
    global supabase
    if supabase is None:
        supabase = await acreate_client(url, key)
    return supabase

def get_supabase() -> AsyncClient:
    return supabase