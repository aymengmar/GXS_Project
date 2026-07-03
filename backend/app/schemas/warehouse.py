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
