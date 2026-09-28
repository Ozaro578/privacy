# Kanal-Plan: Kinder-Shorts mit KI (3 Videos / Tag)

Stand: 28.09.2026 · Grundlage: Analyse von
[„how i make $36,438/mo posting YouTube Shorts (using AI)“](https://www.youtube.com/watch?v=ygeCgN-SfE8)
(Kellan Henneberry) und Uebertragung auf einen kindgerechten Kanal.

---

## 1. Was das Vorbild-Video lehrt (und was wir davon uebernehmen)

| Vorbild (Kellan)                                                  | Unsere Umsetzung                                                                 |
|-------------------------------------------------------------------|----------------------------------------------------------------------------------|
| Faceless Storytelling-Shorts: ChatGPT-Skript, KI-Stimme, Captions, fesselnder Hintergrund | Identisch: ChatGPT (gpt-5) schreibt, edge-tts spricht, Wort-fuer-Wort-Captions, Higgsfield-Illustrationen mit Zoom |
| Skripte nach Vorbild erfolgreicher Videos („gleicher Stil, gleiche Laenge, anderes Thema“) | `channel.niche` + 3 Serien-Slots geben Stil/Laenge vor; Verlauf verhindert Wiederholungen |
| Hook in den ersten Sekunden, sonst wird geswiped                   | `hook` ist Pflichtfeld im Skript-Schema und wird als erster Satz gesprochen        |
| Titel kurz, 2 Zeilen, Schluesselwoerter farbig                     | Captions max. 3 Woerter/Block, aktives Wort gelb, Rest weiss                      |
| Voll automatisiert (Viblo)                                        | GitHub Actions rendert & laedt 3x taeglich hoch                                   |
| Kanal 2 Tage „aufwaermen“, Branding mit KI-Bildern, Beschreibung mit Disclaimer | Checkliste in Abschnitt 5                                                |
| KPIs: Ø-Wiedergabedauer nahe 100 %, Swipe-Rate ≤ 20 %              | Ziele in Abschnitt 6; Skripte 25–40 s, damit die Wiedergabedauer hoch bleibt      |

Wichtiger Unterschied: Kinderinhalte muessen bei YouTube als **„fuer Kinder“** markiert werden
(`made_for_kids: true`). Folge: keine personalisierten Ads (niedrigere Einnahmen pro View),
keine Kommentare, dafuer Sichtbarkeit in YouTube Kids. Ranking-/Roblox-Rant-Formate mit
TikTok-Clips scheiden aus (Urheberrecht + nicht kindgerecht).

---

## 2. Kanalname – Vorschlaege

Kriterien: leicht zu sprechen, deutsch, sofort klar „Kinder + Lernen“, frei als Handle.

| Name                | Handle-Idee         | Warum                                             |
|---------------------|---------------------|---------------------------------------------------|
| **Kleine Entdecker**| @kleineentdecker    | Warm, neugierig, passt zu allen 3 Serien (Favorit) |
| Wow-Wissen Kids     | @wowwissenkids      | „Wow“-Moment ist die Kernidee jedes Videos         |
| Frag Fritzi         | @fragfritzi         | Maskottchen-Name -> spaeter Figur in allen Bildern |
| Staun-Minute        | @staunminute        | Sagt Format (1 Minute) und Gefuehl                 |
| Warum-Welt          | @warumwelt          | Stark fuer die „Warum eigentlich?“-Serie           |

Vor dem Anlegen: Handle auf YouTube, TikTok, Instagram pruefen (gleicher Name ueberall).
Der Name steht in `config.yaml -> channel.name` und wird in jedes Skript-Prompt eingesetzt.

---

## 3. Posting-Plan: 3 Slots pro Tag, 3 Serien

Zeiten Europe/Berlin. Kinder 4–9 schauen meist vor Kita/Schule, nach der Schule und vor dem
Abendessen – auf den Geraeten der Eltern.

| Slot        | Uhrzeit | Serie                | Inhalt                                                       | Titel-Muster                        |
|-------------|---------|----------------------|--------------------------------------------------------------|-------------------------------------|
| morgen      | 07:15   | Guten-Morgen-Fakt    | 1 verblueffender Tier-/Natur-Fakt, positiv, „Wow“-Moment     | „Wusstest du, dass …?“              |
| nachmittag  | 15:30   | Warum eigentlich?    | Eine Warum-Frage (Koerper, Wetter, Weltraum, Alltag) in 3 Schritten | „Warum …?“                     |
| abend       | 18:30   | Mitmach-Minute       | Raetsel, Zaehlspiel, Such- oder Bewegungsaufgabe, Aufloesung am Ende | „Findest du …?“ / „Kannst du …?“ |

Wochen-Rhythmus fuer Abwechslung (steuert ChatGPT ueber die Nische, kein Handarbeit noetig):

| Tag | Themenwelt-Schwerpunkt        |
|-----|-------------------------------|
| Mo  | Tiere im Wald & auf dem Bauernhof |
| Di  | Koerper & Sinne               |
| Mi  | Weltraum & Planeten           |
| Do  | Meer & Wasser                 |
| Fr  | Wetter, Jahreszeiten, Pflanzen|
| Sa  | Fahrzeuge, Erfinder, Technik  |
| So  | Bunte Mischung / Zuschauerfragen |

Technisch: `.github/workflows/daily-short.yml` hat 3 Cron-Zeilen (UTC). Jeder Lauf ruft
`python make_short.py run` auf; der Slot wird per Uhrzeit gewaehlt (oder mit `--slot`).
Bei Zeitumstellung im Oktober die Cron-Zeiten um 1 h nach hinten schieben (oder so lassen,
dann posten wir eine Stunde frueher).

Startphase (empfohlen): Woche 1–2 mit **1 Video/Tag** (nur Slot „nachmittag“) beobachten,
ab Woche 3 auf 3/Tag hochfahren. Dafuer einfach die zwei anderen Cron-Zeilen auskommentieren.

---

## 4. Produktions-Pipeline (was pro Video automatisch passiert)

1. **Skript** – ChatGPT (`gpt-5`) bekommt Nische, Serie des Slots, Tabu-Liste, alle bisherigen
   Titel. Antwort ist strukturiert (Hook, Saetze, Outro, Titel, Beschreibung, Hashtags,
   Bild-Prompt). Max. ~150 Woerter -> < 60 s.
2. **Stimme** – edge-tts, `de-DE-KatjaNeural` (freundlich, klar). Liefert Wort-Zeitstempel.
3. **Bilder** – Higgsfield erzeugt 3 Szenenbilder (Hook / Mitte / Outro) im Kinder-Cartoon-Stil,
   ~0,25–1 Credit pro Bild. ffmpeg macht daraus eine Slideshow mit Ken-Burns-Zoom.
   Fallback ohne Credits: animierter Farbverlauf.
4. **Captions** – ASS-Untertitel, 3 Woerter pro Block, Satzgrenzen beachtet, aktives Wort gelb.
5. **Render** – 1080x1920, 30 fps, H.264 + AAC, optional leise Hintergrundmusik aus `assets/music`.
6. **Upload** – YouTube Data API: Titel + `#Shorts`, Beschreibung, Tags, Kategorie Bildung,
   `selfDeclaredMadeForKids = true`, oeffentlich (oder geplant via `publish_at`).
7. **Verlauf** – `state/history.json` wird zurueck ins Repo committet (keine Dopplungen).

Kosten pro Tag bei 3 Videos: ChatGPT wenige Cent · Higgsfield ~1–3 Credits · edge-tts 0 €
· YouTube-API 4.800 von 10.000 Quota-Einheiten (Upload = 1.600).

---

## 5. Checkliste Kanal-Start (einmalig, manuell)

- [ ] Google-Konto + YouTube-Kanal anlegen, Kanalname setzen, Handle sichern
- [ ] **Tag 1 + Tag 2: Kanal aufwaermen** – je 30–60 min Kinder-Shorts schauen, liken, abonnieren
- [ ] YouTube Studio -> Einstellungen -> Kanal -> Zielgruppe: „Ja, meine Inhalte sind fuer Kinder“
- [ ] Feature-Eligibility: „Standardfunktionen“ aktiv (Telefonnummer bestaetigen)
- [ ] Profilbild + Banner mit Higgsfield erzeugen (Maskottchen, bunte Welt, ohne Text im Bild)
- [ ] Kanalbeschreibung: 1 Satz Idee, „Neue Videos 3x taeglich“, Kontakt-Mail, Hinweis
      „Alle Inhalte sind kindgerecht und werbefrei erstellt“
- [ ] `config.yaml`: `channel.name`, `niche`, Stimme pruefen; erstes Video lokal mit
      `python make_short.py run --no-upload` anschauen
- [ ] Erste 3 Videos manuell pruefen, dann Automatik einschalten

---

## 6. Ziele & Messung (woechentlich in YouTube Studio -> Analytics -> Shorts)

| Kennzahl                          | Ziel                      | Massnahme wenn verfehlt                                          |
|-----------------------------------|---------------------------|------------------------------------------------------------------|
| „Angesehen vs. weitergewischt“    | ≥ 80 % angesehen (Swipe ≤ 20 %) | Hook schaerfen: `script.target_seconds` senken, Hook-Regel im Prompt verstaerken |
| Ø Wiedergabedauer                 | ≥ 90 % der Videolaenge     | Kuerzere Skripte (30 s), schnellerer Bildwechsel (`images_per_video: 4`) |
| Views pro Video nach 48 h         | steigend Woche zu Woche    | Serie mit den schwaechsten Zahlen austauschen (Slot-Fokus in config aendern) |
| Abonnenten/Tag                    | > 0 ab Woche 2             | Outro-Frage staerker als Aufforderung („Sag deinen Eltern, sie sollen abonnieren“ ist bei Kids-Inhalten NICHT erlaubt – stattdessen: „Morgen gibt es das naechste Raetsel!“) |

Monetarisierung: YPP-Schwelle fuer Shorts = 1.000 Abonnenten + 10 Mio. Shorts-Views in 90 Tagen.
Bei „fuer Kinder“-Inhalten ist der RPM niedriger; das Volumen (3/Tag, 90/Monat) ist der Hebel.

---

## 7. Was du freischalten / bereitstellen musst

| Was                                    | Wo                                              | Wofuer                          | Als GitHub-Secret        |
|----------------------------------------|-------------------------------------------------|---------------------------------|--------------------------|
| OpenAI-API-Key (ChatGPT)               | platform.openai.com -> API keys (Guthaben laden) | Skripte                         | `OPENAI_API_KEY`         |
| Higgsfield-API-Key (ID + Secret)       | console.higgsfield.ai -> API Keys                | Bilder (Credits noetig)         | `HF_KEY` = `id:secret`   |
| Google Cloud: YouTube Data API v3 aktivieren + OAuth-Client (Desktop) | console.cloud.google.com | Upload                | `YT_CLIENT_SECRET_JSON`  |
| Einmal lokal `python make_short.py auth` (Browser-Login mit dem Kanal-Konto) | dein PC     | erzeugt `secrets/token.json`    | `YT_TOKEN_JSON`          |
| Optional: Pexels-Key                   | pexels.com/api                                   | Stock-Videos statt KI-Bilder    | `PEXELS_API_KEY`         |
| Optional: Anthropic-Key                | platform.claude.com                              | Claude statt ChatGPT            | `ANTHROPIC_API_KEY`      |

Hinweis zum OAuth-Client: In der Google Cloud Console unter „OAuth-Zustimmungsbildschirm“
das eigene Google-Konto als **Testnutzer** eintragen, sonst scheitert der Login.
GitHub: Settings -> Actions -> General -> „Workflow permissions: Read and write“.
