import bcrypt
from authx import AuthX, AuthXConfig

from config import JWT_A_Cookie_Name, JWT_CSRF_Pr, JWT_S_Key


def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode("utf-8")
    hashed_password_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_password_bytes)


configx = AuthXConfig()

configx.JWT_SECRET_KEY = JWT_S_Key
configx.JWT_ACCESS_COOKIE_NAME = JWT_A_Cookie_Name
configx.JWT_TOKEN_LOCATION = ["cookies"]
configx.JWT_COOKIE_CSRF_PROTECT = str(JWT_CSRF_Pr).lower() == "true"

security = AuthX(config=configx)