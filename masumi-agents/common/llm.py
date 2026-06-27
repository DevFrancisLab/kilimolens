"""Gemini-backed explanation helper. Every report explains WHY — never just a
number. Falls back to a deterministic template when no key is configured."""
from __future__ import annotations

from typing import Any

from common.config import get_settings


def explain(system: str, prompt: str, fallback: str) -> str:
    settings = get_settings()
    if not settings.gemini_enabled:
        return fallback
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import HumanMessage, SystemMessage

        llm = ChatOpenAI(
            model=settings.gemini_model,
            api_key=settings.gemini_api_key,
            base_url=settings.gemini_base_url,
            temperature=0.3,
            timeout=40,
        )
        out = llm.invoke([SystemMessage(content=system), HumanMessage(content=prompt)]).content
        return (out or "").strip() or fallback
    except Exception as exc:  # network/dep failure
        print(f"[llm] explanation fallback: {exc}")
        return fallback
