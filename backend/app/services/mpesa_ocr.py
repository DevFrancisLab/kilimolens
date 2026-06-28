"""M-Pesa statement OCR / extraction via Gemini 2.5 Flash (multimodal).

Farmers submit M-Pesa statements as PDFs or photos. Gemini reads the document
natively (no separate OCR engine) and returns a structured financial summary the
loan officer can use to pre-fill the assessment's financial-behaviour fields.

Uses the Gemini native ``generateContent`` endpoint (which accepts inline PDF and
image data) over ``httpx`` — same ``GEMINI_API_KEY``, no extra dependency.
"""
from __future__ import annotations

import base64
import json
from typing import Any, Optional

import httpx

from app.config import Settings, get_settings

# Gemini accepts these inline mime types for documents/images.
SUPPORTED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
}

MAX_BYTES = 15 * 1024 * 1024  # 15 MB inline limit (keep well under Gemini's cap)

_PROMPT = (
    "You are reading a Safaricom M-Pesa statement (it may be a PDF or a photo/scan).\n"
    "Extract a financial summary to support an agricultural loan assessment.\n"
    "Rules:\n"
    "- If the document is NOT an M-Pesa / mobile-money statement, set isMpesaStatement=false "
    "and leave numeric fields at 0.\n"
    "- All amounts in Kenyan Shillings as plain numbers (no commas, no 'KES').\n"
    "- monthsCovered = number of months the statement spans (>=1).\n"
    "- averageMonthlyInflow = totalPaidIn / monthsCovered; averageMonthlyOutflow likewise.\n"
    "- mobileMoneyActivity: classify overall usage as 'High', 'Medium' or 'Low' from the "
    "transaction count and volume.\n"
    "- confidence: 0.0-1.0, how confident you are in the extraction.\n"
    "Respond with STRICT JSON only, using exactly these keys:\n"
    "{\n"
    '  "isMpesaStatement": boolean,\n'
    '  "accountName": string,\n'
    '  "statementPeriod": {"from": string, "to": string},\n'
    '  "monthsCovered": number,\n'
    '  "totalPaidIn": number,\n'
    '  "totalPaidOut": number,\n'
    '  "averageMonthlyInflow": number,\n'
    '  "averageMonthlyOutflow": number,\n'
    '  "closingBalance": number,\n'
    '  "transactionCount": number,\n'
    '  "mobileMoneyActivity": string,\n'
    '  "summary": string,\n'
    '  "confidence": number\n'
    "}"
)


class MpesaOcrError(Exception):
    """Raised when the statement cannot be read/extracted."""


async def extract_mpesa_statement(
    data: bytes, mime_type: str, settings: Optional[Settings] = None
) -> dict[str, Any]:
    """Extract a structured financial summary from an M-Pesa statement.

    ``data`` is the raw file bytes; ``mime_type`` one of SUPPORTED_MIME_TYPES.
    Raises :class:`MpesaOcrError` on configuration/transport/parse failure.
    """
    settings = settings or get_settings()
    if not settings.gemini_enabled:
        raise MpesaOcrError("OCR unavailable: GEMINI_API_KEY is not configured")
    if mime_type not in SUPPORTED_MIME_TYPES:
        raise MpesaOcrError(f"Unsupported file type: {mime_type}")

    url = f"{settings.gemini_native_base_url}/models/{settings.gemini_model}:generateContent"
    body = {
        "contents": [
            {
                "parts": [
                    {"inline_data": {"mime_type": mime_type, "data": base64.b64encode(data).decode()}},
                    {"text": _PROMPT},
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
            # Disable Gemini 2.5 Flash "thinking" so the JSON isn't truncated.
            "thinkingConfig": {"thinkingBudget": 0},
        },
    }

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(url, params={"key": settings.gemini_api_key}, json=body)
            resp.raise_for_status()
            payload = resp.json()
    except httpx.HTTPStatusError as exc:
        raise MpesaOcrError(f"Gemini HTTP {exc.response.status_code}: {exc.response.text[:200]}") from exc
    except httpx.HTTPError as exc:
        raise MpesaOcrError(f"Gemini request failed: {exc}") from exc

    try:
        text = payload["candidates"][0]["content"]["parts"][0]["text"]
        result = json.loads(text)
    except (KeyError, IndexError, ValueError, TypeError) as exc:
        raise MpesaOcrError(f"Could not parse Gemini response: {exc}") from exc

    return _normalise(result)


def _num(value: Any) -> float:
    try:
        if isinstance(value, (int, float)):
            return float(value)
        s = str(value or "").replace(",", "").replace("KES", "").replace("KSh", "").strip()
        return float(s) if s else 0.0
    except (ValueError, TypeError):
        return 0.0


def _normalise(raw: dict[str, Any]) -> dict[str, Any]:
    """Coerce Gemini's output into a stable shape with numeric types, and add a
    ready-to-apply mapping to the assessment's finance fields."""
    period = raw.get("statementPeriod") or {}
    activity = str(raw.get("mobileMoneyActivity") or "").strip().capitalize()
    if activity not in {"High", "Medium", "Low"}:
        activity = "Medium"
    avg_inflow = _num(raw.get("averageMonthlyInflow"))
    closing = _num(raw.get("closingBalance"))

    return {
        "isMpesaStatement": bool(raw.get("isMpesaStatement", False)),
        "accountName": str(raw.get("accountName") or "").strip(),
        "statementPeriod": {
            "from": str(period.get("from") or "").strip(),
            "to": str(period.get("to") or "").strip(),
        },
        "monthsCovered": _num(raw.get("monthsCovered")) or 1,
        "totalPaidIn": _num(raw.get("totalPaidIn")),
        "totalPaidOut": _num(raw.get("totalPaidOut")),
        "averageMonthlyInflow": avg_inflow,
        "averageMonthlyOutflow": _num(raw.get("averageMonthlyOutflow")),
        "closingBalance": closing,
        "transactionCount": int(_num(raw.get("transactionCount"))),
        "mobileMoneyActivity": activity,
        "summary": str(raw.get("summary") or "").strip(),
        "confidence": round(min(1.0, max(0.0, _num(raw.get("confidence")))), 2),
        # Convenience mapping the dashboard can drop straight into the wizard's
        # Financial Behaviour section.
        "financeFields": {
            "averageMonthlyIncome": str(int(avg_inflow)) if avg_inflow else "",
            "mobileMoneyActivity": activity,
            "savings": str(int(closing)) if closing else "",
        },
    }
