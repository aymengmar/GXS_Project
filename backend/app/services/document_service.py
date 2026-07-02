from fastapi import HTTPException, UploadFile, status

from app.db.supabase import supabase_admin

ALLOWED_TYPES: dict[str, set[str]] = {
    "driver_photo": {"image/jpeg", "image/png", "image/webp"},
    "identity_document": {"image/jpeg", "image/png", "image/webp", "application/pdf"},
    "driving_licence": {"image/jpeg", "image/png", "image/webp", "application/pdf"},
    "health_insurance": {"image/jpeg", "image/png", "image/webp", "application/pdf"},
    "iban_bank_account": {"image/jpeg", "image/png", "image/webp", "application/pdf"},
    "home_registration": {"image/jpeg", "image/png", "image/webp", "application/pdf"},
}

MIME_TO_EXT: dict[str, str] = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def _verify_bearer_token(authorization: str) -> str:
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

    return str(user_response.user.id)


async def upload_driver_document(
    authorization: str,
    document_type: str,
    file: UploadFile,
) -> dict:
    auth_user_id = _verify_bearer_token(authorization)

    if document_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document_type. Allowed values: {', '.join(ALLOWED_TYPES)}.",
        )

    mime_type = file.content_type or ""
    if mime_type not in ALLOWED_TYPES[document_type]:
        allowed = ", ".join(sorted(ALLOWED_TYPES[document_type]))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{mime_type}' is not allowed for '{document_type}'. Allowed: {allowed}.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File exceeds the maximum allowed size of 10 MB.",
        )

    extension = MIME_TO_EXT[mime_type]
    storage_path = f"drivers/{auth_user_id}/{document_type}.{extension}"
    file_name = file.filename or f"{document_type}.{extension}"

    try:
        supabase_admin.storage.from_("driver-documents").upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": mime_type, "upsert": "true"},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File storage failed: {exc}",
        )

    try:
        existing = (
            supabase_admin.table("driver_documents")
            .select("id")
            .eq("auth_user_id", auth_user_id)
            .eq("document_type", document_type)
            .execute()
        )
        record = {
            "storage_bucket": "driver-documents",
            "storage_path": storage_path,
            "file_name": file_name,
            "mime_type": mime_type,
            "file_size": len(file_bytes),
            "status": "uploaded",
        }
        if existing.data:
            supabase_admin.table("driver_documents").update(record).eq(
                "auth_user_id", auth_user_id
            ).eq("document_type", document_type).execute()
        else:
            supabase_admin.table("driver_documents").insert(
                {"auth_user_id": auth_user_id, "document_type": document_type, **record}
            ).execute()
    except Exception as exc:
        # Storage upload succeeded but DB save failed — delete the orphan file.
        try:
            supabase_admin.storage.from_("driver-documents").remove([storage_path])
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database record update failed: {exc}",
        )

    return {
        "message": "Document uploaded successfully.",
        "document_type": document_type,
        "storage_path": storage_path,
    }
