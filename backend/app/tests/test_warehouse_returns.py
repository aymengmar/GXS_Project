"""Warehouse Returns by Driver endpoints:

GET  /api/v1/warehouse/returns/yesterday-drivers
POST /api/v1/warehouse/returns/records
GET  /api/v1/warehouse/returns/yesterday-summary
POST /api/v1/warehouse/returns/close-day
"""

from datetime import date, timedelta

from app.tests.conftest import WAREHOUSE_TOKEN

DRIVERS_ENDPOINT = "/api/v1/warehouse/returns/yesterday-drivers"
RECORDS_ENDPOINT = "/api/v1/warehouse/returns/records"
SUMMARY_ENDPOINT = "/api/v1/warehouse/returns/yesterday-summary"
CLOSE_DAY_ENDPOINT = "/api/v1/warehouse/returns/close-day"
AUTH_HEADERS = {"Authorization": f"Bearer {WAREHOUSE_TOKEN}"}

YESTERDAY = (date.today() - timedelta(days=1)).isoformat()


def _plan_row(plan_id: str, warehouse_auth_user_id: str, plan_status: str = "sent") -> dict:
    return {
        "id": plan_id,
        "warehouse_auth_user_id": warehouse_auth_user_id,
        "plan_date": YESTERDAY,
        "status": plan_status,
        "assigned_packets": 100,
    }


def _item_row(
    item_id: str,
    plan_id: str,
    driver_auth_user_id: str,
    driver_name: str,
    zip_code: str,
    packets: int,
) -> dict:
    return {
        "id": item_id,
        "plan_id": plan_id,
        "driver_auth_user_id": driver_auth_user_id,
        "driver_name": driver_name,
        "driver_external_id": f"EXT-{driver_auth_user_id}",
        "driver_home_zip": zip_code,
        "zip_code": zip_code,
        "packets": packets,
    }


def _seed_sent_plan(fake_supabase, warehouse_auth: str) -> None:
    fake_supabase.tables["warehouse_assignment_plans"] = [_plan_row("plan-1", warehouse_auth)]
    fake_supabase.tables["warehouse_assignment_plan_items"] = [
        _item_row("item-1", "plan-1", "driver-1", "Anna Adler", "20095", 100),
        _item_row("item-2", "plan-1", "driver-2", "Ben Bauer", "20097", 50),
    ]


def _return_record(
    record_id: str,
    warehouse_auth: str,
    plan_item_id: str,
    driver_auth_user_id: str,
    zip_code: str,
    assigned_packets: int,
    returned_packets: int,
    signature_status: str = "confirmed",
) -> dict:
    return {
        "id": record_id,
        "warehouse_auth_user_id": warehouse_auth,
        "plan_id": "plan-1",
        "plan_item_id": plan_item_id,
        "driver_auth_user_id": driver_auth_user_id,
        "zip_code": zip_code,
        "assigned_packets": assigned_packets,
        "returned_packets": returned_packets,
        "signature_status": signature_status,
        "signature_data": {"paths": [[1]]},
        "signed_at": "2026-01-01T00:00:00+00:00",
    }


# --- GET /returns/yesterday-drivers ---


def test_yesterday_drivers_no_sent_plan_returns_empty(client, fake_supabase, warehouse_auth):
    response = client.get(DRIVERS_ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 200
    body = response.json()
    assert body["total_items"] == 0
    assert body["rows"] == []
    assert body["assignment_date"] == YESTERDAY


def test_yesterday_drivers_lists_items_without_returns(client, fake_supabase, warehouse_auth):
    _seed_sent_plan(fake_supabase, warehouse_auth)

    response = client.get(DRIVERS_ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 200
    body = response.json()
    assert body["total_items"] == 2
    row = next(r for r in body["rows"] if r["plan_item_id"] == "item-1")
    assert row["driver_name"] == "Anna Adler"
    assert row["driver_external_id"] == "EXT-driver-1"
    assert row["assigned_packets"] == 100
    assert row["returned_packets"] == 0
    assert row["signature_status"] == "not_started"
    assert row["has_signature"] is False
    assert row["signed_at"] is None


def test_yesterday_drivers_includes_saved_return_record(client, fake_supabase, warehouse_auth):
    _seed_sent_plan(fake_supabase, warehouse_auth)
    fake_supabase.tables["warehouse_return_records"] = [
        {
            "id": "ret-1",
            "warehouse_auth_user_id": warehouse_auth,
            "plan_id": "plan-1",
            "plan_item_id": "item-1",
            "driver_auth_user_id": "driver-1",
            "zip_code": "20095",
            "assigned_packets": 100,
            "returned_packets": 5,
            "signature_status": "confirmed",
            "signature_data": {"paths": [[1, 2]]},
            "signed_at": "2026-01-01T00:00:00+00:00",
        }
    ]

    response = client.get(DRIVERS_ENDPOINT, headers=AUTH_HEADERS)

    body = response.json()
    row = next(r for r in body["rows"] if r["plan_item_id"] == "item-1")
    assert row["returned_packets"] == 5
    assert row["signature_status"] == "confirmed"
    assert row["has_signature"] is True
    assert row["signed_at"] == "2026-01-01T00:00:00+00:00"

    other_row = next(r for r in body["rows"] if r["plan_item_id"] == "item-2")
    assert other_row["returned_packets"] == 0
    assert other_row["signature_status"] == "not_started"


# --- POST /returns/records ---


def test_save_return_record_creates_row(client, fake_supabase, warehouse_auth):
    _seed_sent_plan(fake_supabase, warehouse_auth)

    response = client.post(
        RECORDS_ENDPOINT,
        headers=AUTH_HEADERS,
        json={
            "plan_item_id": "item-1",
            "returned_packets": 5,
            "signature_data": {"paths": [[1, 2]]},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["plan_item_id"] == "item-1"
    assert body["returned_packets"] == 5
    assert body["signature_status"] == "confirmed"
    assert body["has_signature"] is True
    assert body["signed_at"]

    saved = fake_supabase.tables["warehouse_return_records"][0]
    assert saved["driver_auth_user_id"] == "driver-1"
    assert saved["zip_code"] == "20095"
    assert saved["assigned_packets"] == 100
    assert saved["signature_data"] == {"paths": [[1, 2]]}


def test_save_return_record_updates_existing_row(client, fake_supabase, warehouse_auth):
    _seed_sent_plan(fake_supabase, warehouse_auth)
    fake_supabase.tables["warehouse_return_records"] = [
        {
            "id": "ret-1",
            "warehouse_auth_user_id": warehouse_auth,
            "plan_id": "plan-1",
            "plan_item_id": "item-1",
            "driver_auth_user_id": "driver-1",
            "zip_code": "20095",
            "assigned_packets": 100,
            "returned_packets": 2,
            "signature_status": "confirmed",
            "signature_data": {"paths": [[0]]},
            "signed_at": "2026-01-01T00:00:00+00:00",
        }
    ]

    response = client.post(
        RECORDS_ENDPOINT,
        headers=AUTH_HEADERS,
        json={
            "plan_item_id": "item-1",
            "returned_packets": 9,
            "signature_data": {"paths": [[1, 2, 3]]},
        },
    )

    assert response.status_code == 200
    assert len(fake_supabase.tables["warehouse_return_records"]) == 1
    saved = fake_supabase.tables["warehouse_return_records"][0]
    assert saved["returned_packets"] == 9
    assert saved["signature_data"] == {"paths": [[1, 2, 3]]}


def test_save_return_record_rejects_over_assigned(client, fake_supabase, warehouse_auth):
    _seed_sent_plan(fake_supabase, warehouse_auth)

    response = client.post(
        RECORDS_ENDPOINT,
        headers=AUTH_HEADERS,
        json={
            "plan_item_id": "item-1",
            "returned_packets": 101,
            "signature_data": {"paths": [[1]]},
        },
    )

    assert response.status_code == 400


def test_save_return_record_rejects_negative_returned_packets(client, fake_supabase, warehouse_auth):
    _seed_sent_plan(fake_supabase, warehouse_auth)

    response = client.post(
        RECORDS_ENDPOINT,
        headers=AUTH_HEADERS,
        json={
            "plan_item_id": "item-1",
            "returned_packets": -1,
            "signature_data": {"paths": [[1]]},
        },
    )

    assert response.status_code == 400


def test_save_return_record_rejects_zero_returned_packets(client, fake_supabase, warehouse_auth):
    _seed_sent_plan(fake_supabase, warehouse_auth)

    response = client.post(
        RECORDS_ENDPOINT,
        headers=AUTH_HEADERS,
        json={
            "plan_item_id": "item-1",
            "returned_packets": 0,
            "signature_data": {"paths": [[1]]},
        },
    )

    assert response.status_code == 400


def test_save_return_record_requires_signature_data(client, fake_supabase, warehouse_auth):
    _seed_sent_plan(fake_supabase, warehouse_auth)

    response = client.post(
        RECORDS_ENDPOINT,
        headers=AUTH_HEADERS,
        json={"plan_item_id": "item-1", "returned_packets": 5, "signature_data": {}},
    )

    assert response.status_code == 400


def test_save_return_record_no_sent_plan_returns_404(client, fake_supabase, warehouse_auth):
    response = client.post(
        RECORDS_ENDPOINT,
        headers=AUTH_HEADERS,
        json={
            "plan_item_id": "item-1",
            "returned_packets": 5,
            "signature_data": {"paths": [[1]]},
        },
    )

    assert response.status_code == 404


def test_save_return_record_unknown_item_returns_404(client, fake_supabase, warehouse_auth):
    _seed_sent_plan(fake_supabase, warehouse_auth)

    response = client.post(
        RECORDS_ENDPOINT,
        headers=AUTH_HEADERS,
        json={
            "plan_item_id": "unknown-item",
            "returned_packets": 5,
            "signature_data": {"paths": [[1]]},
        },
    )

    assert response.status_code == 404


def test_save_return_record_item_from_other_plan_returns_404(client, fake_supabase, warehouse_auth):
    _seed_sent_plan(fake_supabase, warehouse_auth)
    # An item that belongs to some other (e.g. today's draft) plan must not
    # be reachable through the yesterday-sent-plan scoped save endpoint.
    fake_supabase.tables["warehouse_assignment_plan_items"].append(
        _item_row("item-3", "other-plan", "driver-3", "Cara Cioban", "20099", 30)
    )

    response = client.post(
        RECORDS_ENDPOINT,
        headers=AUTH_HEADERS,
        json={
            "plan_item_id": "item-3",
            "returned_packets": 5,
            "signature_data": {"paths": [[1]]},
        },
    )

    assert response.status_code == 404


# --- GET /returns/yesterday-summary ---


def test_yesterday_summary_reflects_saved_returns(client, fake_supabase, warehouse_auth):
    _seed_sent_plan(fake_supabase, warehouse_auth)
    fake_supabase.tables["warehouse_return_records"] = [
        {
            "id": "ret-1",
            "warehouse_auth_user_id": warehouse_auth,
            "plan_id": "plan-1",
            "plan_item_id": "item-1",
            "driver_auth_user_id": "driver-1",
            "zip_code": "20095",
            "assigned_packets": 100,
            "returned_packets": 5,
            "signature_status": "confirmed",
            "signature_data": {"paths": [[1]]},
            "signed_at": "2026-01-01T00:00:00+00:00",
        }
    ]

    response = client.get(SUMMARY_ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "pending_validation"
    assert body["assigned_yesterday"] == 100
    assert body["drivers_involved"] == 2
    assert body["returned_packets"] == 5
    assert body["confirmed_signatures"] == 1
    # item-2 has no return record; drivers with nothing returned are not pending.
    assert body["pending_signatures"] == 0


def test_yesterday_summary_no_plan_returns_zeros(client, fake_supabase, warehouse_auth):
    response = client.get(SUMMARY_ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "no_assignment"
    assert body["assigned_yesterday"] == 0
    assert body["drivers_involved"] == 0
    assert body["returned_packets"] == 0
    assert body["confirmed_signatures"] == 0
    assert body["pending_signatures"] == 0


# --- POST /returns/close-day ---


def test_close_day_no_sent_plan_returns_400(client, fake_supabase, warehouse_auth):
    response = client.post(CLOSE_DAY_ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 400
    assert response.json()["detail"] == "No sent assignment plan found for yesterday."


def test_close_day_succeeds_when_some_drivers_have_no_return_record(
    client, fake_supabase, warehouse_auth
):
    """Drivers with nothing to return don't need a return record or signature."""
    _seed_sent_plan(fake_supabase, warehouse_auth)
    fake_supabase.tables["warehouse_return_records"] = [
        _return_record("ret-1", warehouse_auth, "item-1", "driver-1", "20095", 100, 5),
        # item-2 has no return record at all.
    ]

    response = client.post(CLOSE_DAY_ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 200
    body = response.json()
    assert body["total_returned_packets"] == 5
    assert body["confirmed_signatures"] == 1
    assert body["pending_signatures"] == 0


def test_close_day_zero_return_records_succeeds(client, fake_supabase, warehouse_auth):
    """Close Day must work even when no driver returned any packets."""
    _seed_sent_plan(fake_supabase, warehouse_auth)

    response = client.post(CLOSE_DAY_ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 200
    body = response.json()
    assert body["total_returned_packets"] == 0
    assert body["confirmed_signatures"] == 0
    assert body["pending_signatures"] == 0

    saved = fake_supabase.tables["warehouse_return_day_closures"][0]
    assert saved["total_returned_packets"] == 0
    assert saved["confirmed_signatures"] == 0
    assert saved["pending_signatures"] == 0


def test_close_day_unconfirmed_signature_returns_400(client, fake_supabase, warehouse_auth):
    _seed_sent_plan(fake_supabase, warehouse_auth)
    fake_supabase.tables["warehouse_return_records"] = [
        _return_record("ret-1", warehouse_auth, "item-1", "driver-1", "20095", 100, 5),
        _return_record(
            "ret-2", warehouse_auth, "item-2", "driver-2", "20097", 50, 3, signature_status="required"
        ),
    ]

    response = client.post(CLOSE_DAY_ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 400
    assert response.json()["detail"] == "Signature not confirmed for driver Ben Bauer."


def test_close_day_over_returned_packets_returns_400(client, fake_supabase, warehouse_auth):
    _seed_sent_plan(fake_supabase, warehouse_auth)
    fake_supabase.tables["warehouse_return_records"] = [
        _return_record("ret-1", warehouse_auth, "item-1", "driver-1", "20095", 100, 5),
        _return_record("ret-2", warehouse_auth, "item-2", "driver-2", "20097", 50, 200),
    ]

    response = client.post(CLOSE_DAY_ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 400


def test_close_day_succeeds_and_saves_closure(client, fake_supabase, warehouse_auth):
    _seed_sent_plan(fake_supabase, warehouse_auth)
    fake_supabase.tables["warehouse_return_records"] = [
        _return_record("ret-1", warehouse_auth, "item-1", "driver-1", "20095", 100, 5),
        _return_record("ret-2", warehouse_auth, "item-2", "driver-2", "20097", 50, 3),
    ]

    response = client.post(CLOSE_DAY_ENDPOINT, headers=AUTH_HEADERS)

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "closed"
    assert body["assignment_date"] == YESTERDAY
    assert body["return_date"] == date.today().isoformat()
    assert body["total_assigned_packets"] == 150
    assert body["total_returned_packets"] == 8
    assert body["drivers_count"] == 2
    assert body["confirmed_signatures"] == 2
    assert body["pending_signatures"] == 0
    assert body["message"] == "Return day closed and sent to Admin."
    assert body["closure_id"]

    saved = fake_supabase.tables["warehouse_return_day_closures"][0]
    assert saved["warehouse_auth_user_id"] == warehouse_auth
    assert saved["plan_id"] == "plan-1"
    assert saved["status"] == "closed"
    assert saved["total_assigned_packets"] == 150
    assert saved["total_returned_packets"] == 8
    assert saved["summary_data"]["plan_id"] == "plan-1"
    assert len(saved["summary_data"]["items"]) == 2

    # Underlying return records and plan items must never be mutated by close-day.
    assert len(fake_supabase.tables["warehouse_assignment_plan_items"]) == 2
    assert len(fake_supabase.tables["warehouse_return_records"]) == 2


def test_close_day_already_closed_returns_409(client, fake_supabase, warehouse_auth):
    _seed_sent_plan(fake_supabase, warehouse_auth)
    fake_supabase.tables["warehouse_return_records"] = [
        _return_record("ret-1", warehouse_auth, "item-1", "driver-1", "20095", 100, 5),
        _return_record("ret-2", warehouse_auth, "item-2", "driver-2", "20097", 50, 3),
    ]

    first = client.post(CLOSE_DAY_ENDPOINT, headers=AUTH_HEADERS)
    assert first.status_code == 200

    second = client.post(CLOSE_DAY_ENDPOINT, headers=AUTH_HEADERS)
    assert second.status_code == 409
    assert second.json()["detail"] == "Return day has already been closed."
