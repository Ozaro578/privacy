"""Verlauf der erzeugten/hochgeladenen Shorts (verhindert doppelte Themen)."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from .config import STATE_DIR

HISTORY = STATE_DIR / "history.json"


def load_history() -> list[dict[str, Any]]:
    if HISTORY.exists():
        return json.loads(HISTORY.read_text(encoding="utf-8"))
    return []


def titles() -> list[str]:
    return [e.get("title", "") for e in load_history() if e.get("title")]


def add_entry(**fields: Any) -> None:
    hist = load_history()
    hist.append({"created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), **fields})
    HISTORY.write_text(json.dumps(hist, ensure_ascii=False, indent=2), encoding="utf-8")
