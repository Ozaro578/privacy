"""Datenmodelle fuer ein Short-Skript (Structured Output von Claude)."""
from __future__ import annotations

from typing import List, Literal

from pydantic import BaseModel, Field


class RankItem(BaseModel):
    rank: int = Field(description="Platz-Nummer, 5 = zuerst gezeigt ... 1 = zuletzt (Hoehepunkt)")
    name: str = Field(description="Kurzer Name des Eintrags fuer den Bildschirm, max. 4 Woerter, z.B. 'Gepard'")
    line: str = Field(description="1-2 kurze gesprochene Saetze zu diesem Platz. OHNE 'Platz X' am Anfang.")
    image_prompt: str = Field(description="Englischer Bild-Prompt fuer diesen Eintrag, kindgerechter Cartoon-Stil, kein Text im Bild")


class Scene(BaseModel):
    caption: str = Field(description="Kurzer gesprochener/eingeblendeter Satz zu dieser Szene (max. 10 Woerter), z.B. 'Monday. 8 a.m. Meeting.'")
    image_prompt: str = Field(description="Englischer Bild-Prompt fuer diese Szene mit der wiederkehrenden Figur, kein Text im Bild")


class ShortScript(BaseModel):
    """Alles, was fuer ein einzelnes Short gebraucht wird."""

    format: Literal["story", "ranking", "scenes"] = Field(default="story", description="story = Erzaehlung, ranking = Countdown, scenes = Szenen-Comedy (ein Bild pro Gag)")
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
    # Nur fuer format = ranking:
    items: List[RankItem] = Field(default_factory=list, description="Nur ranking: die Plaetze, sortiert von hoechster Nummer (zuerst) bis 1 (zuletzt)")
    scenes: List[Scene] = Field(default_factory=list, description="Nur scenes: 4-6 Szenen in Reihenfolge, jede mit Gag-Caption und Bild-Prompt")
    on_screen_title: str = Field(default="", description="Bildschirm-Titel in 2 Zeilen, getrennt mit '|', max. 3 Woerter pro Zeile, z.B. 'Die 5 schnellsten|Tiere der Welt'")
    highlight_word: str = Field(default="", description="Ein Wort aus on_screen_title, das farbig hervorgehoben wird")
    rank_prefix: str = Field(default="Number {rank}.", exclude=True, description="intern: gesprochener Prefix je Platz (aus config ranking.spoken_prefix)")

    @property
    def spoken_parts(self) -> list[tuple[str, str]]:
        """(label, text) – label: hook | item:<rank> | line | outro. Reihenfolge = Sprechreihenfolge."""
        parts: list[tuple[str, str]] = [("hook", self.hook)]
        if self.format == "ranking":
            for it in sorted(self.items, key=lambda i: -i.rank):
                prefix = self.rank_prefix.format(rank=it.rank).strip()
                parts.append((f"item:{it.rank}", f"{prefix} {it.name}. {it.line}".strip()))
        elif self.format == "scenes":
            parts += [(f"scene:{i+1}", sc.caption) for i, sc in enumerate(self.scenes)]
        else:
            parts += [("line", ln) for ln in self.lines]
        parts.append(("outro", self.outro))
        return [(lb, t.strip()) for lb, t in parts if t and t.strip()]

    @property
    def spoken_text(self) -> str:
        return " ".join(t for _, t in self.spoken_parts)

    @property
    def word_count(self) -> int:
        return len(self.spoken_text.split())
