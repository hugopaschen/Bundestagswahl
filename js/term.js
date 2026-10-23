/*
 * Legislaturperiode: Nach der Wahl regiert ihr vier Jahre (16 Quartale) – als Kanzlerpartei, als
 * Juniorpartner, in der Opposition oder außerhalb des Bundestags. Ohne DOM, mit Node testbar.
 */
(function (root) {
  const node = typeof module !== 'undefined' && module.exports;
  const D = node ? require('./data.js') : root.BTW_DATA;
  const E = node ? require('./engine.js') : root.BTW_ENGINE;
  const TD = node ? require('./termdata.js') : root.BTW_TERMDATA;
  const LB = node ? require('./lobby.js') : root.BTW_LOBBY;
  const A = E._api;

  const QUARTERS = 16;
  const FIRST_YEAR = 2029;   // die Wahl im Spiel ist die Bundestagswahl 2029
  const NAT_DECAY = 0.88;    // Umfrage-Effekte verblassen pro Quartal
  const ACT_K = 0.6;
  const SQ0 = 60;            // Rückhalt des Status quo zu Beginn (0–100)         // Stärke der eigenen Aktionen auf die Umfragen
  const SEATS = D.SEATS;
  const MAJ = E.MAJORITY;
  const PIDS = E.CONTEST_IDS; // alle Parteien einschließlich der Kleinparteien
  const MINOR = A.MINOR_IDS;
  const CONTEST = E.CONTEST_IDS;
  const OTHER = D.OTHER.id;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r1 = x => Math.round(x * 10) / 10 + 0;
  const r2 = x => Math.round(x * 100) / 100 + 0;
  const num1 = x => (Math.round(x * 10) / 10).toFixed(1).replace('.', ','); // deutsche Schreibweise für Meldungen
  const f1 = x => (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');
  const party = E.party;
  const sname = p => (p === OTHER ? 'Sonstige' : party(p) ? party(p).short : p);
  const isGov = role => role === 'kanzler' || role === 'junior';
  const ministryById = id => TD.MINISTRIES.find(m => m.id === id);
  const taxById = id => TD.TAXES.find(x => x.id === id);
  const areaById = id => TD.AREAS.find(a => a.id === id);
  const eventById = id => TD.EVENTS.find(e => e.id === id);
  const rand = g => A.rand(g);
  const between = (g, a, b) => A.between(g, a, b);
  const pick = (g, arr) => A.pick(g, arr);
  const copy = o => JSON.parse(JSON.stringify(o));

  // ---------- Kalender ----------
  // Absolute Quartalszählung (Jahr × 4 + Quartal − 1). Quartal 0 der Legislatur ist das Quartal nach der
  // Wahl; nach einer regulären Wahl im Februar/März also das 2. Quartal des Wahljahres.
  const absCal = idx => ({ year: Math.floor(idx / 4), qn: idx % 4 + 1, abs: idx });
  function cal(t, q) {
    return absCal(t.abs0 + Math.min(QUARTERS - 1, q === undefined ? t.q : q));
  }
  function ltwDueAbs(idx) {
    const c = absCal(idx);
    return Object.keys(TD.LTW).filter(l => dueIn(TD.LTW[l], c));
  }
  // Quartale als Kalenderzeit: „Apr.–Juni 2030“, mit erstem und letztem Tag.
  function quarterLabel(t, q) { const c = cal(t, q); return E.MONTHS_S[(c.qn - 1) * 3] + '–' + E.MONTHS_S[(c.qn - 1) * 3 + 2] + ' ' + c.year; }
  function quarterStart(t, q) { const c = cal(t, q); return E.dayUTC(c.year, (c.qn - 1) * 3 + 1, 1); }
  function quarterEnd(t, q) { const c = cal(t, q); return E.dayUTC(c.year, c.qn * 3 + 1, 0); }
  // Sitzungstage im Quartal: letzte Sitzungswoche des Bundestages (Donnerstag) bzw. letzte Plenarsitzung des Bundesrates (Freitag).
  function plenaryDate(t, q, house) {
    const c = cal(t, q);
    const kws = house === 'br' ? D.BUNDESRAT_KW : D.SITZUNGSWOCHEN;
    const inQ = kws.map(kw => E.addDays(E.isoMonday(c.year, kw), house === 'br' ? 4 : 3)).filter(d => Math.floor(d.getUTCMonth() / 3) + 1 === c.qn);
    return inQ.length ? inQ[inQ.length - 1] : quarterEnd(t, q);
  }
  function plenaryLabel(t, q, house) { return E.fmtDate(plenaryDate(t, q === undefined ? t.q : Math.min(q, QUARTERS - 1), house)); }
  // Nächste Sitzungswoche ab einem Datum (Montag bis Freitag).
  function nextSession(t) {
    const now = quarterStart(t, t.q);
    for (let y = now.getUTCFullYear(); y <= now.getUTCFullYear() + 1; y++) {
      const m = D.SITZUNGSWOCHEN.map(kw => E.isoMonday(y, kw)).find(d => d >= now);
      if (m) return { from: m, to: E.addDays(m, 4) };
    }
    return null;
  }
  // Wahltermin im Monat einer Wahl: zweiter Sonntag (geschätzt; die Länder legen ihn jeweils fest).
  function secondSunday(y, m) { const d = E.dayUTC(y, m, 1); return E.addDays(d, (7 - d.getUTCDay()) % 7 + 7); }
  function dueIn(spec, c) {
    const y0 = spec[0]; const m = spec[1]; const per = spec[2];
    if (c.year < y0 || (c.year - y0) % per !== 0) return false;
    return Math.floor((m - 1) / 3) + 1 === c.qn;
  }
  function ltwDue(t, q) {
    const c = cal(t, q);
    return Object.keys(TD.LTW).filter(l => dueIn(TD.LTW[l], c));
  }
  // Kommende Wahltermine für die Übersicht.
  function calendar(g, n) {
    const t = g.term;
    const out = [];
    const day = (y, m) => E.fmtDate(secondSunday(y, m), 'day');
    for (let q = t.q; q < QUARTERS && out.length < (n || 6); q++) {
      const c = cal(t, q);
      ltwDue(t, q).forEach(l => out.push({ q, at: secondSunday(c.year, TD.LTW[l][1]), label: day(c.year, TD.LTW[l][1]), kind: 'ltw', land: l, text: 'Landtagswahl ' + E.stateById(l).name }));
      if (dueIn(TD.EUROPAWAHL, c)) out.push({ q, at: secondSunday(c.year, TD.EUROPAWAHL[1]), label: day(c.year, TD.EUROPAWAHL[1]), kind: 'ew', text: 'Europawahl' });
      if (dueIn(TD.BUNDESVERSAMMLUNG, c)) out.push({ q, at: secondSunday(c.year, TD.BUNDESVERSAMMLUNG[1]), label: day(c.year, TD.BUNDESVERSAMMLUNG[1]), kind: 'bv', text: 'Bundesversammlung' });
      if (c.qn === 3 && q < QUARTERS - 1) out.push({ q, at: E.dayUTC(c.year, 7, 1), label: 'Juli ' + c.year, kind: 'haushalt', text: 'Kabinett beschließt den Regierungsentwurf ' + (c.year + 1) });
    }
    out.sort((x, y) => x.at - y.at);
    const last = cal(t, QUARTERS - 1);
    out.push({ q: QUARTERS, label: E.fmtDate(E.lastSunday(last.year, (last.qn - 1) * 3 + 2), 'day'), kind: 'btw', text: 'Bundestagswahl ' + last.year });
    return out;
  }

  // ---------- Positionen ----------
  function leanOf(g, p, topic) {
    if (p === g.party && g.program && D.PROGRAM[topic][g.program.positions[topic]]) return D.PROGRAM[topic][g.program.positions[topic]].lean;
    const P = party(p);
    return P && P.lean ? P.lean[topic] : 0;
  }
  const optIndex = (topic, lean) => Math.max(0, D.PROGRAM[topic].findIndex(o => o.lean === lean));
  const lawTopic = law => (law.kind === 'tax' ? 'finanzen' : law.topic);
  // ---------- Steuern stufenlos ----------
  // Einnahmen mit Laffer-Kurve: R(v) = k·v·(1 − v/100)^ε mit Maximum bei peak, geeicht auf revPer bei base.
  function taxRevAt(x, v) {
    const d = v - x.base;
    if (x.klimageld && d > 0) return 0; // Mehreinnahmen fließen als Klimageld zurück
    if (!x.peak) return x.revPer * d;
    const eps = 100 / x.peak - 1;
    const f = u => u * Math.pow(Math.max(0, 1 - u / 100), eps);
    const fp = u => Math.pow(Math.max(1e-9, 1 - u / 100), eps) - u * eps / 100 * Math.pow(Math.max(1e-9, 1 - u / 100), eps - 1);
    return x.revPer / fp(x.base) * (f(v) - f(x.base));
  }
  // Wachstum: Unter der globalen Mindeststeuer (15 %) sparen Unternehmen nichts – andere Staaten erheben die Differenz.
  function taxGrowthAt(x, v) {
    const eff = x.minTax !== undefined ? Math.max(v, x.minTax) : v;
    let gr = (x.growthPer || 0) * (eff - x.base);
    if (x.peak && eff > x.peak) gr -= 0.01 * (eff - x.peak); // Ausweichen und Abwanderung
    return clamp(gr, -2, 1.5);
  }
  const taxInflAt = (x, v) => clamp((x.inflPer || 0) * (v - x.base), -3, 8);
  function fmtTax(x, v) {
    const n = Math.round(v * 100) / 100;
    const num = x.unit === '€' ? (n > 0 ? '+' : '') + n.toLocaleString('de-DE') : String(n).replace('.', ',');
    return num + ' ' + x.unit;
  }
  const taxShock = law => (law.kind === 'tax' ? Math.abs(law.level - law.from) / taxById(law.tax).scale : 0);
  // Alte Spielstände: Stufen-Indizes in Werte umrechnen (einmalig).
  function upgradeTaxes(t) {
    if (!t || t.taxModel === 2) return;
    const val = (x, i) => (i === undefined ? x.start : x.legacy[i] !== undefined ? x.legacy[i] : x.start);
    TD.TAXES.forEach(x => { t.taxes[x.id] = val(x, t.taxes[x.id]); });
    (t.laws || []).filter(l => l.kind === 'tax').forEach(l => { const x = taxById(l.tax); if (!x) return; l.level = val(x, l.level); if (l.from !== undefined) l.from = val(x, l.from); });
    Object.keys(t.statutes || {}).forEach(k => { if (k.indexOf('tax:') === 0) { const x = taxById(k.slice(4)); if (x) t.statutes[k].v = val(x, t.statutes[k].v); } });
    t.taxModel = 2;
  }
  // Lager eines Steuergesetzes: Richtung der Änderung (Erhöhung/Senkung).
  const lawLean = law => (law.kind === 'tax' ? (taxById(law.tax).leanUp || 0) * Math.sign(law.level - (law.from === undefined ? law.level : law.from)) : D.PROGRAM[law.topic][law.opt].lean);
  // Abstand einer Partei zu einem Gesetz (0–2); große Steuersprünge (über drei übliche Schritte) gelten als eine Stufe weiter weg.
  const lawDist = (g, p, law) => Math.min(2, Math.abs(leanOf(g, p, lawTopic(law)) - lawLean(law)) + (taxShock(law) >= 3 ? 1 : 0));
  function lawName(law) {
    if (law.kind === 'tax') { const x = taxById(law.tax); return x.name + ' ' + (law.from !== undefined && law.from !== law.level ? 'von ' + fmtTax(x, law.from) + ' auf ' : 'auf ') + fmtTax(x, law.level); }
    return D.PROGRAM[law.topic][law.opt].label;
  }
  function lawTitle(law) {
    if (law.kind === 'tax') return taxById(law.tax).icon + ' ' + lawName(law);
    return E.topicById(law.topic).icon + ' ' + lawName(law);
  }

  // ---------- Hilfsfunktionen ----------
  function news(g, text, kind) {
    const t = g.term;
    t.news.unshift({ q: t.q, text, kind: kind || 'info' });
    if (t.news.length > 150) t.news.length = 150;
  }
  const scenarioOf = g => (g.scenario && (D.START_SCENARIOS || []).find(x => x.id === g.scenario)) || {};
  // Chronik der Legislatur: Entscheidungen und ihre Folgen, Gesetze, Wahlen, Haushalte, Personal.
  function chron(g, kind, text) {
    const t = g.term;
    (t.chron = t.chron || []).push({ q: t.q, kind, text });
  }
  // Jahreszeit eines Quartals (für Zitate und Rückblicke).
  function seasonLabel(t, q) { const c = cal(t, q); return ['Im Winter', 'Im Frühjahr', 'Im Sommer', 'Im Herbst'][c.qn - 1] + ' ' + c.year; }
  function shareOf(g, p) { return (g.term.lastNat && g.term.lastNat[p]) || 5; }
  // Umfragewirkung in Punkten, für kleine Parteien gedämpft (wie im Wahlkampf).
  // Woher die Bewegung in euren Umfragen kommt: Jede Wirkung wird einer Ursache zugeordnet (CAT).
  let CAT = 'sonst';
  const cat = c => { CAT = c; };
  function noteFx(g, c, v) {
    const t = g.term;
    if (!t || !v) return;
    t.pollFx = t.pollFx || {};
    t.pollFx[c] = (t.pollFx[c] || 0) + v;
  }
  // Wirkungsstufen nach der Realität: Routine verpufft schnell, Krisen und Dauerstreit wirken lange,
  // ein Hype (neue Spitze, virale Momente) ist ein Strohfeuer – außer Wahlerfolge bestätigen ihn.
  const DECAY = { fast: 0.55, norm: 0.85, slow: 0.94, hype: 0.6 };
  const CAT_TIER = { lobby: 'norm', aktion: 'fast', abstimmung: 'fast', partei: 'fast', glaubw: 'fast', skandal: 'slow', regierung: 'slow', krise: 'slow', streit: 'slow', hype: 'hype', viral: 'hype' };
  let TIER = null; // Stufe für die nächste Wirkung (überschreibt die Ursache)
  function bucket(g, tier, p) {
    const t = g.term;
    if (!t.bk) { t.bk = { fast: {}, norm: {}, slow: {}, hype: {} }; PIDS.forEach(q => { t.bk.norm[q] = g.nat[q] || 0; }); }
    return t.bk[tier];
  }
  function addNat(g, p, v) {
    if (!v) return;
    const d = v * A.sizeFactor(shareOf(g, p));
    if (PIDS.indexOf(p) !== -1) {
      g.nat[p] += d;
      // Krisen: Der Amtsbonus („rally round the flag“) verblasst, Versagen bleibt hängen (Corona-Hoch der Union 2020 war 2021 weg).
      let tier = TIER || CAT_TIER[CAT] || 'norm';
      if (CAT === 'krise' && d > 0 && tier === 'slow') tier = 'norm';
      if (CAT === 'krise' && d > 0 && tier === 'norm' && g.term && p === g.term.chanc) tier = 'fast'; // der Kanzlerbonus in der Krise verfliegt am schnellsten
      const b = bucket(g, tier, p);
      b[p] = (b[p] || 0) + d;
    } else return;
    if (p === g.party) noteFx(g, CAT, d);
  }
  // Wirkung in einer bestimmten Stufe.
  function addNatT(g, p, v, tier) { const old = TIER; TIER = tier; addNat(g, p, v); TIER = old; }
  // Verblassen je Stufe; g.nat ist die Summe aller Stufen.
  function decayNat(g) {
    const t = g.term;
    bucket(g, 'norm', g.party);
    const before = g.nat[g.party] || 0;
    // Ältere Spielstände: Parteien ohne Eintrag in den Stufen übernehmen ihren bisherigen Stand.
    PIDS.forEach(p => { if (!Object.keys(DECAY).some(k => p in t.bk[k])) t.bk.norm[p] = g.nat[p] || 0; });
    PIDS.forEach(p => {
      let sum = 0;
      Object.keys(DECAY).forEach(k => { t.bk[k][p] = (t.bk[k][p] || 0) * DECAY[k]; sum += t.bk[k][p]; });
      g.nat[p] = sum;
    });
    noteFx(g, 'verblassen', (g.nat[g.party] || 0) - before);
  }
  const FX_NAMES = { aktion: '🎯 Eure Aktionen', gesetz: '📜 Gesetze', parlament: '🏛️ Abstimmungen im Bundestag', haushalt: '🏦 Haushalt',
    karlsruhe: '⚖️ Karlsruhe', wahlen: '🗳️ Landtags- und Europawahlen', statusquo: '⚖️ Status quo', ereignis: '📰 Eure Reaktion auf Ereignisse',
    skandal: '🔥 Affären', abstimmung: '🗳️ Euer Abstimmungsverhalten', kabinett: '👥 Kabinett', regierung: '🏛️ Regierungsbilanz und Wirtschaft',
    partei: '🎪 Spitze und Geschlossenheit', glaubw: '🤝 Glaubwürdigkeit', krise: '🚨 Krisenmanagement', lobby: '🏛️ Verbände und Lobbyismus', streit: '💥 Streit in der Koalition', hype: '🔥 Medienpräsenz der Spitze', viral: '📱 Reichweite in sozialen Medien', medien: '🗞️ Medien', lage: '📊 Lage im Land', konkurrenz: '🥊 Konkurrenz', verblassen: '⏳ Frühere Effekte verblassen', sonst: 'Sonstiges' };
  // Glaubwürdigkeit (0–100): Wer seiner Linie treu bleibt, gewinnt Vertrauen; wer umfällt, verliert es.
  function addCred(g, v, why) {
    const t = g.term;
    t.cred = clamp((t.cred === undefined ? 55 : t.cred) + v, 0, 100);
    if (why) (t.credLog = t.credLog || []).unshift({ q: t.q, v, why });
    if (t.credLog && t.credLog.length > 30) t.credLog.length = 30;
  }
  // Wie weit eine Position von eurem Wahlprogramm entfernt ist (0, 1, 2).
  const progDist = (g, topic, lean) => Math.abs(leanOf(g, g.party, topic) - lean);
  function usesRecent(t, id) { return (t.usage[id] || []).filter(q => q >= t.q - 3).length; }
  function useFactor(t, id) { return 1 / (1 + 0.35 * usesRecent(t, id)); }
  function noteUse(t, id) { (t.usage[id] = t.usage[id] || []).push(t.q); }
  function ownMinistries(t, p) { return Object.keys(t.cabinet).filter(id => t.cabinet[id].party === p); }
  function govSeats(t) { return t.gov.reduce((s, p) => s + (t.seats[p] || 0), 0); }
  function moneyScale(g) { return party(g.party).budget / 15; }
  function cashCost(g, c) { return Math.round(c * moneyScale(g) * 100) / 100; }

  // Eindeutige neue Person (Namen werden nicht doppelt vergeben, auch nicht nach dem Laden).
  function newPerson(g, p, land, opts) {
    const t = g.term;
    const taken = new Set();
    if (t) {
      Object.keys(t.cabinet || {}).forEach(id => { const m = t.cabinet[id]; if (m.name) taken.add(m.name); (m.cands || []).forEach(c => taken.add(c.name)); });
      if (t.chancellor) taken.add(t.chancellor.name);
      (t.formerNames || []).forEach(n => taken.add(n));
      if (t.party && t.party.team) { taken.add(t.party.team.gs); taken.add(t.party.team.fv); }
    }
    // Meist kommen Ministerinnen und Minister aus der Fraktion: Direktkandidaturen der Partei, bevorzugt aus dem Land.
    const list = E.WK_LIST.filter(w => !land || w.land === land).concat(E.WK_LIST);
    const start = Math.floor(rand(g) * list.length);
    for (let i = 0; i < list.length; i++) {
      const w = list[(start + i) % list.length];
      const full = E.wkCandidate(g, w.nr, p);
      if (full && !/\d/.test(full) && !taken.has(full)) { taken.add(full); return { full, female: null }; }
    }
    let person = null;
    for (let i = 0; i < 8; i++) {
      person = A.newPerson(g, p, land, opts);
      person.full = person.full.replace(/\d+/g, '');
      if (!taken.has(person.full)) break;
    }
    return person;
  }
  function weightedLand(g) {
    const total = D.STATES.reduce((s, st) => s + st.voters, 0);
    let x = rand(g) * total;
    for (const st of D.STATES) { x -= st.voters; if (x <= 0) return st.id; }
    return 'NW';
  }

  // ---------- Kabinett ----------
  function rollMinister(g, p, kindId, land) {
    const k = TD.MINISTER_KINDS.find(x => x.id === kindId) || TD.MINISTER_KINDS[1];
    const l = land || (kindId === 'fuerst' ? bigLand(g, p) : weightedLand(g));
    const person = newPerson(g, p, l);
    return { name: person.full, female: !!person.female, kind: k.id, land: l,
      comp: Math.round(between(g, k.comp[0], k.comp[1])), loyal: Math.round(between(g, k.loyal[0], k.loyal[1])), risk: Math.round(between(g, k.risk[0], k.risk[1])) };
  }
  // Landesfürsten kommen aus Ländern, in denen die Partei stark ist.
  function bigLand(g, p) {
    const base = g.base || {};
    const list = D.STATES.map(st => ({ id: st.id, w: ((base[st.id] && base[st.id][p]) || 5) * Math.sqrt(st.voters) }));
    const total = list.reduce((s, x) => s + x.w, 0);
    let x = rand(g) * total;
    for (const it of list) { x -= it.w; if (x <= 0) return it.id; }
    return list[0].id;
  }
  function candidatesFor(g, p) {
    const kinds = TD.MINISTER_KINDS.map(k => k.id);
    const out = [];
    while (out.length < 3) {
      const k = kinds.splice(Math.floor(rand(g) * kinds.length), 1)[0];
      out.push(rollMinister(g, p, k));
    }
    return out;
  }
  function aiMinister(g, p) {
    const k = pick(g, ['fach', 'soldat', 'fuerst', 'soldat', 'quer']);
    const m = rollMinister(g, p, k);
    m.party = p;
    return m;
  }

  // Ressorts vergeben: aus den Koalitionsverhandlungen oder nach Sitzen mit den Wunschlisten.
  function draftMinistries(t) {
    const order = E.draftOrder(t.gov, t.chanc, t.seats);
    const picks = {};
    order.forEach(p => {
      const free = TD.MINISTRIES.filter(m => !picks[m.id]);
      const best = free.sort((a, b) => E.ministryWish(p, b.id) - E.ministryWish(p, a.id))[0];
      picks[best.id] = p;
    });
    return picks;
  }

  function setupCabinet(g, picks) {
    const t = g.term;
    const old = t.cabinet || {};
    t.cabinet = {};
    TD.MINISTRIES.forEach(m => {
      const p = picks[m.id];
      if (!p) return;
      if (old[m.id] && old[m.id].party === p && old[m.id].name) { t.cabinet[m.id] = old[m.id]; return; }
      if (p === g.party) t.cabinet[m.id] = { party: p, name: null, cands: candidatesFor(g, p) };
      else t.cabinet[m.id] = aiMinister(g, p);
    });
    // Kanzlerin/Kanzler und Vizekanzlerschaft
    if (t.chanc === g.party) t.chancellor = { name: t.party.leader.name, party: g.party };
    else if (!t.chancellor || t.chancellor.party !== t.chanc) t.chancellor = { name: g.rivals && g.rivals[t.chanc] ? g.rivals[t.chanc].name : newPerson(g, t.chanc, bigLand(g, t.chanc)).full, party: t.chanc, like: (g.aiLike && g.aiLike[t.chanc]) || A.candStart(t.chanc).like };
    const second = t.gov.find(p => p !== t.chanc);
    t.vize = null;
    if (second) {
      const top = ownMinistries(t, second).sort((a, b) => ministryById(b).weight - ministryById(a).weight)[0];
      if (top) {
        if (second === g.party) {
          // Die Spitzenkandidatur des Juniorpartners übernimmt das wichtigste eigene Ressort.
          t.cabinet[top] = { party: g.party, name: t.party.leader.name, kind: 'spitze', comp: 65, loyal: 100, risk: 4, land: 'NW', lead: true };
        }
        t.vize = { name: t.cabinet[top].name || '…', party: second, ministry: top };
      }
    }
  }

  // Zuständiges Ressort und Minister für ein Thema oder eine Ereigniskategorie.
  const CAT_MINISTRY = { intl: 'aa', wirtschaft: 'wirtschaft', inland: 'innen', parlament: 'justiz' };
  function ministerFor(t, topicOrMin) {
    const id = TD.TOPIC_MINISTRY[topicOrMin] || topicOrMin;
    const m = t.cabinet && t.cabinet[id];
    return m && m.name ? Object.assign({ ministry: id }, m) : null;
  }
  // Kompetenz wirkt als Faktor: 65 (typisch) → 1,0; 90 → 1,15; 40 → 0,85.
  const compFactor = m => (m ? 1 + ((m.comp || 65) - 65) / 170 : 1);

  function needsNames(g) {
    const t = g.term;
    return !!t && Object.keys(t.cabinet).some(id => t.cabinet[id].party === g.party && !t.cabinet[id].name);
  }

  // Ministerin/Minister benennen: einer der drei Vorschläge, auf Wunsch mit eigenem Namen.
  function nameMinister(g, id, index, customName) {
    const t = g.term;
    const slot = t.cabinet[id];
    if (!slot || slot.party !== g.party || !slot.cands) return { ok: false };
    const c = slot.cands[clamp(index | 0, 0, slot.cands.length - 1)];
    const name = String(customName || '').trim().slice(0, 60) || c.name;
    const k = TD.MINISTER_KINDS.find(x => x.id === c.kind);
    t.cabinet[id] = { party: g.party, name, female: c.female, kind: c.kind, land: c.land, comp: c.comp, loyal: c.loyal, risk: c.risk, q0: t.q };
    t.party.unity = clamp(t.party.unity + (k.unity || 0), 0, 100);
    if (k.lv) t.party.lv[c.land] = clamp((t.party.lv[c.land] || 20) + k.lv, 0, 100);
    if (k.like) t.party.leader.like = clamp(t.party.leader.like + k.like, -5, 5);
    if (t.vize && t.vize.ministry === id) t.vize.name = name;
    return { ok: true };
  }
  function autoNames(g) {
    const t = g.term;
    // Vorschlag der Fraktion: die kompetenteste Kandidatur je Ressort.
    Object.keys(t.cabinet).forEach(id => {
      const slot = t.cabinet[id];
      if (slot.party !== g.party || slot.name) return;
      const c = slot.cands || [];
      nameMinister(g, id, c.reduce((b, x, i) => (x.comp > c[b].comp ? i : b), 0));
    });
  }

  // ---------- Koalitionsvertrag ----------
  function buildContract(g, neg) {
    const t = g.term;
    t.contract = {};
    if (t.gov.length < 2) return;
    A.TOPIC_IDS.forEach(topic => {
      const leans = t.gov.map(p => leanOf(g, p, topic));
      const lc = leanOf(g, t.chanc, topic);
      // Gleiche Linie: gemeinsames Ziel; sonst Kompromiss in der Mitte, wenn die Kanzlerpartei nicht schon dort steht.
      const target = leans.every(l => l === leans[0]) ? leans[0] : (Math.max.apply(null, leans) - Math.min.apply(null, leans) >= 2 ? 0 : lc);
      t.contract[topic] = optIndex(topic, target);
    });
    if (neg && neg.topics) {
      neg.topics.forEach(x => {
        if (x.choice === 'hart') t.contract[x.t] = x.mine;
        else if (x.choice === 'nachgeben') t.contract[x.t] = x.theirs;
        else if (x.choice === 'kompromiss') t.contract[x.t] = optIndex(x.t, 0);
      });
    }
  }

  // ---------- Beginn der Legislaturperiode ----------
  function roleOf(g, gov) {
    if (!(g.term.seats[g.party] > 0)) return 'apo';
    if (gov[0] === g.party) return 'kanzler';
    if (gov.indexOf(g.party) !== -1) return 'junior';
    return 'opposition';
  }

  function resetCampaign(g) {
    // Ausgangslage: die Stimmung am Wahltag. Wahlkampf-Boni werden in die Basis übernommen.
    const base = {};
    D.STATES.forEach(st => { base[st.id] = A.stateShares(g, st.id); });
    g.base = base;
    PIDS.forEach(p => { g.nat[p] = 0; if (g.mob) g.mob[p] = 0; });
    D.STATES.forEach(st => { PIDS.forEach(p => { g.reg[st.id][p] = 0; if (g.mobReg && g.mobReg[st.id]) g.mobReg[st.id][p] = 0; }); });
    Object.keys(g.grp || {}).forEach(k => { PIDS.forEach(p => { g.grp[k][p] = 0; }); });
    g.src = {};
    g.mobPerm = {};
    g.wk = {};
    g.prog = null;
    g.progGroups = null;
    g.progState = null;
    g.steal = {};
    g.otherSwing = 0;
    g.delayed = [];
    g.pendingEvent = null;
    g.duel = null;
    g.salience = Object.assign({}, A.salienceBase(g.year));
    MINOR.forEach(m => { g.minor[m] = { trend: 0, nat: 0, reg: {} }; });
    g.cand = Object.assign({}, A.candStart(g.party));
  }

  function startTerm(g) {
    const r = g.result;
    if (!r || !r.outcome || g.phase !== 'done') return { ok: false };
    const like = g.cand ? g.cand.like : 0;
    const world = g.world || null;
    resetCampaign(g);
    const P0 = party(g.party);
    const t = g.term = {
      n: ((g.career && g.career.terms) ? g.career.terms.length : 0) + 1,
      abs0: world && world.abs0 ? world.abs0 : (g.year || FIRST_YEAR) * 4 + 1,
      year0: g.year || FIRST_YEAR,
      q: 0,
      seats: Object.assign({}, r.seats),
      gov: [], chanc: null, tolerated: false, role: 'opposition',
      cabinet: {}, contract: {}, chancellor: null, vize: null,
      policy: world ? copy(world.policy) : {},
      lage: world && world.lage ? copy(world.lage) : null,
      taxes: world ? copy(world.taxes) : {},
      statutes: world && world.statutes ? copy(world.statutes) : {}, // geltendes Recht mit Herkunft, über Legislaturen hinweg
      taxModel: world && world.taxModel === 2 ? 2 : undefined,
      econ: world ? copy(world.econ) : Object.assign({}, TD.ECON0, scenarioOf(g).econ || {}, { pol: { growth: 0, unemp: 0, infl: 0 } }),
      budget: world ? Object.assign({ draft: null, status: 'ok', oneoff: 0, history: [], vote: null }, copy(world.budget)) :
        { plan: {}, draft: null, status: 'ok', extra: 0, def: 0, oneoff: 0, reform: 0, notlage: false, history: [], vote: null },
      laws: [], lawSeq: 0, voteChoice: {},
      laender: world && world.laender ? copy(world.laender) : copy(TD.LAENDER),
      ltwBoost: {}, ltwLog: [], landPrev: world && world.landPrev ? copy(world.landPrev) : {}, sq: world && world.sq ? copy(world.sq) : {},
      doneAbs: world && world.doneAbs ? world.doneAbs : null,
      party: { members: P0.members, cash: Math.max(0.5, Math.round((g.money || 0) * 100) / 100 + P0.budget * 0.3), unity: 62, lv: {},
        leader: { name: g.candidate, like: clamp(like, -5, 5) } },
      mood: 60, intl: world ? world.intl : 50,
      pending: [], usedEvents: {}, news: [], history: [], usage: {},
      ua: null, klagen: [], crisisQ: -9, misstrauenQ: -9,
      stats: { promises: 0, lawsOwn: 0, lawsTotal: 0, budgets: 0, failed: 0, scandals: 0, ltw: [], qRole: {} },
      share0: r.shares[g.party], start: Object.assign({}, r.shares), over: false, early: null, formerNames: []
    };
    if (!world) {
      A.TOPIC_IDS.forEach(topic => { t.policy[topic] = optIndex(topic, TD.POLICY0); });
      TD.TAXES.forEach(x => { t.taxes[x.id] = x.start; });
      t.taxModel = 2;
      TD.AREAS.forEach(a => { if (!a.fixed) t.budget.plan[a.id] = 0; });
      t.econ.debtBn = t.econ.debt * t.econ.gdp / 100;
    }
    t.year0 = Math.floor((t.abs0 - 1) / 4);
    D.STATES.forEach(st => { t.party.lv[st.id] = Math.round(between(g, 12, 30)); if (t.landPrev[st.id] === undefined) t.landPrev[st.id] = g.base[st.id][g.party] || 0; });
    A.TOPIC_IDS.forEach(tp => { if (t.sq[tp] === undefined) t.sq[tp] = SQ0; });

    // Regierung
    let gov = r.government ? r.government.slice() : null;
    if (!gov) {
      const order = CONTEST.filter(p => r.seats[p] > 0).sort((a, b) => r.seats[b] - r.seats[a]);
      gov = [order.find(p => p !== 'afd') || order[0]];
    }
    t.gov = gov;
    t.chanc = gov[0];
    t.tolerated = govSeats(t) < MAJ;
    t.role = roleOf(g, gov);
    t.apMax = TD.ROLES[t.role].ap;
    t.ap = t.apMax;
    t.cred = 55;
    if (r.neg && r.neg.success && gov.indexOf(g.party) !== -1) addCred(g, Math.round(4 * r.neg.kept - 3 * r.neg.given), 'Koalitionsvertrag: ' + String(r.neg.kept).replace('.', ',') + ' Streitpunkte durchgesetzt, ' + r.neg.given + ' nachgegeben');
    if (r.firewallBroken && gov.indexOf(g.party) !== -1 && g.party !== 'afd') addCred(g, -12, 'Brandmauer eingerissen');
    t.mood = r.neg && r.neg.success && gov.indexOf(g.party) !== -1 ? clamp(Math.round(r.neg.mood + 10), 35, 85) : Math.round(between(g, 55, 68));
    const picks = r.neg && r.neg.success && r.neg.ministries && r.neg.members.slice().sort().join() === gov.slice().sort().join() ? r.neg.ministries : draftMinistries(t);
    setupCabinet(g, picks);
    buildContract(g, r.neg && r.neg.success ? r.neg : null);
    careerStartTerm(g, r);
    LB.init(g);

    A.rollPollErr(g);
    A.takePoll(g);
    t.lastNat = A.nationalShares(g);
    t.prevShare = t.lastNat[g.party];
    t.history.push({ q: -1, nat: roundShares(g.poll.nat), econ: econSnap(t) });
    t.groups0 = copy(g.poll.groups || {});
    t.econPrev = { unemp: t.econ.unemp };
    g.phase = 'term';
    const govText = gov.map(sname).join('-') + (t.tolerated ? '-Minderheitsregierung' : '-Koalition');
    news(g, 'Die ' + (t.n === 1 ? '' : t.n + '. ') + 'Legislaturperiode beginnt. ' + t.chancellor.name + ' (' + sname(t.chanc) + ') wird zur Kanzlerin/zum Kanzler gewählt – ' + govText + '.', 'big');
    // Ohne Mehrheit gewählt: Duldung durch eine Oppositionspartei (Zugeständnis als erstes Gesetz) oder wechselnde Mehrheiten.
    const H = r.hung;
    t.duldung = H && H.duldung && gov.length === 1 && gov[0] === H.lead ? H.duldung : null;
    if (t.duldung) {
      news(g, '🤝 Duldung: ' + sname(t.duldung) + ' stützt die Minderheitsregierung bei Haushalt und Gesetzen, ohne Ministerien zu übernehmen.', 'info');
      if (H.concession && t.policy[H.concession.topic] !== H.concession.opt) makeLaw(g, { kind: 'topic', topic: H.concession.topic, opt: H.concession.opt }, t.chanc).duldung = true;
    } else if (t.tolerated && !gov.every(p => E.fwLevel(g, p) >= 2)) news(g, 'Minderheitsregierung: Für jedes Gesetz und jeden Haushalt muss die Regierung Stimmen in der Opposition suchen.', 'warn');
    const kw = r.neg && r.neg.success && r.neg.kanzler;
    if (kw && kw.length > 1) {
      // Fehlstart wie im Mai 2025: Abweichler im 1. Wahlgang belasten das Klima von Anfang an.
      t.mood = clamp(t.mood - (r.neg.weak ? 10 : 5), 0, 100);
      if (gov.indexOf(g.party) !== -1) t.party.unity = clamp(t.party.unity - 3, 0, 100);
      news(g, 'Fehlstart: Die Kanzlerwahl gelang erst im ' + (r.neg.weak ? 'dritten' : 'zweiten') + ' Wahlgang. Wer waren die Abweichler?', 'warn');
    }
    if (r.neg && r.neg.success && r.neg.ratify && r.neg.ratify.kind === 'mitglieder' && gov.indexOf(g.party) !== -1) t.party.unity = clamp(t.party.unity + (r.neg.ratify.yes >= 65 ? 4 : -2), 0, 100);
    news(g, introText(g), 'role');
    // Landtagswahlen, die in die Zeit des Wahlkampfs fielen, werden nachgeholt – der Bundesrat läuft weiter.
    if (t.doneAbs !== null) for (let idx = t.doneAbs + 1; idx < t.abs0; idx++) ltwDueAbs(idx).forEach(l => landtagswahl(g, l));
    flushLtwNight(g);
    t.doneAbs = t.abs0 - 1;
    ensureLage(g);
    t.comp0 = g.competence ? Object.assign({}, g.competence) : null; // Kompetenz zu Beginn, für die Bilanz
    beginQuarter(g, true);
    return { ok: true, role: t.role };
  }

  function introText(g) {
    const t = g.term;
    return {
      kanzler: 'Ihr stellt das Kanzleramt. Bringt Gesetze durch Bundestag und Bundesrat, beschließt Haushalte und haltet die Koalition zusammen.',
      junior: 'Ihr regiert als Juniorpartner mit. ' + t.party.leader.name + ' wird Vizekanzler:in. Setzt eure Themen durch, ohne die Koalition zu sprengen.',
      opposition: 'Ihr seid in der Opposition. Kontrolliert die Regierung, stellt Anträge und Anfragen – und bereitet den Machtwechsel vor.',
      apo: 'Ihr seid nicht mehr im Bundestag. Jetzt zählen Mitglieder, Landesverbände, Landtagswahlen und die Straße.'
    }[t.role];
  }

  function roundShares(sh) { const o = {}; Object.keys(sh).forEach(p => { o[p] = r2(sh[p]); }); return o; }




  // ---------- Lobbyismus ----------
  // Bei jedem eigenen Gesetzentwurf melden sich die betroffenen Verbände: Unterstützer machen den Weg leichter,
  // der stärkste Gegner verlangt Zugeständnisse – oder bietet eine „Formulierungshilfe“ an.
  function lobbyReact(g, law) {
    const t = g.term;
    const aff = LB.affected(law, TD);
    law.backers = aff.filter(x => x.s > 0).map(x => x.l.id);
    const foe = aff.find(x => x.s < 0);
    if (foe) {
      law.foe = foe.l.id;
      t.pending.push({ type: 'lobby', law: law.id, lobby: foe.l.id });
    }
  }
  function lobbyQuarter(g) {
    const t = g.term;
    const L = LB.init(g);
    cat('lobby');
    // Kampagnen gegen euch (Anzeigen, Proteste, Briefe an Abgeordnete)
    (t.lobbyCampaigns || []).filter(c => c.left > 0).forEach(c => {
      const l = LB.byId(c.id);
      t.gov.forEach(p => addNat(g, p, -0.15 * l.power));
      c.left -= 1;
      if (c.left === 0) news(g, l.icon + ' Die Kampagne von ' + l.short + ' gegen euer Gesetz läuft aus.', 'info');
    });
    // Formulierungshilfen fliegen auf (Vorbild: Gesetze mit Passagen aus Verbandspapieren).
    (t.ghosts || []).filter(x => !x.out).forEach(x => {
      if (rand(g) < 0.12) {
        x.out = true;
        const l = LB.byId(x.lobby);
        addNatT(g, g.party, -1.5, 'slow');
        addCred(g, -6, 'Gesetzespassagen stammen wörtlich von ' + l.short);
        LB.addNear(g, 5);
        news(g, '🔍 Enthüllung: Passagen im Gesetz „' + x.name + '“ stammen wörtlich aus einem Papier von ' + l.short + '. Opposition und Presse sind empört.', 'bad');
      }
    });
    // Unterstützer und Gegner wirken jedes Quartal
    LB.LOBBIES.forEach(l => {
      const st = LB.status(L.rel[l.id]);
      if (st === 'ally') {
        if (l.money >= 2) t.party.cash += 0.08 * l.money * moneyScale(g);
        if (l.power >= 2 && l.groups.length) addNatT(g, g.party, 0.04 * l.power, 'fast');
      } else if (st === 'foe' && l.power >= 2) addNatT(g, g.party, -0.03 * l.power, 'fast');
    });
    // Lobbynähe: Affären werden wahrscheinlicher (Nebentätigkeiten, Beraterverträge, Aktienoptionen).
    if (rand(g) < L.near / 100 * 0.05 && !t.pending.some(it => it.type === 'lobbyaffair')) t.pending.push({ type: 'lobbyaffair', lobby: pick(g, LB.LOBBIES.filter(l => L.rel[l.id] >= 55).map(l => l.id).concat(['bdi'])) });
    L.near = clamp(L.near * 0.95, 0, 100);
  }
  // Wechsel ehemaliger Ministerinnen und Minister zu Verbänden (Drehtür).
  function lobbyDoor(g, name, ministry) {
    const t = g.term;
    if (!name || rand(g) > 0.35) return;
    const topics = ministryById(ministry).topics;
    const cands = LB.LOBBIES.filter(l => topics.some(tp => tp in l.prefs) && l.money >= 1);
    if (!cands.length) return;
    t.pending.push({ type: 'door', name, ministry, lobby: pick(g, cands).id });
  }

  // ---------- Kabinett im Alltag ----------
  // Erfahrung macht kompetenter; gute Ressortarbeit stärkt die Kompetenz der Partei im Thema;
  // illoyale Ministerinnen und Minister fallen der eigenen Regierung in den Rücken.
  function updateCabinet(g) {
    const t = g.term;
    Object.keys(t.cabinet).forEach(id => {
      const m = t.cabinet[id];
      if (!m.name) return;
      if (m.q0 === undefined) m.q0 = t.q;
      if (t.q - m.q0 < 20 && (t.q - m.q0) % 2 === 1) m.comp = Math.min(95, (m.comp || 50) + 1);
      if (m.party !== g.party) return;
      const topic = ministryById(id).topics[0];
      if (g.competence && topic) g.competence[topic] = clamp(g.competence[topic] + ((m.comp || 50) - 60) / 120, 5, 95);
      if (!m.lead && rand(g) < (100 - (m.loyal || 70)) / 100 * 0.08 && !t.pending.some(it => it.type === 'disloyal')) {
        t.pending.push({ type: 'disloyal', ministry: id, partner: t.gov.find(p => p !== g.party) || t.chanc });
      }
    });
  }

  // ---------- Parteileben ----------
  // Flügel (Stimmung 0–100), Führungsteam (Generalsekretariat, Fraktionsvorsitz) und Parteitage. Ordentliche
  // Parteitage mit Wahl der Spitze finden alle zwei Jahre statt (Satzungen von CDU, SPD, Grünen u. a.).
  function partyLife(g) {
    const t = g.term;
    const P = t.party;
    if (!P.wings) P.wings = [55, 55];
    if (!P.team) {
      P.team = { gs: newPerson(g, g.party, weightedLand(g)).full, fv: null };
      P.team.fv = newPerson(g, g.party, weightedLand(g)).full;
    }
    return P;
  }
  const wingNames = g => TD.WINGS[g.party] || ['Wirtschaftsflügel', 'Sozialflügel'];
  // Gesetze rechts der Mitte freuen den ersten Flügel, Gesetze links der Mitte den zweiten.
  function wingReact(g, lean, w) {
    const P = partyLife(g);
    if (!lean) return;
    const k = w || 1;
    P.wings[lean > 0 ? 0 : 1] = clamp(P.wings[lean > 0 ? 0 : 1] + 4 * k, 0, 100);
    P.wings[lean > 0 ? 1 : 0] = clamp(P.wings[lean > 0 ? 1 : 0] - 3 * k, 0, 100);
  }
  // Neue Parteispitze: übernimmt auch Kanzleramt bzw. Vizekanzlerschaft (Kanzlerwechsel ohne Neuwahl wie 1963 und 1966).
  function replaceLeader(g, how, name, like) {
    const t = g.term;
    const P = t.party;
    const old = P.leader.name;
    t.formerNames.push(old);
    const yr = cal(t).year;
    P.leader = { name: name || newPerson(g, g.party, weightedLand(g)).full, like: like === undefined ? 0.8 : like, born: yr - Math.round(between(g, 38, 52)) };
    newLeader(g, P.leader.name, yr, P.leader.born, how).offices.push({ year: yr, office: officeName(g) });
    chron(g, 'partei', 'Neue Spitze: ' + P.leader.name + ' folgt auf ' + old + (how ? ' (' + how + ')' : '') + '.');
    if (t.chancellor && t.chancellor.party === g.party && t.chancellor.name === old) t.chancellor.name = P.leader.name;
    Object.keys(t.cabinet).forEach(id => { const m = t.cabinet[id]; if (m.lead && m.party === g.party) m.name = P.leader.name; });
    if (t.vize && t.vize.party === g.party) t.vize.name = P.leader.name;
    return P.leader.name;
  }
  // Wer könnte die Spitze herausfordern? Ehrgeizige Kabinettsmitglieder zuerst, sonst ein Landesfürst.
  function challenger(g) {
    const t = g.term;
    const mins = ownMinistries(t, g.party).map(id => Object.assign({ id }, t.cabinet[id])).filter(m => m.name && !m.lead);
    const best = mins.sort((a, b) => (b.comp - (b.loyal || 70) / 2) - (a.comp - (a.loyal || 70) / 2))[0];
    if (best) return { name: best.name, ministry: best.id, from: 'Kabinett' };
    const land = bigLand(g, g.party);
    return { name: newPerson(g, g.party, land).full, land, from: 'Land' };
  }
  function partyQuarter(g, c) {
    const t = g.term;
    const P = partyLife(g);
    const own = (t.lastNat && t.lastNat[g.party]) || t.share0;
    const has = type => t.pending.some(it => it.type === type);
    if (c.qn === 2 && c.year - (P.ptYear || t.year0) >= 2 && t.q - (t.parteitagQ === undefined ? -9 : t.parteitagQ) >= 4) t.pending.push({ type: 'parteitag_o' });
    const low = P.wings[0] < P.wings[1] ? 0 : 1;
    if (P.wings[low] < 38 && rand(g) < 0.45 && !has('fluegel')) t.pending.push({ type: 'fluegel', wing: low });
    if (t.q >= 4 && P.unity < 40 && own < t.share0 - 3 && t.q - (P.mkQ === undefined ? -9 : P.mkQ) >= 6 && rand(g) < 0.5 && !has('machtkampf')) {
      P.mkQ = t.q;
      t.pending.push(Object.assign({ type: 'machtkampf' }, challenger(g)));
    }
    if (!isGov(t.role)) return;
    ownMinistries(t, g.party).forEach(id => {
      const m = t.cabinet[id];
      if (!m.name || m.lead || has('ruecktritt')) return;
      if ((m.comp || 50) < 52 && rand(g) < 0.06) t.pending.push({ type: 'ruecktritt', ministry: id });
      else if ((m.comp || 50) >= 68 && (m.loyal || 70) < 70 && rand(g) < 0.05 && !has('ehrgeiz')) t.pending.push({ type: 'ehrgeiz', ministry: id });
    });
    if (t.q === 8 && ownMinistries(t, g.party).filter(id => t.cabinet[id].name && !t.cabinet[id].lead).length) t.pending.push({ type: 'halbzeit' });
  }

  function resolvePartyLife(g, item, choice) {
    const t = g.term;
    const P = partyLife(g);
    const W = wingNames(g);
    let text = '';
    if (item.type === 'parteitag_o') {
      P.ptYear = cal(t).year;
      t.parteitagQ = t.q;
      if (choice === 0) P.leader.like = clamp(P.leader.like + (P.unity >= 55 ? 0.2 : -0.1), -5, 5);
      else if (choice === 1) { P.unity = clamp(P.unity + 6, 0, 100); P.wings = P.wings.map(w => clamp(w + 5, 0, 100)); }
      else if (choice === 2) { const core = (g.program && g.program.core) || []; core.forEach(tp => { if (g.competence) g.competence[tp] = clamp(g.competence[tp] + 2, 5, 95); }); }
      // Ergebnis der Wiederwahl – reale Spanne: 64,9 % (Klingbeil 2025) bis 89,8 % (Merz 2024) und mehr.
      const pct = clamp(Math.round((62 + 0.45 * (P.unity - 50) + 4 * P.leader.like + 1.2 * (((t.lastNat && t.lastNat[g.party]) || t.share0) - t.share0) + (Math.min(P.wings[0], P.wings[1]) - 50) / 5 + between(g, -5, 5)) * 10) / 10, 41, 98.5);
      P.lastVote = { year: P.ptYear, pct };
      const L = currentLeader(g);
      if (L) (L.votes = L.votes || []).push({ year: P.ptYear, pct });
      if (pct < 70) { P.leader.like = clamp(P.leader.like - 0.3, -5, 5); P.unity = clamp(P.unity - 4, 0, 100); addNat(g, g.party, -0.15); text = 'Denkzettel: ' + P.leader.name + ' wird mit nur ' + pct.toFixed(1).replace('.', ',') + ' % wiedergewählt.'; }
      else if (pct >= 88) { P.unity = clamp(P.unity + 5, 0, 100); addNat(g, g.party, 0.15); text = 'Rückenwind: ' + P.leader.name + ' wird mit ' + pct.toFixed(1).replace('.', ',') + ' % wiedergewählt.'; }
      else text = P.leader.name + ' wird mit ' + pct.toFixed(1).replace('.', ',') + ' % wiedergewählt – ein solides Ergebnis.';
      if (choice === 3) { t.formerNames.push(P.team.gs); P.team.gs = newPerson(g, g.party, weightedLand(g)).full; P.unity = clamp(P.unity + 3, 0, 100); text += ' Neu im Generalsekretariat: ' + P.team.gs + '.'; }
      news(g, '🎪 Parteitag: ' + text, pct < 70 ? 'warn' : 'info');
    } else if (item.type === 'fluegel') {
      const w = item.wing;
      if (choice === 0) { P.wings[w] = clamp(P.wings[w] + 20, 0, 100); P.wings[1 - w] = clamp(P.wings[1 - w] - 8, 0, 100); P.unity = clamp(P.unity + 2, 0, 100); text = 'Ihr kommt dem Flügel „' + W[w] + '“ entgegen – der andere Flügel murrt.'; }
      else if (choice === 1) { if (rand(g) < clamp(0.5 + P.leader.like * 0.08, 0.2, 0.85)) { P.wings[w] = clamp(P.wings[w] + 10, 0, 100); P.leader.like = clamp(P.leader.like + 0.1, -5, 5); text = 'Ein Machtwort der Spitze beendet den Streit.'; } else { P.unity = clamp(P.unity - 6, 0, 100); addNat(g, g.party, -0.2); text = 'Das Machtwort verpufft – der Streit geht in den Talkshows weiter.'; } }
      else { P.wings[w] = clamp(P.wings[w] + 12, 0, 100); P.unity = clamp(P.unity + 3, 0, 100); t.party.cash = Math.max(0, t.party.cash - cashCost(g, 0.1)); text = 'Eine Kommission soll ein gemeinsames Papier erarbeiten. Fürs Erste herrscht Ruhe.'; }
      news(g, 'Flügelstreit: ' + text, 'info');
    } else if (item.type === 'machtkampf') {
      if (choice === 0) {
        const pWin = clamp(0.5 + P.leader.like * 0.07 + (P.unity - 40) / 100 + (item.from === 'Kabinett' ? -0.05 : 0), 0.15, 0.85);
        if (rand(g) < pWin) { P.unity = clamp(P.unity + 8, 0, 100); P.leader.like = clamp(P.leader.like + 0.3, -5, 5); addNat(g, g.party, 0.2); text = P.leader.name + ' gewinnt die Kampfkandidatur gegen ' + item.name + ' – gestärkt aus dem Machtkampf.'; if (item.ministry && t.cabinet[item.ministry]) t.cabinet[item.ministry].loyal = 85; }
        else { const old = P.leader.name; if (item.ministry && t.cabinet[item.ministry] && t.cabinet[item.ministry].name === item.name) t.cabinet[item.ministry] = { party: g.party, name: null, cands: candidatesFor(g, g.party) }; replaceLeader(g, 'Kampfkandidatur', item.name, 0.5); P.unity = clamp(P.unity + 4, 0, 100); addNatT(g, g.party, 0.6 / A.sizeFactor(shareOf(g, g.party)), 'hype'); text = item.name + ' setzt sich gegen ' + old + ' durch und übernimmt die Partei' + (t.role === 'kanzler' ? ' – und das Kanzleramt' : '') + '.'; }
      } else if (choice === 1) {
        P.unity = clamp(P.unity + 7, 0, 100); P.leader.like = clamp(P.leader.like - 0.15, -5, 5);
        if (item.ministry && t.cabinet[item.ministry]) t.cabinet[item.ministry].loyal = 90;
        text = item.name + ' wird eingebunden' + (item.ministry ? ' und bekommt mehr Einfluss im Kabinett' : ' und übernimmt den stellvertretenden Parteivorsitz') + '. Der Aufstand ist vertagt.';
      } else {
        const old = P.leader.name;
        if (item.ministry && t.cabinet[item.ministry] && t.cabinet[item.ministry].name === item.name) t.cabinet[item.ministry] = { party: g.party, name: null, cands: candidatesFor(g, g.party) };
        replaceLeader(g, 'Rücktritt von ' + old, item.name, 0.9);
        P.unity = clamp(P.unity + 12, 0, 100);
        addNatT(g, g.party, between(g, 1, 2) / A.sizeFactor(shareOf(g, g.party)), 'hype');
        text = old + ' tritt zurück. ' + item.name + ' übernimmt' + (t.role === 'kanzler' ? ' Partei und Kanzleramt' : ' die Partei') + ' – ein geordneter Übergang.';
      }
      news(g, '⚔️ Machtkampf: ' + text, 'big');
    } else if (item.type === 'ruecktritt') {
      const m = t.cabinet[item.ministry];
      if (!m || !m.name) return '';
      const label = ministryById(item.ministry).short;
      if (choice === 0) { if (rand(g) < 0.55) { m.loyal = Math.min(100, (m.loyal || 60) + 10); text = 'Ihr haltet an ' + m.name + ' fest – die Forderungen verhallen.'; } else { addNat(g, g.party, -0.3); P.leader.like = clamp(P.leader.like - 0.15, -5, 5); text = 'Neue Pannen im ' + label + '-Ressort – das Festhalten an ' + m.name + ' wird zur Belastung.'; } }
      else if (choice === 1) { t.formerNames.push(m.name); t.cabinet[item.ministry] = { party: g.party, name: null, cands: candidatesFor(g, g.party) }; P.unity = clamp(P.unity - 2, 0, 100); addNat(g, g.party, 0.05); text = m.name + ' tritt zurück. Ihr müsst die Nachfolge benennen.'; }
      else { m.comp = Math.min(95, (m.comp || 50) + 6); t.party.cash = Math.max(0, t.party.cash - cashCost(g, 0.05)); text = 'Externe Prüfer durchleuchten das ' + label + '-Ressort. ' + m.name + ' bekommt eine zweite Chance.'; }
      news(g, 'Rücktrittsforderung: ' + text, 'warn');
    } else if (item.type === 'ehrgeiz') {
      const m = t.cabinet[item.ministry];
      if (!m || !m.name) return '';
      if (choice === 0) { m.loyal = Math.min(100, (m.loyal || 60) + 15); P.unity = clamp(P.unity - 2, 0, 100); text = m.name + ' wird zurückgepfiffen – und schmollt.'; }
      else if (choice === 1) { m.loyal = Math.max(0, (m.loyal || 60) - 10); P.crown = m.name; addNat(g, g.party, 0.05); text = m.name + ' darf glänzen – die Presse spricht ' + (m.female ? 'von der Kronprinzessin' : m.female === false ? 'vom Kronprinzen' : 'von der Nachfolge an der Spitze') + '.'; }
      else { m.loyal = Math.min(100, (m.loyal || 60) + 8); P.leader.like = clamp(P.leader.like + 0.05, -5, 5); text = 'Ihr lobt ' + m.name + ' öffentlich – Teamgeist statt Rivalität.'; }
      news(g, 'Ehrgeiz im Kabinett: ' + text, 'info');
    } else if (item.type === 'halbzeit') {
      if (choice === 0) {
        const ids = ownMinistries(t, g.party).filter(id => t.cabinet[id].name && !t.cabinet[id].lead).sort((a, b) => (t.cabinet[a].comp || 50) - (t.cabinet[b].comp || 50));
        const id = ids[0];
        const m = t.cabinet[id];
        t.formerNames.push(m.name);
        t.cabinet[id] = { party: g.party, name: null, cands: candidatesFor(g, g.party) };
        P.unity = clamp(P.unity - 2, 0, 100); addNat(g, g.party, 0.1); t.mood = clamp(t.mood + 3, 0, 100);
        text = 'Kabinettsumbildung zur Halbzeit: ' + m.name + ' (' + ministryById(id).short + ') muss gehen. Ihr benennt die Nachfolge.';
      } else if (choice === 1) { t.mood = clamp(t.mood + 6, 0, 100); addNat(g, g.party, 0.08); text = 'Die Halbzeitbilanz: Die Koalition listet auf, was geschafft ist – und was noch kommt.'; }
      else { P.unity = clamp(P.unity + 2, 0, 100); text = 'Ihr setzt auf Kontinuität – keine Wechsel im Kabinett.'; }
      news(g, '🔄 Halbzeit: ' + text, 'info');
    }
    return text;
  }

  // ---------- Medienlandschaft ----------
  // Vier Medientypen mit eigener Logik (Beziehung 0–100). Reichweiten und Nutzung nach Reuters Digital News Report
  // Deutschland (Fernsehnachrichten der Öffentlich-Rechtlichen weiter Hauptquelle, Social Media bei unter 35-Jährigen vorn).
  const MEDIA = [
    { id: 'boulevard', icon: '🗞️', name: 'Boulevard', desc: 'Große Reichweite, schnelle Schlagzeilen – aber Zitate werden zugespitzt.' },
    { id: 'leit', icon: '📰', name: 'Leitmedien', desc: 'Zeitungen und Magazine: Wer hier überzeugt, gewinnt Glaubwürdigkeit und Kompetenz.' },
    { id: 'oer', icon: '📺', name: 'Öffentlich-Rechtliche', desc: 'Nachrichten und Talk mit dem größten Publikum: gut für die Beliebtheit der Spitze.' },
    { id: 'social', icon: '📱', name: 'Podcasts und Social Media', desc: 'Erreicht Jüngere direkt – kann viral gehen.' }
  ];
  function media(g) {
    const t = g.term;
    if (!t.media) t.media = { boulevard: 50, leit: 50, oer: 50, social: 50 };
    return t.media;
  }
  function addMedia(g, id, v) { const M = media(g); M[id] = clamp(M[id] + v, 0, 100); }
  const PRESS_TONE = {
    boulevard: [['„Wie lange geht das noch gut?“', '„Chaos-Tage!“'], ['„Viel Lärm um wenig“', '„Jetzt wird’s ernst“'], ['„Die packen an!“', '„Endlich mal Klartext!“']],
    leit: [['Kommentar: „Ohne Kompass“', 'Leitartikel: „Eine Partei im Selbstgespräch“'], ['Analyse: „Solide, aber blass“', 'Kommentar: „Noch nicht überzeugend“'], ['Leitartikel: „Ein kluger Kurs“', 'Analyse: „Sie haben einen Plan“']],
    oer: [['„Kritische Fragen bleiben unbeantwortet“', '„Die Umfragen sinken weiter“'], ['„Durchwachsene Bilanz“', '„Noch fehlt das klare Profil“'], ['„Im Aufwind“', '„Klare Botschaften kommen an“']],
    social: [['Hashtag #Rücktritt trendet', 'Spott-Memes gehen viral'], ['Gemischte Reaktionen im Netz', 'Kaum Resonanz in den Timelines'], ['Clips mit Millionen Aufrufen', 'Fans feiern im Netz']]
  };
  // Presseschau am Quartalsende: Ton je nach Beziehung und Umfragetrend.
  function pressReview(g, trend) {
    const t = g.term;
    const M = media(g);
    const parts = MEDIA.map((m, i) => {
      const score = M[m.id] + trend * 8;
      const lvl = score < 40 ? 0 : score < 62 ? 1 : 2;
      return m.icon + ' ' + PRESS_TONE[m.id][lvl][(t.q + i) % 2]; // ohne Zufall: der Spielverlauf bleibt unberührt
    });
    news(g, '🗞️ Presseschau: ' + parts.join(' · '), 'info');
    // Wohlwollende Medien tragen eure Botschaften weiter – feindselige verstärken jede Panne.
    const avg = MEDIA.reduce((s, m) => s + M[m.id], 0) / MEDIA.length;
    cat('medien');
    addNat(g, g.party, (avg - 50) / 800);
    MEDIA.forEach(m => { M[m.id] += (50 - M[m.id]) * 0.08; });
  }

  // ---------- Forderungen der Koalitionspartner ----------
  // Partner verlangen, dass offene Vorhaben aus dem Koalitionsvertrag umgesetzt werden – mit Frist.
  function updateDemands(g) {
    const t = g.term;
    t.demands = t.demands || [];
    t.demands.filter(d => !d.done).forEach(d => {
      if (t.gov.indexOf(d.p) === -1) { d.done = 'weg'; return; }
      if (t.policy[d.topic] === d.opt) {
        d.done = 'erfüllt';
        t.mood = clamp(t.mood + 8, 0, 100);
        news(g, '🤝 ' + sname(d.p) + ' ist zufrieden: „' + D.PROGRAM[d.topic][d.opt].label + '“ ist umgesetzt.', 'good');
      } else if (t.q >= d.due) {
        d.done = 'verfehlt';
        t.mood = clamp(t.mood - 10, 0, 100);
        addNat(g, d.p, 0.15);
        news(g, '😠 ' + sname(d.p) + ' wirft euch Wortbruch vor: „' + D.PROGRAM[d.topic][d.opt].label + '“ ist immer noch nicht umgesetzt.', 'bad');
      }
    });
    if (t.role !== 'kanzler' || t.gov.length < 2 || t.demands.some(d => !d.done) || rand(g) > 0.35) return;
    const partners = t.gov.filter(p => p !== g.party);
    const open = [];
    partners.forEach(p => Object.keys(t.contract).forEach(tp => {
      const opt = t.contract[tp];
      if (opt === t.policy[tp] || inPipeline(t, tp)) return;
      const d = Math.abs(leanOf(g, p, tp) - D.PROGRAM[tp][opt].lean);
      if (d === 0) open.push({ p, topic: tp, opt, w: g.salience[tp] * (ownMinistries(t, p).indexOf(TD.TOPIC_MINISTRY[tp]) !== -1 ? 2 : 1) });
    }));
    if (!open.length) return;
    const x = open.sort((a, b) => b.w - a.w)[0];
    const dm = { p: x.p, topic: x.topic, opt: x.opt, q: t.q, due: t.q + 3 };
    t.demands.push(dm);
    news(g, '📌 ' + sname(x.p) + ' fordert: „' + D.PROGRAM[x.topic][x.opt].label + '“ muss bis ' + quarterLabel(t, dm.due) + ' umgesetzt werden – so steht es im Koalitionsvertrag.', 'warn');
  }

  // Haushalt und Wählergruppen: Mehr Geld für einen Bereich freut die Gruppen, die davon profitieren.
  function budgetGroupEffects(g, oldPlan, newPlan) {
    const t = g.term;
    let pop = 0;
    const lines = [];
    TD.AREAS.forEach(a => {
      if (a.fixed || !a.groups) return;
      const d = ((newPlan[a.id] || 0) - (oldPlan[a.id] || 0)) / 5;
      if (!d) return;
      let w = 0;
      Object.keys(a.groups).forEach(k => { const gr = D.GROUPS.find(x => x.id === k); if (gr) w += gr.weight * a.groups[k]; });
      pop += d * w * 0.6;
      if (Math.abs(d * w) > 0.04) lines.push(a.name.split(' (')[0] + (d > 0 ? ' +' : ' ') + (newPlan[a.id] - oldPlan[a.id]) + ' %');
      t.gov.forEach(p => { const pr = (TD.AREA_PREF[p] || {})[a.id]; if (pr) addNat(g, p, 0.04 * pr * d); });
    });
    if (pop) t.gov.forEach(p => addNat(g, p, pop * (p === t.chanc ? 1 : 0.7)));
    if (lines.length) news(g, 'Was der Haushalt für die Menschen bedeutet: ' + lines.join(', ') + '.', pop >= 0 ? 'info' : 'warn');
  }

  // ---------- Status quo ----------
  // Die geltende Regelung je Thema hat einen Rückhalt (0–100). Die Ränder greifen ihn an, die Mitte verteidigt
  // ihn; Regierungsparteien stehen eher hinter dem, was gilt. Fällt der Rückhalt, gewinnen die Angreifer, und
  // Gesetze, die den Status quo ändern, kommen leichter durch.
  const FRINGE = ['afd', 'linke', 'bsw'];
  const SQ_K = 7;
  function sqLean(t, topic) { return D.PROGRAM[topic][t.policy[topic]].lean; }
  function sqForces(g, topic) {
    const t = g.term;
    const L = sqLean(t, topic);
    const def = [];
    const att = [];
    PIDS.concat(MINOR).forEach(p => {
      const share = shareOf(g, p) / 100;
      if (share < 0.02) return;
      const lp = leanOf(g, p, topic);
      const d = Math.abs(lp - L);
      let w;
      if (FRINGE.indexOf(p) !== -1) w = d === 0 ? 0.4 : -1.4 * d;
      else w = d === 0 ? 1 : d === 1 ? 0.2 : -0.6;
      if (t.gov.indexOf(p) !== -1) w = w > 0 ? w + 0.3 : w * 0.4;
      if (w > 0) def.push({ p, f: share * w });
      else att.push({ p, f: -share * w, dir: Math.sign(lp - L) });
    });
    const D0 = def.reduce((x, y) => x + y.f, 0);
    const A0 = att.reduce((x, y) => x + y.f, 0);
    const pull = att.reduce((x, y) => x + y.f * y.dir, 0);
    return { def: def.sort((a, b) => b.f - a.f), att: att.sort((a, b) => b.f - a.f), D: D0, A: A0, dir: pull > 0 ? 1 : pull < 0 ? -1 : 0 };
  }
  function addSq(t, topic, v) { t.sq[topic] = clamp((t.sq[topic] === undefined ? SQ0 : t.sq[topic]) + v, 0, 100); }

  function updateSq(g) {
    const t = g.term;
    cat('statusquo');
    A.TOPIC_IDS.forEach(topic => {
      const f = sqForces(g, topic);
      const sf = clamp(g.salience[topic] / D.SALIENCE0[topic], 0.5, 2.5);
      // Die Regierung verteidigt im Alltag, was sie selbst vertritt (Verwaltung, Kommunikation).
      const govDefends = Math.abs(leanOf(g, t.chanc, topic) - sqLean(t, topic)) === 0 ? 0.6 : 0;
      addSq(t, topic, (f.D - f.A) * SQ_K * sf + govDefends + (55 - t.sq[topic]) * 0.08);
      const sq = t.sq[topic];
      if (sq < 40) {
        const k = (40 - sq) / 40 * sf * 0.06;
        f.att.forEach(x => addNat(g, x.p, k * (FRINGE.indexOf(x.p) !== -1 ? 1 : 0.5)));
        f.def.forEach(x => { if (t.gov.indexOf(x.p) !== -1) addNat(g, x.p, -k * 0.6); });
      }
      // Kipppunkt: Der Druck wird so groß, dass die Regierung reagieren muss.
      if (sq <= 15 && f.dir && !inPipeline(t, topic) && !t.pending.some(it => it.type === 'sq' && it.topic === topic) && t.q - ((t.sqTip || {})[topic] || -9) >= 4) {
        t.sqTip = t.sqTip || {};
        t.sqTip[topic] = t.q;
        const target = optIndex(topic, clamp(sqLean(t, topic) + f.dir, -1, 1));
        news(g, '⚠️ Der Status quo beim Thema ' + E.topicById(topic).name + ' wankt: ' + f.att.slice(0, 2).map(x => sname(x.p)).join(' und ') + ' machen massiv Druck.', 'warn');
        if (isGov(t.role)) t.pending.push({ type: 'sq', topic, opt: target });
        else if (rand(g) < 0.5) {
          const law = makeLaw(g, { kind: 'topic', topic, opt: target }, t.chanc);
          news(g, 'Die Bundesregierung gibt nach und bringt ein: „' + lawName(law) + '“.', 'info');
        } else { addSq(t, topic, 15); news(g, 'Die Bundesregierung hält am Status quo beim Thema ' + E.topicById(topic).name + ' fest.', 'info'); }
      }
    });
  }

  // ---------- Lage im Land ----------
  // Wie geht es den Menschen? Je Thema ein Indikator (termdata LAGE). Er bewegt sich mit dem Grundtrend, der geltenden
  // Regelung (neue Gesetze wirken erst nach einigen Quartalen voll), dem Haushalt und dem Zustand der Regierung.
  // Folgen: Was sich verschlechtert, wird den Menschen wichtiger; Regierungsparteien werden für Verbesserungen
  // belohnt und für Verschlechterungen bestraft (stärker), besonders in den betroffenen Wählergruppen.
  const lageDef = id => TD.LAGE.find(x => x.id === id);
  function lageVal(t, x) { return x.econ ? t.econ[x.econ] : t.lage[x.id]; }
  function ensureLage(g) {
    const t = g.term;
    if (!t.lage) { const sl = scenarioOf(g).lage || {}; t.lage = {}; TD.LAGE.forEach(x => { if (!x.econ) t.lage[x.id] = sl[x.id] !== undefined ? sl[x.id] : x.start; }); }
    if (!t.lage0) { t.lage0 = {}; TD.LAGE.forEach(x => { t.lage0[x.id] = lageVal(t, x); }); }
    if (!t.lagePrev) t.lagePrev = Object.assign({}, t.lage0);
    if (!t.policyQ) t.policyQ = {};
    if (!t.lageWhy) t.lageWhy = {};
    return t.lage;
  }
  // Veränderung in „deutlichen Schritten“ (positiv = besser).
  const lageImp = (t, x, ref) => x.better * (lageVal(t, x) - ref[x.id]) / x.scale;
  function lageQuarter(g) {
    const t = g.term;
    ensureLage(g);
    t.salPrev = Object.assign({}, g.salience); // für die Pfeile bei „Was die Menschen bewegt“
    const prev = {};
    TD.LAGE.forEach(x => { prev[x.id] = lageVal(t, x); });
    const d = {};
    TD.LAGE.forEach(x => { if (!x.econ) d[x.id] = x.drift || 0; });
    // Geltende Regelungen, gemessen an der mittleren Linie; neue Gesetze wirken mit Verzögerung.
    Object.keys(TD.LAGE_FX).forEach(topic => {
      const lean = String(D.PROGRAM[topic][t.policy[topic]].lean);
      const fx = TD.LAGE_FX[topic][lean] || {};
      const base = TD.LAGE_FX[topic]['0'] || {};
      const main = lageDef(topic);
      const since = t.policyQ[topic];
      const ramp = since === undefined ? 1 : clamp((t.q - since + 1) / ((main && main.lag) || 4), 0, 1);
      Object.keys(Object.assign({}, fx, base)).forEach(id => { if (id in d) d[id] += ramp * ((fx[id] || 0) - (base[id] || 0)); });
    });
    // Haushalt: Mehr oder weniger Geld als im Ausgangsplan.
    Object.keys(TD.LAGE_BUDGET).forEach(a => {
      const rel = ((t.budget.plan && t.budget.plan[a]) || 0) / 100 + (a === 'verteidigung' ? (t.budget.def || 0) / 80 : 0);
      Object.keys(TD.LAGE_BUDGET[a]).forEach(id => { if (id in d) d[id] += rel * TD.LAGE_BUDGET[a][id]; });
    });
    // Konsolidierungsmaßnahmen wirken dauerhaft auf die Lage (z. B. gestrecktes Sondervermögen: langsamere Sanierung).
    Object.keys(t.budget.measures || {}).forEach(id => { const k = konsol(id); Object.keys((k && k.lage) || {}).forEach(x => { if (x in d) d[x] += k.lage[x]; }); });
    // Sofortprogramme aus der Kabinettssitzung wirken vier Quartale.
    Object.keys(t.lageBoost || {}).forEach(id => { const b = t.lageBoost[id]; if (id in d) d[id] += b.d; b.left -= 1; if (b.left <= 0) delete t.lageBoost[id]; });
    // Schattenkabinett: In seinen Themen wächst die Kompetenz der Partei.
    (t.shadow || []).forEach(s => { if (g.competence) g.competence[s.topic] = clamp(g.competence[s.topic] + 1, 5, 95); });
    // Streit, vorläufige Haushaltsführung und Affären kosten Vertrauen in die Demokratie; die Arbeitslosigkeit treibt die Armut.
    if (t.gov.length > 1 && t.mood < 35) d.demokratie -= 0.4;
    if (t.budget.status === 'vorlaeufig') d.demokratie -= 0.3;
    if (t.ua) d.demokratie -= 0.2;
    d.soziales += 0.25 * (t.econ.unemp - ((t.econPrev && t.econPrev.unemp) || t.econ.unemp));
    TD.LAGE.forEach(x => {
      if (x.econ) return;
      const v = t.lage[x.id] + d[x.id] + between(g, -0.1, 0.1) * x.scale * 0.15;
      t.lage[x.id] = Math.max(0, /%/.test(x.unit) && !/BIP/.test(x.unit) ? Math.min(100, v) : v);
    });
    // Folgen für Parteien und Wählergruppen.
    cat('lage');
    TD.LAGE.forEach(x => {
      const dImp = x.better * (lageVal(t, x) - prev[x.id]) / x.scale;
      if (Math.abs(dImp) < 0.02) return;
      const w = clamp(g.salience[x.id] / D.SALIENCE0[x.id], 0.5, 2.5);
      const eff = 0.12 * dImp * w * (dImp < 0 ? 1.4 : 1); // Negatives wiegt schwerer
      const owner = (ministerFor(t, x.id) || {}).party || t.chanc;
      t.gov.forEach(p => {
        addNat(g, p, eff * (p === owner ? 1.3 : 0.8));
        Object.keys(x.groups || {}).forEach(k => { if (g.grp[k]) g.grp[k][p] = (g.grp[k][p] || 0) + 0.3 * dImp * x.groups[k]; });
      });
      if (Math.abs(dImp) >= 0.08) Object.keys(x.groups || {}).forEach(k => { t.lageWhy[k] = { id: x.id, d: dImp, q: t.q }; });
    });
    t.lagePrev = prev;
    (t.lageHist = t.lageHist || []).push({ q: t.q, v: TD.LAGE.reduce((o, x) => { o[x.id] = Math.round(lageVal(t, x) * 100) / 100; return o; }, {}) });
    if (t.lageHist.length > 20) t.lageHist.shift();
  }
  // Was die Menschen bewegt: Verschlechtert sich die Lage, wird das Thema wichtiger (und umgekehrt).
  function lagePressure(g) {
    const t = g.term;
    const out = {};
    A.TOPIC_IDS.forEach(tp => {
      const x = lageDef(tp);
      out[tp] = x && t.lage0 ? clamp(1 - 0.2 * lageImp(t, x, t.lage0), 0.6, 1.8) : 1;
    });
    return out;
  }
  // Bilanz der Legislatur: Indikatoren am Anfang und jetzt.
  function lageBilanz(g) {
    const t = g.term;
    ensureLage(g);
    return TD.LAGE.map(x => ({ id: x.id, name: x.name, unit: x.unit, dec: x.dec, from: t.lage0[x.id], to: lageVal(t, x), imp: lageImp(t, x, t.lage0), better: x.better }));
  }
  // Was ein Gesetz bewirken würde (für die Auswahl): Indikatoren mit Richtung, gemessen an der geltenden Regelung.
  function lawEffects(g, topic, opt) {
    const t = g.term;
    const fx = TD.LAGE_FX[topic];
    if (!fx) return [];
    const now = fx[String(D.PROGRAM[topic][t.policy[topic]].lean)] || {};
    const nxt = fx[String(D.PROGRAM[topic][opt].lean)] || {};
    return Object.keys(Object.assign({}, now, nxt)).map(id => {
      const x = lageDef(id);
      const dv = (nxt[id] || 0) - (now[id] || 0);
      return x && Math.abs(dv) > 1e-9 ? { id, name: x.name, good: x.better * dv > 0, up: dv > 0, lag: (lageDef(topic) || {}).lag || 4 } : null;
    }).filter(Boolean);
  }

  // ---------- Stimmen aus dem Land und Titelseiten ----------
  // Am Quartalsende: Menschen aus den betroffenen Gruppen reagieren auf neue Gesetze und die Lage; zwei Zeitungen
  // machen mit der wichtigsten Geschichte auf. Eigener Zufall: Das verändert den Spielverlauf nicht.
  function voicePerson(R, groupId) {
    const list = TD.VOICE_PEOPLE[groupId] || TD.VOICE_PEOPLE.mitte;
    const p = list[Math.floor(R() * list.length)];
    const towns = TD.VOICE_TOWNS[groupId === 'land' ? 'land' : groupId === 'stadt' ? 'stadt' : 'mix'];
    return p[0] + ' (' + p[1] + '), ' + p[2] + ' aus ' + towns[Math.floor(R() * towns.length)];
  }
  function quarterStories(g) {
    const t = g.term;
    const R = localRng(t.q * 9973 + (t.lawSeq || 0) * 31 + 7);
    const pickR = arr => arr[Math.floor(R() * arr.length)];
    const voices = [];
    // Neue Gesetze: die Gruppe, die es am stärksten betrifft.
    t.laws.filter(l => l.stage === 'inkraft' && l.q1 === t.q && l.kind === 'topic').slice(0, 2).forEach(l => {
      const a1 = A.positionAppeal(l.topic, l.opt);
      const prevOpt = l.prevOpt === undefined ? optIndex(l.topic, 0) : l.prevOpt;
      const a0 = A.positionAppeal(l.topic, prevOpt);
      const k = D.GROUPS.slice().sort((x, y) => Math.abs(a1[y.id] - a0[y.id]) - Math.abs(a1[x.id] - a0[x.id]))[0];
      const pro = a1[k.id] >= a0[k.id];
      voices.push({ q: t.q, who: voicePerson(R, k.id), mood: pro ? '+' : '-', text: pickR(TD.LAW_VOICES[pro ? 'pro' : 'contra']).replace('{law}', lawName(l)).replace('{party}', sname(l.by)) });
    });
    // Veränderungen der Lage in diesem Quartal.
    const seen = {};
    Object.keys(t.lageWhy || {}).filter(k => t.lageWhy[k].q === t.q).forEach(k => {
      const w = t.lageWhy[k];
      if (seen[w.id] || voices.length >= 4 || !TD.VOICES[w.id]) return;
      seen[w.id] = true;
      voices.push({ q: t.q, who: voicePerson(R, k), mood: w.d > 0 ? '+' : '-', text: pickR(TD.VOICES[w.id][w.d > 0 ? 'good' : 'bad']) });
    });
    // Sonst: das drängendste Problem.
    if (!voices.length) {
      const tp = A.TOPIC_IDS.slice().sort((a, b) => g.salience[b] - g.salience[a])[0];
      const x = lageDef(tp);
      if (x && TD.VOICES[tp]) {
        const good = lageImp(t, x, t.lage0) > 0;
        voices.push({ q: t.q, who: voicePerson(R, Object.keys(x.groups || { mitte: 1 })[0]), mood: good ? '+' : '-', text: pickR(TD.VOICES[tp][good ? 'good' : 'bad']) });
      }
    }
    t.voices = voices.concat(t.voices || []).slice(0, 12);
    // Titelseiten: die wichtigsten Meldungen dieses Quartals.
    const rank = { big: 4, bad: 3, warn: 2, role: 0 };
    const items = t.news.filter(n => n.q === t.q && !/Presseschau|Legislaturperiode beginnt/.test(n.text))
      .map((n, i) => ({ n, s: (rank[n.kind] === undefined ? 1 : rank[n.kind]) - i * 0.01 })).sort((a, b) => b.s - a.s);
    const clean = s => String(s).replace(/^[^A-Za-zÄÖÜäöü„0-9]+/, '').trim();
    const head = s => { const c = clean(s); const m = c.split(/: |\s–\s/); return m[0].length >= 12 && m[0].length <= 70 ? m[0] : c.slice(0, 70).replace(/\s\S*$/, '') + (c.length > 70 ? ' …' : ''); };
    const rest = s => { const c = clean(s); const i = c.search(/: |\s–\s/); return i > 0 ? c.slice(i + 2).trim() : ''; };
    const top = items[0] && items[0].n;
    const second = (items[1] && items[1].n) || top;
    const kicker = { big: 'PAUKENSCHLAG', bad: 'BLAMAGE', warn: 'ÄRGER IN BERLIN', info: 'JETZT AMTLICH' };
    const moved = TD.LAGE.map(x => ({ x, d: x.better * (lageVal(t, x) - ((t.lagePrev || {})[x.id] === undefined ? lageVal(t, x) : t.lagePrev[x.id])) / x.scale })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0];
    const own = t.history.length ? t.history[t.history.length - 1].nat[g.party] : null;
    t.front = {
      q: t.q,
      boulevard: top ? { kicker: kicker[top.kind] || 'NEU', head: head(top.text).toUpperCase(), sub: rest(top.text) } : { kicker: 'RUHIGE ZEITEN', head: 'BERLIN MACHT PAUSE', sub: 'Ein Quartal ohne große Schlagzeilen.' },
      leit: second ? { head: head(second.text), sub: rest(second.text) || (moved && Math.abs(moved.d) > 0.05 ? 'Im Blick: ' + moved.x.name + (moved.d > 0 ? ' entwickelt sich besser' : ' entwickelt sich schlechter') + '.' : '') } : { head: 'Die Republik im Stillstand?', sub: '' },
      poll: own !== null ? sname(g.party) + ' in der Sonntagsfrage: ' + (Math.round(own * 10) / 10).toString().replace('.', ',') + ' %' : '',
      comments: top ? papersComment(g, top, R) : []
    };
  }

  // Zwei Tageszeitungen kommentieren dieselbe Geschichte – je nach eigener Haltung und der Partei, um die es geht.
  const PAPERS = [{ name: 'Der Morgen', lean: -0.6, label: 'links-liberal' }, { name: 'Die Hauptstadt-Zeitung', lean: 0.5, label: 'bürgerlich-konservativ' }];
  const COMMENT = {
    praise: ['Ein überfälliger Schritt – endlich bewegt sich etwas.', 'Das ist solides Handwerk. Mehr davon.', 'Richtig so. Wer das kritisiert, hat keine bessere Idee.'],
    skeptic: ['Gut gemeint, aber die Rechnung zahlen am Ende andere.', 'Viel Symbolik, wenig Substanz.', 'Man muss kein Prophet sein, um die Probleme kommen zu sehen.'],
    mild: ['Ein Rückschlag – aber kein Grund zur Panik.', 'Ärgerlich, doch die Richtung stimmt.', 'Das muss besser werden. Die Zeit dafür ist da.'],
    harsh: ['Das Ergebnis einer Politik, die nicht zuhört.', 'Ein Armutszeugnis.', 'Wer so regiert, darf sich über die Umfragen nicht wundern.']
  };
  function papersComment(g, item, R) {
    const t = g.term;
    const subj = CONTEST.find(p => p !== OTHER && new RegExp('\\b' + sname(p) + '\\b').test(item.text)) || t.chanc;
    const P = party(subj);
    const leans = P && P.lean ? Object.keys(P.lean).map(k => P.lean[k]) : [0];
    const pl = leans.reduce((x, v) => x + v, 0) / leans.length;
    const good = item.kind === 'good' || item.kind === 'big';
    return PAPERS.map(pp => {
      const near = Math.abs(pp.lean - pl) < 0.6;
      const key = good ? (near ? 'praise' : 'skeptic') : (near ? 'mild' : 'harsh');
      return { paper: pp.name, label: pp.label, about: sname(subj), text: COMMENT[key][Math.floor(R() * COMMENT[key].length)] };
    });
  }

  // ---------- Szenen je Rolle ----------
  // Regierung: In der Kabinettssitzung setzt die Kanzlerin/der Kanzler (bzw. der Juniorpartner in seinen Ressorts) ein
  // Sofortprogramm gegen eines der drängendsten Probleme auf die Tagesordnung – es kostet Geld und wirkt vier Quartale.
  // Opposition: Ein Schattenkabinett gibt der Partei Gesichter für drei Themen und baut dort Kompetenz auf.
  const SOFORT = { migration: 'Rückführungsoffensive und schnellere Verfahren', soziales: 'Entlastungspaket für Geringverdiener', klima: 'Förderprogramm Wärmepumpe und Netze',
    sicherheit: 'Mehr Personal für Polizei und Justiz', bildung: 'Startchancen-Programm für Brennpunktschulen', digitales: 'Glasfaser-Turbo für ländliche Räume',
    wohnen: 'Bau-Turbo: schnellere Genehmigungen', verteidigung: 'Beschaffungsoffensive Bundeswehr', gesundheit: 'Stabilisierungszuschuss für die Kassen',
    verkehr: 'Sanierungsprogramm Schiene', europa: 'Europa-Initiative mit Paris und Warschau', familie: 'Kita-Ausbauprogramm', land: 'Zukunftsprogramm Landwirtschaft',
    demokratie: 'Bürgerräte und Demokratieförderung', wirtschaft: 'Konjunktur- und Standortpaket', finanzen: 'Ausgabenüberprüfung (Spending Review)' };
  function topProblems(g, n) {
    const t = g.term;
    ensureLage(g);
    return TD.LAGE.map(x => ({ id: x.id, x, s: g.salience[x.id] / D.SALIENCE0[x.id] - 0.3 * lageImp(t, x, t.lage0) }))
      .filter(y => !(t.lageBoost && t.lageBoost[y.id])).sort((a, b) => b.s - a.s).slice(0, n || 3);
  }
  function roleQuarter(g, c) {
    const t = g.term;
    const has = type => t.pending.some(it => it.type === type);
    if (t.role === 'kanzler' && t.q % 2 === 1 && !has('kabinettstop')) t.pending.push({ type: 'kabinettstop', tops: topProblems(g, 3).map(y => y.id) });
    if (t.role === 'junior' && t.q % 4 === 2 && !has('kabinettstop')) {
      const own = ownMinistries(t, g.party).map(m => ministryById(m).topics || []).reduce((a, b) => a.concat(b), []);
      const tops = topProblems(g, 16).filter(y => own.indexOf(y.id) !== -1).slice(0, 3).map(y => y.id);
      if (tops.length) t.pending.push({ type: 'kabinettstop', tops, junior: true });
    }
    if (t.role === 'opposition' && !t.shadow && t.q >= 1 && !has('schattenkabinett')) t.pending.push({ type: 'schattenkabinett' });
  }
  const SHADOW_SETS = [['wirtschaft', 'finanzen', 'digitales'], ['soziales', 'gesundheit', 'wohnen'], ['migration', 'sicherheit', 'verteidigung'], ['klima', 'verkehr', 'land']];
  function resolveRoleScene(g, item, choice) {
    const t = g.term;
    if (item.type === 'kabinettstop') {
      const id = item.tops[choice];
      if (!id) return 'Die Tagesordnung bleibt ohne Sofortprogramm. ' + (item.junior ? 'Eure Ressorts arbeiten im Normalbetrieb.' : 'Das Kabinett arbeitet die Routine ab.');
      const x = lageDef(id);
      t.lageBoost = t.lageBoost || {};
      t.lageBoost[id] = { left: 4, d: x.better * x.scale * 0.09 }; // 2 Mrd. € bewegen viel, aber nicht alles (geschätzt)
      t.budget.oneoff += 2; // die Wirkung auf die Umfragen kommt über die Lage im Land
      news(g, '🏛️ Kabinett beschließt „' + SOFORT[id] + '“ (2 Mrd. €).', 'info');
      return 'Das Kabinett beschließt „' + SOFORT[id] + '“. Kosten: 2 Mrd. €. Wirkung auf „' + x.name + '“ über die nächsten vier Quartale.';
    }
    if (item.type === 'schattenkabinett') {
      const set = SHADOW_SETS[choice] || SHADOW_SETS[0];
      t.shadow = set.map(tp => ({ topic: tp, name: newPerson(g, g.party, weightedLand(g)).full }));
      cat('aktion');
      addNat(g, g.party, 0.08);
      news(g, '🧭 ' + sname(g.party) + ' stellt ein Schattenkabinett vor: ' + t.shadow.map(s => s.name + ' (' + E.topicById(s.topic).name + ')').join(', ') + '.', 'info');
      return 'Euer Schattenkabinett steht: ' + t.shadow.map(s => s.name + ' für ' + E.topicById(s.topic).name).join(', ') + '. In diesen Themen wächst eure Kompetenz jedes Quartal.';
    }
    return '';
  }
  // APO: Wie realistisch ist der Wiedereinzug? (Anzeige; Werte aus Umfrage, Landtagen, Mitgliedern und Kasse)
  function comebackBarometer(g) {
    const t = g.term;
    const P0 = party(g.party);
    const poll = (t.lastNat && t.lastNat[g.party]) || 0;
    const landtage = Object.keys(t.landPrev || {}).filter(l => (t.landPrev[l] || 0) >= 5).length;
    const members = t.party.members / ((P0 && P0.members) || t.party.members);
    const cash = t.party.cash;
    const score = clamp(Math.round(50 + (poll - 5) * 14 + (landtage - 3) * 3 + (members - 1) * 60 + Math.min(10, cash)), 1, 99);
    return { score, poll, landtage, members, cash, label: score >= 70 ? 'Comeback in Reichweite' : score >= 45 ? 'Offenes Rennen' : score >= 25 ? 'Steiniger Weg' : 'Kaum Chancen' };
  }

  // ---------- Euer Wahlkreis ----------
  // Die Spitze vertritt einen Wahlkreis – den, in dem die Partei am stärksten ist. Wer ihn pflegt (Bürgersprechstunde,
  // lokale Konflikte), hat bei der nächsten Wahl einen Vorsprung bei den Erststimmen; wer ihn vernachlässigt, riskiert
  // das Direktmandat. Die Wahlkreispflege (0–100) wird in den nächsten Wahlkampf übernommen.
  function homeWk(g) {
    const t = g.term;
    if (!g.homeWk || !E.wkByNr(g.homeWk)) {
      let best = null;
      E.WK_LIST.forEach(w => { const s = E.wkShares(g, w.nr, false); if (s && (!best || s.shares[g.party] > best.v)) best = { nr: w.nr, v: s.shares[g.party] }; });
      g.homeWk = best ? best.nr : E.WK_LIST[0].nr;
    }
    if (t && !t.wk) t.wk = { care: 55, cases: 0 };
    return E.wkByNr(g.homeWk);
  }
  function wkStatus(g) {
    const w = homeWk(g);
    const s = E.wkShares(g, w.nr, true);
    const mine = s.shares[g.party] || 0;
    const rival = s.lead === g.party ? s.second : s.lead;
    return { nr: w.nr, name: w.name, land: w.land, mine, rival, rivalShare: s.shares[rival] || 0, lead: s.lead === g.party, care: Math.round(g.term.wk.care) };
  }
  function wkQuarter(g) {
    const t = g.term;
    homeWk(g);
    t.wk.care = clamp(t.wk.care - 2, 0, 100); // ohne Präsenz vergessen die Menschen
    if (t.q > 0 && t.q % 2 === 0 && !t.pending.some(it => it.type === 'wkcase')) {
      const pool = TD.WK_CASES.filter(c => c.topic !== t.wk.last);
      const c = pool.slice().sort((a, b) => g.salience[b.topic] - g.salience[a.topic])[Math.floor(rand(g) * 3)];
      t.wk.last = c.topic;
      t.pending.push({ type: 'wkcase', topic: c.topic, text: c.text.replace(/\{wk\}/g, homeWk(g).name) });
    }
  }
  function resolveWk(g, item, choice) {
    const t = g.term;
    const w = homeWk(g);
    t.wk.cases += 1;
    if (choice === 0) {
      t.wk.care = clamp(t.wk.care + 15, 0, 100);
      return 'Ihr fahrt hin, hört zu und vermittelt. Die Lokalzeitung in ' + w.name + ' berichtet ausführlich.';
    }
    if (choice === 1 && isGov(t.role)) {
      t.wk.care = clamp(t.wk.care + 25, 0, 100);
      t.budget.oneoff += 0.2;
      if (rand(g) < 0.2) { addCred(g, -2, 'Förderprogramm für den eigenen Wahlkreis'); news(g, 'Kritik: Fördergeld fließt ausgerechnet in den Wahlkreis von ' + t.party.leader.name + '.', 'warn'); return 'Das Fördergeld kommt – und die Opposition spricht von Selbstbedienung.'; }
      return 'Ein Förderprogramm des Bundes hilft vor Ort (0,2 Mrd. €). Man kennt euch hier.';
    }
    if (choice === 1) {
      t.wk.care = clamp(t.wk.care + 10, 0, 100);
      addNat(g, g.party, 0.02);
      return 'Ihr bringt das Thema in den Bundestag. Vor Ort rechnet man euch das hoch an.';
    }
    t.wk.care = clamp(t.wk.care - 10, 0, 100);
    return 'Berlin geht vor. In ' + w.name + ' fragt man sich, wofür man euch gewählt hat.';
  }

  // ---------- Bilanz für den nächsten Wahlkampf ----------
  // Was eure Partei in der Legislatur getan hat, zieht mit in den Wahlkampf: beschlossene Gesetze, gehaltene und
  // gebrochene Versprechen, umstrittene Abstimmungen, Glaubwürdigkeit und – für Regierungsparteien – die Lage im Land.
  function termRecord(g) {
    const t = g.term;
    ensureLage(g);
    const inGov = isGov(t.role);
    // Titel ohne Symbol und Anführungszeichen.
    const clean = x => String(x).replace(/^Abstimmung über /, '').replace(/^[„“"]+|[„“"]+$/g, '').replace(/^[^A-Za-zÄÖÜäöü0-9§]+/, '').trim();
    const laws = t.laws.filter(l => l.stage === 'inkraft' && (l.by === g.party || (inGov && t.gov.indexOf(l.by) !== -1)))
      .map(l => ({ title: clean(lawName(l)), topic: lawTopic(l), mine: l.by === g.party, promise: !!l.promise, popular: lawPop(l) > 0 })).slice(-12);
    const broken = inGov && g.program ? g.program.core.filter(tp => t.policy[tp] !== g.program.positions[tp]) : [];
    // Jede Abstimmung nur einmal.
    const seenV = {};
    const votes = (t.voteLog || []).filter(v => v.decisive || v.gewissen).map(v => ({ title: clean(v.title), my: v.my }))
      .concat((t.memory || []).filter(m => m.title && /Abstimmung/.test(m.title) && m.ok === false).map(m => ({ title: clean(m.title), my: /Ja/.test(m.label) ? 'ja' : /Nein/.test(m.label) ? 'nein' : 'enthaltung', against: true })))
      .filter(v => (seenV[v.title] ? false : (seenV[v.title] = true))).slice(0, 3);
    const lage = lageBilanz(g).filter(x => Math.abs(x.imp) >= 0.5).sort((a, b) => Math.abs(b.imp) - Math.abs(a.imp)).slice(0, 4).map(x => ({ id: x.id, name: x.name, imp: r2(x.imp) }));
    // Kompetenz: Was die Partei in der Legislatur dazugewonnen hat (Ressortarbeit, Schattenkabinett, Konzepte),
    // und für Regierungsparteien die Bilanz in der Sache.
    const comp = {};
    if (g.competence && t.comp0) A.TOPIC_IDS.forEach(tp => { const d = (g.competence[tp] || 0) - (t.comp0[tp] || 0); if (Math.abs(d) >= 1) comp[tp] = Math.round(d); });
    // Die Regierungsparteien werden in der Sache gemessen – auch wenn ihr selbst in der Opposition wart.
    const govComp = {};
    lageBilanz(g).forEach(x => { if (Math.abs(x.imp) >= 0.3) govComp[x.id] = clamp(Math.round(2 * x.imp), -6, 6); });
    return { role: t.role, year: t.year0, gov: t.gov.slice(), laws, promises: t.stats.promises, broken, votes, lage, cred: Math.round(t.cred === undefined ? 55 : t.cred),
      scandals: t.stats.scandals, comp, govComp, salience: Object.assign({}, g.salience) };
  }

  // ---------- Wirtschaft und Haushalt ----------
  // Konsolidierungsmaßnahmen: beschlossen (t.budget.measures: id → Quartal) oder im Entwurf (draftMeas: volle Wirkung).
  const konsol = id => TD.KONSOL.find(x => x.id === id);
  function activeMeasures(t, draftMeas) {
    const out = {};
    Object.keys(t.budget.measures || {}).forEach(id => { const k = konsol(id); if (k) out[id] = clamp((t.q - t.budget.measures[id] + 1) / (k.ramp || 1), 0, 1); });
    (draftMeas || []).forEach(id => { if (konsol(id)) out[id] = 1; });
    return out;
  }
  // Durchschnittszins der Bundesschuld (Start so, dass die Zinsen 2026 dem Haushalt entsprechen).
  function avgRate(t) {
    if (t.budget.avgRate === undefined) t.budget.avgRate = areaById('zinsen').base / (TD.ECON0.debt * TD.ECON0.gdp / 100) * 100;
    return t.budget.avgRate;
  }
  // Sondervermögen Infrastruktur je Jahr (gestreckt: weniger).
  const svOf = (t, draftMeas) => TD.DEBT_RULE.sv - (activeMeasures(t, draftMeas).sv ? konsol('sv').sv : 0);
  function budgetCalc(t, plan, draftMeas) {
    const e = t.econ;
    const s = e.gdp / TD.ECON0.gdp;
    const meas = activeMeasures(t, draftMeas);
    const areas = {};
    let spend = 0;
    TD.AREAS.forEach(a => {
      let v = a.base * s * ((t.budget.drift && t.budget.drift[a.id]) || 1);
      if (a.id === 'zinsen') v = (e.debtBn || e.debt * e.gdp / 100) * avgRate(t) / 100; // Schuldenstand × Durchschnittszins
      else if (!a.fixed) v *= 1 + ((plan || t.budget.plan)[a.id] || 0) / 100;
      if (a.id === 'verteidigung') v += t.budget.def;
      areas[a.id] = v;
      spend += v;
    });
    spend += t.budget.extra + t.budget.oneoff;
    // Maßnahmen: Einsparungen/Mehreinnahmen (mit Anlaufzeit) und Kosten (z. B. neue Steuerprüfer).
    const measRev = Object.keys(meas).reduce((x, id) => x + (konsol(id).rev || 0) * meas[id], 0) * s;
    spend += Object.keys(meas).reduce((x, id) => x + (konsol(id).cost || 0), 0);
    upgradeTaxes(t);
    const taxRev = TD.TAXES.reduce((sum, x) => sum + taxRevAt(x, t.taxes[x.id]), 0) * s;
    const gap0 = e.gap === undefined ? TD.ECON0.gap : e.gap;
    // Steuern reagieren auf die Konjunktur (Budgetsemielastizität ~0,5).
    const revenue = TD.REVENUE0 * s + TD.DEBT_RULE.cyc * (gap0 - TD.ECON0.gap) * e.gdp / 100 + taxRev + measRev + (t.budget.taxEst || 0);
    const deficit = spend - revenue;
    const cyc = -gap0 * TD.DEBT_RULE.cyc * e.gdp / 100;
    const trans = TD.DEBT_RULE.trans * e.gdp / 100;
    const defFree = Math.max(0, areas.verteidigung + TD.DEBT_RULE.defenseOther * s - TD.DEBT_RULE.defenseFree * e.gdp / 100);
    const limit = (TD.DEBT_RULE.structural + (t.budget.reform || 0)) * e.gdp / 100 + cyc + trans + defFree;
    return { areas, spend, revenue, taxRev, measRev, deficit, limit, gap: deficit - limit, cyc, trans, defFree,
      defShare: areas.verteidigung / e.gdp * 100, s, sv: svOf(t, draftMeas) };
  }

  function econQuarter(g) {
    const t = g.term;
    const e = t.econ;
    const b = budgetCalc(t);
    // Investitionen in Verkehr, Forschung, Bildung … stützen das Wachstum; das Defizit wirkt als Impuls.
    let inv = 0;
    TD.AREAS.forEach(a => { if (!a.fixed && a.growth) inv += (b.areas[a.id] - a.base * b.s) / 10 * a.growth; });
    const impulse = clamp(0.15 * ((b.deficit + b.sv) / e.gdp * 100 - 3.0), -0.3, 0.3);
    const status = t.budget.status === 'vorlaeufig' ? -0.1 : 0;
    const target = e.trend + e.pol.growth + inv + impulse + status;
    e.growth = clamp(e.growth + 0.35 * (target - e.growth) + between(g, -0.22, 0.22), -5, 5);
    t.econPrev = { unemp: e.unemp };
    e.unemp = clamp(e.unemp - 0.4 * (e.growth - 1.0) / 4 + e.pol.unemp / 4 + between(g, -0.04, 0.04), 2.5, 14);
    e.infl = clamp(e.infl + 0.3 * (2 + e.pol.infl + 0.2 * (e.growth - 1) - e.infl) + between(g, -0.12, 0.12), -1, 12);
    e.gdp *= 1 + (e.growth + e.infl) / 400;
    e.gap = clamp((e.gap === undefined ? TD.ECON0.gap : e.gap) * 0.92 + (e.growth - e.trend) / 4, -6, 4);
    e.debt = e.debtBn / e.gdp * 100;
  }

  // Jahresabschluss: Schulden fortschreiben, neuer Haushalt tritt in Kraft (falls beschlossen).
  function closeYear(g) {
    const t = g.term;
    const e = t.econ;
    const b = budgetCalc(t);
    e.debtBn += b.deficit + b.sv; // ein Überschuss tilgt Schulden
    e.debt = e.debtBn / e.gdp * 100;
    t.budget.history.push({ year: cal(t).year, deficit: r1(b.deficit), limit: r1(b.limit), gap: r1(b.gap), defShare: r2(b.defShare), notlage: !!t.budget.notlage, debt: r1(e.debt) });
    // Schwarze Null (Vorbild 2014–2019): Ohne neue Schulden im Kernhaushalt sinkt die Schuldenquote spürbar.
    if (b.deficit <= 0) {
      news(g, '⚖️ Schwarze Null: Der Bund kommt ' + cal(t).year + ' ohne neue Schulden aus' + (b.deficit < -0.5 ? ' und tilgt ' + num1(-b.deficit) + ' Mrd. €' : '') + '.', 'good');
      if (isGov(t.role)) addCred(g, 2, 'Schwarze Null im Haushalt ' + cal(t).year);
      if (isGov(t.role) && g.competence) g.competence.finanzen = clamp(g.competence.finanzen + 2, 5, 95);
    }
    // Zinsen: Die Refinanzierung folgt dem Markt (Inflation, Risikoaufschläge; geschätzt).
    const m0 = t.budget.market === undefined ? TD.INTEREST.market : t.budget.market;
    t.budget.market = clamp(m0 - 0.3 + 0.65 * budgetRng(t, 37)() + 0.1 * (e.infl - 2), 0.5, 6);
    avgRate(t);
    t.budget.avgRate += TD.INTEREST.rollover * (t.budget.market - t.budget.avgRate);
    if (Math.abs(t.budget.market - m0) >= 0.2) news(g, (t.budget.market > m0 ? '📈 Die Zinsen für Bundesanleihen steigen' : '📉 Die Zinsen für Bundesanleihen sinken') + ' auf ' + num1(t.budget.market) + ' % – neue Schulden werden ' + (t.budget.market > m0 ? 'teurer' : 'günstiger') + '.', 'info');
    t.budget.oneoff = 0;
    t.budget.notlage = false;
    // Demografie: Rentenzuschuss und Gesundheit wachsen schneller als die Wirtschaft.
    t.budget.drift = t.budget.drift || {};
    const brake = id => Object.keys(t.budget.measures || {}).reduce((x, m) => x + ((konsol(m) && konsol(m).drift && konsol(m).drift[id]) || 0), 0);
    TD.AREAS.forEach(a => { if (a.drift) t.budget.drift[a.id] = ((t.budget.drift[a.id] || 1) * (1 + Math.max(0, a.drift + brake(a.id)) / 100)); });
    if (t.budget.next) {
      t.budget.plan = t.budget.next.plan;
      t.budget.notlage = !!t.budget.next.notlage;
      t.budget.next = null;
      t.budget.status = 'ok';
    }
  }

  // Wer stellt den Haushaltsentwurf auf? Finanzministerium, im Zweifel das Kanzleramt.
  function budgetDrafter(t) {
    const f = t.cabinet.finanzen ? t.cabinet.finanzen.party : t.chanc;
    return f;
  }
  function playerDraftsBudget(g) {
    const t = g.term;
    return isGov(t.role) && (budgetDrafter(t) === g.party || t.role === 'kanzler');
  }

  // KI-Entwurf: Lieblingsbereiche der Kanzler- und Finanzpartei stärken, dann Lücke schließen.
  // Haushaltsbegleitgesetz: Maßnahmen treten mit dem Haushalt in Kraft. Betroffene Gruppen wenden sich von der Regierung ab,
  // Partner reagieren nach ihrer Haltung; ein Verkauf von Beteiligungen tilgt sofort.
  function enactMeasures(g, ids) {
    const t = g.term;
    if (!ids.length) return;
    t.budget.measures = t.budget.measures || {};
    cat('haushalt');
    ids.forEach(id => {
      const k = konsol(id);
      if (!k || t.budget.measures[id] !== undefined) return;
      t.budget.measures[id] = t.q;
      if (k.oneoffDebt) { t.econ.debtBn -= k.oneoffDebt; t.econ.debt = t.econ.debtBn / t.econ.gdp * 100; }
      let pop = 0;
      Object.keys(k.groups || {}).forEach(gid => {
        const gr = D.GROUPS.find(x => x.id === gid);
        if (gr) pop += gr.weight * k.groups[gid];
        t.gov.forEach(p => { if (g.grp[gid]) g.grp[gid][p] = (g.grp[gid][p] || 0) + 0.5 * k.groups[gid]; });
      });
      t.gov.forEach(p => addNat(g, p, 0.5 * pop * (p === t.chanc ? 1 : 0.7) + 0.05 * ((k.pref || {})[p] || 0)));
      news(g, '🏦 Haushaltsbegleitgesetz: ' + k.name + (k.rev ? ' (' + num1(k.rev) + ' Mrd. € im Jahr)' : k.oneoffDebt ? ' (' + num1(k.oneoffDebt) + ' Mrd. € Tilgung)' : '') + '.', pop < -0.05 ? 'warn' : 'info');
    });
  }
  // KI-Regierungen konsolidieren je nach Partei: höchstens eine neue Maßnahme im Jahr, wenn die Schulden steigen.
  function aiMeasures(g) {
    const t = g.term;
    const b = budgetCalc(t, t.budget.draft ? t.budget.draft.plan : t.budget.plan);
    const rising = (b.deficit + b.sv) / t.econ.gdp * 100 > 0.019 * t.econ.debt + 0.2;
    if (!rising && b.gap <= 0) return [];
    const done = t.budget.measures || {};
    const score = k => t.gov.reduce((x, p) => x + ((k.pref || {})[p] || 0) * (p === t.chanc ? 2 : 1), 0);
    const cands = TD.KONSOL.filter(k => done[k.id] === undefined && score(k) > 0).sort((a, b2) => score(b2) - score(a));
    return cands.length ? [cands[0].id] : [];
  }
  // Prognose der Schuldenquote bis zum Ende der Legislatur mit dem gegebenen Plan (ohne Zufall, Wachstum wie heute).
  function debtPath(g, plan, draftMeas) {
    const t = g.term;
    const e = t.econ;
    const b = budgetCalc(t, plan || t.budget.plan, draftMeas);
    const years = Math.max(1, Math.ceil((QUARTERS - t.q) / 4));
    let debt = e.debtBn;
    let gdp = e.gdp;
    const nominal = (e.growth + e.infl) / 100;
    const out = [{ year: cal(t).year, debt: e.debt }];
    for (let y = 1; y <= years; y++) {
      gdp *= 1 + nominal;
      debt += (b.deficit + b.sv) * (1 + nominal * y);
      out.push({ year: cal(t).year + y, debt: debt / gdp * 100 });
    }
    return out;
  }
  // Das Haushaltsjahr verläuft nie wie geplant: Steuerschätzung (Mai, Herbst) und unerwartete Kosten.
  // Eigener Zufall (wie bei Prognosen), damit der Haushalt den übrigen Spielverlauf nicht verschiebt.
  const budgetRng = (t, salt) => localRng(t.q * 7727 + salt + Math.round(t.econ.gdp));
  function budgetYear(g, c) {
    const t = g.term;
    const R = budgetRng(t, 11);
    if (c.qn === 2 || c.qn === 4) {
      const old = t.budget.taxEst || 0;
      const d = Math.round((-4.5 + 9 * R() + 2.5 * (t.econ.growth - 1)) * 10) / 10;
      t.budget.taxEst = clamp(old * 0.85 + d, -30, 30);
      const diff = t.budget.taxEst - old;
      if (Math.abs(diff) >= 1) news(g, '🧮 Steuerschätzung (' + (c.qn === 2 ? 'Mai' : 'Herbst') + '): ' + (diff > 0 ? 'Mehreinnahmen' : 'Mindereinnahmen') + ' von ' + num1(Math.abs(diff)) + ' Mrd. € im Jahr für den Bund.', diff > 0 ? 'good' : 'warn');
    }
    if (c.qn === 2 && R() < 0.35) {
      const x = TD.BUDGET_SHOCKS[Math.floor(R() * TD.BUDGET_SHOCKS.length)];
      t.budget.oneoff += x.cost;
      news(g, '💸 Unerwartete Kosten: ' + x.text + ' – ' + num1(x.cost) + ' Mrd. € außerplanmäßig.', 'warn');
    }
  }
  // Eckwerte: Jedes Jahr melden andere Ministerien zusätzlichen Bedarf an.
  function ministryWishes(g) {
    const t = g.term;
    const areas = TD.AREAS.filter(a => !a.fixed);
    const R = budgetRng(t, 23);
    const a1 = areas[Math.floor(R() * areas.length)];
    const rest = areas.filter(a => a.id !== a1.id);
    const a2 = rest[Math.floor(R() * rest.length)];
    return [a1, a2].map(a => ({ a: a.id, amt: Math.round(a.base * 0.05 * (t.econ.gdp / TD.ECON0.gdp) * 10) / 10 }));
  }

  // Eine Stufe weiter (dir = +1/−1) auf der Skala BUDGET_STEPS, mit Untergrenze je Bereich (Rentenzuschuss gesetzlich).
  function stepShift(area, v, dir) {
    const S = TD.BUDGET_STEPS;
    const i = S.indexOf(v) === -1 ? S.indexOf(0) : S.indexOf(v);
    const min = (areaById(area) && areaById(area).min) || S[0];
    return Math.max(min, S[clamp(i + dir, 0, S.length - 1)]);
  }
  function aiBudgetPlan(g) {
    const t = g.term;
    const plan = Object.assign({}, t.budget.plan);
    const prefs = [t.chanc, budgetDrafter(t)];
    prefs.forEach(p => {
      const pr = TD.AREA_PREF[p] || {};
      Object.keys(pr).forEach(a => { if (a in plan) plan[a] = stepShift(a, plan[a] || 0, pr[a]); });
    });
    let tries = 0;
    while (budgetCalc(t, plan).gap > 0 && tries < 20) {
      const cands = Object.keys(plan).filter(a => plan[a] > -10 && stepShift(a, plan[a], -1) < plan[a] && ((TD.AREA_PREF[t.chanc] || {})[a] || 0) <= 0)
        .sort((a, b) => areaById(b).base - areaById(a).base);
      if (!cands.length) break;
      const ca = cands[tries % cands.length];
      plan[ca] = stepShift(ca, plan[ca], -1);
      tries += 1;
    }
    return plan;
  }

  // Spieler-Entwurf setzen (Werte aus BUDGET_STEPS).
  function setBudgetDraft(g, plan, notlage, measures) {
    const t = g.term;
    if (!t.budget.draft || t.budget.draft.done) return { ok: false, text: 'Gerade steht kein Haushaltsentwurf an.' };
    const clean = {};
    Object.keys(t.budget.plan).forEach(a => { const v = plan && plan[a] !== undefined ? Number(plan[a]) : t.budget.plan[a]; clean[a] = TD.BUDGET_STEPS.indexOf(v) !== -1 ? Math.max(v, (areaById(a) && areaById(a).min) || -100) : 0; });
    t.budget.draft.plan = clean;
    t.budget.draft.measures = (measures || []).filter(id => konsol(id) && !(t.budget.measures || {})[id]);
    // Partner reagieren auf die Maßnahmen im Haushaltsbegleitgesetz.
    t.gov.filter(p => p !== g.party).forEach(p => t.budget.draft.measures.forEach(id => { const pr = (konsol(id).pref || {})[p] || 0; t.mood = clamp(t.mood + 3 * pr, 0, 100); }));
    t.budget.draft.notlage = !!notlage;
    t.budget.draft.done = true;
    // Partner reagieren auf Kürzungen und Aufstockungen in ihren Lieblingsbereichen.
    t.gov.filter(p => p !== g.party).forEach(p => {
      const pr = TD.AREA_PREF[p] || {};
      let d = 0;
      Object.keys(pr).forEach(a => { d += pr[a] * ((clean[a] || 0) - (t.budget.plan[a] || 0)) / 5; });
      t.mood = clamp(t.mood + clamp(d * 2, -12, 6), 0, 100);
    });
    if (notlage) news(g, 'Die Bundesregierung will für ' + t.budget.draft.year + ' eine Notlage nach Art. 115 Abs. 2 GG erklären, um die Schuldenbremse auszusetzen.', 'warn');
    const b = budgetCalc(t, clean, t.budget.draft.measures);
    news(g, 'Kabinett beschließt den Haushaltsentwurf ' + t.budget.draft.year + ': Neuverschuldung ' + f1(b.deficit) + ' Mrd. €, erlaubt ' + f1(b.limit) + ' Mrd. €' + (b.gap > 0 && !notlage ? ' – die Schuldenbremse wird gerissen!' : '.'), b.gap > 0 && !notlage ? 'warn' : 'info');
    return { ok: true };
  }

  function budgetVote(g) {
    const t = g.term;
    cat('haushalt');
    const draft = t.budget.draft;
    if (!draft) return;
    const b = budgetCalc(t, draft.plan, draft.measures);
    let yes = 0;
    let no = 0;
    const detail = {};
    const absts = {};
    const fails = t.budget.fails || 0;
    const deals = [];
    CONTEST.forEach(p => {
      const s = t.seats[p] || 0;
      if (!s) return;
      let y = 0;
      let a = 0;
      if (t.gov.indexOf(p) !== -1) {
        // Unzufriedene Partner stimmen bei schlechtem Klima nicht geschlossen zu.
        const pr = TD.AREA_PREF[p] || {};
        let d = 0;
        Object.keys(pr).forEach(a => { d += pr[a] * ((draft.plan[a] || 0) - (t.budget.plan[a] || 0)) / 5; });
        (draft.measures || []).forEach(id => { d += 2 * ((konsol(id).pref || {})[p] || 0); });
        const unhappy = p !== g.party && t.mood < 25 && d < -1;
        y = unhappy ? Math.round(s * 0.4) : Math.round(s * (p === g.party ? 0.99 : 0.97));
      } else if (p === g.party) {
        const c = t.voteChoice.budget || 'nein';
        y = c === 'ja' ? s : 0;
        a = c === 'enthaltung' ? s : 0;
      } else if (fails > 0 && p !== 'afd' && rand(g) < (Math.abs(leanOf(g, p, 'finanzen') - leanOf(g, t.chanc, 'finanzen')) <= 1 ? Math.min(0.8, 0.3 * fails + (t.budget.talks ? 0.3 : 0))
        : fails >= 2 ? Math.min(0.5, 0.12 * fails + (t.budget.talks ? 0.15 : 0)) : 0)) {
        // Nach einem gescheiterten Haushalt verhandelt die Regierung: Gemäßigte Opposition enthält sich gegen Zugeständnisse;
        // nach mehreren Anläufen auch weiter entfernte demokratische Parteien (staatspolitische Verantwortung, geschätzt).
        a = s; t.budget.oneoff += 2; deals.push(p);
      } else if (t.duldung === p) {
        y = s; // Duldung
      } else if (t.tolerated && p === 'afd' && t.gov.every(q => E.fwLevel(g, q) >= 2)) {
        y = s; // Tolerierung
      } else if (t.tolerated && rand(g) < 0.5 && Math.abs(leanOf(g, p, 'finanzen') - leanOf(g, t.chanc, 'finanzen')) <= 1 && p !== 'afd') {
        y = s; // Minderheitsregierung kauft sich Zustimmung
        t.budget.oneoff += 3;
      }
      detail[p] = y;
      absts[p] = a;
      yes += y;
      no += s - y - a;
    });
    if (deals.length) news(g, 'Haushaltsverhandlungen: ' + deals.map(sname).join(' und ') + (deals.length > 1 ? ' enthalten' : ' enthält') + ' sich – gegen Zugeständnisse im Etat.', 'info');
    t.budget.talks = false;
    const pass = yes > no;
    t.budget.vote = { year: draft.year, yes, no, pass, detail, q: t.q };
    chron(g, 'haushalt', 'Haushalt ' + draft.year + (pass ? ' beschlossen' : ' scheitert im Bundestag') + ' (' + yes + ' Ja, ' + no + ' Nein).');
    {
      const det = {};
      CONTEST.forEach(p => { const s = t.seats[p] || 0; det[p] = { yes: detail[p] || 0, no: s - (detail[p] || 0) - (absts[p] || 0), abst: absts[p] || 0 }; });
      const my = (t.seats[g.party] || 0) > 0 ? (isGov(t.role) ? 'ja' : t.voteChoice.budget || 'nein') : null;
      const abst = Object.keys(absts).reduce((x, p) => x + absts[p], 0);
      const rec = { kind: 'bt', title: 'Haushaltsgesetz ' + draft.year + (fails ? ' (' + (fails + 1) + '. Anlauf)' : ''), detail: det, yes, no, abst, pass, method: Math.abs(yes - no) <= 4 ? 'hammel' : 'hand', decisive: false, names: [], my, q: t.q };
      archiveVote(g, rec, null);
      (t.reel = t.reel || []).push(rec);
    }
    if (pass) {
      t.budget.fails = 0;
      budgetGroupEffects(g, t.budget.plan, draft.plan);
      enactMeasures(g, draft.measures || []);
      t.budget.next = { plan: draft.plan, notlage: draft.notlage };
      t.budget.draft = null;
      if (isGov(t.role)) t.stats.budgets += 1;
      news(g, 'Der Bundestag beschließt den Haushalt ' + draft.year + ' (' + yes + ' Ja, ' + no + ' Nein).', 'good');
      // Verfassungsbruch? Die Opposition kann klagen.
      if (b.gap > 0.5 || draft.notlage) {
        const crisis = t.q - t.crisisQ <= 4;
        const chance = draft.notlage ? (crisis ? 0.2 : 0.75) : 0.9;
        aiKlage(g, { kind: 'budget', chance, text: 'Haushalt ' + draft.year });
      }
    } else {
      const again = t.budget.status === 'vorlaeufig';
      t.budget.status = 'vorlaeufig';
      t.budget.fails = fails + 1;
      // Regiert ihr: Wie geht es weiter? Regiert die KI: Nach dem zweiten Scheitern droht die Vertrauensfrage (Vorbild Ampel 2024).
      if (isGov(t.role) && (t.role === 'kanzler' || budgetDrafter(t) === g.party)) t.pending.push({ type: 'haushaltskrise', fails: t.budget.fails });
      else if (t.budget.fails >= 2 && rand(g) < 0.4) {
        news(g, 'Nach dem erneut gescheiterten Haushalt stellt ' + (t.chancellor ? t.chancellor.name : 'die Regierung') + ' die Vertrauensfrage – und verliert sie absichtlich. Neuwahlen!', 'big');
        endTerm(g, 'Neuwahl nach gescheitertem Haushalt');
        return;
      }
      news(g, 'Der Haushalt ' + draft.year + ' fällt im Bundestag durch (' + yes + ' Ja, ' + no + ' Nein). Vorläufige Haushaltsführung!', 'bad');
      t.gov.forEach(p => addNat(g, p, again ? -0.1 : -0.3));
      t.mood = clamp(t.mood - (again ? 3 : 8), 0, 100);
      // Neuer Anlauf: Wer den Entwurf aufstellt, muss nachbessern (die KI kommt den Partnern entgegen).
      if (playerDraftsBudget(g)) draft.done = false;
      else {
        draft.plan = aiBudgetPlan(g);
        t.gov.forEach(p => { const pr = TD.AREA_PREF[p] || {}; Object.keys(pr).forEach(a => { if (pr[a] > 0 && a in draft.plan) draft.plan[a] = stepShift(a, draft.plan[a], 1); }); });
      }
      if (isGov(t.role)) t.stats.failed += 1;
    }
  }

  // ---------- Gesetzgebung ----------
  function inPipeline(t, key) {
    return t.laws.some(l => ['kabinett', 'kabinett_wait', 'veto', 'bundestag', 'bundesrat', 'vermittlung'].indexOf(l.stage) !== -1 &&
      (l.kind === 'tax' ? 'tax:' + l.tax : l.topic) === key);
  }

  // Welche Gesetze darf die eigene Partei einbringen? Kanzlerpartei alle, Juniorpartner nur aus eigenen Ressorts.
  function lawOptions(g) {
    const t = g.term;
    if (!isGov(t.role)) return { topics: [], taxes: [] };
    const own = ownMinistries(t, g.party);
    const topics = [];
    A.TOPIC_IDS.forEach(topic => {
      const min = TD.TOPIC_MINISTRY[topic];
      const mine = own.indexOf(min) !== -1;
      if (t.role !== 'kanzler' && !mine) return;
      if (inPipeline(t, topic)) return;
      const blocked = {};
      const opts = D.PROGRAM[topic].map((o, i) => i).filter(i => {
        if (i === t.policy[topic]) return false;
        const why = lawBlock(g, { kind: 'topic', topic, opt: i }, g.party);
        if (why) blocked[i] = why;
        return !why;
      });
      if (opts.length || Object.keys(blocked).length) topics.push({ topic, ministry: min, own: mine, opts, blocked, current: t.policy[topic], contract: t.contract[topic] });
    });
    upgradeTaxes(t);
    const taxes = (t.role === 'kanzler' || own.indexOf('finanzen') !== -1) ? TD.TAXES.filter(x => !inPipeline(t, 'tax:' + x.id)).map(x => {
      const cur = t.taxes[x.id];
      const up = lawBlock(g, { kind: 'tax', tax: x.id, level: Math.min(x.max, cur + x.step) }, g.party);
      const down = lawBlock(g, { kind: 'tax', tax: x.id, level: Math.max(x.min, cur - x.step) }, g.party);
      return { tax: x.id, current: cur, min: up && up.indexOf('Widerspricht') === 0 ? cur : x.min, max: down && down.indexOf('Widerspricht') === 0 ? cur : x.max,
        blockedUp: up && up.indexOf('Widerspricht') === 0 ? up : null, blockedDown: down && down.indexOf('Widerspricht') === 0 ? down : null };
    }) : [];
    return { topics, taxes };
  }

  // Glaubwürdige Gesetzgebung: Kein Gesetz wird in einer Legislaturperiode zweimal beschlossen, und keine Partei bringt
  // einen Entwurf ein, der ihrem eigenen früheren Entwurf zum selben Thema widerspricht (Richtung rückwärts).
  // Optionen sind nach Richtung geordnet (Programm: links → rechts, Steuern: Stufen), daher genügt der Index.
  function lawBlock(g, spec, by) {
    const t = g.term;
    const p = by || g.party;
    const isTax = spec.kind === 'tax' || spec.tax !== undefined;
    const same = l => (isTax ? l.kind === 'tax' && l.tax === spec.tax && l.level === spec.level : l.kind === 'topic' && l.topic === spec.topic && l.opt === spec.opt);
    const done = t.laws.find(l => l.stage === 'inkraft' && same(l));
    if (done) return 'Schon beschlossen in dieser Legislaturperiode (' + quarterLabel(t, Math.min(done.q1 === undefined ? t.q : done.q1, QUARTERS - 1)) + ').';
    const cur = isTax ? t.taxes[spec.tax] : t.policy[spec.topic];
    const dir = Math.sign((isTax ? spec.level : spec.opt) - cur);
    const mine = t.laws.filter(l => l.by === p && l.dir && (isTax ? l.kind === 'tax' && l.tax === spec.tax : l.kind === 'topic' && l.topic === spec.topic));
    const against = mine.find(l => l.dir === -dir);
    if (dir && against) return 'Widerspricht eurem eigenen Entwurf „' + lawName(against) + '“ aus dieser Legislaturperiode.';
    return null;
  }

  function makeLaw(g, spec, by) {
    const t = g.term;
    const law = { id: ++t.lawSeq, kind: spec.kind === 'tax' ? 'tax' : 'topic', by, stage: 'kabinett', q0: t.q, log: [] };
    if (law.kind === 'tax') { law.tax = spec.tax; law.level = spec.level; law.from = t.taxes[spec.tax]; law.zust = taxById(spec.tax).zust; law.dir = Math.sign(law.level - law.from); }
    else { law.topic = spec.topic; law.opt = spec.opt; law.from = t.policy[spec.topic]; law.zust = TD.ZUST_TOPICS.indexOf(spec.topic) !== -1; law.dir = Math.sign(law.opt - law.from); }
    law.contract = law.kind === 'topic' && t.contract[law.topic] === law.opt;
    t.laws.push(law);
    return law;
  }

  // Wie viele Abgeordnete einer Partei zustimmen (Ja), sich enthalten oder ablehnen.
  // ---------- Offene Abstimmungen ----------
  // Die Prognose ist eine Schätzung der Fraktionsführungen; entschieden wird im Plenum. Dort fehlen Abgeordnete
  // (bei namentlichen Abstimmungen im Bundestag fehlen meist 3–8 %), Einzelne weichen ab – mehr, wenn die eigene
  // Partei in den Umfragen abstürzt oder im eigenen Land bald gewählt wird –, und die Opposition stimmt taktisch.
  // Eine Ziehung (draw) enthält die Zufallsanteile einer echten Abstimmung; ohne Ziehung entsteht die Schätzung.
  function gauss(R) { return (R() + R() + R() - 1.5) * 2; } // ≈ Normalverteilung
  function makeDraw(g, R) {
    const d = { bt: {}, br: {} };
    CONTEST.forEach(p => { d.bt[p] = { z: gauss(R), abs: R(), tact: R() }; });
    Object.keys(g.term.laender).forEach(l => { d.br[l] = R(); });
    return d;
  }
  // Eigener Zufallsgenerator für Prognosen: Sie dürfen den Spielverlauf nicht verändern.
  function localRng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let x = Math.imul(a ^ (a >>> 15), 1 | a);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Wie beliebt ist die neue Regelung? (positiv = populär)
  function lawPop(law) {
    if (law.kind === 'tax') { const x = taxById(law.tax); return -(taxRevAt(x, law.level) - taxRevAt(x, law.from === undefined ? law.level : law.from)) / 25 - 0.1 * Math.max(0, taxShock(law) - 1); }
    return D.PROGRAM[law.topic][law.opt].pop || 0;
  }
  // Rahmen einer Abstimmung: Wahlkampfnähe, bald wählende Länder, Beliebtheit.
  function voteCtx(g, law) {
    const t = g.term;
    const soon = new Set();
    for (let q = t.q; q <= Math.min(QUARTERS - 1, t.q + 1); q++) ltwDue(t, q).forEach(l => soon.add(l));
    return { elect: t.q >= QUARTERS - 4, soon, pop: lawPop(law) };
  }
  function partyVote(g, p, law, draw, ctx) {
    const t = g.term;
    const s = t.seats[p] || 0;
    if (!s) return { yes: 0, abst: 0, no: 0, absent: 0 };
    const dr = draw && draw.bt[p];
    const absent = dr ? Math.round(s * (0.02 + 0.05 * dr.abs)) : 0;
    const n = s - absent;
    const out = (yes, abst) => ({ yes, abst, no: n - yes - abst, absent });
    const d = lawDist(g, p, law);
    if (p === g.party && !isGov(t.role)) {
      const c = t.voteChoice[law.id] || defaultVote(g, law);
      // Auch in der eigenen Fraktion gibt es Einzelne, die anders stimmen – mehr bei Streit und gegen die eigene Linie.
      const off = c === 'ja' ? d : c === 'nein' ? 2 - d : 1;
      const diss = dr ? Math.max(0, Math.round(n * (0.005 + 0.02 * off) * (1.3 - t.party.unity / 100) * (1 + dr.z * 0.6))) : 0;
      if (c === 'ja') return out(n - diss, diss);
      if (c === 'enthaltung') return out(0, n - diss);
      return out(0, diss);
    }
    const cx = ctx || voteCtx(g, law);
    if (t.gov.indexOf(p) !== -1) {
      let rate = d === 2 ? 0.15 : d === 1 ? 0.04 : 0.005;
      if (law.contract) rate /= 2;
      const unity = p === g.party ? t.party.unity : 60;
      rate *= 1.3 - unity / 100;
      if (law.disc && p === g.party) rate *= 0.3;
      if (law.fixed) rate *= 0.8; // nach der Anhörung nachgebessert
      if (law.fraktion) rate *= 1.2; // im Eiltempo, ohne Ressortabstimmung
      if (t.mood < 30) rate *= 1.6;
      if (law.kind === 'topic') rate *= 0.6 + (t.sq[law.topic] === undefined ? SQ0 : t.sq[law.topic]) / 100; // starker Status quo = mehr Widerstand
      if (law.ghost || (law.backers && law.backers.length)) rate *= 0.6; // Verbände werben bei Abgeordneten
      if (law.foe && (t.lobbyCampaigns || []).some(c => c.law === law.id && c.left > 0)) rate *= 1.3;
      // Nervöse Abgeordnete: Absturz in den Umfragen, unbeliebtes Gesetz vor einer Landtagswahl.
      const drop = (t.start[p] || 0) - ((t.lastNat && t.lastNat[p]) || t.start[p] || 0);
      if (drop > 3) rate *= Math.min(1.6, 1 + 0.08 * (drop - 3));
      if (cx.pop < 0 && cx.soon.size) rate *= 1.25;
      let no = n * rate;
      if (dr) no += dr.z * Math.sqrt(n * rate * (1 - rate) + 1);
      no = clamp(Math.round(no) - ((law.conv && law.conv[p]) || 0), 0, n); // umgestimmte Abweichler
      return out(n - no, 0);
    }
    if (t.duldung === p && t.gov.indexOf(law.by) !== -1 && d <= 1) return out(n, 0); // Duldung
    // Opposition: im Wahljahr auf Konfrontation, bei populären Sachfragen manchmal überraschend dafür.
    const tact = dr ? dr.tact : 0.5;
    if (d === 0) {
      const sh = clamp(0.92 - (cx.elect ? 0.3 : 0) + (dr ? (tact - 0.5) * 0.3 : 0), 0.3, 1);
      return out(Math.round(n * sh), n - Math.round(n * sh));
    }
    if (d === 1) {
      if (dr && !cx.elect && cx.pop > 0.2 && tact > 0.88) { const y = Math.round(n * 0.7); return out(y, n - y); }
      const a = Math.round(n * (dr ? 0.25 + 0.5 * tact : 0.5));
      return out(0, a);
    }
    if (dr && cx.pop > 0.3 && tact > 0.95) return out(0, Math.round(n * 0.3));
    return out(0, 0);
  }
  function defaultVote(g, law) {
    const d = lawDist(g, g.party, law);
    return d === 0 ? 'ja' : d === 1 ? 'enthaltung' : 'nein';
  }
  function bundestagVote(g, law, draw) {
    const t = g.term;
    let yes = 0; let no = 0; let abst = 0; let absent = 0;
    const detail = {};
    const ctx = voteCtx(g, law);
    CONTEST.forEach(p => {
      const v = partyVote(g, p, law, draw, ctx);
      detail[p] = v;
      yes += v.yes; no += v.no; abst += v.abst; absent += v.absent;
    });
    const pass = yes > no;
    const afdYes = detail.afd ? detail.afd.yes : 0;
    const afdDecisive = pass && t.gov.indexOf('afd') === -1 && afdYes > 0 && yes - afdYes <= no + afdYes;
    return { yes, no, abst, absent, pass, detail, afdDecisive };
  }
  // Landesinteressen (geschätzt): Richtung, die ein Land bei einem Thema bevorzugt (+1/−1) – Kohle- und
  // Industrieländer bremsen beim Klima, Agrarländer bei Auflagen, Autoländer beim Tempolimit, der Osten will
  // weniger Zuwanderung, Stadtstaaten mehr Mieterschutz; Bildung ist Ländersache (Kulturhoheit).
  const LAND_INTEREST = {
    klima: { NW: 1, BB: 1, SN: 1, ST: 1, SL: 1 },
    land: { NI: 1, BY: 1, MV: 1, ST: 1, BB: 1, SH: 1 },
    verkehr: { BY: 1, BW: 1, NI: 1 },
    migration: { SN: 1, TH: 1, ST: 1, MV: 1, BB: 1, BE: -1, HB: -1, HH: -1 },
    wohnen: { BE: -1, HH: -1, HB: -1 },
    bildung: { BW: 1, BY: 1, SN: 1, HE: 1, NW: 1, NI: 1, RP: 1, SL: 1, SH: 1, BE: 1, BB: 1, HB: 1, HH: 1, MV: 1, ST: 1, TH: 1 }
  };
  const POOR_LANDS = ['HB', 'SL', 'BE', 'MV', 'ST', 'TH', 'SN', 'BB'];
  // Ein Land stimmt nur zu, wenn alle Regierungsparteien dort einverstanden sind (sonst Enthaltung = Nein).
  function partyBackslaw(g, p, law) {
    const t = g.term;
    if (t.gov.indexOf(p) !== -1) return true;
    const d = lawDist(g, p, law);
    // Wankt der Status quo, geben Länder mit nur kleinen Bedenken nach.
    return d === 0 || (d === 1 && (law.brDeal || (law.kind === 'topic' && t.sq[law.topic] < 25)));
  }
  // Warum ein Land von der Parteilinie abweicht (null = folgt ihr): Landesinteresse, Kosten, nahe Landtagswahl.
  function landTwist(g, l, law, base, x, ctx) {
    const topic = lawTopic(law);
    const L = lawLean(law);
    const want = (LAND_INTEREST[topic] || {})[l] || 0;
    const cost = law.kind === 'topic' ? D.PROGRAM[topic][law.opt].cost || 0 : 0;
    if (base) {
      if (want && L && Math.sign(want) !== Math.sign(L) && x < 0.25) return { ok: false, why: 'Landesinteresse' };
      if (law.zust && cost >= 2 && POOR_LANDS.indexOf(l) !== -1 && !law.brDeal && x < 0.2) return { ok: false, why: 'Kosten für das Land' };
      if (ctx.soon.has(l) && ctx.pop < 0 && x < 0.3) return { ok: false, why: 'Landtagswahl steht bevor' };
      return null;
    }
    if (want && L && Math.sign(want) === Math.sign(L) && x > 0.75) return { ok: true, why: 'Landesinteresse' };
    return null;
  }
  function bundesratVote(g, law, draw) {
    const t = g.term;
    const lands = {};
    const votes = {};
    const why = {};
    const ctx = voteCtx(g, law);
    let yes = 0;
    Object.keys(t.laender).forEach(l => {
      const L = t.laender[l];
      const blocked = law.blocked && law.blocked.indexOf(l) !== -1;
      const bought = !blocked && law.bought && law.bought.indexOf(l) !== -1;
      let ok = !blocked && (bought || L.gov.every(p => partyBackslaw(g, p, law)));
      if (blocked) why[l] = 'Länder-Front der Opposition';
      else if (!bought) {
        const tw = landTwist(g, l, law, ok, draw ? draw.br[l] : 0.5, ctx);
        if (tw) { ok = tw.ok; why[l] = tw.why; }
      }
      lands[l] = ok;
      // Uneinige Landeskoalitionen enthalten sich – im Bundesrat wirkt das wie ein Nein.
      votes[l] = ok ? 'ja' : (why[l] || L.gov.some(p => partyBackslaw(g, p, law))) ? 'enth' : 'nein';
      if (ok) yes += L.votes;
    });
    return { yes, pass: yes >= TD.BUNDESRAT_MAJ, lands, votes, why };
  }
  // Prognose mit Unsicherheit: viele mögliche Ausgänge durchgespielt (eigener Zufall, ohne Wirkung aufs Spiel).
  function forecast(g, law, n) {
    const t = g.term;
    const N = n || 40;
    const R = localRng(law.id * 7919 + t.q * 104729 + (law.stage === 'bundesrat' ? 31 : 17));
    const est = bundestagVote(g, law);
    const ys = [];
    const ns = [];
    let pass = 0;
    let brPass = 0;
    const brFlip = {};
    const brBase = law.zust || law.stage === 'bundesrat' ? bundesratVote(g, law) : null;
    const brOk = v => (law.zust ? v.pass : 69 - v.yes < TD.BUNDESRAT_MAJ);
    for (let i = 0; i < N; i++) {
      const dw = makeDraw(g, R);
      const v = bundestagVote(g, law, dw);
      ys.push(v.yes);
      ns.push(v.no);
      if (v.pass) pass += 1;
      if (brBase) {
        const b = bundesratVote(g, law, dw);
        if (brOk(b)) brPass += 1;
        Object.keys(b.lands).forEach(l => { if (b.lands[l] !== brBase.lands[l]) brFlip[l] = (brFlip[l] || 0) + 1; });
      }
    }
    const pc = (arr, q) => arr.slice().sort((a, b) => a - b)[Math.min(arr.length - 1, Math.floor(q * arr.length))];
    const govNo = t.gov.reduce((s, p) => s + ((est.detail[p] && est.detail[p].no) || 0), 0);
    return {
      yes: est.yes, no: est.no, abst: est.abst, yesLo: pc(ys, 0.1), yesHi: pc(ys, 0.9), noLo: pc(ns, 0.1), noHi: pc(ns, 0.9),
      chance: pass / N, unsure: Math.max(govNo, pc(ys, 0.9) - pc(ys, 0.1)),
      br: brBase ? { yes: brBase.yes, chance: brPass / N, wobbly: Object.keys(brFlip).filter(l => brFlip[l] >= N * 0.15) } : null
    };
  }
  // Gründe für Abweichungen nach einer echten Abstimmung: für die Live-Auszählung und das Protokoll.
  function voteReasons(g, law, v) {
    const t = g.term;
    const out = [];
    if (v.absent) out.push(v.absent + ' Abgeordnete fehlen (krank, Termine im Wahlkreis, Dienstreise)');
    const ctx = voteCtx(g, law);
    t.gov.forEach(p => {
      const x = v.detail[p];
      if (!x || x.no < 2) return;
      const drop = (t.start[p] || 0) - ((t.lastNat && t.lastNat[p]) || t.start[p] || 0);
      const why = ctx.pop < 0 && ctx.soon.size ? 'Angst vor der Landtagswahl in ' + Array.from(ctx.soon).map(l => E.stateById(l).name).join(' und ') :
        drop > 3 ? 'Nervosität nach dem Absturz in den Umfragen' : lawDist(g, p, law) === 2 ? 'das Gesetz widerspricht der Parteilinie' : 'Bedenken einzelner Abgeordneter';
      out.push(x.no + ' Abweichler bei ' + sname(p) + ' – ' + why);
    });
    CONTEST.filter(p => t.gov.indexOf(p) === -1 && p !== g.party).forEach(p => {
      const x = v.detail[p];
      const d = lawDist(g, p, law);
      if (x && d === 1 && x.yes > 0) out.push(sname(p) + ' stimmt überraschend zu – „in der Sache richtig“');
      else if (x && d === 0 && ctx.elect && x.abst > x.yes / 2) out.push(sname(p) + ' enthält sich trotz Nähe – es ist Wahljahr');
    });
    return out;
  }
  function predict(g, law) {
    if (law.stage === 'bundesrat' || law.stage === 'vermittlung') return { br: bundesratVote(g, law) };
    return { bt: bundestagVote(g, law), br: law.zust ? bundesratVote(g, law) : null };
  }

  // Kabinett: Partner prüfen den Entwurf.
  function cabinetStage(g, law) {
    const t = g.term;
    if (law.by === g.party) {
      let veto = null;
      t.gov.filter(p => p !== g.party).forEach(p => {
        const d = lawDist(g, p, law);
        if (law.contract || d === 0) return;
        if (d === 1) { t.mood = clamp(t.mood - 2, 0, 100); law.log.push(sname(p) + ' murrt, trägt den Entwurf aber mit.'); return; }
        veto = veto || p;
      });
      // Eingriff in ein fremdes Ressort
      const min = law.kind === 'tax' ? 'finanzen' : TD.TOPIC_MINISTRY[law.topic];
      const holder = t.cabinet[min] && t.cabinet[min].party;
      if (holder && holder !== g.party) { t.mood = clamp(t.mood - 3, 0, 100); law.log.push('Das ' + ministryById(min).short + '-Ressort (' + sname(holder) + ') fühlt sich übergangen.'); }
      if (veto) {
        law.stage = 'veto';
        law.vetoBy = veto;
        t.pending.push({ type: 'veto', law: law.id });
        news(g, sname(veto) + ' blockiert im Kabinett: „' + lawName(law) + '“.', 'warn');
        return;
      }
      law.stage = 'bundestag';
      if (law.fraktion) { law.log.push('Die Koalitionsfraktionen bringen den Entwurf gemeinsam ein (' + quarterLabel(t) + ').'); news(g, 'Fraktionsentwurf im Bundestag: „' + lawName(law) + '“ – im Eiltempo.', 'info'); return; }
      law.log.push('Kabinett beschließt den Entwurf (' + quarterLabel(t) + ').');
      news(g, 'Kabinett beschließt: „' + lawName(law) + '“. Der Bundesrat nimmt Stellung, dann ist der Bundestag dran.', 'info');
      return;
    }
    law.stage = 'bundestag';
    law.log.push('Kabinett beschließt den Entwurf.');
  }

  // Gesetzgebungsverfahren nach Grundgesetz und Geschäftsordnungen:
  // Regierungsentwurf: Referentenentwurf → Ressortabstimmung → Länder- und Verbändeanhörung → Kabinettsbeschluss
  // → Bundesrat 1. Durchgang (Stellungnahme, Art. 76 Abs. 2 GG) → 1. Lesung → Ausschuss mit Anhörung → 2./3. Lesung
  // → Bundesrat 2. Durchgang (Zustimmung oder Einspruch, Art. 77/78 GG) → ggf. Vermittlungsausschuss → ggf. Überstimmung
  // des Einspruchs mit Kanzlermehrheit → Ausfertigung durch den Bundespräsidenten (Art. 82 GG) → Verkündung im BGBl.
  // Fraktionsentwürfe („aus der Mitte des Bundestages“) beginnen direkt mit der 1. Lesung.
  const LAW_STEPS = {
    kabinett: ['Referentenentwurf', 'Ressortabstimmung', 'Länder- und Verbändeanhörung', 'Kabinettsbeschluss'],
    bundestag: ['Bundesrat, 1. Durchgang', '1. Lesung', 'Ausschuss mit Anhörung', '2./3. Lesung'],
    bundesrat: ['Bundesrat, 2. Durchgang'],
    vermittlung: ['Vermittlungsausschuss'],
    einspruch: ['Einspruch des Bundesrates', 'Abstimmung über die Zurückweisung'],
    inkraft: ['Ausfertigung durch den Bundespräsidenten', 'Verkündung im Bundesgesetzblatt']
  };
  // ---------- Abstimmungskrimi ----------
  // Vor knappen Abstimmungen meldet die Fraktionsführung Wackelkandidaten – mit Namen, Wahlkreis und Grund.
  const WOBBLE = [
    { id: 'gewissen', text: 'hat Gewissensbedenken', offer: 'Gewissensentscheidung respektieren', hint: 'Sie stimmen dagegen – aber ihr wirkt glaubwürdig' },
    { id: 'wahlkreis', text: 'fürchtet Gegenwind im Wahlkreis', offer: 'Förderprojekt im Wahlkreis zusagen', hint: '0,3 Mrd. € – wenn es herauskommt, heißt es „Kuhhandel“' },
    { id: 'karriere', text: 'fühlt sich bei der Postenvergabe übergangen', offer: 'Einen Posten in Aussicht stellen', hint: 'Wirkt sicher – aber andere werden neidisch' },
    { id: 'land', text: 'steht unter Druck des Landesverbands', offer: 'Den Landesverband einbinden', hint: 'Die meisten lenken ein, der Landesverband wird gestärkt' }
  ];
  function mpOf(g, p, land) {
    const list = E.WK_LIST.filter(w => !land || w.land === land);
    for (let i = 0; i < 12; i++) {
      const w = list[Math.floor(rand(g) * list.length)];
      const name = E.wkCandidate(g, w.nr, p);
      if (name && !/\d/.test(name)) return { name, wk: w.name, land: w.land };
    }
    const w = list[0];
    return { name: newPerson(g, p, w.land).full, wk: w.name, land: w.land };
  }
  function mpName(g, land) {
    const L = g.term.laender[land];
    if (!L.mp || L.mpParty !== L.gov[0]) { L.mp = mpOf(g, L.gov[0], land).name; L.mpParty = L.gov[0]; }
    return L.mp;
  }
  function whipGroups(g, law) {
    const t = g.term;
    const v = bundestagVote(g, law);
    const dissent = t.gov.reduce((s, p) => s + v.detail[p].no, 0);
    // Kritisch ist die eigene Mehrheit der Koalition – eine Mehrheit nur dank der Opposition gilt als Blamage.
    const govYes = t.gov.reduce((s, p) => s + v.detail[p].yes, 0);
    const critical = govSeats(t) >= MAJ ? govYes < MAJ + 6 : v.yes - v.no < 2 * dissent + 16; // Minderheitsregierung: Hauptsache durch
    if (dissent < 2 || !critical) return null;
    const groups = [];
    const own = v.detail[g.party] ? v.detail[g.party].no : 0;
    if (own >= 2) {
      const a = Math.ceil(own / 2);
      [a, own - a].filter(n => n > 0).forEach(n => { const m = mpOf(g, g.party); groups.push(Object.assign({ p: g.party, n, reason: pick(g, WOBBLE).id }, m)); });
    }
    t.gov.filter(p => p !== g.party && v.detail[p].no >= 2).slice(0, 1).forEach(p => groups.push(Object.assign({ p, n: v.detail[p].no, reason: 'partner' }, mpOf(g, p))));
    return groups.length ? { groups, yes: v.yes, no: v.no } : null;
  }
  function brSwing(g, law) {
    const t = g.term;
    const v = bundesratVote(g, law);
    if (law.zust ? v.pass : 69 - v.yes < TD.BUNDESRAT_MAJ) return null;
    const lands = Object.keys(t.laender).filter(l => !v.lands[l] && t.laender[l].gov.filter(p => !partyBackslaw(g, p, law)).every(p => lawDist(g, p, law) <= 1))
      .sort((x, y) => t.laender[y].votes - t.laender[x].votes).slice(0, 2)
      .map(l => ({ land: l, votes: t.laender[l].votes, mp: mpName(g, l), party: t.laender[l].gov[0], block: t.laender[l].gov.filter(p => !partyBackslaw(g, p, law)) }));
    return lands.length ? { lands, yes: v.yes } : null;
  }
  function resolveWhip(g, item, choice) {
    const t = g.term;
    const law = t.laws.find(l => l.id === item.law);
    const gr = item.groups[item.i];
    const conv = n => { law.conv = law.conv || {}; law.conv[gr.p] = (law.conv[gr.p] || 0) + n; };
    const who = gr.name + ' (' + gr.wk + ') und ' + (gr.n - 1) + ' weitere';
    let text;
    if (gr.reason === 'partner') {
      if (choice === 0) {
        if (rand(g) < clamp(t.mood / 100 + 0.2, 0.2, 0.9)) { conv(gr.n); text = 'Die Spitze von ' + sname(gr.p) + ' holt ihre Leute zurück.'; } else { conv(Math.floor(gr.n / 3)); text = sname(gr.p) + ' bekommt die eigene Fraktion nur teilweise in den Griff.'; }
        t.mood = clamp(t.mood - 2, 0, 100);
      } else if (choice === 1) { conv(gr.n); t.budget.oneoff += 0.5; text = 'Ein Zugeständnis in anderer Sache (0,5 Mrd. €) – ' + sname(gr.p) + ' stimmt geschlossen.'; }
      else text = 'Ihr lasst es darauf ankommen.';
    } else {
      const w = WOBBLE.find(x => x.id === gr.reason);
      if (choice === 0) {
        if (rand(g) < clamp(0.45 + (t.party.unity - 50) / 200 + (law.contract ? 0.1 : 0), 0.15, 0.85)) { conv(gr.n); text = 'Das Gespräch unter vier Augen wirkt: ' + gr.name + ' stimmt zu.'; }
        else { conv(Math.floor(gr.n / 3)); text = gr.name + ' bleibt skeptisch – nur wenige lassen sich überzeugen.'; }
      } else if (choice === 1) {
        if (w.id === 'gewissen') { t.party.unity = clamp(t.party.unity + 1, 0, 100); addCred(g, 1, 'Gewissensfreiheit respektiert'); text = 'Ihr respektiert die Gewissensentscheidung.'; }
        else if (w.id === 'wahlkreis') { conv(gr.n); t.budget.oneoff += 0.3; text = 'Das Förderprojekt kommt – ' + gr.name + ' stimmt zu.'; if (rand(g) < 0.3) { addCred(g, -2, 'Stimmen gegen Förderprojekt gekauft'); news(g, 'Bericht: Zustimmung zu „' + lawName(law) + '“ mit Förderprojekt im Wahlkreis ' + gr.wk + ' erkauft.', 'warn'); } }
        else if (w.id === 'karriere') { conv(gr.n); t.party.unity = clamp(t.party.unity - 1, 0, 100); text = gr.name + ' stimmt zu – und rechnet fest mit dem Posten.'; if (rand(g) < 0.25) addCred(g, -1, 'Postenversprechen für eine Stimme'); }
        else { conv(Math.ceil(gr.n * 0.7)); if (t.party.lv[gr.land] !== undefined) t.party.lv[gr.land] = clamp(t.party.lv[gr.land] + 3, 0, 100); text = 'Der Landesverband ' + E.stateById(gr.land).name + ' lenkt ein.'; }
      } else {
        if (rand(g) < 0.75) { conv(gr.n); t.party.unity = clamp(t.party.unity - 3, 0, 100); text = 'Die Fraktionsführung macht Druck – die Reihen schließen sich, aber es grummelt.'; }
        else { t.party.unity = clamp(t.party.unity - 5, 0, 100); addCred(g, -1); news(g, gr.name + ' beklagt öffentlich Druck der Fraktionsführung.', 'warn'); text = gr.name + ' geht an die Presse: „Ich lasse mich nicht erpressen.“'; }
      }
    }
    law.log.push('Vor der Abstimmung: ' + who + ' – ' + text);
    item.i += 1;
    if (item.i >= item.groups.length) { const f = forecast(g, law); text += ' Neue Schätzung der Fraktionsführung: ' + f.yesLo + '–' + f.yesHi + ' Ja, ' + f.noLo + '–' + f.noHi + ' Nein – Chance ' + Math.round(f.chance * 100) + ' %.'; }
    return text;
  }
  function resolveBrWhip(g, item, choice) {
    const t = g.term;
    const law = t.laws.find(l => l.id === item.law);
    const x = item.lands[item.i];
    const name = E.stateById(x.land).name;
    let text;
    if (choice === 0) { law.bought = (law.bought || []).concat(x.land); t.budget.oneoff += 1; text = x.mp + ' bekommt eine Finanzzusage für ' + name + ' (1 Mrd. €) – ' + x.votes + ' Stimmen dafür.'; kuhhandel(g, 1); }
    else if (choice === 3) {
      // Parteischiene: Die Regierungschefin/der Regierungschef aus einer Bundesregierungspartei drängt den Partner im Land.
      const L = t.laender[x.land];
      if (rand(g) < clamp(0.5 + (t.mood - 50) / 200, 0.25, 0.8)) { law.bought = (law.bought || []).concat(x.land); L.strain = clamp((L.strain || 20) + 6, 0, 100); text = x.mp + ' setzt sich im Koalitionsausschuss durch – ' + name + ' stimmt zu.'; }
      else { L.strain = clamp((L.strain || 20) + 15, 0, 100); text = x.mp + ' scheitert am Koalitionspartner – in ' + name + ' knirscht es jetzt gewaltig.'; }
    }
    else if (choice === 1) { law.bought = (law.bought || []).concat(x.land); law.brDeal = true; text = 'Ein Zugeständnis im Gesetz überzeugt ' + x.mp + ' – das Gesetz wird etwas verwässert.'; }
    else text = name + ' bleibt bei seiner Haltung.';
    law.log.push('Vor dem Bundesrat: ' + text);
    item.i += 1;
    if (item.i >= item.lands.length) { const f = forecast(g, law); text += ' Neue Schätzung: ' + bundesratVote(g, law).yes + ' von 69 Stimmen' + (f.br ? ', Chance ' + Math.round(f.br.chance * 100) + ' %' : '') + '.'; }
    return text;
  }

  // ---------- Abstimmungen: Protokoll, Live-Auszählung, Archiv ----------
  // Wie wichtig ist eine Abstimmung für euch? Wichtige werden live ausgezählt, alle landen im Archiv.
  function voteMatters(g, law, margin, decisive) {
    const t = g.term;
    return law.by === g.party || law.gewissen || decisive || margin < 60 || (t.role === 'kanzler' && t.gov.indexOf(law.by) !== -1);
  }
  function myVote(g, law, v) {
    const t = g.term;
    const d = v.detail[g.party];
    if (!d) return null;
    if (isGov(t.role)) return 'ja';
    return t.voteChoice[law.id] || defaultVote(g, law);
  }
  function recordBt(g, law, v) {
    const t = g.term;
    const margin = Math.abs(v.yes - v.no);
    // Zünglein an der Waage: Hätte eure Fraktion anders gestimmt, wäre das Ergebnis gekippt?
    let decisive = false;
    if (!isGov(t.role) && (t.seats[g.party] || 0) > 0) {
      const keep = t.voteChoice[law.id];
      const mine = keep || defaultVote(g, law);
      t.voteChoice[law.id] = mine === 'ja' ? 'nein' : 'ja';
      decisive = bundestagVote(g, law, law.draw).pass !== v.pass;
      if (keep) t.voteChoice[law.id] = keep; else delete t.voteChoice[law.id];
    }
    // Abstimmungsform: Handzeichen, namentlich (auf Antrag) oder Hammelsprung, wenn das Präsidium uneins ist.
    let method = margin <= 4 ? 'hammel' : 'hand';
    const dissent = t.gov.reduce((x, p) => x + ((v.detail[p] && v.detail[p].no) || 0), 0);
    if (law.namentlich) method = 'namentlich';
    else if (isGov(t.role) && dissent >= 3 && rand(g) < 0.3) { method = 'namentlich'; law.aiNamentlich = true; }
    const names = [];
    (law.whipGroups || []).forEach(x => { if (x.n > 0) names.push(x.name + ' (' + sname(x.p) + ')'); });
    if (method === 'namentlich' && dissent > 0) {
      const own = (v.detail[g.party] && isGov(t.role)) ? v.detail[g.party].no : 0;
      if (law.aiNamentlich && own > 0) { t.party.unity = clamp(t.party.unity - 3, 0, 100); news(g, 'Namentliche Abstimmung auf Antrag der Opposition: ' + own + ' Abgeordnete eurer Fraktion stimmen gegen „' + lawName(law) + '“ – jetzt stehen die Namen im Protokoll.', 'warn'); }
      if (law.namentlich && !isGov(t.role)) { t.mood = clamp(t.mood - 3, 0, 100); addNat(g, g.party, 0.03 * ACT_K); news(g, 'Auf euren Antrag namentliche Abstimmung: ' + dissent + ' Abgeordnete der Koalition stimmen gegen „' + lawName(law) + '“. Die Regierung ist blamiert.', 'info'); }
    }
    if (decisive) news(g, '⚖️ Zünglein an der Waage: Eure Fraktion entscheidet über „' + lawName(law) + '“.', 'big');
    const reasons = voteReasons(g, law, v);
    reasons.forEach(x => law.log.push('Im Plenum: ' + x + '.'));
    const rec = { kind: 'bt', title: lawTitle(law), law: law.id, detail: v.detail, yes: v.yes, no: v.no, abst: v.abst, absent: v.absent || 0, reasons, pass: v.pass, method, decisive, names, afd: v.afdDecisive, my: myVote(g, law, v), q: t.q };
    archiveVote(g, rec, law);
    if (voteMatters(g, law, margin, decisive)) (t.reel = t.reel || []).push(rec);
    return rec;
  }
  function recordBr(g, law, v) {
    const t = g.term;
    const ids = Object.keys(t.laender).sort((a, b) => E.stateById(a).name.localeCompare(E.stateById(b).name, 'de'));
    // Selten: Eine zerstrittene Landesregierung stimmt uneinheitlich ab (Vorbild Brandenburg, Zuwanderungsgesetz 2002) – die Stimmen sind ungültig.
    const split = ids.filter(l => v.votes[l] === 'enth');
    if (split.length && rand(g) < 0.06) {
      const l = pick(g, split);
      v.votes[l] = 'uneinheitlich';
      news(g, '🏛️ Eklat im Bundesrat: ' + E.stateById(l).name + ' stimmt uneinheitlich ab – die Stimmen sind ungültig. Der Ministerpräsident wird schwer kritisiert.', 'big');
      law.log.push('Bundesrat: uneinheitliche Stimmabgabe von ' + E.stateById(l).name + ' – ungültig (Art. 51 Abs. 3 GG).');
    }
    const rec = { kind: 'br', title: lawTitle(law), law: law.id, votes: ids.map(l => ({ land: l, votes: t.laender[l].votes, v: v.votes[l], gov: t.laender[l].gov.slice(), why: (v.why && v.why[l]) || null })), yes: v.yes, zust: law.zust, pass: law.zust ? v.pass : 69 - v.yes < TD.BUNDESRAT_MAJ, q: t.q };
    if (law.by === g.party || (isGov(t.role) && t.gov.indexOf(law.by) !== -1) || Math.abs(v.yes - TD.BUNDESRAT_MAJ) <= 6) (t.reel = t.reel || []).push(rec);
    return rec;
  }
  // Archiv eures Abstimmungsverhaltens; umstrittene Entscheidungen kommen später als Rückblick wieder.
  function archiveVote(g, rec, law) {
    const t = g.term;
    if (!rec.my) return;
    (t.voteLog = t.voteLog || []).unshift({ q: rec.q, title: rec.title, my: rec.my, yes: rec.yes, no: rec.no, abst: rec.abst, pass: rec.pass, decisive: rec.decisive, gewissen: !!(law && law.gewissen) });
    if (t.voteLog.length > 60) t.voteLog.length = 60;
    const d = law && law.kind ? lawDist(g, g.party, law) : 0;
    if (rec.decisive || (rec.my === 'ja' && d === 2) || (rec.my === 'nein' && d === 0)) {
      (t.memory = t.memory || []).push({ q: t.q, title: 'Abstimmung über „' + rec.title + '“', label: 'Ihr habt mit ' + ({ ja: 'Ja', nein: 'Nein', enthaltung: 'Enthaltung' }[rec.my]) + ' gestimmt', ok: (rec.my === 'ja') === (d < 2) });
    }
  }
  // Abstimmungen, die am Ende dieses Quartals anstehen (für die Vorschau „Sitzungswoche“).
  function dueVotes(g) {
    const t = g.term;
    const out = [];
    t.laws.forEach(l => {
      if (l.stage === 'bundestag' && !l.delay && (l.fraktion || l.btQ !== t.q)) out.push({ kind: 'bt', law: l, v: bundestagVote(g, l) });
      if (l.stage === 'bundesrat') out.push({ kind: 'br', law: l, v: bundesratVote(g, l) });
    });
    if (t.budget.draft && t.budget.draft.done && (cal(t).qn === 4 || t.budget.status === 'vorlaeufig')) out.push({ kind: 'budget', year: t.budget.draft.year });
    return out;
  }

  // Gewissensentscheidungen: Gruppenanträge quer durch die Fraktionen, oft ohne Fraktionszwang.
  // Zustimmung je Fraktion geschätzt nach den Abstimmungen 2020 (Organspende), 2022 (Impfpflicht) und den Debatten 2023–2025.
  const GEWISSEN = [
    { id: 'organspende', title: 'Widerspruchslösung bei der Organspende', text: 'Wer nicht widerspricht, gilt als Organspender. Ein Gruppenantrag aus mehreren Fraktionen liegt vor.', support: { union: 0.45, afd: 0.25, spd: 0.6, gruene: 0.5, linke: 0.45, bsw: 0.35, fdp: 0.55 } },
    { id: 'sterbehilfe', title: 'Regelung der Suizidhilfe', text: 'Nach dem Urteil aus Karlsruhe (2020) soll die Suizidhilfe neu geregelt werden – liberal mit Beratungspflicht.', support: { union: 0.3, afd: 0.3, spd: 0.6, gruene: 0.7, linke: 0.65, bsw: 0.45, fdp: 0.85 } },
    { id: 'paragraf218', title: 'Schwangerschaftsabbruch außerhalb des Strafgesetzbuchs', text: 'Ein Gruppenantrag will Abbrüche in den ersten zwölf Wochen aus dem Strafrecht nehmen (§ 218 StGB).', support: { union: 0.08, afd: 0.05, spd: 0.9, gruene: 0.95, linke: 0.95, bsw: 0.5, fdp: 0.65 } },
    { id: 'impfpflicht', title: 'Allgemeine Impfpflicht ab 60', text: 'Nach einer neuen Welle schlagen Abgeordnete eine Impfpflicht für Ältere vor (Vorbild: Abstimmung 2022, gescheitert).', support: { union: 0.35, afd: 0.02, spd: 0.75, gruene: 0.8, linke: 0.3, bsw: 0.05, fdp: 0.35 } },
    { id: 'kopftuch', title: 'Kopftuchverbot für Richterinnen und Lehrerinnen bundesweit', text: 'Ein Gruppenantrag will religiöse Symbole im öffentlichen Dienst einheitlich verbieten.', support: { union: 0.6, afd: 0.95, spd: 0.3, gruene: 0.1, linke: 0.15, bsw: 0.7, fdp: 0.35 } }
  ];
  function gewissenVote(g, item, line) {
    const t = g.term;
    const x = GEWISSEN.find(y => y.id === item.id);
    const detail = {};
    let yes = 0; let no = 0; let abst = 0;
    CONTEST.forEach(p => {
      const s = t.seats[p] || 0;
      if (!s) { detail[p] = { yes: 0, no: 0, abst: 0 }; return; }
      let rate = x.support[p] === undefined ? 0.5 : x.support[p];
      if (p === g.party && line) { const loyal = 0.8 + t.party.unity / 600; rate = line === 'ja' ? loyal : 1 - loyal; }
      rate = clamp(rate + between(g, -0.06, 0.06), 0, 1);
      const a = Math.round(s * 0.03);
      const y = Math.round((s - a) * rate);
      detail[p] = { yes: y, no: s - a - y, abst: a };
      yes += y; no += s - a - y; abst += a;
    });
    return { detail, yes, no, abst, pass: yes > no };
  }

  // Typische Kritik in Ausschussanhörungen (Sachverständige der Fraktionen, Verbände, Wissenschaft).
  const ANHOERUNG = ['Der Normenkontrollrat bemängelt hohen Bürokratieaufwand.', 'Ein Staatsrechtler hält zwei Paragrafen für verfassungsrechtlich angreifbar.',
    'Die kommunalen Spitzenverbände warnen vor Kosten, die bei den Kommunen hängen bleiben.', 'Der Bundesrechnungshof zweifelt an der Finanzierung.',
    'Sachverständige halten die Übergangsfristen für zu kurz.', 'Die Datenschutzbeauftragte sieht erhebliche Mängel.'];
  // Entwurf „aus der Mitte des Bundestages“ (Art. 76 Abs. 1 GG): Die Koalitionsfraktionen bringen ihn gemeinsam ein,
  // der erste Durchgang im Bundesrat entfällt – schneller, aber ohne die Prüfung durch Ministerien, Länder und Verbände.
  // Vorbild: Heizungsgesetz 2023, Wahlrechtsreform 2023.
  function fraktionsEntwurf(g, law) {
    law.fraktion = true;
    law.log.push('Als Fraktionsentwurf eingebracht – ohne Referentenentwurf und ersten Durchgang im Bundesrat.');
    cabinetStage(g, law);
    if (law.stage === 'veto') return 'Der Koalitionspartner verweigert die gemeinsame Einbringung von „' + lawName(law) + '“.';
    const w = whipGroups(g, law);
    if (w) { law.whipped = true; g.term.pending.push({ type: 'whip', law: law.id, groups: w.groups, yes: w.yes, no: w.no, i: 0 }); }
    return 'Fraktionsentwurf „' + lawName(law) + '“: 1. Lesung noch in diesem Quartal, Abstimmung zum Quartalsende.';
  }
  function processLaw(g, law) {
    const t = g.term;
    cat('parlament');
    if (law.stage === 'kabinett') { cabinetStage(g, law); return; }
    if (law.stage === 'bundestag') {
      if (!law.fraktion && law.btQ === t.q) return; // erst im nächsten Quartal: 1. Lesung, Ausschuss, 2./3. Lesung
      if (law.delay) { law.delay = false; law.log.push('Der Ausschuss vertagt die Beschlussempfehlung – Nachbesserungen nach der Anhörung.'); return; }
      if (!law.fraktion) law.log.push('Bundesrat, 1. Durchgang: Stellungnahme' + (law.brDeal ? ' – die Bundesregierung übernimmt Änderungswünsche der Länder.' : '.'));
      law.log.push('1. Lesung, Überweisung an den Ausschuss' + (law.fixed ? ', Nachbesserungen nach der Anhörung.' : ', öffentliche Anhörung.'));
      // Jetzt wird wirklich abgestimmt: Anwesenheit, Abweichler und Taktik entscheiden sich erst im Plenum.
      law.draw = makeDraw(g, () => rand(g));
      const v = bundestagVote(g, law, law.draw);
      law.bt = { yes: v.yes, no: v.no, abst: v.abst, absent: v.absent };
      recordBt(g, law, v);
      delete law.draw;
      if (!v.pass) {
        law.stage = 'gescheitert';
        law.log.push('2./3. Lesung: im Bundestag gescheitert – ' + v.yes + ' Ja, ' + v.no + ' Nein, ' + v.abst + ' Enthaltungen.');
        news(g, 'Abstimmungsniederlage: „' + lawName(law) + '“ scheitert im Bundestag (' + v.yes + ':' + v.no + ').', 'bad');
        t.gov.forEach(p => addNat(g, p, -0.15));
        t.mood = clamp(t.mood - 4, 0, 100);
        if (law.by === g.party) t.stats.failed += 1;
        return;
      }
      law.log.push('2./3. Lesung: Bundestag beschließt – ' + v.yes + ' Ja, ' + v.no + ' Nein, ' + v.abst + ' Enthaltungen.');
      const govYes = t.gov.reduce((s, p) => s + v.detail[p].yes, 0);
      if (govYes < MAJ && govSeats(t) >= MAJ && !v.afdDecisive) {
        law.log.push('Die Koalition verfehlt die eigene Mehrheit (' + govYes + ' von ' + MAJ + ').');
        news(g, 'Ohne eigene Mehrheit: Die Koalition bringt „' + lawName(law) + '“ nur mit Stimmen der Opposition durch.', 'warn');
        t.mood = clamp(t.mood - 3, 0, 100);
        if (t.gov.indexOf(g.party) !== -1) t.party.unity = clamp(t.party.unity - 2, 0, 100);
      }
      if (v.afdDecisive) {
        news(g, 'Eklat im Bundestag: „' + lawName(law) + '“ kommt nur mit Stimmen der AfD durch. Proteste vor dem Reichstag.', 'bad');
        // Vorbild Januar 2025: Die Mitte verliert, die linke Opposition mobilisiert.
        t.gov.forEach(p => addNatT(g, p, p === 'afd' ? 0 : -1.0, 'slow'));
        ['linke', 'gruene', 'spd'].forEach(p => { if (t.gov.indexOf(p) === -1) addNatT(g, p, p === 'linke' ? 0.8 : 0.4, 'norm'); });
        if (g.party === 'afd') addNat(g, 'afd', 0.4);
        if (t.gov.indexOf(g.party) !== -1) { t.party.unity = clamp(t.party.unity - 6, 0, 100); addCred(g, -4, 'Mehrheit nur mit Stimmen der AfD'); }
      }
      law.stage = 'bundesrat';
      return;
    }
    if (law.stage === 'bundesrat') {
      const v = bundesratVote(g, law, makeDraw(g, () => rand(g)));
      Object.keys(v.why).forEach(l => law.log.push('Bundesrat: ' + E.stateById(l).name + ' weicht ab – ' + v.why[l] + '.'));
      recordBr(g, law, v);
      law.br = { yes: v.yes };
      if (v.pass) { law.log.push('Bundesrat, 2. Durchgang: ' + (law.zust ? 'Zustimmung' : 'kein Einspruch') + ' (' + v.yes + ' von 69 Stimmen).'); finalize(g, law); return; }
      if (!law.zust && 69 - v.yes < TD.BUNDESRAT_MAJ) { law.log.push('Bundesrat, 2. Durchgang: Der Vermittlungsausschuss wird nicht angerufen (Einspruchsgesetz).'); finalize(g, law); return; }
      law.stage = 'vermittlung';
      law.vm = true;
      law.log.push('Bundesrat, 2. Durchgang: ' + (law.zust ? 'keine Zustimmung' : 'Anrufung des Vermittlungsausschusses') + ' (' + v.yes + ' von 69). Der Vermittlungsausschuss tagt.');
      news(g, 'Bundesrat stoppt „' + lawName(law) + '“ vorerst – Vermittlungsausschuss.', 'warn');
      return;
    }
    if (law.stage === 'vermittlung') {
      if (rand(g) < 0.55) {
        if (law.kind === 'topic' && D.PROGRAM[law.topic][law.opt].lean !== 0) {
          const mid = optIndex(law.topic, 0);
          if (mid !== t.policy[law.topic]) { law.opt = mid; law.log.push('Einigungsvorschlag des Vermittlungsausschusses: „' + lawName(law) + '“ – Bundestag und Bundesrat stimmen zu.'); finalize(g, law); return; }
        } else { law.log.push('Einigung im Vermittlungsausschuss.'); finalize(g, law); return; }
      }
      if (!law.zust) {
        // Einspruchsgesetz: Der Bundestag kann den Einspruch mit der Mehrheit seiner Mitglieder zurückweisen (Art. 77 Abs. 4 GG).
        const v = bundestagVote(g, law, makeDraw(g, () => rand(g)));
        law.log.push('Kein Einigungsvorschlag – der Bundesrat legt Einspruch ein.');
        if (v.yes >= MAJ) { law.log.push('Der Bundestag weist den Einspruch mit Kanzlermehrheit zurück (' + v.yes + ' Stimmen).'); news(g, 'Bundestag überstimmt den Bundesrat: „' + lawName(law) + '“ kommt.', 'info'); finalize(g, law); return; }
        law.stage = 'gescheitert';
        law.log.push('Die Kanzlermehrheit von ' + MAJ + ' Stimmen wird verfehlt (' + v.yes + ') – der Einspruch bleibt bestehen.');
        news(g, '„' + lawName(law) + '“ scheitert am Einspruch des Bundesrates.', 'bad');
        if (law.by === g.party) t.stats.failed += 1;
        return;
      }
      law.stage = 'gescheitert';
      law.log.push('Der Vermittlungsausschuss findet keinen Kompromiss – ohne Zustimmung des Bundesrates ist das Gesetz gescheitert.');
      news(g, '„' + lawName(law) + '“ ist endgültig gescheitert.', 'bad');
      if (law.by === g.party) t.stats.failed += 1;
    }
  }
  // Ausfertigung (der Bundespräsident prüft die Verfassungsmäßigkeit – sehr selten verweigert) und Verkündung.
  function finalize(g, law) {
    const t = g.term;
    const risky = law.kind === 'topic' && Math.abs(D.PROGRAM[law.topic][law.opt].lean) === 1 && law.fraktion && !law.fixed;
    if (risky && rand(g) < 0.04) {
      law.stage = 'gescheitert';
      law.log.push('Der Bundespräsident verweigert die Ausfertigung: erhebliche verfassungsrechtliche Bedenken.');
      news(g, '🏛️ Selten in der Geschichte: Der Bundespräsident unterschreibt „' + lawName(law) + '“ nicht.', 'bad');
      t.gov.forEach(p => addNat(g, p, -0.4));
      return;
    }
    law.log.push('Ausfertigung durch den Bundespräsidenten und Verkündung im Bundesgesetzblatt.');
    enact(g, law);
    // Im Eiltempo ohne Anhörung beschlossen: Die Opposition wittert Verfahrensfehler (wie beim Heizungsgesetz 2023).
    if (law.fraktion && !law.fixed && law.kind === 'topic' && Math.abs(D.PROGRAM[law.topic][law.opt].lean) === 1) aiKlage(g, { kind: 'law', law: law.id, chance: 0.2, text: '„' + lawName(law) + '“' });
  }

  function applyEcon(e, fx, sign) {
    if (!fx) return;
    ['growth', 'unemp', 'infl'].forEach(k => { if (fx[k]) e.pol[k] += sign * fx[k]; });
  }

  function enact(g, law) {
    const t = g.term;
    cat('gesetz');
    law.stage = 'inkraft';
    law.q1 = t.q;
    (t.statutes = t.statutes || {})[law.kind === 'tax' ? 'tax:' + law.tax : law.topic] = { v: law.kind === 'tax' ? law.level : law.opt, by: law.by, gov: t.gov.slice(), q: quarterLabel(t, Math.min(t.q, QUARTERS - 1)), name: lawName(law) };
    chron(g, 'gesetz', '„' + lawName(law) + '“ tritt in Kraft (eingebracht von ' + sname(law.by) + ').');
    t.stats.lawsTotal += 1;
    const topic = lawTopic(law);
    const L = lawLean(law);
    if (law.by === g.party || (isGov(t.role) && t.gov.indexOf(law.by) !== -1)) wingReact(g, L, law.by === g.party ? 1 : 0.5);
    const sal = g.salience[topic] / D.SALIENCE0[topic];
    let pop;
    if (law.kind === 'tax') {
      const x = taxById(law.tax);
      const from = t.taxes[law.tax];
      const to = law.level;
      t.taxes[law.tax] = to;
      applyEcon(t.econ, { growth: taxGrowthAt(x, to) - taxGrowthAt(x, from) }, 1);
      t.econ.infl += taxInflAt(x, to) - taxInflAt(x, from);
      const dRev = taxRevAt(x, to) - taxRevAt(x, from);
      const dir = Math.sign(to - from);
      const shock = Math.abs(to - from) / x.scale;
      const burden = x.relief ? -dir : dir; // +1 = Belastung steigt
      pop = (-dRev / 25 + ((x.leanUp || 0) === -1 && dRev > 0 ? 0.35 : 0)) * 2.2;
      // Große Sprünge werden überproportional bestraft (Mehrwertsteuer +3 Punkte 2007), große Senkungen wirken kaum stärker.
      if (burden > 0) pop -= Math.min(3, 0.3 * Math.pow(Math.max(0, shock - 1), 2));
      else pop = Math.min(pop, 0.8);
      // Wen es trifft: Wählergruppen rücken von der Regierung ab oder auf sie zu.
      Object.keys(x.groups || {}).forEach(k => { if (g.grp[k]) t.gov.forEach(p => { g.grp[k][p] = (g.grp[k][p] || 0) + 0.4 * x.groups[k] * dir * Math.min(3, shock); }); });
      if (x.climatePer) { ensureLage(g); t.lage.klima -= x.climatePer * (to - from); }
      if (x.peak && to > x.peak && from <= x.peak) news(g, 'Ökonomen warnen: Mit ' + fmtTax(x, to) + ' liegt die ' + x.name + ' über dem Einnahmemaximum – Ausweichen und Abwanderung kosten mehr, als der höhere Satz bringt.', 'warn');
      if (x.legalMax !== undefined && to > x.legalMax) {
        news(g, 'Verfassungsrechtler sprechen von einer „Erdrosselungssteuer“: ' + x.name + ' ' + fmtTax(x, to) + ' könnte gegen die Eigentumsgarantie (Art. 14 GG) verstoßen.', 'warn');
        aiKlage(g, { kind: 'law', law: law.id, chance: clamp(0.35 + 0.1 * (to - x.legalMax) / x.scale, 0.35, 0.9), text: '„' + lawName(law) + '“' });
      }
      t.euCases = t.euCases || {};
      if (x.euMin !== undefined && to < x.euMin) { if (t.euCases[x.id] === undefined) { t.euCases[x.id] = t.q; t.intl = clamp(t.intl - 8, 0, 100); news(g, 'Brüssel leitet ein Vertragsverletzungsverfahren ein: ' + x.name + ' unter dem EU-Mindestsatz von ' + fmtTax(x, x.euMin) + '.', 'bad'); } }
      else delete t.euCases[x.id];
      if (x.minTax !== undefined && to < x.minTax && from >= x.minTax) news(g, 'Globale Mindeststeuer: Unter ' + fmtTax(x, x.minTax) + ' erheben andere Staaten die Differenz – deutsche Konzerne sparen kaum, dem Bund fehlt das Geld.', 'warn');
    } else {
      const prevOpt = t.policy[law.topic];
      const prevLean = D.PROGRAM[law.topic][prevOpt].lean;
      const ec = TD.TOPIC_ECON[law.topic] || {};
      applyEcon(t.econ, ec[String(prevLean)], -1);
      applyEcon(t.econ, ec[String(L)], 1);
      t.budget.extra += (D.PROGRAM[law.topic][law.opt].cost - D.PROGRAM[law.topic][prevOpt].cost) * TD.LAW_COST;
      // Wählergruppen: Wem die neue Regelung gefällt, der rückt näher an die Regierung (bundesweit ausgeglichen).
      const a1 = A.positionAppeal(law.topic, law.opt);
      const a0 = A.positionAppeal(law.topic, prevOpt);
      const diff = {};
      let mean = 0;
      D.GROUPS.forEach(k => { diff[k.id] = a1[k.id] - a0[k.id]; mean += (A.W[k.id] || 0) * diff[k.id]; });
      D.GROUPS.forEach(k => { if (!g.grp[k.id]) return; t.gov.forEach(p => { g.grp[k.id][p] = (g.grp[k.id][p] || 0) + 0.6 * (diff[k.id] - mean); }); });
      law.prevOpt = prevOpt;
      t.policy[law.topic] = law.opt;
      (t.policyQ = t.policyQ || {})[law.topic] = t.q; // Wirkung auf die Lage im Land beginnt jetzt
      t.sq[law.topic] = 55; // die neue Regelung ist der neue Status quo
      const o = D.PROGRAM[law.topic][law.opt];
      // Wie umstritten: Lager-Position und Kosten (Betroffenheit). Vorbild Heizungsgesetz 2023 (−3 für die Grünen).
      const controversy = Math.abs(o.lean) * (o.cost + 1) / 3;
      pop = (o.pop - 0.15 * controversy) * 2.2;
      A.changeSalience(g, law.topic, -0.01);
    }
    // Gut gemacht oder handwerklich schlecht? Die Kompetenz der zuständigen Ministerin/des Ministers zählt.
    const mn = ministerFor(t, law.kind === 'tax' ? 'finanzen' : law.topic);
    const cf = compFactor(mn);
    if (pop > 0) pop *= cf; else pop *= 2 - cf;
    if (law.brDeal && pop > 0) pop *= 0.8; // Kompromiss mit den Ländern verwässert die Wirkung
    if (law.fraktion && !law.fixed) { pop -= 0.1; if (rand(g) < 0.25) { pop -= 0.15; law.log.push('Im Eiltempo beschlossen: handwerkliche Fehler werden sichtbar.'); news(g, 'Kritik am Verfahren: „' + lawName(law) + '“ wurde durch den Bundestag gepeitscht.', 'warn'); } }
    if (mn && mn.comp < 45 && rand(g) < 0.3) { pop -= 0.15; law.log.push('Handwerkliche Mängel: ' + mn.name + ' muss nachbessern.'); news(g, 'Pannen beim Gesetz „' + lawName(law) + '“: Kritik an ' + mn.name + '.', 'warn'); }
    // Umfragen: Regierung bekommt Lob oder Kritik, Parteien mit passender Linie punkten bei Anhängern.
    // Wichtige Themen polarisieren stärker; die Partei des zuständigen Ressorts trägt den größten Teil.
    const salP = Math.pow(clamp(sal, 0.5, 2.5), 1.5);
    const owner = mn ? mn.party : t.chanc;
    // Negativitätsverzerrung: Unbeliebtes schadet stärker, als Beliebtes nützt (Wählerinnen und Wähler nehmen Gutes als selbstverständlich).
    if (pop > 0) pop *= 0.3;
    t.gov.forEach(p => addNat(g, p, pop * salP * (pop > 0 ? (p === owner ? 0.9 : p === t.chanc ? 0.8 : 0.5) : (p === owner ? 1.2 : p === t.chanc ? 0.9 : 0.6))));
    PIDS.forEach(p => {
      const d = Math.abs(leanOf(g, p, topic) - L);
      if (t.gov.indexOf(p) !== -1) addNat(g, p, d === 0 ? 0.12 : d === 2 ? -0.15 : 0);
      else if (d === 2) addNat(g, p, 0.08);
    });
    // Verbände loben oder kritisieren das neue Gesetz öffentlich.
    cat('lobby');
    LB.affected(law, TD).forEach(x => {
      t.gov.forEach(p => addNat(g, p, (x.s > 0 ? 0.04 : -0.08) * x.l.power));
      if (t.gov.indexOf(g.party) !== -1) LB.addRel(g, x.l.id, x.s > 0 ? 6 : -6);
    });
    cat('gesetz');
    if (law.by === g.party) t.stats.lawsOwn += 1;
    t.qLaws = (t.qLaws || 0) + 1;
    t.lastLawQ = t.q;
    if (isGov(t.role) && t.gov.indexOf(law.by) !== -1) {
      const d = progDist(g, topic, L);
      if (law.by === g.party || t.role === 'kanzler') {
        if (d === 0) addCred(g, 3, 'Gesetz nach eurem Programm: „' + lawName(law) + '“');
        else if (d === 2) addCred(g, -5, 'Gesetz gegen euer Programm: „' + lawName(law) + '“');
        else addCred(g, -1, 'Kompromiss-Gesetz: „' + lawName(law) + '“');
      } else if (d === 2) addCred(g, -2, 'Mitgetragen, obwohl es eurem Programm widerspricht: „' + lawName(law) + '“');
    }
    // Wahlversprechen gehalten?
    if (isGov(t.role) && law.kind === 'topic' && g.program && g.program.positions[law.topic] === law.opt) {
      t.stats.promises += 1;
      addNat(g, g.party, 0.15);
      law.promise = true;
    }
    law.log.push('In Kraft getreten (' + quarterLabel(t) + ').');
    news(g, '✅ Gesetz in Kraft: „' + lawName(law) + '“.', 'good');
  }

  // KI-Gesetzgebung der Regierung (und der Partner, wenn ihr regiert).
  function aiLawTurn(g) {
    const t = g.term;
    const authors = [];
    if (t.role === 'kanzler') { t.gov.filter(p => p !== g.party).forEach(p => { if (rand(g) < 0.3) authors.push(p); }); }
    else if (rand(g) < (t.role === 'junior' ? 0.5 : 0.6)) authors.push(t.chanc);
    authors.forEach(p => {
      const own = ownMinistries(t, p);
      const cands = [];
      A.TOPIC_IDS.forEach(topic => {
        if (inPipeline(t, topic)) return;
        if (p !== t.chanc && own.indexOf(TD.TOPIC_MINISTRY[topic]) === -1) return;
        const lp = leanOf(g, p, topic);
        const partnerFar = t.gov.some(q => Math.abs(leanOf(g, q, topic) - lp) >= 2);
        let target = t.contract[topic] !== undefined ? t.contract[topic] : optIndex(topic, partnerFar ? 0 : lp);
        if (target === t.policy[topic]) target = optIndex(topic, partnerFar ? 0 : lp);
        if (target === t.policy[topic]) return;
        if (lawBlock(g, { kind: 'topic', topic, opt: target }, p)) return;
        cands.push({ topic, opt: target, w: g.salience[topic] * (t.contract[topic] === target ? 2 : 1) });
      });
      // Gelegentlich Steuerpolitik nach der Linie der Finanzpartei
      if (rand(g) < 0.15 && (p === budgetDrafter(t))) {
        const lf = leanOf(g, p, 'finanzen');
        const x = pick(g, TD.TAXES.filter(z => !inPipeline(t, 'tax:' + z.id)));
        if (x) {
          const cur = t.taxes[x.id];
          const sgn = lf * (x.leanUp || 0);
          let lvl = Math.round((cur + sgn * x.scale) / x.step) * x.step;
          lvl = Math.round(clamp(lvl, Math.max(x.min, x.euMin || 0, x.minTax || 0), Math.min(x.max, x.legalMax || x.max, x.peak || x.max)) * 1000) / 1000;
          if (sgn && lvl !== cur && !lawBlock(g, { kind: 'tax', tax: x.id, level: lvl }, p)) cands.push({ tax: x.id, level: lvl, w: 0.2 });
        }
      }
      if (!cands.length) return;
      const total = cands.reduce((s, c) => s + c.w, 0);
      let x = rand(g) * total;
      let c = cands[0];
      for (const it of cands) { x -= it.w; if (x <= 0) { c = it; break; } }
      const law = makeLaw(g, c.tax ? { kind: 'tax', tax: c.tax, level: c.level } : { kind: 'topic', topic: c.topic, opt: c.opt }, p);
      if (isGov(t.role)) {
        law.stage = 'kabinett_wait';
        t.pending.push({ type: 'cabinet', law: law.id });
      } else {
        news(g, 'Die Bundesregierung bringt ein: „' + lawName(law) + '“.', 'info');
      }
    });
  }

  // ---------- Klagen und Untersuchungsausschüsse ----------
  // Quorum: ein Viertel der Abgeordneten (Art. 44 GG, Art. 93 GG).
  function quorum(g) {
    const t = g.term;
    if (!(t.seats[g.party] > 0) || isGov(t.role)) return { ok: false, seats: 0 };
    const allies = CONTEST.filter(p => t.gov.indexOf(p) === -1 && (t.seats[p] || 0) > 0 && (g.party === 'afd' ? p === 'afd' : p !== 'afd'));
    const seats = allies.reduce((s, p) => s + t.seats[p], 0);
    return { ok: seats * 4 >= SEATS, seats, allies };
  }
  // Die (KI-)Opposition zieht nach Karlsruhe, wenn sie das Quorum hat.
  function aiKlage(g, k) {
    const t = g.term;
    const opp = CONTEST.filter(p => t.gov.indexOf(p) === -1 && p !== 'afd' && (t.seats[p] || 0) > 0);
    const seats = opp.reduce((s, p) => s + t.seats[p], 0);
    const afd = t.gov.indexOf('afd') === -1 ? (t.seats.afd || 0) : 0;
    if (seats * 4 < SEATS && afd * 4 < SEATS) return;
    if (t.role === 'opposition') return; // als Opposition entscheidet ihr selbst über Klagen
    if (rand(g) < 0.7) {
      t.klagen.push({ kind: k.kind, law: k.law, due: t.q + 2, chance: k.chance, text: k.text, by: 'ai' });
      news(g, 'Die Opposition reicht Normenkontrollklage in Karlsruhe ein: ' + k.text + '.', 'warn');
    }
  }
  function processKlagen(g) {
    const t = g.term;
    cat('karlsruhe');
    t.klagen.filter(k => k.due === t.q && !k.done).forEach(k => {
      k.done = true;
      k.success = rand(g) < k.chance;
      if (k.success) {
        if (k.kind === 'budget') {
          news(g, '⚖️ Karlsruhe kippt den Haushalt: verfassungswidrig! Die Regierung muss Milliarden einsparen.', 'bad');
          t.gov.forEach(p => addNat(g, p, -0.6));
          t.mood = clamp(t.mood - 10, 0, 100);
          t.econ.growth -= 0.2;
          t.budget.oneoff -= 0; // Haushaltssperre: weniger Spielraum im laufenden Jahr
          Object.keys(t.budget.plan).forEach(a => { t.budget.plan[a] = clamp(t.budget.plan[a] - 5, -10, 10); });
        } else {
          const law = t.laws.find(l => l.id === k.law);
          if (law && law.stage === 'inkraft') {
            law.stage = 'aufgehoben';
            law.log.push('Vom Bundesverfassungsgericht aufgehoben (' + quarterLabel(t) + ').');
            // Es gilt wieder, was vor dem Gesetz galt.
            if (law.kind === 'topic') {
              const prev = law.prevOpt !== undefined ? law.prevOpt : law.from !== undefined ? law.from : optIndex(law.topic, 0);
              t.budget.extra -= (D.PROGRAM[law.topic][law.opt].cost - D.PROGRAM[law.topic][prev].cost) * TD.LAW_COST;
              t.policy[law.topic] = prev;
            } else t.taxes[law.tax] = law.from !== undefined ? law.from : taxById(law.tax).start;
            if (t.statutes) delete t.statutes[law.kind === 'tax' ? 'tax:' + law.tax : law.topic];
            news(g, '⚖️ Das Bundesverfassungsgericht erklärt „' + lawName(law) + '“ für verfassungswidrig.', 'bad');
            t.gov.forEach(p => addNat(g, p, -0.35));
          }
        }
        if (k.by === 'player') { addNat(g, g.party, 0.35); t.party.leader.like = clamp(t.party.leader.like + 0.2, -5, 5); }
      } else {
        news(g, '⚖️ Karlsruhe weist die Klage ab: ' + k.text + ' ist verfassungsgemäß.', 'info');
        if (k.by === 'player') addNat(g, g.party, -0.15);
      }
    });
  }

  // ---------- Landtagswahlen ----------
  // Regierungsbildung im Land nach denselben Regeln wie im Bund: Koalitionen aus bis zu drei Parteien,
  // Brandmauer und Unvereinbarkeitsbeschlüsse wie auf Bundesebene. Reihenfolge:
  // 1. Mehrheitskoalition – die stärkste Partei, die eine Mehrheit zusammenbekommt, verhandelt;
  //    bevorzugt wenige Partner, programmatische Nähe und die bisherige Regierung.
  // 2. Von der AfD tolerierte Minderheitsregierung (nur, wenn die Partner das nicht ausschließen).
  // 3. Sonst Minderheitskoalition mit den meisten Sitzen (wie Sachsen seit 2024: CDU und SPD).
  // Allein regiert nur, wer die absolute Mehrheit der Sitze hat.
  function landGovernment(g, seats, land, prevGov) {
    const order = CONTEST.filter(p => seats[p] > 0).sort((a, b) => seats[b] - seats[a]);
    if (order.length && seats[order[0]] >= MAJ) return [order[0]];
    const sum = m => m.reduce((s, p) => s + seats[p], 0);
    const dist = m => { let d = 0; for (let a = 0; a < m.length; a++) for (let b = a + 1; b < m.length; b++) A.TOPIC_IDS.forEach(tp => { d += Math.abs(leanOf(g, m[a], tp) - leanOf(g, m[b], tp)); }); return d; };
    const score = c => c.members.length * 100 + dist(c.members) * 2 - 15 * c.members.filter(p => prevGov.indexOf(p) !== -1).length + (c.members.indexOf('afd') !== -1 ? 1000 : 0);
    const sortLead = c => [c.members[0]].concat(c.members.slice(1).sort((a, b) => seats[b] - seats[a]));
    const all = E.findCoalitions(seats, g);
    const majority = all.filter(c => c.viable && !c.tolerated);
    for (const f of order) {
      const opts = majority.filter(c => c.members.indexOf(f) !== -1).sort((a, b) => score(a) - score(b));
      if (opts.length && (f !== 'afd' || opts[0].members.length === 1 || opts[0].members.every(p => p === 'afd' || E.fwLevel(g, p) >= 3))) {
        return [f].concat(opts[0].members.filter(p => p !== f).sort((a, b) => seats[b] - seats[a]));
      }
    }
    const tol = all.filter(c => c.tolerated).sort((a, b) => b.seats - a.seats)[0];
    if (tol) return sortLead({ members: tol.members.slice().sort((a, b) => seats[b] - seats[a]) });
    // Minderheitskoalition: bis zu drei Parteien ohne AfD (oder mit ihr, wenn alle Partner koalitionsbereit sind).
    const ids = order.slice();
    let best = null;
    for (let mask = 1; mask < (1 << ids.length); mask++) {
      const m = ids.filter((_, k) => mask & (1 << k));
      if (m.length > 3) continue;
      const withAfd = m.indexOf('afd') !== -1;
      if (withAfd && !(m.length === 1 && order[0] === 'afd' && order.filter(p => p !== 'afd').length === 0)) continue;
      if (!E.coalitionViable(m, g)) continue;
      const c = { members: m.slice().sort((a, b) => seats[b] - seats[a]), seats: sum(m) };
      if (!best || c.seats - 3 * dist(m) / A.TOPIC_IDS.length > best.seats - 3 * dist(best.members) / A.TOPIC_IDS.length) best = c;
    }
    if (best) return best.members;
    return [order.find(p => p !== 'afd') || order[0]];
  }

  function landtagswahl(g, land) {
    const t = g.term;
    cat('wahlen');
    const sh = A.stateShares(g, land);
    const L = t.laender[land];
    const raw = {};
    CONTEST.concat([OTHER]).forEach(p => { raw[p] = Math.max(0.1, (sh[p] || 0) * (1 + between(g, -0.08, 0.08))); });
    if (L.gov[0] && raw[L.gov[0]] !== undefined) raw[L.gov[0]] += TD.LTW_BONUS.incumbent;
    if (TD.LTW_BONUS.fw[land]) raw.fw += TD.LTW_BONUS.fw[land];
    raw[g.party] += t.ltwBoost[land] || 0;
    // Bundestrend: Wer im Bund regiert, wird bei Landtagswahlen oft abgestraft – es sei denn, man hält Abstand.
    if (t.ltwDistance && t.ltwDistance[land]) raw[g.party] += isGov(t.role) ? 0.6 : 0.2;
    const sum = Object.keys(raw).reduce((s, p) => s + raw[p], 0);
    const shares = {};
    Object.keys(raw).forEach(p => { shares[p] = r1(raw[p] / sum * 100); });
    const inParl = {};
    CONTEST.forEach(p => { if (shares[p] >= 5) inParl[p] = shares[p]; });
    const seats = E.sainteLague(inParl, SEATS);
    CONTEST.forEach(p => { if (!(p in seats)) seats[p] = 0; });
    const prevGov = L.gov.slice();
    const gov = landGovernment(g, seats, land, prevGov);
    L.gov = gov;
    // Koalitionsoptionen mit euch: Ihr verhandelt im Land selbst (Landesverband und Bundesspitze gemeinsam).
    const mine = shares[g.party] >= 5 ? E.findCoalitions(seats, g).filter(c => c.viable && !c.tolerated && c.members.indexOf(g.party) !== -1)
      .sort((a, b) => a.members.length - b.members.length || a.seats - b.seats).slice(0, 3) : [];
    const prev = t.landPrev[land] || 0;
    const diff = shares[g.party] - prev;
    t.landPrev[land] = shares[g.party];
    t.ltwBoost[land] = 0;
    addNat(g, g.party, clamp(diff * 0.05, -0.4, 0.4) * (t.ltwDistance && t.ltwDistance[land] && diff < 0 ? 0.5 : 1));
    if (t.ltwDistance) delete t.ltwDistance[land];
    // Bestätigt die Wahl den Hype, bleibt ein Teil; sonst verpufft er (Schulz-Effekt 2017).
    const hb = bucket(g, 'hype', g.party);
    if ((hb[g.party] || 0) > 0.4) {
      if (diff >= 1) { const keep = hb[g.party] * 0.5; hb[g.party] -= keep; const sb = bucket(g, 'slow', g.party); sb[g.party] = (sb[g.party] || 0) + keep; news(g, 'Der Höhenflug hält: Die Landtagswahl bestätigt den Aufwind.', 'good'); }
      else if (diff <= -1) { const lost = hb[g.party] * 0.7; hb[g.party] -= lost; g.nat[g.party] -= lost; noteFx(g, 'hype', -lost); news(g, 'Strohfeuer: Nach der Landtagswahl ist der Hype vorbei.', 'bad'); }
    }
    t.party.unity = clamp(t.party.unity + clamp(diff, -6, 6), 0, 100);
    t.gov.forEach(p => { if (p !== g.party && (shares[p] || 0) < (sh[p] || 0) - 2) t.mood = clamp(t.mood - 2, 0, 100); });
    const entry = { q: t.q, land, shares, seats, gov, diff: r1(diff), inGov: gov.indexOf(g.party) !== -1, inParl: shares[g.party] >= 5, open: mine.length > 0 };
    t.ltwLog.push(entry);
    chron(g, 'wahl', 'Landtagswahl ' + E.stateById(land).name + ': ' + sname(g.party) + ' ' + f1(shares[g.party] || 0) + ' % (' + (diff >= 0 ? '+' : '−') + f1(Math.abs(diff)) + '), Regierung: ' + gov.map(sname).join('-') + '.');
    t.stats.ltw.push(entry);
    const top = Object.keys(shares).filter(p => p !== OTHER).sort((a, b) => shares[b] - shares[a]).slice(0, 4);
    news(g, '🗳️ Landtagswahl ' + E.stateById(land).name + ': ' + top.map(p => sname(p) + ' ' + f1(shares[p]) + ' %').join(', ') +
      '. Neue Regierung: ' + gov.map(sname).join('-') + (gov.reduce((x, p) => x + (seats[p] || 0), 0) < MAJ ? ' (Minderheitsregierung)' : '') + '.', 'big');
    (t.ltwNight = t.ltwNight || []).push(entry);
    if (mine.length) t.ltwKoa = (t.ltwKoa || []).concat([{ land, options: mine.map(c => c.members.slice().sort((a, b) => seats[b] - seats[a])), def: gov.slice() }]);
    return entry;
  }
  // Wahlabend: alle Landtagswahlen des Quartals auf einen Blick, danach die Koalitionsgespräche in den Ländern.
  function flushLtwNight(g) {
    const t = g.term;
    if (t.ltwNight && t.ltwNight.length) t.pending.push({ type: 'info', kind: 'ltwabend', entries: t.ltwNight });
    (t.ltwKoa || []).forEach(k => t.pending.push({ type: 'landkoa', land: k.land, options: k.options, def: k.def }));
    t.ltwNight = [];
    t.ltwKoa = [];
  }
  // Vertragsverletzungsverfahren (EU-Mindeststeuersätze): Ansehen sinkt, nach einem Jahr verhängt der EuGH ein Zwangsgeld.
  function euCasesQuarter(g) {
    const t = g.term;
    Object.keys(t.euCases || {}).forEach(id => {
      const x = taxById(id);
      if (!x || t.taxes[id] >= x.euMin) { delete t.euCases[id]; return; }
      t.intl = clamp(t.intl - 1.5, 0, 100);
      if (t.q - t.euCases[id] >= 4) { t.budget.oneoff += 0.4; if ((t.q - t.euCases[id]) % 4 === 0) news(g, 'Der Europäische Gerichtshof verhängt ein Zwangsgeld wegen der ' + x.name + ' unter dem EU-Mindestsatz.', 'bad'); }
    });
  }

  // ---------- Landeskoalitionen zwischen den Wahlen ----------
  // Spannung je Landeskoalition (0–100): Absturz eines Partners im Bund, Lagerkonflikt Bund/Opposition im Bundesrat,
  // Länder-Front und gescheiterte Parteischiene. Hohe Spannung kann die Koalition sprengen (Hamburg 2010, Saarland 2012,
  // Thüringen 2020) – dann Neuwahl oder neues Bündnis ohne Wahl. Werte geschätzt; eigener Zufall.
  function landSeats(g, land) {
    const t = g.term;
    const e = (t.ltwLog || []).filter(x => x.land === land).pop();
    if (e && e.seats) return e.seats;
    // Ohne Wahl in diesem Spiel: Sitzverhältnis aus der Umfrage im Land (geschätzt).
    const sh = A.stateShares(g, land);
    const ins = {};
    CONTEST.forEach(p => { if ((sh[p] || 0) >= 5) ins[p] = sh[p]; });
    const seats = E.sainteLague(ins, SEATS);
    CONTEST.forEach(p => { if (!(p in seats)) seats[p] = 0; });
    return seats;
  }
  // Neues Bündnis ohne den ausscherenden Partner, mit der Partei der Regierungschefin/des Regierungschefs oder ohne sie.
  function landAlternative(g, land, out) {
    const seats = Object.assign({}, landSeats(g, land));
    const L = g.term.laender[land];
    const opts = E.findCoalitions(seats, g).filter(c => c.viable && !c.tolerated && c.members.indexOf(out) === -1 && !(c.members.length === L.gov.length && c.members.every(p => L.gov.indexOf(p) !== -1)));
    const head = L.gov[0];
    const pick1 = opts.filter(c => c.members.indexOf(head) !== -1).sort((a, b) => a.members.length - b.members.length)[0] || opts.sort((a, b) => a.members.length - b.members.length)[0];
    if (!pick1) return null;
    return pick1.members.slice().sort((a, b) => (seats[b] || 0) - (seats[a] || 0));
  }
  function landCoalitions(g) {
    const t = g.term;
    const due = ltwDue(t);
    Object.keys(t.laender).forEach((land, i) => {
      const L = t.laender[land];
      if (L.gov.length < 2) { L.strain = 0; return; }
      const R = localRng(((g.nameSeed || 1) * 13 + t.abs0 * 37 + t.q * 1009 + i * 7919 + 11) % 2147483647);
      let s = (L.strain === undefined ? 20 : L.strain) * 0.85;
      L.gov.forEach(p => { if ((t.start[p] || 0) - shareOf(g, p) > 3) s += 4; });
      if (L.gov.some(p => t.gov.indexOf(p) !== -1) && L.gov.some(p => t.gov.indexOf(p) === -1)) s += 1.5;
      // Meist Alltag, selten ein Krach (Streit um ein Projekt, Affäre, Übertritt eines Abgeordneten – geschätzt 6 % je Quartal).
      const spark = R() < 0.06;
      s += spark ? 25 + R() * 20 : R() * 3;
      L.strain = clamp(s, 0, 100);
      if (spark && L.gov.indexOf(g.party) === -1) news(g, 'Krach in der Landesregierung ' + E.stateById(land).name + ': ' + L.gov.map(sname).join('-') + ' streitet offen.', 'info');
      if (due.indexOf(land) !== -1 || L.strain < 45 || R() >= (L.strain - 45) / 150) return;
      // Wer geht? Der Partner, dem es im Bund am schlechtesten geht.
      const partners = L.gov.slice(1);
      const out = partners.sort((a, b) => (shareOf(g, a) - (t.start[a] || 0)) - (shareOf(g, b) - (t.start[b] || 0)))[0];
      const name = E.stateById(land).name;
      const alt = landAlternative(g, land, out);
      if (L.gov.indexOf(g.party) !== -1) {
        t.pending.push({ type: 'landkrise', land, out, alt });
        news(g, 'Koalitionskrise in ' + name + ': ' + sname(out) + ' droht mit dem Bruch.', 'warn');
        return;
      }
      if (alt && R() < 0.5) {
        const old = L.gov.slice();
        L.gov = alt;
        L.strain = 15;
        news(g, 'Regierungswechsel ohne Wahl in ' + name + ': ' + old.map(sname).join('-') + ' zerbricht, ' + alt.map(sname).join('-') + ' übernimmt (' + L.votes + ' Stimmen im Bundesrat).', 'big');
        chron(g, 'wahl', 'Regierungswechsel in ' + name + ' ohne Wahl: ' + alt.map(sname).join('-') + ' statt ' + old.map(sname).join('-') + '.');
      } else {
        news(g, 'Koalitionsbruch in ' + name + ': ' + sname(out) + ' verlässt die Regierung. Der Landtag löst sich auf – Neuwahl.', 'big');
        chron(g, 'wahl', 'Koalitionsbruch in ' + name + ' – vorgezogene Neuwahl.');
        landtagswahl(g, land);
      }
    });
  }
  function resolveLandkrise(g, item, choice) {
    const t = g.term;
    const L = t.laender[item.land];
    const name = E.stateById(item.land).name;
    let text;
    if (choice === 0) {
      // Retten mit Zugeständnissen: klappt meist, die eigene Basis im Land murrt.
      if (rand(g) < 0.7) {
        L.strain = 25;
        t.party.lv[item.land] = clamp((t.party.lv[item.land] || 20) + 8, 0, 100);
        text = 'Nach einer Nachtsitzung steht die Koalition in ' + name + ' wieder – ' + sname(item.out) + ' bekommt Zugeständnisse, euer Landesverband murrt.';
        chron(g, 'wahl', 'Koalitionskrise in ' + name + ' beigelegt – mit Zugeständnissen an ' + sname(item.out) + '.');
      } else {
        text = sname(item.out) + ' lässt sich nicht halten. Der Landtag in ' + name + ' löst sich auf – Neuwahl.';
        chron(g, 'wahl', 'Rettungsversuch in ' + name + ' gescheitert – Neuwahl.');
        landtagswahl(g, item.land);
        flushLtwNight(g);
      }
    } else if (choice === 1) {
      text = 'Ihr setzt auf Neuwahlen in ' + name + '.';
      chron(g, 'wahl', 'Neuwahl in ' + name + ' nach dem Koalitionsbruch.');
      landtagswahl(g, item.land);
      flushLtwNight(g);
    } else if (choice === 2 && item.alt) {
      const old = L.gov.slice();
      L.gov = item.alt;
      L.strain = 15;
      addCred(g, -2, 'Koalitionswechsel ohne Wahl in ' + name);
      text = 'Neues Bündnis in ' + name + ': ' + item.alt.map(sname).join('-') + ' statt ' + old.map(sname).join('-') + '. Die Opposition spricht von Verrat am Wählerwillen.';
      chron(g, 'wahl', 'Koalitionswechsel in ' + name + ': ' + item.alt.map(sname).join('-') + ' ohne Neuwahl.');
    } else {
      // Ohne Alternative und ohne Entscheidung: Die Koalition schleppt sich weiter.
      L.strain = 40;
      text = 'Die Koalition in ' + name + ' schleppt sich weiter.';
    }
    news(g, text + ' Bundesrat: Länder nur mit Bundesregierungsparteien jetzt ' + brAligned(t) + ' von 69 Stimmen.', 'info');
    return text;
  }

  // Werden in einem Quartal mehrere Länder mit Geld gewonnen, spricht die Presse vom Kuhhandel (Glaubwürdigkeit).
  function kuhhandel(g, n) {
    const t = g.term;
    t.brMoney = t.brMoney && t.brMoney.q === t.q ? t.brMoney : { q: t.q, n: 0, said: false };
    t.brMoney.n += n;
    if (t.brMoney.n >= 2 && !t.brMoney.said) {
      t.brMoney.said = true;
      addCred(g, -2, 'Kuhhandel im Bundesrat');
      news(g, 'Kuhhandel im Bundesrat: Die Bundesregierung kauft sich Länderstimmen mit Milliarden.', 'warn');
    }
  }

  // Was eine Landesregierung für den Bundesrat bedeutet: Stimmen der Länder, in denen nur Bundesregierungsparteien regieren.
  function brAligned(t) { return Object.keys(t.laender).reduce((s, l) => s + (t.laender[l].gov.every(p => t.gov.indexOf(p) !== -1) ? t.laender[l].votes : 0), 0); }

  function europawahl(g) {
    const t = g.term;
    cat('wahlen');
    const sh = A.nationalShares(g);
    const own = r1(sh[g.party] * (1 + between(g, -0.06, 0.08)));
    const diff = own - t.share0;
    addNat(g, g.party, clamp(diff * 0.04, -0.3, 0.3));
    // Ohne Sperrklausel ziehen auch kleine Parteien ins EU-Parlament ein: Geld und Aufmerksamkeit.
    const seatsEU = Math.round(own / 100 * 96);
    if (seatsEU > 0) t.party.cash += 0.15 * seatsEU * moneyScale(g) / 2;
    if (t.role === 'apo') t.party.unity = clamp(t.party.unity + (seatsEU > 0 ? 6 : -4), 0, 100);
    news(g, '🇪🇺 Europawahl: ' + party(g.party).short + ' ' + f1(own) + ' % (' + (diff >= 0 ? '+' : '−') + f1(Math.abs(diff)) + ' zur Bundestagswahl), ' + seatsEU + ' von 96 deutschen Sitzen.', 'big');
    t.pending.push({ type: 'info', kind: 'ew', own, seats: seatsEU, diff: r1(diff) });
  }

  // ---------- Ereignisse ----------
  function eventChoices(g, ev) {
    return isGov(g.term.role) && ev.gov ? ev.gov : ev.choices;
  }
  function eligibleRole(g, ev) {
    const role = g.term.role;
    const roles = ev.roles || [];
    return roles.indexOf(role) !== -1 || (roles.indexOf('gov') !== -1 && isGov(role)) || (roles.indexOf('opp') !== -1 && role === 'opposition');
  }
  function eligible(g, ev) {
    const t = g.term;
    const role = t.role;
    const roles = ev.roles || [];
    const okRole = roles.indexOf(role) !== -1 || (roles.indexOf('gov') !== -1 && isGov(role)) || (roles.indexOf('opp') !== -1 && role === 'opposition');
    if (!okRole) return false;
    if (ev.special) return false; // feste Termine des politischen Jahres
    if (ev.req && !reqOk(g, ev.req)) return false;
    if (ev.parties && ev.parties.indexOf(g.party) === -1) return false;
    if (ev.notParty && ev.notParty.indexOf(g.party) !== -1) return false;
    if (ev.minQ && t.q < ev.minQ) return false;
    const last = t.usedEvents[ev.id];
    if (last !== undefined && (ev.once || t.q - last < 6)) return false;
    if (ev.id === 'coal_dispute' || ev.id === 'coal_leak') return t.gov.length > 1;
    if (ev.id === 'coal_poll') return t.gov.length > 1 && shareOf(g, g.party) < t.share0 - 1;
    return true;
  }
  // Ereignisse, die nur in bestimmten Lagen kommen.
  function reqOk(g, req) {
    const t = g.term;
    const e = t.econ;
    const own = (t.lastNat && t.lastNat[g.party]) || 0;
    switch (req) {
      case 'recession': return e.growth < 0;
      case 'highInfl': return e.infl > 3.5;
      case 'highUnemp': return e.unemp > 7.5;
      case 'minority': return isGov(t.role) && govSeats(t) < MAJ;
      case 'afdHigh': return ((t.lastNat && t.lastNat.afd) || 0) > 30;
      case 'threeParty': return t.gov.length >= 3;
      case 'lowPoll': return own < t.share0 - 4;
      case 'highPoll': return own > t.share0 + 4;
      case 'nearHurdle': return own >= 3.5 && own < 5;
      default: {
        // „lage:wohnen<-0.5“: Indikator hat sich seit der Wahl um mehr als eine halbe Stufe verschlechtert.
        const m = /^lage:(\w+)([<>])(-?[\d.]+)$/.exec(req);
        if (!m) return true;
        ensureLage(g);
        const x = lageDef(m[1]);
        if (!x) return false;
        const imp = lageImp(t, x, t.lage0);
        return m[2] === '<' ? imp < Number(m[3]) : imp > Number(m[3]);
      }
    }
  }
  function eventLand(g, ev) {
    const t = g.term;
    if (ev.choices && ev.choices.some(c => c.landFix)) return ev.choices.find(c => c.landFix).landFix;
    const list = ev.land || D.STATES.map(s => s.id);
    return list.slice().sort((a, b) => (t.party.lv[b] || 0) - (t.party.lv[a] || 0) + between(g, -15, 15))[0];
  }
  function drawEvent(g) {
    const t = g.term;
    const list = TD.EVENTS.filter(ev => (ev.w || 0) > 0 && eligible(g, ev));
    if (!list.length) return null;
    // Unruhige Landesverbände machen Konflikte wahrscheinlicher.
    const maxLv = Math.max.apply(null, Object.keys(t.party.lv).map(l => t.party.lv[l]));
    const weight = ev => ev.w * (ev.cat === 'lv' ? 0.6 + maxLv / 50 : 1) * (ev.cat === 'koalition' ? 1 + Math.max(0, 50 - t.mood) / 25 : 1);
    const total = list.reduce((s, ev) => s + weight(ev), 0);
    let x = rand(g) * total;
    let ev = list[0];
    for (const it of list) { x -= weight(it); if (x <= 0) { ev = it; break; } }
    return ev;
  }
  function queueEvent(g, ev, from) {
    const t = g.term;
    t.usedEvents[ev.id] = t.q;
    const item = { type: 'event', id: ev.id };
    if (from && from.land) item.land = from.land;
    if (!item.land && (/\{land/.test(ev.title + ev.text) || ev.cat === 'lv')) item.land = eventLand(g, ev);
    const partners = t.gov.filter(p => p !== g.party);
    item.partner = partners.length ? pick(g, partners) : t.chanc;
    const tops = A.TOPIC_IDS.slice().sort((a, b) => g.salience[b] - g.salience[a]).slice(0, 5);
    item.topic = pick(g, tops);
    if (ev.cat === 'intl' || ev.cat === 'inland' || ev.cat === 'wirtschaft') t.crisisQ = t.q;
    // Abwechslung: Firma, Stadt und Person wechseln von Spiel zu Spiel (frei erfunden, keine realen Unternehmen).
    const tx = ev.title + ev.text;
    if (/\{firma\}/.test(tx)) item.firm = pick(g, EV_FIRMS);
    if (/\{stadt\}/.test(tx)) item.city = item.land ? EV_CITY[item.land] : pick(g, Object.keys(EV_CITY).map(k => EV_CITY[k]));
    if (/\{person\}/.test(tx)) item.person = newPerson(g, g.party, pick(g, D.STATES).id).full;
    t.pending.push(item);
  }
  const EV_FIRMS = ['Ein großer Autozulieferer aus Niedersachsen', 'Ein Maschinenbaukonzern aus Baden-Württemberg', 'Ein Chemiekonzern vom Rhein',
    'Ein Stahlhersteller aus dem Ruhrgebiet', 'Ein ostdeutscher Batteriehersteller', 'Ein Familienunternehmen aus Franken mit Weltmarktführerschaft'];
  const EV_CITY = { BW: 'Stuttgart', BY: 'Nürnberg', BE: 'Berlin', BB: 'Cottbus', HB: 'Bremen', HH: 'Hamburg', HE: 'Kassel', MV: 'Rostock', NI: 'Hannover', NW: 'Duisburg',
    RP: 'Ludwigshafen', SL: 'Saarbrücken', SN: 'Chemnitz', ST: 'Halle', SH: 'Lübeck', TH: 'Erfurt' };
  // Wer ist für ein Ereignis zuständig? (nur in der Regierung relevant)
  function eventMinister(g, ev) {
    const t = g.term;
    if (!isGov(t.role)) return null;
    return ministerFor(t, ev.ministry || CAT_MINISTRY[ev.cat] || '');
  }
  function fillText(g, item, s) {
    return String(s || '')
      .replace(/\{landName\}/g, item.land ? E.stateById(item.land).name : '')
      .replace(/\{land\}/g, item.land ? E.stateById(item.land).name : '')
      .replace(/\{partner\}/g, item.partner ? sname(item.partner) : '')
      .replace(/\{topic\}/g, item.topic ? E.topicById(item.topic).name : '')
      .replace(/\{minister\}/g, item.minister || '')
      .replace(/\{firma\}/g, item.firm || 'Ein großer Industriekonzern')
      .replace(/\{stadt\}/g, item.city || 'einer Großstadt')
      .replace(/\{person\}/g, item.person || '')
      .replace(/\{ministry\}/g, item.ministry ? ministryById(item.ministry).short + '-Ministerium' : '');
  }

  function applyFx(g, fx, item) {
    if (!fx) return;
    const t = g.term;
    const e = t.econ;
    if (fx.own) addNat(g, g.party, fx.own);
    if (fx.gov) t.gov.forEach(p => addNat(g, p, fx.gov * (p === g.party ? 1 : 0.8)));
    if (fx.chanc) addNat(g, t.chanc, fx.chanc);
    if (fx.unity) t.party.unity = clamp(t.party.unity + fx.unity, 0, 100);
    if (fx.lv && item && item.land) t.party.lv[item.land] = clamp((t.party.lv[item.land] || 20) + fx.lv, 0, 100);
    if (fx.mood && t.gov.length > 1) t.mood = clamp(t.mood + fx.mood, 0, 100);
    if (fx.growth) e.growth += fx.growth;
    if (fx.unemp) e.unemp += fx.unemp;
    if (fx.infl) e.infl += fx.infl;
    if (fx.intl) t.intl = clamp(t.intl + fx.intl, 0, 100);
    if (fx.like) t.party.leader.like = clamp(t.party.leader.like + fx.like, -5, 5);
    if (fx.sal) Object.keys(fx.sal).forEach(k => A.changeSalience(g, k, fx.sal[k]));
    if (fx.members) t.party.members = Math.round(t.party.members * (1 + fx.members / 100));
    if (fx.cash) t.party.cash = Math.max(0, t.party.cash + fx.cash * moneyScale(g));
    if (fx.budget && isGov(t.role)) t.budget.oneoff += fx.budget;
    else if (fx.budget) t.budget.oneoff += fx.budget * 0.6;
    if (fx.def) t.budget.def += fx.def;
    if (fx.comp && g.competence) Object.keys(fx.comp).forEach(k => { g.competence[k] = clamp((g.competence[k] || 40) + fx.comp[k], 5, 95); });
    if (fx.debtRule) t.budget.reform = (t.budget.reform || 0) + fx.debtRule;
    if (fx.ap) t.ap = Math.max(0, t.ap + fx.ap);
    if (fx.lage) { ensureLage(g); Object.keys(fx.lage).forEach(k => { if (k in t.lage) t.lage[k] += fx.lage[k]; }); }
    if (fx.fwLand) addCred(g, -5, 'Gespräche mit der AfD im Land geduldet');
  }

  // Bundeswehr-Mandat (Parlamentsvorbehalt): Abstimmung im Bundestag.
  function mandateVote(g) {
    const t = g.term;
    let yes = 0; let no = 0;
    CONTEST.forEach(p => {
      const s = t.seats[p] || 0;
      if (!s) return;
      const l = leanOf(g, p, 'verteidigung');
      let y;
      if (t.gov.indexOf(p) !== -1) y = Math.round(s * (l === -1 ? 0.8 : 0.98));
      else y = l >= 0 ? Math.round(s * 0.85) : 0;
      yes += y; no += s - y;
    });
    return { yes, no, pass: yes > no };
  }

  function P_like(g, v) { g.term.party.leader.like = clamp(g.term.party.leader.like + v, -5, 5); }
  function resolvePending(g, choice, extra) {
    const t = g.term;
    const item = t.pending[0];
    if (!item) return { ok: false };
    let text = '';
    cat({ scandal: 'skandal', vote: 'abstimmung', cabinet: 'kabinett', veto: 'kabinett', disloyal: 'kabinett', sq: 'statusquo', lobby: 'lobby', door: 'lobby', lobbyaffair: 'skandal', landkoa: 'wahlen', ltwcamp: 'wahlen', debatte: 'parlament', namentlich: 'parlament', haushaltskrise: 'haushalt', gewissen: 'abstimmung', memory: 'glaubw', eckwerte: 'haushalt', kbefragung: 'aktion', bereinigung: 'haushalt', brstell: 'parlament', anhoerung: 'parlament', whip: 'abstimmung', brwhip: 'parlament', kabinettstop: 'aktion', schattenkabinett: 'aktion', wkcase: 'aktion', parteitag_o: 'partei', fluegel: 'partei', machtkampf: 'partei', ruecktritt: 'kabinett', ehrgeiz: 'kabinett', halbzeit: 'kabinett' }[item.type] || 'ereignis');
    if (item.type === 'wkcase') {
      text = resolveWk(g, item, choice);
      t.pending.shift();
      return { ok: true, text };
    }
    if (item.type === 'kabinettstop' || item.type === 'schattenkabinett') {
      text = resolveRoleScene(g, item, choice);
      t.pending.shift();
      return { ok: true, text };
    }
    if (['parteitag_o', 'fluegel', 'machtkampf', 'ruecktritt', 'ehrgeiz', 'halbzeit'].indexOf(item.type) !== -1) {
      text = resolvePartyLife(g, item, choice);
      t.pending.shift();
      return { ok: true, text };
    }
    if (item.type === 'event') {
      const ev = eventById(item.id);
      const c = eventChoices(g, ev)[choice];
      if (!c) return { ok: false };
      let ok = true;
      const resp = eventMinister(g, ev);
      if (c.chance !== undefined) ok = rand(g) < clamp(c.chance + (resp && isGov(t.role) ? (resp.comp - 60) / (ev.big ? 100 : 200) : 0), 0.05, 0.95);
      if (ev.big) { cat('krise'); TIER = 'slow'; }
      applyFx(g, c.fx, item);
      if (ok && c.fx2) applyFx(g, c.fx2, item);
      if (!ok) applyFx(g, c.fail, item);
      TIER = null;
      // Regiert ihr nicht, entscheidet die Regierung selbst – auch sie kann in der Krise gewinnen oder verlieren.
      if (ev.big && ev.gov && !isGov(t.role)) {
        const good = rand(g) < 0.55;
        const amt = good ? between(g, 1, 3) : -between(g, 1, 2.5);
        cat('konkurrenz');
        addNatT(g, t.chanc, amt, 'slow');
        news(g, (good ? 'Die Bundesregierung meistert die Lage (' : 'Die Bundesregierung wirkt überfordert (') + fillText(g, item, ev.title) + ').', good ? 'info' : 'warn');
      }
      // Ein unglückliches Bild in der Krise (Vorbild Flut 2021) – trifft Regierung wie Opposition.
      if (ev.big && ev.cat !== 'skandal' && rand(g) < 0.12) (t.followUps = t.followUps || []).push({ id: 'gaffe', q: t.q + 1 });
      const nx = ok ? c.next : (c.failNext || c.next);
      if (nx) (t.followUps = t.followUps || []).push({ id: nx.id, q: t.q + (nx.in || 2), land: item.land });
      text = c.chance !== undefined ? (ok ? c.okText : c.failText) || '' : '';
      if (c.mandate) {
        const v = mandateVote(g);
        if (v.pass) { text += ' Der Bundestag erteilt das Mandat (' + v.yes + ':' + v.no + ').'; }
        else { text += ' Der Bundestag verweigert das Mandat (' + v.yes + ':' + v.no + ') – eine Blamage.'; t.intl = clamp(t.intl - 8, 0, 100); t.gov.forEach(p => addNat(g, p, -0.25)); }
      }
      news(g, fillText(g, item, ev.title) + ': ' + c.label + '. ' + text, 'event');
      if (c.chance !== undefined || ev.big) (t.memory = t.memory || []).push({ q: t.q, title: fillText(g, item, ev.title), label: c.label, ok, role: t.role });
      chron(g, 'entscheidung', fillText(g, item, ev.title) + ': ' + c.label + (c.chance !== undefined ? (ok ? ' – ging auf.' : ' – ging schief.') : '.'));
    } else if (item.type === 'scandal') {
      const m = t.cabinet[item.ministry];
      if (choice === 0) { // festhalten
        const ok = rand(g) < 0.5;
        if (ok) { addNat(g, g.party, -0.3); text = m.name + ' übersteht die Affäre.'; }
        else { addNat(g, g.party, -1.8); t.party.leader.like = clamp(t.party.leader.like - 0.3, -5, 5); t.mood = clamp(t.mood - 5, 0, 100); text = 'Immer neue Details – der Druck wird unerträglich.'; }
      } else { // entlassen
        t.formerNames.push(m.name);
        lobbyDoor(g, m.name, item.ministry);
        t.cabinet[item.ministry] = { party: g.party, name: null, cands: candidatesFor(g, g.party) };
        t.party.unity = clamp(t.party.unity - 2, 0, 100);
        addNat(g, g.party, -0.4);
        text = m.name + ' tritt zurück. Ihr müsst die Nachfolge benennen.';
      }
      news(g, 'Affäre im ' + ministryById(item.ministry).short + '-Ministerium: ' + text, 'warn');
    } else if (item.type === 'landkoa') {
      const L = t.laender[item.land];
      const name = E.stateById(item.land).name;
      const before = L.gov.slice();
      const o = item.options[choice];
      if (o) {
        L.gov = o.slice();
        t.party.unity = clamp(t.party.unity + 2, 0, 100);
        if (isGov(t.role) && t.gov.length > 1 && t.gov.some(p => p !== g.party && o.indexOf(p) === -1) && o.some(p => t.gov.indexOf(p) === -1)) t.mood = clamp(t.mood - 3, 0, 100);
        text = 'In ' + name + ' regiert jetzt ' + o.map(sname).join('-') + '.';
      } else {
        // Opposition im Land: Die anderen bilden eine Regierung ohne euch.
        const last = (t.ltwLog || []).filter(x => x.land === item.land).slice(-1)[0];
        const seats = last ? last.seats : null;
        if (seats) {
          // Gleiche Regeln wie sonst – nur ohne euch (eure Sitze bleiben, zählen aber nicht für die Regierung).
          const rest = Object.assign({}, seats, { [g.party]: 0 });
          L.gov = landGovernment(g, rest, item.land, before.filter(p => p !== g.party));
        } else if (before.indexOf(g.party) !== -1 && before.length > 1) L.gov = before.filter(p => p !== g.party);
        const minority = seats && L.gov.reduce((x, p) => x + (seats[p] || 0), 0) < MAJ;
        text = 'Ihr geht in ' + name + ' in die Opposition. Regierung: ' + L.gov.map(sname).join('-') + (minority ? ' (Minderheitsregierung).' : '.');
      }
      const entry = (t.ltwLog || []).filter(x => x.land === item.land).slice(-1)[0];
      if (entry) { entry.gov = L.gov.slice(); entry.inGov = L.gov.indexOf(g.party) !== -1; }
      text += ' Bundesrat: Länder nur mit Bundesregierungsparteien jetzt ' + brAligned(t) + ' von 69 Stimmen.';
      news(g, '🤝 Regierungsbildung in ' + name + ': ' + L.gov.map(sname).join('-') + '.', 'info');
    } else if (item.type === 'haushaltskrise') {
      if (choice === 0) { t.budget.talks = true; t.budget.oneoff += 2; text = 'Ihr verhandelt mit der Opposition über den Etat. Beim nächsten Anlauf stehen die Chancen besser – es kostet Zugeständnisse.'; }
      else if (choice === 1) {
        const draft = t.budget.draft;
        if (draft && playerDraftsBudget(g)) { draft.done = false; text = 'Zurück ans Reißbrett: Überarbeitet den Entwurf im Haushalt-Tab.'; }
        else if (draft) { t.gov.forEach(p => { const pr = TD.AREA_PREF[p] || {}; Object.keys(pr).forEach(a => { if (pr[a] > 0 && a in draft.plan) draft.plan[a] = stepShift(a, draft.plan[a], 1); }); }); t.mood = clamp(t.mood + 4, 0, 100); text = 'Das Finanzministerium überarbeitet den Entwurf – die Partner bekommen mehr Geld für ihre Schwerpunkte.'; }
      } else if (choice === 2 && t.role === 'kanzler') {
        news(g, 'Vertrauensfrage nach dem gescheiterten Haushalt: Der Weg zu Neuwahlen ist frei.', 'big');
        endTerm(g, 'Neuwahl nach gescheitertem Haushalt (Vertrauensfrage)');
        t.pending.shift();
        return { ok: true, text: 'Ihr stellt die Vertrauensfrage. Es gibt Neuwahlen.' };
      } else text = 'Ihr regiert mit vorläufiger Haushaltsführung weiter und versucht es im nächsten Quartal erneut.';
    } else if (item.type === 'debatte') {
      const law = t.laws.find(l => l.id === item.law);
      if (!law || law.stage !== 'bundestag') { t.pending.shift(); return { ok: true, text: '' }; }
      const comp = (g.competence && g.competence[lawTopic(law)]) || 45;
      if (item.i === 0) {
        if (choice === 0) { const ok = rand(g) < clamp(0.5 + t.party.leader.like * 0.08, 0.2, 0.85); item.q += ok ? 1 : -1; item.speaker = 'Spitze'; text = ok ? t.party.leader.name + ' hält eine kämpferische Rede – das Plenum hört zu.' : t.party.leader.name + ' verhaspelt sich – die Opposition lacht.'; }
        else if (choice === 1) { const ok = rand(g) < clamp(0.35 + comp / 140, 0.25, 0.9); item.q += ok ? 1 : 0; item.speaker = 'Fachpolitik'; text = ok ? 'Die Fachpolitikerin überzeugt mit Detailwissen.' : 'Solide, aber trocken.'; }
        else { item.speaker = 'Routine'; text = 'Ihr lasst die Debatte laufen – keine Risiken, kein Glanz.'; }
        item.i = 1;
        return { ok: true, text, more: true };
      }
      if (choice === 0) { const ok = comp >= 55 || rand(g) < 0.4; item.q += ok ? 1 : -1; text = ok ? 'Die Argumente sitzen.' : 'Ein Zwischenruf deckt eine Schwäche auf.'; }
      else if (choice === 1) { const ok = t.party.leader.like > 0 || rand(g) < 0.5; item.q += ok ? 1 : 0; text = ok ? 'Die Geschichte einer Betroffenen geht unter die Haut.' : 'Das wirkt etwas aufgesetzt.'; }
      else { t.party.unity = clamp(t.party.unity + 2, 0, 100); text = 'Ihr greift die Opposition frontal an – die eigenen Reihen schließen sich.'; }
      law.conv = law.conv || {};
      if (item.q > 0) law.conv[g.party] = (law.conv[g.party] || 0) + 2 * item.q;
      addNat(g, g.party, 0.04 * item.q * ACT_K);
      law.log.push('Schlussdebatte (2./3. Lesung): ' + (item.q > 0 ? 'starke Rede für den Entwurf.' : item.q < 0 ? 'schwacher Auftritt.' : 'Routine.'));
      const v = bundestagVote(g, law);
      text += ' Prognose für die Abstimmung: ' + v.yes + ' Ja, ' + v.no + ' Nein.';
    } else if (item.type === 'namentlich') {
      const law = t.laws.find(l => l.id === item.law);
      if (law && choice === 0) { law.namentlich = true; text = 'Ihr beantragt namentliche Abstimmung: Jede Stimme wird mit Namen protokolliert.'; }
      else text = 'Abstimmung per Handzeichen.';
    } else if (item.type === 'gewissen') {
      const x = GEWISSEN.find(y => y.id === item.id);
      const line = choice === 0 ? null : choice === 1 ? 'ja' : 'nein';
      const v = gewissenVote(g, item, line);
      const base = x.support[g.party] === undefined ? 0.5 : x.support[g.party];
      if (!line) { t.party.unity = clamp(t.party.unity + 3, 0, 100); addCred(g, 1, 'Gewissensentscheidung freigegeben: ' + x.title); }
      else if ((line === 'ja') !== (base >= 0.5)) { t.party.unity = clamp(t.party.unity - 5, 0, 100); text = 'Viele in der Fraktion sind gegen eure Linie – Unmut. '; }
      else t.party.unity = clamp(t.party.unity - 1, 0, 100);
      const own = v.detail[g.party];
      const my = own ? (own.yes >= own.no ? 'ja' : 'nein') : null;
      const rec = { kind: 'bt', title: x.title, detail: v.detail, yes: v.yes, no: v.no, abst: v.abst, pass: v.pass, method: 'namentlich', decisive: false, names: [], my, gewissen: true, free: !line, q: t.q };
      archiveVote(g, rec, { gewissen: true });
      text += (v.pass ? 'Angenommen' : 'Abgelehnt') + ': ' + v.yes + ' Ja, ' + v.no + ' Nein, ' + v.abst + ' Enthaltungen. Eure Fraktion: ' + (own ? own.yes + ' Ja, ' + own.no + ' Nein' : '–') + '.';
      news(g, '🗳️ Gewissensentscheidung „' + x.title + '“: ' + (v.pass ? 'angenommen' : 'abgelehnt') + ' (' + v.yes + ':' + v.no + ').', 'big');
      t.pending.shift();
      return { ok: true, text, reel: rec };
    } else if (item.type === 'kbefragung') {
      const comp = (g.competence && g.competence[item.topic]) || 40;
      if (choice === 0) {
        if (rand(g) < clamp(0.35 + comp / 120, 0.3, 0.9)) { P_like(g, 0.1); addNat(g, g.party, 0.05); text = 'Sattelfest: Ihr beantwortet jede Nachfrage mit Zahlen. Selbst die Opposition nickt.'; }
        else { P_like(g, -0.06); text = 'Eine Zahl stimmt nicht – die Opposition korrigiert genüsslich.'; }
      } else if (choice === 1) { t.party.unity = clamp(t.party.unity + 2, 0, 100); P_like(g, -0.03); text = 'Ihr dreht den Spieß um und attackiert die Opposition. Die eigene Fraktion jubelt.'; }
      else { addCred(g, -1, 'In der Regierungsbefragung ausgewichen'); text = 'Ausweichende Antworten – „Kanzler:in ohne Antworten“, schreibt die Presse.'; }
    } else if (item.type === 'eckwerte') {
      t.budget.eck = ['fort', 'konsol', 'invest', 'wishes'][choice] || 'fort';
      if (t.budget.eck === 'wishes') t.mood = clamp(t.mood + 3, 0, 100);
      if (t.budget.eck === 'konsol') { t.mood = clamp(t.mood - 2, 0, 100); addCred(g, 1, 'Solide Eckwerte für den Haushalt'); }
      if (t.budget.eck === 'invest') t.mood = clamp(t.mood + 1, 0, 100);
      text = { wishes: 'Die Anmeldungen der Ressorts werden bewilligt: mehr Geld für ' + (item.wishes || []).map(w => areaById(w.a).name.split(' (')[0]).join(' und ') + '.', fort: 'Die Eckwerte schreiben den bisherigen Haushalt fort.', konsol: 'Sparkurs: Die Eckwerte sehen Kürzungen in allen gestaltbaren Bereichen vor.', invest: 'Investitionskurs: mehr Geld für Verkehr, Forschung, Verteidigung und Wohnen.' }[t.budget.eck] +
        ' Der Regierungsentwurf im Sommer baut darauf auf.';
      news(g, 'Eckwertebeschluss für den Haushalt ' + item.year + ': ' + text, 'info');
    } else if (item.type === 'bereinigung') {
      if (choice === 0) { t.budget.oneoff += 0.8; t.mood = clamp(t.mood + 3, 0, 100); t.party.unity = clamp(t.party.unity + 2, 0, 100); text = 'In der Bereinigungssitzung bekommen die Haushälter ihre Projekte (0,8 Mrd. €) – Fraktionen und Partner sind zufrieden.'; }
      else { t.mood = clamp(t.mood - 2, 0, 100); addCred(g, 1, 'Keine Wahlkreisgeschenke im Haushalt'); text = 'Ihr bleibt hart: keine Extrawünsche. Die Haushälter murren.'; }
      news(g, 'Bereinigungssitzung des Haushaltsausschusses (Haushalt ' + item.year + '): ' + text, 'info');
    } else if (item.type === 'memory') {
      const m = item.m;
      if (choice === 0) { if (m.ok) { addCred(g, 2, 'Zu „' + m.title + '“ gestanden'); addNat(g, g.party, 0.08); text = 'Ihr steht zu eurer Entscheidung – und könnt auf das Ergebnis verweisen.'; } else { addCred(g, -2, 'Gescheiterte Entscheidung schöngeredet'); text = 'Ihr verteidigt die Entscheidung. Die Interviewerin bleibt skeptisch: „Aber es hat doch nicht funktioniert?“'; } }
      else if (choice === 1) { if (m.ok) { t.party.leader.like = clamp(t.party.leader.like + 0.03, -5, 5); text = 'Bescheiden: „Es war ein Teamerfolg.“ Sympathisch.'; } else { addCred(g, 2, 'Fehler bei „' + m.title + '“ eingestanden'); addNat(g, g.party, -0.04); text = '„Das war ein Fehler, wir haben daraus gelernt.“ Selten – und glaubwürdig.'; } }
      else { addCred(g, -1); text = 'Ihr weicht aus. Der Clip wird mit dem Titel „Keine Antwort“ geteilt.'; }
    } else if (item.type === 'ltwcamp') {
      const name = E.stateById(item.land).name;
      if (choice === 1) {
        t.ltwBoost[item.land] = Math.min(4, (t.ltwBoost[item.land] || 0) + 0.8);
        t.party.cash -= cashCost(g, 0.3);
        t.ap = Math.max(0, t.ap - 1);
        text = 'Die Bundesspitze tourt durch ' + name + ' – Kundgebungen, Marktplätze, Talkshows. Das kostet eine Aktion.';
      } else if (choice !== 2) {
        t.party.lv[item.land] = clamp((t.party.lv[item.land] || 0) - 6, 0, 100);
        text = 'Der Landesverband ' + name + ' führt den Wahlkampf allein – und dankt für das Vertrauen.';
      } else {
        (t.ltwDistance = t.ltwDistance || {})[item.land] = true;
        text = 'Der Landesverband ' + name + ' geht auf Abstand zur Bundespartei. Das schützt vor dem Bundestrend – eine Niederlage schadet euch im Bund weniger.';
      }
    } else if (item.type === 'landkrise') {
      text = resolveLandkrise(g, item, choice);
    } else if (item.type === 'whip' || item.type === 'brwhip') {
      const law = t.laws.find(l => l.id === item.law);
      if (!law || law.stage !== (item.type === 'whip' ? 'bundestag' : 'bundesrat')) { t.pending.shift(); return { ok: true, text: '' }; }
      text = item.type === 'whip' ? resolveWhip(g, item, choice) : resolveBrWhip(g, item, choice);
      if (item.i < (item.groups || item.lands).length) return { ok: true, text, more: true };
    } else if (item.type === 'brstell') {
      const law = t.laws.find(l => l.id === item.law);
      if (!law || law.stage !== 'bundestag') { t.pending.shift(); return { ok: true, text: '' }; }
      if (choice === 0) {
        law.brDeal = true;
        t.budget.extra += 1.5; // der Bund übernimmt Kosten der Länder
        law.log.push('Gegenäußerung der Bundesregierung: Änderungswünsche der Länder werden übernommen (Bund trägt 1,5 Mrd. € Mehrkosten).');
        text = 'Ihr kommt den Ländern entgegen: Der Bund übernimmt Mehrkosten. Damit steigen die Chancen im Bundesrat.';
      } else {
        law.log.push('Gegenäußerung der Bundesregierung: Die Änderungswünsche der Länder werden zurückgewiesen.');
        text = 'Ihr weist die Forderungen der Länder zurück. Im zweiten Durchgang droht ' + (law.zust ? 'die Ablehnung' : 'der Vermittlungsausschuss') + '.';
      }
    } else if (item.type === 'anhoerung') {
      const law = t.laws.find(l => l.id === item.law);
      if (!law || law.stage !== 'bundestag') { t.pending.shift(); return { ok: true, text: '' }; }
      if (choice === 0) {
        law.fixed = true; law.delay = true;
        law.log.push('Anhörung im Ausschuss: ' + item.expert + ' Der Entwurf wird nachgebessert.');
        text = 'Ihr bessert nach. Die Abstimmung verschiebt sich um ein Quartal, dafür steht das Gesetz auf festerem Grund.';
      } else {
        law.log.push('Anhörung im Ausschuss: ' + item.expert + ' Die Koalition hält am Entwurf fest.');
        addCred(g, -1, 'Kritik in der Anhörung ignoriert: „' + lawName(law) + '“');
        text = 'Ihr haltet am Entwurf fest. Die Abstimmung bleibt im Zeitplan – Kritik und Klagerisiko bleiben auch.';
      }
    } else if (item.type === 'veto') {
      const law = t.laws.find(l => l.id === item.law);
      if (choice === 0) { law.stage = 'zurueckgezogen'; law.log.push('Zurückgezogen.'); text = 'Der Entwurf wird zurückgezogen.'; }
      else if (choice === 1 && law.kind === 'topic' && optIndex(law.topic, 0) !== t.policy[law.topic]) {
        law.opt = optIndex(law.topic, 0); law.contract = t.contract[law.topic] === law.opt; law.stage = 'bundestag'; law.btQ = t.q; t.mood = clamp(t.mood - 1, 0, 100);
        law.log.push('Kompromiss im Kabinett: „' + lawName(law) + '“.'); text = 'Kompromiss gefunden.';
      } else if (choice === 2 && t.role === 'kanzler') {
        law.stage = 'bundestag'; law.btQ = t.q; t.mood = clamp(t.mood - 12, 0, 100); law.log.push('Per Richtlinienkompetenz durchgesetzt.'); text = 'Ihr setzt den Entwurf per Richtlinienkompetenz durch – der Partner ist empört.';
      } else { law.stage = 'zurueckgezogen'; law.log.push('Zurückgezogen.'); text = 'Der Entwurf wird zurückgezogen.'; }
      news(g, '„' + lawName(law) + '“: ' + text, 'info');
    } else if (item.type === 'cabinet') {
      const law = t.laws.find(l => l.id === item.law);
      const d = lawDist(g, g.party, law);
      if (choice === 0) { law.stage = 'bundestag'; law.btQ = t.q; law.log.push('Kabinett beschließt den Entwurf.'); if (d === 2) { t.party.unity = clamp(t.party.unity - 4, 0, 100); addCred(g, -4, 'Im Kabinett einem Entwurf gegen eure Linie zugestimmt'); } else if (d === 0) addCred(g, 1); text = 'Ihr stimmt im Kabinett zu.'; }
      else if (choice === 1 && law.kind === 'topic' && optIndex(law.topic, 0) !== t.policy[law.topic] && law.opt !== optIndex(law.topic, 0)) {
        law.opt = optIndex(law.topic, 0); law.stage = 'bundestag'; law.btQ = t.q; t.mood = clamp(t.mood - 2, 0, 100); law.log.push('Nachverhandelt: „' + lawName(law) + '“.'); text = 'Ihr handelt einen Kompromiss heraus.';
      } else { law.stage = 'zurueckgezogen'; law.log.push('Im Kabinett gestoppt.'); t.mood = clamp(t.mood - 8, 0, 100); if (d >= 1) { t.party.unity = clamp(t.party.unity + 2, 0, 100); addCred(g, 2, 'Im Kabinett Linie gehalten'); } else addCred(g, -2, 'Einen Entwurf nach eurer Linie gestoppt'); text = 'Ihr stoppt den Entwurf im Kabinett.'; }
      news(g, 'Kabinett, „' + lawName(law) + '“ (' + sname(law.by) + '): ' + text, 'info');
    } else if (item.type === 'budgetcab') {
      if (choice === 1) {
        const pr = TD.AREA_PREF[g.party] || {};
        const fav = Object.keys(pr).filter(a => pr[a] > 0 && a in t.budget.draft.plan)[0];
        if (fav) t.budget.draft.plan[fav] = clamp(t.budget.draft.plan[fav] + 5, -10, 10);
        t.mood = clamp(t.mood - 5, 0, 100);
        text = 'Ihr setzt Nachbesserungen durch' + (fav ? ' (' + areaById(fav).name + ' +5 %)' : '') + '.';
      } else text = 'Ihr tragt den Haushaltsentwurf mit.';
      news(g, 'Haushaltsentwurf ' + t.budget.draft.year + ': ' + text, 'info');
    } else if (item.type === 'break') {
      const o = item.options[choice];
      if (!o) return { ok: false };
      if (o.kind === 'minority') { t.gov = t.gov.filter(p => p !== item.leaver); t.tolerated = govSeats(t) < MAJ; setupCabinet(g, reassign(t)); t.mood = 60; text = 'Ihr regiert als Minderheitsregierung weiter.'; }
      else if (o.kind === 'coalition') { setGovernment(g, o.members, item.chanc || t.chanc); text = 'Neue Koalition: ' + o.members.map(sname).join('-') + '.'; }
      else { endTerm(g, 'Neuwahl nach dem Bruch der Koalition'); text = 'Ihr stellt die Vertrauensfrage – der Weg zu Neuwahlen ist frei.'; }
      news(g, text, 'big');
    } else if (item.type === 'offer') {
      if (choice === 0) { setGovernment(g, item.members, item.chanc); text = 'Ihr tretet in die Regierung ein!'; }
      else { aiAfterBreak(g, item.exclude || [], true); text = 'Ihr lehnt das Angebot ab.'; }
      news(g, text, 'big');
    } else if (item.type === 'lobby') {
      const law = t.laws.find(l => l.id === item.law);
      const l = LB.byId(item.lobby);
      if (!law || ['kabinett', 'bundestag'].indexOf(law.stage) === -1) { t.pending.shift(); return { ok: true, text: '' }; }
      if (choice === 0) {
        if (law.kind === 'topic' && D.PROGRAM[law.topic][law.opt].lean !== 0 && optIndex(law.topic, 0) !== t.policy[law.topic]) { law.opt = optIndex(law.topic, 0); law.contract = t.contract[law.topic] === law.opt; }
        else if (law.kind === 'tax' && law.level !== law.from) { law.level += law.level > law.from ? -1 : 1; if (law.level === law.from) { law.stage = 'zurueckgezogen'; } }
        LB.addRel(g, l.id, 8);
        law.foe = null;
        law.log.push('Nach Gesprächen mit ' + l.short + ' abgeschwächt: „' + lawName(law) + '“.');
        text = 'Ihr hört ' + l.short + ' an und schwächt den Entwurf ab: „' + lawName(law) + '“.';
      } else if (choice === 1) {
        LB.addRel(g, l.id, -15);
        (t.lobbyCampaigns = t.lobbyCampaigns || []).push({ id: l.id, law: law.id, left: 2 });
        addCred(g, 1);
        text = 'Ihr bleibt standhaft. ' + l.short + ' startet eine Kampagne gegen euch – Anzeigen, Briefe an Abgeordnete, Protest vor dem Kanzleramt.';
      } else {
        law.ghost = l.id;
        law.foe = null;
        LB.addRel(g, l.id, 12);
        LB.addNear(g, 10);
        (t.ghosts = t.ghosts || []).push({ law: law.id, lobby: l.id, name: lawName(law), q: t.q });
        LB.register(g, l.id, 'Formulierungshilfe zu „' + lawName(law) + '“', quarterLabel(t));
        text = 'Ihr übernehmt die „Formulierungshilfe“ von ' + l.short + '. Der Weg durchs Parlament wird leichter – hoffentlich merkt es niemand.';
      }
      news(g, l.icon + ' ' + text, 'info');
    } else if (item.type === 'door') {
      const l = LB.byId(item.lobby);
      if (choice === 0) { LB.addRel(g, l.id, -5); addCred(g, 2, 'Karenzzeit für ' + item.name + ' durchgesetzt'); text = item.name + ' muss 18 Monate warten, bevor der Wechsel zu ' + l.short + ' möglich ist.'; }
      else { LB.addRel(g, l.id, 6); LB.addNear(g, 6); addCred(g, -4, item.name + ' wechselt nahtlos zu ' + l.short); addNat(g, g.party, -0.4); text = item.name + ' wechselt direkt zu ' + l.short + ' – „Drehtür!“, schreibt die Presse.'; }
      news(g, '🚪 ' + text, 'warn');
    } else if (item.type === 'lobbyaffair') {
      const l = LB.byId(item.lobby);
      if (choice === 0) { addNatT(g, g.party, -0.5, 'slow'); addCred(g, 1); LB.addNear(g, -12); text = 'Ihr legt alle Kontakte zu ' + l.short + ' offen und trennt euch vom Beratervertrag.'; }
      else if (rand(g) < 0.4) { addNat(g, g.party, -0.2); text = 'Die Geschichte verläuft im Sande.'; }
      else { addNatT(g, g.party, -2.0, 'slow'); addCred(g, -6, 'Lobbyaffäre um ' + l.short); t.party.leader.like = clamp(t.party.leader.like - 0.4, -5, 5); text = 'Immer neue Details über bezahlte Nebentätigkeiten für ' + l.short + ' – eine ausgewachsene Affäre.'; }
      news(g, '🔥 Lobbyaffäre: ' + text, 'warn');
    } else if (item.type === 'disloyal') {
      const m = t.cabinet[item.ministry];
      if (!m) { t.pending.shift(); return { ok: true, text: '' }; }
      if (choice === 0) { m.loyal = Math.min(100, (m.loyal || 60) + 15); t.party.unity = clamp(t.party.unity - 1, 0, 100); text = m.name + ' wird zurechtgewiesen und gelobt Besserung.'; }
      else if (choice === 1) { addCred(g, -1); t.party.leader.like = clamp(t.party.leader.like - 0.1, -5, 5); t.mood = clamp(t.mood - 2, 0, 100); text = 'Ihr lasst es laufen – die Presse spricht von Führungsschwäche.'; }
      else { t.formerNames.push(m.name); lobbyDoor(g, m.name, item.ministry); t.cabinet[item.ministry] = { party: g.party, name: null, cands: candidatesFor(g, g.party) }; t.party.unity = clamp(t.party.unity - 3, 0, 100); t.party.leader.like = clamp(t.party.leader.like + 0.1, -5, 5); text = m.name + ' wird entlassen. Ihr müsst die Nachfolge benennen.'; }
      news(g, 'Ärger im Kabinett: ' + text, 'warn');
    } else if (item.type === 'sq') {
      const topic = item.topic;
      if (choice === 0) {
        const law = makeLaw(g, { kind: 'topic', topic, opt: item.opt }, g.party);
        if (progDist(g, topic, D.PROGRAM[topic][item.opt].lean) > 0) addCred(g, -3, 'Dem Druck nachgegeben (' + E.topicById(topic).name + ')');
        text = 'Ihr gebt nach: „' + lawName(law) + '“ geht ins Kabinett.';
      } else if (choice === 1) {
        addSq(t, topic, 22); t.gov.forEach(p => addNat(g, p, -0.2)); t.party.unity = clamp(t.party.unity + 2, 0, 100);
        if (progDist(g, topic, sqLean(t, topic)) === 0) addCred(g, 2, 'Status quo verteidigt (' + E.topicById(topic).name + ')');
        text = 'Ihr haltet dagegen und verteidigt die geltende Regelung – das kostet Zustimmung.';
      } else {
        addSq(t, topic, 10); t.budget.oneoff += 1;
        text = 'Eine Expertenkommission soll Vorschläge machen. Das verschafft Zeit.';
      }
      news(g, 'Status quo beim Thema ' + E.topicById(topic).name + ': ' + text, 'info');
    } else if (item.type === 'vote') {
      const law0 = item.budget ? null : t.laws.find(l => l.id === item.law);
      let v = ['ja', 'nein', 'enthaltung'][choice] || 'nein';
      if (item.budget && choice === 3 && t.budget.draft) {
        // Haushaltsdeal: Zustimmung gegen mehr Geld für euren wichtigsten Bereich.
        const pr = TD.AREA_PREF[g.party] || {};
        const fav = Object.keys(pr).filter(a => pr[a] > 0 && a in t.budget.draft.plan)[0];
        if (fav) t.budget.draft.plan[fav] = clamp(t.budget.draft.plan[fav] + 5, -10, 10);
        v = 'ja'; addNat(g, g.party, 0.1); addCred(g, 1, 'Haushaltsdeal mit der Regierung');
        text = 'Deal: Ihr stimmt dem Haushalt zu' + (fav ? ', dafür gibt es mehr Geld für ' + areaById(fav).name : '') + '.';
        news(g, 'Haushaltsdeal: ' + party(g.party).short + ' stimmt dem Etat zu – gegen Zugeständnisse.', 'info');
      }
      if (law0 && choice === 3) {
        // Änderungsantrag in der 2. Lesung: Die Koalition lehnt fast immer ab – aber ihr zeigt eine Alternative.
        const need = bundestagVote(g, law0);
        const govYes = t.gov.reduce((x, p) => x + ((need.detail[p] && need.detail[p].yes) || 0), 0);
        const ok = law0.kind === 'topic' && D.PROGRAM[law0.topic][law0.opt].lean !== 0 && optIndex(law0.topic, 0) !== t.policy[law0.topic] && rand(g) < (govYes < MAJ ? 0.35 : 0.12);
        if (ok) { law0.opt = optIndex(law0.topic, 0); law0.log.push('Änderungsantrag der ' + party(g.party).short + ' angenommen: „' + lawName(law0) + '“.'); addCred(g, 2, 'Änderungsantrag durchgesetzt'); text = 'Sensation: Euer Änderungsantrag wird angenommen – das Gesetz wird entschärft: „' + lawName(law0) + '“.'; }
        else { addNat(g, g.party, 0.04 * ACT_K); if (g.competence && law0.kind === 'topic') g.competence[law0.topic] = Math.min(100, (g.competence[law0.topic] || 40) + 1); text = 'Euer Änderungsantrag wird abgelehnt – aber ihr habt eure Alternative gezeigt.'; }
        v = defaultVote(g, law0);
        text += ' Eure Fraktion stimmt danach mit „' + ({ ja: 'Ja', nein: 'Nein', enthaltung: 'Enthaltung' }[v]) + '“.';
      } else if (law0 && choice === 4) {
        // Zustimmung gegen Zugeständnis: Nur wenn die Koalition eure Stimmen braucht.
        t.voteChoice[law0.id] = 'nein';
        const without = bundestagVote(g, law0);
        if (!without.pass || t.tolerated) { v = 'ja'; addNat(g, g.party, 0.15); addCred(g, 1, 'Zugeständnis der Regierung herausgehandelt'); text = 'Die Koalition braucht euch – und gibt nach: Eine eurer Forderungen kommt ins Gesetz. Ihr stimmt zu.'; news(g, 'Deal im Bundestag: ' + party(g.party).short + ' stimmt „' + lawName(law0) + '“ zu – gegen ein Zugeständnis.', 'info'); }
        else { v = defaultVote(g, law0); text = 'Die Koalition hat ihre eigene Mehrheit und lehnt ab. Ihr stimmt nach eurer Linie.'; }
      }
      if (item.budget) t.voteChoice.budget = v; else t.voteChoice[item.law] = v;
      if (law0 && !law0.namentlichAsked) {
        const pv = bundestagVote(g, law0);
        const dissent = t.gov.reduce((x, p) => x + ((pv.detail[p] && pv.detail[p].no) || 0), 0);
        if (dissent >= 3) { law0.namentlichAsked = true; t.pending.splice(1, 0, { type: 'namentlich', law: law0.id, dissent }); }
      }
      if (!item.budget) {
        const law = t.laws.find(l => l.id === item.law);
        const d = lawDist(g, g.party, law);
        if (v === 'ja' && d === 2) { t.party.unity = clamp(t.party.unity - 3, 0, 100); addCred(g, -5, 'Für ein Gesetz gegen eure Linie gestimmt: „' + lawName(law) + '“'); }
        else if (v === 'nein' && d === 0) addCred(g, -2, 'Gegen ein Gesetz nach eurer Linie gestimmt: „' + lawName(law) + '“');
        else if ((v === 'ja' && d === 0) || (v === 'nein' && d === 2)) addCred(g, 1);
      }
    }
    t.pending.shift();
    return { ok: true, text };
  }

  // Ressorts nach Rückzug eines Partners neu verteilen (verbleibende Parteien übernehmen).
  function reassign(t) {
    const picks = {};
    Object.keys(t.cabinet).forEach(id => { if (t.gov.indexOf(t.cabinet[id].party) !== -1) picks[id] = t.cabinet[id].party; });
    const free = TD.MINISTRIES.filter(m => !picks[m.id]);
    free.forEach((m, i) => { picks[m.id] = t.gov[i % t.gov.length]; });
    return picks;
  }

  function setGovernment(g, members, chanc) {
    const t = g.term;
    const ordered = members.slice().sort((a, b) => (t.seats[b] || 0) - (t.seats[a] || 0));
    const c = chanc && members.indexOf(chanc) !== -1 ? chanc : ordered[0];
    t.gov = [c].concat(ordered.filter(p => p !== c));
    t.chanc = c;
    t.tolerated = govSeats(t) < MAJ;
    const oldRole = t.role;
    t.role = roleOf(g, t.gov);
    t.apMax = TD.ROLES[t.role].ap;
    t.mood = 58;
    setupCabinet(g, draftMinistries(t));
    buildContract(g, null);
    if (oldRole !== t.role) news(g, 'Rollenwechsel: ' + TD.ROLES[oldRole].name + ' → ' + TD.ROLES[t.role].name + '. ' + introText(g), 'role');
  }

  // Nach einem Koalitionsbruch ohne euch: neue Mehrheit, Minderheitsregierung oder Neuwahl.
  function aiAfterBreak(g, exclude, noOffer) {
    const t = g.term;
    const opts = E.findCoalitions(t.seats, g).filter(c => c.viable && !c.tolerated && c.members.every(p => exclude.indexOf(p) === -1));
    const withMe = opts.filter(c => c.members.indexOf(g.party) !== -1);
    if (!noOffer && withMe.length && rand(g) < 0.6) {
      const o = withMe.sort((a, b) => a.members.length - b.members.length || a.seats - b.seats)[0];
      const chanc = o.members.slice().sort((a, b) => t.seats[b] - t.seats[a])[0];
      t.pending.push({ type: 'offer', members: o.members, chanc, exclude });
      return;
    }
    const other = opts.filter(c => c.members.indexOf(g.party) === -1 || noOffer).filter(c => c.members.indexOf(g.party) === -1);
    if (other.length && rand(g) < 0.55) {
      const o = other.sort((a, b) => a.members.length - b.members.length || a.seats - b.seats)[0];
      setGovernment(g, o.members, t.gov.find(p => o.members.indexOf(p) !== -1));
      news(g, 'Neue Bundesregierung ohne Neuwahl: ' + o.members.map(sname).join('-') + '.', 'big');
      return;
    }
    if (rand(g) < 0.5 && t.gov.length) {
      t.tolerated = true;
      setupCabinet(g, reassign(t));
      news(g, sname(t.chanc) + ' regiert als Minderheitsregierung weiter.', 'big');
      return;
    }
    endTerm(g, 'Neuwahl nach dem Ende der Koalition');
  }

  function breakCoalition(g, leaver) {
    const t = g.term;
    t.stats.breaks = (t.stats.breaks || 0) + 1;
    news(g, '💥 Koalitionsbruch: ' + sname(leaver) + ' verlässt die Bundesregierung.', 'big');
    const rest = t.gov.filter(p => p !== leaver);
    if (t.role === 'kanzler' && leaver !== g.party) {
      const alts = E.findCoalitions(t.seats, g).filter(c => c.viable && !c.tolerated && c.members.indexOf(g.party) !== -1 && c.members.indexOf(leaver) === -1);
      const options = [{ kind: 'minority', label: 'Als Minderheitsregierung weitermachen', hint: govSeatsOf(t, rest) + ' Sitze – jede Abstimmung wird zur Zitterpartie' }];
      alts.slice(0, 3).forEach(c => options.push({ kind: 'coalition', members: c.members, label: 'Neue Koalition: ' + c.members.map(sname).join('-'), hint: c.seats + ' Sitze' }));
      options.push({ kind: 'neuwahl', label: 'Vertrauensfrage stellen – Neuwahl', hint: 'Der Bundespräsident löst den Bundestag auf' });
      t.pending.unshift({ type: 'break', leaver, options });
      return;
    }
    // Ihr verlasst die Koalition oder werdet hinausgeworfen: Opposition.
    t.gov = rest;
    if (t.role === 'junior') {
      t.role = 'opposition';
      t.apMax = TD.ROLES.opposition.ap;
      Object.keys(t.cabinet).forEach(id => { if (t.cabinet[id].party === g.party) delete t.cabinet[id]; });
      news(g, 'Rollenwechsel: Ihr geht in die Opposition. ' + introText(g), 'role');
      aiAfterBreak(g, [g.party], true);
      return;
    }
    aiAfterBreak(g, [leaver]);
  }
  function govSeatsOf(t, list) { return list.reduce((s, p) => s + (t.seats[p] || 0), 0); }

  // ---------- Aktionen ----------
  // target: 'topic' Thema, 'land' Bundesland, 'law' Gesetz in Arbeit, 'ministry' eigenes Ressort, 'spec' Gesetzentwurf.
  const ACTIONS = [
    // Regierung
    { id: 'gesetz', roles: ['kanzler', 'junior'], icon: '📜', name: 'Gesetzentwurf einbringen', target: 'spec', desc: 'Eine Programmposition oder Steueränderung ins Kabinett bringen.' },
    { id: 'regerkl', roles: ['kanzler'], icon: '🎙️', name: 'Regierungserklärung', target: 'topic', desc: 'Im Bundestag ein Thema setzen und die Regierungslinie erklären.' },
    { id: 'presse', roles: ['junior'], icon: '🎙️', name: 'Pressekonferenz als Vizekanzler:in', target: 'topic', desc: 'Eigene Erfolge herausstellen.' },
    { id: 'koaausschuss', roles: ['kanzler', 'junior'], icon: '🤝', name: 'Koalitionsausschuss', desc: 'Streit beilegen, das Koalitionsklima verbessern.', needCoalition: true },
    { id: 'reise', roles: ['kanzler', 'junior'], icon: '✈️', name: 'Gipfel und Auslandsreise', desc: 'EU-Gipfel, G7, Staatsbesuch: Ansehen in der Welt.' },
    { id: 'buerger', roles: ['kanzler', 'junior', 'opposition', 'apo'], icon: '🗣️', name: 'Bürgerdialog', target: 'topic', quiz: true, desc: 'Bürgerinnen und Bürger stellen Fachfragen zu einem Thema – gute Antworten bringen Vertrauen und Kompetenz.' },
    { id: 'disziplin', roles: ['kanzler', 'junior'], icon: '📣', name: 'Fraktion auf Linie bringen', target: 'law', stage: 'bundestag', desc: 'Weniger Abweichler bei der nächsten Abstimmung.' },
    { id: 'laender', roles: ['kanzler', 'junior'], icon: '🏛️', name: 'Länder überzeugen', target: 'law', stage: 'bundesrat', desc: 'Mit Bundesgeld zögernde Länder gewinnen (2 Mrd. € je Land).' },
    { id: 'laenderfront', roles: ['opposition', 'apo'], icon: '🧱', name: 'Länder-Front im Bundesrat', target: 'law', stage: 'bundesrat', desc: 'Die Länder, in denen ihr mitregiert, enthalten sich. Belastet eure Landeskoalitionen.' },
    { id: 'laenderdeal', roles: ['opposition', 'apo'], icon: '🤝', name: 'Zustimmung gegen Geld für eure Länder', target: 'law', stage: 'bundesrat', desc: 'Eure Länder stimmen zu, der Bund zahlt 1 Mrd. € je Land. Kostet Glaubwürdigkeit.' },
    { id: 'umbildung', roles: ['kanzler', 'junior'], icon: '🔄', name: 'Kabinettsumbildung', target: 'ministry', desc: 'Ein eigenes Ressort neu besetzen.' },
    { id: 'krisenstab', roles: ['kanzler', 'junior'], icon: '🚨', name: 'Krisenstab', desc: 'Nach einer Krise Handlungsfähigkeit zeigen.', crisis: true },
    { id: 'profil', roles: ['junior'], icon: '📢', name: 'Profil schärfen', desc: 'Öffentlich eigene Akzente gegen den Partner setzen.' },
    { id: 'austritt', roles: ['junior'], icon: '🚪', name: 'Koalition verlassen', desc: 'Raus aus der Regierung – mit allen Folgen.', confirm: true, ap: 0 },
    { id: 'vertrauen', roles: ['kanzler'], icon: '🗳️', name: 'Vertrauensfrage', target: 'mode', desc: 'Art. 68 GG: Die Mehrheit hinter euch sammeln – oder Neuwahlen herbeiführen.', confirm: true },
    // Opposition
    { id: 'antrag', roles: ['opposition'], icon: '📄', name: 'Antrag einbringen', target: 'topic', desc: 'Eigene Alternative zur Abstimmung stellen.' },
    { id: 'anfrage', roles: ['opposition'], icon: '❓', name: 'Große Anfrage', desc: 'Die Regierung muss antworten – vielleicht kommt etwas ans Licht.' },
    { id: 'befragung', roles: ['opposition'], icon: '🎤', name: 'Regierungsbefragung', target: 'topic', desc: 'Mittwochs im Plenum: Fragen an die Kanzlerin oder den Kanzler – und hartnäckig nachhaken.' },
    { id: 'aktuelle', roles: ['opposition'], icon: '⏱️', name: 'Aktuelle Stunde', target: 'topic', desc: 'Ein Thema kurzfristig auf die Tagesordnung setzen.' },
    { id: 'ua', roles: ['opposition'], icon: '🔎', name: 'Untersuchungsausschuss', target: 'topic', desc: 'Braucht ein Viertel der Abgeordneten (Art. 44 GG). Setzt die Regierung ein Jahr unter Druck.', quorum: true },
    { id: 'klage', roles: ['opposition'], icon: '⚖️', name: 'Normenkontrollklage', target: 'klage', desc: 'Ein Gesetz oder den Haushalt in Karlsruhe prüfen lassen (Viertel der Abgeordneten).', quorum: true },
    { id: 'misstrauen', roles: ['opposition'], icon: '🗡️', name: 'Konstruktives Misstrauensvotum', desc: 'Art. 67 GG: Mit einer neuen Mehrheit die Kanzlerin/den Kanzler stürzen.', confirm: true },
    { id: 'talkshow', roles: ['opposition', 'junior', 'kanzler'], icon: '📺', name: 'Talkshow und Interviews', target: 'topic', quiz: true, desc: 'Die Moderation hakt nach: Wer sattelfest antwortet, punktet beim Publikum.' },
    { id: 'forderung', roles: ['junior'], icon: '📌', name: 'Vertragsvorhaben einfordern', target: 'contract', desc: 'Die Kanzlerpartei soll ein offenes Vorhaben aus dem Koalitionsvertrag umsetzen.' },
    { id: 'schatten', roles: ['opposition', 'apo'], icon: '🧭', name: 'Alternativkonzept vorlegen', target: 'topic', desc: 'Eigene Kompetenz in einem Thema aufbauen.' },
    // Außerparlamentarisch
    { id: 'protest', roles: ['apo'], icon: '✊', name: 'Demonstration organisieren', target: 'topic', desc: 'Auf der Straße sichtbar werden.' },
    { id: 'social', roles: ['apo'], icon: '📱', name: 'Social-Media-Kampagne', desc: 'Ohne Talkshow-Einladungen: direkt zu den Wählern.' },
    { id: 'mitglieder', roles: ['apo', 'opposition'], icon: '🙋', name: 'Mitgliederkampagne', desc: 'Neue Mitglieder bringen Beiträge und Aktive.' },
    { id: 'spenden', roles: ['apo', 'opposition'], icon: '💶', name: 'Spenden sammeln', desc: 'Die Parteikasse für den nächsten Wahlkampf füllen.' },
    { id: 'parteitag', roles: ['apo', 'opposition'], icon: '🎪', name: 'Sonderparteitag mit Neuanfang', desc: 'Neue Parteispitze wählen – frischer Wind, aber auch Risiko.' },
    { id: 'interview', roles: ['kanzler', 'junior', 'opposition', 'apo'], icon: '🎤', name: 'Exklusiv-Interview', target: 'outlet', desc: 'Ein großes Interview – jeder Medientyp wirkt anders und merkt sich, wer mit ihm spricht.' },
    { id: 'lobbytermin', roles: ['kanzler', 'junior', 'opposition', 'apo'], icon: '🤝', name: 'Lobbytermin', target: 'lobby', desc: 'Gespräch mit einem Verband: bessere Beziehungen, Unterstützung und Spenden – steht aber im Lobbyregister.' },
    { id: 'lobbyrecherche', roles: ['opposition'], icon: '🔍', name: 'Lobbyregister-Recherche', desc: 'Kleine Anfragen zu Lobbykontakten der Regierung – vielleicht findet ihr etwas.' },
    { id: 'buendnis', roles: ['apo'], icon: '🤲', name: 'Bündnisse mit Verbänden', target: 'topic', desc: 'Gewerkschaften, Umweltverbände, Mittelstand – je nach Thema.' },
    // Alle
    { id: 'sq', roles: ['kanzler', 'junior', 'opposition', 'apo'], icon: '⚖️', name: 'Status quo verteidigen oder angreifen', target: 'topic', desc: 'Steht ihr hinter der geltenden Regelung, stärkt ihr sie – sonst greift ihr sie an.' },
    { id: 'ltwk', roles: ['kanzler', 'junior', 'opposition', 'apo'], icon: '🗺️', name: 'Landtagswahlkampf unterstützen', target: 'land', desc: 'Bundesprominenz und Geld für die nächste Landtagswahl.' },
    { id: 'lvpflege', roles: ['kanzler', 'junior', 'opposition', 'apo'], icon: '🧩', name: 'Landesverband befrieden', target: 'land', desc: 'Besuch, Gespräche, Posten: Ärger in einem Landesverband dämpfen.' },
    { id: 'basis', roles: ['kanzler', 'junior', 'opposition', 'apo'], icon: '🏠', name: 'Basisarbeit', desc: 'Regionalkonferenzen und Mitgliederabende: mehr Geschlossenheit.' }
  ];
  const VIRAL = ['social', 'protest', 'talkshow', 'buerger', 'antrag', 'aktuelle', 'regerkl', 'befragung'];
  const ACTION_CASH = { ltwk: 0.4, protest: 0.15, social: 0.15, mitglieder: 0.2, parteitag: 0.5, buerger: 0.05, talkshow: 0 };

  function actionCash(g, id) { return cashCost(g, ACTION_CASH[id] || 0); }
  function canAct(g, id) {
    const t = g.term;
    const a = ACTIONS.find(x => x.id === id);
    if (!a) return { ok: false, text: 'Unbekannte Aktion.' };
    if (t.over) return { ok: false, text: 'Die Legislaturperiode ist vorbei.' };
    if (a.roles.indexOf(t.role) === -1) return { ok: false, text: 'In eurer Rolle nicht möglich.' };
    const ap = a.ap === undefined ? 1 : a.ap;
    if (t.ap < ap) return { ok: false, text: 'Keine Aktionen mehr in diesem Quartal.' };
    if (t.pending.length) return { ok: false, text: 'Erst die offenen Entscheidungen treffen.' };
    if (t.party.cash < actionCash(g, id)) return { ok: false, text: 'Die Parteikasse reicht nicht.' };
    if (a.needCoalition && t.gov.length < 2) return { ok: false, text: 'Ihr regiert allein.' };
    if (a.crisis && t.q - t.crisisQ > 0) return { ok: false, text: 'Gerade gibt es keine akute Krise.' };
    if (a.quorum && !quorum(g).ok) return { ok: false, text: 'Dafür braucht es ein Viertel der Abgeordneten – die Opposition hat nur ' + quorum(g).seats + ' von ' + SEATS + '.' };
    if (id === 'ua' && t.ua) return { ok: false, text: 'Es läuft bereits ein Untersuchungsausschuss.' };
    if (id === 'misstrauen' && t.q - t.misstrauenQ < 4) return { ok: false, text: 'Ein neues Misstrauensvotum wäre zu früh.' };
    if (id === 'parteitag' && t.q - (t.parteitagQ === undefined ? -9 : t.parteitagQ) < 6) return { ok: false, text: 'Der letzte Parteitag ist noch nicht lange her.' };
    if (id === 'laenderfront' || id === 'laenderdeal') {
      if (!Object.keys(t.laender).some(l => t.laender[l].gov.indexOf(g.party) !== -1)) return { ok: false, text: 'Ihr regiert in keinem Land mit.' };
      if (!t.laws.some(l => l.stage === 'bundesrat')) return { ok: false, text: 'Gerade liegt kein Gesetz im Bundesrat.' };
    }
    if (id === 'gesetz') { const o = lawOptions(g); if (!o.topics.length && !o.taxes.length) return { ok: false, text: 'Für eure Ressorts liegen gerade keine Vorhaben an.' }; }
    return { ok: true };
  }

  // scene = Ergebnis einer gespielten Szene { q: −3 … 3, fx: { mood, like, unity, cred, intl, gov } } – stärkt oder schwächt die Aktion.
  function performAction(g, id, target, scene) {
    const t = g.term;
    cat('aktion');
    const chk = canAct(g, id);
    if (!chk.ok) return chk;
    const a = ACTIONS.find(x => x.id === id);
    const f = useFactor(t, id) * (scene ? clamp(1 + 0.15 * (scene.q || 0), 0.55, 1.45) : 1);
    let text = '';
    const P = t.party;
    // Aktionen wirken über vier Jahre gedämpft – sonst summiert sich jede Kleinigkeit zu Prozentpunkten.
    // Regierungen werden an Ergebnissen gemessen: Öffentlichkeitsarbeit wirkt bei ihnen schwächer als in der Opposition (geschätzt).
    const actNat = (p, v) => addNat(g, p, v * ACT_K * (isGov(t.role) && v > 0 ? 0.8 : 1));
    const comp = topic => (g.competence ? g.competence[topic] : 40) || 40;
    const salF = topic => clamp(g.salience[topic] / D.SALIENCE0[topic], 0.5, 2);
    switch (id) {
      case 'gesetz': {
        const o = lawOptions(g);
        if (!target) return { ok: false, text: 'Bitte ein Vorhaben wählen.' };
        if (target.tax) {
          const tx = taxById(target.tax);
          if (tx) target.level = clamp(Math.round(Number(target.level) / tx.step) * tx.step, tx.min, tx.max);
          if (tx) target.level = Math.round(target.level * 1000) / 1000;
          const tb = tx && lawBlock(g, { kind: 'tax', tax: target.tax, level: target.level }, g.party);
          if (tb) return { ok: false, text: tb };
          if (!o.taxes.some(x => x.tax === target.tax) || !tx || !isFinite(target.level) || target.level === t.taxes[target.tax]) return { ok: false, text: 'Diese Steueränderung ist nicht möglich.' };
          const law = makeLaw(g, { kind: 'tax', tax: target.tax, level: target.level }, g.party);
          lobbyReact(g, law);
          text = 'Entwurf „' + lawName(law) + '“ geht ins Kabinett.';
          if (target.fraktion) text = fraktionsEntwurf(g, law);
        } else {
          const tp = o.topics.find(x => x.topic === target.topic);
          if (tp && tp.blocked && tp.blocked[target.opt]) return { ok: false, text: tp.blocked[target.opt] };
          if (!tp || tp.opts.indexOf(target.opt) === -1) return { ok: false, text: 'Dieses Vorhaben ist nicht möglich.' };
          const law = makeLaw(g, { kind: 'topic', topic: target.topic, opt: target.opt }, g.party);
          lobbyReact(g, law);
          text = 'Entwurf „' + lawName(law) + '“ geht ins Kabinett' + (law.contract ? ' (steht im Koalitionsvertrag).' : '.');
          if (target.fraktion) text = fraktionsEntwurf(g, law);
        }
        break;
      }
      case 'regerkl': case 'presse': {
        if (!target || !E.topicById(target)) return { ok: false, text: 'Bitte ein Thema wählen.' };
        A.changeSalience(g, target, 0.02 * f);
        if (Math.abs(leanOf(g, g.party, target) - sqLean(t, target)) === 0) addSq(t, target, 3 * f);
        actNat(g.party, (id === 'regerkl' ? 0.18 : 0.14) * f * salF(target) * (comp(target) / 50));
        P.leader.like = clamp(P.leader.like + 0.08 * f, -5, 5);
        text = (id === 'regerkl' ? 'Regierungserklärung' : 'Pressekonferenz') + ' zum Thema ' + E.topicById(target).name + '.';
        break;
      }
      case 'sq': {
        if (!target || !E.topicById(target)) return { ok: false, text: 'Bitte ein Thema wählen.' };
        const defend = Math.abs(leanOf(g, g.party, target) - sqLean(t, target)) === 0;
        const amount = (5 + 10 * A.sizeFactor(shareOf(g, g.party)) / 1.2) * f;
        addSq(t, target, defend ? amount : -amount);
        addCred(g, 1);
        actNat(g.party, (defend ? 0.04 : 0.08) * f * salF(target));
        text = (defend ? 'Ihr verteidigt die geltende Regelung beim Thema ' : 'Ihr greift die geltende Regelung beim Thema ') + E.topicById(target).name + ' an. Rückhalt jetzt ' + Math.round(t.sq[target]) + '/100.';
        if (defend) text = text.replace(' an. Rückhalt', '. Rückhalt');
        break;
      }
      case 'koaausschuss': t.mood = clamp(t.mood + 8 * f, 0, 100); text = 'Der Koalitionsausschuss tagt bis in die Nacht – das Klima bessert sich.'; break;
      case 'reise': t.intl = clamp(t.intl + 5 * f, 0, 100); P.leader.like = clamp(P.leader.like + 0.06 * f, -5, 5); text = 'Starke Bilder auf internationalem Parkett.'; break;
      case 'buerger': case 'talkshow': {
        const tg = typeof target === 'object' && target ? target : { topic: target, right: 0, wrong: 0 };
        const topic = E.topicById(tg.topic) ? tg.topic : null;
        const right = tg.right || 0;
        const wrong = tg.wrong || 0;
        const qf = clamp(1 + 0.3 * (right - wrong), 0.4, 1.6);
        P.leader.like = clamp(P.leader.like + (id === 'buerger' ? 0.15 : 0.12) * f * qf, -5, 5);
        actNat(g.party, (id === 'buerger' ? 0.1 : 0.08) * f * qf * (topic ? salF(topic) : 1));
        const dc = topic ? E.citizenCompetence(g, topic, right, wrong) : 0;
        if (wrong > right) addCred(g, -1, 'Schwache Antworten ' + (id === 'buerger' ? 'im Bürgerdialog' : 'in der Talkshow'));
        text = (id === 'buerger' ? 'Bürgerdialog' : 'Talkshow') + (topic ? ' zum Thema ' + E.topicById(topic).name : '') + (right + wrong ? ': ' + right + ' von ' + (right + wrong) + ' Fragen sicher beantwortet' : '') +
          (dc ? ' (Kompetenz ' + (dc > 0 ? '+' : '') + dc + ')' : '') + '.';
        break;
      }
      case 'forderung': {
        const opt = t.contract[target];
        if (opt === undefined || opt === t.policy[target] || inPipeline(t, target)) return { ok: false, text: 'Dieses Vorhaben ist nicht offen.' };
        const chance = clamp((t.mood - 20) / 60, 0.1, 0.9);
        if (rand(g) < chance) {
          const law = makeLaw(g, { kind: 'topic', topic: target, opt }, t.chanc);
          law.stage = 'kabinett';
          law.contract = true;
          law.q0 = t.q;
          law.byPlayerDemand = true;
          addCred(g, 1);
          text = sname(t.chanc) + ' sagt zu: „' + lawName(law) + '“ kommt ins Kabinett.';
        } else { t.mood = clamp(t.mood - 4, 0, 100); text = sname(t.chanc) + ' vertröstet euch – das Klima leidet.'; }
        break;
      }
      case 'disziplin': {
        const law = t.laws.find(l => l.id === Number(target) && l.stage === 'bundestag');
        if (!law) return { ok: false, text: 'Kein Gesetz zur Abstimmung ausgewählt.' };
        law.disc = true; P.unity = clamp(P.unity - 2, 0, 100);
        text = 'Die Fraktionsführung bearbeitet mögliche Abweichler.';
        break;
      }
      case 'laender': {
        const law = t.laws.find(l => l.id === Number(target) && l.stage === 'bundesrat');
        if (!law) return { ok: false, text: 'Kein Gesetz im Bundesrat ausgewählt.' };
        const v = bundesratVote(g, law);
        // Länder, in denen nur eine Partei fehlt und die nicht völlig dagegen ist.
        const cand = Object.keys(t.laender).filter(l => !v.lands[l] && t.laender[l].gov.filter(p => !partyBackslaw(g, p, law)).every(p => lawDist(g, p, law) <= 1))
          .sort((x, y) => t.laender[y].votes - t.laender[x].votes).slice(0, 2);
        if (!cand.length) return { ok: false, text: 'Kein Land lässt sich umstimmen.' };
        law.bought = (law.bought || []).concat(cand);
        t.budget.oneoff += 2 * cand.length;
        text = 'Zusagen an ' + cand.map(l => E.stateById(l).name).join(' und ') + ' (' + 2 * cand.length + ' Mrd. €).';
        kuhhandel(g, cand.length);
        break;
      }
      case 'laenderfront': {
        // Opposition: Die Länder, in denen ihr mitregiert, enthalten sich – die Koalitionsklausel greift.
        const law = t.laws.find(l => l.id === Number(target) && l.stage === 'bundesrat');
        if (!law) return { ok: false, text: 'Kein Gesetz im Bundesrat ausgewählt.' };
        const lands = Object.keys(t.laender).filter(l => t.laender[l].gov.indexOf(g.party) !== -1);
        if (!lands.length) return { ok: false, text: 'Ihr regiert in keinem Land mit.' };
        law.blocked = (law.blocked || []).concat(lands.filter(l => (law.blocked || []).indexOf(l) === -1));
        lands.forEach(l => { const L = t.laender[l]; if (L.gov.length > 1) L.strain = clamp((L.strain || 20) + 18, 0, 100); });
        cat('aktion');
        addNat(g, g.party, 0.15);
        const v = bundesratVote(g, law);
        text = 'Länder-Front: ' + lands.map(l => E.stateById(l).name).join(', ') + ' enthalten sich bei „' + lawName(law) + '“. Neue Schätzung: ' + v.yes + ' von 69 Stimmen. Eure Koalitionspartner in den Ländern sind verärgert.';
        break;
      }
      case 'laenderdeal': {
        // Opposition: Zustimmung eurer Länder gegen Geld für diese Länder (wie bei der Steuerreform 2000).
        const law = t.laws.find(l => l.id === Number(target) && l.stage === 'bundesrat');
        if (!law) return { ok: false, text: 'Kein Gesetz im Bundesrat ausgewählt.' };
        const v = bundesratVote(g, law);
        const lands = Object.keys(t.laender).filter(l => t.laender[l].gov.indexOf(g.party) !== -1 && !v.lands[l]);
        if (!lands.length) return { ok: false, text: 'Eure Länder stimmen ohnehin zu – oder ihr regiert in keinem Land mit.' };
        law.bought = (law.bought || []).concat(lands);
        if (law.blocked) law.blocked = law.blocked.filter(l => lands.indexOf(l) === -1);
        t.budget.oneoff += lands.length;
        lands.forEach(l => { if (g.reg[l]) g.reg[l][g.party] = (g.reg[l][g.party] || 0) + 0.4; });
        addCred(g, -1, 'Zustimmung im Bundesrat gegen Geld für die eigenen Länder');
        text = lands.map(l => E.stateById(l).name).join(', ') + ' stimmen „' + lawName(law) + '“ zu – gegen ' + lands.length + ' Mrd. € für diese Länder. Neue Schätzung: ' + bundesratVote(g, law).yes + ' von 69 Stimmen.';
        break;
      }
      case 'umbildung': {
        const slot = t.cabinet[target];
        if (!slot || slot.party !== g.party) return { ok: false, text: 'Bitte ein eigenes Ressort wählen.' };
        if (slot.lead) return { ok: false, text: 'Die eigene Spitze bleibt im Amt.' };
        if (slot.name) { t.formerNames.push(slot.name); lobbyDoor(g, slot.name, target); }
        t.cabinet[target] = { party: g.party, name: null, cands: candidatesFor(g, g.party) };
        P.unity = clamp(P.unity - 1, 0, 100);
        text = 'Das ' + ministryById(target).short + '-Ressort wird neu besetzt – wählt die Nachfolge im Kabinett.';
        break;
      }
      case 'krisenstab': t.intl = clamp(t.intl + 3, 0, 100); P.leader.like = clamp(P.leader.like + 0.2, -5, 5); t.gov.forEach(p => actNat(p, 0.1)); text = 'Der Krisenstab zeigt Handlungsfähigkeit.'; break;
      case 'profil': actNat(g.party, 0.3 * f); t.mood = clamp(t.mood - 6, 0, 100); addCred(g, 2, 'Eigenes Profil gezeigt'); text = 'Ihr setzt euch öffentlich vom Partner ab.'; break;
      case 'austritt': noteUse(t, id); breakCoalition(g, g.party); return { ok: true, text: 'Ihr verlasst die Koalition.' };
      case 'vertrauen': {
        if (target === 'unecht') { t.ap -= 1; endTerm(g, 'Neuwahl nach der Vertrauensfrage'); return { ok: true, text: 'Ihr verliert die Vertrauensfrage absichtlich – der Bundespräsident löst den Bundestag auf.' }; }
        const pass = govSeats(t) >= MAJ && t.mood > 30;
        if (pass) { t.mood = clamp(t.mood + 10, 0, 100); P.unity = clamp(P.unity + 5, 0, 100); P.leader.like = clamp(P.leader.like + 0.2, -5, 5); text = 'Der Bundestag spricht euch das Vertrauen aus.'; }
        else { t.ap -= 1; endTerm(g, 'Neuwahl nach verlorener Vertrauensfrage'); return { ok: true, text: 'Die Vertrauensfrage geht verloren – Neuwahlen!' }; }
        break;
      }
      case 'antrag': {
        if (!target || !E.topicById(target)) return { ok: false, text: 'Bitte ein Thema wählen.' };
        actNat(g.party, 0.12 * f * salF(target) * (comp(target) / 50));
        if (g.competence) g.competence[target] = clamp(g.competence[target] + 1, 5, 95);
        if (g.program && g.program.core.indexOf(target) !== -1) addCred(g, 1);
        A.changeSalience(g, target, 0.01);
        if (Math.abs(leanOf(g, g.party, target) - sqLean(t, target)) > 0) addSq(t, target, -3 * f);
        text = 'Antrag zum Thema ' + E.topicById(target).name + ' – die Koalition lehnt ab, aber ihr seid sichtbar.';
        break;
      }
      case 'anfrage': {
        t.anfrageQ = t.q;
        actNat(g.party, 0.05 * f);
        const hit = rand(g) < 0.35 * f;
        if (hit) { t.gov.forEach(p => actNat(p, -0.15)); text = 'Die Antwort der Regierung ist peinlich: Widersprüche und Versäumnisse!'; }
        else text = 'Die Regierung antwortet ausweichend.';
        break;
      }
      case 'aktuelle': {
        if (!target || !E.topicById(target)) return { ok: false, text: 'Bitte ein Thema wählen.' };
        A.changeSalience(g, target, 0.03 * f);
        actNat(g.party, 0.06 * f * (comp(target) / 50));
        text = 'Aktuelle Stunde zum Thema ' + E.topicById(target).name + '.';
        break;
      }
      case 'befragung': {
        if (!target || !E.topicById(target)) return { ok: false, text: 'Bitte ein Thema wählen.' };
        actNat(g.party, 0.07 * f * (comp(target) / 50));
        P.leader.like = clamp(P.leader.like + 0.04 * f, -5, 5);
        addNat(g, t.chanc, -0.03 * f * ACT_K);
        text = 'Regierungsbefragung zum Thema ' + E.topicById(target).name + '.';
        if (g.rivals && g.rivals[t.chanc]) g.rivals[t.chanc].feud = Math.min(5, (g.rivals[t.chanc].feud || 0) + 0.5);
        break;
      }
      case 'ua': t.ua = { topic: target || 'demokratie', left: 4, q0: t.q, f }; text = 'Der Untersuchungsausschuss nimmt seine Arbeit auf.'; news(g, '🔎 Untersuchungsausschuss eingesetzt (' + E.topicById(t.ua.topic).name + ').', 'big'); break;
      case 'klage': {
        if (target === 'budget') {
          const last = t.budget.history[t.budget.history.length - 1];
          const v = t.budget.vote;
          const gap = last ? last.gap : 0;
          if (!v || !v.pass) return { ok: false, text: 'Es gibt keinen beschlossenen Haushalt, gegen den ihr klagen könntet.' };
          const crisis = t.q - t.crisisQ <= 4;
          const draftGap = budgetCalc(t, t.budget.next ? t.budget.next.plan : t.budget.plan).gap;
          const chance = (t.budget.next && t.budget.next.notlage) ? (crisis ? 0.2 : 0.7) : (Math.max(gap, draftGap) > 0.5 ? 0.85 : 0.08);
          t.klagen.push({ kind: 'budget', due: t.q + 2, chance, text: 'Haushalt ' + v.year, by: 'player' });
        } else {
          const law = t.laws.find(l => l.id === Number(target) && l.stage === 'inkraft');
          if (!law) return { ok: false, text: 'Bitte ein Gesetz wählen.' };
          const d = lawDist(g, g.party, law);
          t.klagen.push({ kind: 'law', law: law.id, due: t.q + 2, chance: (d === 2 ? 0.3 : 0.12) + (law.fraktion && !law.fixed ? 0.1 : 0) - (law.fixed ? 0.05 : 0), text: '„' + lawName(law) + '“', by: 'player' });
        }
        text = 'Die Klage ist eingereicht. Karlsruhe entscheidet in etwa einem halben Jahr.';
        break;
      }
      case 'misstrauen': {
        t.misstrauenQ = t.q;
        const opts = E.findCoalitions(t.seats, g).filter(c => c.viable && !c.tolerated && c.members.indexOf(g.party) !== -1 && c.members.indexOf(t.chanc) === -1);
        let best = null;
        opts.forEach(c => {
          let chance = 1;
          c.members.filter(p => p !== g.party).forEach(p => {
            if (t.gov.indexOf(p) !== -1) chance *= clamp((45 - t.mood) / 40, 0.02, 0.85);
            else {
              const dist = A.TOPIC_IDS.reduce((s, tp) => s + Math.abs(leanOf(g, p, tp) - leanOf(g, g.party, tp)), 0) / A.TOPIC_IDS.length;
              chance *= clamp(0.9 - dist * 0.6, 0.05, 0.8);
            }
          });
          if (!best || chance > best.chance) best = { c, chance };
        });
        if (best && rand(g) < best.chance) {
          const chanc = best.c.members.slice().sort((x, y) => t.seats[y] - t.seats[x])[0];
          setGovernment(g, best.c.members, chanc);
          text = 'Das konstruktive Misstrauensvotum gelingt! Neue Regierung: ' + best.c.members.map(sname).join('-') + '.';
          news(g, '🗡️ ' + text, 'big');
        } else {
          actNat(g.party, -0.3); P.leader.like = clamp(P.leader.like - 0.2, -5, 5);
          text = best ? 'Das Misstrauensvotum scheitert – nicht alle Abgeordneten ziehen mit.' : 'Es gibt keine Mehrheit für eine neue Regierung – das Votum scheitert krachend.';
          news(g, '🗡️ ' + text, 'bad');
        }
        break;
      }
      case 'schatten': {
        if (!target || !E.topicById(target)) return { ok: false, text: 'Bitte ein Thema wählen.' };
        if (g.competence) g.competence[target] = clamp(g.competence[target] + 3 * f, 5, 95);
        actNat(g.party, 0.04 * f);
        text = 'Euer Konzept zum Thema ' + E.topicById(target).name + ' findet Beachtung.';
        break;
      }
      case 'protest': {
        if (!target || !E.topicById(target)) return { ok: false, text: 'Bitte ein Thema wählen.' };
        actNat(g.party, 0.16 * f * salF(target));
        A.changeSalience(g, target, 0.02 * f);
        if (Math.abs(leanOf(g, g.party, target) - sqLean(t, target)) > 0) addSq(t, target, -4 * f);
        P.members = Math.round(P.members * (1 + 0.005 * f));
        text = 'Tausende demonstrieren mit euch – Thema: ' + E.topicById(target).name + '.';
        break;
      }
      case 'social': actNat(g.party, 0.12 * f); text = 'Eure Videos gehen viral.'; break;
      case 'mitglieder': P.members = Math.round(P.members * (1 + 0.02 * f)); P.unity = clamp(P.unity + 1, 0, 100); text = 'Neue Mitglieder treten ein.'; break;
      case 'spenden': P.cash += 0.5 * moneyScale(g) * f; text = 'Die Spendenaktion bringt Geld in die Kasse.'; break;
      case 'parteitag': {
        t.parteitagQ = t.q;
        const ok = rand(g) < 0.65;
        if (ok) {
          t.formerNames.push(P.leader.name);
          const yr = cal(t).year;
          P.leader = { name: newPerson(g, g.party, weightedLand(g)).full, like: 0.8, born: yr - Math.round(between(g, 38, 52)) };
          newLeader(g, P.leader.name, yr, P.leader.born, 'Sonderparteitag').offices.push({ year: yr, office: officeName(g) });
          P.unity = clamp(P.unity + 12, 0, 100);
          // Hype um die neue Spitze (Vorbild Schulz-Effekt): groß, aber ein Strohfeuer ohne Wahlerfolge.
          cat('hype');
          addNatT(g, g.party, between(g, 2, 3.5) / A.sizeFactor(shareOf(g, g.party)), 'hype');
          t.hypeQ = t.q;
          text = 'Neue Parteispitze: ' + P.leader.name + '. Aufbruchstimmung!';
        } else { P.unity = clamp(P.unity - 10, 0, 100); text = 'Kampfkandidatur und Streit auf offener Bühne – der Parteitag geht schief.'; }
        news(g, '🎪 Parteitag: ' + text, 'big');
        break;
      }
      case 'interview': {
        const m = MEDIA.find(x => x.id === target);
        if (!m) return { ok: false, text: 'Bitte ein Medium wählen.' };
        const M = media(g);
        const k = 1 + (M[m.id] - 50) / 100;
        cat('medien');
        if (m.id === 'boulevard') {
          if (rand(g) < 0.25) { actNat(g.party, -0.05); addCred(g, -1, 'Zugespitztes Boulevard-Interview'); text = 'Die Schlagzeile verdreht eure Worte – „' + P.leader.name + ' rechnet ab!“'; }
          else { actNat(g.party, 0.16 * f * k); text = 'Die große Schlagzeile: Millionen lesen eure Botschaft.'; }
        } else if (m.id === 'leit') {
          actNat(g.party, 0.07 * f * k); addCred(g, 2, 'Überzeugendes Interview in den Leitmedien');
          const tp = A.TOPIC_IDS.slice().sort((a, b) => g.salience[b] - g.salience[a])[0];
          if (g.competence) g.competence[tp] = clamp(g.competence[tp] + 1, 5, 95);
          text = 'Ein langes, kluges Interview – zitiert in allen Presseschauen.';
        } else if (m.id === 'oer') {
          actNat(g.party, 0.09 * f * k); P.leader.like = clamp(P.leader.like + 0.08 * f, -5, 5);
          text = 'Zur besten Sendezeit: ' + P.leader.name + ' wirkt souverän.';
        } else {
          if (rand(g) < 0.3) { cat('viral'); actNat(g.party, 0.22 * f * k); text = 'Der Podcast-Ausschnitt geht viral!'; }
          else { actNat(g.party, 0.08 * f * k); text = 'Gutes Gespräch, ordentliche Reichweite bei Jüngeren.'; }
        }
        addMedia(g, m.id, 10 * f);
        break;
      }
      case 'lobbytermin': {
        const l = LB.byId(target);
        if (!l) return { ok: false, text: 'Bitte einen Verband wählen.' };
        cat('lobby');
        LB.addRel(g, l.id, 12 * f);
        LB.addNear(g, l.money >= 2 ? 5 : 2);
        LB.register(g, l.id, 'Gespräch mit ' + P.leader.name, quarterLabel(t));
        if (l.money >= 2) P.cash += 0.15 * l.money * moneyScale(g);
        const tp0 = Object.keys(l.prefs)[0];
        if (g.competence && tp0) g.competence[tp0] = clamp(g.competence[tp0] + 1, 5, 95);
        text = 'Gespräch mit ' + l.short + ': Die Beziehung wird besser (' + Math.round(LB.rel(g, l.id)) + '/100). Der Termin steht im Lobbyregister.';
        break;
      }
      case 'lobbyrecherche': {
        cat('lobby');
        if (rand(g) < 0.35 * f) { t.gov.forEach(p => addNatT(g, p, -0.4, 'slow')); actNat(g.party, 0.2); text = 'Treffer: Die Antworten belegen enge Kontakte eines Ministeriums zu einem Verband – ein Fall für die Schlagzeilen.'; news(g, '🔍 Lobbykontakte der Regierung aufgedeckt.', 'big'); }
        else text = 'Die Antworten der Regierung geben nichts Belastendes her.';
        break;
      }
      case 'buendnis': {
        if (!target || !E.topicById(target)) return { ok: false, text: 'Bitte ein Thema wählen.' };
        if (g.competence) g.competence[target] = clamp(g.competence[target] + 2, 5, 95);
        LB.LOBBIES.forEach(l => { if (LB.stanceTopic(l, target, leanOf(g, g.party, target)) > 0) LB.addRel(g, l.id, 8); });
        actNat(g.party, 0.08 * f);
        text = 'Neues Bündnis mit Verbänden zum Thema ' + E.topicById(target).name + '.';
        break;
      }
      case 'ltwk': {
        if (!target || !t.laender[target]) return { ok: false, text: 'Bitte ein Land wählen.' };
        t.ltwBoost[target] = Math.min(4, (t.ltwBoost[target] || 0) + 1.2 * f * (t.role === 'apo' ? 1.3 : 1));
        g.reg[target][g.party] = (g.reg[target][g.party] || 0) + 0.3;
        text = 'Wahlkampfhilfe für ' + E.stateById(target).name + '.';
        break;
      }
      case 'lvpflege': {
        if (!target || !(target in P.lv)) return { ok: false, text: 'Bitte ein Land wählen.' };
        P.lv[target] = clamp(P.lv[target] - 18 * f, 0, 100);
        text = 'Gespräche mit dem Landesverband ' + E.stateById(target).name + '.';
        break;
      }
      case 'basis': P.unity = clamp(P.unity + 5 * f, 0, 100); P.members = Math.round(P.members * 1.003); text = 'Regionalkonferenzen stärken den Zusammenhalt.'; break;
      default: return { ok: false, text: 'Unbekannte Aktion.' };
    }
    if (scene && scene.fx) {
      const x = scene.fx;
      if (x.mood && t.gov.length > 1) t.mood = clamp(t.mood + x.mood, 0, 100);
      if (x.like) P.leader.like = clamp(P.leader.like + x.like, -5, 5);
      if (x.unity) P.unity = clamp(P.unity + x.unity, 0, 100);
      if (x.intl && isGov(t.role)) t.intl = clamp(t.intl + x.intl, 0, 100);
      if (x.cred) addCred(g, x.cred, x.cred > 0 ? 'Überzeugender Auftritt' : 'Fragwürdiger Auftritt');
      if (x.gov && !isGov(t.role)) t.gov.forEach(p => addNat(g, p, -0.12 * x.gov * ACT_K));
    }
    // Virale Momente: selten, aber groß (Vorbild Linke 2025) – Auftritte mit sicheren Antworten haben bessere Chancen.
    if (VIRAL.indexOf(id) !== -1) {
      const good = (target && typeof target === 'object' && target.right >= 2) || (scene && scene.q >= 2);
      const chance = (0.012 + (t.role === 'opposition' || t.role === 'apo' ? 0.01 : 0) + (good ? 0.02 : 0)) * f;
      if (rand(g) < chance) {
        // Regierende profitieren deutlich weniger: Wer regiert, wird an Ergebnissen gemessen, nicht an Clips.
        const amount = between(g, 1.5, 3.5) * (isGov(t.role) ? 0.5 : 1);
        cat('viral');
        addNatT(g, g.party, amount / A.sizeFactor(shareOf(g, g.party)), 'hype');
        P.members = Math.round(P.members * 1.03);
        t.hypeQ = t.q;
        text += ' 📱 Der Auftritt geht viral – Millionen Aufrufe, tausende Eintritte!';
        news(g, '📱 Viral: ' + party(g.party).short + ' begeistert im Netz. Die Umfragen ziehen an – ob es hält?', 'big');
      }
    }
    t.ap -= a.ap === undefined ? 1 : a.ap;
    P.cash -= actionCash(g, id);
    noteUse(t, id);
    return { ok: true, text };
  }

  // ---------- Quartalsablauf ----------
  function beginQuarter(g, first) {
    const t = g.term;
    if (t.over) return;
    const c = cal(t);
    t.ap = t.apMax;
    t.voteChoice = {};
    if (!first) {
      (t.pollFxHist = t.pollFxHist || []).push({ q: t.q - 1, fx: t.pollFx || {} });
      if (t.pollFxHist.length > 20) t.pollFxHist.shift();
    }
    t.pollFx = {};
    t.qLaws = 0;
    // Haushaltssaison: Entwurf für das nächste Jahr (nicht im letzten Jahr vor der Wahl nötig, aber üblich)
    // Haushaltsverfahren wie im Bund: Eckwerte (März) → Regierungsentwurf (Kabinett, Sommer) → 1. Lesung (September)
    // → Bereinigungssitzung des Haushaltsausschusses (November) → 2./3. Lesung → Bundesrat (Einspruchsgesetz).
    if (!first) budgetYear(g, c);
    if (c.qn === 1) {
      t.budget.eck = 'fort';
      t.budget.wishes = ministryWishes(g);
      if (isGov(t.role) && playerDraftsBudget(g)) t.pending.push({ type: 'eckwerte', year: c.year + 1, wishes: t.budget.wishes });
      else news(g, 'Das Kabinett beschließt die Eckwerte für den Haushalt ' + (c.year + 1) + '.', 'info');
    }
    if (c.qn === 4 && isGov(t.role) && t.budget.draft && t.budget.draft.done && !first) t.pending.push({ type: 'bereinigung', year: t.budget.draft.year });
    if (c.qn === 3) {
      t.budget.draft = { year: c.year + 1, plan: Object.assign({}, t.budget.plan), notlage: false, done: false, measures: [] };
      const free = TD.AREAS.filter(a => !a.fixed && a.id in t.budget.draft.plan).map(a => a.id);
      const dp = t.budget.draft.plan;
      if (t.budget.eck === 'konsol') free.forEach(a => { dp[a] = stepShift(a, dp[a], -1); });
      if (t.budget.eck === 'invest') ['verkehr', 'forschung', 'verteidigung', 'wohnen'].filter(a => free.indexOf(a) !== -1).forEach(a => { dp[a] = stepShift(a, dp[a], 1); });
      if (t.budget.eck === 'wishes') (t.budget.wishes || []).forEach(w => { if (w.a in dp) dp[w.a] = stepShift(w.a, dp[w.a], 1); });
      if (!playerDraftsBudget(g)) {
        t.budget.draft.plan = aiBudgetPlan(g);
        t.budget.draft.measures = aiMeasures(g);
        t.budget.draft.done = true;
        if (isGov(t.role)) t.pending.push({ type: 'budgetcab' });
      }
    }
    if (dueIn(TD.BUNDESVERSAMMLUNG, c)) { const ev = eventById('bundesversammlung'); t.usedEvents[ev.id] = t.q; t.pending.push({ type: 'event', id: ev.id }); }
    // Folgen früherer Entscheidungen kommen zuerst.
    (t.followUps || []).filter(f => f.q <= t.q && !f.done).forEach(f => { f.done = true; const fe = eventById(f.id); if (fe && eligibleRole(g, fe)) queueEvent(g, fe, f); });
    if (!first) {
      const ev = drawEvent(g);
      if (ev) queueEvent(g, ev);
      if (rand(g) < 0.35) { const ev2 = drawEvent(g); if (ev2) queueEvent(g, ev2); }
    }
    // Skandale um eigene Ministerinnen und Minister
    if (isGov(t.role)) {
      Object.keys(t.cabinet).forEach(id => {
        const m = t.cabinet[id];
        if (m.party !== g.party || !m.name || m.lead) return;
        if (rand(g) < m.risk / 100 * 0.15) {
          t.stats.scandals += 1;
          const txt = pick(g, TD.SCANDALS).replace(/\{minister\}/g, m.name).replace(/\{ministry\}/g, ministryById(id).short + '-Ministerium');
          t.pending.push({ type: 'scandal', ministry: id, text: txt });
        }
      });
    }
    // Das politische Jahr: Klausur und Aschermittwoch im Winter, Sommerinterview, Haushaltswoche und Neujahrsansprache.
    if (!first) {
      const sp = id => { const ev = eventById(id); if (ev && eligibleRole(g, ev)) queueEvent(g, ev); };
      if (c.qn === 1) { sp('klausur'); if (rand(g) < 0.6) sp('aschermittwoch'); }
      if (c.qn === 3) sp('sommerinterview');
      if (c.qn === 4) { if ((t.seats[g.party] || 0) > 0) sp('generaldebatte'); sp('neujahr'); if (isGov(t.role) && rand(g) < 0.5) sp('herbstgipfel'); }
      partyQuarter(g, c);
      roleQuarter(g, c);
      wkQuarter(g);
    }
    // Regierungsbefragung: Die Kanzlerin/der Kanzler stellt sich dreimal im Jahr dem Plenum (§ 106 GOBT, seit 2018).
    if (!first && t.role === 'kanzler' && c.qn === 2) {
      const opp = CONTEST.filter(p => t.gov.indexOf(p) === -1 && (t.seats[p] || 0) > 0).sort((a, b) => t.seats[b] - t.seats[a])[0];
      t.pending.push({ type: 'kbefragung', topic: A.TOPIC_IDS.slice().sort((a, b) => g.salience[b] - g.salience[a])[0], opp });
    }
    // Schlussdebatte (2./3. Lesung) vor den Abstimmungen über eure eigenen Gesetze in diesem Quartal.
    if (!first && isGov(t.role)) t.laws.filter(l => l.stage === 'bundestag' && l.by === g.party && !l.delay && l.btQ !== t.q && !l.debated).forEach(l => { l.debated = true; t.pending.push({ type: 'debatte', law: l.id, i: 0, q: 0 }); });
    // Gewissensentscheidung: höchstens zwei je Legislatur.
    if (!first && (t.seats[g.party] || 0) > 0 && t.q >= 2 && t.q <= 13 && (t.gewDone || []).length < 2 && rand(g) < 0.12) {
      const open = GEWISSEN.filter(x => (t.gewDone || []).indexOf(x.id) === -1);
      if (open.length) { const x = pick(g, open); (t.gewDone = t.gewDone || []).push(x.id); t.pending.push({ type: 'gewissen', id: x.id }); }
    }
    // Rückblick: Journalisten erinnern an eine frühere Entscheidung.
    const mem = (t.memory || []).filter(m => !m.done && t.q - m.q >= 4);
    if (!first && mem.length && rand(g) < 0.25) { const m = pick(g, mem); m.done = true; t.pending.push({ type: 'memory', m, ago: t.q - m.q }); }
    // Landtagswahl am Ende dieses Quartals: Wie stark mischt sich die Bundespartei ein?
    if (!first) ltwDue(t).forEach(l => { if ((t.landPrev[l] || 0) >= 3 || t.laender[l].gov.indexOf(g.party) !== -1) t.pending.push({ type: 'ltwcamp', land: l }); });
    // Eure Entwürfe im parlamentarischen Verfahren: Stellungnahme des Bundesrates und Anhörung im Ausschuss
    if (isGov(t.role)) {
      t.laws.filter(l => l.stage === 'bundestag' && l.by === g.party && !l.fraktion && !l.hearing).forEach(l => {
        l.hearing = true;
        const br = bundesratVote(g, l);
        if (!br.pass && (l.zust || 69 - br.yes >= TD.BUNDESRAT_MAJ)) t.pending.push({ type: 'brstell', law: l.id, yes: br.yes });
        else if (rand(g) < 0.5) t.pending.push({ type: 'anhoerung', law: l.id, expert: pick(g, ANHOERUNG) });
      });
      // Knappe Abstimmungen dieses Quartals: Wackelkandidaten im Bundestag, umkämpfte Länder im Bundesrat
      t.laws.filter(l => t.gov.indexOf(l.by) !== -1 && !l.whipped && l.stage === 'bundestag' && (l.by === g.party || t.role === 'kanzler')).forEach(l => {
        const w = whipGroups(g, l);
        if (w) { l.whipped = true; l.whipGroups = w.groups.map(x => ({ name: x.name, p: x.p, n: x.n })); t.pending.push({ type: 'whip', law: l.id, groups: w.groups, yes: w.yes, no: w.no, i: 0 }); }
      });
      t.laws.filter(l => t.gov.indexOf(l.by) !== -1 && !l.brWhipped && l.stage === 'bundesrat' && (l.by === g.party || t.role === 'kanzler')).forEach(l => {
        const b = brSwing(g, l);
        if (b) { l.brWhipped = true; t.pending.push({ type: 'brwhip', law: l.id, lands: b.lands, yes: b.yes, i: 0 }); }
      });
    }
    // Abstimmungen, bei denen ihr als Opposition entscheidet
    if (t.role === 'opposition') {
      t.laws.filter(l => l.stage === 'bundestag' && l.by !== g.party).forEach(l => t.pending.push({ type: 'vote', law: l.id }));
      if (t.budget.draft && t.budget.draft.done && (c.qn === 4 || t.budget.status === 'vorlaeufig')) t.pending.push({ type: 'vote', budget: true, again: t.budget.fails || 0 });
    }
    t.stats.qRole[t.role] = (t.stats.qRole[t.role] || 0) + 1;
  }

  function updateParty(g) {
    const t = g.term;
    const P = t.party;
    const P0 = party(g.party);
    const share = t.lastNat[g.party];
    const income = P0.budget * 0.035 * (0.5 * share / Math.max(0.5, t.share0) + 0.5 * P.members / P0.members);
    P.cash = Math.round((P.cash + income) * 100) / 100;
    const trend = share - t.prevShare;
    P.members = Math.round(P.members * (1 + clamp(trend * 0.01, -0.01, 0.012) - 0.002));
    P.unity = clamp(P.unity + (60 - P.unity) * 0.08 + (trend > 0.3 ? 1.5 : trend < -0.5 ? -1.5 : 0) - (t.role === 'apo' ? 0.8 : 0), 0, 100);
    Object.keys(P.lv).forEach(l => { P.lv[l] = clamp(P.lv[l] + (20 - P.lv[l]) * 0.06 + between(g, -2, 3.5), 0, 100); });
    P.leader.like = clamp(P.leader.like * 0.97, -5, 5);
    t.prevShare = share;
  }

  function updateMood(g) {
    const t = g.term;
    if (t.gov.length < 2) { t.mood = 60; t.streit = 0; return; }
    t.mood = clamp(t.mood + (50 - t.mood) * 0.04 - 0.5 + between(g, -1.5, 1.5), 0, 100);
    // Dauerstreit kostet alle Partner – wie bei der Ampel (zusammen 52 → 38 % in knapp zwei Jahren).
    t.streit = t.mood < 40 ? (t.streit || 0) + 1 : Math.max(0, (t.streit || 0) - 1);
    if (t.streit) { cat('streit'); t.gov.forEach(p => addNatT(g, p, -0.15 * Math.min(t.streit, 4), 'slow')); if (t.streit === 3) news(g, '💥 „Streitkoalition“: Die Medien zählen die Tage bis zum Bruch.', 'warn'); }
    if (t.mood >= 12) { t.lowMood = 0; return; }
    t.lowMood = (t.lowMood || 0) + 1;
    if (t.lowMood < 2 && rand(g) < 0.5) return;
    // Wer am meisten verliert, zieht die Reißleine.
    const partners = t.gov.filter(p => p !== g.party);
    let leaver;
    if (t.role === 'kanzler') leaver = partners.sort((a, b) => shareOf(g, a) - shareOf(g, b))[0];
    else if (t.role === 'junior') leaver = t.chanc;
    else leaver = t.gov.filter(p => p !== t.chanc).sort((a, b) => shareOf(g, a) - shareOf(g, b))[0] || t.chanc;
    if (t.role === 'junior') {
      news(g, sname(t.chanc) + ' beendet die Koalition mit euch.', 'big');
      breakCoalition(g, g.party);
    } else breakCoalition(g, leaver);
  }

  // Eigenständig ausgewiesene Kleinparteien handeln selbst: Kampagnen, Aktionen, Erfolge in den Kommunen.
  // Wer unter „Sonstige“ geführt wird, bleibt unsichtbar und hat keine eigenen Aktionen.
  // Ausgewiesene Kleinparteien machen außerhalb des Bundestags von sich reden. Auf die Umfragen wirkt das nicht
  // pauschal – dort zählen wie bei allen Parteien Gesetze, Ereignisse und die Stimmung.
  function minorActions(g) {
    (D.MINORS || []).forEach(m => {
      if (!E.isShown(g, m.id) || m.id === g.party) return;
      const tp = pick(g, m.topics);
      A.changeSalience(g, tp, 0.003);
      if (rand(g) < 0.4) {
        // Mit Spitzenkandidatur spricht die Person (Einzahl), sonst die Partei.
        const rv = g.rivals && g.rivals[m.id];
        const pl = !rv && m.plural;
        const what = pick(g, [
          (pl ? ' starten' : ' startet') + ' eine Kampagne zum Thema ' + E.topicById(tp).name + '.',
          (pl ? ' sammeln' : ' sammelt') + ' Unterschriften für ein Volksbegehren' + (m.home ? ' in ' + E.stateById(m.home).name : '') + '.',
          (pl ? ' feiern' : ' feiert') + ' Erfolge bei Kommunalwahlen.',
          (pl ? ' organisieren' : ' organisiert') + ' Proteste gegen die Politik der Bundesregierung.'
        ]);
        news(g, (rv ? rv.name + ' (' + m.short + ')' : m.name) + what, 'info');
      }
    });
  }


  // Regierungsverschleiß (Amtsmalus, wie GroKo 2013–17). Wer liefert, geschlossen auftritt und den Koalitionsvertrag
  // umsetzt, kann ihn ausgleichen (Union 2009–13: 33,8 → 41,5 %); Stillstand und Streit (Ampel 2021–24) kosten extra.
  function govWear(g, p) {
    const t = g.term;
    const delivered = Math.min(3, t.qLaws || 0);
    const idle = t.q - (t.lastLawQ === undefined ? -1 : t.lastLawQ) >= 4 ? 0.06 : 0;
    const unity = t.gov.length > 1 ? clamp((t.mood - 50) / 80, -0.25, 0.35) : 0.15;
    const ct = Object.keys(t.contract || {});
    const bilanz = ct.length ? ct.filter(tp => t.policy[tp] === t.contract[tp]).length / ct.length : 0;
    const chanc = p === t.chanc;
    const relief = 0.25 * delivered + unity + (chanc ? 0.6 : 0.4) * bilanz;
    return { delivered, idle, unity, bilanz, relief, total: (chanc ? -0.5 : -0.46) * (1 - relief) - idle };
  }

  // Umfrageinstitute in der Legislatur: jüngste Umfrage jedes Instituts vor Beginn des Quartals.
  function termPolls(g, q) {
    const t = g.term;
    const c = absCal(t.abs0 + (q === undefined ? t.q : Math.max(0, q))); // auch nach dem letzten Quartal
    const now = E.addDays(E.dayUTC(c.year, (c.qn - 1) * 3 + 1, 1), -1);
    const h = t.history || [];
    return E.institutePolls(g, now, dt => {
      const k = dt.getUTCFullYear() * 4 + Math.floor(dt.getUTCMonth() / 3) - t.abs0; // Quartal der Legislatur
      const e = h.filter(x => x.q <= k).pop() || h[0];
      return e ? e.nat : g.poll.nat;
    });
  }
  function termAverage(g, q) { return E.pollAverage(termPolls(g, q)); }

  // Die anderen Parteien verfolgen eigene Ziele: Nach anhaltender Schwäche wechseln sie die Spitze (kurzer Aufschwung,
  // wie nach Vorsitzwechseln üblich – geschätzt), vorher schärfen sie ihr Profil mit ihrem Kernthema. Eigener Zufall,
  // damit der übrige Spielverlauf nicht verschoben wird.
  function aiParties(g) {
    const t = g.term;
    t.aiState = t.aiState || {};
    CONTEST.filter(p => p !== g.party && E.isShown(g, p) && (t.start[p] || 0) >= 3).forEach((p, i) => {
      const st = t.aiState[p] = t.aiState[p] || { low: 0, change: -9, profile: -9 };
      const R = localRng(((g.nameSeed || 1) * 17 + t.abs0 * 131 + t.q * 977 + i * 7919 + 3) % 2147483647);
      const drop = (t.start[p] || 0) - shareOf(g, p);
      st.low = drop >= 3 ? st.low + 1 : 0;
      if (st.low >= 2 && p !== t.chanc && t.q - st.change >= 6 && R() < 0.4) {
        const old = g.rivals && g.rivals[p] ? g.rivals[p].name : null;
        const name = newPerson(g, p, bigLand(g, p)).full;
        if (g.rivals && g.rivals[p]) Object.assign(g.rivals[p], { name, feud: 0, since: cal(t).year });
        if (t.vize && t.vize.party === p) t.vize.name = name;
        Object.keys(t.cabinet).forEach(id => { const m = t.cabinet[id]; if (m.lead && m.party === p) m.name = name; });
        st.change = t.q; st.low = 0;
        addNat(g, p, 0.8);
        news(g, 'Führungswechsel bei ' + sname(p) + ': ' + name + (old ? ' löst ' + old + ' ab' : ' übernimmt') + '. Die Partei hofft auf einen Neustart.', 'big');
        chron(g, 'konkurrenz', 'Führungswechsel bei ' + sname(p) + ': ' + name + (old ? ' folgt auf ' + old : '') + '.');
      } else if (drop >= 1.5 && t.q - st.profile >= 4 && R() < 0.3) {
        const core = (E.partyTopics(g, p) || [])[0];
        if (!core) return;
        st.profile = t.q;
        A.changeSalience(g, core, 0.008);
        addNat(g, p, 0.25);
        news(g, sname(p) + ' schärft das Profil: ' + E.topicById(core).name + ' rückt ins Zentrum der Kampagne.', 'info');
        chron(g, 'konkurrenz', sname(p) + ' setzt voll auf ' + E.topicById(core).name + '.');
      }
    });
  }

  // Wirtschaftsdaten je Quartal für die Zeitreihen.
  function econSnap(t) {
    const e = t.econ;
    return { growth: r2(e.growth), unemp: r2(e.unemp), infl: r2(e.infl), debt: r2(e.debt) };
  }

  function updatePolls(g) {
    const t = g.term;
    const e = t.econ;
    decayNat(g);
    D.STATES.forEach(st => { PIDS.forEach(p => { g.reg[st.id][p] *= 0.8; }); });
    MINOR.forEach(m => { g.minor[m].trend = clamp(g.minor[m].trend + between(g, -0.13, 0.13), -1, 2.5); }); // Eigendynamik der Kleinparteien
    minorActions(g);
    // Regierungsverschleiß und Wirtschaftslage (geschätzt)
    cat('regierung');
    const econ = 0.25 * (e.growth - 1) - 0.6 * (e.unemp - t.econPrev.unemp) - 0.08 * Math.max(0, e.infl - 2.5);
    t.gov.forEach(p => { addNat(g, p, govWear(g, p).total + econ * (p === t.chanc ? 1 : 0.5)); });
    if (t.gov.length > 1 && t.mood < 35) t.gov.forEach(p => addNat(g, p, -0.1));
    if (t.budget.status === 'vorlaeufig') t.gov.forEach(p => addNat(g, p, -0.12));
    if (t.ua) { t.gov.forEach(p => addNat(g, p, -0.1 * (t.ua.f || 1))); addNat(g, g.party, 0.04 * (t.ua.f || 1)); }
    // Eigene Spitze und Geschlossenheit
    cat('partei');
    addNat(g, g.party, 0.025 * t.party.leader.like + (t.party.unity - 55) / 400);
    // Unzufriedene Flügel nagen an der Geschlossenheit; die Stimmung beruhigt sich mit der Zeit.
    const PL = partyLife(g);
    t.party.unity = clamp(t.party.unity + Math.min(0, Math.min(PL.wings[0], PL.wings[1]) - 50) * 0.05, 0, 100);
    PL.wings = PL.wings.map(w => w + (55 - w) * 0.1);
    // Glaubwürdigkeit: Wer verlässlich nach seinem Programm handelt, gewinnt Vertrauen.
    cat('glaubw');
    if (t.cred === undefined) t.cred = 55;
    addNat(g, g.party, (t.cred - 50) / 250);
    t.cred += (55 - t.cred) * 0.04;
    // Wer nicht handelt, verschwindet aus den Schlagzeilen.
    cat('aktion');
    if (t.apLeft) addNat(g, g.party, -0.04 * t.apLeft);
    if (t.chanc !== g.party && t.chancellor) addNat(g, t.chanc, 0.03 * (t.chancellor.like || 0));
    cat('konkurrenz');
    PIDS.forEach(p => { if (p !== g.party) addNat(g, p, between(g, -0.12, 0.12)); });
    aiParties(g);
    // Dauerrivalen schlagen zurück: Wer sich oft mit euch angelegt hat, sucht die Gelegenheit.
    Object.keys(g.rivals || {}).forEach(p => {
      const rv = g.rivals[p];
      if (!(rv.feud >= 2) || !(t.seats[p] > 0) || !E.isShown(g, p)) return;
      if (rand(g) < 0.15 * E.rivalStyle(rv).attack) {
        addNat(g, g.party, -0.12);
        addNat(g, p, 0.04);
        const past = (t.voteLog || []).filter(x => x.my && x.my !== 'enthaltung' && !x.gewissen)[0];
        const quote = past && rand(g) < 0.4 ? '„' + seasonLabel(t, past.q) + ' habt ihr ' + (past.my === 'ja' ? 'für' : 'gegen') + ' „' + past.title + '“ gestimmt – und jetzt?“' : pick(g, ['„Versagt auf ganzer Linie!“', '„Nichts als heiße Luft.“', '„Die haben das Land nicht im Griff.“', '„Wortbruch!“']);
        news(g, '🥊 ' + rv.name + ' (' + sname(p) + ') attackiert euch: ' + quote, 'warn');
      }
    });
    // Unruhige Landesverbände kosten im Land
    Object.keys(t.party.lv).forEach(l => { const u = t.party.lv[l]; if (u > 50 && g.reg[l]) g.reg[l][g.party] -= (u - 50) / 80; });
    t.intl += (50 - t.intl) * 0.05;
    // Themen kehren langsam zur Normalität zurück
    const sb = A.salienceBase(cal(t).year);
    const pr = lagePressure(g);
    const tsum = A.TOPIC_IDS.reduce((x, tp) => x + sb[tp] * pr[tp], 0);
    A.TOPIC_IDS.forEach(tp => { g.salience[tp] += (sb[tp] * pr[tp] / tsum - g.salience[tp]) * 0.1; });
    A.rollPollErr(g);
    A.takePoll(g);
    A.updateMinorVisibility(g, true).forEach(x => news(g, '📊 ' + x, 'info'));
    t.lastNat = A.nationalShares(g);
    t.history.push({ q: t.q, nat: roundShares(g.poll.nat), econ: econSnap(t) });
  }

  function endQuarter(g) {
    const t = g.term;
    if (!t || t.over) return { ok: false, text: 'Die Legislaturperiode ist vorbei.' };
    if (t.pending.length) return { ok: false, text: 'Erst die offenen Entscheidungen treffen.' };
    if (needsNames(g)) autoNames(g);
    t.reel = []; // Abstimmungen dieses Quartals für die Live-Auszählung
    t.apLeft = t.ap;
    const c = cal(t);
    // Haushalt: Entwurf im 3., Abstimmung im 4. Quartal; bei vorläufiger Haushaltsführung neuer Anlauf.
    if (t.budget.draft && !t.budget.draft.done && c.qn === 3) { setBudgetDraft(g, aiBudgetPlan(g), false); }
    if (t.budget.draft && t.budget.draft.done && (c.qn === 4 || t.budget.status === 'vorlaeufig')) budgetVote(g);
    // Gesetze: KI zuerst neue Vorhaben (für das nächste Quartal), dann die Pipeline.
    t.laws.filter(l => ['kabinett', 'bundestag', 'bundesrat', 'vermittlung'].indexOf(l.stage) !== -1 && !(l.stage === 'kabinett' && l.q0 > t.q)).forEach(l => processLaw(g, l));
    if (t.over) return { ok: true, over: true };
    aiLawTurn(g);
    processKlagen(g);
    if (t.ua) { t.ua.left -= 1; if (t.ua.left <= 0) { news(g, '🔎 Der Untersuchungsausschuss legt seinen Abschlussbericht vor – schwere Vorwürfe gegen die Regierung.', 'big'); t.gov.forEach(p => addNat(g, p, -0.2)); t.ua = null; } }
    econQuarter(g);
    if (c.qn === 4) closeYear(g);
    lageQuarter(g);
    const h = t.history;
    pressReview(g, h.length >= 2 ? clamp(h[h.length - 1].nat[g.party] - h[h.length - 2].nat[g.party], -2, 2) : 0);
    updatePolls(g);
    updateSq(g);
    cat('kabinett');
    if (isGov(t.role)) updateCabinet(g);
    updateDemands(g);
    lobbyQuarter(g);
    updateParty(g);
    updateMood(g);
    if (t.over) return { ok: true, over: true };
    euCasesQuarter(g);
    landCoalitions(g);
    ltwDue(t).forEach(l => landtagswahl(g, l));
    flushLtwNight(g);
    if (dueIn(TD.EUROPAWAHL, c)) europawahl(g);
    t.doneAbs = c.abs;
    quarterStories(g);
    t.q += 1;
    if (t.q >= QUARTERS) { endTerm(g, null); return { ok: true, over: true }; }
    beginQuarter(g, false);
    return { ok: true };
  }


  // ---------- Laufbahn (Stufe 3) ----------
  // Die Laufbahn begleitet die Partei über alle Legislaturen: Wahlen, Spitzenleute mit Alter und Ämtern,
  // Bilanzen je Legislatur – und am Ende die Ewigkeits-Bilanz.
  const MAX_AGE = 72;       // spätestens dann geht die Spitze in den Ruhestand
  const PRESSURE_AGE = 67;  // ab dann wird nach Nachfolge gefragt
  function ensureCareer(g) {
    const C = g.career || (g.career = {});
    if (!C.terms) C.terms = [];
    if (!C.elections) C.elections = [];
    if (!C.leaders) C.leaders = [];
    if (!C.id) C.id = 'c' + ((g.nameSeed || 1) * 7 + (g.rng >>> 0)).toString(36);
    C.party = g.party;
    return C;
  }
  function currentLeader(g) {
    const C = ensureCareer(g);
    return C.leaders[C.leaders.length - 1] || null;
  }
  function leaderAge(g, year) {
    const L = currentLeader(g);
    return L && L.born ? year - L.born : null;
  }
  function officeName(g) {
    const t = g.term;
    if (t.role === 'kanzler') return 'Bundeskanzler:in';
    if (t.role === 'junior') { const v = t.vize && t.vize.party === g.party ? ministryById(t.vize.ministry) : null; return 'Vizekanzler:in' + (v ? ' und ' + v.short : ''); }
    if (t.role === 'opposition') {
      const opp = CONTEST.filter(p => t.gov.indexOf(p) === -1 && (t.seats[p] || 0) > 0).sort((a, b) => t.seats[b] - t.seats[a]);
      return opp[0] === g.party ? 'Oppositionsführer:in' : 'Fraktionsvorsitz';
    }
    return 'Parteivorsitz (außerparlamentarisch)';
  }
  // Neue Spitze übernehmen (Nachfolge, Parteitag).
  function newLeader(g, name, year, born, how) {
    const C = ensureCareer(g);
    const old = currentLeader(g);
    if (old && !old.to) old.to = year;
    const L = { name, from: year, born, offices: [], how: how || '' };
    C.leaders.push(L);
    return L;
  }
  function careerStartTerm(g, r) {
    const t = g.term;
    const C = ensureCareer(g);
    C.elections.push({ year: t.year0, share: r1(r.shares[g.party]), seats: r.seats[g.party] || 0, status: r.outcome.status, score: r.outcome.score,
      rating: r.outcome.rating, gov: t.gov.slice(), leader: t.party.leader.name });
    let L = currentLeader(g);
    // Jahrgang aus dem Namen abgeleitet (45–58 Jahre bei der Wahl), ohne den Zufallsverlauf des Spiels zu verändern.
    const hash = String(t.party.leader.name).split('').reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
    if (!L || L.name !== t.party.leader.name) L = newLeader(g, t.party.leader.name, t.year0, t.year0 - (45 + hash % 14), 'Spitzenkandidatur');
    t.party.leader.born = L.born;
    L.offices.push({ year: t.year0, office: officeName(g) });
  }
  // Ewigkeits-Bilanz über alle abgeschlossenen Legislaturen.
  function legacy(career) {
    const C = career || {};
    const terms = C.terms || [];
    const el = C.elections || [];
    const sum = f => terms.reduce((s0, x) => s0 + (f(x) || 0), 0);
    const q = k => sum(x => (x.roles && x.roles[k]) || 0);
    const years = sum(x => (x.to || 0) - (x.from || 0));
    const out = {
      terms: terms.length, elections: el.length, years,
      kanzlerJahre: r1(q('kanzler') / 4), juniorJahre: r1(q('junior') / 4), oppJahre: r1(q('opposition') / 4), apoJahre: r1(q('apo') / 4),
      laws: sum(x => x.lawsOwn), promises: sum(x => x.promises), budgets: sum(x => x.budgets), ltwGov: sum(x => x.ltwGov),
      best: el.length ? el.reduce((a, b) => (b.share > a.share ? b : a)) : null,
      worst: el.length ? el.reduce((a, b) => (b.share < a.share ? b : a)) : null,
      wins: el.filter(x => x.status === 'kanzler').length,
      score: sum(x => x.score) + el.reduce((s0, x) => s0 + (x.score || 0), 0),
      leaders: (C.leaders || []).length
    };
    const per = (out.terms + out.elections) ? out.score / (out.terms + out.elections) : 0;
    out.rating = out.kanzlerJahre >= 12 ? 'Eine Dynastie' : out.kanzlerJahre >= 8 ? 'Eine Ära' : per >= 110 ? 'Glanzvolle Geschichte' : per >= 85 ? 'Feste Größe der Republik' : per >= 60 ? 'Auf und Ab' : 'Am Rand der Bedeutungslosigkeit';
    return out;
  }

  // Wer führt in den nächsten Wahlkampf? Die bisherige Spitze (wenn sie darf) oder eine von drei Nachfolgen.
  function leaderOptions(g, year) {
    const t = g.term;
    const P = t.party;
    const age = leaderAge(g, year) || 55;
    const s = t.summary || summary(g);
    const forced = age >= MAX_AGE;
    const pressure = !forced && (s.delta < -3 || s.score < 50 || age >= PRESSURE_AGE);
    const known = t.role === 'kanzler' ? 95 : t.role === 'junior' ? 88 : t.role === 'opposition' ? 80 : 60;
    const stay = { kind: 'stay', name: P.leader.name, age, like: r2(P.leader.like + (pressure ? -0.3 : 0)), known, canStay: !forced, pressure,
      hint: forced ? 'Mit ' + age + ' Jahren geht es in den Ruhestand.' : pressure ? 'Die Partei fordert einen Neuanfang (' + (age >= PRESSURE_AGE ? age + ' Jahre alt' : 'schwache Bilanz') + ') – wer bleibt, verliert an Beliebtheit.' : age + ' Jahre, bekannt und erfahren.' };
    const opts = [];
    // Aus dem Kabinett: die kompetenteste eigene Ministerin bzw. der kompetenteste eigene Minister.
    const minister = Object.keys(t.cabinet || {}).map(id => Object.assign({ id }, t.cabinet[id])).filter(m => m.party === g.party && m.name && !m.lead && m.name !== P.leader.name)
      .sort((a, b) => (b.comp || 0) - (a.comp || 0))[0];
    if (minister) opts.push({ kind: 'new', type: 'Erfahrene Ministerin/erfahrener Minister', name: minister.name, age: Math.round(between(g, 48, 62)), like: r2(between(g, 0.2, 1.0)), known: Math.round(between(g, 60, 78)),
      hint: 'Leitet das ' + ministryById(minister.id).short + '-Ressort (Kompetenz ' + minister.comp + '). Bekannt und regierungserfahren.' });
    const pick1 = newPerson(g, g.party, weightedLand(g), { young: true });
    opts.push({ kind: 'new', type: 'Hoffnungsträger:in', name: pick1.full, age: Math.round(between(g, 35, 45)), like: r2(between(g, 1.0, 1.8)), known: Math.round(between(g, 30, 45)),
      hint: 'Jung, frisch, beliebt – aber noch wenig bekannt.' });
    const pick2 = newPerson(g, g.party, bigLand(g, g.party));
    opts.push({ kind: 'new', type: 'Kandidat:in des Parteiflügels', name: pick2.full, age: Math.round(between(g, 45, 58)), like: r2(between(g, -0.3, 0.6)), known: Math.round(between(g, 45, 60)),
      hint: 'Die Basis steht geschlossen dahinter, in der Mitte eher skeptisch beäugt.' });
    if (!minister) {
      const pick3 = newPerson(g, g.party, weightedLand(g));
      opts.unshift({ kind: 'new', type: 'Ministerpräsident:in aus einem Land', name: pick3.full, age: Math.round(between(g, 50, 62)), like: r2(between(g, 0.3, 1.1)), known: Math.round(between(g, 55, 70)),
        hint: 'Regiert erfolgreich ein Land und bringt Verwaltungserfahrung mit.' });
    }
    return { year, stay, options: opts.slice(0, 3) };
  }

  // ---------- Ende der Legislaturperiode ----------
  function endTerm(g, early) {
    const t = g.term;
    if (t.over) return;
    t.over = true;
    t.early = early || null;
    t.endQ = t.q;
    t.pending = t.pending.filter(p => p.type === 'info');
    t.summary = summary(g);
    news(g, early ? '🗳️ ' + early + '. Der nächste Wahlkampf beginnt!' : '🗳️ Die Legislaturperiode endet. Der Wahlkampf für die Bundestagswahl ' + cal(t, QUARTERS - 1).year + ' beginnt!', 'big');
  }

  function summary(g) {
    const t = g.term;
    const now = (t.lastNat || A.nationalShares(g))[g.party];
    const d = now - t.share0;
    const q = t.stats.qRole;
    let score = 40 + d * 6 + t.stats.promises * 5 + t.stats.lawsOwn * 2 + t.stats.budgets * 3 - t.stats.failed * 2 - t.stats.scandals * 2;
    score += 1.5 * (q.kanzler || 0) + 0.8 * (q.junior || 0);
    if ((q.kanzler || 0) + (q.junior || 0) > 0) score += (t.intl - 50) / 5;
    score += t.stats.ltw.reduce((s, x) => s + (x.inGov ? 1 : 0) + clamp(x.diff * 0.5, -3, 3), 0);
    score = Math.max(0, Math.round(score));
    const rating = score >= 140 ? 'Eine Ära' : score >= 110 ? 'Erfolgreiche Legislatur' : score >= 85 ? 'Solide Bilanz' : score >= 60 ? 'Durchwachsen' : score >= 35 ? 'Verlorene Jahre' : 'Absturz';
    return { score, rating, share: r1(now), delta: r1(d), promises: t.stats.promises, lawsOwn: t.stats.lawsOwn, lawsTotal: t.stats.lawsTotal,
      budgets: t.stats.budgets, scandals: t.stats.scandals, ltw: t.stats.ltw.length, ltwGov: t.stats.ltw.filter(x => x.inGov).length,
      debt: r1(t.econ.debt), growth: r1(t.econ.growth), unemp: r1(t.econ.unemp), intl: Math.round(t.intl) };
  }

  // Laufbahn einschließlich der gerade beendeten Legislatur (ohne den Spielstand zu verändern).
  function careerSnapshot(g) {
    const t = g.term;
    const career = copy(ensureCareer(g));
    const c = cal(t, t.endQ === undefined ? t.q : t.endQ);
    career.terms.push(Object.assign({ n: t.n, from: t.year0, to: c.year, role: t.role, roles: Object.assign({}, t.stats.qRole), early: t.early, gov: t.gov.slice() }, t.summary || summary(g)));
    return career;
  }

  // Übergabe an den nächsten Wahlkampf.
  function nextCampaign(g) {
    const t = g.term;
    if (!t || !t.over) return null;
    const base = {};
    D.STATES.forEach(st => { base[st.id] = A.stateShares(g, st.id); });
    const career = careerSnapshot(g);
    const c = cal(t, t.endQ === undefined ? t.q : t.endQ);
    // Wahltermin: regulär im letzten Quartal der Legislatur, nach einem Bruch im Quartal danach.
    const electionAbs = t.early ? c.abs + 1 : t.abs0 + QUARTERS - 1;
    const P0 = party(g.party);
    const money = Math.round(P0.budget * clamp(0.6 + 0.4 * t.party.cash / P0.budget, 0.6, 1.5) * 10) / 10;
    upgradeTaxes(t);
    const world = { econ: copy(t.econ), policy: copy(t.policy), taxes: copy(t.taxes), taxModel: 2, statutes: copy(t.statutes || {}), intl: t.intl, laender: copy(t.laender),
      budget: { plan: copy(t.budget.plan), extra: t.budget.extra, def: t.budget.def, reform: t.budget.reform || 0, notlage: false, drift: copy(t.budget.drift || {}) },
      landPrev: copy(t.landPrev), sq: copy(t.sq), abs0: electionAbs + 1, doneAbs: t.doneAbs, lage: t.lage ? copy(t.lage) : null };
    const leaders = leaderOptions(g, Math.floor(electionAbs / 4));
    return {
      party: g.party,
      candidate: t.party.leader.name,
      leaders,
      program: g.program ? copy(g.program) : null,
      carry: { base, nameSeed: ((g.nameSeed || 1) * 31 + 7919) % 2147483647 || 1, career, firewall: Object.assign({}, g.firewall || {}),
        year: Math.floor(electionAbs / 4), prevYear: t.year0, shown: Object.assign({}, g.shown || {}), money, world,
        prevSeats: Object.assign({}, t.seats), prevShares: Object.assign({}, t.start),
        lobby: g.lobby ? Object.assign(copy(g.lobby), { asked: [] }) : null,
        rivals: nextRivals(g, electionAbs),
        prevWk: (() => { const o = {}; ((g.result && g.result.wk) || []).forEach(w => { o[w.nr] = w.win; }); return o; })(),
        prevTurnout: g.result ? { DE: g.result.turnout, states: g.result.turnoutStates || {} } : null,
        homeWk: g.homeWk || null, wkCare: t.wk ? t.wk.care : null, record: termRecord(g) }
    };
  }

  // Gegnerische Spitzen: Wer schwer verloren hat oder zu alt ist, wird abgelöst; alte Fehden kühlen etwas ab.
  function nextRivals(g, electionAbs) {
    const t = g.term;
    const year = Math.floor(electionAbs / 4);
    const out = {};
    Object.keys(g.rivals || {}).forEach(p => {
      const rv = copy(g.rivals[p]);
      const lost = (t.lastNat[p] || 0) - (t.start[p] || 0) < -3;
      if (year - rv.born >= MAX_AGE - 2 || (lost && rand(g) < 0.6)) {
        const person = newPerson(g, p, bigLand(g, p));
        out[p] = { name: person.full, style: pick(g, E.RIVAL_STYLES).id, born: year - 42 - Math.floor(rand(g) * 15), feud: 0, since: year, prev: rv.name };
        news(g, rv.name + ' gibt die Führung von ' + sname(p) + ' ab. Neu an der Spitze: ' + person.full + '.', 'info');
      } else { rv.feud = Math.max(0, (rv.feud || 0) - 1); out[p] = rv; }
    });
    return out;
  }

  // Spitze für den nächsten Wahlkampf festlegen: 'stay' oder Index einer Nachfolge.
  function chooseLeader(next, choice) {
    const L = next.leaders;
    if (!L) return next;
    const C = next.carry.career;
    const cur = C.leaders[C.leaders.length - 1];
    if (choice === 'stay' && L.stay.canStay) {
      next.candidate = L.stay.name;
      next.carry.cand = { known: L.stay.known, like: L.stay.like };
      return next;
    }
    const o = L.options[typeof choice === 'number' ? choice : 0] || L.options[0];
    if (cur && !cur.to) cur.to = L.year;
    C.leaders.push({ name: o.name, from: L.year, born: L.year - o.age, offices: [], how: o.type });
    next.candidate = o.name;
    next.carry.cand = { known: o.known, like: o.like };
    return next;
  }

  const TERM = {
    QUARTERS, ACTIONS, LAW_STEPS, forecast, lageBilanz, lawEffects, ensureLage, SOFORT, SHADOW_SETS, comebackBarometer, wkStatus, homeWk, termRecord, debtPath, activeMeasures, avgRate, govWear, WOBBLE, brAligned, landGovernment, dueVotes, GEWISSEN, startTerm, endQuarter, performAction, canAct, resolvePending, nameMinister, autoNames, needsNames,
    lawOptions, lawBlock, taxRevAt, taxGrowthAt, taxInflAt, fmtTax, upgradeTaxes, lawLean, predict, bundestagVote, bundesratVote, budgetCalc, setBudgetDraft, playerDraftsBudget, calendar, quarterLabel, seasonLabel, quarterStart, quarterEnd, plenaryDate, plenaryLabel, nextSession, termPolls, termAverage, cal,
    lawName, lawTitle, leanOf, quorum, eventChoices, fillText, eventById, ministryById, taxById, areaById, nextCampaign, summary,
    MEDIA, media, actionCash, govSeats, isGov, legacy, LB, careerSnapshot, chooseLeader, leaderAge, currentLeader, MAX_AGE, sqForces, absCal, FX_NAMES, ministerFor, eventMinister, ownMinistries, endTerm, defaultVote, partyVote, mandateVote
  };
  if (node) module.exports = TERM; else root.BTW_TERM = TERM;
})(this);
