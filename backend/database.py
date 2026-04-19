from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from config import DATABASE_URL

# Створюємо "двигун", який спілкується з базою (echo=True буде виводити SQL-запити в термінал)
engine = create_async_engine(DATABASE_URL, echo=True)

# Створюємо фабрику сесій
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Базовий клас, від якого ми будемо наслідувати наші таблиці
Base = declarative_base()

# Функція, яка буде видавати сесію для кожного запиту від юзера
async def get_db():
    async with async_session_maker() as session:
        yield session