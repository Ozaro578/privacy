/* =========================================================
   ZUKKABRO – Themen-Pakete (Netflix Night, Gamer Paket, …)
   Container:  [data-pakete="liste"]   alle Pakete
               [data-pakete="start"]   Vorschau auf der Startseite (4 Stück)
               #paketDetail            Detailseite paket.html?id=...
   Die Pakete selbst pflegt ihr im Admin-Bereich unter „Pakete“.
   ========================================================= */
(function () {
  "use strict";
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var PROD = {};
  (typeof PRODUKTE !== "undefined" ? PRODUKTE : []).forEach(function (p) { PROD[p.id] = p; });
  var euro = function (c) { return window.ZBShop.euro(c); };

  function collage(pk, max) {
    var bilder = pk.inhalt.map(function (i) { return PROD[i.id]; }).filter(function (p) { return p && p.bild; }).slice(0, max || 4);
    var raster = (max || 4) > 4; // Detailseite: 3 × 2 Raster, Karte: Fächer
    return '<div class="paket-collage" aria-hidden="true">' + bilder.map(function (p, n) {
      var x = raster ? (n % 3) * 31 : n * 19;
      var y = raster ? Math.floor(n / 3) * 48 + "%" : (n % 2) * 16 + 6 + "px";
      var r = ((n % 2 ? 1 : -1) * (4 + (n * 3) % 7)) + "deg";
      return '<span class="paket-collage__bild" style="--x:' + x + "%;--y:" + y + ";--r:" + r + '"><img src="/' + esc(p.bild) + '" alt="" loading="lazy"></span>';
    }).join("") + "</div>";
  }
  function preisText(pk) {
    if (!pk.lieferbar) return '<span class="price price--folgt">Gerade nicht lieferbar</span>';
    return pk.preis != null ? '<span class="price">' + euro(pk.preis) + "</span>" : '<span class="price price--folgt">Preis folgt</span>';
  }
  function stueck(pk) { return pk.inhalt.reduce(function (a, i) { return a + i.menge; }, 0); }

  function karte(pk) {
    return '<a class="paket-karte paket--' + esc(pk.farbe) + ' reveal is-visible" href="/paket.html?id=' + encodeURIComponent(pk.id) + '">' +
      collage(pk, 4) +
      '<span class="paket-karte__emoji" aria-hidden="true">' + esc(pk.emoji) + "</span>" +
      '<span class="paket-karte__titel">' + esc(pk.name) + "</span>" +
      '<span class="paket-karte__text">' + esc(pk.untertitel) + "</span>" +
      '<span class="paket-karte__fuss"><span class="paket-karte__zahl">' + stueck(pk) + (stueck(pk) === 1 ? " Produkt" : " Produkte") + (pk.ab18 ? " · 18+" : "") + "</span>" + preisText(pk) + "</span>" +
      '<span class="paket-karte__btn">Paket ansehen →</span>' +
    "</a>";
  }

  function detail(box, pk) {
    document.title = pk.name + " – Paket – ZUKKABRO";
    var kaufbar = pk.lieferbar && pk.preis != null;
    var einzel = pk.inhalt.map(function (i) {
      var p = PROD[i.id] || { name: i.id, marke: "", kat: [] };
      return '<a class="paket-teil" href="/produkt.html?id=' + encodeURIComponent(i.id) + '">' +
        (p.bild ? '<img src="/' + esc(p.bild) + '" alt="" loading="lazy">' : '<span class="paket-teil__emoji">🍬</span>') +
        '<span><strong>' + (i.menge > 1 ? i.menge + " × " : "") + esc(p.name) + "</strong><small>" + esc(p.marke || "") + "</small></span></a>";
    }).join("");
    box.innerHTML =
      '<div class="paket-hero paket--' + esc(pk.farbe) + '">' +
        '<div class="paket-hero__text">' +
          '<span class="paket-karte__emoji" aria-hidden="true">' + esc(pk.emoji) + "</span>" +
          '<h1 class="paket-karte__titel">' + esc(pk.name) + "</h1>" +
          '<p class="paket-karte__text">' + esc(pk.untertitel) + "</p>" +
          '<p class="paket-hero__preis">' + (kaufbar ? euro(pk.preis) + "<small>inkl. MwSt., zzgl. Versand</small>" : pk.lieferbar ? "Preis folgt" : "Gerade nicht lieferbar") + "</p>" +
          '<div class="pdp__kaufen">' + (kaufbar
            ? '<div class="stepper"><button type="button" data-menge="-1" aria-label="Weniger">−</button><input id="menge" type="number" min="1" max="99" value="1" aria-label="Anzahl Pakete"><button type="button" data-menge="1" aria-label="Mehr">+</button></div><button class="btn btn--light" type="button" id="paketInKorb">🛒 Paket in den Warenkorb</button>'
            : '<button class="btn btn--light" type="button" disabled>' + (pk.lieferbar ? "Preis folgt – bald bestellbar" : "Gerade nicht lieferbar") + "</button>") +
          "</div>" +
        "</div>" +
        collage(pk, 6) +
      "</div>" +
      '<h2 class="paket-drin">Das ist <span class="drip">drin</span> <small>(' + stueck(pk) + (stueck(pk) === 1 ? " Produkt" : " Produkte") + ")</small></h2>" +
      '<div class="paket-teile">' + einzel + "</div>";
    var menge = document.getElementById("menge");
    box.querySelectorAll("[data-menge]").forEach(function (b) {
      b.addEventListener("click", function () { menge.value = Math.max(1, Math.min(99, (parseInt(menge.value, 10) || 1) + parseInt(b.getAttribute("data-menge"), 10))); });
    });
    var knopf = document.getElementById("paketInKorb");
    if (knopf) knopf.addEventListener("click", function () {
      var n = Math.max(1, Math.min(99, parseInt(menge.value, 10) || 1));
      window.ZBKorb.dazu("paket:" + pk.id, n);
      window.ZBToast("🎁 " + n + " × " + pk.name + " im Warenkorb.");
    });
  }

  function start() {
    window.ZBShop.daten().then(function (d) {
      var alle = d.pakete || [];
      document.querySelectorAll('[data-pakete="liste"]').forEach(function (box) {
        box.innerHTML = alle.length ? alle.map(karte).join("") : '<p class="leer">Bald gibt es hier unsere Pakete!</p>';
      });
      document.querySelectorAll('[data-pakete="start"]').forEach(function (box) {
        box.innerHTML = alle.slice(0, 4).map(karte).join("");
      });
      var box = document.getElementById("paketDetail");
      if (box) {
        var id = new URLSearchParams(location.search).get("id");
        var pk = alle.find(function (x) { return x.id === id; });
        if (pk) detail(box, pk);
        else box.innerHTML = '<div class="karte leer">Dieses Paket gibt es nicht (mehr). <a href="/pakete.html">Alle Pakete ansehen →</a></div>';
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
