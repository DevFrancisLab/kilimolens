"""AI form-fill extraction endpoint for the assessment wizard.

``POST /api/extract/form`` takes a wizard ``section`` ("personal" | "farm") and
either pasted ``text`` and/or an uploaded ``file`` (PDF / image / Excel / CSV /
JSON / text), and returns the structured fields for that section so the loan
officer can review and confirm before continuing.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.config import Settings, get_settings
from app.services.form_extraction import (
    MAX_BYTES,
    SUPPORTED_MIME_TYPES,
    FormExtractionError,
    extract_form,
)

router = APIRouter(prefix="/extract", tags=["extraction"])


@router.post("/form")
async def extract_form_endpoint(
    section: str = Form(...),
    text: str = Form(""),
    file: UploadFile | None = File(None),
    settings: Settings = Depends(get_settings),
) -> dict:
    if not settings.gemini_enabled:
        raise HTTPException(status_code=503, detail="Extraction unavailable: GEMINI_API_KEY not configured")

    data: bytes | None = None
    mime = ""
    if file is not None:
        mime = (file.content_type or "").lower()
        if mime not in SUPPORTED_MIME_TYPES:
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported file type '{mime or 'unknown'}'. Upload PDF, image, Excel, CSV, JSON or text.",
            )
        data = await file.read()
        if len(data) > MAX_BYTES:
            raise HTTPException(status_code=413, detail="File too large (max 15 MB).")

    if not (text.strip() or data):
        raise HTTPException(status_code=400, detail="Provide text or a file to extract from.")

    try:
        return await extract_form(section, text=text, data=data, mime_type=mime, settings=settings)
    except FormExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
