# Betriebs- und Kostenhandbuch (Solo-Entwickler)

Kurz und praktisch: Was kostet Briefklar, wie deployt man es, wie kommt es in den Play Store, wie kann es sich finanzieren.

## 1. Anthropic API-Key

Die Brieferklärung läuft über die Claude-API von Anthropic. Dafür brauchst du einen **API-Key**:

1. Konto anlegen unter <https://console.anthropic.com> (E-Mail oder Google-Login).
2. **Billing** → Zahlungsmethode hinterlegen, Guthaben aufladen (Prepaid, z. B. 20 $). Ohne Guthaben antwortet die API mit Fehler 400/429.
3. **API Keys** → „Create Key“ → Namen vergeben (z. B. `briefklar-prod`) → Key kopieren. Er beginnt mit `sk-ant-…` und wird nur einmal angezeigt.
4. Den Key **nie** ins Repository schreiben. Nur als Umgebungsvariable `ANTHROPIC_API_KEY` beim Hoster hinterlegen (lokal in `.env`, die in `.gitignore` steht).
5. Wenn ein Key versehentlich öffentlich wurde: in der Console sofort löschen („Revoke“) und neuen erstellen.

Empfehlung: einen eigenen **Workspace** „Briefklar“ in der Console anlegen; dann lassen sich Spend-Limits und Nutzung pro Projekt getrennt sehen.

## 2. Kosten pro Brief

Modell: `claude-opus-5` – **5 $ pro 1 Mio. Input-Tokens, 25 $ pro 1 Mio. Output-Tokens** (Stand September 2026, aktuelle Preise: <https://www.anthropic.com/pricing>).

Annahmen pro Anfrage:

| Posten | Tokens | Preis |
|---|---|---|
| Bild einer Briefseite (auf ≤ 1568 px verkleinert, Faustformel Breite × Höhe / 750) | ≈ 1.500–2.500 Input | 0,008–0,013 $ |
| System-Prompt + Anweisung (nach dem ersten Aufruf größtenteils aus dem Prompt-Cache, ~10 % des Preises) | ≈ 1.200 Input | ≈ 0,001 $ |
| Antwort (strukturiertes JSON mit Erklärung, Glossar, Schritten) | ≈ 2.000 Output | 0,050 $ |
| **Summe, 1-seitiger Brief** | | **≈ 0,06–0,065 $** |
| **Summe, 2-seitiger Brief** | | **≈ 0,075 $** |
| **Summe, 4-seitiger Brief (Maximum)** | | **≈ 0,10 $** |

Der Output ist der größte Kostenblock (2.000 Tokens Output kosten so viel wie 10.000 Tokens Input). Hinweis: Bei Opus 5 ist „Adaptive Thinking“ standardmäßig aktiv; Denk-Tokens werden als Output abgerechnet. Mit `output_config: { effort: "low" }` oder `"medium"` bleibt die Qualität für diese Aufgabe gut und die Kosten sinken spürbar – das sollte im Code so eingestellt sein.

**Monatsschätzung** (Mischung aus 1–2 Seiten, ~0,07 $ pro Brief, Wechselkurs grob 1 $ ≈ 0,92 €):

| Briefe / Monat | Anthropic-Kosten | + Hosting (Render Starter ~7 $) | Gesamt ca. |
|---|---|---|---|
| 100 | ≈ 7 $ | 7 $ | **≈ 14 $ / 13 €** |
| 1.000 | ≈ 70 $ | 7 $ | **≈ 77 $ / 71 €** |
| 10.000 | ≈ 700 $ | 7–25 $ | **≈ 720 $ / 660 €** |

Faustregel für die Kommunikation nach außen: **„Ein Brief kostet uns etwa 6–7 Cent.“** Fehlversuche (unscharfe Bilder, Abbrüche) kosten trotzdem, weil das Bild verarbeitet wird.

Sparoptionen, falls nötig: `claude-sonnet-5` (2 $ / 10 $ pro Mio.) senkt die Kosten auf rund ein Drittel – Qualität bei komplexen Bescheiden vorher mit echten (anonymisierten) Beispielen prüfen; Bilder clientseitig auf max. 1568 px längste Kante verkleinern (spart Input-Tokens und Upload-Zeit); Anzahl Seiten pro Anfrage begrenzt lassen (`MAX_IMAGES = 4`).

## 3. Ausgaben begrenzen

Drei Sicherungen, alle drei einrichten:

1. **Spend-Limit in der Anthropic Console**: Settings → Limits → monatliches Limit setzen (z. B. 50 $). Wird es erreicht, lehnt die API weitere Anfragen ab – die App zeigt dann „Dienst vorübergehend nicht verfügbar“. Zusätzlich E-Mail-Benachrichtigung bei 50 % / 80 % aktivieren.
2. **Prepaid statt Rechnung**: Nur Guthaben aufladen, kein Auto-Reload. Dann ist das Guthaben die harte Obergrenze.
3. **Rate-Limit im Server**: Umgebungsvariable `RATE_LIMIT_PER_15MIN` (Standard `20`) begrenzt Anfragen pro IP-Adresse und 15 Minuten. Bei 5 Anfragen / 15 min kann ein einzelner Missbraucher maximal 480 Briefe/Tag ≈ 34 $/Tag verursachen – Spend-Limit deshalb nicht weglassen. Für den Start lieber `3` setzen.

Monitoring: Console → Usage zeigt Tokens pro Tag; einmal pro Woche anschauen. Der Server loggt pro Anfrage Dauer, Seitenzahl, Sprache und Token-Zahlen (nie Inhalte) – daraus lässt sich der reale Preis pro Brief nachrechnen.

## 4. Deployment auf Render.com

Voraussetzung: Repo auf GitHub, `Dockerfile` im Repo-Root (baut `packages/shared`, `apps/api`, `apps/web`; die API liefert die gebauten Web-Dateien aus `STATIC_DIR` mit aus).

1. <https://render.com> → New → **Web Service** → GitHub-Repo verbinden.
2. Einstellungen:
   - Runtime: **Docker** (Render erkennt das Dockerfile).
   - Region: **Frankfurt (EU Central)** – wichtig für die Datenschutzerklärung („Server in der EU“).
   - Instance: **Starter** (0,5 CPU / 512 MB, ~7 $/Monat). Der Free-Tier schläft nach 15 Minuten ein; der erste Aufruf dauert dann 30–60 s – für Nutzer in Not unzumutbar.
   - Health Check Path: `/api/health` (falls im Server vorhanden, sonst `/`).
3. **Environment Variables** (Render → Environment):

   | Variable | Wert | Bedeutung |
   |---|---|---|
   | `ANTHROPIC_API_KEY` | `sk-ant-…` | API-Key (als „Secret“ markieren) |
   | `RATE_LIMIT_PER_15MIN` | `3` | Anfragen pro IP und 15 Minuten |
   | `CORS_ORIGIN` | `https://briefklar.example.de` | Erlaubte Origin der Web-App; bei gleichem Host wie die API genügt die eigene Domain |
   | `STATIC_DIR` | `/app/apps/web/dist` | Verzeichnis der gebauten Web-App, das die API ausliefert |
   | `PORT` | (setzt Render automatisch) | Nicht überschreiben |

4. Deploy starten; Render baut das Image und gibt eine URL `https://briefklar.onrender.com`.
5. Auto-Deploy bei Push auf `main` ist Standard – für Produktion besser einen Branch `release` verwenden.
6. Logs: Render → Logs. Dort dürfen nie Briefinhalte auftauchen; bei Bedarf Log-Aufbewahrung im Render-Plan prüfen (Standard: 7 Tage) und in `datenschutz.html` Abschnitt 6 eintragen.

Alternativen mit gleichem Ablauf: Fly.io (Region `fra`), Hetzner Cloud + Docker (günstiger, mehr Handarbeit), Scaleway. Für jeden Hoster einen **Auftragsverarbeitungsvertrag (AVV/DPA)** akzeptieren – bei Render unter Account → Legal → DPA.

## 5. Eigene Domain und HTTPS

1. Domain kaufen (z. B. bei INWX, Netcup, IONOS; ~10–20 €/Jahr). `.de` ist für die Zielgruppe vertrauenswürdig.
2. Render → Service → Settings → **Custom Domains** → `briefklar.example.de` hinzufügen.
3. Beim Domain-Anbieter einen **CNAME** `briefklar` → `briefklar.onrender.com` (bzw. für die Root-Domain die von Render angezeigten A/ALIAS-Einträge) setzen.
4. Render stellt automatisch ein Let's-Encrypt-Zertifikat aus und erneuert es; HTTPS ist nach wenigen Minuten aktiv, HTTP wird umgeleitet.
5. `CORS_ORIGIN` auf die neue Domain setzen, Datenschutz-URL im Play Store und in der App aktualisieren.

## 6. Android-App als Trusted Web Activity (Bubblewrap)

Eine TWA verpackt die PWA in eine echte Android-App; Chrome rendert, ohne Adressleiste. Voraussetzungen: PWA mit gültigem `manifest.webmanifest` (Name, Icons 192/512 px, `display: standalone`, `start_url`), Service Worker, HTTPS, Lighthouse-PWA-Check grün.

```bash
# Einmalig: Java 17 + Android SDK werden von Bubblewrap bei Bedarf heruntergeladen
npm install -g @bubblewrap/cli

# Projekt anlegen (fragt nach Name, Package-ID, Icons, Farben, Signing-Key)
mkdir briefklar-android && cd briefklar-android
bubblewrap init --manifest https://briefklar.example.de/manifest.webmanifest
#  Package ID: de.example.briefklar   (einmal gewählt, nie mehr änderbar)
#  Signing key: neuen Key erzeugen lassen → Passwort sicher aufbewahren (Passwort-Manager)
#  Fallback: "customtabs"  |  Display mode: standalone  |  Orientation: portrait

# App bauen → app-release-signed.apk und app-release-bundle.aab
bubblewrap build

# Auf ein per USB verbundenes Gerät installieren und testen
bubblewrap install
```

**Digital Asset Links** – ohne sie zeigt die App eine Browser-Leiste:

```bash
# Fingerprint des Signing-Keys anzeigen
bubblewrap fingerprint list
# oder: keytool -list -v -keystore android.keystore -alias android
```

Datei `.well-known/assetlinks.json` im Web-Root der Domain ablegen (muss unter `https://briefklar.example.de/.well-known/assetlinks.json` mit `Content-Type: application/json` erreichbar sein; im Repo unter `apps/web/public/.well-known/`):

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "de.example.briefklar",
    "sha256_cert_fingerprints": ["AA:BB:CC:…"]
  }
}]
```

Wichtig: Wenn du in der Play Console **„Play App Signing“** aktivierst (Standard), signiert Google die ausgelieferte App mit einem **anderen** Key. Dann in der Play Console → Setup → App-Integrität den SHA-256 des „App-Signaturschlüssels“ kopieren und **zusätzlich** in `assetlinks.json` eintragen (beide Fingerprints im Array).

**Play Console:**

1. Entwicklerkonto anlegen (<https://play.google.com/console>, einmalig 25 $; Identitätsprüfung; bei persönlichen Konten seit 2023: 20 Tester über 14 Tage vor der Produktions-Freigabe nötig).
2. App erstellen → Name, Standardsprache Deutsch, „App“, „Kostenlos“.
3. Alle Formulare aus `play-store.md` ausfüllen (Datenschutz-URL, Datensicherheit, Inhaltseinstufung, Zielgruppe, Werbung).
4. Release → Produktion (oder erst „Interner Test“) → `app-release-bundle.aab` hochladen → Release-Notes → Prüfung einreichen (dauert meist 1–7 Tage).
5. Updates der Web-App brauchen **kein** neues APK – die TWA lädt immer die Live-Website. Neues APK nur bei Änderung von Icon, Name, Package oder Manifest-Farben (`bubblewrap update` → `bubblewrap build` → Versionscode erhöhen).

Alternative Capacitor (falls später native Funktionen nötig): `npm i @capacitor/core @capacitor/cli && npx cap init && npx cap add android` – mehr Aufwand, mehr Kontrolle; für v0.2 reicht die TWA.

## 7. Finanzierung, die zur Mission passt

Das Ziel ist ein kostenloses Angebot für Menschen, die es sich sonst nicht leisten könnten. Reihenfolge nach Aufwand:

1. **Spenden-Button** (sofort): Link auf PayPal.me, Ko-fi oder betterplace.org im Menü und auf der Ergebnisseite („Dieser Brief hat uns 7 Cent gekostet – hilf mit“). Kein Play Billing nötig, solange nichts freigeschaltet wird. Transparenz-Seite mit monatlichen Kosten stärkt das Vertrauen.
2. **Förderung** (1–3 Monate Vorlauf): Stiftungen und Programme für Integration und Digitalisierung, z. B. Deutsche Stiftung für Engagement und Ehrenamt (DSEE), Prototype Fund (Open-Source-Software, Bundesministerium), Aktion Mensch (Barrierefreiheit/einfache Sprache), Robert Bosch Stiftung, Landesintegrationsprogramme, kommunale Integrationsfonds. Voraussetzung meist: Verein oder gemeinnütziger Träger – eine Kooperation mit einem bestehenden Verein ist schneller als eine Vereinsgründung.
3. **Kooperation mit Beratungsstellen und Kommunen**: MBE/JMD-Träger (Caritas, Diakonie, AWO, Paritätischer, DRK), Volkshochschulen, Integrationsbeauftragte, Bibliotheken. Sie nutzen die App in der Beratung, bewerben sie und übernehmen einen Anteil der API-Kosten – etwa als Pauschale pro Standort.
4. **„Fair use“ + optionales Pro für Organisationen**: Privatnutzung bleibt kostenlos mit Tageslimit. Beratungsstellen, Kanzleien und Behörden bekommen gegen eine kleine Monatspauschale (z. B. 29 €) einen eigenen Zugangsschlüssel ohne Limit, Mehrseiten-PDFs und Export der Erklärung. Technisch: API-Key pro Organisation als Header, Rate-Limit-Ausnahme, keine Nutzerkonten für Privatpersonen nötig.
5. **Nicht machen**: Werbung, Verkauf von Daten, Tracking – widerspricht der Mission und würde die Datenschutzerklärung und das Vertrauen der Zielgruppe zerstören.

## 8. Wöchentliche Routine (10 Minuten)

- Anthropic Console → Usage & Guthaben prüfen, ggf. aufladen.
- Render → Logs auf Fehlerhäufungen (`upstream_error`, `rate_limited`) prüfen.
- Anthropic-Ankündigungen zu Modellen/Preisen überfliegen; bei Modellwechsel Preisabschnitt oben und `datenschutz.html` (falls Anbieter/Retention sich ändern) anpassen.
- Play Console → Nutzerbewertungen beantworten (Zielgruppe ist dankbar für Antworten in einfacher Sprache).
