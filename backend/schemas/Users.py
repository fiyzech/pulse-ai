from pydantic import BaseModel, Field, EmailStr
from datetime import date
from typing import Optional

class User_Schema(BaseModel):
    email: EmailStr = Field(..., max_length=255, description="Електронна пошта")

class UserCreate_Schema(User_Schema):
    password: str = Field(..., min_length=8, max_length=20, description="Пароль")
    # Додаємо нові поля, робимо їх необов'язковими (Optional), щоб не ламати стару логіку
    birth_date: Optional[date] = Field(default=None, description="Дата народження")
    region: Optional[str] = Field(default=None, max_length=100, description="Місце проживання (Країна/Місто)")

class UserResponse_Schema(User_Schema):
    id: int
    is_active: bool
    birth_date: Optional[date]
    region: Optional[str]


    class Config:
        from_attributes = True
        
class Token_Schema(BaseModel):
    access_token: str
    token_type: str