#!/usr/bin/env python3
"""
ZUKKABRO – Kurzbeschreibungen für alle Produkte erzeugen.
Der Großhändler liefert keine brauchbaren Texte, deshalb entstehen die Texte hier
aus Marke, Kategorie und Produktname (Marken-Wissen unten in MARKEN pflegen).
Schreibt: zukkabro/public/assets/js/produktinfo.js  (PRODUKTINFO = { id: { info, hinweise[] } })
Zutaten und Allergene pflegt ihr im Admin (Produktinfos); die liegen auf dem Server.
Aufruf (aus dem Repo-Hauptordner):  python3 werkzeuge/zukkabro_produktinfo.py
"""
import datetime as dt
import json
import os
import re

HIER = os.path.dirname(os.path.abspath(__file__))
JS_PRODUKTE = os.path.join(HIER, "..", "zukkabro", "public", "assets", "js", "produkte.js")
JS_ZIEL = os.path.join(HIER, "..", "zukkabro", "public", "assets", "js", "produktinfo.js")

# Marke -> ein Satz, der zur Marke passt (Herkunft, was es ist)
MARKEN = {
    "Takis": "Takis aus Mexiko sind gerollte Tortilla-Chips mit ordentlich Chili und Limette – der Klassiker für alle, die es richtig scharf mögen.",
    "SamYang Buldak": "Samyang Buldak aus Korea ist die berühmte Hot-Chicken-Ramen – feurig scharf, cremig-würzig und ein Social-Media-Kult.",
    "Pringles": "Pringles in Sorten, die es in Deutschland sonst nicht gibt – die bekannten Stapelchips in der Dose, Geschmack aus Asien und den USA.",
    "Lays Chips": "Lay's aus Asien: Kartoffelchips in Geschmacksrichtungen, die man hier selten findet – ideal zum Probieren und Teilen.",
    "Fanta": "Fanta in Sorten aus Asien, den USA und dem Mittleren Osten – fruchtig, bunt und anders als die deutsche Version.",
    "Cola": "Coca-Cola in Sondersorten aus aller Welt – die bekannte Cola in Geschmacksrichtungen, die es im Supermarkt nicht gibt.",
    "Pepsi": "Pepsi in besonderen Sorten aus dem Ausland – süß, spritzig und ein Hingucker in der Dose.",
    "Sprite": "Sprite in Importsorten – Zitrone-Limette mal anders, z. B. mit Tee oder Frucht.",
    "Mountain Dew": "Mountain Dew aus den USA – die Zitrus-Limonade mit Koffein in Sorten, die hier Kult sind.",
    "7Up": "7Up in Importsorten – klare Zitrus-Limonade mit besonderem Dreh.",
    "Mirinda": "Mirinda aus dem Ausland – fruchtig-süße Limonade in bunten Sorten.",
    "Dr. Pepper": "Dr. Pepper – die US-Limonade mit dem unverwechselbaren Kirsch-Karamell-Geschmack, in seltenen Sorten.",
    "Arizona": "Arizona aus den USA – Eistee und Fruchtdrinks in der großen Dose, erfrischend und ikonisch.",
    "Calypso": "Calypso aus den USA – Limonade mit echtem Fruchtsaft in der Glasflasche, frisch und süß.",
    "Lipton": "Lipton Eistee in Importsorten – erfrischend, fruchtig und gekühlt am besten.",
    "Starbucks": "Starbucks Kaffee-Drinks zum Mitnehmen – kalter Kaffeegenuss in der Flasche oder Dose.",
    "Redbull": "Red Bull in Sondereditionen – der Energy-Drink-Klassiker mit Fruchtgeschmack.",
    "Monster": "Monster Energy in Sorten aus Asien und den USA – Energy-Drink mit viel Geschmack.",
    "Amigo": "Amigo Drinks – fruchtige Eistees und Säfte in der praktischen kleinen Packung.",
    "Hata Kosen": "Hata Kosen Ramune aus Japan – die Kult-Limonade mit der Glasmurmel in der Flasche, in vielen Fruchtsorten.",
    "Cokoc": "Cokoc – süße Getränke und Snacks aus Asien, bunt und fruchtig.",
    "Bergen": "Bergen – Drinks und Süßes aus dem Import-Sortiment.",
    "Skittles": "Skittles in Importsorten – die bunten Fruchtkaubonbons in Varianten, die es hier selten gibt.",
    "Nerds": "Nerds aus den USA – winzige, knusprige Zuckerbonbons mit intensivem Fruchtgeschmack, auch als Gummy Clusters.",
    "Airheads": "Airheads aus den USA – weiche, fruchtige Kaubonbons mit kräftigem Geschmack.",
    "Mentos": "Mentos in Importsorten – die bekannten Kaudragees mit frischem Fruchtgeschmack.",
    "Oreo": "Oreo in Sorten aus Asien und den USA – der Keks-Klassiker mit Füllungen, die es hier sonst nicht gibt.",
    "Kinder Schokolade": "Kinder-Produkte in Importversionen – die bekannten Schokoriegel und Snacks in besonderen Varianten.",
    "Hershey’s": "Hershey's aus den USA – Schokolade und Riegel mit typisch amerikanischem Geschmack.",
    "Reese's": "Reese's aus den USA – die Kombination aus Erdnussbutter und Schokolade, die süchtig macht.",
    "Tonys": "Tony's – Schokolade mit ganzen Erdbeeren und besonderen Aromen, aus Asien.",
    "Pocky": "Pocky von Glico aus Japan – die knusprigen Keksstangen mit Schokoladen- oder Fruchtüberzug.",
    "Frosty Bites": "Frosty Bites – gefriergetrocknete Süßigkeiten: luftig, knusprig und mit intensivem Geschmack, der TikTok-Trend.",
    "Elite": "Elit aus der Türkei – Schokolade und Süßes, bekannt durch die Dubai-Schokolade mit Pistazie und Kadayif.",
    "Agiberia": "Agiberia Croissants – weiche, gefüllte Croissants für zwischendurch.",
    "Johny Bee": "Johny Bee – lustige Süßigkeiten, die Spaß machen.",
    "SABLE": "SABLE Soft Center Cookies aus Asien – weiche Kekse mit cremiger Füllung.",
    "Candy Paradise": "Candy Paradise – bunte Süßigkeiten-Mischungen.",
    "Jelly Sticks": "Jelly Sticks – fruchtige Gelee-Sticks aus Asien, erfrischend und spaßig.",
    "Dr. Sour": "Dr. Sour – extrem saure Süßigkeiten für Mutige.",
    "Roll-Ups": "Fruit Roll-Ups aus den USA – fruchtige Kaustreifen zum Abrollen.",
    "SWEET16": "SWEET16 – trendige Süßigkeiten für die Candy-Bar.",
    "LUVA & CO": "LUVA & CO – süße Snacks aus dem Import-Sortiment.",
    "Dately": "Dately – Dattel-Snacks: natürlich süß, mit Schokolade oder Nüssen.",
    "Royal Family": "Royal Family aus Taiwan – weiche Mochi-Küchlein mit Fruchtfüllung.",
    "Junyi": "Junyi – asiatische Snacks und Süßigkeiten.",
    "Sinky": "Sinky – Snacks aus Asien.",
    "Bandito": "Bandito – würzige Snacks für die Pause.",
    "Avibes": "Avibes – Drinks und Snacks mit gutem Vibe.",
    "Avesta": "Avesta – Süßes aus dem Import-Sortiment.",
    "Seedos": "Seedos – geröstete Kerne und Samen als Snack.",
    "BOOM": "BOOM – Snacks mit Wow-Effekt.",
    "Jana": "Jana – Snacks und Süßes.",
    "Amos": "Amos – Fruchtgummis aus Asien, die 4D-Gummies mit Formen und Füllung.",
    "Pipapo": "Pipapo Knax – die Amo-Edition mit Fruchtgummi-Spaß.",
    "4 Blockz": "4 Blockz – Fruchtgummi-Blöcke zum Teilen.",
    "Kolja Goldstein": "Die Kolja-Goldstein-Edition – Snacks und Drinks aus der Creator-Kollektion.",
    "ADAI": "ADAI – Produkte aus dem Import-Sortiment.",
    "Wunder Zahnstocher": "Wunder Zahnstocher – aromatisierte Zahnstocher mit Geschmack, der Kiosk-Trend aus Social Media.",
    "One Piece": "One Piece – offizielles Merchandise und Sammelkarten zum Anime-Hit.",
    "Naruto": "Naruto – offizielle Produkte zum Anime-Klassiker.",
    "Dragon Ball": "Dragon Ball – offizielle Sammelkarten und Produkte zum Anime.",
    "Demon Slayer": "Demon Slayer – offizielle Produkte zum Anime.",
    "Elfbar": "Elfbar – Einweg-Vapes und Liquids des bekannten Herstellers. Nur für Erwachsene ab 18 Jahren.",
    "Elfbar Elfa": "Elfbar Elfa – das Pod-System mit austauschbaren Pods. Nur für Erwachsene ab 18 Jahren.",
    "Elfbar Elfliq": "Elfbar Elfliq – Liquids von Elfbar zum Nachfüllen. Nur für Erwachsene ab 18 Jahren.",
    "HQD": "HQD – Einweg-Vapes mit vielen Geschmacksrichtungen. Nur für Erwachsene ab 18 Jahren.",
    "HQD Cirak": "HQD Cirak – Vape-System von HQD. Nur für Erwachsene ab 18 Jahren.",
    "Flerbar M": "Flerbar M – Einweg-Vapes. Nur für Erwachsene ab 18 Jahren.",
    "Smart Bar": "Smart Bar – Einweg-Vapes. Nur für Erwachsene ab 18 Jahren.",
    "ELIQ": "ELIQ – Liquids zum Nachfüllen. Nur für Erwachsene ab 18 Jahren.",
    "LIQ IT": "LIQ IT – Liquids zum Nachfüllen. Nur für Erwachsene ab 18 Jahren.",
    "SC8PER": "SC8PER – Vape-Produkte. Nur für Erwachsene ab 18 Jahren.",
    "Gazo": "GAZO – Aromaprodukte für Erwachsene ab 18 Jahren.",
    "SHEESH BUDZ": "SHEESH BUDZ – Aromaprodukte für Erwachsene ab 18 Jahren.",
    "SHEESH Rollz": "SHEESH Rollz – Aromaprodukte für Erwachsene ab 18 Jahren.",
    "Fidget Ball": "Fidget Ball – Anti-Stress-Spielzeug für die Hosentasche.",
    "Ruru Squishy": "Ruru Squishy – weiche, langsam zurückformende Squishies zum Kneten.",
    "Mystery Packs": "Mystery Pack – Überraschungsinhalt, der Spaß beginnt beim Auspacken.",
    "MORE Nutrition": "MORE Nutrition – Protein-Produkte für Sportler.",
}

KAT_SATZ = {
    "susses": "Süßes aus aller Welt – perfekt für die Candy-Bar, den Filmabend oder als kleines Geschenk.",
    "snacks": "Ein Snack für zwischendurch, zum Teilen oder für die Serie am Abend.",
    "scharfes": "Für alle, die es würzig und scharf mögen.",
    "getraenke": "Am besten eiskalt genießen.",
    "vapes": "Verkauf nur an Erwachsene ab 18 Jahren, Altersprüfung bei der Übergabe.",
    "elfbar": "Verkauf nur an Erwachsene ab 18 Jahren, Altersprüfung bei der Übergabe.",
    "zahnstocher": "100 Stück pro Packung, Geschmack nach Sorte.",
    "fun": "Spielzeug und Fun-Artikel – nicht zum Verzehr.",
    "karten": "Sammelkarten im Booster-Pack, Inhalt zufällig.",
    "anime": "Für Anime-Fans und Sammler.",
    "mystery": "Überraschungspaket, Inhalt wechselt.",
    "pipapo": "Fruchtgummi-Spaß in der Amo-Edition.",
}

GESCHMACK = [
    (r"erdbeer|strawberry", "Erdbeere"), (r"himbeer|raspberry", "Himbeere"), (r"blaubeer|blueberry|heidelbeer", "Blaubeere"),
    (r"kirsch|cherry", "Kirsche"), (r"traube|grape", "Traube"), (r"wassermelone|watermelon", "Wassermelone"), (r"melone|melon", "Melone"),
    (r"mango", "Mango"), (r"pfirsich|peach", "Pfirsich"), (r"ananas|pineapple", "Ananas"), (r"apfel|apple", "Apfel"), (r"zitrone|lemon", "Zitrone"),
    (r"limette|lime", "Limette"), (r"orange", "Orange"), (r"banane|banana", "Banane"), (r"kokos|coconut", "Kokos"), (r"vanille|vanilla", "Vanille"),
    (r"karamell|caramel", "Karamell"), (r"schoko|choco|kakao|cocoa", "Schokolade"), (r"pistazie|pistachio", "Pistazie"), (r"matcha", "Matcha"),
    (r"cola", "Cola"), (r"minze|mint", "Minze"), (r"menthol|ice\b", "Ice"), (r"chili|hot|spicy|scharf|fuego|flame", "scharf"), (r"bbq|barbecue", "BBQ"),
    (r"käse|cheese", "Käse"), (r"sour|sauer", "sauer"), (r"honig|honey", "Honig"), (r"cookie|keks", "Cookie"), (r"erdnuss|peanut", "Erdnuss"),
    (r"lychee|litschi", "Litschi"), (r"yuzu", "Yuzu"), (r"jasmin", "Jasmin"), (r"tee\b|tea\b", "Tee"), (r"kaffee|coffee", "Kaffee"),
]

KOFFEIN = re.compile(r"energy|monster|red ?bull|rockstar|golden eagle|prime energy|mountain dew|coffee|kaffee|cold brew|cola\b|matcha", re.I)
ZUCKERFREI = re.compile(r"zero|sugar ?free|zuckerfrei|diet|light\b|no sugar", re.I)
NIKOTIN = re.compile(r"vape|elfbar|elfa|elfliq|hqd|flerbar|smart bar|liquid|liq\b|puffs|pod|nikotin|nicotine|sc8per", re.I)


def beschreibung(p: dict) -> str:
    marke = p.get("marke") or ""
    kat = p.get("kat") or []
    saetze = []
    m = MARKEN.get(marke)
    if m:
        saetze.append(m)
    aromen = [a for rx, a in GESCHMACK if re.search(rx, p["name"], re.I)]
    aromen = list(dict.fromkeys(aromen))[:3]
    if aromen and kat and kat[0] not in ("vapes", "elfbar", "fun", "karten", "anime", "mystery"):
        saetze.append("Geschmack: " + ", ".join(aromen) + ".")
    elif aromen and kat and kat[0] in ("vapes", "elfbar"):
        saetze.append("Geschmacksrichtung: " + ", ".join(aromen) + ".")
    for k in kat[:2]:
        s = KAT_SATZ.get(k)
        if s and s not in saetze:
            saetze.append(s)
            break
    if not m:
        saetze.insert(0, f"{p['name']} – aus unserem Import-Sortiment bei ZUKKABRO in Heilbronn.")
    return " ".join(saetze)


def hinweise(p: dict) -> list:
    h = []
    name = p["name"]
    kat = p.get("kat") or []
    if kat and kat[0] == "getraenke" and KOFFEIN.search(name) and not re.search(r"decaf|koffeinfrei", name, re.I):
        h.append("Kann Koffein enthalten – genaue Angabe siehe Verpackung. Energy-Drinks: erhöhter Koffeingehalt, für Kinder und schwangere oder stillende Frauen nicht empfohlen.")
    if ZUCKERFREI.search(name):
        h.append("Mit Süßungsmitteln.")
    if kat and kat[0] in ("vapes", "elfbar") and NIKOTIN.search(name + " " + (p.get("marke") or "")):
        h.append("Dieses Produkt enthält Nikotin: ein Stoff, der sehr stark abhängig macht.")
    if p.get("ab18"):
        h.append("Abgabe nur an Personen ab 18 Jahren.")
    if kat and kat[0] in ("susses", "snacks", "scharfes", "getraenke", "zahnstocher", "pipapo"):
        h.append("Zutaten, Allergene und Nährwerte stehen auf der Verpackung. Bei Fragen: 07131 5912230.")
    if kat and kat[0] == "fun":
        h.append("Kein Lebensmittel. Nicht für Kinder unter 3 Jahren geeignet, Kleinteile.")
    return h


def main() -> None:
    s = open(JS_PRODUKTE, encoding="utf-8").read()
    teil = s[s.index("const PRODUKTE = [") + len("const PRODUKTE = "):]
    produkte = json.loads(teil[: teil.index("];") + 1])
    infos = {p["id"]: {"info": beschreibung(p), "hinweise": hinweise(p)} for p in produkte}
    stand = dt.date.today().strftime("%d.%m.%Y")
    with open(JS_ZIEL, "w", encoding="utf-8") as f:
        f.write("/* ZUKKABRO – Kurzbeschreibungen (AUTOMATISCH ERZEUGT, nicht von Hand ändern)\n")
        f.write(f"   Stand {stand}. Neu erzeugen: python3 werkzeuge/zukkabro_produktinfo.py (Marken-Texte dort pflegen)\n")
        f.write("   Zutaten, Allergene und eigene Texte kommen aus dem Admin (Produktinfos) und haben Vorrang. */\n")
        f.write("const PRODUKTINFO = {\n" + ",\n".join(json.dumps(k) + ":" + json.dumps(v, ensure_ascii=False, separators=(",", ":")) for k, v in infos.items()) + "\n};\nwindow.PRODUKTINFO = PRODUKTINFO;\n")
    mit_marke = sum(1 for p in produkte if p.get("marke") in MARKEN)
    print(f"{len(infos)} Beschreibungen ({mit_marke} mit Markentext) → {os.path.relpath(JS_ZIEL)}")


if __name__ == "__main__":
    main()
