// Mobile-Navigation
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  // Sanfte Einblend-Animation
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }
  // Jahreszahl im Footer
  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
});
// Zähler-Animation für Fakten
document.addEventListener('DOMContentLoaded', function () {
  var els = document.querySelectorAll('[data-count]');
  if (!els.length) return;
  function run(el){ var t=+el.getAttribute('data-count'), p=el.getAttribute('data-prefix')||'', s=0, start=null;
    function f(ts){ if(!start) start=ts; var k=Math.min((ts-start)/1200,1); el.textContent=p+Math.round(t*(1-Math.pow(1-k,3))); if(k<1) requestAnimationFrame(f);} requestAnimationFrame(f); }
  if ('IntersectionObserver' in window) { var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){run(e.target);o.unobserve(e.target);}});},{threshold:.5}); els.forEach(function(e){o.observe(e);}); }
  else els.forEach(run);
});
