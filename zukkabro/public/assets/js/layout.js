/* =========================================================
   ZUKKABRO – gemeinsamer Rahmen für alle Seiten
   Kopfzeile, Menü, Fußzeile, Altersabfrage, Lade-Animation.
   Menüpunkte hier ändern, dann gilt es überall.
   ========================================================= */
(function () {
  "use strict";

  var MENUE = [
    { id: "start",     href: "/",                 text: "Start" },
    { id: "sortiment", href: "/sortiment.html",   text: "Sortiment" },
    { id: "vapes",     href: "/vapes.html",       text: "Vapes 18+" },
    { id: "ueber-uns", href: "/ueber-uns.html",   text: "Über uns" },
    { id: "haendler",  href: "/haendler/",        text: "Für Händler" },
    { id: "kontakt",   href: "/kontakt.html",     text: "Kontakt", cta: true }
  ];

  var seite = document.body.getAttribute("data-seite") || "";

  var store = {
    get: function (k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
    set: function (k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (e) { /* egal */ } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* egal */ } }
  };

  var KRONE = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    '<linearGradient id="g-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0a8"/><stop offset=".35" stop-color="#f2c14e"/><stop offset=".7" stop-color="#d4952a"/><stop offset="1" stop-color="#9c6414"/></linearGradient>' +
    '<radialGradient id="g-ball" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="#fff6c8"/><stop offset=".45" stop-color="#f0b93f"/><stop offset="1" stop-color="#9c6414"/></radialGradient>' +
    '<symbol id="crown" viewBox="-20 -24 260 160">' +
    '<path d="M8,104 L0,38 L40,72 L60,16 L88,66 L110,0 L132,66 L160,16 L180,72 L220,38 L212,104 Z" fill="url(#g-gold)" stroke="#4a2608" stroke-width="7" stroke-linejoin="round"/>' +
    '<rect x="2" y="96" width="216" height="30" rx="10" fill="url(#g-gold)" stroke="#4a2608" stroke-width="7"/>' +
    '<ellipse cx="60" cy="111" rx="10" ry="7" fill="#ff2e98" stroke="#4a2608" stroke-width="3"/>' +
    '<ellipse cx="110" cy="111" rx="12" ry="8" fill="#1ea4f0" stroke="#4a2608" stroke-width="3"/>' +
    '<ellipse cx="160" cy="111" rx="10" ry="7" fill="#9b4dff" stroke="#4a2608" stroke-width="3"/>' +
    '<g stroke="#4a2608" stroke-width="5" fill="url(#g-ball)"><circle cx="0" cy="36" r="13"/><circle cx="60" cy="14" r="13"/><circle cx="110" cy="-2" r="15"/><circle cx="160" cy="14" r="13"/><circle cx="220" cy="36" r="13"/></g>' +
    '</symbol></defs></svg>';

  function kopf() {
    var links = MENUE.map(function (m) {
      var cls = (m.cta ? "nav__cta" : "") + (m.id === seite ? " is-active" : "");
      return '<a href="' + m.href + '"' + (cls.trim() ? ' class="' + cls.trim() + '"' : "") + (m.id === seite ? ' aria-current="page"' : "") + ">" + m.text + "</a>";
    }).join("");
    return KRONE +
      '<div class="loader" id="loader" aria-hidden="true"><div class="loader__crowns">' +
        new Array(6).join('<svg><use href="#crown"/></svg>') +
      "</div></div>" +
      '<div class="age-gate" id="ageGate" role="dialog" aria-modal="true" aria-labelledby="ageGateTitle">' +
        '<div class="age-gate__card">' +
          '<img class="age-gate__logo" src="/assets/img/logo.png" data-fallback="/assets/img/logo.svg" alt="ZUKKABRO">' +
          '<div class="badge18 slot" data-slot-box><img data-slot src="/assets/img/badge-18.png" alt="Nur ab 18"><span class="slot__fallback badge18__fb" aria-hidden="true">18+</span></div>' +
          '<h2 id="ageGateTitle">Bist du 18 Jahre oder älter?</h2>' +
          "<p>Unser Sortiment enthält Produkte, die laut Jugendschutzgesetz nur an Erwachsene abgegeben werden dürfen, zum Beispiel E-Zigaretten und Liquids.</p>" +
          '<div class="age-gate__actions"><button class="btn btn--pink" id="ageYes" type="button">Ja, ich bin 18+</button><button class="btn btn--light" id="ageNo" type="button">Nein</button></div>' +
          '<p class="age-gate__denied" id="ageDenied" hidden>Sorry, Bro! Diese Seite ist nur für Erwachsene ab 18 Jahren. Komm wieder, wenn du volljährig bist. 👑</p>' +
          '<p class="age-gate__small">Bei Abholung und Lieferung wird das Alter kontrolliert.</p>' +
        "</div>" +
      "</div>" +
      '<header class="header" id="top"><div class="container header__inner">' +
        '<a href="/" class="logo" aria-label="ZUKKABRO Startseite"><img src="/assets/img/logo-klein.png" data-fallback="/assets/img/logo-quer.svg" alt="ZUKKABRO" width="190" height="50"></a>' +
        '<button class="nav-toggle" id="navToggle" aria-label="Menü öffnen" aria-expanded="false" aria-controls="nav"><span></span><span></span><span></span></button>' +
        '<nav class="nav" id="nav" aria-label="Hauptmenü">' + links + "</nav>" +
      "</div></header>";
  }

  function fuss() {
    return '<footer class="footer"><div class="container footer__inner">' +
        '<div><a href="/" class="footer__logo"><img src="/assets/img/logo-klein.png" data-fallback="/assets/img/logo-quer.svg" alt="ZUKKABRO" width="220" height="58" loading="lazy"></a>' +
        '<p class="footer__note">🔞 Diese Website richtet sich ausschließlich an Personen ab 18 Jahren. Keine Abgabe von E-Zigaretten, Liquids und Tabakwaren an Minderjährige.</p></div>' +
        '<nav class="footer__links" aria-label="Weitere Seiten">' +
          '<a href="/sortiment.html">Sortiment</a><a href="/kontakt.html">Kontakt</a>' +
          '<a href="/rechtliches.html#impressum">Impressum</a><a href="/rechtliches.html#datenschutz">Datenschutz</a>' +
          '<a href="/admin/">Admin-Login</a>' +
          '<button type="button" class="linklike" id="resetAge">Altersabfrage erneut anzeigen</button>' +
        "</nav></div>" +
        '<p class="footer__copy">© <span id="year">2026</span> ZUKKABRO. Alle Rechte vorbehalten.</p></footer>';
  }

  /* ---------- Kopf sofort einsetzen (Skript steht direkt nach #layout-oben) ---------- */
  var oben = document.getElementById("layout-oben");
  if (oben) oben.outerHTML = kopf();

  /* ---------- Lade-Animation nur beim ersten Seitenaufruf pro Sitzung ---------- */
  var loader = document.getElementById("loader");
  function hideLoader() { if (loader) loader.classList.add("is-done"); }
  if (store.get("zb_loaded", true)) { hideLoader(); }
  else {
    store.set("zb_loaded", "1", true);
    window.addEventListener("load", function () { setTimeout(hideLoader, 300); });
    setTimeout(hideLoader, 2500);
  }

  /* ---------- Altersabfrage ---------- */
  var AGE_KEY = "zukkabro_age_ok";
  var gate = document.getElementById("ageGate");
  function unlock() { gate.classList.add("is-hidden"); document.body.classList.remove("gate-locked"); }
  function lock() {
    gate.classList.remove("is-hidden"); document.body.classList.add("gate-locked");
    document.getElementById("ageDenied").hidden = true; document.getElementById("ageYes").focus();
  }
  if (store.get(AGE_KEY) === "1") unlock(); else document.body.classList.add("gate-locked");
  document.getElementById("ageYes").addEventListener("click", function () { store.set(AGE_KEY, "1"); unlock(); });
  document.getElementById("ageNo").addEventListener("click", function () { document.getElementById("ageDenied").hidden = false; });

  /* ---------- Menü (Handy) ---------- */
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("nav");
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });

  /* ---------- Header beim Scrollen ---------- */
  var header = document.querySelector(".header");
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 20); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Rest nach dem Laden der Seite ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var unten = document.getElementById("layout-unten");
    if (unten) unten.outerHTML = fuss();
    document.getElementById("year").textContent = new Date().getFullYear();
    document.getElementById("resetAge").addEventListener("click", function () { store.del(AGE_KEY); lock(); });

    /* Kontaktdaten aus shop.js */
    var S = typeof SHOP === "object" ? SHOP : {};
    var wa = (S.whatsapp || "").replace(/\D/g, "");
    window.ZB_WA = wa;
    function setText(key, value) {
      if (!value) return;
      document.querySelectorAll('[data-shop="' + key + '"]').forEach(function (el) { el.textContent = value; });
    }
    function setLink(id, href) {
      var el = document.getElementById(id);
      if (!el) return;
      if (href) el.href = href; else { el.removeAttribute("target"); el.classList.add("is-soon"); }
    }
    var ig = (S.instagram || "").replace(/^@/, ""), tt = (S.tiktok || "").replace(/^@/, "");
    setLink("waLink", wa ? "https://wa.me/" + wa + "?text=" + encodeURIComponent("Hallo ZUKKABRO! Ich habe eine Frage.") : "");
    setText("whatsappLabel", wa ? "+" + wa : "");
    setLink("igLink", ig ? "https://instagram.com/" + ig : "");
    setText("instagramLabel", ig ? "@" + ig : "");
    setLink("ttLink", tt ? "https://www.tiktok.com/@" + tt : "");
    setText("tiktokLabel", tt ? "@" + tt : "");
    setLink("mailLink", S.email ? "mailto:" + S.email : "");
    setText("email", S.email); setText("address", S.address); setText("hours", S.hours); setText("shipping", S.shipping);

    /* Einblend-Animationen */
    var reveals = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } });
      }, { threshold: 0.1 });
      reveals.forEach(function (el) { io.observe(el); });
    } else reveals.forEach(function (el) { el.classList.add("is-visible"); });
  });
})();
