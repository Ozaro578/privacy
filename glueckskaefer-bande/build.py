# -*- coding: utf-8 -*-
import os, json
OUT = os.path.dirname(os.path.abspath(__file__))
DOMAIN = "https://ozaro578.github.io/privacy/glueckskaefer-bande"  # spaeter: https://www.glueckskaefer-bande.de

NAV = [
  ("index.html","Start"),
  ("ueber-mich.html","Über mich"),
  ("betreuung.html","Betreuung"),
  ("raeume.html","Räume"),
  ("tagesablauf.html","Ein Tag bei uns"),
  ("kontakt.html","Kontakt"),
]

# Logo: liegt assets/logo.png (das gemalte Glückskäfer-Logo) vor, wird es verwendet,
# sonst das einfache SVG-Logo.
PNG_LOGO = os.path.exists(os.path.join(OUT, "assets/logo.png"))
if PNG_LOGO:
    LOGO = '<img src="assets/logo.png" alt="" width="44" height="44" class="logo-img">'
    HERO_LOGO = '<img src="assets/logo.png" alt="Glückskäfer Bande – Kindertagespflege in Ostfildern-Kemnat" width="520" height="520">'
    FAVICON = 'assets/logo.png'
    FAVICON_TYPE = 'image/png'
    OG_IMAGE = 'assets/logo.png'
else:
    LOGO = open(os.path.join(OUT,"assets/logo.svg"),encoding="utf-8").read().replace('<svg ','<svg aria-hidden="true" focusable="false" ',1).replace(' role="img" aria-label="Glückskäfer Bande Logo"','')
    HERO_LOGO = LOGO
    FAVICON = 'assets/favicon.svg'
    FAVICON_TYPE = 'image/svg+xml'
    OG_IMAGE = 'assets/og-image.png'

def layout(slug, title, desc, body, extra_head="", schema=None):
    nav = "\n".join(
        f'<li><a href="{href}"{" aria-current=\"page\"" if href==slug else ""}>{label}</a></li>'
        for href,label in NAV if href!="kontakt.html")
    nav += '\n<li><a class="btn" href="kontakt.html">Platz anfragen</a></li>'
    canonical = f"{DOMAIN}/" if slug=="index.html" else f"{DOMAIN}/{slug}"
    ld = f'<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>' if schema else ""
    return f'''<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website">
<meta property="og:locale" content="de_DE">
<meta property="og:site_name" content="Glückskäfer Bande – Kindertagespflege Ostfildern-Kemnat">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{DOMAIN}/{OG_IMAGE}">
<meta name="theme-color" content="#F8F4EC">
<link rel="icon" href="{FAVICON}" type="{FAVICON_TYPE}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css">
{ld}{extra_head}
</head>
<body>
<a class="skip" href="#main" style="position:absolute;left:-999px">Zum Inhalt springen</a>
<header class="site-header">
  <div class="container nav">
    <a class="brand" href="index.html" aria-label="Glückskäfer Bande – Startseite">
      {LOGO}
      <span><span class="brand-name">Glückskäfer Bande</span><span class="brand-sub">Kindertagespflege · Ostfildern-Kemnat</span></span>
    </a>
    <button class="nav-toggle" aria-label="Menü öffnen" aria-expanded="false" aria-controls="nav-links"><span></span><span></span><span></span></button>
    <ul class="nav-links" id="nav-links">
{nav}
    </ul>
  </div>
</header>
<main id="main">
{body}
</main>
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <a class="brand" href="index.html" aria-label="Glückskäfer Bande">
          {LOGO}
          <span><span class="brand-name">Glückskäfer Bande</span><span class="brand-sub">Kindertagespflege</span></span>
        </a>
        <p style="margin-top:1rem;max-width:36ch;color:var(--ink-soft)">Ein kleiner Ort zum Wohlfühlen, Spielen, Entdecken und Wachsen in Ostfildern-Kemnat.</p>
        <p style="color:var(--sage-deep);font-weight:700">klein · familiär · liebevoll · voller Entdeckungen</p>
      </div>
      <div>
        <h4>Seiten</h4>
        <ul>
          <li><a href="ueber-mich.html">Über mich</a></li>
          <li><a href="betreuung.html">Meine Betreuung</a></li>
          <li><a href="raeume.html">Unsere Räume</a></li>
          <li><a href="tagesablauf.html">Ein Tag bei uns</a></li>
          <li><a href="kontakt.html">Freie Plätze &amp; Kontakt</a></li>
        </ul>
      </div>
      <div>
        <h4>Kontakt</h4>
        <ul>
          <li>Yasemin [Nachname]</li>
          <li>[Straße Hausnummer]</li>
          <li>73760 Ostfildern-Kemnat</li>
          <li><a href="mailto:hallo@glueckskaefer-bande.de">hallo@glueckskaefer-bande.de</a></li>
          <li><a href="tel:+49000000000">[Telefonnummer]</a></li>
        </ul>
      </div>
    </div>
    <div class="legal-line">
      <span>© <span data-year>2026</span> Glückskäfer Bande · Kindertagespflege Ostfildern-Kemnat</span>
      <span><a href="impressum.html">Impressum</a> · <a href="datenschutz.html">Datenschutz</a></span>
    </div>
  </div>
</footer>
<div class="sticky-cta" aria-label="Schnellkontakt">
  <a class="btn secondary" href="tel:+49000000000">Anrufen</a>
  <a class="btn" href="kontakt.html">Platz anfragen</a>
</div>
<script src="assets/main.js" defer></script>
</body>
</html>
'''

BUSINESS = {
  "@context":"https://schema.org",
  "@type":"ChildCare",
  "name":"Glückskäfer Bande – Kindertagespflege",
  "description":"Kleine, familiäre Kindertagespflege in Ostfildern-Kemnat. Liebevolle Betreuung in kleiner Gruppe mit viel Bewegung, Natur und Kreativität.",
  "url":DOMAIN+"/",
  "image":DOMAIN+"/"+OG_IMAGE,
  "telephone":"[Telefonnummer]",
  "email":"hallo@glueckskaefer-bande.de",
  "address":{"@type":"PostalAddress","streetAddress":"[Straße Hausnummer]","postalCode":"73760","addressLocality":"Ostfildern","addressRegion":"Baden-Württemberg","addressCountry":"DE"},
  "areaServed":["Ostfildern","Kemnat","Ruit","Nellingen","Scharnhausen","Esslingen","Stuttgart"],
  "founder":{"@type":"Person","name":"Yasemin"},
  "priceRange":"Auf Anfrage"
}

CTA = '''
<section class="tight">
  <div class="container">
    <div class="cta reveal">
      <div>
        <span class="eyebrow" style="color:var(--terra-soft)">Freie Plätze</span>
        <h2>Interesse an einem Betreuungsplatz?</h2>
        <p>Du möchtest dein Kind in einer kleinen, liebevollen und familiären Kindertagespflege betreuen lassen? Dann melde dich gerne bei mir. Ich freue mich darauf, dich und dein Kind kennenzulernen.</p>
      </div>
      <div class="btn-row" style="justify-content:flex-end;margin-top:0">
        <a class="btn" href="kontakt.html">Kontakt aufnehmen</a>
        <a class="btn secondary" href="tagesablauf.html#eingewoehnung">Zur Eingewöhnung</a>
      </div>
    </div>
  </div>
</section>'''

def img_src(slug):
    for ext in ("jpg","jpeg","png","webp","svg"):
        if os.path.exists(os.path.join(OUT,"assets","img",f"{slug}.{ext}")):
            return f"assets/img/{slug}.{ext}"
    return f"assets/img/{slug}.svg"

def photo(slug,label,extra=""):
    return f'<figure class="photo {extra}"><img src="{img_src(slug)}" alt="{label}" loading="lazy" width="800" height="600"><figcaption>{label}</figcaption></figure>'

def tile(slug,title,text,href):
    return f'<a class="tile reveal" href="{href}"><img src="{img_src(slug)}" alt="" loading="lazy"><span class="tile-text"><h3>{title}</h3><p>{text}</p><span class="tile-cta">Mehr erfahren →</span></span></a>'

pages = {}

# ---------------- START ----------------
TICKER_ITEMS = ["Kleine Gruppe – große Aufmerksamkeit","Betreuung im familiären Zuhause","Jeden Tag raus in die Natur",
                "Eingewöhnung Schritt für Schritt","Qualifizierte Kindertagespflegeperson","Ostfildern-Kemnat","Jetzt freie Plätze anfragen"]
ticker_html = "".join(f"<span>{t}</span>" for t in TICKER_ITEMS)

pages["index.html"] = dict(
 title="Glückskäfer Bande – Kindertagespflege in Ostfildern-Kemnat",
 desc="Kleine, familiäre Kindertagespflege in Ostfildern-Kemnat: liebevolle Betreuung in kleiner Gruppe, viel Bewegung, Natur und Kreativität. Jetzt freie Plätze anfragen.",
 schema=BUSINESS,
 body=f'''
<section class="hero hero-photo">
  <div class="hero-inner">
    <img class="hero-bg" src="{img_src("hero")}" alt="" fetchpriority="high">
    <div class="hero-shade"></div>
    <div class="hero-badge">{HERO_LOGO if PNG_LOGO else ""}</div>
    <div class="container">
      <div class="hero-content">
        <div class="tagline"><span>klein</span><span>familiär</span><span>liebevoll</span></div>
        <h1>Hier dürfen Kinder <em>Kinder</em> sein.</h1>
        <p class="lead">Die Glückskäfer Bande ist eine kleine Kindertagespflege in Ostfildern-Kemnat – ein zweites Zuhause auf Zeit, in dem dein Kind geborgen aufwächst, spielt, entdeckt und in seinem eigenen Tempo groß wird.</p>
        <div class="btn-row">
          <a class="btn" href="kontakt.html">Freie Plätze anfragen</a>
          <a class="btn secondary" href="#so-gehts">So läuft der Einstieg</a>
        </div>
      </div>
    </div>
  </div>
</section>

<div class="ticker" aria-hidden="true"><div class="ticker-track">{ticker_html}{ticker_html}</div></div>

<section class="tight">
  <div class="container">
    <div class="facts">
      <div class="fact reveal"><strong>max. 5</strong><span>Kinder in der Gruppe</span></div>
      <div class="fact reveal"><strong>1:5</strong><span>Betreuungsschlüssel – echte Zeit für jedes Kind</span></div>
      <div class="fact reveal"><strong>3</strong><span>eigene Kinder – Familienalltag aus Erfahrung</span></div>
      <div class="fact reveal"><strong>täglich</strong><span>Zeit draußen an der frischen Luft</span></div>
    </div>
  </div>
</section>

<section class="alt">
  <div class="container">
    <div class="center reveal">
      <span class="eyebrow">Was uns ausmacht</span>
      <h2>Vier Dinge, die dein Kind bei uns <em>jeden Tag</em> erlebt</h2>
    </div>
    <div class="tiles" style="margin-top:2.5rem">
      {tile("tile-gruppe","Kleine Gruppe","Viel Nähe, viel Zeit, viel Aufmerksamkeit für jedes einzelne Kind.","betreuung.html")}
      {tile("tile-natur","Bewegung & Natur","Laufen, klettern, balancieren – drinnen, im Garten und in der Natur.","betreuung.html")}
      {tile("tile-kreativ","Kreativ sein","Malen, basteln, Musik, Geschichten – mit allen Sinnen entdecken.","raeume.html")}
      {tile("tile-geborgen","Geborgenheit","Kuscheln, trösten, ausruhen – Sicherheit, die wachsen lässt.","tagesablauf.html")}
    </div>
  </div>
</section>

<section>
  <div class="container">
    <div class="feature reveal">
      <div class="feature-img"><img src="{img_src("yasemin")}" alt="Yasemin – Kindertagespflegeperson der Glückskäfer Bande" loading="lazy"></div>
      <div class="feature-body">
        <span class="eyebrow">Über mich</span>
        <h2>Hallo, ich bin Yasemin.</h2>
        <p>Ich bin qualifizierte Kindertagespflegeperson und selbst Mutter von drei Kindern. Ich weiß, wie wichtig es Eltern ist, ihr Kind in liebevollen und vertrauensvollen Händen zu wissen – und genau diese Sicherheit möchte ich euch geben.</p>
        <p>Für mich ist Kindertagespflege mehr als Betreuung: Jedes Kind ist eine eigene Persönlichkeit, mit eigenem Tempo und eigenen Bedürfnissen.</p>
        <a class="btn secondary" href="ueber-mich.html">Mehr über mich</a>
      </div>
    </div>
  </div>
</section>

<section class="sage-bg">
  <div class="container">
    <div class="center reveal">
      <span class="eyebrow">Unsere Räume</span>
      <h2>Ein kleines <em>zweites Zuhause</em> auf Zeit</h2>
      <p class="lead">Kindgerecht, gemütlich und mit viel Liebe eingerichtet – mit Bereichen zum Kuscheln, Lesen, Basteln, Spielen, Bewegen und einem Garten zum Toben.</p>
    </div>
    <div class="gallery" style="margin-top:2.5rem">
      <div class="reveal">{photo("kuschelecke","Kuschelecke")}</div>
      <div class="reveal">{photo("basteln","Bastelbereich")}</div>
      <div class="reveal">{photo("garten","Garten & Draußen")}</div>
    </div>
    <div class="center" style="margin-top:2rem"><a class="btn secondary" href="raeume.html">Alle Räume ansehen</a></div>
  </div>
</section>

<section id="so-gehts" class="alt">
  <div class="container">
    <div class="center reveal">
      <span class="eyebrow">So einfach geht's</span>
      <h2>In drei Schritten zum Betreuungsplatz</h2>
    </div>
    <div class="steps" style="margin-top:3rem">
      <div class="step reveal"><h3>Anfrage senden</h3><p>Schreib mir kurz, ab wann und an welchen Tagen du Betreuung brauchst. Ich melde mich zeitnah zurück.</p></div>
      <div class="step reveal"><h3>Kennenlernen</h3><p>Wir treffen uns bei mir zu Hause. Du siehst die Räume, wir sprechen über dein Kind, eure Wünsche und alle Fragen.</p></div>
      <div class="step reveal"><h3>Eingewöhnung</h3><p>Schritt für Schritt, im Tempo deines Kindes – bis aus dem neuen Ort ein vertrauter Ort geworden ist.</p></div>
    </div>
    <div class="center" style="margin-top:2.2rem"><a class="btn" href="kontakt.html">Jetzt Anfrage senden</a></div>
  </div>
</section>

<section>
  <div class="container">
    <div class="feature reverse reveal">
      <div class="feature-img"><img src="{img_src("eingewoehnung")}" alt="Eingewöhnung: ein Kind kommt an der Hand eines Elternteils an" loading="lazy"></div>
      <div class="feature-body">
        <span class="eyebrow">Eingewöhnung</span>
        <h2>Vertrauen braucht Zeit – und die bekommt dein Kind.</h2>
        <p>Der Start in die Kindertagespflege ist für jedes Kind anders. Deshalb gestalten wir die Eingewöhnung individuell und Schritt für Schritt. Auch ihr Eltern werdet in dieser Zeit eng begleitet.</p>
        <a class="btn secondary" href="tagesablauf.html#eingewoehnung">Wie die Eingewöhnung abläuft</a>
      </div>
    </div>
  </div>
</section>

<section class="sage-bg">
  <div class="container">
    <div class="center reveal">
      <span class="eyebrow">Meine Werte</span>
      <h2>Das steht bei uns im Mittelpunkt</h2>
    </div>
    <div class="values" style="margin-top:2.5rem">
      <div class="value reveal"><div class="icon">🌸</div><strong>Geborgenheit</strong></div>
      <div class="value reveal"><div class="icon terra">🌿</div><strong>Respekt</strong></div>
      <div class="value reveal"><div class="icon">🧸</div><strong>Vertrauen</strong></div>
      <div class="value reveal"><div class="icon terra">🌱</div><strong>Selbstständigkeit</strong></div>
      <div class="value reveal"><div class="icon">🏃‍♀️</div><strong>Bewegung</strong></div>
      <div class="value reveal"><div class="icon terra">🌳</div><strong>Natur</strong></div>
      <div class="value reveal"><div class="icon">🎨</div><strong>Kreativität</strong></div>
      <div class="value reveal"><div class="icon terra">🤝</div><strong>Miteinander</strong></div>
    </div>
  </div>
</section>

<section class="alt">
  <div class="container">
    <div class="center reveal">
      <span class="eyebrow">Häufige Fragen</span>
      <h2>Was Eltern uns oft fragen</h2>
    </div>
    <div class="faq narrow" style="margin-top:2rem">
      <details><summary>Ab welchem Alter betreust du Kinder?</summary><p>In der Regel ab [Alter, z. B. 12 Monaten] bis zum Kindergarteneintritt. Sprich mich gerne an – wir schauen gemeinsam, ob es passt.</p></details>
      <details><summary>Was kostet die Betreuung?</summary><p>Kindertagespflege wird in Baden-Württemberg öffentlich gefördert. Die Eltern zahlen einen einkommensabhängigen Kostenbeitrag an das Jugendamt des Landkreises Esslingen, ähnlich wie bei einer Krippe. Ich erkläre dir gerne, wie der Antrag läuft.</p></details>
      <details><summary>Wie läuft die Eingewöhnung ab?</summary><p>Individuell und in kleinen Schritten: erst gemeinsam mit Mama oder Papa, dann kurze Trennungen, die langsam länger werden – immer im Tempo deines Kindes.</p></details>
      <details><summary>Was ist, wenn du krank bist oder Urlaub hast?</summary><p>Für Ausfallzeiten gibt es im Landkreis Esslingen ein Vertretungskonzept für die Kindertagespflege. Urlaubszeiten plane ich frühzeitig und spreche sie mit euch ab.</p></details>
      <details><summary>Gibt es Essen bei dir?</summary><p>Ja, wir essen gemeinsam am Tisch. Frühstück, Mittagessen und Snacks werden frisch zubereitet – Unverträglichkeiten und Wünsche besprechen wir vorab.</p></details>
    </div>
  </div>
</section>

<section class="center">
  <div class="container">
    <div class="divider">🐞</div>
    <blockquote class="quote reveal">„Kinder sind wie kleine Sonnen – sie bringen Licht in unser Leben.“<small>☀️ Glückskäfer Bande</small></blockquote>
  </div>
</section>
{CTA}
''')

# ---------------- ÜBER MICH ----------------
pages["ueber-mich.html"] = dict(
 title="Über mich – Yasemin | Glückskäfer Bande Kindertagespflege",
 desc="Hallo, ich bin Yasemin – qualifizierte Kindertagespflegeperson und Mutter von drei Kindern. Lerne mich und meine Haltung zur Kindertagespflege in Ostfildern-Kemnat kennen.",
 body=f'''
<section class="page-intro">
  <div class="container split">
    <div>
      <span class="eyebrow">Über mich</span>
      <h1>Hallo, ich bin Yasemin.</h1>
      <p class="lead">Ich bin qualifizierte Kindertagespflegeperson und betreue Kinder mit viel Herz, Geduld und Aufmerksamkeit.</p>
    </div>
    {photo("yasemin","Yasemin – Kindertagespflegeperson der Glückskäfer Bande","tall")}
  </div>
</section>

<section class="alt">
  <div class="container narrow reveal">
    <h2>Mehr als nur Betreuung</h2>
    <p>Für mich bedeutet Kindertagespflege mehr als nur Betreuung. Mir ist wichtig, jedes Kind als eigene Persönlichkeit wahrzunehmen, seine Bedürfnisse zu respektieren und ihm die Sicherheit zu geben, die es für seine Entwicklung braucht.</p>
    <p>Ich bin selbst Mutter von drei Kindern. Dadurch kenne ich das Familienleben nicht nur aus beruflicher Sicht, sondern auch aus dem Alltag einer Familie. Ich weiß, wie wichtig es Eltern ist, ihr Kind in liebevollen und vertrauensvollen Händen zu wissen.</p>
    <p>Genau diese familiäre Atmosphäre möchte ich auch in meiner Kindertagespflege schaffen. Mein Wunsch ist, dass sich jedes Kind bei der Glückskäfer Bande willkommen, sicher und wohl fühlt.</p>
  </div>
</section>

<section>
  <div class="container">
    <div class="grid cols-3">
      <article class="card reveal">
        <div class="icon">🎓</div>
        <h3>Qualifiziert</h3>
        <p>Qualifizierte Kindertagespflegeperson mit Pflegeerlaubnis des Jugendamts [Landkreis Esslingen – bitte Qualifikation/Kurs ergänzen].</p>
      </article>
      <article class="card reveal">
        <div class="icon terra">👩‍👧‍👦</div>
        <h3>Selbst Mutter</h3>
        <p>Drei eigene Kinder – und damit ein echtes Gespür für den Familienalltag, für Bedürfnisse und für das, was Eltern wirklich wichtig ist.</p>
      </article>
      <article class="card reveal">
        <div class="icon">🤍</div>
        <h3>Mit Herz</h3>
        <p>Geduld, Aufmerksamkeit und echte Zuwendung – jeden Tag, für jedes Kind.</p>
      </article>
    </div>
  </div>
</section>

<section class="sage-bg">
  <div class="container">
    <div class="split reveal">
      <div>
        <span class="eyebrow">Familiär</span>
        <h2>Betreuung bei mir zu Hause</h2>
        <p>Da die Betreuung bei mir zu Hause stattfindet, erleben die Kinder eine familiäre Umgebung. Meine eigenen Kinder gehören ebenfalls zu unserem Familienalltag. Dadurch entsteht eine natürliche Atmosphäre, in der die Kinder miteinander spielen, voneinander lernen und gemeinsam schöne Momente erleben können.</p>
        <p><strong>Bei uns darf gelacht, gespielt, entdeckt, getröstet und gemeinsam gewachsen werden.</strong></p>
      </div>
      {photo("eingang","Eingang & Außenbereich der Glückskäfer Bande")}
    </div>
  </div>
</section>
{CTA}
''')

# ---------------- BETREUUNG ----------------
pages["betreuung.html"] = dict(
 title="Meine Betreuung – Kleine Gruppe, große Aufmerksamkeit | Glückskäfer Bande",
 desc="Kleine Gruppe, viel Bewegung, Natur und Kreativität: So sieht die bedürfnisorientierte Betreuung bei der Glückskäfer Bande in Ostfildern-Kemnat aus.",
 body=f'''
<section class="page-intro">
  <div class="container narrow center">
    <span class="eyebrow">Meine Betreuung</span>
    <h1>Kleine Gruppe – <em>große</em> Aufmerksamkeit</h1>
    <p class="lead">Bei der Glückskäfer Bande betreue ich eine kleine Gruppe von Kindern. Dadurch bleibt genügend Zeit, jedes Kind individuell wahrzunehmen und auf seine Bedürfnisse einzugehen.</p>
  </div>
</section>

<section class="alt">
  <div class="container split reveal">
    <div>
      <h2>Kinder dürfen bei mir …</h2>
      <ul class="checklist">
        <li>spielen und entdecken</li>
        <li>kreativ sein</li>
        <li>Bücher anschauen und Geschichten hören</li>
        <li>sich bewegen und aktiv sein</li>
        <li>Zeit an der frischen Luft verbringen</li>
        <li>frei spielen und eigene Ideen entwickeln</li>
        <li>Nähe, Sicherheit und Geborgenheit erfahren</li>
      </ul>
    </div>
    {photo("spielen","Spielbereich")}
  </div>
</section>

<section>
  <div class="container split reverse reveal">
    <div>
      <span class="eyebrow">Bewegung &amp; Entdecken</span>
      <h2>Kinder lernen mit ihrem ganzen Körper</h2>
      <p>Bewegung ist ein wichtiger Bestandteil unseres Tages. Kinder haben einen natürlichen Bewegungsdrang – und den möchte ich unterstützen.</p>
      <p>Ob drinnen oder draußen: Wir laufen, klettern, balancieren, spielen, entdecken die Natur und sammeln dabei ganz nebenbei neue Erfahrungen.</p>
    </div>
    <div class="gallery" style="grid-template-columns:1fr 1fr">
      {photo("bewegung","Bewegungsbereich")}
      {photo("garten","Garten & Draußen")}
    </div>
  </div>
</section>

<section class="sage-bg">
  <div class="container narrow center reveal">
    <span class="eyebrow">Individuell &amp; bedürfnisorientiert</span>
    <h2>Jedes Kind ist anders.</h2>
    <p class="lead">Jedes Kind hat sein eigenes Tempo, seine eigenen Bedürfnisse, Interessen und seine eigene Persönlichkeit.</p>
    <p>Deshalb gibt es bei mir nicht den Anspruch, dass jedes Kind alles zur gleichen Zeit können oder machen muss. Ich beobachte, begleite und unterstütze die Kinder dort, wo sie gerade in ihrer Entwicklung stehen.</p>
    <p class="quote" style="margin-top:1.5rem">Kinder dürfen bei mir Kinder sein.</p>
  </div>
</section>

<section class="alt">
  <div class="container">
    <div class="center reveal">
      <span class="eyebrow">Zusammenarbeit mit den Eltern</span>
      <h2>Betreuung funktioniert nur mit Vertrauen</h2>
      <p class="lead">Eine gute Betreuung funktioniert für mich nur mit gegenseitigem Vertrauen. Deshalb ist mir eine offene und respektvolle Zusammenarbeit mit den Eltern besonders wichtig.</p>
    </div>
    <div class="grid cols-3" style="margin-top:2.5rem">
      <article class="card reveal"><div class="icon">💬</div><h3>Regelmäßiger Austausch</h3><p>Kurze Gespräche beim Bringen und Abholen, Entwicklungsgespräche und ein offenes Ohr für Fragen.</p></article>
      <article class="card reveal"><div class="icon terra">📋</div><h3>Klare Absprachen</h3><p>Verlässliche Vereinbarungen zu Zeiten, Essen, Schlafen und allem, was euch als Familie wichtig ist.</p></article>
      <article class="card reveal"><div class="icon">🤝</div><h3>Respektvoller Umgang</h3><p>Denn wenn Eltern Vertrauen haben, kann auch das Kind in Ruhe ankommen.</p></article>
    </div>
  </div>
</section>
{CTA}
''')

# ---------------- RÄUME ----------------
pages["raeume.html"] = dict(
 title="Unsere Räumlichkeiten | Glückskäfer Bande Kindertagespflege Ostfildern-Kemnat",
 desc="Kindgerecht, gemütlich und mit viel Liebe eingerichtet: Kuschelecke, Bücherbereich, Bastel- und Spielbereich, Bewegungsbereich und Garten bei der Glückskäfer Bande.",
 body=f'''
<section class="page-intro">
  <div class="container narrow center">
    <span class="eyebrow">Unsere Räumlichkeiten</span>
    <h1>Kindgerecht, gemütlich und mit viel Liebe eingerichtet</h1>
    <p class="lead">Die Kinder sollen sich nicht wie in einer Einrichtung fühlen, sondern wie an einem kleinen zweiten Zuhause auf Zeit.</p>
  </div>
</section>

<section class="alt">
  <div class="container">
    <div class="gallery">
      <div class="reveal">{photo("eingang","Eingang & Außenbereich")}</div>
      <div class="reveal">{photo("kuschelecke","Kuschelecke – Kuscheln und Ausruhen")}</div>
      <div class="reveal">{photo("buecher","Bücherbereich – Lesen und Bücher entdecken")}</div>
      <div class="reveal">{photo("basteln","Bastelbereich – Basteln und kreativ sein")}</div>
      <div class="reveal">{photo("spielen","Spielbereich – Spielen, Lernen und Rollenspiele")}</div>
      <div class="reveal">{photo("bewegung","Bewegungsbereich")}</div>
      <div class="reveal">{photo("essen","Essbereich – gemeinsame Mahlzeiten")}</div>
      <div class="reveal">{photo("garten","Garten & Draußen")}</div>
    </div>
  </div>
</section>

<section>
  <div class="container">
    <div class="center reveal">
      <h2>Verschiedene Bereiche zum …</h2>
    </div>
    <div class="grid cols-3" style="margin-top:2rem">
      <article class="card reveal"><div class="icon">🧸</div><h3>Kuscheln &amp; Ausruhen</h3><p>Ein ruhiger Rückzugsort zum Ankommen, Trösten und Kraft tanken.</p></article>
      <article class="card reveal"><div class="icon terra">📚</div><h3>Lesen &amp; Bücher entdecken</h3><p>Bilderbücher, Geschichten und gemütliche Vorlesezeit.</p></article>
      <article class="card reveal"><div class="icon">🎭</div><h3>Rollenspiele</h3><p>Kinderküche, Verkleiden und in andere Rollen schlüpfen.</p></article>
      <article class="card reveal"><div class="icon terra">🎨</div><h3>Basteln &amp; kreativ sein</h3><p>Malen, Kleben, Kneten – mit allen Sinnen gestalten.</p></article>
      <article class="card reveal"><div class="icon">🧩</div><h3>Spielen &amp; Lernen</h3><p>Altersgerechtes Spielmaterial, das zum Entdecken einlädt.</p></article>
      <article class="card reveal"><div class="icon terra">🏃‍♀️</div><h3>Bewegen</h3><p>Platz zum Toben, Klettern und Balancieren – drinnen wie draußen.</p></article>
    </div>
  </div>
</section>

<section class="center sage-bg">
  <div class="container">
    <blockquote class="quote reveal">„Hier dürfen Kinder Kinder sein, wachsen, entdecken und sich rundum wohlfühlen.“</blockquote>
  </div>
</section>
{CTA}
''')

# ---------------- TAGESABLAUF ----------------
pages["tagesablauf.html"] = dict(
 title="Ein Tag bei der Glückskäfer Bande – Tagesablauf & Eingewöhnung",
 desc="So sieht ein Tag in der Kindertagespflege Glückskäfer Bande aus: Ankommen, freies Spiel, gemeinsame Mahlzeiten, Zeit draußen, Ruhezeit – und eine behutsame Eingewöhnung.",
 body=f'''
<section class="page-intro">
  <div class="container narrow center">
    <span class="eyebrow">Ein Tag bei der Glückskäfer Bande</span>
    <h1>Struktur, die Sicherheit gibt – und Raum für Spontanes</h1>
    <p class="lead">Unser Tagesablauf gibt den Kindern Orientierung und Sicherheit, bleibt aber gleichzeitig flexibel und an ihre Bedürfnisse angepasst.</p>
  </div>
</section>

<section class="alt">
  <div class="container split">
    <div>
      <h2>Unser Alltag besteht aus …</h2>
      <ol class="timeline">
        <li class="reveal"><span class="dot">🤍</span><h3>Ankommen und Begrüßen</h3><p>Jedes Kind wird persönlich empfangen und darf in Ruhe ankommen.</p></li>
        <li class="reveal"><span class="dot">🧸</span><h3>Freies Spiel</h3><p>Zeit für eigene Ideen, Rollenspiele und Entdeckungen.</p></li>
        <li class="reveal"><span class="dot">🍎</span><h3>Gemeinsame Mahlzeiten</h3><p>Zusammen am Tisch essen, probieren und genießen.</p></li>
        <li class="reveal"><span class="dot">🎨</span><h3>Kreative Angebote</h3><p>Malen, Basteln, Musik – passend zur Jahreszeit und zu den Interessen der Kinder.</p></li>
        <li class="reveal"><span class="dot">🏃‍♀️</span><h3>Bewegung und Spiel</h3><p>Laufen, klettern, balancieren – drinnen und draußen.</p></li>
        <li class="reveal"><span class="dot">🌳</span><h3>Zeit draußen</h3><p>Frische Luft im Garten, auf dem Spielplatz und in der Natur.</p></li>
        <li class="reveal"><span class="dot">📚</span><h3>Bücher und Geschichten</h3><p>Vorlesen, Bilderbücher anschauen, Sprache entdecken.</p></li>
        <li class="reveal"><span class="dot">😴</span><h3>Ruhe- und Schlafenszeit</h3><p>Zur Ruhe kommen und neue Kraft sammeln.</p></li>
        <li class="reveal"><span class="dot">🌸</span><h3>Gemeinsames Entdecken</h3><p>Dabei ist mir wichtig, dass nicht jeder Tag gleich aussieht.</p></li>
      </ol>
      <p><strong>Kinder brauchen Struktur – aber auch Raum für spontane Entdeckungen.</strong></p>
    </div>
    <div class="gallery" style="grid-template-columns:1fr;align-self:start;position:sticky;top:100px">
      {photo("essen","Essbereich – gemeinsame Mahlzeiten")}
      {photo("buecher","Bücherbereich")}
    </div>
  </div>
</section>

<section id="eingewoehnung">
  <div class="container split reverse reveal">
    <div>
      <span class="eyebrow">Eingewöhnung</span>
      <h2>Schritt für Schritt ein vertrauter Ort</h2>
      <p>Der Start in die Kindertagespflege ist für jedes Kind anders. Deshalb gestalten wir die Eingewöhnung individuell und Schritt für Schritt.</p>
      <p>Das Kind bekommt die Zeit, die es braucht, um Vertrauen aufzubauen und sich in der neuen Umgebung sicher zu fühlen. Auch die Eltern werden während dieser Zeit eng begleitet.</p>
      <p><strong>Unser Ziel: Aus einem neuen Ort soll Schritt für Schritt ein vertrauter Ort werden.</strong></p>
    </div>
    <div class="grid" style="gap:1rem">
      <article class="card"><div class="icon">1</div><h3>Kennenlernen</h3><p>Erstes Treffen mit Eltern und Kind – wir lernen uns in Ruhe kennen.</p></article>
      <article class="card"><div class="icon terra">2</div><h3>Gemeinsame Zeit</h3><p>Mama oder Papa bleiben zunächst dabei. Das Kind erkundet die neue Umgebung in Sicherheit.</p></article>
      <article class="card"><div class="icon">3</div><h3>Erste Trennung</h3><p>Kurze Trennungen, die langsam länger werden – im Tempo des Kindes.</p></article>
      <article class="card"><div class="icon terra">4</div><h3>Angekommen</h3><p>Das Kind fühlt sich sicher, lässt sich trösten und geht seinen Interessen nach.</p></article>
    </div>
  </div>
</section>
{CTA}
''')

# ---------------- KONTAKT ----------------
pages["kontakt.html"] = dict(
 title="Freie Plätze & Kontakt | Glückskäfer Bande Kindertagespflege Ostfildern-Kemnat",
 desc="Betreuungsplatz in Ostfildern-Kemnat gesucht? Jetzt Kontakt mit der Glückskäfer Bande aufnehmen – Betreuungszeiten werden individuell vereinbart.",
 schema=BUSINESS,
 body=f'''
<section class="page-intro">
  <div class="container narrow center">
    <span class="eyebrow">Freie Plätze</span>
    <h1>Interesse an einem <em>Betreuungsplatz</em>?</h1>
    <p class="lead">Du möchtest dein Kind in einer kleinen, liebevollen und familiären Kindertagespflege betreuen lassen? Dann melde dich gerne bei mir. Ich freue mich darauf, dich und dein Kind kennenzulernen. 🤍</p>
  </div>
</section>

<section class="alt">
  <div class="container contact-grid">
    <div class="reveal">
      <h2>So erreichst du mich</h2>
      <ul class="contact-list">
        <li><div class="icon">📍</div><div><strong>Adresse</strong><br>Glückskäfer Bande · Yasemin [Nachname]<br>[Straße Hausnummer]<br>73760 Ostfildern-Kemnat</div></li>
        <li><div class="icon terra">📞</div><div><strong>Telefon</strong><br><a href="tel:+49000000000">[Telefonnummer eintragen]</a></div></li>
        <li><div class="icon">✉️</div><div><strong>E-Mail</strong><br><a href="mailto:hallo@glueckskaefer-bande.de">hallo@glueckskaefer-bande.de</a></div></li>
        <li><div class="icon terra">📅</div><div><strong>Betreuungszeiten</strong><br>Die möglichen Betreuungszeiten werden individuell mit den Eltern besprochen und entsprechend der verfügbaren Betreuungsplätze vereinbart.<br>
          <div class="notice" style="margin-top:.7rem">[Hier die genauen Betreuungszeiten eintragen, z. B. Mo–Fr 7:30–15:00 Uhr]</div></div></li>
      </ul>
      <h3 style="margin-top:2rem">Gut zu wissen</h3>
      <ul class="checklist">
        <li>Kindertagespflege mit Pflegeerlaubnis des Jugendamts [Landkreis Esslingen]</li>
        <li>Betreuung für Kinder ab [Alter] Jahren / Monaten</li>
        <li>Förderung über die Stadt Ostfildern / den Landkreis Esslingen möglich – ich berate gerne</li>
      </ul>
    </div>
    <div class="card reveal">
      <h2 style="font-size:1.5rem">Platz anfragen</h2>
      <p style="color:var(--ink-soft)">Schreib mir kurz, wann und wie lange du Betreuung suchst. Ich melde mich zeitnah bei dir.</p>
      <form action="mailto:hallo@glueckskaefer-bande.de" method="post" enctype="text/plain">
        <label for="name">Dein Name</label>
        <input id="name" name="Name" type="text" required autocomplete="name">
        <label for="email">E-Mail</label>
        <input id="email" name="E-Mail" type="email" required autocomplete="email">
        <label for="phone">Telefon (optional)</label>
        <input id="phone" name="Telefon" type="tel" autocomplete="tel">
        <label for="age">Alter des Kindes</label>
        <input id="age" name="Alter des Kindes" type="text" placeholder="z. B. 14 Monate">
        <label for="start">Gewünschter Betreuungsbeginn</label>
        <input id="start" name="Betreuungsbeginn" type="month">
        <label for="msg">Deine Nachricht</label>
        <textarea id="msg" name="Nachricht" rows="5" placeholder="Wunschzeiten, Fragen, Besonderheiten …"></textarea>
        <p class="hint">Mit dem Absenden öffnet sich dein E-Mail-Programm. Deine Angaben werden nur zur Bearbeitung der Anfrage verwendet (siehe <a href="datenschutz.html">Datenschutz</a>).</p>
        <button class="btn" type="submit" style="border:none;cursor:pointer;margin-top:.8rem">Anfrage senden</button>
      </form>
    </div>
  </div>
</section>

<section class="center">
  <div class="container">
    <blockquote class="quote reveal">„Kinder sind wie kleine Sonnen – sie bringen Licht in unser Leben.“<small>☀️ Glückskäfer Bande</small></blockquote>
  </div>
</section>
''')

# ---------------- IMPRESSUM ----------------
pages["impressum.html"] = dict(
 title="Impressum | Glückskäfer Bande Kindertagespflege",
 desc="Impressum der Kindertagespflege Glückskäfer Bande in Ostfildern-Kemnat.",
 extra_head='<meta name="robots" content="noindex,follow">',
 body='''
<section class="page-intro"><div class="container legal"><span class="eyebrow">Rechtliches</span><h1>Impressum</h1></div></section>
<section class="alt tight"><div class="container legal">
<h2>Angaben gemäß § 5 DDG</h2>
<p>Glückskäfer Bande – Kindertagespflege<br>Yasemin [Nachname]<br>[Straße Hausnummer]<br>73760 Ostfildern-Kemnat</p>
<h2>Kontakt</h2>
<p>Telefon: [Telefonnummer]<br>E-Mail: <a href="mailto:hallo@glueckskaefer-bande.de">hallo@glueckskaefer-bande.de</a></p>
<h2>Berufsbezeichnung und Aufsicht</h2>
<p>Berufsbezeichnung: Kindertagespflegeperson (verliehen in der Bundesrepublik Deutschland)<br>
Tätigkeit auf Grundlage einer Pflegeerlaubnis nach § 43 SGB VIII<br>
Zuständige Aufsichtsbehörde: Landratsamt Esslingen – Amt für Jugend und Bildung (Kindertagespflege), Pulverwiesen 11, 73726 Esslingen am Neckar [bitte prüfen]</p>
<h2>Umsatzsteuer</h2>
<p>Die Leistungen der Kindertagespflege sind gemäß § 4 Nr. 25 UStG von der Umsatzsteuer befreit. [Alternativ: Umsatzsteuer-ID eintragen, falls vorhanden]</p>
<h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
<p>Yasemin [Nachname], Anschrift wie oben</p>
<h2>Haftung für Inhalte</h2>
<p>Die Inhalte dieser Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann jedoch keine Gewähr übernommen werden. Als Diensteanbieterin bin ich für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.</p>
<h2>Haftung für Links</h2>
<p>Diese Website enthält gegebenenfalls Links zu externen Websites Dritter, auf deren Inhalte ich keinen Einfluss habe. Für diese fremden Inhalte ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.</p>
<h2>Urheberrecht</h2>
<p>Die auf dieser Website veröffentlichten Inhalte, Fotos und das Logo unterliegen dem deutschen Urheberrecht. Jede Verwertung außerhalb der Grenzen des Urheberrechts bedarf der schriftlichen Zustimmung.</p>
<div class="notice" style="margin-top:2rem">Hinweis: Alle Angaben in eckigen Klammern [ … ] müssen vor Veröffentlichung ausgefüllt und geprüft werden.</div>
</div></section>
''')

# ---------------- DATENSCHUTZ ----------------
pages["datenschutz.html"] = dict(
 title="Datenschutzerklärung | Glückskäfer Bande Kindertagespflege",
 desc="Datenschutzerklärung der Website der Kindertagespflege Glückskäfer Bande in Ostfildern-Kemnat.",
 extra_head='<meta name="robots" content="noindex,follow">',
 body='''
<section class="page-intro"><div class="container legal"><span class="eyebrow">Rechtliches</span><h1>Datenschutzerklärung</h1><p class="lead">Stand: Oktober 2026</p></div></section>
<section class="alt tight"><div class="container legal">
<h2>1. Verantwortliche</h2>
<p>Verantwortliche im Sinne der Datenschutz-Grundverordnung (DSGVO):<br>Yasemin [Nachname] – Glückskäfer Bande Kindertagespflege<br>[Straße Hausnummer], 73760 Ostfildern-Kemnat<br>E-Mail: <a href="mailto:hallo@glueckskaefer-bande.de">hallo@glueckskaefer-bande.de</a></p>

<h2>2. Allgemeine Hinweise</h2>
<p>Der Schutz deiner persönlichen Daten ist mir wichtig. Diese Website wird als rein informative Website betrieben. Es werden keine Cookies zu Analyse- oder Werbezwecken gesetzt und keine Tracking-Dienste eingesetzt.</p>

<h2>3. Hosting und Server-Logfiles</h2>
<p>Beim Aufruf dieser Website werden durch den Hosting-Anbieter automatisch Informationen in sogenannten Server-Logfiles gespeichert (IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seite, verwendeter Browser und Betriebssystem). Diese Daten dienen ausschließlich der Sicherstellung eines störungsfreien Betriebs und der Sicherheit der Website. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).</p>
<p>Hosting-Anbieter: [Name und Anschrift des Hosters, z. B. GitHub Pages / Netlify / IONOS – bitte eintragen]. Mit dem Hoster besteht, soweit erforderlich, ein Vertrag zur Auftragsverarbeitung.</p>

<h2>4. Schriftarten (Google Fonts)</h2>
<p>Diese Website nutzt zur einheitlichen Darstellung Schriftarten von Google Fonts (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland). Beim Aufruf einer Seite lädt dein Browser die benötigten Schriftarten von Google-Servern; dabei wird deine IP-Adresse an Google übermittelt. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Weitere Informationen: <a href="https://policies.google.com/privacy" rel="noopener" target="_blank">policies.google.com/privacy</a>.</p>
<p><em>Empfehlung: Vor Veröffentlichung die Schriftarten lokal einbinden, dann entfällt dieser Abschnitt.</em></p>

<h2>5. Kontaktaufnahme</h2>
<p>Wenn du mich per E-Mail, Telefon oder über das Kontaktformular (das dein E-Mail-Programm öffnet) kontaktierst, werden deine Angaben zur Bearbeitung der Anfrage und für mögliche Anschlussfragen gespeichert. Diese Daten gebe ich nicht ohne deine Einwilligung weiter. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Anbahnung eines Betreuungsvertrags) bzw. Art. 6 Abs. 1 lit. f DSGVO. Die Daten werden gelöscht, sobald sie für die Bearbeitung nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>

<h2>6. Daten im Rahmen der Kindertagespflege</h2>
<p>Daten, die im Rahmen eines Betreuungsverhältnisses erhoben werden (z. B. Angaben zum Kind, Notfallkontakte, Gesundheitsinformationen), werden ausschließlich zur Erfüllung des Betreuungsvertrags und der gesetzlichen Pflichten gegenüber dem Jugendamt verarbeitet (Art. 6 Abs. 1 lit. b und c DSGVO, Art. 9 Abs. 2 lit. a DSGVO bei Einwilligung). Fotos von Kindern werden nur mit schriftlicher Einwilligung der Sorgeberechtigten veröffentlicht.</p>

<h2>7. Deine Rechte</h2>
<ul class="checklist">
  <li>Auskunft (Art. 15 DSGVO)</li>
  <li>Berichtigung (Art. 16 DSGVO)</li>
  <li>Löschung (Art. 17 DSGVO)</li>
  <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
  <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
  <li>Widerspruch (Art. 21 DSGVO)</li>
  <li>Widerruf erteilter Einwilligungen (Art. 7 Abs. 3 DSGVO)</li>
  <li>Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO)</li>
</ul>
<p>Zuständige Aufsichtsbehörde: Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg, Lautenschlagerstraße 20, 70173 Stuttgart.</p>

<h2>8. Änderungen</h2>
<p>Ich behalte mir vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen entspricht.</p>
<div class="notice" style="margin-top:2rem">Hinweis: Alle Angaben in eckigen Klammern [ … ] müssen vor Veröffentlichung ausgefüllt werden. Diese Vorlage ersetzt keine Rechtsberatung.</div>
</div></section>
''')

for slug, p in pages.items():
    html = layout(slug, p["title"], p["desc"], p["body"], p.get("extra_head",""), p.get("schema"))
    with open(os.path.join(OUT, slug), "w", encoding="utf-8") as f:
        f.write(html)
    print("wrote", slug)

# 404
with open(os.path.join(OUT,"404.html"),"w",encoding="utf-8") as f:
    f.write(layout("404.html","Seite nicht gefunden | Glückskäfer Bande","Diese Seite wurde nicht gefunden.",'''
<section class="page-intro center"><div class="container narrow">
<span class="eyebrow">404</span><h1>Hoppla – hier ist kein Glückskäfer gelandet.</h1>
<p class="lead">Die gesuchte Seite gibt es leider nicht. Zurück zur Startseite?</p>
<a class="btn" href="index.html">Zur Startseite</a>
</div></section>''', '<meta name="robots" content="noindex">'))

# sitemap + robots
urls = [DOMAIN+"/"] + [f"{DOMAIN}/{s}" for s in pages if s not in ("index.html","impressum.html","datenschutz.html")]
with open(os.path.join(OUT,"sitemap.xml"),"w") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n")
with open(os.path.join(OUT,"robots.txt"),"w") as f:
    f.write(f"User-agent: *\nAllow: /\nSitemap: {DOMAIN}/sitemap.xml\n")
print("sitemap/robots ok")
