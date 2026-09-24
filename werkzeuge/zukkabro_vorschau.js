/* ZUKKABRO – Vorschau ohne Server.
   Ersetzt die Server-API im Browser: Shop-Daten und Pakete kommen aus dieser Datei,
   Bestellen, Login und Händler-Anfragen melden "nur in der Vorschau". */
window.ZB_BILDER = window.ZB_BILDER || {};
window.ZBB = function (p) {
  p = String(p || "").replace(/^\//, "");
  return window.ZB_BILDER[p] || p;
};
(function () {
  var SHOP = /*SHOP_DATEN*/null;
  var NUR_VORSCHAU = "Das ist nur eine Vorschau. Bestellen und Login gehen erst auf der fertigen Seite.";
  var echt = window.fetch.bind(window);

  function antwort(daten, status) {
    return Promise.resolve(new Response(JSON.stringify(daten), { status: status || 200, headers: { "content-type": "application/json" } }));
  }

  window.fetch = function (url, opt) {
    var u = typeof url === "string" ? url : (url && url.url) || "";
    if (!/^\/?api(\/|$|\?)/.test(u)) return echt(url, opt);
    var pfad = u.replace(/^\/?api/, "").split(/[?#]/)[0] || "/";
    if (pfad === "/shop/daten") return antwort(SHOP);
    if (pfad === "/ich") return antwort({ angemeldet: false });
    return antwort({ fehler: NUR_VORSCHAU }, 503);
  };

  // Link mit #id=… auf derselben Seite: Seite neu aufbauen
  window.addEventListener("hashchange", function () {
    if (location.hash.indexOf("=") !== -1) location.reload();
  });

  // Kleiner Hinweis unten links
  document.addEventListener("DOMContentLoaded", function () {
    var b = document.createElement("div");
    b.textContent = "Vorschau";
    b.title = NUR_VORSCHAU;
    b.setAttribute("style", "position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom, 0px));z-index:9999;" +
      "background:#2b140a;color:#fbf1e6;font:700 12px/1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;" +
      "padding:7px 11px;border-radius:999px;border:2px solid #ff2e98;pointer-events:none;opacity:.9");
    document.body.appendChild(b);
  });
})();
