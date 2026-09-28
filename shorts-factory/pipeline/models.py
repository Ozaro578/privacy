"""Datenmodelle fuer ein Short-Skript (Structured Output von Claude)."""
from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field


class ShortScript(BaseModel):
    """Alles, was fuer ein einzelnes Short gebraucht wird."""

    topic: str = Field(description="Kurzes internes Thema, z.B. 'Warum schlafen Fledermaeuse kopfueber?'")
    title: str = Field(description="YouTube-Titel, max. 60 Zeichen, neugierig machend, ohne Clickbait-Luegen")
    hook: str = Field(description="Erster gesprochener Satz. Muss in 2 Sekunden fesseln.")
    lines: List[str] = Field(description="Die restlichen gesprochenen Saetze, jeder Satz einzeln. Kurz und klar.")
    outro: str = Field(description="Letzter Satz: Frage oder Mitmach-Aufgabe an die Zuschauer.")
    description: str = Field(description="YouTube-Beschreibung, 2-3 Saetze, ohne Hashtags")
    hashtags: List[str] = Field(description="3-5 Hashtags ohne #, kleingeschrieben, z.B. ['tiere', 'kinder']")
    visual_keyword: str = Field(description="1-2 englische Woerter fuer eine Stock-Video-Suche, z.B. 'owl forest'")
    visual_prompt: str = Field(
        default="",
        description="Englischer Bild-Prompt (1 Satz) fuer eine KI-Illustration zum Thema, bunt und kindgerecht, kein Text im Bild",
    )

    @property
    def spoken_text(self) -> str:
        parts = [self.hook, *self.lines, self.outro]
        return " ".join(p.strip() for p in parts if p and p.strip())

    @property
    def word_count(self) -> int:
        return len(self.spoken_text.split())
