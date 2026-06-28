"""Loan-decision notification.

When a loan officer approves (optionally for a specific amount) or declines an
application, the farmer receives an SMS that:
  - states the decision (and approved amount),
  - explains the reasons behind it (grounded in the assessment's own drivers /
    explanation strengths & risks),
  - gives metric-based guidance to improve or maintain their credit score, and
  - invites them to keep chatting with the platform (the two-way advisory SMS).

The reasons and guidance are reused from the assessment's already-generated
explanation (Gemini-grounded), so no extra LLM call is needed on the decision
path. Persistence mirrors the rest of the app: Neo4j is authoritative, the SQLite
mirror is best-effort.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Optional

from starlette.concurrency import run_in_threadpool

from app import store
from app.graph.repository import GraphRepository
from app.repositories import advisory_repository
from app.services.africas_talking import AfricasTalkingClient
from app.utils.phone import normalize_msisdn
from app.utils.sms_text import clamp_sms

logger = logging.getLogger("kilimolens.decision")

VALID_DECISIONS = {"Approved", "Declined"}

# Local languages fall back to English for the fixed decision copy (the dynamic
# reasons/next-steps come from the assessment and are already in English).
_COPY = {
    "en": {
        "approved": "Good news! Your loan {ref} is APPROVED{amt}.",
        "declined": "Your loan {ref} was not approved this time.",
        "why": "Why:",
        "improve_ok": "To maintain your score:",
        "improve_no": "To improve and re-apply:",
        "chat": "Reply to this SMS anytime to chat with KilimoLens for free guidance.",
        "amt": " for KES {n:,}",
    },
    "sw": {
        "approved": "Habari njema! Mkopo wako {ref} UMEIDHINISHWA{amt}.",
        "declined": "Mkopo wako {ref} haukuidhinishwa kwa sasa.",
        "why": "Sababu:",
        "improve_ok": "Kudumisha alama yako:",
        "improve_no": "Kuboresha na kuomba tena:",
        "chat": "Jibu SMS hii wakati wowote kuzungumza na KilimoLens kupata ushauri bila malipo.",
        "amt": " kwa KES {n:,}",
    },
}


def _lang_code(value: str) -> str:
    v = (value or "").strip().lower()
    return "sw" if v in {"sw", "kiswahili", "swahili"} else "en"


def _reasons(result: dict[str, Any], approved: bool) -> list[str]:
    explanation = (result or {}).get("explanation") or {}
    drivers = (result or {}).get("drivers") or []
    if approved:
        items = explanation.get("strengths") or [
            f"{d.get('label')}: {d.get('value')}" for d in drivers if d.get("direction") == "positive"
        ]
    else:
        items = explanation.get("risks") or [
            f"{d.get('label')}: {d.get('value')}" for d in drivers if d.get("direction") == "negative"
        ]
    return [str(i).strip() for i in items if str(i).strip()][:2]


def compose_decision_sms(
    reference: str,
    decision: str,
    approved_amount: Optional[float],
    result: dict[str, Any],
    lang_code: str,
) -> str:
    """Build the farmer-facing decision SMS from the stored assessment."""
    c = _COPY.get(lang_code, _COPY["en"])
    approved = decision == "Approved"

    amt = c["amt"].format(n=int(approved_amount)) if (approved and approved_amount) else ""
    head = (c["approved"] if approved else c["declined"]).format(ref=reference, amt=amt)

    reasons = _reasons(result, approved)
    why = f"{c['why']} " + "; ".join(reasons) + "." if reasons else ""

    steps = ((result or {}).get("explanation") or {}).get("nextSteps") or []
    improve_label = c["improve_ok"] if approved else c["improve_no"]
    improve = f"{improve_label} " + " ".join(str(s).strip() for s in steps[:2]) if steps else ""

    parts = [f"KilimoLens: {head}", why, improve, c["chat"]]
    return clamp_sms(" ".join(p for p in parts if p))


async def record_loan_decision(
    reference: str,
    decision: str,
    approved_amount: Optional[float],
    note: str,
    language: Optional[str],
    sms_client: AfricasTalkingClient,
) -> Optional[dict[str, Any]]:
    """Record the officer's decision, persist it, and SMS the farmer the decision +
    reasons + improvement guidance + an invitation to keep chatting.

    Returns ``None`` if the application does not exist.
    """
    repo = GraphRepository()
    existing = await run_in_threadpool(store.get_assessment, reference)
    if existing is None and repo.enabled:
        existing = await run_in_threadpool(repo.get_assessment, reference)
    if existing is None:
        return None

    request_payload = existing.get("request") or {}
    result = dict(existing.get("result") or {})
    personal = request_payload.get("personal") or {}
    channel = request_payload.get("channel") or {}
    phone = normalize_msisdn(personal.get("phone") or existing.get("phone") or "")
    lang_code = _lang_code(language or channel.get("preferredLanguage") or "en")

    status = "Approved" if decision == "Approved" else "Declined"
    now = store._now_iso()
    result.update(
        {
            "decision": decision,
            "approvedAmount": approved_amount,
            "decisionNote": note or "",
            "decidedAt": now,
            "status": status,
            "updatedAt": now,
        }
    )
    result_json = json.dumps(result)

    # Persist: Neo4j authoritative, SQLite mirror best-effort.
    try:
        repo.update_status(reference, status=status, result_json=result_json)
    except Exception as exc:  # pragma: no cover - network failures
        logger.error("decision.graph_update_failed", extra={"error": str(exc)})
    await run_in_threadpool(
        store.update_application_status, reference, status=status, result_json=result_json
    )

    # Compose + send the decision SMS to the farmer.
    message = compose_decision_sms(reference, decision, approved_amount, result, lang_code)
    sms_result = await sms_client.send_sms(phone, message) if phone else None

    # Seed the advisory thread so the farmer's reply continues the conversation.
    if sms_result and sms_result.status == "sent":
        await run_in_threadpool(
            advisory_repository.add_message,
            phone,
            advisory_repository.ROLE_ADVISOR,
            message,
            sms_result.messageId,
            reference,
        )

    logger.info(
        "decision.recorded",
        extra={"decision": {"ref": reference, "status": status, "sms": sms_result.status if sms_result else "no-phone"}},
    )
    return {
        "reference": reference,
        "status": status,
        "decision": decision,
        "approvedAmount": approved_amount,
        "phone": phone,
        "message": message,
        "sms": sms_result.model_dump() if sms_result else None,
    }
