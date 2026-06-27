"""Phone-number (MSISDN) normalisation for Kenyan numbers.

Africa's Talking delivers numbers in ``+2547XXXXXXXX`` form, but farmers and
internal callers may supply ``07XXXXXXXX``, ``7XXXXXXXX`` or ``2547XXXXXXXX``.
We normalise to E.164 (``+254...``) so a farmer is matched to the same identity
across the dashboard, USSD and SMS.
"""
from __future__ import annotations

import re

_DEFAULT_COUNTRY_CODE = "254"


def normalize_msisdn(raw: str, country_code: str = _DEFAULT_COUNTRY_CODE) -> str:
    """Return the number in ``+<country><subscriber>`` form.

    Falls back to the cleaned digits (prefixed with ``+``) for non-Kenyan or
    unexpected inputs rather than raising, so callbacks never 500 on a quirky
    number.
    """
    if not raw:
        return ""
    digits = re.sub(r"[^\d+]", "", str(raw).strip())
    if digits.startswith("+"):
        return "+" + re.sub(r"\D", "", digits)

    digits = re.sub(r"\D", "", digits)
    if not digits:
        return ""
    if digits.startswith("00"):
        return "+" + digits[2:]
    if digits.startswith(country_code):
        return "+" + digits
    if digits.startswith("0"):
        return "+" + country_code + digits[1:]
    if len(digits) == 9:  # bare subscriber number, e.g. 712345678
        return "+" + country_code + digits
    return "+" + digits


def mask_msisdn(msisdn: str) -> str:
    """Mask the middle digits for safe logging (``+2547****5678``)."""
    if not msisdn or len(msisdn) < 8:
        return msisdn or ""
    return msisdn[:5] + "****" + msisdn[-4:]
