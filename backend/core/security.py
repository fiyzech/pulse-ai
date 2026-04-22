import bcrypt
from authx import AuthX, AuthXConfig


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
configx.JWT_SECRET_KEY = "sinety88_super_secret_key_for_cinema_api_123"
configx.JWT_ACCESS_COOKIE_NAME = "my_access_token"
configx.JWT_TOKEN_LOCATION = ["cookies", "headers"]
configx.JWT_COOKIE_CSRF_PROTECT = False

security = AuthX(config=configx)