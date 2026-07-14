from datetime import date, datetime, timezone

from fastapi import HTTPException, status

from app.db.supabase import supabase_admin
from app.schemas.warehouse import (
    AvailableDriverItem,
    AvailableDriversResponse,
    AvailableDriversSummary,
    DriverAvailabilityUpdateResponse,
    WarehouseZipAssignedPacketsUpdateResponse,
    WarehouseZipCodeCreateResponse,
    WarehouseZipCodeDeleteResponse,
    WarehouseZipCodeItem,
    WarehouseZipCodeListResponse,
    WarehouseZipCodeSummary,
    WarehouseZipPacketCountUpdateResponse,
    WarehouseZipValidateResponse,
)

_MAX_PACKET_COUNT = 1_000_000

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

_ZIP_STATUS_LABEL: dict[str, str] = {
    "not_counted": "Not counted",
    "in_progress": "In progress",
    "validated": "Validated",
}


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


def _get_today_validated_total_packets(warehouse_auth_user_id: str) -> int:
    today = date.today().isoformat()

    result = (
        supabase_admin.table("warehouse_daily_zip_codes")
        .select("manual_packet_count, carried_over_packets")
        .eq("warehouse_auth_user_id", warehouse_auth_user_id)
        .eq("zip_date", today)
        .eq("status", "validated")
        .execute()
    )

    total = 0
    for row in result.data or []:
        manual_packet_count = row.get("manual_packet_count")
        carried_over_packets = row.get("carried_over_packets")
        total += manual_packet_count if manual_packet_count is not None else (carried_over_packets or 0)

    return total


def get_available_drivers(authorization: str) -> AvailableDriversResponse:
    warehouse_auth_user_id = _require_warehouse(authorization)

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
    total_packets = _get_today_validated_total_packets(warehouse_auth_user_id)

    return AvailableDriversResponse(
        drivers=drivers,
        summary=AvailableDriversSummary(
            available_drivers=available_drivers,
            total_packets=total_packets,
        ),
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


def _to_zip_item(row: dict) -> WarehouseZipCodeItem:
    carried_over_packets = row.get("carried_over_packets") or 0
    manual_packet_count = row.get("manual_packet_count")
    packet_count = manual_packet_count if manual_packet_count is not None else carried_over_packets
    assigned_packets = row.get("assigned_packets") or 0
    remaining_packets = max(packet_count - assigned_packets, 0)
    return WarehouseZipCodeItem(
        id=row["id"],
        zip_code=row["zip_code"],
        zip_date=row["zip_date"],
        status=row["status"],
        status_label=_ZIP_STATUS_LABEL.get(row["status"], row["status"]),
        packet_count=packet_count,
        manual_packet_count=manual_packet_count,
        carried_over_packets=carried_over_packets,
        assigned_packets=assigned_packets,
        remaining_packets=remaining_packets,
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _ensure_carried_over_zip_rows(warehouse_auth_user_id: str, today: str) -> None:
    """Auto-create today rows from inventory left over from a prior day.

    Inventory rows updated today represent tomorrow's carry-over and must not
    surface yet; only inventory last touched before today (i.e. yesterday or
    earlier) with packets remaining should seed today's ZIP list.
    """
    inventory_result = (
        supabase_admin.table("warehouse_zip_inventory")
        .select("zip_code, available_packets")
        .eq("warehouse_auth_user_id", warehouse_auth_user_id)
        .gt("available_packets", 0)
        .lt("last_updated_date", today)
        .execute()
    )
    inventory_rows = inventory_result.data or []
    if not inventory_rows:
        return

    existing_result = (
        supabase_admin.table("warehouse_daily_zip_codes")
        .select("zip_code")
        .eq("warehouse_auth_user_id", warehouse_auth_user_id)
        .eq("zip_date", today)
        .execute()
    )
    existing_zip_codes = {row["zip_code"] for row in existing_result.data or []}

    now = datetime.now(timezone.utc).isoformat()
    for inventory_row in inventory_rows:
        zip_code = inventory_row["zip_code"]
        if zip_code in existing_zip_codes:
            continue

        supabase_admin.table("warehouse_daily_zip_codes").insert(
            {
                "warehouse_auth_user_id": warehouse_auth_user_id,
                "zip_code": zip_code,
                "zip_date": today,
                "status": "in_progress",
                "carried_over_packets": inventory_row["available_packets"],
                "updated_at": now,
            }
        ).execute()


def get_today_zip_codes(authorization: str) -> WarehouseZipCodeListResponse:
    warehouse_auth_user_id = _require_warehouse(authorization)
    today = date.today().isoformat()

    _ensure_carried_over_zip_rows(warehouse_auth_user_id, today)

    result = (
        supabase_admin.table("warehouse_daily_zip_codes")
        .select(
            "id, zip_code, zip_date, status, carried_over_packets, manual_packet_count, "
            "assigned_packets, created_at, updated_at"
        )
        .eq("warehouse_auth_user_id", warehouse_auth_user_id)
        .eq("zip_date", today)
        .order("created_at", desc=False)
        .execute()
    )
    rows = result.data or []

    zip_codes = [_to_zip_item(row) for row in rows]
    summary = WarehouseZipCodeSummary(
        total_zip_codes=len(zip_codes),
        validated=sum(1 for z in zip_codes if z.status == "validated"),
        not_counted=sum(1 for z in zip_codes if z.status == "not_counted"),
        in_progress=sum(1 for z in zip_codes if z.status == "in_progress"),
        total_packets=sum(z.packet_count for z in zip_codes),
        carried_over_packets=sum(z.carried_over_packets for z in zip_codes),
    )

    return WarehouseZipCodeListResponse(summary=summary, zip_codes=zip_codes)


def add_zip_code(authorization: str, raw_zip_code: str) -> WarehouseZipCodeCreateResponse:
    warehouse_auth_user_id = _require_warehouse(authorization)

    zip_code = raw_zip_code.strip()
    if not zip_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ZIP code is required.",
        )
    if not zip_code.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ZIP code must contain digits only.",
        )
    if not (4 <= len(zip_code) <= 10):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ZIP code must be between 4 and 10 digits.",
        )

    today = date.today().isoformat()

    existing = (
        supabase_admin.table("warehouse_daily_zip_codes")
        .select("id")
        .eq("warehouse_auth_user_id", warehouse_auth_user_id)
        .eq("zip_date", today)
        .eq("zip_code", zip_code)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This ZIP code is already added for today.",
        )

    inventory_result = (
        supabase_admin.table("warehouse_zip_inventory")
        .select("available_packets")
        .eq("warehouse_auth_user_id", warehouse_auth_user_id)
        .eq("zip_code", zip_code)
        .gt("available_packets", 0)
        .execute()
    )
    inventory_rows = inventory_result.data or []
    carried_over_packets = inventory_rows[0]["available_packets"] if inventory_rows else 0
    initial_status = "in_progress" if carried_over_packets > 0 else "not_counted"

    now = datetime.now(timezone.utc).isoformat()
    insert_result = (
        supabase_admin.table("warehouse_daily_zip_codes")
        .insert(
            {
                "warehouse_auth_user_id": warehouse_auth_user_id,
                "zip_code": zip_code,
                "zip_date": today,
                "status": initial_status,
                "carried_over_packets": carried_over_packets,
                "updated_at": now,
            }
        )
        .execute()
    )

    row = insert_result.data[0]
    return WarehouseZipCodeCreateResponse(**_to_zip_item(row).model_dump())


def update_zip_packet_count(
    authorization: str, zip_id: str, packet_count: int
) -> WarehouseZipPacketCountUpdateResponse:
    warehouse_auth_user_id = _require_warehouse(authorization)
    today = date.today().isoformat()

    if packet_count < 0 or packet_count > _MAX_PACKET_COUNT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Packet count must be between 0 and {_MAX_PACKET_COUNT}.",
        )

    result = (
        supabase_admin.table("warehouse_daily_zip_codes")
        .select(
            "id, warehouse_auth_user_id, zip_code, zip_date, status, carried_over_packets, "
            "manual_packet_count, created_at, updated_at"
        )
        .eq("id", zip_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ZIP code not found.")

    row = result.data[0]
    if row["warehouse_auth_user_id"] != warehouse_auth_user_id or row["zip_date"] != today:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ZIP code not found.")

    if row["status"] in ("not_counted", "validated"):
        new_status = "in_progress"
    else:
        new_status = row["status"]

    now = datetime.now(timezone.utc).isoformat()
    update_result = (
        supabase_admin.table("warehouse_daily_zip_codes")
        .update(
            {
                "manual_packet_count": packet_count,
                "status": new_status,
                "updated_at": now,
            }
        )
        .eq("id", zip_id)
        .execute()
    )

    updated_row = update_result.data[0]
    return WarehouseZipPacketCountUpdateResponse(**_to_zip_item(updated_row).model_dump())


def validate_zip_code(authorization: str, zip_id: str) -> WarehouseZipValidateResponse:
    warehouse_auth_user_id = _require_warehouse(authorization)
    today = date.today().isoformat()

    result = (
        supabase_admin.table("warehouse_daily_zip_codes")
        .select(
            "id, warehouse_auth_user_id, zip_code, zip_date, status, carried_over_packets, "
            "manual_packet_count, created_at, updated_at"
        )
        .eq("id", zip_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ZIP code not found.")

    row = result.data[0]
    if row["warehouse_auth_user_id"] != warehouse_auth_user_id or row["zip_date"] != today:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ZIP code not found.")

    manual_packet_count = row.get("manual_packet_count")
    carried_over_packets = row.get("carried_over_packets") or 0
    packet_count = manual_packet_count if manual_packet_count is not None else carried_over_packets

    if packet_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot validate ZIP with 0 packets.",
        )

    now = datetime.now(timezone.utc).isoformat()
    update_result = (
        supabase_admin.table("warehouse_daily_zip_codes")
        .update(
            {
                "status": "validated",
                "updated_at": now,
            }
        )
        .eq("id", zip_id)
        .execute()
    )

    updated_row = update_result.data[0]
    return WarehouseZipValidateResponse(**_to_zip_item(updated_row).model_dump())


def update_zip_assigned_packets(
    authorization: str, zip_id: str, assigned_packets: int
) -> WarehouseZipAssignedPacketsUpdateResponse:
    warehouse_auth_user_id = _require_warehouse(authorization)
    today = date.today().isoformat()

    result = (
        supabase_admin.table("warehouse_daily_zip_codes")
        .select(
            "id, warehouse_auth_user_id, zip_code, zip_date, status, carried_over_packets, "
            "manual_packet_count, assigned_packets, created_at, updated_at"
        )
        .eq("id", zip_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ZIP code not found.")

    row = result.data[0]
    if row["warehouse_auth_user_id"] != warehouse_auth_user_id or row["zip_date"] != today:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ZIP code not found.")

    manual_packet_count = row.get("manual_packet_count")
    carried_over_packets = row.get("carried_over_packets") or 0
    packet_count = manual_packet_count if manual_packet_count is not None else carried_over_packets

    if assigned_packets < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assigned packets cannot be negative.",
        )
    if assigned_packets > packet_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assigned packets cannot exceed packet count.",
        )

    now = datetime.now(timezone.utc).isoformat()
    update_result = (
        supabase_admin.table("warehouse_daily_zip_codes")
        .update(
            {
                "assigned_packets": assigned_packets,
                "updated_at": now,
            }
        )
        .eq("id", zip_id)
        .execute()
    )
    updated_row = update_result.data[0]

    remaining_packets = max(packet_count - assigned_packets, 0)

    supabase_admin.table("warehouse_zip_inventory").upsert(
        {
            "warehouse_auth_user_id": warehouse_auth_user_id,
            "zip_code": row["zip_code"],
            "available_packets": remaining_packets,
            "last_updated_date": today,
            "updated_at": now,
        },
        on_conflict="warehouse_auth_user_id,zip_code",
    ).execute()

    return WarehouseZipAssignedPacketsUpdateResponse(**_to_zip_item(updated_row).model_dump())


def delete_zip_code(authorization: str, zip_id: str) -> WarehouseZipCodeDeleteResponse:
    warehouse_auth_user_id = _require_warehouse(authorization)
    today = date.today().isoformat()

    result = (
        supabase_admin.table("warehouse_daily_zip_codes")
        .select("id, warehouse_auth_user_id, zip_date, status, carried_over_packets")
        .eq("id", zip_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ZIP code not found.")

    row = result.data[0]
    if row["warehouse_auth_user_id"] != warehouse_auth_user_id or row["zip_date"] != today:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ZIP code not found.")

    if (row.get("carried_over_packets") or 0) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ZIP has carried-over packets and cannot be removed.",
        )

    if row["status"] != "not_counted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Validated ZIP codes cannot be removed.",
        )

    supabase_admin.table("warehouse_daily_zip_codes").delete().eq("id", zip_id).execute()

    return WarehouseZipCodeDeleteResponse(message="ZIP code removed successfully")
