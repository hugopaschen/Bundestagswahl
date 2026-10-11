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

test('Geld-Hinweis: erscheint bei voller Kasse und verschwindet, wenn das Geld eingeplant ist', () => {
  const union = E.newGame('union', 'Test', 1); // 30 Mio. €, 8 Wochen
  const w = E.moneyWarning(union);
  assert.ok(w && !w.lastWeek && w.money === 30);
  const bsw = E.newGame('bsw', 'Test', 1); // 5 Mio. € – reicht nicht für einen Spot pro Woche
  assert.strictEqual(E.moneyWarning(bsw), null);
  union.money = 10; // weniger als ein TV-Spot pro verbleibender Woche
  assert.strictEqual(E.moneyWarning(union), null);
  union.week = union.maxWeeks; union.money = 4.5; // letzte Woche, ein Spot (4,25 Mio. €) noch möglich
  assert.ok(E.moneyWarning(union).lastWeek);
  union.money = 4; // reicht nicht mehr für einen Spot
  assert.strictEqual(E.moneyWarning(union), null);
});

test('Alle 16 Themen sind vollständig: Kompetenz, Parteilinie, drei Positionen, Wählerinteresse', () => {
  assert.strictEqual(D.TOPICS.length, 16);
  assert.ok(Math.abs(sum(D.SALIENCE0) - 1) < 1e-9);
  for (const t of D.TOPICS) {
    assert.strictEqual(D.PROGRAM[t.id].length, 3, t.id);
    assert.deepStrictEqual(D.PROGRAM[t.id].map(o => o.lean), [-1, 0, 1], t.id);
    for (const p of D.PARTIES) {
      assert.ok(Number.isFinite(p.competence[t.id]), p.id + ' ' + t.id);
      assert.ok([-1, 0, 1].includes(p.lean[t.id]), p.id + ' ' + t.id);
    }
  }
});

test('Spielstände ohne die neuen Themen werden ergänzt; Sparpositionen entlasten den Haushalt', () => {
  const g = JSON.parse(E.serialize(E.newGame('union', 'Test', 5)));
  for (const t of ['verteidigung', 'gesundheit', 'verkehr', 'europa', 'familie', 'land', 'demokratie', 'finanzen']) {
    delete g.salience[t]; delete g.program.positions[t]; delete g.competence[t];
  }
  const loaded = E.deserialize(JSON.stringify(g));
  assert.ok(Math.abs(sum(loaded.salience) - 1) < 1e-9);
  assert.ok(E.performAction(loaded, 'presse', { topic: 'verteidigung' }).ok);

  const prog = E.defaultProgram('spd');
  const before = E.programEffects('spd', prog).cost;
  assert.strictEqual(D.PROGRAM.finanzen[prog.positions.finanzen].cost, -1); // SPD-Linie: Spitzensteuer rauf
  prog.positions.finanzen = 1; // Entlastung kleiner Einkommen kostet einen Punkt
  assert.strictEqual(E.programEffects('spd', prog).cost, before + 2);
});

test('Wahlziele: stärkste Kraft, absolute Mehrheit, Prozentziel und Koalitionsmehrheit', () => {
  const seats = { union: 150, afd: 200, spd: 120, gruene: 90, linke: 70, bsw: 0, fdp: 0 };
  const shares = { union: 22, afd: 30, spd: 18, gruene: 14, linke: 11, bsw: 4, fdp: 4.9, sonstige: 0 };
  const r = { seats, shares, strongest: 'afd' };
  assert.strictEqual(E.goalReached('union', r), false);
  assert.strictEqual(E.goalReached('afd', r), false);           // 200 < 316 Sitze
  assert.strictEqual(E.goalReached('afd', Object.assign({}, r, { seats: Object.assign({}, seats, { afd: 316 }) })), true);
  assert.strictEqual(E.goalReached('spd', r), false);           // 18 % < 20 %
  assert.strictEqual(E.goalReached('linke', r), false);         // 280 Sitze reichen nicht
  assert.strictEqual(E.goalReached('linke', Object.assign({}, r, { seats: Object.assign({}, seats, { linke: 110 }) })), true);
  assert.strictEqual(E.goalReached('fdp', r), false);
  assert.strictEqual(E.goalReached('fdp', Object.assign({}, r, { shares: Object.assign({}, shares, { fdp: 5 }) })), true);
});

test('Fachkonferenz: richtige Antworten verändern die Kompetenz im Kernthema', () => {
  const prog = E.defaultProgram('spd');
  prog.core = ['soziales', 'gesundheit', 'wohnen'];
  const base = E.programEffects('spd', prog).competence;
  prog.quiz = { soziales: 5, gesundheit: 0, wohnen: 2, klima: 5 };
  const fx = E.programEffects('spd', prog);
  assert.strictEqual(fx.competence.soziales - base.soziales, 15);
  assert.strictEqual(fx.competence.gesundheit - base.gesundheit, -10);
  assert.strictEqual(fx.competence.wohnen, base.wohnen);
  assert.strictEqual(fx.competence.klima, base.klima); // kein Kernthema: keine Wirkung
  assert.strictEqual(E.gaffeTopic(prog), 'gesundheit');
});

test('Patzer: Wer in der Fachkonferenz scheitert, bekommt spätestens in Woche 3 das Patzer-Ereignis', () => {
  const prog = E.defaultProgram('gruene');
  prog.quiz = {}; prog.core.forEach(t => { prog.quiz[t] = 4; });
  prog.quiz[prog.core[1]] = 1;
  const g = E.newGame('gruene', 'Test', 9, prog);
  assert.strictEqual(g.gaffe, prog.core[1]);
  const seen = [];
  while (g.phase === 'campaign' && g.week < 4) {
    if (g.pendingEvent) { seen.push(g.pendingEvent); E.resolveEvent(g, 0); }
    if (g.week === E.DUEL_WEEK && !g.duelDone) { E.startDuel(g); while (g.duel) E.duelAnswer(g, 'sachlich'); }
    E.endWeek(g);
  }
  if (g.pendingEvent) seen.push(g.pendingEvent);
  assert.ok(seen.includes('patzer'), seen.join(','));
  const ok = E.newGame('gruene', 'Test', 9, Object.assign({}, prog, { quiz: { [prog.core[0]]: 3, [prog.core[1]]: 3, [prog.core[2]]: 3 } }));
  assert.strictEqual(ok.gaffe, null);
});

test('Fragen der Fachkonferenz: 30 gültige Fragen je Thema', () => {
  const Q = require('../js/questions.js');
  for (const t of D.TOPICS) {
    const list = Q[t.id];
    assert.strictEqual(list.length, 30, t.id);
    assert.strictEqual(new Set(list.map(x => x.q)).size, 30, t.id + ': doppelte Frage');
    for (const x of list) {
      assert.strictEqual(x.a.length, 4, x.q);
      assert.strictEqual(new Set(x.a).size, 4, x.q);
      assert.ok(Number.isInteger(x.c) && x.c >= 0 && x.c < 4, x.q);
      assert.ok(x.e && x.e.length > 10, x.q);
    }
  }
});

test('Abnutzung: Spendendinner nur einmal pro Woche, Erträge sinken, TV-Spots werden teurer', () => {
  const g = E.newGame('union', 'Test', 5);
  const m0 = g.money;
  assert.ok(E.performAction(g, 'spenden').ok);
  const first = g.money - m0;
  assert.strictEqual(E.performAction(g, 'spenden').ok, false);
  assert.ok(!E.spendenAvailable(g));
  g.week = 2; g.ap = 3;
  const m1 = g.money;
  assert.ok(E.performAction(g, 'spenden').ok);
  assert.ok(g.money - m1 < first + 0.3);
  assert.ok(E.spendenYield(g) < first);
  g.week = 1;
  const early = E.actionCost('tvspot', null, g);
  g.week = 8;
  assert.ok(E.actionCost('tvspot', null, g) > early);
});

test('Umfragen haben eine Fehlerspanne von höchstens ± 3, die Wahl nutzt den wahren Wert', () => {
  const g = E.newGame('spd', 'Test', 9);
  for (let w = 0; w < 5; w++) {
    E.endWeek(g);
    if (g.pendingEvent) E.resolveEvent(g, 0);
    Object.values(g.pollErr).forEach(e => assert.ok(Math.abs(e) <= E.POLL_RANGE));
    const pub = E.publishedShares(g);
    assert.ok(Math.abs(Object.values(pub).reduce((a, b) => a + b, 0) - 100) < 1e-6);
  }
  assert.ok(g.history.every(h => h.shares && h.real));
});

test('Wählergruppen: Social Media erreicht vor allem Junge, TV-Spots vor allem Ältere', () => {
  const social = E.groupMix('social');
  const tv = E.groupMix('tvspot');
  assert.ok(social.jung > social.aelter);
  assert.ok(tv.aelter > tv.jung);
  const g = E.newGame('gruene', 'Test', 3);
  const before = E.groupShares(g, 'jung').gruene;
  for (let i = 0; i < 3; i++) { g.ap = 3; E.performAction(g, 'social', { topic: 'klima' }); }
  assert.ok(g.grp.jung.gruene > g.grp.aelter.gruene);
  assert.ok(E.groupShares(g, 'jung').gruene >= before - 1.5);
  // Sättigung: dieselbe Zielgruppe bringt immer weniger
  assert.ok(E.groupEfficiency(g, 'gruene', 'social', 'klima') < 1);
});

test('KI-Gegner reagieren: Negativkampagnen und besetzte Kernthemen kommen vor', () => {
  let attacks = 0, steals = 0;
  for (let seed = 0; seed < 30; seed++) {
    const g = E.newGame('union', 'Test', seed);
    while (g.phase === 'campaign') {
      if (g.pendingEvent) E.resolveEvent(g, 0);
      if (g.week === E.DUEL_WEEK && !g.duelDone) { E.startDuel(g); while (g.duel) E.duelAnswer(g, 'sachlich'); }
      E.endWeek(g);
    }
    attacks += g.log.filter(l => l.type === 'ai' && /Negativkampagne/.test(l.text)).length;
    steals += g.log.filter(l => l.type === 'ai' && /Kernthema/.test(l.text)).length;
  }
  assert.ok(attacks > 0 && steals > 0);
});

test('Spätfolgen: Eine angenommene Großspende kann Wochen später zur Spendenaffäre werden', () => {
  let followed = 0;
  for (let seed = 0; seed < 20; seed++) {
    const g = E.newGame('fdp', 'Test', seed);
    g.pendingEvent = 'grossspende';
    E.resolveEvent(g, 0);
    if (!g.delayed.length) continue;
    assert.ok(g.delayed[0].week > g.week);
    while (g.phase === 'campaign' && g.pendingEvent !== 'spendenaffaere2') {
      if (g.pendingEvent) E.resolveEvent(g, 0);
      if (g.week === E.DUEL_WEEK && !g.duelDone) { E.startDuel(g); while (g.duel) E.duelAnswer(g, 'sachlich'); }
      E.endWeek(g);
    }
    if (g.pendingEvent === 'spendenaffaere2') followed++;
  }
  assert.ok(followed > 0);
  // Folgeereignisse werden nie zufällig gezogen
  assert.ok(E.EVENTS.filter(e => e.followUp).length >= 5);
});

test('Auch die sonstigen Parteien gewinnen und verlieren in den Umfragen', () => {
  const finals = [];
  for (let seed = 0; seed < 20; seed++) {
    const g = E.newGame('linke', 'Test', seed);
    const start = E.nationalShares(g).sonstige;
    for (let w = 0; w < 6; w++) { E.endWeek(g); if (g.pendingEvent) E.resolveEvent(g, 0); }
    assert.ok(g.otherSwing >= -3 && g.otherSwing <= 4);
    finals.push(E.nationalShares(g).sonstige - start);
  }
  assert.ok(finals.some(d => d > 0.3) && finals.some(d => d < -0.3));
});

test('Wählergruppen: je Dimension (Alter, Bildung, Wohnort) ergeben die Anteile 100 %', () => {
  for (const dim of D.GROUP_DIMS) {
    const ks = D.GROUPS.filter(k => k.dim === dim.id);
    assert.ok(ks.length >= 2, dim.id);
    assert.ok(Math.abs(ks.reduce((s, k) => s + k.weight, 0) - 1) < 1e-9, dim.id);
  }
  assert.ok(D.GROUPS.some(k => k.id === 'mitte' && /30–59/.test(k.name)));
  assert.ok(D.GROUPS.some(k => k.id === 'jung' && /18–29/.test(k.name)));
  assert.deepStrictEqual(D.GROUPS.filter(k => k.dim === 'bildung').map(k => k.id), ['niedrig', 'mittel', 'hoch']);
  assert.deepStrictEqual(D.GROUPS.filter(k => k.dim === 'geschlecht').map(k => k.id), ['maenner', 'frauen']);
  assert.ok(D.STATES.every(st => Math.abs(D.STATE_GROUPS[st.id].maenner + D.STATE_GROUPS[st.id].frauen - 1) < 1e-6));
  // Gewichteter Schnitt der Gruppenwerte je Dimension entspricht etwa dem Bundeswert
  const g = E.newGame('gruene', 'Test', 2);
  const nat = E.publishedShares(g).gruene;
  for (const dim of D.GROUP_DIMS) {
    const avg = D.GROUPS.filter(k => k.dim === dim.id).reduce((s, k) => s + k.weight * E.groupShares(g, k.id).gruene, 0);
    assert.ok(Math.abs(avg - nat) < 1.5, dim.id + ' ' + avg + ' vs ' + nat);
  }
});

test('Wählergruppen je Bundesland: Stadtstaaten nur Großstädter, Kanäle passen je nach Land', () => {
  for (const st of D.STATES) {
    const w = D.STATE_GROUPS[st.id];
    assert.ok(w, st.id);
    for (const dim of D.GROUP_DIMS) {
      const sum = D.GROUPS.filter(k => k.dim === dim.id).reduce((s, k) => s + w[k.id], 0);
      assert.ok(Math.abs(sum - 1) < 1e-6, st.id + ' ' + dim.id);
    }
  }
  ['BE', 'HH', 'HB'].forEach(id => { assert.strictEqual(D.STATE_GROUPS[id].stadt, 1); assert.strictEqual(D.STATE_GROUPS[id].land, 0); });
  // Plakate ziehen in Hamburg schlechter als in Mecklenburg-Vorpommern
  assert.ok(E.channelFit('plakate', 'HH') < 1 && E.channelFit('plakate', 'MV') > E.channelFit('plakate', 'HH'));
  // Gruppenwerte im Land mitteln sich zum Landeswert
  const g = E.newGame('gruene', 'Test', 4);
  for (const id of ['HH', 'SN']) {
    const land = E.publishedStateShares(g, id).gruene;
    const w = D.STATE_GROUPS[id];
    const avg = D.GROUPS.filter(k => k.dim === 'alter').reduce((s, k) => s + w[k.id] * E.groupShares(g, k.id, id).gruene, 0);
    assert.ok(Math.abs(avg - land) < 1.5, id);
  }
});

test('Programmparteitag wirkt auf Wählergruppen: Parteilinie neutral, Abweichungen verschieben Gruppen und Länder', () => {
  const line = E.programEffects('gruene', E.defaultProgram('gruene'));
  assert.ok(Object.values(line.groups).every(v => Math.abs(v) < 1e-9));
  const hard = E.defaultProgram('gruene');
  hard.positions.migration = D.PROGRAM.migration.findIndex(o => o.lean === 1);
  const fx = E.programEffects('gruene', hard);
  assert.ok(fx.groups.niedrig > 0 && fx.groups.hoch < 0);
  assert.ok(E.programStateEffect(fx.groups, 'BB') > E.programStateEffect(fx.groups, 'BE'));
  // im Spiel: Gruppenwerte und Landeswerte folgen dem Programm
  const g1 = E.newGame('gruene', 'T', 1);
  const g2 = E.newGame('gruene', 'T', 1, hard);
  g1.pollErr = {}; g2.pollErr = {};
  const rel = g => E.groupShares(g, 'niedrig').gruene - E.groupShares(g, 'hoch').gruene;
  assert.ok(rel(g2) > rel(g1));
});

test('Landesthemen: Gruppen haben je Land andere Interessen, Themen-Aktionen wirken regional', () => {
  assert.ok(D.STATES.every(st => D.STATE_TOPICS[st.id]));
  assert.deepStrictEqual(E.stateTopTopics('HH', 2), ['verkehr', 'wohnen']);
  // Großstädter: in Bayern andere Lieblingsthemen als in NRW
  assert.notDeepStrictEqual(E.groupTopicsInState('stadt', 'BY', 3), E.groupTopicsInState('stadt', 'NW', 3));
  // TV-Spot zu Migration bringt in Sachsen mehr als in Berlin
  const g = E.newGame('afd', 'T', 3);
  const before = { SN: E.stateShares(g, 'SN').afd, BE: E.stateShares(g, 'BE').afd };
  E.performAction(g, 'tvspot', { topic: 'migration' });
  assert.ok(E.stateShares(g, 'SN').afd - before.SN > E.stateShares(g, 'BE').afd - before.BE);
  // Vor-Ort-Aktion mit passendem Thema wirkt besser als mit unpassendem
  assert.ok(E.localTopicFactor(g, 'HH', 'wohnen') > E.localTopicFactor(g, 'HH', 'land'));
});

test('Neue Wählergruppen Beruf und Konfession, Mobilisierung erhöht Anteil und Wahlbeteiligung', () => {
  assert.deepStrictEqual(D.GROUPS.filter(k => k.dim === 'konfession').map(k => k.id), ['kath', 'evang', 'konfl']);
  assert.strictEqual(D.GROUPS.filter(k => k.dim === 'beruf').length, 7);
  for (const st of D.STATES) {
    for (const dim of D.GROUP_DIMS) {
      const sum = D.GROUPS.filter(k => k.dim === dim.id).reduce((s, k) => s + D.STATE_GROUPS[st.id][k.id], 0);
      assert.ok(Math.abs(sum - 1) < 1e-3, st.id + ' ' + dim.id);
    }
  }
  const g = E.newGame('spd', 'T', 2);
  g.pollErr = {};
  const t0 = E.turnout(g, 'NW');
  assert.ok(Math.abs(t0 - D.TURNOUT.NW) < 0.5);
  const s0 = E.stateShares(g, 'NW').spd;
  for (let i = 0; i < 3; i++) { g.ap = 3; E.performAction(g, 'haustuer', { state: 'NW' }); }
  assert.ok(E.turnout(g, 'NW') > t0);
  assert.ok(E.mobFactor(g, 'spd', 'NW') > 1);
  assert.ok(E.stateShares(g, 'NW').spd > s0);
  // Katholiken wählen häufiger Union: Union in Bayern bei Katholiken stärker als bei Konfessionslosen
  const u = E.newGame('union', 'T', 2);
  u.pollErr = {};
  assert.ok(E.groupShares(u, 'kath', 'BY').union > E.groupShares(u, 'konfl', 'BY').union);
});
