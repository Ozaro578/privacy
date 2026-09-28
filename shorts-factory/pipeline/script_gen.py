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
ZIELGRUPPE: Allgemeines Publikum (13+), vor allem 16-35, scrollt auf dem Handy.
- Jeder Satz treibt die Story voran. Konkrete Alltagssituation statt abstrakter Fakten.
- Psychologische Aussagen als Tendenz formulieren ("psychologists suggest", "studies link this to"),
  nie als absolute Wahrheit. Keine erfundenen Zahlen, keine erfundenen Studien.
- Keine medizinischen/therapeutischen Ratschlaege, keine Diagnosen, keine Manipulationsanleitungen.
- Der Hook ist der erste gesprochene Satz: eine Situation, die JEDER kennt, plus ein "weird"/"secretly"/"actually".
- Das Video endet mit einem Twist (ein Satz, der den Anfang neu einordnet), dann eine kurze Frage.
- Kein Clickbait ohne Einloesung: Was der Hook verspricht, wird erklaert.
- Eigenstaendiger Inhalt pro Video (YouTube monetarisiert keine repetitiven Template-Videos).
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
    fmt = (slot or {}).get("format", "story")
    if slot:
        series_hint = (
            f"\nSERIE FUER DIESES VIDEO: \"{slot.get('series', '')}\"\n"
            f"Fokus: {slot.get('focus', '')}\n"
            f"Der Titel beginnt mit dem Serien-Praefix \"{slot.get('title_prefix', '')}\", falls angegeben.\n"
        )
    rk = cfg.get("ranking", {})
    n_items = int(rk.get("items", 5))
    format_rules = ""
    if fmt == "ranking":
        format_rules = f"""
FORMAT: RANKING (Countdown). Setze "format" auf "ranking".
- "items": genau {n_items} Eintraege, "rank" von {n_items} (zuerst) bis 1 (zuletzt, der Hoehepunkt).
- Jeder Eintrag: "name" (max. 4 Woerter, steht gross im Bild), "line" (1-2 kurze gesprochene Saetze,
  NICHT mit "Platz X" beginnen – das wird automatisch vorangestellt), "image_prompt" (englisch, Cartoon, kein Text).
- "hook": 1 Satz, der das Ranking ankuendigt und Platz 1 anteasert ("Platz 1 haette ich nie erraten!").
- "lines" bleibt leer. "outro": Frage an die Kinder ("Welches ist dein Lieblings...?").
- "on_screen_title": 2 Zeilen mit "|" getrennt, max. 3 Woerter je Zeile, z.B. "Die 5 schnellsten|Tiere der Welt".
- "highlight_word": genau ein Wort aus on_screen_title (das wichtigste, z.B. "schnellsten").
- Der YouTube-"title" endet mit: "{rk.get('title_suffix', '')}"
"""
    elif fmt == "scenes":
        n_sc = int(cfg.get("scenes", {}).get("count", 5))
        character = cfg.get("scenes", {}).get("character", "")
        format_rules = f"""
FORMAT: SCENES (Comedy-Szenen mit wiederkehrender Figur). Setze "format" auf "scenes".
- Figur: {character}
- "hook": der Titel-Satz der Situation, gesprochen als erster Satz (z.B. "POV: your baby has a 9 to 5 job").
- "scenes": genau {n_sc} Szenen in Reihenfolge. Jede Szene = ein Bild + eine kurze Caption (max. 10 Woerter,
  trocken-komisch, Alltag eines Erwachsenen aus Baby-Sicht). Aufsteigende Absurditaet, letzte Szene = Punchline.
- "image_prompt" je Szene: englisch, beschreibt Ort, Handlung, Requisiten und Mimik der Figur; die Figur
  selbst NICHT neu beschreiben (kommt aus der Referenz), kein Text im Bild.
- "lines" und "items" bleiben leer. "outro": eine Frage oder Mini-Punchline (1 Satz).
- "on_screen_title": die Situation in 2 Zeilen mit "|", max. 3 Woerter je Zeile. "highlight_word": das lustigste Wort.
"""
    else:
        format_rules = """
FORMAT: STORY. Setze "format" auf "story", "items" bleibt leer.
- "on_screen_title": 2-4 Woerter mit "|" als Zeilenumbruch, die das Thema auf stumm verstaendlich machen.
- "highlight_word": das wichtigste Wort daraus.
"""
    avoid = ch.get("avoid") or []
    used = "\n- ".join(history_titles[-80:]) if history_titles else "(noch keine)"
    examples = [e.strip() for e in (ch.get("style_examples") or []) if e and e.strip()]
    style_block = ""
    if examples:
        joined = "\n\n---\n\n".join(examples[:3])
        style_block = f"""
STIL-VORBILD (Transkripte erfolgreicher Shorts dieser Nische). Schreibe im EXAKT gleichen Schreibstil,
Tempo und Ton und mit aehnlicher Laenge – aber zu einem ANDEREN Thema. Nichts daraus wortwoertlich uebernehmen:
{joined}
"""

    lang_names = {"en": "ENGLISCH", "de": "DEUTSCH", "tr": "TUERKISCH", "es": "SPANISCH", "fr": "FRANZOESISCH"}
    lang = ch.get("language", "en")
    return f"""Du schreibst Skripte fuer den YouTube-Shorts-Kanal "{ch['name']}".
AUSGABESPRACHE: {lang_names.get(lang, lang.upper())} – alle gesprochenen und sichtbaren Texte
(hook, lines, outro, title, description, on_screen_title, items) in dieser Sprache. Bild-Prompts auf Englisch.

NISCHE:
{ch['niche'].strip()}
{series_hint}
{rules.strip()}

TABU-THEMEN: {', '.join(avoid) if avoid else 'keine'}

{topic_hint}
{format_rules}{style_block}
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
