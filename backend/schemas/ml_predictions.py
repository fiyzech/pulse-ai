from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class MLModel_Schema(BaseModel):
    symbol: str = Field(..., max_length=50)
    interval: str = Field(..., max_length=10)
    version: str = Field(..., max_length=50)
    is_active: bool = False
    metrics: Optional[dict] = None
    model_file_path: str = Field(..., max_length=255)

    class Config:
        from_attributes = True

class ModelPrediction_Schema(BaseModel):
    symbol: str
    interval: str
    signal: str
    price: float
    confidence: Optional[float]
    accuracy: Optional[float]
    raw_prediction: Optional[str]
    stop_loss: Optional[float]
    take_profit: Optional[float]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True