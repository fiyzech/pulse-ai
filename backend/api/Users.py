from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db

from models import User_Model
from schemas import UserCreate_Schema, UserResponse_Schema

from services import get_user_by_email, create_user

from core.security import  verify_password, security, configx

router = APIRouter(prefix="/users", tags=["Користувачі"])

@router.post("/register", response_model=UserResponse_Schema, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate_Schema,
    session: AsyncSession = Depends(get_db)
) -> UserResponse_Schema:

    existing_user = await get_user_by_email(user_data.email, session)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Користувач з таким email вже зареєстрований"
        )
    
    new_user = await create_user(user_data, session)
    return new_user
    
    
@router.post("/login")
async def login_user(
    user_data: UserCreate_Schema,
    response: Response,
    session: AsyncSession = Depends(get_db),
    ):
    existing_user = await get_user_by_email(user_data.email, session)

    if not existing_user or not verify_password(user_data.password, existing_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Невірний email або пароль"
        )
    token = security.create_access_token(uid=str(existing_user.id))

    response.set_cookie(configx.JWT_ACCESS_COOKIE_NAME, token)

    return {"access_token": token, "token_type": "bearer"}