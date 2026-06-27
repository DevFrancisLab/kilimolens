"""Explainable-AI layer: turn the model's SHAP drivers into language a loan
officer and a farmer can act on, using LangChain + Gemini 2.5 Flash.

Gemini is reached through its OpenAI-compatible endpoint, so the existing
``langchain-openai`` client is reused (no extra dependency). The LLM is grounded
strictly in the model's own drivers (no free invention). If GEMINI_API_KEY is
unset or the call fails, a deterministic template produces the same JSON shape so
the API never breaks.
"""
from __future__ import annotations

import json
from typing import Any

from app.config import get_settings

_SYSTEM = (
    "You are KilimoLens, an explainable credit assistant for African smallholder "
    "agricultural lending. You translate a machine-learning credit model's outputs "
    "into clear, fair, non-technical language. Rules:\n"
    "- Use ONLY the provided drivers and scores. Never invent facts.\n"
    "- Be fair: never reference gender, age, ethnicity, or land ownership as reasons.\n"
    "- 'farmerMessage' must be plain language suitable for SMS/USSD, under 320 chars, "
    "encouraging and actionable.\n"
    "- Respond with STRICT JSON only, no markdown."
)

_USER_TEMPLATE = (
    "Credit Readiness Score: {readiness}/100\n"
    "Confidence: {confidence}/100\n"
    "Recommendation: {recommendation}\n"
    "Cooperative network strength: {coop_strength}\n"
    "Peer repayment score: {peer_repay}\n"
    "Top model drivers (signed impact on readiness):\n{drivers}\n\n"
    "Return JSON with keys: summary (string, 2-3 sentences for the loan officer), "
    "strengths (array of 2-4 short strings), risks (array of 2-4 short strings), "
    "farmerMessage (string, plain English for the farmer over SMS, under 320 chars), "
    "farmerMessageSw (string, the SAME message in clear Kiswahili for the farmer over "
    "SMS/USSD, under 320 chars), "
    "nextSteps (array of 2-4 short, concrete actions the farmer can take to improve)."
)


def _format_drivers(drivers: list[dict[str, Any]]) -> str:
    lines = []
    for d in drivers:
        sign = "+" if d["direction"] == "positive" else "-"
        lines.append(f"  {sign} {d['label']} = {d['value']} (impact {d['impact']:+.3f})")
    return "\n".join(lines)


def generate_explanation(result: dict[str, Any], graph_features: dict[str, Any]) -> dict[str, Any]:
    settings = get_settings()
    drivers = result.get("drivers", [])
    if settings.gemini_enabled:
        try:
            return _llm_explanation(settings, result, graph_features, drivers)
        except Exception as exc:  # pragma: no cover - network/dep failures
            print(f"[explain] Gemini call failed, using fallback: {exc}")
    return _fallback_explanation(result, graph_features, drivers)


def _llm_explanation(settings, result, graph_features, drivers) -> dict[str, Any]:
    from langchain_core.messages import HumanMessage, SystemMessage
    from langchain_openai import ChatOpenAI

    llm = ChatOpenAI(
        model=settings.gemini_model,
        api_key=settings.gemini_api_key,
        base_url=settings.gemini_base_url,
        temperature=0.3,
        # Gemini 2.5 Flash spends part of the budget on "thinking"; keep enough
        # headroom for the full JSON so the response isn't truncated.
        max_tokens=2048,
        timeout=60,
        # Force a clean JSON object (Gemini's OpenAI-compatible endpoint supports
        # response_format) so parsing never trips on prose or markdown fences.
        model_kwargs={"response_format": {"type": "json_object"}},
    )
    prompt = _USER_TEMPLATE.format(
        readiness=result["creditReadinessScore"],
        confidence=result["confidenceScore"],
        recommendation=result["recommendation"],
        coop_strength=graph_features.get("cooperativeNetworkStrength"),
        peer_repay=graph_features.get("peerRepaymentScore"),
        drivers=_format_drivers(drivers),
    )
    resp = llm.invoke([SystemMessage(content=_SYSTEM), HumanMessage(content=prompt)])
    data = _parse_json(resp.content)
    return {
        "summary": data.get("summary", "").strip() or _fallback_summary(result),
        "strengths": _as_list(data.get("strengths")) or _strengths(drivers),
        "risks": _as_list(data.get("risks")) or _risks(drivers),
        "farmerMessage": data.get("farmerMessage", "").strip() or _farmer_message(result, drivers),
        "farmerMessageSw": data.get("farmerMessageSw", "").strip() or _farmer_message_sw(result, drivers),
        "nextSteps": _as_list(data.get("nextSteps")) or _next_steps(drivers),
        "source": "gemini",
    }


def _parse_json(content: str) -> dict[str, Any]:
    content = content.strip()
    if content.startswith("```"):
        content = content.strip("`")
        content = content[content.find("{") :]
    start, end = content.find("{"), content.rfind("}")
    if start != -1 and end != -1:
        content = content[start : end + 1]
    return json.loads(content)


# ── deterministic fallback ──────────────────────────────────────────────────
def _fallback_explanation(result, graph_features, drivers) -> dict[str, Any]:
    return {
        "summary": _fallback_summary(result),
        "strengths": _strengths(drivers),
        "risks": _risks(drivers),
        "farmerMessage": _farmer_message(result, drivers),
        "farmerMessageSw": _farmer_message_sw(result, drivers),
        "nextSteps": _next_steps(drivers),
        "source": "fallback",
    }


def _fallback_summary(result) -> str:
    r = result["creditReadinessScore"]
    band = "strong" if r >= 70 else "moderate" if r >= 50 else "limited"
    return (
        f"The model assesses this farmer's credit readiness at {r}/100 ({band}), with "
        f"{result['confidenceScore']}% confidence, giving a recommendation of "
        f"'{result['recommendation']}'. The score reflects behavioural, financial and "
        f"climate-resilience signals rather than collateral."
    )


def _strengths(drivers) -> list[str]:
    out = [f"{d['label']}: {d['value']}" for d in drivers if d["direction"] == "positive"]
    return out[:4] or ["Profile submitted for assessment"]


def _risks(drivers) -> list[str]:
    out = [f"{d['label']}: {d['value']}" for d in drivers if d["direction"] == "negative"]
    return out[:4] or ["No major risk drivers identified"]


def _farmer_message(result, drivers) -> str:
    pos = next((d["label"].lower() for d in drivers if d["direction"] == "positive"), None)
    neg = next((d["label"].lower() for d in drivers if d["direction"] == "negative"), None)
    msg = f"KilimoLens: your credit readiness is {result['creditReadinessScore']}/100. "
    if pos:
        msg += f"Your {pos} helps you. "
    if neg:
        msg += f"Improving your {neg} would raise your score. "
    msg += "Reply HELP for tips."
    return msg[:320]


# Kiswahili labels for the fallback SMS (used when Gemini is off).
_SW_LABELS = {
    "repayment_history": "historia ya kulipa madeni",
    "mobile_money_activity": "matumizi ya pesa za simu",
    "savings_kes": "akiba yako",
    "cooperative_member": "ushirika wako",
    "coop_network_strength": "mtandao wa ushirika",
    "peer_repayment_score": "ulipaji wa wenzako",
    "crop_diversification": "mseto wa mazao",
    "drought_resistant": "mazao yanayostahimili ukame",
    "outstanding_loans_kes": "madeni yaliyobaki",
    "water_harvesting_flag": "uvunaji wa maji",
    "soil_conservation_flag": "uhifadhi wa udongo",
    "climate_training": "mafunzo ya kilimo cha hali ya hewa",
}


def _farmer_message_sw(result, drivers) -> str:
    pos = next((d["feature"] for d in drivers if d["direction"] == "positive"), None)
    neg = next((d["feature"] for d in drivers if d["direction"] == "negative"), None)
    msg = f"KilimoLens: utayari wako wa mkopo ni {result['creditReadinessScore']}/100. "
    if pos:
        msg += f"{_SW_LABELS.get(pos, 'jitihada zako').capitalize()} inakusaidia. "
    if neg:
        msg += f"Kuboresha {_SW_LABELS.get(neg, 'baadhi ya maeneo')} kutaongeza alama yako. "
    msg += "Jibu MSAADA kupata ushauri."
    return msg[:320]


def _next_steps(drivers) -> list[str]:
    tips = {
        "repayment_history": "Keep repaying any current loans on time to build your record.",
        "savings_kes": "Grow your savings, even small regular deposits help.",
        "mobile_money_activity": "Use mobile money regularly to build a transaction history.",
        "cooperative_member": "Join or stay active in a farming cooperative.",
        "coop_network_strength": "Strengthen ties with your cooperative and peers.",
        "crop_diversification": "Plant a wider mix of crops to spread risk.",
        "drought_resistant": "Adopt more drought-resistant crop varieties.",
        "water_harvesting_flag": "Set up basic water harvesting for dry spells.",
        "soil_conservation_flag": "Practise soil conservation such as mulching or terracing.",
        "climate_training": "Attend a climate-smart farming training.",
        "outstanding_loans_kes": "Reduce outstanding debts before taking new credit.",
    }
    steps = [tips[d["feature"]] for d in drivers if d["feature"] in tips and d["direction"] == "negative"]
    if len(steps) < 2:
        steps += [tips[d["feature"]] for d in drivers if d["feature"] in tips and tips[d["feature"]] not in steps]
    return steps[:4] or ["Complete your full profile for a more precise assessment."]


def _as_list(value) -> list[str]:
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    return []
