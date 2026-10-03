/* =========================================================
   MM Trockenbau – zentrale Konfiguration
   Hier Firmendaten, Fotos und (optional) Webhook eintragen.
   ========================================================= */
window.MM_CONFIG = {
  company: {
    name: "MM Trockenbau",
    shortName: "MM",
    owner: "Mustafa Özkan",
    legalForm: "Einzelunternehmen",
    street: "Klingenberger Straße 100",
    zip: "74080",
    city: "Heilbronn",
    phone: "+49 160 92234091",
    phoneDisplay: "0160 / 922 340 91",
    whatsapp: "+4916092234091",         // leer lassen = WhatsApp-Buttons ausblenden
    email: "info@mm-trockenbau.de",
    taxId: "65306/40576",               // Steuernummer
    vatId: "",                                   // USt-IdNr. falls vorhanden
    kleinunternehmer: true,              // Kleinunternehmerregelung § 19 UStG (keine USt)
    domain: "https://mm-trockenbau.netlify.app/",
    openingHours: [
      ["Mo – Fr", "07:00 – 18:00 Uhr"],
      ["Sa", "nach Vereinbarung"]
    ],
    /* Koordinaten des Firmensitzes (Klingenberger Str. 100, Heilbronn-Böckingen) */
    lat: 49.1385,
    lng: 9.1862,
    serviceRadiusKm: 80
  },

  /* Hero-Diashow auf der Startseite (Querformat, mind. 1600 px breit).
     Eigene Baustellenfotos unter assets/img/referenzen/ ablegen und hier eintragen.
     Fehlende Dateien werden automatisch übersprungen. Ohne Bilder zeigt die
     Startseite einen dunklen Verlauf mit Logo. */
  slides: [
    { src: "assets/img/referenzen/ref-01.jpg", caption: "Trockenbauwände und abgehängte Decke", alt: "Fertig gespachtelte Trockenbauwand mit abgehängter Decke" },
    { src: "assets/img/referenzen/ref-02.jpg", caption: "Dachgeschossausbau", alt: "Ausgebautes Dachgeschoss mit Gipskartonverkleidung" },
    { src: "assets/img/referenzen/ref-03.jpg", caption: "Lichtdecke mit indirekter Beleuchtung", alt: "Abgehängte Decke mit LED-Lichtvoute" },
    { src: "assets/img/referenzen/ref-04.jpg", caption: "Büroausbau mit Ständerwänden", alt: "Metallständerwand im Büroausbau" },
    { src: "assets/img/referenzen/ref-05.jpg", caption: "Spachtelung Q3", alt: "Glatt gespachtelte Wand, Qualitätsstufe Q3" }
  ],

  /* Zuletzt ausgeführt – erscheint auf Start- und Referenzseite.
     Ort + Leistung reichen, keine Kundennamen. TODO: echte Projekte eintragen. */
  jobs: [
    { town: "Heilbronn",     what: "Dachgeschossausbau, 95 m² Wand- und Deckenfläche", extra: "Dämmung, Dampfbremse, Q3-Spachtelung" },
    { town: "Neckarsulm",    what: "Abgehängte Decke mit LED-Lichtvoute, 48 m²", extra: "Wohnzimmer" },
    { town: "Ludwigsburg",   what: "Büroausbau: 6 Räume mit Ständerwänden", extra: "Schallschutz, Türzargen" },
    { town: "Weinsberg",     what: "Badsanierung: Vorwandinstallation und Feuchtraumplatten", extra: "" },
    { town: "Öhringen",      what: "Trockenestrich und Wandverkleidung, 70 m²", extra: "Altbau" }
  ],

  /* Kundenstimmen – NUR echte Bewertungen eintragen (mit Einverständnis des Kunden).
     Solange die Liste leer ist, bleibt der Abschnitt ausgeblendet.
     Erfundene Bewertungen sind wettbewerbswidrig (§ 5a UWG) und abmahnfähig.
     Beispiel: { text: "…", name: "Familie K.", town: "Heilbronn", stars: 5 } */
  reviews: [],
  googleReviewsUrl: "",

  /* Optional: Endpoint, an den Anfragen zusätzlich per POST (JSON) gesendet werden. Leer = nur E-Mail. */
  requestWebhook: ""
};
