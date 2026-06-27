"""SMS endpoints for Africa's Talking.

  * ``POST /api/sms/inbound``  — inbound SMS callback (farmer texts the shortcode).
                                 Recognises a few keywords and auto-replies.
  * ``POST /api/sms/delivery`` — delivery-report callback; updates the SMS log.
  * ``POST /api/sms/notify``   — guarded internal endpoint to push a farmer their
                                 latest result by SMS (requires X-API-Token).

Configure the inbound/delivery URLs in the Africa's Talking dashboard.
"""
from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, Form, Header, HTTPException

from app.config import Settings, get_settings
from app.crud import messaging as crud
from app.schemas import SmsResult
from app.services.africas_talking import AfricasTalkingClient, get_sms_client
from app.utils.phone import normalize_msisdn

router = APIRouter(prefix="/sms", tags=["sms"])

# Keyword → (canonical intent, language).
_KEYWORDS = {
    "score": ("score", "en"),
    "alama": ("score", "sw"),
    "help": ("tips", "en"),
    "tips": ("tips", "en"),
    "msaada": ("tips", "sw"),
}

_TIPS = {
    "en": (
        "KilimoLens tips: repay loans on time, save regularly via mobile money, "
        "join a cooperative, and grow drought-resistant crops. Dial the USSD code "
        "to apply or check your score."
    ),
    "sw": (
        "Vidokezo vya KilimoLens: lipa mikopo kwa wakati, weka akiba kwa pesa za "
        "simu, jiunge na ushirika, na panda mazao yanayostahimili ukame. Piga "
        "namba ya USSD kuomba au kuangalia alama yako."
    ),
}

_UNKNOWN = {
    "en": "KilimoLens: reply SCORE for your latest result or HELP for tips, or dial our USSD code.",
    "sw": "KilimoLens: jibu ALAMA kupata matokeo yako au MSAADA kwa vidokezo, au piga namba yetu ya USSD.",
}


def _reply_for(text: str, phone: str) -> str:
    """Build the auto-reply for an inbound SMS based on its first keyword."""
    keyword = (text or "").strip().split()[0].lower() if (text or "").strip() else ""
    intent, lang = _KEYWORDS.get(keyword, ("unknown", "en"))

    if intent == "tips":
        return _TIPS[lang]
    if intent == "score":
        latest = crud.get_latest_assessment_by_phone(phone)
        if not latest:
            return _UNKNOWN[lang]
        explanation = (latest.get("result") or {}).get("explanation", {}) or {}
        key = "farmerMessageSw" if lang == "sw" else "farmerMessage"
        return explanation.get(key) or explanation.get("farmerMessage") or _UNKNOWN[lang]
    return _UNKNOWN["en"]


@router.post("/inbound")
async def inbound_sms(
    background: BackgroundTasks,
    from_: str = Form(..., alias="from"),
    to: str = Form(""),
    text: str = Form(""),
    date: str = Form(""),
    id: str = Form(""),
    linkId: str = Form(""),
    sms_client: AfricasTalkingClient = Depends(get_sms_client),
) -> dict:
    phone = normalize_msisdn(from_)
    crud.log_sms("inbound", phone, text, "received", provider_id=id or None)
    reply = _reply_for(text, phone)
    background.add_task(sms_client.send_sms, phone, reply)
    return {"status": "ok"}


@router.post("/delivery")
async def delivery_report(
    id: str = Form(""),
    status: str = Form(""),
    phoneNumber: str = Form(""),
    failureReason: str = Form(""),
) -> dict:
    crud.update_delivery(id, status, failureReason)
    return {"status": "ok"}


def _require_internal_token(
    x_api_token: str = Header(default=""),
    settings: Settings = Depends(get_settings),
) -> None:
    """Guard the notify endpoint with a shared secret from the environment."""
    if not settings.internal_api_token:
        raise HTTPException(status_code=503, detail="Notify endpoint disabled (INTERNAL_API_TOKEN unset)")
    if x_api_token != settings.internal_api_token:
        raise HTTPException(status_code=401, detail="Invalid API token")


@router.post("/notify", response_model=SmsResult, dependencies=[Depends(_require_internal_token)])
async def notify(
    phoneNumber: str = Form(...),
    message: str = Form(""),
    language: str = Form("en"),
    sms_client: AfricasTalkingClient = Depends(get_sms_client),
) -> SmsResult:
    phone = normalize_msisdn(phoneNumber)
    body = message.strip()
    if not body:
        latest = crud.get_latest_assessment_by_phone(phone)
        if not latest:
            raise HTTPException(status_code=404, detail="No assessment found for this number")
        explanation = (latest.get("result") or {}).get("explanation", {}) or {}
        key = "farmerMessageSw" if language == "sw" else "farmerMessage"
        body = explanation.get(key) or explanation.get("farmerMessage") or ""
    if not body:
        raise HTTPException(status_code=422, detail="No message to send")
    return await sms_client.send_sms(phone, body)
