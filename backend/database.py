from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from config import DATABASE_URL


engine = create_async_engine(
    DATABASE_URL, 
    echo=True,

    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0
    }
)


async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with async_session_maker() as session:
        yield session