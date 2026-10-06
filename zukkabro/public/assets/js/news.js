/* =========================================================
   ZUKKABRO – News: Startseite (die letzten 3) und News-Seite (alle).
   Daten aus dem Admin-Bereich (Reiter "News") über /api/shop/news.
   ========================================================= */
(function () {
  "use strict";
  var boxen = document.querySelectorAll("[data-news]");
  if (!boxen.length) return;
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var MONATE = ["Jan", "Feb", "März", "Apr", "Mai", "Juni", "Juli", "Aug", "Sep", "Okt", "Nov", "Dez"];
  function datum(iso) { var t = (iso || "").split("-"); return t.length === 3 ? parseInt(t[2], 10) + ". " + MONATE[parseInt(t[1], 10) - 1] + " " + t[0] : ""; }
  function karte(n, i) {
    var extern = /^https?:/.test(n.link || "");
    var inhalt = '<time datetime="' + esc(n.datum) + '">' + esc(datum(n.datum)) + "</time><h3>" + esc(n.titel) + "</h3>" +
      (n.text ? '<p>' + esc(n.text).replace(/\n/g, "<br>") + "</p>" : "") + (n.link ? '<span class="news-karte__link">' + (extern ? "Mehr erfahren ↗" : "Ansehen →") + "</span>" : "");
    return n.link
      ? '<a class="news-karte" href="' + esc(n.link) + '"' + (extern ? ' target="_blank" rel="noopener"' : "") + ' style="--i:' + i + '">' + inhalt + "</a>"
      : '<article class="news-karte" style="--i:' + i + '">' + inhalt + "</article>";
  }
  fetch("/api/shop/news", { credentials: "same-origin" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; })
    .then(function (d) {
      var liste = (d && d.news) || [];
      boxen.forEach(function (box) {
        var limit = parseInt(box.getAttribute("data-limit") || "3", 10);
        var teil = liste.slice(0, limit);
        if (!teil.length) {
          var abschnitt = box.closest("[data-news-abschnitt]");
          if (abschnitt) { abschnitt.hidden = true; return; }
          box.innerHTML = '<p class="news-leer">Noch keine News. Bald geht\'s los!</p>';
          return;
        }
        box.innerHTML = teil.map(karte).join("");
      });
    });
})();
