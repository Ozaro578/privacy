# Shorts Factory – automatischer YouTube-Shorts-Kanal fuer Kinder

ChatGPT schreibt · edge-tts spricht · Higgsfield malt · ffmpeg schneidet · GitHub Actions laedt 3x taeglich hoch.

Den kompletten Kanal-Plan (Name, Serien, Posting-Zeiten, KPIs, Checkliste) findest du in [PLAN.md](PLAN.md).

## Schnellstart (lokal)

```bash
cd shorts-factory
pip install -r requirements.txt          # Python 3.11+
# ffmpeg installieren: apt install ffmpeg  |  brew install ffmpeg  |  winget install ffmpeg
cp .env.example .env                     # Keys eintragen (OPENAI_API_KEY, HF_KEY, ...)

python make_short.py run --script scripts/demo.json --no-upload   # Testvideo ohne Keys
python make_short.py run --no-upload                              # neues Skript via ChatGPT, kein Upload
python make_short.py auth                                         # einmalig: YouTube-Login
python make_short.py run --slot abend                             # kompletter Durchlauf inkl. Upload
```

Ergebnis liegt in `output/<name>.mp4`, das Skript in `scripts/<datum>_<thema>.json`.

## Befehle

| Befehl | Zweck |
|---|---|
| `run [--slot NAME] [--script X.json] [--no-upload]` | Skript -> Stimme -> Bilder -> Video -> Upload |
| `generate [--slot NAME]` | nur Skript erzeugen |
| `render scripts/x.json` | Video aus vorhandenem Skript |
| `upload output/x.mp4 --script scripts/x.json` | fertiges Video hochladen |
| `auth` | YouTube-OAuth einrichten (oeffnet Browser) |
| `voices` | deutsche Stimmen auflisten |

## Konfiguration (`config.yaml`)

- `channel` – Name, Nische, Zielgruppe (`audience: kinder` schaltet Kinder-Regeln + YouTube-Kids-Flag ein), Tabu-Themen
- `script` – Provider `openai` (ChatGPT) oder `claude`, Ziel-Laenge
- `schedule` – die 3 Tages-Slots mit Serie und Fokus
- `voice` – edge-tts Stimme, Tempo
- `video.background` – `higgsfield` (KI-Bilder) · `gradient` · `video`/`image` (eigene Dateien in `assets/backgrounds`) · `pexels` · `higgsfield_video`
- `higgsfield` – Endpunkt, Bilder pro Video, Stil-Suffix
- `captions` – Schrift, Groesse, Farben, Woerter pro Block
- `youtube` – Sichtbarkeit, Kategorie, `made_for_kids`, Tags, geplante Veroeffentlichung

Musik: MP3s in `assets/music/` werden zufaellig leise untergemischt (`video.music_volume`). Nur lizenzfreie Musik verwenden!

## Automatik (GitHub Actions)

`.github/workflows/daily-short.yml` laeuft 3x taeglich (Cron in UTC) und kann per „Run workflow“ manuell gestartet werden.

Benoetigte Repository-Secrets (Settings -> Secrets and variables -> Actions):

| Secret | Inhalt |
|---|---|
| `OPENAI_API_KEY` | OpenAI-Key fuer ChatGPT |
| `HF_KEY` | Higgsfield `id:secret` |
| `YT_CLIENT_SECRET_JSON` | Inhalt von `secrets/client_secret.json` (Google OAuth Desktop-Client) |
| `YT_TOKEN_JSON` | Inhalt von `secrets/token.json` nach `python make_short.py auth` |
| `PEXELS_API_KEY` | optional |
| `ANTHROPIC_API_KEY` | optional, falls `script.provider: claude` |

Ausserdem: Settings -> Actions -> General -> Workflow permissions auf **Read and write** (fuer den Verlaufs-Commit).

## YouTube-API einrichten (einmalig)

1. [console.cloud.google.com](https://console.cloud.google.com) -> neues Projekt -> „YouTube Data API v3“ aktivieren
2. „OAuth-Zustimmungsbildschirm“: extern, App-Name, dein Google-Konto als **Testnutzer** eintragen
3. „Anmeldedaten“ -> OAuth-Client-ID -> Typ **Desktop-App** -> JSON herunterladen -> als `secrets/client_secret.json` speichern
4. `python make_short.py auth` -> im Browser mit dem Kanal-Konto anmelden -> `secrets/token.json` entsteht
5. Beide JSON-Inhalte als GitHub-Secrets hinterlegen (siehe oben)

Quota: 10.000 Einheiten/Tag, ein Upload kostet 1.600 -> max. 6 Uploads/Tag.

## Ordner

```
shorts-factory/
  make_short.py        CLI
  config.yaml          alle Einstellungen
  PLAN.md              Kanal-Strategie
  pipeline/            script_gen · tts · captions · background · higgsfield · render · youtube · state
  scripts/             erzeugte Skripte (JSON), demo.json zum Testen
  assets/backgrounds/  eigene Videos/Bilder (optional)
  assets/music/        lizenzfreie Musik (optional)
  output/              gerenderte Videos (nicht im Git)
  secrets/             client_secret.json, token.json (nicht im Git)
  state/history.json   Verlauf aller Shorts
```
