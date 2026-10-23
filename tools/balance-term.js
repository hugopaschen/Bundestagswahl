#!/usr/bin/env node
/*
 * Balance der Legislaturperiode: Je Partei und Spielweise vier Legislaturen (4 Startwerte) simulieren und den
 * Durchschnitt der Umfrageveränderung (eigene Partei, Prozentpunkte seit der Wahl) mit den Zielbereichen vergleichen.
 * Aufruf: npm run balance            (Tabelle)
 *         npm run balance -- --check (Abbruch mit Fehler, wenn ein Wert außerhalb des Zielbereichs liegt)
 *         npm run balance -- --fx    (zusätzlich: woher die Umfrageveränderung kommt)
 */
const path = require('path');
const E = require(path.join(__dirname, '..', 'js', 'engine.js'));
const T = require(path.join(__dirname, '..', 'js', 'term.js'));

const SEEDS = [3, 4, 5, 7];
// Zielbereiche (Durchschnitt aus 4 Spielen) nach echten Legislaturen: GroKo 2013–17 (Union −8,6, SPD −5,2
// bis zur Wahl), Ampel 2021–24 (zusammen 52 → 38 %), Union in der Opposition 2022–24 (+6 bis +8).
// aktiv = Spieler, der die Koalition pflegt und liefert; passiv = Spieler, der nichts tut.
// Regierungen können zulegen, wenn sie liefern und geschlossen auftreten (Union 2009–13: 33,8 → 41,5 %).
const TARGETS = {
  union: { role: 'Kanzlerschaft', passiv: [-9, -3], aktiv: [-2, 3] },
  spd: { role: 'Juniorpartner', passiv: [-7, -1], aktiv: [-2, 3] },
  linke: { role: 'Opposition', passiv: [0, 5], aktiv: [3, 8] },
  fdp: { role: 'APO', passiv: [-1, 2], aktiv: [0.5, 3.5] }
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
    while (g.result.hung && !g.result.hung.done) { const h = g.result.hung; const free = h.tolerators.filter(p => h.tried.indexOf(p) === -1); E.hungChoice(g, h.step === 'ask' ? 'dulden' : free.length ? 'duldung' : 'minderheit', free[0]); }
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
  const fx = {};
  (t.pollFxHist || []).concat([{ fx: t.pollFx || {} }]).forEach(h => Object.keys(h.fx).forEach(c => { fx[c] = (fx[c] || 0) + h.fx[c]; }));
  return { delta: t.lastNat[p] - t.share0, role: t.role, early: !!t.early, fx };
}

let bad = 0;
console.log('Partei  Rolle          Spielweise  Ergebnis  Zielbereich  Einzelwerte');
Object.keys(TARGETS).forEach(p => ['passiv', 'aktiv'].forEach(mode => {
  const runs = SEEDS.map(s => play(p, s, mode === 'aktiv'));
  const avg = runs.reduce((s, r) => s + r.delta, 0) / runs.length;
  const target = TARGETS[p][mode];
  const ok = avg >= target[0] && avg <= target[1];
  if (!ok) bad += 1;
  const f = x => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(1);
  console.log(p.padEnd(7), TARGETS[p].role.padEnd(14), mode.padEnd(11), f(avg).padStart(6), '  ', (f(target[0]) + '…' + f(target[1])).padStart(11), ok ? '✓' : '✗',
    ' ', runs.map(r => f(r.delta) + (r.early ? '*' : '')).join(' '));
  if (process.argv.indexOf('--fx') !== -1) {
    const fx = {};
    runs.forEach(r => Object.keys(r.fx).forEach(c => { fx[c] = (fx[c] || 0) + r.fx[c] / runs.length; }));
    console.log('        Ursachen:', Object.keys(fx).sort((a, b) => Math.abs(fx[b]) - Math.abs(fx[a])).slice(0, 7).map(c => c + ' ' + f(fx[c])).join(', '));
  }
}));
console.log('* = Legislatur vorzeitig beendet.');
if (process.argv.indexOf('--check') !== -1 && bad) { console.error(bad + ' Wert(e) außerhalb des Zielbereichs.'); process.exit(1); }
