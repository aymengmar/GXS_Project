from datetime import date, datetime, timezone

from fastapi import HTTPException, status

from app.db.supabase import supabase_admin
from app.schemas.warehouse import (
    AvailableDriverItem,
    AvailableDriversResponse,
    AvailableDriversSummary,
    DriverAvailabilityUpdateResponse,
)

_CAR_TYPE_LABEL: dict[str, str] = {
    "own_car": "Own car",
    "company_car": "Company car",
}
_AVAILABILITY_STATUSES = ("ready", "not_ready")
_AVAILABILITY_LABEL: dict[str, str] = {
    "ready": "Ready",
    "not_ready": "Not Ready",
}
_DEFAULT_AVAILABILITY_STATUS = "ready"


def _require_warehouse(authorization: str) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header.",
        )
    token = authorization.removeprefix("Bearer ").strip()

    try:
        user_response = supabase_admin.auth.get_user(token)
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

    auth_user_id = str(user_response.user.id)

    app_user_result = (
        supabase_admin.table("app_users")
        .select("role, is_active")
        .eq("auth_user_id", auth_user_id)
        .execute()
    )

    if not app_user_result.data:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    app_user = app_user_result.data[0]

    if not app_user["is_active"] or app_user["role"] != "warehouse":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return auth_user_id


def _signed_url(bucket: str, path: str) -> str | None:
    try:
        signed = supabase_admin.storage.from_(bucket).create_signed_url(path, 3600)
        if isinstance(signed, dict):
            return signed.get("signedURL") or signed.get("signed_url")
        return getattr(signed, "signed_url", None) or getattr(signed, "signedURL", None)
    except Exception:
        return None


def _get_profile_photos_by_user(auth_user_ids: list[str]) -> dict[str, str]:
    """Latest non-deleted driver_photo per auth_user_id, resolved to a signed URL."""
    if not auth_user_ids:
        return {}

    photo_result = (
        supabase_admin.table("driver_documents")
        .select("auth_user_id, storage_bucket, storage_path, created_at")
        .in_("auth_user_id", auth_user_ids)
        .eq("document_type", "driver_photo")
        .neq("status", "deleted")
        .order("created_at", desc=True)
        .execute()
    )

    latest_by_user: dict[str, dict] = {}
    for doc in photo_result.data or []:
        auth_user_id = doc["auth_user_id"]
        if auth_user_id not in latest_by_user:
            latest_by_user[auth_user_id] = doc

    urls_by_user: dict[str, str] = {}
    for auth_user_id, doc in latest_by_user.items():
        bucket = doc.get("storage_bucket")
        path = doc.get("storage_path")
        if bucket and path:
            signed = _signed_url(bucket, path)
            if signed:
                urls_by_user[auth_user_id] = signed

    return urls_by_user


def _get_today_availability_by_driver(auth_user_ids: list[str]) -> dict[str, str]:
    if not auth_user_ids:
        return {}

    today = date.today().isoformat()
    result = (
        supabase_admin.table("warehouse_driver_availability")
        .select("driver_auth_user_id, status")
        .in_("driver_auth_user_id", auth_user_ids)
        .eq("availability_date", today)
        .execute()
    )

    return {row["driver_auth_user_id"]: row["status"] for row in result.data or []}


def get_available_drivers(authorization: str) -> AvailableDriversResponse:
    _require_warehouse(authorization)

    result = (
        supabase_admin.table("driver_profiles")
        .select(
            "id, auth_user_id, full_name, external_driver_id, email, phone, "
            "car_type, postal_code, status"
        )
        .eq("status", "approved")
        .order("full_name")
        .execute()
    )
    profiles = result.data or []

    auth_user_ids = [p["auth_user_id"] for p in profiles]
    photos_by_user = _get_profile_photos_by_user(auth_user_ids)
    availability_by_user = _get_today_availability_by_driver(auth_user_ids)

    drivers = []
    for profile in profiles:
        availability_status = availability_by_user.get(
            profile["auth_user_id"], _DEFAULT_AVAILABILITY_STATUS
        )
        drivers.append(
            AvailableDriverItem(
                id=profile["id"],
                auth_user_id=profile["auth_user_id"],
                full_name=profile["full_name"],
                external_driver_id=profile.get("external_driver_id"),
                email=profile.get("email"),
                phone=profile.get("phone"),
                car_type=profile.get("car_type"),
                driver_type_label=_CAR_TYPE_LABEL.get(profile.get("car_type"), "Not specified"),
                postal_code=profile.get("postal_code"),
                status=profile["status"],
                profile_image_url=photos_by_user.get(profile["auth_user_id"]),
                availability_status=availability_status,
                availability_label=_AVAILABILITY_LABEL[availability_status],
            )
        )

    available_drivers = sum(1 for d in drivers if d.availability_status == "ready")

    return AvailableDriversResponse(
        drivers=drivers,
        summary=AvailableDriversSummary(available_drivers=available_drivers),
    )


def update_driver_availability(
    authorization: str,
    driver_auth_user_id: str,
    status_value: str,
) -> DriverAvailabilityUpdateResponse:
    warehouse_auth_user_id = _require_warehouse(authorization)

    if status_value not in _AVAILABILITY_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid availability status.",
        )

    profile_result = (
        supabase_admin.table("driver_profiles")
        .select("auth_user_id, status")
        .eq("auth_user_id", driver_auth_user_id)
        .execute()
    )
    if not profile_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found.")

    profile = profile_result.data[0]
    if profile["status"] != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Driver is not approved.",
        )

    today = date.today().isoformat()
    now = datetime.now(timezone.utc).isoformat()

    supabase_admin.table("warehouse_driver_availability").upsert(
        {
            "driver_auth_user_id": driver_auth_user_id,
            "warehouse_auth_user_id": warehouse_auth_user_id,
            "availability_date": today,
            "status": status_value,
            "updated_at": now,
        },
        on_conflict="driver_auth_user_id,warehouse_auth_user_id,availability_date",
    ).execute()

    return DriverAvailabilityUpdateResponse(
        driver_auth_user_id=driver_auth_user_id,
        availability_date=today,
        status=status_value,
        label=_AVAILABILITY_LABEL[status_value],
    )
