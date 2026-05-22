from pydantic import BaseModel
from enum import Enum

# Додаємо цей клас, який бот намагається імпортувати
class AlertCondition(str, Enum):
    price_gt = "price_gt"
    price_gte = "price_gte"
    price_lt = "price_lt"
    price_lte = "price_lte"
    price_eq = "price_eq"

class AlertCreate_Schema(BaseModel):
    symbol: str
    target_price: float
    condition: AlertCondition  # Тепер використовуємо AlertCondition тут

    class Config:
        use_enum_values = True # Щоб Pydantic повертав рядок, а не об'єкт Enum