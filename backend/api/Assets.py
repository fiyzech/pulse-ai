from aiocoingecko import AsyncCoinGeckoAPISession
from schemas import Assets_Schema

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, Response

router = APIRouter(prefix="/assets", tags=["Assets"])



@router.get("/",response_model=List[Assets_Schema])
async def get_popular_coins_json(limit: int):
    
    async with AsyncCoinGeckoAPISession() as cg:
        # Отримуємо дані ринку
        # vs_currency='usd' — ціни в доларах
        # order='market_cap_desc' — сортування за капіталізацією (найпопулярніші зверху)
        data = await cg.get_coins_markets(
            vs_currency='usd',
            order='market_cap_desc',
            per_page=limit,
            page=1
        )
        
        # CoinGecko повертає символи в нижньому регістрі (btc, eth)
        # Можемо перетворити їх на верхній для краси
        for coin in data:
            coin['symbol'] = coin['symbol'].upper()
            
        return data