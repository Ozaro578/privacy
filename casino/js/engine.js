// ─────────────────────────────────────────────────────────────────────────────
//  Titan's Vault: Ascension — game engine (pure logic, no DOM).
//
//  Everything that decides money lives here and ONLY here. The UI just plays
//  back the "events" this module produces. For a real-money build this file
//  moves 1:1 to the server; the client keeps rendering the same event stream.
//
//  Grid: 5 reels × 4 rows (5 rows during Ascension). 1024 / 3125 "ways":
//  matching symbols on adjacent reels from the left, any row. Wins cascade.
// ─────────────────────────────────────────────────────────────────────────────

// ---- RNG (seedable, xoshiro128**) ------------------------------------------
export function makeRng(seed) {
  let a = seed >>> 0 || 0x9e3779b9, b = 0x243f6a88, c = 0xb7e15162, d = 0xdeadbeef;
  const rotl = (x, k) => (x << k) | (x >>> (32 - k));
  const next = () => {
    const r = rotl(b * 5, 7) * 9;
    const t = b << 9;
    c ^= a; d ^= b; b ^= c; a ^= d; c ^= t; d = rotl(d, 11);
    return (r >>> 0) / 4294967296;
  };
  for (let i = 0; i < 20; i++) next();
  return { float: next, int: n => Math.floor(next() * n) };
}
export function cryptoRng() {
  const buf = new Uint32Array(1);
  const g = (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues)
    ? () => { globalThis.crypto.getRandomValues(buf); return buf[0] / 4294967296; }
    : Math.random;
  return { float: g, int: n => Math.floor(g() * n) };
}

// ---- Symbols ---------------------------------------------------------------
export const SYM = {
  CHERRY: 'cherry', LEMON: 'lemon', GRAPE: 'grape', BELL: 'bell',
  BAR: 'bar', DIAMOND: 'diamond', SEVEN: 'seven', CROWN: 'crown',
  WILD: 'wild', SCATTER: 'scatter', COIN: 'coin',
  KEY_B: 'keyB', KEY_S: 'keyS', KEY_G: 'keyG',
};
export const PAY_ORDER = [SYM.CROWN, SYM.SEVEN, SYM.DIAMOND, SYM.BAR, SYM.BELL, SYM.GRAPE, SYM.LEMON, SYM.CHERRY];

// Pays in multiples of TOTAL BET per way, for 3 / 4 / 5 of a kind.
export const PAYTABLE = {
  crown:   [0.10, 0.32, 1.30],
  seven:   [0.065, 0.21, 0.65],
  diamond: [0.05, 0.13, 0.42],
  bar:     [0.032, 0.085, 0.26],
  bell:    [0.016, 0.052, 0.13],
  grape:   [0.013, 0.032, 0.105],
  lemon:   [0.008, 0.026, 0.08],
  cherry:  [0.008, 0.021, 0.065],
};
// Scatter pays anywhere (total bet multiples) for 3 / 4 / 5.
export const SCATTER_PAY = [2, 10, 50];

// Reel weights for the base game. Keys only on reels 1/3/5, coin everywhere.
const BASE_WEIGHTS = [
  { cherry: 22, lemon: 22, grape: 20, bell: 18, bar: 13, diamond: 10, seven: 7, crown: 5, wild: 0, scatter: 2, coin: 7, keyB: 0.5, keyS: 0.25, keyG: 0.25 },
  { cherry: 22, lemon: 22, grape: 20, bell: 18, bar: 13, diamond: 10, seven: 7, crown: 5, wild: 3, scatter: 2, coin: 7, keyB: 0, keyS: 0, keyG: 0 },
  { cherry: 22, lemon: 22, grape: 20, bell: 18, bar: 13, diamond: 10, seven: 7, crown: 5, wild: 3, scatter: 2, coin: 7, keyB: 0.5, keyS: 0.25, keyG: 0.25 },
  { cherry: 22, lemon: 22, grape: 20, bell: 18, bar: 13, diamond: 10, seven: 7, crown: 5, wild: 3, scatter: 2, coin: 7, keyB: 0, keyS: 0, keyG: 0 },
  { cherry: 22, lemon: 22, grape: 20, bell: 18, bar: 13, diamond: 10, seven: 7, crown: 5, wild: 0, scatter: 2, coin: 7, keyB: 0.5, keyS: 0.25, keyG: 0.25 },
];
// Free spins: a little richer, more wilds, fewer coins (no Vault Rush inside FS).
const FS_WEIGHTS = BASE_WEIGHTS.map((w, i) => Object.assign({}, w, {
  wild: i === 0 || i === 4 ? 0 : 5, coin: 0, scatter: 1.5, crown: 6, seven: 8,
}));

// Cascade multiplier ladders.
export const MULT_BASE = [1, 2, 3, 5];
export const MULT_FS = { storm: [2, 3, 4, 6], warrior: [3, 5, 8, 12], titan: [3, 6, 9, 15] };
export const FS_SPINS = { storm: 28, warrior: 18, titan: 5 };

// Vault Rush (hold & win)
export const COIN_VALUES = [ // multiples of total bet, weighted
  [1, 30], [2, 25], [3, 18], [5, 12], [10, 7], [15, 4], [25, 2], [50, 1],
];
export const BONUS_PRIZES = { mini: 20, minor: 50, major: 100 };
export const VAULT_HIT = 0.04;       // chance per empty cell per respin
export const GRAND = 2500;         // full grid in Vault Rush
export const MAX_WIN = 5000;       // hard cap per spin cycle, multiples of total bet

function pick(rng, weights) {
  let total = 0; for (const k in weights) total += weights[k];
  let r = rng.float() * total;
  for (const k in weights) { r -= weights[k]; if (r < 0) return k; }
  return 'cherry';
}

const isPay = s => PAYTABLE[s] !== undefined;
const isKey = s => s === SYM.KEY_B || s === SYM.KEY_S || s === SYM.KEY_G;

// ---- Grid helpers ----------------------------------------------------------
function fill(rng, weights, cols, rows, banned) {
  const g = [];
  for (let c = 0; c < cols; c++) {
    g[c] = [];
    for (let r = 0; r < rows; r++) g[c][r] = spawn(rng, weights[c], banned);
  }
  return g;
}
function spawn(rng, w, banned) {
  let s; let guard = 0;
  do { s = pick(rng, w); } while (banned && banned.has(s) && ++guard < 50);
  return s;
}

// Evaluate ways wins. Returns { wins:[{symbol,count,ways,pay,cells}], total }.
export function evaluate(grid, bet) {
  const cols = grid.length;
  const wins = [];
  let total = 0;
  for (const sym of PAY_ORDER) {
    let ways = 1, count = 0; const cells = [];
    for (let c = 0; c < cols; c++) {
      let n = 0;
      for (let r = 0; r < grid[c].length; r++) {
        const s = grid[c][r];
        if (s === sym || s === SYM.WILD) { n++; cells.push([c, r]); }
      }
      if (n === 0) break;
      ways *= n; count++;
    }
    if (count >= 3) {
      const pay = PAYTABLE[sym][count - 3] * ways * bet;
      wins.push({ symbol: sym, count, ways, pay, cells });
      total += pay;
    }
  }
  // Wild-only lines are attributed to the best symbol already (wild counted for every symbol); avoid double-attributing
  // identical cell sets: keep the highest paying win per identical cell signature.
  const seen = new Map();
  const dedup = [];
  total = 0;
  for (const w of wins) {
    const sig = w.cells.map(x => x.join(':')).sort().join(',');
    if (seen.has(sig)) continue;
    seen.set(sig, true); dedup.push(w); total += w.pay;
  }
  return { wins: dedup, total };
}

function countSym(grid, sym) { let n = 0; for (const col of grid) for (const s of col) if (s === sym) n++; return n; }

// ---- One spin cycle ----------------------------------------------------------
// Produces an ordered event list the UI animates, and the money result.
// opts: { bet, rng, mode:'base'|'free', fsType, ascension:boolean }
export function spin(opts) {
  const { bet, rng } = opts;
  const mode = opts.mode || 'base';
  const weights = mode === 'free' ? FS_WEIGHTS : BASE_WEIGHTS;
  const ladder = mode === 'free' ? MULT_FS[opts.fsType] : MULT_BASE;
  let rows = opts.ascension ? 5 : 4;
  const cols = 5;
  const events = [];
  let grid = fill(rng, weights, cols, rows);
  let total = 0, step = 0, ascended = !!opts.ascension;
  const keysUsed = [];
  events.push({ t: 'grid', grid: clone(grid), rows });

  // Keys land → gifts apply once per spin cycle (before first evaluation).
  const keys = [];
  for (let c = 0; c < cols; c++) for (let r = 0; r < grid[c].length; r++) if (isKey(grid[c][r])) keys.push({ c, r, k: grid[c][r] });
  for (const k of keys) {
    grid[k.c][k.r] = SYM.WILD; // key itself becomes wild
    if (k.k === SYM.KEY_B) {
      // Mystery: every instance of a random low symbol becomes a random high symbol.
      const from = [SYM.CHERRY, SYM.LEMON, SYM.GRAPE, SYM.BELL][rng.int(4)];
      const to = [SYM.BAR, SYM.DIAMOND, SYM.SEVEN, SYM.CROWN][rng.int(4)];
      const cells = [];
      for (let c = 0; c < cols; c++) for (let r = 0; r < grid[c].length; r++) if (grid[c][r] === from) { grid[c][r] = to; cells.push([c, r]); }
      events.push({ t: 'key', kind: 'bronze', at: [k.c, k.r], from, to, cells });
    } else if (k.k === SYM.KEY_S) {
      // Expanding wild: the reel the key landed on becomes fully wild.
      for (let r = 0; r < grid[k.c].length; r++) grid[k.c][r] = SYM.WILD;
      events.push({ t: 'key', kind: 'silver', at: [k.c, k.r], reel: k.c });
    } else {
      // Ascension: add a 5th row for the rest of this cycle.
      if (!ascended) {
        ascended = true; rows = 5;
        for (let c = 0; c < cols; c++) grid[c].unshift(spawn(rng, weights[c], new Set([SYM.KEY_B, SYM.KEY_S, SYM.KEY_G, SYM.SCATTER, SYM.COIN])));
        events.push({ t: 'key', kind: 'gold', at: [k.c, k.r + 1], grid: clone(grid), rows });
      } else {
        events.push({ t: 'key', kind: 'gold', at: [k.c, k.r], wildOnly: true });
      }
    }
    keysUsed.push(k.k);
  }
  if (keys.length) events.push({ t: 'grid', grid: clone(grid), rows });

  // Cascades
  while (true) {
    const ev = evaluate(grid, bet);
    if (!ev.wins.length) break;
    const mult = ladder[Math.min(step, ladder.length - 1)];
    const stepWin = ev.total * mult;
    total += stepWin;
    events.push({ t: 'win', wins: ev.wins, mult, amount: stepWin, step });
    // remove winning cells (wilds are consumed too), drop down, refill from top
    const remove = new Set();
    for (const w of ev.wins) for (const [c, r] of w.cells) remove.add(c + ':' + r);
    for (let c = 0; c < cols; c++) {
      const kept = [];
      for (let r = 0; r < grid[c].length; r++) if (!remove.has(c + ':' + r)) kept.push(grid[c][r]);
      const banned = new Set([SYM.KEY_B, SYM.KEY_S, SYM.KEY_G]); // keys only on the initial drop
      while (kept.length < rows) kept.unshift(spawn(rng, weights[c], banned));
      grid[c] = kept;
    }
    step++;
    events.push({ t: 'cascade', grid: clone(grid), rows, step });
    if (total >= MAX_WIN * bet) break;
  }

  // Scatters / coins are counted on the FINAL grid of the cycle.
  const scatters = countSym(grid, SYM.SCATTER);
  const coins = countSym(grid, SYM.COIN);
  let scatterPay = 0;
  if (scatters >= 3) { scatterPay = SCATTER_PAY[Math.min(scatters, 5) - 3] * bet; total += scatterPay; }
  const cap = MAX_WIN * bet;
  if (total > cap) total = cap;

  const result = {
    events, total, scatters, coins, keys: keysUsed, ascended, cascades: step,
    triggerFree: scatters >= 3,
    triggerVault: mode === 'base' && coins >= 6,
    scatterPay,
  };
  return result;
}

// ---- Free spins -------------------------------------------------------------
// Returns { spins:[spinResult...], total, retriggers }
export function freeSpins(opts) {
  const { bet, rng, fsType } = opts;
  let left = FS_SPINS[fsType], total = 0, retriggers = 0;
  const spins = [];
  const sticky = fsType === 'titan';
  const cap = MAX_WIN * bet;
  while (left > 0 && total < cap) {
    left--;
    const s = spin({ bet, rng, mode: 'free', fsType, ascension: sticky });
    total += s.total;
    if (s.scatters >= 3) { left += 5; retriggers++; s.retrigger = true; }
    s.spinsLeft = left;
    spins.push(s);
  }
  if (total > cap) total = cap;
  return { spins, total, retriggers, fsType };
}

// ---- Vault Rush (hold & win) -------------------------------------------------
// Starts from the coins on the triggering grid. 3 respins, reset on new coin.
// Returns { rounds:[{grid,locked,newCoins,spinsLeft}], total, grand, coinsFinal }
export function vaultRush(opts) {
  const { bet, rng } = opts;
  const cols = 5, rows = 4;
  const board = []; for (let c = 0; c < cols; c++) { board[c] = []; for (let r = 0; r < rows; r++) board[c][r] = null; }
  let count = 0;
  const initial = Math.max(6, opts.coins || 6);
  const positions = [];
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) positions.push([c, r]);
  shuffle(rng, positions);
  for (let i = 0; i < initial; i++) { const [c, r] = positions[i]; board[c][r] = rollCoin(rng); count++; }
  const rounds = [{ grid: clone(board), newCoins: initial, spinsLeft: 3 }];
  let spinsLeft = 3;
  while (spinsLeft > 0 && count < cols * rows) {
    spinsLeft--;
    let landed = 0;
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      if (board[c][r]) continue;
      // Hit chance tuned so the average feature lands ~5 extra coins.
      if (rng.float() < VAULT_HIT) { board[c][r] = rollCoin(rng); count++; landed++; }
    }
    if (landed) spinsLeft = 3;
    rounds.push({ grid: clone(board), newCoins: landed, spinsLeft });
  }
  // Payout: sum coins; collector coins add the sum of all other coins once more.
  let sum = 0, collectors = 0;
  for (const col of board) for (const cn of col) if (cn) { if (cn.kind === 'collector') collectors++; else sum += cn.value; }
  let total = sum * bet + collectors * sum * bet;
  let grand = false;
  if (count === cols * rows) { total = GRAND * bet; grand = true; }
  const cap = MAX_WIN * bet;
  if (total > cap) total = cap;
  return { rounds, total, grand, coinsFinal: count, collectors };
}
function rollCoin(rng) {
  const r = rng.float();
  if (r < 0.015) return { kind: 'bonus', name: 'major', value: BONUS_PRIZES.major };
  if (r < 0.045) return { kind: 'bonus', name: 'minor', value: BONUS_PRIZES.minor };
  if (r < 0.095) return { kind: 'bonus', name: 'mini', value: BONUS_PRIZES.mini };
  if (r < 0.120) return { kind: 'collector', value: 0 };
  let total = 0; for (const [, w] of COIN_VALUES) total += w;
  let x = rng.float() * total;
  for (const [v, w] of COIN_VALUES) { x -= w; if (x < 0) return { kind: 'coin', value: v }; }
  return { kind: 'coin', value: 1 };
}

// ---- Gamble (Risikoleiter) — disabled in DE mode by the UI ------------------
export function gamble(rng, amount, guess) {
  const card = rng.float() < 0.5 ? 'red' : 'black';   // true 50/50, no house edge
  return { card, won: card === guess, amount: card === guess ? amount * 2 : 0 };
}

// ---- Full round: base spin + any features ------------------------------------
// The UI calls this once per "Drehen" press; the FS choice is passed back in via
// the `choose` callback (sync) so simulations can run headless.
export function playRound({ bet, rng, choose }) {
  const base = spin({ bet, rng, mode: 'base' });
  const round = { base, total: base.total, free: null, vault: null };
  if (base.triggerVault) {
    round.vault = vaultRush({ bet, rng, coins: base.coins });
    round.total += round.vault.total;
  }
  if (base.triggerFree) {
    const fsType = choose ? choose(['storm', 'warrior', 'titan']) : ['storm', 'warrior', 'titan'][rng.int(3)];
    round.free = freeSpins({ bet, rng, fsType });
    round.total += round.free.total;
  }
  const cap = MAX_WIN * bet;
  if (round.total > cap) round.total = cap;
  return round;
}

function clone(g) { return g.map(col => col.slice()); }
function shuffle(rng, a) { for (let i = a.length - 1; i > 0; i--) { const j = rng.int(i + 1); [a[i], a[j]] = [a[j], a[i]]; } }
