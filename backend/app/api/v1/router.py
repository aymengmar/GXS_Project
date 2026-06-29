from fastapi import APIRouter

from app.api.v1.endpoints import admin, auth, driver_documents

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(driver_documents.router, prefix="/driver-documents", tags=["driver-documents"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
