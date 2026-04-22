from fastapi import APIRouter

# from .movies import router as movies_router
# from .halls import router as halls_router
# from .movie_sessions import router as movie_sessions_router
from .Users import router as users_router
router = APIRouter()

# router.include_router(movies_router)
# router.include_router(halls_router)
# router.include_router(movie_sessions_router)
router.include_router(users_router)