"""Erzeugt ein Short-Skript per LLM (ChatGPT/OpenAI oder Claude), Pydantic-validiert."""
from __future__ import annotations

import os
from typing import Any

from .config import is_kids
from .models import ShortScript

KIDS_RULES = """
ZIELGRUPPE: Kinder ({age_range} Jahre). Halte dich strikt an diese Regeln:
- Einfache, kurze Saetze. Keine Fremdwoerter ohne Erklaerung.
- Freundlich, froehlich, ermutigend. Nichts Gruseliges, keine Gewalt, keine Angst.
- Keine Werbung, keine Produkte, keine Links, keine Aufforderung zu Kaeufen.
- Keine Themen, die Erwachsene fuer Kinder unpassend finden wuerden.
- Fakten muessen stimmen und altersgerecht vereinfacht sein.
- Sprich die Kinder direkt an ("du", "ihr"). Ende mit einer Frage oder Mitmach-Idee.
"""

GENERAL_RULES = """
ZIELGRUPPE: Allgemeines Publikum. Fakten muessen stimmen. Kein Clickbait ohne Substanz.
"""


def build_prompt(cfg: dict[str, Any], history_titles: list[str], slot: dict[str, Any] | None = None) -> str:
    ch = cfg["channel"]
    sc = cfg["script"]
    target_words = int(sc["target_seconds"] * sc["words_per_second"])
    max_words = int(sc["max_seconds"] * sc["words_per_second"]) - 10
    rules = KIDS_RULES.format(age_range=ch.get("age_range", "4-9")) if is_kids(cfg) else GENERAL_RULES

    topics = ch.get("topics") or []
    topic_hint = (
        "Waehle EIN Thema aus dieser Liste, das noch nicht verwendet wurde:\n- " + "\n- ".join(topics)
        if topics
        else "Erfinde selbst ein frisches, konkretes Thema, das zur Nische passt."
    )
    series_hint = ""
    if slot:
        series_hint = (
            f"\nSERIE FUER DIESES VIDEO: \"{slot.get('series', '')}\"\n"
            f"Fokus: {slot.get('focus', '')}\n"
            f"Der Titel beginnt mit dem Serien-Praefix \"{slot.get('title_prefix', '')}\", falls angegeben.\n"
        )
    avoid = ch.get("avoid") or []
    used = "\n- ".join(history_titles[-80:]) if history_titles else "(noch keine)"

    return f"""Du schreibst Skripte fuer den YouTube-Shorts-Kanal "{ch['name']}".
Sprache: {ch.get('language', 'de')}.

NISCHE:
{ch['niche'].strip()}
{series_hint}
{rules.strip()}

TABU-THEMEN: {', '.join(avoid) if avoid else 'keine'}

{topic_hint}

BEREITS VEROEFFENTLICHTE TITEL (nicht wiederholen, auch nicht in Abwandlung):
- {used}

FORMAT-VORGABEN:
- Gesprochener Text gesamt (hook + lines + outro): ca. {target_words} Woerter, NIEMALS mehr als {max_words}.
- Der Hook ist der erste Satz und muss sofort Neugier wecken.
- Jeder Eintrag in "lines" ist genau EIN kurzer Satz.
- Titel max. 60 Zeichen. Keine Emojis im gesprochenen Text.
- "visual_keyword": 1-2 englische Woerter fuer eine Stock-Video-Suche zum Thema.
- "visual_prompt": ein englischer Bild-Prompt (1 Satz) fuer eine KI-Illustration zum Thema,
  Stil: bunt, freundlich, cartoon/3D fuer Kinder, KEIN Text im Bild.
"""


# ---------------------------------------------------------------- OpenAI (ChatGPT)
def _generate_openai(prompt: str, model: str) -> ShortScript:
    if not os.environ.get("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY fehlt (.env oder Umgebungsvariable).")
    from openai import OpenAI

    client = OpenAI()
    response = client.responses.parse(
        model=model,
        instructions="Du bist ein erfahrener Autor fuer YouTube-Shorts. Antworte ausschliesslich im geforderten JSON-Schema.",
        input=prompt,
        text_format=ShortScript,
    )
    script = response.output_parsed
    if script is None:
        raise RuntimeError("OpenAI hat kein gueltiges Skript geliefert.")
    return script


# ---------------------------------------------------------------- Claude
def _generate_claude(prompt: str, model: str) -> ShortScript:
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError("ANTHROPIC_API_KEY fehlt (.env oder Umgebungsvariable).")
    import anthropic

    client = anthropic.Anthropic()
    response = client.beta.messages.parse(
        model=model,
        max_tokens=4000,
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        output_config={"effort": "medium"},
        messages=[{"role": "user", "content": prompt}],
        output_format=ShortScript,
    )
    if response.stop_reason == "refusal":
        raise RuntimeError("Claude hat die Anfrage abgelehnt – Thema/Nische in config.yaml pruefen.")
    script = response.parsed_output
    if script is None:
        raise RuntimeError("Claude hat kein gueltiges Skript geliefert.")
    return script


def generate_script(cfg: dict[str, Any], history_titles: list[str], slot: dict[str, Any] | None = None) -> ShortScript:
    sc = cfg["script"]
    provider = str(sc.get("provider", "openai")).lower()
    prompt = build_prompt(cfg, history_titles, slot)

    if provider in {"openai", "chatgpt", "gpt"}:
        script = _generate_openai(prompt, sc.get("openai_model", "gpt-5"))
    elif provider in {"claude", "anthropic"}:
        script = _generate_claude(prompt, sc.get("claude_model", "claude-opus-5-5"))
    else:
        raise RuntimeError(f"Unbekannter script.provider: {provider!r} (openai | claude)")

    max_words = int(sc["max_seconds"] * sc["words_per_second"])
    while script.lines and script.word_count > max_words:   # Notbremse < 60 s
        script.lines.pop()
    return script
