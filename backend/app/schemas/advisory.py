"""Schemas for the AI Advisory module."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class AdvisoryTurn(BaseModel):
    role: str  # "farmer" | "advisor"
    message: str
    created_at: Optional[str] = None


class WebhookAck(BaseModel):
    """Fast acknowledgement returned to Africa's Talking. The AI reply is sent
    asynchronously over SMS, so the webhook returns immediately."""

    status: str = "ok"


class ConversationView(BaseModel):
    """Conversation thread for the loan-officer dashboard."""

    phone: str
    farmerId: Optional[str] = None
    turns: list[AdvisoryTurn]
