#!/usr/bin/env python3
"""
ZUKKABRO – Sortiment vom Großhändler my-candytown.com übernehmen.

Holt die öffentlichen Shopify-Produktlisten, übernimmt Name, Marke,
Kategorien und Bild, aber KEINE Preise. Schreibt:

  zukkabro/public/assets/js/produkte.js        (KATEGORIEN + PRODUKTE, generiert)
  zukkabro/public/assets/img/produkte/*.webp   (verkleinerte Produktbilder)

Aufruf (aus dem Repo-Hauptordner):
  python3 werkzeuge/zukkabro_produkte_import.py

Eigene Preise, Kontaktdaten und Bestseller stehen in
zukkabro/public/assets/js/shop.js und werden hier nicht überschrieben.
"""

import concurrent.futures as cf
import datetime as dt
import json
import os
import re
import sys
import time
import urllib.request

BASIS = "https://my-candytown.com"
ZIEL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "zukkabro", "public")
BILD_ORDNER = os.path.join(ZIEL, "assets", "img", "produkte")
JS_DATEI = os.path.join(ZIEL, "assets", "js", "produkte.js")
SERVER_DATEI = os.path.join(ZIEL, "..", "netlify", "functions", "api", "sortiment.mts")
BILD_BREITE = 400
NEU_TAGE = 45
UA = "Mozilla/5.0 (ZUKKABRO Sortiment-Abgleich)"

# Reihenfolge = Reihenfolge auf der Seite.
# handle = Kategorie beim Großhändler, None = eigene Kategorie
KATEGORIEN = [
    {"id": "susses",      "handle": "susses",                              "name": "Süßes & Saures",      "emoji": "🍬", "farbe": "pink"},
    {"id": "snacks",      "handle": "snacks",                              "name": "Snacks",              "emoji": "🍿", "farbe": "gold"},
    {"id": "scharfes",    "handle": "scharfes",                            "name": "Salziges & Scharfes", "emoji": "🌶️", "farbe": "orange"},
    {"id": "getraenke",   "handle": "getranke",                            "name": "Getränke",            "emoji": "🥤", "farbe": "blue"},
    {"id": "vapes",       "handle": "vapes-und-zubehor",                   "name": "Vapes & Zubehör",     "emoji": "💨", "farbe": "dark",   "ab18": True},
    {"id": "elfbar",      "handle": "elfbar-elfa",                         "name": "Elfbar Elfa",         "emoji": "🔋", "farbe": "violet", "ab18": True},
    {"id": "mystery",     "handle": "mystery-packs",                       "name": "Mystery Packs",       "emoji": "🎁", "farbe": "violet"},
    {"id": "anime",       "handle": "anime",                               "name": "Anime",               "emoji": "🍥", "farbe": "pink"},
    {"id": "karten",      "handle": "karten",                              "name": "Karten",              "emoji": "🃏", "farbe": "blue"},
    {"id": "zahnstocher", "handle": "wunder-zahnstocher",                  "name": "Wunder Zahnstocher",  "emoji": "🌿", "farbe": "green"},
    {"id": "pipapo",      "handle": "pipapo-knax-amo-aller-amos-edition",  "name": "Pipapo Knax Edition", "emoji": "🔥", "farbe": "orange"},
    {"id": "fun",         "handle": None,                                  "name": "Fun & Squishy",       "emoji": "🧸", "farbe": "blue"},
]
ALLE_HANDLE = "best-seller"  # beim Großhändler "Alle Produkte"

# Interne Großhandelsartikel, die nicht in den Shop gehören
AUSSCHLUSS = re.compile(r"paketband|pfand|mandatory|gebühr|versandkarton|klebeband", re.I)
# Artikel, die vor dem öffentlichen Start rechtlich geprüft werden sollten
PRUEFEN = re.compile(r"\bcbd\b|sheesh budz|\bhhc\b|\bthc\b(?!.*test)|erotik", re.I)
AB18_TITEL = re.compile(r"erotik|fsk\s*18|nikotin|nicsalt|\d+\s*mg\b.*(pod|liquid|vape)|shisha|tabak", re.I)
# Name des Großhändlers nicht als Marke zeigen (Kunden sollen den Lieferanten nicht sehen)
GROSSHAENDLER = re.compile(r"my\s*candy\s*town", re.I)
# MHD-Angaben am Namensende entfernen, z. B. "20.08.27" oder "mhd 08/27"
MHD = re.compile(r"\s*(?:mhd\s*)?\b\d{1,2}[./](?:\d{4}|\d{2}(?:[./]\d{2,4})?)\s*$", re.I)


def hole_json(url, versuche=3):
    for i in range(versuche):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except Exception as e:  # noqa: BLE001
            if i == versuche - 1:
                raise
            print(f"  Wiederhole {url}: {e}")
            time.sleep(3)


def produkte_der_kategorie(handle):
    alle, seite = [], 1
    while True:
        daten = hole_json(f"{BASIS}/collections/{handle}/products.json?limit=250&page={seite}")
        teil = daten.get("products", [])
        alle.extend(teil)
        if len(teil) < 250:
            return alle
        seite += 1
        time.sleep(1)


def sauberer_name(titel):
    name = re.sub(r"\s+", " ", titel).strip()
    for _ in range(2):
        name = MHD.sub("", name).strip(" -–")
    return name


MAX_BILDER = 6


def bild_laden(auftrag):
    dateiname, url = auftrag
    ziel = os.path.join(BILD_ORDNER, dateiname)
    if os.path.exists(ziel) and os.path.getsize(ziel) > 0:
        return True
    trenn = "&" if "?" in url else "?"
    req = urllib.request.Request(f"{url}{trenn}width={BILD_BREITE}", headers={"User-Agent": UA, "Accept": "image/webp,image/*"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            daten = r.read()
        with open(ziel, "wb") as f:
            f.write(daten)
        return True
    except Exception as e:  # noqa: BLE001
        print(f"  Bild fehlt: {dateiname}: {e}")
        return False


def main():
    os.makedirs(BILD_ORDNER, exist_ok=True)
    heute = dt.datetime.now(dt.timezone.utc)
    produkte = {}  # id -> Datensatz
    kats_pro_produkt = {}

    print("Lade Kategorien …")
    for kat in KATEGORIEN:
        if not kat["handle"]:
            continue
        liste = produkte_der_kategorie(kat["handle"])
        print(f"  {kat['name']}: {len(liste)}")
        for p in liste:
            produkte[p["id"]] = p
            kats_pro_produkt.setdefault(p["id"], []).append(kat["id"])
        time.sleep(1)

    print("Lade alle Produkte …")
    for p in produkte_der_kategorie(ALLE_HANDLE):
        produkte.setdefault(p["id"], p)
        kats_pro_produkt.setdefault(p["id"], [])

    ab18_kats = {k["id"] for k in KATEGORIEN if k.get("ab18")}
    ergebnis = []
    for pid, p in produkte.items():
        titel = p.get("title", "")
        if AUSSCHLUSS.search(titel) or AUSSCHLUSS.search(p.get("vendor", "")):
            continue
        kats = kats_pro_produkt.get(pid) or ["fun"]
        erstellt = dt.datetime.fromisoformat(p["created_at"].replace("Z", "+00:00"))
        eintrag = {
            "id": p["handle"],
            "name": sauberer_name(titel),
            "marke": "" if GROSSHAENDLER.search(p.get("vendor") or "") else (p.get("vendor") or "").strip(),
            "kat": kats,
        }
        if any(k in ab18_kats for k in kats) or AB18_TITEL.search(titel):
            eintrag["ab18"] = True
        if (heute - erstellt).days <= NEU_TAGE:
            eintrag["neu"] = True
        if not any(v.get("available") for v in p.get("variants", [])):
            eintrag["aus"] = True
        if PRUEFEN.search(titel):
            eintrag["pruefen"] = True
        if p.get("images"):
            eintrag["_bilder"] = [
                (f"{p['handle']}.webp" if i == 0 else f"{p['handle']}-{i + 1}.webp", bild["src"])
                for i, bild in enumerate(p["images"][:MAX_BILDER])
            ]
        ergebnis.append((erstellt, eintrag))

    # Neueste zuerst
    ergebnis.sort(key=lambda x: x[0], reverse=True)
    eintraege = [e for _, e in ergebnis]

    auftraege = [a for e in eintraege for a in e.get("_bilder", [])]
    print(f"Lade {len(auftraege)} Bilder …")
    with cf.ThreadPoolExecutor(max_workers=6) as ex:
        ok = dict(zip([a[0] for a in auftraege], ex.map(bild_laden, auftraege)))
    for e in eintraege:
        dateien = [d for d, _ in e.pop("_bilder", []) if ok.get(d)]
        if dateien:
            e["bild"] = f"assets/img/produkte/{dateien[0]}"
            if len(dateien) > 1:
                e["bilder"] = [f"assets/img/produkte/{d}" for d in dateien]

    # Nicht mehr verwendete Bilder entfernen
    gueltig = {os.path.basename(b) for e in eintraege for b in (e.get("bilder") or ([e["bild"]] if "bild" in e else []))}
    for datei in os.listdir(BILD_ORDNER):
        if datei.endswith(".webp") and datei not in gueltig:
            os.remove(os.path.join(BILD_ORDNER, datei))

    kats_js = [{k: v for k, v in kat.items() if k != "handle"} for kat in KATEGORIEN]
    stand = heute.strftime("%d.%m.%Y")
    with open(JS_DATEI, "w", encoding="utf-8") as f:
        f.write("/* =========================================================\n")
        f.write("   ZUKKABRO – Sortiment (AUTOMATISCH ERZEUGT, nicht von Hand ändern)\n")
        f.write(f"   Quelle: Großhändler my-candytown.com, Stand {stand}\n")
        f.write("   Neu erzeugen: python3 werkzeuge/zukkabro_produkte_import.py\n")
        f.write("   Preise, Kontaktdaten und Bestseller: assets/js/shop.js\n")
        f.write("   ========================================================= */\n\n")
        f.write(f'const SORTIMENT_STAND = "{stand}";\n\n')
        f.write("const KATEGORIEN = " + json.dumps(kats_js, ensure_ascii=False, indent=2) + ";\n\n")
        f.write("const PRODUKTE = [\n")
        f.write(",\n".join("  " + json.dumps(e, ensure_ascii=False, separators=(",", ":")) for e in eintraege))
        f.write("\n];\n")

    # Kurzfassung für den Server (Name, Kategorien, 18+, lieferbar), damit die Kasse
    # nicht den Angaben aus dem Browser vertrauen muss
    server = {e["id"]: {"n": e["name"], "k": e["kat"], **({"a": 1} if e.get("ab18") else {}), **({"x": 1} if e.get("aus") else {})} for e in eintraege}
    with open(SERVER_DATEI, "w", encoding="utf-8") as f:
        f.write("// AUTOMATISCH ERZEUGT von werkzeuge/zukkabro_produkte_import.py – nicht von Hand ändern.\n")
        f.write("// n = Name, k = Kategorien, a = ab 18, x = beim Großhändler nicht lieferbar\n")
        f.write("export const SORTIMENT: Record<string, { n: string; k: string[]; a?: 1; x?: 1 }> = ")
        f.write(json.dumps(server, ensure_ascii=False, separators=(",", ":")))
        f.write(";\n")

    print(f"Fertig: {len(eintraege)} Produkte, {len(gueltig)} Bilder.")
    for kat in KATEGORIEN:
        n = sum(1 for e in eintraege if kat["id"] in e["kat"])
        print(f"  {kat['name']}: {n}")
    print(f"  18+: {sum(1 for e in eintraege if e.get('ab18'))}, neu: {sum(1 for e in eintraege if e.get('neu'))}, "
          f"nicht lieferbar: {sum(1 for e in eintraege if e.get('aus'))}, prüfen: {sum(1 for e in eintraege if e.get('pruefen'))}")


if __name__ == "__main__":
    sys.exit(main())
