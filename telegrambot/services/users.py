from telegrambot.database import get_supabase

from telegrambot.schemas.users import User_Schema

async def login_user(creds: User_Schema):
    client = get_supabase() # Отримуємо актуальний об'єкт
    if client is None:
        print("Помилка: Supabase клієнт не ініціалізований!")
        return None
    
    try:
        response = await client.auth.sign_in_with_password(
        {
            "email": creds.email,
            "password": creds.password
        })

        return response
    except Exception as e:
        print(f"Помилка авторизації: {e}")
        return None
    
async def sync_telegram_data(supabase_id: str, telegram_id: int, username: str):
    """
    Оновлює дані телеграму для існуючого користувача за його UUID.
    """
    client = get_supabase()
    try:
        # Оновлюємо конкретні поля в таблиці users_duplicate
        response = await client.table("users_duplicate").update({
            "telegram_id": str(telegram_id), # У тебе в SQL це varchar
            "telegram_username": username
        }).eq("id", supabase_id).execute()
        
        return response.data
    except Exception as e:
        print(f"Помилка синхронізації профілю: {e}")
        return None

async def get_user_by_telegram(telegram_id: int):
    client = get_supabase()
    # Шукаємо саме в тій колонці, яка є в базі
    res = await client.table("users_duplicate") \
        .select("*") \
        .eq("telegram_id", str(telegram_id)) \
        .execute()
    
    return res.data[0] if res.data else None