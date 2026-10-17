#!/usr/bin/env node
/*
 * Balance der Legislaturperiode: Je Partei und Spielweise vier Legislaturen (4 Startwerte) simulieren und den
 * Durchschnitt der Umfrageveränderung (eigene Partei, Prozentpunkte seit der Wahl) mit den Zielwerten vergleichen.
 * Aufruf: npm run balance            (Tabelle)
 *         npm run balance -- --check (Abbruch mit Fehler, wenn ein Wert außerhalb der Toleranz liegt)
 */
const path = require('path');
const E = require(path.join(__dirname, '..', 'js', 'engine.js'));
const T = require(path.join(__dirname, '..', 'js', 'term.js'));

const SEEDS = [3, 4, 5, 7];
const TOLERANCE = 1.0;
// Zielwerte (Durchschnitt aus 4 Spielen): die Simulationsreihe vom Oktober 2026. Union aktiv: gemessen mit einem
// Spieler, der die Koalition pflegt (die frühere −1,1 stammte von einem Testspieler, der die Koalition sprengte).
const TARGETS = {
  union: { role: 'Kanzlerschaft', passiv: -1.7, aktiv: 3.5 },
  spd: { role: 'Juniorpartner', passiv: -0.2, aktiv: 4.0 },
  linke: { role: 'Opposition', passiv: 0.6, aktiv: 5.6 },
  fdp: { role: 'APO', passiv: 0.2, aktiv: 1.9 }
};

function elect(p, seed) {
  const g = E.newGame(p, 'Test', seed);
  g.week = g.maxWeeks; g.duelDone = true;
  while (g.pendingEvent) E.resolveEvent(g, 0);
  if (p === 'union') g.nat.union += 6; // Union als klare Wahlsiegerin: Kanzlerschaft
  E.endWeek(g);
  for (let z = 0; z < 6 && g.phase !== 'done'; z++) {
    if (g.result.awaitingChoice) E.chooseCoalition(g, Math.max(0, g.result.options.findIndex(o => o.members.length > 1)));
    while (g.result.neg && !g.result.neg.done) E.negotiate(g, g.result.neg.step < g.result.neg.topics.length ? 'kompromiss' : 'x');
  }
  return g;
}

// Entscheidungen: der aktive Spieler stimmt nach seiner Linie, gibt bei Vetos einen Kompromiss und verteidigt den Status quo.
function decide(g, active) {
  const t = g.term;
  const it = t.pending[0];
  if (!active) return 0;
  if (it.type === 'vote' && !it.budget) { const l = t.laws.find(x => x.id === it.law); return ['ja', 'nein', 'enthaltung'].indexOf(T.defaultVote(g, l)); }
  if (it.type === 'vote') return 1;
  if (it.type === 'veto') return 1;
  if (it.type === 'sq') return 1;
  return 0;
}

// Aktiver Spieler: pflegt die Koalition, setzt Vertragsvorhaben und eigene Positionen ohne Veto um, nutzt alle Aktionen.
function activeTurn(g) {
  const t = g.term;
  const core = g.program.core;
  for (let i = 0; i < 10 && t.ap > 0; i++) {
    if (T.isGov(t.role) && t.gov.length > 1 && t.mood < 55 && T.canAct(g, 'koaausschuss').ok) { T.performAction(g, 'koaausschuss'); continue; }
    if (T.canAct(g, 'gesetz').ok) {
      const o = T.lawOptions(g);
      const partners = t.gov.filter(p => p !== g.party);
      const noVeto = (topic, opt) => partners.every(p => Math.abs(T.leanOf(g, p, topic) - require(path.join(__dirname, '..', 'js', 'data.js')).PROGRAM[topic][opt].lean) < 2);
      const own = o.topics.find(x => x.opts.indexOf(g.program.positions[x.topic]) !== -1 && (x.contract === g.program.positions[x.topic] || noVeto(x.topic, g.program.positions[x.topic])));
      const contract = o.topics.find(x => x.contract !== undefined && x.contract !== x.current && x.opts.indexOf(x.contract) !== -1);
      const pickLaw = own ? { topic: own.topic, opt: g.program.positions[own.topic] } : contract ? { topic: contract.topic, opt: contract.contract } : null;
      if (pickLaw && t.laws.filter(l => l.by === g.party && ['kabinett', 'bundestag', 'bundesrat', 'vermittlung'].indexOf(l.stage) !== -1).length < 2) { T.performAction(g, 'gesetz', pickLaw); continue; }
    }
    const ids = ['sq', 'regerkl', 'presse', 'antrag', 'protest', 'social', 'talkshow', 'buerger', 'basis', 'aktuelle', 'schatten', 'mitglieder'].filter(id => T.canAct(g, id).ok);
    if (!ids.length) break;
    T.performAction(g, ids[(i + t.q) % ids.length], core[(i + t.q) % core.length]);
    while (t.pending.length) T.resolvePending(g, Math.max(0, decide(g, true)));
  }
}

function play(p, seed, active) {
  const g = elect(p, seed);
  T.startTerm(g);
  const t = g.term;
  T.autoNames(g);
  let guard = 0;
  while (!t.over && guard++ < 30) {
    while (t.pending.length) T.resolvePending(g, Math.max(0, decide(g, active)));
    if (active) activeTurn(g);
    T.endQuarter(g);
  }
  return { delta: t.lastNat[p] - t.share0, role: t.role, early: !!t.early };
}

let bad = 0;
console.log('Partei  Rolle          Spielweise  Ergebnis  Ziel   Einzelwerte');
Object.keys(TARGETS).forEach(p => ['passiv', 'aktiv'].forEach(mode => {
  const runs = SEEDS.map(s => play(p, s, mode === 'aktiv'));
  const avg = runs.reduce((s, r) => s + r.delta, 0) / runs.length;
  const target = TARGETS[p][mode];
  const ok = Math.abs(avg - target) <= TOLERANCE;
  if (!ok) bad += 1;
  const f = x => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(1);
  console.log(p.padEnd(7), TARGETS[p].role.padEnd(14), mode.padEnd(11), f(avg).padStart(6), '  ', f(target).padStart(5), ok ? '✓' : '✗',
    ' ', runs.map(r => f(r.delta) + (r.early ? '*' : '')).join(' '));
}));
console.log('* = Legislatur vorzeitig beendet. Toleranz ± ' + TOLERANCE + ' Punkte.');
if (process.argv.indexOf('--check') !== -1 && bad) { console.error(bad + ' Wert(e) außerhalb der Toleranz.'); process.exit(1); }
