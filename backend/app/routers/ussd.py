"""USSD callback endpoint for Africa's Talking.

Africa's Talking POSTs an ``application/x-www-form-urlencoded`` body on every
USSD screen and expects a ``text/plain`` reply beginning with ``CON`` (continue)
or ``END`` (terminate). Configure this URL as your service's USSD callback in the
Africa's Talking dashboard.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Form
from starlette.responses import PlainTextResponse

from app.schemas import UssdRequest
from app.services.africas_talking import AfricasTalkingClient, get_sms_client
from app.services.ussd_engine import handle

router = APIRouter(prefix="/ussd", tags=["ussd"])


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
    return await handle(req, sms_client)
