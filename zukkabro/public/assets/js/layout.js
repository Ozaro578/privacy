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
    { id: "pakete",    href: "/pakete.html",      text: "Pakete" },
    { id: "laden",     href: "/laden.html",       text: "🍵 Matcha & Açaí" },
    { id: "vapes",     href: "/vapes.html",       text: "Vapes 18+" },
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
      '<div class="topbar"><div class="container topbar__inner">' +
        '<span id="topbarVv" hidden>🎉 <b data-eroeffnung></b></span>' +
        '<span>🚚 Versand in 3 Werktagen</span>' +
        '<span>📍 Laden in Heilbronn: Matcha &amp; Açaí am Wochenende</span>' +
        '<span id="topbarFrei" hidden>📦 Versandkostenfrei ab <b data-versandfrei></b></span>' +
        '<span>🔞 Nur für Erwachsene ab 18</span>' +
      "</div></div>" +
      '<header class="header" id="top"><div class="container header__inner">' +
        '<a href="/" class="logo" aria-label="ZUKKABRO Startseite"><img src="/assets/img/logo-klein.png" data-fallback="/assets/img/logo-quer.svg" alt="ZUKKABRO" width="190" height="50"></a>' +
        '<a class="korb-knopf" href="/warenkorb.html" aria-label="Warenkorb"><span aria-hidden="true">🛒</span><span class="korb-zahl" id="korbZahl" hidden>0</span></a>' +
        '<button class="nav-toggle" id="navToggle" aria-label="Menü öffnen" aria-expanded="false" aria-controls="nav"><span></span><span></span><span></span></button>' +
        '<nav class="nav" id="nav" aria-label="Hauptmenü">' + links + "</nav>" +
      "</div></header>";
  }

  function fuss() {
    return '<footer class="footer"><div class="container footer__inner">' +
        '<div class="footer__marke"><a href="/" class="footer__logo"><img src="/assets/img/logo-klein.png" data-fallback="/assets/img/logo-quer.svg" alt="ZUKKABRO" width="220" height="58"></a>' +
          '<p class="footer__note">Internationale Snacks, Candy, Drinks und mehr. Versand in 3 Werktagen oder Abholung in Heilbronn.</p>' +
          '<div class="footer__social" id="footerSocial"></div></div>' +
        '<nav class="footer__spalte" aria-label="Shop"><h3>Shop</h3>' +
          '<a href="/sortiment.html">Sortiment</a><a href="/sortiment.html?kat=neu">Neu im Regal</a><a href="/pakete.html">Themen-Pakete</a><a href="/laden.html">Laden in Heilbronn</a><a href="/stempelkarte.html">Stempelkarte</a><a href="/news.html">News</a><a href="/vapes.html">Vapes 18+</a><a href="/warenkorb.html">Warenkorb</a>' +
        "</nav>" +
        '<nav class="footer__spalte" aria-label="Service"><h3>Service</h3>' +
          '<a href="/kontakt.html">Kontakt</a><a href="/kontakt.html#versand">Versand &amp; Abholung</a><a href="/haendler/">Für Händler</a><a href="/ueber-uns.html">Über uns</a>' +
        "</nav>" +
        '<nav class="footer__spalte" aria-label="Rechtliches"><h3>Rechtliches</h3>' +
          '<a href="/rechtliches.html#impressum">Impressum</a><a href="/rechtliches.html#datenschutz">Datenschutz</a><a href="/rechtliches.html#agb">AGB</a><a href="/rechtliches.html#widerruf">Widerruf</a>' +
          '<button type="button" class="linklike" id="resetAge">Altersabfrage erneut anzeigen</button>' +
          '<button type="button" class="linklike" id="appLink" hidden>📲 Als App installieren</button>' +
        "</nav></div>" +
        '<div class="container footer__unten">' +
          '<p class="footer__jugend">🔞 Diese Website richtet sich ausschließlich an Personen ab 18 Jahren. Keine Abgabe von E-Zigaretten, Liquids und Tabakwaren an Minderjährige.</p>' +
          '<p class="footer__copy">© <span id="year">2026</span> ZUKKABRO. Alle Rechte vorbehalten. · <a href="/admin/">Admin</a></p>' +
        "</div></footer>";
  }

  /* ---------- Warenkorb (im Browser gespeichert) ---------- */
  var KORB_KEY = "zb_warenkorb";
  window.ZBKorb = {
    alle: function () { try { var k = JSON.parse(localStorage.getItem(KORB_KEY) || "{}"); return k && typeof k === "object" ? k : {}; } catch (e) { return {}; } },
    speichern: function (k) { try { localStorage.setItem(KORB_KEY, JSON.stringify(k)); } catch (e) { /* egal */ } window.dispatchEvent(new Event("zb-korb")); },
    setze: function (id, menge) { var k = this.alle(); menge = Math.max(0, Math.min(999, menge | 0)); if (menge) k[id] = menge; else delete k[id]; this.speichern(k); },
    dazu: function (id, menge) { var k = this.alle(); this.setze(id, (k[id] || 0) + (menge || 1)); if (window.ZBKorbLade) window.ZBKorbLade.oeffnen(id); },
    anzahl: function () { var k = this.alle(); return Object.keys(k).reduce(function (a, id) { return a + k[id]; }, 0); },
    leeren: function () { this.speichern({}); }
  };

  /* ---------- Shop-Daten (Endkundenpreise, Versand) vom Server, einmal pro Seite ---------- */
  var shopVersprechen = null;
  window.ZBShop = {
    daten: function () {
      if (!shopVersprechen) {
        shopVersprechen = fetch("/api/shop/daten", { credentials: "same-origin" })
          .then(function (r) { return r.ok ? r.json() : null; })
          .catch(function () { return null; })
          .then(function (d) { return d || { preise: {}, versand: { kosten: 0, freiAb: 0, abholung: false }, zahlarten: [], ohnePreisAusblenden: false, vorverkauf: { aktiv: false, text: "" } }; });
      }
      return shopVersprechen;
    },
    euro: function (cent) { return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format((cent || 0) / 100); },
    /** Text statt Preis: vor der Eröffnung anders als bei einem einzelnen Artikel ohne Preis */
    folgtText: function (d) { return d && d.vorverkauf && d.vorverkauf.aktiv ? "Preis folgt zur Eröffnung" : "Preis folgt"; },
    /** Grundpreis nach Preisangabenverordnung aus dem Produktnamen ("… 50 g", "12 × 330 ml"), leer wenn keine Menge erkennbar */
    grundpreis: function (name, cent) {
      if (typeof cent !== "number" || !name) return "";
      var m = /(?:(\d+)\s?[x×]\s?)?(\d+(?:[.,]\d+)?)\s?(kg|g|ml|l)\b/i.exec(name);
      if (!m) return "";
      var menge = parseFloat(m[2].replace(",", ".")) * (m[1] ? parseInt(m[1], 10) : 1), einheit = m[3].toLowerCase();
      if (!(menge > 0)) return "";
      if (einheit === "kg") { menge *= 1000; einheit = "g"; }
      if (einheit === "l") { menge *= 1000; einheit = "ml"; }
      var basis = menge > 250 ? 1000 : 100, label = basis === 1000 ? (einheit === "g" ? "1 kg" : "1 l") : "100 " + einheit;
      return '<small class="grundpreis">(' + window.ZBShop.euro(Math.round(cent / menge * basis)) + "/" + label + ")</small>";
    }
  };

  /* ---------- Mini-Warenkorb (Schublade rechts, öffnet sich beim "In den Korb") ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var lade = null;
  function ladeBauen() {
    lade = document.createElement("div"); lade.className = "korb-lade"; lade.id = "korbLade"; lade.hidden = true;
    lade.innerHTML = '<div class="korb-lade__hinter" data-korb-zu></div>' +
      '<aside class="korb-lade__box" role="dialog" aria-modal="true" aria-label="Warenkorb">' +
        '<header class="korb-lade__kopf"><h2>🛒 Dein Warenkorb</h2><button type="button" class="korb-lade__zu" data-korb-zu aria-label="Schließen">✕</button></header>' +
        '<div class="korb-lade__liste" id="korbLadeListe"></div>' +
        '<footer class="korb-lade__fuss"><p class="korb-lade__summe"><span>Warenwert</span><b id="korbLadeSumme">0,00 €</b></p>' +
          '<a class="btn btn--pink" href="/warenkorb.html">Zum Warenkorb →</a><button type="button" class="btn btn--light" data-korb-zu>Weiter shoppen</button></footer>' +
      "</aside>";
    document.body.appendChild(lade);
    lade.addEventListener("click", function (e) {
      if (e.target.closest("[data-korb-zu]")) return ladeZu();
      var w = e.target.closest("[data-lade-weg]");
      if (w) { window.ZBKorb.setze(w.getAttribute("data-lade-weg"), 0); return ladeZeichnen(); }
      var m = e.target.closest("[data-lade-menge]");
      if (m) { var t = m.getAttribute("data-lade-menge").split("|"), k = window.ZBKorb.alle(); window.ZBKorb.setze(t[0], (k[t[0]] || 0) + parseInt(t[1], 10)); return ladeZeichnen(); }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lade.hidden) ladeZu(); });
  }
  function ladeZu() {
    if (!lade) return;
    lade.classList.remove("is-offen");
    setTimeout(function () { lade.hidden = true; document.body.classList.remove("lade-offen"); }, 250);
  }
  function ladeZeichnen(neuId) {
    window.ZBShop.daten().then(function (d) {
      var k = window.ZBKorb.alle(), summe = 0, offen = false, PROD = {};
      if (typeof PRODUKTE !== "undefined") PRODUKTE.forEach(function (p) { PROD[p.id] = p; });
      var html = Object.keys(k).map(function (id) {
        var name, bild = "", preis;
        if (id.indexOf("paket:") === 0) {
          var pk = (d.pakete || []).filter(function (x) { return x.id === id.slice(6); })[0];
          name = pk ? "🎁 Paket: " + pk.name : "Paket"; preis = pk ? pk.preis : undefined;
          var erstes = pk && pk.inhalt.map(function (i) { return PROD[i.id]; }).filter(function (p) { return p && p.bild; })[0];
          if (erstes) bild = erstes.bild;
        } else {
          var p = PROD[id]; name = p ? p.name : "Artikel"; bild = p && p.bild ? p.bild : ""; preis = (d.preise || {})[id];
        }
        var hat = typeof preis === "number";
        if (hat) summe += preis * k[id]; else offen = true;
        return '<div class="korb-lade__artikel' + (id === neuId ? " is-neu" : "") + '">' +
          (bild ? '<img src="/' + esc(bild) + '" alt="">' : '<span class="korb-lade__leer" aria-hidden="true">🍬</span>') +
          '<div><p class="korb-lade__name">' + esc(name) + '</p><p class="korb-lade__preis">' + (hat ? window.ZBShop.euro(preis * k[id]) : "Preis folgt") + "</p>" +
          '<div class="korb-lade__menge"><button type="button" data-lade-menge="' + esc(id) + '|-1" aria-label="Weniger">−</button><span>' + k[id] + '</span><button type="button" data-lade-menge="' + esc(id) + '|1" aria-label="Mehr">+</button></div></div>' +
          '<button type="button" class="korb-lade__weg" data-lade-weg="' + esc(id) + '" aria-label="Entfernen">✕</button></div>';
      }).join("");
      document.getElementById("korbLadeListe").innerHTML = html || '<p class="korb-lade__nichts">Dein Warenkorb ist noch leer.</p>';
      document.getElementById("korbLadeSumme").textContent = window.ZBShop.euro(summe) + (offen ? " + offene Preise" : "");
    });
  }
  window.ZBKorbLade = {
    oeffnen: function (neuId) {
      if (!lade) ladeBauen();
      ladeZeichnen(neuId);
      lade.hidden = false; document.body.classList.add("lade-offen");
      requestAnimationFrame(function () { lade.classList.add("is-offen"); });
    },
    schliessen: ladeZu
  };

  /* ---------- Kurze Meldung ---------- */
  window.ZBToast = function (text, fehler) {
    if (!fehler && lade && !lade.hidden) return; // Mini-Warenkorb zeigt es schon
    var box = document.getElementById("toast");
    if (!box) { box = document.createElement("div"); box.id = "toast"; box.setAttribute("role", "status"); document.body.appendChild(box); }
    var el = document.createElement("div");
    el.className = "toast" + (fehler ? " toast--fehler" : "");
    el.textContent = text; box.appendChild(el);
    setTimeout(function () { el.classList.add("weg"); setTimeout(function () { el.remove(); }, 400); }, fehler ? 6000 : 2600);
  };

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

  /* ---------- Warenkorb-Zähler ---------- */
  function korbZaehler() {
    var n = window.ZBKorb.anzahl(), el = document.getElementById("korbZahl");
    if (!el) return;
    el.textContent = n > 99 ? "99+" : n; el.hidden = !n;
  }
  window.addEventListener("zb-korb", korbZaehler);
  window.addEventListener("storage", function (e) { if (e.key === KORB_KEY) korbZaehler(); });
  korbZaehler();

  /* ---------- Header beim Scrollen ---------- */
  var header = document.querySelector(".header");
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 20); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- App: Service Worker und Installation (PWA) ---------- */
  var installPrompt = null;
  var istApp = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  var istIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  if ("serviceWorker" in navigator && location.protocol === "https:" && seite !== "admin" && seite !== "haendler") {
    window.addEventListener("load", function () { navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then(function (r) { r.update(); }).catch(function () { /* ohne App-Funktionen weiter */ }); });
    // Neue Version übernommen: einmal neu laden, damit Styles und Skripte zusammenpassen
    var hatteController = !!navigator.serviceWorker.controller, neuGeladen = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () { if (hatteController && !neuGeladen) { neuGeladen = true; location.reload(); } });
  }
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); installPrompt = e; appKnoepfe(); });
  window.addEventListener("appinstalled", function () { installPrompt = null; store.set("zb_app_installiert", "1"); appKnoepfe(); });
  function appInstallieren() {
    if (installPrompt) { installPrompt.prompt(); installPrompt.userChoice.then(function () { installPrompt = null; appKnoepfe(); }); return; }
    window.ZBToast(istIos ? "Safari: Teilen-Symbol antippen → „Zum Home-Bildschirm“." : "Browser-Menü (⋮) öffnen → „App installieren“ oder „Zum Startbildschirm“.");
  }
  function appKnoepfe() {
    var link = document.getElementById("appLink"), knopf = document.getElementById("appInstallieren"), anleitung = document.getElementById("appAnleitung");
    var zeigen = !istApp && !store.get("zb_app_installiert");
    if (link) link.hidden = !zeigen;
    if (knopf) knopf.hidden = !zeigen;
    if (anleitung) anleitung.textContent = istApp ? "✅ Du nutzt schon die App." : istIos ? "iPhone/iPad: In Safari auf „Teilen“ tippen, dann „Zum Home-Bildschirm“." : installPrompt ? "" : "Android/Chrome: Menü (⋮) öffnen, dann „App installieren“.";
  }
  window.ZBApp = { installieren: appInstallieren };

  /* ---------- Rest nach dem Laden der Seite ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var unten = document.getElementById("layout-unten");
    if (unten) unten.outerHTML = fuss();
    document.getElementById("year").textContent = new Date().getFullYear();
    document.getElementById("resetAge").addEventListener("click", function () { store.del(AGE_KEY); lock(); });
    appKnoepfe();
    document.querySelectorAll("#appLink, #appInstallieren").forEach(function (el) { el.addEventListener("click", appInstallieren); });

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
    var fb = (S.facebook || "").trim();
    setLink("fbLink", fb);
    setText("facebookLabel", fb ? "ZUKKABRO" : "");
    setLink("mailLink", S.email ? "mailto:" + S.email : "");
    var tel = (S.telefon || "").trim();
    setLink("telLink", tel ? "tel:" + tel.replace(/[^\d+]/g, "") : "");
    setText("telefon", tel);
    setText("email", S.email); setText("address", S.address); setText("hours", S.hours); setText("shipping", S.shipping);
    var kanal = (S.whatsappKanal || "").trim();
    var kanalBox = document.getElementById("kanalBox");
    if (kanalBox) kanalBox.hidden = !kanal;
    setLink("kanalLink", kanal);
    var social = document.getElementById("footerSocial");
    if (social) {
      var s = [];
      if (kanal) s.push('<a href="' + esc(kanal) + '" target="_blank" rel="noopener">WhatsApp-Kanal</a>');
      if (ig) s.push('<a href="https://instagram.com/' + ig + '" target="_blank" rel="noopener">Instagram</a>');
      if (tt) s.push('<a href="https://www.tiktok.com/@' + tt + '" target="_blank" rel="noopener">TikTok</a>');
      if (fb) s.push('<a href="' + esc(fb) + '" target="_blank" rel="noopener">Facebook</a>');
      if (wa) s.push('<a href="https://wa.me/' + wa + '" target="_blank" rel="noopener">WhatsApp</a>');
      social.innerHTML = s.join("");
    }
    /* WhatsApp-Knopf unten links, sobald eine Nummer in shop.js steht */
    if (wa && seite !== "admin" && seite !== "haendler") {
      var fab = document.createElement("a");
      fab.className = "wa-fab"; fab.href = "https://wa.me/" + wa + "?text=" + encodeURIComponent("Hallo ZUKKABRO! Ich habe eine Frage.");
      fab.target = "_blank"; fab.rel = "noopener"; fab.setAttribute("aria-label", "Per WhatsApp schreiben");
      fab.innerHTML = '<span aria-hidden="true">💬</span><span>WhatsApp</span>';
      document.body.appendChild(fab);
    }

    /* Versandkostenfrei-Grenze und Eröffnungshinweis in die obere Leiste */
    window.ZBShop.daten().then(function (d) {
      var frei = d && d.versand && d.versand.freiAb, el = document.getElementById("topbarFrei");
      var vv = d && d.vorverkauf && d.vorverkauf.aktiv, elVv = document.getElementById("topbarVv");
      if (vv) {
        document.body.classList.add("is-vorverkauf");
        if (elVv) { elVv.querySelector("[data-eroeffnung]").textContent = "Eröffnung " + (d.vorverkauf.text || "bald") + " · Preise & Online-Bestellung folgen"; elVv.hidden = false; }
      } else if (el && frei > 0) { el.querySelector("[data-versandfrei]").textContent = window.ZBShop.euro(frei); el.hidden = false; }
    });

    /* App-Leiste unten, wenn die Seite als App (vom Startbildschirm) läuft: gleicher Shop, gleiche Bestellung, nur handlicher */
    if (istApp && seite !== "admin" && seite !== "haendler") {
      document.body.classList.add("is-app");
      var leiste = document.createElement("nav");
      leiste.className = "app-leiste"; leiste.setAttribute("aria-label", "App-Menü");
      leiste.innerHTML = [
        { id: "start", href: "/", icon: "🏠", text: "Start" }, { id: "sortiment", href: "/sortiment.html", icon: "🍬", text: "Shop" },
        { id: "laden", href: "/laden.html", icon: "🍵", text: "Laden" }, { id: "news", href: "/news.html", icon: "📰", text: "News" },
        { id: "warenkorb", href: "/warenkorb.html", icon: "🛒", text: "Korb", korb: true }
      ].map(function (m) {
        return '<a href="' + m.href + '"' + (m.id === seite ? ' class="is-active" aria-current="page"' : "") + '><span class="app-leiste__icon" aria-hidden="true">' + m.icon +
          (m.korb ? '<span class="app-leiste__zahl" id="appKorbZahl" hidden>0</span>' : "") + "</span>" + m.text + "</a>";
      }).join("");
      document.body.appendChild(leiste);
      var appZahl = function () { var n = window.ZBKorb.anzahl(), z = document.getElementById("appKorbZahl"); if (z) { z.textContent = n > 99 ? "99+" : n; z.hidden = !n; } };
      window.addEventListener("zb-korb", appZahl); appZahl();
    }

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
