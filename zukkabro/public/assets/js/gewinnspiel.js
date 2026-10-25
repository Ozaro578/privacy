/* ZUKKABRO – Eröffnungs-Gewinnspiel auf der Startseite: Countdown und Teilnahme */
(function () {
  "use strict";
  var form = document.getElementById("gsForm");
  if (!form) return;
  var box = document.getElementById("gewinnspielBox"), cd = document.getElementById("gsCountdown"), fehler = document.getElementById("gsFehler"), danke = document.getElementById("gsDanke");
  var ende = Date.parse(cd.getAttribute("data-ende"));
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* egal */ } } };

  function countdown() {
    var rest = ende - Date.now();
    if (rest <= 0) { cd.textContent = "Teilnahmeschluss war am 20.11.2026. Die Ziehung ist am 21.11. um 16 Uhr im Laden."; form.hidden = true; return; }
    var t = Math.floor(rest / 864e5), h = Math.floor(rest % 864e5 / 36e5), m = Math.floor(rest % 36e5 / 6e4);
    cd.innerHTML = "Noch <b>" + (t ? t + " Tag" + (t === 1 ? "" : "e") + ", " : "") + h + " Std " + m + " Min</b> bis Teilnahmeschluss";
  }
  countdown(); setInterval(countdown, 30000);

  var los = store.get("zb_gewinnspiel");
  if (los) { form.hidden = true; danke.hidden = false; document.getElementById("gsDankeText").textContent = "Deine Los-Nummer: " + los + ". Ziehung am 21.11.2026 um 16 Uhr live im Laden. Viel Glück!"; }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    fehler.hidden = true;
    var f = form.elements;
    if (!f.name.value.trim() || !f.email.value.trim()) return zeigeFehler("Bitte Name und E-Mail angeben.");
    if (!f.instagram.value.trim()) return zeigeFehler("Bitte deinen Instagram- oder TikTok-Namen angeben.");
    if (!f.social.checked) return zeigeFehler("Bitte bestätigen, dass du uns folgst und den Beitrag geliked und geteilt hast.");
    if (!f.ab18.checked) return zeigeFehler("Mitmachen geht erst ab 18 Jahren.");
    if (!f.bedingungen.checked) return zeigeFehler("Bitte Teilnahmebedingungen und Datenschutzerklärung bestätigen.");
    var knopf = document.getElementById("gsSenden"); knopf.disabled = true; knopf.textContent = "Einen Moment …";
    fetch("/api/shop/gewinnspiel", { method: "POST", headers: { "content-type": "application/json", "x-zb": "1" },
      body: JSON.stringify({ name: f.name.value.trim(), email: f.email.value.trim(), instagram: f.instagram.value.trim(), website: f.website.value, social: f.social.checked, ab18: f.ab18.checked, bedingungen: f.bedingungen.checked, news: f.news.checked }) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (x) {
        if (!x.ok) throw new Error(x.d.fehler || "Das hat nicht geklappt. Bitte nochmal probieren.");
        store.set("zb_gewinnspiel", x.d.id);
        form.hidden = true; danke.hidden = false;
        document.getElementById("gsDankeText").textContent = "Deine Los-Nummer: " + x.d.id + ". Ziehung am 21.11.2026 um 16 Uhr live im Laden. Viel Glück!";
        box.scrollIntoView({ behavior: "smooth", block: "center" });
      })
      .catch(function (e) { zeigeFehler(e.message); })
      .then(function () { knopf.disabled = false; knopf.textContent = "🎁 Jetzt mitmachen"; });
  });
  function zeigeFehler(t) { fehler.textContent = t; fehler.hidden = false; }
})();
