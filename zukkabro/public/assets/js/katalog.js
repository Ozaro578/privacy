/* =========================================================
   ZUKKABRO – Produktkatalog
   Wird von Startseite (Vorschau), Sortiment und Vapes-Seite genutzt.
   Container:  <div data-katalog="vorschau" data-filter="neu" data-limit="8">
               <div data-katalog="voll" data-kats="vapes,elfbar">
   ========================================================= */
(function () {
  "use strict";

  var LISTE = typeof PRODUKTE !== "undefined" && Array.isArray(PRODUKTE) ? PRODUKTE : [];
  var KATS = typeof KATEGORIEN !== "undefined" && Array.isArray(KATEGORIEN) ? KATEGORIEN : [];
  var PREIS = typeof PREISE === "object" && PREISE ? PREISE : {};
  var BEST = typeof BESTSELLER !== "undefined" && Array.isArray(BESTSELLER) ? BESTSELLER : [];
  var SEITE = 48;
  var euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
  var katMap = {};
  KATS.forEach(function (k) { katMap[k.id] = k; });

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss");
  }
  function istBest(p) { return BEST.indexOf(p.id) !== -1; }
  function hauptKat(p) { return katMap[p.kat && p.kat[0]] || { emoji: "🍬", farbe: "pink" }; }

  function passt(p, filter) {
    if (!filter || filter === "alle") return true;
    if (filter === "neu") return !!p.neu;
    if (filter === "bestseller") return istBest(p);
    return p.kat && p.kat.indexOf(filter) !== -1;
  }

  function waHref(name) {
    var wa = window.ZB_WA || "";
    return wa ? "https://wa.me/" + wa + "?text=" + encodeURIComponent("Hallo ZUKKABRO! Ich interessiere mich für: " + name) : "/kontakt.html";
  }

  function karte(p, i) {
    var k = hauptKat(p);
    var preis = typeof PREIS[p.id] === "number"
      ? '<span class="price">' + euro.format(PREIS[p.id]) + "</span>"
      : '<span class="price price--open">Preis auf Anfrage</span>';
    var badges = "";
    if (istBest(p)) badges += '<span class="badge badge--bestseller">BESTSELLER</span>';
    else if (p.neu) badges += '<span class="badge badge--neu">NEU</span>';
    if (p.ab18) badges += '<span class="badge badge--18">18+</span>';
    var hinweise = "";
    if (p.aus) hinweise += '<span class="hint hint--aus">Gerade nicht lieferbar</span>';
    if (p.pruefen) hinweise += '<span class="hint hint--pruefen" title="Vor dem öffentlichen Start rechtlich prüfen">⚠️ Rechtlich prüfen</span>';
    var wa = window.ZB_WA;
    var bild = p.bild
      ? '<img data-slot src="/' + esc(p.bild) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async" width="400" height="400">'
      : "";
    return (
      '<article class="product product--' + esc(k.farbe) + (p.aus ? " is-aus" : "") + '" style="--i:' + (i % SEITE) + '">' +
        '<div class="product__art slot' + (p.bild ? " has-img" : " no-img") + '" data-slot-box>' + bild +
          '<span class="product__emoji slot__fallback" aria-hidden="true">' + esc(k.emoji) + "</span>" + badges +
        "</div>" +
        '<div class="product__body">' +
          (p.marke ? '<p class="product__brand">' + esc(p.marke) + "</p>" : "") +
          "<h3>" + esc(p.name) + "</h3>" + hinweise +
          '<div class="product__foot">' + preis +
            '<a class="product__ask" href="' + esc(waHref(p.name)) + '"' + (wa ? ' target="_blank" rel="noopener"' : "") + ">Anfragen →</a>" +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  /* ---------- Vorschau (z. B. "Neu eingetroffen" auf der Startseite) ---------- */
  function vorschau(box) {
    var filter = box.getAttribute("data-filter") || "alle";
    var limit = parseInt(box.getAttribute("data-limit") || "8", 10);
    var items = LISTE.filter(function (p) { return passt(p, filter) && !p.aus && !p.pruefen; }).slice(0, limit);
    if (!items.length) items = LISTE.filter(function (p) { return !p.aus; }).slice(0, limit);
    box.innerHTML = items.map(karte).join("");
  }

  /* ---------- Voller Katalog mit Suche, Filter, Sortierung ---------- */
  function voll(box) {
    var erlaubt = (box.getAttribute("data-kats") || "").split(",").filter(Boolean);
    var basis = erlaubt.length ? LISTE.filter(function (p) { return p.kat.some(function (k) { return erlaubt.indexOf(k) !== -1; }); }) : LISTE;
    var chipsBox = document.getElementById("filters");
    var suche = document.getElementById("suche");
    var sortierung = document.getElementById("sortierung");
    var nurLieferbar = document.getElementById("nurLieferbar");
    var anzahl = document.getElementById("anzahl");
    var mehr = document.getElementById("mehr");
    var params = new URLSearchParams(location.search);
    var zustand = { filter: params.get("kat") || "alle", q: params.get("q") || "", sort: "neu", lieferbar: false, zeige: SEITE };

    // Filter-Chips aufbauen
    var chips = [{ id: "alle", name: "Alle", emoji: "✨" }];
    if (!erlaubt.length) chips.push({ id: "neu", name: "Neu", emoji: "🆕" });
    if (BEST.length && !erlaubt.length) chips.push({ id: "bestseller", name: "Bestseller", emoji: "👑" });
    KATS.forEach(function (k) {
      if (erlaubt.length && erlaubt.indexOf(k.id) === -1) return;
      var n = basis.filter(function (p) { return p.kat.indexOf(k.id) !== -1; }).length;
      if (n) chips.push({ id: k.id, name: k.name, emoji: k.emoji, n: n, ab18: k.ab18 });
    });
    if (chips.every(function (c) { return c.id !== zustand.filter; })) zustand.filter = "alle";
    chipsBox.innerHTML = chips.map(function (c) {
      return '<button class="chip' + (c.ab18 ? " chip--vape" : "") + '" data-filter="' + esc(c.id) + '" role="tab" aria-selected="false">' +
        esc(c.emoji) + " " + esc(c.name) + (c.n ? ' <small>' + c.n + "</small>" : "") + "</button>";
    }).join("");
    if (suche) suche.value = zustand.q;

    function urlMerken() {
      var u = new URLSearchParams();
      if (zustand.filter !== "alle") u.set("kat", zustand.filter);
      if (zustand.q) u.set("q", zustand.q);
      var s = u.toString();
      history.replaceState(null, "", location.pathname + (s ? "?" + s : ""));
    }

    function zeichnen() {
      var q = norm(zustand.q).trim();
      var worte = q ? q.split(/\s+/) : [];
      var items = basis.filter(function (p) {
        if (!passt(p, zustand.filter)) return false;
        if (zustand.lieferbar && p.aus) return false;
        if (!worte.length) return true;
        var text = norm(p.name + " " + p.marke);
        return worte.every(function (w) { return text.indexOf(w) !== -1; });
      });
      if (zustand.sort === "az") items = items.slice().sort(function (a, b) { return a.name.localeCompare(b.name, "de"); });
      if (zustand.sort === "marke") items = items.slice().sort(function (a, b) { return (a.marke || "").localeCompare(b.marke || "", "de") || a.name.localeCompare(b.name, "de"); });
      var sichtbar = items.slice(0, zustand.zeige);
      box.innerHTML = sichtbar.length ? sichtbar.map(karte).join("")
        : '<p class="products__empty">Nichts gefunden, Bro. Probier einen anderen Suchbegriff! 👑</p>';
      if (anzahl) anzahl.textContent = items.length === 1 ? "1 Produkt" : items.length + " Produkte";
      if (mehr) {
        mehr.hidden = items.length <= zustand.zeige;
        mehr.textContent = "Mehr anzeigen (" + (items.length - sichtbar.length) + " weitere)";
      }
      chipsBox.querySelectorAll(".chip").forEach(function (c) {
        var on = c.getAttribute("data-filter") === zustand.filter;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-selected", String(on));
      });
    }

    chipsBox.addEventListener("click", function (e) {
      var c = e.target.closest(".chip");
      if (!c) return;
      zustand.filter = c.getAttribute("data-filter");
      zustand.zeige = SEITE;
      urlMerken(); zeichnen();
    });
    if (suche) {
      var t;
      suche.addEventListener("input", function () {
        clearTimeout(t);
        t = setTimeout(function () { zustand.q = suche.value; zustand.zeige = SEITE; urlMerken(); zeichnen(); }, 150);
      });
    }
    if (sortierung) sortierung.addEventListener("change", function () { zustand.sort = sortierung.value; zeichnen(); });
    if (nurLieferbar) nurLieferbar.addEventListener("change", function () { zustand.lieferbar = nurLieferbar.checked; zustand.zeige = SEITE; zeichnen(); });
    if (mehr) mehr.addEventListener("click", function () { zustand.zeige += SEITE; zeichnen(); });

    zeichnen();
  }

  /* ---------- Kategorie-Kacheln (Startseite) ---------- */
  function kacheln(box) {
    box.innerHTML = KATS.map(function (k) {
      var n = LISTE.filter(function (p) { return p.kat.indexOf(k.id) !== -1; }).length;
      if (!n) return "";
      var href = k.ab18 ? "/vapes.html?kat=" + k.id : "/sortiment.html?kat=" + k.id;
      return '<a class="kachel reveal' + (k.ab18 ? " kachel--18" : "") + '" href="' + href + '">' +
        '<span class="kachel__emoji" aria-hidden="true">' + esc(k.emoji) + "</span>" +
        '<span class="kachel__name">' + esc(k.name) + (k.ab18 ? " 18+" : "") + "</span>" +
        '<span class="kachel__n">' + n + " Produkte</span></a>";
    }).join("");
    box.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-visible"); });
  }

  function start() {
    document.querySelectorAll("[data-kat-kacheln]").forEach(kacheln);
    document.querySelectorAll('[data-katalog="vorschau"]').forEach(vorschau);
    document.querySelectorAll('[data-katalog="voll"]').forEach(voll);
    var stand = document.getElementById("sortimentStand");
    if (stand && typeof SORTIMENT_STAND !== "undefined") stand.textContent = SORTIMENT_STAND;
    var gesamt = document.querySelectorAll("[data-produktzahl]");
    gesamt.forEach(function (el) { el.textContent = LISTE.length; });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
