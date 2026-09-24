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

  var daten = { buchungen: [], alleBuchungen: null, bestellungen: [], haendler: [], preise: {} };
  var preisAenderungen = {};
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
      daten.haendler = r[2].haendler; daten.preise = r[3].preise; daten.alleBuchungen = null;
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
    var neu = daten.bestellungen.filter(function (b) { return b.status === "neu"; }).length;
    var offen = daten.haendler.filter(function (h) { return h.status === "offen"; }).length;
    $("zahlBestellungen").textContent = neu; $("zahlBestellungen").hidden = !neu;
    $("zahlHaendler").textContent = offen; $("zahlHaendler").hidden = !offen;
  }

  function zeichneTab(id) {
    if (id === "uebersicht") uebersicht();
    if (id === "bestellungen") bestellungen();
    if (id === "haendler") haendler();
    if (id === "preise") preise();
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
  function bestellungen() {
    var filter = $("bestellFilter").value;
    var liste = daten.bestellungen.filter(function (b) { return !filter || b.status === filter; });
    if (!liste.length) { $("bestellListe").innerHTML = '<p class="leer">Keine Bestellungen.</p>'; return; }
    $("bestellListe").innerHTML = liste.map(function (b) {
      var pos = b.positionen.map(function (p) {
        return "<tr><td>" + esc(p.name) + '<br><small>' + esc(p.produktId) + '</small></td><td class="num">' + p.anzahlVE + " × " + p.ve + '</td><td class="num">' + ZB.zahl(p.stueck) +
          '</td><td class="num">' + euro(p.preis) + '</td><td class="num">' + p.mwst + ' %</td><td class="num">' + euro(p.netto) + "</td></tr>";
      }).join("");
      var optionen = ["neu", "bestaetigt", "versendet", "bezahlt", "abgeschlossen", "storniert"].map(function (s) {
        return '<option value="' + s + '"' + (s === b.status ? " selected" : "") + ">" + STATUS_TEXT[s] + "</option>";
      }).join("");
      var haendler = daten.haendler.find(function (h) { return h.id === b.haendlerId; }) || {};
      return '<details class="bestellung" data-id="' + esc(b.id) + '"><summary><span>' + esc(b.id) + " · " + esc(b.firma) + "<br><small>" + ZB.zeitDE(b.erstellt) + "</small></span>" +
        '<span class="status status--' + b.status + '">' + STATUS_TEXT[b.status] + (b.gebucht ? " · gebucht" : "") + '</span><span class="summe">' + euro(b.brutto) + "</span></summary>" +
        '<div class="bestellung__inhalt">' +
          '<div class="tabelle-wrap"><table class="tabelle"><thead><tr><th>Produkt</th><th class="num">VE × Stück</th><th class="num">Stück</th><th class="num">Preis netto</th><th class="num">MwSt</th><th class="num">Summe netto</th></tr></thead><tbody>' + pos +
          '</tbody><tfoot><tr><td colspan="5">Netto</td><td class="num">' + euro(b.netto) + '</td></tr><tr><td colspan="5">MwSt</td><td class="num">' + euro(b.mwst) + '</td></tr><tr><td colspan="5">Gesamt brutto</td><td class="num">' + euro(b.brutto) + "</td></tr></tfoot></table></div>" +
          (b.notiz ? '<p class="hinweis"><strong>Notiz vom Händler:</strong> ' + esc(b.notiz) + "</p>" : "") +
          "<p><strong>Lieferadresse:</strong> " + esc([haendler.firma, haendler.ansprechpartner, haendler.strasse, (haendler.plz || "") + " " + (haendler.ort || "")].filter(Boolean).join(", ")) +
          (haendler.email ? " · " + esc(haendler.email) : "") + (haendler.telefon ? " · " + esc(haendler.telefon) : "") + "</p>" +
          '<div class="leiste" style="margin:0">' +
            '<label class="feld">Status<select class="js-status">' + optionen + "</select></label>" +
            '<button class="btn btn--pink btn--klein js-status-speichern" type="button">Status speichern</button>' +
            '<button class="btn btn--gruen btn--klein js-buchen" type="button"' + (b.gebucht || b.status === "storniert" ? " disabled" : "") + ">" + (b.gebucht ? "✓ In Buchhaltung" : "In Buchhaltung übernehmen") + "</button>" +
            '<button class="btn btn--light btn--klein js-drucken" type="button">🖨 Drucken</button>' +
          "</div>" +
          '<small>Verlauf: ' + b.verlauf.map(function (v) { return STATUS_TEXT[v.status] + " (" + esc(v.von) + ", " + ZB.zeitDE(v.am) + ")"; }).join(" → ") + "</small>" +
        "</div></details>";
    }).join("");
  }
  $("bestellFilter").addEventListener("change", bestellungen);
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
      if (nur === "mit" && !e) return false;
      if (nur === "ohne" && e) return false;
      return !q || (p.name + " " + p.marke).toLowerCase().indexOf(q) !== -1;
    });
    var sichtbar = liste.slice(0, preisZeige);
    $("preisTabelle").innerHTML = '<thead><tr><th></th><th>Produkt</th><th class="num">Preis netto/Stück (€)</th><th class="num">VE (Stück)</th><th class="num">Mindest-VE</th><th>MwSt</th><th>Aktiv</th></tr></thead><tbody>' +
      sichtbar.map(function (p) {
        var e = preisEintrag(p.id) || {};
        var geaendert = preisAenderungen.hasOwnProperty(p.id) ? " geaendert" : "";
        var mw = e.mwst != null ? e.mwst : ZB.mwstVorschlag(p);
        return '<tr data-id="' + esc(p.id) + '"><td>' + (p.bild ? '<img class="klein-bild" src="/' + esc(p.bild) + '" alt="" loading="lazy">' : "") + "</td>" +
          "<td><strong>" + esc(p.name) + "</strong><br><small>" + esc(p.marke) + (p.aus ? " · beim Großhändler nicht lieferbar" : "") + "</small></td>" +
          '<td class="num"><input class="js-p' + geaendert + '" inputmode="decimal" value="' + ZB.centFeld(e.preis) + '" placeholder="–"></td>' +
          '<td class="num"><input class="js-ve' + geaendert + '" type="number" min="1" value="' + (e.ve || "") + '" placeholder="1"></td>' +
          '<td class="num"><input class="js-min' + geaendert + '" type="number" min="1" value="' + (e.mindest || "") + '" placeholder="1"></td>' +
          '<td><select class="js-mw">' + [19, 7, 0].map(function (s) { return '<option value="' + s + '"' + (s === mw ? " selected" : "") + ">" + s + " %</option>"; }).join("") + "</select></td>" +
          '<td><input class="js-aktiv" type="checkbox"' + (e.aktiv !== false ? " checked" : "") + "></td></tr>";
      }).join("") + "</tbody>";
    $("preisMehr").hidden = liste.length <= preisZeige;
    $("preisMehr").textContent = "Mehr anzeigen (" + (liste.length - sichtbar.length) + " weitere)";
    var n = Object.keys(preisAenderungen).length;
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
    tr.querySelectorAll("input").forEach(function (i) { if (i.type !== "checkbox") i.classList.add("geaendert"); });
    var n = Object.keys(preisAenderungen).length;
    $("preiseSpeichern").disabled = !n;
    $("preiseSpeichern").textContent = n ? "Änderungen speichern (" + n + ")" : "Änderungen speichern";
  });
  $("preiseSpeichern").addEventListener("click", async function () {
    try {
      var r = await ZB.api("POST", "/admin/preise", { aenderungen: preisAenderungen });
      daten.preise = r.preise; preisAenderungen = {};
      preise(); ZB.meldung("Händlerpreise gespeichert.");
    } catch (err) { ZB.meldung(err.message, "fehler"); }
  });
  window.addEventListener("beforeunload", function (e) { if (Object.keys(preisAenderungen).length) { e.preventDefault(); e.returnValue = ""; } });

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
      var namen = { "admin-login": "Admin angemeldet", "admin-login-fehlgeschlagen": "Admin-Login fehlgeschlagen", "haendler-login": "Händler angemeldet", "haendler-registriert": "Händler registriert", "haendler-status": "Händlerstatus geändert", "bestellung-neu": "Neue Bestellung", "preise-geaendert": "Händlerpreise geändert" };
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
