/* =========================================================
   MM Trockenbau – zentrale Konfiguration
   Hier Firmendaten, Fotos und (optional) Webhook eintragen.
   Alle mit TODO markierten Werte vor dem Livegang ersetzen!
   ========================================================= */
window.MM_CONFIG = {
  company: {
    name: "MM Trockenbau",
    shortName: "MM",
    owner: "TODO Inhaber",                       // TODO: Vor- und Nachname des Inhabers
    legalForm: "Einzelunternehmen",              // TODO: ggf. GbR / GmbH
    street: "TODO Straße Hausnummer",            // TODO
    zip: "00000",                                // TODO
    city: "Heilbronn",                           // TODO
    phone: "+49 000 0000000",                    // TODO: internationales Format
    phoneDisplay: "0000 / 000 00 00",            // TODO
    whatsapp: "",                                // z. B. "+4916012345678" – leer = WhatsApp-Buttons ausblenden
    email: "info@mm-trockenbau.de",              // TODO
    taxId: "",                                   // Steuernummer – TODO
    vatId: "",                                   // USt-IdNr. falls vorhanden
    kleinunternehmer: false,                     // true = Kleinunternehmerregelung § 19 UStG (keine USt)
    domain: "https://mm-trockenbau.de/",         // TODO: tatsächliche Domain
    openingHours: [
      ["Mo – Fr", "07:00 – 18:00 Uhr"],
      ["Sa", "nach Vereinbarung"]
    ],
    /* Koordinaten des Firmensitzes (Heilbronn-Böckingen als Platzhalter) – TODO anpassen */
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
