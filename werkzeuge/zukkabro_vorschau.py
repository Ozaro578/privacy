#!/usr/bin/env python3
"""ZUKKABRO – baut eine Vorschau der Webseite, die ganz ohne Server läuft (z. B. als claude.ai-Artifact).

- alle Seiten in einem Ordner, alle Pfade relativ
- Produktbilder verkleinert und als Daten in bilder-N.js (weniger als 255 Dateien insgesamt)
- statt Server-API eine Attrappe im Browser: Shop und Pakete funktionieren, Bestellen und Login melden "nur Vorschau"
- ?id=… in Links wird zu #id=…

Aufruf: python3 werkzeuge/zukkabro_vorschau.py ZIELORDNER [--lokal]
  --lokal: Schriften in die CSS einbetten, damit die Seite auch per Doppelklick (file://) läuft,
           und eine Anleitung dazulegen.
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

# Beispiel-Angebote in der Vorschau (Preise sind nur Beispiele). Leer lassen = Slider zeigt Bestseller/Neuheiten.
BEISPIEL_ANGEBOTE = [
    {"id": "takis-fuego", "preis": 199, "alt": 249, "titel": "🔥 Deal der Woche", "bis": "2026-10-05"},
    {"id": "fanta-mix-flavor-box-china-12-330-ml", "preis": 1999, "alt": 2499, "titel": "🥤 Box-Deal"},
    {"id": "kinder-milkredible-milky-46-8g", "preis": 179, "alt": 219, "titel": "🍫 Neu & günstig"},
    {"id": "oreo-dutch-cocoa-wafer-double-choco-117g", "preis": 229, "alt": 279, "titel": "🍪 Snack-Angebot"},
    {"id": "skittles-asia-edition-sour-fruits-40g", "preis": 149, "alt": 199, "titel": "🌈 Sauer macht lustig"},
]

SEITEN = {  # Quelle -> Ziel (alles flach in einem Ordner)
    "index.html": "index.html", "sortiment.html": "sortiment.html", "vapes.html": "vapes.html",
    "produkt.html": "produkt.html", "pakete.html": "pakete.html", "paket.html": "paket.html",
    "warenkorb.html": "warenkorb.html", "ueber-uns.html": "ueber-uns.html", "kontakt.html": "kontakt.html",
    "rechtliches.html": "rechtliches.html", "404.html": "404.html", "laden.html": "laden.html", "news.html": "news.html", "stempelkarte.html": "stempelkarte.html",
    "haendler/index.html": "haendler.html", "admin/index.html": "admin.html",
}


def shop_daten(uri: str = "/api/shop/daten") -> dict:
    """Echte Antwort der PHP-API mit leerem Speicher (gleiche Logik wie auf dem Server)."""
    with tempfile.TemporaryDirectory() as tmp:
        api = Path(tmp) / "api"
        shutil.copytree(STRATO / "api", api)
        sys.path.insert(0, str(Path(__file__).parent))
        from zukkabro_strato import ts_json, API_TS
        (api / "sortiment.json").write_text(json.dumps(ts_json(API_TS / "sortiment.mts", "SORTIMENT", "};")), encoding="utf-8")
        (api / "pakete-vorlage.json").write_text(json.dumps(ts_json(API_TS / "pakete-vorlage.mts", "PAKETE_VORLAGE", "];")), encoding="utf-8")
        (api / "laden-vorlage.json").write_text(json.dumps({"laden": ts_json(API_TS / "laden-vorlage.mts", "LADEN_STANDARD", "};"), "karte": ts_json(API_TS / "laden-vorlage.mts", "KARTE_VORLAGE", "];")}), encoding="utf-8")
        (Path(tmp) / "daten").mkdir()
        if BEISPIEL_ANGEBOTE:  # Beispiel-Angebote für den Slider, gleiche Logik wie auf dem Server
            (Path(tmp) / "daten" / "preise").mkdir()
            (Path(tmp) / "daten" / "angebote").mkdir()
            (Path(tmp) / "daten" / "preise" / "shop.json").write_text(json.dumps({a["id"]: {"preis": a["alt"], "mwst": 7} for a in BEISPIEL_ANGEBOTE}), encoding="utf-8")
            (Path(tmp) / "daten" / "angebote" / "alle.json").write_text(json.dumps([{"id": a["id"], "preis": a["preis"], "titel": a["titel"], "aktiv": True, "bis": a.get("bis", "")} for a in BEISPIEL_ANGEBOTE]), encoding="utf-8")
        code = (f"const ZB_DATEN={json.dumps(tmp + '/daten')};const ZB_SESSION_SECRET='{'x' * 40}';const ZB_ADMIN_USERS=[];const ZB_STRIPE_SECRET='';const ZB_STRIPE_WEBHOOK='';"
                f"$_SERVER['REQUEST_URI']={json.dumps(uri)};$_SERVER['REQUEST_METHOD']='GET';"
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
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    lokal = "--lokal" in sys.argv
    if len(args) != 1:
        sys.exit(__doc__)
    ziel = Path(args[0]).resolve()
    if ziel.exists():
        shutil.rmtree(ziel)
    (ziel / "assets").mkdir(parents=True)

    # Schriften, Grafiken, CSS, JS
    for ordner in ["fonts", "img"]:
        shutil.copytree(PUBLIC / "assets" / ordner, ziel / "assets" / ordner, ignore=shutil.ignore_patterns("produkte"))
    (ziel / "assets" / "css").mkdir()
    for f in (PUBLIC / "assets" / "css").glob("*.css"):
        css = pfade(f.read_text(encoding="utf-8"), css=True)
        if lokal:  # Browser laden Schriften nicht von file://, deshalb einbetten
            for font in (PUBLIC / "assets" / "fonts").glob("*.woff2"):
                daten = "data:font/woff2;base64," + base64.b64encode(font.read_bytes()).decode()
                css = css.replace(f'url("../fonts/{font.name}")', f'url("{daten}")')
        (ziel / "assets" / "css" / f.name).write_text(css, encoding="utf-8")
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
    vorschau = vorschau.replace("/*LADEN_DATEN*/null", json.dumps(shop_daten("/api/shop/laden"), ensure_ascii=False))
    beispiel_news = {"news": [
        {"id": "N-1", "titel": "Laden in Heilbronn: Matcha & Açaí Bowls jedes Wochenende", "text": "Öffnungszeiten geben wir zur Eröffnung bekannt. Dazu Snacks, Drinks und Abholung eurer Online-Bestellungen.", "link": "/laden.html", "datum": "2026-10-04"},
        {"id": "N-2", "titel": "Neu im Regal: Takis, Pringles China, Fanta Japan", "text": "Frisch aus dem Import. Solange der Vorrat reicht.", "link": "/sortiment.html?kat=neu", "datum": "2026-10-01"},
        {"id": "N-3", "titel": "Themen-Pakete sind da", "text": "Netflix Night, Gamer Paket, Anime Night: fertig zusammengestellt, einfach bestellen.", "link": "/pakete.html", "datum": "2026-09-28"},
    ]}
    vorschau = vorschau.replace("/*NEWS_DATEN*/null", json.dumps(beispiel_news, ensure_ascii=False))
    (ziel / "assets" / "js" / "vorschau.js").write_text(vorschau, encoding="utf-8")

    # Seiten
    for quelle, name in SEITEN.items():
        t = (PUBLIC / quelle).read_text(encoding="utf-8")
        t = pfade(t)
        kopf = '<script src="assets/js/vorschau.js"></script>'
        if "produkte.js" in t:
            kopf += "".join(f'<script src="{s}"></script>' for s in bild_skripte)
        if lokal:  # Vorladen der Schrift scheitert bei file://, die Schrift steckt schon in der CSS
            t = re.sub(r'\s*<link rel="preload"[^>]*as="font"[^>]*>', "", t)
        t = t.replace("</head>", kopf + "</head>", 1)
        if name == "index.html":  # kurzer Name für die Galerie
            t = re.sub(r"<title>[^<]*</title>", "<title>ZUKKABRO</title>", t, count=1)
        (ziel / name).write_text(t, encoding="utf-8")

    if lokal:
        (ziel / "LIES-MICH.txt").write_text(
            "ZUKKABRO - Vorschau der Webseite (ohne Server)\n\n"
            "Doppelklick auf index.html, dann oeffnet sich die Seite im Browser.\n"
            "Alle Seiten, Produkte, Pakete und der Warenkorb funktionieren.\n"
            "Bestellen, Haendler-Login und Admin gehen erst auf der richtigen Seite (Server noetig).\n"
            "Die Angebote im Slider sind Beispiele.\n", encoding="utf-8")

    reste = subprocess.run(["grep", "-rnoE", r"""["'(]/(assets|api/|[a-z-]+\.html)""", str(ziel), "--include=*.html", "--include=*.css"],
                           capture_output=True, text=True).stdout
    if reste:
        print("WARNUNG, absolute Pfade übrig:\n" + reste)
    dateien = [p for p in ziel.rglob("*") if p.is_file()]
    print(f"Vorschau: {ziel} – {len(dateien)} Dateien, {sum(p.stat().st_size for p in dateien) // 1024} KB, Bildteile: {len(teile)}")


if __name__ == "__main__":
    main()
