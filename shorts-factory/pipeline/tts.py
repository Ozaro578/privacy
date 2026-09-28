"""Sprachausgabe mit edge-tts inkl. Wort-Zeitstempeln fuer die Untertitel."""
from __future__ import annotations

import asyncio
import os
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import edge_tts


@dataclass
class Word:
    text: str
    start: float  # Sekunden
    end: float


async def _synth(text: str, voice: str, rate: str, pitch: str, out: Path) -> list[Word]:
    proxy = os.environ.get("TTS_PROXY") or os.environ.get("HTTPS_PROXY") or None
    com = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary", proxy=proxy)
    words: list[Word] = []
    with open(out, "wb") as fh:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                fh.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / 10_000_000
                dur = chunk["duration"] / 10_000_000
                words.append(Word(text=chunk["text"], start=start, end=start + dur))
    return words


def synthesize(text: str, cfg: dict[str, Any], out: Path) -> list[Word]:
    """Schreibt MP3 nach `out` und gibt Wort-Zeitstempel zurueck."""
    v = cfg["voice"]
    words = asyncio.run(_synth(text, v["name"], v.get("rate", "+0%"), v.get("pitch", "+0Hz"), out))
    if not words:
        raise RuntimeError("edge-tts hat keine Wort-Zeitstempel geliefert.")
    # Luecken schliessen: jedes Wort endet, wenn das naechste beginnt (fluessigere Captions)
    for a, b in zip(words, words[1:]):
        a.end = max(a.end, min(b.start, a.end + 0.35))
    return words


@dataclass
class Segment:
    label: str
    start: float
    end: float


def _duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out)


_SENT_RE = re.compile(r"[^.!?…]+[.!?…]*")


def _sentences(text: str) -> list[str]:
    return [m.group(0).strip() for m in _SENT_RE.finditer(text) if m.group(0).strip()]


def synthesize_parts(parts: list[tuple[str, str]], cfg: dict[str, Any], out: Path, gap: float = 0.35) -> tuple[list[Word], list[Segment], list[Segment]]:
    """Spricht jeden Teil einzeln, fuegt sie mit kurzer Pause zusammen.
    Liefert Wort-Zeitstempel (global), die Zeitspanne jedes Teils (Bildwechsel, Badges)
    und Satz-Segmente (Caption-Bloecke enden nie mitten im Satz)."""
    v = cfg["voice"]
    tmp_files: list[Path] = []
    words: list[Word] = []
    segments: list[Segment] = []
    sentences: list[Segment] = []
    offset = 0.0
    for i, (label, text) in enumerate(parts):
        part_file = out.with_name(f"{out.stem}_part{i}.mp3")
        part_words = asyncio.run(_synth(text, v["name"], v.get("rate", "+0%"), v.get("pitch", "+0Hz"), part_file))
        dur = _duration(part_file)
        shifted = [Word(w.text, w.start + offset, w.end + offset) for w in part_words]
        words.extend(shifted)
        segments.append(Segment(label, offset, offset + dur + gap))
        # Saetze innerhalb des Teils ueber die Wortanzahl auf die Zeitstempel abbilden
        idx = 0
        for sent in _sentences(text):
            n = len(sent.split())
            chunk = shifted[idx : idx + n]
            idx += n
            if chunk:
                sentences.append(Segment("sent", chunk[0].start, chunk[-1].end + 0.01))
        if idx < len(shifted):  # Rest (Zaehlung weicht ab) an den letzten Satz haengen
            sentences[-1].end = shifted[-1].end + 0.01
        offset += dur + gap
        tmp_files.append(part_file)

    # Zusammenfuegen: jede Datei bekommt `gap` Sekunden Stille angehaengt
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error"]
    for f in tmp_files:
        cmd += ["-i", str(f)]
    chain = "".join(f"[{i}:a]apad=pad_dur={gap}[a{i}];" for i in range(len(tmp_files)))
    chain += "".join(f"[a{i}]" for i in range(len(tmp_files))) + f"concat=n={len(tmp_files)}:v=0:a=1[out]"
    cmd += ["-filter_complex", chain, "-map", "[out]", "-c:a", "libmp3lame", "-q:a", "2", str(out)]
    subprocess.run(cmd, check=True)
    for f in tmp_files:
        f.unlink(missing_ok=True)

    if not words:
        raise RuntimeError("edge-tts hat keine Wort-Zeitstempel geliefert.")
    for a, b in zip(words, words[1:]):
        a.end = max(a.end, min(b.start, a.end + 0.35))
    return words, segments, sentences


async def _list_voices(lang_prefix: str) -> list[dict]:
    proxy = os.environ.get("TTS_PROXY") or os.environ.get("HTTPS_PROXY") or None
    voices = await edge_tts.list_voices(proxy=proxy)
    return [v for v in voices if v["ShortName"].lower().startswith(lang_prefix.lower())]


def list_voices(lang_prefix: str = "de") -> list[dict]:
    return asyncio.run(_list_voices(lang_prefix))
