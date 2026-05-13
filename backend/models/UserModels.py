import enum
from datetime import datetime, date

from sqlalchemy import Date, DateTime, Float, ForeignKey, String, Boolean, Enum as SAEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

class SubscriptionTier(str, enum.Enum):
    FREE = "free"
    PRO = "pro"
    BUSINESS = "business"

class AlertCondition(str, enum.Enum):
    ABOVE = "above" 
    BELOW = "below"

class User_Model(Base):

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=True, index=True)
    subscription: Mapped[SubscriptionTier] = mapped_column(
        SAEnum(SubscriptionTier, native_enum=False, length=20),
        default=SubscriptionTier.FREE,
        server_default='free'
    )
    avatar_url: Mapped[str] = mapped_column(String(500), nullable=True)

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=True)  
    last_name: Mapped[str] = mapped_column(String(100), nullable=True)   
    phone_number: Mapped[str] = mapped_column(String(20), nullable=True) 
    birth_date: Mapped[date] = mapped_column(Date, nullable=True)        
    region: Mapped[str] = mapped_column(String(100), nullable=True)

    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    password_last_changed: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    tracked_assets: Mapped[list["Favorite_Assets_Model"]] = relationship(
        back_populates="user", 
        cascade="all, delete-orphan"
        )
    
    alerts: Mapped[list["Alerts_Model"]] = relationship(
        back_populates="user", 
        cascade="all, delete-orphan"
    )

class Favorite_Assets_Model(Base):

    __tablename__ = "user_favorites"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)    
    symbol: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # ЗВ'ЯЗОК назад до юзера (щоб зручно діставати дані в коді)
    user: Mapped["User_Model"] = relationship(back_populates="tracked_assets")

class Alerts_Model(Base):

    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)    
    symbol: Mapped[str] = mapped_column(String(20), index=True, nullable=False)

    condition_type: Mapped[AlertCondition] = mapped_column(
        SAEnum(AlertCondition, native_enum=False, length=10), 
        nullable=False
    )

    target_value: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now()) 
    trigered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    user: Mapped["User_Model"] = relationship(back_populates="alerts")