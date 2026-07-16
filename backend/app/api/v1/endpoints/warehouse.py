from fastapi import APIRouter, Header

from app.schemas.assignment import (
    AssignmentItemDriverUpdateRequest,
    AssignmentItemManualAddRequest,
    AssignmentItemPacketCountUpdateRequest,
    AssignmentPlanGenerateResponse,
    AssignmentPlanSendResponse,
)
from app.schemas.warehouse import (
    AvailableDriversResponse,
    DriverAvailabilityUpdateRequest,
    DriverAvailabilityUpdateResponse,
    WarehouseZipAssignedPacketsUpdateRequest,
    WarehouseZipAssignedPacketsUpdateResponse,
    WarehouseZipCodeCreateRequest,
    WarehouseZipCodeCreateResponse,
    WarehouseZipCodeDeleteResponse,
    WarehouseZipCodeListResponse,
    WarehouseZipPacketCountUpdateRequest,
    WarehouseZipPacketCountUpdateResponse,
    WarehouseZipValidateResponse,
)
from app.services.assignment_service import (
    add_manual_plan_item,
    delete_plan_item,
    generate_assignment_plan,
    send_assignment_plan,
    update_plan_item_driver,
    update_plan_item_packet_count,
)
from app.services.warehouse_service import (
    add_zip_code,
    delete_zip_code,
    get_available_drivers,
    get_today_zip_codes,
    update_driver_availability,
    update_zip_assigned_packets,
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


@router.patch(
    "/zip-count/today/{zip_id}/assigned-packets",
    response_model=WarehouseZipAssignedPacketsUpdateResponse,
)
def zip_count_update_assigned_packets(
    zip_id: str,
    body: WarehouseZipAssignedPacketsUpdateRequest,
    authorization: str = Header(...),
) -> WarehouseZipAssignedPacketsUpdateResponse:
    return update_zip_assigned_packets(authorization, zip_id, body.assigned_packets)


@router.delete("/zip-count/today/{zip_id}", response_model=WarehouseZipCodeDeleteResponse)
def zip_count_delete(
    zip_id: str,
    authorization: str = Header(...),
) -> WarehouseZipCodeDeleteResponse:
    return delete_zip_code(authorization, zip_id)


@router.post(
    "/assignment-plan/generate",
    response_model=AssignmentPlanGenerateResponse,
)
def assignment_plan_generate(
    authorization: str = Header(...),
) -> AssignmentPlanGenerateResponse:
    return generate_assignment_plan(authorization)


@router.post(
    "/assignment-plan/items",
    response_model=AssignmentPlanGenerateResponse,
)
def assignment_plan_item_add_manual(
    body: AssignmentItemManualAddRequest,
    authorization: str = Header(...),
) -> AssignmentPlanGenerateResponse:
    return add_manual_plan_item(authorization, body.driver_auth_user_id, body.zip_code, body.packets)


@router.patch(
    "/assignment-plan/items/{item_id}/packet-count",
    response_model=AssignmentPlanGenerateResponse,
)
def assignment_plan_item_update_packet_count(
    item_id: str,
    body: AssignmentItemPacketCountUpdateRequest,
    authorization: str = Header(...),
) -> AssignmentPlanGenerateResponse:
    return update_plan_item_packet_count(authorization, item_id, body.packets)


@router.patch(
    "/assignment-plan/items/{item_id}/driver",
    response_model=AssignmentPlanGenerateResponse,
)
def assignment_plan_item_update_driver(
    item_id: str,
    body: AssignmentItemDriverUpdateRequest,
    authorization: str = Header(...),
) -> AssignmentPlanGenerateResponse:
    return update_plan_item_driver(authorization, item_id, body.driver_auth_user_id)


@router.delete(
    "/assignment-plan/items/{item_id}",
    response_model=AssignmentPlanGenerateResponse,
)
def assignment_plan_item_delete(
    item_id: str,
    authorization: str = Header(...),
) -> AssignmentPlanGenerateResponse:
    return delete_plan_item(authorization, item_id)


@router.post(
    "/assignment-plan/send",
    response_model=AssignmentPlanSendResponse,
)
def assignment_plan_send(
    authorization: str = Header(...),
) -> AssignmentPlanSendResponse:
    return send_assignment_plan(authorization)
