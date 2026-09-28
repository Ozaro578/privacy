"""Erzeugt eine ASS-Untertiteldatei mit Wort-fuer-Wort-Hervorhebung."""
from __future__ import annotations

from pathlib import Path
from typing import Any

from .tts import Word


def _ass_color(hex_rgb: str, alpha: int = 0) -> str:
    """'#RRGGBB' -> ASS '&HAABBGGRR'."""
    h = hex_rgb.lstrip("#")
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"&H{alpha:02X}{b}{g}{r}"


def _ts(seconds: float) -> str:
    seconds = max(0.0, seconds)
    h = int(seconds // 3600)
    m = int(seconds % 3600 // 60)
    s = seconds % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def _esc(text: str) -> str:
    return text.replace("{", "(").replace("}", ")").replace("\\", "/")


def build_ass(words: list[Word], cfg: dict[str, Any], out: Path) -> Path:
    cap = cfg["captions"]
    vid = cfg["video"]
    w, h = vid["width"], vid["height"]
    per_line = int(cap.get("words_per_line", 3))
    margin_v = int(h * (1 - float(cap.get("position", 0.55))))

    primary = _ass_color(cap.get("color", "#FFFFFF"))
    highlight = _ass_color(cap.get("highlight", "#FFD400"))
    outline = _ass_color(cap.get("outline", "#000000"))

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {w}
PlayResY: {h}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{cap.get('font', 'DejaVu Sans')},{cap.get('size', 96)},{primary},{highlight},{outline},&H80000000,1,0,0,0,100,100,0,0,1,7,3,2,60,60,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    events: list[str] = []
    chunks: list[list[Word]] = []
    current: list[Word] = []
    for wd in words:
        current.append(wd)
        ends_sentence = wd.text.rstrip()[-1:] in ".!?"
        if len(current) >= per_line or ends_sentence:
            chunks.append(current)
            current = []
    if current:
        chunks.append(current)
    for chunk in chunks:
        for idx, active in enumerate(chunk):
            parts = []
            for j, wd in enumerate(chunk):
                txt = _esc(wd.text.upper())
                if j == idx:
                    parts.append(f"{{\\c{highlight}\\fscx108\\fscy108}}{txt}{{\\c{primary}\\fscx100\\fscy100}}")
                else:
                    parts.append(txt)
            end = chunk[idx + 1].start if idx + 1 < len(chunk) else active.end
            if end <= active.start:
                end = active.start + 0.15
            events.append(
                f"Dialogue: 0,{_ts(active.start)},{_ts(end)},Cap,,0,0,0,,{{\\an5\\fad(40,0)}}{' '.join(parts)}"
            )

    out.write_text(header + "\n".join(events) + "\n", encoding="utf-8")
    return out
