from typing import Literal, Optional

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
    carried_over_packets: int
    created_at: str
    updated_at: str


class WarehouseZipCodeCreateRequest(BaseModel):
    zip_code: str


class WarehouseZipCodeCreateResponse(WarehouseZipCodeItem):
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
