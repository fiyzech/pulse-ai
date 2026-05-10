from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db # Твоя функція для отримання сесії БД
from models.ml_predictions import ModelPrediction
from schemas.ml_predictions import ModelPrediction_Schema

router = APIRouter(prefix="/predictions", tags=["ML Predictions"])

@router.get("/{symbol}", response_model=List[ModelPrediction_Schema])
def get_latest_predictions(symbol: str, limit: int = 10, db: Session = Depends(get_db)):
    """
    Отримати останні ML прогнози для конкретної монети (наприклад: /predictions/BTC)
    """
    predictions = db.query(ModelPrediction)\
        .filter(ModelPrediction.symbol == symbol.upper())\
        .order_by(ModelPrediction.created_at.desc())\
        .limit(limit)\
        .all()
        
    if not predictions:
        raise HTTPException(status_code=404, detail="Прогнозів для цієї монети не знайдено")
        
    return predictions