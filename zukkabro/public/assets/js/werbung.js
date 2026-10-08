/* ZUKKABRO – Werbeclips und Hintergrund-Videos: stumm, in Schleife, datensparend */
(function () {
  "use strict";
  var sparsam = (navigator.connection && navigator.connection.saveData) || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  // Hintergrund-Videos (Hero, Seitenkopf): bei Datensparmodus nur das Poster zeigen
  document.querySelectorAll(".hero__video, .page-head__film video").forEach(function (v) {
    if (sparsam) { v.removeAttribute("autoplay"); v.pause(); v.querySelectorAll("source").forEach(function (s) { s.remove(); }); v.load(); }
  });
  // Werbeclips: nur abspielen, wenn sie im Bild sind
  var clips = document.querySelectorAll("[data-werbung] video");
  if (!clips.length || sparsam || !("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { if (v.preload === "none") v.preload = "auto"; var p = v.play(); if (p && p.catch) p.catch(function () { /* Autoplay blockiert, Poster bleibt */ }); }
      else v.pause();
    });
  }, { threshold: 0.35 });
  clips.forEach(function (v) { io.observe(v); });
})();
