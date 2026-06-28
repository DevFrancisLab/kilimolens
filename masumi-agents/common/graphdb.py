"""Read-only Neo4j access to the KilimoLens knowledge graph (the agents' data
substrate). Degrades to empty results when Neo4j is not configured, so report
generation always produces output (with a lowered confidence level)."""
from __future__ import annotations

import threading
from typing import Any, Optional

from common.config import get_settings


class GraphReader:
    _instance: Optional["GraphReader"] = None
    _lock = threading.Lock()

    def __init__(self) -> None:
        self.settings = get_settings()
        self._driver = None
        self.enabled = False
        if self.settings.neo4j_enabled:
            try:
                from neo4j import GraphDatabase

                self._driver = GraphDatabase.driver(
                    self.settings.neo4j_uri,
                    auth=(self.settings.neo4j_user, self.settings.neo4j_password),
                )
                self._driver.verify_connectivity()
                self.enabled = True
            except Exception as exc:
                print(f"[graphdb] Neo4j unavailable: {exc}")

    @classmethod
    def instance(cls) -> "GraphReader":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def run(self, query: str, **params: Any) -> list[dict]:
        if not self.enabled:
            return []
        with self._driver.session(database=self.settings.neo4j_database) as session:
            return [r.data() for r in session.run(query, **params)]
