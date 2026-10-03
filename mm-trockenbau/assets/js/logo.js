/* MM Trockenbau – Wortmarke als Inline-SVG (Fallback, solange assets/img/logo.png fehlt).
   Verwendung: <span data-logo></span> oder <span data-logo="mark"></span> (ohne Subline) */
(function () {
  function build(opts) {
    opts = opts || {};
    var sub = opts.sub !== false;
    var ink = 'var(--logo-ink,#1b1f26)';
    var M = 'M0,100 V0 H24 L50,44 L76,0 H100 V100 H77 V40 L50,82 L23,40 V100 Z';
    var w = 720, h = sub ? 250 : 215;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="MM Trockenbau" class="mm-logo">' +
      
      /* Dach */
      '<path d="M150 118 L360 18 L570 118" fill="none" stroke="' + ink + '" stroke-width="16" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="M360 18 L570 118" fill="none" stroke="var(--logo-blue,#1b5fc4)" stroke-width="16" stroke-linecap="round"/>' +
      '<rect x="340" y="52" width="40" height="40" rx="3" fill="' + ink + '"/><rect x="358" y="52" width="4" height="40" fill="#fff"/><rect x="340" y="70" width="40" height="4" fill="#fff"/>' +
      /* MM als Pfade */
      '<g transform="translate(248,66) scale(1.02)"><path d="' + M + '" fill="' + ink + '"/></g>' +
      '<g transform="translate(366,66) scale(1.02)"><path d="' + M + '" fill="var(--logo-blue,#1b5fc4)"/></g>' +
      /* Wortmarke */
      '<text x="' + (w / 2) + '" y="212" text-anchor="middle" font-family="\'Exo 2\',\'Segoe UI\',Arial,sans-serif" font-weight="800" font-size="44" letter-spacing="1"><tspan fill="' + ink + '">MM </tspan><tspan fill="var(--logo-blue,#1b5fc4)">TROCKENBAU</tspan></text>';
    if (sub) svg += '<text x="' + (w / 2) + '" y="240" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="600" font-size="15" letter-spacing="3" fill="' + ink + '">TROCKENBAU  ▪  INNENAUSBAU  ▪  DECKEN  ▪  WANDSYSTEME</text>';
    return svg + '</svg>';
  }
  window.MMLogo = { svg: build };
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-logo]').forEach(function (el) {
      var mark = el.getAttribute('data-logo') === 'mark';
      var img = new Image();
      img.onload = function () { el.innerHTML = '<img src="' + img.src + '" alt="MM Trockenbau – Trockenbau · Innenausbau · Decken · Wandsysteme" class="mm-logo">'; };
      img.onerror = function () { el.innerHTML = build({ sub: !mark }); };
      img.src = mark ? 'assets/img/logo-trans.png' : 'assets/img/logo.png'; if (el.hasAttribute("data-logo-force-svg")) { img.onerror(); img.onload = null; }
    });
  });
})();
