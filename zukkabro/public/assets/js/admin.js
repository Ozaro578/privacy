/* =========================================================
   ZUKKABRO – Admin-Bereich
   Bestellungen, Händler, Händlerpreise, Buchhaltung, Bestand
   ========================================================= */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var esc = ZB.esc, euro = ZB.euro;
  var MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  var STATUS_TEXT = { neu: "Neu", bestaetigt: "Bestätigt", versendet: "Versendet", bezahlt: "Bezahlt", abgeschlossen: "Abgeschlossen", storniert: "Storniert", offen: "Offen", aktiv: "Aktiv", gesperrt: "Gesperrt" };
  var TYP_TEXT = { verkauf: "Verkauf", einkauf: "Wareneinkauf", ausgabe: "Ausgabe", einnahme: "Einnahme", storno: "Storno" };

  var daten = { buchungen: [], alleBuchungen: null, bestellungen: [], haendler: [], preise: {}, shop: {}, einstellungen: {} };
  var preisAenderungen = {};   // Händlerpreise
  var shopAenderungen = {};    // Endkunden-Shop-Preise
  var preisZeige = 50;

  /* ================= Anmeldung ================= */
  async function start() {
    try {
      var ich = await ZB.api("GET", "/ich");
      if (ich.angemeldet && ich.rolle === "admin") return appStarten(ich.name);
    } catch (e) { /* nicht angemeldet */ }
    $("loginBereich").hidden = false;
  }

  $("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    var f = e.target, fehler = $("loginFehler");
    fehler.hidden = true;
    try {
      var r = await ZB.api("POST", "/login", { rolle: "admin", benutzer: f.benutzer.value, passwort: f.passwort.value });
      f.passwort.value = "";
      $("loginBereich").hidden = true;
      appStarten(r.name);
    } catch (err) { fehler.textContent = err.message; fehler.hidden = false; }
  });

  $("logout").addEventListener("click", async function () {
    try { await ZB.api("POST", "/logout", {}); } catch (e) { /* egal */ }
    location.reload();
  });

  /* ================= App ================= */
  var aktuellerTab = "uebersicht";
  async function appStarten(name) {
    $("adminName").textContent = name;
    $("app").hidden = false;
    var j = new Date().getFullYear();
    $("jahr").innerHTML = [j + 1, j, j - 1, j - 2].map(function (y) { return '<option value="' + y + '"' + (y === j ? " selected" : "") + ">" + y + "</option>"; }).join("");
    $("buchungForm").datum.value = ZB.heute();
    $("protokollMonat").value = ZB.heute().slice(0, 7);
    produktListeFuellen();
    kategorienFuellen();
    ZB.tabs($("reiter"), function (id) { aktuellerTab = id; zeichneTab(id); });
    await allesLaden();
  }

  async function allesLaden() {
    try {
      var r = await Promise.all([
        ZB.api("GET", "/admin/buchungen?jahr=" + $("jahr").value),
        ZB.api("GET", "/admin/bestellungen"),
        ZB.api("GET", "/admin/haendler"),
        ZB.api("GET", "/admin/preise"),
      ]);
      daten.buchungen = r[0].buchungen; daten.bestellungen = r[1].bestellungen;
      daten.haendler = r[2].haendler; daten.preise = r[3].preise; daten.shop = r[3].shop || {}; daten.einstellungen = r[3].einstellungen || {}; daten.alleBuchungen = null;
      zaehler();
      zeichneTab(aktuellerTab);
    } catch (e) {
      if (e.status === 401) return location.reload();
      ZB.meldung(e.message, "fehler");
    }
  }
  $("neuLaden").addEventListener("click", allesLaden);
  $("jahr").addEventListener("change", allesLaden);

  function zaehler() {
    var neu = daten.bestellungen.filter(function (b) { return b.status === "neu"; }).length; // Kunden, Händler und Preisanfragen
    var offen = daten.haendler.filter(function (h) { return h.status === "offen"; }).length;
    $("zahlBestellungen").textContent = neu; $("zahlBestellungen").hidden = !neu;
    $("zahlHaendler").textContent = offen; $("zahlHaendler").hidden = !offen;
  }

  function zeichneTab(id) {
    if (id === "uebersicht") uebersicht();
    if (id === "bestellungen") bestellungen();
    if (id === "haendler") haendler();
    if (id === "preise") preise();
    if (id === "einstellungen") einstellungenZeigen();
    if (id === "pakete") paketeLaden();
    if (id === "buchhaltung") journal();
    if (id === "bestand") bestand();
    if (id === "protokoll") protokoll();
  }

  /* ================= Rechnen ================= */
  /** Stornierte Buchungen (und die Stornos selbst) für Summen herausnehmen */
  function wirksam(liste) {
    var storniert = {};
    liste.forEach(function (b) { if (b.typ === "storno" && b.bezug) storniert[b.bezug] = true; });
    return liste.filter(function (b) { return b.typ !== "storno" && !storniert[b.id]; });
  }
  function netto(b) { return Math.round(b.betrag / (1 + b.mwst / 100)); }
  function summen(liste) {
    var s = { umsatz: 0, umsatzNetto: 0, ust: 0, einkauf: 0, einkaufNetto: 0, ausgaben: 0, ausgabenNetto: 0, vorsteuer: 0, stueck: 0, anzahl: 0 };
    liste.forEach(function (b) {
      var n = netto(b);
      if (b.typ === "verkauf" || b.typ === "einnahme") { s.umsatz += b.betrag; s.umsatzNetto += n; s.ust += b.betrag - n; if (b.typ === "verkauf") { s.stueck += b.menge; s.anzahl++; } }
      if (b.typ === "einkauf") { s.einkauf += b.betrag; s.einkaufNetto += n; s.vorsteuer += b.betrag - n; }
      if (b.typ === "ausgabe") { s.ausgaben += b.betrag; s.ausgabenNetto += n; s.vorsteuer += b.betrag - n; }
    });
    s.ergebnis = s.umsatzNetto - s.einkaufNetto - s.ausgabenNetto;
    s.zahllast = s.ust - s.vorsteuer;
    return s;
  }
  function geld(c) { return '<span class="' + (c < 0 ? "negativ" : "") + '">' + euro(c) + "</span>"; }

  /* ================= Übersicht ================= */
  function monatsAuswahl(select, mitAlle) {
    var alt = select.value;
    select.innerHTML = (mitAlle ? '<option value="">Ganzes Jahr ' + esc($("jahr").value) + "</option>" : "") +
      MONATE.map(function (m, i) { var v = String(i + 1).padStart(2, "0"); return '<option value="' + v + '">' + m + "</option>"; }).join("");
    if (alt) select.value = alt;
  }
  function uebersicht() {
    monatsAuswahl($("uebersichtMonat"), true);
    var monat = $("uebersichtMonat").value;
    var basis = wirksam(daten.buchungen);
    var liste = monat ? basis.filter(function (b) { return b.datum.slice(5, 7) === monat; }) : basis;
    var s = summen(liste);
    var offeneBestellungen = daten.bestellungen.filter(function (b) { return ["neu", "bestaetigt", "versendet"].indexOf(b.status) !== -1; }).length;
    var offeneHaendler = daten.haendler.filter(function (h) { return h.status === "offen"; }).length;
    var kpi = function (label, wert, farbe) { return '<div class="kpi kpi--' + farbe + '"><div class="kpi__label">' + label + '</div><div class="kpi__wert">' + wert + "</div></div>"; };
    $("kpis").innerHTML =
      kpi("Umsatz brutto", euro(s.umsatz), "pink") +
      kpi("Wareneinkauf brutto", euro(s.einkauf), "gold") +
      kpi("Sonstige Ausgaben", euro(s.ausgaben), "gold") +
      kpi("Ergebnis netto", geld(s.ergebnis), "gruen") +
      kpi("Verkaufte Stück", ZB.zahl(s.stueck), "blau") +
      kpi("USt-Zahllast (ca.)", geld(s.zahllast), "violett") +
      kpi("Offene Bestellungen", offeneBestellungen, "pink") +
      kpi("Händler zu prüfen", offeneHaendler, "blau");

    var zeilen = MONATE.map(function (m, i) {
      var v = String(i + 1).padStart(2, "0");
      var x = summen(basis.filter(function (b) { return b.datum.slice(5, 7) === v; }));
      return "<tr><td>" + m + '</td><td class="num">' + euro(x.umsatz) + '</td><td class="num">' + euro(x.einkauf) + '</td><td class="num">' + euro(x.ausgaben) +
        '</td><td class="num">' + geld(x.ergebnis) + '</td><td class="num">' + geld(x.zahllast) + '</td><td class="num">' + ZB.zahl(x.stueck) + "</td></tr>";
    }).join("");
    var g = summen(basis);
    $("monatsTabelle").innerHTML = '<thead><tr><th>Monat</th><th class="num">Umsatz brutto</th><th class="num">Einkauf brutto</th><th class="num">Ausgaben brutto</th><th class="num">Ergebnis netto</th><th class="num">USt-Zahllast</th><th class="num">Stück verkauft</th></tr></thead><tbody>' + zeilen +
      '</tbody><tfoot><tr><td>Summe ' + esc($("jahr").value) + '</td><td class="num">' + euro(g.umsatz) + '</td><td class="num">' + euro(g.einkauf) + '</td><td class="num">' + euro(g.ausgaben) + '</td><td class="num">' + geld(g.ergebnis) + '</td><td class="num">' + geld(g.zahllast) + '</td><td class="num">' + ZB.zahl(g.stueck) + "</td></tr></tfoot>";
  }
  $("uebersichtMonat").addEventListener("change", uebersicht);

  /* ================= Bestellungen ================= */
  var ART = { kunde: "🛒 Kunde", haendler: "🏪 Händler", preisanfrage: "💬 Preisanfrage" };
  function bestellungen() {
    var filter = $("bestellFilter").value, art = $("bestellArt").value;
    var liste = daten.bestellungen.filter(function (b) { return (!filter || b.status === filter) && (!art || (b.art || "haendler") === art); });
    if (!liste.length) { $("bestellListe").innerHTML = '<p class="leer">Keine Bestellungen.</p>'; return; }
    $("bestellListe").innerHTML = liste.map(function (b) {
      var a = b.art || "haendler", anfrage = a === "preisanfrage";
      var kopf = anfrage
        ? '<thead><tr><th>Produkt</th><th class="num">Wunschmenge (Stück)</th><th class="num">MwSt-Vorschlag</th></tr></thead>'
        : '<thead><tr><th>Produkt</th><th class="num">' + (a === "kunde" ? "Menge" : "VE × Stück") + '</th><th class="num">Stück</th><th class="num">Preis ' + (a === "kunde" ? "brutto" : "netto") + '</th><th class="num">MwSt</th><th class="num">Summe ' + (a === "kunde" ? "brutto" : "netto") + "</th></tr></thead>";
      var pos = b.positionen.map(function (p) {
        var name = esc(p.name) + '<br><small><a href="/produkt.html?id=' + encodeURIComponent(p.produktId) + '" target="_blank">' + esc(p.produktId) + "</a></small>";
        if (anfrage) return "<tr><td>" + name + '</td><td class="num">' + ZB.zahl(p.stueck) + '</td><td class="num">' + p.mwst + " %</td></tr>";
        var einzel = a === "kunde" ? Math.round(p.brutto / p.stueck) : p.preis;
        return "<tr><td>" + name + '</td><td class="num">' + (a === "kunde" ? p.stueck : p.anzahlVE + " × " + p.ve) + '</td><td class="num">' + ZB.zahl(p.stueck) +
          '</td><td class="num">' + euro(einzel) + '</td><td class="num">' + p.mwst + ' %</td><td class="num">' + euro(a === "kunde" ? p.brutto : p.netto) + "</td></tr>";
      }).join("");
      var fuss = anfrage ? "" : '<tfoot>' + (b.versand ? '<tr><td colspan="5">Versand</td><td class="num">' + euro(b.versand) + "</td></tr>" : "") +
        '<tr><td colspan="5">Netto</td><td class="num">' + euro(b.netto) + '</td></tr><tr><td colspan="5">MwSt</td><td class="num">' + euro(b.mwst) + '</td></tr><tr><td colspan="5">Gesamt brutto</td><td class="num">' + euro(b.brutto) + "</td></tr></tfoot>";
      var optionen = ["neu", "bestaetigt", "versendet", "bezahlt", "abgeschlossen", "storniert"].map(function (s) {
        return '<option value="' + s + '"' + (s === b.status ? " selected" : "") + ">" + (anfrage && s === "abgeschlossen" ? "Beantwortet" : STATUS_TEXT[s]) + "</option>";
      }).join("");
      var kontakt;
      if (a === "kunde") {
        var k = b.kunde || {};
        kontakt = "<p><strong>" + (b.lieferart === "abholung" ? "Abholung" : "Lieferadresse") + ":</strong> " + esc([k.vorname + " " + k.nachname, b.lieferart === "versand" ? k.strasse : "", b.lieferart === "versand" ? k.plz + " " + k.ort : ""].filter(Boolean).join(", ")) +
          " · " + esc(k.email) + (k.telefon ? " · " + esc(k.telefon) : "") + "<br><strong>Zahlung:</strong> " + esc(b.zahlart || "") +
          (b.ab18 ? ' · <span class="status status--neu">🔞 18+ · geb. ' + ZB.datumDE(k.geburtsdatum) + " · Ausweis prüfen!</span>" : "") + "</p>";
      } else {
        var h = daten.haendler.find(function (x) { return x.id === b.haendlerId; }) || {};
        kontakt = "<p><strong>Händler:</strong> " + esc([h.firma, h.ansprechpartner, h.strasse, (h.plz || "") + " " + (h.ort || "")].filter(Boolean).join(", ")) +
          (h.email ? " · " + esc(h.email) : "") + (h.telefon ? " · " + esc(h.telefon) : "") + "</p>";
      }
      var buchbar = !anfrage;
      return '<details class="bestellung" data-id="' + esc(b.id) + '"><summary><span>' + ART[a] + " · " + esc(b.id) + "<br><small>" + esc(b.firma) + " · " + ZB.zeitDE(b.erstellt) + "</small></span>" +
        '<span class="status status--' + b.status + '">' + (anfrage && b.status === "abgeschlossen" ? "Beantwortet" : STATUS_TEXT[b.status]) + (b.gebucht ? " · gebucht" : "") + '</span><span class="summe">' + (anfrage ? b.positionen.length + " Artikel" : euro(b.brutto)) + "</span></summary>" +
        '<div class="bestellung__inhalt">' +
          '<div class="tabelle-wrap"><table class="tabelle">' + kopf + "<tbody>" + pos + "</tbody>" + fuss + "</table></div>" +
          (b.notiz ? '<p class="hinweis"><strong>Notiz:</strong> ' + esc(b.notiz) + "</p>" : "") + kontakt +
          (anfrage ? '<p class="hinweis">Preisanfrage: Trag unter „Preise“ Händlerpreise für diese Artikel ein und melde dich beim Händler. Danach Status auf „Beantwortet“ setzen.</p>' : "") +
          '<div class="leiste" style="margin:0">' +
            '<label class="feld">Status<select class="js-status">' + optionen + "</select></label>" +
            '<button class="btn btn--pink btn--klein js-status-speichern" type="button">Status speichern</button>' +
            (buchbar ? '<button class="btn btn--gruen btn--klein js-buchen" type="button"' + (b.gebucht || b.status === "storniert" ? " disabled" : "") + ">" + (b.gebucht ? "✓ In Buchhaltung" : "In Buchhaltung übernehmen") + "</button>" : "") +
            '<button class="btn btn--light btn--klein js-drucken" type="button">🖨 Drucken</button>' +
          "</div>" +
          '<small>Verlauf: ' + b.verlauf.map(function (v) { return STATUS_TEXT[v.status] + " (" + esc(v.von) + ", " + ZB.zeitDE(v.am) + ")"; }).join(" → ") + "</small>" +
        "</div></details>";
    }).join("");
  }
  $("bestellFilter").addEventListener("change", bestellungen);
  $("bestellArt").addEventListener("change", bestellungen);
  $("bestellListe").addEventListener("click", async function (e) {
    var box = e.target.closest("details.bestellung");
    if (!box) return;
    var id = box.getAttribute("data-id");
    try {
      if (e.target.closest(".js-status-speichern")) {
        var r = await ZB.api("POST", "/admin/bestellungen/status", { id: id, status: box.querySelector(".js-status").value });
        ersetzeBestellung(r.bestellung); ZB.meldung("Status gespeichert.");
      }
      if (e.target.closest(".js-buchen")) {
        if (!confirm("Diese Bestellung als Verkauf in die Buchhaltung übernehmen? Das geht nur einmal.")) return;
        var r2 = await ZB.api("POST", "/admin/bestellungen/buchen", { id: id });
        ersetzeBestellung(r2.bestellung); ZB.meldung("Bestellung gebucht.");
        var r3 = await ZB.api("GET", "/admin/buchungen?jahr=" + $("jahr").value); daten.buchungen = r3.buchungen; daten.alleBuchungen = null;
      }
      if (e.target.closest(".js-drucken")) { box.open = true; window.print(); return; }
      if (!e.target.closest(".js-status-speichern, .js-buchen")) return;
      bestellungen(); zaehler();
      var neu = document.querySelector('details.bestellung[data-id="' + id + '"]'); if (neu) neu.open = true;
    } catch (err) { ZB.meldung(err.message, "fehler"); }
  });
  function ersetzeBestellung(b) {
    daten.bestellungen = daten.bestellungen.map(function (x) { return x.id === b.id ? b : x; });
  }

  /* ================= Händler ================= */
  function haendler() {
    var filter = $("haendlerFilter").value;
    var liste = daten.haendler.filter(function (h) { return !filter || h.status === filter; });
    $("haendlerTabelle").innerHTML = '<thead><tr><th>Firma</th><th>Kontakt</th><th>Adresse</th><th>USt-ID</th><th>Registriert</th><th>Status</th><th>Aktion</th></tr></thead><tbody>' +
      (liste.length ? liste.map(function (h) {
        var aktionen = "";
        if (h.status !== "aktiv") aktionen += '<button class="btn btn--gruen btn--klein" data-status="aktiv" data-id="' + esc(h.id) + '">Freischalten</button> ';
        if (h.status !== "gesperrt") aktionen += '<button class="btn btn--rot btn--klein" data-status="gesperrt" data-id="' + esc(h.id) + '">Sperren</button>';
        return "<tr><td><strong>" + esc(h.firma) + "</strong><br><small>" + esc(h.id) + "</small></td><td>" + esc(h.ansprechpartner) + "<br>" + esc(h.email) + "<br>" + esc(h.telefon) +
          "</td><td>" + esc(h.strasse) + "<br>" + esc(h.plz) + " " + esc(h.ort) + "</td><td>" + esc(h.ustId || "–") + "</td><td>" + ZB.zeitDE(h.erstellt) +
          '</td><td><span class="status status--' + h.status + '">' + STATUS_TEXT[h.status] + "</span></td><td>" + aktionen + "</td></tr>";
      }).join("") : '<tr><td colspan="7" class="leer">Keine Händler.</td></tr>') + "</tbody>";
  }
  $("haendlerFilter").addEventListener("change", haendler);
  $("haendlerTabelle").addEventListener("click", async function (e) {
    var b = e.target.closest("button[data-status]");
    if (!b) return;
    var status = b.getAttribute("data-status");
    if (status === "gesperrt" && !confirm("Diesen Händler wirklich sperren? Er kann dann nicht mehr bestellen.")) return;
    try {
      var r = await ZB.api("POST", "/admin/haendler/status", { id: b.getAttribute("data-id"), status: status });
      daten.haendler = daten.haendler.map(function (h) { return h.id === r.haendler.id ? r.haendler : h; });
      haendler(); zaehler(); ZB.meldung(status === "aktiv" ? "Händler freigeschaltet." : "Händler gesperrt.");
    } catch (err) { ZB.meldung(err.message, "fehler"); }
  });

  /* ================= Händlerpreise ================= */
  function kategorienFuellen() {
    if (typeof KATEGORIEN === "undefined") return;
    $("preisKat").innerHTML += KATEGORIEN.map(function (k) { return '<option value="' + esc(k.id) + '">' + esc(k.emoji + " " + k.name) + "</option>"; }).join("");
  }
  function preisEintrag(id) {
    if (preisAenderungen.hasOwnProperty(id)) return preisAenderungen[id];
    return daten.preise[id] || null;
  }
  function preise() {
    var q = $("preisSuche").value.toLowerCase().trim(), kat = $("preisKat").value, nur = $("preisNur").value;
    var alle = (typeof PRODUKTE !== "undefined" ? PRODUKTE : []).slice();
    // Produkte mit Preis, die nicht (mehr) im Sortiment sind, trotzdem zeigen
    Object.keys(daten.preise).forEach(function (id) { if (!ZB.produkte[id]) alle.push({ id: id, name: daten.preise[id].name, marke: daten.preise[id].marke || "", kat: [] }); });
    var liste = alle.filter(function (p) {
      var e = preisEintrag(p.id);
      if (kat && p.kat.indexOf(kat) === -1) return false;
      var s2 = shopAenderungen.hasOwnProperty(p.id) ? shopAenderungen[p.id] : daten.shop[p.id];
      if (nur === "mit" && !e && !s2) return false;
      if (nur === "ohne" && (e || s2)) return false;
      return !q || (p.name + " " + p.marke).toLowerCase().indexOf(q) !== -1;
    });
    var sichtbar = liste.slice(0, preisZeige);
    $("preisTabelle").innerHTML = '<thead><tr><th></th><th>Produkt</th><th class="num">🛒 Shop-Preis brutto (€)</th><th class="num">🏪 Händler netto/Stück (€)</th><th class="num">VE (Stück)</th><th class="num">Mindest-VE</th><th>MwSt</th><th>Händler aktiv</th></tr></thead><tbody>' +
      sichtbar.map(function (p) {
        var e = preisEintrag(p.id) || {};
        var geaendert = preisAenderungen.hasOwnProperty(p.id) ? " geaendert" : "";
        var sp = shopAenderungen.hasOwnProperty(p.id) ? shopAenderungen[p.id] : daten.shop[p.id];
        var spGeaendert = shopAenderungen.hasOwnProperty(p.id) ? " geaendert" : "";
        var mw = e.mwst != null ? e.mwst : sp && sp.mwst != null ? sp.mwst : ZB.mwstVorschlag(p);
        return '<tr data-id="' + esc(p.id) + '"><td>' + (p.bild ? '<img class="klein-bild" src="/' + esc(p.bild) + '" alt="" loading="lazy">' : "") + "</td>" +
          "<td><strong>" + esc(p.name) + "</strong><br><small>" + esc(p.marke) + (p.aus ? " · beim Großhändler nicht lieferbar" : "") + "</small></td>" +
          '<td class="num"><input class="js-sp' + spGeaendert + '" inputmode="decimal" value="' + ZB.centFeld(sp ? sp.preis : null) + '" placeholder="Preis folgt"></td>' +
          '<td class="num"><input class="js-p' + geaendert + '" inputmode="decimal" value="' + ZB.centFeld(e.preis) + '" placeholder="–"></td>' +
          '<td class="num"><input class="js-ve' + geaendert + '" type="number" min="1" value="' + (e.ve || "") + '" placeholder="1"></td>' +
          '<td class="num"><input class="js-min' + geaendert + '" type="number" min="1" value="' + (e.mindest || "") + '" placeholder="1"></td>' +
          '<td><select class="js-mw">' + [19, 7, 0].map(function (s) { return '<option value="' + s + '"' + (s === mw ? " selected" : "") + ">" + s + " %</option>"; }).join("") + "</select></td>" +
          '<td><input class="js-aktiv" type="checkbox"' + (e.aktiv !== false ? " checked" : "") + "></td></tr>";
      }).join("") + "</tbody>";
    $("preisMehr").hidden = liste.length <= preisZeige;
    $("preisMehr").textContent = "Mehr anzeigen (" + (liste.length - sichtbar.length) + " weitere)";
    knopfZaehler();
  }
  function knopfZaehler() {
    var n = Object.keys(preisAenderungen).length + Object.keys(shopAenderungen).length;
    $("preiseSpeichern").disabled = !n;
    $("preiseSpeichern").textContent = n ? "Änderungen speichern (" + n + ")" : "Änderungen speichern";
  }
  ["preisSuche", "preisKat", "preisNur"].forEach(function (id) {
    $(id).addEventListener(id === "preisSuche" ? "input" : "change", function () { preisZeige = 50; preise(); });
  });
  $("preisMehr").addEventListener("click", function () { preisZeige += 50; preise(); });
  $("preisTabelle").addEventListener("change", function (e) {
    var tr = e.target.closest("tr[data-id]");
    if (!tr) return;
    var id = tr.getAttribute("data-id"), p = ZB.produkte[id] || { name: (daten.preise[id] || {}).name || id, marke: "" };
    var mwst = parseInt(tr.querySelector(".js-mw").value, 10);
    // Shop-Preis (brutto)
    var sroh = tr.querySelector(".js-sp").value.trim();
    if (e.target.classList.contains("js-sp") || e.target.classList.contains("js-mw")) {
      if (!sroh) { if (daten.shop[id]) shopAenderungen[id] = null; else delete shopAenderungen[id]; }
      else {
        var sc = ZB.cent(sroh);
        if (isNaN(sc) || sc <= 0) { ZB.meldung("Ungültiger Shop-Preis bei " + p.name, "fehler"); return; }
        shopAenderungen[id] = { preis: sc, mwst: mwst };
      }
      tr.querySelector(".js-sp").classList.add("geaendert");
    }
    if (e.target.classList.contains("js-sp")) return knopfZaehler();
    var roh = tr.querySelector(".js-p").value.trim();
    if (!roh) {
      // Preis leer = Produkt für Händler entfernen (nur wenn es vorher einen Preis gab)
      if (daten.preise[id]) preisAenderungen[id] = null; else delete preisAenderungen[id];
    } else {
      var c = ZB.cent(roh);
      if (isNaN(c) || c < 0) { ZB.meldung("Ungültiger Preis bei " + p.name, "fehler"); return; }
      preisAenderungen[id] = {
        name: p.name, marke: p.marke || "", preis: c,
        ve: Math.max(1, parseInt(tr.querySelector(".js-ve").value, 10) || 1),
        mindest: Math.max(1, parseInt(tr.querySelector(".js-min").value, 10) || 1),
        mwst: parseInt(tr.querySelector(".js-mw").value, 10), aktiv: tr.querySelector(".js-aktiv").checked,
      };
    }
    tr.querySelectorAll(".js-p, .js-ve, .js-min").forEach(function (i) { i.classList.add("geaendert"); });
    knopfZaehler();
  });
  $("preiseSpeichern").addEventListener("click", async function () {
    try {
      if (Object.keys(preisAenderungen).length) {
        var r = await ZB.api("POST", "/admin/preise", { aenderungen: preisAenderungen });
        daten.preise = r.preise; preisAenderungen = {};
      }
      if (Object.keys(shopAenderungen).length) {
        var r2 = await ZB.api("POST", "/admin/shoppreise", { aenderungen: shopAenderungen });
        daten.shop = r2.shop; shopAenderungen = {};
      }
      preise(); ZB.meldung("Preise gespeichert.");
    } catch (err) { ZB.meldung(err.message, "fehler"); }
  });
  window.addEventListener("beforeunload", function (e) { if (Object.keys(preisAenderungen).length + Object.keys(shopAenderungen).length || paketGeaendert) { e.preventDefault(); e.returnValue = ""; } });

  /* ================= Pakete ================= */
  var paketListe = null, paketGeaendert = false;
  var FARBEN = { pink: "Pink", rot: "Rot", gold: "Gold", orange: "Orange", gruen: "Grün", blue: "Blau", violet: "Lila", dark: "Dunkel" };
  async function paketeLaden() {
    if (paketListe) return paketeZeichnen();
    try { paketListe = (await ZB.api("GET", "/admin/pakete")).pakete; paketeZeichnen(); }
    catch (err) { ZB.meldung(err.message, "fehler"); }
  }
  function paketeZeichnen() {
    $("paketEditor").innerHTML = paketListe.map(function (pk, i) {
      var inhalt = pk.inhalt.map(function (it, j) {
        var p = ZB.produkte[it.id] || { name: it.id + " (nicht im Sortiment!)", marke: "" };
        return "<tr><td>" + (p.bild ? '<img class="klein-bild" src="/' + esc(p.bild) + '" alt="">' : "") + "</td><td>" + esc(p.name) + (p.aus ? ' <span class="status status--storniert">nicht lieferbar</span>' : "") + (p.ab18 ? " 🔞" : "") +
          '</td><td class="num" style="width:90px"><input type="number" min="1" max="99" value="' + it.menge + '" data-menge="' + i + ":" + j + '"></td><td><button class="btn btn--light btn--klein" type="button" data-inhalt-weg="' + i + ":" + j + '">✕</button></td></tr>';
      }).join("");
      return '<div class="karte" data-paket="' + i + '"><div class="form form--4">' +
        '<label class="feld">Name<input data-feld="name" value="' + esc(pk.name) + '"></label>' +
        '<label class="feld" style="grid-column:span 2">Untertitel<input data-feld="untertitel" value="' + esc(pk.untertitel) + '"></label>' +
        '<label class="feld">Emoji<input data-feld="emoji" value="' + esc(pk.emoji) + '" maxlength="8"></label>' +
        '<label class="feld">Farbe<select data-feld="farbe">' + Object.keys(FARBEN).map(function (f) { return '<option value="' + f + '"' + (f === pk.farbe ? " selected" : "") + ">" + FARBEN[f] + "</option>"; }).join("") + "</select></label>" +
        '<label class="feld">Preis brutto (€) <small>leer = Preis folgt</small><input data-feld="preis" inputmode="decimal" value="' + (pk._preisRoh !== undefined ? esc(pk._preisRoh) : ZB.centFeld(pk.preis)) + '" placeholder="Preis folgt"></label>' +
        '<label class="feld">MwSt<select data-feld="mwst">' + [19, 7, 0].map(function (m) { return '<option value="' + m + '"' + (m === pk.mwst ? " selected" : "") + ">" + m + " %</option>"; }).join("") + "</select></label>" +
        '<label class="check-zeile" style="align-self:end"><input type="checkbox" data-feld="aktiv"' + (pk.aktiv ? " checked" : "") + "><span>Im Shop zeigen</span></label>" +
        '<div class="voll"><div class="tabelle-wrap"><table class="tabelle"><thead><tr><th></th><th>Inhalt</th><th class="num">Menge</th><th></th></tr></thead><tbody>' + inhalt + "</tbody></table></div></div>" +
        '<label class="feld" style="grid-column:span 3">Produkt hinzufügen<input list="produktListe" data-neu="' + i + '" placeholder="Produkt suchen"></label>' +
        '<div class="feld" style="align-self:end"><button class="btn btn--gold btn--klein" type="button" data-hinzu="' + i + '">+ Hinzufügen</button></div>' +
        '<div class="voll" style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap"><small>Kennung: ' + esc(pk.id) + ' · <a href="/paket.html?id=' + encodeURIComponent(pk.id) + '" target="_blank">Im Shop ansehen</a></small>' +
        '<button class="btn btn--rot btn--klein" type="button" data-paket-weg="' + i + '">Paket löschen</button></div>' +
      "</div></div>";
    }).join("") || '<p class="leer">Noch keine Pakete.</p>';
    $("paketeSpeichern").textContent = paketGeaendert ? "Alle Pakete speichern (ungespeichert!)" : "Alle Pakete speichern";
  }
  function paketGeaendertSetzen() { paketGeaendert = true; $("paketeSpeichern").textContent = "Alle Pakete speichern (ungespeichert!)"; }
  function paketFeld(e) {
    var box = e.target.closest("[data-paket]"); if (!box) return;
    var pk = paketListe[+box.getAttribute("data-paket")], f = e.target.getAttribute("data-feld");
    if (f === "aktiv") pk.aktiv = e.target.checked;
    else if (f === "mwst") pk.mwst = parseInt(e.target.value, 10);
    else if (f === "preis") pk._preisRoh = e.target.value;
    else if (f) pk[f] = e.target.value;
    var mg = e.target.getAttribute("data-menge");
    if (mg) { var t = mg.split(":"); paketListe[+t[0]].inhalt[+t[1]].menge = Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 1)); }
    if (f || mg) paketGeaendertSetzen();
  }
  $("paketEditor").addEventListener("input", paketFeld);
  $("paketEditor").addEventListener("change", paketFeld);
  $("paketEditor").addEventListener("click", function (e) {
    var b;
    if ((b = e.target.closest("[data-inhalt-weg]"))) { var t = b.getAttribute("data-inhalt-weg").split(":"); paketListe[+t[0]].inhalt.splice(+t[1], 1); paketGeaendertSetzen(); return paketeZeichnen(); }
    if ((b = e.target.closest("[data-hinzu]"))) {
      var i = +b.getAttribute("data-hinzu"), feld = document.querySelector('[data-neu="' + i + '"]');
      var id = nameZuId[(feld.value || "").toLowerCase()];
      if (!id) return ZB.meldung("Bitte ein Produkt aus der Liste wählen.", "fehler");
      var vorh = paketListe[i].inhalt.find(function (x) { return x.id === id; });
      if (vorh) vorh.menge++; else paketListe[i].inhalt.push({ id: id, menge: 1 });
      paketGeaendertSetzen(); return paketeZeichnen();
    }
    if ((b = e.target.closest("[data-paket-weg]"))) {
      var n = +b.getAttribute("data-paket-weg");
      if (!confirm("Paket „" + paketListe[n].name + "“ wirklich löschen?")) return;
      paketListe.splice(n, 1); paketGeaendertSetzen(); return paketeZeichnen();
    }
  });
  $("paketNeu").addEventListener("click", async function () {
    if (!paketListe) await paketeLaden();
    paketListe.unshift({ id: "paket-" + Date.now().toString(36), name: "Neues Paket", untertitel: "", emoji: "🎁", farbe: "pink", inhalt: [], preis: null, mwst: 19, aktiv: false });
    paketGeaendertSetzen(); paketeZeichnen();
  });
  $("paketeSpeichern").addEventListener("click", async function () {
    try {
      var daten = paketListe.map(function (pk) {
        var preis = pk.preis;
        if (pk._preisRoh !== undefined) {
          preis = pk._preisRoh.trim() ? ZB.cent(pk._preisRoh) : null;
          if (preis !== null && (isNaN(preis) || preis <= 0)) throw new Error("Ungültiger Preis bei " + pk.name);
        }
        return { id: pk.id, name: pk.name, untertitel: pk.untertitel, emoji: pk.emoji, farbe: pk.farbe, inhalt: pk.inhalt, preis: preis, mwst: pk.mwst, aktiv: pk.aktiv };
      });
      var r = await ZB.api("POST", "/admin/pakete", { pakete: daten });
      paketListe = r.pakete; paketGeaendert = false; paketeZeichnen(); ZB.meldung("Pakete gespeichert.");
    } catch (err) { ZB.meldung(err.message, "fehler"); }
  });

  /* ================= Shop-Einstellungen ================= */
  function einstellungenZeigen() {
    var f = $("einstForm"), e = daten.einstellungen || {};
    f.versand.value = ZB.centFeld(e.versand); f.versandfreiAb.value = ZB.centFeld(e.versandfreiAb);
    f.abholung.checked = !!e.abholung; f.abholort.value = e.abholort || "";
    f.bankInhaber.value = e.bankInhaber || ""; f.bankIban.value = e.bankIban || ""; f.bankName.value = e.bankName || "";
    f.paypal.value = e.paypal || ""; f.hinweis.value = e.hinweis || ""; f.ohnePreisAusblenden.checked = !!e.ohnePreisAusblenden;
  }
  $("einstForm").addEventListener("submit", async function (ev) {
    ev.preventDefault();
    var f = ev.target;
    var versand = f.versand.value.trim() ? ZB.cent(f.versand.value) : 0, frei = f.versandfreiAb.value.trim() ? ZB.cent(f.versandfreiAb.value) : 0;
    if (isNaN(versand) || isNaN(frei) || versand < 0 || frei < 0) return ZB.meldung("Bitte gültige Beträge eingeben, z. B. 5,90.", "fehler");
    try {
      var r = await ZB.api("POST", "/admin/einstellungen", {
        versand: versand, versandfreiAb: frei, abholung: f.abholung.checked, abholort: f.abholort.value,
        bankInhaber: f.bankInhaber.value, bankIban: f.bankIban.value, bankName: f.bankName.value,
        paypal: f.paypal.value, hinweis: f.hinweis.value, ohnePreisAusblenden: f.ohnePreisAusblenden.checked,
      });
      daten.einstellungen = r.einstellungen; ZB.meldung("Einstellungen gespeichert.");
    } catch (err) { ZB.meldung(err.message, "fehler"); }
  });

  /* ================= Buchhaltung ================= */
  var nameZuId = {};
  function produktListeFuellen() {
    if (typeof PRODUKTE === "undefined") return;
    $("produktListe").innerHTML = PRODUKTE.map(function (p) { nameZuId[p.name.toLowerCase()] = p.id; return '<option value="' + esc(p.name) + '">' + esc(p.marke) + "</option>"; }).join("");
  }
  var form = $("buchungForm");
  function gesamt() {
    var c = ZB.cent(form.einzelpreis.value), m = parseInt(form.menge.value, 10) || 0;
    $("buchungGesamt").textContent = isNaN(c) ? "–" : euro(c * m);
  }
  form.addEventListener("input", function (e) {
    if (e.target.name === "name") {
      var id = nameZuId[form.name.value.toLowerCase()];
      var p = id && ZB.produkte[id];
      $("produktTreffer").textContent = p ? "✓ Produkt aus dem Sortiment (" + p.marke + ")" : "Freie Bezeichnung";
      if (p) form.mwst.value = String(ZB.mwstVorschlag(p));
    }
    gesamt();
  });
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var c = ZB.cent(form.einzelpreis.value);
    if (isNaN(c) || c < 0) return ZB.meldung("Bitte einen gültigen Preis eingeben, z. B. 2,49.", "fehler");
    var knopf = form.querySelector("button[type=submit]"); knopf.disabled = true;
    try {
      var r = await ZB.api("POST", "/admin/buchungen", {
        typ: form.typ.value, datum: form.datum.value, name: form.name.value, produktId: nameZuId[form.name.value.toLowerCase()] || "",
        menge: parseInt(form.menge.value, 10), einzelpreis: c, mwst: parseInt(form.mwst.value, 10),
        zahlungsart: form.zahlungsart.value, beleg: form.beleg.value, notiz: form.notiz.value,
      });
      if (r.buchung.datum.slice(0, 4) === $("jahr").value) daten.buchungen.push(r.buchung);
      daten.alleBuchungen = null;
      form.name.value = ""; form.einzelpreis.value = ""; form.menge.value = "1"; form.beleg.value = ""; form.notiz.value = "";
      $("produktTreffer").textContent = ""; gesamt(); journal();
      ZB.meldung(TYP_TEXT[r.buchung.typ] + " über " + euro(r.buchung.betrag) + " gespeichert.");
    } catch (err) { ZB.meldung(err.message, "fehler"); }
    knopf.disabled = false;
  });

  function journalListe() {
    var monat = $("journalMonat").value, typ = $("journalTyp").value, q = $("journalSuche").value.toLowerCase().trim();
    return daten.buchungen.filter(function (b) {
      if (monat && b.datum.slice(5, 7) !== monat) return false;
      if (typ && b.typ !== typ) return false;
      return !q || (b.name + " " + b.beleg + " " + b.notiz + " " + b.id).toLowerCase().indexOf(q) !== -1;
    }).sort(function (a, b) { return (b.datum + b.erfasstAm).localeCompare(a.datum + a.erfasstAm); });
  }
  function journal() {
    monatsAuswahl($("journalMonat"), true);
    var storniert = {};
    daten.buchungen.forEach(function (b) { if (b.typ === "storno") storniert[b.bezug] = b; });
    var liste = journalListe();
    $("journalTabelle").innerHTML = '<thead><tr><th>Datum</th><th>Art</th><th>Bezeichnung</th><th class="num">Menge</th><th class="num">Einzel brutto</th><th class="num">Betrag brutto</th><th class="num">MwSt</th><th>Zahlung</th><th>Beleg</th><th>Erfasst</th><th></th></tr></thead><tbody>' +
      (liste.length ? liste.map(function (b) {
        var cls = b.typ === "storno" ? "storno-zeile" : storniert[b.id] ? "ist-storno" : "";
        var aktion = b.typ !== "storno" && !storniert[b.id] ? '<button class="btn btn--light btn--klein" data-storno="' + esc(b.id) + '" data-jahr="' + esc(b.datum.slice(0, 4)) + '">Storno</button>' : "";
        return '<tr class="' + cls + '"><td>' + ZB.datumDE(b.datum) + '</td><td><span class="typ typ--' + b.typ + '">' + TYP_TEXT[b.typ] + "</span></td><td>" + esc(b.name) +
          (b.notiz ? "<br><small>" + esc(b.notiz) + "</small>" : "") + (b.bezug ? "<br><small>zu " + esc(b.bezug) + "</small>" : "") +
          '</td><td class="num">' + ZB.zahl(b.menge) + '</td><td class="num">' + euro(b.einzelpreis) + '</td><td class="num">' + euro(b.betrag) + '</td><td class="num">' + b.mwst + " %</td><td>" + esc(b.zahlungsart) +
          "</td><td>" + esc(b.beleg) + "</td><td><small>" + esc(b.erfasstVon) + "<br>" + ZB.zeitDE(b.erfasstAm) + "</small></td><td>" + aktion + "</td></tr>";
      }).join("") : '<tr><td colspan="11" class="leer">Keine Buchungen im gewählten Zeitraum.</td></tr>') + "</tbody>";
  }
  ["journalMonat", "journalTyp"].forEach(function (id) { $(id).addEventListener("change", journal); });
  $("journalSuche").addEventListener("input", journal);
  $("journalTabelle").addEventListener("click", async function (e) {
    var b = e.target.closest("button[data-storno]");
    if (!b) return;
    var grund = prompt("Grund für das Storno (Pflicht):");
    if (!grund) return;
    try {
      var r = await ZB.api("POST", "/admin/buchungen/storno", { id: b.getAttribute("data-storno"), jahr: b.getAttribute("data-jahr"), grund: grund });
      if (r.buchung.datum.slice(0, 4) === $("jahr").value) daten.buchungen.push(r.buchung);
      daten.alleBuchungen = null;
      journal(); ZB.meldung("Buchung storniert.");
    } catch (err) { ZB.meldung(err.message, "fehler"); }
  });
  $("journalExport").addEventListener("click", function () {
    var zeilen = [["Buchungs-ID", "Datum", "Art", "Bezeichnung", "Produkt-ID", "Menge", "Einzelpreis brutto", "Betrag brutto", "MwSt-Satz", "Betrag netto", "MwSt-Betrag", "Zahlungsart", "Beleg", "Notiz", "Bezug (Storno)", "Erfasst von", "Erfasst am"]];
    journalListe().forEach(function (b) {
      var n = netto(b);
      zeilen.push([b.id, ZB.datumDE(b.datum), TYP_TEXT[b.typ], b.name, b.produktId, b.menge, ZB.centCsv(b.einzelpreis), ZB.centCsv(b.betrag), b.mwst + " %", ZB.centCsv(n), ZB.centCsv(b.betrag - n), b.zahlungsart, b.beleg, b.notiz, b.bezug || "", b.erfasstVon, ZB.zeitDE(b.erfasstAm)]);
    });
    ZB.csv(zeilen, "zukkabro-journal-" + $("jahr").value + ($("journalMonat").value ? "-" + $("journalMonat").value : "") + ".csv");
  });

  /* ================= Bestand & Verkäufe ================= */
  async function bestand() {
    if (!daten.alleBuchungen) {
      $("bestandTabelle").innerHTML = '<tbody><tr><td class="leer">Lade alle Buchungen …</td></tr></tbody>';
      try { daten.alleBuchungen = (await ZB.api("GET", "/admin/buchungen?jahr=alle")).buchungen; }
      catch (err) { return ZB.meldung(err.message, "fehler"); }
    }
    var map = {};
    wirksam(daten.alleBuchungen).forEach(function (b) {
      if (b.typ !== "einkauf" && b.typ !== "verkauf") return;
      var key = b.produktId || "frei:" + b.name.toLowerCase();
      var e = map[key] || (map[key] = { id: b.produktId, name: b.name, gekauft: 0, verkauft: 0, einkauf: 0, umsatz: 0 });
      if (b.typ === "einkauf") { e.gekauft += b.menge; e.einkauf += b.betrag; }
      else { e.verkauft += b.menge; e.umsatz += b.betrag; }
    });
    var liste = Object.keys(map).map(function (k) { var e = map[k]; e.bestand = e.gekauft - e.verkauft; return e; });
    var q = $("bestandSuche").value.toLowerCase().trim();
    if (q) liste = liste.filter(function (e) { return e.name.toLowerCase().indexOf(q) !== -1; });
    var sort = $("bestandSort").value;
    liste.sort(function (a, b) {
      if (sort === "umsatz") return b.umsatz - a.umsatz;
      if (sort === "bestand") return a.bestand - b.bestand;
      if (sort === "name") return a.name.localeCompare(b.name, "de");
      return b.verkauft - a.verkauft;
    });
    window.__zbBestand = liste;
    var t = liste.reduce(function (s, e) { s.g += e.gekauft; s.v += e.verkauft; s.e += e.einkauf; s.u += e.umsatz; return s; }, { g: 0, v: 0, e: 0, u: 0 });
    $("bestandTabelle").innerHTML = '<thead><tr><th>Produkt</th><th class="num">Eingekauft</th><th class="num">Verkauft</th><th class="num">Bestand</th><th class="num">Einkauf brutto</th><th class="num">Umsatz brutto</th></tr></thead><tbody>' +
      (liste.length ? liste.map(function (e) {
        return "<tr><td>" + esc(e.name) + (e.id ? "<br><small>" + esc(e.id) + "</small>" : "") + '</td><td class="num">' + ZB.zahl(e.gekauft) + '</td><td class="num">' + ZB.zahl(e.verkauft) +
          '</td><td class="num"><strong class="' + (e.bestand < 0 ? "negativ" : "") + '">' + ZB.zahl(e.bestand) + '</strong></td><td class="num">' + euro(e.einkauf) + '</td><td class="num">' + euro(e.umsatz) + "</td></tr>";
      }).join("") : '<tr><td colspan="6" class="leer">Noch keine Ein- oder Verkäufe gebucht.</td></tr>') +
      '</tbody><tfoot><tr><td>Summe</td><td class="num">' + ZB.zahl(t.g) + '</td><td class="num">' + ZB.zahl(t.v) + '</td><td class="num">' + ZB.zahl(t.g - t.v) + '</td><td class="num">' + euro(t.e) + '</td><td class="num">' + euro(t.u) + "</td></tr></tfoot>";
  }
  $("bestandSuche").addEventListener("input", bestand);
  $("bestandSort").addEventListener("change", bestand);
  $("bestandExport").addEventListener("click", function () {
    var zeilen = [["Produkt", "Produkt-ID", "Eingekauft (Stück)", "Verkauft (Stück)", "Bestand (Stück)", "Einkauf brutto", "Umsatz brutto"]];
    (window.__zbBestand || []).forEach(function (e) { zeilen.push([e.name, e.id || "", e.gekauft, e.verkauft, e.bestand, ZB.centCsv(e.einkauf), ZB.centCsv(e.umsatz)]); });
    ZB.csv(zeilen, "zukkabro-bestand-" + ZB.heute() + ".csv");
  });

  /* ================= Protokoll ================= */
  async function protokoll() {
    try {
      var r = await ZB.api("GET", "/admin/protokoll?monat=" + $("protokollMonat").value);
      var namen = { "admin-login": "Admin angemeldet", "admin-login-fehlgeschlagen": "Admin-Login fehlgeschlagen", "haendler-login": "Händler angemeldet", "haendler-registriert": "Händler registriert", "haendler-status": "Händlerstatus geändert", "bestellung-neu": "Neue Händlerbestellung", "kundenbestellung-neu": "Neue Kundenbestellung", "preisanfrage-neu": "Neue Preisanfrage", "preise-geaendert": "Händlerpreise geändert", "shoppreise-geaendert": "Shop-Preise geändert", "einstellungen-geaendert": "Shop-Einstellungen geändert", "pakete-geaendert": "Pakete geändert" };
      $("protokollTabelle").innerHTML = "<thead><tr><th>Zeit</th><th>Ereignis</th><th>Wer</th><th>Details</th></tr></thead><tbody>" +
        (r.protokoll.length ? r.protokoll.map(function (p) {
          var d = Object.keys(p).filter(function (k) { return ["am", "ereignis", "von"].indexOf(k) === -1; }).map(function (k) { return k + ": " + p[k]; }).join(", ");
          return "<tr><td>" + ZB.zeitDE(p.am) + "</td><td>" + esc(namen[p.ereignis] || p.ereignis) + "</td><td>" + esc(p.von) + "</td><td><small>" + esc(d) + "</small></td></tr>";
        }).join("") : '<tr><td colspan="4" class="leer">Keine Einträge.</td></tr>') + "</tbody>";
    } catch (err) { ZB.meldung(err.message, "fehler"); }
  }
  $("protokollMonat").addEventListener("change", protokoll);

  start();
})();
