/* ZUKKABRO – Werbeclips: stumm, in Schleife, nur abspielen, wenn sie im Bild sind (spart Daten) */
(function () {
  "use strict";
  var clips = document.querySelectorAll("[data-werbung] video");
  if (!clips.length) return;
  var sparsam = navigator.connection && navigator.connection.saveData;
  if (sparsam || !("IntersectionObserver" in window)) return; // Poster reicht
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { if (v.preload === "none") v.preload = "auto"; var p = v.play(); if (p && p.catch) p.catch(function () { /* Autoplay blockiert, Poster bleibt */ }); }
      else v.pause();
    });
  }, { threshold: 0.35 });
  clips.forEach(function (v) { io.observe(v); });
})();
