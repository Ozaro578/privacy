# ZUKKABRO App (iOS + Android)

Native Hülle um die Website: Die App lädt https://zukkabro.de, Inhalte und Shop sind immer aktuell,
ohne neuen App-Build. Gebaut mit Capacitor, Builds laufen automatisch in GitHub Actions.

- iOS: `.github/workflows/app-ios.yml` baut die App auf einem macOS-Runner und lädt sie zu **TestFlight**.
- Android: `.github/workflows/app-android.yml` baut ein App Bundle und lädt es in die **Play Console (interner Test)**.
- In der App gibt es **keinen Vape-Bereich** (Apple und Google verbieten den Verkauf von Nikotinprodukten in Apps).
  Die Website erkennt die App am User-Agent `ZukkabroApp` und blendet Vapes aus.

## Was einmalig eingerichtet werden muss (Harun)

### Apple (TestFlight)
1. **Apple Developer Program** beitreten: https://developer.apple.com/programs/enroll/ (99 € pro Jahr, Freischaltung dauert 1 bis 2 Tage, als Einzelunternehmer mit Ausweis).
2. In **App Store Connect** (https://appstoreconnect.apple.com) unter „Apps“ eine neue App anlegen:
   Name „ZUKKABRO“, Bundle-ID `de.zukkabro.app` (vorher unter https://developer.apple.com/account/resources/identifiers anlegen), SKU `zukkabro`, Sprache Deutsch.
3. **API-Schlüssel** erzeugen: App Store Connect, Benutzer und Zugriff, Integrationen, App Store Connect API, „Schlüssel generieren“, Rolle **Admin**.
   Notieren: Key-ID, Issuer-ID, die `.p8`-Datei herunterladen (gibt es nur einmal).
4. **Team-ID**: https://developer.apple.com/account, oben rechts unter dem Namen (10 Zeichen).
5. Das Repo `privacy` auf **privat** stellen (Settings, General, Danger Zone, Change visibility). Die Zertifikate werden verschlüsselt auf dem Branch `zertifikate` im selben Repo abgelegt.

### GitHub Secrets (Repo `privacy`, Settings, Secrets and variables, Actions)
| Secret | Inhalt |
|---|---|
| `APPLE_TEAM_ID` | Team-ID |
| `ASC_KEY_ID` | Key-ID des API-Schlüssels |
| `ASC_ISSUER_ID` | Issuer-ID |
| `ASC_KEY_P8_BASE64` | Inhalt der .p8-Datei, base64-kodiert (`base64 -i AuthKey_XXXX.p8`) |
| `MATCH_PASSWORD` | Frei gewähltes Passwort zum Verschlüsseln der Zertifikate |

Danach: Actions, „App iOS (TestFlight)“, „Run workflow“. Beim ersten Lauf legt fastlane Zertifikat und Profil an.
Nach 10 bis 20 Minuten liegt der Build in App Store Connect unter TestFlight. Tester per E-Mail einladen (interne Tester, bis 100 Personen, sofort; externe Tester nach kurzer Prüfung durch Apple).

### Google Play (Android)
1. **Play Console**-Konto: https://play.google.com/console (25 USD einmalig).
2. App anlegen „ZUKKABRO“, Paketname `de.zukkabro.app`.
3. Upload-Schlüssel erzeugen (einmalig, Passwort merken):
   `keytool -genkeypair -v -keystore zukkabro-upload.jks -alias zukkabro -keyalg RSA -keysize 2048 -validity 10000`
4. Service-Konto für die API: Play Console, Einstellungen, API-Zugriff, Service-Konto anlegen, JSON-Schlüssel herunterladen, in der Play Console dem Konto die Rolle „Release-Manager“ geben.

Secrets: `ANDROID_KEYSTORE_BASE64` (`base64 -i zukkabro-upload.jks`), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`zukkabro`), `ANDROID_KEY_PASSWORD`, `PLAY_SERVICE_ACCOUNT_JSON` (Inhalt der JSON-Datei).
Ohne `PLAY_SERVICE_ACCOUNT_JSON` baut der Workflow nur das AAB und hängt es als Artefakt an; das kann man von Hand in der Play Console hochladen.

## Lokal (nur wenn ein Mac da ist)
```
cd app && npm install && npx cap sync
npx cap open ios      # Xcode
npx cap open android  # Android Studio
```

## Versionen
- Marketing-Version 1.0.0 in `ios/App/App.xcodeproj` und `android/app/build.gradle`.
- Build-Nummer = GitHub-Run-Nummer, wird automatisch gesetzt.
