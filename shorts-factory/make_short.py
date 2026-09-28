#!/usr/bin/env python3
"""
Shorts Factory – CLI

  python make_short.py run                 # Skript -> Sprache -> Video -> YouTube (alles automatisch)
  python make_short.py run --slot abend    # Skript fuer die Serie des Abend-Slots
  python make_short.py run --no-upload     # nur Video erzeugen
  python make_short.py run --script scripts/demo.json   # fertiges Skript verwenden (ohne Claude)
  python make_short.py generate            # nur Skript erzeugen (scripts/<datum>.json)
  python make_short.py render scripts/x.json            # Video aus Skript
  python make_short.py upload output/x.mp4 --script scripts/x.json
  python make_short.py auth                # einmalige YouTube-Anmeldung (oeffnet Browser)
  python make_short.py voices              # verfuegbare Stimmen in der Kanalsprache
  python make_short.py --config config.de.yaml run   # lokalisierter Zweitkanal
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

from pipeline import state
from pipeline.background import pick_background
from pipeline.captions import build_ass
from pipeline.config import OUTPUT_DIR, SCRIPTS_DIR, load_config
from pipeline.models import ShortScript
from pipeline.render import check_tools, render
from pipeline.tts import synthesize_parts


def slug(text: str, n: int = 40) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss"))
    return s.strip("-")[:n] or "short"


def load_script(path: Path) -> ShortScript:
    return ShortScript.model_validate_json(path.read_text(encoding="utf-8"))


def save_script(script: ShortScript) -> Path:
    stamp = datetime.now().strftime("%Y-%m-%d_%H%M")
    path = SCRIPTS_DIR / f"{stamp}_{slug(script.topic)}.json"
    path.write_text(script.model_dump_json(indent=2), encoding="utf-8")
    return path


def pick_slot(cfg, name: str | None):
    """Slot per Name oder – ohne Name – der Slot, dessen Uhrzeit der aktuellen am naechsten liegt."""
    slots = cfg.get("schedule", {}).get("slots") or []
    if not slots:
        return None
    if name:
        for s in slots:
            if s["name"] == name:
                return s
        raise SystemExit(f"Unbekannter Slot {name!r}. Verfuegbar: {[s['name'] for s in slots]}")
    from zoneinfo import ZoneInfo
    tz = ZoneInfo(cfg["schedule"].get("timezone", "Europe/Berlin"))
    now = datetime.now(tz)
    now_min = now.hour * 60 + now.minute
    def dist(s):
        hh, mm = map(int, s["time"].split(":"))
        return abs(hh * 60 + mm - now_min)
    return min(slots, key=dist)


def cmd_generate(cfg, args) -> tuple[ShortScript, Path]:
    if getattr(args, "script", None):
        path = Path(args.script)
        script = load_script(path)
        print(f"[script] Geladen: {path}")
        return script, path
    from pipeline.script_gen import generate_script
    slot = pick_slot(cfg, getattr(args, "slot", None))
    provider = cfg["script"].get("provider", "openai")
    print(f"[script] {provider} schreibt ein neues Skript" + (f" (Slot: {slot['name']} / {slot['series']})" if slot else "") + " ...")
    script = generate_script(cfg, state.titles(), slot)
    path = save_script(script)
    print(f"[script] {script.title!r} ({script.word_count} Woerter) -> {path}")
    return script, path


def cmd_render(cfg, script: ShortScript, base: str) -> Path:
    check_tools()
    mp3 = OUTPUT_DIR / f"{base}.mp3"
    ass = OUTPUT_DIR / f"{base}.ass"
    mp4 = OUTPUT_DIR / f"{base}.mp4"

    print(f"[tts] Stimme {cfg['voice']['name']} ({script.format}) ...")
    rk = cfg.get("ranking", {})
    script.rank_prefix = rk.get("spoken_prefix", "Number {rank}.")
    gap = float(rk.get("gap_seconds", 0.35)) if script.format == "ranking" else float(cfg["voice"].get("sentence_gap", 0.22))
    words, segments, sentences = synthesize_parts(script.spoken_parts, cfg, mp3, gap=gap)
    duration = segments[-1].end
    print(f"[tts] {len(words)} Woerter, {duration:.1f} s")
    if duration > cfg["script"]["max_seconds"]:
        print(f"[warn] Audio ist {duration:.1f}s – Shorts muessen < 60 s sein. Skript kuerzen oder rate erhoehen.")

    total = duration + float(cfg["video"].get("outro_padding", 0.5))
    build_ass(words, cfg, ass, title=script.on_screen_title, highlight_word=script.highlight_word,
              segments=segments, total=total, badge_label=rk.get("badge_label", "#{rank}"), groups_from=sentences)
    bg = pick_background(cfg, script.visual_keyword, duration, script=script, stem=base, segments=segments)
    print(f"[render] Hintergrund: {bg.kind}{' ' + bg.path.name if bg.path else ''}")
    render(mp3, ass, bg, cfg, mp4)
    print(f"[render] Fertig: {mp4}")
    return mp4


def cmd_upload(cfg, script: ShortScript, video: Path) -> str:
    from pipeline.youtube import upload
    tags = list(dict.fromkeys([*cfg["youtube"].get("default_tags", []), *script.hashtags]))
    desc = script.description.strip() + "\n\n" + " ".join(f"#{h}" for h in ["shorts", *script.hashtags])
    return upload(video, script.title, desc, tags, cfg)


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--config", default=None, help="andere Konfigurationsdatei, z.B. config.de.yaml (lokalisierter Kanal)")
    sub = p.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("run", help="kompletter Durchlauf")
    r.add_argument("--script", help="fertiges Skript (JSON) statt LLM")
    r.add_argument("--slot", help="Slot aus config.yaml (morgen | nachmittag | abend)")
    r.add_argument("--no-upload", action="store_true")

    g = sub.add_parser("generate", help="nur Skript erzeugen")
    g.add_argument("--slot", help="Slot aus config.yaml")

    rd = sub.add_parser("render", help="Video aus Skript rendern")
    rd.add_argument("script")

    up = sub.add_parser("upload", help="fertiges Video hochladen")
    up.add_argument("video")
    up.add_argument("--script", required=True)

    sub.add_parser("auth", help="YouTube OAuth einmalig einrichten")
    sub.add_parser("voices", help="edge-tts Stimmen auflisten")

    args = p.parse_args(argv)
    cfg = load_config(Path(args.config)) if args.config else load_config()

    if args.cmd == "voices":
        from pipeline.tts import list_voices
        for v in list_voices(cfg["channel"].get("language", "de")):
            print(f"{v['ShortName']:<40} {v['Gender']:<7} {', '.join(v.get('VoiceTag', {}).get('VoicePersonalities', []))}")
        return 0

    if args.cmd == "auth":
        from pipeline.youtube import get_credentials
        get_credentials(interactive=True, cfg=cfg)
        print(f"[youtube] Token gespeichert in secrets/{cfg['youtube'].get('token_file', 'token.json')}")
        return 0

    if args.cmd == "generate":
        cmd_generate(cfg, args)
        return 0

    if args.cmd == "render":
        path = Path(args.script)
        script = load_script(path)
        cmd_render(cfg, script, path.stem)
        return 0

    if args.cmd == "upload":
        script = load_script(Path(args.script))
        vid = cmd_upload(cfg, script, Path(args.video))
        state.add_entry(title=script.title, topic=script.topic, video_id=vid, file=Path(args.video).name)
        return 0

    # run
    script, spath = cmd_generate(cfg, args)
    mp4 = cmd_render(cfg, script, spath.stem)
    entry = {"title": script.title, "topic": script.topic, "file": mp4.name, "script": spath.name, "slot": getattr(args, "slot", None)}
    if args.no_upload:
        print("[run] --no-upload: kein Upload.")
    else:
        entry["video_id"] = cmd_upload(cfg, script, mp4)
    state.add_entry(**entry)
    return 0


if __name__ == "__main__":
    sys.exit(main())
