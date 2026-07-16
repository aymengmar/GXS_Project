"""POST /api/v1/warehouse/assignment-plan/generate

Exercises the deterministic fallback planner (OPENAI_API_KEY forced missing
via the fake_supabase fixture) against an in-memory fake Supabase client.
"""

from datetime import date

from app.tests.conftest import WAREHOUSE_TOKEN

ENDPOINT = "/api/v1/warehouse/assignment-plan/generate"
TODAY = date.today().isoformat()
AUTH_HEADERS = {"Authorization": f"Bearer {WAREHOUSE_TOKEN}"}


def _driver(auth_user_id: str, full_name: str, postal_code: str) -> dict:
    return {
        "auth_user_id": auth_user_id,
        "full_name": full_name,
        "external_driver_id": f"EXT-{auth_user_id}",
        "postal_code": postal_code,
        "car_type": "own_car",
        "status": "approved",
    }


def _zip_row(zip_code: str, packet_count: int, warehouse_auth_user_id: str) -> dict:
    return {
        "id": f"zip-{zip_code}",
        "warehouse_auth_user_id": warehouse_auth_user_id,
        "zip_code": zip_code,
        "zip_date": TODAY,
        "status": "validated",
        "manual_packet_count": packet_count,
        "carried_over_packets": 0,
        "assigned_packets": 0,
    }


def _totals_by_driver(assignments: list[dict]) -> dict:
    totals: dict[str, int] = {}
    for item in assignments:
        totals[item["driver_auth_user_id"]] = totals.get(item["driver_auth_user_id"], 0) + item["packets"]
    return totals


def test_returns_draft_status_with_same_zip_assignment(client, fake_supabase, warehouse_auth):
    fake_supabase.tables["driver_profiles"] = [_driver("driver-1", "Anna Adler", "20095")]
    fake_supabase.tables["warehouse_daily_zip_codes"] = [_zip_row("20095", 40, warehouse_auth)]

    response = client.post(ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "draft"
    assert len(body["assignments"]) == 1
    assignment = body["assignments"][0]
    assert assignment["driver_auth_user_id"] == "driver-1"
    assert assignment["zip_code"] == "20095"
    assert assignment["packets"] == 40
    assert assignment["match_type"] == "same_zip"
    assert body["unassigned_zips"] == []
    assert body["drivers_without_packets"] == []


def test_nearest_zip_used_when_no_same_zip_driver_and_capacity_never_exceeded(
    client, fake_supabase, warehouse_auth
):
    fake_supabase.tables["driver_profiles"] = [
        _driver("driver-1", "Anna Adler", "20095"),  # distance 5 to zip 20100
        _driver("driver-2", "Ben Bauer", "20200"),  # distance 100 to zip 20100
    ]
    # No driver lives in 20100, and total demand (150) exceeds one driver's cap.
    fake_supabase.tables["warehouse_daily_zip_codes"] = [_zip_row("20100", 150, warehouse_auth)]

    response = client.post(ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 200
    body = response.json()
    assert all(a["match_type"] == "nearest_zip" for a in body["assignments"])

    totals = _totals_by_driver(body["assignments"])
    assert all(total <= 100 for total in totals.values())
    assert totals["driver-1"] == 100  # nearer driver fills up first
    assert totals["driver-2"] == 50
    assert body["unassigned_zips"] == []


def test_unassigned_zips_when_packets_exceed_total_driver_capacity(client, fake_supabase, warehouse_auth):
    fake_supabase.tables["driver_profiles"] = [_driver("driver-1", "Anna Adler", "20095")]
    fake_supabase.tables["warehouse_daily_zip_codes"] = [_zip_row("20095", 150, warehouse_auth)]

    response = client.post(ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 200
    body = response.json()
    assert body["unassigned_zips"] == [
        {
            "zip_code": "20095",
            "packets": 50,
            "reason": "Remaining packets exceed available driver capacity.",
        }
    ]
    totals = _totals_by_driver(body["assignments"])
    assert totals["driver-1"] == 100


def test_drivers_without_packets_when_a_ready_driver_gets_zero(client, fake_supabase, warehouse_auth):
    fake_supabase.tables["driver_profiles"] = [
        _driver("driver-1", "Anna Adler", "20095"),
        _driver("driver-2", "Ben Bauer", "20095"),
    ]
    # Only 10 packets: driver-1 (first alphabetically) absorbs all of it via
    # the same-zip pass, leaving driver-2 with nothing.
    fake_supabase.tables["warehouse_daily_zip_codes"] = [_zip_row("20095", 10, warehouse_auth)]

    response = client.post(ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 200
    body = response.json()
    without_packets_ids = {d["driver_auth_user_id"] for d in body["drivers_without_packets"]}
    assert without_packets_ids == {"driver-2"}


def test_draft_plan_and_items_saved_without_touching_zip_or_inventory_tables(
    client, fake_supabase, warehouse_auth
):
    fake_supabase.tables["driver_profiles"] = [_driver("driver-1", "Anna Adler", "20095")]
    fake_supabase.tables["warehouse_daily_zip_codes"] = [_zip_row("20095", 40, warehouse_auth)]
    fake_supabase.tables["warehouse_zip_inventory"] = []

    response = client.post(ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 200
    body = response.json()

    plans = fake_supabase.tables["warehouse_assignment_plans"]
    assert len(plans) == 1
    assert plans[0]["status"] == "draft"
    assert plans[0]["plan_date"] == TODAY
    assert plans[0]["id"] == body["plan_id"]

    items = fake_supabase.tables["warehouse_assignment_plan_items"]
    assert len(items) == 1
    assert items[0]["plan_id"] == body["plan_id"]
    assert items[0]["driver_auth_user_id"] == "driver-1"
    assert items[0]["zip_code"] == "20095"
    assert items[0]["packets"] == 40

    # Frontend needs the item id to drive the manage-popup edit/change/remove actions.
    assert body["assignments"][0]["item_id"] == items[0]["id"]

    # Generation only produces a draft/preview — it must not mutate the
    # source ZIP counts or inventory tables; that happens on explicit confirm.
    assert fake_supabase.tables["warehouse_daily_zip_codes"][0]["assigned_packets"] == 0
    assert fake_supabase.tables["warehouse_zip_inventory"] == []
