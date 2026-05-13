from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from authx.exceptions import AuthXException

from api import ml_routes
from api.users import router as auth_router
from api.Assets import router as alert_router

# 1. СПОЧАТКУ створюємо сам додаток
app = FastAPI(
    title="CryptoPulse API",
    description="Бекенд для відстеження криптовалют та алертів"
)

# 2. Налаштовуємо CORS (бачу, що фронт на Vite, порт 5173 — це правильно)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Обробник помилок авторизації
@app.exception_handler(AuthXException)
async def authx_exception_handler(request: Request, exc: AuthXException):
    return JSONResponse(
        status_code=401,
        content={"detail": "Доступ заборонено: відсутній або недійсний токен"}
    )

# 4. І ТІЛЬКИ ТЕПЕР підключаємо всі наші роутери
app.include_router(auth_router)
app.include_router(ml_routes.router) 
app.include_router(alert_router)