# FahrPilot Mobile (Expo)

Schüler-App für iOS und Android: Heute-Modus mit Tages-Challenge, Lernen (offline) mit Stufen-Modus, Zeichen-Trainer, Verkehrszeichenkatalog, Vorfahrt-Trainer, Vorlesen, Farbwelten, Prüfungssimulation, Fahrstunden, Finanzen, Profil, QR-Check-in. Selbstlernende ohne Fahrschule registrieren sich direkt in der App (`app/registrieren.tsx`, RPC `register_self_study`) oder über die Web-App (`/registrieren`).

## Voraussetzungen

- Node 22, pnpm 10
- Expo Go (zum Ausprobieren) oder ein Development Build (empfohlen, weil `expo-sqlite`, `expo-image` und Push benötigt werden)
- Laufende Web-App (`apps/web`) als API für Sync, Prüfung und Medien

## Konfiguration

`.env` in `apps/mobile` (nur öffentliche Werte, keine Service-Keys):

```
EXPO_PUBLIC_SUPABASE_URL=https://<projekt>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
EXPO_PUBLIC_API_URL=https://<web-app-domain>
```

## Starten

```
pnpm --filter @fahrpilot/mobile exec expo start
pnpm --filter @fahrpilot/mobile typecheck
pnpm --filter @fahrpilot/mobile test
```

## Architektur

- `app/`: expo-router. `index` leitet je nach Anmeldung zu `login` oder `(tabs)/heute`.
- `src/lib/session.tsx`: Supabase-Session, Rollen und Mandant aus den JWT-Claims (Custom Access Token Hook).
- `src/lib/db.ts`: SQLite-Spiegel für Fragen, Themen, Lernzustände und die Sync-Warteschlange.
- `src/lib/content.ts`: lädt den veröffentlichten Fragenpool (inklusive Bildpfad und Alt-Text) in SQLite.
- `src/offline/`: Fragenauswahl, Bewertung und SM-2-Wiederholung lokal; identische Logik wie im Server-Paket `@fahrpilot/learning-engine`.
- `src/lib/sync.ts`: Antworten werden in der Warteschlange gesammelt und per `POST /api/sync` mit Bearer-Token übertragen. Der Server ist die Wahrheit, Konflikte werden serverseitig aufgelöst.
- `src/lib/appearance.tsx`: Farbwelt, Hell/Dunkel, Schriftgröße, Bewegung, Ton (lokal gecacht, serverseitig in `users.accessibility`).
- `app/(tabs)/lernen/zeichen.tsx` und `vorfahrt.tsx`: Verkehrszeichenkatalog (408 Zeichen aus `@fahrpilot/content/signs`) und Vorfahrt-Trainer.
- `src/components/question-media.tsx`: Bilder zu Fragen. Öffentliche Fragemedien kommen von `<API_URL>/media/questions/…`, mandantenspezifische Uploads über `/api/media` (signierte URL, Bearer-Auth).
- Prüfungssimulationen laufen vollständig serverseitig (`/api/exam`), damit Regelversion und Bewertung nicht im Client liegen.

## Sicherheit

Die App enthält keinen Service-Key und schreibt keine Lernergebnisse direkt in Tabellen. Alle Schreibzugriffe laufen über RPCs oder die Web-API mit Prüfung des Bearer-Tokens.
