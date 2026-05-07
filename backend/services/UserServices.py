from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.UserModels import User_Model
from schemas.users import UserCreate_Schema
from core.security import get_password_hash

async def get_user_by_email(email: str, session: AsyncSession) -> User_Model:
    query = select(User_Model).where(User_Model.email == email)
    result = await session.execute(query)
    return result.scalars().first()
    
async def create_user(user_data: UserCreate_Schema, session: AsyncSession) -> User_Model:
    hashed_pwd = get_password_hash(user_data.password)

    new_user = User_Model(
        email=user_data.email,
        hashed_password=hashed_pwd,
        birth_date=user_data.birth_date,  
        region=user_data.region           
    )
    
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    return new_user