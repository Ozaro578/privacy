/* =========================================================
   ZUKKABRO – Angebots-Slider auf der Startseite
   Erster Slide: Marke (steht fest im HTML). Danach: laufende Angebote
   aus dem Admin-Bereich. Gibt es keine, zeigt der Slider Highlights
   (Bestseller und Neuheiten), damit die Startseite nie leer wirkt.
   Läuft automatisch, stoppt bei Maus, Fokus, Wischen und im Hintergrund.
   ========================================================= */
(function () {
  "use strict";
  var box = document.getElementById("slider");
  if (!box) return;
  var track = box.querySelector(".slider__track");
  var punkte = box.querySelector(".slider__punkte");
  var LISTE = typeof PRODUKTE !== "undefined" && Array.isArray(PRODUKTE) ? PRODUKTE : [];
  var KATS = {};
  (typeof KATEGORIEN !== "undefined" ? KATEGORIEN : []).forEach(function (k) { KATS[k.id] = k; });
  var BEST = typeof BESTSELLER !== "undefined" && Array.isArray(BESTSELLER) ? BESTSELLER : [];
  var PROD = {};
  LISTE.forEach(function (p) { PROD[p.id] = p; });
  var DAUER = 6000;
  var ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function euro(c) { return window.ZBShop.euro(c); }
  function datumKurz(iso) {
    var t = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return t ? parseInt(t[3], 10) + "." + parseInt(t[2], 10) + "." : "";
  }

  /* ---------- Slides bauen ---------- */
  function slide(p, a, i) {
    var k = KATS[p.kat && p.kat[0]] || { farbe: "pink", emoji: "🍬" };
    var farbe = p.ab18 ? "dark" : k.farbe;
    var href = "/produkt.html?id=" + encodeURIComponent(p.id);
    var hatPreis = typeof a.preis === "number";
    var rabatt = hatPreis && a.alt ? Math.round((1 - a.preis / a.alt) * 100) : 0;
    var kicker = a.titel || (a.highlight ? (a.highlight === "best" ? "👑 Bestseller" : "✨ Neu im Regal") : "🔥 Angebot");
    var preis = hatPreis
      ? '<p class="slide__preis"><span class="slide__neu">' + euro(a.preis) + "</span>" +
        (a.alt ? '<s class="slide__alt">' + euro(a.alt) + "</s>" : "") + "</p>" +
        '<p class="slide__sub">inkl. MwSt., zzgl. Versand' + (a.bis ? " · nur bis " + datumKurz(a.bis) : "") + "</p>"
      : '<p class="slide__preis"><span class="slide__folgt">Preis folgt</span></p><p class="slide__sub">Bald bestellbar. Schau dir das Produkt schon mal an.</p>';
    var cta = hatPreis
      ? '<button class="btn btn--pink" type="button" data-korb="' + esc(p.id) + '">🛒 In den Korb</button><a class="btn btn--light" href="' + href + '">Ansehen</a>'
      : '<a class="btn btn--pink" href="' + href + '">Produkt ansehen →</a>';
    var bild = p.bild
      ? '<img src="/' + esc(p.bild) + '" alt="' + esc(p.name) + '" width="400" height="400"' + (i > 1 ? ' loading="lazy"' : "") + ">"
      : '<span class="slide__emoji" aria-hidden="true">' + esc(k.emoji) + "</span>";
    var sticker = rabatt >= 5 ? '<span class="slide__sticker">−' + rabatt + " %</span>" : p.ab18 ? '<span class="slide__sticker slide__sticker--18">18+</span>' : "";
    return '<article class="slide slide--' + esc(farbe) + '" aria-roledescription="Slide" aria-label="' + (i + 1) + ' von ' + '{n}' + '">' +
      '<div class="slide__text">' +
        '<p class="slide__kicker">' + esc(kicker) + "</p>" +
        (p.marke ? '<p class="slide__marke">' + esc(p.marke) + "</p>" : "") +
        '<h2 class="slide__titel"><a href="' + href + '">' + esc(p.name) + "</a></h2>" +
        preis + '<div class="slide__cta">' + cta + "</div>" +
      "</div>" +
      '<a class="slide__bild" href="' + href + '" tabindex="-1" aria-hidden="true">' + bild + sticker + "</a>" +
      "</article>";
  }

  function highlights() {
    var best = BEST.map(function (id) { return PROD[id]; }).filter(function (p) { return p && !p.aus && !p.pruefen; }).slice(0, 2)
      .map(function (p) { return { p: p, a: { highlight: "best" } }; });
    var neu = LISTE.filter(function (p) { return p.neu && !p.aus && !p.pruefen && !p.ab18 && p.bild && !BEST.includes(p.id); }).slice(0, 4 - best.length)
      .map(function (p) { return { p: p, a: { highlight: "neu" } }; });
    return best.concat(neu);
  }

  /* ---------- Steuerung ---------- */
  var slides = [], aktiv = 0, timer = null, pause = false;

  function zeige(n, richtung) {
    aktiv = (n + slides.length) % slides.length;
    slides.forEach(function (s, i) {
      s.classList.toggle("is-active", i === aktiv);
      s.classList.toggle("is-links", richtung < 0 && i === aktiv);
      s.setAttribute("aria-hidden", i === aktiv ? "false" : "true");
    });
    punkte.querySelectorAll("button").forEach(function (b, i) {
      b.classList.toggle("is-active", i === aktiv);
      b.setAttribute("aria-current", i === aktiv ? "true" : "false");
    });
    neustart();
  }
  function neustart() {
    clearTimeout(timer);
    if (ruhig || pause || slides.length < 2 || document.hidden) { box.classList.remove("is-auto"); return; }
    box.classList.add("is-auto");
    timer = setTimeout(function () { zeige(aktiv + 1, 1); }, DAUER);
  }
  function halt(ja) { pause = ja; neustart(); }

  function start(daten) {
    var angebote = (daten.angebote || []).map(function (a) { return { p: PROD[a.id], a: a }; }).filter(function (x) { return x.p && !x.p.aus; });
    if (!angebote.length) angebote = highlights();
    var html = angebote.map(function (x, i) { return slide(x.p, x.a, i + 1); }).join("");
    track.insertAdjacentHTML("beforeend", html);
    slides = Array.prototype.slice.call(track.querySelectorAll(".slide"));
    slides.forEach(function (s, i) { s.setAttribute("aria-label", (i + 1) + " von " + slides.length); });
    box.style.setProperty("--dauer", DAUER + "ms");
    punkte.innerHTML = slides.map(function (s, i) {
      return '<button type="button" data-ziel="' + i + '" aria-label="Slide ' + (i + 1) + '"><i></i></button>';
    }).join("");
    box.classList.toggle("is-single", slides.length < 2);
    zeige(0, 1);
  }

  box.addEventListener("click", function (e) {
    var pfeil = e.target.closest("[data-richtung]");
    if (pfeil) { zeige(aktiv + parseInt(pfeil.getAttribute("data-richtung"), 10), parseInt(pfeil.getAttribute("data-richtung"), 10)); return; }
    var punkt = e.target.closest("[data-ziel]");
    if (punkt) zeige(parseInt(punkt.getAttribute("data-ziel"), 10), 1);
  });
  box.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { zeige(aktiv + 1, 1); e.preventDefault(); }
    if (e.key === "ArrowLeft") { zeige(aktiv - 1, -1); e.preventDefault(); }
  });
  box.addEventListener("mouseenter", function () { halt(true); });
  box.addEventListener("mouseleave", function () { halt(false); });
  box.addEventListener("focusin", function () { halt(true); });
  box.addEventListener("focusout", function (e) { if (!box.contains(e.relatedTarget)) halt(false); });
  document.addEventListener("visibilitychange", neustart);

  /* Wischen auf dem Handy */
  var startX = null, startY = null;
  box.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; startY = e.touches[0].clientY; halt(true); }, { passive: true });
  box.addEventListener("touchend", function (e) {
    if (startX !== null) {
      var dx = e.changedTouches[0].clientX - startX, dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) zeige(aktiv + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    }
    startX = null; halt(false);
  }, { passive: true });

  window.ZBShop.daten().then(start);
})();
