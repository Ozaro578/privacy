(function () {
  "use strict";

  /* ---------- Speicher-Helfer (funktioniert auch im privaten Modus) ---------- */
  const AGE_KEY = "lokum_age_ok";
  const store = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignorieren */ } },
    del(k) { try { window.localStorage.removeItem(k); } catch (e) { /* ignorieren */ } }
  };

  /* ---------- Altersabfrage ---------- */
  const gate = document.getElementById("ageGate");
  const body = document.body;

  function unlock() {
    gate.classList.add("is-hidden");
    body.classList.remove("gate-locked");
  }
  function lock() {
    gate.classList.remove("is-hidden");
    body.classList.add("gate-locked");
    document.getElementById("ageDenied").hidden = true;
    document.getElementById("ageYes").focus();
  }

  if (store.get(AGE_KEY) === "1") unlock();
  else document.getElementById("ageYes").focus();

  document.getElementById("ageYes").addEventListener("click", function () {
    store.set(AGE_KEY, "1");
    unlock();
  });
  document.getElementById("ageNo").addEventListener("click", function () {
    document.getElementById("ageDenied").hidden = false;
  });
  document.getElementById("resetAge").addEventListener("click", function () {
    store.del(AGE_KEY);
    lock();
  });

  /* ---------- Mobile Navigation ---------- */
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("nav");
  toggle.addEventListener("click", function () {
    const open = nav.classList.toggle("is-open");
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      nav.classList.remove("is-open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- Kontaktdaten aus SHOP einsetzen ---------- */
  const S = typeof SHOP === "object" ? SHOP : {};
  const waNumber = (S.whatsapp || "").replace(/\D/g, "");

  function waHref(text) {
    return waNumber ? "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(text) : "#kontakt";
  }
  function setText(key, value) {
    if (!value) return;
    document.querySelectorAll('[data-shop="' + key + '"]').forEach(function (el) { el.textContent = value; });
  }
  function setLink(id, href) {
    const el = document.getElementById(id);
    if (!el) return;
    if (href) { el.href = href; }
    else { el.removeAttribute("target"); el.classList.add("is-soon"); }
  }

  setLink("waLink", waNumber ? waHref("Hallo Lokum Brüder! Ich habe eine Frage.") : "");
  setText("whatsappLabel", waNumber ? "+" + waNumber : "");
  setLink("igLink", S.instagram ? "https://instagram.com/" + S.instagram.replace(/^@/, "") : "");
  setText("instagramLabel", S.instagram ? "@" + S.instagram.replace(/^@/, "") : "");
  setLink("ttLink", S.tiktok ? "https://www.tiktok.com/@" + S.tiktok.replace(/^@/, "") : "");
  setText("tiktokLabel", S.tiktok ? "@" + S.tiktok.replace(/^@/, "") : "");
  setLink("mailLink", S.email ? "mailto:" + S.email : "");
  setText("email", S.email);
  setText("address", S.address);
  setText("hours", S.hours);

  /* ---------- Produkte ---------- */
  const list = Array.isArray(typeof PRODUKTE !== "undefined" ? PRODUKTE : null) ? PRODUKTE : [];
  const grid = document.getElementById("products");
  const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function card(p, i) {
    const price = typeof p.preis === "number"
      ? '<span class="price">' + euro.format(p.preis) + "</span>"
      : '<span class="price price--open">Preis auf Anfrage</span>';
    const badge = p.badge ? '<span class="badge">' + esc(p.badge) + "</span>" : "";
    const age = p.ab18 ? '<span class="badge badge--18">18+</span>' : "";
    const href = waNumber ? waHref("Hallo! Ich interessiere mich für: " + p.name) : "#kontakt";
    const target = waNumber ? ' target="_blank" rel="noopener"' : "";
    return (
      '<article class="product product--' + esc(p.farbe || "pink") + '" data-cat="' + esc(p.kategorie) + '" style="--i:' + i + '">' +
        '<div class="product__art"><span class="product__emoji" aria-hidden="true">' + esc(p.emoji || "🍬") + "</span>" + badge + age + "</div>" +
        '<div class="product__body">' +
          "<h3>" + esc(p.name) + "</h3>" +
          "<p>" + esc(p.text) + "</p>" +
          '<div class="product__foot">' + price +
            '<a class="product__ask" href="' + href + '"' + target + ' aria-label="' + esc(p.name) + ' anfragen">Anfragen →</a>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function render(filter) {
    const items = list.filter(function (p) { return filter === "alle" || p.kategorie === filter; });
    grid.innerHTML = items.length
      ? items.map(card).join("")
      : '<p class="products__empty">Hier kommt bald was Leckeres rein! 🍬</p>';
  }

  const chips = document.querySelectorAll("#filters .chip");
  function setFilter(f) {
    chips.forEach(function (c) {
      const on = c.dataset.filter === f;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-selected", String(on));
    });
    render(f);
  }
  chips.forEach(function (c) {
    c.addEventListener("click", function () { setFilter(c.dataset.filter); });
  });
  document.querySelectorAll("[data-jump]").forEach(function (a) {
    a.addEventListener("click", function () { setFilter(a.dataset.jump); });
  });
  render("alle");

  /* ---------- Einblend-Animationen ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Header beim Scrollen ---------- */
  const header = document.querySelector(".header");
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 20); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  document.getElementById("year").textContent = new Date().getFullYear();
})();
