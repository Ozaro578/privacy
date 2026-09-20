// Erzeugt die Abnahme-Seite (review/abnahme.html) für die fachliche Prüfung durch eine Fahrlehrerin: alle Fragen mit offener
// Verifikation, alle im Faktencheck korrigierten Fragen, Wissenseinträge, Vorfahrt-Situationen und Grundsatzfragen mit Bewertung.
// Aufruf: pnpm --filter @fahrpilot/content abnahme. Die Seite läuft ohne Server; Bewertungen bleiben im Browser und lassen sich als Text kopieren.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { questions, mediaForQuestion, mediaById, TOPIC_BY_CODE, priorityScenarios, knowledgeEntries } from "../src/index";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MEDIA_DIR = path.join(ROOT, "media");
const OUT = path.join(ROOT, "review", "abnahme.html");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const CORRECTED: Record<string, string> = {
  "own-gefahrenlehre-016": "Nach Ihrer Rückmeldung (Probezeitverlängerung) präzisiert: 'um zwei Jahre auf insgesamt vier Jahre' (§ 2a Abs. 2a StVG: Die Probezeit verlängert sich um zwei Jahre). Bitte bestätigen, dass die Formulierung so gemeint war.",
  "own-verkehrszeichen-034": "Nach Ihrer Rückmeldung klarer formuliert: Wer die Verengung auf seiner Seite hat, wartet und lässt den Gegenverkehr durchfahren (§ 6 StVO).",
  "own-befoerderung-030": "Nach Ihrer Rückmeldung um den Haus-zu-Haus-Verkehr ergänzt (§ 21a Abs. 1 Satz 2 Nr. 2 StVO). Die Ausnahmen Schrittgeschwindigkeit (Nr. 3) und gesundheitliche Ausnahmegenehmigung (§ 46 StVO) stehen ebenfalls im Gesetz und bleiben als richtig markiert; bitte gegenprüfen.",
  "own-halten_parken-023": "In Runde 1 noch nicht bewertet: Parkscheibe auf die folgende halbe Stunde einstellen, Höchstparkdauer ab dieser Zeit (§ 13 Abs. 2 StVO).",
};

const OPEN_POINTS = [
  { id: "g-7-2a", title: "Rechts schneller fahren außerorts (§ 7 Abs. 2a StVO)", text: "Innerorts ist geklärt (Kfz bis 3,5 t dürfen bei mehreren Fahrstreifen frei wählen und rechts schneller fahren, § 7 Abs. 3). Offen ist nur die Autobahn-Frage own-strassenbenutzung-008: Bei einer Schlange links darf rechts 'mit geringfügig höherer Geschwindigkeit' vorbeigefahren werden. Soll die konkrete Grenze (Differenz höchstens 20 km/h, wenn links langsamer als 60 km/h) ergänzt werden, und ist diese Grenze so richtig?" },
  { id: "g-ekfv", title: "E-Scooter (eKFV nach der Novelle 2025)", text: "Kernaussagen der App: ab 14 Jahren, 20 km/h, Radweg oder Fahrbahn, keine Helmpflicht, keine Mitfahrer, Blinkerpflicht für neue Fahrzeuge. Stimmt das mit der aktuellen Fassung überein? Betroffen: own-andere_teilnehmer-006 und -017. Falls unsicher: Welche Aussage konkret?" },
  { id: "g-fzv", title: "Zulassungsbescheinigung Teil I (FZV)", text: "own-fahrzeugtechnik-009 nennt § 11 FZV als Rechtsquelle (Fassung ab 2023). Stimmen Paragraf und Absatz? Soll i-Kfz (digitale Zulassung) erwähnt werden?" },
  { id: "g-klasse-b", title: "Umfang Klasse B nach der 4. EU-Führerscheinrichtlinie", text: "own-recht-009 beschreibt Klasse B mit 3.500 kg. Wurde die Richtlinie inzwischen in deutsches Recht umgesetzt (z. B. 4.250 kg für alternative Antriebe, digitaler Führerschein)? Auch own-recht-010: 'Foto des Führerscheins ersetzt das Dokument nicht'." },
  { id: "g-bussgeld", title: "Bußgeld- und Punkteangaben", text: "Alle genannten Beträge und Punkte (z. B. Verwarnungsgeld 10 Euro, 250 Euro bei Alkoholverbot in der Probezeit, 500 Euro und 1 Monat bei 0,5 Promille, 100 Euro Handy, Alpine-Symbol-Bußgeld) bitte gegen die aktuelle BKatV prüfen. Bitte im Kommentar nennen, welche Werte nicht mehr stimmen; nur die genannten werden geändert." },
  { id: "g-unfallflucht", title: "Unfallflucht bei reinem Sachschaden", text: "own-unfall_panne-014 nennt die 24-Stunden-Regel des § 142 Abs. 4 StGB (in Runde 1 als richtig bestätigt). Gab es die diskutierte Reform (Herabstufung zur Ordnungswidrigkeit bei Sachschaden)? Falls nicht bekannt: Punkt bleibt offen, Frage ist freigegeben." },
];

const inlineSvg = (code: string) => { const m = mediaForQuestion(code); if (!m) return null; return { svg: fs.readFileSync(path.join(MEDIA_DIR, m.file), "utf8").replace(/<title>[\s\S]*?<\/title>/, ""), alt: m.alt }; };
const qItem = (q: (typeof questions)[number], why: string, group: string) => ({
  id: q.code, group, label: `${TOPIC_BY_CODE[q.topic]?.nameDe ?? q.topic} · ${q.points} Punkte`, title: q.text, why,
  answers: q.kind === "numeric" ? [{ text: `Richtige Zahl: ${q.numericAnswer}${q.unit ? " " + q.unit : ""}${q.tolerance ? ` (Toleranz ±${q.tolerance})` : ""}`, correct: true, explanation: null }] : q.answers.map((a) => ({ text: a.text, correct: a.correct, explanation: a.explanation ?? null })),
  explanation: q.explanation, legal: q.legalReference ?? null, media: inlineSvg(q.code),
});

const items: any[] = [];
for (const q of questions) if (q.reviewStatus === "needs_verification") items.push(qItem(q, "Diese Frage ist in der App mit 'fachliche Verifikation ausstehend' gekennzeichnet, weil eine Rechtsänderung, eine Bußgeldhöhe oder ein Detailwortlaut nicht sicher bestätigt werden konnte.", "offen"));
for (const [code, note] of Object.entries(CORRECTED)) { const q = questions.find((x) => x.code === code); if (!q) throw new Error(code); if (q.reviewStatus !== "needs_verification") items.push(qItem(q, `Im Faktencheck korrigiert: ${note} Bitte die jetzige Fassung bestätigen.`, "korrigiert")); }
for (const k of knowledgeEntries) if (k.reviewStatus === "needs_verification") items.push({ id: `wissen-${k.slug}`, group: "offen", label: `Wissenseintrag · ${TOPIC_BY_CODE[k.topic]?.nameDe ?? k.topic}`, title: k.title, why: "Wissenseintrag mit offener Verifikation.", answers: [], explanation: `${k.summary} ${k.bodyMarkdown}`, legal: k.legalReference, media: null });
for (const sc of priorityScenarios) if (sc.reviewStatus === "needs_verification") { const m = mediaById(sc.media)!; items.push({ id: `vorfahrt-${sc.id}`, group: "offen", label: "Vorfahrt-Trainer", title: sc.title, why: "Situation mit offener Verifikation.", answers: sc.order.map((g, i) => ({ text: `${i + 1}. ${g.map((k) => sc.vehicles.find((v) => v.key === k)?.label ?? k).join(" und ")}`, correct: true, explanation: null })), explanation: sc.explanation, legal: sc.legalReference, media: { svg: fs.readFileSync(path.join(MEDIA_DIR, m.file), "utf8").replace(/<title>[\s\S]*?<\/title>/, ""), alt: m.alt } }); }
for (const p of OPEN_POINTS) items.push({ id: p.id, group: "grundsatz", label: "Grundsatzfrage", title: p.title, why: p.text, answers: [], explanation: null, legal: null, media: null });

const DATA = JSON.stringify(items).replace(/<\/script/g, "<\\/script");
const counts = { offen: items.filter((i) => i.group === "offen").length, korrigiert: items.filter((i) => i.group === "korrigiert").length, grundsatz: items.filter((i) => i.group === "grundsatz").length };

const html = `<title>FahrPilot Abnahme</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Source+Sans+3:ital,wght@0,400;0,600;1,400&display=swap">
<style>
:root{--paper:#f6f5f1;--surface:#ffffff;--ink:#1f1d1a;--ink-2:#4b4742;--ink-3:#807a72;--line:#e2dfd8;--accent:#1e40af;--accent-soft:#e6ecfa;--ok:#1f7a3f;--ok-soft:#e1f3e7;--bad:#b42318;--bad-soft:#fbe4e1;--warn:#a05a06;--warn-soft:#fdeed6;--focus:#1e40af}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--paper:#171614;--surface:#23211d;--ink:#efece6;--ink-2:#cdc7bd;--ink-3:#948d82;--line:#3a3731;--accent:#8fb0ff;--accent-soft:#1f2a4a;--ok:#6fd398;--ok-soft:#1b3326;--bad:#ff9a8d;--bad-soft:#4a1f1a;--warn:#f2b866;--warn-soft:#3f2c12;--focus:#8fb0ff}}
:root[data-theme="dark"]{--paper:#171614;--surface:#23211d;--ink:#efece6;--ink-2:#cdc7bd;--ink-3:#948d82;--line:#3a3731;--accent:#8fb0ff;--accent-soft:#1f2a4a;--ok:#6fd398;--ok-soft:#1b3326;--bad:#ff9a8d;--bad-soft:#4a1f1a;--warn:#f2b866;--warn-soft:#3f2c12;--focus:#8fb0ff}
*{box-sizing:border-box}
body{background:var(--paper);color:var(--ink);font:16px/1.5 "Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif;margin:0;padding-block:0 48px;padding-inline:16px}
h1,h2,h3{font-family:Manrope,"Source Sans 3",system-ui,sans-serif;text-wrap:balance;margin:0}
.wrap{max-width:760px;margin:0 auto}
header.top{position:sticky;top:env(safe-area-inset-top,0px);background:var(--paper);z-index:5;padding-block:12px 10px;border-bottom:1px solid var(--line);margin-inline:-16px;padding-inline:16px}
.top .row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;max-width:760px;margin:0 auto}
.top h1{font-size:20px;font-weight:800}
.progress{display:flex;align-items:center;gap:10px;font-variant-numeric:tabular-nums;color:var(--ink-2);font-size:14px}
.bar{width:140px;height:8px;border-radius:999px;background:var(--line);overflow:hidden}
.bar i{display:block;height:100%;background:var(--ok);width:0}
.intro{padding-block:20px 8px;color:var(--ink-2);max-width:65ch}
.intro p{margin:0 0 8px}
.filters{display:flex;gap:8px;flex-wrap:wrap;padding-block:8px 16px}
.chip{border:1px solid var(--line);background:var(--surface);color:var(--ink-2);border-radius:999px;padding:6px 12px;font:inherit;font-size:14px;cursor:pointer;min-height:36px}
.chip[aria-pressed="true"]{background:var(--accent-soft);border-color:var(--accent);color:var(--ink)}
section h2{font-size:17px;font-weight:700;padding-block:20px 8px;color:var(--ink);letter-spacing:.01em}
section p.lead{margin:0 0 12px;color:var(--ink-2);font-size:15px;max-width:65ch}
.item{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:16px;margin-block:0 14px}
.item[data-v="ok"]{border-color:var(--ok)}
.item[data-v="bad"]{border-color:var(--bad)}
.item[data-v="unsure"]{border-color:var(--warn)}
.meta{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);font-weight:600}
.meta code{font:inherit;letter-spacing:0;text-transform:none;color:var(--ink-3)}
.item h3{font-size:17px;font-weight:600;margin-block:6px 10px;line-height:1.35}
.why{background:var(--accent-soft);border-radius:10px;padding:8px 12px;font-size:14px;color:var(--ink-2);margin-block:0 12px}
figure{margin:0 0 12px;display:flex;justify-content:center;background:var(--paper);border-radius:10px;padding:8px}
figure svg{max-width:100%;height:auto;max-height:260px}
ul.ans{list-style:none;margin:0 0 10px;padding:0;display:grid;gap:6px}
ul.ans li{display:flex;gap:8px;align-items:flex-start;font-size:15px;padding:6px 10px;border-radius:8px;background:var(--paper)}
ul.ans li b{flex:0 0 22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:13px;color:#fff}
ul.ans li.t b{background:var(--ok)}
ul.ans li.f b{background:var(--ink-3)}
ul.ans li small{display:block;color:var(--ink-3);font-size:13px}
.expl{font-size:15px;color:var(--ink-2);margin:0 0 4px}
.legal{font-size:13px;color:var(--ink-3);margin:0 0 12px}
.verdict{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-block:8px}
.verdict button{min-height:44px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--ink);font:inherit;font-weight:600;cursor:pointer;padding:6px 8px}
.verdict button:focus-visible,.chip:focus-visible,textarea:focus-visible,.primary:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.verdict button[aria-pressed="true"].ok{background:var(--ok-soft);border-color:var(--ok);color:var(--ok)}
.verdict button[aria-pressed="true"].bad{background:var(--bad-soft);border-color:var(--bad);color:var(--bad)}
.verdict button[aria-pressed="true"].unsure{background:var(--warn-soft);border-color:var(--warn);color:var(--warn)}
textarea{width:100%;min-height:64px;border:1px solid var(--line);border-radius:10px;padding:8px 10px;font:inherit;font-size:15px;background:var(--paper);color:var(--ink);resize:vertical}
.saved{font-size:12px;color:var(--ink-3);min-height:18px;margin-top:4px}
.export{margin-block:24px;padding:16px;border:1px dashed var(--line);border-radius:14px;background:var(--surface)}
.export h2{padding-block:0 6px}
.primary{min-height:44px;border-radius:10px;border:0;background:var(--accent);color:#fff;font:inherit;font-weight:700;padding:8px 16px;cursor:pointer}
:root[data-theme="dark"] .primary{color:#0f172a}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .primary{color:#0f172a}}
.export textarea{margin-top:10px;min-height:120px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px}
.note{font-size:13px;color:var(--ink-3)}
@media (max-width:480px){.verdict{grid-template-columns:1fr 1fr 1fr}.verdict button{font-size:14px}.bar{width:90px}}
@media (prefers-reduced-motion: reduce){*{transition:none!important}}
</style>
<div class="wrap">
<header class="top"><div class="row"><h1>FahrPilot Abnahme</h1><div class="progress"><span id="count">0 von ${items.length}</span><div class="bar" aria-hidden="true"><i id="fill"></i></div></div></div></header>
<div class="intro">
<p>Fachliche Prüfung der Lerninhalte für Klasse B durch eine zugelassene Fahrlehrerin, Runde 2. Runde 1 ist eingearbeitet (37 Punkte bestätigt, 3 Fragen nach Ihren Hinweisen geändert). Rechtsstand der Inhalte: 1. September 2026.</p>
<p>Zu jedem Punkt bitte eine Bewertung setzen. Bei <strong>Ändern</strong> oder <strong>Unsicher</strong> hilft ein kurzer Kommentar, was stattdessen richtig ist. Bewertungen werden automatisch gespeichert; am Ende gibt es unten eine Zusammenfassung zum Kopieren.</p>
</div>
<div class="filters" role="group" aria-label="Filter"><button class="chip" data-f="alle" aria-pressed="true">Alle (${items.length})</button><button class="chip" data-f="offen" aria-pressed="false">Noch nicht bewertet</button><button class="chip" data-f="bad" aria-pressed="false">Ändern</button><button class="chip" data-f="unsure" aria-pressed="false">Unsicher</button></div>
<section id="s-offen"><h2>Offene Verifikation (${counts.offen})</h2><p class="lead">Diese Inhalte sind in der App als "fachliche Verifikation ausstehend" gekennzeichnet. Nach Ihrer Freigabe verschwindet die Kennzeichnung.</p><div id="l-offen"></div></section>
<section id="s-korrigiert"><h2>Nach Ihrer Rückmeldung geändert (${counts.korrigiert})</h2><p class="lead">Diese Fragen wurden nach Runde 1 geändert. Bitte die jetzige Fassung bestätigen oder beanstanden.</p><div id="l-korrigiert"></div></section>
<section id="s-grundsatz"><h2>Noch offene Grundsatzfragen (${counts.grundsatz})</h2><p class="lead">Punkte aus Runde 1 mit "Unsicher"; hier hilft ein kurzer Kommentar, was konkret unsicher ist.</p><div id="l-grundsatz"></div></section>
<div class="export"><h2>Zusammenfassung</h2><p class="note">Der Text enthält alle Bewertungen und Kommentare. Kopieren und an den Entwickler schicken, falls die automatische Speicherung nicht verfügbar ist.</p><button class="primary" id="copy" type="button">Zusammenfassung kopieren</button> <span class="saved" id="copied"></span><textarea id="summary" aria-label="Zusammenfassung" readonly></textarea></div>
</div>
<script>
(function(){
var ITEMS=${DATA};
var VERDICT={ok:"Richtig so",bad:"Ändern",unsure:"Unsicher"};
var state={};var db=null;var filter="alle";
try{state=JSON.parse(localStorage.getItem("fp-abnahme-r2")||"{}")||{};}catch(e){state={};}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function render(){
  ["offen","korrigiert","grundsatz"].forEach(function(g){
    var host=document.getElementById("l-"+g);host.innerHTML="";
    ITEMS.filter(function(i){return i.group===g;}).forEach(function(it){
      var st=state[it.id]||{};
      var card=document.createElement("article");card.className="item";card.id="it-"+it.id;card.dataset.v=st.verdict||"";
      var ans=it.answers.length?'<ul class="ans">'+it.answers.map(function(a){return '<li class="'+(a.correct?"t":"f")+'"><b aria-label="'+(a.correct?"richtig":"falsch")+'">'+(a.correct?"✓":"✗")+'</b><span>'+esc(a.text)+(a.explanation?'<small>'+esc(a.explanation)+'</small>':"")+'</span></li>';}).join("")+'</ul>':"";
      card.innerHTML='<div class="meta"><span>'+esc(it.label)+'</span><code>'+esc(it.id)+'</code></div><h3>'+esc(it.title)+'</h3><div class="why">'+esc(it.why)+'</div>'+(it.media?'<figure aria-label="'+esc(it.media.alt)+'">'+it.media.svg+'</figure>':"")+ans+(it.explanation?'<p class="expl">'+esc(it.explanation)+'</p>':"")+(it.legal?'<p class="legal">Rechtsgrundlage: '+esc(it.legal)+'</p>':"")
        +'<div class="verdict" role="group" aria-label="Bewertung">'+["ok","bad","unsure"].map(function(v){return '<button type="button" class="'+v+'" data-v="'+v+'" aria-pressed="'+(st.verdict===v)+'">'+VERDICT[v]+'</button>';}).join("")+'</div>'
        +'<label class="note" for="n-'+esc(it.id)+'">Kommentar (was ist stattdessen richtig?)</label><textarea id="n-'+esc(it.id)+'" placeholder="Optional">'+esc(st.note||"")+'</textarea><div class="saved" id="sv-'+esc(it.id)+'"></div>';
      card.querySelectorAll(".verdict button").forEach(function(b){b.addEventListener("click",function(){setVerdict(it.id,b.dataset.v);});});
      var ta=card.querySelector("textarea");var t;ta.addEventListener("input",function(){clearTimeout(t);t=setTimeout(function(){setNote(it.id,ta.value);},600);});
      host.appendChild(card);
    });
  });
  applyFilter();updateProgress();
}
function applyFilter(){
  ITEMS.forEach(function(it){var st=state[it.id]||{};var el=document.getElementById("it-"+it.id);if(!el)return;
    var show=filter==="alle"||(filter==="offen"&&!st.verdict)||(filter==="bad"&&st.verdict==="bad")||(filter==="unsure"&&st.verdict==="unsure");el.hidden=!show;});
}
function updateProgress(){var done=ITEMS.filter(function(i){return state[i.id]&&state[i.id].verdict;}).length;document.getElementById("count").textContent=done+" von "+ITEMS.length;document.getElementById("fill").style.width=(100*done/ITEMS.length)+"%";document.getElementById("summary").value=summary();}
function persistLocal(){try{localStorage.setItem("fp-abnahme-r2",JSON.stringify(state));}catch(e){}}
function mark(id,text){var el=document.getElementById("sv-"+id);if(el)el.textContent=text;}
function save(id){persistLocal();updateProgress();var st=state[id];var card=document.getElementById("it-"+id);if(card)card.dataset.v=st.verdict||"";
  if(!db){mark(id,"Lokal gespeichert");return;}
  mark(id,"Speichere …");
  db.doc("verdicts/"+id).set({verdict:st.verdict||null,note:st.note||"",updatedAt:new Date().toISOString()}).then(function(){mark(id,"Gespeichert");}).catch(function(){mark(id,"Lokal gespeichert, Synchronisierung nicht möglich");});
}
function setVerdict(id,v){state[id]=state[id]||{};state[id].verdict=v;var card=document.getElementById("it-"+id);card.querySelectorAll(".verdict button").forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.v===v));});save(id);applyFilter();}
function setNote(id,n){state[id]=state[id]||{};if(state[id].note===n)return;state[id].note=n;save(id);}
function summary(){var lines=["FahrPilot Abnahme Runde 2, Stand "+new Date().toLocaleDateString("de-DE")];ITEMS.forEach(function(it){var st=state[it.id]||{};lines.push("- "+it.id+" ["+(st.verdict?VERDICT[st.verdict]:"nicht bewertet")+"]"+(st.note?" "+st.note.replace(/\\s+/g," "):""));});return lines.join("\\n");}
document.querySelectorAll(".chip").forEach(function(c){c.addEventListener("click",function(){filter=c.dataset.f;document.querySelectorAll(".chip").forEach(function(x){x.setAttribute("aria-pressed",String(x===c));});applyFilter();});});
document.getElementById("copy").addEventListener("click",function(){var t=document.getElementById("summary");t.value=summary();var done=function(){document.getElementById("copied").textContent="Kopiert";};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t.value).then(done,function(){t.select();done();});}else{t.select();try{document.execCommand("copy");}catch(e){}done();}});
render();
if(window.claude&&window.claude.use){window.claude.use("db").then(function(ns){if(!ns)return;db=ns;
  db.collection("verdicts").get().then(function(snap){var changed=false;snap.docs.forEach(function(d){var data=d.data()||{};var local=state[d.id]||{};if(!local.verdict&&!local.note){state[d.id]={verdict:data.verdict||undefined,note:data.note||""};changed=true;}});if(changed){persistLocal();render();}}).catch(function(){});
}).catch(function(){});}
})();
</script>`;
fs.writeFileSync(OUT, html);
console.log("geschrieben", OUT, Math.round(fs.statSync(OUT).size / 1024), "KB", items.length, "Punkte", JSON.stringify(counts));
