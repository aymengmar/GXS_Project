from fastapi import APIRouter

from app.schemas.auth import (
    DriverLoginRequest,
    DriverLoginResponse,
    DriverRegisterRequest,
    DriverRegisterResponse,
    EmailVerificationSendRequest,
    EmailVerificationSendResponse,
    EmailVerificationVerifyRequest,
    EmailVerificationVerifyResponse,
)
from app.services.auth_service import login_driver, register_driver, send_email_verification_code, verify_email_otp

router = APIRouter()


@router.post("/register", response_model=DriverRegisterResponse, status_code=201)
def register(payload: DriverRegisterRequest) -> DriverRegisterResponse:
    return register_driver(payload)


@router.post("/login", response_model=DriverLoginResponse)
def login(payload: DriverLoginRequest) -> DriverLoginResponse:
    return login_driver(payload)


@router.post("/email-verification/send-code", response_model=EmailVerificationSendResponse)
def send_verification_code(payload: EmailVerificationSendRequest) -> EmailVerificationSendResponse:
    return send_email_verification_code(payload.email)


@router.post("/email-verification/verify-code", response_model=EmailVerificationVerifyResponse)
def verify_verification_code(payload: EmailVerificationVerifyRequest) -> EmailVerificationVerifyResponse:
    return verify_email_otp(payload.email, payload.code)
