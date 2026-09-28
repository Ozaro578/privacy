"""Laedt config.yaml und .env und stellt Pfade bereit."""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "config.yaml"
OUTPUT_DIR = ROOT / "output"
STATE_DIR = ROOT / "state"
SECRETS_DIR = ROOT / "secrets"
ASSETS_DIR = ROOT / "assets"
SCRIPTS_DIR = ROOT / "scripts"


def _load_dotenv(path: Path = ROOT / ".env") -> None:
    """Minimaler .env-Loader (kein Extra-Paket noetig). Setzt nur fehlende Variablen."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def load_config(path: Path = CONFIG_PATH) -> dict[str, Any]:
    _load_dotenv()
    with open(path, encoding="utf-8") as fh:
        cfg = yaml.safe_load(fh) or {}
    for d in (OUTPUT_DIR, STATE_DIR, SECRETS_DIR, SCRIPTS_DIR):
        d.mkdir(parents=True, exist_ok=True)
    return cfg


def is_kids(cfg: dict[str, Any]) -> bool:
    return str(cfg.get("channel", {}).get("audience", "")).lower() in {"kinder", "kids", "children"}
