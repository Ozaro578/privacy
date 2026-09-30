// Quick engine sanity tests. node tools/test.js
import * as E from '../js/engine.js';
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.error('FAIL', m); } else console.log('ok  ', m); };
const g = [['crown','cherry','cherry','cherry'],['crown','lemon','lemon','lemon'],['wild','bar','bar','bar'],['grape','grape','grape','grape'],['bell','bell','bell','bell']];
const ev = E.evaluate(g, 1);
ok(ev.wins.length === 1 && ev.wins[0].symbol === 'crown' && ev.wins[0].count === 3 && ev.wins[0].ways === 1, 'crown ×3 one way');
ok(Math.abs(ev.total - E.PAYTABLE.crown[0]) < 1e-9, 'crown pay = paytable');
const g2 = [['seven','seven','cherry','cherry'],['seven','lemon','lemon','lemon'],['wild','wild','bar','bar'],['seven','grape','grape','grape'],['bell','bell','bell','bell']];
const ev2 = E.evaluate(g2, 1);
ok(ev2.wins[0].symbol === 'seven' && ev2.wins[0].count === 4 && ev2.wins[0].ways === 4, 'seven ×4, 2·1·2·1 = 4 ways');
const rng = E.makeRng(1);
let n = 0, tot = 0; for (let i = 0; i < 20000; i++) { const r = E.playRound({ bet: 1, rng }); ok2(r.total <= E.MAX_WIN, 'cap'); n++; tot += r.total; }
function ok2(c, m) { if (!c) { fails++; console.error('FAIL', m); } }
ok(tot / n > 0.5 && tot / n < 1.5, 'rtp in plausible band: ' + (tot / n * 100).toFixed(1) + '%');
const fs = E.freeSpins({ bet: 1, rng, fsType: 'titan' });
ok(fs.spins.length >= 5 && fs.spins.every(s => s.events[0].rows === 5), 'titan free spins use 5 rows');
const v = E.vaultRush({ bet: 1, rng, coins: 6 });
ok(v.rounds[0].newCoins === 6 && v.total >= 0, 'vault rush starts with 6 coins');
const seeded = E.makeRng(99), seeded2 = E.makeRng(99);
ok(JSON.stringify(E.spin({ bet: 1, rng: seeded })) === JSON.stringify(E.spin({ bet: 1, rng: seeded2 })), 'seeded RNG reproducible');
console.log(fails ? `\n${fails} FAILED` : '\nall tests passed');
process.exit(fails ? 1 : 0);
