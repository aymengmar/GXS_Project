from collections import defaultdict
from datetime import date, datetime, timezone

from fastapi import HTTPException, status

from app.db.supabase import supabase_admin
from app.schemas.assignment import (
    AssignmentItem,
    AssignmentPlanGenerateResponse,
    AssignmentPlanSendResponse,
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
        insert_result = (
            supabase_admin.table("warehouse_assignment_plan_items").insert(items_payload).execute()
        )
        for assignment, inserted_row in zip(finalized["assignments"], insert_result.data):
            assignment.item_id = inserted_row["id"]

    return AssignmentPlanGenerateResponse(
        status="draft",
        plan_id=plan_id,
        assignments=finalized["assignments"],
        unassigned_zips=finalized["unassigned_zips"],
        drivers_without_packets=finalized["drivers_without_packets"],
        plan_review=finalized["plan_review"],
        summary=summary,
    )


_ITEM_COLUMNS = (
    "id, plan_id, driver_auth_user_id, driver_name, driver_external_id, "
    "driver_home_zip, zip_code, packets, match_type, reason, is_manual, updated_at"
)

_MANUAL_DRIVER_CHANGE_REASON = "Manually changed driver."
_MANUAL_ADD_REASON = "Manually added by warehouse."


def _load_plan_items(plan_id: str) -> list[dict]:
    result = (
        supabase_admin.table("warehouse_assignment_plan_items")
        .select(_ITEM_COLUMNS)
        .eq("plan_id", plan_id)
        .execute()
    )
    return result.data or []


def _get_draft_plan_item(warehouse_auth_user_id: str, item_id: str) -> tuple[dict, dict]:
    """Loads the plan item and its parent plan, enforcing that the item
    belongs to a draft plan owned by the current warehouse for today."""
    today = date.today().isoformat()

    item_result = (
        supabase_admin.table("warehouse_assignment_plan_items")
        .select(_ITEM_COLUMNS)
        .eq("id", item_id)
        .execute()
    )
    if not item_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment item not found.")
    item = item_result.data[0]

    plan_result = (
        supabase_admin.table("warehouse_assignment_plans")
        .select("id, warehouse_auth_user_id, plan_date, status")
        .eq("id", item["plan_id"])
        .execute()
    )
    if not plan_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment item not found.")
    plan = plan_result.data[0]

    if plan["warehouse_auth_user_id"] != warehouse_auth_user_id or plan["plan_date"] != today:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment item not found.")

    if plan["status"] != "draft":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Assignment plan is no longer a draft.",
        )

    return plan, item


def _build_plan_state(zips: list[dict], drivers: list[dict], items: list[dict]) -> dict:
    """Computes assignments/unassigned_zips/drivers_without_packets/plan_review/
    summary from already-persisted plan items against a given ZIP remaining
    snapshot. Shared by the draft recompute flow and the send flow."""
    per_driver_total: dict[str, int] = defaultdict(int)
    per_zip_total: dict[str, int] = defaultdict(int)
    assignments = [
        AssignmentItem(
            item_id=item["id"],
            driver_auth_user_id=item["driver_auth_user_id"],
            driver_name=item["driver_name"],
            driver_home_zip=item.get("driver_home_zip"),
            zip_code=item["zip_code"],
            packets=item["packets"],
            match_type=item["match_type"],
            reason=item["reason"],
        )
        for item in items
    ]
    for item in items:
        per_driver_total[item["driver_auth_user_id"]] += item["packets"]
        per_zip_total[item["zip_code"]] += item["packets"]

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
    assigned_packets = sum(item["packets"] for item in items)
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


def _recompute_and_respond(warehouse_auth_user_id: str, plan_id: str) -> AssignmentPlanGenerateResponse:
    """Reloads today's validated ZIPs, ready drivers, and the current draft
    items, then recalculates and persists the plan's aggregate fields."""
    zips = get_today_validated_zips_with_remaining(warehouse_auth_user_id)
    drivers = get_ready_drivers(warehouse_auth_user_id)
    items = _load_plan_items(plan_id)

    state = _build_plan_state(zips, drivers, items)
    summary = state["summary"]

    now = datetime.now(timezone.utc).isoformat()
    supabase_admin.table("warehouse_assignment_plans").update(
        {
            "total_validated_zips": len(zips),
            "total_packets": summary.total_packets,
            "assigned_packets": summary.assigned_packets,
            "unassigned_packets": summary.unassigned_packets,
            "ready_drivers": summary.ready_drivers,
            "drivers_used": summary.drivers_used,
            "unassigned_zips": [u.model_dump() for u in state["unassigned_zips"]],
            "drivers_without_packets": [d.model_dump() for d in state["drivers_without_packets"]],
            "plan_review": state["plan_review"],
            "updated_at": now,
        }
    ).eq("id", plan_id).execute()

    return AssignmentPlanGenerateResponse(
        status="draft",
        plan_id=plan_id,
        assignments=state["assignments"],
        unassigned_zips=state["unassigned_zips"],
        drivers_without_packets=state["drivers_without_packets"],
        plan_review=state["plan_review"],
        summary=summary,
    )


def update_plan_item_packet_count(
    authorization: str, item_id: str, packets: int
) -> AssignmentPlanGenerateResponse:
    warehouse_auth_user_id = _require_warehouse(authorization)

    if not isinstance(packets, int) or isinstance(packets, bool) or packets <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Packets must be a positive integer.",
        )

    plan, item = _get_draft_plan_item(warehouse_auth_user_id, item_id)
    other_items = [i for i in _load_plan_items(plan["id"]) if i["id"] != item_id]

    driver_total = packets + sum(
        i["packets"] for i in other_items if i["driver_auth_user_id"] == item["driver_auth_user_id"]
    )
    if driver_total > _MAX_DRIVER_PACKETS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Driver would exceed the {_MAX_DRIVER_PACKETS} packet limit.",
        )

    zips = get_today_validated_zips_with_remaining(warehouse_auth_user_id)
    remaining_by_zip = {z["zip_code"]: z["remaining_packets"] for z in zips}
    zip_total = packets + sum(i["packets"] for i in other_items if i["zip_code"] == item["zip_code"])
    if zip_total > remaining_by_zip.get(item["zip_code"], 0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"ZIP {item['zip_code']} does not have enough remaining packets.",
        )

    now = datetime.now(timezone.utc).isoformat()
    supabase_admin.table("warehouse_assignment_plan_items").update(
        {"packets": packets, "is_manual": True, "updated_at": now}
    ).eq("id", item_id).execute()

    return _recompute_and_respond(warehouse_auth_user_id, plan["id"])


def update_plan_item_driver(
    authorization: str, item_id: str, driver_auth_user_id: str
) -> AssignmentPlanGenerateResponse:
    warehouse_auth_user_id = _require_warehouse(authorization)

    ready_drivers = get_ready_drivers(warehouse_auth_user_id)
    driver_by_id = {d["auth_user_id"]: d for d in ready_drivers}
    new_driver = driver_by_id.get(driver_auth_user_id)
    if new_driver is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver is not ready or available today.",
        )

    plan, item = _get_draft_plan_item(warehouse_auth_user_id, item_id)
    other_items = [i for i in _load_plan_items(plan["id"]) if i["id"] != item_id]

    driver_total = item["packets"] + sum(
        i["packets"] for i in other_items if i["driver_auth_user_id"] == driver_auth_user_id
    )
    if driver_total > _MAX_DRIVER_PACKETS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Driver would exceed the {_MAX_DRIVER_PACKETS} packet limit.",
        )

    match_type, _ = _label_match(new_driver, item["zip_code"])

    now = datetime.now(timezone.utc).isoformat()
    supabase_admin.table("warehouse_assignment_plan_items").update(
        {
            "driver_auth_user_id": new_driver["auth_user_id"],
            "driver_name": new_driver["full_name"],
            "driver_external_id": new_driver.get("external_driver_id"),
            "driver_home_zip": new_driver.get("postal_code"),
            "match_type": match_type,
            "reason": _MANUAL_DRIVER_CHANGE_REASON,
            "is_manual": True,
            "updated_at": now,
        }
    ).eq("id", item_id).execute()

    return _recompute_and_respond(warehouse_auth_user_id, plan["id"])


def delete_plan_item(authorization: str, item_id: str) -> AssignmentPlanGenerateResponse:
    warehouse_auth_user_id = _require_warehouse(authorization)

    plan, item = _get_draft_plan_item(warehouse_auth_user_id, item_id)

    supabase_admin.table("warehouse_assignment_plan_items").delete().eq("id", item_id).execute()

    return _recompute_and_respond(warehouse_auth_user_id, plan["id"])


def add_manual_plan_item(
    authorization: str, driver_auth_user_id: str, zip_code: str, packets: int
) -> AssignmentPlanGenerateResponse:
    warehouse_auth_user_id = _require_warehouse(authorization)
    today = date.today().isoformat()

    if not isinstance(packets, int) or isinstance(packets, bool) or packets <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Packets must be a positive integer.",
        )

    plan_result = (
        supabase_admin.table("warehouse_assignment_plans")
        .select("id, status")
        .eq("warehouse_auth_user_id", warehouse_auth_user_id)
        .eq("plan_date", today)
        .execute()
    )
    if not plan_result.data or plan_result.data[0]["status"] != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No draft assignment plan found for today.",
        )
    plan_id = plan_result.data[0]["id"]

    driver_result = (
        supabase_admin.table("driver_profiles")
        .select("auth_user_id, full_name, external_driver_id, postal_code, car_type")
        .eq("auth_user_id", driver_auth_user_id)
        .execute()
    )
    if not driver_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found.")
    driver = driver_result.data[0]

    ready_drivers = get_ready_drivers(warehouse_auth_user_id)
    if not any(d["auth_user_id"] == driver_auth_user_id for d in ready_drivers):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver is not ready or available today.",
        )

    zip_result = (
        supabase_admin.table("warehouse_daily_zip_codes")
        .select("zip_code, status, manual_packet_count, carried_over_packets, assigned_packets")
        .eq("warehouse_auth_user_id", warehouse_auth_user_id)
        .eq("zip_date", today)
        .eq("zip_code", zip_code)
        .execute()
    )
    if not zip_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ZIP code not found for today.")
    zip_row = zip_result.data[0]

    if zip_row["status"] != "validated":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ZIP code has not been validated today.",
        )

    packet_count = zip_row.get("manual_packet_count")
    if packet_count is None:
        packet_count = zip_row.get("carried_over_packets") or 0
    remaining_packets = max(packet_count - (zip_row.get("assigned_packets") or 0), 0)

    existing_items = _load_plan_items(plan_id)

    driver_total = packets + sum(
        i["packets"] for i in existing_items if i["driver_auth_user_id"] == driver_auth_user_id
    )
    if driver_total > _MAX_DRIVER_PACKETS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Driver would exceed the {_MAX_DRIVER_PACKETS} packet limit.",
        )

    zip_total = packets + sum(i["packets"] for i in existing_items if i["zip_code"] == zip_code)
    if zip_total > remaining_packets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"ZIP {zip_code} does not have enough remaining packets.",
        )

    now = datetime.now(timezone.utc).isoformat()
    supabase_admin.table("warehouse_assignment_plan_items").insert(
        {
            "plan_id": plan_id,
            "driver_auth_user_id": driver["auth_user_id"],
            "driver_name": driver["full_name"],
            "driver_external_id": driver.get("external_driver_id"),
            "driver_home_zip": driver.get("postal_code"),
            "zip_code": zip_code,
            "packets": packets,
            "match_type": "manual",
            "reason": _MANUAL_ADD_REASON,
            "is_manual": True,
            "updated_at": now,
        }
    ).execute()

    return _recompute_and_respond(warehouse_auth_user_id, plan_id)


def send_assignment_plan(authorization: str) -> AssignmentPlanSendResponse:
    """Finalizes today's draft assignment plan: validates every item against
    current driver readiness / ZIP capacity, then marks the plan sent and
    folds its packets into warehouse_daily_zip_codes.assigned_packets and
    warehouse_zip_inventory.available_packets. Plan items are never deleted —
    they become the sent assignment record for Admin/Driver screens."""
    warehouse_auth_user_id = _require_warehouse(authorization)
    today = date.today().isoformat()

    plan_result = (
        supabase_admin.table("warehouse_assignment_plans")
        .select("id, status")
        .eq("warehouse_auth_user_id", warehouse_auth_user_id)
        .eq("plan_date", today)
        .execute()
    )
    if not plan_result.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No draft assignment plan found for today.",
        )
    plan = plan_result.data[0]

    if plan["status"] == "sent":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Assignment plan has already been sent.",
        )
    if plan["status"] != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No draft assignment plan found for today.",
        )
    plan_id = plan["id"]

    items = _load_plan_items(plan_id)
    if not items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment plan has no driver assignments.",
        )

    ready_drivers = get_ready_drivers(warehouse_auth_user_id)
    ready_driver_ids = {d["auth_user_id"] for d in ready_drivers}

    zips = get_today_validated_zips_with_remaining(warehouse_auth_user_id)
    remaining_by_zip = {z["zip_code"]: z["remaining_packets"] for z in zips}

    per_driver_total: dict[str, int] = defaultdict(int)
    per_zip_total: dict[str, int] = defaultdict(int)

    for item in items:
        driver_id = item["driver_auth_user_id"]
        zip_code = item["zip_code"]

        if driver_id not in ready_driver_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Driver {item['driver_name']} is not ready or available today.",
            )
        if zip_code not in remaining_by_zip:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"ZIP {zip_code} is not a validated ZIP for today.",
            )

        per_driver_total[driver_id] += item["packets"]
        per_zip_total[zip_code] += item["packets"]

    for driver_id, total in per_driver_total.items():
        if total > _MAX_DRIVER_PACKETS:
            driver_name = next(i["driver_name"] for i in items if i["driver_auth_user_id"] == driver_id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Driver {driver_name} would exceed the {_MAX_DRIVER_PACKETS} packet limit.",
            )

    for zip_code, total in per_zip_total.items():
        if total > remaining_by_zip[zip_code]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"ZIP {zip_code} exceeds the remaining packets available.",
            )

    now = datetime.now(timezone.utc).isoformat()

    zip_rows_result = (
        supabase_admin.table("warehouse_daily_zip_codes")
        .select("id, zip_code, manual_packet_count, carried_over_packets, assigned_packets")
        .eq("warehouse_auth_user_id", warehouse_auth_user_id)
        .eq("zip_date", today)
        .execute()
    )
    zip_row_by_code = {row["zip_code"]: row for row in zip_rows_result.data or []}

    for zip_code, sent_zip_packets in per_zip_total.items():
        zip_row = zip_row_by_code[zip_code]
        packet_count = zip_row.get("manual_packet_count")
        if packet_count is None:
            packet_count = zip_row.get("carried_over_packets") or 0
        new_assigned_packets = (zip_row.get("assigned_packets") or 0) + sent_zip_packets

        supabase_admin.table("warehouse_daily_zip_codes").update(
            {"assigned_packets": new_assigned_packets, "updated_at": now}
        ).eq("id", zip_row["id"]).execute()

        available_packets = max(packet_count - new_assigned_packets, 0)
        supabase_admin.table("warehouse_zip_inventory").upsert(
            {
                "warehouse_auth_user_id": warehouse_auth_user_id,
                "zip_code": zip_code,
                "available_packets": available_packets,
                "last_updated_date": today,
                "updated_at": now,
            },
            on_conflict="warehouse_auth_user_id,zip_code",
        ).execute()

    supabase_admin.table("warehouse_assignment_plans").update(
        {"status": "sent", "sent_at": now, "updated_at": now}
    ).eq("id", plan_id).execute()

    # zips/ready_drivers reflect state *before* this send's packets were
    # folded into assigned_packets, so subtracting per_zip_total here (same
    # as the draft recompute) yields the correct post-send leftover.
    state = _build_plan_state(zips, ready_drivers, items)

    return AssignmentPlanSendResponse(
        status="sent",
        plan_id=plan_id,
        assignments=state["assignments"],
        unassigned_zips=state["unassigned_zips"],
        drivers_without_packets=state["drivers_without_packets"],
        plan_review=state["plan_review"],
        summary=state["summary"],
        sent_at=now,
    )
