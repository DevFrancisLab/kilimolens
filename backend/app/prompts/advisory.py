"""Prompt construction for the AI Advisory module.

The advisor is NOT a generic chatbot. Its single objective is to help a farmer
IMPROVE or MAINTAIN their Credit Readiness after an assessment, grounded in that
farmer's OWN assessment result (scores, drivers, next steps, climate). Every reply
is generated from this context — never a canned answer.
"""
from __future__ import annotations

from typing import Any

SYSTEM_PROMPT = """You are KilimoLens Advisor, a financial and agricultural advisor who helps a \
smallholder farmer improve or maintain their Credit Readiness AFTER they have received a credit \
assessment. You speak with them by SMS.

Your goals:
- Help the farmer act on THIS farmer's specific assessment to raise (or keep) their Credit Readiness.
- Give concrete, doable next steps tied to their actual drivers, risks and climate.
- Be encouraging, respectful and concise.

Hard rules:
- Ground every reply in the farmer's assessment context provided below. Do not invent numbers or facts.
- Never reference gender, age, ethnicity or land ownership as factors.
- This is SMS: keep each reply under ~320 characters, plain language, no markdown, no links.
- Mirror the farmer's language: if they write in Kiswahili, reply in Kiswahili; otherwise English.
- Stay on financial / agricultural advisory for THIS farmer. If asked something unrelated, gently
  steer back to improving their credit readiness.
- One or two clear actions per message. Invite them to reply with questions so the conversation continues.
"""


def _join(items: list[str] | None, sep: str = "; ") -> str:
    return sep.join(i for i in (items or []) if i) or "none recorded"


def build_context_block(profile: dict[str, Any], assessment: dict[str, Any] | None) -> str:
    """Render the farmer's assessment + profile into a grounding block for the LLM."""
    personal = (profile or {}).get("personal", {}) or {}
    farm = (profile or {}).get("farm", {}) or {}

    name = personal.get("fullName") or "the farmer"
    county = personal.get("county") or farm.get("county") or "unknown area"
    crops = farm.get("mainCrops") or "unspecified crops"

    if not assessment:
        return (
            f"Farmer: {name} in {county}, growing {crops}.\n"
            "Assessment: NONE on record yet. Encourage them to complete a credit assessment "
            "(a loan officer visit or dialling the KilimoLens USSD code) so you can advise precisely. "
            "Meanwhile give one general, safe credit-readiness tip."
        )

    result = assessment.get("result", {}) or {}
    exp = result.get("explanation", {}) or {}
    climate = result.get("climate", {}) or {}
    drivers = result.get("drivers", []) or []
    pos = [f"{d.get('label')} ({d.get('value')})" for d in drivers if d.get("direction") == "positive"]
    neg = [f"{d.get('label')} ({d.get('value')})" for d in drivers if d.get("direction") == "negative"]

    return (
        f"Farmer: {name} in {county}, growing {crops}.\n"
        f"Credit Readiness: {result.get('creditReadinessScore')}/100 "
        f"(confidence {result.get('confidenceScore')}), recommendation: {result.get('recommendation')}.\n"
        f"What is helping them: {_join(pos)}.\n"
        f"What is holding them back: {_join(neg)}.\n"
        f"Assessment strengths: {_join(exp.get('strengths'))}.\n"
        f"Assessment risks: {_join(exp.get('risks'))}.\n"
        f"Recommended next steps: {_join(exp.get('nextSteps'))}.\n"
        f"Climate: rainfall {climate.get('rainfallMmYr')}mm/yr, drought risk "
        f"{climate.get('droughtRiskPct')}%, soil {climate.get('soilSuitability')}.\n"
        f"Assessment date: {assessment.get('createdAt', '')[:10]}."
    )
