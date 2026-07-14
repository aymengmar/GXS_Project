import json

import httpx

from app.core.config import settings

_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions"
_REQUEST_TIMEOUT_SECONDS = 30.0

_SYSTEM_PROMPT = (
    "You are a logistics ZIP-to-driver packet assignment engine. "
    "Respond with strict JSON only, no prose, no markdown. "
    "Rules: "
    "1) Prefer assigning a ZIP's packets to a driver whose home_zip equals that ZIP code. "
    "2) Otherwise prefer the driver with the smallest numeric distance to the ZIP. "
    "3) A driver may never receive more than max_capacity packets in total across all ZIPs. "
    "4) Never assign more packets to a ZIP than its packet_count. "
    "5) Leave packets unassigned if no driver has remaining capacity. "
    "Respond with JSON of exactly this shape: "
    '{"assignments": [{"driver_alias": "driver_1", "zip_code": "12345", "packets": 50}]}'
)


def get_openai_api_key() -> str | None:
    # TODO: source from Supabase Vault once a vault-read RPC is provisioned on
    # the project; no such RPC exists yet, so this env var is the interim path.
    return settings.OPENAI_API_KEY or None


def request_ai_assignment_plan(payload: dict) -> tuple[dict, str] | None:
    """Ask GPT-4o for a draft assignment plan over anonymized driver/ZIP data.

    Returns (parsed_json, model_name) on a well-formed response, or None if the
    key is missing or the call/parse fails for any reason — callers must treat
    None as "use the deterministic fallback", never raise past this function.
    """
    api_key = get_openai_api_key()
    if not api_key:
        return None

    body = {
        "model": settings.OPENAI_MODEL,
        "temperature": 0,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(payload)},
        ],
    }

    try:
        response = httpx.post(
            _CHAT_COMPLETIONS_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=body,
            timeout=_REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        parsed = json.loads(content)
    except Exception:
        # Any network, auth, rate-limit, or malformed-response failure falls
        # back to the deterministic planner — never let an AI outage break
        # assignment-plan generation.
        return None

    if not isinstance(parsed, dict) or not isinstance(parsed.get("assignments"), list):
        return None

    return parsed, settings.OPENAI_MODEL
