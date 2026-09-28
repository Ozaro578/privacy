"""Sprachausgabe mit edge-tts inkl. Wort-Zeitstempeln fuer die Untertitel."""
from __future__ import annotations

import asyncio
import os
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


async def _list_voices(lang_prefix: str) -> list[dict]:
    proxy = os.environ.get("TTS_PROXY") or os.environ.get("HTTPS_PROXY") or None
    voices = await edge_tts.list_voices(proxy=proxy)
    return [v for v in voices if v["ShortName"].lower().startswith(lang_prefix.lower())]


def list_voices(lang_prefix: str = "de") -> list[dict]:
    return asyncio.run(_list_voices(lang_prefix))
