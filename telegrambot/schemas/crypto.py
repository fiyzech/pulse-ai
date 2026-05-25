from pydantic import BaseModel
from enum import Enum

# Додаємо цей клас, який бот намагається імпортувати
class AlertCondition(str, Enum):
    price_gt = "price_gt"
    price_gte = "price_gte"
    price_lt = "price_lt"
    price_lte = "price_lte"
    price_eq = "price_eq"
    pct_change_24h_gt = "pct_change_24h_gt"
    pct_change_24h_lt = "pct_change_24h_lt"
    rsi_gt = "rsi_gt"
    rsi_lt = "rsi_lt"
    ema20_cross_up = "ema20_cross_up"
    ema20_cross_down = "ema20_cross_down"
    ema50_cross_up = "ema50_cross_up"
    ema50_cross_down = "ema50_cross_down"
    volume_spike_gt = "volume_spike_gt"
    trailing_stop_pct = "trailing_stop_pct"
    golden_cross = "golden_cross"
    death_cross = "death_cross"
    bb_upper_break = "bb_upper_break"
    bb_lower_break = "bb_lower_break"
    new_ath = "new_ath"
    vol_24h_gt = "vol_24h_gt"
    macd_cross_up = "macd_cross_up"
    macd_cross_down = "macd_cross_down"

class AlertCreate_Schema(BaseModel):
    symbol: str
    target_price: float
    condition: AlertCondition  # Тепер використовуємо AlertCondition тут

    class Config:
        use_enum_values = True # Щоб Pydantic повертав рядок, а не об'єкт Enum
