"""AI Advisory service — turns an inbound farmer SMS into a contextual, AI-generated
advisory reply and sends it back, continuing the conversation naturally.

Pipeline (per inbound SMS):
  1. Identify the farmer from the phone number.
  2. Retrieve their latest completed loan assessment.
  3. Retrieve their farmer profile.
  4. Retrieve previous conversation history.
  5. Send system + context + history + message to LangChain (Gemini).
  6. Generate a contextual response grounded in the farmer's own assessment.
  7. Send the response back via Africa's Talking and persist both turns.

Blocking work (SQLite, datastore reads) runs in a threadpool; the LLM and SMS
calls are awaited — nothing blocks the event loop.
"""
from __future__ import annotations

import logging
from typing import Any, Optional

from starlette.concurrency import run_in_threadpool

from app import store
from app.config import get_settings
from app.crud import messaging as crud
from app.prompts.advisory import SYSTEM_PROMPT, build_context_block
from app.repositories import advisory_repository as repo
from app.services.africas_talking import AfricasTalkingClient
from app.utils.phone import normalize_msisdn
from app.utils.sms_text import clamp_sms

logger = logging.getLogger("kilimolens.advisory")

_MAX_HISTORY_TURNS = 12


async def handle_inbound_sms(
    phone_raw: str, text: str, provider_id: Optional[str], sms_client: AfricasTalkingClient
) -> str:
    """Full inbound→AI→outbound advisory cycle. Returns the reply that was sent."""
    phone = normalize_msisdn(phone_raw) or phone_raw
    text = (text or "").strip()

    # 1-4. Gather context (blocking datastore reads off the event loop).
    assessment = await run_in_threadpool(crud.get_latest_assessment_by_phone, phone)
    profile = await run_in_threadpool(_load_profile, assessment)
    history = await run_in_threadpool(repo.get_history, phone, _MAX_HISTORY_TURNS)

    # Persist the inbound turn (advisory thread + unified SMS log).
    assessment_id = assessment.get("id") if assessment else None
    await run_in_threadpool(repo.add_message, phone, repo.ROLE_FARMER, text, provider_id, assessment_id)
    await run_in_threadpool(crud.log_sms, "inbound", phone, text, "received", provider_id)

    # 5-6. Generate the contextual reply.
    reply = await generate_reply(profile, assessment, history, text)

    # 7. Send it back and record the advisor turn.
    result = await sms_client.send_sms(phone, reply)
    await run_in_threadpool(
        repo.add_message, phone, repo.ROLE_ADVISOR, reply, result.messageId, assessment_id
    )
    logger.info(
        "advisory.reply_sent",
        extra={"advisory": {"phone": phone[-4:], "status": result.status, "grounded": bool(assessment)}},
    )
    return reply


def _load_profile(assessment: Optional[dict[str, Any]]) -> dict[str, Any]:
    if not assessment:
        return {}
    farmer = store.get_farmer(assessment.get("farmerId", "")) or {}
    return farmer.get("profile", {}) or {}


async def generate_reply(
    profile: dict[str, Any],
    assessment: Optional[dict[str, Any]],
    history: list[dict[str, Any]],
    message: str,
) -> str:
    """Generate the advisory reply with LangChain + Gemini, grounded in the
    farmer's assessment. Falls back to a context-derived message if the LLM is
    unavailable, so the farmer always gets a useful, non-generic reply."""
    settings = get_settings()
    context = build_context_block(profile, assessment)

    if settings.gemini_enabled:
        try:
            return await _llm_reply(settings, context, history, message)
        except Exception as exc:  # production resilience — never drop the farmer
            logger.error("advisory.llm_failed", extra={"error": str(exc)})

    return clamp_sms(_fallback_reply(assessment))


async def _llm_reply(
    settings, context: str, history: list[dict[str, Any]], message: str
) -> str:
    from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
    from langchain_openai import ChatOpenAI

    llm = ChatOpenAI(
        model=settings.gemini_model,
        api_key=settings.gemini_api_key,
        base_url=settings.gemini_base_url,
        temperature=0.4,
        # Gemini 2.5 Flash spends part of the budget on internal "thinking", so the
        # cap must leave ample room for the actual reply (clamp_sms trims to SMS length).
        max_tokens=2048,
        timeout=30,
    )

    messages: list[Any] = [SystemMessage(content=f"{SYSTEM_PROMPT}\n\nFARMER ASSESSMENT CONTEXT:\n{context}")]
    for turn in history:
        if turn["role"] == repo.ROLE_FARMER:
            messages.append(HumanMessage(content=turn["message"]))
        else:
            messages.append(AIMessage(content=turn["message"]))
    messages.append(HumanMessage(content=message))

    resp = await llm.ainvoke(messages)
    return clamp_sms((resp.content or "").strip() or _fallback_reply(None))


def _fallback_reply(assessment: Optional[dict[str, Any]]) -> str:
    """Context-derived fallback (used only if the LLM is unavailable). Still drawn
    from the farmer's own assessment next-steps where possible — not generic."""
    if assessment:
        steps = ((assessment.get("result") or {}).get("explanation") or {}).get("nextSteps") or []
        if steps:
            return "KilimoLens: To improve your credit readiness, " + steps[0] + " Reply with any question."
        score = (assessment.get("result") or {}).get("creditReadinessScore")
        return (
            f"KilimoLens: Your credit readiness is {score}/100. Keep repaying on time and saving "
            "via mobile money. Reply with a question and I'll help."
        )
    return (
        "KilimoLens: I can give you personal credit-readiness advice once you complete an assessment. "
        "Dial our USSD code to apply, or reply with a question."
    )
