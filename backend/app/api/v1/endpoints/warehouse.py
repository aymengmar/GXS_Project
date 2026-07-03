from fastapi import APIRouter, Header

from app.schemas.warehouse import (
    AvailableDriversResponse,
    DriverAvailabilityUpdateRequest,
    DriverAvailabilityUpdateResponse,
)
from app.services.warehouse_service import get_available_drivers, update_driver_availability

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
