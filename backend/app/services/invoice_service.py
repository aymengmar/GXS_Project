import uuid
from datetime import date, datetime
from secrets import randbelow

from fastapi import HTTPException, UploadFile, status

from app.db.supabase import supabase_admin
from app.schemas.invoices import (
    INVOICE_TYPES,
    DriverInvoiceCreateResponse,
    DriverInvoiceItem,
    DriverInvoicesListResponse,
    DriverInvoiceSummary,
)

BUCKET = "driver-invoices"

ALLOWED_MIME_TYPES: set[str] = {"image/jpeg", "image/png", "application/pdf"}
MIME_TO_EXT: dict[str, str] = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "application/pdf": "pdf",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def _require_company_car_driver(authorization: str) -> tuple[str, str]:
    """Verifies the bearer token, confirms role=driver, and confirms
    car_type=company_car. Returns (auth_user_id, driver_profile_id).
    """
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

    profile_result = (
        supabase_admin.table("driver_profiles")
        .select("id, car_type")
        .eq("auth_user_id", auth_user_id)
        .execute()
    )
    if not profile_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found.")

    profile = profile_result.data[0]
    if profile.get("car_type") != "company_car":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invoices are only available for company-car drivers.",
        )

    return auth_user_id, str(profile["id"])


def _signed_url(storage_path: str | None) -> str | None:
    if not storage_path:
        return None
    try:
        signed = supabase_admin.storage.from_(BUCKET).create_signed_url(storage_path, 3600)
        if isinstance(signed, dict):
            return signed.get("signedURL") or signed.get("signed_url")
        return getattr(signed, "signed_url", None) or getattr(signed, "signedURL", None)
    except Exception:
        return None


def _generate_unique_invoice_number() -> str:
    date_part = datetime.utcnow().strftime("%Y%m%d")
    for _ in range(5):
        candidate = f"INV-{date_part}-{randbelow(10000):04d}"
        existing = (
            supabase_admin.table("driver_invoices")
            .select("id")
            .eq("invoice_number", candidate)
            .execute()
        )
        if not existing.data:
            return candidate
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Could not generate a unique invoice number. Please try again.",
    )


def _row_to_item(row: dict) -> DriverInvoiceItem:
    return DriverInvoiceItem(
        id=str(row["id"]),
        invoice_type=row["invoice_type"],
        invoice_date=str(row["invoice_date"]),
        amount=float(row["amount"]),
        currency=row.get("currency") or "EUR",
        details=row.get("details"),
        notes=row.get("notes"),
        invoice_number=row["invoice_number"],
        review_status=row.get("review_status") or "pending",
        status=row.get("status") or "uploaded",
        file_name=row.get("file_name"),
        mime_type=row.get("mime_type"),
        receipt_preview_url=_signed_url(row.get("storage_path")),
        created_at=row.get("created_at"),
    )


async def create_driver_invoice(
    authorization: str,
    invoice_type: str,
    invoice_date: date,
    amount: float,
    details: str | None,
    notes: str | None,
    file: UploadFile,
) -> DriverInvoiceCreateResponse:
    auth_user_id, driver_profile_id = _require_company_car_driver(authorization)

    if invoice_type not in INVOICE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid invoice_type. Allowed values: {', '.join(INVOICE_TYPES)}.",
        )

    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than 0.",
        )

    mime_type = file.content_type or ""
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type is not allowed. Allowed: JPEG, PNG, PDF.",
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Receipt file is required.")
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File exceeds the maximum allowed size of 10 MB.",
        )

    invoice_id = str(uuid.uuid4())
    file_name = file.filename or f"receipt.{MIME_TO_EXT[mime_type]}"
    storage_path = f"drivers/{auth_user_id}/invoices/{invoice_id}/{file_name}"
    invoice_number = _generate_unique_invoice_number()

    try:
        supabase_admin.storage.from_(BUCKET).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": mime_type, "upsert": "true"},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File storage failed: {exc}",
        )

    record = {
        "id": invoice_id,
        "auth_user_id": auth_user_id,
        "driver_profile_id": driver_profile_id,
        "invoice_type": invoice_type,
        "invoice_date": invoice_date.isoformat(),
        "amount": amount,
        "currency": "EUR",
        "details": details,
        "notes": notes,
        "invoice_number": invoice_number,
        "storage_bucket": BUCKET,
        "storage_path": storage_path,
        "file_name": file_name,
        "mime_type": mime_type,
        "file_size": len(file_bytes),
        "status": "uploaded",
        "review_status": "pending",
    }

    try:
        insert_result = supabase_admin.table("driver_invoices").insert(record).execute()
    except Exception as exc:
        try:
            supabase_admin.storage.from_(BUCKET).remove([storage_path])
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database record creation failed: {exc}",
        )

    row = insert_result.data[0] if insert_result.data else record
    return DriverInvoiceCreateResponse(
        message="Invoice uploaded and sent for review.",
        invoice=_row_to_item(row),
    )


def _is_current_month(invoice_date_str: str | None, now: datetime) -> bool:
    if not invoice_date_str:
        return False
    try:
        d = date.fromisoformat(str(invoice_date_str)[:10])
    except ValueError:
        return False
    return d.year == now.year and d.month == now.month


def get_driver_invoices(authorization: str) -> DriverInvoicesListResponse:
    auth_user_id, _ = _require_company_car_driver(authorization)

    result = (
        supabase_admin.table("driver_invoices")
        .select("*")
        .eq("auth_user_id", auth_user_id)
        .neq("status", "deleted")
        .order("invoice_date", desc=True)
        .order("created_at", desc=True)
        .execute()
    )
    rows = result.data or []

    now = datetime.utcnow()
    pending = sum(1 for r in rows if (r.get("review_status") or "pending") == "pending")
    approved = sum(1 for r in rows if r.get("review_status") == "approved")
    rejected = sum(1 for r in rows if r.get("review_status") == "rejected")
    total_amount_this_month = sum(
        float(r["amount"])
        for r in rows
        if r.get("review_status") == "approved" and _is_current_month(r.get("invoice_date"), now)
    )

    return DriverInvoicesListResponse(
        summary=DriverInvoiceSummary(
            total=len(rows),
            pending=pending,
            approved=approved,
            rejected=rejected,
            total_amount_this_month=round(total_amount_this_month, 2),
        ),
        items=[_row_to_item(row) for row in rows],
    )
