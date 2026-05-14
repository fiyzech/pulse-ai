from telegrambot.database import get_supabase

from telegrambot.schemas.crypto import AlertCreate_Schema, AlertCondition

async def create_alert(user_id: str, alert_data: AlertCreate_Schema):
    client = get_supabase()
    response = await client.table("alerts").insert({
        "user_id": user_id,
        **alert_data.model_dump()
    }).execute()
    return response.data


async def get_user_alerts(user_id: str):
    from telegrambot.database import get_supabase
    client = get_supabase()
    
    try:
        # Дістаємо всі алерти для конкретного юзера
        res = await client.table("alerts").select("*").eq("user_id", user_id).execute()
        return res.data
    except Exception as e:
        print(f"Помилка отримання алертів: {e}")
        return []