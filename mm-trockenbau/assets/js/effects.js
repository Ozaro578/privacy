/* MM – Effekte: Intro, Scroll-Progress, Sternenhimmel, Cursor, Spotlight-Karten */
(function () {
  var rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Intro (nur einmal pro Sitzung) */
  var intro = document.getElementById('intro');
  if (intro) {
    var seen = false; try { seen = !!sessionStorage.getItem('mmIntro'); } catch (e) {}
    if (rm || seen) { intro.style.display = 'none'; }
    else { try { sessionStorage.setItem('mmIntro', '1'); } catch (e) {} setTimeout(function () { intro.classList.add('done'); }, 1050); setTimeout(function () { intro.style.display = 'none'; }, 1900); }
  }

  /* Scroll-Progress */
  var prog = document.getElementById('prog');
  if (prog) window.addEventListener('scroll', function () { var h = document.documentElement; var max = h.scrollHeight - h.clientHeight; prog.style.transform = 'scaleX(' + (max > 0 ? h.scrollTop / max : 0) + ')'; }, { passive: true });

  /* Spotlight auf Karten */
  document.querySelectorAll('.card').forEach(function (c) {
    c.addEventListener('mousemove', function (e) { var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
  });

  /* Cursor */
  var cd = document.getElementById('curD'), cr = document.getElementById('curR');
  if (cd && cr) {
    if (window.matchMedia('(pointer: fine)').matches && !rm) {
      var rx = 0, ry = 0, tx = 0, ty = 0;
      window.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; cd.style.transform = 'translate(' + (tx - 3.5) + 'px,' + (ty - 3.5) + 'px)'; }, { passive: true });
      (function lerp() { rx += (tx - rx) * .16; ry += (ty - ry) * .16; cr.style.transform = 'translate(' + (rx - 17) + 'px,' + (ry - 17) + 'px)'; requestAnimationFrame(lerp); })();
      document.querySelectorAll('a, button, .card, summary, .chip, label').forEach(function (el) { el.addEventListener('mouseenter', function () { document.body.classList.add('hovl'); }); el.addEventListener('mouseleave', function () { document.body.classList.remove('hovl'); }); });
    } else { cd.style.display = 'none'; cr.style.display = 'none'; }
  }

  /* Sternenhimmel */
  var cv = document.getElementById('stars');
  if (cv && !rm) {
    var ctx = cv.getContext('2d'), W, H, P = [], dpr = Math.min(window.devicePixelRatio || 1, 2);
    function rs() { W = cv.width = window.innerWidth * dpr; H = cv.height = window.innerHeight * dpr; cv.style.width = window.innerWidth + 'px'; cv.style.height = window.innerHeight + 'px'; }
    rs(); window.addEventListener('resize', rs);
    var N = Math.min(90, Math.floor(window.innerWidth / 16));
    for (var i = 0; i < N; i++) P.push({ x: Math.random(), y: Math.random(), z: .3 + Math.random() * .7, tw: Math.random() * 6.28 });
    (function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var k = 0; k < P.length; k++) { var p = P[k]; p.y -= .00006 * p.z; if (p.y < 0) p.y = 1; p.tw += .02; var a = (.25 + .45 * Math.abs(Math.sin(p.tw))) * p.z; ctx.fillStyle = p.z > .8 ? 'rgba(141,180,255,' + a + ')' : 'rgba(255,255,255,' + (a * .8) + ')'; var s = p.z * 1.6 * dpr; ctx.fillRect(p.x * W, p.y * H, s, s); }
      requestAnimationFrame(draw);
    })();
  }
})();
