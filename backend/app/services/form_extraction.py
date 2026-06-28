"""AI form-fill extraction for the New Assessment wizard.

A loan officer pastes a farmer's details (free text, JSON, or an Excel/CSV/PDF/
image) into the assistant; Gemini extracts ONLY the fields for the requested
wizard section (personal, then farm) so the officer can review and confirm before
continuing. Uses Gemini's native multimodal ``generateContent`` endpoint (same as
the M-Pesa OCR) with thinking disabled and JSON response, which is reliable for
both text and documents.
"""
from __future__ import annotations

import base64
import io
import json
from typing import Any, Optional

import httpx

from app.config import Settings, get_settings

# Inline mime types Gemini reads natively (documents/images).
_NATIVE_MIME = {"application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}
# Spreadsheet / structured types we convert to text before sending.
_EXCEL_MIME = {
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # .xlsx
    "application/vnd.ms-excel",  # .xls
}
SUPPORTED_MIME_TYPES = _NATIVE_MIME | _EXCEL_MIME | {
    "text/csv", "text/plain", "application/json",
}
MAX_BYTES = 15 * 1024 * 1024

# Wizard sections -> fields the agent may fill (keys match the frontend FormData).
FIELD_SCHEMAS: dict[str, dict[str, str]] = {
    "personal": {
        "fullName": "Farmer full name",
        "nationalId": "National ID number",
        "phone": "Phone number (e.g. +2547...)",
        "gender": "One of: Female, Male, Other",
        "age": "Age in years (number as string)",
        "county": "County",
        "subCounty": "Sub-county",
        "ward": "Ward",
        "village": "Village",
        "gps": "GPS coordinates as 'lat, lon' if present",
        "loanAmountRequested": "Requested loan amount in KES (digits only)",
        "purposeOfLoan": "Purpose of the loan",
    },
    "farm": {
        "farmName": "Farm name",
        "county": "County where the farm is",
        "areaHa": "Farm area in hectares (number as string)",
        "mainCrops": "Primary crop(s), comma-separated",
        "secondaryCrops": "Secondary crops, comma-separated",
        "livestock": "Livestock, e.g. 'goats: 10, cattle: 2'",
        "yearsOfFarming": "Years of farming experience (number as string)",
        "irrigation": "One of: Rainfed, Irrigated, Mixed",
        "previousHarvest": "Previous harvest in kg (digits only)",
        "expectedHarvest": "Expected harvest in kg (digits only)",
        "inputPurchases": "Input purchases (fertiliser/seed/agrochemicals) and est. cost",
    },
}


class FormExtractionError(Exception):
    """Raised when the source cannot be read/extracted."""


def _build_prompt(section: str, source_text: str) -> str:
    fields = FIELD_SCHEMAS[section]
    field_lines = "\n".join(f'  "{k}": string  // {desc}' for k, desc in fields.items())
    body = (
        f"You are helping a loan officer fill the {section.upper()} INFORMATION section of a "
        "farmer credit-assessment form. Extract ONLY these fields from the farmer information "
        "provided. Use an empty string for anything not present. Do NOT invent values.\n"
        "Return STRICT JSON with EXACTLY these keys:\n{\n" + field_lines + "\n}"
    )
    if source_text:
        body += f"\n\nFarmer information:\n\"\"\"\n{source_text[:12000]}\n\"\"\""
    return body


def _excel_to_text(data: bytes) -> str:
    import pandas as pd

    try:
        sheets = pd.read_excel(io.BytesIO(data), sheet_name=None, engine="openpyxl")
    except Exception as exc:  # pragma: no cover - corrupt file
        raise FormExtractionError(f"Could not read the spreadsheet: {exc}") from exc
    chunks = []
    for name, df in sheets.items():
        chunks.append(f"# Sheet: {name}\n{df.to_csv(index=False)}")
    return "\n\n".join(chunks)


async def extract_form(
    section: str,
    text: str = "",
    data: Optional[bytes] = None,
    mime_type: str = "",
    settings: Optional[Settings] = None,
) -> dict[str, Any]:
    """Extract the requested section's fields from pasted text and/or a file."""
    settings = settings or get_settings()
    section = (section or "").strip().lower()
    if section not in FIELD_SCHEMAS:
        raise FormExtractionError(f"Unknown section '{section}'. Use 'personal' or 'farm'.")
    if not settings.gemini_enabled:
        raise FormExtractionError("Extraction unavailable: GEMINI_API_KEY is not configured")

    inline: Optional[tuple[bytes, str]] = None
    source_text = (text or "").strip()

    if data:
        mime = (mime_type or "").lower()
        if mime in _NATIVE_MIME:
            inline = (data, mime)
        elif mime in _EXCEL_MIME:
            source_text = (_excel_to_text(data) + "\n\n" + source_text).strip()
        elif mime in {"text/csv", "text/plain", "application/json"}:
            source_text = (data.decode("utf-8", errors="replace") + "\n\n" + source_text).strip()
        else:
            raise FormExtractionError(f"Unsupported file type: {mime or 'unknown'}")

    if not inline and not source_text:
        raise FormExtractionError("Provide some text or a file to extract from.")

    raw = await _gemini_extract(settings, _build_prompt(section, source_text), inline)
    # Keep only known keys; coerce to strings; drop empties so we never overwrite
    # an existing field with a blank.
    allowed = FIELD_SCHEMAS[section]
    fields = {
        k: str(raw[k]).strip()
        for k in allowed
        if isinstance(raw, dict) and raw.get(k) not in (None, "", [])
    }
    return {"section": section, "fields": fields, "filledCount": len(fields)}


async def _gemini_extract(
    settings: Settings, prompt: str, inline: Optional[tuple[bytes, str]]
) -> dict[str, Any]:
    url = f"{settings.gemini_native_base_url}/models/{settings.gemini_model}:generateContent"
    parts: list[dict[str, Any]] = []
    if inline is not None:
        blob, mime = inline
        parts.append({"inline_data": {"mime_type": mime, "data": base64.b64encode(blob).decode()}})
    parts.append({"text": prompt})

    body = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
            "thinkingConfig": {"thinkingBudget": 0},
        },
    }
    try:
        async with httpx.AsyncClient(timeout=90) as client:
            resp = await client.post(url, params={"key": settings.gemini_api_key}, json=body)
            resp.raise_for_status()
            payload = resp.json()
    except httpx.HTTPStatusError as exc:
        raise FormExtractionError(f"Gemini HTTP {exc.response.status_code}: {exc.response.text[:200]}") from exc
    except httpx.HTTPError as exc:
        raise FormExtractionError(f"Gemini request failed: {exc}") from exc

    try:
        out = payload["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(out)
    except (KeyError, IndexError, ValueError, TypeError) as exc:
        raise FormExtractionError(f"Could not parse Gemini response: {exc}") from exc
