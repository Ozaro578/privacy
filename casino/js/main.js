// Titan's Vault: Ascension — UI / controller. Plays back engine events; never decides money.
import * as E from './engine.js';
import { sfx, unlock, setEnabled } from './audio.js';

// ---------- config ----------
const BETS_INT = [0.20, 0.50, 1, 2, 5, 10, 20, 50, 100];
const BETS_DE = [0.10, 0.20, 0.50, 1.00];
const DE_SPIN_MS = 5000;
const START_BALANCE = 1000;
const SAVE_KEY = 'hnx_titans_vault_v1';

// Symbol presentation: image if assets/sym/<id>.png exists, else emoji / text.
const SYMS = {
  cherry: { e: '🍒', name: 'Kirsche' }, lemon: { e: '🍋', name: 'Zitrone' }, grape: { e: '🍇', name: 'Traube' }, bell: { e: '🔔', name: 'Glocke' },
  bar: { e: 'BAR', txt: true, name: 'BAR' }, diamond: { e: '💎', name: 'Diamant' }, seven: { e: '7', txt: true, name: 'Sieben' }, crown: { e: '👑', name: 'Titanenkrone' },
  wild: { e: '🗿', name: 'Wild (Titan)' }, scatter: { e: '🏛️', name: 'Tresor (Scatter)' }, coin: { e: '🪙', name: 'Münze' },
  keyB: { e: '🔑', name: 'Bronze‑Schlüssel' }, keyS: { e: '🗝️', name: 'Silber‑Schlüssel' }, keyG: { e: '✨', name: 'Gold‑Schlüssel' },
};
const hasImg = {};

// ---------- state ----------
let S = { balance: START_BALANCE, betIdx: 2, de: false, sound: true, gamble: true, rounds: 0, bigWin: 0 };
try { const s = localStorage.getItem(SAVE_KEY); if (s) S = Object.assign(S, JSON.parse(s)); } catch (e) {}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }

const rng = E.cryptoRng();
let busy = false, auto = false, turbo = false, lastSpinStart = 0, sessionStart = Date.now();
let currentRows = 4;

// ---------- dom ----------
const $ = id => document.getElementById(id);
const grid = $('grid'), frame = $('frame'), msg = $('msg'), banner = $('banner');
const fmt = n => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const wait = ms => new Promise(r => setTimeout(r, turbo && !S.de ? ms * 0.4 : ms));

function bets() { return S.de ? BETS_DE : BETS_INT; }
function bet() { const b = bets(); if (S.betIdx >= b.length) S.betIdx = b.length - 1; return b[S.betIdx]; }

function renderHud(win = 0) {
  $('balance').textContent = fmt(S.balance);
  $('bet').textContent = fmt(bet());
  $('win').textContent = fmt(win);
}
function setMsg(t, big) { msg.textContent = t; msg.classList.toggle('big', !!big); }
function showBanner(t, ms = 900) { banner.innerHTML = `<span>${t}</span>`; banner.classList.remove('hidden'); return wait(ms).then(() => banner.classList.add('hidden')); }
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.remove('hidden'); setTimeout(() => el.classList.add('hidden'), 1800); }
function setLadder(step, ladder) {
  const el = $('ladder'); el.innerHTML = '';
  ladder.forEach((m, i) => { const s = document.createElement('span'); s.className = 'rung' + (i === Math.min(step, ladder.length - 1) && step >= 0 ? ' on' : ''); s.textContent = 'x' + m; el.appendChild(s); });
}

// ---------- grid rendering ----------
function symHTML(id) {
  const d = SYMS[id];
  if (hasImg[id]) return `<div class="sym"><img src="assets/sym/${id}.png" alt="${d.name}"></div>`;
  return `<div class="sym${d.txt ? ' txt' : ''}">${d.e}</div>`;
}
function cellClass(id) { return 'cell ' + (['wild', 'scatter', 'coin', 'keyB', 'keyS', 'keyG'].includes(id) ? id : ''); }

function drawGrid(g, rows, opts = {}) {
  currentRows = rows;
  grid.className = 'grid rows' + rows;
  grid.innerHTML = '';
  for (let c = 0; c < g.length; c++) {
    const col = document.createElement('div'); col.className = 'col';
    for (let r = 0; r < rows; r++) {
      const id = g[c][r];
      const cell = document.createElement('div');
      cell.className = cellClass(id); cell.dataset.c = c; cell.dataset.r = r;
      cell.innerHTML = symHTML(id);
      if (opts.drop && (!opts.only || opts.only.has(c + ':' + r))) { cell.classList.add('drop'); cell.style.animationDelay = (opts.stagger ? c * 70 + (rows - r) * 20 : 0) + 'ms'; }
      col.appendChild(cell);
    }
    grid.appendChild(col);
  }
}
const cellAt = (c, r) => grid.children[c] && grid.children[c].children[r];

async function animateInitial(g, rows) {
  drawGrid(g, rows, { drop: true, stagger: true });
  sfx.reel();
  for (let c = 0; c < 5; c++) { await wait(80); sfx.land(c); }
  await wait(200);
}

// ---------- spin cycle playback ----------
async function playSpin(res, ctx) {
  // ctx: { ladder, fsMode }
  let runningWin = ctx.runningWin || 0;
  setLadder(-1, ctx.ladder);
  frame.classList.toggle('asc', !!ctx.sticky);
  let first = true;
  for (const ev of res.events) {
    if (ev.t === 'grid') {
      if (first) { await animateInitial(ev.grid, ev.rows); first = false; }
      else { drawGrid(ev.grid, ev.rows, { drop: true }); await wait(300); }
    } else if (ev.t === 'key') {
      sfx.key();
      const cell = cellAt(ev.at[0], ev.at[1]); if (cell) cell.classList.add('hit');
      if (ev.kind === 'bronze') {
        await showBanner(`🔑 Bronze‑Schlüssel<br><small>Mystery: ${SYMS[ev.from].name} → ${SYMS[ev.to].name}</small>`, 1100);
        for (const [c, r] of ev.cells) { const x = cellAt(c, r); if (x) { x.classList.add('flash'); x.innerHTML = symHTML(ev.to); } }
      } else if (ev.kind === 'silver') {
        await showBanner('🗝️ Silber‑Schlüssel<br><small>Walze ' + (ev.reel + 1) + ' wird WILD</small>', 1100);
        for (let r = 0; r < currentRows; r++) { const x = cellAt(ev.reel, r); if (x) { x.className = cellClass('wild') + ' flash'; x.innerHTML = symHTML('wild'); } }
      } else {
        sfx.titan();
        await showBanner('✨ Gold‑Schlüssel<br><small>ASCENSION: 5 Reihen, 3125 Wege</small>', 1300);
        if (ev.grid) { frame.classList.add('asc'); drawGrid(ev.grid, ev.rows, { drop: true }); }
      }
      await wait(350);
    } else if (ev.t === 'win') {
      setLadder(ev.step, ctx.ladder);
      if (ev.step > 0) sfx.mult(ev.step);
      const cells = new Set();
      for (const w of ev.wins) for (const [c, r] of w.cells) cells.add(c + ':' + r);
      for (const k of cells) { const [c, r] = k.split(':').map(Number); const x = cellAt(c, r); if (x) x.classList.add('hit'); }
      sfx.win(ev.wins.length + ev.step);
      runningWin += ev.amount;
      const best = ev.wins.slice().sort((a, b) => b.pay - a.pay)[0];
      setMsg(`${SYMS[best.symbol].name} ×${best.count} · ${best.ways} Wege · x${ev.mult}  →  +${fmt(ev.amount)}`, ev.mult > 1);
      $('win').textContent = fmt(runningWin); $('win').parentElement.classList.add('bump');
      await wait(ev.step === 0 ? 900 : 700);
      $('win').parentElement.classList.remove('bump');
      for (const k of cells) { const [c, r] = k.split(':').map(Number); const x = cellAt(c, r); if (x) { x.classList.remove('hit'); x.classList.add('pop'); } }
      sfx.pop();
      await wait(320);
    } else if (ev.t === 'cascade') {
      drawGrid(ev.grid, ev.rows, { drop: true });
      sfx.reel();
      await wait(420);
    }
  }
  if (res.scatterPay) {
    for (const col of grid.children) for (const x of col.children) if (x.classList.contains('scatter')) x.classList.add('hit');
    runningWin += res.scatterPay;
    $('win').textContent = fmt(runningWin);
    sfx.win(4);
    await showBanner(`🏛️ ${res.scatters} Tresore<br><small>+${fmt(res.scatterPay)}</small>`, 1000);
  }
  if (res.triggerVault) {
    for (const col of grid.children) for (const x of col.children) if (x.classList.contains('coin')) x.classList.add('hit');
    sfx.coin(); await wait(600);
  }
  return runningWin;
}

// ---------- features ----------
function chooseFS() {
  return new Promise(resolve => {
    const ov = $('fsChoice'); ov.classList.remove('hidden');
    const done = e => { const b = e.target.closest('.choice'); if (!b) return; ov.removeEventListener('click', done); ov.classList.add('hidden'); sfx.click(); resolve(b.dataset.fs); };
    ov.addEventListener('click', done);
  });
}
const FS_NAMES = { storm: '⚡ Sturm', warrior: '⚔️ Krieger', titan: '🔱 Titan' };

async function playFreeSpins(fs) {
  const bar = $('fsbar'); bar.classList.remove('hidden');
  $('fsType').textContent = FS_NAMES[fs.fsType];
  let total = 0;
  await showBanner(`${FS_NAMES[fs.fsType]}<br><small>${fs.spins.length ? E.FS_SPINS[fs.fsType] : 0} Freispiele</small>`, 1200);
  for (const s of fs.spins) {
    $('fsLeft').textContent = s.spinsLeft + 1;
    setMsg('Freispiel läuft …');
    total = await playSpin(s, { ladder: E.MULT_FS[fs.fsType], sticky: fs.fsType === 'titan', runningWin: total });
    $('fsWin').textContent = fmt(total);
    $('fsLeft').textContent = s.spinsLeft;
    if (s.retrigger) { sfx.key(); await showBanner('🏛️ +5 Freispiele', 900); }
    await wait(350);
  }
  bar.classList.add('hidden'); frame.classList.remove('asc');
  await summary('Freispiele beendet', fs.total);
  return fs.total;
}

async function playVault(v) {
  const ov = $('vault'), vg = $('vgrid'); ov.classList.remove('hidden'); $('vrClose').classList.add('hidden'); $('vrTotal').textContent = '';
  sfx.titan();
  const label = cn => cn.kind === 'collector' ? 'SAMMLER' : cn.kind === 'bonus' ? cn.name.toUpperCase() : cn.value + 'x';
  const draw = (g, prev) => {
    vg.innerHTML = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
      const cn = g[c][r]; const d = document.createElement('div');
      d.className = 'vcell' + (cn ? ' on ' + cn.kind : '');
      if (cn && prev && !prev[c][r]) d.classList.add('new');
      if (cn) d.textContent = label(cn);
      vg.appendChild(d);
    }
  };
  let prev = null;
  for (let i = 0; i < v.rounds.length; i++) {
    const rd = v.rounds[i];
    $('vrSpins').textContent = rd.spinsLeft;
    if (i > 0) { for (const x of vg.children) if (!x.classList.contains('on')) x.classList.add('spin'); sfx.reel(); await wait(700); }
    draw(rd.grid, prev);
    let cnt = 0; for (const col of rd.grid) for (const x of col) if (x) cnt++;
    $('vrCoins').textContent = cnt;
    if (rd.newCoins) sfx.coin();
    prev = rd.grid; await wait(800);
  }
  if (v.grand) { sfx.big(); $('vrTotal').textContent = 'VOLLER TRESOR! ' + fmt(v.total); }
  else { sfx.win(5); $('vrTotal').textContent = (v.collectors ? `Sammler ×${v.collectors} · ` : '') + 'Gewinn ' + fmt(v.total); }
  $('vrClose').classList.remove('hidden');
  await new Promise(r => { $('vrClose').onclick = () => { sfx.click(); r(); }; });
  ov.classList.add('hidden');
  return v.total;
}

function summary(title, amount) {
  return new Promise(r => { $('sumTitle').textContent = title; $('sumAmount').textContent = fmt(amount); $('summary').classList.remove('hidden');
    $('sumOk').onclick = () => { $('summary').classList.add('hidden'); sfx.click(); r(); }; });
}
function bigWin(amount, x) {
  return new Promise(r => {
    $('bwTitle').textContent = x >= 500 ? 'TITAN WIN' : x >= 100 ? 'MEGA WIN' : 'BIG WIN';
    const el = $('bwAmount'); $('bigwin').classList.remove('hidden'); sfx.big();
    let t0 = performance.now(); const dur = 1800;
    const tick = now => { const p = Math.min(1, (now - t0) / dur); el.textContent = fmt(amount * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    $('bwOk').onclick = () => { $('bigwin').classList.add('hidden'); sfx.click(); r(); };
  });
}

// Gamble: true 50/50 double-or-nothing, max 5 steps, capped by max win. Disabled in DE mode.
async function offerGamble(amount) {
  if (S.de || !S.gamble || auto || amount <= 0 || amount >= bet() * 200) return amount;
  const ov = $('gamble'), card = $('gCard'); ov.classList.remove('hidden');
  let steps = 0;
  return new Promise(resolve => {
    const fin = v => { ov.classList.add('hidden'); $('gRed').onclick = $('gBlack').onclick = $('gTake').onclick = null; resolve(v); };
    const show = () => { $('gAmount').textContent = fmt(amount); card.className = 'gcard'; card.textContent = '?'; };
    show();
    const guess = async g => {
      $('gRed').disabled = $('gBlack').disabled = true;
      const res = E.gamble(rng, amount, g); sfx.card();
      card.classList.add('flip'); await wait(250);
      card.className = 'gcard ' + res.card; card.textContent = res.card === 'red' ? '♥' : '♠';
      await wait(700);
      $('gRed').disabled = $('gBlack').disabled = false;
      if (!res.won) { sfx.lose(); toast('Verloren'); return fin(0); }
      amount = res.amount; steps++; sfx.win(3);
      if (steps >= 5 || amount >= bet() * 200) return fin(amount);
      show();
    };
    $('gRed').onclick = () => guess('red'); $('gBlack').onclick = () => guess('black'); $('gTake').onclick = () => { sfx.click(); fin(amount); };
  });
}

// ---------- round ----------
async function doSpin() {
  if (busy) return;
  const b = bet();
  if (S.balance < b) { toast('Nicht genug Spielgeld – im Menü zurücksetzen'); auto = false; $('autoBtn').classList.remove('on'); return; }
  busy = true; lastSpinStart = Date.now();
  $('spinBtn').disabled = true; $('betMinus').disabled = $('betPlus').disabled = true;
  S.balance -= b; S.rounds++; save(); renderHud(0);
  setMsg('Viel Glück …'); sfx.click();

  const base = E.spin({ bet: b, rng, mode: 'base' });
  let total = await playSpin(base, { ladder: E.MULT_BASE });
  let vaultWin = 0, fsWin = 0;
  if (base.triggerVault) { await showBanner('🪙 VAULT RUSH!', 1000); vaultWin = await playVault(E.vaultRush({ bet: b, rng, coins: base.coins })); total += vaultWin; }
  if (base.triggerFree) {
    await showBanner('🏛️ FREISPIELE!', 900);
    const type = await chooseFS();
    fsWin = await playFreeSpins(E.freeSpins({ bet: b, rng, fsType: type })); total += fsWin;
  }
  total = Math.min(total, E.MAX_WIN * b);
  frame.classList.remove('asc');

  if (total >= b * 20) await bigWin(total, total / b);
  else if (total > 0 && !base.triggerFree && !base.triggerVault) total = await offerGamble(total);

  if (total > 0) { S.balance += total; if (total > S.bigWin) S.bigWin = total; setMsg('Gewinn ' + fmt(total) + ' (' + (total / b).toFixed(1) + 'x)', true); }
  else setMsg('Kein Gewinn – der Titan schläft noch');
  save(); renderHud(total);
  busy = false;
  $('betMinus').disabled = $('betPlus').disabled = false;
  await armSpin();
  if (auto && !S.de) { await wait(600); if (auto) doSpin(); }
}

// DE mode: a new game may only start 5 s after the previous one started, on an explicit tap.
async function armSpin() {
  if (!S.de) { $('spinBtn').disabled = false; return; }
  const cd = $('cd');
  let left = DE_SPIN_MS - (Date.now() - lastSpinStart);
  if (left > 0) {
    cd.classList.remove('hidden');
    while (left > 0) { cd.textContent = (left / 1000).toFixed(1) + ' s'; await new Promise(r => setTimeout(r, 100)); left = DE_SPIN_MS - (Date.now() - lastSpinStart); }
    cd.classList.add('hidden');
  }
  $('spinBtn').disabled = false;
}

// ---------- menu / settings ----------
function applyMode() {
  const de = S.de;
  document.body.classList.toggle('de', de);
  if (de) { auto = false; turbo = false; $('autoBtn').classList.remove('on'); $('turboBtn').classList.remove('on'); }
  $('autoBtn').disabled = de; $('turboBtn').disabled = de;
  $('optDE').checked = de; $('optSound').checked = S.sound; $('optGamble').checked = S.gamble;
  const b = bets(); if (S.betIdx >= b.length) S.betIdx = b.length - 1;
  renderHud(0);
  $('rtpbox').innerHTML = de
    ? `<b>Deutschland‑Modus aktiv.</b> Durchschnittliche Auszahlungsquote (RTP): <b>${RTP.rtp}</b> je gesetztem Euro. Wahrscheinlichkeit des Höchstgewinns (5000x): <b>${RTP.maxp}</b>. Höchsteinsatz 1,00 €, mindestens 5 Sekunden je Spiel, kein Autoplay.`
    : `RTP (theoretisch, 10 Mio. simulierte Runden): <b>${RTP.rtp}</b> · Volatilität: <b>hoch</b> · Trefferquote: <b>${RTP.hit}</b> · Freispiele: <b>${RTP.fs}</b> · Vault Rush: <b>${RTP.vr}</b> · Max‑Gewinn: <b>5000x</b> (${RTP.maxp})`;
}
// Filled from tools/simulate.js output (see README / datasheet). Updated when the math changes.
const RTP = { rtp: '96,0 %', hit: '60 %', fs: '1 zu 130', vr: '1 zu 390', maxp: 'ca. 1 zu 2 Mio.' };

function buildPaytable() {
  let h = '<table class="paytbl"><tr><th></th><th>3×</th><th>4×</th><th>5×</th></tr>';
  for (const s of E.PAY_ORDER) { const p = E.PAYTABLE[s]; h += `<tr><td>${SYMS[s].e} <small>${SYMS[s].name}</small></td>${p.map(x => `<td>${x}x</td>`).join('')}</tr>`; }
  h += `<tr><td>🏛️ <small>Tresor (überall)</small>${''}</td>${E.SCATTER_PAY.map(x => `<td>${x}x</td>`).join('')}</tr>`;
  h += '</table><p class="hint">Gewinne je Weg in Vielfachen des Gesamteinsatzes. Bei mehreren Wegen wird multipliziert. Wild ersetzt alle Symbole außer Tresor, Münze und Schlüssel.</p>';
  $('paytable').innerHTML = h;
}

function bindUI() {
  $('spinBtn').onclick = () => { unlock(); doSpin(); };
  $('betMinus').onclick = () => { if (S.betIdx > 0) S.betIdx--; sfx.click(); save(); renderHud(0); };
  $('betPlus').onclick = () => { if (S.betIdx < bets().length - 1) S.betIdx++; sfx.click(); save(); renderHud(0); };
  $('autoBtn').onclick = () => { if (S.de) return; auto = !auto; $('autoBtn').classList.toggle('on', auto); sfx.click(); if (auto && !busy) doSpin(); };
  $('turboBtn').onclick = () => { if (S.de) return; turbo = !turbo; $('turboBtn').classList.toggle('on', turbo); sfx.click(); };
  $('menuBtn').onclick = () => { sfx.click(); $('menu').classList.remove('hidden'); };
  $('menuClose').onclick = () => { sfx.click(); $('menu').classList.add('hidden'); };
  for (const t of document.querySelectorAll('.tab')) t.onclick = () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t));
    document.querySelectorAll('.tabpane').forEach(x => x.classList.toggle('hidden', x.id !== 'tab-' + t.dataset.tab));
  };
  $('optDE').onchange = e => { S.de = e.target.checked; save(); applyMode(); toast(S.de ? 'Deutschland‑Modus an' : 'Standard‑Modus'); };
  $('optSound').onchange = e => { S.sound = e.target.checked; setEnabled(S.sound); save(); };
  $('optGamble').onchange = e => { S.gamble = e.target.checked; save(); };
  $('optReset').onclick = () => { S.balance = START_BALANCE; save(); renderHud(0); toast('Spielgeld zurückgesetzt'); };
  document.addEventListener('keydown', e => { if (e.code === 'Space' && !busy && $('menu').classList.contains('hidden')) { e.preventDefault(); unlock(); doSpin(); } });
  setInterval(() => { const s = Math.floor((Date.now() - sessionStart) / 1000); $('clock').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }, 1000);
}

// Probe optional artwork (generated separately); fall back to emoji when missing.
function probeArt() {
  const bg = new Image(); bg.onload = () => $('bg').classList.add('img'); bg.src = 'assets/bg.jpg';
  return Promise.all(Object.keys(SYMS).map(id => new Promise(r => { const im = new Image(); im.onload = () => { hasImg[id] = true; r(); }; im.onerror = () => r(); im.src = `assets/sym/${id}.png`; })));
}

// ---------- boot ----------
(async function boot() {
  setEnabled(S.sound);
  bindUI(); buildPaytable(); applyMode();
  setLadder(-1, E.MULT_BASE);
  await probeArt();
  const g = E.spin({ bet: 1, rng: E.makeRng(42), mode: 'base' }).events[0].grid;
  drawGrid(g, 4, { drop: true, stagger: true });
  renderHud(0);
})();
