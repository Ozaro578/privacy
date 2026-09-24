#!/usr/bin/env python3
"""ZUKKABRO – baut das Upload-Paket für Strato (PHP-Webspace).

Ergebnis im Zielordner:
  zukkabro-strato/        -> genau diesen Inhalt per SFTP in den Strato-Ordner der Domain laden
  zukkabro-strato.zip     -> dasselbe als ZIP (für den Strato-Dateimanager)
  ZUGANGSDATEN.txt        -> Passwörter im Klartext. NICHT hochladen, NICHT ins Git!

Aufruf:
  python3 werkzeuge/zukkabro_strato.py ZIELORDNER [--zugang zugang.json]

zugang.json (optional, sonst werden neue Passwörter erzeugt):
  {"seite": "Team-Passwort", "admins": {"admin1": "Passwort", "admin2": "Passwort"}}

Braucht PHP auf dem Rechner (für password_hash).
"""
import argparse
import json
import re
import secrets
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

WURZEL = Path(__file__).resolve().parent.parent / "zukkabro"
STRATO = WURZEL / "strato"
API_TS = WURZEL / "netlify" / "functions" / "api"


def php_hash(passwort: str) -> str:
    code = "echo password_hash(stream_get_contents(STDIN), PASSWORD_DEFAULT);"
    h = subprocess.run(["php", "-r", code], input=passwort, capture_output=True, text=True, check=True).stdout.strip()
    if not h.startswith("$2y$") and not h.startswith("$argon"):
        sys.exit("PHP hat keinen gültigen Hash geliefert: " + h)
    return h


def php_text(s: str) -> str:
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"


def ts_json(datei: Path, name: str, ende: str):
    """Liest das JSON-Literal hinter `export const NAME ... =` aus einer .mts-Datei."""
    t = datei.read_text(encoding="utf-8")
    m = re.search(r"export const " + name + r"\b[^=]*=\s*", t)
    start = m.end()
    stop = t.rindex(ende) + len(ende) - 1
    return json.loads(t[start:stop])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ziel")
    ap.add_argument("--zugang", help="JSON mit Team- und Admin-Passwörtern")
    a = ap.parse_args()

    ziel = Path(a.ziel).resolve()
    paket = ziel / "zukkabro-strato"
    if paket.exists():
        shutil.rmtree(paket)
    paket.mkdir(parents=True)

    if a.zugang:
        zugang = json.loads(Path(a.zugang).read_text(encoding="utf-8"))
    else:
        zugang = {"seite": "Zukka-" + secrets.token_urlsafe(9),
                  "admins": {"admin1": secrets.token_urlsafe(12), "admin2": secrets.token_urlsafe(12)}}

    # 1. Server-Dateien
    shutil.copy2(STRATO / "tor.php", paket / "tor.php")
    shutil.copy2(STRATO / ".htaccess", paket / ".htaccess")
    (paket / "api").mkdir()
    for f in ["index.php", "speicher.php", "sicherheit.php", ".htaccess"]:
        shutil.copy2(STRATO / "api" / f, paket / "api" / f)
    (paket / "daten").mkdir()
    shutil.copy2(STRATO / "daten" / ".htaccess", paket / "daten" / ".htaccess")

    # 2. Sortiment und Start-Pakete als JSON (gleiche Daten wie die Netlify-Version)
    sortiment = ts_json(API_TS / "sortiment.mts", "SORTIMENT", "};")
    pakete = ts_json(API_TS / "pakete-vorlage.mts", "PAKETE_VORLAGE", "];")
    (paket / "api" / "sortiment.json").write_text(json.dumps(sortiment, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (paket / "api" / "pakete-vorlage.json").write_text(json.dumps(pakete, ensure_ascii=False, indent=1), encoding="utf-8")

    # 3. Webseite unverändert
    shutil.copytree(WURZEL / "public", paket / "public")

    # 4. config.php mit Geheimnissen (nur im Upload-Paket, nie im Git)
    admins = "\n".join(f"    {php_text(n.lower())} => {php_text(php_hash(p))}," for n, p in zugang["admins"].items())
    config = f"""<?php
// ZUKKABRO – Zugangsdaten (automatisch erzeugt). Diese Datei ist geheim.
declare(strict_types=1);
const ZB_DATEN = __DIR__ . '/daten';
const ZB_SESSION_SECRET = {php_text(secrets.token_urlsafe(48))};
// Team-Passwort für die ganze Seite. Leer lassen = Seite öffentlich (erst machen, wenn alles fertig ist!)
const ZB_TOR_HASH = {php_text(php_hash(zugang["seite"]) if zugang.get("seite") else "")};
const ZB_ADMIN_USERS = [
{admins}
];
"""
    (paket / "config.php").write_text(config, encoding="utf-8")

    # 5. ZIP
    zip_pfad = ziel / "zukkabro-strato.zip"
    with zipfile.ZipFile(zip_pfad, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(paket.rglob("*")):
            if f.is_file():
                z.write(f, f.relative_to(paket).as_posix())

    zeilen = ["ZUKKABRO – Zugangsdaten (NICHT hochladen, NICHT weitergeben)", "",
              f"Team-Passwort für die Seite: {zugang.get('seite') or '(kein Schutz)'}", "",
              "Admin-Login (/admin/):"] + [f"  {n} / {p}" for n, p in zugang["admins"].items()]
    (ziel / "ZUGANGSDATEN.txt").write_text("\n".join(zeilen) + "\n", encoding="utf-8")

    anzahl = sum(1 for f in paket.rglob("*") if f.is_file())
    print(f"Fertig: {paket} ({anzahl} Dateien)")
    print(f"ZIP:    {zip_pfad} ({zip_pfad.stat().st_size // 1024} KB)")
    print(f"Zugang: {ziel / 'ZUGANGSDATEN.txt'}")


if __name__ == "__main__":
    main()
