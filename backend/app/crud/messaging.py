"""Persistence for the USSD/SMS channels.

Reuses the same SQLite database as :mod:`app.store` (the dashboard's offline
system of record) rather than introducing a second store, so USSD sessions, SMS
logs and assessments live together and the dashboard can surface channel
activity. Tables are created idempotently at startup.
"""
from __future__ import annotations

import json
from typing import Any, Optional

from app import store

# ── schema ───────────────────────────────────────────────────────────────────
def init_messaging_db() -> None:
    """Create the USSD/SMS tables if they do not exist."""
    with store._LOCK, store._connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS ussd_sessions (
              session_id TEXT PRIMARY KEY,
              phone TEXT NOT NULL,
              language TEXT,
              text TEXT,
              status TEXT,            -- 'active' | 'completed' | 'abandoned'
              assessment_id TEXT,
              readiness INTEGER,
              recommendation TEXT,
              created_at TEXT,
              updated_at TEXT
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_ussd_phone ON ussd_sessions(phone)")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sms_messages (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              direction TEXT NOT NULL,   -- 'inbound' | 'outbound'
              phone TEXT NOT NULL,
              message TEXT,
              status TEXT,               -- 'sent' | 'skipped' | 'failed' | 'received' | 'Delivered' ...
              provider_id TEXT,
              cost TEXT,
              failure_reason TEXT,
              created_at TEXT
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_sms_phone ON sms_messages(phone)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_sms_provider ON sms_messages(provider_id)")


# ── USSD sessions ────────────────────────────────────────────────────────────
def upsert_session(session_id: str, phone: str, text: str, language: str) -> None:
    now = store._now_iso()
    with store._LOCK, store._connect() as conn:
        conn.execute(
            """
            INSERT INTO ussd_sessions
                (session_id, phone, language, text, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'active', ?, ?)
            ON CONFLICT(session_id) DO UPDATE SET
                text = excluded.text,
                language = excluded.language,
                updated_at = excluded.updated_at
            """,
            (session_id, phone, language, text, now, now),
        )


def complete_session(
    session_id: str,
    assessment_id: Optional[str],
    readiness: Optional[int],
    recommendation: Optional[str],
    status: str = "completed",
) -> None:
    with store._LOCK, store._connect() as conn:
        conn.execute(
            """
            UPDATE ussd_sessions
            SET status = ?, assessment_id = ?, readiness = ?, recommendation = ?,
                updated_at = ?
            WHERE session_id = ?
            """,
            (status, assessment_id, readiness, recommendation, store._now_iso(), session_id),
        )


def get_session(session_id: str) -> Optional[dict[str, Any]]:
    with store._LOCK, store._connect() as conn:
        r = conn.execute(
            "SELECT * FROM ussd_sessions WHERE session_id = ?", (session_id,)
        ).fetchone()
    return dict(r) if r else None


# ── SMS log ──────────────────────────────────────────────────────────────────
def log_sms(
    direction: str,
    phone: str,
    message: str,
    status: str,
    provider_id: Optional[str] = None,
    cost: Optional[str] = None,
    failure_reason: Optional[str] = None,
) -> None:
    with store._LOCK, store._connect() as conn:
        conn.execute(
            """
            INSERT INTO sms_messages
                (direction, phone, message, status, provider_id, cost, failure_reason, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (direction, phone, message, status, provider_id, cost, failure_reason, store._now_iso()),
        )


def update_delivery(provider_id: str, status: str, failure_reason: str = "") -> None:
    if not provider_id:
        return
    with store._LOCK, store._connect() as conn:
        conn.execute(
            "UPDATE sms_messages SET status = ?, failure_reason = ? WHERE provider_id = ?",
            (status, failure_reason or None, provider_id),
        )


# ── cross-channel lookups ────────────────────────────────────────────────────
def get_latest_assessment_by_phone(phone: str) -> Optional[dict[str, Any]]:
    """Most recent stored assessment for a phone number.

    Matches on the last 9 subscriber digits so a farmer is found regardless of
    whether their number was captured as ``07..``, ``2547..`` or ``+2547..``.
    Returns the parsed result payload plus summary fields, or ``None``.
    """
    tail = "".join(c for c in (phone or "") if c.isdigit())[-9:]
    if not tail:
        return None
    with store._LOCK, store._connect() as conn:
        r = conn.execute(
            """
            SELECT * FROM assessments
            WHERE replace(replace(phone, '+', ''), ' ', '') LIKE ?
            ORDER BY created_at DESC LIMIT 1
            """,
            (f"%{tail}",),
        ).fetchone()
    if not r:
        return None
    return {
        "id": r["id"],
        "farmerId": r["farmer_id"],
        "readiness": r["readiness"],
        "confidence": r["confidence"],
        "recommendation": r["recommendation"],
        "status": r["status"],
        "createdAt": r["created_at"],
        "result": json.loads(r["result_json"]),
    }
