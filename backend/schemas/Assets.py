from pydantic import BaseModel, Field

class Assets_Schema(BaseModel):
    # У CoinGecko назва монети зазвичай у полі 'name' або 'symbol'
    name: str = Field(..., alias="symbol")
    
    # Поточна ціна
    price: float = Field(..., alias="current_price")
    
    # Зміна за 24г
    change_24h: float = Field(..., alias="price_change_percentage_24h")
    
    # Капіталізація (тепер вона буде справжня!)
    market_cap: float = Field(..., alias="market_cap")

    # Обсяг торгів
    volume: float = Field(..., alias="total_volume")
    


    class Config:
        populate_by_name = True



