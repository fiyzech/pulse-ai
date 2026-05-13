from pydantic import BaseModel, EmailStr

class User_Schema(BaseModel):
    email: EmailStr
    password: str