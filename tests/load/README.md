# Lasttests (k6)

Skripte für [k6](https://k6.io) gegen eine Staging-Umgebung. Niemals gegen Produktion.

Voraussetzungen: `k6` installiert; Testschüler in Staging (`LOAD_EMAIL`, `LOAD_PASSWORD`); `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `APP_URL`.

```
k6 run -e APP_URL=https://staging.example -e SUPABASE_URL=... -e SUPABASE_ANON_KEY=... -e LOAD_EMAIL=... -e LOAD_PASSWORD=... tests/load/exam-simulation.js
k6 run -e ... -e LESSON_ID=<uuid einer offenen Fahrstunde> tests/load/booking-race.js
```

- `exam-simulation.js`: 50 parallele Schüler starten und geben Prüfungssimulationen ab (Regel-Snapshot, Bewertung, Prüfungsreife). Ziel: p95 unter 1,5 s für Start, unter 2,5 s für Abgabe, Fehlerquote unter 1 %.
- `booking-race.js`: 100 gleichzeitige Buchungsversuche auf dieselbe Fahrstunde. Erwartung: genau eine Buchung erfolgreich, alle anderen mit fachlicher Ablehnung (Exclusion-Constraint), keine 5xx.
- `sync-burst.js`: 200 Offline-Warteschlangen mit je 30 Antworten gleichzeitig synchronisieren. Ziel: keine Duplikate (Idempotenz über client_attempt_id), p95 unter 3 s.

Ergebnisse werden in `docs/10-runbooks.md` unter "Lasttest-Protokoll" festgehalten.
