/* =========================================================
   ZUKKABRO – Digitale Stempelkarte
   Der Code liegt im Browser (localStorage). Stempel vergibt das Team im Admin (Reiter "Kasse").
   ========================================================= */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var KEY = "zb_stempel";
  var store = {
    get: function () { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } },
    set: function (v) { try { localStorage.setItem(KEY, v); } catch (e) { /* egal */ } }
  };
  function fehler(text) { $("stempelFehler").textContent = text; $("stempelFehler").hidden = !text; }

  function zeichnen(k) {
    $("stempelCode").textContent = k.code;
    var ziel = k.ziel || 10, html = "";
    for (var i = 1; i <= ziel; i++) {
      var voll = i <= k.stempel;
      html += '<span class="stempel__feld' + (voll ? " is-voll" : "") + (i === ziel ? " is-ziel" : "") + '" aria-label="Stempel ' + i + (voll ? " vergeben" : " frei") + '">' + (voll ? "👑" : i === ziel ? "🍵" : "") + "</span>";
    }
    $("stempelFelder").innerHTML = html;
    $("stempelStand").textContent = k.stempel + " von " + ziel + " Stempeln" + (k.stempel ? " · noch " + (ziel - k.stempel) + " bis zum Gratis-Matcha" : " · los geht's beim nächsten Matcha");
    var frei = $("stempelFrei");
    frei.hidden = !(k.guthaben > 0);
    frei.textContent = k.guthaben > 0 ? "🎉 " + (k.guthaben === 1 ? "Ein Matcha ist frei!" : k.guthaben + " Getränke sind frei!") + " Zeig den Code an der Theke." : "";
    fehler("");
  }

  async function api(pfad, opt) {
    var res = await fetch("/api" + pfad, Object.assign({ credentials: "same-origin" }, opt || {}));
    var j = {};
    try { j = await res.json(); } catch (e) { /* leer */ }
    if (!res.ok) throw new Error(j.fehler || "Gerade keine Verbindung. Bitte später nochmal.");
    return j;
  }
  async function laden(code) {
    try {
      var k = code ? await api("/shop/stempel?code=" + encodeURIComponent(code))
                   : await api("/shop/stempel/neu", { method: "POST", headers: { "content-type": "application/json", "x-zb": "1" }, body: "{}" });
      store.set(k.code); zeichnen(k);
    } catch (err) {
      $("stempelStand").textContent = "";
      $("stempelCode").textContent = code || "· · · ·";
      fehler(err.message);
    }
  }

  $("stempelNeuLaden").addEventListener("click", function () { laden(store.get()); });
  $("stempelWechsel").addEventListener("submit", function (e) {
    e.preventDefault();
    var code = e.target.elements.code.value.trim().toUpperCase().replace(/\s/g, "");
    if (!/^ZB-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code)) return fehler("Code bitte wie auf der Karte eingeben, z. B. ZB-AB12-CD34.");
    laden(code); e.target.reset();
  });
  laden(store.get());
})();
