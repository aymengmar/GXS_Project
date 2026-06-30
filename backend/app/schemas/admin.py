from typing import Optional

from pydantic import BaseModel




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
