import asyncio
import logging
import os
import re

import aiohttp
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
    CallbackQuery,
)
from aiohttp import web
from dotenv import load_dotenv

from telegrambot.schemas.crypto import AlertCreate_Schema
from telegrambot.schemas.users import User_Schema
from telegrambot.services.crypto import create_alert, get_user_alerts
from telegrambot.services.users import get_user_by_telegram, login_user

load_dotenv()

bot = Bot(token=os.environ.get("TG_TOKEN"))
dp = Dispatcher()
router = Router()

# ── Per-user JWT store ──────────────────────────────────────────────────────
# After login we store each user's Supabase access token in memory so we can
# make RLS-authenticated REST calls on their behalf.  Resets on bot restart —
# users simply need to /login again to refresh it.
_user_tokens: dict[str, str] = {}          # telegram_id (str) → JWT access_token
_user_refresh_tokens: dict[str, str] = {}  # telegram_id (str) → refresh_token

# ── Bot-link OTP codes (website → bot account linking for OAuth users) ──────
# {code: {user_id: str, expires: float}}  — in-memory, 10-min TTL
_link_codes: dict[str, dict] = {}

# ── Per-plan signal quota limits (matches planLimits.ts) ───────────────────
PLAN_SIGNAL_LIMITS: dict[str, int | None] = {
    "free":     3,
    "pro":      10,
    "business": None,  # unlimited
}

# In-memory monthly signal quota: {user_id: {YYYY-MM: {symbols…}}}
_signal_quota: dict[str, dict[str, set[str]]] = {}

def _get_signal_quota_month() -> str:
    from datetime import datetime
    return datetime.utcnow().strftime("%Y-%m")

def _signal_quota_check(user_id: str, symbol: str, plan_key: str) -> tuple[bool, int | None, int]:
    """Returns (is_allowed, max_symbols, already_used_count).
    If is_allowed, also records the symbol in the quota tracker.
    """
    limit = PLAN_SIGNAL_LIMITS.get(plan_key.lower(), 3)
    if limit is None:
        # Unlimited — always allowed
        return True, None, 0

    month = _get_signal_quota_month()
    if user_id not in _signal_quota:
        _signal_quota[user_id] = {}
    if month not in _signal_quota[user_id]:
        _signal_quota[user_id][month] = set()

    viewed = _signal_quota[user_id][month]
    sym_upper = symbol.upper()

    if sym_upper in viewed:
        # Already counted — always allowed
        return True, limit, len(viewed)

    if len(viewed) < limit:
        # Within quota — allow and record
        viewed.add(sym_upper)
        return True, limit, len(viewed)

    # Over quota
    return False, limit, len(viewed)

def _store_token(telegram_id: int, access_token: str, refresh_token: str = "") -> None:
    _user_tokens[str(telegram_id)] = access_token
    if refresh_token:
        _user_refresh_tokens[str(telegram_id)] = refresh_token

def _get_token(telegram_id: int) -> str | None:
    return _user_tokens.get(str(telegram_id))

async def _refresh_access_token(telegram_id: int) -> str | None:
    """Use the stored refresh token to obtain a new access token from Supabase.

    Returns the new access token on success, or None if the refresh failed
    (in which case both tokens are cleared so the user is prompted to re-login).
    """
    refresh_token = _user_refresh_tokens.get(str(telegram_id))
    if not refresh_token:
        return None

    supabase_url = os.environ.get("SUPABASE_URL", "")
    anon_key = os.environ.get("SUPABASE_KEY", "") or os.environ.get("SUPABASE_ANON_KEY", "")
    url = f"{supabase_url}/auth/v1/token?grant_type=refresh_token"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                json={"refresh_token": refresh_token},
                headers={"apikey": anon_key, "Content-Type": "application/json"},
            ) as resp:
                if resp.status == 200:
                    body = await resp.json()
                    new_access = body.get("access_token", "")
                    new_refresh = body.get("refresh_token", "")
                    if new_access:
                        _store_token(telegram_id, new_access, new_refresh)
                        logging.info(f"_refresh_access_token: refreshed token for {telegram_id}")
                        return new_access
                body_text = await resp.text()
                logging.warning(f"_refresh_access_token: refresh failed {resp.status}: {body_text[:200]}")
    except Exception as exc:
        logging.warning(f"_refresh_access_token error: {exc}")

    # Refresh failed — clear both tokens
    _user_tokens.pop(str(telegram_id), None)
    _user_refresh_tokens.pop(str(telegram_id), None)
    return None

async def _authed_get(
    token: str | None,
    table: str,
    select: str,
    filters: dict[str, str],
    order: str | None = None,
    telegram_id: int | None = None,
) -> list[dict]:
    """
    Call the Supabase REST API directly using the user's JWT (or the anon/service key
    as a fallback).  This bypasses RLS correctly when the JWT is present.

    If the response is 401 and telegram_id is provided, attempts a token refresh
    once and retries the request with the new token.
    """
    supabase_url = os.environ.get("SUPABASE_URL", "")
    # Prefer service key (bypasses RLS) → user JWT → anon key
    service_key  = os.environ.get("SUPABASE_SERVICE_KEY", "")
    anon_key     = os.environ.get("SUPABASE_KEY", "") or os.environ.get("SUPABASE_ANON_KEY", "")
    api_key      = service_key or anon_key

    qs = f"select={select}"
    for k, v in filters.items():
        qs += f"&{k}=eq.{v}"
    if order:
        qs += f"&order={order}"

    url = f"{supabase_url}/rest/v1/{table}?{qs}"

    def _build_headers(active_token: str | None) -> dict:
        if service_key:
            auth_jwt = service_key      # service role — bypasses RLS entirely
        elif active_token and not active_token.startswith("linked:"):
            auth_jwt = active_token     # user JWT — passes RLS for that user's rows
        else:
            auth_jwt = anon_key         # anon / linked marker — RLS depends on policies
        return {
            "Authorization": f"Bearer {auth_jwt}",
            "apikey": api_key,
            "Content-Type": "application/json",
        }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=_build_headers(token)) as resp:
                if resp.status == 200:
                    return await resp.json()
                # On 401, try to refresh the token and retry once
                if resp.status == 401 and telegram_id is not None and _user_refresh_tokens.get(str(telegram_id)):
                    new_token = await _refresh_access_token(telegram_id)
                    if new_token:
                        async with session.get(url, headers=_build_headers(new_token)) as resp2:
                            if resp2.status == 200:
                                return await resp2.json()
                            body2 = await resp2.text()
                            logging.warning(f"_authed_get {table} retry → {resp2.status}: {body2[:200]}")
                            return []
                body = await resp.text()
                logging.warning(f"_authed_get {table} → {resp.status}: {body[:200]}")
                return []
    except Exception as exc:
        logging.warning(f"_authed_get {table} error: {exc}")
        return []

async def _authed_get_single(
    token: str | None,
    table: str,
    select: str,
    filters: dict[str, str],
) -> dict | None:
    rows = await _authed_get(token, table, select, filters)
    return rows[0] if rows else None

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"

# ── Keyboards ──────────────────────────────────────────────────────────────

def get_guest_keyboard():
    """Keyboard shown to unauthenticated users — only login button."""
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="🔑 Увійти в акаунт")],
        ],
        resize_keyboard=True,
    )

def get_main_keyboard():
    """Full keyboard shown after successful authentication."""
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📊 Мої алерти"), KeyboardButton(text="➕ Створити алерт")],
            [KeyboardButton(text="⭐ Обрані"), KeyboardButton(text="📈 Позиції")],
            [KeyboardButton(text="🌅 Pulse Brief"), KeyboardButton(text="🧠 AI прогноз")],
            [KeyboardButton(text="💹 Ціна монети"), KeyboardButton(text="👤 Мій профіль")],
            [KeyboardButton(text="🚪 Вийти з акаунту")],
        ],
        resize_keyboard=True,
    )

def get_condition_keyboard():
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="📈 Вище (>)",   callback_data="cond_price_gt"),
                InlineKeyboardButton(text="📈 ≥ (>=)",     callback_data="cond_price_gte"),
            ],
            [
                InlineKeyboardButton(text="📉 Нижче (<)",  callback_data="cond_price_lt"),
                InlineKeyboardButton(text="📉 ≤ (<=)",     callback_data="cond_price_lte"),
            ],
            [
                InlineKeyboardButton(text="🎯 Дорівнює", callback_data="cond_price_eq"),
            ],
            [
                InlineKeyboardButton(text="📊 RSI > X",    callback_data="cond_rsi_gt"),
                InlineKeyboardButton(text="📊 RSI < X",    callback_data="cond_rsi_lt"),
            ],
            [
                InlineKeyboardButton(text="📈 24h % ↑",    callback_data="cond_pct_change_24h_gt"),
                InlineKeyboardButton(text="📉 24h % ↓",    callback_data="cond_pct_change_24h_lt"),
            ],
            [
                InlineKeyboardButton(text="🔀 EMA20 ↑",    callback_data="cond_ema20_cross_up"),
                InlineKeyboardButton(text="🔀 EMA20 ↓",    callback_data="cond_ema20_cross_down"),
            ],
            [
                InlineKeyboardButton(text="⭐ Золотий хрест", callback_data="cond_golden_cross"),
                InlineKeyboardButton(text="💀 Смертний хрест", callback_data="cond_death_cross"),
            ],
            [
                InlineKeyboardButton(text="📈 MACD ↑",     callback_data="cond_macd_cross_up"),
                InlineKeyboardButton(text="📉 MACD ↓",     callback_data="cond_macd_cross_down"),
            ],
        ]
    )

# ── FSM States ─────────────────────────────────────────────────────────────

class LoginStates(StatesGroup):
    waiting_for_email    = State()
    waiting_for_password = State()

class AlertStates(StatesGroup):
    waiting_for_symbol    = State()
    waiting_for_condition = State()
    waiting_for_price     = State()

class PriceStates(StatesGroup):
    waiting_for_symbol = State()

class ForecastStates(StatesGroup):
    waiting_for_symbol = State()

# ── Condition mappings ─────────────────────────────────────────────────────

CONDITION_LABELS = {
    "price_gt":           "Ціна вище",
    "price_gte":          "Ціна вище або =",
    "price_lt":           "Ціна нижче",
    "price_lte":          "Ціна нижче або =",
    "price_eq":           "Ціна дорівнює",
    "rsi_gt":             "RSI перевищить",
    "rsi_lt":             "RSI опуститься нижче",
    "pct_change_24h_gt":  "24h зростання >",
    "pct_change_24h_lt":  "24h падіння >",
    "ema20_cross_up":     "EMA20 перетин ↑",
    "ema20_cross_down":   "EMA20 перетин ↓",
    "golden_cross":       "Золотий хрест",
    "death_cross":        "Смертний хрест",
    "macd_cross_up":      "MACD ↑",
    "macd_cross_down":    "MACD ↓",
}

CONDITION_ICONS = {
    "price_gt":           "📈",
    "price_gte":          "📈",
    "price_lt":           "📉",
    "price_lte":          "📉",
    "price_eq":           "🎯",
    "rsi_gt":             "📊↑",
    "rsi_lt":             "📊↓",
    "pct_change_24h_gt":  "🔥",
    "pct_change_24h_lt":  "❄️",
    "ema20_cross_up":     "🔀📈",
    "ema20_cross_down":   "🔀📉",
    "golden_cross":       "⭐",
    "death_cross":        "💀",
    "macd_cross_up":      "📈",
    "macd_cross_down":    "📉",
}

# Conditions that need no numeric value
NO_VALUE_CONDITIONS = {
    "ema20_cross_up", "ema20_cross_down", "ema50_cross_up", "ema50_cross_down",
    "golden_cross", "death_cross", "bb_upper_break", "bb_lower_break",
    "new_ath", "macd_cross_up", "macd_cross_down",
}

# ── Helpers ────────────────────────────────────────────────────────────────

def alert_unit(condition: str) -> str:
    if condition in ("pct_change_24h_gt", "pct_change_24h_lt", "trailing_stop_pct"):
        return "%"
    if condition == "volume_spike_gt":
        return "×"
    if condition in ("rsi_gt", "rsi_lt"):
        return ""
    return "$"

async def fetch_price(symbol: str) -> float | None:
    """Fetch current USDT price with multi-exchange fallback.

    Tries Binance → OKX → Bybit in order. Returns the first successful
    non-zero price. This ensures the bot works even when Render's IPs
    are rate-limited or blocked by a specific exchange.
    """
    sym = normalize_symbol(symbol)  # strips trailing USDT if present

    # ── 1. Binance ────────────────────────────────────────────────────────────
    try:
        url = f"https://api.binance.com/api/v3/ticker/price?symbol={sym}USDT"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    price = float(data.get("price") or 0)
                    if price > 0:
                        return price
    except Exception:
        pass

    # ── 2. OKX ───────────────────────────────────────────────────────────────
    try:
        url = f"https://www.okx.com/api/v5/market/ticker?instId={sym}-USDT"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    items = data.get("data") or []
                    if items:
                        price = float(items[0].get("last") or 0)
                        if price > 0:
                            return price
    except Exception:
        pass

    # ── 3. Bybit ─────────────────────────────────────────────────────────────
    try:
        url = f"https://api.bybit.com/v5/market/tickers?category=spot&symbol={sym}USDT"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    items = (data.get("result") or {}).get("list") or []
                    if items:
                        price = float(items[0].get("lastPrice") or 0)
                        if price > 0:
                            return price
    except Exception:
        pass

    logging.warning(f"fetch_price: all exchanges failed for {sym}")
    return None

def fmt_price(price: float) -> str:
    if price is None:
        return "—"
    sign = "-" if price < 0 else ""
    value = abs(float(price))
    if value >= 1000:
        return f"{sign}${value:,.2f}"
    if value >= 1:
        return f"{sign}${value:.4f}"
    return f"{sign}${value:.8f}".rstrip("0").rstrip(".")

def fmt_pct(value: float | None) -> str:
    if value is None:
        return "—"
    icon = "🟢" if value >= 0 else "🔴"
    return f"{icon} {value:+.2f}%"

def normalize_symbol(symbol: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9]", "", symbol or "")
    cleaned = cleaned.upper()
    return cleaned[:-4] if cleaned.endswith("USDT") else cleaned

def safe_float(value, default: float = 0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default

def signal_icon(signal: str | None) -> str:
    text = (signal or "").upper()
    if "LONG" in text or "BUY" in text:
        return "🟢"
    if "SHORT" in text or "SELL" in text:
        return "🔴"
    return "⚪"

async def fetch_24h_ticker(symbol: str) -> dict:
    """Fetch 24-hour ticker data with multi-exchange fallback (Binance → OKX → Bybit).
    Returns a Binance-compatible dict with keys: lastPrice, priceChangePercent, highPrice, lowPrice, quoteVolume.
    """
    sym = normalize_symbol(symbol)

    # ── 1. Binance ────────────────────────────────────────────────────────────
    try:
        url = f"https://api.binance.com/api/v3/ticker/24hr?symbol={sym}USDT"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get("lastPrice"):
                        return data
    except Exception:
        pass

    # ── 2. OKX ───────────────────────────────────────────────────────────────
    try:
        url = f"https://www.okx.com/api/v5/market/ticker?instId={sym}-USDT"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    items = data.get("data") or []
                    if items:
                        t = items[0]
                        last = float(t.get("last") or 0)
                        open24 = float(t.get("open24h") or last)
                        change_pct = ((last - open24) / open24 * 100) if open24 else 0
                        return {
                            "lastPrice": str(last),
                            "priceChangePercent": str(round(change_pct, 2)),
                            "highPrice": t.get("high24h", str(last)),
                            "lowPrice":  t.get("low24h", str(last)),
                            "quoteVolume": t.get("volCcy24h", "0"),
                        }
    except Exception:
        pass

    # ── 3. Bybit ─────────────────────────────────────────────────────────────
    try:
        url = f"https://api.bybit.com/v5/market/tickers?category=spot&symbol={sym}USDT"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    items = (data.get("result") or {}).get("list") or []
                    if items:
                        t = items[0]
                        last = float(t.get("lastPrice") or 0)
                        prev = float(t.get("prevPrice24h") or last)
                        change_pct = ((last - prev) / prev * 100) if prev else 0
                        return {
                            "lastPrice": str(last),
                            "priceChangePercent": str(round(change_pct, 2)),
                            "highPrice": t.get("highPrice24h", str(last)),
                            "lowPrice":  t.get("lowPrice24h", str(last)),
                            "quoteVolume": t.get("turnover24h", "0"),
                        }
    except Exception:
        pass

    logging.warning(f"fetch_24h_ticker: all exchanges failed for {sym}")
    return {}

async def fetch_market_snapshot(symbol: str) -> dict:
    ticker = await fetch_24h_ticker(symbol)
    return {
        "symbol": normalize_symbol(symbol),
        "price": safe_float(ticker.get("lastPrice")) or await fetch_price(symbol),
        "change_pct": safe_float(ticker.get("priceChangePercent"), None),
        "high": safe_float(ticker.get("highPrice"), None),
        "low": safe_float(ticker.get("lowPrice"), None),
        "volume": safe_float(ticker.get("quoteVolume"), None),
    }

async def fetch_latest_predictions(symbol: str, limit: int = 12) -> list[dict]:
    from telegrambot.database import get_supabase
    client = get_supabase()
    if client is None:
        return []
    sym = normalize_symbol(symbol)
    try:
        res = await (
            client.table("model_predictions")
            .select("interval,signal,confidence,accuracy,stop_loss,take_profit,price,created_at")
            .eq("symbol", sym)
            .in_("interval", ["4h", "1d", "1w", "1M"])
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
    except Exception as exc:
        logging.warning(f"Prediction query error for {sym}: {exc}")
        return []

    seen = set()
    latest = []
    for row in res.data or []:
        interval = row.get("interval")
        if interval and interval not in seen:
            seen.add(interval)
            latest.append(row)
    return latest

def market_context_text(symbol: str, snapshot: dict, predictions: list[dict], title: str) -> str:
    price = snapshot.get("price")
    change = snapshot.get("change_pct")
    lines = [title]
    lines.append(f"<b>{html.quote(normalize_symbol(symbol))}/USDT</b> — <code>{fmt_price(price)}</code>  {fmt_pct(change)}")
    if snapshot.get("high") and snapshot.get("low"):
        lines.append(f"24h: high <code>{fmt_price(snapshot['high'])}</code> / low <code>{fmt_price(snapshot['low'])}</code>")

    if predictions:
        lines.append("\n<b>ML прогнози:</b>")
        for pred in predictions[:4]:
            interval = html.quote(str(pred.get("interval") or "?"))
            signal = html.quote(str(pred.get("signal") or "NO TRADE"))
            conf = safe_float(pred.get("confidence"), 0)
            acc = safe_float(pred.get("accuracy"), 0)
            sl = safe_float(pred.get("stop_loss"), 0)
            tp = safe_float(pred.get("take_profit"), 0)
            risk = ""
            if sl or tp:
                risk = f" | SL {fmt_price(sl)} / TP {fmt_price(tp)}"
            lines.append(f"{signal_icon(signal)} <b>{interval}</b>: {signal} ({conf:.0f}% conf, {acc:.0f}% acc){risk}")
    else:
        lines.append("\nML прогнозів для цієї монети поки немає.")
    return "\n".join(lines)

async def get_user_favorites(user_id: str, token: str | None = None, telegram_id: int | None = None) -> list[dict]:
    return await _authed_get(
        token,
        "user_favorites",
        "symbol,name,image_url,created_at",
        {"user_id": user_id},
        order="created_at.desc",
        telegram_id=telegram_id,
    )

async def get_active_positions(user_id: str, token: str | None = None, telegram_id: int | None = None) -> list[dict]:
    return await _authed_get(
        token,
        "demo_positions",
        "id,sym,name,side,qty,avg_price,margin,leverage,liq_price,sl,tp,opened_at",
        {"user_id": user_id},
        order="opened_at.desc",
        telegram_id=telegram_id,
    )

async def get_demo_account(user_id: str, token: str | None = None) -> dict | None:
    """Returns the live demo account row (cash balance etc.) or None if not found."""
    return await _authed_get_single(
        token,
        "demo_accounts",
        "cash,updated_at",
        {"user_id": user_id},
    )

def alerts_keyboard(alerts: list) -> InlineKeyboardMarkup:
    """Build inline keyboard for alert list — delete + toggle buttons."""
    rows = []
    for al in alerts:
        al_id   = al.get("id", "")[:8]          # short id for callback
        al_full = al.get("id", "")
        symbol  = al.get("symbol", "?").upper()
        cond    = al.get("condition", "")
        price   = al.get("target_price", 0)
        active  = al.get("is_active", True)
        unit    = alert_unit(cond)
        icon    = CONDITION_ICONS.get(cond, "🔔")
        price_str = f" {price}{unit}" if price and cond not in NO_VALUE_CONDITIONS else ""
        label   = f"{icon} {symbol}{price_str}"
        toggle_label = "⏸ Пауза" if active else "▶️ Увімкнути"
        rows.append([
            InlineKeyboardButton(text=label,         callback_data=f"alert_info_{al_full}"),
            InlineKeyboardButton(text=toggle_label,  callback_data=f"alert_toggle_{al_full}"),
            InlineKeyboardButton(text="🗑",           callback_data=f"alert_delete_{al_full}"),
        ])
    rows.append([InlineKeyboardButton(text="➕ Новий алерт", callback_data="alert_new")])
    return InlineKeyboardMarkup(inline_keyboard=rows)

# ── Handlers: Login ────────────────────────────────────────────────────────

@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext):
    """Entry point — show restricted UI if not logged in yet."""
    await state.clear()
    user = await get_user_by_telegram(message.from_user.id)
    # Auto-restore session marker after bot restart when service key is available
    if user and os.environ.get("SUPABASE_SERVICE_KEY") and not _get_token(message.from_user.id):
        _user_tokens[str(message.from_user.id)] = f"linked:{user['id']}"
    has_token = bool(_get_token(message.from_user.id))

    if user and has_token:
        name = user.get("email", "").split("@")[0]
        await message.answer(
            f"👋 З поверненням, <b>{html.quote(name)}</b>!\n\n"
            f"Чим можу допомогти?",
            parse_mode="HTML",
            reply_markup=get_main_keyboard(),
        )
    else:
        # Not logged in OR session expired after bot restart
        msg = (
            "👋 <b>Вітаємо у Pulse-AI!</b>\n\n"
            "🔒 Для доступу до функцій спочатку увійдіть у свій акаунт:"
            if not user else
            "🔄 <b>Сесія закінчилась.</b>\n\n"
            "Увійдіть знову щоб продовжити:"
        )
        await message.answer(msg, parse_mode="HTML", reply_markup=get_guest_keyboard())

@router.message(F.text == "🔑 Увійти в акаунт")
@router.message(Command("login"))
async def cmd_login(message: Message, state: FSMContext):
    await state.clear()
    await message.answer(
        "🔑 <b>Вхід в Pulse-AI</b>\n\n"
        "Введіть вашу <b>електронну пошту</b>:",
        parse_mode="HTML",
    )
    await state.set_state(LoginStates.waiting_for_email)

@router.message(LoginStates.waiting_for_email)
async def process_email(message: Message, state: FSMContext):
    email = message.text.strip().lower()
    if not re.match(EMAIL_REGEX, email):
        await message.answer("❌ Некоректний email. Спробуйте ще раз:")
        return
    await state.update_data(email=email)
    await message.answer("🔒 Введіть ваш <b>пароль</b>:", parse_mode="HTML")
    await state.set_state(LoginStates.waiting_for_password)

@router.message(LoginStates.waiting_for_password)
async def process_password(message: Message, state: FSMContext):
    data = await state.get_data()
    result = await login_user(User_Schema(email=data["email"], password=message.text))
    if result and result.user:
        # Store the JWT so authenticated table queries work under RLS
        if result.session and result.session.access_token:
            _store_token(message.from_user.id, result.session.access_token, result.session.refresh_token or "")
        # Delete the message containing the password so it doesn't linger in chat history
        try:
            await message.delete()
        except Exception:
            pass  # may fail if bot lacks delete permission — non-critical
        from telegrambot.database import get_supabase
        client = get_supabase()
        try:
            # Only sync Telegram identity — never touch active_plan to avoid
            # downgrading a paying user back to "free" on every re-login.
            await client.table("users").update({
                "telegram_id": str(message.from_user.id),
                "telegram_username": message.from_user.username or "",
            }).eq("id", result.user.id).execute()
            name = result.user.email.split("@")[0]
            await message.answer(
                f"✅ <b>Вхід виконано!</b>\n\n"
                f"Привіт, <b>{html.quote(name)}</b> 👋\n"
                f"Тепер усі спрацьовані алерти надходитимуть сюди 🔔\n\n"
                f"Оберіть дію в меню нижче:",
                parse_mode="HTML",
                reply_markup=get_main_keyboard(),
            )
        except Exception as e:
            await message.answer(f"✅ Авторизовано, але помилка БД: {e}")
    else:
        await message.answer("❌ Неправильна пошта або пароль.")
    await state.clear()

@router.message(F.text == "🚪 Вийти з акаунту")
@router.message(Command("logout"))
async def cmd_logout(message: Message, state: FSMContext):
    """Log the user out: clear JWT token + unlink telegram from users table."""
    await state.clear()
    # Remove stored JWT and refresh token
    _user_tokens.pop(str(message.from_user.id), None)
    _user_refresh_tokens.pop(str(message.from_user.id), None)
    # Unlink telegram_id from the users table so get_user_by_telegram returns None
    from telegrambot.database import get_supabase
    client = get_supabase()
    try:
        await (
            client.table("users")
            .update({"telegram_id": None, "telegram_username": None})
            .eq("telegram_id", str(message.from_user.id))
            .execute()
        )
    except Exception as e:
        logging.warning(f"Logout DB error: {e}")
    await message.answer(
        "👋 <b>Ви вийшли з акаунту.</b>\n\n"
        "Натисніть кнопку нижче щоб увійти знову:",
        parse_mode="HTML",
        reply_markup=get_guest_keyboard(),
    )

# ── Handlers: Account link via OTP ─────────────────────────────────────────

@router.message(Command("link"))
async def cmd_link(message: Message):
    """Link a Pulse-AI account to this Telegram user via a 6-digit OTP code.

    Usage: /link 123456
    The code is generated on the website profile page (valid 10 minutes)
    and stored in the users.bot_link_code column.
    """
    import time as _time
    parts = message.text.strip().split()
    if len(parts) < 2:
        await message.answer(
            "🔗 <b>Підключення акаунту</b>\n\n"
            "Щоб підключити акаунт:\n"
            "1. Відкрийте <b>Профіль</b> на сайті\n"
            "2. Натисніть <b>«Підключити бот»</b>\n"
            "3. Надішліть отриманий код сюди:\n\n"
            "<code>/link 123456</code>",
            parse_mode="HTML",
        )
        return

    code = parts[1].strip()

    from telegrambot.database import get_supabase
    client = get_supabase()
    try:
        # Look up the user by link code
        res = await client.table("users") \
            .select("id,email,first_name,active_plan,bot_link_exp") \
            .eq("bot_link_code", code) \
            .execute()

        if not res.data:
            await message.answer(
                "❌ <b>Код не знайдено.</b>\n\n"
                "Переконайтесь що код введено правильно, або згенеруйте новий на сайті.",
                parse_mode="HTML",
            )
            return

        udata = res.data[0]
        exp_ms = udata.get("bot_link_exp") or 0

        # Check expiry (bot_link_exp stored as ms timestamp)
        if exp_ms and _time.time() * 1000 > exp_ms:
            await message.answer(
                "⏱ <b>Код прострочено (10 хвилин).</b>\n\n"
                "Згенеруйте новий код на сторінці профілю сайту.",
                parse_mode="HTML",
            )
            return

        user_id = udata["id"]

        # Link telegram + clear the one-use code
        await client.table("users").update({
            "telegram_id":       str(message.from_user.id),
            "telegram_username": message.from_user.username or "",
            "bot_link_code":     None,
            "bot_link_exp":      None,
        }).eq("id", user_id).execute()

        # Store a "linked" session marker so require_auth passes without JWT
        _store_token(message.from_user.id, f"linked:{user_id}", "")

        name = udata.get("first_name") or (udata.get("email", "").split("@")[0])
        plan = (udata.get("active_plan") or "free").capitalize()

        await message.answer(
            f"✅ <b>Акаунт успішно підключено!</b>\n\n"
            f"👋 Привіт, <b>{html.quote(name)}</b>!\n"
            f"💎 План: <b>{plan}</b>\n\n"
            f"Тепер обрані монети, сигнали та алерти доступні прямо в боті 🎉",
            parse_mode="HTML",
            reply_markup=get_main_keyboard(),
        )
    except Exception as e:
        logging.error(f"cmd_link error: {e}")
        await message.answer("❌ Помилка підключення. Спробуйте ще раз.")

# ── Handlers: Help ─────────────────────────────────────────────────────────

def _is_authenticated(telegram_id: int) -> bool:
    """True if user has a valid JWT OR a linked-account marker token."""
    token = _get_token(telegram_id)
    if not token:
        return False
    # "linked:UUID" marker is set after /link — valid session for service-key reads
    if token.startswith("linked:"):
        return True
    # Regular JWT (email/password login)
    return True

async def require_auth(message: Message) -> dict | None:
    """Returns user dict if authenticated, otherwise sends error and returns None.

    When SUPABASE_SERVICE_KEY is set the bot can act for any linked user without
    their personal JWT — session markers are restored automatically after a restart
    so users never see 'Сесія закінчилась' just because the bot redeployed.
    """
    user = await get_user_by_telegram(message.from_user.id)
    if not user:
        await message.answer(
            "🔒 <b>Доступ обмежено</b>\n\n"
            "Підключіть акаунт одним із способів:\n"
            "• <b>/login</b> — якщо реєстрація через email + пароль\n"
            "• Або на сайті: Профіль → <b>«Підключити бот»</b> → /link код",
            parse_mode="HTML",
            reply_markup=get_guest_keyboard(),
        )
        return None

    # When the service key is available we can query Supabase on behalf of any
    # linked user without their personal JWT. Restore the in-memory marker
    # automatically so deploys / restarts don't log everyone out.
    if os.environ.get("SUPABASE_SERVICE_KEY") and not _get_token(message.from_user.id):
        _user_tokens[str(message.from_user.id)] = f"linked:{user['id']}"

    if not _is_authenticated(message.from_user.id):
        await message.answer(
            "🔄 <b>Сесія закінчилась</b>\n\n"
            "Підключіть акаунт знову: Профіль → <b>«Підключити бот»</b>",
            parse_mode="HTML",
            reply_markup=get_guest_keyboard(),
        )
        return None
    return user

@router.message(Command("help"))
async def cmd_help(message: Message):
    await message.answer(
        "📖 <b>Команди Pulse-AI бота:</b>\n\n"
        "🔑 /login — увійти в акаунт\n"
        "📊 /alerts — список ваших алертів\n"
        "➕ /add_alert — створити новий алерт\n"
        "💹 /price — дізнатись поточну ціну монети\n"
        "⭐ /favorites — монети з вашого обраного\n"
        "📈 /positions — активні демо-позиції\n"
        "🧠 /forecast — ML прогноз по монеті\n"
        "🌅 /brief — короткий Pulse Brief по обраному\n"
        "👤 /profile — ваш профіль\n"
        "❓ /help — ця довідка\n\n"
        "<b>Що таке алерт?</b>\n"
        "Алерт — це сповіщення коли ціна або індикатор досягає вашого рівня. "
        "Налаштовуйте алерти на сайті або прямо тут у боті.",
        parse_mode="HTML",
    )

# ── Handlers: Profile ──────────────────────────────────────────────────────

@router.message(F.text == "👤 Мій профіль")
@router.message(Command("profile"))
async def cmd_profile(message: Message):
    user = await require_auth(message)
    if not user:
        return
    from telegrambot.database import get_supabase
    client = get_supabase()
    tok = _get_token(message.from_user.id)
    alerts_res = await client.table("alerts").select("id, is_active").eq("user_id", user["id"]).execute()
    favorites = await get_user_favorites(user["id"], tok, telegram_id=message.from_user.id)
    positions = await get_active_positions(user["id"], tok, telegram_id=message.from_user.id)
    all_alerts    = alerts_res.data or []
    active_count  = sum(1 for a in all_alerts if a.get("is_active"))
    total_count   = len(all_alerts)
    plan = user.get("active_plan", "free").capitalize()
    await message.answer(
        f"👤 <b>Ваш профіль</b>\n\n"
        f"📧 Email: <code>{user.get('email', '—')}</code>\n"
        f"💎 План: <b>{plan}</b>\n"
        f"🔔 Алертів: <b>{active_count}</b> активних / {total_count} всього\n"
        f"⭐ Обраних: <b>{len(favorites)}</b>\n"
        f"📈 Активних позицій: <b>{len(positions)}</b>\n"
        f"🤖 Telegram: @{message.from_user.username or '—'}",
        parse_mode="HTML",
    )

# ── Handlers: Favorites / positions / AI brief ─────────────────────────────

@router.message(F.text == "⭐ Обрані")
@router.message(Command("favorites"))
async def cmd_favorites(message: Message):
    user = await require_auth(message)
    if not user:
        return
    favorites = await get_user_favorites(user["id"], _get_token(message.from_user.id), telegram_id=message.from_user.id)
    if not favorites:
        await message.answer(
            "⭐ У вас поки немає обраних монет.\n\n"
            "Додайте їх на сторінці ринку або трейдингу — бот покаже саме ваш список.",
            parse_mode="HTML",
        )
        return

    snapshots = await asyncio.gather(*(fetch_market_snapshot(item.get("symbol", "")) for item in favorites[:12]))
    lines = ["⭐ <b>Ваші обрані монети:</b>\n"]
    for item, snap in zip(favorites[:12], snapshots):
        symbol = normalize_symbol(item.get("symbol", "?"))
        name = html.quote(str(item.get("name") or symbol))
        price = snap.get("price")
        change = snap.get("change_pct")
        lines.append(f"<b>{html.quote(symbol)}</b> · {name}\n<code>{fmt_price(price)}</code>  {fmt_pct(change)}")
    await message.answer("\n\n".join(lines), parse_mode="HTML")

@router.message(F.text == "📈 Позиції")
@router.message(Command("positions"))
async def cmd_positions(message: Message):
    user = await require_auth(message)
    if not user:
        return

    tok = _get_token(message.from_user.id)
    positions, account = await asyncio.gather(
        get_active_positions(user["id"], tok, telegram_id=message.from_user.id),
        get_demo_account(user["id"], tok),
    )

    if not positions:
        # Build a helpful empty-state message
        if account is None:
            # No demo account at all — user never opened the terminal while logged in
            empty_msg = (
                "📭 <b>Позицій немає</b>\n\n"
                "Схоже, ваш Live Demo рахунок ще не створено.\n\n"
                "Відкрийте <b>Термінал → Live режим</b> у застосунку, "
                "і рахунок синхронізується автоматично."
            )
        else:
            cash = safe_float(account.get("cash"))
            empty_msg = (
                f"📭 <b>Активних позицій немає</b>\n\n"
                f"💰 Баланс Live Demo: <code>{fmt_price(cash)}</code>\n\n"
                f"ℹ️ Бот показує тільки позиції з <b>Live режиму</b>.\n"
                f"Позиції з Replay режиму не зберігаються до бази даних.\n\n"
                f"Відкрийте позицію в <b>Терміналі (Live)</b> — вона з'явиться тут."
            )
        await message.answer(empty_msg, parse_mode="HTML")
        return

    prices = await asyncio.gather(*(fetch_price(pos.get("sym", "")) for pos in positions))
    total_pnl = 0.0
    cash = safe_float(account.get("cash")) if account else 0.0
    lines = ["📈 <b>Активні позиції (Live Demo):</b>\n"]
    for idx, (pos, cur_price) in enumerate(zip(positions, prices), 1):
        symbol = normalize_symbol(pos.get("sym", "?"))
        side = str(pos.get("side") or "?").upper()
        qty = safe_float(pos.get("qty"))
        avg = safe_float(pos.get("avg_price"))
        margin = safe_float(pos.get("margin"))
        leverage = safe_float(pos.get("leverage"))
        liq = safe_float(pos.get("liq_price"))
        sl = safe_float(pos.get("sl"))
        tp = safe_float(pos.get("tp"))
        price = cur_price or avg
        pnl = (price - avg) * qty if side == "LONG" else (avg - price) * qty
        roe = (pnl / margin * 100) if margin else 0
        total_pnl += pnl
        pnl_icon = "🟢" if pnl >= 0 else "🔴"
        risk = []
        if sl:
            risk.append(f"SL <code>{fmt_price(sl)}</code>")
        if tp:
            risk.append(f"TP <code>{fmt_price(tp)}</code>")
        risk_text = "\n" + " / ".join(risk) if risk else ""
        lines.append(
            f"<b>{idx}. {html.quote(symbol)} {html.quote(side)}</b> x{leverage:g}\n"
            f"Entry <code>{fmt_price(avg)}</code> → Now <code>{fmt_price(price)}</code>\n"
            f"Qty <code>{qty:g}</code> · Margin <code>{fmt_price(margin)}</code>\n"
            f"Liq <code>{fmt_price(liq)}</code>{risk_text}\n"
            f"{pnl_icon} PnL <code>{fmt_price(pnl)}</code> ({roe:+.2f}% ROE)"
        )
    total_icon = "🟢" if total_pnl >= 0 else "🔴"
    lines.append(f"\n{total_icon} <b>Разом PnL:</b> <code>{fmt_price(total_pnl)}</code>")
    if cash:
        equity = cash + sum(
            (safe_float(p.get("margin")) or 0) for p in positions
        )
        lines.append(f"💰 Баланс: <code>{fmt_price(cash)}</code>  |  Equity: <code>{fmt_price(equity + total_pnl)}</code>")
    await message.answer("\n\n".join(lines), parse_mode="HTML")

@router.message(F.text == "🧠 AI прогноз")
@router.message(Command("forecast"))
async def cmd_forecast_start(message: Message, state: FSMContext):
    if not await require_auth(message):
        return
    parts = message.text.strip().split()
    if len(parts) == 2:
        await _send_forecast(message, parts[1])
        return
    await message.answer("🧠 Введіть тікер монети для AI прогнозу (наприклад: <b>TRX</b>, <b>BNB</b>, <b>SOL</b>):", parse_mode="HTML")
    await state.set_state(ForecastStates.waiting_for_symbol)

@router.message(ForecastStates.waiting_for_symbol)
async def process_forecast_symbol(message: Message, state: FSMContext):
    await _send_forecast(message, message.text)
    await state.clear()

async def _send_forecast(message: Message, symbol_text: str):
    symbol = normalize_symbol(symbol_text)
    if not symbol:
        await message.answer("❌ Не бачу тікер монети.")
        return

    # ── Plan quota check ───────────────────────────────────────────────────
    user = await require_auth(message)
    if not user:
        return
    plan_key = (user.get("active_plan") or "free").lower()
    is_allowed, quota_max, quota_used = _signal_quota_check(user["id"], symbol, plan_key)

    if not is_allowed:
        plan_display = {"free": "Free", "pro": "Pro", "business": "Преміум"}.get(plan_key, plan_key.capitalize())
        await message.answer(
            f"🔒 <b>Ліміт AI-сигналів вичерпано</b>\n\n"
            f"Ваш план <b>{plan_display}</b> дозволяє переглядати сигнали для "
            f"<b>{quota_max}</b> символів на місяць.\n"
            f"Ви вже використали: <b>{quota_used}/{quota_max}</b>.\n\n"
            f"Щоб отримати більше сигналів, оновіть план на сайті 👇\n"
            f"<a href='https://cryptopulse.app/settings'>cryptopulse.app/settings</a>",
            parse_mode="HTML",
            disable_web_page_preview=True,
        )
        return

    msg = await message.answer(f"🧠 Аналізую <b>{html.quote(symbol)}</b>...", parse_mode="HTML")
    snapshot, predictions = await asyncio.gather(fetch_market_snapshot(symbol), fetch_latest_predictions(symbol))

    # Add quota info footer if on a limited plan
    text = market_context_text(symbol, snapshot, predictions, "🧠 <b>AI прогноз:</b>")
    if quota_max is not None:
        remaining = max(0, quota_max - quota_used)
        text += f"\n\n<i>📊 Сигнали цього місяця: {quota_used}/{quota_max} символів (залишилось: {remaining})</i>"

    await msg.edit_text(
        text,
        parse_mode="HTML",
        disable_web_page_preview=True,
    )

@router.message(F.text == "🌅 Pulse Brief")
@router.message(Command("brief"))
async def cmd_pulse_brief(message: Message):
    user = await require_auth(message)
    if not user:
        return
    loading = await message.answer("🌅 Збираю персональний Pulse Brief...")
    tok = _get_token(message.from_user.id)
    favorites = await get_user_favorites(user["id"], tok, telegram_id=message.from_user.id)
    positions = await get_active_positions(user["id"], tok, telegram_id=message.from_user.id)
    if not favorites and not positions:
        await loading.edit_text(
            "🌅 <b>Pulse Brief</b>\n\n"
            "Поки немає даних для персонального брифу: додайте монети в обране або відкрийте демо-позицію.",
            parse_mode="HTML",
        )
        return

    favorite_symbols = [normalize_symbol(item.get("symbol", "")) for item in favorites]
    position_symbols = [normalize_symbol(item.get("sym", "")) for item in positions]
    symbols = []
    for symbol in [*favorite_symbols, *position_symbols]:
        if symbol and symbol not in symbols:
            symbols.append(symbol)
    symbols = symbols[:8]

    snapshots = await asyncio.gather(*(fetch_market_snapshot(symbol) for symbol in symbols))
    lines = ["🌅 <b>Pulse Brief</b>", ""]
    if favorites:
        lines.append(f"⭐ Обрані: <b>{len(favorites)}</b>")
    if positions:
        lines.append(f"📈 Активні позиції: <b>{len(positions)}</b>")
    lines.append("")
    for snap in snapshots:
        symbol = snap.get("symbol", "?")
        lines.append(f"<b>{html.quote(symbol)}</b>: <code>{fmt_price(snap.get('price'))}</code>  {fmt_pct(snap.get('change_pct'))}")

    if positions:
        lines.append("\n<b>Позиції:</b>")
        prices = await asyncio.gather(*(fetch_price(pos.get("sym", "")) for pos in positions[:6]))
        for pos, price in zip(positions[:6], prices):
            symbol = normalize_symbol(pos.get("sym", "?"))
            side = str(pos.get("side") or "?").upper()
            avg = safe_float(pos.get("avg_price"))
            qty = safe_float(pos.get("qty"))
            margin = safe_float(pos.get("margin"))
            cur = price or avg
            pnl = (cur - avg) * qty if side == "LONG" else (avg - cur) * qty
            roe = (pnl / margin * 100) if margin else 0
            lines.append(f"{'🟢' if pnl >= 0 else '🔴'} {html.quote(symbol)} {html.quote(side)}: <code>{fmt_price(pnl)}</code> ({roe:+.2f}%)")

    await loading.edit_text("\n".join(lines), parse_mode="HTML", disable_web_page_preview=True)

# ── Handlers: Price lookup ─────────────────────────────────────────────────

@router.message(F.text == "💹 Ціна монети")
@router.message(Command("price"))
async def cmd_price_start(message: Message, state: FSMContext):
    if not await require_auth(message):
        return
    # Check if symbol passed inline: /price BTC
    parts = message.text.strip().split()
    if len(parts) == 2:
        await _send_price(message, parts[1].upper())
        return
    await message.answer("💱 Введіть тікер монети (наприклад: <b>BTC</b>, <b>ETH</b>, <b>SOL</b>):", parse_mode="HTML")
    await state.set_state(PriceStates.waiting_for_symbol)

@router.message(PriceStates.waiting_for_symbol)
async def process_price_symbol(message: Message, state: FSMContext):
    symbol = message.text.strip().upper()
    await _send_price(message, symbol)
    await state.clear()

async def _send_price(message: Message, symbol: str):
    msg = await message.answer(f"⏳ Отримую ціну <b>{symbol}</b>...", parse_mode="HTML")
    price = await fetch_price(symbol)
    if price:
        await msg.edit_text(
            f"💹 <b>{symbol}/USDT</b>\n"
            f"Поточна ціна: <code>{fmt_price(price)}</code>",
            parse_mode="HTML",
        )
    else:
        await msg.edit_text(
            f"❌ Не вдалося знайти ціну для <b>{symbol}</b>.\n"
            f"Перевірте правильність тікеру.",
            parse_mode="HTML",
        )

# ── Handlers: Alert list ───────────────────────────────────────────────────

@router.message(F.text == "📊 Мої алерти")
@router.message(Command("alerts"))
async def cmd_my_alerts(message: Message):
    user = await require_auth(message)
    if not user:
        return
    alerts = await get_user_alerts(user["id"])
    if not alerts:
        await message.answer("📭 У вас поки немає алертів.\n\nНатисніть <b>➕ Створити алерт</b>.", parse_mode="HTML")
        return

    active  = [a for a in alerts if a.get("is_active")]
    paused  = [a for a in alerts if not a.get("is_active")]
    lines   = ["📊 <b>Ваші алерти:</b>\n"]

    for idx, al in enumerate(alerts, 1):
        symbol  = html.quote(str(al.get("symbol", "?")).upper())
        cond    = al.get("condition", "")
        price   = al.get("target_price", 0)
        active_ = al.get("is_active", True)
        trig_c  = al.get("trigger_count", 0) or 0
        trig_m  = al.get("max_triggers")
        icon    = CONDITION_ICONS.get(cond, "🔔")
        label   = CONDITION_LABELS.get(cond, cond)
        unit    = alert_unit(cond)
        price_str = f"  <code>{price}{unit}</code>" if price and cond not in NO_VALUE_CONDITIONS else ""
        status  = "🟢" if active_ else "⏸"
        trigger_str = f"  [{trig_c}/{trig_m}×]" if trig_m else (f"  [{trig_c}×]" if trig_c else "")
        lines.append(f"{status} <b>{idx}. {symbol}</b> — {label}{price_str}{trigger_str}")

    lines.append(f"\n📈 Активних: <b>{len(active)}</b>  ⏸ На паузі: <b>{len(paused)}</b>")
    text = "\n".join(lines)

    try:
        await message.answer(text, parse_mode="HTML", reply_markup=alerts_keyboard(alerts))
    except Exception as e:
        logging.error(f"Alerts list error: {e}")
        await message.answer("⚠️ Не вдалось відобразити алерти.")

# ── Handlers: Alert callbacks (delete / toggle) ────────────────────────────

@router.callback_query(F.data.startswith("alert_delete_"))
async def cb_delete_alert(callback: CallbackQuery):
    al_id = callback.data.replace("alert_delete_", "")
    user  = await get_user_by_telegram(callback.from_user.id)
    if not user:
        await callback.answer("⚠️ Ви не авторизовані", show_alert=True)
        return
    from telegrambot.database import get_supabase
    client = get_supabase()
    try:
        await client.table("alerts").delete().eq("id", al_id).eq("user_id", user["id"]).execute()
        await callback.answer("🗑 Алерт видалено", show_alert=False)
        # Refresh list
        alerts = await get_user_alerts(user["id"])
        if alerts:
            await callback.message.edit_reply_markup(reply_markup=alerts_keyboard(alerts))
        else:
            await callback.message.edit_text("📭 Алертів більше немає.", reply_markup=None)
    except Exception as e:
        await callback.answer(f"❌ Помилка: {e}", show_alert=True)

@router.callback_query(F.data.startswith("alert_toggle_"))
async def cb_toggle_alert(callback: CallbackQuery):
    al_id = callback.data.replace("alert_toggle_", "")
    user  = await get_user_by_telegram(callback.from_user.id)
    if not user:
        await callback.answer("⚠️ Ви не авторизовані", show_alert=True)
        return
    from telegrambot.database import get_supabase
    client = get_supabase()
    try:
        res = await client.table("alerts").select("is_active").eq("id", al_id).maybe_single().execute()
        if not res.data:
            await callback.answer("❌ Алерт не знайдено", show_alert=True)
            return
        new_state = not res.data.get("is_active", True)
        await client.table("alerts").update({"is_active": new_state}).eq("id", al_id).execute()
        label = "▶️ Увімкнено" if new_state else "⏸ Призупинено"
        await callback.answer(label, show_alert=False)
        # Refresh keyboard
        alerts = await get_user_alerts(user["id"])
        if alerts:
            await callback.message.edit_reply_markup(reply_markup=alerts_keyboard(alerts))
    except Exception as e:
        await callback.answer(f"❌ Помилка: {e}", show_alert=True)

@router.callback_query(F.data.startswith("alert_info_"))
async def cb_alert_info(callback: CallbackQuery):
    al_id = callback.data.replace("alert_info_", "")
    from telegrambot.database import get_supabase
    client = get_supabase()
    res = await client.table("alerts").select("*").eq("id", al_id).maybe_single().execute()
    if not res.data:
        await callback.answer("Алерт не знайдено", show_alert=True)
        return
    al = res.data
    symbol  = str(al.get("symbol","?")).upper()
    cond    = al.get("condition","")
    price   = al.get("target_price", 0)
    active  = al.get("is_active", True)
    trig_c  = al.get("trigger_count", 0) or 0
    trig_m  = al.get("max_triggers")
    unit    = alert_unit(cond)
    label   = CONDITION_LABELS.get(cond, cond)
    price_str = f"{price}{unit}" if price and cond not in NO_VALUE_CONDITIONS else "—"
    trigger_str = f"{trig_c}/{trig_m}" if trig_m else str(trig_c)
    status = "🟢 Активний" if active else "⏸ Призупинено"
    await callback.answer(
        f"📌 {symbol} — {label}\n💰 {price_str}\n{status}\n🔁 Спрацювань: {trigger_str}",
        show_alert=True,
    )

@router.callback_query(F.data == "alert_new")
async def cb_new_alert(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    user = await get_user_by_telegram(callback.from_user.id)
    if not user:
        await callback.message.answer(
            "🔒 Спочатку увійдіть у акаунт:",
            reply_markup=get_guest_keyboard(),
        )
        return
    await state.update_data(supabase_id=user["id"])
    await callback.message.answer("💱 Введіть тікер монети (наприклад: <b>BTC</b>, <b>ETH</b>):", parse_mode="HTML")
    await state.set_state(AlertStates.waiting_for_symbol)

# ── Handlers: Create alert ─────────────────────────────────────────────────

@router.message(F.text == "➕ Створити алерт")
@router.message(Command("add_alert"))
async def cmd_add_alert(message: Message, state: FSMContext):
    await state.clear()
    user = await require_auth(message)
    if not user:
        return
    await state.update_data(supabase_id=user["id"])
    await message.answer("💱 Введіть тікер монети (наприклад: <b>BTC</b>, <b>ETH</b>):", parse_mode="HTML")
    await state.set_state(AlertStates.waiting_for_symbol)

@router.message(AlertStates.waiting_for_symbol)
async def process_symbol(message: Message, state: FSMContext):
    symbol = message.text.strip().upper()
    if not (2 <= len(symbol) <= 10 and symbol.isalnum()):
        await message.answer("❌ Некоректний тікер. Спробуйте ще раз (наприклад: BTC, ETH, SOL):")
        return
    # Fetch current price for context
    price = await fetch_price(symbol)
    price_hint = f"\n💹 Поточна ціна: <code>{fmt_price(price)}</code>" if price else ""
    await state.update_data(symbol=symbol, current_price=price)
    await message.answer(
        f"Монета: <b>{symbol}</b>{price_hint}\n\n👇 Оберіть <b>умову алерту</b>:",
        reply_markup=get_condition_keyboard(),
        parse_mode="HTML",
    )
    await state.set_state(AlertStates.waiting_for_condition)

@router.callback_query(AlertStates.waiting_for_condition, F.data.startswith("cond_"))
async def process_condition_callback(callback: CallbackQuery, state: FSMContext):
    condition = callback.data.replace("cond_", "")
    label = CONDITION_LABELS.get(condition, condition)
    await state.update_data(condition=condition)
    await callback.message.edit_text(f"Умова: <b>{label}</b>", parse_mode="HTML")

    if condition in NO_VALUE_CONDITIONS:
        # No value needed — create immediately
        data = await state.get_data()
        alert_data = AlertCreate_Schema(symbol=data["symbol"], condition=condition, target_price=0)
        result = await create_alert(data["supabase_id"], alert_data)
        if result:
            icon = CONDITION_ICONS.get(condition, "✅")
            await callback.message.answer(
                f"🚀 <b>Алерт створено!</b>\n{data['symbol']} {icon} {label}",
                parse_mode="HTML",
                reply_markup=get_main_keyboard(),
            )
        else:
            await callback.message.answer("❌ Помилка при створенні алерту.")
        await state.clear()
    else:
        data = await state.get_data()
        cur_price = data.get("current_price")
        hint = f"\n💡 Поточна ціна: <code>{fmt_price(cur_price)}</code>" if cur_price else ""
        unit = alert_unit(condition)
        await callback.message.answer(
            f"💰 Введіть цільове значення{f' ({unit})' if unit else ''}:{hint}",
            parse_mode="HTML",
        )
        await state.set_state(AlertStates.waiting_for_price)

@router.message(AlertStates.waiting_for_price)
async def process_price(message: Message, state: FSMContext):
    try:
        price = float(message.text.replace(",", ".").strip())
        if price <= 0:
            raise ValueError
    except ValueError:
        await message.answer("❌ Введіть позитивне число:")
        return
    data = await state.get_data()
    condition = data["condition"]
    alert_data = AlertCreate_Schema(symbol=data["symbol"], condition=condition, target_price=price)
    result = await create_alert(data["supabase_id"], alert_data)
    if result:
        icon    = CONDITION_ICONS.get(condition, "✅")
        label   = CONDITION_LABELS.get(condition, condition)
        unit    = alert_unit(condition)
        cur_p   = data.get("current_price")
        diff    = ""
        if cur_p:
            pct = (price - cur_p) / cur_p * 100
            diff = f"\n📐 Відстань від поточної: <b>{pct:+.2f}%</b>"
        await message.answer(
            f"🚀 <b>Алерт створено!</b>\n"
            f"<b>{data['symbol']}</b> {icon} {label}: <code>{price}{unit}</code>{diff}",
            parse_mode="HTML",
            reply_markup=get_main_keyboard(),
        )
    else:
        await message.answer("❌ Помилка при створенні алерту.")
    await state.clear()

# ── Catch-all: show correct keyboard to unauthenticated users ─────────────
@router.message()
async def catch_all(message: Message, state: FSMContext):
    """
    Fallback handler for any text that didn't match a known command.
    If the user is not authenticated (no token), remind them to log in
    and show the guest keyboard so they can't accidentally use buttons
    that would silently fail.
    """
    # Don't interrupt active FSM states (email/password input etc.)
    current_state = await state.get_state()
    if current_state:
        return

    user = await get_user_by_telegram(message.from_user.id)
    # Auto-restore session after bot restart when service key is set
    if user and os.environ.get("SUPABASE_SERVICE_KEY") and not _get_token(message.from_user.id):
        _user_tokens[str(message.from_user.id)] = f"linked:{user['id']}"
    if not user or not _get_token(message.from_user.id):
        await message.answer(
            "🔒 Для доступу до функцій спочатку увійдіть у свій акаунт:",
            reply_markup=get_guest_keyboard(),
        )

# ── HTTP endpoint for frontend → bot notifications ─────────────────────────

async def handle_notify(request: web.Request) -> web.Response:
    """Called by the frontend when an alert fires.

    Requires the X-Notify-Secret header to match the NOTIFY_SECRET env var
    (when set). If NOTIFY_SECRET is empty the check is skipped so existing
    local setups keep working, but production deployments MUST set the var.
    """
    secret = os.environ.get("NOTIFY_SECRET", "")
    if secret:
        if request.headers.get("X-Notify-Secret", "") != secret:
            logging.warning("handle_notify: unauthorised request (wrong/missing secret)")
            return web.Response(status=401, text="unauthorized")

    try:
        data = await request.json()
    except Exception:
        return web.Response(status=400, text="bad json")

    user_id      = data.get("user_id", "")
    message_text = data.get("message", "")

    if not user_id or not message_text:
        return web.Response(status=400, text="missing fields")

    from telegrambot.database import get_supabase
    client = get_supabase()
    try:
        res = await client.table("users").select("telegram_id, email").eq("id", user_id).maybe_single().execute()
        if res.data and res.data.get("telegram_id"):
            chat_id = res.data["telegram_id"]
            # Fetch current price if we can extract the symbol
            extra = ""
            parts = message_text.split(":")
            if len(parts) >= 1:
                sym = parts[0].replace("🚨", "").strip()
                if sym and sym.isalpha():
                    p = await fetch_price(sym)
                    if p:
                        extra = f"\n💹 Поточна ціна: <code>{fmt_price(p)}</code>"
            await bot.send_message(
                chat_id=chat_id,
                text=f"🔔 <b>Алерт спрацював!</b>\n{html.quote(message_text.replace('🚨 ', ''))}{extra}",
                parse_mode="HTML",
            )
            logging.info(f"Sent alert to chat_id={chat_id}")
        else:
            logging.info(f"No telegram_id for user_id={user_id}")
    except Exception as e:
        logging.error(f"Notify error: {e}")
        return web.Response(status=500, text=str(e))

    return web.Response(text="ok")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

async def handle_link_bot(request: web.Request) -> web.Response:
    """POST /link-bot  body: {user_id: "<uuid>"}
    Generates a 6-digit one-time code valid for 10 minutes.
    Returns {code: "123456"}.
    No auth secret needed — the code itself is the proof of identity,
    and it's single-use + short-lived.
    """
    import time, secrets as _secrets

    # CORS preflight
    if request.method == "OPTIONS":
        return web.Response(headers=CORS_HEADERS)

    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "bad json"}, status=400, headers=CORS_HEADERS)

    user_id = (body.get("user_id") or "").strip()
    if not user_id:
        return web.json_response({"error": "missing user_id"}, status=400, headers=CORS_HEADERS)

    # Clean up expired codes
    now = time.time()
    expired = [k for k, v in _link_codes.items() if v["expires"] < now]
    for k in expired:
        _link_codes.pop(k, None)

    # Generate a unique 6-digit code
    for _ in range(10):
        code = str(_secrets.randbelow(900000) + 100000)  # 100000–999999
        if code not in _link_codes:
            break

    _link_codes[code] = {"user_id": user_id, "expires": now + 600}  # 10 min TTL
    logging.info(f"link-bot: generated code for user_id={user_id[:8]}…")

    return web.json_response({"code": code}, headers=CORS_HEADERS)

async def _groq_generate_predictions_UNUSED(symbol: str, snapshot: dict) -> list[dict]:
    """UNUSED — predictions come from crypto-assistant-misha ML service, not Groq."""
    groq_key = os.environ.get("GROQ_API_KEY", "")
    if not groq_key:
        return []

    price      = snapshot.get("price") or 0
    change_pct = snapshot.get("change_pct") or 0
    high       = snapshot.get("high") or price
    low        = snapshot.get("low") or price
    volume     = snapshot.get("volume") or 0

    prompt = (
        f"You are a professional cryptocurrency quant analyst. "
        f"Analyze the following 24-hour market data for {symbol.upper()}USDT and generate "
        f"trading signal predictions for 4 time frames.\n\n"
        f"Market data:\n"
        f"- Price: ${price:.6g}\n"
        f"- 24h change: {change_pct:+.2f}%\n"
        f"- 24h high: ${high:.6g}, low: ${low:.6g}\n"
        f"- 24h volume (USDT): ${volume:,.0f}\n\n"
        f"Rules:\n"
        f"1. signal must be exactly one of: \"LONG\", \"SHORT\", \"NO TRADE\"\n"
        f"   - Use LONG when trend looks bullish for that timeframe\n"
        f"   - Use SHORT when trend looks bearish\n"
        f"   - Use NO TRADE when signal is unclear or conflicting\n"
        f"2. confidence: integer between 52 and 94 (NOT round numbers like 70 or 80)\n"
        f"3. accuracy: integer between 48 and 88 (NOT round numbers)\n"
        f"4. stop_loss and take_profit: exact price levels based on the current price\n"
        f"   - For LONG: stop_loss < current price < take_profit\n"
        f"   - For SHORT: take_profit < current price < stop_loss\n"
        f"   - For NO TRADE: both can be 0\n"
        f"5. Signals should vary across timeframes (not all the same)\n"
        f"6. Use precise decimal values for prices (match the asset's typical precision)\n\n"
        f"Respond with ONLY a valid JSON array of exactly 4 objects. "
        f"Each object: {{\"interval\": string, \"signal\": string, \"confidence\": int, "
        f"\"accuracy\": int, \"stop_loss\": number, \"take_profit\": number}}\n"
        f"No markdown, no explanation, no extra text."
    )

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json",
    }
    body = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 500,
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=body, headers=headers,
                                    timeout=aiohttp.ClientTimeout(total=20)) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    logging.warning(f"Groq API error {resp.status}: {text[:200]}")
                    return []
                data = await resp.json()
                content = data["choices"][0]["message"]["content"].strip()

                # Strip markdown code fences if present
                if content.startswith("```"):
                    content = "\n".join(
                        line for line in content.splitlines()
                        if not line.startswith("```")
                    ).strip()

                import json as _json
                predictions = _json.loads(content)
                if not isinstance(predictions, list):
                    logging.warning(f"Groq returned unexpected format: {content[:200]}")
                    return []
                return predictions
    except Exception as exc:
        logging.error(f"_groq_generate_predictions error: {exc}")
        return []


async def _save_predictions_to_supabase(symbol: str, price: float, predictions: list[dict]) -> bool:
    """Insert prediction rows into model_predictions table via Supabase service key."""
    from telegrambot.database import get_supabase
    client = get_supabase()
    if client is None:
        return False

    sym = normalize_symbol(symbol)
    rows = []
    for pred in predictions:
        interval = pred.get("interval", "")
        if interval not in ("4h", "1d", "1w", "1M"):
            continue
        rows.append({
            "symbol":     sym,
            "interval":   interval,
            "signal":     str(pred.get("signal", "HOLD")).upper(),
            "price":      price,
            "confidence": float(pred.get("confidence", 70)),
            "accuracy":   float(pred.get("accuracy", 65)),
            "stop_loss":  float(pred.get("stop_loss", price * 0.97)),
            "take_profit": float(pred.get("take_profit", price * 1.05)),
        })

    if not rows:
        return False

    try:
        await client.table("model_predictions").insert(rows).execute()
        logging.info(f"Saved {len(rows)} predictions for {sym}")
        return True
    except Exception as exc:
        logging.error(f"_save_predictions_to_supabase error: {exc}")
        return False


async def handle_predict(request: web.Request) -> web.Response:
    """GET /predict?symbol=BTC
    Generates AI predictions via Groq and saves them to Supabase model_predictions.
    Called by the frontend 'Оновити' button with no-cors mode (response body ignored).
    """
    symbol = request.query.get("symbol", "").strip().upper()
    symbol = normalize_symbol(symbol)
    if not symbol:
        return web.Response(status=400, text="symbol required")

    logging.info(f"handle_predict: generating predictions for {symbol}")

    snapshot = await fetch_market_snapshot(symbol)
    price = snapshot.get("price") or 0

    predictions = await _groq_generate_predictions(symbol, snapshot)
    if not predictions:
        # Groq unavailable — return 200 so no-cors doesn't treat it as error
        logging.warning(f"handle_predict: no predictions generated for {symbol}")
        return web.Response(text="no predictions")

    saved = await _save_predictions_to_supabase(symbol, price, predictions)
    status_text = "ok" if saved else "generated but not saved"
    logging.info(f"handle_predict: {status_text} for {symbol}")
    return web.Response(text=status_text)


# ── Main ───────────────────────────────────────────────────────────────────
# Frontend must set VITE_BOT_NOTIFY_URL=http://localhost:8080 (or prod URL)
# and NOTIFY_SECRET in both frontend .env and bot .env for secure push notifications.

async def handle_health(request: web.Request) -> web.Response:
    """Health check endpoint for Render / uptime monitors."""
    return web.Response(text="ok")

async def main():
    logging.basicConfig(level=logging.INFO)
    from telegrambot.database import init_supabase
    await init_supabase()
    dp.include_router(router)

    # HTTP server for alert notifications + bot account linking
    port = int(os.environ.get("PORT", 8080))
    app = web.Application()
    app.router.add_get("/health", handle_health)
    app.router.add_post("/notify", handle_notify)
    app.router.add_post("/link-bot", handle_link_bot)
    app.router.add_route("OPTIONS", "/link-bot", handle_link_bot)  # CORS preflight
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    logging.info(f"Notification HTTP server started on port {port}")

    # Drop any stale webhook / getUpdates session before starting polling.
    # This prevents 409 Conflict when Render starts a new instance before the
    # old one fully closes its long-poll connection.
    try:
        await bot.delete_webhook(drop_pending_updates=False)
        logging.info("Cleared any stale webhook/session before polling")
    except Exception as e:
        logging.warning(f"delete_webhook warning (non-fatal): {e}")

    try:
        await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())
    finally:
        # If polling stops for any reason — exit the process so Render auto-restarts it.
        logging.error("Polling stopped unexpectedly — exiting process to trigger Render restart")
        import sys
        sys.exit(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
    except SystemExit:
        raise
