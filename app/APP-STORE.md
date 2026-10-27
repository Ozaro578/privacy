# ZUKKABRO im App Store einreichen

Ziel: Freigabe vor der Eröffnung am **21.11.2026**. Nach dem ersten TestFlight-Build sofort einreichen, dazu eine
beschleunigte Prüfung beantragen (Text unten). Apple braucht normalerweise 1 bis 3 Tage, mit Expedited Review oft unter 24 Stunden.

## 1. Texte für App Store Connect (App-Informationen und Version)

| Feld | Eintrag |
|---|---|
| Name | ZUKKABRO |
| Untertitel (30 Zeichen) | Snacks, Drinks, Matcha & Açaí |
| Kategorie | Essen und Trinken (zweite: Shopping) |
| Support-URL | https://zukkabro.de/kontakt.html |
| Marketing-URL | https://zukkabro.de |
| Datenschutz-URL | https://zukkabro.de/rechtliches.html#datenschutz |
| Copyright | 2026 ZUKKABRO, Harun Özkan |
| Altersfreigabe | 4+ (in der App gibt es keine Nikotinprodukte) |
| Preis | Kostenlos |
| Verfügbarkeit | Deutschland (später weitere Länder) |
| Geräte | iPhone |

**Schlüsselwörter (max. 100 Zeichen):**
```
snacks,candy,süßigkeiten,drinks,matcha,acai,heilbronn,japan,korea,usa,mystery box,kiosk
```

**Werbetext (170 Zeichen):**
```
Eröffnung am 21.11.2026 in Heilbronn: internationale Snacks, Drinks, Matcha & Açaí Bowls. Mit digitaler Stempelkarte und Gewinnspiel zur Eröffnung.
```

**Beschreibung:**
```
ZUKKABRO ist dein Laden für Snacks und Drinks aus aller Welt – jetzt auch als App.

🍬 Candy & Snacks aus Japan, Korea, den USA und Mexiko
🥤 Drinks, die es sonst nirgends gibt: Ramune, Fanta-Sorten, Energy, Eistee
🍵 Matcha Latte & Açaí Bowls, frisch gemacht, am Wochenende im Laden in Heilbronn
🎁 Themen-Pakete und Mystery Boxen
🎟️ Digitale Stempelkarte: 10 Stempel sammeln, Belohnung sichern
📣 News, Angebote und Aktionen zuerst in der App

So funktioniert's: Stöbere durch das Sortiment, lege Artikel in den Warenkorb und schließe die Bestellung bequem auf zukkabro.de ab – zum Abholen im Laden in Heilbronn, per Kurier in Heilbronn oder per Versand in ganz Deutschland. Bezahlen kannst du online, per Überweisung oder bar bei Abholung.

Laden: Klingenberger Straße 100, 74080 Heilbronn. Eröffnung am 21. November 2026.
```

**Neuerungen in dieser Version:**
```
Erste Version: Sortiment, Warenkorb, Laden-Infos, Stempelkarte und News.
```

## 2. Screenshots

Fertig gestaltet (Marken-Hintergrund, Überschrift, iPhone-Rahmen) in `app/store/screenshots/`, sieben Motive:
01 Start, 02 Sortiment, 03 Produkt-Infos, 04 Matcha & Açaí, 05 Stempelkarte, 06 Pakete, 07 Gewinnspiel.
- `6.7-*.png` (1290 × 2796) für iPhone 6,7" (gilt in App Store Connect auch für 6,9")
- `6.5-*.png` (1242 × 2688) für iPhone 6,5"

Die Bilder werden per API hochgeladen (`asc-shots.cjs` im Arbeitsordner). Achtung: Nach „Zur Prüfung einreichen“ sind
Screenshots gesperrt. Zum Austauschen die Einreichung unter App Store Connect → App → Version → „Aus Prüfung entfernen“
zurückziehen, Bilder hochladen, erneut einreichen. Da die App nur für iPhone ist, sind keine iPad-Bilder nötig.

## 3. App-Datenschutz (Fragebogen „App-Datenschutz“)

Die App selbst sammelt nichts; beim Bestellen auf der Website werden Name, Adresse und E-Mail für die Bestellung verarbeitet.
Antworten:
- Werden Daten erhoben? **Ja**
- Datenarten: **Kontaktinformationen** (Name, E-Mail-Adresse, Telefonnummer), **Physische Adresse**, **Kaufhistorie**
- Zweck jeweils: **App-Funktionalität**
- Mit dem Nutzer verknüpft: **Ja** · Für Tracking verwendet: **Nein**
- Sonst nichts (kein Standort, keine Kennungen, keine Nutzungsdaten).

## 4. Hinweise für die Prüfung (Feld „Hinweise“ bei der Version)

```
ZUKKABRO is a local snack & drink store in Heilbronn, Germany (opening November 21, 2026). The app shows our product range, store info, news and a digital loyalty stamp card.

Purchases are for physical goods only (snacks, drinks, food). Checkout is completed on our website (zukkabro.de) in the browser, not inside the app, and uses our own payment provider (Stripe), which is permitted for physical goods under guideline 3.1.3(e). There are no in-app purchases and no digital content for sale.

Age-restricted products (vapes/nicotine) are NOT available in the app; the app hides that section completely. No account is required to use the app. Test the stamp card at Menu → Stempelkarte (a code is created automatically).

We would like to be live before our store opening on November 21, 2026. Thank you!
```

## 5. Beschleunigte Prüfung beantragen (nach dem Einreichen)

App Store Connect → oben rechts **?** → „Kontakt“ → **App Review** → „Request Expedited App Review“ (https://developer.apple.com/contact/app-store/?topic=expedite). Text:

```
App: ZUKKABRO (Bundle ID de.zukkabro.app)
Reason: Time-sensitive event

Our physical store in Heilbronn, Germany opens on November 21, 2026. Flyers, social media and the store opening campaign point customers to the app for our product range and digital loyalty card. We kindly ask for an expedited review so the app can be live before the opening day. The app sells physical goods only, checkout happens on our website, and no age-restricted products are offered in the app.
```

## 6. Reihenfolge am Tag der Einreichung

1. TestFlight-Build ist in App Store Connect sichtbar (Reiter TestFlight). Kurz auf dem eigenen iPhone testen.
2. Reiter **App Store** → Version 1.0.0: Texte, Screenshots, Altersfreigabe, App-Datenschutz, Build auswählen, Hinweise einfügen.
3. „Zur Prüfung einreichen“. Veröffentlichung: **manuell**, damit der Live-Gang auf den 21.11. gelegt werden kann (oder automatisch, wenn früher online auch okay ist).
4. Sofort danach Expedited Review beantragen (Abschnitt 5).
5. Bei Rückfragen von Apple innerhalb von Stunden antworten, sonst verliert man Tage.
