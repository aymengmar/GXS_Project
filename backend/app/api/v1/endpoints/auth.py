from fastapi import APIRouter

from app.schemas.auth import DriverLoginRequest, DriverLoginResponse, DriverRegisterRequest, DriverRegisterResponse
from app.services.auth_service import login_driver, register_driver

router = APIRouter()


@router.post("/register", response_model=DriverRegisterResponse, status_code=201)
def register(payload: DriverRegisterRequest) -> DriverRegisterResponse:
    return register_driver(payload)


@router.post("/login", response_model=DriverLoginResponse)
def login(payload: DriverLoginRequest) -> DriverLoginResponse:
    return login_driver(payload)
