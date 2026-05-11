from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from models import AlertCondition

class CoinGeckoAssetSchema(BaseModel):
    # Використовуємо для парсингу даних з API біржі
    name: str = Field(..., alias="symbol")
    price: float = Field(..., alias="current_price")
    change_24h: float = Field(..., alias="price_change_percentage_24h")
    market_cap: float = Field(..., alias="market_cap")
    volume: float = Field(..., alias="total_volume")
    
    model_config = ConfigDict(populate_by_name=True)

class AlertCreate_Schema(BaseModel):
    symbol: str
    condition: AlertCondition
    target_price: float

class AlertResponse_Schema(BaseModel):
    id: int
    symbol: str
    condition: AlertCondition
    target_price: float
    is_active: bool
    created_at: datetime
    
    # Цей конфіг дозволяє Pydantic читати дані прямо з об'єктів SQLAlchemy
    model_config = ConfigDict(from_attributes=True)

class AddAsset_Schema(BaseModel):
    symbol: str

class FavoriteAssetItem(BaseModel):
    symbol: str
    price: float
    change_24h: float
    market_cap: float
    volume: float

# 2. ГОЛОВНА СХЕМА: Вся сторінка "Обране" цілком
class FavoritesPageResponse(BaseModel):
    total_favorites: int
    growing_today: int
    falling_today: int
    assets: list[FavoriteAssetItem]

