from datetime import datetime
from sqlalchemy import String, Numeric, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base  # <--- Ось той самий Base, про який ти питав

class MLModel(Base):
    __tablename__ = "ml_models"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    symbol: Mapped[str] = mapped_column(String(50), nullable=False)
    interval: Mapped[str] = mapped_column(String(10), nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    metrics: Mapped[dict] = mapped_column(JSON, nullable=True)
    model_file_path: Mapped[str] = mapped_column(String(255), nullable=False)
    trained_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class ModelPrediction(Base):
    __tablename__ = "model_predictions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    symbol: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    interval: Mapped[str] = mapped_column(String(10), nullable=False)
    signal: Mapped[str] = mapped_column(String(50), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(18, 8), nullable=False)
    confidence: Mapped[float] = mapped_column(Numeric(5, 2), nullable=True)
    accuracy: Mapped[float] = mapped_column(Numeric(5, 2), nullable=True)
    raw_prediction: Mapped[str] = mapped_column(String(20), nullable=True)
    stop_loss: Mapped[float] = mapped_column(Numeric(18, 8), nullable=True)
    take_profit: Mapped[float] = mapped_column(Numeric(18, 8), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())