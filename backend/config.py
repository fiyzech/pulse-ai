import os
from dotenv import load_dotenv

# Завантажуємо змінні з файлу .env
load_dotenv()

DB_USER = os.getenv("POSTGRES_USER")
DB_PASS = os.getenv("POSTGRES_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("POSTGRES_DB")

# Формуємо URL для підключення SQLAlchemy (асинхронний драйвер asyncpg)
DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

JWT_S_Key = os.getenv("JWT_SECRET_KEY")
JWT_A_Cookie_Name = os.getenv("JWT_ACCESS_COOKIE_NAME")
JWT_T_Loc = os.getenv("JWT_TOKEN_LOCATION")
JWT_CSRF_Pr = os.getenv("JWT_COOKIE_CSRF_PROTECT")