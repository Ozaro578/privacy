/* =========================================================
   ZUKKABRO – Laden-Seite: Öffnungszeiten, Adresse, Karte (Matcha & Açaí)
   Daten kommen aus dem Admin-Bereich (Reiter "Laden") über /api/shop/laden.
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
  var FOLGT = "Preis folgt";
  var TAGE = { Mo: "Montag", Di: "Dienstag", Mi: "Mittwoch", Do: "Donnerstag", Fr: "Freitag", Sa: "Samstag", So: "Sonntag" };
  var ARTEN = [
    { id: "matcha", titel: "🍵 Matcha", text: "Zeremonieller Matcha, frisch aufgeschlagen" },
    { id: "bowl", titel: "🫐 Açaí Bowls", text: "Gefrorenes Açaí-Püree, frisches Obst, Granola" },
    { id: "extra", titel: "➕ Extras", text: "" },
    { id: "sonstiges", titel: "✨ Außerdem", text: "" }
  ];

  function zeitenZeichnen(zeiten) {
    var jsTag = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][new Date().getDay()];
    if (!zeiten.some(function (z) { return z.offen; })) {
      // Noch keine festen Zeiten eingetragen (Admin → Laden): nur das Wochenende ankündigen
      $("zeiten").innerHTML = '<tr><th>Sa + So</th><td>Matcha &amp; Açaí Bowls</td></tr><tr><th>Mo – Fr</th><td><span class="zu">online bestellen</span></td></tr>';
      $("zeitenHinweis").textContent = "Die genauen Öffnungszeiten geben wir zur Eröffnung bekannt. Unter der Woche: online bestellen, wir verschicken innerhalb von 3 Werktagen.";
      var s0 = $("ladenStatus"); s0.textContent = "🎉 Eröffnung bald · Öffnungszeiten folgen"; s0.className = "laden-status"; s0.hidden = false;
      return;
    }
    $("zeiten").innerHTML = zeiten.map(function (z) {
      return "<tr" + (z.tag === jsTag ? ' class="is-heute"' : "") + "><th>" + esc(TAGE[z.tag] || z.tag) + "</th><td>" +
        (z.offen ? esc(z.von) + " – " + esc(z.bis) + " Uhr" : '<span class="zu">geschlossen</span>') + "</td></tr>";
    }).join("");
    // Jetzt geöffnet?
    var heute = zeiten.filter(function (z) { return z.tag === jsTag; })[0];
    var jetzt = new Date(), hhmm = ("0" + jetzt.getHours()).slice(-2) + ":" + ("0" + jetzt.getMinutes()).slice(-2);
    var offen = !!(heute && heute.offen && hhmm >= heute.von && hhmm < heute.bis);
    var st = $("ladenStatus");
    var naechster = null;
    for (var i = 1; i <= 7 && !naechster; i++) {
      var t = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][(jetzt.getDay() + i) % 7];
      var z = zeiten.filter(function (x) { return x.tag === t; })[0];
      if (z && z.offen) naechster = z;
    }
    if (offen) { st.textContent = "🟢 Jetzt geöffnet, bis " + heute.bis + " Uhr"; st.className = "laden-status laden-status--offen"; }
    else if (heute && heute.offen && hhmm < heute.von) { st.textContent = "🕒 Heute ab " + heute.von + " Uhr geöffnet"; st.className = "laden-status"; }
    else if (naechster) { st.textContent = "🔴 Gerade geschlossen · wieder " + TAGE[naechster.tag] + " ab " + naechster.von + " Uhr"; st.className = "laden-status laden-status--zu"; }
    else { st.textContent = "Öffnungszeiten folgen"; st.className = "laden-status"; }
    st.hidden = false;
    var nurWE = zeiten.every(function (z) { return !z.offen || z.tag === "Sa" || z.tag === "So"; }) && zeiten.some(function (z) { return z.offen; });
    if (nurWE) $("zeitenHinweis").textContent = "Erstmal nur am Wochenende. Unter der Woche: online bestellen, wir verschicken innerhalb von 3 Werktagen.";
  }

  function karteZeichnen(karte, allergene) {
    var genutzt = {};
    var html = ARTEN.map(function (a) {
      var eintraege = karte.filter(function (k) { return k.art === a.id; });
      if (!eintraege.length) return "";
      return '<div class="speisekarte__gruppe"><h3>' + esc(a.titel) + "</h3>" + (a.text ? "<p>" + esc(a.text) + "</p>" : "") +
        eintraege.map(function (k) {
          var codes = (k.allergene || []).map(function (al) { var i = allergene.indexOf(al); if (i !== -1) genutzt[al] = String.fromCharCode(65 + i); return genutzt[al] || ""; }).filter(Boolean).join(", ");
          return '<div class="gericht"><div class="gericht__text"><strong>' + esc(k.name) + (codes ? ' <sup class="gericht__allergene">' + esc(codes) + "</sup>" : "") + "</strong>" +
            (k.beschreibung ? "<small>" + esc(k.beschreibung) + "</small>" : "") + "</div>" +
            '<span class="gericht__preis">' + (typeof k.preis === "number" ? esc(euro(k.preis)) : FOLGT) + "</span></div>";
        }).join("") + "</div>";
    }).join("");
    $("speisekarte").innerHTML = html || '<p class="leer">Die Karte kommt bald.</p>';
    var legende = Object.keys(genutzt).sort(function (x, y) { return genutzt[x] < genutzt[y] ? -1 : 1; }).map(function (al) { return genutzt[al] + " = " + al; });
    $("allergene").innerHTML = legende.length ? "<strong>Allergene:</strong> " + esc(legende.join(" · ")) + ". Frag uns gern, wenn du unsicher bist." : "";
  }

  fetch("/api/shop/laden", { credentials: "same-origin" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; })
    .then(function (d) {
      FOLGT = window.ZBShop.folgtText(d);
      if (!d || !d.laden) { $("zeiten").innerHTML = "<tr><td>Öffnungszeiten folgen.</td></tr>"; return; }
      var l = d.laden;
      if (l.hinweis) $("ladenHinweis").textContent = l.hinweis;
      zeitenZeichnen(l.zeiten || []);
      var adresse = [l.strasse, [l.plz, l.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ") || l.ort || "Heilbronn";
      $("adresse").innerHTML = l.strasse ? esc(l.name || "ZUKKABRO") + "<br>" + esc(l.strasse) + "<br>" + esc([l.plz, l.ort].filter(Boolean).join(" ")) : esc(l.ort || "Heilbronn") + "<br><small>Die genaue Adresse geben wir rechtzeitig bekannt.</small>";
      $("kartenLink").href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(adresse);
      karteZeichnen(d.karte || [], d.allergene || []);
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-visible"); });
    });
})();
