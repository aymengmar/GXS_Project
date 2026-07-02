from fastapi import APIRouter, HTTPException, Request, status

from app.schemas.auth import (
    AdminLoginResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    DriverLoginRequest,
    DriverLoginResponse,
    DriverRegisterRequest,
    DriverRegisterResponse,
    EmailVerificationSendRequest,
    EmailVerificationSendResponse,
    EmailVerificationVerifyRequest,
    EmailVerificationVerifyResponse,
)
from app.services.auth_service import (
    change_password,
    login_user,
    register_driver,
    send_email_verification_code,
    verify_email_otp,
)

router = APIRouter()


@router.post("/register", response_model=DriverRegisterResponse, status_code=201)
def register(payload: DriverRegisterRequest) -> DriverRegisterResponse:
    return register_driver(payload)


@router.post("/login")
def login(payload: DriverLoginRequest) -> DriverLoginResponse | AdminLoginResponse:
    return login_user(payload)


@router.post("/change-password", response_model=ChangePasswordResponse)
def change_password_endpoint(payload: ChangePasswordRequest, request: Request) -> ChangePasswordResponse:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header.",
        )
    access_token = auth_header[7:]
    return change_password(access_token, payload.new_password)


@router.post("/email-verification/send-code", response_model=EmailVerificationSendResponse)
def send_verification_code(payload: EmailVerificationSendRequest) -> EmailVerificationSendResponse:
    return send_email_verification_code(payload.email)


@router.post("/email-verification/verify-code", response_model=EmailVerificationVerifyResponse)
def verify_verification_code(payload: EmailVerificationVerifyRequest) -> EmailVerificationVerifyResponse:
    return verify_email_otp(payload.email, payload.code)
