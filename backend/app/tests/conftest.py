"""Shared fixtures for backend tests.

Tests run against an in-memory fake of the Supabase client rather than a real
project, so they are deterministic and make no network calls.
"""

import uuid
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import assignment_service, openai_service, warehouse_service

WAREHOUSE_TOKEN = "test-warehouse-token"
WAREHOUSE_AUTH_USER_ID = "warehouse-user-1"


class FakeResult:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    """Minimal in-memory stand-in for a postgrest query builder, faithful
    enough to the subset of the API (.select/.insert/.update/.delete/.upsert
    with .eq/.neq/.gt/.lt/.in_/.order filters) that warehouse_service and
    assignment_service actually call."""

    def __init__(self, store: dict, table_name: str):
        self._store = store
        self._table_name = table_name
        self._filters: list[tuple[str, str, object]] = []
        self._op: str | None = None
        self._payload = None
        self._on_conflict: str | None = None
        self._order_col: str | None = None
        self._order_desc = False

    def select(self, *_args, **_kwargs):
        self._op = "select"
        return self

    def insert(self, payload):
        self._op = "insert"
        self._payload = payload
        return self

    def update(self, payload):
        self._op = "update"
        self._payload = payload
        return self

    def delete(self):
        self._op = "delete"
        return self

    def upsert(self, payload, on_conflict=None):
        self._op = "upsert"
        self._payload = payload
        self._on_conflict = on_conflict
        return self

    def eq(self, col, val):
        self._filters.append(("eq", col, val))
        return self

    def neq(self, col, val):
        self._filters.append(("neq", col, val))
        return self

    def gt(self, col, val):
        self._filters.append(("gt", col, val))
        return self

    def lt(self, col, val):
        self._filters.append(("lt", col, val))
        return self

    def in_(self, col, vals):
        self._filters.append(("in", col, list(vals)))
        return self

    def order(self, col, desc=False):
        self._order_col = col
        self._order_desc = desc
        return self

    def _match(self, row: dict) -> bool:
        for op, col, val in self._filters:
            row_val = row.get(col)
            if op == "eq" and row_val != val:
                return False
            if op == "neq" and row_val == val:
                return False
            if op == "gt" and not (row_val is not None and row_val > val):
                return False
            if op == "lt" and not (row_val is not None and row_val < val):
                return False
            if op == "in" and row_val not in val:
                return False
        return True

    def execute(self) -> FakeResult:
        rows = self._store.setdefault(self._table_name, [])

        if self._op == "select":
            matched = [dict(r) for r in rows if self._match(r)]
            if self._order_col:
                matched.sort(key=lambda r: r.get(self._order_col), reverse=self._order_desc)
            return FakeResult(matched)

        if self._op == "insert":
            payloads = self._payload if isinstance(self._payload, list) else [self._payload]
            inserted = []
            for payload in payloads:
                row = dict(payload)
                row.setdefault("id", str(uuid.uuid4()))
                rows.append(row)
                inserted.append(dict(row))
            return FakeResult(inserted)

        if self._op == "update":
            updated = []
            for row in rows:
                if self._match(row):
                    row.update(self._payload)
                    updated.append(dict(row))
            return FakeResult(updated)

        if self._op == "delete":
            to_delete = [row for row in rows if self._match(row)]
            for row in to_delete:
                rows.remove(row)
            return FakeResult(to_delete)

        if self._op == "upsert":
            conflict_cols = self._on_conflict.split(",") if self._on_conflict else []
            existing = next(
                (
                    row
                    for row in rows
                    if conflict_cols and all(row.get(c) == self._payload.get(c) for c in conflict_cols)
                ),
                None,
            )
            if existing is not None:
                existing.update(self._payload)
                return FakeResult([dict(existing)])
            row = dict(self._payload)
            row.setdefault("id", str(uuid.uuid4()))
            rows.append(row)
            return FakeResult([row])

        raise NotImplementedError(f"Unsupported query operation: {self._op}")


class FakeAuth:
    def __init__(self, users_by_token: dict):
        self._users_by_token = users_by_token

    def get_user(self, token: str):
        user = self._users_by_token.get(token)
        if user is None:
            raise Exception("Invalid or expired access token.")
        return SimpleNamespace(user=SimpleNamespace(id=user["auth_user_id"]))


class FakeSupabaseClient:
    def __init__(self):
        self.tables: dict[str, list[dict]] = {}
        self._users_by_token: dict[str, dict] = {}
        self.auth = FakeAuth(self._users_by_token)

    def table(self, name: str) -> FakeQuery:
        return FakeQuery(self.tables, name)

    def register_user(self, token: str, auth_user_id: str) -> None:
        self._users_by_token[token] = {"auth_user_id": auth_user_id}


@pytest.fixture
def fake_supabase(monkeypatch):
    fake = FakeSupabaseClient()
    monkeypatch.setattr(warehouse_service, "supabase_admin", fake)
    monkeypatch.setattr(assignment_service, "supabase_admin", fake)
    # Force the deterministic fallback planner regardless of local .env content.
    monkeypatch.setattr(openai_service, "get_openai_api_key", lambda: None)
    return fake


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def warehouse_auth(fake_supabase):
    fake_supabase.register_user(WAREHOUSE_TOKEN, WAREHOUSE_AUTH_USER_ID)
    fake_supabase.tables["app_users"] = [
        {"auth_user_id": WAREHOUSE_AUTH_USER_ID, "role": "warehouse", "is_active": True}
    ]
    return WAREHOUSE_AUTH_USER_ID
