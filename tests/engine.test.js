const test = require('node:test');
const assert = require('node:assert');
const D = require('../js/data.js');
const E = require('../js/engine.js');

const sum = obj => Object.values(obj).reduce((a, b) => a + b, 0);

test('Startwerte entsprechen der Sonntagsfrage (Infratest dimap)', () => {
  const s = E.newGame('spd', 'Test', 1).startShares;
  assert.ok(Math.abs(sum(s) - 100) < 1e-9);
  const expected = { union: 20, afd: 27, spd: 13, gruene: 16, linke: 11, fdp: 4, bsw: 3, sonstige: 6 };
  Object.keys(expected).forEach(p => assert.ok(Math.abs(s[p] - expected[p]) < 0.15, p + ': ' + s[p]));
});

test('Sainte-Laguë verteilt alle Sitze proportional', () => {
  const seats = E.sainteLague({ a: 50, b: 30, c: 20 }, 630);
  assert.strictEqual(sum(seats), 630);
  assert.deepStrictEqual(seats, { a: 315, b: 189, c: 126 });
});

test('Koalitionen: Brandmauer und Unvereinbarkeit', () => {
  assert.strictEqual(E.coalitionViable(['union', 'afd']), false);
  assert.strictEqual(E.coalitionViable(['afd']), true);
  assert.strictEqual(E.coalitionViable(['union', 'linke']), false);
  assert.strictEqual(E.coalitionViable(['union', 'spd']), true);
  const c = E.findCoalitions({ union: 200, afd: 150, spd: 130, gruene: 90, linke: 60 });
  c.forEach(k => assert.ok(k.seats >= E.MAJORITY));
  assert.ok(c.some(k => k.members.join() === 'union,spd' && k.viable));
});

test('Aktionen verbrauchen Aktionspunkte und Geld', () => {
  const g = E.newGame('gruene', 'Test', 7);
  const before = E.nationalShares(g).gruene;
  const res = E.performAction(g, 'kundgebung', { state: 'BE' });
  assert.ok(res.ok);
  assert.strictEqual(g.ap, E.AP_PER_WEEK - 1);
  assert.ok(g.money < D.PARTIES.find(p => p.id === 'gruene').budget);
  assert.ok(E.nationalShares(g).gruene > before);
  assert.strictEqual(E.performAction(g, 'tvspot', {}).ok, false, 'Thema fehlt');
});

test('Eine komplette Partie endet mit Wahlergebnis und Bewertung', () => {
  for (const p of D.PARTIES) {
    const g = E.newGame(p.id, 'Test', 123);
    while (g.phase === 'campaign') {
      if (g.pendingEvent) E.resolveEvent(g, 0);
      if (g.week === E.DUEL_WEEK && !g.duelDone) {
        E.startDuel(g);
        while (g.duel) E.duelAnswer(g, 'sachlich');
      }
      while (g.ap > 0 && E.performAction(g, 'haustuer', { state: 'NW' }).ok);
      assert.ok(E.endWeek(g).ok);
    }
    if (g.result.awaitingChoice) E.chooseCoalition(g, 0);
    assert.strictEqual(g.phase, 'done');
    assert.strictEqual(sum(g.result.seats), D.SEATS);
    assert.ok(Math.abs(sum(g.result.shares) - 100) < 0.5);
    assert.ok(['kanzler', 'regierung', 'opposition', 'raus'].includes(g.result.outcome.status));
    // Spielstand lässt sich speichern und laden
    assert.deepStrictEqual(E.deserialize(E.serialize(g)), g);
  }
});

test('Wahlprogramm: Parteilinie ist gültig und verändert die Startwerte nicht', () => {
  for (const p of D.PARTIES) {
    const prog = E.defaultProgram(p.id);
    assert.deepStrictEqual(E.validateProgram(prog), []);
    const g = E.newGame(p.id, 'Test', 1, prog);
    // Der Startpunkt (Sonntagsfrage) hängt nicht vom Programm ab.
    const other = JSON.parse(JSON.stringify(prog));
    D.TOPICS.forEach(t => { other.positions[t.id] = 1; });
    const g2 = E.newGame(p.id, 'Test', 1, other);
    assert.ok(Math.abs(g.startShares[p.id] - g2.startShares[p.id]) < 1e-9);
    // Auf Parteilinie bleibt die Wirkung des Programms klein.
    assert.ok(Math.abs(E.nationalShares(g)[p.id] - g.startShares[p.id]) < 1.5);
    assert.ok(g.program.core.length === D.PROGRAM_RULES.coreCount);
  }
});

test('Wahlprogramm: ungültige Programme werden abgelehnt', () => {
  const prog = E.defaultProgram('spd');
  assert.ok(E.validateProgram(Object.assign({}, prog, { core: ['klima'] })).length > 0);
  assert.ok(E.validateProgram(Object.assign({}, prog, { core: ['klima', 'klima'] })).length > 0);
  assert.ok(E.validateProgram(Object.assign({}, prog, { slogan: '  ' })).length > 0);
  assert.ok(E.validateProgram(Object.assign({}, prog, { positions: Object.assign({}, prog.positions, { klima: 7 }) })).length > 0);
  assert.throws(() => E.newGame('spd', 'Test', 1, Object.assign({}, prog, { core: [] })));
});

test('Wahlprogramm: Abweichung kostet Glaubwürdigkeit, Kernthemen steigern Kompetenz', () => {
  const line = E.defaultProgram('gruene');
  const base = E.programEffects('gruene', line);
  const moved = JSON.parse(JSON.stringify(line));
  moved.positions.klima = 2; // starke Abweichung beim Kernthema Klima
  const fx = E.programEffects('gruene', moved);
  assert.ok(fx.competence.klima < base.competence.klima);
  assert.ok(fx.nat < base.nat);
  assert.strictEqual(fx.details.klima.deviation, 2);
  assert.ok(base.competence.klima > D.PARTIES.find(p => p.id === 'gruene').competence.klima, 'Kernthema-Bonus');
});

test('Wahlprogramm: teure Programme sind nicht gegenfinanziert', () => {
  const prog = E.defaultProgram('linke');
  D.TOPICS.forEach(t => { prog.positions[t.id] = D.PROGRAM[t.id].reduce((best, o, i, all) => (o.cost > all[best].cost ? i : best), 0); });
  const fx = E.programEffects('linke', prog);
  assert.ok(fx.cost > fx.budget);
  assert.strictEqual(fx.finance, 'over');
});

test('Alte Spielstände ohne Wahlprogramm lassen sich laden', () => {
  const g = E.newGame('fdp', 'Test', 3);
  const old = JSON.parse(E.serialize(g));
  old.version = 1;
  delete old.program; delete old.competence; delete old.prog; delete old.finance;
  const loaded = E.deserialize(JSON.stringify(old));
  assert.strictEqual(loaded.version, 2);
  assert.ok(loaded.program && loaded.competence);
  assert.ok(E.performAction(loaded, 'presse', { topic: 'digitales' }).ok);
});

test('Spielstände ohne das Thema Wohnen werden ergänzt', () => {
  const g = JSON.parse(E.serialize(E.newGame('spd', 'Test', 4)));
  delete g.salience.wohnen;
  delete g.program.positions.wohnen;
  delete g.competence.wohnen;
  const loaded = E.deserialize(JSON.stringify(g));
  assert.ok(Math.abs(sum(loaded.salience) - 1) < 1e-9);
  assert.ok(Number.isInteger(loaded.program.positions.wohnen));
  assert.ok(Number.isFinite(E.nationalShares(loaded).spd));
  assert.ok(E.performAction(loaded, 'presse', { topic: 'wohnen' }).ok);
});

test('Wahlprogramm: leichte Abweichung zu populärer Position nützt, starke Abweichung schadet immer', () => {
  const eastShare = D.STATES.filter(s => s.east).reduce((a, s) => a + s.voters, 0) / D.STATES.reduce((a, s) => a + s.voters, 0);
  let checked = 0;
  for (const p of D.PARTIES) {
    for (const t of D.TOPICS) {
      const line = D.PROGRAM[t.id].find(o => o.lean === p.lean[t.id]);
      D.PROGRAM[t.id].forEach(o => {
        const dev = Math.abs(o.lean - p.lean[t.id]);
        const fx = E.positionEffect(o, line, dev);
        const total = fx.nat + eastShare * fx.east;
        if (dev === 0) assert.strictEqual(total, 0);
        if (dev === 1 && o.pop >= 0.3) { assert.ok(total > 0, p.id + '/' + t.id + ': ' + o.label); checked++; }
        if (dev === 2) { assert.ok(total < 0, p.id + '/' + t.id + ': ' + o.label); checked++; }
      });
    }
  }
  assert.ok(checked > 20);
});
