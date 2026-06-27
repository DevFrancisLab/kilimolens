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
