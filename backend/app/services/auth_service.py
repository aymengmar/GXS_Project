import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

from app.core.config import settings
from app.db.supabase import supabase_admin, supabase_auth
from app.schemas.auth import (
    AdminLoginResponse,
    AdminUserInfo,
    DriverLoginRequest,
    DriverLoginResponse,
    DriverRegisterRequest,
    DriverRegisterResponse,
    EmailVerificationSendResponse,
    EmailVerificationVerifyResponse,
)


def register_driver(payload: DriverRegisterRequest) -> DriverRegisterResponse:
    # Validate the OTP-issued access_token and extract the verified auth user.
    try:
        user_response = supabase_admin.auth.get_user(payload.access_token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
        ) from exc

    if user_response.user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
        )

    auth_user = user_response.user
    auth_user_id = str(auth_user.id)
    email = auth_user.email

    # Guard against duplicate profile for the same auth user.
    existing = (
        supabase_admin.table("driver_profiles")
        .select("id")
        .eq("auth_user_id", auth_user_id)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A driver profile already exists for this account.",
        )

    # Insert the driver profile.
    try:
        profile_result = (
            supabase_admin.table("driver_profiles")
            .insert(
                {
                    "auth_user_id": auth_user_id,
                    "email": email,
                    "full_name": payload.full_name,
                    "phone": payload.phone,
                    "car_type": payload.car_type,
                    "postal_code": payload.postal_code,
                    "status": "pending",
                    "external_driver_id": None,
                }
            )
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Driver profile creation failed: {exc}",
        )

    # Save own-car details when car_type is own_car.
    if payload.car_type == "own_car" and payload.own_car_details is not None:
        driver_profile_id = str(profile_result.data[0]["id"])
        details = payload.own_car_details
        try:
            supabase_admin.table("own_car_details").insert(
                {
                    "driver_profile_id": driver_profile_id,
                    "auth_user_id": auth_user_id,
                    "vehicle_make_model": details.vehicle_make_model,
                    "plate_number": details.plate_number,
                    "insurance_provider": details.insurance_provider,
                    "insurance_number": details.insurance_number,
                    "vehicle_year": details.vehicle_year,
                }
            ).execute()
        except Exception as exc:
            # Roll back the profile only — the auth user is external and must not be deleted.
            try:
                supabase_admin.table("driver_profiles").delete().eq("auth_user_id", auth_user_id).execute()
            except Exception:
                pass

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Own-car details save failed. Registration has been rolled back: {exc}",
            )

    return DriverRegisterResponse(
        message="Registration submitted. Waiting for approval.",
        status="pending",
    )


def _complete_driver_login(auth_user_id: str, access_token: str) -> DriverLoginResponse:
    """Load and validate the driver profile after successful Supabase Auth sign-in."""
    result = (
        supabase_admin.table("driver_profiles")
        .select("id, email, full_name, car_type, status, external_driver_id")
        .eq("auth_user_id", auth_user_id)
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No driver profile found for this account.",
        )

    profile = result.data
    driver_status = profile["status"]

    if driver_status == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is waiting for approval.",
        )

    if driver_status == "rejected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account was rejected.",
        )

    if driver_status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is not active. Current status: {driver_status}.",
        )

    return DriverLoginResponse(
        access_token=access_token,
        id=str(profile["id"]),
        email=profile["email"],
        full_name=profile["full_name"],
        car_type=profile["car_type"],
        status=driver_status,
        external_driver_id=profile.get("external_driver_id"),
    )


def login_driver(payload: DriverLoginRequest) -> DriverLoginResponse:
    """Authenticate a driver by email/password and validate their driver profile."""
    # Use the anon client so sign_in_with_password never pollutes the admin client session.
    try:
        auth_response = supabase_auth.auth.sign_in_with_password(
            {"email": payload.email, "password": payload.password}
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        ) from exc

    if auth_response.user is None or auth_response.session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    return _complete_driver_login(
        str(auth_response.user.id),
        auth_response.session.access_token,
    )


def login_user(payload: DriverLoginRequest) -> DriverLoginResponse | AdminLoginResponse:
    """Unified login: authenticate with Supabase, resolve role from app_users, then route."""
    try:
        auth_response = supabase_auth.auth.sign_in_with_password(
            {"email": payload.email, "password": payload.password}
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        ) from exc

    if auth_response.user is None or auth_response.session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    auth_user_id = str(auth_response.user.id)
    access_token = auth_response.session.access_token
    refresh_token = auth_response.session.refresh_token

    # Resolve role via the central app_users registry (service-role only — never exposed to mobile).
    app_user_result = (
        supabase_admin.table("app_users")
        .select("auth_user_id, email, full_name, role, is_active")
        .eq("auth_user_id", auth_user_id)
        .execute()
    )

    if not app_user_result.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "USER_PROFILE_NOT_FOUND", "message": "No user profile found for this account."},
        )

    app_user = app_user_result.data[0]

    if not app_user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "USER_INACTIVE", "message": "Account is inactive."},
        )

    role = app_user["role"]

    if role == "admin":
        return AdminLoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=AdminUserInfo(
                auth_user_id=auth_user_id,
                email=app_user["email"],
                full_name=app_user["full_name"],
                role=role,
                status="active",
            ),
            next_route="admin_dashboard",
        )

    if role == "driver":
        return _complete_driver_login(auth_user_id, access_token)

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Login not yet supported for role: {role}.",
    )


def _send_otp_email(to_email: str, otp: str) -> None:
    """Send a 6-digit OTP via SMTP (bypasses Supabase's rate-limited email service)."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your GXS Delivery verification code"
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_email

    plain = (
        f"Your GXS Delivery verification code is: {otp}\n\n"
        "This code expires in 60 minutes. Do not share it with anyone."
    )
    html = f"""
    <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:24px;">
      <h2 style="color:#0D1B2E;margin-bottom:4px;">GXS Delivery</h2>
      <p style="color:#555;margin-top:0;">Driver Registration — Email Verification</p>
      <p style="color:#333;">Enter the code below in the app to verify your email address:</p>
      <div style="background:#f4f4f4;border-radius:10px;padding:20px 0;text-align:center;
                  letter-spacing:10px;font-size:32px;font-weight:700;color:#FF6500;
                  margin:20px 0;">
        {otp}
      </div>
      <p style="color:#888;font-size:13px;">
        This code expires in 60 minutes. If you did not request this, ignore this email.
      </p>
    </div>
    """

    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD.replace(" ", ""))
        server.send_message(msg)


def send_email_verification_code(email: str) -> EmailVerificationSendResponse:
    # Use the admin client to generate an OTP without triggering Supabase's
    # rate-limited email service.  Try "signup" first; if the auth user already
    # exists (e.g. from a previous partial registration) fall back to "magiclink".
    otp: str | None = None

    try:
        link_response = supabase_admin.auth.admin.generate_link(
            {"type": "signup", "email": email}
        )
        otp = link_response.properties.email_otp
    except Exception as signup_exc:
        err = str(signup_exc).lower()
        if "already been registered" in err or "already registered" in err or "user already registered" in err:
            # Auth user exists — check whether they already have a full driver profile.
            try:
                existing = (
                    supabase_admin.table("driver_profiles")
                    .select("id")
                    .eq("email", email)
                    .execute()
                )
            except Exception:
                existing = None

            if existing and existing.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An account with this email already exists. Please log in instead.",
                )

            # No driver profile yet — resend using magiclink type so they can finish registration.
            try:
                link_response = supabase_admin.auth.admin.generate_link(
                    {"type": "magiclink", "email": email}
                )
                otp = link_response.properties.email_otp
            except Exception as ml_exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to prepare verification code: {ml_exc}",
                ) from ml_exc
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to prepare verification code: {signup_exc}",
            ) from signup_exc

    try:
        _send_otp_email(email, otp)
    except Exception as exc:
        logger.error("SMTP send failed for %s: %s", email, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send verification email: {exc}",
        ) from exc

    return EmailVerificationSendResponse(message="Verification code sent.")


def verify_email_otp(email: str, code: str) -> EmailVerificationVerifyResponse:
    # Try both OTP types: "signup" for new users, "magiclink" for users whose
    # auth account already existed when the code was generated.
    response = None
    for otp_type in ("signup", "magiclink"):
        try:
            r = supabase_auth.auth.verify_otp(
                {"email": email, "token": code, "type": otp_type}
            )
            if r.user is not None:
                response = r
                break
        except Exception:
            continue

    if response is None or response.user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    return EmailVerificationVerifyResponse(
        verified=True,
        message="Email verified successfully.",
        auth_user_id=str(response.user.id),
        access_token=response.session.access_token if response.session else None,
    )
