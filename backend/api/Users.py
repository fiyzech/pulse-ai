from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr

from database import get_db
from schemas.users import UserCreate_Schema, UserResponse_Schema
from services.UserServices import get_user_by_email, create_user
from core.security import verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.get("/check-email")
async def check_email(email: EmailStr = Query(...), session: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(email, session)

    return {
        "exists": user is not None
    }


@router.post("/register", response_model=UserResponse_Schema)
async def register(user_data: UserCreate_Schema, session: AsyncSession = Depends(get_db)):
    existing_user = await get_user_by_email(user_data.email, session)

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Користувач з таким email вже існує"
        )

    new_user = await create_user(user_data, session)
    return new_user


@router.post("/login")
async def login(credentials: LoginRequest, session: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(credentials.email, session)

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Невірний email або пароль"
        )

    return {
        "message": "Успішний вхід",
        "user_id": user.id,
        "email": user.email
    }