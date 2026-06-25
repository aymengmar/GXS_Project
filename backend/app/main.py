from fastapi import FastAPI

from app.api.v1.router import api_router
from app.core.config import settings

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {"message": f"{settings.APP_NAME} backend is running", "env": settings.APP_ENV}
