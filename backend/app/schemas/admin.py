from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, field_validator




class DriverStatusBreakdown(BaseModel):
    active: int
    pending: int
    blocked: int


class DashboardSummaryResponse(BaseModel):
    total_drivers: int
    pending_verifications: int
    active_drivers: int
    driver_status: DriverStatusBreakdown


class DriverListItem(BaseModel):
    id: str
    auth_user_id: str
    full_name: str
    email: str
    external_driver_id: Optional[str]
    display_driver_id: str
    car_type: str
    driver_type_label: str
    status: str
    status_label: str
    status_color: str
    profile_photo_url: Optional[str]
    created_at: Optional[str]


class StatusCounts(BaseModel):
    all: int
    active: int
    pending: int
    blocked: int


class DriversListResponse(BaseModel):
    items: list[DriverListItem]
    total: int
    status_counts: StatusCounts


class OwnCarDetails(BaseModel):
    id: str
    vehicle_make_model: Optional[str] = None
    plate_number: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_number: Optional[str] = None
    vehicle_year: Optional[int] = None


class DriverDetailResponse(BaseModel):
    id: str
    auth_user_id: str
    full_name: str
    email: str
    phone: Optional[str]
    external_driver_id: Optional[str]
    display_driver_id: str
    car_type: str
    driver_type_label: str
    status: str
    status_label: str
    status_color: str
    profile_photo_url: Optional[str]
    joined_date: Optional[str]
    joined_date_label: str
    own_car_details: Optional[OwnCarDetails] = None


class AssignExternalDriverIdRequest(BaseModel):
    external_driver_id: str


class AssignExternalDriverIdResponse(BaseModel):
    id: str
    external_driver_id: str
    display_driver_id: str


class ChangeDriverStatusRequest(BaseModel):
    status: str  # "active" | "pending" | "blocked"


class ChangeDriverStatusResponse(BaseModel):
    id: str
    status: str
    status_label: str
    status_color: str


# ── Driver Documents ──────────────────────────────────────────────────────────

class DriverDocumentsDriverInfo(BaseModel):
    id: str
    auth_user_id: str
    full_name: str
    display_driver_id: str
    driver_type_label: str
    status_label: str
    status_color: str
    profile_photo_url: Optional[str]


class DriverDocumentsSummary(BaseModel):
    total: int
    approved: int
    pending: int
    rejected: int


class DriverDocumentItem(BaseModel):
    id: str
    document_type: str
    title: str
    description: str
    status: str
    review_status: str
    status_label: str
    status_color: str
    uploaded_at: Optional[str]
    uploaded_at_label: str
    file_name: Optional[str]
    mime_type: Optional[str]
    preview_url: Optional[str]
    file_url: Optional[str]


class DriverDocumentsResponse(BaseModel):
    driver: DriverDocumentsDriverInfo
    summary: DriverDocumentsSummary
    documents: list[DriverDocumentItem]


class UpdateDocumentStatusRequest(BaseModel):
    status: str  # "approved" | "pending" | "rejected"


class UpdateDocumentStatusResponse(BaseModel):
    document: DriverDocumentItem
    summary: DriverDocumentsSummary


# ── Create Driver ─────────────────────────────────────────────────────────────

class CreateDriverRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    postal_code: str
    car_type: Literal["own_car", "company_car"]
    external_driver_id: str

    @field_validator("first_name", "last_name", "phone", "postal_code", "external_driver_id")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("This field cannot be blank.")
        return v.strip()


class CreateDriverResponse(BaseModel):
    id: str
    auth_user_id: str
    full_name: str
    email: str
    phone: Optional[str]
    postal_code: Optional[str]
    car_type: str
    driver_type_label: str
    status: str
    status_label: str
    status_color: str
    external_driver_id: Optional[str]
    display_driver_id: str
    profile_photo_url: Optional[str]


# ── Warehouse Users List ──────────────────────────────────────────────────────

class WarehouseUserListItem(BaseModel):
    id: str
    auth_user_id: str
    full_name: str
    email: str
    phone: Optional[str]
    city: Optional[str]
    external_id: Optional[str]
    display_external_id: str
    status: str
    status_label: str
    status_color: str
    created_at: Optional[str]


class WarehouseStatusCounts(BaseModel):
    all: int
    active: int
    pending: int
    blocked: int


class WarehouseUsersListResponse(BaseModel):
    items: list[WarehouseUserListItem]
    total: int
    status_counts: WarehouseStatusCounts


# ── Create Warehouse User ─────────────────────────────────────────────────────

class CreateWarehouseUserRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    city: str
    external_id: str

    @field_validator("first_name", "last_name", "phone", "city", "external_id")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("This field cannot be blank.")
        return v.strip()


class CreateWarehouseUserResponse(BaseModel):
    id: str
    auth_user_id: str
    full_name: str
    email: str
    phone: str
    city: str
    external_id: str
    role: str
    status: str
    status_label: str
    status_color: str
    # TODO: in production, email this password and do not return it
    temporary_password: Optional[str] = None


# ── Warehouse User Status & External ID ──────────────────────────────────────

class ChangeWarehouseStatusRequest(BaseModel):
    status: str  # "active" | "pending" | "blocked"


class ChangeWarehouseStatusResponse(BaseModel):
    id: str
    status: str
    status_label: str
    status_color: str
    is_active: bool


class AssignWarehouseExternalIdRequest(BaseModel):
    external_id: str


class AssignWarehouseExternalIdResponse(BaseModel):
    id: str
    external_id: str
    display_external_id: str
