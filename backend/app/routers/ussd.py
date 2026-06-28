"""USSD callback endpoint for Africa's Talking.

Africa's Talking POSTs an ``application/x-www-form-urlencoded`` body on every
USSD screen and expects a ``text/plain`` reply beginning with ``CON`` (continue)
or ``END`` (terminate). Configure this URL as your service's USSD callback in the
Africa's Talking dashboard.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Form
from starlette.responses import PlainTextResponse

from app.schemas import UssdRequest
from app.services.africas_talking import AfricasTalkingClient, get_sms_client
from app.services.ussd_engine import handle

logger = logging.getLogger("kilimolens.ussd")

router = APIRouter(prefix="/ussd", tags=["ussd"])

# Shown only if the handler unexpectedly fails — so Africa's Talking never gets a
# 500 (which it surfaces to the farmer as "we are experiencing a technical issue").
_ERROR_END = (
    "END Samahani, kumetokea hitilafu kidogo. Tafadhali jaribu tena baadaye.\n"
    "Sorry, a technical error occurred. Please try again shortly."
)


@router.post("", response_class=PlainTextResponse)
async def ussd_callback(
    sessionId: str = Form(...),
    phoneNumber: str = Form(...),
    serviceCode: str = Form(""),
    text: str = Form(""),
    sms_client: AfricasTalkingClient = Depends(get_sms_client),
) -> PlainTextResponse:
    req = UssdRequest(
        sessionId=sessionId,
        serviceCode=serviceCode,
        phoneNumber=phoneNumber,
        text=text,
    )
    try:
        return await handle(req, sms_client)
    except Exception:  # never return a 500 to Africa's Talking
        logger.exception("USSD handler failed (session=%s, text=%r)", sessionId, text)
        return PlainTextResponse(_ERROR_END)
