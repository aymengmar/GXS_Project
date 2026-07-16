"""PATCH/DELETE /api/v1/warehouse/assignment-plan/items/{item_id}/...

Exercises the manual "manage draft plan item" endpoints (edit packet count,
change driver, remove) against an in-memory fake Supabase client. These
endpoints must only ever touch warehouse_assignment_plans /
warehouse_assignment_plan_items and must never mutate
warehouse_daily_zip_codes.assigned_packets or warehouse_zip_inventory.
"""

from datetime import date

from app.tests.conftest import WAREHOUSE_TOKEN

TODAY = date.today().isoformat()
AUTH_HEADERS = {"Authorization": f"Bearer {WAREHOUSE_TOKEN}"}


def _driver_profile(auth_user_id: str, full_name: str, postal_code: str) -> dict:
    return {
        "auth_user_id": auth_user_id,
        "full_name": full_name,
        "external_driver_id": f"EXT-{auth_user_id}",
        "postal_code": postal_code,
        "car_type": "own_car",
        "status": "approved",
    }


def _zip_row(zip_code: str, packet_count: int, assigned_packets: int, warehouse_auth_user_id: str) -> dict:
    return {
        "id": f"zip-{zip_code}",
        "warehouse_auth_user_id": warehouse_auth_user_id,
        "zip_code": zip_code,
        "zip_date": TODAY,
        "status": "validated",
        "manual_packet_count": packet_count,
        "carried_over_packets": 0,
        "assigned_packets": assigned_packets,
    }


def _plan_row(plan_id: str, warehouse_auth_user_id: str, plan_status: str = "draft") -> dict:
    return {
        "id": plan_id,
        "warehouse_auth_user_id": warehouse_auth_user_id,
        "plan_date": TODAY,
        "status": plan_status,
    }


def _item_row(
    item_id: str,
    plan_id: str,
    driver_auth_user_id: str,
    driver_name: str,
    driver_home_zip: str,
    zip_code: str,
    packets: int,
    match_type: str = "same_zip",
    is_manual: bool = False,
) -> dict:
    return {
        "id": item_id,
        "plan_id": plan_id,
        "driver_auth_user_id": driver_auth_user_id,
        "driver_name": driver_name,
        "driver_external_id": f"EXT-{driver_auth_user_id}",
        "driver_home_zip": driver_home_zip,
        "zip_code": zip_code,
        "packets": packets,
        "match_type": match_type,
        "reason": "Same ZIP as driver home ZIP.",
        "is_manual": is_manual,
        "updated_at": "2026-01-01T00:00:00+00:00",
    }


def _seed_basic_plan(fake_supabase, warehouse_auth: str) -> None:
    fake_supabase.tables["driver_profiles"] = [
        _driver_profile("driver-1", "Anna Adler", "20095"),
        _driver_profile("driver-2", "Ben Bauer", "20200"),
    ]
    fake_supabase.tables["warehouse_daily_zip_codes"] = [
        _zip_row("20095", 100, 0, warehouse_auth),
    ]
    fake_supabase.tables["warehouse_assignment_plans"] = [_plan_row("plan-1", warehouse_auth)]
    fake_supabase.tables["warehouse_assignment_plan_items"] = [
        _item_row("item-1", "plan-1", "driver-1", "Anna Adler", "20095", "20095", 40),
    ]


# --- packet-count ---------------------------------------------------------


def test_update_packet_count_success(client, fake_supabase, warehouse_auth):
    _seed_basic_plan(fake_supabase, warehouse_auth)

    response = client.patch(
        "/api/v1/warehouse/assignment-plan/items/item-1/packet-count",
        json={"packets": 90},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 200
    body = response.json()
    assignment = next(a for a in body["assignments"] if a["item_id"] == "item-1")
    assert assignment["packets"] == 90
    assert body["summary"]["assigned_packets"] == 90

    stored_item = fake_supabase.tables["warehouse_assignment_plan_items"][0]
    assert stored_item["packets"] == 90
    assert stored_item["is_manual"] is True

    # Must never touch the real ZIP/inventory tables.
    assert fake_supabase.tables["warehouse_daily_zip_codes"][0]["assigned_packets"] == 0
    assert fake_supabase.tables.get("warehouse_zip_inventory", []) == []


def test_update_packet_count_rejects_non_positive(client, fake_supabase, warehouse_auth):
    _seed_basic_plan(fake_supabase, warehouse_auth)

    response = client.patch(
        "/api/v1/warehouse/assignment-plan/items/item-1/packet-count",
        json={"packets": 0},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 400


def test_update_packet_count_rejects_driver_over_100(client, fake_supabase, warehouse_auth):
    _seed_basic_plan(fake_supabase, warehouse_auth)

    response = client.patch(
        "/api/v1/warehouse/assignment-plan/items/item-1/packet-count",
        json={"packets": 101},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 400
    assert fake_supabase.tables["warehouse_assignment_plan_items"][0]["packets"] == 40


def test_update_packet_count_rejects_zip_over_remaining(client, fake_supabase, warehouse_auth):
    fake_supabase.tables["driver_profiles"] = [_driver_profile("driver-1", "Anna Adler", "20095")]
    fake_supabase.tables["warehouse_daily_zip_codes"] = [_zip_row("20095", 50, 0, warehouse_auth)]
    fake_supabase.tables["warehouse_assignment_plans"] = [_plan_row("plan-1", warehouse_auth)]
    fake_supabase.tables["warehouse_assignment_plan_items"] = [
        _item_row("item-1", "plan-1", "driver-1", "Anna Adler", "20095", "20095", 40),
    ]

    response = client.patch(
        "/api/v1/warehouse/assignment-plan/items/item-1/packet-count",
        json={"packets": 60},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 400


def test_update_packet_count_rejects_when_plan_not_draft(client, fake_supabase, warehouse_auth):
    _seed_basic_plan(fake_supabase, warehouse_auth)
    fake_supabase.tables["warehouse_assignment_plans"][0]["status"] = "confirmed"

    response = client.patch(
        "/api/v1/warehouse/assignment-plan/items/item-1/packet-count",
        json={"packets": 50},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 409


def test_update_packet_count_item_not_found(client, fake_supabase, warehouse_auth):
    _seed_basic_plan(fake_supabase, warehouse_auth)

    response = client.patch(
        "/api/v1/warehouse/assignment-plan/items/missing-item/packet-count",
        json={"packets": 50},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 404


# --- driver -----------------------------------------------------------


def test_update_driver_success_recomputes_match_type_and_reason(client, fake_supabase, warehouse_auth):
    _seed_basic_plan(fake_supabase, warehouse_auth)

    response = client.patch(
        "/api/v1/warehouse/assignment-plan/items/item-1/driver",
        json={"driver_auth_user_id": "driver-2"},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 200
    body = response.json()
    assignment = next(a for a in body["assignments"] if a["item_id"] == "item-1")
    assert assignment["driver_auth_user_id"] == "driver-2"
    assert assignment["driver_name"] == "Ben Bauer"
    assert assignment["driver_home_zip"] == "20200"
    assert assignment["match_type"] == "nearest_zip"
    assert assignment["reason"] == "Manually changed driver."

    stored_item = fake_supabase.tables["warehouse_assignment_plan_items"][0]
    assert stored_item["is_manual"] is True
    assert stored_item["driver_external_id"] == "EXT-driver-2"


def test_update_driver_rejects_not_ready_driver(client, fake_supabase, warehouse_auth):
    _seed_basic_plan(fake_supabase, warehouse_auth)
    fake_supabase.tables["warehouse_driver_availability"] = [
        {
            "driver_auth_user_id": "driver-2",
            "warehouse_auth_user_id": warehouse_auth,
            "availability_date": TODAY,
            "status": "not_ready",
        }
    ]

    response = client.patch(
        "/api/v1/warehouse/assignment-plan/items/item-1/driver",
        json={"driver_auth_user_id": "driver-2"},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 400
    assert fake_supabase.tables["warehouse_assignment_plan_items"][0]["driver_auth_user_id"] == "driver-1"


def test_update_driver_rejects_when_new_driver_would_exceed_100(client, fake_supabase, warehouse_auth):
    fake_supabase.tables["driver_profiles"] = [
        _driver_profile("driver-1", "Anna Adler", "20095"),
        _driver_profile("driver-2", "Ben Bauer", "20200"),
    ]
    fake_supabase.tables["warehouse_daily_zip_codes"] = [_zip_row("20095", 100, 0, warehouse_auth)]
    fake_supabase.tables["warehouse_assignment_plans"] = [_plan_row("plan-1", warehouse_auth)]
    fake_supabase.tables["warehouse_assignment_plan_items"] = [
        _item_row("item-1", "plan-1", "driver-1", "Anna Adler", "20095", "20095", 40),
        _item_row("item-2", "plan-1", "driver-2", "Ben Bauer", "20200", "20095", 70, match_type="nearest_zip"),
    ]

    # Moving item-1 (40 packets) onto driver-2 would put driver-2 at 110.
    response = client.patch(
        "/api/v1/warehouse/assignment-plan/items/item-1/driver",
        json={"driver_auth_user_id": "driver-2"},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 400


# --- delete -------------------------------------------------------------


def test_delete_item_success(client, fake_supabase, warehouse_auth):
    _seed_basic_plan(fake_supabase, warehouse_auth)

    response = client.delete(
        "/api/v1/warehouse/assignment-plan/items/item-1",
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["assignments"] == []
    assert body["summary"]["assigned_packets"] == 0
    assert fake_supabase.tables["warehouse_assignment_plan_items"] == []
    # The ZIP becomes unassigned again in the draft's own accounting only.
    assert any(u["zip_code"] == "20095" for u in body["unassigned_zips"])
    assert fake_supabase.tables["warehouse_daily_zip_codes"][0]["assigned_packets"] == 0


def test_delete_item_rejects_when_plan_not_draft(client, fake_supabase, warehouse_auth):
    _seed_basic_plan(fake_supabase, warehouse_auth)
    fake_supabase.tables["warehouse_assignment_plans"][0]["status"] = "confirmed"

    response = client.delete(
        "/api/v1/warehouse/assignment-plan/items/item-1",
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 409
    assert len(fake_supabase.tables["warehouse_assignment_plan_items"]) == 1


def test_delete_item_not_found_for_other_warehouse(client, fake_supabase, warehouse_auth):
    _seed_basic_plan(fake_supabase, warehouse_auth)
    fake_supabase.tables["warehouse_assignment_plans"][0]["warehouse_auth_user_id"] = "other-warehouse"

    response = client.delete(
        "/api/v1/warehouse/assignment-plan/items/item-1",
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 404
