from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from authx.exceptions import AuthXException

from api import router

app = FastAPI(
    title="Cinema API",
    description="Бекенд для бронювання квитків у кіно"
)

@app.exception_handler(AuthXException)
async def authx_exception_handler(request: Request, exc: AuthXException):
    """Перехоплює всі помилки AuthX (немає токена, протермінований тощо) і віддає красивий 401 статус"""
    return JSONResponse(
        status_code=401,
        content={"detail": "Доступ заборонено: відсутній або недійсний токен"}
    )

app.include_router(router)