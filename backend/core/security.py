import bcrypt
from authx import AuthX, AuthXConfig

from config import JWT_A_Cookie_Name, JWT_CSRF_Pr,  JWT_S_Key, JWT_T_Loc


def get_password_hash(password: str) -> str:
    # Перетворюємо рядок у байти
    pwd_bytes = password.encode('utf-8')
    # Генеруємо унікальну "сіль" (випадковий набір символів для ускладнення хешу)
    salt = bcrypt.gensalt()
    # Хешуємо
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    # Повертаємо як звичайний рядок для збереження в БД
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Для перевірки обидва значення мають бути в байтах
    password_bytes = plain_password.encode('utf-8')
    hashed_password_bytes = hashed_password.encode('utf-8')
    
    # bcrypt сам знає, як дістати сіль з хешу і порівняти їх
    return bcrypt.checkpw(password_bytes, hashed_password_bytes)

configx = AuthXConfig()
configx.JWT_SECRET_KEY = JWT_S_Key
configx.JWT_ACCESS_COOKIE_NAME = JWT_A_Cookie_Name
configx.JWT_TOKEN_LOCATION = JWT_T_Loc
configx.JWT_COOKIE_CSRF_PROTECT = JWT_CSRF_Pr

security = AuthX(config=configx)