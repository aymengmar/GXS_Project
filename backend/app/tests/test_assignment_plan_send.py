"""POST /api/v1/warehouse/assignment-plan/send

Exercises finalizing today's draft assignment plan: validation rules, the
resulting warehouse_daily_zip_codes / warehouse_zip_inventory updates, and
that plan items are preserved rather than deleted.
"""

from datetime import date

from app.tests.conftest import WAREHOUSE_TOKEN

ENDPOINT = "/api/v1/warehouse/assignment-plan/send"
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
    ]
    fake_supabase.tables["warehouse_daily_zip_codes"] = [
        _zip_row("20095", 100, 0, warehouse_auth),
    ]
    fake_supabase.tables["warehouse_assignment_plans"] = [_plan_row("plan-1", warehouse_auth)]
    fake_supabase.tables["warehouse_assignment_plan_items"] = [
        _item_row("item-1", "plan-1", "driver-1", "Anna Adler", "20095", "20095", 40),
    ]


def test_send_success_updates_zip_and_inventory_and_keeps_items(client, fake_supabase, warehouse_auth):
    _seed_basic_plan(fake_supabase, warehouse_auth)

    response = client.post(ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "sent"
    assert body["plan_id"] == "plan-1"
    assert body["sent_at"]
    assert len(body["assignments"]) == 1
    assert body["assignments"][0]["packets"] == 40
    assert body["summary"]["assigned_packets"] == 40

    plan = fake_supabase.tables["warehouse_assignment_plans"][0]
    assert plan["status"] == "sent"
    assert plan["sent_at"]

    zip_row = fake_supabase.tables["warehouse_daily_zip_codes"][0]
    assert zip_row["assigned_packets"] == 40

    inventory_row = fake_supabase.tables["warehouse_zip_inventory"][0]
    assert inventory_row["available_packets"] == 60
    assert inventory_row["last_updated_date"] == TODAY

    # Items must be preserved as the sent assignment record.
    assert len(fake_supabase.tables["warehouse_assignment_plan_items"]) == 1


def test_send_folds_onto_prior_assigned_packets(client, fake_supabase, warehouse_auth):
    fake_supabase.tables["driver_profiles"] = [_driver_profile("driver-1", "Anna Adler", "20095")]
    fake_supabase.tables["warehouse_daily_zip_codes"] = [_zip_row("20095", 100, 30, warehouse_auth)]
    fake_supabase.tables["warehouse_assignment_plans"] = [_plan_row("plan-1", warehouse_auth)]
    fake_supabase.tables["warehouse_assignment_plan_items"] = [
        _item_row("item-1", "plan-1", "driver-1", "Anna Adler", "20095", "20095", 40),
    ]

    response = client.post(ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 200
    zip_row = fake_supabase.tables["warehouse_daily_zip_codes"][0]
    assert zip_row["assigned_packets"] == 70
    inventory_row = fake_supabase.tables["warehouse_zip_inventory"][0]
    assert inventory_row["available_packets"] == 30


def test_send_no_plan_returns_400(client, fake_supabase, warehouse_auth):
    response = client.post(ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 400
    assert response.json()["detail"] == "No draft assignment plan found for today."


def test_send_no_items_returns_400(client, fake_supabase, warehouse_auth):
    fake_supabase.tables["warehouse_assignment_plans"] = [_plan_row("plan-1", warehouse_auth)]

    response = client.post(ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 400
    assert response.json()["detail"] == "Assignment plan has no driver assignments."


def test_send_already_sent_returns_409(client, fake_supabase, warehouse_auth):
    _seed_basic_plan(fake_supabase, warehouse_auth)
    fake_supabase.tables["warehouse_assignment_plans"][0]["status"] = "sent"

    response = client.post(ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 409
    assert response.json()["detail"] == "Assignment plan has already been sent."


def test_send_rejects_driver_over_100(client, fake_supabase, warehouse_auth):
    fake_supabase.tables["driver_profiles"] = [_driver_profile("driver-1", "Anna Adler", "20095")]
    fake_supabase.tables["warehouse_daily_zip_codes"] = [_zip_row("20095", 200, 0, warehouse_auth)]
    fake_supabase.tables["warehouse_assignment_plans"] = [_plan_row("plan-1", warehouse_auth)]
    fake_supabase.tables["warehouse_assignment_plan_items"] = [
        _item_row("item-1", "plan-1", "driver-1", "Anna Adler", "20095", "20095", 60),
        _item_row("item-2", "plan-1", "driver-1", "Anna Adler", "20095", "20095", 60),
    ]

    response = client.post(ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 400
    # Nothing should be committed on a rejected send.
    assert fake_supabase.tables["warehouse_daily_zip_codes"][0]["assigned_packets"] == 0
    assert fake_supabase.tables["warehouse_assignment_plans"][0]["status"] == "draft"


def test_send_rejects_zip_over_remaining(client, fake_supabase, warehouse_auth):
    fake_supabase.tables["driver_profiles"] = [
        _driver_profile("driver-1", "Anna Adler", "20095"),
        _driver_profile("driver-2", "Ben Bauer", "20095"),
    ]
    fake_supabase.tables["warehouse_daily_zip_codes"] = [_zip_row("20095", 50, 0, warehouse_auth)]
    fake_supabase.tables["warehouse_assignment_plans"] = [_plan_row("plan-1", warehouse_auth)]
    fake_supabase.tables["warehouse_assignment_plan_items"] = [
        _item_row("item-1", "plan-1", "driver-1", "Anna Adler", "20095", "20095", 40),
        _item_row("item-2", "plan-1", "driver-2", "Ben Bauer", "20095", "20095", 40),
    ]

    response = client.post(ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 400
    assert fake_supabase.tables["warehouse_daily_zip_codes"][0]["assigned_packets"] == 0


def test_send_rejects_unavailable_driver(client, fake_supabase, warehouse_auth):
    _seed_basic_plan(fake_supabase, warehouse_auth)
    fake_supabase.tables["warehouse_driver_availability"] = [
        {
            "driver_auth_user_id": "driver-1",
            "warehouse_auth_user_id": warehouse_auth,
            "availability_date": TODAY,
            "status": "not_ready",
        }
    ]

    response = client.post(ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 400
    assert fake_supabase.tables["warehouse_daily_zip_codes"][0]["assigned_packets"] == 0


def test_send_rejects_zip_not_validated(client, fake_supabase, warehouse_auth):
    fake_supabase.tables["driver_profiles"] = [_driver_profile("driver-1", "Anna Adler", "20095")]
    zip_row = _zip_row("20095", 100, 0, warehouse_auth)
    zip_row["status"] = "in_progress"
    fake_supabase.tables["warehouse_daily_zip_codes"] = [zip_row]
    fake_supabase.tables["warehouse_assignment_plans"] = [_plan_row("plan-1", warehouse_auth)]
    fake_supabase.tables["warehouse_assignment_plan_items"] = [
        _item_row("item-1", "plan-1", "driver-1", "Anna Adler", "20095", "20095", 40),
    ]

    response = client.post(ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 400
