from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from authx.exceptions import AuthXException

from api.users import router as auth_router

app = FastAPI(
    title="CryptoPulse API",
    description="Бекенд для відстеження криптовалют та алертів"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(AuthXException)
async def authx_exception_handler(request: Request, exc: AuthXException):
    return JSONResponse(
        status_code=401,
        content={"detail": "Доступ заборонено: відсутній або недійсний токен"}
    )

app.include_router(auth_router)