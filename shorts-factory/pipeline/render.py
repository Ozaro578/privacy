"""Baut das fertige 9:16-Video mit ffmpeg zusammen."""
from __future__ import annotations

import random
import shutil
import subprocess
from pathlib import Path
from typing import Any

from .background import VIDEO_EXT, Background
from .config import ASSETS_DIR


def _ffprobe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out)


def _hex_to_ffmpeg(color: str) -> str:
    return "0x" + color.lstrip("#")


def _bg_input_and_filter(bg: Background, cfg: dict[str, Any], duration: float) -> tuple[list[str], str]:
    v = cfg["video"]
    w, h, fps = v["width"], v["height"], v["fps"]
    darken = float(v.get("darken", 0))
    dark = f",colorlevels=rimax={1-darken}:gimax={1-darken}:bimax={1-darken}" if darken > 0 else ""

    if bg.kind == "gradient":
        colors = ":".join(f"c{i}={_hex_to_ffmpeg(c)}" for i, c in enumerate(v.get("gradient_colors", ["#111", "#333"])))
        n = len(v.get("gradient_colors", ["#111", "#333"]))
        src = f"gradients=s={w}x{h}:{colors}:nb_colors={n}:speed=0.02:type=spiral:d={duration}:r={fps}"
        return ["-f", "lavfi", "-i", src], f"[0:v]format=yuv420p{dark}[bg]"

    if bg.kind == "video":
        # Zufaelliger Startpunkt, Endlosschleife, auf 9:16 zuschneiden
        src_dur = _ffprobe_duration(bg.path)
        start = random.uniform(0, max(0.0, src_dur - duration)) if src_dur > duration else 0.0
        inputs = ["-stream_loop", "-1", "-ss", f"{start:.2f}", "-i", str(bg.path)]
        flt = (
            f"[0:v]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},"
            f"fps={fps},format=yuv420p{dark}[bg]"
        )
        return inputs, flt

    if bg.kind == "slideshow" and bg.paths:
        # Mehrere Bilder nacheinander, jedes mit Ken-Burns-Zoom, weicher Uebergang
        n = len(bg.paths)
        durs = bg.durations or [duration / n + 0.5] * n
        inputs: list[str] = []
        parts: list[str] = []
        for i, (p, seg) in enumerate(zip(bg.paths, durs)):
            frames = int(round(seg * fps))
            inputs += ["-i", str(p)]
            zstep = 0.25 / max(frames, 1)
            direction = f"min(zoom+{zstep:.5f},1.3)" if i % 2 == 0 else f"if(eq(on,1),1.3,max(zoom-{zstep:.5f},1.0))"
            parts.append(
                f"[{i}:v]scale={w*2}:{h*2}:force_original_aspect_ratio=increase,crop={w*2}:{h*2},"
                f"zoompan=z='{direction}':d={frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={w}x{h}:fps={fps},"
                f"format=yuv420p,setsar=1[s{i}]"
            )
        chain = "".join(f"[s{i}]" for i in range(n))
        parts.append(f"{chain}concat=n={n}:v=1:a=0,format=yuv420p{dark}[bg]")
        return inputs, ";".join(parts)

    # image: Ken-Burns-Zoom
    frames = int(duration * fps) + fps
    inputs = ["-i", str(bg.path)]
    flt = (
        f"[0:v]scale={w*2}:{h*2}:force_original_aspect_ratio=increase,crop={w*2}:{h*2},"
        f"zoompan=z='min(zoom+0.0006,1.25)':d={frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={w}x{h}:fps={fps},"
        f"format=yuv420p{dark}[bg]"
    )
    return inputs, flt


def _pick_music() -> Path | None:
    folder = ASSETS_DIR / "music"
    files = [p for p in folder.iterdir() if p.suffix.lower() in {".mp3", ".wav", ".m4a", ".ogg"}] if folder.exists() else []
    return random.choice(files) if files else None


def render(voice_mp3: Path, ass_file: Path, bg: Background, cfg: dict[str, Any], out: Path) -> Path:
    v = cfg["video"]
    voice_dur = _ffprobe_duration(voice_mp3)
    duration = voice_dur + float(v.get("outro_padding", 0.5))

    bg_inputs, bg_filter = _bg_input_and_filter(bg, cfg, duration)
    n_video_inputs = bg_inputs.count("-i")
    a_idx = n_video_inputs            # Index des Sprach-Inputs
    m_idx = n_video_inputs + 1        # Index des Musik-Inputs
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *bg_inputs, "-i", str(voice_mp3)]

    music = _pick_music()
    music_vol = float(v.get("music_volume", 0))
    filters = [bg_filter]
    ass_path = str(ass_file).replace("\\", "/").replace(":", "\\:")
    filters.append(f"[bg]ass='{ass_path}'[vout]")

    if music and music_vol > 0:
        cmd += ["-stream_loop", "-1", "-i", str(music)]
        filters.append(
            f"[{m_idx}:a]volume={music_vol},afade=t=out:st={max(0, duration-1.5)}:d=1.5[m];"
            f"[{a_idx}:a][m]amix=inputs=2:duration=first:dropout_transition=0,apad[aout]"
        )
        amap = "[aout]"
    else:
        filters.append(f"[{a_idx}:a]apad[aout]")
        amap = "[aout]"

    cmd += [
        "-filter_complex", ";".join(filters),
        "-map", "[vout]", "-map", amap,
        "-t", f"{duration:.2f}",
        "-r", str(v["fps"]),
        "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
        "-movflags", "+faststart",
        str(out),
    ]
    subprocess.run(cmd, check=True)
    return out


def check_tools() -> None:
    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            raise RuntimeError(f"{tool} nicht gefunden. Installieren: apt install ffmpeg / brew install ffmpeg")
