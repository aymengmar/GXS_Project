from fastapi import APIRouter, Header, HTTPException, Query, status
from fastapi.responses import Response

from app.db.supabase import supabase_admin
from app.schemas.admin import (
    AssignExternalDriverIdRequest,
    AssignExternalDriverIdResponse,
    AssignWarehouseExternalIdRequest,
    AssignWarehouseExternalIdResponse,
    ChangeDriverStatusRequest,
    ChangeDriverStatusResponse,
    ChangeWarehouseStatusRequest,
    ChangeWarehouseStatusResponse,
    CreateDriverRequest,
    CreateDriverResponse,
    CreateWarehouseUserRequest,
    CreateWarehouseUserResponse,
    DashboardSummaryResponse,
    DriverDetailResponse,
    DriverDocumentsResponse,
    DriversListResponse,
    UpdateDocumentStatusRequest,
    UpdateDocumentStatusResponse,
    WarehouseUsersListResponse,
)
from app.services.admin_service import (
    assign_external_driver_id,
    assign_warehouse_external_id,
    change_driver_status,
    change_warehouse_user_status,
    create_driver,
    create_warehouse_user,
    get_dashboard_summary,
    get_driver_detail,
    get_driver_documents,
    get_driver_photo_bytes,
    get_drivers_list,
    get_warehouse_users_list,
    update_document_status,
)

router = APIRouter()


def _require_admin(authorization: str) -> None:
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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied.",
        )

    app_user = app_user_result.data[0]

    if not app_user["is_active"] or app_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied.",
        )


@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def dashboard_summary(authorization: str = Header(...)) -> DashboardSummaryResponse:
    _require_admin(authorization)
    return get_dashboard_summary()


@router.get("/drivers/{driver_id}/documents", response_model=DriverDocumentsResponse)
def get_driver_documents_endpoint(
    driver_id: str,
    authorization: str = Header(...),
) -> DriverDocumentsResponse:
    _require_admin(authorization)
    result = get_driver_documents(driver_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found.")
    return result


@router.get("/drivers/{driver_id}", response_model=DriverDetailResponse)
def get_driver_detail_endpoint(
    driver_id: str,
    authorization: str = Header(...),
) -> DriverDetailResponse:
    _require_admin(authorization)
    result = get_driver_detail(driver_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found.")
    return result


@router.patch("/drivers/{driver_id}/external-id", response_model=AssignExternalDriverIdResponse)
def assign_external_driver_id_endpoint(
    driver_id: str,
    body: AssignExternalDriverIdRequest,
    authorization: str = Header(...),
) -> AssignExternalDriverIdResponse:
    _require_admin(authorization)
    return assign_external_driver_id(driver_id, body.external_driver_id)


@router.patch("/drivers/{driver_id}/status", response_model=ChangeDriverStatusResponse)
def change_driver_status_endpoint(
    driver_id: str,
    body: ChangeDriverStatusRequest,
    authorization: str = Header(...),
) -> ChangeDriverStatusResponse:
    _require_admin(authorization)
    return change_driver_status(driver_id, body.status)


@router.patch("/drivers/{driver_id}/documents/{document_id}/status", response_model=UpdateDocumentStatusResponse)
def update_document_status_endpoint(
    driver_id: str,
    document_id: str,
    body: UpdateDocumentStatusRequest,
    authorization: str = Header(...),
) -> UpdateDocumentStatusResponse:
    _require_admin(authorization)
    return update_document_status(driver_id, document_id, body.status)


@router.get("/drivers/{driver_id}/photo")
def get_driver_photo(driver_id: str, token: str = Query(...)) -> Response:
    """Proxy a driver's profile photo through the backend.

    The mobile client cannot always resolve the Supabase storage hostname directly,
    so this endpoint fetches the image server-side and streams it back.
    """
    try:
        user_response = supabase_admin.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        ) from exc

    if user_response.user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
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
    if not app_user["is_active"] or app_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    result = get_driver_photo_bytes(driver_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found.")

    image_bytes, media_type = result
    return Response(content=image_bytes, media_type=media_type)


@router.post("/drivers", response_model=CreateDriverResponse, status_code=status.HTTP_201_CREATED)
def create_driver_endpoint(
    body: CreateDriverRequest,
    authorization: str = Header(...),
) -> CreateDriverResponse:
    _require_admin(authorization)
    return create_driver(body)


@router.get("/drivers", response_model=DriversListResponse)
def list_drivers(
    authorization: str = Header(...),
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> DriversListResponse:
    _require_admin(authorization)
    return get_drivers_list(
        search=search,
        status_filter=status,
        limit=limit,
        offset=offset,
    )


@router.get("/warehouse-users", response_model=WarehouseUsersListResponse)
def list_warehouse_users(
    authorization: str = Header(...),
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> WarehouseUsersListResponse:
    _require_admin(authorization)
    return get_warehouse_users_list(
        search=search,
        status_filter=status,
        limit=limit,
        offset=offset,
    )


@router.patch("/warehouse-users/{user_id}/status", response_model=ChangeWarehouseStatusResponse)
def change_warehouse_status_endpoint(
    user_id: str,
    body: ChangeWarehouseStatusRequest,
    authorization: str = Header(...),
) -> ChangeWarehouseStatusResponse:
    _require_admin(authorization)
    return change_warehouse_user_status(user_id, body.status)


@router.patch("/warehouse-users/{user_id}/external-id", response_model=AssignWarehouseExternalIdResponse)
def assign_warehouse_external_id_endpoint(
    user_id: str,
    body: AssignWarehouseExternalIdRequest,
    authorization: str = Header(...),
) -> AssignWarehouseExternalIdResponse:
    _require_admin(authorization)
    return assign_warehouse_external_id(user_id, body.external_id)


@router.post("/warehouse-users", response_model=CreateWarehouseUserResponse, status_code=status.HTTP_201_CREATED)
def create_warehouse_user_endpoint(
    body: CreateWarehouseUserRequest,
    authorization: str = Header(...),
) -> CreateWarehouseUserResponse:
    _require_admin(authorization)
    return create_warehouse_user(body)
