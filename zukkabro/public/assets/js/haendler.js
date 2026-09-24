/* =========================================================
   ZUKKABRO – Händlerportal
   Login, Registrierung, Bestellen in VE, eigene Bestellungen
   ========================================================= */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var esc = ZB.esc, euro = ZB.euro;
  var STATUS_TEXT = { neu: "Eingegangen", bestaetigt: "Bestätigt", versendet: "Versendet", bezahlt: "Bezahlt", abgeschlossen: "Abgeschlossen", storniert: "Storniert" };
  var preise = {}, korb = {}, haendlerId = "", zeige = 40;

  function korbKey() { return "zb_korb_" + haendlerId; }
  function korbLaden() { try { korb = JSON.parse(localStorage.getItem(korbKey()) || "{}") || {}; } catch (e) { korb = {}; } }
  function korbMerken() { try { localStorage.setItem(korbKey(), JSON.stringify(korb)); } catch (e) { /* egal */ } }

  /* ================= Start ================= */
  async function start() {
    try {
      var ich = await ZB.api("GET", "/ich");
      if (ich.angemeldet && ich.rolle === "haendler") return appStarten(ich);
    } catch (e) { /* Gast */ }
    $("gast").hidden = false;
    ZB.tabs($("gastReiter"));
  }

  $("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    var f = e.target, fehler = $("loginFehler");
    fehler.hidden = true;
    try {
      await ZB.api("POST", "/login", { rolle: "haendler", benutzer: f.benutzer.value, passwort: f.passwort.value });
      location.reload();
    } catch (err) { fehler.textContent = err.message; fehler.hidden = false; }
  });

  $("regForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    var f = e.target;
    $("regFehler").hidden = true; $("regOk").hidden = true;
    var daten = {};
    ["firma", "ansprechpartner", "telefon", "strasse", "plz", "ort", "ustId", "email", "passwort"].forEach(function (k) { daten[k] = f[k].value; });
    daten.gewerbe = f.gewerbe.checked; daten.datenschutz = f.datenschutz.checked;
    var knopf = f.querySelector("button[type=submit]"); knopf.disabled = true;
    try {
      var r = await ZB.api("POST", "/haendler/registrieren", daten);
      f.reset();
      $("regOk").textContent = r.meldung; $("regOk").hidden = false;
    } catch (err) { $("regFehler").textContent = err.message; $("regFehler").hidden = false; }
    knopf.disabled = false;
  });

  $("logout").addEventListener("click", async function () {
    try { await ZB.api("POST", "/logout", {}); } catch (e) { /* egal */ }
    location.reload();
  });

  /* ================= Angemeldet ================= */
  async function appStarten(ich) {
    haendlerId = ich.haendler.id;
    $("firma").textContent = ich.name;
    $("app").hidden = false;
    korbLaden();
    try { preise = (await ZB.api("GET", "/haendler/preise")).preise || {}; }
    catch (err) { ZB.meldung(err.message, "fehler"); }
    // Nicht mehr bestellbare Artikel aus dem Warenkorb entfernen
    Object.keys(korb).forEach(function (id) { if (!preise[id]) delete korb[id]; });
    var kats = {};
    Object.keys(preise).forEach(function (id) { var p = ZB.produkte[id]; if (p) p.kat.forEach(function (k) { kats[k] = true; }); });
    if (typeof KATEGORIEN !== "undefined") {
      $("kat").innerHTML += KATEGORIEN.filter(function (k) { return kats[k.id]; }).map(function (k) { return '<option value="' + esc(k.id) + '">' + esc(k.emoji + " " + k.name) + "</option>"; }).join("");
    }
    ZB.tabs($("reiter"), function (id) { if (id === "bestellungen") meineBestellungen(); });
    liste(); korbZeichnen();
  }

  function artikel() {
    return Object.keys(preise).map(function (id) {
      var p = ZB.produkte[id] || { id: id, name: preise[id].name, marke: preise[id].marke || "", kat: [] };
      return { id: id, p: p, preis: preise[id] };
    }).sort(function (a, b) { return a.p.name.localeCompare(b.p.name, "de"); });
  }

  function liste() {
    var q = $("suche").value.toLowerCase().trim(), kat = $("kat").value;
    var alle = artikel().filter(function (a) {
      if (kat && a.p.kat.indexOf(kat) === -1) return false;
      return !q || (a.p.name + " " + a.p.marke).toLowerCase().indexOf(q) !== -1;
    });
    if (!Object.keys(preise).length) {
      $("liste").innerHTML = '<p class="leer karte">Zurzeit sind noch keine Händlerpreise hinterlegt. Schau bald wieder vorbei oder melde dich bei uns.</p>';
      return;
    }
    var sichtbar = alle.slice(0, zeige);
    $("liste").innerHTML = sichtbar.length ? sichtbar.map(function (a) {
      var pr = a.preis, menge = korb[a.id] || 0;
      return '<div class="bestell-zeile" data-id="' + esc(a.id) + '">' +
        (a.p.bild ? '<img src="/' + esc(a.p.bild) + '" alt="" loading="lazy">' : '<span style="font-size:2.4rem;text-align:center">🍬</span>') +
        "<div><h3>" + esc(a.p.name) + "</h3><p>" + esc(a.p.marke) + (a.p.ab18 ? " · 18+" : "") + "</p>" +
        "<p><strong>" + euro(pr.preis) + "</strong> / Stück netto · VE " + pr.ve + " Stück = " + euro(pr.preis * pr.ve) + " · min. " + pr.mindest + " VE · " + pr.mwst + " % MwSt</p></div>" +
        '<div class="menge"><button type="button" data-schritt="-1" aria-label="Weniger">−</button>' +
        '<input type="number" min="0" step="1" value="' + menge + '" aria-label="Anzahl VE"><button type="button" data-schritt="1" aria-label="Mehr">+</button> <small>VE</small></div>' +
        "</div>";
    }).join("") : '<p class="leer">Nichts gefunden.</p>';
    $("mehr").hidden = alle.length <= zeige;
    $("mehr").textContent = "Mehr anzeigen (" + (alle.length - sichtbar.length) + " weitere)";
  }
  $("suche").addEventListener("input", function () { zeige = 40; liste(); });
  $("kat").addEventListener("change", function () { zeige = 40; liste(); });
  $("mehr").addEventListener("click", function () { zeige += 40; liste(); });

  function setzeMenge(id, n) {
    var pr = preise[id];
    if (!pr) return;
    n = Math.max(0, Math.min(10000, n | 0));
    if (n > 0 && n < pr.mindest) n = pr.mindest;
    if (n) korb[id] = n; else delete korb[id];
    korbMerken(); korbZeichnen();
    var zeile = document.querySelector('.bestell-zeile[data-id="' + id.replace(/"/g, "") + '"] input');
    if (zeile) zeile.value = n;
  }
  $("liste").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-schritt]");
    if (!b) return;
    var id = b.closest(".bestell-zeile").getAttribute("data-id");
    var alt = korb[id] || 0, schritt = parseInt(b.getAttribute("data-schritt"), 10);
    var pr = preise[id];
    var neu = alt + schritt;
    if (schritt > 0 && alt === 0) neu = pr.mindest;
    if (schritt < 0 && alt <= pr.mindest) neu = 0;
    setzeMenge(id, neu);
  });
  $("liste").addEventListener("change", function (e) {
    if (e.target.tagName !== "INPUT") return;
    setzeMenge(e.target.closest(".bestell-zeile").getAttribute("data-id"), parseInt(e.target.value, 10) || 0);
  });

  function korbZeichnen() {
    var ids = Object.keys(korb);
    var netto = 0, mwst = 0;
    var zeilen = ids.map(function (id) {
      var pr = preise[id], n = korb[id], stueck = n * pr.ve, summe = stueck * pr.preis;
      netto += summe; mwst += Math.round(summe * pr.mwst / 100);
      return '<div class="korb__zeile"><span>' + n + " VE × " + esc(pr.name) + " <small>(" + stueck + " Stk.)</small></span><strong>" + euro(summe) + "</strong></div>";
    }).join("");
    $("korb").innerHTML = ids.length
      ? zeilen + '<div class="korb__summe"><span>Netto</span><span>' + euro(netto) + '</span></div><div class="korb__summe"><span>MwSt</span><span>' + euro(mwst) +
        '</span></div><div class="korb__summe korb__summe--gross"><span>Gesamt</span><span>' + euro(netto + mwst) + "</span></div>"
      : '<p class="leer" style="padding:1rem 0">Noch leer. Wähle links die Anzahl Verpackungseinheiten.</p>';
    $("absenden").disabled = !ids.length;
  }

  $("absenden").addEventListener("click", async function () {
    var ids = Object.keys(korb);
    if (!ids.length) return;
    if (!confirm("Bestellung jetzt verbindlich absenden?")) return;
    var knopf = $("absenden"); knopf.disabled = true;
    try {
      var r = await ZB.api("POST", "/haendler/bestellungen", {
        positionen: ids.map(function (id) { return { produktId: id, anzahlVE: korb[id] }; }),
        notiz: $("notiz").value,
      });
      korb = {}; korbMerken(); $("notiz").value = "";
      liste(); korbZeichnen();
      ZB.meldung("Danke! Bestellung " + r.bestellung.id + " über " + euro(r.bestellung.brutto) + " ist eingegangen.");
      document.querySelector('#reiter [data-tab="bestellungen"]').click();
    } catch (err) { ZB.meldung(err.message, "fehler"); knopf.disabled = false; }
  });

  async function meineBestellungen() {
    $("meine").innerHTML = '<p class="leer">Lade …</p>';
    try {
      var r = await ZB.api("GET", "/haendler/bestellungen");
      $("meine").innerHTML = r.bestellungen.length ? r.bestellungen.map(function (b) {
        return '<details class="bestellung"><summary><span>' + esc(b.id) + "<br><small>" + ZB.zeitDE(b.erstellt) + '</small></span><span class="status status--' + b.status + '">' +
          STATUS_TEXT[b.status] + '</span><span class="summe">' + euro(b.brutto) + '</span></summary><div class="bestellung__inhalt"><div class="tabelle-wrap"><table class="tabelle"><thead><tr><th>Produkt</th><th class="num">VE</th><th class="num">Stück</th><th class="num">Preis netto</th><th class="num">Summe netto</th></tr></thead><tbody>' +
          b.positionen.map(function (p) { return "<tr><td>" + esc(p.name) + '</td><td class="num">' + p.anzahlVE + '</td><td class="num">' + p.stueck + '</td><td class="num">' + euro(p.preis) + '</td><td class="num">' + euro(p.netto) + "</td></tr>"; }).join("") +
          '</tbody><tfoot><tr><td colspan="4">Netto</td><td class="num">' + euro(b.netto) + '</td></tr><tr><td colspan="4">MwSt</td><td class="num">' + euro(b.mwst) + '</td></tr><tr><td colspan="4">Gesamt</td><td class="num">' + euro(b.brutto) + "</td></tr></tfoot></table></div>" +
          (b.notiz ? "<p><strong>Deine Notiz:</strong> " + esc(b.notiz) + "</p>" : "") + "</div></details>";
      }).join("") : '<p class="leer karte">Du hast noch keine Bestellungen.</p>';
    } catch (err) { ZB.meldung(err.message, "fehler"); }
  }

  start();
})();
