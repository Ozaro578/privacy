"""Higgsfield-Anbindung: KI-Illustrationen (und optional Videoclips) fuer den Hintergrund.

Nutzt das offizielle SDK `higgsfield-client`. Zugangsdaten:
    HF_KEY="<api-key-id>:<api-key-secret>"   (https://console.higgsfield.ai)

Endpunkt & Felder sind konfigurierbar (config.yaml -> higgsfield), weil jedes Modell im
Higgsfield-Console eine eigene API-Seite mit Schema hat. Voreingestellt ist Soul v2
("higgsfield-ai/soul/v2/standard"), dessen Antwort `images[0].url` liefert.
"""
from __future__ import annotations

import os
import urllib.request
from pathlib import Path
from typing import Any

from .config import OUTPUT_DIR


def available() -> bool:
    return bool(os.environ.get("HF_KEY") or (os.environ.get("HF_API_KEY") and os.environ.get("HF_API_SECRET")))


def _dig(obj: Any, path: str) -> Any:
    """'images.0.url' -> obj['images'][0]['url']"""
    cur = obj
    for part in path.split("."):
        cur = cur[int(part)] if isinstance(cur, list) else cur[part]
    return cur


def _download(url: str, target: Path) -> Path:
    urllib.request.urlretrieve(url, target)
    return target


def generate_images(prompts: list[str], cfg: dict[str, Any], stem: str) -> list[Path]:
    """Erzeugt je Prompt ein 9:16-Bild und gibt lokale Pfade zurueck."""
    import higgsfield_client

    hf = cfg.get("higgsfield", {})
    endpoint = hf.get("image_endpoint", "higgsfield-ai/soul/v2/standard")
    extra = dict(hf.get("image_arguments") or {})
    result_path = hf.get("image_result_path", "images.0.url")
    style = hf.get("style_suffix", "")

    paths: list[Path] = []
    for i, prompt in enumerate(prompts):
        args = {"prompt": f"{prompt.strip()} {style}".strip(), **extra}
        print(f"[higgsfield] Bild {i+1}/{len(prompts)}: {endpoint} ...")
        result = higgsfield_client.subscribe(endpoint, arguments=args)
        url = _dig(result, result_path)
        target = OUTPUT_DIR / f"{stem}_hf{i+1}.png"
        paths.append(_download(url, target))
    return paths


def generate_video(prompt: str, cfg: dict[str, Any], stem: str, duration: int) -> Path:
    """Optional: echter KI-Videoclip (teuer, ~35 Credits/Clip). Nur bei higgsfield.video_endpoint gesetzt."""
    import higgsfield_client

    hf = cfg.get("higgsfield", {})
    endpoint = hf["video_endpoint"]
    extra = dict(hf.get("video_arguments") or {})
    result_path = hf.get("video_result_path", "video.url")
    args = {"prompt": f"{prompt.strip()} {hf.get('style_suffix', '')}".strip(), "duration": duration, **extra}
    print(f"[higgsfield] Video: {endpoint} ({duration}s) ...")
    result = higgsfield_client.subscribe(endpoint, arguments=args)
    return _download(_dig(result, result_path), OUTPUT_DIR / f"{stem}_hf.mp4")
