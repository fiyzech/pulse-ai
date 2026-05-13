from aiocoingecko import AsyncCoinGeckoAPISession
from database import get_db
from models import Alerts_Model
from schemas.assets import AlertCreate_Schema

from core.security import security

from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import APIRouter, Depends, HTTPException, status, Response

router = APIRouter(prefix="/alerts", tags=["Alerts"])
# @router.get("/")
# async def get_popular_coins_json(limit: int):    
#     async with AsyncCoinGeckoAPISession() as cg:
#         # Отримуємо дані ринку
#         # vs_currency='usd' — ціни в доларах
#         # order='market_cap_desc' — сортування за капіталізацією (найпопулярніші зверху)
#         data = await cg.get_coins_markets(
#             vs_currency='usd',
#             order='market_cap_desc',
#             per_page=limit,
#             page=1        )
# # CoinGecko повертає символи в нижньому регістрі (btc, eth)
#         # Можемо перетворити їх на верхній для краси
#         for coin in data:
#             coin['symbol'] = coin['symbol'].upper()            
#         return data


@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_price_alert(
    alert_data: AlertCreate_Schema,
    session: AsyncSession = Depends(get_db),
    user_payload = Depends(security.access_token_required)
):
    current_user_id = int(user_payload.sub)  # Тимчасовий хардкод
    
    new_alert = Alerts_Model(
        user_id=current_user_id,
        symbol=alert_data.symbol,
        condition=alert_data.condition,
        target_price=alert_data.target_price,
        is_active=True # За замовчуванням активний
    )
    
    session.add(new_alert)
    await session.commit()
    await session.refresh(new_alert)
    
    return {"message": "Сповіщення успішно створено", "alert_id": new_alert.id}