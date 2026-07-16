from typing import Optional

from pydantic import BaseModel


class AssignmentItem(BaseModel):
    item_id: Optional[str] = None
    driver_auth_user_id: str
    driver_name: str
    driver_home_zip: Optional[str]
    zip_code: str
    packets: int
    match_type: str
    reason: str


class UnassignedZipItem(BaseModel):
    zip_code: str
    packets: int
    reason: str


class DriverWithoutPacketsItem(BaseModel):
    driver_auth_user_id: str
    driver_name: str
    reason: str


class AssignmentPlanSummary(BaseModel):
    total_packets: int
    assigned_packets: int
    unassigned_packets: int
    drivers_used: int
    ready_drivers: int


class AssignmentPlanGenerateResponse(BaseModel):
    status: str
    plan_id: str
    assignments: list[AssignmentItem]
    unassigned_zips: list[UnassignedZipItem]
    drivers_without_packets: list[DriverWithoutPacketsItem]
    plan_review: list[str]
    summary: AssignmentPlanSummary


class AssignmentPlanSendResponse(AssignmentPlanGenerateResponse):
    sent_at: str


class AssignmentItemPacketCountUpdateRequest(BaseModel):
    packets: int


class AssignmentItemDriverUpdateRequest(BaseModel):
    driver_auth_user_id: str


class AssignmentItemManualAddRequest(BaseModel):
    driver_auth_user_id: str
    zip_code: str
    packets: int
