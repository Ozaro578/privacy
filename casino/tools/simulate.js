// RTP / volatility simulation for the datasheet.  node tools/simulate.js [spins] [seed]
import { playRound, makeRng, MAX_WIN } from '../js/engine.js';
const N = parseInt(process.argv[2] || '2000000', 10);
const seed = parseInt(process.argv[3] || '12345', 10);
const rng = makeRng(seed);
const bet = 1;
let paid = 0, hits = 0, fsTrig = 0, vaultTrig = 0, maxWin = 0, maxHits = 0;
let fsPaid = 0, vaultPaid = 0, basePaid = 0, sq = 0;
const buckets = { '0': 0, '<1x': 0, '1-5x': 0, '5-20x': 0, '20-100x': 0, '100-500x': 0, '500x+': 0 };
const byType = { storm: [0, 0], warrior: [0, 0], titan: [0, 0] };
for (let i = 0; i < N; i++) {
  const r = playRound({ bet, rng });
  paid += r.total; sq += r.total * r.total;
  basePaid += r.base.total;
  if (r.total > 0) hits++;
  if (r.free) { fsTrig++; fsPaid += r.free.total; byType[r.free.fsType][0]++; byType[r.free.fsType][1] += r.free.total; }
  if (r.vault) { vaultTrig++; vaultPaid += r.vault.total; }
  if (r.total > maxWin) maxWin = r.total;
  if (r.total >= MAX_WIN * bet) maxHits++;
  const x = r.total / bet;
  buckets[x === 0 ? '0' : x < 1 ? '<1x' : x < 5 ? '1-5x' : x < 20 ? '5-20x' : x < 100 ? '20-100x' : x < 500 ? '100-500x' : '500x+']++;
}
const rtp = paid / (N * bet);
const variance = sq / N - rtp * rtp;
const out = {
  spins: N, seed,
  rtp: +(rtp * 100).toFixed(2) + ' %',
  rtp_base: +(basePaid / N * 100).toFixed(2) + ' %',
  rtp_freespins: +(fsPaid / N * 100).toFixed(2) + ' %',
  rtp_vaultrush: +(vaultPaid / N * 100).toFixed(2) + ' %',
  hit_frequency: +(hits / N * 100).toFixed(2) + ' %',
  freespins_frequency: '1 in ' + Math.round(N / Math.max(1, fsTrig)),
  vaultrush_frequency: '1 in ' + Math.round(N / Math.max(1, vaultTrig)),
  avg_freespins_win: +(fsPaid / Math.max(1, fsTrig)).toFixed(1) + 'x',
  avg_vaultrush_win: +(vaultPaid / Math.max(1, vaultTrig)).toFixed(1) + 'x',
  fs_by_type: Object.fromEntries(Object.entries(byType).map(([k, [n, p]]) => [k, { n, avg: +(p / Math.max(1, n)).toFixed(1) + 'x' }])),
  max_win_observed: maxWin + 'x',
  max_win_cap: MAX_WIN + 'x',
  max_win_probability: maxHits ? '1 in ' + Math.round(N / maxHits) : '< 1 in ' + N,
  std_dev: +Math.sqrt(variance).toFixed(2),
  distribution: buckets,
};
console.log(JSON.stringify(out, null, 2));
