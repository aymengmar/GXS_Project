from fastapi import APIRouter, Header, HTTPException, status

from app.db.supabase import supabase_admin
from app.schemas.admin import DashboardSummaryResponse
from app.services.admin_service import get_dashboard_summary

router = APIRouter()


def _require_admin(authorization: str) -> None:
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header.",
        )
    token = authorization.removeprefix("Bearer ").strip()

    try:
        user_response = supabase_admin.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
        ) from exc

    if user_response.user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
        )

    auth_user_id = str(user_response.user.id)

    app_user_result = (
        supabase_admin.table("app_users")
        .select("role, is_active")
        .eq("auth_user_id", auth_user_id)
        .execute()
    )

    if not app_user_result.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied.",
        )

    app_user = app_user_result.data[0]

    if not app_user["is_active"] or app_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied.",
        )


@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def dashboard_summary(authorization: str = Header(...)) -> DashboardSummaryResponse:
    _require_admin(authorization)
    return get_dashboard_summary()
