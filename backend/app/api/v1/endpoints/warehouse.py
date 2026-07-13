from fastapi import APIRouter, Header

from app.schemas.warehouse import (
    AvailableDriversResponse,
    DriverAvailabilityUpdateRequest,
    DriverAvailabilityUpdateResponse,
    WarehouseZipCodeCreateRequest,
    WarehouseZipCodeCreateResponse,
    WarehouseZipCodeDeleteResponse,
    WarehouseZipCodeListResponse,
    WarehouseZipPacketCountUpdateRequest,
    WarehouseZipPacketCountUpdateResponse,
    WarehouseZipValidateResponse,
)
from app.services.warehouse_service import (
    add_zip_code,
    delete_zip_code,
    get_available_drivers,
    get_today_zip_codes,
    update_driver_availability,
    update_zip_packet_count,
    validate_zip_code,
)

router = APIRouter()


@router.get("/dashboard/available-drivers", response_model=AvailableDriversResponse)
def dashboard_available_drivers(authorization: str = Header(...)) -> AvailableDriversResponse:
    return get_available_drivers(authorization)


@router.patch(
    "/drivers/{driver_auth_user_id}/availability",
    response_model=DriverAvailabilityUpdateResponse,
)
def update_driver_availability_endpoint(
    driver_auth_user_id: str,
    body: DriverAvailabilityUpdateRequest,
    authorization: str = Header(...),
) -> DriverAvailabilityUpdateResponse:
    return update_driver_availability(authorization, driver_auth_user_id, body.status)


@router.get("/zip-count/today", response_model=WarehouseZipCodeListResponse)
def zip_count_today(authorization: str = Header(...)) -> WarehouseZipCodeListResponse:
    return get_today_zip_codes(authorization)


@router.post(
    "/zip-count/today",
    response_model=WarehouseZipCodeCreateResponse,
    status_code=201,
)
def zip_count_add(
    body: WarehouseZipCodeCreateRequest,
    authorization: str = Header(...),
) -> WarehouseZipCodeCreateResponse:
    return add_zip_code(authorization, body.zip_code)


@router.patch(
    "/zip-count/today/{zip_id}/packet-count",
    response_model=WarehouseZipPacketCountUpdateResponse,
)
def zip_count_update_packet_count(
    zip_id: str,
    body: WarehouseZipPacketCountUpdateRequest,
    authorization: str = Header(...),
) -> WarehouseZipPacketCountUpdateResponse:
    return update_zip_packet_count(authorization, zip_id, body.packet_count)


@router.patch(
    "/zip-count/today/{zip_id}/validate",
    response_model=WarehouseZipValidateResponse,
)
def zip_count_validate(
    zip_id: str,
    authorization: str = Header(...),
) -> WarehouseZipValidateResponse:
    return validate_zip_code(authorization, zip_id)


@router.delete("/zip-count/today/{zip_id}", response_model=WarehouseZipCodeDeleteResponse)
def zip_count_delete(
    zip_id: str,
    authorization: str = Header(...),
) -> WarehouseZipCodeDeleteResponse:
    return delete_zip_code(authorization, zip_id)
