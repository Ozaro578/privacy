#!/usr/bin/env python3
"""
ZUKKABRO – Druckvorlagen für die Verpackung (z. B. für den Packhelp-Editor).

Erzeugt SVG-Dateien (Vektor, beliebig skalierbar) in verpackung/dateien/.
Die PNG-Dateien in 300 dpi rendert werkzeuge/zukkabro_verpackung_png.cjs.

Aufruf: python3 werkzeuge/zukkabro_verpackung.py
"""
import math
import os
import random
import sys

HIER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HIER)
from zukkabro_logo_lib import (  # noqa: E402
    DEFS, FRED, TITAN, WET, bubble_word, crown, dot, drip_word, drop, text, width,
)

AUS = os.path.join(HIER, "..", "verpackung", "dateien")
PX_CM = 300 / 2.54  # 300 dpi

SCHWARZ = "#141014"
PINK = "#ff2e98"
CREME = "#fbf1e6"
CHOCO = "#2b140a"
GOLD = "#e6ab35"


def cm(x):
    return round(x * PX_CM)


def svg(w, h, inhalt, hintergrund=None, titel="ZUKKABRO"):
    bg = f'<rect width="{w}" height="{h}" fill="{hintergrund}"/>' if hintergrund else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
            f"<title>{titel}</title>{DEFS}{bg}{inhalt}</svg>\n")


def gruppe(inhalt, x, y, s=1.0, rot=0):
    return f'<g transform="translate({x:.1f} {y:.1f}) rotate({rot}) scale({s:.4f})">{inhalt}</g>'


def schreibe(name, inhalt):
    with open(os.path.join(AUS, name), "w", encoding="utf-8") as f:
        f.write(inhalt)
    print("  ", name)


# ---------- Bausteine ----------
def logo(tagline_farbe="#ffffff"):
    """ZUKKABRO-Schriftzug mit Krone und Tagline, Breite ca. 1400, Höhe ca. 500 (Ursprung oben links)."""
    W = 1400
    zw, zb = width(TITAN, "ZUKKA", 220, 6)
    bw, bb = width(WET, "BRO", 215, 10)
    x0 = (W - (zw + 26 + bw)) / 2
    zd, _ = text(TITAN, "ZUKKA", 220, 6, x0=x0 - zb[0], y0=360)
    bd, _ = text(WET, "BRO", 215, 10, x0=x0 + zw + 26 - bb[0], y0=360)
    # „VAPES“ bewusst nicht auf der Verpackung (Werbeverbot für E-Zigaretten)
    tag = "SNACKS   DRINKS   CANDY   MORE"
    tw, tb = width(FRED, tag, 34, 12)
    td, _ = text(FRED, tag, 34, 12, x0=(W - tw) / 2 - tb[0], y0=478)
    return crown(590, 22, 1.0, -3) + bubble_word(zd) + drip_word(bd) + f'<path d="{td}" fill="{tagline_farbe}"/>'


def spritzer(w, h, anzahl, seed, rand_nur=True, nur_oben_unten=False):
    """Bunte Tropfen und Punkte, vor allem am Rand."""
    rnd = random.Random(seed)
    farben = ["pink", "blue", "pink", "blue"]
    teile = []
    for _ in range(anzahl):
        while True:
            x, y = rnd.uniform(0, w), rnd.uniform(0, h)
            if nur_oben_unten:
                if y < h * 0.1 or y > h * 0.9:
                    break
                continue
            if not rand_nur:
                break
            dx, dy = abs(x - w / 2) / (w / 2), abs(y - h / 2) / (h / 2)
            if max(dx, dy) > 0.62:
                break
        r = rnd.uniform(w * 0.006, w * 0.018)
        if rnd.random() < 0.55:
            teile.append(drop(round(x), round(y), round(r), rnd.choice(farben), rnd.randint(-60, 60)))
        else:
            teile.append(dot(round(x), round(y), round(r * 0.7), rnd.choice(farben)))
    return "".join(teile)


def slogan_breite():
    a = width(TITAN, "DEINE CRAVINGS.", 120, 4)[1]
    b = width(WET, "UNSER JOB.", 150, 6)[1]
    return max(a[2], b[2]) + 20


def slogan(farbe1="#ffffff", farbe2=PINK, kontur=CHOCO):
    """„DEINE CRAVINGS. / UNSER JOB.“ – Breite slogan_breite(), Höhe ca. 330"""
    a, ab = text(TITAN, "DEINE CRAVINGS.", 120, 4, x0=0, y0=120)
    b, bb = text(WET, "UNSER JOB.", 150, 6, x0=0, y0=290)
    return (f'<g stroke-linejoin="round"><path d="{a}" fill="{kontur}" stroke="{kontur}" stroke-width="14" transform="translate(0 8)"/>'
            f'<path d="{a}" fill="{farbe1}"/></g>'
            f'<g stroke-linejoin="round"><path d="{b}" fill="{kontur}" stroke="{kontur}" stroke-width="12" transform="translate(0 8)"/>'
            f'<path d="{b}" fill="{farbe2}" stroke="{kontur}" stroke-width="5" paint-order="stroke"/></g>')


def kronen_umriss(farbe, staerke=10):
    """Einfarbige, gezeichnete Krone (wie im Bild auf Kraftpapier), ca. 240 × 150."""
    return (f'<g fill="none" stroke="{farbe}" stroke-width="{staerke}" stroke-linejoin="round" stroke-linecap="round">'
            f'<path d="M20,120 L10,40 L65,85 L120,15 L175,85 L230,40 L220,120 Z"/>'
            f'<path d="M20,138 L220,138"/></g>'
            f'<g fill="{farbe}"><circle cx="10" cy="34" r="12"/><circle cx="120" cy="9" r="13"/><circle cx="230" cy="34" r="12"/></g>')


def schrift(t, groesse, farbe, font=FRED, tracking=0, x=0, y=0):
    d, b = text(font, t, groesse, tracking, x0=x, y0=y)
    return f'<path d="{d}" fill="{farbe}"/>', b


def zentriert(t, groesse, farbe, font, w, y, tracking=0):
    tw, tb = width(font, t, groesse, tracking)
    return schrift(t, groesse, farbe, font, tracking, x=(w - tw) / 2 - tb[0], y=y)[0]


# ---------- Box: 30 × 22 × 10 cm (bei anderer Größe einfach die einzelnen Elemente nutzen) ----------
def deckel_aussen():
    w, h = cm(30), cm(22)
    s = w * 0.84 / 1400
    oben = (h - 500 * s) / 2
    inhalt = spritzer(w, h, 80, 1) + gruppe(logo(), (w - 1400 * s) / 2, oben, s)
    schreibe("01-deckel-aussen-schwarz.svg", svg(w, h, inhalt, SCHWARZ))
    inhalt_w = spritzer(w, h, 80, 1) + gruppe(logo(CHOCO), (w - 1400 * s) / 2, oben, s)
    schreibe("01b-deckel-aussen-weiss.svg", svg(w, h, inhalt_w, "#ffffff"))


def seite_lang():
    w, h = cm(30), cm(10)
    s = min(w * 0.56 / slogan_breite(), h * 0.72 / 330)
    links = gruppe(slogan(), w * 0.04, (h - 320 * s) / 2, s)
    web, _ = schrift("zukkabro.de", 150, "#ffffff", FRED, 4, 0, 0)
    ig, _ = schrift("@zukkabro", 120, PINK, FRED, 3, 0, 0)
    rechts = gruppe(crown(0, 0, 1, 0), w * 0.70, h * 0.10, 1.25) + gruppe(web, w * 0.66, h * 0.66, 1) + gruppe(ig, w * 0.66, h * 0.86, 1)
    schreibe("02-seite-lang-schwarz.svg", svg(w, h, spritzer(w, h, 22, 2, nur_oben_unten=True) + links + rechts, SCHWARZ))


def seite_kurz():
    w, h = cm(22), cm(10)
    zb = gruppe(crown(0, 0, 1, 0), w / 2 - 110 * 1.3, h * 0.08, 1.3)
    txt = zentriert("SNACKS • DRINKS • CANDY • MORE", 70, "#ffffff", FRED, w, h * 0.85, 10)
    # kleiner Schriftzug ohne Krone und Tagline
    zw, zb2 = width(TITAN, "ZUKKA", 220, 6)
    bw, bb = width(WET, "BRO", 215, 10)
    zd, _ = text(TITAN, "ZUKKA", 220, 6, x0=-zb2[0], y0=220)
    bd, _ = text(WET, "BRO", 215, 10, x0=zw + 26 - bb[0], y0=220)
    breite = zw + 26 + bw
    s = w * 0.7 / breite
    wort = gruppe(bubble_word(zd) + drip_word(bd), (w - breite * s) / 2, h * 0.3, s)
    schreibe("03-seite-kurz-schwarz.svg", svg(w, h, spritzer(w, h, 16, 3, nur_oben_unten=True) + zb + wort + txt, SCHWARZ))


def innen_deckel():
    w, h = cm(30), cm(22)
    muster = ""
    for i in range(7):
        for j in range(6):
            x, y = i * w / 6 - 60 + (j % 2) * w / 12, j * h / 5 - 40
            muster += gruppe(kronen_umriss("#ff6fb8", 9), x, y, 0.9, -12 + (i + j) % 3 * 12)
    sb = slogan_breite()
    s = w * 0.8 / sb
    mitte = gruppe(slogan("#ffffff", "#ffffff", CHOCO), (w - sb * s) / 2, h * 0.2, s)
    danke = zentriert("DANKE, BRO! VIEL SPASS MIT DEINEN SNACKS", 90, CHOCO, FRED, w, h * 0.86, 8)
    schreibe("04-deckel-innen-pink.svg", svg(w, h, muster + mitte + danke, PINK))


def innen_boden():
    w, h = cm(30), cm(22)
    muster = ""
    rnd = random.Random(5)
    for i in range(8):
        for j in range(6):
            x, y = i * w / 7 - 80 + (j % 2) * w / 14, j * h / 5 - 60
            muster += gruppe(kronen_umriss("#ffffff" if rnd.random() < .5 else "#ffd3ea", 9), x, y, 0.8, rnd.randint(-20, 20))
    schreibe("05-boden-innen-pink.svg", svg(w, h, muster, PINK))


# ---------- Klebeband (Rapport 20 × 5 cm, einfarbig) ----------
def klebeband(farbe, name, hintergrund=None):
    w, h = cm(20), cm(5)
    ks = h * 0.55 / 150
    kb = 245 * ks
    wort, b = schrift("ZUKKABRO", 190, farbe, TITAN, 8, 0, 0)
    tw = b[2] - b[0]
    luecke = (w - 2 * kb - tw) / 4
    k = gruppe(kronen_umriss(farbe, 12), luecke, h * 0.2, ks, -6)
    wg = gruppe(wort, luecke * 2 + kb - b[0], h * 0.72, 1)
    k2 = gruppe(kronen_umriss(farbe, 12), luecke * 3 + kb + tw, h * 0.2, ks, 6)
    schreibe(name, svg(w, h, k + wg + k2, hintergrund))


# ---------- Seidenpapier (Rapport 20 × 20 cm, einfarbig) ----------
def seidenpapier(farbe, name):
    w = h = cm(20)
    inhalt = ""
    rnd = random.Random(9)
    for i in range(4):
        for j in range(4):
            x, y = i * w / 4 + (j % 2) * w / 8 + 20, j * h / 4 + 40
            if (i + j) % 2:
                inhalt += gruppe(kronen_umriss(farbe, 12), x, y, 1.0, rnd.randint(-18, 18))
            else:
                t, _ = schrift("ZB", 170, farbe, TITAN, 0, 0, 0)
                inhalt += gruppe(t, x + 20, y + 170, 1.0, rnd.randint(-15, 15))
    schreibe(name, svg(w, h, inhalt))


# ---------- Sticker rund 8 cm ----------
def sticker():
    d = cm(8)
    inhalt = f'<circle cx="{d/2}" cy="{d/2}" r="{d/2 - 4}" fill="{SCHWARZ}" stroke="{PINK}" stroke-width="18"/>'
    inhalt += spritzer(d, d, 16, 4)
    s = d * 0.8 / 1400
    inhalt += gruppe(logo(), (d - 1400 * s) / 2, d * 0.3, s)
    inhalt += zentriert("DANKE, BRO!", 70, PINK, TITAN, d, d * 0.82, 4)
    schreibe("08-sticker-rund-8cm.svg", svg(d, d, inhalt))


# ---------- Danke-Karte A6 quer ----------
def danke_karte():
    w, h = cm(14.8), cm(10.5)
    inhalt = spritzer(w, h, 26, 6)
    s = w * 0.6 / 1400
    inhalt += gruppe(logo(CHOCO), (w - 1400 * s) / 2, h * 0.04, s)
    d, b = text(WET, "DANKE, BRO!", 150, 6, x0=0, y0=0)
    tw = b[2] - b[0]
    inhalt += gruppe(f'<path d="{d}" fill="{PINK}" stroke="{CHOCO}" stroke-width="8" paint-order="stroke"/>', (w - tw) / 2 - b[0], h * 0.63, 1)
    inhalt += zentriert("Schön, dass du Teil unserer Community bist!", 48, CHOCO, FRED, w, h * 0.76, 0)
    inhalt += zentriert("zukkabro.de  •  @zukkabro", 46, PINK, FRED, w, h * 0.88, 2)
    schreibe("09-danke-karte-a6.svg", svg(w, h, inhalt, CREME))


# ---------- Versandetikett 10 × 15 cm ----------
def etikett():
    w, h = cm(10), cm(15)
    s = w * 0.8 / 1400
    inhalt = gruppe(logo(CHOCO), (w - 1400 * s) / 2, h * 0.03, s)
    inhalt += f'<rect x="{w*0.07}" y="{h*0.3}" width="{w*0.86}" height="{h*0.6}" rx="30" fill="none" stroke="{CHOCO}" stroke-width="6" stroke-dasharray="30 18"/>'
    inhalt += zentriert("Platz für Adresse & Versandlabel", 40, "#9a8a80", FRED, w, h * 0.62, 0)
    inhalt += gruppe(kronen_umriss(PINK, 10), w * 0.78, h * 0.92, 0.35)
    schreibe("10-etikett-10x15.svg", svg(w, h, inhalt, "#ffffff"))


# ---------- Einzelne Elemente (transparent) zum freien Platzieren im Editor ----------
def elemente():
    schreibe("20-logo-fuer-dunkel.svg", svg(1400, 510, logo()))
    schreibe("21-logo-fuer-hell.svg", svg(1400, 510, logo(CHOCO)))
    sb = round(slogan_breite() + 40)
    schreibe("22-slogan-fuer-dunkel.svg", svg(sb, 340, gruppe(slogan(), 20, 10, 1)))
    schreibe("23-slogan-fuer-pink.svg", svg(sb, 340, gruppe(slogan("#ffffff", "#ffffff", CHOCO), 20, 10, 1)))
    schreibe("24-krone-gold.svg", svg(300, 190, crown(40, 30, 1.0, 0)))
    schreibe("25-krone-umriss-schwarz.svg", svg(270, 175, gruppe(kronen_umriss("#000000"), 10, 12, 1)))


if __name__ == "__main__":
    os.makedirs(AUS, exist_ok=True)
    print("Erzeuge Verpackungsdateien:")
    deckel_aussen(); seite_lang(); seite_kurz(); innen_deckel(); innen_boden()
    klebeband("#111111", "06-klebeband-schwarz-auf-kraft.svg")
    klebeband(PINK, "06b-klebeband-pink-auf-weiss.svg")
    seidenpapier(PINK, "07-seidenpapier-pink.svg")
    seidenpapier("#111111", "07b-seidenpapier-schwarz.svg")
    sticker(); danke_karte(); etikett(); elemente()
