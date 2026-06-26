"""Neo4j driver wrapper. Degrades gracefully: if no password is configured or
the database is unreachable, `enabled` is False and the service derives graph
features from the form instead, so the API still works end-to-end without Neo4j.
"""
from __future__ import annotations

import threading
from typing import Any, Optional

from app.config import get_settings


class GraphClient:
    _instance: Optional["GraphClient"] = None
    _lock = threading.Lock()

    def __init__(self) -> None:
        self.settings = get_settings()
        self._driver = None
        self.enabled = False
        self.last_error: Optional[str] = None
        if self.settings.neo4j_enabled:
            self._connect()

    @classmethod
    def instance(cls) -> "GraphClient":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def _connect(self) -> None:
        try:
            from neo4j import GraphDatabase

            self._driver = GraphDatabase.driver(
                self.settings.neo4j_uri,
                auth=(self.settings.neo4j_user, self.settings.neo4j_password),
            )
            self._driver.verify_connectivity()
            self.enabled = True
            self.ensure_constraints()
        except Exception as exc:
            self.last_error = str(exc)
            self.enabled = False
            self._driver = None

    def ensure_constraints(self) -> None:
        constraints = [
            "CREATE CONSTRAINT farmer_id IF NOT EXISTS FOR (f:Farmer) REQUIRE f.id IS UNIQUE",
            "CREATE CONSTRAINT coop_name IF NOT EXISTS FOR (c:Cooperative) REQUIRE c.name IS UNIQUE",
            "CREATE CONSTRAINT sacco_name IF NOT EXISTS FOR (s:Sacco) REQUIRE s.name IS UNIQUE",
            "CREATE CONSTRAINT county_name IF NOT EXISTS FOR (c:County) REQUIRE c.name IS UNIQUE",
            "CREATE CONSTRAINT crop_name IF NOT EXISTS FOR (c:Crop) REQUIRE c.name IS UNIQUE",
        ]
        with self._driver.session(database=self.settings.neo4j_database) as session:
            for stmt in constraints:
                session.run(stmt)

    def run(self, query: str, **params: Any) -> list[dict]:
        if not self.enabled:
            return []
        with self._driver.session(database=self.settings.neo4j_database) as session:
            return [r.data() for r in session.run(query, **params)]

    def close(self) -> None:
        if self._driver is not None:
            self._driver.close()
