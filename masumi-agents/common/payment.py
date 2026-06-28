"""Masumi payment integration with a local mock fallback.

In production (PAYMENT_API_KEY set) this uses the Masumi Payment Service via the
`masumi` SDK: a job is only executed after on-chain payment is confirmed, and the
result hash is written back to settle the escrow.

With no key configured it uses an in-memory MockPaymentProvider that simulates the
same lifecycle (awaiting_payment -> paid) so the full MIP-003 flow is demoable
offline. Both expose the same interface, so the agent code is identical.
"""
from __future__ import annotations

import hashlib
import time
import uuid
from typing import Any, Optional, Protocol

from common.config import Settings


def hash_payload(payload: Any) -> str:
    import json

    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()


class PaymentProvider(Protocol):
    async def create_payment(self, identifier_from_purchaser: str, input_data: dict) -> dict: ...
    async def is_paid(self, blockchain_identifier: str) -> bool: ...
    async def complete(self, blockchain_identifier: str, result_hash: str) -> None: ...
    @property
    def mode(self) -> str: ...


# ── Mock (offline/demo) ──────────────────────────────────────────────────────
class MockPaymentProvider:
    """Simulates the Masumi escrow lifecycle in-memory. Auto-confirms a payment a
    couple of seconds after it is requested so the agent demo runs end-to-end."""

    def __init__(self, price_lovelace: int, confirm_after_s: float = 2.0) -> None:
        self.price = price_lovelace
        self.confirm_after_s = confirm_after_s
        self._paid_at: dict[str, float] = {}

    @property
    def mode(self) -> str:
        return "mock"

    async def create_payment(self, identifier_from_purchaser: str, input_data: dict) -> dict:
        bid = "mock_" + uuid.uuid4().hex
        now = int(time.time())
        self._paid_at[bid] = time.time() + self.confirm_after_s
        return {
            "blockchainIdentifier": bid,
            "payByTime": now + 600,
            "submitResultTime": now + 1200,
            "unlockTime": now + 1800,
            "externalDisputeUnlockTime": now + 3600,
            "amountLovelace": self.price,
        }

    async def is_paid(self, blockchain_identifier: str) -> bool:
        due = self._paid_at.get(blockchain_identifier)
        return due is not None and time.time() >= due

    async def complete(self, blockchain_identifier: str, result_hash: str) -> None:
        self._paid_at.pop(blockchain_identifier, None)


# ── Masumi (production) ──────────────────────────────────────────────────────
class MasumiPaymentProvider:
    """Wraps the `masumi` SDK Payment client (one instance per agent)."""

    def __init__(self, settings: Settings, agent_identifier: str, price_lovelace: int) -> None:
        from masumi.config import Config
        from masumi.payment import Payment, Amount  # noqa: F401

        self._Payment = Payment
        self._Amount = Amount
        self._config = Config(
            payment_service_url=settings.payment_service_url,
            payment_api_key=settings.payment_api_key,
        )
        self.agent_identifier = agent_identifier
        self.network = settings.network
        self.price = price_lovelace
        self._payments: dict[str, Any] = {}  # blockchainIdentifier -> Payment instance

    @property
    def mode(self) -> str:
        return "masumi"

    async def create_payment(self, identifier_from_purchaser: str, input_data: dict) -> dict:
        payment = self._Payment(
            agent_identifier=self.agent_identifier,
            config=self._config,
            identifier_from_purchaser=identifier_from_purchaser,
            input_data=input_data,
            network=self.network,
        )
        res = await payment.create_payment_request()
        data = res.get("data", res)
        bid = data["blockchainIdentifier"]
        self._payments[bid] = payment
        data.setdefault("amountLovelace", self.price)
        return data

    async def is_paid(self, blockchain_identifier: str) -> bool:
        payment = self._payments.get(blockchain_identifier)
        if payment is None:
            return False
        status = await payment.check_payment_status()
        state = (status or {}).get("data", status) or {}
        return str(state.get("status", "")).lower() in {"funded", "paid", "confirmed", "completed"}

    async def complete(self, blockchain_identifier: str, result_hash: str) -> None:
        payment = self._payments.get(blockchain_identifier)
        if payment is not None:
            await payment.complete_payment(blockchain_identifier, result_hash)


def build_provider(settings: Settings, agent_identifier: str, price_lovelace: int) -> PaymentProvider:
    if settings.masumi_enabled and agent_identifier:
        try:
            return MasumiPaymentProvider(settings, agent_identifier, price_lovelace)
        except Exception as exc:  # SDK missing / misconfigured → safe fallback
            print(f"[payment] Masumi unavailable, using mock: {exc}")
    return MockPaymentProvider(price_lovelace)
