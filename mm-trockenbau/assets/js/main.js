/* MM Montageservice – Seitenlogik (Kontaktdaten, Karten, Referenzen, Kundenstimmen, Zähler, Formulare) */
(function () {
  var C = window.MM_CONFIG, co = C.company;
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var tel = 'tel:' + co.phone.replace(/\s/g, '');
  var wa = co.whatsapp ? 'https://wa.me/' + co.whatsapp.replace(/[^0-9]/g, '') : '';

  /* Kontaktdaten aus config.js einsetzen */
  document.querySelectorAll('[data-phone-link]').forEach(function (a) { a.href = tel; a.textContent = co.phoneDisplay; });
  document.querySelectorAll('[data-mail-link]').forEach(function (a) { a.href = 'mailto:' + co.email; a.textContent = co.email; });
  document.querySelectorAll('[data-wa-link]').forEach(function (a) {
    if (!wa) { a.hidden = true; return; }
    var t = a.getAttribute('data-wa-text') || 'Hallo, ich hätte gern ein Angebot für eine Montage.';
    a.href = wa + '?text=' + encodeURIComponent(t); a.target = '_blank'; a.rel = 'noopener';
  });
  document.querySelectorAll('[data-owner]').forEach(function (el) { el.textContent = co.owner; });
  document.querySelectorAll('[data-street]').forEach(function (el) { el.textContent = co.street; });
  document.querySelectorAll('[data-zipcity]').forEach(function (el) { el.textContent = co.zip + ' ' + co.city; });
  document.querySelectorAll('[data-city]').forEach(function (el) { el.textContent = co.city; });
  document.querySelectorAll('[data-radius]').forEach(function (el) { el.textContent = co.serviceRadiusKm; });
  document.querySelectorAll('[data-route-link]').forEach(function (a) { a.href = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(co.street + ', ' + co.zip + ' ' + co.city); });
  document.querySelectorAll('[data-tax]').forEach(function (el) { el.hidden = !co.taxId; var v = el.querySelector('[data-tax-value]'); if (v) v.textContent = co.taxId; });
  document.querySelectorAll('[data-vat]').forEach(function (el) { el.hidden = !co.vatId; var v = el.querySelector('[data-vat-value]'); if (v) v.textContent = co.vatId; });
  document.querySelectorAll('[data-kleinunternehmer]').forEach(function (el) { el.hidden = !co.kleinunternehmer; });
  document.querySelectorAll('[data-legalform]').forEach(function (el) { el.textContent = co.legalForm; });
  var oh = $('#opening-hours'); if (oh) oh.innerHTML = co.openingHours.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('');

  /* Scroll-Animationen (Einblenden) */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .15 }) : null;
  document.querySelectorAll('.reveal').forEach(function (el) { if (io) io.observe(el); else el.classList.add('in'); });

  /* Zähler (Statistiken) */
  var cio = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) return; cio.unobserve(e.target); var el = e.target, to = +el.getAttribute('data-count'), suf = el.getAttribute('data-suffix') || '', t0 = null; function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1400); p = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * p) + suf; if (p < 1) requestAnimationFrame(step); } requestAnimationFrame(step); }); }, { threshold: .5 }) : null;
  document.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || ''); if (cio) cio.observe(el); });

  /* Standort-Karte (dunkles Kartendesign) */
  var ms = $('#map-standort');
  if (ms && window.L) {
    var map = L.map(ms, { scrollWheelZoom: false, zoomControl: true, attributionControl: true }).setView([co.lat, co.lng], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19 }).addTo(map);
    L.circle([co.lat, co.lng], { radius: 2500, color: '#2f7bff', fillColor: '#2f7bff', fillOpacity: .06, weight: 1.5, dashArray: '6 6' }).addTo(map);
    var pin = L.divIcon({ className: '', html: '<div class="map-pin"><div class="ring"></div><div class="dot"></div></div>', iconSize: [46, 46], iconAnchor: [23, 23], popupAnchor: [0, -18] });
    L.marker([co.lat, co.lng], { icon: pin }).addTo(map).bindPopup('<b>' + esc(co.name) + '</b><br>' + esc(co.street) + '<br>' + esc(co.zip + ' ' + co.city));
    function offset() { if (window.innerWidth > 700) map.panBy([-Math.min(220, window.innerWidth * .18), 0], { animate: false }); }
    setTimeout(function () { map.invalidateSize(); map.setView([co.lat, co.lng], 13, { animate: false }); offset(); }, 150);
  } else if (ms) {
    ms.innerHTML = '<div style="display:grid;place-items:center;height:100%;min-height:320px;color:#8b93a1;font-size:.9rem;padding:1rem;text-align:center">Karte: ' + esc(co.street) + ', ' + esc(co.zip + ' ' + co.city) + '</div>';
  }

  /* Einsatzgebiet-Karte mit Montageorten */
  var m = $('#map-public');
  if (m && window.L) {
    var map2 = L.map(m, { scrollWheelZoom: false }).setView([co.lat, co.lng], 8);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19 }).addTo(map2);
    L.circle([co.lat, co.lng], { radius: co.serviceRadiusKm * 1000, color: '#1b5fc4', fillColor: '#1b5fc4', fillOpacity: .07, weight: 2 }).addTo(map2);
    L.marker([co.lat, co.lng]).addTo(map2).bindPopup('<b>' + esc(co.name) + '</b><br>' + esc(co.street) + '<br>' + esc(co.zip + ' ' + co.city));
    (C.jobs || []).forEach(function (j) { if (j.lat && j.lng) L.circleMarker([j.lat, j.lng], { radius: 6, color: '#fff', weight: 2, fillColor: '#1b5fc4', fillOpacity: 1 }).addTo(map2).bindPopup('<b>' + esc(j.town) + '</b><br>' + esc(j.what)); });
  } else if (m) {
    m.innerHTML = '<div class="empty" style="display:grid;place-items:center;height:100%;color:var(--muted);font-size:.9rem;padding:1rem;text-align:center">Einsatzgebiet: Heilbronn und Umkreis von ' + co.serviceRadiusKm + ' km</div>';
  }

  /* Zuletzt montiert */
  document.querySelectorAll('.joblist[id]').forEach(function (ul) {
    var limit = +ul.getAttribute('data-limit') || 999;
    var items = (C.jobs || []).slice(0, limit);
    ul.innerHTML = items.map(function (j) {
      return '<li class="reveal"><span class="job-town">' + esc(j.town) + '</span><span class="job-what">' + esc(j.what) + (j.extra ? '<small>' + esc(j.extra) + '</small>' : '') + '</span></li>';
    }).join('');
    ul.querySelectorAll('.reveal').forEach(function (el) { if (io) io.observe(el); else el.classList.add('in'); });
    if (!items.length) { var sec = ul.closest('section'); if (sec) sec.hidden = true; }
  });

  /* Kundenstimmen – nur anzeigen, wenn echte Bewertungen in config.js stehen */
  var rv = $('#reviews');
  if (rv) {
    var list = C.reviews || [];
    if (!list.length) { var rsec = rv.closest('section'); if (rsec) rsec.hidden = true; }
    else {
      rv.innerHTML = list.map(function (r) {
        var n = Math.max(1, Math.min(5, r.stars || 5));
        return '<blockquote class="review"><div class="stars" aria-label="' + n + ' von 5 Sternen">' + '★★★★★'.slice(0, n) + '</div><p>' + esc(r.text) + '</p><footer>' + esc(r.name) + (r.town ? ', ' + esc(r.town) : '') + '</footer></blockquote>';
      }).join('');
      var gl = $('#google-reviews-link'); if (gl) { if (C.googleReviewsUrl) gl.href = C.googleReviewsUrl; else gl.hidden = true; }
    }
  }

  /* Galerie (Referenzen) + Lightbox – nur eigene Fotos */
  document.querySelectorAll('.gallery[id]').forEach(function (g) {
    var limit = +g.getAttribute('data-limit') || 999;
    var items = (C.slides || []).filter(function (s) { return !s.stock; }).slice(0, limit);
    g.innerHTML = items.map(function (s) { return '<figure data-src="' + esc(s.src) + '"><img src="' + esc(s.src) + '" alt="' + esc(s.alt || '') + '" loading="lazy" onerror="this.closest(\'figure\').remove()"><figcaption>' + esc(s.caption || '') + '</figcaption></figure>'; }).join('');
    g.querySelectorAll('figure').forEach(function (f) { f.addEventListener('click', function () { openLightbox(f.getAttribute('data-src'), f.querySelector('img').alt); }); });
    var wrap = g.closest('[data-gallery-wrap]') || g.closest('section');
    if (wrap) setTimeout(function () { if (!g.querySelector('figure')) wrap.hidden = true; }, 1500);
  });
  var lb = null;
  function openLightbox(src, alt) {
    if (!lb) { lb = document.createElement('div'); lb.className = 'lightbox'; lb.innerHTML = '<button type="button" aria-label="Schließen">✕</button><img alt="">'; document.body.appendChild(lb); lb.addEventListener('click', function () { lb.classList.remove('open'); }); document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.classList.remove('open'); }); }
    var img = lb.querySelector('img'); img.src = src; img.alt = alt || ''; lb.classList.add('open');
  }

  /* Formulare: Kontakt + Montage-Anfrage
     Versand: optionaler Webhook (config.requestWebhook), sonst E-Mail-Programm (mailto) */
  function send(subject, lines, msgEl, form, onDone) {
    var body = lines.filter(function (l) { return l !== ''; }).join('\n');
    var payload = { subject: subject, body: body, source: location.href, ts: new Date().toISOString() };
    var done = function () { msgEl.innerHTML = '<div class="notice ok">Vielen Dank! Ihre Anfrage ist unterwegs. Wir melden uns in der Regel noch am selben Werktag.</div>'; form.reset(); window.mmToast && mmToast('Anfrage gesendet'); onDone && onDone(); };
    function mailto() {
      var href = 'mailto:' + co.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      window.location.href = href;
      msgEl.innerHTML = '<div class="notice ok">Ihr E-Mail-Programm öffnet sich mit der fertigen Nachricht. Falls nicht: <a href="' + href + '">hier klicken</a>' + (wa ? ' oder <a href="' + wa + '?text=' + encodeURIComponent(body) + '" target="_blank" rel="noopener">per WhatsApp senden</a>' : '') + '.</div>';
    }
    if (C.requestWebhook) {
      fetch(C.requestWebhook, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { if (!r.ok) throw new Error(); done(); })
        .catch(mailto);
    } else mailto();
  }

  var cf = $('#contact-form');
  if (cf) cf.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('#contact-msg');
    if ($('#cf-hp').value) return;
    var f = { name: $('#cf-name').value.trim(), phone: $('#cf-phone').value.trim(), email: $('#cf-email').value.trim(), topic: $('#cf-topic').value, message: $('#cf-msg').value.trim() };
    if (!f.name || !(f.phone || f.email) || !f.message || !$('#cf-privacy').checked) { msg.innerHTML = '<div class="notice err">Bitte Name, Telefon oder E-Mail, Nachricht ausfüllen und der Datenschutzerklärung zustimmen.</div>'; return; }
    send('Anfrage: ' + f.topic, ['Name: ' + f.name, 'Telefon: ' + f.phone, 'E-Mail: ' + f.email, 'Anliegen: ' + f.topic, ' ', f.message], msg, cf);
  });

  var af = $('#anfrage-form');
  if (af) {
    af.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = $('#anfrage-msg');
      if ($('#af-hp').value) return;
      var g = function (id) { var el = $('#' + id); return el ? (el.type === 'checkbox' ? (el.checked ? 'ja' : 'nein') : el.value.trim()) : ''; };
      var leistungen = Array.prototype.map.call(af.querySelectorAll('input[name="leistung"]:checked'), function (c) { return c.value; });
      var f = { name: g('af-name'), phone: g('af-phone'), email: g('af-email'), street: g('af-street'), zip: g('af-zip'), city: g('af-city'), objekt: g('af-objekt'), flaeche: g('af-flaeche'), raeume: g('af-raeume'), zustand: g('af-zustand'), q: g('af-q'), date: g('af-date'), customerType: g('af-type'), message: g('af-msg') };
      if (!f.name || !f.phone || !f.city || !$('#af-privacy').checked) { msg.innerHTML = '<div class="notice err">Bitte Name, Telefon, Ort ausfüllen und der Datenschutzerklärung zustimmen.</div>'; return; }
      send('Projekt-Anfrage: ' + (leistungen[0] || 'Trockenbau') + (f.city ? ' in ' + f.city : ''), [
        'PROJEKT-ANFRAGE über die Website', ' ',
        'Name: ' + f.name, 'Telefon: ' + f.phone, 'E-Mail: ' + f.email, 'Kundentyp: ' + f.customerType, ' ',
        'Objekt: ' + [f.street, (f.zip + ' ' + f.city).trim()].filter(function (s) { return s; }).join(', '),
        'Objektart: ' + f.objekt, 'Zustand: ' + f.zustand, ' ',
        'Leistungen: ' + (leistungen.join(', ') || '–'),
        f.flaeche ? 'Fläche: ca. ' + f.flaeche + ' m²' : '',
        f.raeume ? 'Räume: ' + f.raeume : '',
        'Gewünschte Oberflächenqualität: ' + f.q,
        f.date ? 'Wunschtermin: ' + f.date : '', ' ',
        f.message ? 'Nachricht:\n' + f.message : ''
      ], msg, af);
    });
  }
})();
