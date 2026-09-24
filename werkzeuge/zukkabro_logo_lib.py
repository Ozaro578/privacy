# ZUKKABRO – Zeichen-Bausteine (Krone, Blasenschrift, Tropfenschrift) für Logo und Verpackung
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

FD = __import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)), '..', 'zukkabro', 'public', 'assets', 'fonts')
TITAN = FD + '/titan-one-latin-400-normal.woff2'
WET = FD + '/rubik-wet-paint-latin-400-normal.woff2'
FRED = FD + '/fredoka-latin-600-normal.woff2'
_fonts = {}
def font(p):
    if p not in _fonts: _fonts[p] = TTFont(p)
    return _fonts[p]

def text(fp, s, size, tracking=0, x0=0, y0=0):
    f = font(fp); gs = f.getGlyphSet(); cmap = f.getBestCmap(); k = size / f['head'].unitsPerEm
    x = x0; d = []; bp = BoundsPen(gs)
    for ch in s:
        if ch == ' ':
            x += gs[cmap[32]].width * k + tracking; continue
        g = cmap[ord(ch)]; pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (k, 0, 0, -k, x, y0)))
        gs[g].draw(TransformPen(bp, (k, 0, 0, -k, x, y0)))
        d.append(pen.getCommands()); x += gs[g].width * k + tracking
    return ' '.join(d), bp.bounds

def width(fp, s, size, tracking=0):
    d, b = text(fp, s, size, tracking); return b[2] - b[0], b

DEFS = '''<defs>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0a8"/><stop offset=".35" stop-color="#f2c14e"/><stop offset=".7" stop-color="#d4952a"/><stop offset="1" stop-color="#9c6414"/></linearGradient>
  <linearGradient id="goldEdge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7d273"/><stop offset="1" stop-color="#b07418"/></linearGradient>
  <linearGradient id="cream" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#fff8ef"/><stop offset="1" stop-color="#f1dfcb"/></linearGradient>
  <linearGradient id="pink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7cc3"/><stop offset=".5" stop-color="#ff2e98"/><stop offset="1" stop-color="#d6076f"/></linearGradient>
  <linearGradient id="blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fe0ff"/><stop offset="1" stop-color="#1a93e8"/></linearGradient>
  <radialGradient id="ball" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="#fff6c8"/><stop offset=".45" stop-color="#f0b93f"/><stop offset="1" stop-color="#9c6414"/></radialGradient>
</defs>'''

def crown(x, y, s=1.0, rot=0):
    return f'''<g transform="translate({x} {y}) rotate({rot}) scale({s})" stroke-linejoin="round">
  <path d="M8,104 L0,38 L40,72 L60,16 L88,66 L110,0 L132,66 L160,16 L180,72 L220,38 L212,104 Z" fill="url(#gold)" stroke="#4a2608" stroke-width="7"/>
  <path d="M22,90 L18,56 L42,80 M198,90 L202,56 L178,80" fill="none" stroke="#fff3bf" stroke-width="4" stroke-linecap="round" opacity=".7"/>
  <rect x="2" y="96" width="216" height="30" rx="10" fill="url(#gold)" stroke="#4a2608" stroke-width="7"/>
  <rect x="12" y="101" width="196" height="6" rx="3" fill="#fff3bf" opacity=".7"/>
  <ellipse cx="60" cy="111" rx="10" ry="7" fill="#ff2e98" stroke="#4a2608" stroke-width="3"/>
  <ellipse cx="110" cy="111" rx="12" ry="8" fill="#1ea4f0" stroke="#4a2608" stroke-width="3"/>
  <ellipse cx="160" cy="111" rx="10" ry="7" fill="#ff2e98" stroke="#4a2608" stroke-width="3"/>
  <g stroke="#4a2608" stroke-width="5" fill="url(#ball)">
    <circle cx="0" cy="36" r="13"/><circle cx="60" cy="14" r="13"/><circle cx="110" cy="-2" r="15"/><circle cx="160" cy="14" r="13"/><circle cx="220" cy="36" r="13"/>
  </g>
</g>'''

def bubble_word(d):
    # 3D-Blasenschrift: Schatten, Goldkante, dunkle Kontur, cremeweiße Füllung, Glanz
    return f'''<g stroke-linejoin="round" stroke-linecap="round">
  <path d="{d}" transform="translate(0 18)" fill="#2b140a" stroke="#2b140a" stroke-width="34"/>
  <path d="{d}" transform="translate(0 10)" fill="url(#goldEdge)" stroke="url(#goldEdge)" stroke-width="22"/>
  <path d="{d}" fill="#2b140a" stroke="#2b140a" stroke-width="16"/>
  <path d="{d}" fill="url(#cream)"/>
  <path d="{d}" fill="none" stroke="#ffffff" stroke-width="3" opacity=".9" transform="translate(-2 -3)"/>
</g>'''

def drip_word(d):
    return f'''<g stroke-linejoin="round" stroke-linecap="round">
  <path d="{d}" transform="translate(0 10)" fill="#2b140a" stroke="#2b140a" stroke-width="22"/>
  <path d="{d}" fill="#2b140a" stroke="#2b140a" stroke-width="12"/>
  <path d="{d}" fill="url(#pink)"/>
  <path d="{d}" fill="none" stroke="#ffc2e3" stroke-width="2.5" opacity=".9" transform="translate(-1.5 -2)"/>
</g>'''

def drop(x, y, r, color, rot=0):
    return (f'<g transform="translate({x} {y}) rotate({rot})"><path d="M0,{-r*1.9} C{r*0.9},{-r*0.7} {r},{-r*0.2} {r},{r*0.25} A{r},{r} 0 1 1 {-r},{r*0.25} C{-r},{-r*0.2} {-r*0.9},{-r*0.7} 0,{-r*1.9} Z" '
            f'fill="url(#{color})" stroke="#2b140a" stroke-width="3"/><ellipse cx="{-r*0.35}" cy="{r*0.05}" rx="{r*0.25}" ry="{r*0.4}" fill="#fff" opacity=".6"/></g>')

def dot(x, y, r, color):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#{color})" stroke="#2b140a" stroke-width="2.5"/><circle cx="{x-r*0.35}" cy="{y-r*0.35}" r="{r*0.28}" fill="#fff" opacity=".7"/>'

def svg(w, h, body, title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{title}"><title>{title}</title>{DEFS}{body}</svg>\n'

