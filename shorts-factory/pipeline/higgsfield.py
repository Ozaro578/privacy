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

from .config import OUTPUT_DIR, ROOT


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

    # Wiederkehrende Figur: Referenzbild einmal hochladen und bei jedem Bild mitgeben.
    ref_cfg = hf.get("character_reference") or ""
    if ref_cfg:
        ref_path = Path(ref_cfg) if Path(ref_cfg).is_absolute() else (ROOT / ref_cfg)
        if ref_path.exists():
            ref_url = higgsfield_client.upload_file(str(ref_path))
            field = hf.get("image_reference_field", "image_urls")
            extra[field] = [ref_url] if hf.get("image_reference_as_list", True) else ref_url
            style = f"{hf.get('character_description', '')} {style}".strip()
            print(f"[higgsfield] Referenzfigur: {ref_path.name}")
        else:
            print(f"[higgsfield] character_reference {ref_path} nicht gefunden – ohne Referenz.")

    paths: list[Path] = []
    for i, prompt in enumerate(prompts):
        args = {"prompt": f"{prompt.strip()} {style}".strip(), **extra}
        print(f"[higgsfield] Bild {i+1}/{len(prompts)}: {endpoint} ...")
        result = higgsfield_client.subscribe(endpoint, arguments=args)
        url = _dig(result, result_path)
        target = OUTPUT_DIR / f"{stem}_hf{i+1}.png"
        paths.append(_download(url, target))
    return paths


def animate_images(images: list[Path], prompts: list[str], cfg: dict[str, Any], stem: str) -> list[Path]:
    """Animiert ausgewaehlte Szenenbilder zu kurzen Clips (Bild-zu-Video). Welche: higgsfield.animate_scenes
    (Liste von Indizes, z.B. [0, -1] = Hook und Punchline). Rueckgabe: Pfade je Szene (Clip oder Bild)."""
    import higgsfield_client

    hf = cfg.get("higgsfield", {})
    endpoint = hf.get("animate_endpoint", "")
    which = hf.get("animate_scenes") or []
    if not endpoint or not which:
        return images
    idxs = {i % len(images) for i in which}
    extra = dict(hf.get("animate_arguments") or {})
    field = hf.get("animate_image_field", "image_url")
    result_path = hf.get("animate_result_path", "video.url")
    out: list[Path] = []
    for i, img in enumerate(images):
        if i not in idxs:
            out.append(img)
            continue
        url = higgsfield_client.upload_file(str(img))
        args = {"prompt": prompts[i] if i < len(prompts) else "subtle natural motion", field: url, **extra}
        print(f"[higgsfield] Animiere Szene {i+1}: {endpoint} ...")
        try:
            result = higgsfield_client.subscribe(endpoint, arguments=args)
            clip = _download(_dig(result, result_path), OUTPUT_DIR / f"{stem}_hf{i+1}.mp4")
            out.append(clip)
        except Exception as exc:  # noqa: BLE001
            print(f"[higgsfield] Animation fehlgeschlagen ({exc}) – nehme das Standbild.")
            out.append(img)
    return out


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
