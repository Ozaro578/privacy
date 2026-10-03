/* =========================================================
   MM Montageservice – zentrale Konfiguration
   Hier Firmendaten, Fotos und (optional) Webhook eintragen.
   ========================================================= */
window.MM_CONFIG = {
  company: {
    name: "MM Montageservice",
    shortName: "MM",
    owner: "Mustafa Özkan",
    legalForm: "Einzelunternehmen",
    street: "Klingenberger Straße 100",
    zip: "74080",
    city: "Heilbronn",
    phone: "+49 160 92234091",
    phoneDisplay: "0160 / 922 340 91",
    whatsapp: "+4916092234091",                 // leer lassen = WhatsApp-Buttons ausblenden
    email: "info@mm-montageservice.de",
    taxId: "65306/40576",                       // Steuernummer (laut Rechnung)
    vatId: "",                                  // USt-IdNr., falls vorhanden
    bank: "VR-Bank Heilbronn · IBAN DE79 6229 0110 0323 5040 19",
    openingHours: [
      ["Mo – Fr", "07:00 – 18:00 Uhr"],
      ["Sa", "08:00 – 14:00 Uhr"],
      ["Notfall", "telefonisch nach Absprache"]
    ],
    /* Koordinaten (ungefähr, Klingenberger Str. 100, Heilbronn-Böckingen) */
    lat: 49.1385,
    lng: 9.1862,
    serviceRadiusKm: 120
  },

  /* Hero-Diashow auf der Startseite (Format 16:9 oder 3:2, mind. 1600 px breit).
     Eigene Referenzfotos unter assets/img/referenzen/ ablegen und hier eintragen.
     Fehlende Dateien werden automatisch übersprungen. Sobald mindestens drei
     eigene Fotos (ohne "stock: true") vorhanden sind, werden nur noch diese gezeigt. */
  slides: [
    { src: "assets/img/referenzen/ref-01.jpg", caption: "Sektionaltor 5,15 × 2,18 m · Hardthausen", alt: "Montiertes Sektionaltor in Hardthausen" },
    { src: "assets/img/referenzen/ref-02.jpg", caption: "Sektionaltor Doppelgarage · Neudenau", alt: "Montiertes Sektionaltor in Neudenau" },
    { src: "assets/img/referenzen/ref-03.jpg", caption: "Zwei Sektionaltore · Seckach", alt: "Zwei montierte Sektionaltore in Seckach" },
    { src: "assets/img/referenzen/ref-04.jpg", caption: "Haustür mit Demontage · Karlsruhe", alt: "Montierte Haustür in Karlsruhe" },
    { src: "assets/img/referenzen/ref-05.jpg", caption: "Zwei Sektionaltore · Künzelsau", alt: "Montierte Sektionaltore in Künzelsau" },
    { src: "assets/img/stock/garagentor-haus.jpg", caption: "Sektionaltore für Einfamilienhäuser", alt: "Anthrazitfarbenes Sektionaltor an einem modernen Einfamilienhaus", stock: true },
    { src: "assets/img/stock/montage.jpg", caption: "Montage nach Herstellervorgaben", alt: "Monteur befestigt die Laufschiene eines Sektionaltors", stock: true },
    { src: "assets/img/stock/haustuer.jpg", caption: "Haustüren und Nebeneingangstüren", alt: "Moderne anthrazitfarbene Aluminium-Haustür", stock: true }
  ],

  /* Zuletzt montiert – erscheint auf Start- und Referenzseite.
     Keine Kundennamen eintragen (Datenschutz), Ort + Leistung reichen. */
  jobs: [
    { date: "2026-06", town: "Hardthausen",         what: "Sektionaltor 5,15 × 2,18 m", extra: "Demontage & Entsorgung" },
    { date: "2026-06", town: "Neudenau",            what: "Sektionaltor 5,45 × 2,21 m, Doppelgarage", extra: "" },
    { date: "2026-06", town: "Seckach",             what: "2 Sektionaltore 2,69 × 2,21 m", extra: "Demontage" },
    { date: "2026-06", town: "Neustadt a. d. W.",   what: "2 Sektionaltore 2,83 × 2,28 m", extra: "Demontage & Entsorgung" },
    { date: "2026-06", town: "Karlsruhe",           what: "Haustür 1,15 × 2,24 m", extra: "Demontage & Entsorgung" },
    { date: "2026-06", town: "Karlsruhe",           what: "2 Sektionaltore 2,70 × 2,29 m, Reihenhauszeile", extra: "Demontage & Entsorgung" },
    { date: "2026-06", town: "Künzelsau",           what: "2 Sektionaltore 2,62 × 2,16 m", extra: "" }
  ],

  /* Kundenstimmen – NUR echte Bewertungen eintragen (mit Einverständnis des Kunden).
     Solange die Liste leer ist, bleibt der Abschnitt ausgeblendet.
     Erfundene Bewertungen sind wettbewerbswidrig (§ 5a UWG) und abmahnfähig.
     Beispiel: { text: "…", name: "Familie W.", town: "Hardthausen", stars: 5 } */
  reviews: [],
  googleReviewsUrl: "",                         // z. B. Link zum Google-Unternehmensprofil

  /* Optional: Endpoint, an den Anfragen zusätzlich per POST (JSON) gesendet werden –
     z. B. Formspree, Make, Zapier oder ein eigenes Script. Leer = nur E-Mail. */
  requestWebhook: ""
};
