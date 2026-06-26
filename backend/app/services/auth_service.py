from fastapi import HTTPException, status

from app.db.supabase import supabase_admin, supabase_auth
from app.schemas.auth import DriverLoginRequest, DriverLoginResponse, DriverRegisterRequest, DriverRegisterResponse


def register_driver(payload: DriverRegisterRequest) -> DriverRegisterResponse:
    # Create auth user via admin API (service-role key required)
    # email_confirm=True skips the confirmation email flow for internal onboarding
    try:
        auth_response = supabase_admin.auth.admin.create_user(
            {
                "email": payload.email,
                "password": payload.password,
                "email_confirm": True,
            }
        )
    except Exception as exc:
        error_message = str(exc)
        if "already been registered" in error_message or "already exists" in error_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Auth user creation failed: {error_message}",
        )

    if auth_response.user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Auth user creation failed. Email may already be in use.",
        )

    auth_user_id = str(auth_response.user.id)

    # Insert driver profile — password is never stored here
    try:
        profile_result = (
            supabase_admin.table("driver_profiles")
            .insert(
                {
                    "auth_user_id": auth_user_id,
                    "email": payload.email,
                    "full_name": payload.full_name,
                    "phone": payload.phone,
                    "car_type": payload.car_type,
                    "status": "pending",
                }
            )
            .execute()
        )
    except Exception as exc:
        # Clean up the orphan auth user before raising
        try:
            supabase_admin.auth.admin.delete_user(auth_user_id)
        except Exception:
            pass  # Best-effort cleanup; log in production

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Driver profile creation failed. Auth user has been rolled back: {exc}",
        )

    # Save own-car details when car_type is own_car
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
            # Roll back auth user and profile
            try:
                supabase_admin.table("driver_profiles").delete().eq("auth_user_id", auth_user_id).execute()
            except Exception:
                pass
            try:
                supabase_admin.auth.admin.delete_user(auth_user_id)
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
