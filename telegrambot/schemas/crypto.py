import enum

from pydantic import BaseModel

class AlertCondition(str, enum.Enum):
    ABOVE = "above_or_equal" 
    BELOW = "below_or_equal"

class AlertCreate_Schema(BaseModel):
    symbol: str
    condition: AlertCondition
    target_price: float