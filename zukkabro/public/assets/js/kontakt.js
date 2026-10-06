/* =========================================================
   ZUKKABRO – Kontaktformular
   Schickt die Nachricht an den Server (/api/kontakt); sie landet im Admin-Bereich unter "Nachrichten".
   ========================================================= */
(function () {
  "use strict";
  var form = document.getElementById("kontaktForm");
  if (!form) return;
  var fehler = document.getElementById("kontaktFehler");
  var danke = document.getElementById("kontaktDanke");
  var knopf = document.getElementById("kontaktSenden");

  function zeigeFehler(text) { fehler.textContent = text; fehler.hidden = false; }

  // Vorbelegung über Link, z. B. /kontakt.html?betreff=abo (Mystery-Box-Abo)
  var vorgabe = new URLSearchParams(location.search).get("betreff");
  if (vorgabe === "abo") {
    form.elements.betreff.value = "Mystery-Box-Abo vormerken";
    form.elements.text.placeholder = "Ich will das Mystery-Box-Abo. Sagt mir Bescheid, wenn es startet!";
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    fehler.hidden = true;
    var f = form.elements;
    var daten = {
      name: f.name.value.trim(), email: f.email.value.trim(), telefon: f.telefon.value.trim(),
      betreff: f.betreff.value, text: f.text.value.trim(), datenschutz: f.datenschutz.checked, website: f.website.value
    };
    if (!daten.name || !daten.text) return zeigeFehler("Bitte Name und Nachricht ausfüllen.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(daten.email)) return zeigeFehler("Bitte eine gültige E-Mail-Adresse angeben.");
    if (!daten.datenschutz) return zeigeFehler("Bitte die Datenschutzerklärung bestätigen.");
    knopf.disabled = true; knopf.textContent = "Wird gesendet …";
    try {
      var res = await fetch("/api/kontakt", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json", "x-zb": "1" }, body: JSON.stringify(daten) });
      var json = {};
      try { json = await res.json(); } catch (err) { /* leer */ }
      if (!res.ok) throw new Error(json.fehler || "Senden hat nicht geklappt. Bitte später erneut versuchen.");
      form.hidden = true; danke.hidden = false;
      danke.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      zeigeFehler(err.message || "Keine Verbindung zum Server.");
      knopf.disabled = false; knopf.textContent = "Nachricht senden →";
    }
  });
})();
