from collections import defaultdict
from datetime import date, datetime, timezone

from fastapi import HTTPException, status

from app.db.supabase import supabase_admin
from app.schemas.assignment import (
    AssignmentItem,
    AssignmentPlanGenerateResponse,
    AssignmentPlanSummary,
    DriverWithoutPacketsItem,
    UnassignedZipItem,
)
from app.services.openai_service import request_ai_assignment_plan
from app.services.warehouse_service import (
    _require_warehouse,
    get_ready_drivers,
    get_today_validated_zips_with_remaining,
)

_MAX_DRIVER_PACKETS = 100

_SAME_ZIP_REASON = "Same ZIP as driver home ZIP."
_NEAREST_ZIP_REASON = "Closest available driver by ZIP distance."
_BALANCED_REASON = "Balanced packet load under 100 packet limit."
_NO_DRIVER_CAPACITY_REASON = "Remaining packets exceed available driver capacity."
_NO_READY_DRIVERS_REASON = "No ready drivers available today."
_DRIVER_NO_ZIP_REASON = "No suitable ZIP left or no capacity needed."


def _numeric_or_none(value: str | None) -> int | None:
    if value and value.isdigit():
        return int(value)
    return None


def _label_match(driver: dict, zip_code: str) -> tuple[str, str]:
    if driver.get("postal_code") == zip_code:
        return "same_zip", _SAME_ZIP_REASON
    driver_zip_num = _numeric_or_none(driver.get("postal_code"))
    zip_num = _numeric_or_none(zip_code)
    if driver_zip_num is not None and zip_num is not None:
        return "nearest_zip", _NEAREST_ZIP_REASON
    return "balanced", _BALANCED_REASON


def _nearest_zip_for_driver(driver: dict, zips: list[dict], remaining: dict[str, int]) -> tuple[str, str, str] | None:
    """Find the closest ZIP (by numeric postal-code distance) that still has
    remaining packets. Returns (zip_code, match_type, reason) or None if no
    ZIP has capacity left."""
    available = [z for z in zips if remaining[z["zip_code"]] > 0]
    if not available:
        return None

    driver_zip_num = _numeric_or_none(driver.get("postal_code"))
    if driver_zip_num is not None:
        numeric_candidates = [
            (z["zip_code"], abs(driver_zip_num - zip_num))
            for z in available
            if (zip_num := _numeric_or_none(z["zip_code"])) is not None
        ]
        if numeric_candidates:
            zip_code, distance = min(numeric_candidates, key=lambda t: (t[1], t[0]))
            if distance == 0:
                return zip_code, "same_zip", _SAME_ZIP_REASON
            return zip_code, "nearest_zip", _NEAREST_ZIP_REASON

    # Balanced fallback: driver has no valid postal code, or none of the
    # remaining ZIPs have a valid numeric postal code to measure distance to.
    fallback_zip = min(available, key=lambda z: z["zip_code"])
    return fallback_zip["zip_code"], "balanced", _BALANCED_REASON


def _generate_deterministic_raw_items(zips: list[dict], drivers: list[dict]) -> list[dict]:
    capacity = {d["auth_user_id"]: _MAX_DRIVER_PACKETS for d in drivers}
    remaining = {z["zip_code"]: z["remaining_packets"] for z in zips}
    sorted_drivers = sorted(drivers, key=lambda d: d["full_name"])
    raw_items: list[dict] = []

    def assign(driver: dict, zip_code: str, packets: int, match_type: str, reason: str) -> None:
        if packets <= 0:
            return
        raw_items.append(
            {
                "driver_auth_user_id": driver["auth_user_id"],
                "zip_code": zip_code,
                "packets": packets,
                "match_type": match_type,
                "reason": reason,
            }
        )
        capacity[driver["auth_user_id"]] -= packets
        remaining[zip_code] -= packets

    # Driver-to-nearest-ZIP: each ready driver repeatedly claims its closest
    # remaining ZIP until its own capacity is exhausted or no ZIP has
    # packets left. This prevents an early driver's home ZIP from starving
    # capacity that a nearer driver would have used for it.
    for driver in sorted_drivers:
        driver_id = driver["auth_user_id"]
        while capacity[driver_id] > 0:
            match = _nearest_zip_for_driver(driver, zips, remaining)
            if match is None:
                break
            zip_code, match_type, reason = match
            amount = min(capacity[driver_id], remaining[zip_code])
            assign(driver, zip_code, amount, match_type, reason)

    return raw_items


def _finalize_plan(raw_items: list[dict], zips: list[dict], drivers: list[dict]) -> dict:
    """Validate raw assignment items against every business rule and build the
    finalized response structures. Raises ValueError on any violation — used
    both to reject an untrusted AI draft and as a defensive check on the
    deterministic planner's own output."""
    zip_by_code = {z["zip_code"]: z for z in zips}
    driver_by_id = {d["auth_user_id"]: d for d in drivers}

    per_driver_total: dict[str, int] = defaultdict(int)
    per_zip_total: dict[str, int] = defaultdict(int)
    merged: dict[tuple[str, str], dict] = {}

    for raw_item in raw_items:
        driver_id = raw_item["driver_auth_user_id"]
        zip_code = raw_item["zip_code"]
        packets = raw_item["packets"]

        if driver_id not in driver_by_id:
            raise ValueError(f"Unknown or non-ready driver in plan: {driver_id}")
        if zip_code not in zip_by_code:
            raise ValueError(f"Unknown or non-validated ZIP in plan: {zip_code}")
        if not isinstance(packets, int) or isinstance(packets, bool) or packets <= 0:
            raise ValueError(f"Invalid packet count for {driver_id}/{zip_code}: {packets}")

        per_driver_total[driver_id] += packets
        per_zip_total[zip_code] += packets

        key = (driver_id, zip_code)
        if key in merged:
            merged[key]["packets"] += packets
        else:
            merged[key] = dict(raw_item)

    for driver_id, total in per_driver_total.items():
        if total > _MAX_DRIVER_PACKETS:
            raise ValueError(f"Driver {driver_id} exceeds max capacity: {total}")

    for zip_code, total in per_zip_total.items():
        if total > zip_by_code[zip_code]["remaining_packets"]:
            raise ValueError(f"ZIP {zip_code} over-assigned: {total} > {zip_by_code[zip_code]['remaining_packets']}")

    assignments = [
        AssignmentItem(
            driver_auth_user_id=item["driver_auth_user_id"],
            driver_name=driver_by_id[item["driver_auth_user_id"]]["full_name"],
            driver_home_zip=driver_by_id[item["driver_auth_user_id"]].get("postal_code"),
            zip_code=item["zip_code"],
            packets=item["packets"],
            match_type=item["match_type"],
            reason=item["reason"],
        )
        for item in merged.values()
    ]

    unassigned_zips = []
    for z in zips:
        leftover = z["remaining_packets"] - per_zip_total.get(z["zip_code"], 0)
        if leftover > 0:
            reason = _NO_READY_DRIVERS_REASON if not drivers else _NO_DRIVER_CAPACITY_REASON
            unassigned_zips.append(UnassignedZipItem(zip_code=z["zip_code"], packets=leftover, reason=reason))

    drivers_without_packets = [
        DriverWithoutPacketsItem(
            driver_auth_user_id=d["auth_user_id"],
            driver_name=d["full_name"],
            reason=_DRIVER_NO_ZIP_REASON,
        )
        for d in drivers
        if per_driver_total.get(d["auth_user_id"], 0) == 0
    ]

    total_packets = sum(z["remaining_packets"] for z in zips)
    assigned_packets = sum(a.packets for a in assignments)
    unassigned_packets = sum(u.packets for u in unassigned_zips)
    drivers_used = sum(1 for total in per_driver_total.values() if total > 0)

    plan_review: list[str] = []
    if not zips:
        plan_review.append("No validated ZIPs ready for assignment.")
    if not drivers:
        plan_review.append(_NO_READY_DRIVERS_REASON)
    for uz in unassigned_zips:
        plan_review.append(f"ZIP {uz.zip_code} still has {uz.packets} unassigned packets.")
    for dwp in drivers_without_packets:
        plan_review.append(f"Driver {dwp.driver_name} has no packets.")

    return {
        "assignments": assignments,
        "unassigned_zips": unassigned_zips,
        "drivers_without_packets": drivers_without_packets,
        "plan_review": plan_review,
        "summary": AssignmentPlanSummary(
            total_packets=total_packets,
            assigned_packets=assigned_packets,
            unassigned_packets=unassigned_packets,
            drivers_used=drivers_used,
            ready_drivers=len(drivers),
        ),
    }


def _build_ai_payload(zips: list[dict], drivers: list[dict]) -> tuple[dict, dict[str, str]]:
    """Anonymized payload for OpenAI: aliases only, never names/emails/IDs."""
    driver_alias_map = {f"driver_{i + 1}": d["auth_user_id"] for i, d in enumerate(drivers)}
    driver_by_id = {d["auth_user_id"]: d for d in drivers}

    ai_drivers = [
        {
            "driver_alias": alias,
            "home_zip": driver_by_id[driver_id].get("postal_code"),
            "max_capacity": _MAX_DRIVER_PACKETS,
        }
        for alias, driver_id in driver_alias_map.items()
    ]
    ai_zips = [{"zip_code": z["zip_code"], "packet_count": z["remaining_packets"]} for z in zips]

    distance_matrix = []
    for alias, driver_id in driver_alias_map.items():
        driver_zip_num = _numeric_or_none(driver_by_id[driver_id].get("postal_code"))
        for z in zips:
            zip_num = _numeric_or_none(z["zip_code"])
            distance = (
                abs(driver_zip_num - zip_num) if driver_zip_num is not None and zip_num is not None else None
            )
            distance_matrix.append({"driver_alias": alias, "zip_code": z["zip_code"], "distance": distance})

    payload = {"drivers": ai_drivers, "zips": ai_zips, "distance_matrix": distance_matrix}
    return payload, driver_alias_map


def _try_ai_plan(zips: list[dict], drivers: list[dict]) -> tuple[list[dict], str, dict] | None:
    """Returns (raw_items, model_name, raw_response) if the AI produced a plan
    that survives full validation, otherwise None (caller must fall back)."""
    payload, driver_alias_map = _build_ai_payload(zips, drivers)

    ai_result = request_ai_assignment_plan(payload)
    if ai_result is None:
        return None
    parsed, model_name = ai_result

    driver_by_id = {d["auth_user_id"]: d for d in drivers}
    zip_codes = {z["zip_code"] for z in zips}

    raw_items = []
    for entry in parsed.get("assignments", []):
        if not isinstance(entry, dict):
            return None
        driver_id = driver_alias_map.get(entry.get("driver_alias"))
        zip_code = entry.get("zip_code")
        packets = entry.get("packets")
        if driver_id is None or zip_code not in zip_codes:
            return None
        if not isinstance(packets, int) or isinstance(packets, bool) or packets <= 0:
            return None
        match_type, reason = _label_match(driver_by_id[driver_id], zip_code)
        raw_items.append(
            {
                "driver_auth_user_id": driver_id,
                "zip_code": zip_code,
                "packets": packets,
                "match_type": match_type,
                "reason": reason,
            }
        )

    try:
        _finalize_plan(raw_items, zips, drivers)
    except ValueError:
        return None

    return raw_items, model_name, parsed


def generate_assignment_plan(authorization: str) -> AssignmentPlanGenerateResponse:
    warehouse_auth_user_id = _require_warehouse(authorization)
    today = date.today().isoformat()

    zips = get_today_validated_zips_with_remaining(warehouse_auth_user_id)
    drivers = get_ready_drivers(warehouse_auth_user_id)

    ai_model: str | None = None
    ai_raw_response: dict | None = None

    ai_outcome = _try_ai_plan(zips, drivers) if zips and drivers else None
    if ai_outcome is not None:
        raw_items, ai_model, ai_raw_response = ai_outcome
    else:
        raw_items = _generate_deterministic_raw_items(zips, drivers)

    try:
        finalized = _finalize_plan(raw_items, zips, drivers)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Assignment generation failed internal validation.",
        ) from exc

    existing = (
        supabase_admin.table("warehouse_assignment_plans")
        .select("id, status")
        .eq("warehouse_auth_user_id", warehouse_auth_user_id)
        .eq("plan_date", today)
        .execute()
    )
    existing_plan = existing.data[0] if existing.data else None

    if existing_plan is not None and existing_plan["status"] != "draft":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Today's assignment plan has already been confirmed and cannot be regenerated.",
        )

    now = datetime.now(timezone.utc).isoformat()
    summary = finalized["summary"]
    plan_payload = {
        "warehouse_auth_user_id": warehouse_auth_user_id,
        "plan_date": today,
        "status": "draft",
        "created_by_ai": ai_model is not None,
        "total_validated_zips": len(zips),
        "total_packets": summary.total_packets,
        "assigned_packets": summary.assigned_packets,
        "unassigned_packets": summary.unassigned_packets,
        "ready_drivers": summary.ready_drivers,
        "drivers_used": summary.drivers_used,
        "unassigned_zips": [u.model_dump() for u in finalized["unassigned_zips"]],
        "drivers_without_packets": [d.model_dump() for d in finalized["drivers_without_packets"]],
        "plan_review": finalized["plan_review"],
        "ai_model": ai_model,
        "ai_raw_response": ai_raw_response,
        "updated_at": now,
    }

    if existing_plan is not None:
        plan_id = existing_plan["id"]
        supabase_admin.table("warehouse_assignment_plans").update(plan_payload).eq("id", plan_id).execute()
    else:
        insert_result = supabase_admin.table("warehouse_assignment_plans").insert(plan_payload).execute()
        plan_id = insert_result.data[0]["id"]

    supabase_admin.table("warehouse_assignment_plan_items").delete().eq("plan_id", plan_id).execute()

    if finalized["assignments"]:
        items_payload = [
            {
                "plan_id": plan_id,
                "driver_auth_user_id": a.driver_auth_user_id,
                "driver_name": a.driver_name,
                "driver_external_id": next(
                    (d.get("external_driver_id") for d in drivers if d["auth_user_id"] == a.driver_auth_user_id),
                    None,
                ),
                "driver_home_zip": a.driver_home_zip,
                "zip_code": a.zip_code,
                "packets": a.packets,
                "match_type": a.match_type,
                "reason": a.reason,
                "is_manual": False,
                "updated_at": now,
            }
            for a in finalized["assignments"]
        ]
        supabase_admin.table("warehouse_assignment_plan_items").insert(items_payload).execute()

    return AssignmentPlanGenerateResponse(
        status="draft",
        plan_id=plan_id,
        assignments=finalized["assignments"],
        unassigned_zips=finalized["unassigned_zips"],
        drivers_without_packets=finalized["drivers_without_packets"],
        plan_review=finalized["plan_review"],
        summary=summary,
    )
