import asyncio
import logging
import os

from aiogram.fsm.state import StatesGroup, State

from aiogram import Router, F
from aiogram.types import Message
from aiogram.fsm.context import FSMContext
from aiogram import Bot, Dispatcher
from aiogram.filters import Command

from dotenv import load_dotenv

from telegrambot.schemas.crypto import AlertCreate_Schema
from telegrambot.schemas.users import User_Schema 
from telegrambot.services.crypto import create_alert, get_user_alerts
from telegrambot.services.users import get_user_by_telegram, login_user

load_dotenv()

bot = Bot(token=os.environ.get("TG_TOKEN"))
dp = Dispatcher()

router = Router()

class LoginStates(StatesGroup):
    waiting_for_email = State()
    waiting_for_password = State()

class AlertStates(StatesGroup):
    waiting_for_symbol = State()
    waiting_for_condition = State()
    waiting_for_price = State()

@router.message(Command("login"))
async def cmd_login(message: Message, state: FSMContext):
    await message.answer("Введіть вашу електронну пошту:")
    await state.set_state(LoginStates.waiting_for_email)

@router.message(LoginStates.waiting_for_email)
async def process_email(message: Message, state: FSMContext):
    # Тут можна додати базову перевірку формату пошти
    await state.update_data(email=message.text)
    await message.answer("Тепер введіть ваш пароль:")
    await state.set_state(LoginStates.waiting_for_password)

@router.message(LoginStates.waiting_for_password)
async def process_password(message: Message, state: FSMContext):
    data = await state.get_data()
    email = data['email']
    password = message.text
    
    try:
        creds = User_Schema(email=email, password=password)
    except Exception:
        await message.answer("❌ Некоректні дані. Спробуйте /login ще раз.")
        await state.clear()
        return

    result = await login_user(creds)

    if result and result.user:
        from telegrambot.database import get_supabase
        client = get_supabase()
        
        try:
            # Оновлюємо саме telegram_id
            response = await client.table("users_duplicate").upsert({
                "id": result.user.id,                # Обов'язково додаємо ID для upsert
                "email": result.user.email,          # Додаємо email для нового запису
                "telegram_id": str(message.from_user.id),
                "telegram_username": message.from_user.username,
                "active_plan": "free"                # Значення за замовчуванням
            }).execute()
            
            if response.data:
                await message.answer(f"✅ Успішно! Вітаємо, {result.user.email}\nТепер я впізнаю тебе автоматично!")
            else:
                await message.answer("⚠ Авторизація ок, але твій профіль не знайдено в users_duplicate по UUID.")
        except Exception as e:
            await message.answer(f"✅ Авторизація успішна, але сталася помилка БД: {e}")
    else:
        await message.answer("❌ Помилка авторизації. Перевірте пошту та пароль.")
    
    await state.clear()


@router.message(Command("add_alert"))
async def cmd_add_alert(message: Message, state: FSMContext):
    # 1. Шукаємо юзера в базі за його telegram_chat_id
    user = await get_user_by_telegram(message.from_user.id)
    
    if not user:
        await message.answer("⚠️ Твій Telegram не прив'язаний до аккаунту Pulse-AI. Виконай /login")
        return

    # 2. Зберігаємо його UUID для створення алерту
    await state.update_data(supabase_id=user['id'])
    
    await message.answer(f"Привіт, {message.from_user.first_name}! Твій план: {user['active_plan']}.\nВведіть монету:")
    await state.set_state(AlertStates.waiting_for_symbol)


@router.message(AlertStates.waiting_for_symbol)
async def process_symbol(message: Message, state: FSMContext):
    # Якщо бот доходить сюди, в логах буде "is handled"
    symbol = message.text.upper()
    await state.update_data(symbol=symbol)
    
    await message.answer(f"Прийнято: {symbol}. Тепер введіть умову (above_or_equal/below_or_equal):")
    await state.set_state(AlertStates.waiting_for_condition)

@router.message(AlertStates.waiting_for_condition)
async def process_condition(message: Message, state: FSMContext):
    condition = message.text.lower()
    if condition not in ['above_or_equal', 'below_or_equal']:
        await message.answer("Будь ласка, введіть 'above_or_equal' або 'below_or_equal'")
        return
        
    await state.update_data(condition=condition)
    await message.answer("Введіть цільову ціну (наприклад: 65000.50):")
    await state.set_state(AlertStates.waiting_for_price)

@router.message(AlertStates.waiting_for_price)
async def process_price(message: Message, state: FSMContext):
    try:
        price = float(message.text.replace(',', '.'))
    except ValueError:
        await message.answer("Будь ласка, введіть коректне число.")
        return
    
    data = await state.get_data()
    
    # Виклик твоєї сервісної функці
    alert_data = AlertCreate_Schema(
        symbol=data['symbol'],
        condition=data['condition'],
        target_price=price # або price, подивись як у схемі
    )

    result = await create_alert(data['supabase_id'], alert_data)    

    if result:
        await message.answer(f"✅ Алерт створено! Моніторимо {data['symbol']} на рівні {price}")
    else:
        await message.answer("❌ Помилка при записі алерту в базу.")
            

        
    await state.clear()

@router.message(Command("alerts"))
async def cmd_my_alerts(message: Message):
    # 1. Знаходимо юзера за його Telegram ID
    user = await get_user_by_telegram(message.from_user.id)
    
    if not user:
        await message.answer("⚠️ Твій Telegram не прив'язаний до аккаунту. Виконай /login")
        return

    # 2. Витягуємо алерти з бази
    alerts = await get_user_alerts(user['id'])

    # 3. Якщо алертів немає
    if not alerts:
        await message.answer("📭 У тебе поки немає активних алертів.\nСтвори перший: /add_alert")
        return

    # 4. Форматуємо красиве повідомлення
    text = "📊 <b>Твої активні алерти:</b>\n\n"
    
    for idx, alert in enumerate(alerts, start=1):
        # Перевіряємо, як у тебе називається колонка: target_price чи price
        price = alert.get('target_price', alert.get('price', 'N/A')) 
        symbol = alert.get('symbol', 'UNKNOWN')
        condition = alert.get('condition', '')
        
        # Красиві іконки для умов
        cond_text = "🟢 Вище" if condition == 'above_or_equal' else "🔴 Нижче"
        
        text += f"<b>{idx}. {symbol}</b>\n"
        text += f"   Умова: {cond_text}\n"
        text += f"   Ціна: <code>{price}$</code>\n"
        text += "   ──────────────\n"

    # parse_mode="HTML" робить текст жирним і моноширинним
    await message.answer(text, parse_mode="HTML")
    
async def main():
    # Налаштовуємо логування, щоб бачити помилки в консолі
    logging.basicConfig(level=logging.INFO)

    from telegrambot.database import init_supabase
    await init_supabase()
    # Реєструємо роутер (це у тебе вже є, але має бути перед запуском)
    dp.include_router(router)
    
    # Запускаємо бота
    print("Бот запущений...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Бот вимкнений")