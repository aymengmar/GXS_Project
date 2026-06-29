from app.db.supabase import supabase_admin
from app.schemas.admin import DashboardSummaryResponse, DriverStatusBreakdown


def _count_table(table: str, filters: dict[str, str] | None = None) -> int:
    query = supabase_admin.table(table).select("id", count="exact")
    if filters:
        for column, value in filters.items():
            query = query.eq(column, value)
    result = query.execute()
    return result.count or 0


def get_dashboard_summary() -> DashboardSummaryResponse:
    total_drivers = _count_table("driver_profiles")
    pending_verifications = _count_table("driver_documents", {"status": "uploaded"})
    active_count = _count_table("driver_profiles", {"status": "approved"})
    pending_count = _count_table("driver_profiles", {"status": "pending"})
    blocked_count = _count_table("driver_profiles", {"status": "rejected"})

    return DashboardSummaryResponse(
        total_drivers=total_drivers,
        pending_verifications=pending_verifications,
        active_drivers=active_count,
        driver_status=DriverStatusBreakdown(
            active=active_count,
            pending=pending_count,
            blocked=blocked_count,
        ),
    )
