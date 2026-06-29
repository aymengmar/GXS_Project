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
