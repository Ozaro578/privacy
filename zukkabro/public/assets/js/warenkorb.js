/* =========================================================
   ZUKKABRO – Warenkorb und Kasse
   Preise, Versand und Summen berechnet am Ende immer der Server.
   ========================================================= */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var euro = function (c) { return window.ZBShop.euro(c); };
  var PROD = {};
  (typeof PRODUKTE !== "undefined" ? PRODUKTE : []).forEach(function (p) { PROD[p.id] = p; });
  var shop = null;
  var form = $("schrittKasse");

  /** Warenkorb in kaufbare und nicht kaufbare Artikel aufteilen */
  function positionen() {
    var k = window.ZBKorb.alle();
    return Object.keys(k).map(function (id) {
      if (id.indexOf("paket:") === 0) {
        var pk = (shop.pakete || []).find(function (x) { return x.id === id.slice(6); });
        if (!pk) return { id: id, p: null, menge: k[id], preis: undefined, kaufbar: false, link: "/pakete.html" };
        var erstes = pk.inhalt.map(function (i) { return PROD[i.id]; }).filter(function (x) { return x && x.bild; })[0];
        var anz = pk.inhalt.reduce(function (a, i) { return a + i.menge; }, 0);
        var pp = { name: "🎁 Paket: " + pk.name, marke: anz + " Produkte", bild: erstes ? erstes.bild : "", ab18: pk.ab18, aus: !pk.lieferbar };
        return { id: id, p: pp, menge: k[id], preis: pk.preis, kaufbar: pk.lieferbar && typeof pk.preis === "number", link: "/paket.html?id=" + encodeURIComponent(pk.id) };
      }
      var p = PROD[id], preis = shop.preise[id];
      return { id: id, p: p, menge: k[id], preis: preis, kaufbar: !!p && !p.aus && typeof preis === "number", link: "/produkt.html?id=" + encodeURIComponent(id) };
    });
  }
  function rechne(lieferart) {
    var pos = positionen().filter(function (x) { return x.kaufbar; });
    var waren = pos.reduce(function (a, x) { return a + x.menge * x.preis; }, 0);
    var v = shop.versand || {};
    var versand = lieferart === "abholung" || !pos.length ? 0 : (v.freiAb > 0 && waren >= v.freiAb ? 0 : v.kosten || 0);
    return { pos: pos, waren: waren, versand: versand, gesamt: waren + versand, ab18: pos.some(function (x) { return x.p.ab18; }) };
  }
  function summenHtml(r, mitArtikeln) {
    var v = shop.versand || {};
    var html = "";
    if (mitArtikeln) html += r.pos.map(function (x) { return '<div class="summe-zeile"><span>' + x.menge + " × " + esc(x.p.name) + "</span><span>" + euro(x.menge * x.preis) + "</span></div>"; }).join("");
    html += '<div class="summe-zeile"><span>Warenwert</span><span>' + euro(r.waren) + "</span></div>" +
      '<div class="summe-zeile"><span>Versand</span><span>' + (r.versand ? euro(r.versand) : "kostenlos") + "</span></div>";
    if (v.freiAb > 0 && r.versand && r.waren < v.freiAb) html += '<p class="hint hint--aus">Noch ' + euro(v.freiAb - r.waren) + " bis zum kostenlosen Versand!</p>";
    html += '<div class="summe-zeile summe-zeile--gross"><span>Gesamt</span><span>' + euro(r.gesamt) + "</span></div>";
    return html;
  }

  /* ================= Schritt 1: Warenkorb ================= */
  function korbZeichnen() {
    var alle = positionen();
    if (!alle.length) {
      $("korbListe").innerHTML = '<div class="karte leer">Dein Warenkorb ist noch leer. 🍬<br><br><a class="btn btn--pink" href="/sortiment.html">Zum Sortiment →</a></div>';
      $("summe1").innerHTML = summenHtml(rechne("versand"), false);
      $("zurKasse").disabled = true; $("korbHinweis").hidden = true;
      return;
    }
    $("korbListe").innerHTML = alle.map(function (x) {
      var p = x.p || { name: "Unbekannter Artikel", marke: "" };
      var bild = p.bild ? '<img src="/' + esc(p.bild) + '" alt="" loading="lazy">' : '<span style="font-size:2.6rem;text-align:center">🍬</span>';
      var info = !x.p ? "Nicht mehr im Sortiment" : p.aus ? "Gerade nicht lieferbar" : !x.kaufbar ? "Preis folgt – noch nicht bestellbar" : euro(x.preis) + " / Stück";
      return '<div class="korb-artikel" data-id="' + esc(x.id) + '">' + bild +
        '<div><h3><a href="' + x.link + '">' + esc(p.name) + "</a></h3><p>" + esc(p.marke || "") + (p.ab18 ? " · 18+" : "") + "</p><p" + (x.kaufbar ? "" : ' style="color:#b25400"') + ">" + info + "</p></div>" +
        '<div class="korb-artikel__rechts"><div class="stepper"><button type="button" data-schritt="-1" aria-label="Weniger">−</button><input type="number" min="1" max="999" value="' + x.menge + '" aria-label="Menge"><button type="button" data-schritt="1" aria-label="Mehr">+</button></div>' +
        (x.kaufbar ? "<strong>" + euro(x.menge * x.preis) + "</strong>" : "") +
        '<button class="linklike linklike--rot" type="button" data-weg>Entfernen</button></div></div>';
    }).join("");
    var r = rechne("versand");
    $("summe1").innerHTML = summenHtml(r, false);
    var nichtKaufbar = alle.filter(function (x) { return !x.kaufbar; }).length;
    $("korbHinweis").hidden = !nichtKaufbar;
    $("korbHinweis").textContent = nichtKaufbar ? nichtKaufbar + (nichtKaufbar === 1 ? " Artikel ist" : " Artikel sind") + " noch nicht bestellbar und wird bei der Bestellung nicht berücksichtigt." : "";
    $("zurKasse").disabled = !r.pos.length;
  }

  $("korbListe").addEventListener("click", function (e) {
    var zeile = e.target.closest(".korb-artikel");
    if (!zeile) return;
    var id = zeile.getAttribute("data-id");
    if (e.target.closest("[data-weg]")) { window.ZBKorb.setze(id, 0); return korbZeichnen(); }
    var b = e.target.closest("[data-schritt]");
    if (b) {
      var n = (window.ZBKorb.alle()[id] || 1) + parseInt(b.getAttribute("data-schritt"), 10);
      window.ZBKorb.setze(id, Math.max(1, n)); korbZeichnen();
    }
  });
  $("korbListe").addEventListener("change", function (e) {
    if (e.target.tagName !== "INPUT") return;
    window.ZBKorb.setze(e.target.closest(".korb-artikel").getAttribute("data-id"), Math.max(1, parseInt(e.target.value, 10) || 1));
    korbZeichnen();
  });

  /* ================= Schritt 2: Kasse ================= */
  function lieferart() { var el = form.querySelector("input[name=lieferart]:checked"); return el ? el.value : "versand"; }
  function kasseZeichnen() {
    var la = lieferart();
    var r = rechne(la);
    $("adresse").hidden = la !== "versand";
    $("alterBox").hidden = !r.ab18;
    $("zahlTitel").textContent = (r.ab18 ? "4" : "3") + ". Zahlung";
    // Zahlarten passend zur Lieferart
    var gewaehlt = (form.querySelector("input[name=zahlart]:checked") || {}).value;
    var arten = (shop.zahlarten || []).filter(function (z) { return z !== "Bar bei Abholung" || la === "abholung"; });
    var texte = { "Überweisung (Vorkasse)": "Du bekommst unsere Bankverbindung nach der Bestellung. Versand nach Zahlungseingang.", "PayPal": "Du bekommst unseren PayPal-Link nach der Bestellung.", "Bar bei Abholung": "Zahlung bei Abholung im Laden." };
    $("zahlarten").innerHTML = arten.map(function (z, i) {
      var an = z === gewaehlt || (!arten.some(function (a) { return a === gewaehlt; }) && i === 0);
      return '<label><input type="radio" name="zahlart" value="' + esc(z) + '"' + (an ? " checked" : "") + "><span>" + esc(z) + "<small>" + esc(texte[z] || "") + "</small></span></label>";
    }).join("") || '<p class="hint hint--aus">Zurzeit ist keine Zahlungsart eingerichtet.</p>';
    $("summe2").innerHTML = summenHtml(r, true);
  }
  form.addEventListener("change", function (e) { if (e.target.name === "lieferart") kasseZeichnen(); });

  $("zurKasse").addEventListener("click", function () {
    $("schrittKorb").hidden = true; form.hidden = false;
    $("korbTitel").innerHTML = 'Zur <span class="drip">Kasse</span>';
    kasseZeichnen(); window.scrollTo({ top: 0, behavior: "smooth" });
  });
  $("zurueck").addEventListener("click", function () {
    form.hidden = true; $("schrittKorb").hidden = false;
    $("korbTitel").innerHTML = 'Dein <span class="drip">Warenkorb</span>';
    korbZeichnen();
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var fehler = $("kasseFehler"); fehler.hidden = true;
    var la = lieferart(), r = rechne(la);
    var f = form.elements;
    var daten = {
      kunde: { vorname: f.vorname.value, nachname: f.nachname.value, email: f.email.value, telefon: f.telefon.value, strasse: f.strasse.value, plz: f.plz.value, ort: f.ort.value },
      lieferart: la, zahlart: (form.querySelector("input[name=zahlart]:checked") || {}).value || "",
      notiz: f.notiz.value, agb: f.agb.checked, datenschutz: f.datenschutz.checked,
      positionen: r.pos.map(function (x) { return { produktId: x.id, menge: x.menge }; }),
    };
    if (r.ab18) { daten.geburtsdatum = f.geburtsdatum.value; daten.ab18Bestaetigt = f.ab18.checked; }
    var knopf = $("bestellen"); knopf.disabled = true; knopf.textContent = "Wird gesendet …";
    try {
      var res = await fetch("/api/shop/bestellung", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json", "x-zb": "1" }, body: JSON.stringify(daten) });
      var json = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(json.fehler || "Bestellung fehlgeschlagen.");
      // Bestellte Artikel aus dem Warenkorb nehmen
      var k = window.ZBKorb.alle();
      r.pos.forEach(function (x) { delete k[x.id]; });
      window.ZBKorb.speichern(k);
      danke(json);
    } catch (err) {
      fehler.textContent = err.message; fehler.hidden = false;
      knopf.disabled = false; knopf.textContent = "Zahlungspflichtig bestellen";
    }
  });

  /* ================= Schritt 3: Danke ================= */
  function danke(r) {
    form.hidden = true;
    $("korbTitel").innerHTML = 'Danke, <span class="drip">Bro!</span>';
    var z = r.zahlungsinfo || {};
    var zahlung = "";
    if (z.art === "ueberweisung") {
      zahlung = z.iban
        ? '<dl class="bank"><dt>Empfänger</dt><dd>' + esc(z.inhaber) + "</dd><dt>IBAN</dt><dd>" + esc(z.iban) + "</dd>" + (z.bank ? "<dt>Bank</dt><dd>" + esc(z.bank) + "</dd>" : "") +
          "<dt>Betrag</dt><dd>" + euro(z.betrag) + "</dd><dt>Verwendungszweck</dt><dd>" + esc(z.verwendungszweck) + "</dd></dl>"
        : '<p class="hinweis">Wir schicken dir die Bankverbindung per E-Mail.</p>';
    } else if (z.art === "paypal") {
      zahlung = '<dl class="bank"><dt>PayPal</dt><dd>' + esc(z.ziel) + "</dd><dt>Betrag</dt><dd>" + euro(z.betrag) + "</dd><dt>Verwendungszweck</dt><dd>" + esc(z.verwendungszweck) + "</dd></dl>";
    } else {
      zahlung = "<p>Du zahlst <strong>" + euro(z.betrag) + "</strong> bar bei der Abholung" + (z.abholort ? " (" + esc(z.abholort) + ")" : "") + ".</p>";
    }
    $("schrittDanke").hidden = false;
    $("schrittDanke").innerHTML =
      '<svg class="danke__crown" aria-hidden="true"><use href="#crown"/></svg>' +
      '<p class="danke__title">Bestellung eingegangen!</p>' +
      "<p>Deine Bestellnummer: <strong>" + esc(r.nr) + "</strong><br>Gesamtbetrag: <strong>" + euro(r.brutto) + "</strong></p>" + zahlung +
      (r.ab18 ? '<p class="hint hint--pruefen">🪪 Bitte halte bei der Übergabe deinen Ausweis bereit.</p>' : "") +
      (r.hinweis ? "<p>" + esc(r.hinweis) + "</p>" : "") +
      '<p><a class="btn btn--pink" href="/sortiment.html">Weiter shoppen →</a></p>';
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.ZBShop.daten().then(function (d) {
    shop = d;
    var v = d.versand || {};
    $("versandText").textContent = (v.kosten ? euro(v.kosten) : "kostenlos") + (v.freiAb ? " · ab " + euro(v.freiAb) + " kostenlos" : "");
    $("abholungOption").hidden = !v.abholung;
    if (v.abholort) $("abholText").textContent = "kostenlos · " + v.abholort;
    korbZeichnen();
  });
})();
