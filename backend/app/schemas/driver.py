from datetime import date
from typing import Optional

from pydantic import BaseModel, field_validator


class DriverDashboardDriverInfo(BaseModel):
    full_name: str
    email: str
    phone: Optional[str]
    status: str
    status_label: str
    external_driver_id: Optional[str]
    car_type: str
    driver_type_label: str
    postal_code: Optional[str]
    profile_image_url: Optional[str]


class DriverDashboardWarehouse(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None


class DriverDashboardDocumentsSummary(BaseModel):
    total: int
    approved: int
    pending: int
    rejected: int


class DriverDashboardAssignment(BaseModel):
    status: str
    warehouse_name: Optional[str] = None
    start_time: Optional[str] = None
    date: Optional[str] = None


class DriverDashboardOwnCarDetails(BaseModel):
    id: str
    vehicle_make_model: Optional[str] = None
    plate_number: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_number: Optional[str] = None
    vehicle_year: Optional[int] = None
    insurance_expiry_date: Optional[str] = None
    insurance_days_until_expiry: Optional[int] = None
    insurance_expiry_status: str = "missing"


class DriverDashboardCompanyCar(BaseModel):
    title: str
    description: str


class DriverDashboardResponse(BaseModel):
    driver: DriverDashboardDriverInfo
    warehouse: DriverDashboardWarehouse
    documents_summary: DriverDashboardDocumentsSummary
    today_assignment: DriverDashboardAssignment
    own_car_details: Optional[DriverDashboardOwnCarDetails] = None
    company_car: Optional[DriverDashboardCompanyCar] = None


class DriverDocumentListItem(BaseModel):
    id: str
    document_type: str
    title: str
    description: str
    review_status: str
    review_status_label: str
    review_status_color: str
    uploaded_at: Optional[str]
    updated_at: Optional[str]
    last_updated_label: str
    file_name: Optional[str]
    mime_type: Optional[str]
    signed_url: Optional[str]


class DriverDocumentsListResponse(BaseModel):
    documents: list[DriverDocumentListItem]
    summary: DriverDashboardDocumentsSummary


class DriverVehicleDriverInfo(BaseModel):
    full_name: str
    status: str
    status_label: str
    car_type: str
    driver_type_label: str
    profile_image_url: Optional[str]


class DriverVehicleVehicleInfo(BaseModel):
    make_model: Optional[str]
    plate_number: Optional[str]
    vehicle_type: str
    vehicle_year: Optional[int]
    registration_status: str


class DriverVehicleInsuranceInfo(BaseModel):
    provider: Optional[str]
    insurance_number: Optional[str]
    document_status: str
    document_status_label: str
    expiry_date: Optional[str]
    days_until_expiry: Optional[int]
    expiry_status: str
    document_preview_url: Optional[str]
    mime_type: Optional[str]


class DriverVehicleResponse(BaseModel):
    driver: DriverVehicleDriverInfo
    vehicle: DriverVehicleVehicleInfo
    insurance: DriverVehicleInsuranceInfo


class DriverInsuranceExpiryUpdateRequest(BaseModel):
    insurance_expiry_date: date

    @field_validator("insurance_expiry_date")
    @classmethod
    def _reject_past_dates(cls, value: date) -> date:
        if value < date.today():
            raise ValueError("Insurance expiry date cannot be in the past.")
        return value


class DriverInsuranceExpiryResponse(BaseModel):
    expiry_date: Optional[str]
    days_until_expiry: Optional[int]
    expiry_status: str
