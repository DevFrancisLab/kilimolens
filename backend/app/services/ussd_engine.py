"""USSD menu engine for KilimoLens financing requests (Africa's Talking).

A farmer with any phone — no smartphone, no internet — dials the USSD code,
picks a language, requests financing (selecting one or more needs and an
estimated amount) and receives an application reference on screen. No personal
identifiers are collected over USSD; the National ID, name, county, farm size,
GPS, livestock counts, photos and cooperative details are gathered later by the
loan officer during the farm visit.

The phone number is supplied by Africa's Talking on every request — the farmer
is never asked to type it.

Navigation is stateless: the current screen is derived from the cumulative
``text`` Africa's Talking sends (answers joined by ``*``). Each session and each
submitted application is persisted.
"""
from __future__ import annotations

import sqlite3
import uuid
from typing import Optional

from starlette.background import BackgroundTask
from starlette.concurrency import run_in_threadpool
from starlette.responses import PlainTextResponse

from app import store
from app.config import get_settings
from app.crud import messaging as crud
from app.graph.repository import GraphRepository
from app.schemas import UssdRequest
from app.services.africas_talking import AfricasTalkingClient
from app.utils.phone import normalize_msisdn
from app.utils.ussd import con, end, parse_steps

PRODUCT_NAME = "KilimoLens"

# Languages selectable from the top menu (1/2) and the "Local Language" submenu.
LOCAL_LANGUAGES = {"1": "kik", "2": "kam", "3": "luo", "4": "kal", "5": "luh"}
LOCAL_LANGUAGE_MENU = "Choose Language\n1. Kikuyu\n2. Kamba\n3. Luo\n4. Kalenjin\n5. Luhya"

# Readable names stored as the loan application's "Preferred Language".
LANGUAGE_NAMES = {
    "en": "English",
    "sw": "Kiswahili",
    "kik": "Kikuyu",
    "kam": "Kamba",
    "luo": "Luo",
    "kal": "Kalenjin",
    "luh": "Luhya",
}

# Until reviewed by native speakers, the local-language selection is recorded on
# the application (so the loan officer knows the farmer's preference) and screens
# are rendered in Kiswahili, which is widely understood across these communities.
_DISPLAY_FALLBACK = {"kik": "sw", "kam": "sw", "luo": "sw", "kal": "sw", "luh": "sw"}

# Financing needs (multi-select). Order defines the on-screen numbering.
FINANCING_OPTIONS = [
    "Seeds",
    "Fertilizer",
    "Irrigation",
    "Livestock",
    "Farm Equipment",
    "Other",
]

_DEFAULT_STATUS = "Pending Assessment"

# ── localised copy (en / sw) ─────────────────────────────────────────────────
MESSAGES = {
    "en": {
        "main": "Main Menu\n1. Request Financing\n2. Check Application Status\n3. Help",
        "needs": (
            "Request Financing\n"
            "Select your financing needs.\n"
            "Enter one or more, e.g. 1,2,5\n"
            "1. Seeds\n2. Fertilizer\n3. Irrigation\n"
            "4. Livestock\n5. Farm Equipment\n6. Other"
        ),
        "amount": "Enter the estimated financing amount (KES):",
        "confirm": (
            "Your request has been received.\n"
            "Items: {items}\n"
            "Estimated Amount: KES {amount}\n"
            "Reference: {ref}\n"
            "A loan officer will contact you within 48 hours."
        ),
        "status_found": (
            "Application {ref}\n"
            "Items: {items}\n"
            "Amount: KES {amount}\n"
            "Status: {status}\n"
            "Submitted: {date}"
        ),
        "status_none": "No applications found for this number. Choose Request Financing to apply.",
        "sms_confirm": (
            "{product}\n"
            "Your financing request has been received.\n"
            "Reference: {ref}\n"
            "Requested: {items}\n"
            "Estimated Amount: KES {amount}\n"
            "A loan officer will contact you within 48 hours.\n"
            "Thank you."
        ),
        "help": (
            f"{PRODUCT_NAME}: Dial this code, choose Request Financing, pick your needs "
            "and amount. A loan officer will visit to complete your application. "
            "No ID or documents needed now."
        ),
        "invalid": "Invalid entry. Please dial the code again.",
    },
    "sw": {
        "main": "Menyu Kuu\n1. Omba Ufadhili\n2. Angalia Hali ya Ombi\n3. Msaada",
        "needs": (
            "Omba Ufadhili\n"
            "Chagua mahitaji yako ya ufadhili.\n"
            "Weka moja au zaidi, mfano 1,2,5\n"
            "1. Mbegu\n2. Mbolea\n3. Umwagiliaji\n"
            "4. Mifugo\n5. Vifaa vya Shamba\n6. Nyingine"
        ),
        "amount": "Weka kiasi cha ufadhili unachokadiria (KES):",
        "confirm": (
            "Ombi lako limepokelewa.\n"
            "Bidhaa: {items}\n"
            "Kiasi Kinachokadiriwa: KES {amount}\n"
            "Kumbukumbu: {ref}\n"
            "Afisa wa mkopo atawasiliana nawe ndani ya saa 48."
        ),
        "status_found": (
            "Ombi {ref}\n"
            "Bidhaa: {items}\n"
            "Kiasi: KES {amount}\n"
            "Hali: {status}\n"
            "Tarehe: {date}"
        ),
        "status_none": "Hakuna maombi ya nambari hii. Chagua Omba Ufadhili kuanza.",
        "sms_confirm": (
            "{product}\n"
            "Ombi lako la ufadhili limepokelewa.\n"
            "Kumbukumbu: {ref}\n"
            "Umeomba: {items}\n"
            "Kiasi Kinachokadiriwa: KES {amount}\n"
            "Afisa wa mkopo atawasiliana nawe ndani ya saa 48.\n"
            "Asante."
        ),
        "help": (
            f"{PRODUCT_NAME}: Piga namba hii, chagua Omba Ufadhili, chagua mahitaji na "
            "kiasi. Afisa wa mkopo atakutembelea kukamilisha ombi. Hauhitaji kitambulisho "
            "au nyaraka sasa."
        ),
        "invalid": "Ingizo si sahihi. Tafadhali piga namba tena.",
    },
}

# Localised labels for the selected financing items (for confirmation screens).
_ITEM_LABELS = {
    "en": FINANCING_OPTIONS,
    "sw": ["Mbegu", "Mbolea", "Umwagiliaji", "Mifugo", "Vifaa vya Shamba", "Nyingine"],
}


def _display_lang(lang: str) -> str:
    """Map a stored language to the language its screens are rendered in."""
    return _DISPLAY_FALLBACK.get(lang, lang if lang in MESSAGES else "en")


def t(lang: str, key: str) -> str:
    return MESSAGES[_display_lang(lang)][key]


# ── language resolution ──────────────────────────────────────────────────────
def _resolve_language(steps: list[str]) -> tuple[Optional[str], int, Optional[PlainTextResponse]]:
    """Resolve the chosen language from the leading steps.

    Returns ``(language, steps_consumed, screen)``. When ``screen`` is not None
    it must be returned immediately (a language prompt or an error). When
    ``language`` is set, ``steps_consumed`` tells the caller how many leading
    steps were language selection.
    """
    if not steps:
        welcome = (
            f"Welcome to {PRODUCT_NAME}\n"
            "Choose Language\n"
            "1. English\n2. Kiswahili\n3. Local Language"
        )
        return None, 0, con(welcome)

    first = steps[0].strip()
    if first == "1":
        return "en", 1, None
    if first == "2":
        return "sw", 1, None
    if first == "3":
        if len(steps) < 2:
            return None, 0, con(LOCAL_LANGUAGE_MENU)
        local = LOCAL_LANGUAGES.get(steps[1].strip())
        if local is None:
            return None, 0, end(MESSAGES["en"]["invalid"])
        return local, 2, None
    return None, 0, end(MESSAGES["en"]["invalid"])


# ── financing-needs parsing ──────────────────────────────────────────────────
def _parse_needs(raw: str) -> Optional[list[int]]:
    """Parse a multi-select answer like ``"1,2,5"`` into validated 1-based indices.

    Accepts comma, space or ``*``-free separators. Returns ``None`` if nothing
    valid was supplied (caller shows the invalid screen)."""
    tokens = [tok for tok in raw.replace(" ", ",").replace(";", ",").split(",") if tok.strip()]
    indices: list[int] = []
    for tok in tokens:
        if not tok.strip().isdigit():
            return None
        idx = int(tok.strip())
        if not 1 <= idx <= len(FINANCING_OPTIONS):
            return None
        if idx not in indices:
            indices.append(idx)
    return indices or None


def _to_amount(raw: str) -> Optional[float]:
    try:
        s = str(raw or "").replace(",", "").strip()
        if not s.isdigit():  # numeric only, whole shillings
            return None
        val = float(s)
        return val if val > 0 else None
    except (ValueError, TypeError):
        return None


def _new_reference() -> str:
    return "RF-" + uuid.uuid4().hex[:8].upper()


def _sms_background(
    sms_client: AfricasTalkingClient, phone: str, message: str
) -> Optional[BackgroundTask]:
    if not get_settings().sms_enabled or not message:
        return None
    return BackgroundTask(sms_client.send_sms, phone, message)


# ── public entry point ───────────────────────────────────────────────────────
async def handle(req: UssdRequest, sms_client: AfricasTalkingClient) -> PlainTextResponse:
    settings = get_settings()
    phone = normalize_msisdn(req.phoneNumber)
    steps = parse_steps(req.text)

    lang, consumed, screen = _resolve_language(steps)
    if screen is not None:
        crud.upsert_session(req.sessionId, phone, req.text, settings.at_ussd_default_language)
        return screen

    crud.upsert_session(req.sessionId, phone, req.text, lang)
    rest = steps[consumed:]

    # Main menu.
    if not rest:
        return con(t(lang, "main"))

    choice = rest[0].strip()
    answers = rest[1:]

    if choice == "1":
        return await _request_financing(req, lang, phone, answers, sms_client)
    if choice == "2":
        return await _check_status(req, lang, phone)
    if choice == "3":
        return end(t(lang, "help"))
    return end(t(lang, "invalid"))


async def _request_financing(
    req: UssdRequest,
    lang: str,
    phone: str,
    answers: list[str],
    sms_client: AfricasTalkingClient,
) -> PlainTextResponse:
    # Screen 1: select needs (multi).
    if len(answers) == 0:
        return con(t(lang, "needs"))

    needs = _parse_needs(answers[0])
    if needs is None:
        crud.complete_session(req.sessionId, None, None, None, status="abandoned")
        return end(t(lang, "invalid"))

    # Screen 2: estimated amount.
    if len(answers) == 1:
        return con(t(lang, "amount"))

    amount = _to_amount(answers[1])
    if amount is None:
        crud.complete_session(req.sessionId, None, None, None, status="abandoned")
        return end(t(lang, "invalid"))

    # Screen 3: persist + confirm.
    # English labels are the canonical "Requested Financing Categories" stored on
    # the loan application, regardless of the farmer's display language.
    categories = [_ITEM_LABELS["en"][i - 1] for i in needs]
    display_labels = ", ".join(_ITEM_LABELS[_display_lang(lang)][i - 1] for i in needs)

    reference = await run_in_threadpool(_create_loan_application, phone, lang, categories, amount)
    crud.complete_session(req.sessionId, reference, None, None, status="completed")

    body = t(lang, "confirm").format(items=display_labels, amount=f"{int(amount):,}", ref=reference)
    # Confirmation SMS in the farmer's language. Sent as a background task after
    # the application is already persisted, so SMS never blocks or fails the
    # loan application (see _sms_background / AfricasTalkingClient.send_sms).
    sms_text = t(lang, "sms_confirm").format(
        product=PRODUCT_NAME,
        ref=reference,
        items=display_labels,
        amount=f"{int(amount):,}",
    )
    return end(body, background=_sms_background(sms_client, phone, sms_text))


def _create_loan_application(
    phone: str, lang: str, categories: list[str], amount: float
) -> str:
    """Create a new loan application in the existing module via the store service.

    Generates a unique reference (used as the application id), retrying on the
    (vanishingly rare) chance of a collision. Runs in a threadpool (blocking
    SQLite). A new application is created every time — never an update."""
    language_name = LANGUAGE_NAMES.get(lang, lang)
    saved = None
    for _ in range(5):
        reference = _new_reference()
        try:
            saved = store.save_loan_application(
                reference=reference,
                phone=phone,
                amount=amount,
                categories=categories,
                language=language_name,
                source="USSD",
                status=_DEFAULT_STATUS,
            )
            break
        except sqlite3.IntegrityError:  # duplicate reference — regenerate
            continue
    if saved is None:
        # Exhausted short references — fall back to a full-length unique reference.
        saved = store.save_loan_application(
            reference="RF-" + uuid.uuid4().hex.upper(),
            phone=phone,
            amount=amount,
            categories=categories,
            language=language_name,
            source="USSD",
            status=_DEFAULT_STATUS,
        )
    _mirror_to_graph(saved)
    return saved["reference"]


def _mirror_to_graph(saved: dict) -> None:
    """Mirror the loan application into Neo4j (the system of record) so it shows
    in the dashboard and survives an ephemeral SQLite reset. Non-fatal — USSD
    must never fail because the graph is unreachable."""
    try:
        repo = GraphRepository()
        if not repo.enabled:
            return
        payload = saved["requestPayload"]
        fid = repo.upsert_farmer(payload)
        result = {
            "creditReadinessScore": None,
            "confidenceScore": None,
            "recommendation": None,
            "modelVersion": "",
            **saved["resultPayload"],
        }
        meta = {"id": saved["reference"], "createdAt": saved["createdAt"], "status": saved["status"]}
        repo.record_assessment(fid, result, meta, payload)
    except Exception as exc:  # pragma: no cover - network/dep failures
        print(f"[ussd] graph mirror failed (non-fatal): {exc}")


def _latest_application(phone: str) -> Optional[dict]:
    """Most recent application for a phone — Neo4j first (durable), then the
    SQLite mirror (which may have been reset on an ephemeral host)."""
    repo = GraphRepository()
    if repo.enabled:
        try:
            app = repo.get_latest_application_by_phone(phone)
            if app:
                return app
        except Exception as exc:  # pragma: no cover - network failures
            print(f"[ussd] graph status lookup failed (non-fatal): {exc}")
    return crud.get_latest_assessment_by_phone(phone)


async def _check_status(req: UssdRequest, lang: str, phone: str) -> PlainTextResponse:
    app = await run_in_threadpool(_latest_application, phone)
    if not app:
        return end(t(lang, "status_none"))
    result = app.get("result") or {}
    categories = result.get("requestedCategories") or []
    items = ", ".join(categories) if categories else (result.get("applicationSource") or "-")
    amount = result.get("amountRequested") or 0
    body = t(lang, "status_found").format(
        ref=result.get("applicationReference") or app.get("id") or "-",
        items=items,
        amount=f"{int(amount):,}",
        status=app.get("status") or result.get("status") or "-",
        date=(app.get("createdAt") or "")[:10],
    )
    return end(body)
