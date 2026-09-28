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
    durations: list[float] | None = None  # bei slideshow: Anzeigedauer je Bild (None = gleichmaessig)


def _bg_folder(cfg: dict[str, Any] | None = None) -> Path:
    sub = (cfg or {}).get("video", {}).get("backgrounds_dir", "assets/backgrounds")
    p = Path(sub)
    return p if p.is_absolute() else (ASSETS_DIR.parent / sub)


def _pick(exts: set[str], cfg: dict[str, Any] | None = None) -> Path | None:
    folder = _bg_folder(cfg)
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


def _scene_format_prompts(script) -> list[str]:
    """Format scenes: Hook-Bild, ein Bild je Szene, Outro-Bild."""
    base = script.visual_prompt or f"{script.visual_keyword}"
    return [base, *[sc.image_prompt for sc in script.scenes], base]


def _ranking_prompts(script) -> list[str]:
    """Ein Bild pro Teil: Hook (Uebersicht), je Platz, Outro (Uebersicht)."""
    base = script.visual_prompt or f"{script.visual_keyword}, cute cartoon illustration for children"
    items = sorted(script.items, key=lambda i: -i.rank)
    return [base, *[it.image_prompt or f"{it.name}, {base}" for it in items], base]


def slideshow_durations(segments, total: float) -> list[float]:
    """Anzeigedauer je Bild aus den Sprech-Segmenten (hook, item..., outro)."""
    durs = [max(0.8, sg.end - sg.start) for sg in segments]
    durs[-1] = max(0.8, total - segments[-1].start)
    return durs


def story_durations(segments, total: float, n_images: int) -> list[float]:
    """Bildwechsel nur an Satzgrenzen: Saetze moeglichst gleichmaessig auf n Bilder verteilen."""
    n_seg = len(segments)
    per = max(1, round(n_seg / n_images))
    bounds = [segments[min(i * per, n_seg - 1)].start for i in range(n_images)] + [total]
    bounds[0] = 0.0
    return [max(0.8, b - a) for a, b in zip(bounds, bounds[1:])]


def pick_background(cfg: dict[str, Any], keyword: str, duration: float, script=None, stem: str = "bg", segments=None) -> Background:
    mode = str(cfg["video"].get("background", "gradient")).lower()
    is_ranking = bool(script is not None and getattr(script, "format", "story") == "ranking" and script.items)
    is_scenes = bool(script is not None and getattr(script, "format", "story") == "scenes" and script.scenes)
    per_part = is_ranking or is_scenes          # ein Bild pro Sprech-Teil
    if mode in {"higgsfield", "higgsfield_image"}:
        from . import higgsfield
        if not higgsfield.available():
            print("[background] HF_KEY fehlt – fallback auf Gradient.")
        else:
            try:
                if is_ranking:
                    prompts = _ranking_prompts(script)
                elif is_scenes:
                    prompts = _scene_format_prompts(script)
                else:
                    prompts = _scene_prompts(script, cfg) if script else [keyword]
                imgs = higgsfield.generate_images(prompts, cfg, stem)
                if len(imgs) > 1:
                    durs = slideshow_durations(segments, duration) if (per_part and segments and len(segments) == len(imgs)) else None
                    if durs is None and segments:
                        durs = story_durations(segments, duration, len(imgs))
                    return Background("slideshow", imgs[0], imgs, durs)
                return Background("image", imgs[0])
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
        p = _pick(VIDEO_EXT, cfg)
        if p:
            return Background("video", p)
        print("[background] Kein Video in assets/backgrounds – fallback auf Gradient.")
    elif mode == "image":
        folder = _bg_folder(cfg)
        files = sorted(p for p in folder.iterdir() if p.suffix.lower() in IMAGE_EXT) if folder.exists() else []
        if files and per_part and segments:
            # Reihenfolge: hook -> Szene 1..n -> outro; bei zu wenig Dateien reihum, Outro = Hook-Bild
            n = len(segments)
            seq = [files[i % len(files)] for i in range(n)]
            if len(files) == n - 1:
                seq = [files[0], *files, files[0]] if len(files) == n - 2 else [*files, files[0]]
            return Background("slideshow", seq[0], seq, slideshow_durations(segments, duration))
        if len(files) > 1 and segments:
            n = min(len(files), int(cfg.get("higgsfield", {}).get("images_per_video", 4)))
            seq = random.sample(files, n) if len(files) > n else files
            return Background("slideshow", seq[0], seq, story_durations(segments, duration, len(seq)))
        if files:
            return Background("image", random.choice(files))
        print("[background] Kein Bild in assets/backgrounds – fallback auf Gradient.")
    elif mode == "pexels":
        p = _pexels(keyword, duration)
        if p:
            return Background("video", p)
    return Background("gradient", None)
