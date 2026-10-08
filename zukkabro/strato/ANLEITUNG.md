# ZUKKABRO auf Strato – Aufbau und Start

Die Seite läuft auf Strato mit PHP. Sie kann alles: Shop mit Warenkorb und Kasse (Vorkasse, Bar bei Abholung,
Online-Zahlung über Stripe), Händler-Login, Admin mit Buchhaltung, Laden-Seite mit Karte, Tageskasse, Kontaktformular,
E-Mail-Benachrichtigungen. Die Seite ist **offen** (kein Team-Passwort), läuft aber im **Eröffnungsmodus**: ohne Preise,
Angebote und Online-Bestellung, bis ihr ihn im Admin unter Shop-Einstellungen abschaltet.

## 1. Paket bauen

```
python3 werkzeuge/zukkabro_strato.py AUSGABEORDNER --zugang zugang.json
```

`zugang.json` (liegt nicht im Git):

```json
{
  "seite": "",
  "admins": { "admin1": "Passwort", "admin2": "Passwort" },
  "stripeSecret": "sk_live_…",
  "stripeWebhook": "whsec_…",
  "vorverkauf": true,
  "eroeffnung": "im November 2026"
}
```

`"seite": ""` = Seite offen (Normalfall). Ein Team-Passwort nur noch für Umbauphasen eintragen.
`"vorverkauf": true` legt beim ersten Bauen `daten/einstellungen/shop.json` an (Eröffnungsmodus). Beim späteren Hochladen
`daten/` nicht überschreiben, sonst gehen Bestellungen und Einstellungen verloren.

Ergebnis: `zukkabro-strato/` (hochladen), `zukkabro-strato.zip`, `ZUGANGSDATEN.txt` (nicht hochladen).
`config.php` enthält die Geheimnisse und kommt nie ins Git.

## 2. Domain zum Hosting-Paket

zukkabro.de hängt am Paket „STRATO Mail Plus“. Für die Webseite muss sie zum Paket „STRATO Hosting Starter“:

1. Strato-Chat oder Support: „Bitte zukkabro.de aus dem Paket STRATO Mail Plus in mein Paket STRATO Hosting Starter
   verschieben, die Postfächer sollen bleiben.“
2. Danach im Hosting-Paket: **Domains → zukkabro.de → Webserver** → Zielverzeichnis `/zukkabro` wählen.
3. **DNS → A-Record** wieder auf „STRATO-Standard“ stellen (der Eintrag 75.2.60.5 zeigt noch auf Netlify).
4. **SSL** für zukkabro.de aktivieren (im Hosting-Paket inklusive).

## 3. Hochladen (FileZilla)

1. Im Hosting-Paket: **Datenbanken und Webspace → SFTP & SSH** → Zugang anlegen (Benutzer, Passwort, Startverzeichnis `/`).
2. FileZilla: Server `sftp://ssh.strato.de`, Port 22, Benutzer wie angelegt.
3. Ordner `/zukkabro` anlegen, den **Inhalt** von `zukkabro-strato/` hineinladen, inklusive der versteckten `.htaccess`-Dateien
   (FileZilla: Server → Anzeige versteckter Dateien erzwingen).
4. PHP-Version im Paket auf 8.2 oder neuer.
5. `https://zukkabro.de` öffnen: Passwortseite erscheint, dahinter die Seite.

Bei späteren Updates: alles außer `daten/` und `config.php` neu hochladen. `daten/` nie löschen (Bestellungen, Buchhaltung).

## 4. Stripe einrichten

1. Stripe-Dashboard → Entwickler → API-Schlüssel → **Geheimschlüssel** (`sk_live_…`) in `zugang.json` → Paket neu bauen → `config.php` hochladen.
2. Stripe-Dashboard → Entwickler → Webhooks → **Endpunkt hinzufügen**: `https://zukkabro.de/api/stripe/webhook`,
   Ereignis `checkout.session.completed`. Den **Signaturschlüssel** (`whsec_…`) in `zugang.json`, Paket neu bauen, `config.php` hochladen.
3. Im Shop erscheint jetzt „Online bezahlen“. Testbestellung mit einer Stripe-Testkarte machen (Test-Schlüssel), dann auf Live-Schlüssel wechseln.
4. Der Webhook ist auch hinter dem Team-Passwort erreichbar.

## 5. E-Mails

Auf Strato gehen die Mails über den Strato-Mailserver (nichts einzurichten). Solange die Seite auf Netlify läuft,
schickt Netlify die Mails über das **Strato-Postfach info@zukkabro.de** (SMTP, smtp.strato.de:465). Dafür in Netlify
(Site configuration → Environment variables) die Variable `SMTP_PASSWORT` mit dem Passwort des Postfachs anlegen,
danach einmal neu deployen. Optional: `SMTP_BENUTZER` (Standard: die Absender-Adresse), `SMTP_HOST`, `SMTP_PORT`.
Strato signiert die Mails selbst (DKIM), es sind keine DNS-Änderungen nötig. Alternative ohne Strato-Postfach:
Brevo-Konto, Domain dort authentifizieren und den API-Schlüssel als `BREVO_API_KEY` eintragen.
Im Admin unter „E-Mails“ zeigt der Knopf **Testmail senden**, ob der Versand klappt.


Admin → Shop-Einstellungen → „E-Mails“: Benachrichtigungs-Adresse (z. B. info@zukkabro.de) und Absender (muss eine Adresse
eurer Domain sein, z. B. bestellung@zukkabro.de, im Mail-Plus-Paket anlegen). Dann bekommen Kunden eine Bestellbestätigung
und ihr Hinweise zu Bestellungen, Nachrichten, Händler-Registrierungen und Stripe-Zahlungen.

## 6. Eröffnung (Preise an)

Die Seite ist schon online. Zur Eröffnung im November:

1. Admin → Shop-Preise: Endkundenpreise eintragen (MwSt 7 % Lebensmittel, 19 % Getränke/Vapes).
2. Admin → Laden: Öffnungszeiten eintragen, Karte prüfen.
3. Admin → Shop-Einstellungen: Haken **Eröffnungsmodus** entfernen, speichern. Ab jetzt sind Preise, Angebote,
   Warenkorb und Online-Zahlung sichtbar.
4. Google Search Console: Domain bestätigen und Sitemap `https://zukkabro.de/sitemap.xml` einreichen.
5. Impressum: Telefonnummer in `public/assets/js/shop.js` (`telefon`), USt-IdNr. und WEEE-Nummer in `rechtliches.html` ergänzen, sobald vorhanden.

## 7. Sicherung

`daten/` regelmäßig per SFTP herunterladen. Dort liegen Bestellungen, Händler, Preise, Buchungen, Kassenberichte, Nachrichten.
