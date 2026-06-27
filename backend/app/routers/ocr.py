"""OCR endpoints — extract structured data from uploaded documents via Gemini.

``POST /api/ocr/mpesa`` accepts an M-Pesa statement (PDF or image) and returns a
structured financial summary plus a ``financeFields`` mapping the dashboard can
drop into the assessment wizard's Financial Behaviour step.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.config import Settings, get_settings
from app.services.mpesa_ocr import (
    MAX_BYTES,
    SUPPORTED_MIME_TYPES,
    MpesaOcrError,
    extract_mpesa_statement,
)

router = APIRouter(prefix="/ocr", tags=["ocr"])


@router.post("/mpesa")
async def ocr_mpesa_statement(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
) -> dict:
    if not settings.gemini_enabled:
        raise HTTPException(status_code=503, detail="OCR unavailable: GEMINI_API_KEY not configured")

    mime = (file.content_type or "").lower()
    if mime not in SUPPORTED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{mime or 'unknown'}'. Upload a PDF or an image (JPG/PNG/WebP).",
        )

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file.")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 15 MB).")

    try:
        return await extract_mpesa_statement(data, mime, settings)
    except MpesaOcrError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
