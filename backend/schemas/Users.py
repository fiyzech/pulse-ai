from pydantic import BaseModel, Field, EmailStr

class User_Schema(BaseModel):
    email: EmailStr = Field(..., max_length=255, description="Електронна пошта")

class UserCreate_Schema(User_Schema):
    password: str = Field(..., min_length=8, max_length=20, description="Пароль")


class UserResponse_Schema(User_Schema):
    id: int
    is_active: bool
