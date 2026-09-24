/* =========================================================
   ZUKKABRO – gemeinsame Helfer für Admin- und Händlerbereich
   ========================================================= */
window.ZB = (function () {
  "use strict";

  var euroFmt = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
  var zahlFmt = new Intl.NumberFormat("de-DE");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /** Anfrage an die Server-API. Wirft einen Fehler mit deutscher Meldung. */
  async function api(methode, pfad, daten) {
    var opt = { method: methode, credentials: "same-origin", headers: { "x-zb": "1" } };
    if (daten !== undefined) { opt.headers["content-type"] = "application/json"; opt.body = JSON.stringify(daten); }
    var res;
    try { res = await fetch("/api" + pfad, opt); }
    catch (e) { throw new Error("Keine Verbindung zum Server."); }
    var json = {};
    try { json = await res.json(); } catch (e) { /* leer */ }
    if (!res.ok) { var err = new Error(json.fehler || "Fehler " + res.status); err.status = res.status; throw err; }
    return json;
  }

  /** Cent -> "1.234,50 €" */
  function euro(cent) { return euroFmt.format((cent || 0) / 100); }
  function zahl(n) { return zahlFmt.format(n || 0); }
  /** "1.234,5" oder "1234.50" -> Cent (ganze Zahl), NaN bei Unsinn */
  function cent(eingabe) {
    var s = String(eingabe == null ? "" : eingabe).trim().replace(/\s|€/g, "");
    if (!s) return NaN;
    if (s.indexOf(",") !== -1) s = s.replace(/\./g, "").replace(",", ".");
    var n = Number(s);
    return Number.isFinite(n) ? Math.round(n * 100) : NaN;
  }
  function centFeld(c) { return c == null || isNaN(c) ? "" : (c / 100).toFixed(2).replace(".", ","); }
  function datumDE(iso) { if (!iso) return ""; var d = iso.slice(0, 10).split("-"); return d[2] + "." + d[1] + "." + d[0]; }
  function zeitDE(iso) { if (!iso) return ""; var d = new Date(iso); return d.toLocaleDateString("de-DE") + " " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }); }
  function heute() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }

  /** Kurze Meldung unten rechts */
  function meldung(text, typ) {
    var box = document.getElementById("toast");
    if (!box) { box = document.createElement("div"); box.id = "toast"; box.setAttribute("role", "status"); document.body.appendChild(box); }
    var el = document.createElement("div");
    el.className = "toast" + (typ === "fehler" ? " toast--fehler" : "");
    el.textContent = text;
    box.appendChild(el);
    setTimeout(function () { el.classList.add("weg"); setTimeout(function () { el.remove(); }, 400); }, typ === "fehler" ? 6000 : 3200);
  }

  /** CSV für Excel (Semikolon, UTF-8 mit BOM) herunterladen */
  function csv(zeilen, dateiname) {
    var text = zeilen.map(function (z) {
      return z.map(function (w) {
        var s = w == null ? "" : String(w);
        return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(";");
    }).join("\r\n");
    var blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = dateiname;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }
  function centCsv(c) { return ((c || 0) / 100).toFixed(2).replace(".", ","); }

  /** Produkte aus produkte.js nach ID */
  var produkte = {};
  if (typeof PRODUKTE !== "undefined") PRODUKTE.forEach(function (p) { produkte[p.id] = p; });
  var kategorien = {};
  if (typeof KATEGORIEN !== "undefined") KATEGORIEN.forEach(function (k) { kategorien[k.id] = k; });
  var LEBENSMITTEL = ["susses", "snacks", "scharfes", "pipapo"];
  /** Vorschlag MwSt-Satz: Lebensmittel 7 %, sonst 19 % (Getränke, Vapes, Spielzeug). Bitte mit Steuerberater prüfen. */
  function mwstVorschlag(p) {
    if (!p || !p.kat) return 19;
    if (p.kat.some(function (k) { return k === "getraenke" || k === "vapes" || k === "elfbar"; })) return 19;
    return p.kat.some(function (k) { return LEBENSMITTEL.indexOf(k) !== -1; }) ? 7 : 19;
  }

  /** Tabs: <nav data-tabs> mit <button data-tab="x">, Inhalte <section data-panel="x"> */
  function tabs(nav, beiWechsel) {
    function zeige(id) {
      nav.querySelectorAll("[data-tab]").forEach(function (b) {
        var on = b.getAttribute("data-tab") === id;
        b.classList.toggle("is-active", on); b.setAttribute("aria-selected", String(on));
      });
      document.querySelectorAll("[data-panel]").forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== id; });
      try { sessionStorage.setItem("zb_tab_" + location.pathname, id); } catch (e) { /* egal */ }
      if (beiWechsel) beiWechsel(id);
    }
    nav.addEventListener("click", function (e) { var b = e.target.closest("[data-tab]"); if (b) zeige(b.getAttribute("data-tab")); });
    var gemerkt = null;
    try { gemerkt = sessionStorage.getItem("zb_tab_" + location.pathname); } catch (e) { /* egal */ }
    var erster = nav.querySelector("[data-tab]").getAttribute("data-tab");
    zeige(gemerkt && nav.querySelector('[data-tab="' + gemerkt + '"]') ? gemerkt : erster);
    return zeige;
  }

  return { esc: esc, api: api, euro: euro, zahl: zahl, cent: cent, centFeld: centFeld, centCsv: centCsv, datumDE: datumDE, zeitDE: zeitDE, heute: heute,
    meldung: meldung, csv: csv, produkte: produkte, kategorien: kategorien, mwstVorschlag: mwstVorschlag, tabs: tabs };
})();
