# Kanal-Plan: zwei Testkanaele, vollautomatisch

| Kanal | Nische | Format | Config | Workflow |
|---|---|---|---|---|
| **The Mind Twist** (@TheMindTwist) | Psychologie / menschliches Verhalten, englisch | Story + Countdown, 3x/Tag | `config.yaml` | `daily-short.yml` |
| **Baby Has A Job** (@BabyHasAJob) | KI-Baby-Comedy mit wiederkehrender Figur „Bo“, englisch | Szenen (5 Bilder + Gag-Captions), 2x/Tag | `config.baby.yaml` | `daily-baby-short.yml` |

Beide laufen getrennt (eigener YouTube-Kanal, eigenes Token, eigener Verlauf), wie von ChatGPT empfohlen:
zwei Viral-Tests statt alles auf einen Kanal. Nach 3–4 Wochen entscheidet die Swipe-Rate, welcher Kanal auf 3/Tag geht.

---

# Kanal 1: „The Mind Twist“ – Psychologie-Shorts, englisch

Stand: 28.09.2026 · Basis: ChatGPT-Strategie (Nische Psychologie / menschliches Verhalten, englischer
Hauptkanal, 2–3 hochwertige Shorts/Tag), Kellan-Henneberry-Methode (faceless AI-Shorts, AVD & Swipe-Rate)
und RankZilla-Format (Countdown mit festem Teaser-Titel).

---

## 1. Kanalname

Geprueft am 28.09.2026 (YouTube-Handle frei = 404):

| Name              | Handle          | Status | Warum                                                         |
|-------------------|-----------------|--------|---------------------------------------------------------------|
| **The Mind Twist**| @TheMindTwist   | frei   | Jedes Video endet mit einem Twist -> Name = Formatversprechen (Empfehlung) |
| Mind Loop         | @MindLoop       | frei   | „Open loop“ ist das Kernprinzip der Hooks; kurz, merkbar       |
| Mind Shift        | @MindShift      | frei   | Generischer, viel Konkurrenz im Wording                        |

Vergeben: MindTwist, BrainTwist, MindGlitch, HiddenMind, PsychBites, WiredMinds, MindFiles, BrainWired,
MindUnfiltered, SilentPsychology, MindTriggers, BrainLoop, QuietMind, PsychLoop, SubtleMind, MindPlot,
HumanGlitch, WhyWeDoThat, BrainQuirks, MindQuirks u.a.

Handle sofort auf YouTube, TikTok und Instagram sichern (gleicher Name ueberall, spaeter Cross-Posting).

---

## 2. Positionierung

- **Nische:** Psychologie & menschliches Verhalten als 25–40-Sekunden-Story mit Hook und Twist.
- **Zielgruppe:** 16–35, USA/UK/global, scrollt nachts und in Pausen.
- **Versprechen:** „One weird thing about your brain, every video, with a twist.“
- **Ton:** ruhig, vertraulich, leicht mysterioes. Eine wiedererkennbare Stimme
  (edge-tts `en-US-AndrewMultilingualNeural`, spaeter optional ElevenLabs-Klon).
- **Look:** dunkle Kino-Bilder (teal/amber), 3-Wort-Captions, aktives Wort gelb, 2-Zeilen-Titel oben.
- **Regeln (YouTube-Monetarisierung 2026):** jedes Video eigenstaendiger Inhalt, keine Reuploads,
  keine Massen-Templates, Aussagen als „psychologists suggest“, keine Medizin-/Therapie-Tipps.

---

## 3. Format & Serien (3 Slots pro Tag)

| Slot        | Berlin | New York | Serie                | Format   | Hook-Muster                                   |
|-------------|--------|----------|----------------------|----------|-----------------------------------------------|
| morgen      | 07:30  | 01:30    | Your Brain Does This | Story    | „Your brain does something weird when …“      |
| nachmittag  | 15:30  | 09:30    | Tricks Used On You   | Story    | „A trick … uses on you“ / „Why 9.99 feels cheap“ |
| abend       | 21:30  | 15:30    | 3 Signs              | Countdown| „3 signs someone secretly …“ + „(#1 will surprise you)“ |

**Story-Aufbau (25–40 s):** Hook (Situation, die jeder kennt) -> 3–6 kurze Saetze Mechanismus mit
Alltagsbeispiel -> Twist (ein Satz, der den Anfang neu einordnet) -> Frage.

**Countdown-Aufbau (30–45 s):** Hook mit Teaser auf #1 -> #3, #2 (ueberraschend), #1 (das, was niemand
erwartet) -> Frage. Fester Titel-Suffix „(#1 will surprise you)“ – RankZilla-Prinzip: wiedererkennbarer
Hook-Titel in jeder Folge.

Startphase: Woche 1–2 mit 2 Videos/Tag (morgen + abend), ab Woche 3 alle 3 Slots. Nicht mehr als 3/Tag.

---

## 4. Die ersten 30 Themen

Stehen in `config.yaml -> channel.topics` und werden der Reihe nach verbraucht; danach erfindet ChatGPT
selbst passende Themen (mit Verlaufsabgleich gegen Wiederholungen).

1. Your brain does something weird when someone ignores you
2. Why you can't stop thinking about one person
3. The reason people suddenly lose interest
4. 3 signs someone secretly dislikes you
5. A psychological trick restaurants use on you
6. Why silence makes people uncomfortable
7. Your brain lies to you every single day
8. Why you remember embarrassing moments for years
9. The 3-second rule your brain uses to judge strangers
10. Why you feel watched when nobody is there
11. What your brain does when you get left on read
12. Why supermarkets put milk at the back
13. The reason you like people who are hard to get
14. 3 signs someone is lying to you (not what you think)
15. Why songs get stuck in your head
16. Why you feel tired after doing nothing all day
17. The trick casinos use so you lose track of time
18. Why you talk differently to your crush
19. Why a text with a period feels angry
20. The reason you procrastinate on things you love
21. Why we trust people with deep voices
22. 3 signs someone respects you without saying it
23. Why you cringe at your own voice
24. The price trick that makes 9.99 feel cheap
25. Why you get more ideas in the shower
26. The reason you can't remember names
27. Why we laugh when nothing is funny
28. 3 signs a friendship is quietly ending
29. Why your brain hates unfinished stories
30. The reason you check your phone with no notification

---

## 5. Produktions-Pipeline (pro Video, vollautomatisch)

1. **Skript** – ChatGPT (`gpt-5`) erhaelt Nische, Serie des Slots, Regeln, Tabu-Liste, alle bisherigen
   Titel. Antwort ist ein festes JSON-Schema (Hook, Saetze, Twist/Outro, Titel, Beschreibung, Hashtags,
   Bildschirm-Titel, Highlight-Wort, Bild-Prompts). Alternativ Claude.
2. **Stimme** – edge-tts, Satz fuer Satz gesprochen (natuerliche Pausen, exakte Zeitstempel).
3. **Bilder** – Higgsfield (`gpt_image_2_5` ≈ 0,25 Credits/Bild): 4 Kino-Szenen pro Story bzw. 1 Bild pro
   Platz im Countdown, Ken-Burns-Zoom, Bildwechsel nur an Satzgrenzen.
4. **Captions** – 3-Wort-Bloecke, aktives Wort gelb, nie ueber Satzgrenzen; 2-Zeilen-Titel mit farbigem
   Schluesselwort; im Countdown Badge „#3 … #1“ (gold) und Fortschrittsbalken.
5. **Render** – 1080x1920, 30 fps, H.264/AAC; optional lizenzfreie Musik aus `assets/music` leise darunter.
6. **Upload** – YouTube Data API: Titel + #Shorts, Beschreibung, Tags, Kategorie Bildung, oeffentlich.
7. **Verlauf** – `state/history.json` (Themen, Video-IDs) wird zurueck ins Repo committet.

Kosten/Tag bei 3 Videos: ChatGPT wenige Cent · Higgsfield ≈ 3 Credits · edge-tts 0 € · YouTube-Quota 4.800/10.000.

---

## 6. Ziele & Messung (YouTube Studio -> Analytics -> Shorts, woechentlich)

| Kennzahl                     | Ziel                         | Wenn verfehlt                                                   |
|------------------------------|------------------------------|-----------------------------------------------------------------|
| Angesehen vs. weitergewischt | ≥ 75 % angesehen (Swipe ≤ 25 %) | Hook-Formel im Slot-Fokus schaerfen, `target_seconds` auf 28 senken |
| Ø Wiedergabedauer            | ≥ 90 % der Laenge            | Bildwechsel schneller (`images_per_video: 5`), Twist frueher     |
| Views nach 48 h              | steigend Woche zu Woche      | Serie mit den schwaechsten Zahlen tauschen (Slot-Fokus aendern)  |
| Abos pro 1.000 Views         | ≥ 5                          | Outro-Frage staerker, Serienname im Titel                       |

Monetarisierung: YPP fuer Shorts = 1.000 Abos + 10 Mio. Shorts-Views in 90 Tagen. Zusaetzlich spaeter:
Affiliate (Buecher/Apps zu Psychologie), eigener Newsletter, lokalisierte Kanaele (DE/TR ueber `config.de.yaml`).

---

## 6b. Zusatz-Erkenntnisse aus der Szenenanalyse des Kellan-Videos (Higgsfield)

- **Stil-Vorbild statt Blindflug:** Kellan transkribiert ein virales Short der Nische (youtubetotranscript.com)
  und laesst ChatGPT „im exakt gleichen Stil, Laenge und Ton, aber zu anderem Thema“ schreiben. Umgesetzt:
  `channel.style_examples` in beiden Configs – 1–3 Transkripte einfuegen, der Rest passiert automatisch.
- **Alter Kanal schlaegt neuen Kanal:** Ein seit Jahren bestehender YouTube-Kanal ohne Verstoesse braucht kein
  Warm-up. Nur ein frischer Kanal braucht die 2 Tage Scrollen/Liken/Kommentieren.
- **Telefon-Verifizierung („Intermediate features“) ist Pflicht fuer Monetarisierung – und eine Nummer gilt nur
  fuer 2 Kanaele pro Jahr.** Bei unseren zwei Kanaelen also genau planen, welche Nummer wo verifiziert wird.
- **Feature-Check:** YouTube Studio -> Einstellungen -> Kanal -> Funktionsberechtigung: „Standardfunktionen“
  muessen aktiv sein (kein Verstoss), sonst neuen Kanal anlegen.
- **Branding in 5–10 Minuten:** Name via ChatGPT, Profilbild per KI, Banner optional (Canva). Nicht laenger.
- **Beschreibung (macht den Kanal „legit“):** Zeile 1 = was der Kanal macht, Kontakt-E-Mail, kurzer
  Copyright-/Fair-Use-Disclaimer, E-Mail nochmal fuer Rueckfragen.
- **Ranking-Sweet-Spot 4–6 Eintraege**, nie unter 4, nie ueber 6; der erste Clip/Eintrag muss der staerkste sein,
  #1 in Gold. Fuer „3 Signs“ deshalb `ranking.items` auf 4–5 erhoehen, sobald die Skripte kurz genug bleiben.
- **Kurz und loopbar:** Sein 30-Mio-Video war 17 s lang mit 21 s Ø-Wiedergabedauer (Zuschauer schauen 1,2x).
  Ziel: Videos so kurz, dass sie ein zweites Mal laufen – Baby-Comedy 18–25 s, Psychologie 25–32 s.

## 7. Checkliste Kanal-Start

- [ ] Handle @TheMindTwist auf YouTube/TikTok/Instagram sichern
- [ ] Alten, unbenutzten YouTube-Kanal vorhanden? Dann den nutzen (kein Warm-up noetig). Sonst Tag 1 + 2
      aufwaermen (je 30–60 min Psychologie-Shorts schauen, liken, kommentieren, abonnieren)
- [ ] Studio -> Einstellungen -> Kanal -> Funktionsberechtigung: Standardfunktionen aktiv; Telefon-Verifizierung
      einplanen (max. 2 Kanaele pro Nummer und Jahr)
- [ ] Profilbild + Banner mit Higgsfield (dunkles Gehirn-/Loop-Motiv, teal/amber, ohne Text)
- [ ] Kanalbeschreibung: „One weird thing about your brain. Every day. With a twist.“ + Kontakt-Mail +
      „Content is for entertainment and education, not medical advice.“
- [ ] Keys als GitHub-Secrets hinterlegen (Abschnitt 8), `python make_short.py auth` einmal lokal
- [ ] Erste 3 Videos lokal mit `run --no-upload` pruefen, dann Workflow aktivieren

---

## 8. Was du freischalten musst

| Was                                          | Wo                                                 | GitHub-Secret            |
|----------------------------------------------|----------------------------------------------------|--------------------------|
| OpenAI-API-Key (= Verbindung zu ChatGPT)     | platform.openai.com -> API keys, Guthaben laden     | `OPENAI_API_KEY`         |
| Higgsfield-API-Key (ID + Secret)             | console.higgsfield.ai -> API Keys                   | `HF_KEY` = `id:secret`   |
| YouTube Data API v3 + OAuth-Client (Desktop) | console.cloud.google.com, eigenes Konto als Testnutzer | `YT_CLIENT_SECRET_JSON` |
| Einmal lokal `python make_short.py auth`     | dein PC (Browser-Login mit dem Kanal-Konto)         | `YT_TOKEN_JSON`          |
| GitHub Actions: Workflow permissions „Read and write“ | Repo -> Settings -> Actions -> General    | –                        |
| Optional: Anthropic-Key (Claude statt ChatGPT) | platform.claude.com                              | `ANTHROPIC_API_KEY`      |
| Optional: Pexels-Key (Stock-Videos)          | pexels.com/api                                      | `PEXELS_API_KEY`         |

ChatGPT in dieser Claude-Session: Es gibt keinen ChatGPT-Connector im Verzeichnis. Die Verbindung laeuft
ueber den OpenAI-API-Key in der Pipeline (Skripte). Strategie-Ideen aus ChatGPT einfach hier einfuegen.


---

# Kanal 2: „Baby Has A Job“ – KI-Baby-Comedy mit Figur

## Name

Geprueft am 28.09.2026, frei: **@BabyHasAJob** (Empfehlung, sagt das Format), @BabyGoesToWork, @BabyCEO,
@BabyBusiness, @BabyNineToFive, @AdultingBaby. Vergeben: TinyAdult, OfficeBaby, BabyAtWork, LilBossman u.a.
**Nicht** „Boss Baby“ verwenden (DreamWorks-Marke).

## Figur „Bo“

Ein chubby Einjaehriger, grosse braune Augen, eine dunkle Haartolle, rote Wangen, Gruebchen links.
Referenzbild: `assets/character/baby_reference.png` (Higgsfield, neutraler Hintergrund). Es wird bei jeder
Bildgenerierung als Referenz mitgeschickt (`higgsfield.character_reference`), so bleibt das Gesicht gleich,
nur Outfit und Situation wechseln. Ergebnis im Demo: 5 Buero-Szenen, Figur konsistent.

## Format „POV“ (20–30 s)

Hook = Situation („POV: your baby has a 9 to 5 job“) -> 5 Szenen, jede ein Bild + eine trockene Caption
(„The meeting could have been an email.“) -> Punchline in Szene 5 -> Frage. Britisch-trockener Erzaehler
(`en-GB-RyanNeural`), helle Bilder, Captions unten, pinkes Highlight, lockere Musik.

## Slots

| Slot  | Berlin | Serie          | Fokus                                                  |
|-------|--------|----------------|--------------------------------------------------------|
| morgen| 08:30  | Baby Has A Job | Beruf: Buero, Kueche, Baustelle, Taxi, Flugzeug …       |
| abend | 20:30  | Baby Life      | Erwachsenen-Alltag: Gym, Steuern, Umzug, Dating-App …   |

20 Startthemen stehen in `config.baby.yaml`. Kosten: 6 Bilder pro Short ≈ 1,5 Credits, 2 Shorts/Tag ≈ 3 Credits.

## Upgrade-Pfad

Sobald Budget da ist: `background: higgsfield_video` mit einem Bild-zu-Video-Modell (MiniMax H3 Max 480p ≈ 7,5
Credits/5 s, Seedance 2.5 ≈ 35 Credits/5 s) fuer echte Bewegung. Bis dahin Ken-Burns-Slideshow.

## Zusaetzlich freischalten

- Zweiter YouTube-Kanal im selben Google-Konto anlegen (YouTube -> Konto -> „Kanal hinzufuegen“).
- Einmal `python make_short.py --config config.baby.yaml auth` ausfuehren, dabei **diesen** Kanal waehlen ->
  `secrets/token_baby.json` -> als GitHub-Secret `YT_TOKEN_JSON_BABY`.
- Gleicher `OPENAI_API_KEY`, `HF_KEY`, `YT_CLIENT_SECRET_JSON` wie Kanal 1.
