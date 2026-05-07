import enum
from datetime import datetime, date

from sqlalchemy import Date, DateTime, String, Boolean, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from database import Base

class SubscriptionTier(str, enum.Enum):
    FREE = "free"
    PRO = "pro"
    BUSINESS = "business"

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
    password_last_changed: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    


    