"""Central configuration, loaded from environment / .env."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"), env_file_encoding="utf-8", extra="ignore"
    )

    # Neo4j
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = ""
    neo4j_database: str = "neo4j"

    # Gemini (Google) via the OpenAI-compatible endpoint.
    gemini_api_key: str = ""
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    gemini_model: str = "gemini-2.5-flash"

    # Africa's Talking (USSD + SMS). Read from the environment / .env — never
    # hardcode credentials. Leave AT_API_KEY blank to run with SMS disabled
    # (the API still works; outbound SMS is skipped and logged).
    at_username: str = "sandbox"
    at_api_key: str = ""
    at_sender_id: str = ""  # registered shortcode or alphanumeric sender id
    at_ussd_default_language: str = "en"  # "en" | "sw"

    # Optional shared secret guarding the internal "notify" SMS endpoint.
    # Leave blank to keep that endpoint disabled (returns 503).
    internal_api_token: str = ""

    # App
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    model_dir: str = "artifacts"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    # ── Africa's Talking helpers ────────────────────────────────────────────
    @property
    def at_is_sandbox(self) -> bool:
        return self.at_username.strip().lower() == "sandbox"

    @property
    def sms_enabled(self) -> bool:
        return bool(self.at_api_key.strip() and self.at_username.strip())

    @property
    def at_sms_url(self) -> str:
        host = "api.sandbox.africastalking.com" if self.at_is_sandbox else "api.africastalking.com"
        return f"https://{host}/version1/messaging"

    @property
    def model_path(self) -> Path:
        return BASE_DIR / self.model_dir / "model.json"

    @property
    def feature_meta_path(self) -> Path:
        return BASE_DIR / self.model_dir / "feature_meta.json"

    @property
    def neo4j_enabled(self) -> bool:
        return bool(self.neo4j_password)

    @property
    def gemini_enabled(self) -> bool:
        return bool(self.gemini_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
