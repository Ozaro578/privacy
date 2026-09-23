# Sicherheitsprüfung vor dem ersten Testerkreis

Stand: 23. September 2026. Prüfung der Migrationen, RLS-Regeln, RPC-Funktionen, API-Routen, Server Actions und der Mobile-App (read-only), danach Behebung. Jeder Befund wurde im Code nachvollzogen; die Datenbank-Fixes sind in `supabase/migrations/0031_security_hardening.sql` und durch SQL-Test Gruppe 17 abgesichert.

## Befunde und Status

| Nr. | Schwere | Befund | Status |
|---|---|---|---|
| 1 | hoch | Nutzer konnten ihre Profil-E-Mail selbst setzen und so Einladungen anderer Personen übernehmen (bis zur Admin-Rolle) | Behoben: E-Mail nur aus Auth (Spaltenrechte, Sync-Trigger), eindeutiger Index, Einladungen suchen nur bestätigte Konten (`find_confirmed_user_by_email`) |
| 2 | hoch | Schülerdatensätze wurden per E-Mail ohne Bestätigung verknüpft; Registrierung ohne Bestätigungsmail | Behoben: Verknüpfung und Aktivierung nur mit bestätigter E-Mail; Registrierung über `signUp` mit Bestätigungsmail, Hinweis auf der Login-Seite |
| 3 | hoch | `register_student` direkt per API aufrufbar, Selbstaufnahme in jede Fahrschule; Schüler sahen Versicherungsnummern und Notizen der Fahrzeuge | Behoben: nur Service-Role; Fahrzeugdaten nur für Mitarbeiter |
| 4 | mittel | Open Redirect über `next` (`//fremde-seite`) | Behoben: `safeNextPath` mit Tests, in Login und Auth-Callback |
| 5 | mittel | `/api/media` signierte jeden Pfad im Inhalts-Bucket (Umgehung der Inhaltslizenz) | Behoben: nur Pfade sichtbarer Fragenversionen (RLS entscheidet über Mandant, Freigabe, Lizenz) |
| 6 | mittel | Support-Sitzung konnte sich selbst verlängern (Freigabe ändern, Bindung lösen) | Behoben: Regeln und Schutz-Trigger sperren Änderungen in Support-Sitzungen |
| 7 | mittel | Keine Begrenzung bei Login, Registrierung, KI-Aufrufen | Behoben: Rate-Limits je IP und Konto (Login 30 je IP bzw. 8 je Konto in 10 Minuten, Registrierung 10 je IP und Stunde), KI-Tageskontingente (Schüler 60, Fahrlehrer 100). Offen: Captcha (Cloudflare Turnstile oder hCaptcha, braucht einen Schlüssel des Betreibers; Supabase unterstützt es nativ) |
| 8 | mittel | Klartext-Passwort im RPC-Payload | Behoben: Passwort und Einwilligungs-Flags werden entfernt |
| 9 | mittel | Mitarbeiter konnten Benachrichtigungen an Nutzer anderer Mandanten anlegen | Behoben: Empfänger muss Mitglied des eigenen Mandanten sein |
| 10 | mittel | App-Sitzung unverschlüsselt in AsyncStorage | Behoben: Schlüsselbund (expo-secure-store) mit Aufteilung in Teile unter 2 KB, Tests |
| 11 | niedrig | Fahrschul-Admin konnte Status, Kennung und Selbstlern-Schalter der eigenen Fahrschule ändern | Behoben: Schutz-Trigger |
| 12 | niedrig | Admin konnte per API die Inhaberrolle vergeben oder die eigene Rolle ändern | Behoben: Schutz-Trigger (Inhaberrolle nur durch Inhaber, eigene Rolle und Status unveränderlich) |
| 13 | niedrig | RPC-Wrapper `offer_lesson_to_waitlist` und `special_drive_progress` ohne Berechtigungsprüfung | Behoben: Büro-Prüfung bzw. Sichtbarkeit der Ausbildung per RLS |
| 14 | niedrig | `transitionContent` prüfte den Tabellennamen nicht zur Laufzeit | Behoben: Zod-Enum und UUID-Prüfung |
| 15 | niedrig | `session_id` eines Lernversuchs ungeprüft übernommen | Behoben: nur eigene Sessions |
| 16 | niedrig | Proxy leitete API-Aufrufe der App (Bearer-Token) auf die Login-Seite um | Behoben: API-Routen prüfen selbst, ohne Anmeldung gibt es 401 statt Umleitung |

## Beim Test zusätzlich gefunden

Die bisherige Update-Regel auf `users` verglich `is_platform_admin` per Unterabfrage auf dieselbe Tabelle und lief dadurch in eine Endlos-Rekursion: Profiländerungen (Sprache, Darstellung) schlugen fehl. Die Regel ist jetzt einfach (`id = auth.uid()`), die geschützte Spalte ist über Spaltenrechte gesperrt.

## Bewusst so belassen

- Schüler sehen Name, Adresse, Bankverbindung und Steuernummer ihrer Fahrschule; diese Angaben stehen ohnehin auf jeder Rechnung.
- Schüler sehen Namen und Kontaktdaten der Mitarbeiter ihrer Fahrschule, damit sie Fahrlehrer und Büro erreichen können.
- Die Online-Anmeldung bei einer Fahrschule schaltet den Schülerzugang sofort frei (Dokumente hochladen, Termine sehen). Mit Bestätigungspflicht der E-Mail setzt das eine echte Adresse voraus; Fahrschulen sehen neue Anmeldungen als Interessenten und können den Zugang sperren.

## Vor dem Produktivbetrieb

- In Supabase unter Authentication die Option "Confirm email" aktiv lassen (Standard) und die Weiterleitungs-URL `<App-URL>/auth/callback` eintragen.
- Captcha aktivieren (siehe Befund 7).
- Externer Penetrationstest und Datenschutz-Folgenabschätzung (siehe `09-umsetzungsstand.md`).
