/* MM Montageservice – gemeinsamer Seitenrahmen (Topbar, Header, Footer) für alle Seiten */
(function () {
  var co = (window.MM_CONFIG || {}).company || {};
  var page = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
  var NAV = [
    ['index', 'Start'], ['leistungen', 'Leistungen'], ['referenzen', 'Referenzen'],
    ['konfigurator', 'Konfigurator'], ['ueber-uns', 'Über uns'], ['kontakt', 'Kontakt']
  ];
  var tel = 'tel:' + (co.phone || '').replace(/\s/g, '');
  var wa = co.whatsapp ? 'https://wa.me/' + co.whatsapp.replace(/[^0-9]/g, '') : '';
  /* Hintergrund-Ebenen, Intro, Progress, Cursor */
  document.body.insertAdjacentHTML('afterbegin', '<div id="intro"><div class="im"><img src="assets/img/logo.png" alt="MM Montageservice"></div></div><div id="prog"></div><div class="bgflow"></div><canvas id="stars"></canvas><div class="grain"></div><div id="curR"></div><div id="curD"></div>');
  var header = document.getElementById('site-header');
  if (header) header.outerHTML =
    '<div class="topbar"><div class="container">' +
    '<span>📍 ' + co.street + ' · ' + co.zip + ' ' + co.city + '</span>' +
    '<span>📞 <a href="' + tel + '">' + co.phoneDisplay + '</a> &nbsp;·&nbsp; ✉️ <a href="mailto:' + co.email + '">' + co.email + '</a></span>' +
    '</div></div>' +
    '<header class="site"><div class="container">' +
    '<a class="brand" href="index.html" aria-label="MM Montageservice Startseite"><img src="assets/img/logo-trans.png" alt="MM Montageservice – Montage · Demontage · Entsorgung · Gerüstbau" width="170" height="85"></a>' +
    '<button class="nav-toggle" aria-label="Menü" aria-expanded="false">☰</button>' +
    '<nav class="main" id="nav"><ul>' +
    NAV.map(function (n) { return '<li><a href="' + n[0] + '.html"' + (n[0] === page ? ' class="active" aria-current="page"' : '') + '>' + n[1] + '</a></li>'; }).join('') +
    '<li><a class="btn btn-primary btn-sm" href="anfrage.html">Montage anfragen</a></li>' +
    '</ul></nav></div></header>';
  var footer = document.getElementById('site-footer');
  if (footer) footer.outerHTML =
    '<footer class="site"><div class="container">' +
    '<div><div class="brand"><img src="assets/img/logo.png" alt="" width="150" height="75"></div><p>Montage, Demontage, Entsorgung und Gerüstbau: Sektionaltore, Garagentore und Haustüren fachgerecht montiert. Für Privatkunden, Bauträger und als Montagepartner für den Fachhandel – in Heilbronn und ganz Baden-Württemberg.</p></div>' +
    '<div><h4>Leistungen</h4><ul><li><a href="leistungen.html#garagentore">Sektionaltore &amp; Garagentore</a></li><li><a href="leistungen.html#haustueren">Haustüren &amp; Nebentüren</a></li><li><a href="leistungen.html#demontage">Demontage &amp; Entsorgung</a></li><li><a href="leistungen.html#antriebe">Torantriebe &amp; Zubehör</a></li><li><a href="leistungen.html#reparatur">Reparatur &amp; Einstellung</a></li><li><a href="leistungen.html#geruestbau">Gerüstbau</a></li><li><a href="leistungen.html#fachhandel">Montagepartner Fachhandel</a></li><li><a href="konfigurator.html">Tor-Konfigurator</a></li></ul></div>' +
    '<div><h4>Kontakt</h4><ul><li>' + co.name + '</li><li>' + co.owner + '</li><li>' + co.street + '</li><li>' + co.zip + ' ' + co.city + '</li><li><a href="' + tel + '">' + co.phoneDisplay + '</a></li>' + (wa ? '<li><a href="' + wa + '" target="_blank" rel="noopener">WhatsApp schreiben</a></li>' : '') + '<li><a href="mailto:' + co.email + '">' + co.email + '</a></li></ul></div>' +
    '</div><div class="container footer-bottom" style="display:flex">' +
    '<span>© ' + new Date().getFullYear() + ' ' + co.name + ' · ' + co.city + '</span>' +
    '<span><a href="impressum.html">Impressum</a> · <a href="datenschutz.html">Datenschutz</a></span>' +
    '</div></footer>' +
    '<a class="call-fab" href="' + tel + '" aria-label="Anrufen">📞</a><div class="toast" id="toast"></div>';
  var tog = document.querySelector('.nav-toggle'), nav = document.getElementById('nav');
  if (tog && nav) { tog.addEventListener('click', function () { var o = nav.classList.toggle('open'); tog.setAttribute('aria-expanded', o); }); }
  window.mmToast = function (t) { var el = document.getElementById('toast'); if (!el) return; el.textContent = t; el.classList.add('show'); clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('show'); }, 2800); };
})();
