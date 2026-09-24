/* =========================================================
   ZUKKABRO – Produktseite (produkt.html?id=...)
   Galerie, Preis, Menge, Warenkorb, ähnliche Produkte
   ========================================================= */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var LISTE = typeof PRODUKTE !== "undefined" ? PRODUKTE : [];
  var KATS = {};
  (typeof KATEGORIEN !== "undefined" ? KATEGORIEN : []).forEach(function (k) { KATS[k.id] = k; });
  var id = new URLSearchParams(location.search).get("id") || "";
  var p = LISTE.find(function (x) { return x.id === id; });

  if (!p) {
    $("pdp").innerHTML = '<div class="karte leer" style="grid-column:1/-1">Dieses Produkt gibt es nicht (mehr). <a href="/sortiment.html">Zum Sortiment →</a></div>';
    return;
  }

  var k0 = KATS[p.kat[0]] || { name: "Sortiment", emoji: "🍬", id: "" };
  document.title = p.name + " – ZUKKABRO";
  var katLink = function (k) { return (k.ab18 ? "/vapes.html?kat=" : "/sortiment.html?kat=") + encodeURIComponent(k.id); };
  $("brotkrumen").innerHTML = '<a href="/sortiment.html">Sortiment</a> › <a href="' + katLink(k0) + '">' + esc(k0.name) + "</a> › " + esc(p.name);

  var bilder = p.bilder && p.bilder.length ? p.bilder : p.bild ? [p.bild] : [];
  var aktiv = 0;

  function galerie() {
    var badges = (p.neu ? '<span class="badge badge--neu">NEU</span>' : "") + (p.ab18 ? '<span class="badge badge--18">18+</span>' : "");
    var haupt = bilder.length
      ? '<img id="hauptbild" src="/' + esc(bilder[0]) + '" alt="' + esc(p.name) + '">'
      : '<span class="product__emoji" aria-hidden="true">' + esc(k0.emoji) + "</span>";
    var pfeile = bilder.length > 1
      ? '<button class="galerie__pfeil galerie__pfeil--l" type="button" data-schritt="-1" aria-label="Vorheriges Bild">‹</button><button class="galerie__pfeil galerie__pfeil--r" type="button" data-schritt="1" aria-label="Nächstes Bild">›</button>'
      : "";
    var daumen = bilder.length > 1
      ? '<div class="galerie__daumen">' + bilder.map(function (b, i) {
          return '<button type="button" data-bild="' + i + '"' + (i === 0 ? ' class="is-active"' : "") + ' aria-label="Bild ' + (i + 1) + '"><img src="/' + esc(b) + '" alt="" loading="lazy"></button>';
        }).join("") + "</div>"
      : "";
    return '<div class="galerie"><div class="galerie__haupt" id="galerieHaupt">' + haupt + badges + pfeile + "</div>" + daumen + "</div>";
  }

  function zeigeBild(i) {
    aktiv = (i + bilder.length) % bilder.length;
    var img = $("hauptbild");
    if (img) img.src = "/" + bilder[aktiv];
    document.querySelectorAll(".galerie__daumen button").forEach(function (b, n) { b.classList.toggle("is-active", n === aktiv); });
  }

  function info(preis) {
    var hatPreis = typeof preis === "number";
    var kats = p.kat.map(function (id) { var k = KATS[id]; return k ? '<a href="' + katLink(k) + '">' + esc(k.emoji + " " + k.name) + "</a>" : ""; }).join("");
    var hinweise = (p.aus ? '<p class="hint hint--aus">Gerade nicht lieferbar</p>' : "") +
      (p.pruefen ? '<p class="hint hint--pruefen">⚠️ Vor dem öffentlichen Start rechtlich prüfen</p>' : "");
    var kaufen;
    if (p.aus) kaufen = '<button class="btn btn--light" type="button" disabled>Gerade nicht lieferbar</button>';
    else if (!hatPreis) kaufen = '<button class="btn btn--light" type="button" disabled>Preis folgt – bald bestellbar</button>';
    else kaufen =
      '<div class="stepper"><button type="button" data-menge="-1" aria-label="Weniger">−</button><input id="menge" type="number" min="1" max="999" value="1" aria-label="Menge"><button type="button" data-menge="1" aria-label="Mehr">+</button></div>' +
      '<button class="btn btn--pink" type="button" id="inKorb">🛒 In den Warenkorb</button>';
    var warnung = p.ab18 && p.kat.some(function (k) { return k === "vapes" || k === "elfbar"; })
      ? '<div class="warning"><strong>Warnhinweis</strong><p>Nikotinhaltige Produkte machen sehr stark abhängig. Nicht für Nichtraucher empfohlen. Abgabe nur an Personen ab 18 Jahren.</p></div>'
      : p.ab18 ? '<p class="hint hint--pruefen">🔞 Abgabe nur an Personen ab 18 Jahren.</p>' : "";
    return '<div class="pdp__info">' +
      (p.marke ? '<p class="pdp__marke">' + esc(p.marke) + "</p>" : "") +
      "<h1>" + esc(p.name) + "</h1>" +
      '<div class="pdp__kats">' + kats + "</div>" + hinweise +
      (hatPreis ? '<p class="pdp__preis">' + window.ZBShop.euro(preis) + '</p><p class="pdp__mwst">inkl. MwSt., zzgl. <a href="/kontakt.html#versand">Versand</a></p>'
                : '<p class="pdp__preis" style="font-size:1.6rem;color:var(--gold-deep)">Preis folgt</p><p class="pdp__mwst">Wir stellen die Preise gerade ein. Schau bald wieder vorbei!</p>') +
      '<div class="pdp__kaufen">' + kaufen + "</div>" +
      warnung +
      '<ul class="pdp__vorteile"><li>🚚 Schneller Versand aus Deutschland</li><li>🏪 Abholung nach Absprache</li>' + (p.ab18 ? "<li>🪪 Altersprüfung bei Übergabe</li>" : "") + "</ul>" +
      "</div>";
  }

  window.ZBShop.daten().then(function (d) {
    var preis = (d.preise || {})[p.id];
    $("pdp").innerHTML = galerie() + info(preis);

    var haupt = $("galerieHaupt");
    haupt.addEventListener("click", function (e) {
      var pf = e.target.closest("[data-schritt]");
      if (pf) { e.stopPropagation(); zeigeBild(aktiv + parseInt(pf.getAttribute("data-schritt"), 10)); return; }
      if (bilder.length) haupt.classList.toggle("is-zoom");
    });
    document.querySelectorAll(".galerie__daumen [data-bild]").forEach(function (b) {
      b.addEventListener("click", function () { zeigeBild(parseInt(b.getAttribute("data-bild"), 10)); });
    });
    // Wischen auf dem Handy
    var startX = null;
    haupt.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    haupt.addEventListener("touchend", function (e) {
      if (startX === null || bilder.length < 2) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) zeigeBild(aktiv + (dx < 0 ? 1 : -1));
      startX = null;
    });

    var menge = $("menge");
    document.querySelectorAll("[data-menge]").forEach(function (b) {
      b.addEventListener("click", function () {
        menge.value = Math.max(1, Math.min(999, (parseInt(menge.value, 10) || 1) + parseInt(b.getAttribute("data-menge"), 10)));
      });
    });
    var knopf = $("inKorb");
    if (knopf) knopf.addEventListener("click", function () {
      var n = Math.max(1, Math.min(999, parseInt(menge.value, 10) || 1));
      window.ZBKorb.dazu(p.id, n);
      window.ZBToast("🛒 " + n + " × " + p.name + " im Warenkorb.");
    });
  });

  // Ähnliche Produkte aus der Hauptkategorie (zeichnet katalog.js)
  var box = $("aehnlichListe");
  box.setAttribute("data-katalog", "vorschau");
  box.setAttribute("data-filter", p.kat[0] || "alle");
  box.setAttribute("data-limit", "4");
  box.setAttribute("data-ohne", p.id);
  $("aehnlich").hidden = false;
})();
