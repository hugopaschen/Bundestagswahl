/*
 * Legislaturperiode: Nach der Wahl regiert ihr vier Jahre (16 Quartale) – als Kanzlerpartei, als
 * Juniorpartner, in der Opposition oder außerhalb des Bundestags. Ohne DOM, mit Node testbar.
 */
(function (root) {
  const node = typeof module !== 'undefined' && module.exports;
  const D = node ? require('./data.js') : root.BTW_DATA;
  const E = node ? require('./engine.js') : root.BTW_ENGINE;
  const TD = node ? require('./termdata.js') : root.BTW_TERMDATA;
  const A = E._api;

  const QUARTERS = 16;
  const FIRST_YEAR = 2029;   // die Wahl im Spiel ist die Bundestagswahl 2029
  const NAT_DECAY = 0.88;    // Umfrage-Effekte verblassen pro Quartal
  const ACT_K = 0.6;         // Stärke der eigenen Aktionen auf die Umfragen
  const SEATS = D.SEATS;
  const MAJ = E.MAJORITY;
  const PIDS = A.PARTY_IDS;
  const MINOR = A.MINOR_IDS;
  const CONTEST = E.CONTEST_IDS;
  const OTHER = D.OTHER.id;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r1 = x => Math.round(x * 10) / 10 + 0;
  const r2 = x => Math.round(x * 100) / 100 + 0;
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
  // Quartal 0 ist das 2. Quartal des Wahljahres (Wahl im Februar/März).
  function cal(t, q) {
    const idx = 1 + Math.min(QUARTERS - 1, q === undefined ? t.q : q);
    return { year: t.year0 + Math.floor(idx / 4), qn: idx % 4 + 1 };
  }
  function quarterLabel(t, q) { const c = cal(t, q); return c.qn + '. Quartal ' + c.year; }
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
    for (let q = t.q; q < QUARTERS && out.length < (n || 6); q++) {
      const c = cal(t, q);
      ltwDue(t, q).forEach(l => out.push({ q, label: quarterLabel(t, q), kind: 'ltw', land: l, text: 'Landtagswahl ' + E.stateById(l).name }));
      if (dueIn(TD.EUROPAWAHL, c)) out.push({ q, label: quarterLabel(t, q), kind: 'ew', text: 'Europawahl' });
      if (dueIn(TD.BUNDESVERSAMMLUNG, c)) out.push({ q, label: quarterLabel(t, q), kind: 'bv', text: 'Bundesversammlung' });
      if (c.qn === 3 && q < QUARTERS - 1) out.push({ q, label: quarterLabel(t, q), kind: 'haushalt', text: 'Haushaltsentwurf ' + (c.year + 1) });
    }
    out.push({ q: QUARTERS, label: quarterLabel(t, QUARTERS - 1), kind: 'btw', text: 'Bundestagswahl ' + (t.year0 + 4) });
    return out;
  }

  // ---------- Positionen ----------
  const PROXY = { fw: 'union', volt: 'gruene', tierschutz: 'gruene' };
  function leanOf(g, p, topic) {
    if (p === g.party && g.program && D.PROGRAM[topic][g.program.positions[topic]]) return D.PROGRAM[topic][g.program.positions[topic]].lean;
    const P = party(p);
    if (P && P.lean) return P.lean[topic];
    return PROXY[p] ? party(PROXY[p]).lean[topic] : 0;
  }
  const optIndex = (topic, lean) => Math.max(0, D.PROGRAM[topic].findIndex(o => o.lean === lean));
  const lawTopic = law => (law.kind === 'tax' ? 'finanzen' : law.topic);
  const lawLean = law => (law.kind === 'tax' ? taxById(law.tax).levels[law.level].lean : D.PROGRAM[law.topic][law.opt].lean);
  function lawName(law) {
    if (law.kind === 'tax') { const x = taxById(law.tax); return x.name + ': ' + x.levels[law.level].label; }
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
  function shareOf(g, p) { return (g.term.lastNat && g.term.lastNat[p]) || 5; }
  // Umfragewirkung in Punkten, für kleine Parteien gedämpft (wie im Wahlkampf).
  function addNat(g, p, v) {
    if (!v) return;
    if (PIDS.indexOf(p) !== -1) g.nat[p] += v * A.sizeFactor(shareOf(g, p));
    else if (g.minor && g.minor[p]) g.minor[p].nat += v * A.sizeFactor(shareOf(g, p));
  }
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
    else if (!t.chancellor || t.chancellor.party !== t.chanc) t.chancellor = { name: newPerson(g, t.chanc, bigLand(g, t.chanc)).full, party: t.chanc, like: A.candStart(t.chanc).like };
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
    t.cabinet[id] = { party: g.party, name, female: c.female, kind: c.kind, land: c.land, comp: c.comp, loyal: c.loyal, risk: c.risk };
    t.party.unity = clamp(t.party.unity + (k.unity || 0), 0, 100);
    if (k.lv) t.party.lv[c.land] = clamp((t.party.lv[c.land] || 20) + k.lv, 0, 100);
    if (k.like) t.party.leader.like = clamp(t.party.leader.like + k.like, -5, 5);
    if (t.vize && t.vize.ministry === id) t.vize.name = name;
    return { ok: true };
  }
  function autoNames(g) {
    const t = g.term;
    Object.keys(t.cabinet).forEach(id => { if (t.cabinet[id].party === g.party && !t.cabinet[id].name) nameMinister(g, id, 0); });
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
    g.salience = Object.assign({}, D.SALIENCE0);
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
      year0: g.year || FIRST_YEAR,
      q: 0,
      seats: Object.assign({}, r.seats),
      gov: [], chanc: null, tolerated: false, role: 'opposition',
      cabinet: {}, contract: {}, chancellor: null, vize: null,
      policy: world ? copy(world.policy) : {},
      taxes: world ? copy(world.taxes) : {},
      econ: world ? copy(world.econ) : Object.assign({}, TD.ECON0, { pol: { growth: 0, unemp: 0, infl: 0 } }),
      budget: world ? Object.assign({ draft: null, status: 'ok', oneoff: 0, history: [], vote: null }, copy(world.budget)) :
        { plan: {}, draft: null, status: 'ok', extra: 0, def: 0, oneoff: 0, reform: 0, notlage: false, history: [], vote: null },
      laws: [], lawSeq: 0, voteChoice: {},
      laender: world && world.laender ? copy(world.laender) : copy(TD.LAENDER),
      ltwBoost: {}, ltwLog: [], landPrev: {},
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
      TD.AREAS.forEach(a => { if (!a.fixed) t.budget.plan[a.id] = 0; });
      t.econ.debtBn = t.econ.debt * t.econ.gdp / 100;
    }
    D.STATES.forEach(st => { t.party.lv[st.id] = Math.round(between(g, 12, 30)); t.landPrev[st.id] = g.base[st.id][g.party] || 0; });

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
    t.mood = r.neg && r.neg.success && gov.indexOf(g.party) !== -1 ? clamp(Math.round(r.neg.mood + 10), 35, 85) : Math.round(between(g, 55, 68));
    const picks = r.neg && r.neg.success && r.neg.ministries && r.neg.members.slice().sort().join() === gov.slice().sort().join() ? r.neg.ministries : draftMinistries(t);
    setupCabinet(g, picks);
    buildContract(g, r.neg && r.neg.success ? r.neg : null);

    A.rollPollErr(g);
    A.takePoll(g);
    t.lastNat = A.nationalShares(g);
    t.prevShare = t.lastNat[g.party];
    t.history.push({ q: -1, nat: roundShares(g.poll.nat) });
    t.econPrev = { unemp: t.econ.unemp };
    g.phase = 'term';
    const govText = gov.map(sname).join('-') + (t.tolerated ? '-Minderheitsregierung' : '-Koalition');
    news(g, 'Die ' + (t.n === 1 ? '' : t.n + '. ') + 'Legislaturperiode beginnt. ' + t.chancellor.name + ' (' + sname(t.chanc) + ') wird zur Kanzlerin/zum Kanzler gewählt – ' + govText + '.', 'big');
    news(g, introText(g), 'role');
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

  // ---------- Wirtschaft und Haushalt ----------
  function budgetCalc(t, plan) {
    const e = t.econ;
    const s = e.gdp / TD.ECON0.gdp;
    const areas = {};
    let spend = 0;
    TD.AREAS.forEach(a => {
      let v = a.base * s;
      if (a.id === 'zinsen') v = a.base * s * (e.debt / TD.ECON0.debt) * (0.85 + 0.075 * e.infl);
      else if (!a.fixed) v *= 1 + ((plan || t.budget.plan)[a.id] || 0) / 100;
      if (a.id === 'verteidigung') v += t.budget.def;
      areas[a.id] = v;
      spend += v;
    });
    spend += t.budget.extra + t.budget.oneoff;
    const taxRev = TD.TAXES.reduce((sum, x) => sum + x.levels[t.taxes[x.id]].rev, 0) * s;
    const revenue = TD.REVENUE0 * s * (1 + (e.growth - e.trend) * 0.012) + taxRev;
    const deficit = spend - revenue;
    const cyc = Math.max(0, e.trend - e.growth) * TD.DEBT_RULE.cyc * e.gdp / 100;
    const defFree = Math.max(0, areas.verteidigung - TD.DEBT_RULE.defenseFree * e.gdp / 100);
    const limit = (TD.DEBT_RULE.structural + (t.budget.reform || 0)) * e.gdp / 100 + cyc + defFree;
    return { areas, spend, revenue, taxRev, deficit, limit, gap: deficit - limit, cyc, defFree,
      defShare: areas.verteidigung / e.gdp * 100, s };
  }

  function econQuarter(g) {
    const t = g.term;
    const e = t.econ;
    const b = budgetCalc(t);
    // Investitionen in Verkehr, Forschung, Bildung … stützen das Wachstum; das Defizit wirkt als Impuls.
    let inv = 0;
    TD.AREAS.forEach(a => { if (!a.fixed && a.growth) inv += (b.areas[a.id] - a.base * b.s) / 10 * a.growth; });
    const impulse = clamp(0.15 * ((b.deficit + TD.DEBT_RULE.sv) / e.gdp * 100 - 2.4), -0.3, 0.3);
    const status = t.budget.status === 'vorlaeufig' ? -0.1 : 0;
    const target = e.trend + e.pol.growth + inv + impulse + status;
    e.growth = clamp(e.growth + 0.35 * (target - e.growth) + between(g, -0.22, 0.22), -5, 5);
    t.econPrev = { unemp: e.unemp };
    e.unemp = clamp(e.unemp - 0.4 * (e.growth - 1.0) / 4 + e.pol.unemp / 4 + between(g, -0.04, 0.04), 2.5, 14);
    e.infl = clamp(e.infl + 0.3 * (2 + e.pol.infl + 0.2 * (e.growth - 1) - e.infl) + between(g, -0.12, 0.12), -1, 12);
    e.gdp *= 1 + (e.growth + e.infl) / 400;
    e.debt = e.debtBn / e.gdp * 100;
  }

  // Jahresabschluss: Schulden fortschreiben, neuer Haushalt tritt in Kraft (falls beschlossen).
  function closeYear(g) {
    const t = g.term;
    const e = t.econ;
    const b = budgetCalc(t);
    e.debtBn += b.deficit + TD.DEBT_RULE.sv;
    e.debt = e.debtBn / e.gdp * 100;
    t.budget.history.push({ year: cal(t).year, deficit: r1(b.deficit), limit: r1(b.limit), gap: r1(b.gap), defShare: r2(b.defShare), notlage: !!t.budget.notlage });
    t.budget.oneoff = 0;
    t.budget.notlage = false;
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
  function aiBudgetPlan(g) {
    const t = g.term;
    const plan = Object.assign({}, t.budget.plan);
    const prefs = [t.chanc, budgetDrafter(t)];
    prefs.forEach(p => {
      const pr = TD.AREA_PREF[p] || {};
      Object.keys(pr).forEach(a => { if (a in plan) plan[a] = clamp((plan[a] || 0) + 5 * pr[a], -10, 10); });
    });
    let tries = 0;
    while (budgetCalc(t, plan).gap > 0 && tries < 20) {
      const cands = Object.keys(plan).filter(a => plan[a] > -10 && ((TD.AREA_PREF[t.chanc] || {})[a] || 0) <= 0)
        .sort((a, b) => areaById(b).base - areaById(a).base);
      if (!cands.length) break;
      plan[cands[tries % cands.length]] -= 5;
      tries += 1;
    }
    return plan;
  }

  // Spieler-Entwurf setzen (Werte aus BUDGET_STEPS).
  function setBudgetDraft(g, plan, notlage) {
    const t = g.term;
    if (!t.budget.draft || t.budget.draft.done) return { ok: false, text: 'Gerade steht kein Haushaltsentwurf an.' };
    const clean = {};
    Object.keys(t.budget.plan).forEach(a => { const v = plan && plan[a] !== undefined ? Number(plan[a]) : t.budget.plan[a]; clean[a] = TD.BUDGET_STEPS.indexOf(v) !== -1 ? v : 0; });
    t.budget.draft.plan = clean;
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
    const b = budgetCalc(t, clean);
    news(g, 'Kabinett beschließt den Haushaltsentwurf ' + t.budget.draft.year + ': Neuverschuldung ' + f1(b.deficit) + ' Mrd. €, erlaubt ' + f1(b.limit) + ' Mrd. €' + (b.gap > 0 && !notlage ? ' – die Schuldenbremse wird gerissen!' : '.'), b.gap > 0 && !notlage ? 'warn' : 'info');
    return { ok: true };
  }

  function budgetVote(g) {
    const t = g.term;
    const draft = t.budget.draft;
    if (!draft) return;
    const b = budgetCalc(t, draft.plan);
    let yes = 0;
    let no = 0;
    const detail = {};
    CONTEST.forEach(p => {
      const s = t.seats[p] || 0;
      if (!s) return;
      let y = 0;
      if (t.gov.indexOf(p) !== -1) {
        // Unzufriedene Partner stimmen bei schlechtem Klima nicht geschlossen zu.
        const pr = TD.AREA_PREF[p] || {};
        let d = 0;
        Object.keys(pr).forEach(a => { d += pr[a] * ((draft.plan[a] || 0) - (t.budget.plan[a] || 0)) / 5; });
        const unhappy = p !== g.party && t.mood < 25 && d < -1;
        y = unhappy ? Math.round(s * 0.4) : Math.round(s * (p === g.party ? 0.99 : 0.97));
      } else if (p === g.party) {
        y = (t.voteChoice.budget || 'nein') === 'ja' ? s : 0;
      } else if (t.tolerated && p === 'afd' && t.gov.every(q => E.fwLevel(g, q) >= 2)) {
        y = s; // Tolerierung
      } else if (t.tolerated && rand(g) < 0.5 && Math.abs(leanOf(g, p, 'finanzen') - leanOf(g, t.chanc, 'finanzen')) <= 1 && p !== 'afd') {
        y = s; // Minderheitsregierung kauft sich Zustimmung
        t.budget.oneoff += 3;
      }
      detail[p] = y;
      yes += y;
      no += s - y;
    });
    const pass = yes > no;
    t.budget.vote = { year: draft.year, yes, no, pass, detail, q: t.q };
    if (pass) {
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
      t.budget.status = 'vorlaeufig';
      news(g, 'Der Haushalt ' + draft.year + ' fällt im Bundestag durch (' + yes + ' Ja, ' + no + ' Nein). Vorläufige Haushaltsführung!', 'bad');
      t.gov.forEach(p => addNat(g, p, -0.3));
      t.mood = clamp(t.mood - 8, 0, 100);
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
      const opts = D.PROGRAM[topic].map((o, i) => i).filter(i => i !== t.policy[topic]);
      if (opts.length) topics.push({ topic, ministry: min, own: mine, opts, current: t.policy[topic], contract: t.contract[topic] });
    });
    const taxes = (t.role === 'kanzler' || own.indexOf('finanzen') !== -1) ? TD.TAXES.filter(x => !inPipeline(t, 'tax:' + x.id)).map(x => ({ tax: x.id, current: t.taxes[x.id] })) : [];
    return { topics, taxes };
  }

  function makeLaw(g, spec, by) {
    const t = g.term;
    const law = { id: ++t.lawSeq, kind: spec.kind === 'tax' ? 'tax' : 'topic', by, stage: 'kabinett', q0: t.q, log: [] };
    if (law.kind === 'tax') { law.tax = spec.tax; law.level = spec.level; law.zust = taxById(spec.tax).zust; }
    else { law.topic = spec.topic; law.opt = spec.opt; law.zust = TD.ZUST_TOPICS.indexOf(spec.topic) !== -1; }
    law.contract = law.kind === 'topic' && t.contract[law.topic] === law.opt;
    t.laws.push(law);
    return law;
  }

  // Wie viele Abgeordnete einer Partei zustimmen (Ja), sich enthalten oder ablehnen.
  function partyVote(g, p, law) {
    const t = g.term;
    const s = t.seats[p] || 0;
    if (!s) return { yes: 0, abst: 0, no: 0 };
    if (p === g.party && !isGov(t.role)) {
      const c = t.voteChoice[law.id] || defaultVote(g, law);
      return c === 'ja' ? { yes: s, abst: 0, no: 0 } : c === 'enthaltung' ? { yes: 0, abst: s, no: 0 } : { yes: 0, abst: 0, no: s };
    }
    const d = Math.abs(leanOf(g, p, lawTopic(law)) - lawLean(law));
    if (t.gov.indexOf(p) !== -1) {
      let rate = d === 2 ? 0.15 : d === 1 ? 0.04 : 0.005;
      if (law.contract) rate /= 2;
      const unity = p === g.party ? t.party.unity : 60;
      rate *= 1.3 - unity / 100;
      if (law.disc && p === g.party) rate *= 0.3;
      if (t.mood < 30) rate *= 1.6;
      const no = Math.round(s * rate);
      return { yes: s - no, abst: 0, no };
    }
    if (d === 0) return { yes: Math.round(s * 0.92), abst: s - Math.round(s * 0.92), no: 0 };
    if (d === 1) return { yes: 0, abst: Math.round(s * 0.5), no: s - Math.round(s * 0.5) };
    return { yes: 0, abst: 0, no: s };
  }
  function defaultVote(g, law) {
    const d = Math.abs(leanOf(g, g.party, lawTopic(law)) - lawLean(law));
    return d === 0 ? 'ja' : d === 1 ? 'enthaltung' : 'nein';
  }
  function bundestagVote(g, law) {
    const t = g.term;
    let yes = 0; let no = 0; let abst = 0;
    const detail = {};
    CONTEST.forEach(p => {
      const v = partyVote(g, p, law);
      detail[p] = v;
      yes += v.yes; no += v.no; abst += v.abst;
    });
    const pass = yes > no;
    const afdYes = detail.afd ? detail.afd.yes : 0;
    const afdDecisive = pass && t.gov.indexOf('afd') === -1 && afdYes > 0 && yes - afdYes <= no + afdYes;
    return { yes, no, abst, pass, detail, afdDecisive };
  }
  // Ein Land stimmt nur zu, wenn alle Regierungsparteien dort einverstanden sind (sonst Enthaltung = Nein).
  function partyBackslaw(g, p, law) {
    const t = g.term;
    if (t.gov.indexOf(p) !== -1) return true;
    return Math.abs(leanOf(g, p, lawTopic(law)) - lawLean(law)) === 0;
  }
  function bundesratVote(g, law) {
    const t = g.term;
    const lands = {};
    let yes = 0;
    Object.keys(t.laender).forEach(l => {
      const L = t.laender[l];
      const ok = (law.bought && law.bought.indexOf(l) !== -1) || L.gov.every(p => partyBackslaw(g, p, law));
      lands[l] = ok;
      if (ok) yes += L.votes;
    });
    return { yes, pass: yes >= TD.BUNDESRAT_MAJ, lands };
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
        const d = Math.abs(leanOf(g, p, lawTopic(law)) - lawLean(law));
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
      law.log.push('Kabinett beschließt den Entwurf (' + quarterLabel(t) + ').');
      news(g, 'Kabinett beschließt: „' + lawName(law) + '“. Jetzt ist der Bundestag dran.', 'info');
      return;
    }
    law.stage = 'bundestag';
    law.log.push('Kabinett beschließt den Entwurf.');
  }

  function processLaw(g, law) {
    const t = g.term;
    if (law.stage === 'kabinett') { cabinetStage(g, law); return; }
    if (law.stage === 'bundestag') {
      const v = bundestagVote(g, law);
      law.bt = { yes: v.yes, no: v.no, abst: v.abst };
      if (!v.pass) {
        law.stage = 'gescheitert';
        law.log.push('Im Bundestag gescheitert: ' + v.yes + ' Ja, ' + v.no + ' Nein, ' + v.abst + ' Enthaltungen.');
        news(g, 'Abstimmungsniederlage: „' + lawName(law) + '“ scheitert im Bundestag (' + v.yes + ':' + v.no + ').', 'bad');
        t.gov.forEach(p => addNat(g, p, -0.15));
        t.mood = clamp(t.mood - 4, 0, 100);
        if (law.by === g.party) t.stats.failed += 1;
        return;
      }
      law.log.push('Bundestag stimmt zu: ' + v.yes + ' Ja, ' + v.no + ' Nein, ' + v.abst + ' Enthaltungen.');
      if (v.afdDecisive) {
        news(g, 'Eklat im Bundestag: „' + lawName(law) + '“ kommt nur mit Stimmen der AfD durch. Proteste vor dem Reichstag.', 'bad');
        t.gov.forEach(p => addNat(g, p, -0.3));
        if (g.party === 'afd') addNat(g, 'afd', 0.2);
        if (t.gov.indexOf(g.party) !== -1) t.party.unity = clamp(t.party.unity - 5, 0, 100);
      }
      if (law.zust) { law.stage = 'bundesrat'; return; }
      enact(g, law);
      return;
    }
    if (law.stage === 'bundesrat') {
      const v = bundesratVote(g, law);
      law.br = { yes: v.yes };
      if (v.pass) { law.log.push('Bundesrat stimmt zu (' + v.yes + ' von 69 Stimmen).'); enact(g, law); return; }
      law.stage = 'vermittlung';
      law.log.push('Bundesrat verweigert die Zustimmung (' + v.yes + ' von 69). Der Vermittlungsausschuss wird angerufen.');
      news(g, 'Bundesrat stoppt „' + lawName(law) + '“ – Vermittlungsausschuss.', 'warn');
      return;
    }
    if (law.stage === 'vermittlung') {
      if (rand(g) < 0.6) {
        if (law.kind === 'topic' && D.PROGRAM[law.topic][law.opt].lean !== 0) {
          const mid = optIndex(law.topic, 0);
          if (mid !== t.policy[law.topic]) { law.opt = mid; law.log.push('Kompromiss im Vermittlungsausschuss: „' + lawName(law) + '“.'); }
          else { law.stage = 'gescheitert'; law.log.push('Der Vermittlungsausschuss findet keinen Kompromiss.'); return; }
        } else law.log.push('Einigung im Vermittlungsausschuss.');
        enact(g, law);
      } else {
        law.stage = 'gescheitert';
        law.log.push('Der Vermittlungsausschuss findet keinen Kompromiss.');
        news(g, '„' + lawName(law) + '“ ist endgültig gescheitert.', 'bad');
        if (law.by === g.party) t.stats.failed += 1;
      }
    }
  }

  function applyEcon(e, fx, sign) {
    if (!fx) return;
    ['growth', 'unemp', 'infl'].forEach(k => { if (fx[k]) e.pol[k] += sign * fx[k]; });
  }

  function enact(g, law) {
    const t = g.term;
    law.stage = 'inkraft';
    law.q1 = t.q;
    t.stats.lawsTotal += 1;
    const topic = lawTopic(law);
    const L = lawLean(law);
    const sal = g.salience[topic] / D.SALIENCE0[topic];
    let pop;
    if (law.kind === 'tax') {
      const x = taxById(law.tax);
      const prev = x.levels[t.taxes[law.tax]];
      const now = x.levels[law.level];
      t.taxes[law.tax] = law.level;
      applyEcon(t.econ, { growth: (now.growth || 0) - (prev.growth || 0) }, 1);
      t.econ.infl += (now.infl || 0) - (prev.infl || 0);
      const dRev = now.rev - prev.rev;
      pop = -dRev / 25 + (now.lean === -1 && dRev > 0 ? 0.35 : 0) + (now.climate ? -0.1 : 0);
    } else {
      const prevOpt = t.policy[law.topic];
      const prevLean = D.PROGRAM[law.topic][prevOpt].lean;
      const ec = TD.TOPIC_ECON[law.topic] || {};
      applyEcon(t.econ, ec[String(prevLean)], -1);
      applyEcon(t.econ, ec[String(L)], 1);
      t.budget.extra += (D.PROGRAM[law.topic][law.opt].cost - D.PROGRAM[law.topic][prevOpt].cost) * TD.LAW_COST;
      t.policy[law.topic] = law.opt;
      pop = D.PROGRAM[law.topic][law.opt].pop;
      A.changeSalience(g, law.topic, -0.01);
    }
    // Umfragen: Regierung bekommt Lob oder Kritik, Parteien mit passender Linie punkten bei Anhängern.
    t.gov.forEach(p => addNat(g, p, 0.35 * pop * sal * (p === t.chanc ? 1 : 0.7)));
    PIDS.forEach(p => {
      const d = Math.abs(leanOf(g, p, topic) - L);
      if (t.gov.indexOf(p) !== -1) addNat(g, p, d === 0 ? 0.12 : d === 2 ? -0.15 : 0);
      else if (d === 2) addNat(g, p, 0.08);
    });
    if (law.by === g.party) t.stats.lawsOwn += 1;
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
        cands.push({ topic, opt: target, w: g.salience[topic] * (t.contract[topic] === target ? 2 : 1) });
      });
      // Gelegentlich Steuerpolitik nach der Linie der Finanzpartei
      if (rand(g) < 0.15 && (p === budgetDrafter(t))) {
        const lf = leanOf(g, p, 'finanzen');
        const x = pick(g, TD.TAXES.filter(z => !inPipeline(t, 'tax:' + z.id)));
        if (x) {
          const lvl = x.levels.findIndex((l, i) => i !== t.taxes[x.id] && l.lean === lf && lf !== 0);
          if (lvl !== -1) cands.push({ tax: x.id, level: lvl, w: 0.2 });
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
            if (law.kind === 'topic') {
              const prev = optIndex(law.topic, 0);
              t.budget.extra -= (D.PROGRAM[law.topic][law.opt].cost - D.PROGRAM[law.topic][prev].cost) * TD.LAW_COST;
              t.policy[law.topic] = prev;
            } else t.taxes[law.tax] = taxById(law.tax).start;
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
  function landGovernment(g, seats, land, prevGov) {
    const coalitions = E.findCoalitions(seats, g).filter(c => c.viable);
    const order = CONTEST.filter(p => seats[p] > 0).sort((a, b) => seats[b] - seats[a]);
    for (const f of order) {
      const opts = coalitions.filter(c => c.members.indexOf(f) !== -1)
        .sort((a, b) => (a.tolerated ? 1 : 0) - (b.tolerated ? 1 : 0) || a.members.length - b.members.length ||
          b.members.filter(p => prevGov.indexOf(p) !== -1).length - a.members.filter(p => prevGov.indexOf(p) !== -1).length || a.seats - b.seats);
      if (opts.length) return [f].concat(opts[0].members.filter(p => p !== f));
    }
    const lead = order.find(p => p !== 'afd') || order[0];
    return [lead];
  }

  function landtagswahl(g, land) {
    const t = g.term;
    const sh = A.stateShares(g, land);
    const L = t.laender[land];
    const raw = {};
    CONTEST.concat([OTHER]).forEach(p => { raw[p] = Math.max(0.1, (sh[p] || 0) * (1 + between(g, -0.08, 0.08))); });
    if (L.gov[0] && raw[L.gov[0]] !== undefined) raw[L.gov[0]] += TD.LTW_BONUS.incumbent;
    if (TD.LTW_BONUS.fw[land]) raw.fw += TD.LTW_BONUS.fw[land];
    raw[g.party] += t.ltwBoost[land] || 0;
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
    const prev = t.landPrev[land] || 0;
    const diff = shares[g.party] - prev;
    t.landPrev[land] = shares[g.party];
    t.ltwBoost[land] = 0;
    addNat(g, g.party, clamp(diff * 0.05, -0.4, 0.4));
    t.party.unity = clamp(t.party.unity + clamp(diff, -6, 6), 0, 100);
    t.gov.forEach(p => { if (p !== g.party && (shares[p] || 0) < (sh[p] || 0) - 2) t.mood = clamp(t.mood - 2, 0, 100); });
    const entry = { q: t.q, land, shares, gov, diff: r1(diff), inGov: gov.indexOf(g.party) !== -1, inParl: shares[g.party] >= 5 };
    t.ltwLog.push(entry);
    t.stats.ltw.push(entry);
    const top = Object.keys(shares).filter(p => p !== OTHER).sort((a, b) => shares[b] - shares[a]).slice(0, 4);
    news(g, '🗳️ Landtagswahl ' + E.stateById(land).name + ': ' + top.map(p => sname(p) + ' ' + f1(shares[p]) + ' %').join(', ') +
      '. Neue Regierung: ' + gov.map(sname).join('-') + (gov.length === 1 && seats[gov[0]] < MAJ ? ' (Minderheit)' : '') + '.', 'big');
    t.pending.push({ type: 'info', kind: 'ltw', land, entry });
    return entry;
  }

  function europawahl(g) {
    const t = g.term;
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
  function eligible(g, ev) {
    const t = g.term;
    const role = t.role;
    const roles = ev.roles || [];
    const okRole = roles.indexOf(role) !== -1 || (roles.indexOf('gov') !== -1 && isGov(role)) || (roles.indexOf('opp') !== -1 && role === 'opposition');
    if (!okRole) return false;
    if (ev.parties && ev.parties.indexOf(g.party) === -1) return false;
    if (ev.notParty && ev.notParty.indexOf(g.party) !== -1) return false;
    if (ev.minQ && t.q < ev.minQ) return false;
    const last = t.usedEvents[ev.id];
    if (last !== undefined && (ev.once || t.q - last < 6)) return false;
    if (ev.id === 'coal_dispute' || ev.id === 'coal_leak') return t.gov.length > 1;
    if (ev.id === 'coal_poll') return t.gov.length > 1 && shareOf(g, g.party) < t.share0 - 1;
    return true;
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
  function queueEvent(g, ev) {
    const t = g.term;
    t.usedEvents[ev.id] = t.q;
    const item = { type: 'event', id: ev.id };
    if (/\{land/.test(ev.title + ev.text) || ev.cat === 'lv') item.land = eventLand(g, ev);
    const partners = t.gov.filter(p => p !== g.party);
    item.partner = partners.length ? pick(g, partners) : t.chanc;
    const tops = A.TOPIC_IDS.slice().sort((a, b) => g.salience[b] - g.salience[a]).slice(0, 5);
    item.topic = pick(g, tops);
    if (ev.cat === 'intl' || ev.cat === 'inland' || ev.cat === 'wirtschaft') t.crisisQ = t.q;
    t.pending.push(item);
  }
  function fillText(g, item, s) {
    return String(s || '')
      .replace(/\{landName\}/g, item.land ? E.stateById(item.land).name : '')
      .replace(/\{land\}/g, item.land ? E.stateById(item.land).name : '')
      .replace(/\{partner\}/g, item.partner ? sname(item.partner) : '')
      .replace(/\{topic\}/g, item.topic ? E.topicById(item.topic).name : '')
      .replace(/\{minister\}/g, item.minister || '')
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

  function resolvePending(g, choice, extra) {
    const t = g.term;
    const item = t.pending[0];
    if (!item) return { ok: false };
    let text = '';
    if (item.type === 'event') {
      const ev = eventById(item.id);
      const c = eventChoices(g, ev)[choice];
      if (!c) return { ok: false };
      let ok = true;
      if (c.chance !== undefined) ok = rand(g) < c.chance;
      applyFx(g, c.fx, item);
      if (ok && c.fx2) applyFx(g, c.fx2, item);
      if (!ok) applyFx(g, c.fail, item);
      text = c.chance !== undefined ? (ok ? c.okText : c.failText) || '' : '';
      if (c.mandate) {
        const v = mandateVote(g);
        if (v.pass) { text += ' Der Bundestag erteilt das Mandat (' + v.yes + ':' + v.no + ').'; }
        else { text += ' Der Bundestag verweigert das Mandat (' + v.yes + ':' + v.no + ') – eine Blamage.'; t.intl = clamp(t.intl - 8, 0, 100); t.gov.forEach(p => addNat(g, p, -0.25)); }
      }
      news(g, fillText(g, item, ev.title) + ': ' + c.label + '. ' + text, 'event');
    } else if (item.type === 'scandal') {
      const m = t.cabinet[item.ministry];
      if (choice === 0) { // festhalten
        const ok = rand(g) < 0.5;
        if (ok) { addNat(g, g.party, -0.15); text = m.name + ' übersteht die Affäre.'; }
        else { addNat(g, g.party, -0.5); t.party.leader.like = clamp(t.party.leader.like - 0.3, -5, 5); t.mood = clamp(t.mood - 5, 0, 100); text = 'Immer neue Details – der Druck wird unerträglich.'; }
      } else { // entlassen
        t.formerNames.push(m.name);
        t.cabinet[item.ministry] = { party: g.party, name: null, cands: candidatesFor(g, g.party) };
        t.party.unity = clamp(t.party.unity - 2, 0, 100);
        addNat(g, g.party, -0.05);
        text = m.name + ' tritt zurück. Ihr müsst die Nachfolge benennen.';
      }
      news(g, 'Affäre im ' + ministryById(item.ministry).short + '-Ministerium: ' + text, 'warn');
    } else if (item.type === 'veto') {
      const law = t.laws.find(l => l.id === item.law);
      if (choice === 0) { law.stage = 'zurueckgezogen'; law.log.push('Zurückgezogen.'); text = 'Der Entwurf wird zurückgezogen.'; }
      else if (choice === 1 && law.kind === 'topic' && optIndex(law.topic, 0) !== t.policy[law.topic]) {
        law.opt = optIndex(law.topic, 0); law.contract = t.contract[law.topic] === law.opt; law.stage = 'bundestag'; t.mood = clamp(t.mood - 1, 0, 100);
        law.log.push('Kompromiss im Kabinett: „' + lawName(law) + '“.'); text = 'Kompromiss gefunden.';
      } else if (choice === 2 && t.role === 'kanzler') {
        law.stage = 'bundestag'; t.mood = clamp(t.mood - 12, 0, 100); law.log.push('Per Richtlinienkompetenz durchgesetzt.'); text = 'Ihr setzt den Entwurf per Richtlinienkompetenz durch – der Partner ist empört.';
      } else { law.stage = 'zurueckgezogen'; law.log.push('Zurückgezogen.'); text = 'Der Entwurf wird zurückgezogen.'; }
      news(g, '„' + lawName(law) + '“: ' + text, 'info');
    } else if (item.type === 'cabinet') {
      const law = t.laws.find(l => l.id === item.law);
      const d = Math.abs(leanOf(g, g.party, lawTopic(law)) - lawLean(law));
      if (choice === 0) { law.stage = 'bundestag'; law.log.push('Kabinett beschließt den Entwurf.'); if (d === 2) t.party.unity = clamp(t.party.unity - 4, 0, 100); text = 'Ihr stimmt im Kabinett zu.'; }
      else if (choice === 1 && law.kind === 'topic' && optIndex(law.topic, 0) !== t.policy[law.topic] && law.opt !== optIndex(law.topic, 0)) {
        law.opt = optIndex(law.topic, 0); law.stage = 'bundestag'; t.mood = clamp(t.mood - 2, 0, 100); law.log.push('Nachverhandelt: „' + lawName(law) + '“.'); text = 'Ihr handelt einen Kompromiss heraus.';
      } else { law.stage = 'zurueckgezogen'; law.log.push('Im Kabinett gestoppt.'); t.mood = clamp(t.mood - 8, 0, 100); if (d >= 1) t.party.unity = clamp(t.party.unity + 2, 0, 100); text = 'Ihr stoppt den Entwurf im Kabinett.'; }
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
    } else if (item.type === 'vote') {
      const v = ['ja', 'nein', 'enthaltung'][choice] || 'nein';
      if (item.budget) t.voteChoice.budget = v; else t.voteChoice[item.law] = v;
      if (!item.budget) {
        const law = t.laws.find(l => l.id === item.law);
        const d = Math.abs(leanOf(g, g.party, lawTopic(law)) - lawLean(law));
        if (v === 'ja' && d === 2) t.party.unity = clamp(t.party.unity - 3, 0, 100);
        if (v === 'nein' && d === 0) addNat(g, g.party, -0.05);
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
    { id: 'buerger', roles: ['kanzler', 'junior', 'opposition'], icon: '🗣️', name: 'Bürgerdialog', desc: 'Zuhören, erklären, Vertrauen gewinnen.' },
    { id: 'disziplin', roles: ['kanzler', 'junior'], icon: '📣', name: 'Fraktion auf Linie bringen', target: 'law', stage: 'bundestag', desc: 'Weniger Abweichler bei der nächsten Abstimmung.' },
    { id: 'laender', roles: ['kanzler', 'junior'], icon: '🏛️', name: 'Länder überzeugen', target: 'law', stage: 'bundesrat', desc: 'Mit Bundesgeld zögernde Länder gewinnen (2 Mrd. € je Land).' },
    { id: 'umbildung', roles: ['kanzler', 'junior'], icon: '🔄', name: 'Kabinettsumbildung', target: 'ministry', desc: 'Ein eigenes Ressort neu besetzen.' },
    { id: 'krisenstab', roles: ['kanzler', 'junior'], icon: '🚨', name: 'Krisenstab', desc: 'Nach einer Krise Handlungsfähigkeit zeigen.', crisis: true },
    { id: 'profil', roles: ['junior'], icon: '📢', name: 'Profil schärfen', desc: 'Öffentlich eigene Akzente gegen den Partner setzen.' },
    { id: 'austritt', roles: ['junior'], icon: '🚪', name: 'Koalition verlassen', desc: 'Raus aus der Regierung – mit allen Folgen.', confirm: true, ap: 0 },
    { id: 'vertrauen', roles: ['kanzler'], icon: '🗳️', name: 'Vertrauensfrage', target: 'mode', desc: 'Art. 68 GG: Die Mehrheit hinter euch sammeln – oder Neuwahlen herbeiführen.', confirm: true },
    // Opposition
    { id: 'antrag', roles: ['opposition'], icon: '📄', name: 'Antrag einbringen', target: 'topic', desc: 'Eigene Alternative zur Abstimmung stellen.' },
    { id: 'anfrage', roles: ['opposition'], icon: '❓', name: 'Große Anfrage', desc: 'Die Regierung muss antworten – vielleicht kommt etwas ans Licht.' },
    { id: 'aktuelle', roles: ['opposition'], icon: '⏱️', name: 'Aktuelle Stunde', target: 'topic', desc: 'Ein Thema kurzfristig auf die Tagesordnung setzen.' },
    { id: 'ua', roles: ['opposition'], icon: '🔎', name: 'Untersuchungsausschuss', target: 'topic', desc: 'Braucht ein Viertel der Abgeordneten (Art. 44 GG). Setzt die Regierung ein Jahr unter Druck.', quorum: true },
    { id: 'klage', roles: ['opposition'], icon: '⚖️', name: 'Normenkontrollklage', target: 'klage', desc: 'Ein Gesetz oder den Haushalt in Karlsruhe prüfen lassen (Viertel der Abgeordneten).', quorum: true },
    { id: 'misstrauen', roles: ['opposition'], icon: '🗡️', name: 'Konstruktives Misstrauensvotum', desc: 'Art. 67 GG: Mit einer neuen Mehrheit die Kanzlerin/den Kanzler stürzen.', confirm: true },
    { id: 'talkshow', roles: ['opposition', 'junior', 'kanzler'], icon: '📺', name: 'Talkshow und Interviews', desc: 'Bekanntheit und Beliebtheit der Spitze.' },
    { id: 'schatten', roles: ['opposition', 'apo'], icon: '🧭', name: 'Alternativkonzept vorlegen', target: 'topic', desc: 'Eigene Kompetenz in einem Thema aufbauen.' },
    // Außerparlamentarisch
    { id: 'protest', roles: ['apo'], icon: '✊', name: 'Demonstration organisieren', target: 'topic', desc: 'Auf der Straße sichtbar werden.' },
    { id: 'social', roles: ['apo'], icon: '📱', name: 'Social-Media-Kampagne', desc: 'Ohne Talkshow-Einladungen: direkt zu den Wählern.' },
    { id: 'mitglieder', roles: ['apo', 'opposition'], icon: '🙋', name: 'Mitgliederkampagne', desc: 'Neue Mitglieder bringen Beiträge und Aktive.' },
    { id: 'spenden', roles: ['apo', 'opposition'], icon: '💶', name: 'Spenden sammeln', desc: 'Die Parteikasse für den nächsten Wahlkampf füllen.' },
    { id: 'parteitag', roles: ['apo', 'opposition'], icon: '🎪', name: 'Sonderparteitag mit Neuanfang', desc: 'Neue Parteispitze wählen – frischer Wind, aber auch Risiko.' },
    { id: 'buendnis', roles: ['apo'], icon: '🤲', name: 'Bündnisse mit Verbänden', target: 'topic', desc: 'Gewerkschaften, Umweltverbände, Mittelstand – je nach Thema.' },
    // Alle
    { id: 'ltwk', roles: ['kanzler', 'junior', 'opposition', 'apo'], icon: '🗺️', name: 'Landtagswahlkampf unterstützen', target: 'land', desc: 'Bundesprominenz und Geld für die nächste Landtagswahl.' },
    { id: 'lvpflege', roles: ['kanzler', 'junior', 'opposition', 'apo'], icon: '🧩', name: 'Landesverband befrieden', target: 'land', desc: 'Besuch, Gespräche, Posten: Ärger in einem Landesverband dämpfen.' },
    { id: 'basis', roles: ['kanzler', 'junior', 'opposition', 'apo'], icon: '🏠', name: 'Basisarbeit', desc: 'Regionalkonferenzen und Mitgliederabende: mehr Geschlossenheit.' }
  ];
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
    if (id === 'gesetz') { const o = lawOptions(g); if (!o.topics.length && !o.taxes.length) return { ok: false, text: 'Für eure Ressorts liegen gerade keine Vorhaben an.' }; }
    return { ok: true };
  }

  function performAction(g, id, target) {
    const t = g.term;
    const chk = canAct(g, id);
    if (!chk.ok) return chk;
    const a = ACTIONS.find(x => x.id === id);
    const f = useFactor(t, id);
    let text = '';
    const P = t.party;
    // Aktionen wirken über vier Jahre gedämpft – sonst summiert sich jede Kleinigkeit zu Prozentpunkten.
    const actNat = (p, v) => addNat(g, p, v * ACT_K);
    const comp = topic => (g.competence ? g.competence[topic] : 40) || 40;
    const salF = topic => clamp(g.salience[topic] / D.SALIENCE0[topic], 0.5, 2);
    switch (id) {
      case 'gesetz': {
        const o = lawOptions(g);
        if (!target) return { ok: false, text: 'Bitte ein Vorhaben wählen.' };
        if (target.tax) {
          if (!o.taxes.some(x => x.tax === target.tax) || !taxById(target.tax).levels[target.level] || target.level === t.taxes[target.tax]) return { ok: false, text: 'Diese Steueränderung ist nicht möglich.' };
          const law = makeLaw(g, { kind: 'tax', tax: target.tax, level: target.level }, g.party);
          text = 'Entwurf „' + lawName(law) + '“ geht ins Kabinett.';
        } else {
          const tp = o.topics.find(x => x.topic === target.topic);
          if (!tp || tp.opts.indexOf(target.opt) === -1) return { ok: false, text: 'Dieses Vorhaben ist nicht möglich.' };
          const law = makeLaw(g, { kind: 'topic', topic: target.topic, opt: target.opt }, g.party);
          text = 'Entwurf „' + lawName(law) + '“ geht ins Kabinett' + (law.contract ? ' (steht im Koalitionsvertrag).' : '.');
        }
        break;
      }
      case 'regerkl': case 'presse': {
        if (!target || !E.topicById(target)) return { ok: false, text: 'Bitte ein Thema wählen.' };
        A.changeSalience(g, target, 0.02 * f);
        actNat(g.party, (id === 'regerkl' ? 0.18 : 0.14) * f * salF(target) * (comp(target) / 50));
        P.leader.like = clamp(P.leader.like + 0.08 * f, -5, 5);
        text = (id === 'regerkl' ? 'Regierungserklärung' : 'Pressekonferenz') + ' zum Thema ' + E.topicById(target).name + '.';
        break;
      }
      case 'koaausschuss': t.mood = clamp(t.mood + 8 * f, 0, 100); text = 'Der Koalitionsausschuss tagt bis in die Nacht – das Klima bessert sich.'; break;
      case 'reise': t.intl = clamp(t.intl + 5 * f, 0, 100); P.leader.like = clamp(P.leader.like + 0.06 * f, -5, 5); text = 'Starke Bilder auf internationalem Parkett.'; break;
      case 'buerger': P.leader.like = clamp(P.leader.like + 0.15 * f, -5, 5); actNat(g.party, 0.08 * f); text = 'Der Bürgerdialog kommt gut an.'; break;
      case 'talkshow': P.leader.like = clamp(P.leader.like + 0.12 * f, -5, 5); actNat(g.party, 0.06 * f); text = 'Auftritt bei Lanz und Illner.'; break;
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
        const cand = Object.keys(t.laender).filter(l => !v.lands[l] && t.laender[l].gov.filter(p => !partyBackslaw(g, p, law)).every(p => Math.abs(leanOf(g, p, lawTopic(law)) - lawLean(law)) <= 1))
          .sort((x, y) => t.laender[y].votes - t.laender[x].votes).slice(0, 2);
        if (!cand.length) return { ok: false, text: 'Kein Land lässt sich umstimmen.' };
        law.bought = (law.bought || []).concat(cand);
        t.budget.oneoff += 2 * cand.length;
        text = 'Zusagen an ' + cand.map(l => E.stateById(l).name).join(' und ') + ' (' + 2 * cand.length + ' Mrd. €).';
        break;
      }
      case 'umbildung': {
        const slot = t.cabinet[target];
        if (!slot || slot.party !== g.party) return { ok: false, text: 'Bitte ein eigenes Ressort wählen.' };
        if (slot.lead) return { ok: false, text: 'Die eigene Spitze bleibt im Amt.' };
        if (slot.name) t.formerNames.push(slot.name);
        t.cabinet[target] = { party: g.party, name: null, cands: candidatesFor(g, g.party) };
        P.unity = clamp(P.unity - 1, 0, 100);
        text = 'Das ' + ministryById(target).short + '-Ressort wird neu besetzt – wählt die Nachfolge im Kabinett.';
        break;
      }
      case 'krisenstab': t.intl = clamp(t.intl + 3, 0, 100); P.leader.like = clamp(P.leader.like + 0.2, -5, 5); t.gov.forEach(p => actNat(p, 0.1)); text = 'Der Krisenstab zeigt Handlungsfähigkeit.'; break;
      case 'profil': actNat(g.party, 0.3 * f); t.mood = clamp(t.mood - 6, 0, 100); text = 'Ihr setzt euch öffentlich vom Partner ab.'; break;
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
        A.changeSalience(g, target, 0.01);
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
      case 'ua': t.ua = { topic: target || 'demokratie', left: 4, q0: t.q }; text = 'Der Untersuchungsausschuss nimmt seine Arbeit auf.'; news(g, '🔎 Untersuchungsausschuss eingesetzt (' + E.topicById(t.ua.topic).name + ').', 'big'); break;
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
          const d = Math.abs(leanOf(g, g.party, lawTopic(law)) - lawLean(law));
          t.klagen.push({ kind: 'law', law: law.id, due: t.q + 2, chance: d === 2 ? 0.3 : 0.12, text: '„' + lawName(law) + '“', by: 'player' });
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
          P.leader = { name: newPerson(g, g.party, weightedLand(g)).full, like: 0.8 };
          P.unity = clamp(P.unity + 12, 0, 100);
          actNat(g.party, 0.25);
          text = 'Neue Parteispitze: ' + P.leader.name + '. Aufbruchstimmung!';
        } else { P.unity = clamp(P.unity - 10, 0, 100); text = 'Kampfkandidatur und Streit auf offener Bühne – der Parteitag geht schief.'; }
        news(g, '🎪 Parteitag: ' + text, 'big');
        break;
      }
      case 'buendnis': {
        if (!target || !E.topicById(target)) return { ok: false, text: 'Bitte ein Thema wählen.' };
        if (g.competence) g.competence[target] = clamp(g.competence[target] + 2, 5, 95);
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
    // Haushaltssaison: Entwurf für das nächste Jahr (nicht im letzten Jahr vor der Wahl nötig, aber üblich)
    if (c.qn === 3) {
      t.budget.draft = { year: c.year + 1, plan: Object.assign({}, t.budget.plan), notlage: false, done: false };
      if (!playerDraftsBudget(g)) {
        t.budget.draft.plan = aiBudgetPlan(g);
        t.budget.draft.done = true;
        if (isGov(t.role)) t.pending.push({ type: 'budgetcab' });
      }
    }
    if (dueIn(TD.BUNDESVERSAMMLUNG, c)) { const ev = eventById('bundesversammlung'); t.usedEvents[ev.id] = t.q; t.pending.push({ type: 'event', id: ev.id }); }
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
    // Abstimmungen, bei denen ihr als Opposition entscheidet
    if (t.role === 'opposition') {
      t.laws.filter(l => l.stage === 'bundestag' && l.by !== g.party).forEach(l => t.pending.push({ type: 'vote', law: l.id }));
      if (t.budget.draft && t.budget.draft.done && c.qn === 4) t.pending.push({ type: 'vote', budget: true });
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
    if (t.gov.length < 2) { t.mood = 60; return; }
    t.mood = clamp(t.mood + (50 - t.mood) * 0.04 - 0.5 + between(g, -1.5, 1.5), 0, 100);
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

  function updatePolls(g) {
    const t = g.term;
    const e = t.econ;
    PIDS.forEach(p => { g.nat[p] *= NAT_DECAY; });
    D.STATES.forEach(st => { PIDS.forEach(p => { g.reg[st.id][p] *= 0.8; }); });
    MINOR.forEach(m => { g.minor[m].nat *= NAT_DECAY; g.minor[m].trend = clamp(g.minor[m].trend + between(g, -0.12, 0.14), -1, 2.5); });
    // Regierungsverschleiß und Wirtschaftslage (geschätzt)
    const econ = 0.25 * (e.growth - 1) - 0.6 * (e.unemp - t.econPrev.unemp) - 0.08 * Math.max(0, e.infl - 2.5);
    t.gov.forEach(p => { addNat(g, p, (p === t.chanc ? -0.16 : -0.09) + econ * (p === t.chanc ? 1 : 0.5)); });
    if (t.gov.length > 1 && t.mood < 35) t.gov.forEach(p => addNat(g, p, -0.1));
    if (t.budget.status === 'vorlaeufig') t.gov.forEach(p => addNat(g, p, -0.12));
    if (t.ua) { t.gov.forEach(p => addNat(g, p, -0.1)); addNat(g, g.party, 0.04); }
    // Eigene Spitze und Geschlossenheit
    addNat(g, g.party, 0.04 * t.party.leader.like + (t.party.unity - 55) / 400);
    if (t.chanc !== g.party && t.chancellor) addNat(g, t.chanc, 0.03 * (t.chancellor.like || 0));
    PIDS.forEach(p => { if (p !== g.party) addNat(g, p, between(g, -0.15, 0.15)); });
    addNat(g, g.party, between(g, -0.08, 0.08));
    // Unruhige Landesverbände kosten im Land
    Object.keys(t.party.lv).forEach(l => { const u = t.party.lv[l]; if (u > 50 && g.reg[l]) g.reg[l][g.party] -= (u - 50) / 80; });
    t.intl += (50 - t.intl) * 0.05;
    // Themen kehren langsam zur Normalität zurück
    A.TOPIC_IDS.forEach(tp => { g.salience[tp] += (D.SALIENCE0[tp] - g.salience[tp]) * 0.1; });
    A.rollPollErr(g);
    A.takePoll(g);
    A.updateMinorVisibility(g, true);
    t.lastNat = A.nationalShares(g);
    t.history.push({ q: t.q, nat: roundShares(g.poll.nat) });
  }

  function endQuarter(g) {
    const t = g.term;
    if (!t || t.over) return { ok: false, text: 'Die Legislaturperiode ist vorbei.' };
    if (t.pending.length) return { ok: false, text: 'Erst die offenen Entscheidungen treffen.' };
    if (needsNames(g)) autoNames(g);
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
    updatePolls(g);
    updateParty(g);
    updateMood(g);
    if (t.over) return { ok: true, over: true };
    ltwDue(t).forEach(l => landtagswahl(g, l));
    if (dueIn(TD.EUROPAWAHL, c)) europawahl(g);
    t.q += 1;
    if (t.q >= QUARTERS) { endTerm(g, null); return { ok: true, over: true }; }
    beginQuarter(g, false);
    return { ok: true };
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
    news(g, early ? '🗳️ ' + early + '. Der nächste Wahlkampf beginnt!' : '🗳️ Die Legislaturperiode endet. Der Wahlkampf für die Bundestagswahl ' + (t.year0 + 4) + ' beginnt!', 'big');
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

  // Übergabe an den nächsten Wahlkampf.
  function nextCampaign(g) {
    const t = g.term;
    if (!t || !t.over) return null;
    const base = {};
    D.STATES.forEach(st => { base[st.id] = A.stateShares(g, st.id); });
    const career = g.career ? copy(g.career) : { terms: [] };
    const c = cal(t, t.endQ === undefined ? t.q : t.endQ);
    career.terms.push(Object.assign({ n: t.n, from: t.year0, to: c.year, role: t.role, roles: Object.assign({}, t.stats.qRole), early: t.early, gov: t.gov.slice() }, t.summary));
    const P0 = party(g.party);
    const money = Math.round(P0.budget * clamp(0.6 + 0.4 * t.party.cash / P0.budget, 0.6, 1.5) * 10) / 10;
    const world = { econ: copy(t.econ), policy: copy(t.policy), taxes: copy(t.taxes), intl: t.intl, laender: copy(t.laender),
      budget: { plan: copy(t.budget.plan), extra: t.budget.extra, def: t.budget.def, reform: t.budget.reform || 0, notlage: false } };
    return {
      party: g.party,
      candidate: t.party.leader.name,
      program: g.program ? copy(g.program) : null,
      carry: { base, nameSeed: ((g.nameSeed || 1) * 31 + 7919) % 2147483647 || 1, career, firewall: Object.assign({}, g.firewall || {}),
        year: t.early ? c.year + (c.qn >= 3 ? 1 : 0) : t.year0 + 4, shown: Object.assign({}, g.shown || {}), money, world,
        prevSeats: Object.assign({}, t.seats), prevShares: Object.assign({}, t.start) }
    };
  }

  const TERM = {
    QUARTERS, ACTIONS, startTerm, endQuarter, performAction, canAct, resolvePending, nameMinister, autoNames, needsNames,
    lawOptions, predict, bundestagVote, bundesratVote, budgetCalc, setBudgetDraft, playerDraftsBudget, calendar, quarterLabel, cal,
    lawName, lawTitle, leanOf, quorum, eventChoices, fillText, eventById, ministryById, taxById, areaById, nextCampaign, summary,
    actionCash, govSeats, isGov, ownMinistries, endTerm, defaultVote, partyVote, mandateVote
  };
  if (node) module.exports = TERM; else root.BTW_TERM = TERM;
})(this);
