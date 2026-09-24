/* =========================================================
   ZUKKABRO – HIER BEARBEITEN
   =========================================================
   1) SHOP: Kontaktdaten eintragen. Leere Felder ("") werden
      auf der Seite als "folgt" angezeigt.
   2) PRODUKTE: hinzufügen, löschen oder ändern.
      - preis: null        -> Anzeige "Preis auf Anfrage"
      - preis: 2.5         -> Anzeige "2,50 €"
      - kategorie: candy | snacks | drinks | vapes
      - badge: "NEU", "BESTSELLER", "HOT" oder ""
               (NEU und BESTSELLER erscheinen auch in den Filtern)
      - tags: ["mystery"]  -> erscheint im Mystery-Filter
      - ab18: true         -> zeigt ein 18+ Siegel
      - farbe: pink | gold | blue | orange | violet | green | dark
      - bild: "assets/img/produkte/datei.jpg" (optional, sonst Emoji)
   ========================================================= */

const SHOP = {
  // Nur Ziffern, mit Ländervorwahl ohne "+" und ohne führende 0, z. B. "4915112345678"
  whatsapp: "",
  instagram: "",      // nur der Name, z. B. "zukkabro"
  tiktok: "",         // nur der Name, z. B. "zukkabro"
  email: "",          // z. B. "info@zukkabro.de"
  address: "",        // z. B. "Musterstraße 1, 12345 Musterstadt"
  hours: "",          // z. B. "Mo–Sa 10–20 Uhr"
  shipping: ""        // eigener Versandtext, leer lassen für Standardtext
};

const PRODUKTE = [
  // ---------- CANDY ----------
  { name: "Fruchtgummi Mix",        text: "Bärchen, Schlangen, Ringe. Die ganze Tüte bunt.",               kategorie: "candy",  emoji: "🐻", farbe: "pink",   badge: "BESTSELLER", preis: null },
  { name: "Sauer-Schlangen",        text: "Extra sauer gezuckert, für echte Sauer-Fans.",                  kategorie: "candy",  emoji: "🍋", farbe: "gold",   badge: "HOT",        preis: null },
  { name: "Riesen-Lollis",          text: "XXL-Lutscher in verschiedenen Farben und Sorten.",              kategorie: "candy",  emoji: "🍭", farbe: "violet", badge: "",           preis: null },
  { name: "Schoko-Riegel Auswahl",  text: "Wechselnde Schokoriegel aus aller Welt.",                       kategorie: "candy",  emoji: "🍫", farbe: "orange", badge: "",           preis: null },
  { name: "US-Candy Box",           text: "Süßigkeiten direkt aus den USA, wechselnder Inhalt.",           kategorie: "candy",  emoji: "🇺🇸", farbe: "blue",   badge: "NEU",        preis: null },
  { name: "Lokum Mix",              text: "Türkischer Lokum in Rose, Pistazie und Granatapfel.",           kategorie: "candy",  emoji: "🌹", farbe: "pink",   badge: "",           preis: null },
  { name: "Mystery Candy Box",      text: "Überraschungsbox mit zufälligen Süßigkeiten.",                  kategorie: "candy",  emoji: "🎁", farbe: "violet", badge: "NEU",        tags: ["mystery"], preis: null },

  // ---------- SNACKS ----------
  { name: "Scharfe Tortilla-Rolls", text: "Gerollte Chips mit Chili und Limette. Richtig scharf.",         kategorie: "snacks", emoji: "🌶️", farbe: "orange", badge: "BESTSELLER", preis: null },
  { name: "Chips Import-Sorten",    text: "Ausgefallene Chips-Sorten aus aller Welt.",                     kategorie: "snacks", emoji: "🥔", farbe: "gold",   badge: "",           preis: null },
  { name: "Popcorn süß & salzig",   text: "Fertig gepoppt in großen Tüten.",                               kategorie: "snacks", emoji: "🍿", farbe: "pink",   badge: "",           preis: null },
  { name: "Mystery Snack Box",      text: "Scharf, salzig, süß. Was drin ist, bleibt geheim.",             kategorie: "snacks", emoji: "❓", farbe: "dark",   badge: "",           tags: ["mystery"], preis: null },

  // ---------- DRINKS ----------
  { name: "Energy-Drinks",          text: "Verschiedene Marken und Sorten, auch Import-Dosen.",            kategorie: "drinks", emoji: "⚡", farbe: "green",  badge: "BESTSELLER", preis: null },
  { name: "Import-Limonaden",       text: "Softdrinks aus den USA und Asien in verrückten Geschmäckern.",  kategorie: "drinks", emoji: "🥤", farbe: "blue",   badge: "NEU",        preis: null },
  { name: "Bubble-Tea Dosen",       text: "Trinkfertig mit Tapioka-Perlen.",                               kategorie: "drinks", emoji: "🧋", farbe: "violet", badge: "",           preis: null },

  // ---------- VAPES 18+ ----------
  // Hinweis: nur sachliche Produktinfos, keine Werbe-Slogans (Tabakerzeugnisgesetz).
  { name: "Einweg-E-Zigaretten",    text: "Verschiedene Sorten, Nikotinstärke laut Packung. Sorten auf Anfrage.", kategorie: "vapes", emoji: "💨", farbe: "dark", badge: "", ab18: true, preis: null },
  { name: "Pod-Systeme",            text: "Wiederbefüllbare Geräte und Ersatz-Pods.",                      kategorie: "vapes",  emoji: "🔋", farbe: "dark",   badge: "",           ab18: true, preis: null },
  { name: "Liquids 10 ml",          text: "Liquids mit und ohne Nikotin, nur mit Steuermarke.",            kategorie: "vapes",  emoji: "🧪", farbe: "dark",   badge: "",           ab18: true, preis: null }
];
