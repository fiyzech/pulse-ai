import asyncio
import logging
import os
import re

from aiogram import Bot, Dispatcher, Router, F, html
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import StatesGroup, State
from aiogram.types import (
    Message, 
    ReplyKeyboardMarkup, 
    KeyboardButton, 
    InlineKeyboardMarkup, 
    InlineKeyboardButton, 
    CallbackQuery
)
from dotenv import load_dotenv

from telegrambot.schemas.crypto import AlertCreate_Schema
from telegrambot.schemas.users import User_Schema 
from telegrambot.services.crypto import create_alert, get_user_alerts
from telegrambot.services.users import get_user_by_telegram, login_user

load_dotenv()

bot = Bot(token=os.environ.get("TG_TOKEN"))
dp = Dispatcher()
router = Router()

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"

# --- Клавіатури ---

def get_main_keyboard():
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📊 Мої алерти"), KeyboardButton(text="➕ Створити алерт")],
            [KeyboardButton(text="🔑 Авторизація / Перезапуск")]
        ],
        resize_keyboard=True
    )

def get_condition_keyboard():
    # ДОДАНО префікс cond_ до callback_data
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="📈 Більше ніж (>)", callback_data="cond_price_gt"),
                InlineKeyboardButton(text="📈 ≥ (>=)", callback_data="cond_price_gte")
            ],
            [
                InlineKeyboardButton(text="📉 Менше ніж (<)", callback_data="cond_price_lt"),
                InlineKeyboardButton(text="📉 ≤ (<=)", callback_data="cond_price_lte")
            ],
            [
                InlineKeyboardButton(text="🎯 Дорівнює (=)", callback_data="cond_price_eq")
            ]
        ]
    )

# --- Стани FSM ---

class LoginStates(StatesGroup):
    waiting_for_email = State()
    waiting_for_password = State()

class AlertStates(StatesGroup):
    waiting_for_symbol = State()
    waiting_for_condition = State()
    waiting_for_price = State()

# --- Допоміжні мапінги ---

CONDITION_LABELS = {
    "price_gt": "Ціна більше ніж",
    "price_gte": "Ціна більше або =",
    "price_lt": "Ціна менше ніж",
    "price_lte": "Ціна менше або =",
    "price_eq": "Ціна дорівнює"
}

CONDITION_ICONS = {
    "price_gt": "📈",      # Більше
    "price_gte": "📈⎓",    # Більше або дорівнює
    "price_lt": "📉",      # Менше
    "price_lte": "📉⎓",    # Менше або дорівнює
    "price_eq": "🎯"       # Рівно
}

# --- Хендлери ---

@router.message(CommandStart())
@router.message(F.text == "🔑 Авторизація / Перезапуск")
@router.message(Command("login"))
async def cmd_login(message: Message, state: FSMContext):
    await state.clear()
    await message.answer(
        "👋 Вітаємо у Pulse-AI боті!\nБудь ласка, введіть вашу електронну пошту для входу:",
        reply_markup=get_main_keyboard()
    )
    await state.set_state(LoginStates.waiting_for_email)

@router.message(LoginStates.waiting_for_email)
async def process_email(message: Message, state: FSMContext):
    email = message.text.strip().lower()
    if not re.match(EMAIL_REGEX, email):
        await message.answer("❌ Некоректний формат email. Спробуйте ще раз:")
        return
    await state.update_data(email=email)
    await message.answer("🔒 Тепер введіть ваш пароль:")
    await state.set_state(LoginStates.waiting_for_password)

@router.message(LoginStates.waiting_for_password)
async def process_password(message: Message, state: FSMContext):
    data = await state.get_data()
    result = await login_user(User_Schema(email=data['email'], password=message.text))

    if result and result.user:
        from telegrambot.database import get_supabase
        client = get_supabase()
        try:
            await client.table("users").upsert({
                "id": result.user.id,
                "email": result.user.email,
                "telegram_id": str(message.from_user.id),
                "telegram_username": message.from_user.username,
                "active_plan": "free"
            }).execute()
            await message.answer(f"✅ Успішно! Вітаємо, {result.user.email}", reply_markup=get_main_keyboard())
        except Exception as e:
            await message.answer(f"✅ Авторизація успішна, але помилка БД: {e}")
    else:
        await message.answer("❌ Помилка авторизації.")
    await state.clear()

@router.message(F.text == "➕ Створити алерт")
@router.message(Command("add_alert"))
async def cmd_add_alert(message: Message, state: FSMContext):
    await state.clear()
    user = await get_user_by_telegram(message.from_user.id)
    if not user:
        await message.answer("⚠️ Спочатку виконайте /login")
        return
    await state.update_data(supabase_id=user['id'])
    await message.answer("💱 Введіть тікер монети (наприклад: BTC, ETH):")
    await state.set_state(AlertStates.waiting_for_symbol)

@router.message(AlertStates.waiting_for_symbol)
async def process_symbol(message: Message, state: FSMContext):
    symbol = message.text.strip().upper()
    if not (2 <= len(symbol) <= 10 and symbol.isalnum()):
        await message.answer("❌ Некоректний тікер.")
        return
    await state.update_data(symbol=symbol)
    await message.answer(f"Монета: <b>{symbol}</b>\n👇 Оберіть умову:", reply_markup=get_condition_keyboard(), parse_mode="HTML")
    await state.set_state(AlertStates.waiting_for_condition)

@router.callback_query(AlertStates.waiting_for_condition, F.data.startswith("cond_"))
async def process_condition_callback(callback: CallbackQuery, state: FSMContext):
    condition = callback.data.replace("cond_", "")
    label = CONDITION_LABELS.get(condition, "Обрано умову")
    await state.update_data(condition=condition)
    
    await callback.message.edit_text(f"Умова: <b>{label}</b>", parse_mode="HTML")
    await callback.message.answer("💰 Введіть цільову ціну:")
    await state.set_state(AlertStates.waiting_for_price)

@router.message(AlertStates.waiting_for_price)
async def process_price(message: Message, state: FSMContext):
    try:
        price = float(message.text.replace(',', '.').strip())
        if price <= 0: raise ValueError
    except ValueError:
        await message.answer("❌ Введіть число.")
        return
    
    data = await state.get_data()
    alert_data = AlertCreate_Schema(symbol=data['symbol'], condition=data['condition'], target_price=price)
    result = await create_alert(data['supabase_id'], alert_data)

    if result:
        # Використовуємо іконку з мапінгу для підтвердження
        icon = CONDITION_ICONS.get(data['condition'], "✅")
        await message.answer(
            f"🚀 <b>Алерт створено!</b>\n{data['symbol']} {icon} {price}$",
            parse_mode="HTML", reply_markup=get_main_keyboard()
        )
    else:
        await message.answer("❌ Помилка БД.")
    await state.clear()

@router.message(F.text == "📊 Мої алерти")
@router.message(Command("alerts"))
async def cmd_my_alerts(message: Message):
    user = await get_user_by_telegram(message.from_user.id)
    if not user:
        await message.answer("⚠️ Спочатку виконайте /login")
        return

    alerts = await get_user_alerts(user['id'])
    if not alerts:
        await message.answer("📭 У тебе поки немає активних алертів.")
        return

    # 1. Створюємо список, куди будемо складати рядки
    # Одразу додаємо заголовок
    text_parts = [
        "📊 <b>Твої активні алерти:</b>",
        "⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯"
    ]
    
    for idx, alert in enumerate(alerts, start=1):
        symbol = html.quote(str(alert.get('symbol', 'UNIT')).upper())
        price = html.quote(str(alert.get('target_price', alert.get('price', '0'))))
        cond_key = alert.get('condition', '')
        
        icon = CONDITION_ICONS.get(cond_key, "🔹")
        
        # 2. Формуємо рядок і додаємо його в список
        alert_line = f"{idx}. <b>{symbol}</b> {icon} <code>{price} $</code>"
        text_parts.append(alert_line)
        
        # Додаємо розділювач між алертами (крім останнього)
        if idx < len(alerts):
            text_parts.append("⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯")

    # 3. З'єднуємо все в один текст через перенос рядка
    final_text = "\n".join(text_parts)

    try:
        await message.answer(final_text, parse_mode="HTML")
    except Exception as e:
        logging.error(f"HTML Error: {e}")
        # Якщо HTML знову "ляже", відправляємо чистий текст
        clean_text = final_text.replace("<b>", "").replace("</b>", "").replace("<code>", "").replace("</code>", "")
        await message.answer("⚠️ Проблема з форматуванням. Список:\n\n" + clean_text)
    # try:
    #     await message.answer(final_text, parse_mode="HTML")
    # except Exception as e:
    #     logging.error(f"Telegram HTML Error: {e}")
    #     # Якщо HTML все одно "падає", відправляємо простий текст як бекап
    #     backup_text = final_text.replace("<b>", "").replace("</b>", "").replace("<code>", "").replace("</code>", "")
    #     await message.answer("⚠️ Виникла проблема з відображенням іконок. Список:\n\n" + backup_text)

# @router.message(F.text == "📊 Мої алерти")
# @router.message(Command("alerts"))
# async def cmd_my_alerts(message: Message):
#     user = await get_user_by_telegram(message.from_user.id)
#     if not user:
#         await message.answer("⚠️ Спочатку виконайте /login")
#         return

#     alerts = await get_user_alerts(user['id'])
#     if not alerts:
#         await message.answer("📭 Немає активних алертів.")
#         return

#     lines = ["📊 <b>Твої активні алерти:</b>\n"]
    
#     for idx, alert in enumerate(alerts, start=1):
#         # 1. Екрануємо все, що беремо з бази
#         symbol = html.quote(str(alert.get('symbol', '???')))
#         price = html.quote(str(alert.get('target_price', alert.get('price', '0'))))
#         cond_key = alert.get('condition', '')
        
#         # 2. Беремо іконку (якщо її немає в словнику — виводимо пустий рядок або текст)
#         icon = CONDITION_ICONS.get(cond_key, "⚙️")
        
#         # 3. Формуємо рядок БЕЗ вкладених тегів всередині змінних
#         # Спочатку текст, потім емодзі, потім моноширинна ціна
#         line = f"{idx}. {symbol} {icon} <code>{price}</code>$"
#         lines.append(line)
#         lines.append("────────────────")

#     text = "\n".join(lines)

#     try:
#         # Спробуємо відправити спочатку з HTML
#         await message.answer(text, parse_mode="HTML")
#     except Exception as e:
#         logging.error(f"HTML Error: {e}")
#         # Якщо HTML знову впав — відправляємо чистий текст без тегів
#         clean_text = text.replace("<b>", "").replace("</b>", "").replace("<code>", "").replace("</code>", "")
#         await message.answer("⚠️ Помилка розмітки. Виводжу в чистому тексті:\n\n" + clean_text)

async def main():
    logging.basicConfig(level=logging.INFO)
    from telegrambot.database import init_supabase
    await init_supabase()
    dp.include_router(router)
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass