const test = require('node:test');
const assert = require('node:assert');
const D = require('../js/data.js');
const E = require('../js/engine.js');

const sum = obj => Object.values(obj).reduce((a, b) => a + b, 0);

test('Startwerte entsprechen ungefähr dem Ergebnis 2025', () => {
  const s = E.nationalShares(E.newGame('spd', 'Test', 1));
  assert.ok(Math.abs(sum(s) - 100) < 1e-9);
  assert.ok(Math.abs(s.union - 28.5) < 1);
  assert.ok(Math.abs(s.afd - 20.8) < 1);
  assert.ok(Math.abs(s.spd - 16.4) < 1);
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
