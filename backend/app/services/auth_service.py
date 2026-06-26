from fastapi import HTTPException, status

from app.db.supabase import supabase_admin, supabase_auth
from app.schemas.auth import (
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


def login_driver(payload: DriverLoginRequest) -> DriverLoginResponse:
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

    auth_user_id = str(auth_response.user.id)
    access_token = auth_response.session.access_token

    # Load profile via admin client so RLS never blocks this lookup.
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


def send_email_verification_code(email: str) -> EmailVerificationSendResponse:
    try:
        supabase_auth.auth.sign_in_with_otp(
            {
                "email": email,
                "options": {"should_create_user": True},
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to send verification code: {exc}",
        ) from exc

    return EmailVerificationSendResponse(message="Verification code sent.")


def verify_email_otp(email: str, code: str) -> EmailVerificationVerifyResponse:
    try:
        response = supabase_auth.auth.verify_otp(
            {
                "email": email,
                "token": code,
                "type": "email",
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        ) from exc

    if response.user is None:
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
