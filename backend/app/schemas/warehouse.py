from typing import Any, Literal, Optional

from pydantic import BaseModel


class AvailableDriverItem(BaseModel):
    id: str
    auth_user_id: str
    full_name: str
    external_driver_id: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    car_type: Optional[str]
    driver_type_label: str
    postal_code: Optional[str]
    status: str
    profile_image_url: Optional[str]
    availability_status: str
    availability_label: str


class AvailableDriversSummary(BaseModel):
    available_drivers: int
    total_packets: int


class AvailableDriversResponse(BaseModel):
    drivers: list[AvailableDriverItem]
    summary: AvailableDriversSummary


class DriverAvailabilityUpdateRequest(BaseModel):
    status: Literal["ready", "not_ready"]


class DriverAvailabilityUpdateResponse(BaseModel):
    driver_auth_user_id: str
    availability_date: str
    status: str
    label: str


class WarehouseZipCodeItem(BaseModel):
    id: str
    zip_code: str
    zip_date: str
    status: str
    status_label: str
    packet_count: int
    manual_packet_count: Optional[int]
    carried_over_packets: int
    assigned_packets: int
    remaining_packets: int
    created_at: str
    updated_at: str


class WarehouseZipCodeCreateRequest(BaseModel):
    zip_code: str


class WarehouseZipCodeCreateResponse(WarehouseZipCodeItem):
    pass


class WarehouseZipPacketCountUpdateRequest(BaseModel):
    packet_count: int


class WarehouseZipPacketCountUpdateResponse(WarehouseZipCodeItem):
    pass


class WarehouseZipValidateResponse(WarehouseZipCodeItem):
    pass


class WarehouseZipAssignedPacketsUpdateRequest(BaseModel):
    assigned_packets: int


class WarehouseZipAssignedPacketsUpdateResponse(WarehouseZipCodeItem):
    pass


class WarehouseZipCodeSummary(BaseModel):
    total_zip_codes: int
    validated: int
    not_counted: int
    in_progress: int
    total_packets: int
    carried_over_packets: int


class WarehouseZipCodeListResponse(BaseModel):
    summary: WarehouseZipCodeSummary
    zip_codes: list[WarehouseZipCodeItem]


class WarehouseZipCodeDeleteResponse(BaseModel):
    message: str


class WarehouseReturnsYesterdaySummaryResponse(BaseModel):
    assignment_date: str
    status: Literal["pending_validation", "no_assignment"]
    assigned_yesterday: int
    drivers_involved: int
    returned_packets: int
    confirmed_signatures: int
    pending_signatures: int
    is_closed: bool
    closure_id: Optional[str]
    closed_at: Optional[str]


class WarehouseReturnDriverItem(BaseModel):
    plan_id: str
    plan_item_id: str
    driver_auth_user_id: str
    driver_name: str
    driver_external_id: Optional[str]
    zip_code: str
    assigned_packets: int
    returned_packets: int
    signature_status: Literal["not_started", "confirmed"]
    signed_at: Optional[str]
    has_signature: bool


class WarehouseReturnsYesterdayDriversResponse(BaseModel):
    assignment_date: str
    total_items: int
    rows: list[WarehouseReturnDriverItem]


class WarehouseReturnRecordSaveRequest(BaseModel):
    plan_item_id: str
    returned_packets: int
    signature_data: Any = None


class WarehouseReturnRecordResponse(WarehouseReturnDriverItem):
    pass


class WarehouseReturnDayCloseResponse(BaseModel):
    status: Literal["closed"]
    closure_id: str
    assignment_date: str
    return_date: str
    total_assigned_packets: int
    total_returned_packets: int
    drivers_count: int
    confirmed_signatures: int
    pending_signatures: int
    message: str
