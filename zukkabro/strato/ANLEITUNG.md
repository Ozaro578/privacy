# ZUKKABRO auf Strato

Die Seite läuft auf Strato mit PHP statt mit Netlify-Funktionen. Sie sieht genauso aus und kann dasselbe:
Shop, Warenkorb, Pakete, Händler-Login, Admin und Buchhaltung.
Die ganze Seite steckt hinter einem **Team-Passwort**: Ohne Passwort sieht niemand etwas, weder Seiten noch Bilder noch API.
Suchmaschinen werden zusätzlich ausgesperrt.

## Was du brauchst

- Ein Strato-**Hosting**-Paket mit PHP 8.1 oder neuer. Ein reines Domain-Paket reicht nicht.
- Ein SFTP-Programm, zum Beispiel **FileZilla** (kostenlos).

## Paket bauen

```
python3 werkzeuge/zukkabro_strato.py AUSGABEORDNER --zugang zugang.json
```

Das Skript erzeugt:

- `zukkabro-strato/`: dieser Ordner kommt auf den Server.
- `zukkabro-strato.zip`: derselbe Inhalt als ZIP.
- `ZUGANGSDATEN.txt`: die Passwörter. Diese Datei **nicht** hochladen.

Ohne `--zugang` erzeugt das Skript neue Passwörter.
`config.php` enthält die Geheimnisse, deshalb kommt sie nie ins Git.

## Hochladen

1. Im Strato-Login **SFTP-Zugang anlegen**: „Datenbanken und Webspace“ → „SFTP & SSH“.
2. In FileZilla verbinden:
   - Server: `sftp://ssh.strato.de`
   - Port: `22`
   - Benutzer und Passwort: vom SFTP-Zugang aus Schritt 1
3. Auf dem Server einen Ordner anlegen, zum Beispiel `/zukkabro`.
4. Den **Inhalt** von `zukkabro-strato/` in diesen Ordner laden.
   Die versteckten Dateien `.htaccess` müssen mit. In FileZilla zeigst du sie über „Server“ → „Anzeige versteckter Dateien erzwingen“ an.
5. Im Strato-Login die Domain `zukkabro.de` auf den Ordner `/zukkabro` zeigen lassen (Domain-Einstellungen, Ziel/Verzeichnis).
6. Die **PHP-Version** auf 8.2 oder neuer stellen.
7. **SSL** für die Domain aktivieren.
8. `https://zukkabro.de` öffnen. Es erscheint die ZUKKABRO-Passwortseite.

## Später öffentlich machen

In `config.php` die Zeile `ZB_TOR_HASH` auf `''` setzen.
Vorher müssen Impressum, AGB, Widerruf und Datenschutz fertig sein, und die Altersprüfung muss geklärt sein.

## Daten

- Bestellungen, Händler, Preise und Buchungen liegen als Dateien in `daten/` und sind von außen gesperrt.
- **Sicherung:** Den Ordner `daten/` regelmäßig per SFTP herunterladen.
- Bei einem neuen Upload `daten/` **nicht überschreiben oder löschen**.
