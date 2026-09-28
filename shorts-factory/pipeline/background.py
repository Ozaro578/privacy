"""Liefert den Hintergrund-Input fuer ffmpeg: Gradient, lokales Video/Bild oder Pexels-Stock."""
from __future__ import annotations

import json
import os
import random
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .config import ASSETS_DIR, OUTPUT_DIR

VIDEO_EXT = {".mp4", ".mov", ".mkv", ".webm"}
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp"}


@dataclass
class Background:
    kind: str                       # gradient | video | image | slideshow
    path: Path | None               # None bei gradient
    paths: list[Path] | None = None # bei slideshow: mehrere Bilder nacheinander


def _pick(exts: set[str]) -> Path | None:
    folder = ASSETS_DIR / "backgrounds"
    files = [p for p in folder.iterdir() if p.suffix.lower() in exts] if folder.exists() else []
    return random.choice(files) if files else None


def _pexels(keyword: str, min_duration: float) -> Path | None:
    key = os.environ.get("PEXELS_API_KEY")
    if not key:
        print("[background] PEXELS_API_KEY fehlt – fallback auf Gradient.")
        return None
    url = (
        "https://api.pexels.com/videos/search?query="
        + urllib.parse.quote(keyword)
        + "&orientation=portrait&size=medium&per_page=15"
    )
    req = urllib.request.Request(url, headers={"Authorization": key})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as exc:  # noqa: BLE001
        print(f"[background] Pexels-Fehler: {exc} – fallback auf Gradient.")
        return None

    candidates = []
    for video in data.get("videos", []):
        if video.get("duration", 0) < min(min_duration, 15):
            continue
        files = [f for f in video.get("video_files", []) if f.get("width") and f.get("height")]
        portrait = [f for f in files if f["height"] > f["width"] and f["height"] >= 1280]
        if portrait:
            best = sorted(portrait, key=lambda f: f["height"])[0]
            candidates.append(best["link"])
    if not candidates:
        print("[background] Pexels: nichts Passendes gefunden – fallback auf Gradient.")
        return None

    target = OUTPUT_DIR / "_pexels_bg.mp4"
    link = random.choice(candidates)
    urllib.request.urlretrieve(link, target)
    return target


def _scene_prompts(script, cfg: dict[str, Any]) -> list[str]:
    """Bild-Prompts je Szene: Hook, Mitte, Outro (max. higgsfield.images_per_video)."""
    n = int(cfg.get("higgsfield", {}).get("images_per_video", 3))
    base = script.visual_prompt or f"{script.visual_keyword}, cute cartoon illustration for children"
    if n <= 1:
        return [base]
    mids = [script.hook, *script.lines, script.outro]
    step = max(1, len(mids) // n)
    scenes = [mids[i * step] for i in range(n)]
    return [f"{base}. Scene: {s}" for s in scenes]


def pick_background(cfg: dict[str, Any], keyword: str, duration: float, script=None, stem: str = "bg") -> Background:
    mode = str(cfg["video"].get("background", "gradient")).lower()
    if mode in {"higgsfield", "higgsfield_image"}:
        from . import higgsfield
        if not higgsfield.available():
            print("[background] HF_KEY fehlt – fallback auf Gradient.")
        else:
            try:
                prompts = _scene_prompts(script, cfg) if script else [keyword]
                imgs = higgsfield.generate_images(prompts, cfg, stem)
                return Background("slideshow", imgs[0], imgs) if len(imgs) > 1 else Background("image", imgs[0])
            except Exception as exc:  # noqa: BLE001
                print(f"[background] Higgsfield-Fehler: {exc} – fallback auf Gradient.")
    elif mode == "higgsfield_video":
        from . import higgsfield
        if not higgsfield.available() or not cfg.get("higgsfield", {}).get("video_endpoint"):
            print("[background] HF_KEY oder higgsfield.video_endpoint fehlt – fallback auf Gradient.")
        else:
            try:
                prompt = (script.visual_prompt if script else keyword) or keyword
                clip = higgsfield.generate_video(prompt, cfg, stem, int(cfg["higgsfield"].get("video_seconds", 10)))
                return Background("video", clip)
            except Exception as exc:  # noqa: BLE001
                print(f"[background] Higgsfield-Fehler: {exc} – fallback auf Gradient.")
    if mode == "video":
        p = _pick(VIDEO_EXT)
        if p:
            return Background("video", p)
        print("[background] Kein Video in assets/backgrounds – fallback auf Gradient.")
    elif mode == "image":
        p = _pick(IMAGE_EXT)
        if p:
            return Background("image", p)
        print("[background] Kein Bild in assets/backgrounds – fallback auf Gradient.")
    elif mode == "pexels":
        p = _pexels(keyword, duration)
        if p:
            return Background("video", p)
    return Background("gradient", None)
