"""Africa's Talking SMS client.

Talks to the Africa's Talking SMS REST API directly with ``httpx`` (already a
project dependency) — no extra SDK. Credentials come from the environment via
:class:`app.config.Settings`; nothing is hardcoded.

Degrades gracefully, in keeping with the rest of KilimoLens: if no API key is
configured the send is skipped (and logged) rather than raising, so USSD/SMS
flows keep working in development.
"""
from __future__ import annotations

import logging

import httpx
from fastapi import Depends

from app.config import Settings, get_settings
from app.crud import messaging as crud
from app.schemas import SmsResult
from app.utils.phone import mask_msisdn, normalize_msisdn
from app.utils.sms_text import clamp_sms

logger = logging.getLogger("kilimolens.sms")


class AfricasTalkingClient:
    """Reusable async client for the Africa's Talking SMS REST API.

    Credentials come from the existing :class:`app.config.Settings`
    (``AT_USERNAME`` / ``AT_API_KEY`` / ``AT_SENDER_ID``) — no separate config.

    Every send is non-throwing: it always returns a structured :class:`SmsResult`
    and records the attempt (DB log + structured app log), so a caller such as the
    USSD loan-application flow is never broken by an SMS failure.
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def send_sms(self, to: str, message: str) -> SmsResult:
        """Normalise the recipient, send one SMS, and return a structured result.

        Never raises — Africa's Talking / network errors are caught, logged and
        returned as ``status="failed"``.
        """
        recipient = normalize_msisdn(to)
        body = clamp_sms(message)

        # Guard rails: invalid number or SMS not configured -> skip, don't raise.
        if not recipient:
            return self._record(to or "", body, "failed", detail="invalid recipient")
        if not self.settings.sms_enabled:
            return self._record(recipient, body, "skipped", detail="AT_API_KEY not configured")

        data = {
            "username": self.settings.at_username,
            "to": recipient,
            "message": body,
        }
        if self.settings.at_sender_id.strip():
            data["from"] = self.settings.at_sender_id.strip()

        headers = {
            "apiKey": self.settings.at_api_key,
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
        }

        try:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(self.settings.at_sms_url, data=data, headers=headers)
                resp.raise_for_status()
                payload = resp.json()
        except httpx.HTTPStatusError as exc:  # non-2xx from Africa's Talking
            detail = f"HTTP {exc.response.status_code}: {exc.response.text[:200]}"
            return self._record(recipient, body, "failed", detail=detail)
        except httpx.HTTPError as exc:  # timeout / connection / transport errors
            return self._record(recipient, body, "failed", detail=f"transport error: {exc}"[:300])
        except ValueError as exc:  # invalid JSON in the response
            return self._record(recipient, body, "failed", detail=f"bad response: {exc}"[:300])
        except Exception as exc:  # pragma: no cover - last-resort safety net
            return self._record(recipient, body, "failed", detail=f"unexpected: {exc}"[:300])

        recipients = (payload.get("SMSMessageData", {}) or {}).get("Recipients", []) or []
        first = recipients[0] if recipients else {}
        status_text = str(first.get("status", "")) or "Submitted"
        message_id = first.get("messageId") or None
        cost = first.get("cost") or None
        ok = status_text.lower() in {"success", "submitted"} or message_id is not None

        return self._record(
            recipient,
            body,
            "sent" if ok else "failed",
            detail=status_text,
            message_id=message_id,
            cost=cost,
        )

    def _record(
        self,
        recipient: str,
        body: str,
        status: str,
        *,
        detail: str,
        message_id: str | None = None,
        cost: str | None = None,
    ) -> SmsResult:
        """Persist the attempt (DB + structured app log) and return a SmsResult."""
        crud.log_sms(
            "outbound",
            recipient,
            body,
            status,
            provider_id=message_id,
            cost=cost,
            failure_reason=None if status == "sent" else detail,
        )
        log_fields = {
            "to": mask_msisdn(recipient),
            "status": status,
            "messageId": message_id,
            "cost": cost,
            "detail": detail,
        }
        if status == "sent":
            logger.info("sms.sent", extra={"sms": log_fields})
        elif status == "skipped":
            logger.warning("sms.skipped", extra={"sms": log_fields})
        else:
            logger.error("sms.failed", extra={"sms": log_fields})
        return SmsResult(
            status=status, to=recipient, messageId=message_id, cost=cost, detail=detail
        )


def get_sms_client(settings: Settings = Depends(get_settings)) -> AfricasTalkingClient:
    """FastAPI dependency provider for the reusable SMS client.

    Use with ``Depends(get_sms_client)``. The settings come from the existing
    ``get_settings`` singleton (nested dependency injection) so there is exactly
    one configuration source — no separate SMS config.
    """
    return AfricasTalkingClient(settings)
