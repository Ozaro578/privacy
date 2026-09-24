#!/usr/bin/env python3
"""ZUKKABRO – baut eine Vorschau der Webseite, die ganz ohne Server läuft (z. B. als claude.ai-Artifact).

- alle Seiten in einem Ordner, alle Pfade relativ
- Produktbilder verkleinert und als Daten in bilder-N.js (weniger als 255 Dateien insgesamt)
- statt Server-API eine Attrappe im Browser: Shop und Pakete funktionieren, Bestellen und Login melden "nur Vorschau"
- ?id=… in Links wird zu #id=…

Aufruf: python3 werkzeuge/zukkabro_vorschau.py ZIELORDNER
"""
import base64
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

WURZEL = Path(__file__).resolve().parent.parent / "zukkabro"
PUBLIC = WURZEL / "public"
STRATO = WURZEL / "strato"
BILD_BREITE = 320
BILD_QUALITAET = 62
TEIL_GROESSE = 6_000_000  # Zeichen pro bilder-N.js

SEITEN = {  # Quelle -> Ziel (alles flach in einem Ordner)
    "index.html": "index.html", "sortiment.html": "sortiment.html", "vapes.html": "vapes.html",
    "produkt.html": "produkt.html", "pakete.html": "pakete.html", "paket.html": "paket.html",
    "warenkorb.html": "warenkorb.html", "ueber-uns.html": "ueber-uns.html", "kontakt.html": "kontakt.html",
    "rechtliches.html": "rechtliches.html", "404.html": "404.html",
    "haendler/index.html": "haendler.html", "admin/index.html": "admin.html",
}


def shop_daten() -> dict:
    """Echte Antwort von /api/shop/daten mit leerem Speicher (gleiche Logik wie auf dem Server)."""
    with tempfile.TemporaryDirectory() as tmp:
        api = Path(tmp) / "api"
        shutil.copytree(STRATO / "api", api)
        sys.path.insert(0, str(Path(__file__).parent))
        from zukkabro_strato import ts_json, API_TS
        (api / "sortiment.json").write_text(json.dumps(ts_json(API_TS / "sortiment.mts", "SORTIMENT", "};")), encoding="utf-8")
        (api / "pakete-vorlage.json").write_text(json.dumps(ts_json(API_TS / "pakete-vorlage.mts", "PAKETE_VORLAGE", "];")), encoding="utf-8")
        (Path(tmp) / "daten").mkdir()
        code = (f"const ZB_DATEN={json.dumps(tmp + '/daten')};const ZB_SESSION_SECRET='{'x' * 40}';const ZB_ADMIN_USERS=[];"
                f"$_SERVER['REQUEST_URI']='/api/shop/daten';$_SERVER['REQUEST_METHOD']='GET';"
                f"require {json.dumps(str(api / 'index.php'))};zb_api();")
        aus = subprocess.run(["php", "-r", code], capture_output=True, text=True, check=True).stdout
        return json.loads(aus)


def pfade(text: str, css: bool = False) -> str:
    if css:
        return text.replace("url(/assets/", "url(../").replace('url("/assets/', 'url("../')
    # Produktbilder über ZBB() (liefert Bilddaten statt Dateipfad)
    text = re.sub(r"""src="/' \+ esc\(([^)]+)\)""", r"""src="' + esc(ZBB(\1))""", text)
    text = text.replace('img.src = "/" + bilder[aktiv]', "img.src = ZBB(bilder[aktiv])")
    # Seiten-Links: ?id= -> #id=
    text = re.sub(r"""(["'(=]/?[a-z0-9-]+\.html)\?""", r"\1#", text)
    text = text.replace('history.replaceState(null, "", location.pathname + (s ? "?" + s : ""));',
                        'history.replaceState(null, "", s ? "#" + s : location.pathname + location.search);')
    text = text.replace("new URLSearchParams(location.search)", "new URLSearchParams(location.search || location.hash.slice(1))")
    # Absolute Pfade -> relativ
    text = re.sub(r"""(?<=["'=])/(?=admin/["'#])""", "", text)
    text = re.sub(r"""(?<=["'=])admin/(?=["'#])""", "admin.html", text)
    text = re.sub(r"""(?<=["'=])/haendler/(?=["'#])""", "haendler.html", text)
    text = re.sub(r"""(?<=["'=])/(?=["'#])""", "index.html", text)
    text = re.sub(r"""(?<=["'=])/(?=assets/|[a-z0-9-]+\.html)""", "", text)
    return text


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    ziel = Path(sys.argv[1]).resolve()
    if ziel.exists():
        shutil.rmtree(ziel)
    (ziel / "assets").mkdir(parents=True)

    # Schriften, Grafiken, CSS, JS
    for ordner in ["fonts", "img"]:
        shutil.copytree(PUBLIC / "assets" / ordner, ziel / "assets" / ordner, ignore=shutil.ignore_patterns("produkte"))
    (ziel / "assets" / "css").mkdir()
    for f in (PUBLIC / "assets" / "css").glob("*.css"):
        (ziel / "assets" / "css" / f.name).write_text(pfade(f.read_text(encoding="utf-8"), css=True), encoding="utf-8")
    (ziel / "assets" / "js").mkdir()
    for f in (PUBLIC / "assets" / "js").glob("*.js"):
        t = f.read_text(encoding="utf-8")
        (ziel / "assets" / "js" / f.name).write_text(t if f.name == "produkte.js" else pfade(t), encoding="utf-8")

    # Produktbilder verkleinern und in Teile packen
    teile, aktuell = [], {}
    groesse = 0
    for f in sorted((PUBLIC / "assets" / "img" / "produkte").glob("*.webp")):
        im = Image.open(f)
        if im.width > BILD_BREITE:
            im = im.resize((BILD_BREITE, round(im.height * BILD_BREITE / im.width)), Image.LANCZOS)
        puffer = io.BytesIO()
        im.save(puffer, "WEBP", quality=BILD_QUALITAET, method=6)
        daten = "data:image/webp;base64," + base64.b64encode(puffer.getvalue()).decode()
        if groesse + len(daten) > TEIL_GROESSE and aktuell:
            teile.append(aktuell); aktuell, groesse = {}, 0
        aktuell["assets/img/produkte/" + f.name] = daten
        groesse += len(daten)
    if aktuell:
        teile.append(aktuell)
    bild_skripte = []
    for i, teil in enumerate(teile, 1):
        name = f"assets/js/bilder-{i}.js"
        (ziel / name).write_text("Object.assign(window.ZB_BILDER," + json.dumps(teil, separators=(",", ":")) + ");", encoding="utf-8")
        bild_skripte.append(name)

    # API-Attrappe
    vorschau = (Path(__file__).parent / "zukkabro_vorschau.js").read_text(encoding="utf-8")
    vorschau = vorschau.replace("/*SHOP_DATEN*/null", json.dumps(shop_daten(), ensure_ascii=False))
    (ziel / "assets" / "js" / "vorschau.js").write_text(vorschau, encoding="utf-8")

    # Seiten
    for quelle, name in SEITEN.items():
        t = (PUBLIC / quelle).read_text(encoding="utf-8")
        t = pfade(t)
        kopf = '<script src="assets/js/vorschau.js"></script>'
        if "produkte.js" in t:
            kopf += "".join(f'<script src="{s}"></script>' for s in bild_skripte)
        t = t.replace("</head>", kopf + "</head>", 1)
        if name == "index.html":  # kurzer Name für die Galerie
            t = re.sub(r"<title>[^<]*</title>", "<title>ZUKKABRO</title>", t, count=1)
        (ziel / name).write_text(t, encoding="utf-8")

    reste = subprocess.run(["grep", "-rnoE", r"""["'(]/(assets|api/|[a-z-]+\.html)""", str(ziel), "--include=*.html", "--include=*.css"],
                           capture_output=True, text=True).stdout
    if reste:
        print("WARNUNG, absolute Pfade übrig:\n" + reste)
    dateien = [p for p in ziel.rglob("*") if p.is_file()]
    print(f"Vorschau: {ziel} – {len(dateien)} Dateien, {sum(p.stat().st_size for p in dateien) // 1024} KB, Bildteile: {len(teile)}")


if __name__ == "__main__":
    main()
