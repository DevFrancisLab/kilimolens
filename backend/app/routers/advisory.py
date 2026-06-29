"""AI Advisory — two-way SMS advisory endpoints (Africa's Talking).

  * ``POST /advisory/sms/webhook`` — inbound SMS webhook. Africa's Talking POSTs
    every incoming farmer SMS here; the module generates a contextual, AI-written
    advisory reply (grounded in the farmer's own assessment) and sends it back.
  * ``GET  /advisory/conversations/{phone}`` — review a farmer's advisory thread
    (loan-officer dashboard).

Configure the webhook URL as the inbound-SMS callback in the Africa's Talking
dashboard. The endpoint acknowledges immediately and does the AI + outbound SMS
work in the background so Africa's Talking is never kept waiting.
"""
from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, Form

from app.config import Settings, get_settings
from app.repositories import advisory_repository as repo
from app.schemas.advisory import AdvisoryTurn, ConversationView, WebhookAck
from app.services.advisory_service import handle_inbound_sms
from app.services.africas_talking import AfricasTalkingClient, get_sms_client
from app.utils.phone import normalize_msisdn
from app.utils.sms_text import strip_keyword

router = APIRouter(prefix="/advisory", tags=["advisory"])


@router.post("/sms/webhook", response_model=WebhookAck)
async def sms_webhook(
    background: BackgroundTasks,
    from_: str = Form(..., alias="from"),
    text: str = Form(""),
    id: str = Form(""),
    date: str = Form(""),
    to: str = Form(""),
    linkId: str = Form(""),
    settings: Settings = Depends(get_settings),
    sms_client: AfricasTalkingClient = Depends(get_sms_client),
) -> WebhookAck:
    """Receive an inbound farmer SMS (phone, message, message id, timestamp) and
    reply with an AI-generated advisory message in the background.

    On a shortcode the message arrives prefixed with the registered keyword
    (e.g. "Test11 ..."); it is stripped before the AI sees it.
    """
    message = strip_keyword(text, settings.at_sms_keyword)
    background.add_task(handle_inbound_sms, from_, message, id or None, sms_client)
    return WebhookAck(status="ok")


@router.get("/conversations/{phone}", response_model=ConversationView)
async def get_conversation(phone: str) -> ConversationView:
    normalized = normalize_msisdn(phone) or phone
    turns = repo.get_history(normalized, limit=50)
    return ConversationView(
        phone=normalized,
        turns=[AdvisoryTurn(**t) for t in turns],
    )
