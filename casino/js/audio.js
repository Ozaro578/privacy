// Procedural SFX via Web Audio. No files, unlocked on first tap.
let ctx = null, master = null, on = true;
export function setEnabled(v) { on = v; }
function c() {
  if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
export function unlock() { c(); }
function tone(f, d, type = 'sine', g = 0.3, t0 = 0) {
  const x = c(); if (!x || !on) return;
  const o = x.createOscillator(), gn = x.createGain();
  o.type = type; o.frequency.value = f;
  const t = x.currentTime + t0;
  gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(g, t + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(gn); gn.connect(master); o.start(t); o.stop(t + d + 0.05);
}
function noise(d, g = 0.2) {
  const x = c(); if (!x || !on) return;
  const buf = x.createBuffer(1, x.sampleRate * d, x.sampleRate); const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const s = x.createBufferSource(); s.buffer = buf; const gn = x.createGain(); gn.gain.value = g;
  const f = x.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1200;
  s.connect(f); f.connect(gn); gn.connect(master); s.start();
}
export const sfx = {
  click: () => tone(600, 0.05, 'square', 0.08),
  reel: () => noise(0.25, 0.12),
  land: i => tone(180 + i * 40, 0.08, 'triangle', 0.2),
  win: n => { for (let i = 0; i < Math.min(n, 5); i++) tone(523 * Math.pow(1.2, i), 0.18, 'triangle', 0.25, i * 0.07); },
  pop: () => { noise(0.12, 0.15); tone(900, 0.08, 'sine', 0.12); },
  mult: lvl => { tone(400 + lvl * 150, 0.15, 'sawtooth', 0.15); tone(800 + lvl * 200, 0.2, 'square', 0.08, 0.05); },
  key: () => { tone(880, 0.1, 'sine', 0.2); tone(1320, 0.2, 'sine', 0.2, 0.1); tone(1760, 0.3, 'sine', 0.15, 0.2); },
  titan: () => { tone(60, 0.5, 'sawtooth', 0.4); noise(0.4, 0.3); tone(120, 0.4, 'square', 0.15, 0.1); },
  coin: () => { tone(1500, 0.08, 'sine', 0.15); tone(2200, 0.12, 'sine', 0.12, 0.05); },
  big: () => { for (let i = 0; i < 12; i++) tone(440 * Math.pow(1.06, i), 0.25, 'triangle', 0.22, i * 0.08); },
  lose: () => tone(160, 0.25, 'sine', 0.15),
  card: () => noise(0.08, 0.15),
};
