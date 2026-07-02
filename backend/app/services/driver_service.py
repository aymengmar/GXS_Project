from datetime import date, datetime

from fastapi import HTTPException, status

from app.db.supabase import supabase_admin
from app.schemas.driver import (
    DriverDashboardAssignment,
    DriverDashboardCompanyCar,
    DriverDashboardDocumentsSummary,
    DriverDashboardDriverInfo,
    DriverDashboardOwnCarDetails,
    DriverDashboardResponse,
    DriverDashboardWarehouse,
    DriverDocumentListItem,
    DriverDocumentsListResponse,
    DriverInsuranceExpiryResponse,
    DriverVehicleDriverInfo,
    DriverVehicleInsuranceInfo,
    DriverVehicleResponse,
    DriverVehicleVehicleInfo,
)

_INSURANCE_EXPIRING_SOON_DAYS = 30

_STATUS_LABEL: dict[str, str] = {
    "approved": "Active",
    "pending": "Pending",
    "rejected": "Blocked",
}
_CAR_TYPE_LABEL: dict[str, str] = {
    "own_car": "Own Car Driver",
    "company_car": "Company Car Driver",
}

# Order here drives the order documents appear in the driver's document list.
REQUIRED_DOCUMENT_TYPES: list[str] = [
    "identity_document",
    "driving_licence",
    "health_insurance",
    "iban_bank_account",
    "home_registration",
]

_DOC_TITLE: dict[str, str] = {
    "identity_document": "ID / Passport",
    "driving_licence": "Driving Licence",
    "health_insurance": "Health Insurance",
    "iban_bank_account": "IBAN / Bank Account",
    "home_registration": "Home Registration",
}

_DOC_DESCRIPTION: dict[str, str] = {
    "identity_document": "Government issued ID or Passport",
    "driving_licence": "Driving licence document",
    "health_insurance": "Valid health insurance certificate",
    "iban_bank_account": "Bank account details (IBAN)",
    "home_registration": "Registration certificate (Meldebescheinigung)",
}

_REVIEW_STATUS_LABEL: dict[str, str] = {
    "approved": "Approved",
    "pending": "Pending",
    "rejected": "Rejected",
    "missing": "Missing",
}

_REVIEW_STATUS_COLOR: dict[str, str] = {
    "approved": "green",
    "pending": "yellow",
    "rejected": "red",
    "missing": "red",
}


def _require_driver(authorization: str) -> str:
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

    if not app_user["is_active"] or app_user["role"] != "driver":
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


def _parse_own_car_expiry_date(raw: str | None) -> date | None:
    if not raw:
        return None
    try:
        return date.fromisoformat(raw[:10])
    except ValueError:
        return None


def _compute_insurance_expiry(expiry_date: date | None) -> tuple[str | None, int | None, str]:
    """Derives days-until-expiry and status from a raw date, shared by the
    vehicle, dashboard, and insurance-expiry-update endpoints so they never
    disagree on thresholds.
    """
    if expiry_date is None:
        return None, None, "missing"

    days_until_expiry = (expiry_date - date.today()).days
    if days_until_expiry <= 0:
        expiry_status = "expired"
    elif days_until_expiry <= _INSURANCE_EXPIRING_SOON_DAYS:
        expiry_status = "expiring_soon"
    else:
        expiry_status = "valid"

    return expiry_date.isoformat(), days_until_expiry, expiry_status


def _get_profile_image_url(auth_user_id: str) -> str | None:
    """Profile photo — driver-documents bucket is private, so a signed URL is required."""
    photo_result = (
        supabase_admin.table("driver_documents")
        .select("storage_bucket, storage_path")
        .eq("auth_user_id", auth_user_id)
        .eq("document_type", "driver_photo")
        .neq("status", "deleted")
        .execute()
    )
    if not photo_result.data:
        return None
    photo = photo_result.data[0]
    bucket = photo.get("storage_bucket")
    path = photo.get("storage_path")
    if not (bucket and path):
        return None
    return _signed_url(bucket, path)


def _get_documents_summary(auth_user_id: str) -> DriverDashboardDocumentsSummary:
    """Counts against the 5 required document types only — driver_photo (the
    profile picture) is never part of this count, and the total is always
    fixed at len(REQUIRED_DOCUMENT_TYPES) regardless of how many are missing.
    Shared by the dashboard and the documents list so both screens agree.
    """
    docs_result = (
        supabase_admin.table("driver_documents")
        .select("document_type, review_status")
        .eq("auth_user_id", auth_user_id)
        .neq("status", "deleted")
        .in_("document_type", REQUIRED_DOCUMENT_TYPES)
        .execute()
    )
    by_type = {doc["document_type"]: doc for doc in (docs_result.data or [])}

    approved_count = pending_count = rejected_count = 0
    for doc_type in REQUIRED_DOCUMENT_TYPES:
        doc = by_type.get(doc_type)
        if doc is None:
            continue
        review_status = doc.get("review_status") or "pending"
        if review_status == "approved":
            approved_count += 1
        elif review_status == "rejected":
            rejected_count += 1
        else:
            pending_count += 1

    return DriverDashboardDocumentsSummary(
        total=len(REQUIRED_DOCUMENT_TYPES),
        approved=approved_count,
        pending=pending_count,
        rejected=rejected_count,
    )


def get_driver_dashboard(authorization: str) -> DriverDashboardResponse:
    auth_user_id = _require_driver(authorization)

    profile_result = (
        supabase_admin.table("driver_profiles")
        .select("id, auth_user_id, full_name, email, phone, car_type, status, external_driver_id, postal_code")
        .eq("auth_user_id", auth_user_id)
        .execute()
    )
    if not profile_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found.")

    profile = profile_result.data[0]
    car_type = profile.get("car_type") or ""
    db_status = profile.get("status") or ""

    profile_image_url = _get_profile_image_url(auth_user_id)

    # Document summary — same 5 required-document count used by the documents
    # list screen, so the two screens never disagree. driver_photo (the
    # profile picture) is excluded.
    documents_summary = _get_documents_summary(auth_user_id)

    own_car_details: DriverDashboardOwnCarDetails | None = None
    company_car: DriverDashboardCompanyCar | None = None

    if car_type == "own_car":
        ocd_result = (
            supabase_admin.table("own_car_details")
            .select(
                "id, vehicle_make_model, plate_number, insurance_provider, insurance_number, "
                "vehicle_year, insurance_expiry_date"
            )
            .eq("auth_user_id", auth_user_id)
            .execute()
        )
        if ocd_result.data:
            raw = ocd_result.data[0]
            expiry_date, days_until_expiry, expiry_status = _compute_insurance_expiry(
                _parse_own_car_expiry_date(raw.get("insurance_expiry_date"))
            )
            own_car_details = DriverDashboardOwnCarDetails(
                id=str(raw["id"]),
                vehicle_make_model=raw.get("vehicle_make_model"),
                plate_number=raw.get("plate_number"),
                insurance_provider=raw.get("insurance_provider"),
                insurance_number=raw.get("insurance_number"),
                vehicle_year=raw.get("vehicle_year"),
                insurance_expiry_date=expiry_date,
                insurance_days_until_expiry=days_until_expiry,
                insurance_expiry_status=expiry_status,
            )
    elif car_type == "company_car":
        company_car = DriverDashboardCompanyCar(
            title="Company Vehicle",
            description="Company car and invoice information will appear here.",
        )

    return DriverDashboardResponse(
        driver=DriverDashboardDriverInfo(
            full_name=profile.get("full_name") or "",
            email=profile.get("email") or "",
            phone=profile.get("phone"),
            status=db_status,
            status_label=_STATUS_LABEL.get(db_status, db_status),
            external_driver_id=profile.get("external_driver_id"),
            car_type=car_type,
            driver_type_label=_CAR_TYPE_LABEL.get(car_type, car_type),
            postal_code=profile.get("postal_code"),
            profile_image_url=profile_image_url,
        ),
        warehouse=DriverDashboardWarehouse(),
        documents_summary=documents_summary,
        today_assignment=DriverDashboardAssignment(status="not_assigned"),
        own_car_details=own_car_details,
        company_car=company_car,
    )


def _format_date_label(raw: str | None) -> str:
    if not raw:
        return "–"
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return dt.strftime("%b %d, %Y")
    except Exception:
        return raw


def get_driver_documents(authorization: str) -> DriverDocumentsListResponse:
    auth_user_id = _require_driver(authorization)

    docs_result = (
        supabase_admin.table("driver_documents")
        .select(
            "id, document_type, review_status, file_name, mime_type, "
            "storage_bucket, storage_path, created_at, updated_at"
        )
        .eq("auth_user_id", auth_user_id)
        .neq("status", "deleted")
        .in_("document_type", REQUIRED_DOCUMENT_TYPES)
        .execute()
    )
    by_type = {doc["document_type"]: doc for doc in (docs_result.data or [])}

    items: list[DriverDocumentListItem] = []

    for doc_type in REQUIRED_DOCUMENT_TYPES:
        doc = by_type.get(doc_type)

        if doc is None:
            items.append(
                DriverDocumentListItem(
                    id=f"missing-{doc_type}",
                    document_type=doc_type,
                    title=_DOC_TITLE.get(doc_type, doc_type),
                    description=_DOC_DESCRIPTION.get(doc_type, ""),
                    review_status="missing",
                    review_status_label=_REVIEW_STATUS_LABEL["missing"],
                    review_status_color=_REVIEW_STATUS_COLOR["missing"],
                    uploaded_at=None,
                    updated_at=None,
                    last_updated_label=_format_date_label(None),
                    file_name=None,
                    mime_type=None,
                    signed_url=None,
                )
            )
            continue

        review_status = doc.get("review_status") or "pending"

        bucket = doc.get("storage_bucket")
        path = doc.get("storage_path")
        signed = _signed_url(bucket, path) if bucket and path else None

        uploaded_at = doc.get("created_at")
        updated_at = doc.get("updated_at") or uploaded_at

        items.append(
            DriverDocumentListItem(
                id=str(doc["id"]),
                document_type=doc_type,
                title=_DOC_TITLE.get(doc_type, doc_type),
                description=_DOC_DESCRIPTION.get(doc_type, ""),
                review_status=review_status,
                review_status_label=_REVIEW_STATUS_LABEL.get(review_status, "Pending"),
                review_status_color=_REVIEW_STATUS_COLOR.get(review_status, "yellow"),
                uploaded_at=uploaded_at,
                updated_at=updated_at,
                last_updated_label=_format_date_label(updated_at),
                file_name=doc.get("file_name"),
                mime_type=doc.get("mime_type"),
                signed_url=signed,
            )
        )

    return DriverDocumentsListResponse(
        documents=items,
        summary=_get_documents_summary(auth_user_id),
    )


INSURANCE_DOCUMENT_TYPES: list[str] = ["vehicle_insurance", "car_insurance"]


def get_driver_vehicle(authorization: str) -> DriverVehicleResponse:
    auth_user_id = _require_driver(authorization)

    profile_result = (
        supabase_admin.table("driver_profiles")
        .select("full_name, car_type, status")
        .eq("auth_user_id", auth_user_id)
        .execute()
    )
    if not profile_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found.")

    profile = profile_result.data[0]
    car_type = profile.get("car_type") or ""

    if car_type != "own_car":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vehicle information is only available for own-car drivers.",
        )

    db_status = profile.get("status") or ""

    ocd_result = (
        supabase_admin.table("own_car_details")
        .select(
            "vehicle_make_model, plate_number, insurance_provider, insurance_number, "
            "vehicle_year, insurance_expiry_date"
        )
        .eq("auth_user_id", auth_user_id)
        .execute()
    )
    own_car_details = ocd_result.data[0] if ocd_result.data else {}

    expiry_date, days_until_expiry, expiry_status = _compute_insurance_expiry(
        _parse_own_car_expiry_date(own_car_details.get("insurance_expiry_date"))
    )

    insurance_doc_result = (
        supabase_admin.table("driver_documents")
        .select("review_status, storage_bucket, storage_path, mime_type")
        .eq("auth_user_id", auth_user_id)
        .in_("document_type", INSURANCE_DOCUMENT_TYPES)
        .neq("status", "deleted")
        .execute()
    )
    insurance_doc = insurance_doc_result.data[0] if insurance_doc_result.data else None

    if insurance_doc is not None:
        review_status = insurance_doc.get("review_status") or "pending"
        document_status = review_status
        document_status_label = _REVIEW_STATUS_LABEL.get(review_status, "Pending")
        bucket = insurance_doc.get("storage_bucket")
        path = insurance_doc.get("storage_path")
        document_preview_url = _signed_url(bucket, path) if bucket and path else None
        mime_type = insurance_doc.get("mime_type")
    else:
        document_status = "not_uploaded"
        document_status_label = "Not uploaded"
        document_preview_url = None
        mime_type = None

    return DriverVehicleResponse(
        driver=DriverVehicleDriverInfo(
            full_name=profile.get("full_name") or "",
            status=db_status,
            status_label=_STATUS_LABEL.get(db_status, db_status),
            car_type=car_type,
            driver_type_label=_CAR_TYPE_LABEL.get(car_type, car_type),
            profile_image_url=_get_profile_image_url(auth_user_id),
        ),
        vehicle=DriverVehicleVehicleInfo(
            make_model=own_car_details.get("vehicle_make_model"),
            plate_number=own_car_details.get("plate_number"),
            vehicle_type="Personal Vehicle",
            vehicle_year=own_car_details.get("vehicle_year"),
            registration_status="Completed",
        ),
        insurance=DriverVehicleInsuranceInfo(
            provider=own_car_details.get("insurance_provider"),
            insurance_number=own_car_details.get("insurance_number"),
            document_status=document_status,
            document_status_label=document_status_label,
            expiry_date=expiry_date,
            days_until_expiry=days_until_expiry,
            expiry_status=expiry_status,
            document_preview_url=document_preview_url,
            mime_type=mime_type,
        ),
    )


def update_driver_insurance_expiry(
    authorization: str, insurance_expiry_date: date
) -> DriverInsuranceExpiryResponse:
    auth_user_id = _require_driver(authorization)

    profile_result = (
        supabase_admin.table("driver_profiles")
        .select("car_type")
        .eq("auth_user_id", auth_user_id)
        .execute()
    )
    if not profile_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found.")

    car_type = profile_result.data[0].get("car_type") or ""
    if car_type != "own_car":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insurance expiry date can only be set by own-car drivers.",
        )

    ocd_result = (
        supabase_admin.table("own_car_details")
        .select("id")
        .eq("auth_user_id", auth_user_id)
        .execute()
    )
    if not ocd_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle details not found.")

    supabase_admin.table("own_car_details").update(
        {"insurance_expiry_date": insurance_expiry_date.isoformat()}
    ).eq("auth_user_id", auth_user_id).execute()

    expiry_date, days_until_expiry, expiry_status = _compute_insurance_expiry(insurance_expiry_date)
    return DriverInsuranceExpiryResponse(
        expiry_date=expiry_date,
        days_until_expiry=days_until_expiry,
        expiry_status=expiry_status,
    )
