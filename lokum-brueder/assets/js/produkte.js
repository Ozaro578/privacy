/* =========================================================
   LOKUM BRÜDER – HIER BEARBEITEN
   =========================================================
   1) SHOP: Kontaktdaten eintragen. Leere Felder ("") werden
      auf der Seite als "folgt" angezeigt.
   2) PRODUKTE: Produkte hinzufügen, löschen oder ändern.
      - preis: null        -> Anzeige "Preis auf Anfrage"
      - preis: 2.5         -> Anzeige "2,50 €"
      - kategorie: lokum | candy | usa | snacks | drinks | vapes
      - badge: "NEU", "HOT", "BESTSELLER" usw. oder ""
      - ab18: true         -> zeigt ein 18+ Siegel
      - farbe: pink | orange | yellow | green | cyan | blue | purple | dark
   ========================================================= */

const SHOP = {
  // Nur Ziffern, mit Ländervorwahl ohne "+" und ohne führende 0, z. B. "4915112345678"
  whatsapp: "",
  instagram: "",      // nur der Name, z. B. "lokumbrueder"
  tiktok: "",         // nur der Name, z. B. "lokumbrueder"
  email: "",          // z. B. "info@lokum-brueder.de"
  address: "",        // z. B. "Musterstraße 1, 12345 Musterstadt"
  hours: ""           // z. B. "Mo–Sa 10–20 Uhr"
};

const PRODUKTE = [
  // ---------- LOKUM ----------
  { name: "Lokum Rose",            text: "Klassischer türkischer Honig mit Rosenwasser, gepudert.",       kategorie: "lokum",  emoji: "🌹", farbe: "pink",   badge: "BESTSELLER", preis: null },
  { name: "Lokum Pistazie",        text: "Weich, süß und voller Pistazienstücke.",                         kategorie: "lokum",  emoji: "🟢", farbe: "green",  badge: "",           preis: null },
  { name: "Lokum Granatapfel",     text: "Fruchtig-herb mit Granatapfel, schön rot.",                      kategorie: "lokum",  emoji: "❤️", farbe: "purple", badge: "NEU",        preis: null },
  { name: "Lokum Mix-Box",         text: "Bunte Auswahl verschiedener Sorten, perfekt zum Verschenken.",   kategorie: "lokum",  emoji: "🎁", farbe: "yellow", badge: "",           preis: null },

  // ---------- CANDY ----------
  { name: "Fruchtgummi Mix",       text: "Bärchen, Schlangen, Ringe. Die ganze Tüte bunt.",                kategorie: "candy",  emoji: "🐻", farbe: "orange", badge: "",           preis: null },
  { name: "Sauer-Schlangen",       text: "Extra sauer gezuckert, für echte Sauer-Fans.",                   kategorie: "candy",  emoji: "🍋", farbe: "yellow", badge: "HOT",        preis: null },
  { name: "Riesen-Lollis",         text: "XXL-Lutscher in verschiedenen Farben und Sorten.",               kategorie: "candy",  emoji: "🍭", farbe: "pink",   badge: "",           preis: null },
  { name: "Schoko-Riegel Auswahl", text: "Wechselnde Schokoriegel und Pralinen.",                          kategorie: "candy",  emoji: "🍫", farbe: "purple", badge: "",           preis: null },
  { name: "Mystery Candy Box",     text: "Überraschungsbox mit zufälligen Süßigkeiten.",                   kategorie: "candy",  emoji: "🎲", farbe: "cyan",   badge: "NEU",        preis: null },

  // ---------- US-IMPORT ----------
  { name: "US-Candy Box",          text: "Süßigkeiten direkt aus den USA, wechselnder Inhalt.",            kategorie: "usa",    emoji: "🇺🇸", farbe: "blue",   badge: "BESTSELLER", preis: null },
  { name: "Marshmallow-Creme",     text: "Süßer Brotaufstrich-Klassiker aus Amerika.",                     kategorie: "usa",    emoji: "☁️", farbe: "cyan",   badge: "",           preis: null },
  { name: "Import-Cerealien",      text: "Bunte Frühstücksflocken, die es hier sonst nicht gibt.",         kategorie: "usa",    emoji: "🥣", farbe: "orange", badge: "",           preis: null },

  // ---------- SNACKS ----------
  { name: "Scharfe Tortilla-Rolls", text: "Gerollte Chips mit Chili und Limette. Richtig scharf.",         kategorie: "snacks", emoji: "🌶️", farbe: "orange", badge: "HOT",        preis: null },
  { name: "Chips Import-Sorten",   text: "Ausgefallene Chips-Sorten aus aller Welt.",                      kategorie: "snacks", emoji: "🥔", farbe: "yellow", badge: "",           preis: null },
  { name: "Popcorn süß & salzig",  text: "Fertig gepoppt in großen Tüten.",                                kategorie: "snacks", emoji: "🍿", farbe: "pink",   badge: "",           preis: null },
  { name: "Nüsse & Kerne",         text: "Geröstete Kerne und Nüsse, gesalzen oder gewürzt.",              kategorie: "snacks", emoji: "🥜", farbe: "green",  badge: "",           preis: null },

  // ---------- DRINKS ----------
  { name: "Energy-Drinks",         text: "Verschiedene Marken und Sorten, auch Import-Dosen.",             kategorie: "drinks", emoji: "⚡", farbe: "green",  badge: "",           preis: null },
  { name: "Import-Limonaden",      text: "Softdrinks aus den USA und Asien in verrückten Geschmäckern.",   kategorie: "drinks", emoji: "🥤", farbe: "cyan",   badge: "NEU",        preis: null },
  { name: "Bubble-Tea Dosen",      text: "Trinkfertig mit Tapioka-Perlen.",                                kategorie: "drinks", emoji: "🧋", farbe: "purple", badge: "",           preis: null },

  // ---------- VAPES 18+ ----------
  // Hinweis: Nur sachliche Produktinfos, keine Werbe-Slogans (Tabakerzeugnisgesetz).
  { name: "Einweg-E-Zigaretten",   text: "Verschiedene Sorten, Nikotinstärke laut Packung. Sorten auf Anfrage.", kategorie: "vapes", emoji: "💨", farbe: "dark", badge: "", ab18: true, preis: null },
  { name: "Pod-Systeme",           text: "Wiederbefüllbare Geräte und Ersatz-Pods.",                       kategorie: "vapes",  emoji: "🔋", farbe: "dark",   badge: "",           ab18: true, preis: null },
  { name: "Liquids 10 ml",         text: "Liquids mit und ohne Nikotin, nur mit Steuermarke.",             kategorie: "vapes",  emoji: "🧪", farbe: "dark",   badge: "",           ab18: true, preis: null },
  { name: "Shisha-Kohle & Zubehör", text: "Naturkohle, Schläuche, Köpfe und Mundstücke.",                  kategorie: "vapes",  emoji: "🔥", farbe: "dark",   badge: "",           ab18: true, preis: null }
];
