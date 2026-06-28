"""Persistence for AI Advisory conversation threads.

Reuses the same SQLite database as :mod:`app.store` / :mod:`app.crud.messaging`
(one system of record) rather than introducing a new datastore. Stores a clean,
role-tagged conversation thread per farmer phone so the LLM can be given accurate
history and the dashboard can review advisory conversations.

Methods are synchronous (SQLite); the async service calls them via a threadpool
so the event loop is never blocked.
"""
from __future__ import annotations

from typing import Any

from app import store

# Conversation roles.
ROLE_FARMER = "farmer"
ROLE_ADVISOR = "advisor"


def init_advisory_db() -> None:
    """Create the advisory conversation table if it does not exist."""
    with store._LOCK, store._connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS advisory_messages (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              phone TEXT NOT NULL,
              role TEXT NOT NULL,            -- 'farmer' | 'advisor'
              message TEXT NOT NULL,
              provider_id TEXT,
              assessment_id TEXT,
              created_at TEXT
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_advisory_phone ON advisory_messages(phone)")


def add_message(
    phone: str,
    role: str,
    message: str,
    provider_id: str | None = None,
    assessment_id: str | None = None,
) -> None:
    with store._LOCK, store._connect() as conn:
        conn.execute(
            """
            INSERT INTO advisory_messages
                (phone, role, message, provider_id, assessment_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (phone, role, message, provider_id, assessment_id, store._now_iso()),
        )


def get_history(phone: str, limit: int = 12) -> list[dict[str, Any]]:
    """Return the most recent turns for a phone in chronological order.

    Matches on the last 9 subscriber digits so the thread is found regardless of
    how the number was formatted (07.. / 2547.. / +2547..)."""
    tail = "".join(c for c in (phone or "") if c.isdigit())[-9:]
    if not tail:
        return []
    with store._LOCK, store._connect() as conn:
        rows = conn.execute(
            """
            SELECT role, message, created_at FROM advisory_messages
            WHERE replace(replace(phone, '+', ''), ' ', '') LIKE ?
            ORDER BY id DESC LIMIT ?
            """,
            (f"%{tail}", limit),
        ).fetchall()
    return [dict(r) for r in reversed(rows)]


def conversation_count(phone: str) -> int:
    tail = "".join(c for c in (phone or "") if c.isdigit())[-9:]
    if not tail:
        return 0
    with store._LOCK, store._connect() as conn:
        r = conn.execute(
            "SELECT COUNT(*) AS n FROM advisory_messages "
            "WHERE replace(replace(phone, '+', ''), ' ', '') LIKE ?",
            (f"%{tail}",),
        ).fetchone()
    return int(r["n"]) if r else 0
