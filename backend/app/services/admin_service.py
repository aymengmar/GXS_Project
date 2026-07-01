import mimetypes
import secrets
import string
from datetime import datetime, timezone

from fastapi import HTTPException, status as http_status

from app.db.supabase import supabase_admin
from app.schemas.admin import (
    AssignExternalDriverIdResponse,
    AssignWarehouseExternalIdResponse,
    ChangeDriverStatusResponse,
    ChangeWarehouseStatusResponse,
    CreateDriverRequest,
    CreateDriverResponse,
    CreateWarehouseUserRequest,
    CreateWarehouseUserResponse,
    DashboardSummaryResponse,
    DriverDetailResponse,
    DriverDocumentItem,
    DriverDocumentsDriverInfo,
    DriverDocumentsResponse,
    DriverDocumentsSummary,
    DriverListItem,
    DriverStatusBreakdown,
    DriversListResponse,
    OwnCarDetails,
    StatusCounts,
    UpdateDocumentStatusResponse,
    WarehouseStatusCounts,
    WarehouseUserListItem,
    WarehouseUsersListResponse,
)

_STATUS_LABEL: dict[str, str] = {
    "approved": "Active",
    "pending": "Pending",
    "rejected": "Blocked",
}
_STATUS_COLOR: dict[str, str] = {
    "approved": "green",
    "pending": "yellow",
    "rejected": "red",
}
_CAR_TYPE_LABEL: dict[str, str] = {
    "own_car": "Own Car Driver",
    "company_car": "Company Car Driver",
}
_DISPLAY_FILTER_TO_DB: dict[str, str] = {
    "active": "approved",
    "pending": "pending",
    "blocked": "rejected",
}


def _count_table(table: str, filters: dict[str, str] | None = None) -> int:
    query = supabase_admin.table(table).select("id", count="exact")
    if filters:
        for column, value in filters.items():
            query = query.eq(column, value)
    result = query.execute()
    return result.count or 0


def get_dashboard_summary() -> DashboardSummaryResponse:
    total_drivers = _count_table("driver_profiles")
    pending_verifications = _count_table("driver_documents", {"status": "uploaded"})
    active_count = _count_table("driver_profiles", {"status": "approved"})
    pending_count = _count_table("driver_profiles", {"status": "pending"})
    blocked_count = _count_table("driver_profiles", {"status": "rejected"})

    return DashboardSummaryResponse(
        total_drivers=total_drivers,
        pending_verifications=pending_verifications,
        active_drivers=active_count,
        driver_status=DriverStatusBreakdown(
            active=active_count,
            pending=pending_count,
            blocked=blocked_count,
        ),
    )


def _signed_url(bucket: str, path: str) -> str | None:
    try:
        signed = supabase_admin.storage.from_(bucket).create_signed_url(path, 3600)
        if isinstance(signed, dict):
            return signed.get("signedURL") or signed.get("signed_url")
        return getattr(signed, "signed_url", None) or getattr(signed, "signedURL", None)
    except Exception:
        return None


def get_driver_photo_bytes(driver_id: str) -> tuple[bytes, str] | None:
    """Download a driver's profile photo from Supabase storage and return raw bytes."""
    profile_result = (
        supabase_admin.table("driver_profiles")
        .select("auth_user_id")
        .eq("id", driver_id)
        .execute()
    )
    if not profile_result.data:
        return None

    auth_uid = profile_result.data[0]["auth_user_id"]

    doc_result = (
        supabase_admin.table("driver_documents")
        .select("storage_bucket, storage_path")
        .eq("auth_user_id", auth_uid)
        .eq("document_type", "driver_photo")
        .execute()
    )
    if not doc_result.data:
        return None

    doc = doc_result.data[0]
    try:
        image_bytes = supabase_admin.storage.from_(doc["storage_bucket"]).download(
            doc["storage_path"]
        )
        mime_type = mimetypes.guess_type(doc["storage_path"])[0] or "image/jpeg"
        return (image_bytes, mime_type)
    except Exception:
        return None


def get_drivers_list(
    search: str | None,
    status_filter: str | None,
    limit: int,
    offset: int,
) -> DriversListResponse:
    db_status = _DISPLAY_FILTER_TO_DB.get(status_filter) if status_filter else None

    query = supabase_admin.table("driver_profiles").select(
        "id, auth_user_id, full_name, email, car_type, status, external_driver_id, created_at",
        count="exact",
    )
    if search:
        query = query.ilike("full_name", f"%{search}%")
    if db_status:
        query = query.eq("status", db_status)

    result = (
        query.order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    total = result.count or 0
    profiles = result.data or []

    # Fetch all driver_photo documents for the current page in one query
    photos_by_user: dict = {}
    if profiles:
        auth_ids = [p["auth_user_id"] for p in profiles]
        photo_result = (
            supabase_admin.table("driver_documents")
            .select("auth_user_id, storage_bucket, storage_path")
            .in_("auth_user_id", auth_ids)
            .eq("document_type", "driver_photo")
            .execute()
        )
        photos_by_user = {d["auth_user_id"]: d for d in (photo_result.data or [])}

    items: list[DriverListItem] = []
    for profile in profiles:
        auth_uid = profile["auth_user_id"]
        car_type = profile.get("car_type") or ""
        db_st = profile.get("status") or ""
        ext_id = profile.get("external_driver_id")

        photo_url: str | None = None
        doc = photos_by_user.get(auth_uid)
        if doc:
            photo_url = _signed_url(doc["storage_bucket"], doc["storage_path"])

        items.append(
            DriverListItem(
                id=str(profile["id"]),
                auth_user_id=str(auth_uid),
                full_name=profile.get("full_name") or "",
                email=profile.get("email") or "",
                external_driver_id=ext_id,
                display_driver_id=ext_id if ext_id else "Not assigned",
                car_type=car_type,
                driver_type_label=_CAR_TYPE_LABEL.get(car_type, car_type),
                status=db_st,
                status_label=_STATUS_LABEL.get(db_st, db_st),
                status_color=_STATUS_COLOR.get(db_st, "gray"),
                profile_photo_url=photo_url,
                created_at=profile.get("created_at"),
            )
        )

    # Status counts without search/filter — used for filter chips
    all_count = _count_table("driver_profiles")
    active_count = _count_table("driver_profiles", {"status": "approved"})
    pending_count = _count_table("driver_profiles", {"status": "pending"})
    blocked_count = _count_table("driver_profiles", {"status": "rejected"})

    return DriversListResponse(
        items=items,
        total=total,
        status_counts=StatusCounts(
            all=all_count,
            active=active_count,
            pending=pending_count,
            blocked=blocked_count,
        ),
    )


def _format_joined_date(raw: str | None) -> str:
    if not raw:
        return ""
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return dt.strftime("%b %d, %Y")
    except Exception:
        return raw


def assign_external_driver_id(driver_id: str, external_driver_id: str) -> AssignExternalDriverIdResponse:
    ext_id = external_driver_id.strip()
    if not ext_id:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="External Driver ID cannot be empty.")

    profile_result = (
        supabase_admin.table("driver_profiles")
        .select("id")
        .eq("id", driver_id)
        .execute()
    )
    if not profile_result.data:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Driver not found.")

    conflict_result = (
        supabase_admin.table("driver_profiles")
        .select("id")
        .eq("external_driver_id", ext_id)
        .neq("id", driver_id)
        .execute()
    )
    if conflict_result.data:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="This External Driver ID is already assigned to another driver.",
        )

    supabase_admin.table("driver_profiles").update({"external_driver_id": ext_id}).eq("id", driver_id).execute()

    return AssignExternalDriverIdResponse(
        id=driver_id,
        external_driver_id=ext_id,
        display_driver_id=ext_id,
    )


_REQUEST_TO_DB_STATUS: dict[str, str] = {
    "active": "approved",
    "pending": "pending",
    "blocked": "rejected",
}


def change_driver_status(driver_id: str, requested_status: str) -> ChangeDriverStatusResponse:
    if requested_status not in _REQUEST_TO_DB_STATUS:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Status must be one of: active, pending, blocked.",
        )

    profile_result = (
        supabase_admin.table("driver_profiles")
        .select("id, external_driver_id")
        .eq("id", driver_id)
        .execute()
    )
    if not profile_result.data:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Driver not found.")

    profile = profile_result.data[0]
    ext_id = (profile.get("external_driver_id") or "").strip()
    if not ext_id:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Assign External Driver ID before changing status.",
        )

    db_status = _REQUEST_TO_DB_STATUS[requested_status]
    supabase_admin.table("driver_profiles").update(
        {"status": db_status, "updated_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", driver_id).execute()

    return ChangeDriverStatusResponse(
        id=driver_id,
        status=db_status,
        status_label=_STATUS_LABEL.get(db_status, db_status),
        status_color=_STATUS_COLOR.get(db_status, "gray"),
    )


_DOC_TITLE: dict[str, str] = {
    "identity_document": "ID / Passport",
    "driving_licence":   "Driving Licence",
    "health_insurance":  "Health Insurance",
    "iban_bank_account": "IBAN / Bank Account",
    "home_registration": "Home Registration",
}

_DOC_DESCRIPTION: dict[str, str] = {
    "identity_document": "Government issued ID or Passport",
    "driving_licence":   "Driving licence document",
    "health_insurance":  "Valid health insurance certificate",
    "iban_bank_account": "Bank account details (IBAN)",
    "home_registration": "Registration certificate (Meldebescheinigung)",
}

_REVIEW_STATUS_LABEL: dict[str, str] = {
    "approved": "Approved",
    "pending":  "Pending",
    "rejected": "Rejected",
}

_REVIEW_STATUS_COLOR: dict[str, str] = {
    "approved": "green",
    "pending":  "yellow",
    "rejected": "red",
}


def _format_uploaded_at(raw: str | None) -> str:
    if not raw:
        return ""
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return dt.strftime("%b %d, %Y")
    except Exception:
        return raw


def get_driver_documents(driver_id: str) -> DriverDocumentsResponse | None:
    profile_result = (
        supabase_admin.table("driver_profiles")
        .select("id, auth_user_id, full_name, car_type, status, external_driver_id")
        .eq("id", driver_id)
        .execute()
    )
    if not profile_result.data:
        return None

    profile = profile_result.data[0]
    auth_uid = profile["auth_user_id"]
    car_type = profile.get("car_type") or ""
    db_st    = profile.get("status") or ""
    ext_id   = profile.get("external_driver_id")

    # Profile photo (signed URL)
    profile_photo_url: str | None = None
    photo_doc_result = (
        supabase_admin.table("driver_documents")
        .select("storage_bucket, storage_path")
        .eq("auth_user_id", auth_uid)
        .eq("document_type", "driver_photo")
        .execute()
    )
    if photo_doc_result.data:
        pd = photo_doc_result.data[0]
        profile_photo_url = _signed_url(pd["storage_bucket"], pd["storage_path"])

    # All non-photo documents
    docs_result = (
        supabase_admin.table("driver_documents")
        .select("id, document_type, status, review_status, file_name, mime_type, storage_bucket, storage_path, created_at")
        .eq("auth_user_id", auth_uid)
        .neq("document_type", "driver_photo")
        .order("created_at", desc=False)
        .execute()
    )
    raw_docs = docs_result.data or []

    doc_items: list[DriverDocumentItem] = []
    approved_count = 0
    pending_count  = 0
    rejected_count = 0

    for doc in raw_docs:
        doc_type      = doc.get("document_type") or ""
        file_status   = doc.get("status") or "uploaded"
        review_status = doc.get("review_status") or "pending"
        status_label  = _REVIEW_STATUS_LABEL.get(review_status, "Pending")
        status_color  = _REVIEW_STATUS_COLOR.get(review_status, "yellow")

        if review_status == "approved":
            approved_count += 1
        elif review_status == "rejected":
            rejected_count += 1
        else:
            pending_count += 1

        bucket = doc.get("storage_bucket") or ""
        path   = doc.get("storage_path") or ""
        signed = _signed_url(bucket, path) if bucket and path else None

        doc_items.append(
            DriverDocumentItem(
                id=str(doc["id"]),
                document_type=doc_type,
                title=_DOC_TITLE.get(doc_type, doc_type),
                description=_DOC_DESCRIPTION.get(doc_type, ""),
                status=file_status,
                review_status=review_status,
                status_label=status_label,
                status_color=status_color,
                uploaded_at=doc.get("created_at"),
                uploaded_at_label=_format_uploaded_at(doc.get("created_at")),
                file_name=doc.get("file_name"),
                mime_type=doc.get("mime_type"),
                preview_url=signed,
                file_url=signed,
            )
        )

    return DriverDocumentsResponse(
        driver=DriverDocumentsDriverInfo(
            id=str(profile["id"]),
            auth_user_id=str(auth_uid),
            full_name=profile.get("full_name") or "",
            display_driver_id=ext_id if ext_id else "Not assigned",
            driver_type_label=_CAR_TYPE_LABEL.get(car_type, car_type),
            status_label=_STATUS_LABEL.get(db_st, db_st),
            status_color=_STATUS_COLOR.get(db_st, "gray"),
            profile_photo_url=profile_photo_url,
        ),
        summary=DriverDocumentsSummary(
            total=len(doc_items),
            approved=approved_count,
            pending=pending_count,
            rejected=rejected_count,
        ),
        documents=doc_items,
    )


_VALID_REVIEW_STATUSES = {"approved", "pending", "rejected"}


def update_document_status(
    driver_id: str, document_id: str, ui_status: str
) -> UpdateDocumentStatusResponse:
    if ui_status not in _VALID_REVIEW_STATUSES:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Status must be one of: approved, pending, rejected.",
        )

    profile_result = (
        supabase_admin.table("driver_profiles")
        .select("id, auth_user_id")
        .eq("id", driver_id)
        .execute()
    )
    if not profile_result.data:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Driver not found.")

    auth_uid = profile_result.data[0]["auth_user_id"]

    doc_result = (
        supabase_admin.table("driver_documents")
        .select("id, document_type, status, review_status, file_name, mime_type, storage_bucket, storage_path, created_at")
        .eq("id", document_id)
        .eq("auth_user_id", auth_uid)
        .execute()
    )
    if not doc_result.data:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Document not found.")

    doc = doc_result.data[0]

    if doc.get("document_type") == "driver_photo":
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Cannot update status of driver photo.",
        )

    supabase_admin.table("driver_documents").update(
        {"review_status": ui_status, "updated_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", document_id).execute()

    bucket      = doc.get("storage_bucket") or ""
    path        = doc.get("storage_path") or ""
    signed      = _signed_url(bucket, path) if bucket and path else None
    doc_type    = doc.get("document_type") or ""
    file_status = doc.get("status") or "uploaded"

    doc_item = DriverDocumentItem(
        id=str(doc["id"]),
        document_type=doc_type,
        title=_DOC_TITLE.get(doc_type, doc_type),
        description=_DOC_DESCRIPTION.get(doc_type, ""),
        status=file_status,
        review_status=ui_status,
        status_label=_REVIEW_STATUS_LABEL.get(ui_status, "Pending"),
        status_color=_REVIEW_STATUS_COLOR.get(ui_status, "yellow"),
        uploaded_at=doc.get("created_at"),
        uploaded_at_label=_format_uploaded_at(doc.get("created_at")),
        file_name=doc.get("file_name"),
        mime_type=doc.get("mime_type"),
        preview_url=signed,
        file_url=signed,
    )

    all_docs_result = (
        supabase_admin.table("driver_documents")
        .select("review_status")
        .eq("auth_user_id", auth_uid)
        .neq("document_type", "driver_photo")
        .execute()
    )
    all_docs       = all_docs_result.data or []
    approved_count = sum(1 for d in all_docs if (d.get("review_status") or "pending") == "approved")
    rejected_count = sum(1 for d in all_docs if (d.get("review_status") or "pending") == "rejected")
    pending_count  = len(all_docs) - approved_count - rejected_count

    return UpdateDocumentStatusResponse(
        document=doc_item,
        summary=DriverDocumentsSummary(
            total=len(all_docs),
            approved=approved_count,
            pending=pending_count,
            rejected=rejected_count,
        ),
    )


def create_driver(req: CreateDriverRequest) -> CreateDriverResponse:
    # Duplicate email check
    existing = (
        supabase_admin.table("app_users")
        .select("id")
        .eq("email", str(req.email))
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # External Driver ID uniqueness check
    conflict = (
        supabase_admin.table("driver_profiles")
        .select("id")
        .eq("external_driver_id", req.external_driver_id)
        .execute()
    )
    if conflict.data:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="This External Driver ID is already assigned to another driver.",
        )

    # Generate a secure temporary password — driver must reset on first login
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    temp_password = "".join(secrets.choice(alphabet) for _ in range(20))

    # Create Supabase Auth user (email pre-confirmed, no verification email)
    try:
        auth_response = supabase_admin.auth.admin.create_user(
            {
                "email": str(req.email),
                "password": temp_password,
                "email_confirm": True,
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Could not create auth user. The email may already be registered.",
        ) from exc

    auth_user_id = str(auth_response.user.id)
    full_name = f"{req.first_name} {req.last_name}"

    try:
        supabase_admin.table("app_users").insert(
            {
                "auth_user_id": auth_user_id,
                "email": str(req.email),
                "full_name": full_name,
                "role": "driver",
                "is_active": True,
            }
        ).execute()

        profile_result = supabase_admin.table("driver_profiles").insert(
            {
                "auth_user_id": auth_user_id,
                "full_name": full_name,
                "email": str(req.email),
                "phone": req.phone,
                "postal_code": req.postal_code,
                "car_type": req.car_type,
                "status": "approved",
                "external_driver_id": req.external_driver_id or None,
            }
        ).execute()
    except Exception as exc:
        try:
            supabase_admin.auth.admin.delete_user(auth_user_id)
        except Exception:
            pass
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create driver profile. Please try again.",
        ) from exc

    profile = profile_result.data[0]

    ext_id = req.external_driver_id or None
    return CreateDriverResponse(
        id=str(profile["id"]),
        auth_user_id=auth_user_id,
        full_name=full_name,
        email=str(req.email),
        phone=req.phone,
        postal_code=req.postal_code,
        car_type=req.car_type,
        driver_type_label=_CAR_TYPE_LABEL.get(req.car_type, req.car_type),
        status="approved",
        status_label="Active",
        status_color="green",
        external_driver_id=ext_id,
        display_driver_id=ext_id if ext_id else "Not assigned",
        profile_photo_url=None,
    )


def get_driver_detail(driver_id: str) -> DriverDetailResponse | None:
    profile_result = (
        supabase_admin.table("driver_profiles")
        .select("id, auth_user_id, full_name, email, phone, car_type, status, external_driver_id, created_at")
        .eq("id", driver_id)
        .execute()
    )
    if not profile_result.data:
        return None

    profile = profile_result.data[0]
    auth_uid = profile["auth_user_id"]
    car_type = profile.get("car_type") or ""
    db_st = profile.get("status") or ""
    ext_id = profile.get("external_driver_id")
    joined_date = profile.get("created_at")

    photo_url: str | None = None
    doc_result = (
        supabase_admin.table("driver_documents")
        .select("storage_bucket, storage_path")
        .eq("auth_user_id", auth_uid)
        .eq("document_type", "driver_photo")
        .execute()
    )
    if doc_result.data:
        doc = doc_result.data[0]
        photo_url = _signed_url(doc["storage_bucket"], doc["storage_path"])

    own_car_details: OwnCarDetails | None = None
    if car_type == "own_car":
        ocd_result = (
            supabase_admin.table("own_car_details")
            .select("id, vehicle_make_model, plate_number, insurance_provider, insurance_number, vehicle_year")
            .eq("driver_profile_id", str(profile["id"]))
            .execute()
        )
        if not ocd_result.data:
            ocd_result = (
                supabase_admin.table("own_car_details")
                .select("id, vehicle_make_model, plate_number, insurance_provider, insurance_number, vehicle_year")
                .eq("auth_user_id", str(auth_uid))
                .execute()
            )
        if ocd_result.data:
            raw = ocd_result.data[0]
            own_car_details = OwnCarDetails(
                id=str(raw["id"]),
                vehicle_make_model=raw.get("vehicle_make_model"),
                plate_number=raw.get("plate_number"),
                insurance_provider=raw.get("insurance_provider"),
                insurance_number=raw.get("insurance_number"),
                vehicle_year=raw.get("vehicle_year"),
            )

    return DriverDetailResponse(
        id=str(profile["id"]),
        auth_user_id=str(auth_uid),
        full_name=profile.get("full_name") or "",
        email=profile.get("email") or "",
        phone=profile.get("phone"),
        external_driver_id=ext_id,
        display_driver_id=ext_id if ext_id else "Not assigned",
        car_type=car_type,
        driver_type_label=_CAR_TYPE_LABEL.get(car_type, car_type),
        status=db_st,
        status_label=_STATUS_LABEL.get(db_st, db_st),
        status_color=_STATUS_COLOR.get(db_st, "gray"),
        profile_photo_url=photo_url,
        joined_date=joined_date,
        joined_date_label=_format_joined_date(joined_date),
        own_car_details=own_car_details,
    )


_WH_STATUS_LABEL: dict[str, str] = {
    "active":  "Active",
    "pending": "Pending",
    "blocked": "Blocked",
}
_WH_STATUS_COLOR: dict[str, str] = {
    "active":  "green",
    "pending": "yellow",
    "blocked": "red",
}
_WH_VALID_STATUSES = {"active", "pending", "blocked"}
_WH_CHANGE_STATUSES = {"active", "pending", "blocked"}
_WH_STATUS_IS_ACTIVE: dict[str, bool] = {
    "active":  True,
    "pending": False,
    "blocked": False,
}


def get_warehouse_users_list(
    search: str | None,
    status_filter: str | None,
    limit: int,
    offset: int,
) -> WarehouseUsersListResponse:
    query = supabase_admin.table("warehouse_profiles").select(
        "id, auth_user_id, full_name, email, phone, city, external_id, status, created_at",
        count="exact",
    )
    if search:
        query = query.or_(
            f"full_name.ilike.%{search}%,email.ilike.%{search}%,external_id.ilike.%{search}%"
        )
    if status_filter and status_filter in _WH_VALID_STATUSES:
        query = query.eq("status", status_filter)

    result = (
        query.order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    total = result.count or 0
    profiles = result.data or []

    items: list[WarehouseUserListItem] = []
    for profile in profiles:
        ext_id = profile.get("external_id")
        db_st  = profile.get("status") or ""
        items.append(
            WarehouseUserListItem(
                id=str(profile["id"]),
                auth_user_id=str(profile["auth_user_id"]),
                full_name=profile.get("full_name") or "",
                email=profile.get("email") or "",
                phone=profile.get("phone"),
                city=profile.get("city"),
                external_id=ext_id,
                display_external_id=ext_id if ext_id else "Not assigned",
                status=db_st,
                status_label=_WH_STATUS_LABEL.get(db_st, db_st),
                status_color=_WH_STATUS_COLOR.get(db_st, "gray"),
                created_at=profile.get("created_at"),
            )
        )

    all_count     = _count_table("warehouse_profiles")
    active_count  = _count_table("warehouse_profiles", {"status": "active"})
    pending_count = _count_table("warehouse_profiles", {"status": "pending"})
    blocked_count = _count_table("warehouse_profiles", {"status": "blocked"})

    return WarehouseUsersListResponse(
        items=items,
        total=total,
        status_counts=WarehouseStatusCounts(
            all=all_count,
            active=active_count,
            pending=pending_count,
            blocked=blocked_count,
        ),
    )


def change_warehouse_user_status(user_id: str, requested_status: str) -> ChangeWarehouseStatusResponse:
    if requested_status not in _WH_CHANGE_STATUSES:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Status must be one of: active, pending, blocked.",
        )

    profile_result = (
        supabase_admin.table("warehouse_profiles")
        .select("id, auth_user_id")
        .eq("id", user_id)
        .execute()
    )
    if not profile_result.data:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Warehouse user not found.")

    auth_user_id = profile_result.data[0]["auth_user_id"]
    is_active = _WH_STATUS_IS_ACTIVE[requested_status]

    try:
        supabase_admin.table("warehouse_profiles").update(
            {"status": requested_status, "updated_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", user_id).execute()
    except Exception as exc:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Could not update warehouse status: {exc}",
        ) from exc

    try:
        supabase_admin.table("app_users").update(
            {"is_active": is_active}
        ).eq("auth_user_id", auth_user_id).execute()
    except Exception as exc:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Status updated but could not sync app_users.is_active: {exc}",
        ) from exc

    return ChangeWarehouseStatusResponse(
        id=user_id,
        status=requested_status,
        status_label=_WH_STATUS_LABEL.get(requested_status, requested_status),
        status_color=_WH_STATUS_COLOR.get(requested_status, "gray"),
        is_active=is_active,
    )


def assign_warehouse_external_id(user_id: str, external_id: str) -> AssignWarehouseExternalIdResponse:
    ext_id = external_id.strip()
    if not ext_id:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="External ID cannot be empty.")

    profile_result = (
        supabase_admin.table("warehouse_profiles")
        .select("id")
        .eq("id", user_id)
        .execute()
    )
    if not profile_result.data:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Warehouse user not found.")

    conflict_result = (
        supabase_admin.table("warehouse_profiles")
        .select("id")
        .eq("external_id", ext_id)
        .neq("id", user_id)
        .execute()
    )
    if conflict_result.data:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="This External ID is already assigned to another warehouse user.",
        )

    supabase_admin.table("warehouse_profiles").update({"external_id": ext_id}).eq("id", user_id).execute()

    return AssignWarehouseExternalIdResponse(
        id=user_id,
        external_id=ext_id,
        display_external_id=ext_id,
    )


def _generate_temporary_password() -> str:
    """Generate a secure temporary password (min 12 chars, guaranteed character variety)."""
    special = "!@#$%^&*"
    alphabet = string.ascii_letters + string.digits + special
    while True:
        pwd = "".join(secrets.choice(alphabet) for _ in range(16))
        if (
            any(c.isupper() for c in pwd)
            and any(c.islower() for c in pwd)
            and any(c.isdigit() for c in pwd)
            and any(c in special for c in pwd)
        ):
            return pwd


def create_warehouse_user(req: CreateWarehouseUserRequest) -> CreateWarehouseUserResponse:
    email_str = str(req.email)
    external_id = req.external_id.strip()

    # Duplicate email check across app_users and warehouse_profiles
    existing_app = (
        supabase_admin.table("app_users")
        .select("id")
        .eq("email", email_str)
        .execute()
    )
    if existing_app.data:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    existing_wh = (
        supabase_admin.table("warehouse_profiles")
        .select("id")
        .eq("email", email_str)
        .execute()
    )
    if existing_wh.data:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # External ID uniqueness check
    existing_ext = (
        supabase_admin.table("warehouse_profiles")
        .select("id")
        .eq("external_id", external_id)
        .execute()
    )
    if existing_ext.data:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="This External ID is already assigned to another warehouse user.",
        )

    # Generate a secure temporary password — user must reset on first login
    # TODO: in production, email this password and do not return it
    temp_password = _generate_temporary_password()

    # Create Supabase Auth user
    try:
        auth_response = supabase_admin.auth.admin.create_user(
            {
                "email": email_str,
                "password": temp_password,
                "email_confirm": True,
            }
        )
    except Exception as exc:
        error_msg = str(exc).lower()
        if "already" in error_msg or "duplicate" in error_msg or "exists" in error_msg:
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            ) from exc
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Could not create auth user. The email may already be registered.",
        ) from exc

    auth_user_id = str(auth_response.user.id)
    full_name = f"{req.first_name} {req.last_name}"

    try:
        supabase_admin.table("app_users").insert(
            {
                "auth_user_id": auth_user_id,
                "email": email_str,
                "full_name": full_name,
                "role": "warehouse_staff",
                "is_active": True,
            }
        ).execute()

        wh_result = supabase_admin.table("warehouse_profiles").insert(
            {
                "auth_user_id": auth_user_id,
                "full_name": full_name,
                "email": email_str,
                "phone": req.phone,
                "city": req.city,
                "external_id": external_id,
                "status": "active",
            }
        ).execute()
    except Exception as exc:
        try:
            supabase_admin.auth.admin.delete_user(auth_user_id)
        except Exception:
            pass
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create warehouse user profile. Please try again.",
        ) from exc

    profile = wh_result.data[0]

    return CreateWarehouseUserResponse(
        id=str(profile["id"]),
        auth_user_id=auth_user_id,
        full_name=full_name,
        email=email_str,
        phone=req.phone,
        city=req.city,
        external_id=external_id,
        role="warehouse_staff",
        status="active",
        status_label="Active",
        status_color="green",
        temporary_password=temp_password,
    )
