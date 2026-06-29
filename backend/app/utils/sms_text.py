"""Helpers for shaping outbound SMS text."""
from __future__ import annotations

# A single GSM-7 SMS part is 160 chars; Africa's Talking concatenates longer
# messages (billed per part). We cap at a sensible multi-part length.
_MAX_SMS_LEN = 459  # 3 concatenated parts (153 chars each)


def clamp_sms(message: str, max_len: int = _MAX_SMS_LEN) -> str:
    """Trim a message to a safe SMS length, ending on a word boundary."""
    message = " ".join((message or "").split())
    if len(message) <= max_len:
        return message
    trimmed = message[: max_len - 1]
    if " " in trimmed:
        trimmed = trimmed[: trimmed.rfind(" ")]
    return trimmed.rstrip(".,; ") + "…"


def strip_keyword(text: str, keyword: str) -> str:
    """Remove a leading shortcode keyword from an inbound SMS.

    Africa's Talking delivers shortcode messages with the registered keyword as a
    prefix (e.g. "Test11 how do I improve?"). We strip it (case-insensitive, with
    an optional separator) so the conversation logic / LLM only sees the farmer's
    actual message. Returns the original text if the keyword isn't present.
    """
    text = (text or "").strip()
    kw = (keyword or "").strip()
    if not kw:
        return text
    if text.lower().startswith(kw.lower()):
        # drop the keyword and any separators after it (may leave an empty string
        # when the farmer texts only the keyword to start the conversation)
        return text[len(kw):].lstrip(" :,-\t").strip()
    return text
