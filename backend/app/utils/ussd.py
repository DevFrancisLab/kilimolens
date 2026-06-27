"""USSD protocol helpers for Africa's Talking.

A USSD response is plain text whose first token is the control word:
  * ``CON`` — keep the session open and wait for the next input.
  * ``END`` — terminate the session and show this final screen.

See the Africa's Talking USSD docs (the Django reference uses the same
``CON``/``END`` contract).
"""
from __future__ import annotations

from starlette.responses import PlainTextResponse
from starlette.background import BackgroundTask


def con(body: str, background: BackgroundTask | None = None) -> PlainTextResponse:
    """Continue the session: prompt the user for more input."""
    return PlainTextResponse(f"CON {body}", background=background)


def end(body: str, background: BackgroundTask | None = None) -> PlainTextResponse:
    """End the session with a final message (optionally firing a background task,
    e.g. sending a confirmation SMS, after the response is flushed)."""
    return PlainTextResponse(f"END {body}", background=background)


def parse_steps(text: str) -> list[str]:
    """Split the cumulative Africa's Talking ``text`` into individual answers.

    Empty string (first dial) -> ``[]``. Trailing/empty segments are preserved
    as ``""`` so the engine can tell "no answer yet" from "blank answer".
    """
    if text is None or text == "":
        return []
    return text.split("*")
