"""Erzeugt eine ASS-Untertiteldatei mit Wort-fuer-Wort-Hervorhebung."""
from __future__ import annotations

from pathlib import Path
from typing import Any

from .tts import Segment, Word


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


def _title_lines(title: str, highlight: str, hl_color: str, primary: str) -> str:
    lines = [ln.strip() for ln in title.split("|") if ln.strip()]
    if len(lines) == 1 and len(lines[0].split()) > 3:
        ws = lines[0].split(); mid = len(ws) // 2
        lines = [" ".join(ws[:mid]), " ".join(ws[mid:])]
    out_lines = []
    for ln in lines:
        toks = []
        for tok in ln.split():
            if highlight and tok.strip(".,!?").lower() == highlight.strip(".,!?").lower():
                toks.append(f"{{\c{hl_color}}}{_esc(tok.upper())}{{\c{primary}}}")
            else:
                toks.append(_esc(tok.upper()))
        out_lines.append(" ".join(toks))
    return "\\N".join(out_lines)


def build_ass(
    words: list[Word],
    cfg: dict[str, Any],
    out: Path,
    *,
    title: str = "",
    highlight_word: str = "",
    segments: list[Segment] | None = None,
    total: float | None = None,
    badge_label: str = "#{rank}",
    groups_from: list[Segment] | None = None,
) -> Path:
    cap = cfg["captions"]
    vid = cfg["video"]
    w, h = vid["width"], vid["height"]
    per_line = int(cap.get("words_per_line", 3))
    ranking = bool(segments and any(sg.label.startswith("item:") for sg in segments))
    pos = float(cap.get("position_ranking", 0.68)) if ranking else float(cap.get("position", 0.55))
    margin_v = int(h * (1 - pos))

    primary = _ass_color(cap.get("color", "#FFFFFF"))
    highlight_c = _ass_color(cap.get("highlight", "#FFD400"))
    highlight = highlight_c
    outline = _ass_color(cap.get("outline", "#000000"))

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {w}
PlayResY: {h}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{cap.get('font', 'DejaVu Sans')},{cap.get('size', 96)},{primary},{highlight},{outline},&H80000000,1,0,0,0,100,100,0,0,1,7,3,2,60,60,{margin_v},1
Style: Title,{cap.get('font', 'DejaVu Sans')},{cap.get('title_size', 88)},{primary},{highlight},{outline},&H80000000,1,0,0,0,100,100,0,0,1,7,3,8,40,40,{int(h*0.07)},1
Style: Badge,{cap.get('font', 'DejaVu Sans')},{cap.get('badge_size', 120)},{primary},{highlight},{_ass_color(cap.get('badge_bg', '#E5008A'))},{_ass_color(cap.get('badge_bg', '#E5008A'))},1,0,0,0,100,100,0,0,3,18,0,8,40,40,{int(h*0.22)},1
Style: Bar,{cap.get('font', 'DejaVu Sans')},20,{highlight},{highlight},{highlight},{highlight},0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    events: list[str] = []
    chunks: list[list[Word]] = []
    # Woerter nach Sprech-Segmenten gruppieren (edge-tts liefert keine Satzzeichen) –
    # so endet ein Caption-Block nie mitten in einem Satz.
    groups: list[list[Word]] = []
    grouping = groups_from or segments
    if grouping:
        for sg in grouping:
            grp = [wd for wd in words if sg.start - 0.01 <= wd.start < sg.end - 0.01]
            if grp:
                groups.append(grp)
        seen = {id(w) for g in groups for w in g}
        rest = [w for w in words if id(w) not in seen]
        if rest:
            groups.append(rest)
    else:
        groups = [words]
    max_chars = int(cap.get("max_chars", 18))
    for grp in groups:
        n = len(grp)
        # gleichmaessige Bloecke: 7 Woerter -> 4+3 statt 3+3+1
        n_chunks = max(1, -(-n // per_line))
        size = -(-n // n_chunks)
        for i in range(0, n, size):
            block = grp[i : i + size]
            # zu lange Bloecke (lange Woerter) weiter teilen, damit nichts ueber den Rand laeuft
            cur: list[Word] = []
            for wd in block:
                if cur and len(" ".join(x.text for x in cur)) + 1 + len(wd.text) > max_chars:
                    chunks.append(cur)
                    cur = []
                cur.append(wd)
            if cur:
                chunks.append(cur)
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

    end_total = total or (words[-1].end + 0.5)

    # Bildschirm-Titel (2 Zeilen, Schluesselwort farbig) ueber die ganze Laenge
    if title:
        events.insert(0, f"Dialogue: 1,{_ts(0)},{_ts(end_total)},Title,,0,0,0,,{{\\fad(150,0)}}{_title_lines(title, highlight_word, highlight_c, primary)}")

    # Platz-Badge + Fortschrittsbalken (Ranking)
    if segments:
        gold = _ass_color(cap.get("gold", "#FFC300"))
        for sg in segments:
            if not sg.label.startswith("item:"):
                continue
            rank = sg.label.split(":")[1]
            extra = f"\\c{gold}\\fscx118\\fscy118" if rank == "1" else ""
            events.append(
                f"Dialogue: 2,{_ts(sg.start)},{_ts(sg.end)},Badge,,0,0,0,,{{\\an8\\fad(80,80){extra}}}{_esc(badge_label.format(rank=rank))}"
            )
        bar_h = 14
        step = 0.2
        t = 0.0
        while t < end_total:
            frac = min(1.0, (t + step) / end_total)
            events.append(
                f"Dialogue: 3,{_ts(t)},{_ts(min(t+step, end_total))},Bar,,0,0,0,,"
                f"{{\\an7\\pos(0,{h-bar_h})\\p1}}m 0 0 l {int(w*frac)} 0 l {int(w*frac)} {bar_h} l 0 {bar_h}{{\\p0}}"
            )
            t += step

    out.write_text(header + "\n".join(events) + "\n", encoding="utf-8")
    return out
