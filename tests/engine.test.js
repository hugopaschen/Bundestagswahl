const test = require('node:test');
const assert = require('node:assert');
const D = require('../js/data.js');
const E = require('../js/engine.js');

const sum = obj => Object.values(obj).reduce((a, b) => a + b, 0);

test('Startwerte entsprechen der Sonntagsfrage (Infratest dimap)', () => {
  const g0 = E.newGame('spd', 'Test', 1);
  const s = E.mergeShares(g0, g0.startShares); // Kleinparteien stecken in „Sonstige“
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
      while (g.pendingEvent) E.resolveEvent(g, 0);
      if (g.week === E.DUEL_WEEK && !g.duelDone) {
        E.startDuel(g);
        while (g.duel) E.duelAnswer(g, 'sachlich');
      }
      while (g.ap > 0 && E.performAction(g, 'haustuer', { state: 'NW' }).ok);
      assert.ok(E.endWeek(g).ok);
    }
    if (g.result.awaitingChoice) E.chooseCoalition(g, 0);
    while (g.result.neg && !g.result.neg.done) E.negotiate(g, g.result.neg.step < g.result.neg.topics.length ? 'kompromiss' : 'fach');
    if (g.result.awaitingChoice) E.chooseCoalition(g, 0);
    while (g.result.neg && !g.result.neg.done) E.negotiate(g, g.result.neg.step < g.result.neg.topics.length ? 'kompromiss' : 'fach');
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
  // FDP: Der Wiedereinzug zählt – über 5 % oder über die Grundmandatsklausel.
  assert.strictEqual(E.goalReached('fdp', Object.assign({}, r, { seats: Object.assign({}, seats, { fdp: 32 }) })), true);
});

test('Erststimmen: Grundmandatsklausel und Zweitstimmendeckung am Wahlabend', () => {
  assert.strictEqual(E.WK_LIST.length, 299);
  const g = E.newGame('linke', 'T', 5);
  // Die Linke gewinnt drei Wahlkreise deutlich, liegt aber bundesweit unter 5 %.
  D.STATES.forEach(st => { g.reg[st.id].linke -= 9; });
  E.WK_LIST.filter(w => w.land === 'BE').slice(0, 3).forEach(w => { g.wk = g.wk || {}; g.wk[w.nr] = { linke: 60 }; });
  g.week = g.maxWeeks;
  while (g.pendingEvent) E.resolveEvent(g, 0);
  g.duelDone = true;
  E.endWeek(g);
  const r = g.result;
  assert.ok(r.shares.linke < 5, 'Linke unter 5 %: ' + r.shares.linke);
  assert.ok(r.direct.linke >= 3);
  assert.ok(r.grundmandat.indexOf('linke') !== -1);
  assert.ok(r.seats.linke > 0);
  assert.strictEqual(r.wk.length, 299);
  // Wer seinen Wahlkreis gewinnt, ohne dass die Zweitstimmen reichen, bleibt ohne Sitz.
  const won = {};
  r.wk.filter(x => x.seated).forEach(x => { won[x.win] = (won[x.win] || 0) + 1; });
  Object.keys(won).forEach(p => assert.ok(won[p] <= r.seats[p]));
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
    while (g.pendingEvent) E.resolveEvent(g, 0);
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
      while (g.pendingEvent) E.resolveEvent(g, 0);
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
      while (g.pendingEvent && g.pendingEvent !== 'spendenaffaere2') E.resolveEvent(g, 0);
      if (g.pendingEvent) break;
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
    for (let w = 0; w < 6; w++) { E.endWeek(g); while (g.pendingEvent) E.resolveEvent(g, 0); }
    assert.ok(g.otherSwing >= -3 && g.otherSwing <= 4);
    finals.push(E.nationalShares(g).sonstige - start);
  }
  assert.ok(finals.some(d => d > 0.1) && finals.some(d => d < -0.3));
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

test('Neue Aktionen: Betrieb, Bürgerdialog, Infostand, Regionalmedium, Online-Werbung, Gegenangriff', () => {
  const g = E.newGame('spd', 'T', 5);
  for (const id of ['betrieb', 'buerger', 'infostand', 'regional']) {
    g.ap = 3;
    assert.ok(E.performAction(g, id, { state: 'NW', topic: 'wirtschaft' }).ok, id);
  }
  // Online-Werbung wirkt vor allem in der Zielgruppe
  const before = g.grp.arbeiter.spd;
  g.ap = 3;
  assert.strictEqual(E.performAction(g, 'online', { topic: 'wirtschaft' }).ok, false);
  const r = E.performAction(g, 'online', { group: 'arbeiter', topic: 'wirtschaft' });
  assert.ok(r.ok);
  if (!/Datenschutz/.test(r.text)) assert.ok(g.grp.arbeiter.spd > before);
  // Gegenangriff: Ziel muss eine andere Partei sein, der Angegriffene merkt es sich
  g.ap = 3;
  assert.strictEqual(E.performAction(g, 'angriff', { rival: 'spd' }).ok, false);
  assert.ok(E.performAction(g, 'angriff', { rival: 'union', topic: 'soziales' }).ok);
  assert.strictEqual(g.grudge.union, g.week);
});

test('Briefwahl: Stimmen werden ab Woche 5 abgegeben und zählen mit der Stimmung von damals', () => {
  const g = E.newGame('gruene', 'T', 7);
  assert.strictEqual(E.performAction(g, 'briefwahl').ok, false); // vor Woche 4 nicht möglich
  while (g.week < 5) { E.endWeek(g); while (g.pendingEvent) E.resolveEvent(g, 0); }
  assert.strictEqual(E.postalCast(g), 0);
  g.ap = 3;
  assert.ok(E.performAction(g, 'briefwahl').ok);
  E.endWeek(g); while (g.pendingEvent) E.resolveEvent(g, 0);
  assert.ok(E.postalCast(g) > 0);
  // Ein später Einbruch trifft die Urnenwahl voll, die Briefwahl nur teilweise
  const urn = E.nationalShares(g).gruene;
  g.nat.gruene -= 5;
  const dropUrn = urn - E.nationalShares(g).gruene;
  const el = E.electionShares(g).gruene;
  g.nat.gruene += 5;
  const dropEl = E.electionShares(g).gruene - el;
  assert.ok(dropEl < dropUrn);
});

test('Umfrage je Wählergruppe: Verlauf wird jede Woche für alle Gruppen gespeichert', () => {
  const g = E.newGame('fdp', 'T', 4);
  assert.ok(g.history[0].groups && g.history[0].groups.arbeiter);
  E.endWeek(g); while (g.pendingEvent) E.resolveEvent(g, 0);
  const last = g.history[g.history.length - 1].groups;
  assert.strictEqual(Object.keys(last).length, D.GROUPS.length);
  for (const k of Object.keys(last)) {
    const sum = Object.values(last[k]).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 100) < 1, k);
  }
});

test('Sonntagsfrage und Umfrageverlauf zeigen dieselben veröffentlichten Werte', () => {
  const g = E.newGame('union', 'T', 6);
  assert.deepStrictEqual(g.history[0].shares, E.pollShares(g));
  const before = E.pollShares(g).union;
  E.performAction(g, 'tvspot', { topic: 'wirtschaft' });
  assert.strictEqual(E.pollShares(g).union, before); // neue Werte erst mit der nächsten Umfrage
  E.endWeek(g); while (g.pendingEvent) E.resolveEvent(g, 0);
  assert.deepStrictEqual(g.history[g.history.length - 1].shares, E.pollShares(g));
  assert.deepStrictEqual(g.history[g.history.length - 1].groups.jung, E.pollGroupShares(g, 'jung'));
});

test('Sättigung je Gruppe und Thema; Vor-Ort-Aktion mit Zielgruppe', () => {
  const g = E.newGame('spd', 'T', 8);
  const fresh = E.focusFactor(g, 'kundgebung', 'bildung', 'NW', 'arbeiter');
  const freshW = E.focusFactor(g, 'kundgebung', 'wirtschaft', 'NW', 'arbeiter');
  for (let i = 0; i < 3; i++) { g.ap = 3; assert.ok(E.performAction(g, 'kundgebung', { state: 'NW', topic: 'wirtschaft', group: 'arbeiter' }).ok); }
  // Mit Wirtschaft umworben – beim Thema Bildung wirkt die Ansprache weiter voll
  assert.ok(E.focusFactor(g, 'kundgebung', 'wirtschaft', 'NW', 'arbeiter') < freshW);
  assert.ok(Math.abs(E.focusFactor(g, 'kundgebung', 'bildung', 'NW', 'arbeiter') - fresh) < 1e-9);
  assert.ok(E.saturatedContexts(g, 'arbeiter', 0.9).some(c => c.topic === 'wirtschaft' && c.state === 'NW' && c.channel === 'kundgebung'));
  // Andere Länder und andere Aktionen sind davon nicht betroffen
  assert.ok(Math.abs(E.focusFactor(g, 'kundgebung', 'wirtschaft', 'NI', 'arbeiter') - E.focusFactor(E.newGame('spd', 'T', 8), 'kundgebung', 'wirtschaft', 'NI', 'arbeiter')) < 1e-9);
  assert.strictEqual(E.groupSat(g, 'arbeiter', 'spd', 'wirtschaft', 'NW', 'infostand'), 1);
  assert.ok(E.groupSat(g, 'arbeiter', 'spd', 'wirtschaft', 'NW', 'kundgebung') < 1);
  // In Stadtstaaten gibt es keine Landbevölkerung
  g.ap = 3;
  assert.strictEqual(E.performAction(g, 'kundgebung', { state: 'HH', group: 'land' }).ok, false);
});

test('Szenarien: 10 je Aktion, 3 werden gestellt; gute Vorbereitung macht Aktionen wirksamer', () => {
  const S = require('../js/scenarios.js');
  for (const a of E.ACTIONS) {
    assert.strictEqual((S[a.id] || []).length, 10, a.id);
    for (const sc of S[a.id]) assert.deepStrictEqual(sc.o.map(o => o.q).sort(), [-1, 0, 1]);
  }
  const g = E.newGame('spd', 'T', 3);
  const ids = E.pickScenarios(g, 'kundgebung', 3);
  assert.strictEqual(new Set(ids).size, 3);
  // die nächsten drei Szenarien sind neue
  const ids2 = E.pickScenarios(g, 'kundgebung', 3);
  assert.ok(ids2.every(i => ids.indexOf(i) === -1));
  const run = prep => { const h = E.newGame('spd', 'T', 3); E.performAction(h, 'kundgebung', { state: 'NW', prep }); return h.reg.NW.spd; };
  assert.ok(run(3) > run(0) && run(0) > run(-3) && run('skip') < run(0));
});

test('Bürgerfragen: 20 je Thema, andere als in der Fachkonferenz; Antworten ändern die Kompetenz', () => {
  const CQ = require('../js/citizenq.js');
  const QS = require('../js/questions.js');
  for (const t of D.TOPICS) {
    assert.strictEqual((CQ[t.id] || []).length, 20, t.id);
    const fk = new Set((QS[t.id] || []).map(q => q.q));
    for (const q of CQ[t.id]) {
      assert.strictEqual(q.a.length, 4);
      assert.ok(q.c >= 0 && q.c <= 3 && q.e);
      assert.ok(!fk.has(q.q));
    }
  }
  const g = E.newGame('gruene', 'T', 2);
  const before = g.competence.wohnen;
  const r = E.performAction(g, 'infostand', { state: 'BE', topic: 'wohnen', prep: 2, cq: { right: 2, wrong: 0 } });
  assert.ok(r.ok && /Kompetenz/.test(r.text));
  assert.strictEqual(g.competence.wohnen, before + 2 * E.CQ_COMP);
  // gedeckelt: höchstens ±12 über den Wahlkampf
  for (let i = 0; i < 10; i++) E.citizenCompetence(g, 'wohnen', 2, 0);
  assert.strictEqual(g.competence.wohnen, before + 12);
  // ohne Thema keine Bürgerfragen-Wirkung auf die Kompetenz
  const k = Object.assign({}, g.competence);
  g.ap = 3;
  E.performAction(g, 'infostand', { state: 'BE', cq: { right: 2, wrong: 0 } });
  assert.deepStrictEqual(g.competence, k);
});

test('Termine der Kandidatur und Team-Einsätze sind getrennte Kontingente', () => {
  const g = E.newGame('union', 'T', 4);
  assert.strictEqual(g.ap, 3);
  const base = D.PARTIES.find(x => x.id === 'union').team;
  assert.strictEqual(g.team, base);
  assert.strictEqual(E.newGame('bsw', 'T', 4).team, D.PARTIES.find(x => x.id === 'bsw').team);
  for (let i = 0; i < base; i++) assert.ok(E.performAction(g, 'haustuer', { state: 'BY', topic: 'wirtschaft' }).ok);
  assert.strictEqual(g.team, 0);
  assert.strictEqual(g.ap, 3);
  assert.strictEqual(E.performAction(g, 'infostand', { state: 'BY' }).ok, false);
  assert.ok(E.performAction(g, 'kundgebung', { state: 'BY' }).ok);
  assert.strictEqual(g.ap, 2);
  while (g.week < 5) { E.endWeek(g); while (g.pendingEvent) E.resolveEvent(g, 0); }
  assert.strictEqual(g.teamMax, base + 1);
  assert.strictEqual(g.team, base + 1);
});

test('Wählerwanderung: Gewinne gehen vor allem zulasten der Nachbarn (Daten 2025)', () => {
  const g = E.newGame('spd', 'T', 4);
  const before = E.nationalShares(g);
  g.nat.union += 3;
  const after = E.nationalShares(g);
  const loss = p => before[p] - after[p];
  assert.ok(after.union > before.union);
  // Die Union tauscht real viel mit SPD, FDP und AfD, kaum mit der Linken.
  assert.ok(loss('afd') > loss('linke'));
  assert.ok(loss('spd') > loss('gruene'));
  const net = E.flowSummary(g, 'union');
  assert.ok(net.spd > 0 && net.afd > 0);
  assert.ok(net.spd > net.linke);
});

test('Abwerbung: Kompetenz bei einem fremden Thema holt Stimmen bei dessen Besitzer', () => {
  const g = E.newGame('fdp', 'T', 4);
  g.competence.klima = 75;
  const from = E.steerVotes(g, 'fdp', 'klima', 'jung', 1);
  assert.strictEqual(from, 'gruene');
  const src = g.src.fdp;
  assert.ok(Object.keys(src).every(q => q === 'gruene' || src[q] < src.gruene));
  // Ohne Kompetenz kein gezieltes Abwerben bei den Grünen.
  const h = E.newGame('fdp', 'T', 4);
  h.competence.klima = 20;
  E.steerVotes(h, 'fdp', 'klima', 'jung', 1);
  assert.ok(!h.src || !h.src.fdp || !(h.src.fdp.gruene > 0));
});

test('Brandmauer: Stufen verändern Koalitionsmöglichkeiten', () => {
  const g = E.newGame('union', 'T', 4);
  assert.strictEqual(E.coalitionViable(['union', 'afd'], g), false);
  E.openFirewall(g, 'union', 1);
  assert.strictEqual(E.coalitionViable(['union', 'spd'], g), true); // Zufallsmehrheiten: Partner bleiben
  E.openFirewall(g, 'union', 2);
  assert.strictEqual(E.coalitionViable(['union', 'spd'], g), false); // SPD hält die Mauer
  const tol = E.findCoalitions({ union: 200, afd: 150, spd: 130, gruene: 90, linke: 60 }, g).filter(c => c.tolerated);
  assert.ok(tol.some(c => c.members.join() === 'union'));
  E.openFirewall(g, 'union', 3);
  assert.strictEqual(E.coalitionViable(['union', 'afd'], g), true);
  E.closeFirewall(g, 'union');
  assert.strictEqual(E.fwLevel(g, 'union'), 0);
  assert.strictEqual(E.coalitionViable(['union', 'afd'], g), false);
});

test('Brandmauer: Öffnung kostet in der Mitte, holt bei der AfD, Gegner mobilisieren', () => {
  const g = E.newGame('spd', 'T', 4);
  const s0 = E.nationalShares(g);
  E.openFirewall(g, 'union', 2);
  const s1 = E.nationalShares(g);
  assert.ok(s1.union < s0.union);
  assert.ok(s1.spd > s0.spd && s1.gruene > s0.gruene);
  assert.ok(g.src.union.afd > 0);
  assert.ok(g.mobPerm.linke > 0);
  // Programmparteitag: Koalitionsaussage wirkt ab der ersten Umfrage.
  const prog = E.defaultProgram('fdp');
  prog.firewall = 1;
  const h = E.newGame('fdp', 'T', 4, prog);
  assert.strictEqual(E.fwLevel(h, 'fdp'), 1);
});

test('Kleinparteien: ab 3,5 % eigenständig in der Umfrage, Freie Wähler können Wahlkreise gewinnen', () => {
  const g = E.newGame('spd', 'T', 7);
  assert.deepStrictEqual(E.shownIds(g).filter(p => E.MINOR_IDS.includes(p)), []);
  const s0 = g.startShares;
  assert.ok(s0.fw > 1 && s0.fw < 3, 'FW Start ' + s0.fw);
  // Die Freien Wähler legen kräftig zu – in Bayern besonders.
  g.minor.fw.trend = 2.6;
  g.week = 2;
  E.endWeek(g);
  while (g.pendingEvent) E.resolveEvent(g, 0);
  assert.ok(g.poll.nat.fw >= 3.5 ? E.isShown(g, 'fw') : !E.isShown(g, 'fw'));
  g.shown.fw = true;
  assert.ok(E.shownIds(g).includes('fw'));
  const merged = E.mergeShares(g, g.poll.nat);
  assert.ok('fw' in merged && !('volt' in merged));
  const by = E.WK_LIST.filter(w => w.land === 'BY').map(w => E.wkShares(g, w.nr, false));
  assert.ok(by.some(x => x.lead === 'fw'), 'FW gewinnt in Bayern mindestens einen Wahlkreis');
});

test('Alte Spielstände ohne Kleinparteien: Wahlkreise bleiben berechenbar', () => {
  const g = E.newGame('union', 'T', 9);
  const old = JSON.parse(E.serialize(g));
  delete old.minor; delete old.shown;
  E.MINOR_IDS.forEach(m => { delete old.pollErr[m]; delete old.poll.nat[m]; Object.values(old.poll.states).forEach(st => { delete st[m]; }); });
  const h = E.deserialize(JSON.stringify(old));
  const proj = E.wkProjection(h, true);
  assert.ok(proj.every(x => Number.isFinite(x.margin)));
  assert.ok(new Set(proj.map(x => x.lead)).size > 2);
});

test('Koalitionsverhandlungen: Klima entscheidet, Erfolg bringt Punkte, Scheitern öffnet andere Optionen', () => {
  const make = () => {
    const g = E.newGame('union', 'T', 4);
    g.week = g.maxWeeks; g.duelDone = true;
    while (g.pendingEvent) E.resolveEvent(g, 0);
    g.nat.union += 8; // Union klar stärkste Kraft
    E.endWeek(g);
    return g;
  };
  const g = make();
  assert.ok(g.result.awaitingChoice);
  const i = g.result.options.findIndex(o => o.members.length > 1 && !o.tolerated);
  E.chooseCoalition(g, i);
  const n = g.result.neg;
  assert.ok(n && n.topics.length >= 1 && n.topics.length <= 3);
  while (!n.done) E.negotiate(g, n.step < n.topics.length ? 'nachgeben' : 'fach');
  assert.ok(n.success);
  assert.strictEqual(g.phase, 'done');
  assert.ok(g.result.government.indexOf('union') === 0);
  // Hart bleiben bei allem und das Finanzministerium fordern: die Gespräche können platzen.
  const h = make();
  E.chooseCoalition(h, h.result.options.findIndex(o => o.members.length > 1 && !o.tolerated));
  h.result.neg.mood = 40;
  while (!h.result.neg.done) E.negotiate(h, h.result.neg.step < h.result.neg.topics.length ? 'hart' : 'finanzen');
  assert.strictEqual(h.result.neg.success, false);
  assert.ok(h.result.awaitingChoice || h.phase === 'done' || (h.result.hung && h.result.hung.step === 'strategy'));
});

// ---------- Legislaturperiode ----------
const T = require('../js/term.js');
function electedGameFrom(party, next) {
  const g = E.newGame(party, next.candidate, 21, undefined, next.carry);
  g.week = g.maxWeeks; g.duelDone = true;
  while (g.pendingEvent) E.resolveEvent(g, 0);
  E.endWeek(g);
  for (let z = 0; z < 6 && g.phase !== 'done'; z++) {
    if (g.result.awaitingChoice) E.chooseCoalition(g, 0);
    while (g.result.neg && !g.result.neg.done) E.negotiate(g, g.result.neg.step < g.result.neg.topics.length ? 'nachgeben' : 'x');
    while (g.result.hung && !g.result.hung.done) { const h = g.result.hung; const free = h.tolerators.filter(p => h.tried.indexOf(p) === -1); E.hungChoice(g, h.step === 'ask' ? 'dulden' : free.length ? 'duldung' : 'minderheit', free[0]); }
  }
  return g;
}
function electedGame(party, seed, boost) {
  const g = E.newGame(party, 'Test', seed);
  g.week = g.maxWeeks; g.duelDone = true;
  while (g.pendingEvent) E.resolveEvent(g, 0);
  if (boost) g.nat[party] += boost;
  E.endWeek(g);
  for (let z = 0; z < 6 && g.phase !== 'done'; z++) {
    if (g.result.awaitingChoice) E.chooseCoalition(g, g.result.options.findIndex(o => o.members.length > 1 && !o.tolerated) >= 0 ? g.result.options.findIndex(o => o.members.length > 1 && !o.tolerated) : 0);
    while (g.result.neg && !g.result.neg.done) E.negotiate(g, g.result.neg.step < g.result.neg.topics.length ? 'nachgeben' : 'x');
    while (g.result.hung && !g.result.hung.done) { const h = g.result.hung; const free = h.tolerators.filter(p => h.tried.indexOf(p) === -1); E.hungChoice(g, h.step === 'ask' ? 'dulden' : free.length ? 'duldung' : 'minderheit', free[0]); }
  }
  return g;
}

test('Ressortverteilung: alle 16 Ministerien werden nach Sitzen vergeben', () => {
  const g = electedGame('union', 4, 8);
  const n = g.result.neg;
  assert.ok(n && n.success);
  assert.strictEqual(Object.keys(n.ministries).length, E.MINISTRIES.length);
  const own = Object.values(n.ministries).filter(p => p === 'union').length;
  assert.ok(own >= 6 && own <= 12);
});

test('Legislatur: Start als Kanzlerpartei mit Kabinett, Namen und Koalitionsvertrag', () => {
  const g = electedGame('union', 4, 8);
  const res = T.startTerm(g);
  assert.ok(res.ok);
  const t = g.term;
  assert.strictEqual(g.phase, 'term');
  assert.strictEqual(t.role, 'kanzler');
  assert.strictEqual(t.chancellor.name, 'Test');
  assert.ok(T.needsNames(g));
  const id = Object.keys(t.cabinet).find(k => t.cabinet[k].party === 'union' && !t.cabinet[k].name);
  T.nameMinister(g, id, 1, 'Erika Beispiel');
  assert.strictEqual(t.cabinet[id].name, 'Erika Beispiel');
  T.autoNames(g);
  assert.ok(!T.needsNames(g));
  const names = Object.values(t.cabinet).map(m => m.name);
  assert.strictEqual(new Set(names).size, names.length);
  assert.ok(names.every(x => !/\d/.test(x)));
  assert.ok(Object.keys(t.contract).length > 0);
  // Umfragen starten beim Wahlergebnis
  assert.ok(Math.abs(t.lastNat.union - g.result.shares.union) < 1.2);
});

test('Legislatur: Gesetz geht durch Kabinett und Bundestag und tritt in Kraft', () => {
  const g = electedGame('union', 4, 8);
  T.startTerm(g);
  const t = g.term;
  while (t.pending.length) T.resolvePending(g, 0);
  const o = T.lawOptions(g);
  const tp = o.topics.find(x => x.contract !== undefined && x.contract !== x.current && !require('../js/termdata.js').ZUST_TOPICS.includes(x.topic));
  assert.ok(tp);
  const r = T.performAction(g, 'gesetz', { topic: tp.topic, opt: tp.contract });
  assert.ok(r.ok, r.text);
  for (let i = 0; i < 4; i++) { while (t.pending.length) T.resolvePending(g, 0); T.endQuarter(g); }
  const law = t.laws.find(l => l.by === 'union' && l.topic === tp.topic);
  assert.strictEqual(law.stage, 'inkraft');
  assert.strictEqual(t.policy[tp.topic], tp.contract);
});

test('Legislatur: Haushalt mit Schuldenbremse, Entwurf und Abstimmung', () => {
  const g = electedGame('union', 4, 8);
  T.startTerm(g);
  const t = g.term;
  const b = T.budgetCalc(t);
  // Start mit dem Haushaltsgesetz 2026: 524,5 Mrd. € Ausgaben, 97,965 Mrd. € Nettokreditaufnahme, verfassungsgemäß.
  assert.ok(Math.abs(b.spend - 524.5) < 0.5);
  assert.ok(Math.abs(b.deficit - 97.9) < 0.5);
  assert.ok(Math.abs(b.gap) < 2);
  let guard = 0;
  while (!(t.budget.draft && !t.budget.draft.done) && guard++ < 6) { while (t.pending.length) T.resolvePending(g, 0); T.endQuarter(g); }
  assert.ok(t.budget.draft && T.playerDraftsBudget(g));
  const plan = {};
  Object.keys(t.budget.plan).forEach(a => { plan[a] = -10; });
  assert.ok(T.setBudgetDraft(g, plan, false).ok);
  assert.ok(T.budgetCalc(t, plan).gap < b.gap);
  for (let i = 0; i < 2; i++) { while (t.pending.length) T.resolvePending(g, 0); T.endQuarter(g); }
  assert.ok(t.budget.vote && typeof t.budget.vote.pass === 'boolean');
});

test('Legislatur: alle Rollen bis zum Ende, Speichern und nächster Wahlkampf', () => {
  for (const [p, seed] of [['spd', 7], ['linke', 3], ['fdp', 5]]) {
    const g = electedGame(p, seed);
    T.startTerm(g);
    const t = g.term;
    let guard = 0;
    while (!t.over && guard++ < 30) {
      while (t.pending.length) T.resolvePending(g, 0);
      T.performAction(g, 'basis');
      T.performAction(g, 'ltwk', 'SN');
      const r = T.endQuarter(g);
      assert.ok(r.ok, r.text);
      if (guard === 5) {
        const h = E.deserialize(E.serialize(g));
        assert.strictEqual(h.phase, 'term');
        assert.deepStrictEqual(h.term.econ, g.term.econ);
        assert.strictEqual(h.progGroups, null);
      }
    }
    assert.ok(t.over);
    assert.ok(t.ltwLog.length > 0);
    const next = T.nextCampaign(g);
    const g2 = E.newGame(p, next.candidate, 9, undefined, next.carry);
    assert.strictEqual(g2.career.terms.length, 1);
    assert.ok(g2.year >= 2030);
    const sh = E.nationalShares(g2);
    assert.ok(Math.abs(sh[p] - t.lastNat[p]) < 2.5, p + ' ' + sh[p] + ' vs ' + t.lastNat[p]);
  }
});

test('Legislatur: Bundesrat, Landtage und Status quo laufen über mehrere Legislaturen weiter', () => {
  let g = electedGame('spd', 7);
  const runTerm = h => { T.startTerm(h); const t = h.term; let k = 0; while (!t.over && k++ < 30) { while (t.pending.length) T.resolvePending(h, 0); T.endQuarter(h); } return t; };
  const t1 = runTerm(g);
  const laender1 = JSON.stringify(t1.laender);
  const next = T.nextCampaign(g);
  assert.strictEqual(next.carry.year, 2033);
  const g2 = electedGameFrom('spd', next);
  T.startTerm(g2);
  // Der Bundesrat startet mit dem Stand vom Ende der ersten Legislatur, nicht mit 2026.
  assert.strictEqual(JSON.stringify(g2.term.laender), laender1);
  assert.strictEqual(g2.term.year0, 2033);
  assert.strictEqual(T.cal(g2.term, 0).year, 2033);
  assert.deepStrictEqual(g2.term.sq, t1.sq);
  // Programmtexte mit Jahreszahlen folgen dem Wahljahr.
  assert.ok(D.PROGRAM.klima[0].label.indexOf('2044') !== -1, D.PROGRAM.klima[0].label);
  E.applyYear(E.YEAR0);
});

test('Status quo: Ränder greifen an, Mitte verteidigt, Gesetz setzt neuen Status quo', () => {
  const g = electedGame('union', 4, 8);
  T.startTerm(g);
  const t = g.term;
  const f = T.sqForces(g, 'migration');
  assert.ok(f.att.some(x => x.p === 'afd'));
  assert.ok(f.def.some(x => x.p === 'spd' || x.p === 'union'));
  while (t.pending.length) T.resolvePending(g, 0);
  const before = t.sq.verteidigung;
  T.performAction(g, 'sq', 'verteidigung');
  assert.ok(t.sq.verteidigung !== before);
});

test('Legislatur: euer Handeln bestimmt die Umfrage (aktiv schlägt passiv, Ursachen werden erfasst)', () => {
  const run = active => {
    const g = electedGame('linke', 3);
    T.startTerm(g);
    const t = g.term;
    for (let q = 0; q < 8; q++) {
      while (t.pending.length) T.resolvePending(g, 0);
      if (active) ['antrag', 'aktuelle', 'talkshow', 'sq'].forEach(id => T.performAction(g, id, g.program.core[q % g.program.core.length]));
      T.endQuarter(g);
    }
    return { share: t.lastNat.linke, fx: t.pollFxHist, cred: t.cred };
  };
  const a = run(true);
  const p = run(false);
  assert.ok(a.share > p.share + 1, a.share + ' vs ' + p.share);
  assert.ok(a.fx.length >= 7 && a.fx.some(h => h.fx.aktion > 0));
  assert.ok(p.fx.some(h => h.fx.aktion < 0)); // ungenutzte Aktionen kosten Sichtbarkeit
});

test('Stufe 2: Minister, Forderungen, Bürgerfragen und Folgeereignisse', () => {
  const g = electedGame('union', 4, 8);
  T.startTerm(g);
  const t = g.term;
  T.autoNames(g);
  // Ministerkompetenz: zuständiges Ressort wird gefunden und verändert Erfolgsaussichten
  const m = T.ministerFor(t, 'migration');
  assert.ok(m && m.ministry === 'innen');
  // Bürgerdialog mit zwei richtigen Antworten wirkt stärker als mit zwei falschen
  const run = (right, wrong) => {
    const h = E.deserialize(E.serialize(g));
    while (h.term.pending.length) T.resolvePending(h, 0);
    const before = h.nat.union;
    const r = T.performAction(h, 'buerger', { topic: 'wirtschaft', right, wrong });
    assert.ok(r.ok, r.text);
    return h.nat.union - before;
  };
  assert.ok(run(2, 0) > run(0, 2));
  // Forderungen der Partner kommen mit Frist und werden aufgelöst
  let guard = 0;
  while (!(t.demands && t.demands.length) && guard++ < 16 && !t.over) { while (t.pending.length) T.resolvePending(g, 0); T.endQuarter(g); }
  assert.ok(t.demands && t.demands.length, 'keine Forderung');
  const d = t.demands[0];
  assert.ok(d.due > d.q);
  // Folgeereignis: „Hart bleiben“ bei Bauernprotesten zieht eine Eskalation nach sich
  t.pending = [{ type: 'event', id: 'farmers' }];
  T.resolvePending(g, 2);
  assert.ok(t.followUps.some(f => f.id === 'farmers2'));
});

test('Stufe 3: Laufbahn mit Alter, Ämtern, Nachfolge und Ewigkeits-Bilanz', () => {
  const g = electedGame('spd', 7);
  T.startTerm(g);
  const t = g.term;
  const L0 = T.currentLeader(g);
  assert.strictEqual(L0.name, 'Test');
  assert.ok(T.leaderAge(g, 2029) >= 45 && T.leaderAge(g, 2029) <= 58);
  assert.ok(L0.offices.length === 1 && /Vizekanzler|Fraktion|Opposition|Kanzler|Partei/.test(L0.offices[0].office));
  assert.strictEqual(g.career.elections.length, 1);
  let k = 0;
  while (!t.over && k++ < 30) { while (t.pending.length) T.resolvePending(g, 0); T.endQuarter(g); }
  const next = T.nextCampaign(g);
  assert.ok(next.leaders && next.leaders.options.length === 3);
  // Zu alt: Die Spitze muss abtreten.
  g.career.leaders[g.career.leaders.length - 1].born = 1950;
  const old = T.nextCampaign(g);
  assert.strictEqual(old.leaders.stay.canStay, false);
  T.chooseLeader(old, 1);
  assert.strictEqual(old.candidate, old.leaders.options[1].name);
  assert.strictEqual(old.carry.career.leaders.length, 2);
  assert.ok(old.carry.cand.known < 60);
  const g2 = E.newGame('spd', old.candidate, 5, undefined, old.carry);
  assert.strictEqual(g2.cand.known, old.carry.cand.known);
  const leg = T.legacy(old.carry.career);
  assert.strictEqual(leg.terms, 1);
  assert.ok(leg.score > 0 && typeof leg.rating === 'string');
});

test('Lobbyismus: Verbände, Wahlprüfsteine, Reaktion auf Gesetze, Formulierungshilfe', () => {
  const g0 = E.newGame('spd', 'Test', 3);
  assert.ok(g0.lobby.rel.dgb > g0.lobby.rel.bda, 'SPD steht den Gewerkschaften näher als den Arbeitgebern');
  const ps = E.lobbyPruefstein(g0);
  assert.ok(ps && E.LB.byId(ps.id));
  const r = E.lobbyAnswer(g0, ps.id, ps.topic, g0.program.positions[ps.topic]);
  assert.ok(r.ok && typeof r.rel === 'number');
  // Legislatur: eigener Gesetzentwurf ruft den stärksten Gegner auf den Plan
  const g = electedGame('union', 4, 8);
  T.startTerm(g);
  const t = g.term;
  while (t.pending.length) T.resolvePending(g, 0);
  const o = T.lawOptions(g);
  const tp = o.topics.find(x => x.topic === 'soziales') || o.topics[0];
  const opt = tp.opts.find(i => D.PROGRAM[tp.topic][i].lean === 1) !== undefined ? tp.opts.find(i => D.PROGRAM[tp.topic][i].lean === 1) : tp.opts[0];
  T.performAction(g, 'gesetz', { topic: tp.topic, opt });
  const item = t.pending.find(x => x.type === 'lobby');
  if (item) {
    while (t.pending[0] !== item) T.resolvePending(g, 0);
    const relBefore = g.lobby.rel[item.lobby];
    T.resolvePending(g, 2); // Formulierungshilfe
    const law = t.laws.find(l => l.id === item.law);
    assert.strictEqual(law.ghost, item.lobby);
    assert.ok(g.lobby.rel[item.lobby] > relBefore);
    assert.ok(g.lobby.register.length >= 1);
  }
  // Lobbytermin verbessert die Beziehung und steht im Register
  const before = g.lobby.rel.vdk;
  const res = T.performAction(g, 'lobbytermin', 'vdk');
  assert.ok(res.ok, res.text);
  assert.ok(g.lobby.rel.vdk > before);
});

test('Gesetzgebungsverfahren: Regierungsentwurf mit beiden Durchgängen im Bundesrat, Fraktionsentwurf im Eiltempo', () => {
  const g = electedGame('union', 4, 8);
  T.startTerm(g);
  const t = g.term;
  T.autoNames(g);
  while (t.pending.length) T.resolvePending(g, 0);
  const o = T.lawOptions(g);
  const [a, b] = o.topics.filter(x => x.contract !== undefined && x.contract !== x.current);
  assert.ok(a && b);
  // Regierungsentwurf: erst Kabinett, dann Bundestag, dann 2. Durchgang im Bundesrat
  T.performAction(g, 'gesetz', { topic: a.topic, opt: a.contract });
  const la = t.laws.find(l => l.topic === a.topic && l.by === 'union');
  assert.strictEqual(la.stage, 'kabinett');
  T.endQuarter(g);
  assert.strictEqual(la.stage, 'bundestag');
  // Stellungnahme/Anhörung werden angeboten, solange der Entwurf im Bundestag liegt
  t.pending.filter(p => p.type === 'brstell' || p.type === 'anhoerung').forEach(p => assert.strictEqual(p.law, la.id));
  while (t.pending.length) T.resolvePending(g, 1);
  T.endQuarter(g);
  assert.ok(['bundesrat', 'gescheitert'].includes(la.stage) || la.stage === 'inkraft', la.stage);
  assert.ok(la.log.some(x => x.indexOf('1. Lesung') !== -1));
  // Fraktionsentwurf: kein Kabinett, Abstimmung schon zum Ende des Quartals
  while (t.pending.length) T.resolvePending(g, 0);
  t.ap = t.apMax;
  const r = T.performAction(g, 'gesetz', { topic: b.topic, opt: b.contract, fraktion: true });
  assert.ok(r.ok, r.text);
  const lb = t.laws.find(l => l.topic === b.topic && l.by === 'union');
  assert.ok(lb.fraktion);
  assert.strictEqual(lb.stage, 'bundestag');
  while (t.pending.length) T.resolvePending(g, 0);
  T.endQuarter(g);
  assert.ok(lb.stage !== 'bundestag' && lb.stage !== 'kabinett', lb.stage);
  assert.ok(!lb.log.some(x => x.indexOf('Kabinett beschließt') !== -1));
  assert.ok(T.LAW_STEPS.bundestag.length === 4);
});

test('Abstimmungskrimi: Wackelkandidaten umstimmen, Länder im Bundesrat gewinnen', () => {
  const g = electedGame('union', 4, 8);
  T.startTerm(g);
  const t = g.term;
  T.autoNames(g);
  while (t.pending.length) T.resolvePending(g, 0);
  const o = T.lawOptions(g);
  const tp = o.topics.find(x => x.contract !== undefined && x.contract !== x.current);
  T.performAction(g, 'gesetz', { topic: tp.topic, opt: tp.contract, fraktion: true });
  t.pending = t.pending.filter(p => p.type !== 'whip');
  const law = t.laws.find(l => l.topic === tp.topic && l.by === 'union');
  const before = T.bundestagVote(g, law).detail.union;
  t.pending.unshift({ type: 'whip', law: law.id, i: 0, groups: [
    { p: 'union', n: 6, reason: 'wahlkreis', name: 'Erika Beispiel', wk: 'Testhausen', land: 'BY' },
    { p: 'union', n: 4, reason: 'gewissen', name: 'Max Muster', wk: 'Musterstadt', land: 'BY' }] });
  const r1 = T.resolvePending(g, 1);
  assert.ok(r1.more && /Förderprojekt/.test(r1.text));
  assert.strictEqual(law.conv.union, 6);
  const r2 = T.resolvePending(g, 1);
  assert.ok(!r2.more && /Schätzung/.test(r2.text));
  assert.strictEqual(law.conv.union, 6);
  assert.ok(T.bundestagVote(g, law).detail.union.no <= Math.max(0, before.no - 0));
  assert.ok(law.log.some(x => x.indexOf('Erika Beispiel') !== -1));
  // Bundesrat: Finanzzusage holt ein Land
  law.stage = 'bundesrat';
  const land = Object.keys(t.laender).find(l => !T.bundesratVote(g, law).lands[l]);
  if (land) {
    t.pending.unshift({ type: 'brwhip', law: law.id, i: 0, lands: [{ land, votes: t.laender[land].votes, mp: 'Testi', party: t.laender[land].gov[0], block: [] }] });
    T.resolvePending(g, 0);
    assert.ok(T.bundesratVote(g, law).lands[land]);
  }
});

test('Szenen in der Legislatur: jede Szene baut sich auf, ihr Ergebnis wirkt auf die Aktion', () => {
  const TS = require('../js/termscenes.js');
  const D = require('../js/data.js');
  const g = electedGame('union', 4, 8);
  T.startTerm(g);
  const t = g.term;
  T.autoNames(g);
  while (t.pending.length) T.resolvePending(g, 0);
  ['regerkl', 'presse', 'koaausschuss', 'reise', 'ua', 'antrag', 'aktuelle', 'befragung', 'protest'].forEach(id => {
    const sc = TS.build(id, { g, t, E, D, T, topic: 'wirtschaft' });
    assert.ok(sc && sc.intro && sc.steps.length >= 2, id);
    sc.steps.forEach(st => { assert.ok(st.options.length >= 2, id); st.options.forEach(o => assert.ok(o.label && (o.roll || o.reply !== undefined), id + ': ' + o.label)); });
    const card = sc.result({ meter: 60, q: 2, fx: {} });
    assert.ok(card.headline && card.rows.length, id);
  });
  // Starke Szene wirkt stärker als schwache
  const base = JSON.stringify(g);
  const run = q => { const h = JSON.parse(base); const s0 = h.nat.union; T.performAction(h, 'regerkl', 'wirtschaft', { q, fx: { mood: q } }); return { d: h.nat.union - s0, mood: h.term.mood }; };
  const good = run(3); const bad = run(-3);
  assert.ok(good.d > bad.d);
  assert.ok(good.mood > bad.mood);
});

test('Koalitionsbildung: Sondierung mit roter Linie, Tauschgeschäft, Mitgliedervotum und Kanzlerwahl (Art. 63 GG)', () => {
  for (let seed = 1; seed <= 12; seed++) {
    const g = E.newGame('union', 'Test', seed);
    g.week = g.maxWeeks; g.duelDone = true;
    while (g.pendingEvent) E.resolveEvent(g, 0);
    g.nat.union += 8;
    E.endWeek(g);
    const r = g.result;
    if (!r.awaitingChoice) continue;
    const i = r.options.findIndex(o => o.members.length > 1 && !o.tolerated);
    if (i < 0) continue;
    E.chooseCoalition(g, i);
    const n = r.neg;
    assert.strictEqual(n.phase, 'sond');
    E.negotiate(g, 'rotelinie');
    assert.ok(n.red);
    // erstes Thema ist die rote Linie: nachgeben lässt sie fallen
    E.negotiate(g, seed % 2 ? 'tausch' : 'hart');
    if (seed % 2) { assert.ok(n.redBroken); assert.strictEqual(n.swap, 1); }
    let guard = 0;
    while (!n.done && guard++ < 40) E.negotiate(g, n.phase === 'topics' ? 'kompromiss' : n.phase === 'ratify' ? 'mitglieder' : n.phase === 'kanzler2' ? 'einschwoeren' : 'x');
    assert.ok(n.done);
    if (n.success) {
      assert.ok(n.ratify && n.ratify.kind === 'mitglieder' && n.ratify.yes >= 50);
      assert.ok(n.kanzler && n.kanzler.length >= 1);
      assert.ok(n.kanzler[n.kanzler.length - 1].yes >= E.MAJORITY || n.weak);
    }
  }
});

test('Gegner mit Gesicht: Namen, Stil, Rivalität und Weitergabe an die nächste Legislatur', () => {
  const g = E.newGame('spd', 'Test', 7);
  assert.ok(g.rivals && !g.rivals.spd && g.rivals.union && g.rivals.union.name);
  assert.ok(g.rivals.union.name !== 'Test' && !/\d/.test(g.rivals.union.name));
  assert.ok(E.RIVAL_STYLES.some(s => s.id === g.rivals.union.style));
  assert.ok(E.rivalLabel(g, 'union').indexOf(g.rivals.union.name) === 0);
  // Angriff auf die Union erhöht die Rivalität
  g.week = 3;
  E.performAction(g, 'angriff', { rival: 'union', topic: 'wirtschaft' });
  assert.strictEqual(g.rivals.union.feud, 1);
  const el = electedGame('union', 4, 8);
  T.startTerm(el);
  T.autoNames(el);
  const t = el.term;
  const partner = t.gov.find(p => p !== 'union');
  const names = Object.keys(el.rivals).map(p => el.rivals[p].name);
  assert.strictEqual(new Set(names).size, names.length);
  for (let i = 0; i < 16 && !t.over; i++) { while (t.pending.length) T.resolvePending(el, 0); T.endQuarter(el); }
  const next = T.nextCampaign(el);
  assert.ok(next.carry.rivals && next.carry.rivals[partner]);
  const g2 = E.newGame('union', next.candidate, 9, undefined, next.carry);
  assert.ok(g2.rivals[partner].name === next.carry.rivals[partner].name);
});

test('Landtagswahlen: Wahlkampfentscheidung, gebündelter Wahlabend, Koalitionsgespräche im Land', () => {
  const g = electedGame('union', 4, 8);
  T.startTerm(g);
  T.autoNames(g);
  const t = g.term;
  let camp = 0; let night = 0; let koa = 0; let multi = false;
  for (let i = 0; i < 16 && !t.over; i++) {
    while (t.pending.length) {
      const it = t.pending[0];
      if (it.type === 'ltwcamp') camp += 1;
      if (it.type === 'info' && it.kind === 'ltwabend') { night += 1; if (it.entries.length > 1) multi = true; }
      if (it.type === 'landkoa') {
        koa += 1;
        const r = T.resolvePending(g, 0);
        assert.ok(/Bundesrat/.test(r.text));
        assert.deepStrictEqual(t.laender[it.land].gov, it.options[0]);
        continue;
      }
      assert.ok(!(it.type === 'info' && it.kind === 'ltw'));
      T.resolvePending(g, it.type === 'ltwcamp' ? 1 : 0);
    }
    T.endQuarter(g);
  }
  assert.ok(camp > 0 && night > 0 && koa > 0, camp + '/' + night + '/' + koa);
  assert.ok(multi);
});

test('Haushaltsverfahren, Regierungsbefragung, Rückblicke und Ereignis-Varianten', () => {
  const g = electedGame('union', 4, 8);
  T.startTerm(g);
  T.autoNames(g);
  const t = g.term;
  const seen = {};
  for (let i = 0; i < 16 && !t.over; i++) {
    while (t.pending.length) {
      const it = t.pending[0];
      seen[it.type] = (seen[it.type] || 0) + 1;
      if (it.type === 'event') {
        const ev = T.eventById(it.id);
        const txt = T.fillText(g, it, ev.title + ' ' + ev.text);
        assert.ok(!/\{(firma|stadt|person|land|landName|partner|topic)\}/.test(txt), txt);
      }
      T.resolvePending(g, it.type === 'eckwerte' ? 2 : 0);
    }
    T.endQuarter(g);
  }
  assert.ok(seen.kbefragung >= 3, JSON.stringify(seen));
  assert.ok(seen.bereinigung >= 2, JSON.stringify(seen));
  assert.ok((t.memory || []).length > 0);
  assert.ok(T.needsNames(g) === false);
});

test('Spielstand im Konto: große Stände in Stücken, unvollständige werden verworfen', async () => {
  const C = require('../js/cloud.js');
  const store = {};
  const ref = p => ({ get: async () => ({ exists: p in store, data: () => store[p] }), set: async d => { store[p] = JSON.parse(JSON.stringify(d)); } });
  C.claude = { use: async n => (n === 'db' ? { collection: c => ({ doc: id => ref(c + '/' + id) }) } : n === 'user' ? { id: async () => 'u7' } : null) };
  const cloud = C.BTW_CLOUD;
  assert.strictEqual((await cloud.init()).save, null);
  const big = 'x'.repeat(450000) + 'ENDE';
  cloud.push(big, 1000, 'Test');
  await new Promise(r => setTimeout(r, 1800));
  assert.strictEqual(store['data/users/u7/save'].n, 3);
  assert.ok(Object.values(store).every(d => JSON.stringify(d).length < 256 * 1024));
  const back = await cloud.init();
  assert.strictEqual(back.save.s, big);
  assert.strictEqual(back.save.at, 1000);
  store['data/users/u7/save-1'].at = 999; // halber Stand eines anderen Geräts
  assert.strictEqual((await cloud.init()).save, null);
});

test('Sonntagsfrage: unter 2 % zu „Sonstige“, ab 3,5 % wieder eigenständig – nur Ausgewiesene handeln', () => {
  const g = electedGame('union', 4, 8);
  T.startTerm(g);
  T.autoNames(g);
  const t = g.term;
  const api = E._api;
  // BSW künstlich unter 2 %, Freie Wähler über 3,5 %
  g.poll.nat.bsw = 1.6; g.poll.nat.fw = 4.2;
  const ch = api.updateMinorVisibility(g, true);
  assert.ok(ch.some(x => /unter „Sonstige“/.test(x)));
  assert.ok(!E.isShown(g, 'bsw'));
  assert.ok(E.isShown(g, 'fw'));
  assert.ok(E.isShown(g, 'union')); // eigene Partei immer
  const merged = E.mergeShares(g, g.poll.nat);
  assert.ok(!('bsw' in merged) && 'fw' in merged);
  // erst ab 3,5 % wieder ausgewiesen
  g.poll.nat.bsw = 3.0; api.updateMinorVisibility(g, true);
  assert.ok(!E.isShown(g, 'bsw'));
  g.poll.nat.bsw = 3.6; api.updateMinorVisibility(g, true);
  assert.ok(E.isShown(g, 'bsw'));
  // Ausgewiesene Kleinpartei handelt in der Legislatur
  g.shown.fw = true;
  const before = g.minor.fw.reg.BY || 0;
  while (t.pending.length) T.resolvePending(g, 0);
  T.endQuarter(g);
  assert.ok((g.minor.fw.reg.BY || 0) > before * 0.8 || t.news.some(n => /Freie Wähler/.test(n.text)));
});

test('Alter Spielstand: Partei unter 2 % wird schon beim Laden unter „Sonstige“ geführt', () => {
  const g = electedGame('union', 4, 8);
  T.startTerm(g);
  g.poll.nat.bsw = 1.8;
  delete g.folded;
  const back = E.deserialize(E.serialize(g));
  assert.ok(!E.isShown(back, 'bsw'));
  assert.ok(!('bsw' in E.mergeShares(back, back.poll.nat)));
});

test('Landesregierungen: Koalitionen aus 2–3 Parteien, Brandmauer wie im Bund, allein nur mit absoluter Mehrheit', () => {
  const g = electedGame('union', 4, 8);
  T.startTerm(g);
  const seatsOf = sh => { const ins = {}; Object.keys(sh).forEach(p => { if (sh[p] >= 5) ins[p] = sh[p]; }); const s = E.sainteLague(ins, 630); ['union', 'afd', 'spd', 'gruene', 'linke', 'bsw', 'fdp', 'fw'].forEach(p => { if (!(p in s)) s[p] = 0; }); return s; };
  const sum = (s, m) => m.reduce((a, p) => a + s[p], 0);
  // Brandenburg-ähnlich: ohne AfD keine Mehrheit aus höchstens drei Parteien → Minderheitskoalition, nicht eine Partei allein
  const bb = seatsOf({ afd: 37.3, union: 18.7, spd: 12.7, linke: 13, gruene: 6.6, bsw: 6.1, fdp: 1.3 });
  const govBB = T.landGovernment(g, bb, 'BB', ['spd', 'bsw']);
  assert.ok(govBB.length >= 2 && govBB.length <= 3, govBB.join());
  assert.ok(govBB.indexOf('afd') === -1);
  assert.ok(!(govBB.indexOf('union') !== -1 && govBB.indexOf('linke') !== -1));
  // Mehrheit möglich → Mehrheitskoalition
  const nw = seatsOf({ union: 30.6, afd: 21.5, spd: 13, gruene: 14.5, linke: 10.3, fdp: 2.9 });
  const govNW = T.landGovernment(g, nw, 'NW', ['union', 'gruene']);
  assert.ok(govNW.length >= 2 && govNW.length <= 3 && sum(nw, govNW) >= E.MAJORITY && govNW.indexOf('afd') === -1, govNW.join());
  assert.strictEqual(govNW[0], 'union');
  // Absolute Mehrheit der Sitze → allein
  const by = seatsOf({ union: 48, afd: 20, gruene: 12, spd: 8, fw: 4 });
  assert.deepStrictEqual(T.landGovernment(g, by, 'BY', ['union', 'fw']), ['union']);
});

test('Abstimmungen: Protokolle für die Live-Auszählung, Länderaufruf, Archiv und Schlussdebatte', () => {
  const g = electedGame('union', 4, 8);
  T.startTerm(g);
  T.autoNames(g);
  const t = g.term;
  let sawBt = false; let sawBr = false; let sawDebate = false;
  for (let i = 0; i < 8 && !t.over; i++) {
    while (t.pending.length) { if (t.pending[0].type === 'debatte') sawDebate = true; T.resolvePending(g, 0); }
    if (T.canAct(g, 'gesetz').ok) { const o = T.lawOptions(g); const tp = o.topics.find(x => x.contract !== undefined && x.contract !== x.current) || o.topics[0]; if (tp) T.performAction(g, 'gesetz', { topic: tp.topic, opt: tp.contract !== undefined ? tp.contract : tp.opts[0] }); }
    while (t.pending.length) { if (t.pending[0].type === 'debatte') sawDebate = true; T.resolvePending(g, 0); }
    T.endQuarter(g);
    (t.reel || []).forEach(r => {
      if (r.kind === 'bt') { sawBt = true; assert.ok(['hand', 'namentlich', 'hammel'].includes(r.method)); assert.ok(r.yes + r.no + r.abst > 300); }
      if (r.kind === 'br') { sawBr = true; assert.strictEqual(r.votes.length, 16); assert.strictEqual(r.votes.reduce((s, x) => s + x.votes, 0), 69); assert.strictEqual(r.votes[0].land, 'BW'); }
    });
  }
  assert.ok(sawBt && sawBr && sawDebate, sawBt + '/' + sawBr + '/' + sawDebate);
  assert.ok((t.voteLog || []).length > 0 && t.voteLog.filter(x => !x.gewissen).every(x => x.my === 'ja'));
});

test('Gewissensentscheidung und Optionen der Opposition (Änderungsantrag, Zugeständnis, namentlich)', () => {
  const g = electedGame('union', 4, 8);
  T.startTerm(g);
  T.autoNames(g);
  const t = g.term;
  while (t.pending.length) T.resolvePending(g, 0);
  t.pending.unshift({ type: 'gewissen', id: 'organspende' });
  const r = T.resolvePending(g, 0);
  assert.ok(r.reel && r.reel.gewissen && r.reel.method === 'namentlich');
  assert.ok(/Ja|Nein/.test(r.text));
  // Opposition: Linke stimmt über ein Regierungsgesetz ab
  const o = electedGame('linke', 4, 0);
  T.startTerm(o);
  const to = o.term;
  for (let i = 0; i < 8 && !to.pending.some(p => p.type === 'vote' && !p.budget); i++) { while (to.pending.length) T.resolvePending(o, 1); T.endQuarter(o); }
  const k = to.pending.findIndex(p => p.type === 'vote' && !p.budget);
  if (k >= 0) {
    const item = to.pending.splice(k, 1)[0];
    to.pending.unshift(item);
    const res = T.resolvePending(o, 3);
    assert.ok(/Änderungsantrag/.test(res.text));
    assert.ok(['ja', 'nein', 'enthaltung'].includes(to.voteChoice[item.law]));
  }
});

test('Gescheiterter Haushalt: neue Anläufe mit Verhandlungen statt immer gleichem Ergebnis', () => {
  const g = electedGame('linke', 4, 0);
  T.startTerm(g);
  const t = g.term;
  while (t.pending.length) T.resolvePending(g, 1);
  // Minderheitsregierung ohne Tolerierung: Der Haushalt scheitert zunächst
  t.gov = [t.chanc]; t.tolerated = false;
  const results = [];
  let againSeen = false;
  for (let i = 0; i < 8 && !t.over; i++) {
    if (!t.budget.draft) t.budget.draft = { year: 2031, plan: Object.assign({}, t.budget.plan), notlage: false, done: true };
    t.budget.draft.done = true;
    if (i > 0 && t.budget.status === 'ok' && t.budget.vote && t.budget.vote.pass) break;
    t.budget.status = 'vorlaeufig';
    while (t.pending.length) { const it = t.pending[0]; if (it.type === 'vote' && it.budget && it.again) againSeen = true; T.resolvePending(g, it.type === 'vote' ? 1 : 0); }
    T.endQuarter(g);
    if (t.budget.vote) results.push(t.budget.vote.yes + ':' + t.budget.vote.no + (t.budget.vote.pass ? '✓' : '✗'));
  }
  assert.ok(againSeen, 'Bei jedem Anlauf wird neu abgestimmt');
  assert.ok(t.over || new Set(results).size > 1 || results.some(r => r.endsWith('✓')), results.join(' '));
});

test('Wahlkampfkalender: feste Termine kommen zusätzlich zum Ereignis der Woche', () => {
  const g = E.newGame('spd', 'T', 11);
  const seen = [];
  while (g.week < 6) {
    E.endWeek(g);
    const week = [];
    while (g.pendingEvent) { week.push(g.pendingEvent); E.resolveEvent(g, 0); }
    seen.push(week);
  }
  // Woche 2: Plakate, Woche 3: Parteitag, Woche 4: Wahlarena, Woche 5: Briefwahl, Woche 6: Wahl-O-Mat
  assert.deepStrictEqual(seen.map(w => w[0]), ['ms_plakate', 'ms_parteitag', 'ms_wahlarena', 'ms_briefwahl', 'ms_wahlomat']);
  assert.ok(seen.every(w => w.length === 2 && !/^ms_/.test(w[1])), JSON.stringify(seen));
  assert.ok(g.postalPush.spd > 0, 'Der Briefwahl-Aufruf wirkt');
});

test('Parteileben: Machtkampf kann Partei und Kanzleramt übergeben, Parteitag wählt mit Prozentergebnis', () => {
  const g = electedGame('union', 4, 8);
  T.startTerm(g);
  T.autoNames(g);
  const t = g.term;
  while (t.pending.length) T.resolvePending(g, 0);
  // Machtkampf: Rücktritt der Spitze – die Nachfolge übernimmt auch das Kanzleramt
  t.pending.push({ type: 'machtkampf', name: 'Nora Neumann', from: 'Land' });
  const res = T.resolvePending(g, 2);
  assert.ok(res.ok && /Nora Neumann/.test(res.text));
  assert.strictEqual(t.party.leader.name, 'Nora Neumann');
  assert.strictEqual(t.chancellor.name, 'Nora Neumann');
  // Ordentlicher Parteitag: Ergebnis in Prozent, gespeichert in der Laufbahn
  t.pending.push({ type: 'parteitag_o' });
  T.resolvePending(g, 1);
  assert.ok(t.party.lastVote.pct >= 41 && t.party.lastVote.pct <= 98.5);
  // Flügelstreit: Entgegenkommen beruhigt den einen Flügel, der andere murrt
  const w = t.party.wings.slice();
  t.pending.push({ type: 'fluegel', wing: 1 });
  T.resolvePending(g, 0);
  assert.ok(t.party.wings[1] > w[1] && t.party.wings[0] < w[0]);
});

test('Megatrends und Medien: Themengewichte verschieben sich über Jahrzehnte, Interviews prägen die Presse', () => {
  const b0 = E.salienceBase(2029);
  const b1 = E.salienceBase(2045);
  assert.ok(Math.abs(Object.values(b1).reduce((s, x) => s + x, 0) - 1) < 1e-9);
  assert.ok(Math.abs(b0.wirtschaft - 0.14) < 1e-9, 'Im ersten Spiel gelten die heutigen Gewichte');
  assert.ok(b1.digitales > b0.digitales && b1.gesundheit > b0.gesundheit && b1.wirtschaft < b0.wirtschaft);
  const g = electedGame('union', 4, 8);
  T.startTerm(g);
  T.autoNames(g);
  const t = g.term;
  while (t.pending.length) T.resolvePending(g, 0);
  const before = T.media(g).leit;
  const res = T.performAction(g, 'interview', 'leit');
  assert.ok(res.ok, res.text);
  assert.ok(T.media(g).leit > before);
  T.endQuarter(g);
  assert.ok(t.news.some(n => /Presseschau/.test(n.text)));
});

// Ein Wahlergebnis ohne jede Koalitionsmehrheit herstellen (Sitze gesetzt, Koalitionen neu berechnet).
function hungGame(party, seats, seed) {
  const g = E.newGame(party, 'Test', seed || 5);
  g.week = g.maxWeeks; g.duelDone = true;
  while (g.pendingEvent) E.resolveEvent(g, 0);
  E.endWeek(g);
  const r = g.result;
  delete r.neg; delete r.outcome; r.government = null;
  Object.keys(r.seats).forEach(p => { r.seats[p] = seats[p] || 0; });
  r.coalitions = []; r.options = [];
  E.startHung(g);
  return g;
}
const HUNG = { union: 180, afd: 170, spd: 110, gruene: 70, linke: 50, bsw: 30, fdp: 20 };
// Union und SPD kommen zusammen auf 320 Sitze – die Duldung bringt die Kanzlermehrheit.
const HUNG2 = { union: 200, afd: 150, spd: 120, gruene: 60, linke: 50, bsw: 30, fdp: 20 };

test('Ohne Mehrheit: Kanzlerwahl in drei Phasen, ohne Kanzlermehrheit löst der Bundespräsident auf', () => {
  const g = hungGame('union', HUNG);
  const h = g.result.hung;
  assert.strictEqual(h.lead, 'union');
  assert.strictEqual(h.step, 'strategy');
  assert.ok(h.tolerators.indexOf('linke') === -1, 'Union und Linke sind unvereinbar');
  E.hungChoice(g, 'minderheit');
  assert.ok(h.done && g.phase === 'done');
  assert.strictEqual(h.votes.length, 2);
  assert.ok(h.phase3 && h.log.some(x => /3\. Wahlphase/.test(x)));
  assert.ok(g.result.neuwahl);
  const next = E.neuwahlCampaign(g);
  assert.ok(next && next.carry.neuwahl && next.carry.year === (g.year || 2029));
  const g2 = E.newGame('union', 'Test', 9, next.program, next.carry);
  assert.ok(g2.neuwahl && g2.log.some(x => /Neuwahl/.test(x.text)));
});

test('Ohne Mehrheit: Die Duldung durch die SPD ergibt eine Minderheitsregierung mit Zugeständnis', () => {
  let ok = null;
  for (let seed = 1; seed < 20 && !ok; seed++) {
    const g = hungGame('union', HUNG2, seed);
    E.hungChoice(g, 'duldung', 'spd');
    if (g.result.hung.duldung === 'spd') ok = g;
  }
  assert.ok(ok, 'Duldung kommt zustande');
  const r = ok.result;
  assert.deepStrictEqual(r.government, ['union']);
  assert.ok(!r.neuwahl, 'Mit Kanzlermehrheit wird ernannt');
  assert.ok(r.hung.concession);
  T.startTerm(ok);
  const t = ok.term;
  assert.strictEqual(t.duldung, 'spd');
  assert.ok(t.tolerated);
  assert.ok(t.laws.some(l => l.duldung && l.topic === r.hung.concession.topic));
});

test('Ohne Mehrheit: Die Wahlsiegerin bittet euch um eine Duldung', () => {
  const g = hungGame('spd', HUNG2);
  const h = g.result.hung;
  if (h.step === 'ask') {
    E.hungChoice(g, 'dulden');
    assert.strictEqual(h.duldung, 'spd');
    assert.ok(h.done);
    T.startTerm(g);
    assert.strictEqual(g.term.role, 'opposition');
    assert.strictEqual(g.term.duldung, 'spd');
  } else assert.ok(h.done); // die Union hat zuerst eine andere Partei gefragt
});

test('Ohne Mehrheit: Auch mit Duldung löst der Bundespräsident auf, wenn die Kanzlermehrheit fehlt', () => {
  let g = null;
  for (let seed = 1; seed < 20 && !g; seed++) {
    const h = hungGame('union', HUNG, seed);
    E.hungChoice(h, 'duldung', 'spd');
    if (h.result.hung.duldung === 'spd') g = h;
  }
  assert.ok(g, 'Duldung kommt zustande');
  assert.ok(g.result.hung.done && g.result.neuwahl, '290 Stimmen reichen nicht: Neuwahl');
  assert.strictEqual(g.result.government, null);
});

test('Kleinparteien sind voll im Spiel: Spitzenkandidatur, Wanderung, Gruppen, Angriff und eigener Wahlkampf', () => {
  const g = E.newGame('spd', 'Test', 1);
  E.MINOR_IDS.forEach(m => {
    const P = E.party(m);
    assert.ok(P.competence && P.lean && P.budget && P.goalText, m + ': Stammdaten');
    assert.ok(g.rivals[m] && g.rivals[m].name, m + ': Spitzenkandidatur');
  });
  // Ausweisung erzwingen (wie nach einem Umfragehoch)
  g.minor.volt.trend = 3;
  E._api.takePoll(g);
  E._api.updateMinorVisibility(g, true);
  assert.ok(E.isShown(g, 'volt'));
  // Gegenangriff auf Volt wirkt auf Volt
  const before = E.nationalShares(g).volt;
  g.ap = 3; g.team = g.teamMax;
  const res = E.performAction(g, 'angriff', { rival: 'volt', topic: 'europa' });
  assert.ok(res.ok, res.text);
  assert.notStrictEqual(E.nationalShares(g).volt, before);
  // Wählergruppen: Volt ist bei Jungen deutlich stärker als bei Älteren
  assert.ok(E.groupShares(g, 'jung').volt > 2 * E.groupShares(g, 'aelter').volt);
  // Wanderung: Wer bei Volt zulegt, holt Stimmen vor allem von den Grünen
  g.nat.volt += 2;
  const net = E.flowSummary(g, 'volt');
  assert.ok(net.gruene > 0 && net.gruene >= net.union);
  // Eigener Wahlkampf im KI-Zug
  for (let w = 0; w < 3; w++) { while (g.pendingEvent) E.resolveEvent(g, 0); E.endWeek(g); }
  assert.ok(g.log.some(l => /Volt/.test(l.text)), 'Volt taucht in den Meldungen auf');
});

test('Alte Spielstände: Sonderbonus der Kleinparteien wird übernommen, die Umfrage bleibt gleich', () => {
  const g = E.newGame('union', 'Test', 2);
  const s = JSON.parse(E.serialize(g));
  // Format vor der Integration: Kleinparteien nur in g.minor
  E.MINOR_IDS.forEach(m => { delete s.nat[m]; delete s.mob[m]; Object.keys(s.reg).forEach(st => { delete s.reg[st][m]; }); Object.keys(s.grp).forEach(k => { delete s.grp[k][m]; }); });
  s.minor.fw.nat = 0.6;
  s.minor.fw.reg = { BY: 1.2 };
  const h = E.deserialize(JSON.stringify(s));
  assert.ok(Math.abs(h.nat.fw - 0.6) < 1e-9 && Math.abs(h.reg.BY.fw - 1.2) < 1e-9);
  assert.strictEqual(h.minor.fw.nat, 0);
  assert.ok(E.nationalShares(h).fw > E.nationalShares(g).fw);
});

test('Offene Abstimmungen: Prognose ist eine Spanne, das Plenum entscheidet unterschiedlich', () => {
  const g = electedGame('union', 4, 8);
  T.startTerm(g);
  T.autoNames(g);
  const t = g.term;
  while (t.pending.length) T.resolvePending(g, 0);
  const o = T.lawOptions(g);
  const tp = o.topics.find(x => x.contract !== undefined && x.contract !== x.current) || o.topics[0];
  T.performAction(g, 'gesetz', { topic: tp.topic, opt: tp.contract !== undefined ? tp.contract : 0, fraktion: true });
  t.pending = [];
  const law = t.laws[t.laws.length - 1];
  const rng = g.rng;
  const f = T.forecast(g, law);
  assert.strictEqual(g.rng, rng, 'Die Prognose verändert den Spielzufall nicht');
  assert.ok(f.yesLo <= f.yesHi && f.chance >= 0 && f.chance <= 1);
  const results = new Set();
  for (let i = 0; i < 6; i++) {
    const h = E.deserialize(E.serialize(g));
    h.rng = (h.rng + i * 7777) | 0;
    T.endQuarter(h);
    const L = h.term.laws.find(l => l.id === law.id);
    if (L.bt) { results.add(L.bt.yes + ':' + L.bt.no); assert.ok(L.bt.absent > 0, 'Es fehlen immer einige Abgeordnete'); }
  }
  assert.ok(results.size >= 3, 'Gleiche Abstimmung, verschiedene Ergebnisse: ' + Array.from(results).join(' '));
});

test('Lage im Land: Gesetze verändern Indikatoren mit Verzögerung, die Probleme der Menschen verschieben sich', () => {
  const g = electedGame('union', 4, 8);
  T.startTerm(g);
  T.autoNames(g);
  const t = g.term;
  while (t.pending.length) T.resolvePending(g, 0);
  assert.strictEqual(T.lageBilanz(g).length, 16);
  // Ein „Bauen, bauen, bauen“-Gesetz tritt in Kraft: Der Neubau zieht erst nach und nach an.
  const h = E.deserialize(E.serialize(g));
  h.term.policy.wohnen = D.PROGRAM.wohnen.findIndex(o => o.lean === 1);
  h.term.policyQ = { wohnen: h.term.q };
  const fx = T.lawEffects(g, 'wohnen', D.PROGRAM.wohnen.findIndex(o => o.lean === 1));
  assert.ok(fx.some(f => f.id === 'wohnen' && f.good && f.up));
  const w0 = h.term.lage.wohnen;
  const base0 = g.term.lage.wohnen;
  for (let q = 0; q < 6; q++) { while (h.term.pending.length) T.resolvePending(h, 0); T.endQuarter(h); while (g.term.pending.length) T.resolvePending(g, 0); T.endQuarter(g); }
  assert.ok(h.term.lage.wohnen - w0 > g.term.lage.wohnen - base0 + 10, 'Mehr Neubau als ohne Gesetz');
  // Wird es schlechter, wird das Thema wichtiger.
  const k = E.deserialize(E.serialize(g));
  k.term.lage.migration = 600;
  const before = k.salience.migration;
  for (let q = 0; q < 3; q++) { while (k.term.pending.length) T.resolvePending(k, 0); T.endQuarter(k); }
  assert.ok(k.salience.migration > before, 'Mehr Asylanträge machen Migration wichtiger');
});
