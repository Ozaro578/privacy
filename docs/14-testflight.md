# TestFlight und interne Testbuilds

Stand: 20. September 2026. Die App ist technisch bereit für Testbuilds (`apps/mobile/eas.json` mit Profilen `development`, `preview`, `testflight`, `production`). Was fehlt, sind ausschließlich Konten und Zugangsdaten des Auftraggebers.

## Voraussetzungen (nur der Auftraggeber kann sie schaffen)

1. Apple Developer Program (99 US-Dollar pro Jahr, Freischaltung dauert bis zu 48 Stunden). Ohne Konto gibt es kein TestFlight. Für Android reicht für interne Tests ein APK aus dem Profil `preview`, für den Play Store ein Google-Play-Entwicklerkonto (25 US-Dollar einmalig).
2. Expo-Konto mit EAS (kostenloser Tarif reicht für erste Builds). `npx eas-cli login`, dann `npx eas init` im Ordner `apps/mobile`; die dabei erzeugte `projectId` in `app.json` unter `extra.eas.projectId` eintragen.
3. Supabase-Projekt (EU-Region) mit eingespielten Migrationen und Seed, damit die App gegen echte Daten läuft; die Web-App muss erreichbar sein (`EXPO_PUBLIC_API_URL`), weil Fragebilder, Medien und der Zugangs-Link darüber laufen. Ablauf in `07-betrieb-deployment.md`.
4. Bundle-Identifier: `de.fahrpilot.app` ist in `app.json` eingetragen. Sobald der endgültige App-Name feststeht, Identifier und Namen vor dem ersten TestFlight-Build ändern (ein späterer Wechsel bedeutet eine neue App im Store).

## Ablauf für den ersten TestFlight-Build

```bash
cd apps/mobile
npx eas-cli login
npx eas init                       # projectId in app.json eintragen
npx eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://<projekt>.supabase.co
npx eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <anon-key>
npx eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://<web-app-domain>
npx eas build --profile testflight --platform ios     # fragt einmalig nach Apple-Zugang, legt Zertifikate an
npx eas submit --profile testflight --platform ios    # lädt den Build zu App Store Connect hoch
```

Danach in App Store Connect unter TestFlight die Tester (interne Tester bis 100, externe bis 10.000) per E-Mail einladen; externe Tester brauchen eine kurze Beta-Prüfung durch Apple (meist unter 24 Stunden). Push-Benachrichtigungen brauchen zusätzlich den APNs-Schlüssel (EAS legt ihn beim Build an) und für Android den FCM-Schlüssel.

Android-Testbuild ohne Store: `npx eas build --profile preview --platform android` erzeugt eine APK mit Download-Link, die sich direkt auf dem Gerät installieren lässt.

## Was vor dem ersten Testerkreis noch geprüft wird

- Login und Selbstlern-Registrierung gegen das echte Supabase-Projekt (E-Mail-Bestätigung in den Auth-Einstellungen entscheiden: an oder aus).
- Medien-Auslieferung über `<API_URL>/media/questions` (öffentlich) und `/api/media` (signiert) vom Gerät aus.
- Offline-Modus: Flugmodus nach dem ersten Sync, Lernsession, danach Sync der Antworten.
- Vorlesen, Farbwelten, Schriftgröße auf iOS und Android.

## Feedback aus TestFlight

TestFlight-Tester können Screenshots mit Anmerkungen direkt aus der App senden (Schütteln oder Screenshot teilen); die Rückmeldungen landen in App Store Connect. Fehlerberichte aus der App selbst gehen zusätzlich an den in `07-betrieb-deployment.md` beschriebenen Fehler-Webhook, sobald `ERROR_REPORT_WEBHOOK_URL` gesetzt ist.
