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
  var PREIS = {};          // Endkundenpreise in Cent, kommen vom Server
  var ANGEBOT = {};        // laufende Angebote: id -> { preis, alt }
  var OHNE_PREIS_WEG = false;
  var FOLGT = "Preis folgt";   // Text ohne Preis (vor der Eröffnung anders)
  var BEST = typeof BESTSELLER !== "undefined" && Array.isArray(BESTSELLER) ? BESTSELLER : [];
  var SEITE = 48;
  function euro(cent) { return window.ZBShop.euro(cent); }
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

  function sichtbarImShop(p) { return !OHNE_PREIS_WEG || typeof PREIS[p.id] === "number"; }

  function passt(p, filter) {
    if (!filter || filter === "alle") return true;
    if (filter === "neu") return !!p.neu;
    if (filter === "bestseller") return istBest(p);
    return p.kat && p.kat.indexOf(filter) !== -1;
  }

  function karte(p, i) {
    var k = hauptKat(p);
    var hatPreis = typeof PREIS[p.id] === "number";
    var ang = ANGEBOT[p.id];
    var preis = hatPreis
      ? '<span class="price' + (ang ? " price--angebot" : "") + '">' + euro(PREIS[p.id]) + (ang && ang.alt ? ' <s class="price__alt">' + euro(ang.alt) + "</s>" : "") + window.ZBShop.grundpreis(p.name, PREIS[p.id]) + "</span>"
      : '<span class="price price--folgt">' + FOLGT + "</span>";
    var badges = "";
    if (ang) badges += '<span class="badge badge--angebot">' + (ang.alt ? "−" + Math.round((1 - ang.preis / ang.alt) * 100) + " %" : "ANGEBOT") + "</span>";
    else if (istBest(p)) badges += '<span class="badge badge--bestseller">BESTSELLER</span>';
    else if (p.neu) badges += '<span class="badge badge--neu">NEU</span>';
    if (p.ab18) badges += '<span class="badge badge--18">18+</span>';
    var hinweise = "";
    if (p.aus) hinweise += '<span class="hint hint--aus">Gerade nicht lieferbar</span>';
    if (p.pruefen) hinweise += '<span class="hint hint--pruefen" title="Vor dem öffentlichen Start rechtlich prüfen">⚠️ Rechtlich prüfen</span>';
    var bild = p.bild
      ? '<img data-slot src="/' + esc(p.bild) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async" width="400" height="400">'
      : "";
    var href = "/produkt.html?id=" + encodeURIComponent(p.id);
    var knopf = p.aus ? '<button class="product__cart" type="button" disabled>Nicht lieferbar</button>'
      : hatPreis ? '<button class="product__cart" type="button" data-korb="' + esc(p.id) + '" aria-label="' + esc(p.name) + ' in den Warenkorb">🛒 In den Korb</button>'
      : '<a class="product__ask" href="' + href + '">Ansehen →</a>';
    return (
      '<article class="product product--' + esc(k.farbe) + (p.aus ? " is-aus" : "") + '" style="--i:' + (i % SEITE) + '">' +
        '<a class="product__link" href="' + href + '">' +
          '<div class="product__art slot' + (p.bild ? " has-img" : " no-img") + '" data-slot-box>' + bild +
            '<span class="product__emoji slot__fallback" aria-hidden="true">' + esc(k.emoji) + "</span>" + badges +
          "</div>" +
          '<div class="product__body">' +
            (p.marke ? '<p class="product__brand">' + esc(p.marke) + "</p>" : "") +
            "<h3>" + esc(p.name) + "</h3>" + hinweise +
          "</div>" +
        "</a>" +
        '<div class="product__foot product__foot--karte">' + preis + knopf + "</div>" +
      "</article>"
    );
  }

  /* Klick auf "In den Korb" irgendwo auf der Seite */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-korb]");
    if (!b) return;
    e.preventDefault();
    var id = b.getAttribute("data-korb");
    var p = LISTE.find(function (x) { return x.id === id; });
    window.ZBKorb.dazu(id, 1);
    window.ZBToast("🛒 " + (p ? p.name : "Artikel") + " liegt im Warenkorb.");
  });

  /* ---------- Vorschau (z. B. "Neu eingetroffen" auf der Startseite) ---------- */
  function vorschau(box) {
    var filter = box.getAttribute("data-filter") || "alle";
    var limit = parseInt(box.getAttribute("data-limit") || "8", 10);
    var ohne = box.getAttribute("data-ohne") || "";
    var items = LISTE.filter(function (p) { return p.id !== ohne && passt(p, filter) && !p.aus && !p.pruefen && sichtbarImShop(p); }).slice(0, limit);
    if (!items.length) items = LISTE.filter(function (p) { return !p.aus; }).slice(0, limit);
    box.innerHTML = items.map(karte).join("");
  }

  /* ---------- Voller Katalog mit Suche, Filter, Sortierung ---------- */
  function voll(box) {
    var erlaubt = (box.getAttribute("data-kats") || "").split(",").filter(Boolean);
    var shopListe = LISTE.filter(sichtbarImShop);
    var basis = erlaubt.length ? shopListe.filter(function (p) { return p.kat.some(function (k) { return erlaubt.indexOf(k) !== -1; }); }) : shopListe;
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
  /* ---------- Wechselnde Produktfotos (Kacheln, Aktionskacheln, Social-Wand) ---------- */
  var ROTOR = [], rotorLaeuft = false;
  var ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function mischen(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  /** Bis zu n Produkte mit Foto, Neuheiten zuerst, Rest zufällig */
  function fotoProdukte(filterFn, n) {
    var pool = LISTE.filter(function (p) { return p.bild && !p.pruefen && !p.aus && filterFn(p); });
    var neu = mischen(pool.filter(function (p) { return p.neu; })), rest = mischen(pool.filter(function (p) { return !p.neu; }));
    return neu.concat(rest).slice(0, n);
  }
  function rotorHtml(bilder, cls) {
    return '<span class="' + cls + '" data-rotor aria-hidden="true">' + bilder.map(function (b, i) {
      return i === 0 ? '<img src="/' + esc(b) + '" alt="" loading="lazy" decoding="async" class="is-aktiv">' : '<img data-src="/' + esc(b) + '" alt="" decoding="async">';
    }).join("") + "</span>";
  }
  function rotorAnmelden(root) {
    root.querySelectorAll("[data-rotor]").forEach(function (el, n) {
      if (el.__rotor) return;
      el.__rotor = true;
      ROTOR.push({ el: el, i: 0, takt: 3400 + (n % 5) * 450, naechste: Date.now() + 2600 + n * 520 });
    });
    if (rotorLaeuft || ruhig) return;
    rotorLaeuft = true;
    setInterval(function () {
      if (document.hidden) return;
      var jetzt = Date.now();
      ROTOR.forEach(function (r) {
        if (jetzt < r.naechste) return;
        var imgs = r.el.querySelectorAll("img");
        if (imgs.length < 2) return;
        var naechstes = (r.i + 1) % imgs.length, img = imgs[naechstes];
        if (!img.getAttribute("src") && img.getAttribute("data-src")) img.src = img.getAttribute("data-src");
        if (!img.complete || !img.naturalWidth) { r.naechste = jetzt + 700; return; } // noch am Laden, kurz warten
        imgs[r.i].classList.remove("is-aktiv"); img.classList.add("is-aktiv"); r.i = naechstes; r.naechste = jetzt + r.takt;
        var vor = imgs[(naechstes + 1) % imgs.length];
        if (!vor.getAttribute("src") && vor.getAttribute("data-src")) vor.src = vor.getAttribute("data-src");
      });
    }, 400);
  }

  /* ---------- Kategorie-Kacheln mit wechselnden Fotos ---------- */
  function kacheln(box) {
    box.innerHTML = KATS.map(function (k) {
      var n = LISTE.filter(function (p) { return p.kat.indexOf(k.id) !== -1; }).length;
      if (!n) return "";
      var href = k.ab18 ? "/vapes.html?kat=" + k.id : "/sortiment.html?kat=" + k.id;
      var fotos = fotoProdukte(function (p) { return p.kat.indexOf(k.id) !== -1; }, 4).map(function (p) { return p.bild; });
      return '<a class="kachel reveal' + (k.ab18 ? " kachel--18" : "") + (fotos.length ? " kachel--foto" : "") + '" href="' + href + '">' +
        (fotos.length ? rotorHtml(fotos, "kachel__bild") : "") +
        '<span class="kachel__emoji" aria-hidden="true">' + esc(k.emoji) + "</span>" +
        '<span class="kachel__name">' + esc(k.name) + (k.ab18 ? " 18+" : "") + "</span>" +
        '<span class="kachel__n">' + n + " Produkte</span></a>";
    }).join("");
    box.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-visible"); });
    rotorAnmelden(box);
  }

  /* ---------- Aktionskacheln (Neu, Bestseller, Mystery) mit Foto ---------- */
  function promoFotos() {
    document.querySelectorAll("[data-rotor-kat]").forEach(function (el) {
      var f = el.getAttribute("data-rotor-kat");
      var fotos = fotoProdukte(function (p) { return passt(p, f); }, 4).map(function (p) { return p.bild; });
      if (!fotos.length) fotos = fotoProdukte(function () { return true; }, 4).map(function (p) { return p.bild; });
      el.innerHTML = rotorHtml(fotos, "promo__foto");
      el.closest(".promo").classList.add("promo--foto");
      rotorAnmelden(el);
    });
  }

  /* ---------- Social-Wand (Instagram/TikTok-Look) ---------- */
  function socialWand(box) {
    var S = typeof SHOP === "object" ? SHOP : {};
    var posts = typeof SOCIAL_POSTS !== "undefined" && Array.isArray(SOCIAL_POSTS) ? SOCIAL_POSTS.filter(function (x) { return x && x.bild; }).slice(0, 6) : [];
    var html;
    if (posts.length) {
      html = posts.map(function (x) {
        return '<a class="social-kachel" href="' + esc(x.link || "#") + '"' + (x.link ? ' target="_blank" rel="noopener"' : "") + '>' +
          '<img src="/' + esc(x.bild) + '" alt="' + esc(x.text || "") + '" loading="lazy" class="is-aktiv">' +
          '<span class="social-kachel__ig" aria-hidden="true"></span>' + (x.text ? '<span class="social-kachel__text">' + esc(x.text) + "</span>" : "") + "</a>";
      }).join("");
    } else {
      // Noch keine echten Posts: sechs Kacheln mit wechselnden Produktfotos, Neuheiten und Bestseller zuerst
      var genutzt = {}, kacheln6 = [], kats = {};
      // Bestseller zuerst, dann Neuheiten aus möglichst verschiedenen Kategorien, dann der Rest
      var gruppen = [function (p) { return istBest(p); }, function (p) { return p.neu && !p.ab18 && !kats[p.kat[0]]; }, function (p) { return !p.ab18 && !kats[p.kat[0]]; }, function (p) { return !p.ab18; }];
      gruppen.forEach(function (fn) {
        fotoProdukte(function (p) { return !genutzt[p.id] && fn(p); }, 6 - kacheln6.length).forEach(function (p) {
          if (kacheln6.length >= 6) return;
          genutzt[p.id] = true; kats[p.kat[0]] = true; kacheln6.push(p);
        });
      });
      html = kacheln6.slice(0, 6).map(function (p, i) {
        var k = hauptKat(p);
        var fotos = [p.bild].concat(fotoProdukte(function (q) { return q.id !== p.id && !genutzt[q.id] && q.kat[0] === p.kat[0] && !q.ab18; }, 2).map(function (q) { return q.bild; }));
        var text = istBest(p) ? "👑 Bestseller" : (p.neu ? "✨ Neu · " : k.emoji + " ") + k.name;
        return '<a class="social-kachel" href="/produkt.html?id=' + encodeURIComponent(p.id) + '" style="--i:' + i + '">' +
          rotorHtml(fotos, "social-kachel__bild") + '<span class="social-kachel__ig" aria-hidden="true"></span>' +
          '<span class="social-kachel__text">' + esc(text) + "</span></a>";
      }).join("");
    }
    box.innerHTML = html;
    rotorAnmelden(box);
    var ig = (S.instagram || "").replace(/^@/, ""), tt = (S.tiktok || "").replace(/^@/, "");
    var igK = document.getElementById("igFolgen"), ttK = document.getElementById("ttFolgen"), bald = document.getElementById("socialBald");
    if (igK && ig) { igK.href = "https://instagram.com/" + ig; igK.textContent = "📸 @" + ig + " auf Instagram"; igK.hidden = false; }
    if (ttK && tt) { ttK.href = "https://www.tiktok.com/@" + tt; ttK.textContent = "🎵 @" + tt + " auf TikTok"; ttK.hidden = false; }
    if (bald && (ig || tt)) bald.hidden = true;
  }

  function start() {
    window.ZBShop.daten().then(function (d) {
      PREIS = d.preise || {}; OHNE_PREIS_WEG = !!d.ohnePreisAusblenden; FOLGT = window.ZBShop.folgtText(d);
      ANGEBOT = {}; (d.angebote || []).forEach(function (a) { ANGEBOT[a.id] = a; });
      zeichneAlles();
    });
  }
  function zeichneAlles() {
    document.querySelectorAll("[data-kat-kacheln]").forEach(kacheln);
    promoFotos();
    document.querySelectorAll("[data-social]").forEach(socialWand);
    document.querySelectorAll('[data-katalog="vorschau"]').forEach(vorschau);
    document.querySelectorAll('[data-katalog="voll"]').forEach(voll);
    var stand = document.getElementById("sortimentStand");
    if (stand && typeof SORTIMENT_STAND !== "undefined") stand.textContent = SORTIMENT_STAND;
    var gesamt = document.querySelectorAll("[data-produktzahl]");
    gesamt.forEach(function (el) { el.textContent = LISTE.length; });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
