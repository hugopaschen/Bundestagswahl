/*
 * Spiel-Engine: reine Spiellogik ohne DOM, damit sie auch in Node getestet werden kann.
 *
 * Modell in Kürze:
 *  - Jede Partei hat pro Bundesland einen Startwert (aktuelle Sonntagsfrage, regional verteilt).
 *  - Dazu kommen bundesweite Boni (nat), regionale Boni (reg) und ein Themen-Effekt:
 *    Je wichtiger ein Thema wird, desto mehr profitieren Parteien, denen dort
 *    überdurchschnittlich viel Kompetenz zugeschrieben wird.
 *  - Boni verblassen jede Woche ein wenig, die Konkurrenz macht ebenfalls Wahlkampf.
 *  - Am Wahlabend werden die Sitze (630) per Sainte-Laguë verteilt, 5-%-Hürde inklusive.
 */
(function (root) {
  const D = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root.BTW_DATA;
  // Szenarien zur Vorbereitung der Aktionen (Texte in js/scenarios.js)
  const SC = (typeof module !== 'undefined' && module.exports) ? require('./scenarios.js') : (root.BTW_SCENARIOS || {});
  // Fragen von Bürgerinnen und Bürgern zum Thema einer Vor-Ort-Aktion (js/citizenq.js)
  const CQ = (typeof module !== 'undefined' && module.exports) ? require('./citizenq.js') : (root.BTW_CITIZENQ || {});
  // Wahlkreise 2025: Grenzen und Erststimmen (js/wahlkreise.js, aus Daten der Bundeswahlleiterin)
  const WKD = (typeof module !== 'undefined' && module.exports) ? require('./wahlkreise.js') : (root.BTW_WK || null);
  // Erfundene Namen für Kandidaturen und Kabinett (js/names.js)
  const NAMES = (typeof module !== 'undefined' && module.exports) ? require('./names.js') : (root.BTW_NAMES || null);
  // Inhalte der Legislaturperiode (Ministerien u. a.) – auch für die Ressortverteilung in den Koalitionsverhandlungen.
  const TD = (typeof module !== 'undefined' && module.exports) ? require('./termdata.js') : (root.BTW_TERMDATA || { MINISTRIES: [], WISH: {} });
  // Interessenverbände (Lobbyismus) – im Wahlkampf und in der Legislatur.
  const LB = (typeof module !== 'undefined' && module.exports) ? require('./lobby.js') : (root.BTW_LOBBY || null);
  const CQ_ACTIONS = ['buerger', 'infostand', 'betrieb', 'haustuer', 'regional'];
  const SC_ALIAS = {}; // Aktionen ohne eigene Szenarien könnten hier verwandte nutzen
  const CQ_COMP = 2;      // Kompetenzpunkte je richtiger/falscher Antwort
  const CQ_COMP_MAX = 12; // höchstens so viel Veränderung je Thema über den ganzen Wahlkampf

  const MAX_WEEKS = 8;
  const AP_PER_WEEK = 3;       // Termine der Spitzenkandidatur pro Woche
  const TEAM_PER_WEEK = 4;     // Einsätze des Wahlkampfteams pro Woche …
  const TEAM_LATE = 5;         // … ab Woche 5 (mehr Ehrenamtliche in der Schlussphase)
  const TEAM_LATE_WEEK = 5;
  const TEAM_EFFECT = 0.4;    // Team-Einsätze wirken schwächer als Auftritte der Kandidatur
  // Auftritte der Spitzenkandidatur – alles andere erledigt das Team.
  const CANDIDATE_ACTIONS = ['kundgebung', 'buerger', 'betrieb', 'talkshow', 'presse', 'regional'];
  const isTeamAction = id => CANDIDATE_ACTIONS.indexOf(id) === -1;
  // Teamgröße je Partei nach Mitgliederzahl (data.js: team), ab Woche 5 ein Einsatz mehr.
  const teamBase = partyId => { const pp = D.PARTIES.find(x => x.id === partyId); return (pp && pp.team) || TEAM_PER_WEEK; };
  const teamMaxFor = (week, partyId) => teamBase(partyId) + (week >= TEAM_LATE_WEEK ? TEAM_LATE - TEAM_PER_WEEK : 0);
  const DUEL_WEEK = 7;
  const ISSUE_K = 40;          // Stärke des Themen-Effekts
  const BONUS_DECAY = 0.88;    // Wahlkampf-Effekte verblassen pro Woche
  const SALIENCE_DRIFT = 0.1;  // Themen kehren langsam zur Normalität zurück
  const THRESHOLD = 5;
  const MAJORITY = Math.floor(D.SEATS / 2) + 1;

  const PARTY_IDS = D.PARTIES.map(p => p.id);
  // Kleinparteien laufen in den Umfragen unter „Sonstige“, bis sie 3,5 % erreichen.
  const MINORS = D.MINORS || [];
  const MINOR_IDS = MINORS.map(m => m.id);
  const CONTEST_IDS = PARTY_IDS.concat(MINOR_IDS); // alle, die Wahlkreise und Sitze gewinnen können
  const ALL_IDS = CONTEST_IDS.concat([D.OTHER.id]);
  const TOPIC_IDS = D.TOPICS.map(t => t.id);
  const TOTAL_VOTERS = D.STATES.reduce((s, st) => s + st.voters, 0);
  // Startwert jeder Kleinpartei im Land: ihr Anteil an den Sonstigen 2025, übertragen auf die heutigen Sonstigen.
  const MINOR_BASE = {};
  D.STATES.forEach(st => {
    const L = (WKD && WKD.land2025 && WKD.land2025[st.id]) || {};
    const nowOther = 100 - PARTY_IDS.reduce((s, p) => s + st.result[p], 0);
    const then = Math.max(1, 100 - PARTY_IDS.reduce((s, p) => s + (L[p] || 0), 0));
    const b = {};
    let sum = 0;
    MINOR_IDS.forEach(m => { b[m] = Math.max(0.05, nowOther * (L[m] || 0) / then); sum += b[m]; });
    const cap = 0.85 * Math.max(0, nowOther);
    if (sum > cap) MINOR_IDS.forEach(m => { b[m] *= cap / sum; });
    MINOR_BASE[st.id] = b;
  });
  const MINOR_NAT = {};
  MINOR_IDS.forEach(m => { MINOR_NAT[m] = D.STATES.reduce((s, st) => s + MINOR_BASE[st.id][m] * st.voters, 0) / TOTAL_VOTERS; });

  const POLL_RANGE = 3;        // Fehlerspanne der veröffentlichten Umfragen (± Prozentpunkte)
  const MOB_DECAY = 0.8;       // Mobilisierung lässt pro Woche nach – späte Mobilisierung zählt am meisten
  const GROUP_SAT = 3;         // Sättigung: je mehr Bonus eine Gruppe schon hat, desto weniger wirkt mehr
  const GROUP_IDS = D.GROUPS.map(k => k.id);
  // Jede Dimension (Alter, Bildung, Wohnort) zählt gleich; innerhalb einer Dimension ergeben
  // die Anteile 100 %. W = Gewicht einer Gruppe an der gesamten Wirkung (Summe 1).
  const DIM_COUNT = new Set(D.GROUPS.map(k => k.dim)).size;
  const W = {};
  D.GROUPS.forEach(k => { W[k.id] = k.weight / DIM_COUNT; });
  // Faktor je Partei und Gruppe, je Dimension so ausgeglichen, dass der gewichtete Schnitt 1 ergibt.
  const FACTOR = {};
  D.GROUPS.forEach(k => { FACTOR[k.id] = {}; });
  CONTEST_IDS.forEach(p => {
    new Set(D.GROUPS.map(k => k.dim)).forEach(dim => {
      const ks = D.GROUPS.filter(k => k.dim === dim);
      const mean = ks.reduce((s, k) => s + k.weight * (k.factor[p] || 1), 0) / ks.reduce((s, k) => s + k.weight, 0);
      ks.forEach(k => { FACTOR[k.id][p] = (k.factor[p] || 1) / mean; });
    });
  });

  // Zusammensetzung der Wählerschaft je Bundesland (Anteile je Dimension, Summe 1).
  function stateWeights(stateId) {
    const sg = D.STATE_GROUPS && D.STATE_GROUPS[stateId];
    const out = {};
    D.GROUPS.forEach(k => { out[k.id] = sg && sg[k.id] !== undefined ? sg[k.id] : k.weight; });
    return out;
  }
  const W_STATE = {};
  const FACTOR_STATE = {};
  D.STATES.forEach(st => {
    const w = stateWeights(st.id);
    W_STATE[st.id] = {};
    D.GROUPS.forEach(k => { W_STATE[st.id][k.id] = w[k.id] / DIM_COUNT; });
    // Faktoren so ausgleichen, dass der Schnitt im Land wieder das Landesergebnis ergibt.
    FACTOR_STATE[st.id] = {};
    D.GROUPS.forEach(k => { FACTOR_STATE[st.id][k.id] = {}; });
    CONTEST_IDS.forEach(p => {
      new Set(D.GROUPS.map(k => k.dim)).forEach(dim => {
        const ks = D.GROUPS.filter(k => k.dim === dim && w[k.id] > 0);
        const mean = ks.reduce((s, k) => s + w[k.id] * (k.factor[p] || 1), 0) / ks.reduce((s, k) => s + w[k.id], 0);
        ks.forEach(k => { FACTOR_STATE[st.id][k.id][p] = (k.factor[p] || 1) / mean; });
      });
    });
  });
  const weightsFor = stateId => (stateId && W_STATE[stateId]) || W;

  // Landesthemen: Wie wichtig ein Thema in einem Land im Vergleich zum Bundesschnitt ist
  // (1 = wie im Bund). Grundlage: Umfragen zu den wichtigsten Problemen je Land (STATE_TOPICS).
  // Die Landesumfragen nennen unterschiedlich viele Themen und erlauben teils Mehrfachnennungen.
  // Darum: Jeder genannte Wert wird mit dem Schnitt der Länder verglichen, die das Thema auch nennen,
  // und durch das allgemeine Antwortniveau des Landes geteilt. Nicht genannte Themen zählen wie im
  // Bund – oder etwas weniger, wenn die Umfrage vollständig ist und das Thema anderswo oft vorkommt.
  const STF = {};
  (function () {
    const ST = D.STATE_TOPICS || {};
    const mean = {};
    const count = {};
    TOPIC_IDS.forEach(t => {
      const vals = D.STATES.map(st => ST[st.id] && ST[st.id].werte[t]).filter(v => v > 0);
      count[t] = vals.length;
      mean[t] = vals.length ? vals.reduce((x, y) => x + y, 0) / vals.length : 0;
    });
    const nStates = D.STATES.filter(st => ST[st.id]).length;
    D.STATES.forEach(st => {
      STF[st.id] = {};
      const v = ST[st.id];
      TOPIC_IDS.forEach(t => { STF[st.id][t] = 1; });
      if (!v) return;
      const ratios = TOPIC_IDS.filter(t => v.werte[t] > 0 && count[t] >= 3).map(t => v.werte[t] / mean[t]).sort((x, y) => x - y);
      const level = ratios.length ? ratios[Math.floor(ratios.length / 2)] : 1;
      TOPIC_IDS.forEach(t => {
        if (v.werte[t] > 0 && count[t] >= 3) STF[st.id][t] = Math.max(0.6, Math.min(1.8, v.werte[t] / mean[t] / level));
        else if (!(v.werte[t] > 0) && v.vollstaendig && count[t] >= nStates / 2) STF[st.id][t] = 0.85;
      });
    });
  })();
  const stateTopicFactor = (stateId, topic) => (STF[stateId] && STF[stateId][topic]) || 1;

  // Bevorzugte Position jeder Wählergruppe je Thema (−1 links … +1 rechts): Parteilinien,
  // gewichtet mit dem Rückhalt der Parteien in der Gruppe (Bundesergebnis × Gruppenfaktor).
  const BASE_SHARE = {};
  PARTY_IDS.forEach(p => {
    BASE_SHARE[p] = D.STATES.reduce((s, st) => s + st.result[p] * st.voters, 0) / TOTAL_VOTERS;
  });
  MINOR_IDS.forEach(m => { BASE_SHARE[m] = MINOR_NAT[m]; });
  const POS_PREF = {};
  const POS_PREF_NAT = {};
  function prefOf(weightOf) {
    const out = {};
    TOPIC_IDS.forEach(t => {
      let num = 0;
      let den = 0;
      PARTY_IDS.forEach(p => { const w = BASE_SHARE[p] * weightOf(p); num += w * D.PARTIES.find(x => x.id === p).lean[t]; den += w; });
      out[t] = num / den;
    });
    return out;
  }
  Object.assign(POS_PREF_NAT, prefOf(() => 1));
  D.GROUPS.forEach(k => { POS_PREF[k.id] = prefOf(p => FACTOR[k.id][p]); });

  const party = id => D.PARTIES.find(p => p.id === id) || MINORS.find(m => m.id === id);
  // Genitiv für Texte: „Wähler der Grünen“, „Wähler des BSW“.
  const GEN = { union: 'der Union', afd: 'der AfD', spd: 'der SPD', gruene: 'der Grünen', linke: 'der Linken', bsw: 'des BSW', fdp: 'der FDP', fw: 'der Freien Wähler', volt: 'von Volt', tierschutz: 'der Tierschutzpartei', sonstige: 'der Kleinparteien', nw: 'aus dem Nichtwählerlager' };
  const partyGen = id => GEN[id] || ('von ' + ((party(id) && party(id).short) || id));
  const stateById = id => D.STATES.find(s => s.id === id);
  const topicById = id => D.TOPICS.find(t => t.id === id);

  const PROGRAM_WEIGHT = {};
  TOPIC_IDS.forEach(t => { PROGRAM_WEIGHT[t] = D.SALIENCE0[t] * 8; });

  const MEAN_COMPETENCE = {};
  TOPIC_IDS.forEach(t => {
    MEAN_COMPETENCE[t] = D.PARTIES.reduce((s, p) => s + p.competence[t], 0) / D.PARTIES.length;
  });

  // ---------- Zufall (seedbar, damit Spielstände reproduzierbar sind) ----------

  function rand(g) {
    let t = g.rng = (g.rng + 0x6D2B79F5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const between = (g, a, b) => a + rand(g) * (b - a);
  const pick = (g, arr) => arr[Math.floor(rand(g) * arr.length)];

  // ---------- Spielzustand ----------

  // ---------- Wahlprogramm ----------

  function defaultProgram(partyId) {
    const p = party(partyId);
    const positions = {};
    TOPIC_IDS.forEach(t => { positions[t] = D.PROGRAM[t].findIndex(o => o.lean === p.lean[t]); });
    const core = TOPIC_IDS.slice().sort((a, b) => p.competence[b] - p.competence[a]).slice(0, D.PROGRAM_RULES.coreCount);
    return { slogan: D.PROGRAM_RULES.slogans[0], core, positions };
  }

  function validateProgram(prog) {
    const errors = [];
    if (!prog || typeof prog !== 'object') return ['Kein Wahlprogramm.'];
    TOPIC_IDS.forEach(t => {
      const i = prog.positions && prog.positions[t];
      if (!Number.isInteger(i) || !D.PROGRAM[t][i]) errors.push('Position zum Thema ' + topicById(t).name + ' fehlt.');
    });
    const core = Array.isArray(prog.core) ? prog.core : [];
    if (core.length !== D.PROGRAM_RULES.coreCount || new Set(core).size !== core.length || !core.every(t => topicById(t))) {
      errors.push('Bitte genau ' + D.PROGRAM_RULES.coreCount + ' Kernthemen wählen.');
    }
    if (!String(prog.slogan || '').trim()) errors.push('Bitte einen Wahlslogan festlegen.');
    return errors;
  }

  // Wirkung einer einzelnen Position (Bundes- und Ost-Effekt in Punkten):
  //  - Parteilinie: neutral.
  //  - Leichte Abweichung: Die Popularität zählt voll, abzüglich eines kleinen Abschlags
  //    für verärgerte Stammwähler. Populäre Positionen (pop ≥ 0,3) bringen also Stimmen.
  //  - Starke Abweichung: immer negativ, egal wie populär – Glaubwürdigkeit verspielt.
  function positionEffect(opt, line, deviation) {
    if (deviation === 0) return { nat: 0, east: 0 };
    if (deviation === 1) return { nat: 1.5 * opt.pop - 0.25, east: opt.east - line.east };
    return { nat: Math.min(-0.5, 0.5 * opt.pop - 1.1), east: Math.min(0, opt.east - line.east) };
  }

  function quizEffect(prog, t) {
    const n = prog.quiz && prog.quiz[t];
    return Number.isInteger(n) && D.PROGRAM_RULES.quizEffect[n] !== undefined ? D.PROGRAM_RULES.quizEffect[n] : 0;
  }

  // Kernthema mit Patzer-Gefahr: höchstens eine richtige Antwort in der Fachkonferenz (schwächstes zuerst).
  function gaffeTopic(prog) {
    if (!prog || !prog.quiz) return null;
    const weak = (prog.core || []).filter(t => Number.isInteger(prog.quiz[t]) && prog.quiz[t] <= 1);
    weak.sort((a, b) => prog.quiz[a] - prog.quiz[b]);
    return weak[0] || null;
  }

  // Wirkung eines Programms im Vergleich zur traditionellen Parteilinie:
  // Populäre Positionen bringen Stimmen, Abweichungen von der Linie kosten Stammwähler und Glaubwürdigkeit.
  function programEffects(partyId, prog) {
    const p = party(partyId);
    const competence = Object.assign({}, p.competence);
    const details = {};
    let nat = 0;
    let east = 0;
    let cost = 0;
    TOPIC_IDS.forEach(t => {
      const opt = D.PROGRAM[t][prog.positions[t]];
      const line = D.PROGRAM[t].find(o => o.lean === p.lean[t]);
      const deviation = Math.abs(opt.lean - p.lean[t]);
      const core = prog.core.indexOf(t) !== -1;
      // Wichtige Themen bewegen mehr Wähler: Gewicht nach Wählerinteresse (im Mittel 1).
      const w = PROGRAM_WEIGHT[t];
      const pe = positionEffect(opt, line, deviation);
      const dNat = pe.nat * w;
      const dEast = pe.east * w;
      // Fachkonferenz: richtige Antworten zu einem Kernthema stärken die Kompetenz, Wissenslücken schwächen sie.
      const quiz = core ? quizEffect(prog, t) : 0;
      const dComp = -10 * deviation + (core ? 12 : 0) + quiz;
      competence[t] += dComp;
      nat += dNat;
      east += dEast;
      cost += opt.cost;
      details[t] = { deviation, nat: dNat, east: dEast, comp: dComp, core, quiz };
    });
    const budget = D.PROGRAM_RULES.budget;
    let finance = 'ok';
    if (cost > budget) {
      finance = 'over';
      nat -= 0.25 * (cost - budget);
      competence.wirtschaft -= 4 * (cost - budget);
    } else if (cost <= budget - D.PROGRAM_RULES.solidMargin) {
      finance = 'solid';
      competence.wirtschaft += 5;
    }
    TOPIC_IDS.forEach(t => { competence[t] = Math.max(5, Math.min(95, competence[t])); });
    return { competence, nat, east, cost, budget, finance, details, groups: programGroupEffects(partyId, prog) };
  }

  // Wie sehr eine Position einer Gruppe mehr (positiv) oder weniger (negativ) gefällt als dem
  // Durchschnitt – stärker bei Themen, die der Gruppe besonders wichtig sind.
  function positionAppeal(topic, optIndex) {
    const L = D.PROGRAM[topic][optIndex].lean;
    const out = {};
    D.GROUPS.forEach(k => {
      out[k.id] = topicPref(k, topic) * (Math.abs(L - POS_PREF_NAT[topic]) - Math.abs(L - POS_PREF[k.id][topic]));
    });
    return out;
  }

  // Wirkung des Programms auf die Wählergruppen (Punkte). Je Dimension zentriert: Bundesweit
  // gleicht sich das aus, aber Länder mit vielen „Fans“ des Programms profitieren, und
  // Gruppen, die das Programm mögen, lassen sich im Wahlkampf leichter gewinnen.
  const PROG_GROUP_K = 3;
  const CORE_GROUP_K = 1.5;
  function groupAppealRaw(prog) {
    const raw = {};
    D.GROUPS.forEach(k => { raw[k.id] = 0; });
    TOPIC_IDS.forEach(t => {
      const a = positionAppeal(t, prog.positions[t]);
      const core = prog.core.indexOf(t) !== -1;
      D.GROUPS.forEach(k => {
        raw[k.id] += PROG_GROUP_K * PROGRAM_WEIGHT[t] * a[k.id] * (core ? 1.5 : 1);
        if (core) raw[k.id] += CORE_GROUP_K * (topicPref(k, t) - 1);
      });
    });
    return raw;
  }

  // Gemessen an der Parteilinie: Wer bei seiner Linie bleibt, verändert seine Wählerschaft nicht
  // (die steckt schon in den Umfragewerten); Abweichungen und andere Kernthemen verschieben sie.
  function programGroupEffects(partyId, prog) {
    const now = groupAppealRaw(prog);
    const base = groupAppealRaw(defaultProgram(partyId));
    const raw = {};
    D.GROUPS.forEach(k => { raw[k.id] = now[k.id] - base[k.id]; });
    const out = {};
    new Set(D.GROUPS.map(k => k.dim)).forEach(dim => {
      const ks = D.GROUPS.filter(k => k.dim === dim);
      const mean = ks.reduce((s, k) => s + k.weight * raw[k.id], 0) / ks.reduce((s, k) => s + k.weight, 0);
      ks.forEach(k => { out[k.id] = Math.round((raw[k.id] - mean) * 100) / 100; });
    });
    return out;
  }

  // Programmwirkung der Gruppen im Bundesland (gewichtet nach der Wählerschaft dort).
  function programStateEffect(groups, stateId) {
    if (!groups) return 0;
    const w = weightsFor(stateId);
    return D.GROUPS.reduce((s, k) => s + w[k.id] * (groups[k.id] || 0), 0);
  }

  // Positionen wirken stärker in Ländern, in denen ihr Thema wichtiger ist.
  function programTopicStates(fx) {
    const out = {};
    D.STATES.forEach(st => {
      let v = 0;
      TOPIC_IDS.forEach(t => { v += 0.6 * fx.details[t].nat * (stateTopicFactor(st.id, t) - 1); });
      out[st.id] = Math.round(v * 100) / 100;
    });
    return out;
  }

  function applyProgram(g, prog) {
    const fx = programEffects(g.party, prog);
    g.program = { slogan: String(prog.slogan).trim().slice(0, 60), core: prog.core.slice(), positions: Object.assign({}, prog.positions),
      quiz: Object.assign({}, prog.quiz || {}) };
    g.gaffe = gaffeTopic(prog);
    g.competence = fx.competence;
    // Auch das Programm bewegt bei kleinen Parteien weniger Punkte als bei großen.
    const pf = Math.min(1, sizeFactor(BASE_SHARE[g.party] || 10));
    g.prog = { nat: fx.nat * pf, east: fx.east * pf };
    g.progGroups = fx.groups;
    g.progState = programTopicStates(fx);
    g.finance = fx.finance;
    g.program.core.forEach(t => changeSalience(g, t, 0.02));
    // Koalitionsaussage zur AfD (Programmparteitag).
    const fwp = Math.max(0, Math.min(3, Number(prog.firewall) || 0));
    g.program.firewall = fwp;
    if (g.party === 'afd') { if (fwp > 0) g.fwOffer = { union: true, fdp: true, bsw: true }; }
    else if (fwp > 0) openFirewall(g, g.party, fwp);
  }

  function competenceOf(g, p) {
    if (p === g.party && g.competence) return g.competence;
    const adj = g.compAdj && g.compAdj[p];
    if (!adj || !Object.keys(adj).length) return party(p).competence;
    const out = Object.assign({}, party(p).competence);
    Object.keys(adj).forEach(t => { out[t] = Math.max(5, Math.min(95, out[t] + adj[t])); });
    return out;
  }

  function isCore(g, topic) {
    return !!(g.program && g.program.core.indexOf(topic) !== -1);
  }

  // Jahreszahlen in Programmtexten ({J+n} = Wahljahr + n) passen sich dem Wahljahr des Spiels an.
  const YEAR0 = 2029;
  let curYear = null;
  function applyYear(year) {
    year = year || YEAR0;
    if (curYear === year) return;
    curYear = year;
    const fill = s => String(s).replace(/\{J([+-]\d+)?\}/g, (m, n) => String(year + (n ? Number(n) : 0)));
    TOPIC_IDS.forEach(t => D.PROGRAM[t].forEach(o => {
      if (o.labelT === undefined) { o.labelT = o.label; o.descT = o.desc; }
      o.label = fill(o.labelT);
      o.desc = fill(o.descT);
    }));
  }
  applyYear(YEAR0);

  // Megatrends: Über Jahrzehnte verschiebt sich, was die Menschen bewegt. Grundlage sind Langfristtrends
  // (Alterung: Pflege und Rente, Digitalisierung und KI, Klimawandel, neue Sicherheitslage); die Raten je Jahr
  // sind geschätzt. Im ersten Spiel (2029) gelten die heutigen Werte, danach verschiebt sich das Gewicht.
  const MEGATRENDS = { gesundheit: 0.015, soziales: 0.01, digitales: 0.025, klima: 0.01, verteidigung: 0.012, wohnen: 0.005 };
  const baseCache = {};
  function salienceBase(year) {
    const n = Math.max(0, (year || YEAR0) - YEAR0);
    if (baseCache[n]) return baseCache[n];
    const raw = {};
    let sum = 0;
    TOPIC_IDS.forEach(t => { raw[t] = D.SALIENCE0[t] * Math.min(1.6, 1 + (MEGATRENDS[t] || 0) * n); sum += raw[t]; });
    TOPIC_IDS.forEach(t => { raw[t] /= sum; });
    baseCache[n] = raw;
    return raw;
  }

  // carry (optional): Übernahme aus der vorigen Legislaturperiode – Startwerte je Land (base),
  // Namens-Saat, Laufbahn, Brandmauer-Stand und das Wahljahr.
  function newGame(partyId, candidate, seed, program, carry) {
    if (!party(partyId)) throw new Error('Unbekannte Partei: ' + partyId);
    program = program || defaultProgram(partyId);
    const errors = validateProgram(program);
    if (errors.length) throw new Error(errors.join(' '));
    const g = {
      version: 2,
      party: partyId,
      candidate: (candidate || '').trim() || 'Unsere Spitzenkandidatin',
      week: 1,
      maxWeeks: MAX_WEEKS,
      ap: AP_PER_WEEK,
      apMax: AP_PER_WEEK,
      team: teamMaxFor(1, partyId),
      teamMax: teamMaxFor(1, partyId),
      money: party(partyId).budget,
      salience: Object.assign({}, D.SALIENCE0),
      nat: {},
      reg: {},
      usage: {},
      usedEvents: [],
      pendingEvent: null,
      duel: null,
      duelDone: false,
      phase: 'campaign',
      log: [],
      history: [],
      result: null,
      grp: {},
      compAdj: {},
      steal: {},
      delayed: [],
      pollErr: {},
      mob: {},             // Mobilisierung der eigenen Anhänger und von Nichtwählern (bundesweit)
      mobReg: {},          // … und je Bundesland
      postal: { frac: {}, sum: {} }, // bereits abgegebene Briefwahlstimmen je Land
      postalPush: {},      // Briefwahl-Kampagnen: Anteil der Anhänger, die früh wählen
      mobPerm: {},         // dauerhafte Mobilisierung durch Briefwahl
      grudge: {},
      sat: {},             // wie stark die eigene Partei jede Gruppe je Thema schon umworben hat          // wer von euch angegriffen wurde (reagiert eher mit Gegenangriffen)
      otherSwing: 0,       // Stimmung für die sonstigen Parteien (Freie Wähler, Volt, Tierschutzpartei …)
      spendCount: 0,
      spendWeek: 0,
      rng: (seed === undefined ? Math.floor(Math.random() * 2 ** 31) : seed) | 0
    };
    CONTEST_IDS.forEach(p => { g.nat[p] = 0; g.compAdj[p] = {}; g.mob[p] = 0; });
    g.minor = {};
    MINOR_IDS.forEach(m => { g.minor[m] = { trend: 0, nat: 0, reg: {} }; });
    g.shown = {};
    g.nameSeed = (g.rng >>> 0) % 2147483647 || 1;
    if (carry) {
      if (carry.base) g.base = JSON.parse(JSON.stringify(carry.base));
      if (carry.nameSeed) g.nameSeed = carry.nameSeed;
      if (carry.career) g.career = JSON.parse(JSON.stringify(carry.career));
      if (carry.firewall) g.firewall = Object.assign({}, carry.firewall);
      if (carry.year) { g.year = carry.year; g.salience = Object.assign({}, salienceBase(g.year)); }
      if (carry.shown) g.shown = Object.assign({}, carry.shown);
      if (carry.cand) g.cand = Object.assign({}, carry.cand);
      if (carry.money !== undefined) g.money = carry.money;
      if (carry.world) g.world = JSON.parse(JSON.stringify(carry.world));
      if (carry.prevSeats) g.prevSeats = Object.assign({}, carry.prevSeats);
      if (carry.prevYear) g.prevYear = carry.prevYear;
      if (carry.prevWk) g.prevWk = Object.assign({}, carry.prevWk);
      if (carry.prevTurnout) g.prevTurnout = JSON.parse(JSON.stringify(carry.prevTurnout));
      if (carry.prevShares) g.prevShares = Object.assign({}, carry.prevShares);
      if (carry.lobby) g.lobby = JSON.parse(JSON.stringify(carry.lobby));
      if (carry.neuwahl) g.neuwahl = true;
      // Bilanz der Legislatur: Die Probleme vom Ende der Legislatur bestimmen den Wahlkampf mit.
      if (carry.record) {
        g.record = JSON.parse(JSON.stringify(carry.record));
        const rs = g.record.salience;
        if (rs) {
          const base = salienceBase(g.year);
          TOPIC_IDS.forEach(t => { g.salience[t] = 0.7 * (rs[t] || base[t]) + 0.3 * base[t]; });
          const sum = TOPIC_IDS.reduce((s, t) => s + g.salience[t], 0);
          TOPIC_IDS.forEach(t => { g.salience[t] /= sum; });
        }
      }
    }
    applyYear(g.year || YEAR0);
    if (!g.cand) g.cand = Object.assign({}, candStart(partyId));
    // Glaubwürdigkeit aus der Legislatur färbt auf die Spitze ab (geschätzt: ±0,5 auf der Skala −5 … +5).
    if (g.record) g.cand.like = Math.max(-5, Math.min(5, g.cand.like + Math.max(-0.5, Math.min(0.5, (g.record.cred - 55) / 40))));
    g.aiLike = {};
    CONTEST_IDS.forEach(p => { g.aiLike[p] = candStart(p).like; });
    g.rivals = carry && carry.rivals ? JSON.parse(JSON.stringify(carry.rivals)) : {};
    initRivals(g);
    // Der eigene Wahlkreis: Wer ihn in der Legislatur gepflegt hat, startet mit einem Vorsprung bei den Erststimmen.
    if (carry && carry.homeWk && WK_BY_NR[carry.homeWk]) {
      g.homeWk = carry.homeWk;
      if (typeof carry.wkCare === 'number') addWk(g, carry.homeWk, partyId, (carry.wkCare - 55) / 8);
    }
    g.candHist = [{ w: 0, like: g.cand.like, known: g.cand.known }];
    g.journal = [];
    D.STATES.forEach(st => { g.mobReg[st.id] = {}; CONTEST_IDS.forEach(p => { g.mobReg[st.id][p] = 0; }); });
    ALL_IDS.forEach(p => { g.pollErr[p] = 0; });
    GROUP_IDS.forEach(k => { g.grp[k] = {}; CONTEST_IDS.forEach(p => { g.grp[k][p] = 0; }); });
    D.STATES.forEach(s => {
      g.reg[s.id] = {};
      CONTEST_IDS.forEach(p => { g.reg[s.id][p] = 0; });
    });
    // Startpunkt ist die aktuelle Sonntagsfrage, das Programm wirkt ab der ersten Umfrage.
    g.startShares = nationalShares(g);
    g.history.push({ week: 0, shares: g.startShares, real: g.startShares });
    addLog(g, 'start', (g.neuwahl ? 'Der Bundestag ist aufgelöst – Neuwahl! ' : 'Der Wahlkampf beginnt! ') + 'Noch ' + MAX_WEEKS + ' Wochen bis zur Bundestagswahl ' + (g.year || YEAR0) + '.');
    applyProgram(g, program);
    applyRecord(g);
    if (LB) LB.init(g);
    g.grpStart = {};
    GROUP_IDS.forEach(k => { g.grpStart[k] = groupShares(g, k)[partyId]; });
    rollPollErr(g);
    takePoll(g);
    updateMinorVisibility(g, true);
    // Der Verlauf beginnt mit der ersten Umfrage nach dem Parteitag – dieselben Werte wie die Sonntagsfrage.
    g.history[0] = { week: 0, shares: g.poll.nat, real: nationalShares(g), groups: g.poll.groups };
    const now = g.poll.nat[partyId];
    addLog(g, 'event', 'Wahlprogramm „' + g.program.slogan + '“ vorgestellt. Erste Umfrage: ' +
      now.toFixed(1).replace('.', ',') + ' % (' + fmt(now - g.startShares[partyId]) + ').');
    return g;
  }

  function addLog(g, type, text) {
    g.log.unshift({ week: g.week, type, text });
    if (g.log.length > 80) g.log.length = 80;
  }

  // ---------- Umfragewerte ----------

  // Mit stateId zählt ein Thema dort stärker, wo es den Menschen wichtiger ist.
  function issueEffect(g, p, stateId) {
    const comp = competenceOf(g, p);
    let e = 0;
    TOPIC_IDS.forEach(t => {
      e += (g.salience[t] - D.SALIENCE0[t]) * (comp[t] - MEAN_COMPETENCE[t]) / 100 * (stateId ? stateTopicFactor(stateId, t) : 1);
    });
    // Themenkompetenz bringt kleinen Parteien in absoluten Punkten weniger als großen.
    return ISSUE_K * e * Math.min(1, sizeFactor(BASE_SHARE[p] || 10));
  }

  // Wählerwanderung: Wer zulegt, holt die Stimmen nicht gleichmäßig von allen, sondern vor allem von
  // den Parteien, mit denen er real Wähler austauscht (Wanderungsbilanz 2025, D.FLOWS). Wer verliert,
  // gibt in dieselben Richtungen ab. Gezielte Abwerbung (g.src: über Themenkompetenz in einer
  // Zielgruppe oder gewonnene Duelle) geht direkt zulasten der getroffenen Partei.
  function flowRow(p, east) {
    return FLOW_ROWS[(east && D.FLOWS_EAST ? 'e:' : 'w:') + p];
  }
  const FLOW_ROWS = {};
  [['w:', D.FLOWS], ['e:', D.FLOWS_EAST]].forEach(([pre, rows]) => {
    if (!rows) return;
    CONTEST_IDS.forEach(p => {
      // Austausch 2025, gewichtet mit der heutigen Größe des Wählerpools im Verhältnis zu 2025:
      // Ist eine Partei heute kleiner als 2025, gibt es bei ihr auch weniger zu holen.
      const r = {};
      Object.keys(rows[p] || {}).forEach(q => {
        if (q === p) return;
        const now = q === D.OTHER.id ? 100 - PARTY_IDS.reduce((s, x) => s + BASE_SHARE[x], 0) : BASE_SHARE[q];
        const then = D.RESULT_2025 && D.RESULT_2025[q];
        r[q] = rows[p][q] * (then && now ? now / then : 1);
      });
      const sum = Object.keys(r).reduce((s, q) => s + r[q], 0) || 1;
      const out = {};
      Object.keys(r).forEach(q => { out[q] = r[q] / sum; });
      FLOW_ROWS[pre + p] = out;
    });
  });

  // Kampagnen-Bonus je Partei im Land und wer ihn bezahlt: taken[p][q] = Punkte, die p von q holt.
  function stateFlows(g, stateId) {
    const st = stateById(stateId);
    const bonus = {};
    const taken = {};
    CONTEST_IDS.forEach(p => {
      const prog = p === g.party && g.prog ? g.prog.nat + (st.east ? g.prog.east : 0) + programStateEffect(g.progGroups, stateId) +
        ((g.progState && g.progState[stateId]) || 0) : 0;
      bonus[p] = g.nat[p] + g.reg[stateId][p] + prog + issueEffect(g, p, stateId) + groupEffect(g, p) + (p === g.party ? candBonus(g) : 0);
    });
    CONTEST_IDS.forEach(p => {
      const b = bonus[p];
      const t = {};
      taken[p] = t;
      if (!b && !(g.src && g.src[p]) && !(g.srcReg && g.srcReg[stateId] && g.srcReg[stateId][p])) return;
      let rest = b;
      // Gezielt abgeworbene Stimmen kommen immer von der getroffenen Partei; der Rest des
      // Bonus (auch ein negativer) verteilt sich über die Wanderungstabelle.
      const srcN = g.src && g.src[p];
      const srcR = g.srcReg && g.srcReg[stateId] && g.srcReg[stateId][p];
      const src = srcR ? Object.assign({}, srcN || {}) : srcN;
      if (srcR) Object.keys(srcR).forEach(q => { src[q] = (src[q] || 0) + srcR[q]; });
      if (src) {
        Object.keys(src).forEach(q => {
          if (!(src[q] > 0)) return;
          t[q] = (t[q] || 0) + src[q];
          rest -= src[q];
        });
      }
      const row = flowRow(p, st.east);
      if (row) Object.keys(row).forEach(q => { t[q] = (t[q] || 0) + rest * row[q]; });
    });
    return { bonus, taken };
  }

  function stateShares(g, stateId) {
    const st = stateById(stateId);
    const raw = {};
    const { bonus, taken } = stateFlows(g, stateId);
    // Nach einer Legislaturperiode starten Folgewahlkämpfe vom aktuellen Stand der Länder (g.base).
    const B = (g.base && g.base[stateId]) || null;
    const lose = {};
    ALL_IDS.forEach(q => { lose[q] = 0; });
    CONTEST_IDS.forEach(p => { Object.keys(taken[p]).forEach(q => { if (q in lose) lose[q] += taken[p][q]; }); });
    let other = 100;
    PARTY_IDS.forEach(p => {
      const b0 = B ? (B[p] || 0) : st.result[p];
      other -= b0;
      raw[p] = Math.max(0.2, b0 + bonus[p] - lose[p]) * mobFactor(g, p, stateId);
    });
    // Kleinparteien: Startwert und eigener Trend (in Hochburgen stärker); Wahlkampf, Wanderung und
    // Mobilisierung wie bei den großen Parteien. Was die großen Parteien den „Sonstigen“ abnehmen,
    // verlieren Kleinparteien und Rest anteilig.
    let small = 0;
    MINOR_IDS.forEach(m => {
      const base = B ? Math.max(0.05, B[m] || 0) : MINOR_BASE[stateId][m];
      other -= base;
      const mi = (g.minor && g.minor[m]) || {};
      const home = base / Math.max(0.2, MINOR_NAT[m]);
      raw[m] = Math.max(0.05, base + (mi.trend || 0) * Math.min(3, home) + (bonus[m] || 0) - lose[m]) * mobFactor(g, m, stateId);
      small += raw[m];
    });
    const rest = Math.max(0.3, other + (g.otherSwing || 0));
    const k = Math.max(0.2, 1 - lose[D.OTHER.id] / Math.max(0.5, small + rest));
    MINOR_IDS.forEach(m => { raw[m] *= k; });
    raw[D.OTHER.id] = Math.max(0.3, rest * k);
    const sum = ALL_IDS.reduce((s, p) => s + raw[p], 0);
    const out = {};
    ALL_IDS.forEach(p => { out[p] = raw[p] / sum * 100; });
    return out;
  }

  // Wählerwanderung bundesweit seit Wahlkampfbeginn: net[q] > 0 heißt, p hat netto von q gewonnen.
  function flowSummary(g, p) {
    const net = {};
    ALL_IDS.concat(['nw']).forEach(q => { if (q !== p) net[q] = 0; });
    D.STATES.forEach(st => {
      const w = st.voters / TOTAL_VOTERS;
      const { taken } = stateFlows(g, st.id);
      Object.keys(taken[p]).forEach(q => { if (q in net) net[q] += w * taken[p][q]; });
      CONTEST_IDS.forEach(q => { if (q !== p && taken[q][p]) net[q] -= w * taken[q][p]; });
    });
    return net;
  }

  // Gezielte Abwerbung: Wer bei einem Thema Kompetenz aufgebaut hat und damit eine Zielgruppe
  // erreicht, holt die Stimmen vor allem von der Partei, die das Thema sonst besetzt –
  // und die in dieser Gruppe stark ist.
  const STEER_MAX = 0.75;
  // Kernthemen einer Partei im Wahlkampf: euer Programm bzw. die Schwerpunkte der Konkurrenz (D.CAMPAIGN_TOPICS).
  function partyTopics(g, p) {
    if (p === g.party && g.program) return g.program.core.slice();
    return (D.CAMPAIGN_TOPICS && D.CAMPAIGN_TOPICS[p]) || (party(p) && party(p).topics) || [];
  }
  // Wer bespielt das Thema gerade (in der letzten Woche im Wahlkampf gesetzt)?
  const pushing = (g, q, topic) => !!(g.aiPush && g.aiPush[q] && g.aiPush[q][topic] >= g.week - 1);
  // Gewichte der Abwerbung: Wer das Thema als Kernthema bespielt, verliert am meisten – im Land nur, wo die Partei Wähler hat.
  function steerWeights(g, p, topic, groupId, stateId) {
    const mine = competenceOf(g, p)[topic];
    const k = groupId ? D.GROUPS.find(x => x.id === groupId) : null;
    const gs = k ? groupShares(g, k.id) : null;
    const pub = gs ? publishedShares(g) : null;
    const care = k ? Math.max(0.6, Math.min(1.6, topicPref(k, topic))) : 1;
    const sts = stateId ? stateShares(g, stateId) : null;
    const w = {};
    let W = 0;
    let coreW = 0;
    CONTEST_IDS.forEach(q => {
      if (q === p) return;
      const theirs = competenceOf(g, q)[topic];
      const core = partyTopics(g, q).indexOf(topic) !== -1;
      const own = Math.max(core ? 12 : 0, theirs - MEAN_COMPETENCE[topic]);
      // Bei einem Kernthema ist auch einer kompetenteren Partei etwas zu holen – nur schwerer.
      const rel = Math.max(core ? 0.35 : 0, Math.min(1.2, 1 + (mine - theirs) / 40));
      const fit = gs && pub[q] > 0 ? Math.max(0.5, Math.min(2, gs[q] / pub[q])) : 1;
      // Wählerpotenzial: Bei einer großen Partei ist mehr zu holen als bei einer kleinen (im Land: dortiger Anteil).
      const pool = Math.sqrt(Math.max(0, sts ? sts[q] : nationalShares(g)[q]) / 10);
      w[q] = own * rel * fit * care * pool * (core ? 4 : 1) * (pushing(g, q, topic) ? 1.3 : 1);
      W += w[q];
      if (core) coreW += w[q];
    });
    return { w, W, coreW };
  }
  // Gezielte Abwerbung: Wer bei einem Thema punktet, holt die Stimmen vor allem von der Partei, die das Thema besetzt.
  // Mit Land (stateId) nur dort; sonst bundesweit. Ist es deren Kernthema, kommt der Großteil von ihr.
  function steerVotes(g, p, topic, groupId, amount, stateId) {
    if (!(amount > 0) || !topicById(topic)) return null;
    const { w, W, coreW } = steerWeights(g, p, topic, groupId, stateId);
    if (W < 1) return null;
    const steer = amount * (coreW >= 0.5 * W ? 0.9 : Math.min(STEER_MAX, W / 30));
    let src;
    if (stateId) {
      g.srcReg = g.srcReg || {};
      g.srcReg[stateId] = g.srcReg[stateId] || {};
      src = g.srcReg[stateId][p] = g.srcReg[stateId][p] || {};
    } else {
      if (!g.src) g.src = {};
      src = g.src[p] = g.src[p] || {};
    }
    let best = null;
    Object.keys(w).forEach(q => {
      if (!w[q]) return;
      src[q] = (src[q] || 0) + steer * w[q] / W;
      if (!best || w[q] > w[best]) best = q;
    });
    return best && W >= 5 && w[best] / W >= 0.35 ? best : null;
  }
  // Vorschau: Von wem kämen die Stimmen bei diesem Thema (im Land)?
  function steerPreview(g, topic, stateId) {
    const { w, W } = steerWeights(g, g.party, topic, null, stateId);
    return Object.keys(w).filter(q => w[q] > 0).sort((a, b) => w[b] - w[a]).slice(0, 3)
      .map(q => ({ p: q, share: W ? w[q] / W : 0, core: partyTopics(g, q).indexOf(topic) !== -1 })).filter(x => x.share >= 0.08);
  }


  // ---------- Mobilisierung und Wahlbeteiligung ----------

  // Faktor auf den Stimmenanteil: Wer seine Anhänger und Nichtwähler an die Urne bringt, gewinnt.
  function mobFactor(g, p, stateId) {
    if (!g.mob) return 1;
    const m = (g.mob[p] || 0) + ((g.mobReg && g.mobReg[stateId] && g.mobReg[stateId][p]) || 0) + ((g.mobPerm && g.mobPerm[p]) || 0);
    return Math.max(0.85, Math.min(1.25, 1 + m));
  }

  // Wie viel Mobilisierung bei einer Partei ankommt: Parteien mit viel Potenzial im Nichtwählerlager
  // (laut Wählerwanderung 2025) holen mehr heraus.
  function mobPotential(p) {
    return (D.NONVOTER_POTENTIAL && D.NONVOTER_POTENTIAL[p]) || 1;
  }

  function mobilize(g, p, amount, stateId) {
    const a = amount * mobPotential(p);
    if (stateId) g.mobReg[stateId][p] += a;
    else g.mob[p] += a;
    return a;
  }

  // Erwartete Wahlbeteiligung: Ausgangswert 2025 des Landes, verändert durch die Mobilisierung.
  function turnout(g, stateId) {
    if (!stateId) {
      return D.STATES.reduce((s, st) => s + turnout(g, st.id) * st.voters, 0) / TOTAL_VOTERS;
    }
    const base = (D.TURNOUT && D.TURNOUT[stateId]) || (D.TURNOUT && D.TURNOUT.DE) || 82.5;
    const sh = stateShares(g, stateId);
    let avg = sh[D.OTHER.id] / 100;
    CONTEST_IDS.forEach(p => { avg += sh[p] / 100 * mobFactor(g, p, stateId); });
    return Math.min(95, base * avg);
  }

  // ---------- Briefwahl ----------

  // Ab Woche 5 wählt jede Woche ein Teil der Briefwähler – mit der Stimmung dieser Woche.
  // Briefwahl-Kampagnen sorgen dafür, dass eure Anhänger überdurchschnittlich früh dabei sind.
  function castPostal(g) {
    const split = POSTAL_SPLIT[g.week];
    if (!split) return;
    if (!g.postal) g.postal = { frac: {}, sum: {} };
    D.STATES.forEach(st => {
      const f = postalShare(st.id) * split;
      const sh = stateShares(g, st.id);
      const raw = {};
      let tot = 0;
      ALL_IDS.forEach(p => { raw[p] = sh[p] * (1 + ((g.postalPush && g.postalPush[p]) || 0)); tot += raw[p]; });
      g.postal.frac[st.id] = (g.postal.frac[st.id] || 0) + f;
      if (!g.postal.sum[st.id]) g.postal.sum[st.id] = {};
      ALL_IDS.forEach(p => { g.postal.sum[st.id][p] = (g.postal.sum[st.id][p] || 0) + f * raw[p] / tot * 100; });
    });
  }

  // Anteil der Stimmen, die schon per Brief abgegeben sind (bundesweit).
  function postalCast(g) {
    if (!g.postal) return 0;
    return D.STATES.reduce((s, st) => s + (g.postal.frac[st.id] || 0) * st.voters, 0) / TOTAL_VOTERS;
  }

  // Ergebnis eines Landes am Wahlabend: Briefwahlstimmen (früh abgegeben) + Urnenwahl (jetzt).
  function electionStateShares(g, stateId) {
    const now = stateShares(g, stateId);
    const f = (g.postal && g.postal.frac[stateId]) || 0;
    if (!f) return now;
    const out = {};
    ALL_IDS.forEach(p => { out[p] = g.postal.sum[stateId][p] + (1 - f) * now[p]; });
    return out;
  }

  function electionShares(g) {
    const out = {};
    ALL_IDS.forEach(p => { out[p] = 0; });
    D.STATES.forEach(st => {
      const s = electionStateShares(g, st.id);
      ALL_IDS.forEach(p => { out[p] += s[p] * st.voters / TOTAL_VOTERS; });
    });
    return out;
  }

  function nationalShares(g) {
    const out = {};
    ALL_IDS.forEach(p => { out[p] = 0; });
    D.STATES.forEach(st => {
      const s = stateShares(g, st.id);
      ALL_IDS.forEach(p => { out[p] += s[p] * st.voters / TOTAL_VOTERS; });
    });
    return out;
  }

  // Bundesweite Wirkung der Wählergruppen-Boni: gewichteter Schnitt über alle Gruppen.
  function groupEffect(g, p) {
    if (!g.grp) return 0;
    return D.GROUPS.reduce((s, k) => s + W[k.id] * ((g.grp[k.id] && g.grp[k.id][p]) || 0), 0);
  }

  // ---------- Umfragen mit Fehlerspanne ----------

  function normalize(raw) {
    const sum = ALL_IDS.reduce((s, p) => s + raw[p], 0);
    const out = {};
    ALL_IDS.forEach(p => { out[p] = raw[p] / sum * 100; });
    return out;
  }

  // Neuer Umfragefehler: teils von der Vorwoche übernommen (Institutseffekt), höchstens ± POLL_RANGE.
  // Kleine Parteien schwanken in absoluten Punkten weniger.
  function rollPollErr(g) {
    const shares = nationalShares(g);
    ALL_IDS.forEach(p => {
      const noise = (rand(g) + rand(g) + rand(g) - 1.5) * 2;
      const scale = Math.min(1, (shares[p] + 3) / 15);
      const e = 0.4 * (g.pollErr[p] || 0) + noise * scale;
      g.pollErr[p] = Math.round(Math.max(-POLL_RANGE, Math.min(POLL_RANGE, e)) * 100) / 100 + 0; // + 0 vermeidet −0
    });
  }

  function publish(g, shares) {
    if (!g.pollErr) return shares;
    const raw = {};
    ALL_IDS.forEach(p => { raw[p] = Math.max(0.3, shares[p] + (g.pollErr[p] || 0)); });
    return normalize(raw);
  }

  // Was die Institute veröffentlichen – der wahre Wert zeigt sich erst am Wahlabend.
  function publishedShares(g) { return publish(g, nationalShares(g)); }
  function publishedStateShares(g, stateId) { return publish(g, stateShares(g, stateId)); }

  // ---------- Kalender ----------
  // Alle Daten in UTC, damit Zeitzonen keine Tage verschieben.
  const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const MONTHS_S = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'];
  const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const DAY_MS = 864e5;
  const dayUTC = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
  const addDays = (dt, n) => new Date(dt.getTime() + n * DAY_MS);
  const dayNum = dt => Math.floor(dt.getTime() / DAY_MS);
  function lastSunday(y, m) { const d = dayUTC(y, m + 1, 0); return addDays(d, -d.getUTCDay()); }
  // Montag der Kalenderwoche kw (ISO 8601).
  function isoMonday(y, kw) { const j4 = dayUTC(y, 1, 4); return addDays(j4, -((j4.getUTCDay() + 6) % 7) + (kw - 1) * 7); }
  function isoWeek(dt) { const th = addDays(dt, 3 - (dt.getUTCDay() + 6) % 7); const j1 = dayUTC(th.getUTCFullYear(), 1, 1); return 1 + Math.floor((dayNum(th) - dayNum(j1)) / 7); }
  // style: 'long' = Sonntag, 25. Februar 2029 · 'day' = 25. Februar 2029 · 'dm' = 25. Februar · 'num' = 25.2.
  function fmtDate(dt, style) {
    const d = dt.getUTCDate(), m = dt.getUTCMonth(), y = dt.getUTCFullYear();
    if (style === 'num') return d + '.' + (m + 1) + '.';
    if (style === 'dm') return d + '. ' + MONTHS[m];
    if (style === 'day') return d + '. ' + MONTHS[m] + ' ' + y;
    return WEEKDAYS[dt.getUTCDay()] + ', ' + d + '. ' + MONTHS[m] + ' ' + y;
  }
  function fmtRange(a, b) {
    if (a.getUTCMonth() === b.getUTCMonth()) return a.getUTCDate() + '.–' + fmtDate(b, 'dm');
    return fmtDate(a, 'dm') + ' – ' + fmtDate(b, 'dm');
  }
  // Wahltermin: Die Bundestagswahl liegt 46 bis 48 Monate nach dem ersten Zusammentritt (Art. 39 GG) – nach der Wahl im
  // Februar 2025 also im Frühjahr; das Spiel nimmt den letzten Sonntag im Februar. Nach einem Bruch liegt die Wahl im
  // Quartal danach, nach einer Auflösung höchstens 60 Tage später (hier zwölf Wochen nach der ersten Wahl).
  function electionDate(g) {
    const abs = g.world && g.world.abs0 ? g.world.abs0 - 1 : (g.year || YEAR0) * 4;
    const y = Math.floor(abs / 4), qn = abs % 4 + 1;
    const d = lastSunday(y, (qn - 1) * 3 + 2);
    return g.neuwahl ? addDays(d, 84) : d;
  }
  // Wahlkampfwoche w (1 … maxWeeks): Montag bis Sonntag, die letzte endet am Wahlsonntag.
  function weekStart(g, w) { return addDays(electionDate(g), -6 - ((g.maxWeeks || MAX_WEEKS) - w) * 7); }
  function weekLabel(g, w) { const a = weekStart(g, w); return fmtRange(a, addDays(a, 6)); }
  // Tag innerhalb einer Wahlkampfwoche (1 = Montag … 7 = Sonntag).
  function weekDay(g, w, dow) { return addDays(weekStart(g, w), (dow || 3) - 1); }
  // Wahlkampfwoche, in die ein Datum fällt (0 = vor dem Wahlkampf).
  function weekOf(g, dt) { return Math.max(0, Math.min(g.maxWeeks || MAX_WEEKS, Math.floor((dayNum(dt) - dayNum(weekStart(g, 1))) / 7) + 1)); }

  // ---------- Umfrageinstitute ----------
  // Eigener Zufall (wie bei Prognosen): Die Institute verändern den Spielverlauf nicht.
  function localRng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let x = Math.imul(a ^ (a >>> 15), 1 | a);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Unsicherheit einer Umfrage je Partei (Punkte): große Parteien bis ± POLL_RANGE, kleine weniger.
  function pollMargin(share) { return Math.max(1, Math.round(POLL_RANGE * Math.min(1, (share + 3) / 15) * 2) / 2); }
  // Die jüngste Umfrage jedes Instituts bis zum Tag now. baseAt(Datum) liefert den Stand der Stimmung zur Feldzeit.
  function institutePolls(g, now, baseAt) {
    const ids = shownIds(g);
    return D.INSTITUTES.map((ins, k) => {
      const dn = dayNum(now);
      let pub = dn - (((dn - ins.offset) % ins.every) + ins.every) % ins.every;
      // Zwischen den Jahren und an Neujahr wird nicht veröffentlicht.
      const quiet = d => { const x = new Date(d * DAY_MS); const md = (x.getUTCMonth() + 1) * 100 + x.getUTCDate(); return md >= 1223 || md <= 101; };
      while (quiet(pub)) pub -= 1;
      const pubDate = new Date(pub * DAY_MS);
      const R = localRng(((g.nameSeed || 1) * 7 + pub * 131 + k * 7919) % 2147483647);
      const n = Math.round((ins.n[0] + R() * (ins.n[1] - ins.n[0])) / 10) * 10;
      const base = mergeShares(g, baseAt(addDays(pubDate, -2)));
      const gauss = () => (R() + R() + R() + R() - 2) * 1.73;
      const raw = {};
      let sum = 0;
      ids.concat([D.OTHER.id]).forEach(p => {
        const b = base[p] || 0;
        const sd = Math.sqrt(Math.max(1, b) * (100 - b) / n) * 1.3; // Stichprobenfehler mit Designeffekt
        raw[p] = Math.max(1, b + (ins.house[p] || 0) + gauss() * sd);
        sum += raw[p];
      });
      // Auf 100 % bringen; „Sonstige“ ist der Rest nach dem Runden, wie in den veröffentlichten Tabellen.
      const out = {};
      let shown = 0;
      ids.forEach(p => { out[p] = Math.round(raw[p] / sum * 100 / ins.round) * ins.round; shown += out[p]; });
      out[D.OTHER.id] = Math.max(ins.round, Math.round((100 - shown) / ins.round) * ins.round);
      return { inst: ins, date: pubDate, from: addDays(pubDate, -ins.field - 1), to: addDays(pubDate, -2), n, shares: out };
    });
  }
  // Umfragemittel: Durchschnitt der jüngsten Umfrage jedes Instituts.
  function pollAverage(list) {
    const out = {};
    list.forEach(x => Object.keys(x.shares).forEach(p => { out[p] = (out[p] || 0) + x.shares[p] / list.length; }));
    return out;
  }
  // Im Wahlkampf: Stand am Montag der laufenden Woche; die Institute befragen auf Basis der Wochenumfragen.
  function campaignPolls(g, week) {
    const now = addDays(weekStart(g, Math.max(1, week === undefined ? g.week : week)), -1);
    const hist = g.history || [];
    return institutePolls(g, now, dt => {
      const h = hist[Math.max(0, Math.min(hist.length - 1, weekOf(g, dt)))]; // Eintrag w = Stand am Ende der Woche w
      return h ? h.shares : g.poll.nat;
    });
  }
  function campaignAverage(g, week) { return pollAverage(campaignPolls(g, week)); }

  // ---------- Wählergruppen ----------

  function topicPref(k, topic, stateId) {
    const base = (topic && k.topics[topic]) || 1;
    return stateId && topic ? base * Math.pow(stateTopicFactor(stateId, topic), 0.8) : base;
  }

  // Lieblingsthemen einer Gruppe in einem Land (Gruppenvorliebe × Landesthema × Wählerinteresse).
  function groupTopicsInState(groupId, stateId, n) {
    const k = D.GROUPS.find(x => x.id === groupId);
    return TOPIC_IDS.slice().sort((a, b) => topicPref(k, b, stateId) * Math.sqrt(D.SALIENCE0[b]) - topicPref(k, a, stateId) * Math.sqrt(D.SALIENCE0[a])).slice(0, n || 3);
  }

  // Wichtigste Themen in einem Land.
  // Wichtigste Themen in einem Land: Rangfolge der Landesumfrage, sonst Bundesschnitt.
  function stateTopTopics(stateId, n) {
    const v = D.STATE_TOPICS && D.STATE_TOPICS[stateId];
    const score = t => (v && v.werte[t]) || (v ? 0 : D.SALIENCE0[t]);
    return TOPIC_IDS.slice().sort((a, b) => score(b) - score(a)).slice(0, n || 3);
  }

  // Verteilung einer Wirkung auf die Gruppen: Kanal × Thema, so normiert, dass der
  // gewichtete Schnitt 1 ergibt.
  // Mit stateId: Verteilung gemäß der Wählerschaft dieses Bundeslands.
  function groupMix(channel, topic, stateId) {
    const ch = D.CHANNELS[channel] || {};
    const w = weightsFor(stateId);
    const raw = {};
    let norm = 0;
    D.GROUPS.forEach(k => {
      raw[k.id] = (ch[k.id] || 1) * topicPref(k, topic, stateId);
      norm += w[k.id] * raw[k.id];
    });
    GROUP_IDS.forEach(id => { raw[id] /= norm; });
    return raw;
  }

  // Sättigung je Gruppe in einem bestimmten Zusammenhang: Ort (Bundesland oder bundesweit) ×
  // Aktion × Thema. Wer die Arbeiter in Bayern mit einer Kundgebung zu Wirtschaft umwirbt, hat sie
  // in Baden-Württemberg, bei einem Infostand oder beim Thema Bildung noch nicht „verbraucht“.
  // Gilt nur für die eigene Partei.
  const satCtx = (stateId, channel, topic) => (stateId || 'bund') + '|' + (channel || '_') + '|' + (topic || '_');
  function groupSat(g, k, p, topic, stateId, channel) {
    if (p !== g.party || !g.sat) return 1;
    const c = g.sat[satCtx(stateId, channel, topic)];
    return 1 / (1 + Math.max(0, (c && c[k]) || 0) / GROUP_SAT);
  }

  function addSat(g, k, topic, amount, stateId, channel) {
    if (!g.sat) g.sat = {};
    const key = satCtx(stateId, channel, topic);
    if (!g.sat[key]) g.sat[key] = {};
    g.sat[key][k] = (g.sat[key][k] || 0) + amount;
  }

  // Wo eine Gruppe schon stark umworben ist (für die Anzeige): Liste von {state, channel, topic}.
  function saturatedContexts(g, k, limit) {
    const out = [];
    Object.keys(g.sat || {}).forEach(key => {
      const v = g.sat[key][k] || 0;
      if (1 / (1 + v / GROUP_SAT) < (limit || 0.6)) {
        const parts = key.split('|');
        out.push({ state: parts[0] === 'bund' ? null : parts[0], channel: parts[1] === '_' ? null : parts[1], topic: parts[2] === '_' ? null : parts[2] });
      }
    });
    return out;
  }

  // Wirkung einer Vor-Ort-Aktion, die gezielt eine Wählergruppe anspricht (1 = durchschnittlich):
  // Kanal und Thema müssen zur Gruppe passen, große Gruppen bringen mehr Stimmen, und eine Gruppe,
  // die zu diesem Thema schon oft angesprochen wurde, reagiert schwächer.
  function focusFactor(g, channel, topic, stateId, groupId) {
    const m = groupMix(channel, topic, stateId)[groupId] || 1;
    const share = stateWeights(stateId)[groupId] || 0;
    if (share <= 0) return 0;
    const fit = Math.max(0.75, Math.min(1.45, Math.pow(m, 0.6)));
    const size = Math.max(0.72, Math.min(1.15, 0.7 + 0.9 * share));
    const fan = g.progGroups ? Math.max(0.8, Math.min(1.2, 1 + 0.05 * (g.progGroups[groupId] || 0))) : 1;
    return fit * size * fan * groupSat(g, groupId, g.party, topic, stateId, channel);
  }

  // Wie viel einer Aktion bei den Zielgruppen noch ankommt (1 = unverbraucht).
  function groupEfficiency(g, p, channel, topic, stateId) {
    const mix = groupMix(channel, topic, stateId);
    const w = weightsFor(stateId);
    return D.GROUPS.reduce((s, k) => s + w[k.id] * mix[k.id] * groupSat(g, k.id, p, topic, stateId, channel), 0);
  }

  // Wie gut ein Kanal zur Wählerschaft eines Landes passt (1 = wie im Bundesschnitt).
  // Plakate und Kundgebungen ziehen auf dem Land, in den Stadtstaaten weniger.
  function channelFit(channel, stateId) {
    const ch = D.CHANNELS[channel];
    if (!ch || !stateId) return 1;
    const avg = w => D.GROUPS.reduce((s, k) => s + w[k.id] * (ch[k.id] || 1), 0);
    const raw = avg(weightsFor(stateId)) / avg(W);
    return Math.max(0.7, Math.min(1.3, 1 + 1.5 * (raw - 1)));
  }

  // Verteilt eine bundesweite Wirkung d auf die Gruppen. Gibt die tatsächliche Wirkung zurück.
  function addGroups(g, p, d, channel, topic, stateId) {
    const mix = groupMix(channel, topic, stateId);
    let total = 0;
    D.GROUPS.forEach(k => {
      // Gruppen, denen euer Programm gefällt, sind leichter zu mobilisieren (und umgekehrt).
      const fan = p === g.party && g.progGroups && d > 0 ? Math.max(0.7, Math.min(1.3, 1 + 0.08 * (g.progGroups[k.id] || 0))) : 1;
      const add = d * mix[k.id] * fan * (d > 0 ? groupSat(g, k.id, p, topic, stateId, channel) : 1);
      g.grp[k.id][p] += add;
      // Vor Ort zählt die Ansprache, nicht die (gedämpfte) Stimmenwirkung – daher hochgerechnet.
      if (add > 0 && p === g.party) addSat(g, k.id, topic, stateId ? add / REGION_SCALE : add, stateId, channel);
      total += W[k.id] * add;
    });
    return total;
  }

  // Gruppenwirkung einer Vor-Ort-Aktion: mit Zielgruppe landet der Großteil dort.
  function regionGroups(g, p, d, channel, topic, stateId, focus) {
    if (!focus) return addGroups(g, p, d, channel, topic, stateId);
    const k = D.GROUPS.find(x => x.id === focus);
    const amount = 3 * d * (1 - k.weight);
    g.grp[focus][p] += amount;
    addSat(g, focus, topic, amount / REGION_SCALE, stateId, channel);
    return addGroups(g, p, 0.3 * d, channel, topic, stateId);
  }

  // Umfrage innerhalb einer Gruppe (veröffentlichte Werte, also auch mit Fehlerspanne).
  // Mit stateId: Umfrage in dieser Gruppe innerhalb des Bundeslands.
  function groupShares(g, groupId, stateId) {
    const k = D.GROUPS.find(x => x.id === groupId);
    const pub = stateId ? publishedStateShares(g, stateId) : publishedShares(g);
    const factor = stateId ? FACTOR_STATE[stateId][groupId] : FACTOR[groupId];
    const raw = {};
    CONTEST_IDS.forEach(p => {
      const comp = competenceOf(g, p);
      let topic = 0;
      TOPIC_IDS.forEach(t => {
        topic += (g.salience[t] - D.SALIENCE0[t]) * (topicPref(k, t) - 1) * (comp[t] - MEAN_COMPETENCE[t]) / 100;
      });
      const pg = p === g.party && g.progGroups ? g.progGroups[groupId] - programStateEffect(g.progGroups, stateId) : 0;
      raw[p] = Math.max(0.3, pub[p] * (factor[p] || 1) + pg + (g.grp[groupId][p] - groupEffect(g, p)) + ISSUE_K * topic);
    });
    // Ausgewiesene Kleinparteien erscheinen mit ihrem Anteil, die übrigen stecken in „Sonstige“.
    raw[D.OTHER.id] = pub[D.OTHER.id];
    MINOR_IDS.forEach(m => { if (!isShown(g, m)) { raw[D.OTHER.id] += raw[m]; raw[m] = 0; } });
    return normalize(raw);
  }

  // Die veröffentlichte Umfrage der Woche: Sie wird einmal pro Woche erhoben und bleibt bis zur
  // nächsten Umfrage gleich – Aktionen zeigen sich also erst in der nächsten Umfrage.
  const round1 = sh => { const o = {}; ALL_IDS.forEach(p => { o[p] = Math.round(sh[p] * 100) / 100; }); return o; };
  function takePoll(g) {
    const poll = { nat: round1(publishedShares(g)), states: {}, groups: allGroupShares(g), stateGroups: {} };
    D.STATES.forEach(st => {
      poll.states[st.id] = round1(publishedStateShares(g, st.id));
      poll.stateGroups[st.id] = {};
      GROUP_IDS.forEach(k => { poll.stateGroups[st.id][k] = round1(groupShares(g, k, st.id)); });
    });
    g.poll = poll;
    return poll;
  }
  const pollShares = g => (g.poll ? g.poll.nat : publishedShares(g));
  const pollStateShares = (g, stateId) => (g.poll ? g.poll.states[stateId] : publishedStateShares(g, stateId));
  function pollGroupShares(g, groupId, stateId) {
    if (!g.poll) return groupShares(g, groupId, stateId);
    return stateId ? g.poll.stateGroups[stateId][groupId] : g.poll.groups[groupId];
  }

  // Umfragewerte aller Parteien in allen Wählergruppen (gerundet, für den Verlauf).
  function allGroupShares(g) {
    const out = {};
    GROUP_IDS.forEach(k => {
      const s = groupShares(g, k);
      out[k] = {};
      ALL_IDS.forEach(p => { out[k][p] = Math.round(s[p] * 10) / 10; });
    });
    return out;
  }

  function leader(shares) {
    return CONTEST_IDS.reduce((best, p) => (shares[p] > shares[best] ? p : best), CONTEST_IDS[0]);
  }

  // ---------- Hilfsfunktionen für Effekte ----------

  function compMod(g, topic) {
    return (competenceOf(g, g.party)[topic] - 50) / 50;
  }

  function changeSalience(g, topic, delta) {
    // Ein Thema lässt sich nicht beliebig aufblasen: Je weiter es schon über seinem üblichen
    // Gewicht liegt, desto weniger bewegt ein weiterer Anstoß.
    if (delta > 0) delta /= 1 + 1.5 * Math.max(0, g.salience[topic] / D.SALIENCE0[topic] - 1);
    g.salience[topic] = Math.max(0.03, g.salience[topic] + delta);
    const sum = TOPIC_IDS.reduce((s, t) => s + g.salience[t], 0);
    TOPIC_IDS.forEach(t => { g.salience[t] /= sum; });
  }

  // Größere Parteien haben mehr Reichweite pro Aktion.
  function reach(g) {
    const share = nationalShares(g)[g.party];
    return 0.7 + 0.3 * Math.min(1.5, share / 20);
  }

  // Abnehmender Grenznutzen: dieselbe Aktion am selben Ort wirkt jedes Mal schwächer.
  function wear(g, key) {
    const n = g.usage[key] || 0;
    g.usage[key] = n + 1;
    return 1 / (1 + 0.8 * n);
  }

  const fmt = x => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(1);

  // ---------- Aktionen ----------

  const ACTIONS = [
    { id: 'kundgebung', name: 'Kundgebung', icon: '📣', scope: 'region',
      desc: 'Großer Auftritt auf dem Marktplatz. Starker Effekt im gewählten Bundesland.' },
    { id: 'plakate', name: 'Plakatkampagne', icon: '🪧', scope: 'region',
      desc: 'Flächendeckend plakatieren. Kosten richten sich nach der Größe des Landes.' },
    { id: 'haustuer', name: 'Haustürwahlkampf', icon: '🚪', scope: 'region',
      desc: 'Billig und persönlich. Wirkt in kleinen Ländern besonders gut.' },
    { id: 'tvspot', name: 'TV-Spot', icon: '📺', scope: 'topic',
      desc: 'Bundesweiter Werbespot zu einem Thema. Teuer, wirkt je nach Kompetenz.' },
    { id: 'social', name: 'Social-Media-Kampagne', icon: '📱', scope: 'topic',
      desc: 'Günstig und viral – kann aber auch einen Shitstorm auslösen.' },
    { id: 'presse', name: 'Pressekonferenz', icon: '🎤', scope: 'topic',
      desc: 'Setzt ein Thema auf die Agenda. Lohnt sich bei deinen Stärken.' },
    { id: 'talkshow', name: 'Talkshow-Auftritt', icon: '🛋️', scope: 'topic',
      desc: 'Kostenlos, aber riskant. Gelingt eher bei Themen, die du beherrschst.' },
    { id: 'spenden', name: 'Spendendinner', icon: '💶', scope: 'none',
      desc: 'Füllt die Wahlkampfkasse auf.' },
    { id: 'betrieb', name: 'Betriebsbesuch', icon: '🏭', scope: 'region',
      desc: 'Werkshalle statt Marktplatz: erreicht Arbeiter und Angestellte, am besten mit Wirtschaftsthemen.' },
    { id: 'buerger', name: 'Bürgerdialog', icon: '🎙️', scope: 'region',
      desc: 'Offene Fragerunde ohne Drehbuch. Gelingt sie, wirkt sie stark – kritische Fragen können aber schiefgehen.' },
    { id: 'infostand', name: 'Infostand', icon: '⛺', scope: 'region',
      desc: 'Billig, kleine Wirkung – aber gut, um Anhänger und Nichtwähler an die Urne zu bringen.' },
    { id: 'erststimme', name: 'Erststimmen-Kampagne', icon: '✖️', scope: 'region',
      desc: 'Wahlkampf für eure Direktkandidatur in einem Wahlkreis: „Beide Stimmen für uns“. Wirkt nur im gewählten Wahlkreis.' },
    { id: 'regional', name: 'Interview im Regionalmedium', icon: '📻', scope: 'region',
      desc: 'Lokalzeitung und Landesradio: kostenlos, wirkt im Land – besonders mit einem Landesthema.' },
    { id: 'briefwahl', name: 'Briefwahl-Kampagne', icon: '✉️', scope: 'none',
      desc: 'Bringt eure Anhänger dazu, früh per Brief zu wählen. Ihre Stimmen sind dann sicher – egal, was kurz vor der Wahl passiert.' },
    { id: 'online', name: 'Online-Werbung mit Zielgruppe', icon: '🎯', scope: 'group',
      desc: 'Bezahlte Anzeigen gezielt für eine Wählergruppe. Kein Shitstorm-Risiko, wirkt genau dort, wo ihr es braucht.' },
    { id: 'angriff', name: 'Gegenangriff / Vergleichskampagne', icon: '🥊', scope: 'rival',
      desc: 'Stellt eine andere Partei bloß und holt Stimmen von ihr. Geht es schief oder tretet ihr nach unten, schadet es euch.' }
  ];

  const POSTAL_START = 5;              // ab dieser Woche werden Briefwahlstimmen abgegeben
  const POSTAL_SPLIT = { 5: 0.2, 6: 0.3, 7: 0.3, 8: 0.2 }; // Anteil der Briefwähler, der in der Woche wählt

  function postalShare(stateId) {
    const P = D.POSTAL || {};
    return ((P.states && (P.states[stateId] || P.states.DE)) || 35) / 100;
  }

  // Wie stark die Wählerschaft einer Partei per Brief wählt (1 = Bundesschnitt): Parteien mit
  // vielen älteren Anhängern profitieren mehr von Briefwahl-Kampagnen.
  function postalAffinity(p) {
    let num = 0;
    let den = 0;
    D.GROUPS.forEach(k => { const w = W[k.id] * FACTOR[k.id][p]; num += w * groupPostal(k.id); den += w; });
    const base = (D.POSTAL && D.POSTAL.states && D.POSTAL.states.DE) || 37;
    // Unterschiede verstärken: Viele Dimensionen haben keine Briefwahl-Daten und mitteln sie sonst weg.
    return den ? Math.max(0.85, Math.min(1.15, 1 + 6 * (num / den / base - 1))) : 1;
  }

  // Briefwahlanteil einer Wählergruppe (in %).
  function groupPostal(groupId) {
    const P = D.POSTAL || {};
    return (P.groups && P.groups[groupId]) || ((P.states && P.states.DE) || 35);
  }

  function actionCost(actionId, stateId, g) {
    switch (actionId) {
      case 'kundgebung': return 0.4;
      case 'plakate': return Math.round((0.2 + 0.12 * (stateById(stateId) || { voters: 3 }).voters) * 10) / 10;
      case 'haustuer': return 0.1;
      case 'erststimme': return 0.15;
      // Sendezeit wird zum Wahltag hin knapp und teuer.
      case 'tvspot': return Math.round((2.5 + 0.25 * ((g && g.week) || 1) - 0.25) * 100) / 100;
      case 'social': return 0.6;
      case 'betrieb': return 0.1;
      case 'infostand': return 0.05;
      case 'briefwahl': return 0.8;
      case 'angriff': return 0.8;
      case 'online': {
        const k = D.GROUPS.find(x => x.id === stateId); // bei 'online' steht hier die Zielgruppe
        return Math.round((0.4 + 2.5 * (k ? k.weight : 0.3)) * 10) / 10;
      }
      default: return 0;
    }
  }

  // Hinweis, wenn voraussichtlich Geld übrig bleibt: mehr in der Kasse, als ein TV-Spot pro
  // verbleibender Woche kosten würde (in der letzten Woche: genug für mindestens einen TV-Spot).
  function moneyWarning(g) {
    if (g.phase !== 'campaign') return null;
    const tv = actionCost('tvspot', null, g);
    const weeksLeft = g.maxWeeks - g.week + 1;
    const lastWeek = weeksLeft <= 1;
    const threshold = lastWeek ? tv : weeksLeft * tv;
    if (lastWeek ? g.money + 1e-9 < threshold : g.money <= threshold) return null;
    return { money: g.money, weeksLeft, lastWeek, tvCost: tv };
  }

  // Vor-Ort-Aktion mit Thema: wirkt besser, wenn das Thema im Land und bei seinen Gruppen zählt
  // und ihr dort kompetent seid. Ohne Thema: 1.
  function localTopicFactor(g, stateId, topic) {
    if (!topic || !topicById(topic)) return 1;
    const w = weightsFor(stateId);
    const fit = D.GROUPS.reduce((s, k) => s + w[k.id] * topicPref(k, topic, stateId), 0);
    const rel = Math.sqrt(g.salience[topic] * TOPIC_IDS.length);
    const interest = fit * rel;
    return Math.max(0.7, Math.min(1.5, 0.72 + 0.3 * interest + 0.2 * compMod(g, topic)));
  }

  // Bundesweit dasselbe Prinzip: Kleine Parteien gewinnen mit einem TV-Spot weniger Punkte als große,
  // und jede weitere bundesweite Themen-Aktion in derselben Woche wirkt schwächer.
  // Größe der Partei: Wirkung wächst mit dem Stimmenanteil, aber abgeschwächt (Exponent < 1).
  const SIZE_EXP = 0.45;
  const sizeFactor = share => Math.max(0.25, Math.min(1.2, 0.1 + 0.9 * Math.pow(Math.max(0, share) / 20, SIZE_EXP)));
  const NAT_SCALE = 1.35;
  const NAT_WEEK_SAT = 0.8;
  function nationalFactor(g, p) {
    const share = nationalShares(g)[p];
    const size = sizeFactor(share);
    const used = (g.natWeek && g.natWeek[p]) || 0;
    return NAT_SCALE * size / (1 + Math.max(0, used) / NAT_WEEK_SAT);
  }

  function noteNational(g, p, d) {
    if (!g.natWeek) g.natWeek = {};
    g.natWeek[p] = (g.natWeek[p] || 0) + Math.max(0, d);
  }

  // Realistische Größenordnung vor Ort: Kleine Parteien gewinnen in absoluten Punkten weniger als
  // große, und wer in einer Woche viel in einem Land macht, stößt an Grenzen (jede weitere Aktion
  // dort wirkt schwächer). Ergebnis: ein konzentrierter Einsatz bringt in einer Woche etwa 1–3 Punkte.
  const REGION_SCALE = 0.7;
  const REGION_WEEK_SAT = 1.0;
  function regionFactor(g, p, stateId) {
    const share = stateShares(g, stateId)[p];
    const size = sizeFactor(share);
    const used = (g.regWeek && g.regWeek[stateId] && g.regWeek[stateId][p]) || 0;
    return REGION_SCALE * size / (1 + Math.max(0, used) / REGION_WEEK_SAT);
  }

  function noteRegion(g, p, stateId, d) {
    if (!g.regWeek) g.regWeek = {};
    if (!g.regWeek[stateId]) g.regWeek[stateId] = {};
    g.regWeek[stateId][p] = (g.regWeek[stateId][p] || 0) + Math.max(0, d);
  }

  // Themen-Aktionen wirken bundesweit, aber stärker in Ländern, in denen das Thema wichtiger ist.
  function spreadTopic(g, p, d, topic) {
    D.STATES.forEach(st => { g.reg[st.id][p] += 0.6 * d * (stateTopicFactor(st.id, topic) - 1); });
  }

  // Drei Szenarien zur Vorbereitung einer Aktion, bevorzugt solche, die der Spieler noch nicht kennt.
  function pickScenarios(g, actionId, n) {
    const list = SC[actionId] || SC[SC_ALIAS[actionId]] || [];
    n = Math.min(n || 3, list.length);
    if (!g.seenScen) g.seenScen = {};
    const seen = g.seenScen[actionId] || [];
    let pool = list.map((x, i) => i).filter(i => seen.indexOf(i) === -1);
    if (pool.length < n) { pool = list.map((x, i) => i); g.seenScen[actionId] = []; }
    const out = [];
    while (out.length < n) {
      const i = pool.splice(Math.floor(rand(g) * pool.length), 1)[0];
      out.push(i);
    }
    g.seenScen[actionId] = (g.seenScen[actionId] || []).concat(out);
    return out;
  }

  // Bürgerfragen zu einem Thema, bevorzugt noch nicht gestellte.
  function pickCitizenQuestions(g, topic, n) {
    const list = CQ[topic] || [];
    n = Math.min(n || 2, list.length);
    if (!g.seenCQ) g.seenCQ = {};
    const seen = g.seenCQ[topic] || [];
    let pool = list.map((x, i) => i).filter(i => seen.indexOf(i) === -1);
    if (pool.length < n) { pool = list.map((x, i) => i); g.seenCQ[topic] = []; }
    const out = [];
    while (out.length < n) out.push(pool.splice(Math.floor(rand(g) * pool.length), 1)[0]);
    g.seenCQ[topic] = (g.seenCQ[topic] || []).concat(out);
    return out;
  }

  // Kompetenz im Thema ändert sich durch Antworten auf Bürgerfragen (gedeckelt je Thema).
  function citizenCompetence(g, topic, right, wrong) {
    if (!g.competence || !topicById(topic)) return 0;
    if (!g.compQ) g.compQ = {};
    const before = g.compQ[topic] || 0;
    const after = Math.max(-CQ_COMP_MAX, Math.min(CQ_COMP_MAX, before + CQ_COMP * (right - wrong)));
    const d = after - before;
    g.compQ[topic] = after;
    g.competence[topic] = Math.max(5, Math.min(95, g.competence[topic] + d));
    return d;
  }

  // Ohne actionId: ob überhaupt noch etwas geht; mit actionId: ob das passende Kontingent reicht.
  function canAct(g, actionId) {
    if (g.phase !== 'campaign' || g.pendingEvent || g.duel) return false;
    if (!actionId) return g.ap > 0 || (g.team || 0) > 0;
    return isTeamAction(actionId) ? (g.team || 0) > 0 : g.ap > 0;
  }

  function spendenAvailable(g) {
    return g.spendWeek !== g.week;
  }

  // Erwarteter Ertrag des nächsten Spendendinners (ohne Zufallsanteil).
  function spendenYield(g) {
    return (0.8 + 0.08 * party(g.party).budget + 0.25) / (1 + 0.35 * (g.spendCount || 0));
  }

  // Thema, das gerade von einer anderen Partei besetzt wird.
  function stolenBy(g, topic) {
    const s = g.steal && g.steal[topic];
    return s && s.until >= g.week ? s.party : null;
  }

  function performAction(g, actionId, target) {
    target = target || {};
    const action = ACTIONS.find(a => a.id === actionId);
    if (!action) return { ok: false, text: 'Unbekannte Aktion.' };
    if (!canAct(g, actionId)) {
      return { ok: false, text: canAct(g) ? (isTeamAction(actionId) ? 'Das Team hat diese Woche keine Einsätze mehr frei.' : 'Die Spitzenkandidatur hat diese Woche keine Termine mehr frei.') : 'Gerade ist keine Aktion möglich.' };
    }
    const st = stateById(target.state);
    const topic = target.topic;
    if (action.scope === 'region' && !st) return { ok: false, text: 'Bitte zuerst ein Bundesland wählen.' };
    if (action.scope === 'topic' && !topicById(topic)) return { ok: false, text: 'Bitte zuerst ein Thema wählen.' };
    if (actionId === 'spenden' && !spendenAvailable(g)) return { ok: false, text: 'Diese Woche gab es schon ein Spendendinner.' };
    if (actionId === 'briefwahl' && g.week < POSTAL_START - 1) return { ok: false, text: 'Die Briefwahlunterlagen werden erst ab Woche ' + (POSTAL_START - 1) + ' verschickt.' };
    const wkT = action.scope === 'region' && target.wk ? WK_BY_NR[target.wk] : null;
    if (wkT && st && wkT.land !== st.id) return { ok: false, text: 'Dieser Wahlkreis liegt nicht in ' + st.name + '.' };
    if (actionId === 'erststimme' && !wkT) return { ok: false, text: 'Bitte zuerst einen Wahlkreis wählen.' };
    const grpT = action.scope === 'group' ? D.GROUPS.find(k => k.id === target.group) : null;
    if (action.scope === 'group' && !grpT) return { ok: false, text: 'Bitte zuerst eine Zielgruppe wählen.' };
    if (action.scope === 'rival' && (!party(target.rival) || target.rival === g.party)) return { ok: false, text: 'Bitte zuerst eine gegnerische Partei wählen.' };
    const cost = actionCost(actionId, action.scope === 'group' ? target.group : target.state, g);
    if (g.money + 1e-9 < cost) return { ok: false, text: 'Dafür reicht das Geld in der Wahlkampfkasse nicht.' };

    const team = isTeamAction(actionId);
    if (team) g.team -= 1; else g.ap -= 1;
    g.money = Math.round((g.money - cost) * 100) / 100;
    const p = g.party;
    // Aktionen zu Kernthemen des Wahlprogramms wirken stärker.
    const thief = action.scope === 'topic' ? stolenBy(g, topic) : null;
    // Vorbereitung (Szenarien): Bilanz −3 … +3, je Punkt ±15 % Wirkung; ohne Vorbereitung −10 %.
    const prep = target.prep === 'skip' ? null : Math.max(-3, Math.min(3, Number(target.prep) || 0));
    const qm = prep === null ? 0.9 : 1 + 0.15 * prep;
    const qc = prep === null ? -0.03 : 0.06 * prep; // Verschiebung von Erfolgschancen
    const natF = action.scope === 'topic' || action.scope === 'group' ? nationalFactor(g, p) : 1;
    const r = reach(g) * (action.scope === 'topic' && isCore(g, topic) ? 1.25 : 1) * (thief ? 0.7 : 1) * qm * (team ? TEAM_EFFECT : 1) * natF;
    // Regionale Aktionen erreichen ihre Zielgruppen schlechter, wenn diese schon umworben sind.
    const localTopic = action.scope === 'region' && topicById(topic) ? topic : null;
    // Vor Ort: optional eine Zielgruppe, die gezielt angesprochen wird.
    const focus = action.scope === 'region' && target.group && D.GROUPS.some(k => k.id === target.group) ? target.group : null;
    if (focus && !(stateWeights(st.id)[focus] > 0)) return { ok: false, text: 'Diese Gruppe gibt es in ' + st.name + ' nicht.' };
    // Vor Ort: Zielgruppe, Thema und Kanal (gedeckelt, damit sich Boni nicht ins Absurde stapeln),
    // dazu Größe der Partei im Land und Sättigung des Landes in dieser Woche.
    const eff = action.scope === 'region'
      ? Math.max(0.5, Math.min(1.4, (focus ? focusFactor(g, actionId, localTopic, st.id, focus) : groupEfficiency(g, p, actionId, localTopic, st.id) * channelFit(actionId, st.id)) *
        localTopicFactor(g, st.id, localTopic))) * regionFactor(g, p, st.id) : 1;
    if (localTopic) changeSalience(g, localTopic, 0.005);
    const about = (localTopic ? ' zum Thema ' + topicById(localTopic).name : '') +
      (focus ? ' für ' + D.GROUPS.find(k => k.id === focus).name : '');
    // Für die Wählerwanderung: Thema und Zielgruppe der Aktion.
    const steerTopic = actionId === 'erststimme' ? null : localTopic || ((action.scope === 'topic' || actionId === 'online') && topicById(topic) ? topic : null);
    const steerGroup = focus || (grpT ? grpT.id : null);
    const shareBefore = steerTopic ? nationalShares(g)[p] : 0;
    const regBefore = st ? g.reg[st.id][p] : 0;
    const pBefore = nationalShares(g)[p];
    // Szene (js/scenes.js): Entscheidungen der Spielerin/des Spielers mit eigenen Folgen.
    const sfx = target.fx || {};
    let text;

    switch (actionId) {
      case 'kundgebung': {
        const d = 1.7 * wear(g, 'kundgebung:' + st.id + ':' + (localTopic || '_')) * r * eff * between(g, 0.7, 1.3);
        g.reg[st.id][p] += d;
        noteRegion(g, p, st.id, d);
        regionGroups(g, p, 0.08 * d, 'kundgebung', localTopic, st.id, focus);
        mobilize(g, p, 0.012 * d, st.id);
        text = pick(g, ['Volle Plätze', 'Begeisterte Menge', 'Solider Auftritt']) +
          ' bei der Kundgebung' + about + ' in ' + st.name + ' (' + fmt(d) + ' Pkt. im Land).';
        break;
      }
      case 'plakate': {
        const d = 1.3 * wear(g, 'plakate:' + st.id + ':' + (localTopic || '_')) * r * eff * between(g, 0.8, 1.2);
        g.reg[st.id][p] += d;
        noteRegion(g, p, st.id, d);
        regionGroups(g, p, 0.05 * d, 'plakate', localTopic, st.id, focus);
        mobilize(g, p, 0.005 * d, st.id);
        text = 'Plakate' + about + ' hängen in ganz ' + st.name + ' (' + fmt(d) + ' Pkt. im Land).';
        break;
      }
      case 'haustuer': {
        const d = (1.0 + 0.6 / Math.sqrt(st.voters)) * wear(g, 'haustuer:' + st.id + ':' + (localTopic || '_')) * r * eff * between(g, 0.7, 1.3);
        g.reg[st.id][p] += d;
        noteRegion(g, p, st.id, d);
        regionGroups(g, p, 0.05 * d, 'haustuer', localTopic, st.id, focus);
        // Haustürwahlkampf ist das beste Mittel gegen Wahlmüdigkeit.
        mobilize(g, p, 0.025 * d, st.id);
        text = 'Ehrenamtliche klingeln' + about + ' an tausenden Türen in ' + st.name + ' (' + fmt(d) + ' Pkt. im Land).';
        break;
      }
      case 'tvspot': {
        const d = addGroups(g, p, Math.max(0.1, (0.5 + 0.8 * compMod(g, topic)) * wear(g, 'tvspot:' + topic) * r * between(g, 0.8, 1.2)), 'tvspot', topic);
        changeSalience(g, topic, 0.03);
        spreadTopic(g, p, d, topic);
        noteNational(g, p, d);
        text = 'Euer TV-Spot zum Thema ' + topicById(topic).name + ' läuft zur besten Sendezeit (' + fmt(d) + ' bundesweit).';
        break;
      }
      case 'social': {
        changeSalience(g, topic, 0.015);
        const storm = sfx.force === 'shitstorm' ? true : sfx.force === 'viral' || sfx.force === 'normal' ? false : rand(g) < Math.max(0.03, 0.25 - 0.1 * compMod(g, topic) - 0.7 * qc);
        if (storm) {
          const d = -addGroups(g, p, -between(g, 0.4, 1.0), 'social', topic);
          spreadTopic(g, p, -d, topic);
          text = 'Shitstorm! Ein Post zum Thema ' + topicById(topic).name + ' geht nach hinten los (' + fmt(-d) + ').';
        } else {
          const d = addGroups(g, p, between(g, 0.3, 0.8) * (sfx.force === 'viral' ? 1.8 : 1) * wear(g, 'social:' + topic) * r, 'social', topic);
          spreadTopic(g, p, d, topic);
          noteNational(g, p, d);
          mobilize(g, p, 0.008 * d);
          text = 'Euer Clip zum Thema ' + topicById(topic).name + ' geht viral (' + fmt(d) + ').';
        }
        break;
      }
      case 'presse': {
        changeSalience(g, topic, 0.045);
        const dp = addGroups(g, p, (0.15 * compMod(g, topic) + 0.1 * (qm - 1)) * (thief ? 0.7 : 1) * natF, 'presse', topic);
        spreadTopic(g, p, dp, topic);
        noteNational(g, p, dp);
        text = 'Pressekonferenz: ' + topicById(topic).name + ' bestimmt jetzt stärker die Debatte.';
        break;
      }
      case 'talkshow': {
        const comp = competenceOf(g, p)[topic];
        const win = sfx.force === 'win' ? true : sfx.force === 'lose' ? false : rand(g) < 0.35 + 0.45 * comp / 100 + qc;
        if (win) {
          const d = addGroups(g, p, 0.7 * wear(g, 'talkshow') * r, 'talkshow', topic);
          spreadTopic(g, p, d, topic);
          noteNational(g, p, d);
          text = 'Starker Talkshow-Auftritt zum Thema ' + topicById(topic).name + ' (' + fmt(d) + ').';
        } else {
          spreadTopic(g, p, addGroups(g, p, -0.5, 'talkshow', topic), topic);
          text = 'In der Talkshow zum Thema ' + topicById(topic).name + ' ins Schwimmen geraten (−0.5).';
        }
        break;
      }
      case 'betrieb': {
        const d = 1.1 * wear(g, 'betrieb:' + st.id + ':' + (localTopic || '_')) * r * eff * between(g, 0.8, 1.2);
        g.reg[st.id][p] += d;
        noteRegion(g, p, st.id, d);
        regionGroups(g, p, 0.08 * d, 'betrieb', localTopic, st.id, focus);
        mobilize(g, p, 0.008 * d, st.id);
        text = 'Betriebsbesuch' + about + ' in ' + st.name + ': Gespräche am Band und in der Kantine (' + fmt(d) + ' Pkt. im Land).';
        break;
      }
      case 'buerger': {
        const cm = localTopic ? compMod(g, localTopic) : 0;
        const w = wear(g, 'buerger:' + st.id + ':' + (localTopic || '_'));
        if (rand(g) < Math.max(0.2, Math.min(0.9, 0.55 + 0.25 * cm + qc))) {
          const d = 1.9 * w * r * eff * between(g, 0.8, 1.2);
          g.reg[st.id][p] += d;
        noteRegion(g, p, st.id, d);
          g.nat[p] += 0.15;
          regionGroups(g, p, 0.1 * d, 'buerger', localTopic, st.id, focus);
          text = 'Der Bürgerdialog' + about + ' in ' + st.name + ' überzeugt – ehrliche Antworten kommen an (' + fmt(d) + ' Pkt. im Land).';
        } else {
          g.reg[st.id][p] -= 0.7;
          g.nat[p] -= 0.15;
          text = 'Beim Bürgerdialog' + about + ' in ' + st.name + ' gerät ' + g.candidate + ' bei kritischen Fragen ins Straucheln (−0.7 im Land).';
        }
        break;
      }
      case 'infostand': {
        const d = 0.55 * wear(g, 'infostand:' + st.id + ':' + (localTopic || '_')) * r * eff * between(g, 0.8, 1.2);
        g.reg[st.id][p] += d;
        noteRegion(g, p, st.id, d);
        regionGroups(g, p, 0.04 * d, 'infostand', localTopic, st.id, focus);
        mobilize(g, p, 0.03 * Math.min(1.5, eff), st.id);
        text = 'Infostände' + about + ' in den Fußgängerzonen von ' + st.name + ': Flyer, Kugelschreiber, viele Gespräche (' + fmt(d) + ' Pkt. im Land).';
        break;
      }
      case 'erststimme': {
        const w = wear(g, 'erststimme:' + wkT.nr);
        const size = Math.min(1.3, sizeFactor(stateShares(g, st.id)[p]) + 0.3);
        const d = 3.5 * w * qm * TEAM_EFFECT * size * between(g, 0.85, 1.15);
        addWk(g, wkT.nr, p, d);
        mobilize(g, p, 0.004, st.id);
        text = 'Erststimmen-Kampagne im Wahlkreis ' + wkT.name + ': „Beide Stimmen für uns“ (' + fmt(d) + ' Punkte bei den Erststimmen).';
        break;
      }
      case 'regional': {
        const d = 0.9 * wear(g, 'regional:' + st.id + ':' + (localTopic || '_')) * r * eff * (localTopic ? 1 : 0.8) * between(g, 0.8, 1.2);
        g.reg[st.id][p] += d;
        noteRegion(g, p, st.id, d);
        regionGroups(g, p, 0.05 * d, 'regional', localTopic, st.id, focus);
        text = 'Interview' + about + ' in Lokalzeitung und Landesradio von ' + st.name + ' (' + fmt(d) + ' Pkt. im Land).';
        break;
      }
      case 'briefwahl': {
        const w = wear(g, 'briefwahl');
        g.postalPush[p] = Math.min(0.25, (g.postalPush[p] || 0) + 0.06 * w * qm * postalAffinity(p));
        g.mobPerm[p] = (g.mobPerm[p] || 0) + 0.005 * w * mobPotential(p);
        text = 'Briefwahl-Kampagne: Eure Anhänger bestellen ihre Unterlagen und wählen früh – diese Stimmen sind sicher.';
        break;
      }
      case 'online': {
        const k = grpT;
        const tp = topic && topicById(topic) ? topic : null;
        const fit = tp ? Math.max(0.7, Math.min(1.5, 1 + 0.3 * (topicPref(k, tp) - 1) + 0.3 * compMod(g, tp))) : 1;
        const delta = 3.2 * qm * TEAM_EFFECT * natF * (1 - k.weight) * wear(g, 'online:' + k.id) * reach(g) * groupSat(g, k.id, p, tp, null, 'online') * fit * between(g, 0.85, 1.15);
        if (rand(g) < Math.max(0.01, 0.07 - 0.3 * qc)) {
          g.nat[p] -= 0.3;
          text = 'Datenschutz-Debatte um eure Online-Anzeigen für ' + k.name + ' (−0.3).';
          break;
        }
        g.nat[p] += k.weight * delta;
        noteNational(g, p, k.weight * delta);
        g.grp[k.id][p] += delta * (1 - k.weight);
        addSat(g, k.id, tp, delta * (1 - k.weight), null, 'online');
        if (tp) changeSalience(g, tp, 0.005);
        text = 'Online-Anzeigen' + (tp ? ' zum Thema ' + topicById(tp).name : '') + ' erreichen ' + k.name + ' (' + fmt(delta) + ' in der Gruppe, ' + fmt(k.weight * delta) + ' bundesweit).';
        break;
      }
      case 'angriff': {
        const rv = target.rival;
        const tp = topic && topicById(topic) ? topic : null;
        const shares = nationalShares(g);
        const adv = tp ? (competenceOf(g, p)[tp] - competenceOf(g, rv)[tp]) / 50 : 0;
        const down = shares[rv] < 0.6 * shares[p] ? 0.15 : 0;
        const chance = Math.max(0.15, Math.min(0.9, 0.55 + 0.25 * adv - down + qc));
        const w = wear(g, 'angriff:' + rv);
        g.grudge = g.grudge || {};
        if (g.rivals && g.rivals[rv]) g.rivals[rv].feud = Math.min(5, (g.rivals[rv].feud || 0) + 1);
        g.grudge[rv] = g.week;
        if (sfx.force === 'win' || (sfx.force !== 'lose' && rand(g) < chance)) {
          const d = between(g, 0.6, 1.1) * w * qm * TEAM_EFFECT;
          g.nat[rv] -= d;
          g.nat[p] += 0.35 * d;
          text = 'Eure Kampagne gegen ' + party(rv).name + (tp ? ' beim Thema ' + topicById(tp).name : '') + ' sitzt (' + party(rv).short + ' ' + fmt(-d) + ', ihr ' + fmt(0.35 * d) + ').';
        } else {
          const d = between(g, 0.4, 0.7);
          g.nat[p] -= d;
          g.nat[rv] += 0.2;
          text = 'Der Angriff auf ' + party(rv).name + ' geht nach hinten los – die Kampagne wirkt ' + (down ? 'kleinlich' : 'unfair') + ' (' + fmt(-d) + ').';
        }
        break;
      }
      case 'spenden': {
        // Einmal pro Woche; die Spenderkreise sind irgendwann ausgeschöpft.
        const m = Math.round((0.8 + 0.08 * party(p).budget + between(g, 0, 0.5)) / (1 + 0.35 * (g.spendCount || 0)) * (sfx.money || qm) * 10) / 10;
        g.money = Math.round((g.money + m) * 100) / 100;
        g.spendCount = (g.spendCount || 0) + 1;
        g.spendWeek = g.week;
        text = 'Das Spendendinner bringt ' + m.toFixed(1).replace('.', ',') + ' Mio. € ein.';
        break;
      }
    }
    if (thief) text += ' ' + party(thief).name + ' macht euch das Thema streitig.';
    // Folgen der Szene: Mobilisierung, Bekanntheit, Beliebtheit, Zielgruppen, virale Clips, Spenden mit Haken.
    if (sfx.mob) mobilize(g, p, sfx.mob, st ? st.id : undefined);
    if (sfx.known || sfx.like) candAdjust(g, sfx.like || 0, sfx.known || 0);
    if (sfx.groups) Object.keys(sfx.groups).forEach(k => { if (g.grp[k]) g.grp[k][p] += 0.5 * sfx.groups[k] * qm; });
    if (sfx.viral) { g.nat[p] += 0.4 * sfx.viral; text += sfx.viral > 0 ? ' Ein Clip geht viral!' : ' Ein Ausschnitt geht viral – gegen euch.'; }
    if (sfx.lobby && LB) { LB.addRel(g, sfx.lobby, sfx.scandal ? 12 : 3); if (sfx.scandal) LB.addNear(g, 8); }
    if (sfx.scandal && rand(g) < sfx.scandal) { g.nat[p] -= 0.5; candAdjust(g, -0.3, 0); text += ' Später wird bekannt, welche Bedingung an die Spende geknüpft war – Empörung (−0,5).'; }
    // Wahlkreis-Fokus: Ein Teil der Wirkung im Land fließt gezielt in die Erststimme dort.
    if (wkT && actionId !== 'erststimme' && st) {
      const gain = g.reg[st.id][p] - regBefore;
      if (gain > 0) {
        g.reg[st.id][p] -= 0.3 * gain;
        const d = 0.3 * gain * Math.min(16, (WK_BY_STATE[st.id] || []).length) * 0.5;
        addWk(g, wkT.nr, p, d);
        text += ' Schwerpunkt Wahlkreis ' + wkT.name + ' (' + fmt(d) + ' bei den Erststimmen).';
      }
    }
    if (steerTopic) {
      // Aktion in einem Land: Die Stimmen kommen dort von der Partei, die das Thema besetzt.
      const regional = st && action.scope === 'region';
      const from = regional ? steerVotes(g, p, steerTopic, steerGroup, g.reg[st.id][p] - regBefore, st.id) : steerVotes(g, p, steerTopic, steerGroup, nationalShares(g)[p] - shareBefore);
      if (from) text += ' Ihr holt dabei vor allem Wähler ' + partyGen(from) + (regional ? ' in ' + st.name : '') + (partyTopics(g, from).indexOf(steerTopic) !== -1 ? ' – ' + topicById(steerTopic).name + ' ist deren Kernthema' : '') + '.';
    }
    // Bürgerfragen beantwortet: Kompetenz im Thema steigt oder sinkt.
    if (target.cq && localTopic) {
      const dc = citizenCompetence(g, localTopic, target.cq.right || 0, target.cq.wrong || 0);
      if (dc) text += ' Kompetenz ' + topicById(localTopic).name + ' ' + (dc > 0 ? '+' : '−') + Math.abs(dc) + '.';
    }
    const dShare = nationalShares(g)[p] - pBefore;
    candAfterAction(g, actionId, dShare, qm);
    journal(g, 'a', action.name + (st && action.scope === 'region' ? ' in ' + st.name : '') + (topicById(topic) && action.scope !== 'region' ? ' zu ' + topicById(topic).name : '') +
      (localTopic ? ' zu ' + topicById(localTopic).name : '') + (wkT ? ' (WK ' + wkT.name + ')' : ''), dShare);
    addLog(g, 'action', text);
    // Bilder der Woche für den Rückblick am Wochenende.
    if (sfx.headline) {
      g.shots = (g.shots || []).filter(x => x.w >= g.week - 1);
      g.shots.push({ w: g.week, icon: action.icon, title: action.name, text: sfx.headline, d: Math.round(dShare * 100) / 100 + 0 });
    }
    return { ok: true, text, info: { dShare, stateShare: st ? stateShares(g, st.id)[p] : null } };
  }

  // ---------- Ereignisse ----------

  function otherParty(g) {
    return pick(g, shownIds(g).filter(p => p !== g.party));
  }

  const EVENTS = [
    {
      id: 'hochwasser', title: 'Jahrhunderthochwasser an der Elbe',
      text: 'Nach tagelangem Starkregen stehen Teile Sachsens und Sachsen-Anhalts unter Wasser. Klimaschutz ist plötzlich wieder Thema Nummer eins.',
      before: g => changeSalience(g, 'klima', 0.06),
      choices: [
        { label: 'In Gummistiefeln ins Krisengebiet', hint: '−0,3 Mio. €, Plus im Osten',
          apply: g => { g.money -= 0.3; ['SN', 'ST', 'BB'].forEach(s => { g.reg[s][g.party] += 1.5; }); g.nat[g.party] += 0.2; return 'Die Bilder vom Deich gehen um die Welt.'; } },
        { label: 'Klima-Sofortprogramm fordern', hint: 'Wirkt je nach Klimakompetenz',
          apply: g => { const d = 1.0 * compMod(g, 'klima'); g.nat[g.party] += d; return d >= 0 ? 'Die Forderung kommt gut an (' + fmt(d) + ').' : 'Das nimmt euch niemand ab (' + fmt(d) + ').'; } },
        { label: 'Zurückhaltung üben', hint: 'Kein Risiko',
          apply: () => 'Ihr haltet euch im Hintergrund.' }
      ]
    },
    {
      id: 'rezession', title: 'Konjunkturprognose gesenkt',
      text: 'Die Wirtschaftsinstitute rechnen mit einer Rezession. Die Sorge um Arbeitsplätze wächst.',
      before: g => changeSalience(g, 'wirtschaft', 0.06),
      choices: [
        { label: 'Steuersenkungen versprechen', hint: 'Wirkt je nach Wirtschaftskompetenz',
          apply: g => { const d = 0.2 + 0.9 * compMod(g, 'wirtschaft'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Investitionsprogramm fordern', hint: 'Wirkt je nach Sozialkompetenz',
          apply: g => { const d = 0.2 + 0.7 * compMod(g, 'soziales'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Ruhe bewahren', hint: 'Kein Risiko', apply: () => 'Ihr mahnt zur Besonnenheit.' }
      ]
    },
    {
      id: 'spendenaffaere', title: 'Fragwürdige Großspende',
      text: 'Ein Magazin berichtet über eine gestückelte Großspende an eure Partei. Die Presse wartet auf eine Stellungnahme.',
      choices: [
        { label: 'Volle Transparenz', hint: '−1 Mio. € Rückzahlung, kleiner Imageschaden',
          apply: g => { g.money = Math.max(0, g.money - 1); g.nat[g.party] -= 0.4; return 'Die Spende wird zurückgezahlt. Die Geschichte ist schnell vergessen.'; } },
        { label: 'Aussitzen', hint: 'Riskant',
          apply: g => { if (rand(g) < 0.5) return 'Glück gehabt – niemand greift das Thema auf.'; g.nat[g.party] -= 2.0; return 'Neue Enthüllungen! Die Affäre dominiert die Schlagzeilen (−2.0).'; } }
      ]
    },
    {
      id: 'fauxpas', title: 'Patzer im Interview',
      text: p => p.candidate + ' hat sich im Morgenmagazin verplappert. Der Clip geht viral.',
      choices: [
        { label: 'Sofort entschuldigen', hint: 'Kleiner Verlust',
          apply: g => { g.nat[g.party] -= 0.3; return 'Die Entschuldigung wird akzeptiert (−0.3).'; } },
        { label: 'Offensiv verteidigen', hint: 'Hohes Risiko',
          apply: g => { if (rand(g) < 0.4) { g.nat[g.party] += 0.6; return 'Trotzreaktion: Eure Anhänger stehen hinter euch (+0.6).'; } g.nat[g.party] -= 1.2; return 'Das macht alles noch schlimmer (−1.2).'; } },
        { label: 'Mit Humor nehmen', hint: 'Mittleres Risiko',
          apply: g => { if (rand(g) < 0.6) { g.nat[g.party] += 0.4; return 'Die Selbstironie kommt an (+0.4).'; } g.nat[g.party] -= 0.6; return 'Der Witz zündet nicht (−0.6).'; } }
      ]
    },
    {
      id: 'promi', title: 'Prominente Unterstützung',
      text: 'Ein bekannter Musiker ruft in seiner Show dazu auf, euch zu wählen.',
      choices: [
        { label: 'Gemeinsamer Auftritt', hint: '−0,3 Mio. €, größerer Effekt',
          later: true,
          apply: g => { g.money -= 0.3; g.nat[g.party] += 1.0; if (rand(g) < 0.35) schedule(g, 'promi2', 2, 3); return 'Das gemeinsame Konzert wird ein Erfolg (+1.0).'; } },
        { label: 'Dankend annehmen', hint: 'Kleiner Effekt',
          apply: g => { g.nat[g.party] += 0.5; return 'Die Unterstützung hilft (+0.5).'; } }
      ]
    },
    {
      id: 'kriminalstatistik', title: 'Neue Kriminalstatistik',
      text: 'Die Polizeiliche Kriminalstatistik zeigt mehr Gewaltdelikte. Innere Sicherheit rückt in den Fokus.',
      before: g => { changeSalience(g, 'sicherheit', 0.05); changeSalience(g, 'migration', 0.02); },
      choices: [
        { label: 'Härtere Strafen fordern', hint: 'Wirkt je nach Sicherheitskompetenz',
          apply: g => { const d = 0.9 * compMod(g, 'sicherheit') + 0.1; g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Mehr Polizei und Prävention', hint: 'Solide',
          apply: g => { g.nat[g.party] += 0.3; return 'Ein ausgewogener Vorschlag (+0.3).'; } },
        { label: 'Vor Panikmache warnen', hint: 'Riskant',
          apply: g => { const d = rand(g) < 0.45 ? 0.5 : -0.6; g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } }
      ]
    },
    {
      id: 'bahnstreik', title: 'Bundesweiter Bahnstreik',
      text: 'Die Gewerkschaft legt den Bahnverkehr für drei Tage lahm. Pendler sind genervt, die Tarifdebatte kocht.',
      before: g => { changeSalience(g, 'soziales', 0.04); changeSalience(g, 'wirtschaft', 0.02); },
      choices: [
        { label: 'Solidarität mit den Streikenden', hint: 'Wirkt je nach Sozialkompetenz',
          apply: g => { const d = 0.8 * compMod(g, 'soziales'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Streikrecht einschränken', hint: 'Wirkt je nach Wirtschaftskompetenz',
          apply: g => { const d = 0.8 * compMod(g, 'wirtschaft') - 0.2; g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Neutral bleiben', hint: 'Kein Risiko', apply: () => 'Ihr haltet euch raus.' }
      ]
    },
    {
      id: 'hacker', title: 'Hackerangriff auf Behörden',
      text: 'Ein Cyberangriff legt Bürgerämter in mehreren Ländern lahm. Wie digital ist Deutschland eigentlich?',
      before: g => changeSalience(g, 'digitales', 0.06),
      choices: [
        { label: 'Digitalisierungsoffensive fordern', hint: 'Wirkt je nach Digitalkompetenz',
          apply: g => { const d = 1.0 * compMod(g, 'digitales') + 0.1; g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Ignorieren', hint: 'Kein Risiko', apply: () => 'Das Thema verschwindet bald wieder.' }
      ]
    },
    {
      id: 'pisa', title: 'PISA-Schock',
      text: 'Deutschlands Schülerinnen und Schüler schneiden so schlecht ab wie nie. Eltern sind alarmiert.',
      before: g => changeSalience(g, 'bildung', 0.06),
      choices: [
        { label: 'Milliarden-Bildungsoffensive', hint: '−0,3 Mio. € für Kampagne',
          apply: g => { g.money -= 0.3; const d = 0.3 + 0.8 * compMod(g, 'bildung'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Bildung ist Ländersache', hint: 'Kein Risiko', apply: () => 'Ihr verweist auf den Föderalismus.' }
      ]
    },
    {
      id: 'energiepreise', title: 'Strompreise explodieren',
      text: 'Die Energiepreise steigen kräftig. Viele Haushalte fürchten die nächste Abrechnung.',
      before: g => { changeSalience(g, 'klima', 0.03); changeSalience(g, 'soziales', 0.03); changeSalience(g, 'wirtschaft', 0.02); },
      choices: [
        { label: 'Strompreisdeckel fordern', hint: 'Wirkt je nach Sozialkompetenz – wer bezahlt das?', later: true,
          apply: g => { const d = 0.4 + 0.7 * compMod(g, 'soziales'); g.nat[g.party] += d; if (g.finance !== 'solid' && rand(g) < 0.65) schedule(g, 'deckel2', 2, 3); return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Erneuerbare schneller ausbauen', hint: 'Wirkt je nach Klimakompetenz',
          apply: g => { const d = 0.2 + 0.7 * compMod(g, 'klima'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Auf den Markt vertrauen', hint: 'Wirkt je nach Wirtschaftskompetenz',
          apply: g => { const d = 0.7 * compMod(g, 'wirtschaft'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } }
      ]
    },
    {
      id: 'rente', title: 'Rentenkommission legt Bericht vor',
      text: 'Die Experten empfehlen ein späteres Renteneintrittsalter. Die Empörung ist groß.',
      before: g => changeSalience(g, 'soziales', 0.06),
      choices: [
        { label: 'Rentenniveau garantieren', hint: 'Wirkt je nach Sozialkompetenz – teures Versprechen', later: true,
          apply: g => { const d = 0.3 + 0.9 * compMod(g, 'soziales'); g.nat[g.party] += d; if (rand(g) < (g.finance === 'over' ? 0.8 : g.finance === 'ok' ? 0.45 : 0.15)) schedule(g, 'rente2', 2, 3); return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Ehrlich sein: Wir müssen länger arbeiten', hint: 'Mutig, eher unpopulär',
          apply: g => { const d = 0.5 * compMod(g, 'wirtschaft') - 0.5; g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } }
      ]
    },
    {
      id: 'grossspende', title: 'Unternehmer bietet Spende an',
      text: 'Ein Immobilienunternehmer möchte euren Wahlkampf mit 2,5 Mio. € unterstützen. Über seine Firmen ist wenig bekannt.',
      choices: [
        { label: 'Annehmen', hint: '+2,5 Mio. € – die Herkunft ist undurchsichtig', later: true,
          apply: g => { g.money += 2.5; if (rand(g) < 0.6) schedule(g, 'spendenaffaere2', 2, 4); return 'Die Wahlkampfkasse ist gut gefüllt (+2,5 Mio. €).'; } },
        { label: 'Ablehnen', hint: 'Kleiner Imagegewinn',
          apply: g => { g.nat[g.party] += 0.2; return 'Unabhängigkeit wird honoriert (+0.2).'; } }
      ]
    },
    {
      id: 'umfragehoch', title: 'Überraschendes Umfragehoch',
      text: 'Eine neue Umfrage sieht euch deutlich im Aufwind. Die Medien sprechen von einem „Momentum“.',
      choices: [
        { label: 'Weiter so!', hint: '+0,6', apply: g => { g.nat[g.party] += 0.6; return 'Rückenwind für den Wahlkampf (+0.6).'; } }
      ]
    },
    {
      id: 'parteitag', title: 'Offener Flügelstreit',
      text: 'Zwei Parteiflügel liefern sich in Interviews einen offenen Schlagabtausch. Die Kameras laufen.',
      choices: [
        { label: 'Machtwort sprechen', hint: 'Riskant',
          apply: g => { if (rand(g) < 0.6) { g.nat[g.party] += 0.3; return 'Führungsstärke bewiesen (+0.3).'; } g.nat[g.party] -= 0.8; return 'Der Streit eskaliert (−0.8).'; } },
        { label: 'Kompromiss suchen', hint: 'Kleiner Verlust',
          apply: g => { g.nat[g.party] -= 0.2; return 'Ein Formelkompromiss beruhigt die Lage (−0.2).'; } }
      ]
    },
    {
      id: 'migrationsgipfel', title: 'Migrationsgipfel im Kanzleramt',
      text: 'Bund und Länder streiten über die Verteilung von Geflüchteten. Das Thema bestimmt die Talkshows.',
      before: g => changeSalience(g, 'migration', 0.06),
      choices: [
        { label: 'Begrenzung fordern', hint: 'Wirkt je nach Migrationskompetenz',
          apply: g => { const d = 0.9 * compMod(g, 'migration') + 0.1; g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Integration in den Vordergrund stellen', hint: 'Wirkt je nach Sozialkompetenz',
          apply: g => { const d = 0.5 * compMod(g, 'soziales'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Über andere Themen reden', hint: 'Senkt die Bedeutung des Themas',
          apply: g => { changeSalience(g, 'migration', -0.04); return 'Ihr versucht, die Debatte zu drehen.'; } }
      ]
    },
    {
      id: 'gegnerskandal', title: 'Skandal bei der Konkurrenz',
      text: 'Bei einer anderen Partei ist eine peinliche Chatgruppe aufgeflogen.',
      before: g => { g.eventTarget = otherParty(g); g.nat[g.eventTarget] -= 1.5; },
      choices: [
        { label: 'Genüsslich nachtreten', hint: 'Riskant',
          apply: g => { if (rand(g) < 0.5) { g.nat[g.party] += 0.5; return 'Treffer! (+0.5)'; } g.nat[g.party] -= 0.4; return 'Das wirkt kleinlich (−0.4).'; } },
        { label: 'Fair bleiben', hint: 'Kleiner Imagegewinn',
          apply: g => { g.nat[g.party] += 0.2; return 'Souverän (+0.2).'; } }
      ]
    },
    {
      id: 'mieten', title: 'Mietenexplosion in den Großstädten',
      text: 'Neue Zahlen zeigen: In Berlin, Hamburg und München sind die Angebotsmieten binnen eines Jahres um über zehn Prozent gestiegen.',
      before: g => changeSalience(g, 'wohnen', 0.06),
      choices: [
        { label: 'Mietenstopp fordern', hint: 'Wirkt je nach Wohnkompetenz, Plus in den Stadtstaaten',
          apply: g => { const d = 0.2 + 0.8 * compMod(g, 'wohnen'); g.nat[g.party] += d; ['BE', 'HH', 'HB'].forEach(s => { g.reg[s][g.party] += 1.0; }); return 'Reaktion der Wähler: ' + fmt(d) + ', in den Stadtstaaten noch mehr.'; } },
        { label: 'Bauoffensive ankündigen', hint: 'Wirkt je nach Wirtschaftskompetenz',
          apply: g => { const d = 0.2 + 0.6 * compMod(g, 'wirtschaft'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Auf die Länder verweisen', hint: 'Kein Risiko', apply: () => 'Ihr verweist auf die Zuständigkeit der Länder.' }
      ]
    },
    {
      id: 'drohnen', title: 'Drohnen über Bundeswehr-Standorten',
      text: 'Unbekannte Drohnen kreisen tagelang über Kasernen und Flughäfen. Die Frage, wie wehrhaft Deutschland ist, beherrscht die Nachrichten.',
      before: g => changeSalience(g, 'verteidigung', 0.06),
      choices: [
        { label: 'Sofortprogramm Luftverteidigung fordern', hint: 'Wirkt je nach Verteidigungskompetenz, im Osten weniger',
          apply: g => { const d = 0.2 + 0.9 * compMod(g, 'verteidigung'); g.nat[g.party] += d; D.STATES.filter(s => s.east).forEach(s => { g.reg[s.id][g.party] -= 0.6; }); return 'Reaktion der Wähler: ' + fmt(d) + ', im Osten verhaltener.'; } },
        { label: 'Zur Besonnenheit mahnen', hint: 'Plus im Osten, bundesweit kleines Minus',
          apply: g => { g.nat[g.party] -= 0.2; D.STATES.filter(s => s.east).forEach(s => { g.reg[s.id][g.party] += 1.0; }); return 'Im Osten kommt das gut an, im Westen wirkt es zögerlich.'; } },
        { label: 'Auf die Regierung verweisen', hint: 'Kein Risiko', apply: () => 'Ihr verweist auf die Verantwortung der Regierung.' }
      ]
    },
    {
      id: 'klinik', title: 'Kreiskrankenhaus vor dem Aus',
      text: 'Bundesweit melden Kliniken Insolvenz an, in vielen Kreisen droht die Notaufnahme zu schließen. Pflegekräfte demonstrieren vor dem Gesundheitsministerium.',
      before: g => changeSalience(g, 'gesundheit', 0.06),
      choices: [
        { label: 'Rettungsschirm für Kliniken fordern', hint: 'Wirkt je nach Gesundheitskompetenz',
          apply: g => { const d = 0.3 + 0.9 * compMod(g, 'gesundheit'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Mit Pflegekräften demonstrieren', hint: '−0,2 Mio. €, solide Wirkung',
          apply: g => { g.money -= 0.2; g.nat[g.party] += 0.4; return 'Die Bilder mit den Pflegekräften kommen an (+0,4).'; } },
        { label: 'Strukturreform verteidigen', hint: 'Riskant',
          apply: g => { const d = rand(g) < 0.4 ? 0.4 : -0.5; g.nat[g.party] += d; return d > 0 ? 'Die Argumente überzeugen (+0,4).' : 'Das wirkt kaltherzig (−0,5).'; } }
      ]
    },
    {
      id: 'bruecke', title: 'Autobahnbrücke gesperrt',
      text: 'Wegen Einsturzgefahr wird eine wichtige Autobahnbrücke gesperrt, gleichzeitig fallen bei der Bahn tausende Züge aus. Pendler stehen im Dauerstau.',
      before: g => changeSalience(g, 'verkehr', 0.06),
      choices: [
        { label: 'Sanierungsoffensive ankündigen', hint: 'Wirkt je nach Verkehrskompetenz',
          apply: g => { const d = 0.2 + 0.8 * compMod(g, 'verkehr'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Vor Ort im Stau stehen', hint: '−0,2 Mio. €, Plus in NRW',
          apply: g => { g.money -= 0.2; g.reg.NW[g.party] += 1.2; g.nat[g.party] += 0.1; return 'Das Video aus dem Stau geht viral – vor allem in NRW.'; } },
        { label: 'Der Regierung die Schuld geben', hint: 'Kleiner, sicherer Gewinn',
          apply: g => { g.nat[g.party] += 0.15; return 'Ein paar Punkte gegen die Regierung (+0,15).'; } }
      ]
    },
    {
      id: 'eugipfel', title: 'Streit beim EU-Gipfel',
      text: 'Beim EU-Gipfel in Brüssel eskaliert der Streit über neue gemeinsame Schulden und die Agrarförderung. Deutschland soll mehr zahlen.',
      before: g => changeSalience(g, 'europa', 0.06),
      choices: [
        { label: 'Für ein starkes Europa werben', hint: 'Wirkt je nach Europakompetenz, im Osten weniger',
          apply: g => { const d = 0.2 + 0.8 * compMod(g, 'europa'); g.nat[g.party] += d; D.STATES.filter(s => s.east).forEach(s => { g.reg[s.id][g.party] -= 0.5; }); return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: '„Kein deutsches Geld mehr nach Brüssel!“', hint: 'Plus im Osten, Risiko im Westen',
          apply: g => { D.STATES.filter(s => s.east).forEach(s => { g.reg[s.id][g.party] += 1.2; }); const d = rand(g) < 0.5 ? 0.1 : -0.4; g.nat[g.party] += d; return 'Im Osten Applaus, bundesweit ' + fmt(d) + '.'; } },
        { label: 'Nicht einmischen', hint: 'Kein Risiko', apply: () => 'Ihr haltet euch aus dem Streit heraus.' }
      ]
    },
    {
      id: 'kita', title: 'Kita-Notstand',
      text: 'Hunderttausende Kitaplätze fehlen, viele Einrichtungen kürzen wegen Personalmangel die Öffnungszeiten. Eltern gehen auf die Straße.',
      before: g => changeSalience(g, 'familie', 0.06),
      choices: [
        { label: 'Kita-Garantie versprechen', hint: 'Wirkt je nach Familienkompetenz', later: true,
          apply: g => { const d = 0.3 + 0.8 * compMod(g, 'familie'); g.nat[g.party] += d; if (compMod(g, 'familie') > 0 && rand(g) < 0.6) schedule(g, 'kita2', 2, 3); return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Familiengeld statt Kita fordern', hint: 'Riskant',
          apply: g => { const d = rand(g) < 0.45 ? 0.5 : -0.4; g.nat[g.party] += d; return d > 0 ? 'Trifft einen Nerv (+0,5).' : 'Die Eltern fühlen sich nicht ernst genommen (−0,4).'; } },
        { label: 'Auf die Kommunen verweisen', hint: 'Kein Risiko', apply: () => 'Ihr verweist auf die Zuständigkeit der Kommunen.' }
      ]
    },
    {
      id: 'bauern', title: 'Bauernproteste legen Städte lahm',
      text: 'Tausende Traktoren blockieren Innenstädte und Autobahnauffahrten. Die Landwirte protestieren gegen Kürzungen und neue Auflagen.',
      before: g => changeSalience(g, 'land', 0.06),
      choices: [
        { label: 'Solidarität mit den Bauern', hint: 'Wirkt je nach Agrarkompetenz, Plus auf dem Land',
          apply: g => { const d = 0.1 + 0.7 * compMod(g, 'land'); g.nat[g.party] += d; ['NI', 'MV', 'BB', 'SH', 'BY'].forEach(s => { g.reg[s][g.party] += 0.8; }); return 'Reaktion der Wähler: ' + fmt(d) + ', in den Agrarländern mehr.'; } },
        { label: 'Blockaden kritisieren', hint: 'Plus in den Städten, Minus auf dem Land',
          apply: g => { ['BE', 'HH', 'HB'].forEach(s => { g.reg[s][g.party] += 1.0; }); ['NI', 'MV', 'BB', 'SH', 'BY'].forEach(s => { g.reg[s][g.party] -= 0.8; }); return 'Die Städter applaudieren, auf dem Land seid ihr unten durch.'; } },
        { label: 'Schweigen', hint: 'Kein Risiko', apply: () => 'Ihr wartet ab, bis die Traktoren abgezogen sind.' }
      ]
    },
    {
      id: 'verfassung', title: 'Debatte um das Verfassungsgericht',
      text: 'Ein Gutachten warnt: Mit einfacher Mehrheit könnten Extremisten das Bundesverfassungsgericht lahmlegen. Wie wehrhaft ist die Demokratie?',
      before: g => changeSalience(g, 'demokratie', 0.06),
      choices: [
        { label: 'Grundgesetz schützen', hint: 'Wirkt je nach Demokratiekompetenz',
          apply: g => { const d = 0.2 + 0.7 * compMod(g, 'demokratie'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Volksentscheide fordern', hint: 'Plus im Osten, bundesweit unsicher',
          apply: g => { D.STATES.filter(s => s.east).forEach(s => { g.reg[s.id][g.party] += 0.8; }); const d = rand(g) < 0.5 ? 0.2 : -0.2; g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + ', im Osten mehr.'; } },
        { label: 'Keine Stellungnahme', hint: 'Kein Risiko', apply: () => 'Ihr überlasst die Debatte den Juristen.' }
      ]
    },
    {
      id: 'steuerschaetzung', title: 'Steuerschätzung: Milliardenloch',
      text: 'Die Steuerschätzer korrigieren ihre Prognose deutlich nach unten. Im Bundeshaushalt fehlen Milliarden – alle Wahlversprechen stehen auf dem Prüfstand.',
      before: g => { changeSalience(g, 'finanzen', 0.06); changeSalience(g, 'wirtschaft', 0.02); },
      choices: [
        { label: 'Solide Finanzen versprechen', hint: 'Wirkt je nach Finanzkompetenz',
          apply: g => { const d = 0.2 + 0.8 * compMod(g, 'finanzen'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Reiche zur Kasse bitten', hint: 'Wirkt je nach Sozialkompetenz',
          apply: g => { const d = 0.1 + 0.7 * compMod(g, 'soziales'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'An den Versprechen festhalten', hint: 'Wirkt je nach Finanzierung des Programms',
          apply: g => { const d = { over: -0.6, ok: 0.1, solid: 0.4 }[g.finance] || 0; g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } }
      ]
    },
    {
      id: 'patzer', title: 'Peinlicher Patzer im Interview',
      cond: g => !!g.gaffe,
      text: g => 'Im Interview zum Kernthema „' + topicById(g.gaffe).name + '“ liegt eure Spitzenkandidatur bei einfachen Fakten daneben. ' +
        'Das Video verbreitet sich rasend schnell, eure Umfragewerte geben nach (−0.4).',
      before: g => { g.nat[g.party] -= 0.4; changeSalience(g, g.gaffe, 0.02); },
      choices: [
        { label: 'Fehler offen eingestehen', hint: 'Kleiner, sicherer Schaden',
          apply: g => { g.nat[g.party] -= 0.2; return 'Ehrlichkeit wird anerkannt, ganz vergessen ist der Patzer nicht (−0.2).'; } },
        { label: 'Als Versprecher abtun', hint: 'Riskant',
          apply: g => { if (rand(g) < 0.5) { g.nat[g.party] += 0.1; return 'Die Erklärung verfängt, die Debatte ebbt ab (+0.1).'; } g.nat[g.party] -= 0.8; return 'Ein zweites Video zeigt denselben Fehler – jetzt wird es richtig peinlich (−0.8).'; } },
        { label: 'Den Medien eine Kampagne vorwerfen', hint: 'Kostet Kompetenz beim Thema',
          apply: g => { g.competence[g.gaffe] = Math.max(5, g.competence[g.gaffe] - 8); g.nat[g.party] -= 0.1; return 'Die eigenen Anhänger jubeln, doch beim Thema verliert ihr an Glaubwürdigkeit.'; } }
      ]
    },
    {
      id: 'faktencheck', title: 'Faktencheck zum Wahlprogramm',
      text: g => 'Ökonomen haben euer Wahlprogramm „' + g.program.slogan + '“ durchgerechnet. ' +
        (g.finance === 'over' ? 'Ihr Urteil: Die Versprechen sind nicht gegenfinanziert.'
          : g.finance === 'solid' ? 'Ihr Urteil: Solide gerechnet, sogar mit Spielraum.'
            : 'Ihr Urteil: Ehrgeizig, aber machbar.'),
      choices: [
        { label: 'Offensiv verteidigen', hint: 'Wirkt je nach Finanzierung des Programms',
          apply: g => { const d = { over: -0.8, ok: 0.2, solid: 0.6 }[g.finance] || 0; g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Das Thema wechseln', hint: 'Begrenzt den Schaden',
          apply: g => { const d = g.finance === 'over' ? -0.3 : 0; g.nat[g.party] += d; return d ? 'Ganz los werdet ihr die Debatte nicht (' + fmt(d) + ').' : 'Die Debatte verläuft im Sand.'; } }
      ]
    }
  ];

  // Weitere Ereignisse des Wahlkampfs – angelehnt an echte Wahlkämpfe (2021, 2025).
  EVENTS.push(
    {
      id: 'deepfake', title: 'Gefälschtes Video im Netz',
      text: g => 'Ein mit KI erzeugtes Video zeigt ' + g.candidate + ' bei angeblich abfälligen Äußerungen über Rentner. Es wurde schon hunderttausendfach geteilt.',
      choices: [
        { label: 'Sofort richtigstellen – mit Faktencheck', hint: 'Solide',
          apply: g => { g.nat[g.party] += 0.1; return 'Die Richtigstellung verbreitet sich fast so schnell wie die Fälschung (+0.1).'; } },
        { label: 'Anzeige erstatten und Plattformen einschalten', hint: '−0,2 Mio. €, Sympathie als Opfer',
          apply: g => { g.money -= 0.2; candAdjust(g, 0.2, 0); g.nat[g.party] += 0.2; return 'Viele solidarisieren sich (+0.2).'; } },
        { label: 'Schweigen – nicht noch mehr Aufmerksamkeit erzeugen', hint: 'Riskant',
          apply: g => { if (rand(g) < 0.5) return 'Das Video verschwindet so schnell, wie es kam.'; g.nat[g.party] -= 0.5; candAdjust(g, -0.2, 0); return 'Viele halten das Video für echt (−0.5).'; } }
      ]
    },
    {
      id: 'plakate_weg', title: 'Plakate zerstört',
      text: 'In mehreren Städten wurden über Nacht hunderte eurer Plakate abgerissen oder beschmiert. Wahlkampfhelfer sind frustriert.',
      choices: [
        { label: 'Nachplakatieren – jetzt erst recht', hint: '−0,2 Mio. €, motiviert die Basis',
          apply: g => { g.money -= 0.2; mobilize(g, g.party, 0.01); g.nat[g.party] += 0.1; return 'Am nächsten Morgen hängen die Plakate wieder (+0.1).'; } },
        { label: 'Mit Humor im Netz reagieren', hint: 'Kann viral gehen',
          apply: g => { if (rand(g) < 0.6) { g.nat[g.party] += 0.3; return 'Euer Foto vom beschmierten Plakat wird zum Hit (+0.3).'; } return 'Der Post geht unter.'; } },
        { label: 'Achselzucken', hint: 'Kein Risiko', apply: () => 'Gehört zum Wahlkampf dazu.' }
      ]
    },
    {
      id: 'stellenabbau', title: 'Zulieferer streicht Tausende Stellen',
      text: 'Ein großer Autozulieferer kündigt an, 3.000 Stellen in Deutschland abzubauen und die Produktion nach Osteuropa zu verlagern.',
      before: g => changeSalience(g, 'wirtschaft', 0.04),
      choices: [
        { label: 'Vor dem Werkstor mit der Belegschaft sprechen', hint: 'Wirkt je nach Sozialkompetenz',
          apply: g => { const d = 0.2 + 0.5 * compMod(g, 'soziales'); g.nat[g.party] += d; return 'Die Bilder vom Werkstor laufen in den Abendnachrichten (' + fmt(d) + ').'; } },
        { label: 'Standortprogramm fordern: Energie, Steuern, Bürokratie', hint: 'Wirkt je nach Wirtschaftskompetenz',
          apply: g => { const d = 0.2 + 0.6 * compMod(g, 'wirtschaft'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Das Management angreifen', hint: 'Riskant',
          apply: g => { if (rand(g) < 0.5) { g.nat[g.party] += 0.4; return 'Ihr trefft einen Nerv (+0.4).'; } g.nat[g.party] -= 0.3; return 'Das wirkt populistisch (−0.3).'; } }
      ]
    },
    {
      id: 'zusatzbeitrag', title: 'Krankenkassen erhöhen die Beiträge',
      text: 'Die Krankenkassen heben den Zusatzbeitrag auf ein Rekordniveau an. Arbeitnehmer und Betriebe ächzen unter steigenden Sozialabgaben.',
      before: g => changeSalience(g, 'gesundheit', 0.05),
      choices: [
        { label: 'Reform der Krankenhausfinanzierung versprechen', hint: 'Wirkt je nach Gesundheitskompetenz',
          apply: g => { const d = 0.15 + 0.6 * compMod(g, 'gesundheit'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Beitragsdeckel fordern', hint: 'Populär – Experten zweifeln',
          apply: g => { if (rand(g) < 0.6) { g.nat[g.party] += 0.4; return 'Die Forderung kommt an (+0.4).'; } g.nat[g.party] -= 0.2; return 'Ökonomen zerpflücken den Vorschlag (−0.2).'; } },
        { label: 'Zur Sachlichkeit mahnen', hint: 'Kein Risiko', apply: () => 'Ihr verweist auf die laufende Reformdebatte.' }
      ]
    },
    {
      id: 'gewalttat', title: 'Eine Gewalttat erschüttert das Land',
      text: 'Nach einer Messerattacke in einer Fußgängerzone trauert das Land. Der mutmaßliche Täter war ausreisepflichtig. Die Debatte über Migration und Sicherheit überlagert alles.',
      before: g => { changeSalience(g, 'migration', 0.06); changeSalience(g, 'sicherheit', 0.04); },
      choices: [
        { label: 'Trauer zeigen, Wahlkampf einen Tag ruhen lassen', hint: 'Würdevoll',
          apply: g => { candAdjust(g, 0.2, 0); g.nat[g.party] += 0.1; return 'Die Zurückhaltung wird respektiert (+0.1).'; } },
        { label: 'Konsequente Abschiebungen fordern', hint: 'Wirkt je nach Migrationskompetenz',
          apply: g => { const d = 0.1 + 0.7 * compMod(g, 'migration'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Vor Instrumentalisierung warnen', hint: 'Spaltet',
          apply: g => { const d = compMod(g, 'migration') < 0 ? 0.3 : -0.3; g.nat[g.party] += d; return d > 0 ? 'Eure Anhänger danken euch die klare Haltung (+0.3).' : 'Das wirkt wie ein Ablenkungsmanöver (−0.3).'; } }
      ]
    },
    {
      id: 'zoelle', title: 'US-Strafzölle auf europäische Autos',
      text: 'Washington verhängt Strafzölle von 25 Prozent auf Autos aus der EU. Die deutsche Exportwirtschaft ist alarmiert.',
      before: g => { changeSalience(g, 'wirtschaft', 0.04); changeSalience(g, 'europa', 0.03); },
      choices: [
        { label: 'Europäische Antwort fordern', hint: 'Wirkt je nach Europakompetenz',
          apply: g => { const d = 0.15 + 0.5 * compMod(g, 'europa'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Verhandeln statt eskalieren', hint: 'Wirkt je nach Wirtschaftskompetenz',
          apply: g => { const d = 0.1 + 0.5 * compMod(g, 'wirtschaft'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Abwarten', hint: 'Kein Risiko', apply: () => 'Ihr wartet die Gespräche in Brüssel ab.' }
      ]
    },
    {
      id: 'sicherheitskonferenz', title: 'Eklat auf der Sicherheitskonferenz',
      text: 'Auf der Münchner Sicherheitskonferenz stellt die US-Regierung die Beistandsgarantie der NATO offen infrage. Europa diskutiert über Aufrüstung.',
      before: g => changeSalience(g, 'verteidigung', 0.06),
      choices: [
        { label: 'Mehr Geld für die Bundeswehr fordern', hint: 'Wirkt je nach Verteidigungskompetenz',
          apply: g => { const d = 0.1 + 0.6 * compMod(g, 'verteidigung'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Für Diplomatie und Abrüstung werben', hint: 'Spaltet',
          apply: g => { const d = compMod(g, 'verteidigung') < -0.2 ? 0.4 : -0.2; g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Europäische Verteidigungsunion vorschlagen', hint: 'Wirkt je nach Europakompetenz',
          apply: g => { const d = 0.1 + 0.4 * compMod(g, 'europa'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } }
      ]
    },
    {
      id: 'viral', title: 'Ein Clip geht viral',
      text: g => 'Ein spontaner Auftritt von ' + g.candidate + ' an einer Imbissbude wird auf TikTok millionenfach angesehen. Die Jungen feiern – oder lachen?',
      choices: [
        { label: 'Mitmachen: eigener Kanal, mehr Clips', hint: 'Erreicht Jüngere – kann peinlich wirken',
          apply: g => { if (rand(g) < 0.65) { const d = addGroups(g, g.party, 0.5, 'social'); candAdjust(g, 0.1, 0.04); return 'Ihr seid plötzlich Kult (' + fmt(d) + ').'; } g.nat[g.party] -= 0.2; return 'Der Versuch wirkt anbiedernd (−0.2).'; } },
        { label: 'Seriös bleiben', hint: 'Kleiner Bekanntheitsgewinn',
          apply: g => { candAdjust(g, 0, 0.03); return 'Der Clip macht die Kandidatur trotzdem bekannter.'; } }
      ]
    },
    {
      id: 'buergergeld', title: 'Streit ums Bürgergeld',
      text: 'Eine Studie zu Arbeitsanreizen im Bürgergeld löst eine heftige Debatte aus: Lohnt sich Arbeit noch?',
      before: g => changeSalience(g, 'soziales', 0.04),
      choices: [
        { label: 'Härtere Sanktionen fordern', hint: 'Wirkt je nach Wirtschaftskompetenz',
          apply: g => { const d = 0.1 + 0.5 * compMod(g, 'wirtschaft'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Höheren Mindestlohn fordern', hint: 'Wirkt je nach Sozialkompetenz',
          apply: g => { const d = 0.1 + 0.5 * compMod(g, 'soziales'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Neid-Debatte zurückweisen', hint: 'Kein Risiko', apply: () => 'Ihr haltet euch aus der Zuspitzung heraus.' }
      ]
    },
    {
      id: 'ueberlaeufer', title: 'Prominenter Überläufer',
      text: g => 'Ein prominentes Mitglied ' + partyGen(g.eventTarget) + ', jahrelang im Parteivorstand, tritt aus der Partei aus und will bei euch mitmachen.',
      before: g => { g.eventTarget = otherParty(g); },
      choices: [
        { label: 'Mit offenen Armen empfangen', hint: 'Schadet der Konkurrenz – eure Basis murrt vielleicht',
          apply: g => { g.nat[g.eventTarget] -= 0.4; if (rand(g) < 0.7) { g.nat[g.party] += 0.3; return 'Ein Coup kurz vor der Wahl (+0.3).'; } g.nat[g.party] -= 0.1; return 'An der Basis fragt man, wofür der Neuzugang eigentlich steht (−0.1).'; } },
        { label: 'Höflich ablehnen', hint: 'Prinzipientreu',
          apply: g => { g.nat[g.eventTarget] -= 0.2; return 'Ihr bleibt bei eurer Linie.'; } }
      ]
    }
  );

  // Bilanz-Ereignisse: Was in der Legislatur geschah, holt euch im Wahlkampf ein (nur mit Bilanz aus einer Legislatur).
  const recRival = g => (g.record && g.rivals ? Object.keys(g.rivals).filter(p => isShown(g, p) && p !== g.party).sort((a, b) => (g.rivals[b].feud || 0) - (g.rivals[a].feud || 0))[0] : null) || otherParty(g);
  const wasGov = g => g.record && (g.record.role === 'kanzler' || g.record.role === 'junior');
  EVENTS.push(
    {
      id: 'bilanz_wortbruch', title: 'Versprochen – gebrochen?',
      text: g => { const r = recRival(g); return rivalLabel(g, r) + ' lässt Plakate kleben: „Versprochen – gebrochen!“ Darauf eure Kernthemen aus dem letzten Wahlkampf, die in der Regierung nicht umgesetzt wurden: ' + g.record.broken.map(t => topicById(t).name).join(', ') + '.'; },
      cond: g => wasGov(g) && g.record.broken.length > 0 && g.week >= 2,
      choices: [
        { label: 'Ehrlich erklären: Regieren heißt Kompromisse', hint: 'Kleiner Verlust, wirkt aufrichtig',
          apply: g => { g.nat[g.party] -= 0.1; candAdjust(g, 0.15, 0); return 'Eure Offenheit wird respektiert (−0.1).'; } },
        { label: 'Gegenangriff: Was hat die Konkurrenz geschafft?', hint: 'Riskant',
          apply: g => { if (rand(g) < 0.5) { g.nat[g.party] += 0.3; return 'Der Konter sitzt (+0.3).'; } g.nat[g.party] -= 0.5; return 'Das wirkt wie Ablenkung (−0.5).'; } },
        { label: 'Diesmal wirklich: neues Versprechen', hint: 'Mobilisiert die eigenen Leute – Wechselwähler zweifeln',
          apply: g => { mobilize(g, g.party, 0.01); g.nat[g.party] -= 0.15; return 'Die Basis jubelt, die Kommentare sind skeptisch (−0.2).'; } }
      ]
    },
    {
      id: 'bilanz_erfolg', title: 'Eure Bilanz in Zahlen',
      text: g => { const x = g.record.lage.filter(y => y.imp > 0)[0]; return 'Die Wahlkampfzentrale hat die Zahlen: ' + x.name + ' hat sich in eurer Regierungszeit deutlich verbessert. Wie nutzt ihr das?'; },
      cond: g => wasGov(g) && g.record.lage.some(y => y.imp > 0) && g.week >= 2,
      choices: [
        { label: 'Bilanzkampagne: „Das haben wir geschafft“', hint: 'Wirkt je nach Größe des Erfolgs',
          apply: g => { const x = g.record.lage.filter(y => y.imp > 0)[0]; const d = 0.2 + 0.15 * Math.min(3, x.imp); g.nat[g.party] += d; changeSalience(g, x.id, 0.01); return 'Plakate mit euren Erfolgen hängen im ganzen Land (' + fmt(d) + ').'; } },
        { label: 'Lieber nach vorn schauen', hint: 'Wahlen gewinnt man mit Zukunft',
          apply: g => { g.nat[g.party] += 0.1; return 'Ihr redet über das, was kommt (+0.1).'; } }
      ]
    },
    {
      id: 'bilanz_lage', title: 'Die Konkurrenz macht eure Bilanz zum Thema',
      text: g => { const x = g.record.lage.filter(y => y.imp < 0)[0]; return rivalLabel(g, recRival(g)) + ': „' + x.name + ' – unter dieser Regierung ist es schlechter geworden. Das ist eure Bilanz!“'; },
      cond: g => wasGov(g) && g.record.lage.some(y => y.imp < 0) && g.week >= 2,
      before: g => { const x = g.record.lage.filter(y => y.imp < 0)[0]; changeSalience(g, x.id, 0.03); },
      choices: [
        { label: 'Fehler eingestehen und einen Plan vorlegen', hint: 'Kostet erst, wirkt glaubwürdig',
          apply: g => { g.nat[g.party] -= 0.1; candAdjust(g, 0.2, 0); return 'Ungewöhnlich ehrlich – das bleibt hängen (−0.1).'; } },
        { label: 'Die Zahlen in Zweifel ziehen', hint: 'Riskant – Faktenchecker prüfen',
          apply: g => { if (rand(g) < 0.35) { g.nat[g.party] += 0.2; return 'Die Debatte versandet (+0.2).'; } g.nat[g.party] -= 0.6; return 'Der Faktencheck gibt der Konkurrenz recht (−0.6).'; } },
        { label: 'Auf die Weltlage verweisen', hint: 'Klingt nach Ausrede',
          apply: g => { g.nat[g.party] -= 0.3; return '„Die anderen sind schuld“ überzeugt nicht (−0.3).'; } }
      ]
    },
    {
      id: 'bilanz_abstimmung', title: 'Eure Abstimmung holt euch ein',
      text: g => { const v = g.record.votes[0]; return 'Im Fernsehduell der Generalsekretäre: „Sie haben bei „' + v.title + '“ mit ' + ({ ja: 'Ja', nein: 'Nein', enthaltung: 'Enthaltung' }[v.my] || v.my) + ' gestimmt – und erzählen jetzt etwas anderes!“'; },
      cond: g => g.record && g.record.votes.length > 0 && g.week >= 3,
      choices: [
        { label: 'Dazu stehen', hint: 'Klare Haltung',
          apply: g => { candAdjust(g, 0.15, 0); g.nat[g.party] += 0.05; return 'Ihr steht zu eurer Entscheidung (+0.1).'; } },
        { label: 'Die Umstände erklären', hint: 'Kompliziert',
          apply: g => { g.nat[g.party] -= 0.1; return 'Die Erklärung ist richtig, aber lang (−0.1).'; } },
        { label: 'Das Thema wechseln', hint: 'Riskant',
          apply: g => { if (rand(g) < 0.5) return 'Es fällt niemandem auf.'; g.nat[g.party] -= 0.4; return '„Ausweichend“, urteilen die Kommentatoren (−0.4).'; } }
      ]
    }
  );

  // Spätfolgen – werden nie zufällig gezogen, sondern nur durch frühere Entscheidungen ausgelöst.
  EVENTS.push(
    // ---- Leihstimmen ----
    {
      id: 'leih_klein', title: 'Leihstimmen vom großen Partner?',
      text: g => 'Ihr kämpft um die 5-%-Hürde. Eure Strategen schlagen eine Kampagne bei den Anhängern ' + partyGen(LEIH[g.party]) + ' vor: „Erststimme für euren Kandidaten, Zweitstimme für uns.“',
      cond: g => LEIH[g.party] && g.week >= 4 && nationalShares(g)[g.party] < 7.5,
      choices: [
        { label: 'Zweitstimmen-Kampagne starten', hint: 'Stimmen vom Partner – der reagiert verärgert', noScale: true,
          apply: g => { const q = LEIH[g.party]; const d = 0.6 * sizeFactor(nationalShares(g)[g.party]) + 0.2; g.nat[g.party] += d; addSrc(g, g.party, q, d); g.grudge = g.grudge || {}; g.grudge[q] = g.week; return 'Die Kampagne wirkt (' + fmt(d) + ') – bei ' + party(q).short + ' ist man verstimmt.'; } },
        { label: 'Aus eigener Kraft', hint: 'Kein Risiko', apply: () => 'Ihr setzt auf eure eigenen Wähler.' }
      ]
    },
    {
      id: 'leih_gross', title: 'Euer Wunschpartner bittet um Leihstimmen',
      text: g => party(LEIH_GROSS[g.party]).name + ' droht an der 5-%-Hürde zu scheitern – und mit ihr eure Mehrheit. Sollt ihr zum Stimmensplitting aufrufen: Erststimme für euch, Zweitstimme für den Partner?',
      cond: g => LEIH_GROSS[g.party] && g.week >= 4 && (s => s > 3 && s < 6)(nationalShares(g)[LEIH_GROSS[g.party]]),
      choices: [
        { label: 'Zum Stimmensplitting aufrufen', hint: 'Partner gewinnt, ihr gebt ab', noScale: true,
          apply: g => { const q = LEIH_GROSS[g.party]; const d = 0.7; g.nat[q] += d; addSrc(g, q, g.party, d); return party(q).short + ' bekommt Leihstimmen von euren Anhängern (' + fmt(d) + ' für den Partner).'; } },
        { label: 'Jede Stimme für uns', hint: 'Der Partner bleibt auf sich gestellt', apply: () => 'Ihr kämpft um jede eigene Stimme.' }
      ]
    },
    // ---- Brandmauer ----
    {
      id: 'fw_antrag', title: 'Eine Mehrheit nur mit der AfD',
      text: 'Euer Antrag für eine härtere Migrationspolitik steht im Bundestag zur Abstimmung. Eine Mehrheit gibt es nur mit den Stimmen der AfD. Die anderen Fraktionen warnen: „Wer das tut, reißt die Brandmauer ein.“',
      cond: g => g.party !== 'afd' && g.week >= 2 && fwLevel(g, g.party) < 1,
      choices: [
        { label: 'Abstimmen lassen – richtig bleibt richtig', hint: 'Brandmauer bröckelt: AfD-nahe Wähler kommen, die Mitte zweifelt', noScale: true,
          apply: g => 'Der Antrag geht mit den Stimmen der AfD durch. ' + openFirewall(g, g.party, 1) },
        { label: 'Mit der AfD eine Mehrheit organisieren', hint: 'Tolerierung nicht mehr ausgeschlossen: starke Folgen', noScale: true,
          apply: g => 'Ihr verhandelt offen mit der AfD. ' + openFirewall(g, g.party, 2) },
        { label: 'Antrag zurückziehen', hint: 'Kleiner Verlust, Brandmauer hält',
          apply: g => { g.nat[g.party] -= 0.2; return 'Ihr zieht den Antrag zurück. Manche sprechen von Führungsschwäche (−0.2).'; } }
      ]
    },
    {
      id: 'fw_koalitionsfrage', title: 'Die Koalitionsfrage',
      text: 'Nach euren Abstimmungen mit der AfD gibt es in jeder Talkshow nur eine Frage: Schließt ihr eine Koalition mit der AfD aus?',
      cond: g => g.party !== 'afd' && g.week >= 3 && fwLevel(g, g.party) >= 1 && fwLevel(g, g.party) < 3,
      choices: [
        { label: 'Klar ausschließen – die Brandmauer steht', hint: 'Zurück zur Brandmauer, kostet etwas Glaubwürdigkeit', noScale: true,
          apply: g => closeFirewall(g, g.party) },
        { label: 'Nichts ausschließen', hint: 'Tolerierung möglich', noScale: true,
          apply: g => openFirewall(g, g.party, 2) || 'Ihr bleibt bei eurer Linie: Nichts wird ausgeschlossen.' },
        { label: 'Koalition offen anbieten', hint: 'Koalition mit der AfD möglich – die heftigsten Folgen', noScale: true,
          apply: g => openFirewall(g, g.party, 3) }
      ]
    },
    {
      id: 'fw_angebot', title: 'Ein Angebot an die Konkurrenz?',
      text: 'Eure Umfragewerte sind stark, doch ohne Partner bleibt ihr in der Opposition. Sollt ihr anderen Parteien öffentlich eine Zusammenarbeit anbieten?',
      cond: g => g.party === 'afd' && g.week >= 2,
      choices: [
        { label: 'Der Union die Hand reichen', hint: 'Druck auf die Union, gegen euch wird mobilisiert',
          apply: g => { g.fwOffer = Object.assign({}, g.fwOffer, { union: true }); g.nat.afd += 0.2; ['spd', 'gruene', 'linke'].forEach(q => { g.mobPerm[q] = (g.mobPerm[q] || 0) + 0.004; }); return 'Das Angebot beherrscht die Schlagzeilen – die Union gerät unter Druck (+0.2).'; } },
        { label: 'FDP und BSW umwerben', hint: 'Druck auf die Kleinen',
          apply: g => { g.fwOffer = Object.assign({}, g.fwOffer, { fdp: true, bsw: true }); g.nat.afd += 0.1; return 'FDP und BSW müssen sich erklären (+0.1).'; } },
        { label: 'Auf eigene Stärke setzen', hint: 'Kein Risiko', apply: () => 'Ihr setzt auf die eigene Mehrheit.' }
      ]
    },
    {
      id: 'fw_protest', followUp: true, title: 'Hunderttausende gegen die Zusammenarbeit mit der AfD',
      text: 'In vielen Städten gehen Menschen gegen eure Öffnung zur AfD auf die Straße. Kirchen, Gewerkschaften und Wirtschaftsverbände äußern sich kritisch, Mitglieder treten aus.',
      cond: g => g.party !== 'afd' && fwLevel(g, g.party) > 0,
      choices: [
        { label: 'Kurs halten', hint: 'Verlust in der Mitte',
          apply: g => { g.nat[g.party] -= 0.4; return 'Ihr bleibt bei eurer Linie. Die Proteste gehen weiter (−0.4).'; } },
        { label: 'Fehler eingestehen, Brandmauer wieder hochziehen', hint: 'Zurück zur Brandmauer', noScale: true,
          apply: g => closeFirewall(g, g.party) },
        { label: 'Zum Dialog einladen', hint: 'Kleiner Verlust',
          apply: g => { g.nat[g.party] -= 0.2; return 'Ein Gesprächsangebot an die Demonstrierenden – die Lage beruhigt sich etwas (−0.2).'; } }
      ]
    },
    {
      id: 'spendenaffaere2', followUp: true, title: 'Spendenaffäre!',
      text: 'Recherchen enthüllen: Der Unternehmer, dessen 2,5 Mio. € ihr angenommen habt, erwartete Gegenleistungen bei einem Bauprojekt. Die Opposition spricht von gekaufter Politik.',
      choices: [
        { label: 'Spende zurückzahlen, Fehler eingestehen', hint: '−1,5 Mio. €, mittlerer Imageschaden',
          apply: g => { g.money = Math.max(0, g.money - 1.5); g.nat[g.party] -= 0.7; return 'Das Geld geht zurück, der Schaden bleibt begrenzt (−0.7).'; } },
        { label: 'Den Schatzmeister opfern', hint: 'Riskant',
          apply: g => { if (rand(g) < 0.55) { g.nat[g.party] -= 0.5; return 'Der Rücktritt beruhigt die Lage (−0.5).'; } g.nat[g.party] -= 1.6; return 'Niemand glaubt an einen Alleingang des Schatzmeisters (−1.6).'; } },
        { label: 'Alles abstreiten', hint: 'Sehr riskant',
          apply: g => { if (rand(g) < 0.4) return 'Die Geschichte verläuft im Sand.'; g.nat[g.party] -= 2.6; return 'Neue Dokumente tauchen auf – die Affäre beherrscht den Wahlkampf (−2.6).'; } }
      ]
    },
    {
      id: 'promi2', followUp: true, title: 'Ärger um euren Promi-Unterstützer',
      text: 'Alte Interviews eures prominenten Unterstützers machen die Runde. Seine Aussagen sorgen für Empörung – und alle fragen, wie ihr dazu steht.',
      choices: [
        { label: 'Klar distanzieren', hint: 'Kleiner Verlust',
          apply: g => { g.nat[g.party] -= 0.3; return 'Ihr geht auf Abstand (−0.3).'; } },
        { label: 'Zu ihm halten', hint: 'Riskant',
          apply: g => { if (rand(g) < 0.4) { g.nat[g.party] += 0.3; return 'Eure Treue imponiert seinen Fans (+0.3).'; } g.nat[g.party] -= 1.1; return 'Die Debatte klebt an euch (−1.1).'; } }
      ]
    },
    {
      id: 'deckel2', followUp: true, title: 'Ökonomen zerpflücken euren Strompreisdeckel',
      text: 'Wochen nach eurer Forderung rechnen Institute vor: Der Strompreisdeckel kostet Milliarden, eine Gegenfinanzierung fehlt.',
      choices: [
        { label: 'Nachbessern', hint: 'Kleiner Verlust',
          apply: g => { g.nat[g.party] -= 0.4; return 'Ihr legt ein Finanzierungskonzept nach (−0.4).'; } },
        { label: 'Unbeirrt verteidigen', hint: 'Wirkt je nach Finanzkompetenz',
          apply: g => { const d = -0.6 + 0.8 * compMod(g, 'finanzen'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } }
      ]
    },
    {
      id: 'rente2', followUp: true, title: 'Rechnungshof: Rentengarantie unbezahlbar',
      text: 'Der Bundesrechnungshof beziffert eure Rentengarantie auf 40 Milliarden Euro im Jahr. Die Konkurrenz spricht von Wahlbetrug.',
      choices: [
        { label: 'Garantie abschwächen', hint: 'Mittlerer Verlust',
          apply: g => { g.nat[g.party] -= 0.6; return 'Ein Rückzieher – aber ein ehrlicher (−0.6).'; } },
        { label: 'Reiche sollen zahlen', hint: 'Wirkt je nach Sozialkompetenz',
          apply: g => { const d = -0.5 + 0.7 * compMod(g, 'soziales'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } }
      ]
    },
    {
      id: 'kita2', followUp: true, title: 'Eure Kita-Idee macht Schule',
      text: 'Mehrere Städte übernehmen euren Vorschlag für eine Kita-Garantie. Eltern sind begeistert.',
      choices: [
        { label: 'Vor Ort feiern', hint: '−0,2 Mio. €, größerer Effekt',
          apply: g => { g.money -= 0.2; addGroups(g, g.party, 0.8, 'kundgebung', 'familie'); return 'Bilder mit strahlenden Eltern (+0.8).'; } },
        { label: 'Bescheiden bleiben', hint: 'Kleiner Effekt',
          apply: g => { g.nat[g.party] += 0.4; return 'Die Anerkennung kommt trotzdem an (+0.4).'; } }
      ]
    }
  );

  EVENTS.push({
    id: 'kleinpartei', title: 'Kleinpartei sorgt für Furore',
    text: g => { const m = party(g.furore); return (m ? m.name : 'Eine Kleinpartei') + (m && m.plural ? ' füllen' : ' füllt') + ' mit einer frechen Kampagne die Timelines und ' + (m && m.plural ? 'legen' : 'legt') + ' in den Umfragen kräftig zu – auch auf eure Kosten.'; },
    before: g => {
      g.furore = MINOR_IDS.length ? pick(g, MINOR_IDS) : null;
      if (g.furore && g.minor) g.minor[g.furore].trend = Math.min(3.5, g.minor[g.furore].trend + 1.3);
      else g.otherSwing = Math.min(4, (g.otherSwing || 0) + 1.2);
    },
    choices: [
      { label: 'Ihre Ideen aufgreifen', hint: 'Holt Wähler zurück, wirkt eher bei Jungen',
        apply: g => { furoreDown(g, 0.8); const d = addGroups(g, g.party, 0.4, 'social'); return 'Ihr nehmt der Kleinpartei den Wind aus den Segeln (' + fmt(d) + ').'; } },
      { label: 'Vor verschenkten Stimmen warnen', hint: 'Riskant',
        apply: g => { if (rand(g) < 0.55) { furoreDown(g, 1.2); g.nat[g.party] += 0.4; return '„Jede Stimme zählt“ – die Botschaft kommt an (+0.4).'; } g.nat[g.party] -= 0.4; return 'Das wirkt arrogant (−0.4).'; } },
      { label: 'Ignorieren', hint: 'Kein Risiko', apply: () => 'Ihr lasst die Kleinpartei links liegen.' }
    ]
  });

  // ---------- Wahlkampfkalender ----------
  // Feste Termine der letzten acht Wochen vor einer Bundestagswahl. Sie kommen zusätzlich zum Ereignis der Woche.
  // Plakate: Viele Kommunen erlauben Wahlwerbung erst etwa sechs Wochen vor der Wahl. Wahlparteitage liegen
  // meist vier bis sechs Wochen vor dem Termin, danach folgen Bürgerformate wie die ARD-Wahlarena, die Briefwahlunterlagen kommen etwa vier Wochen vorher, der
  // Wahl-O-Mat der bpb geht zwei bis drei Wochen vorher online (2025: 26 Mio. Nutzungen), die Abschlusskundgebungen
  // finden am letzten Wochenende statt.
  const coreOf = g => (g.program && g.program.core && g.program.core.length ? g.program.core : TOPIC_IDS.slice(0, 1));
  const coreComp = g => coreOf(g).reduce((s, t) => s + compMod(g, t), 0) / coreOf(g).length;
  const MILESTONES = [
    { week: 2, icon: '🪧', short: 'Plakate' },
    { week: 3, icon: '🎉', short: 'Wahlparteitag' },
    { week: 4, icon: '🎤', short: 'Wahlarena' },
    { week: 5, icon: '✉️', short: 'Briefwahl' },
    { week: 6, icon: '🗳️', short: 'Wahl-O-Mat' },
    { week: 7, icon: '📺', short: 'Elefantenrunde' },
    { week: 8, icon: '📣', short: 'Abschluss' }
  ];
  EVENTS.push(
    {
      id: 'ms_plakate', milestone: 2, followUp: true, title: 'Die Plakate hängen',
      text: 'Die Kommunen geben die Laternenmasten frei – über Nacht hängen eure Plakate im ganzen Land. Welches Motiv dominiert?',
      choices: [
        { label: 'Das Gesicht der Kampagne', hint: 'Macht die Spitzenkandidatur bekannt – wirkt, wenn man sie mag',
          apply: g => { candAdjust(g, 0, 0.08); const d = 0.15 + 0.08 * g.cand.like; g.nat[g.party] += d; return 'Das Porträt ist überall (' + fmt(d) + ').'; } },
        { label: 'Eure Kernthemen', hint: 'Rückt eure Themen nach vorn',
          apply: g => { coreOf(g).forEach(t => changeSalience(g, t, 0.015)); const d = 0.15 + 0.25 * coreComp(g); g.nat[g.party] += d; return 'Eure Themen prägen das Straßenbild (' + fmt(d) + ').'; } },
        { label: 'Provokante Sprüche', hint: 'Riskant – kann viral gehen',
          apply: g => { if (rand(g) < 0.5) { g.nat[g.party] += 0.6; return 'Die Plakate werden zum Netz-Hit (+0.6).'; } g.nat[g.party] -= 0.4; return 'Die Sprüche gelten als geschmacklos (−0.4).'; } }
      ]
    },
    {
      id: 'ms_parteitag', milestone: 3, followUp: true, title: 'Der Wahlparteitag',
      text: 'Tausend Delegierte, Kameras aus dem ganzen Land: Auf dem Wahlparteitag beschließt eure Partei das Programm und kürt die Spitzenkandidatur.',
      choices: [
        { label: 'Geschlossenheit inszenieren', hint: 'Mobilisiert die eigenen Leute',
          apply: g => { mobilize(g, g.party, 0.02); candAdjust(g, 0.2, 0.03); g.nat[g.party] += 0.15; return 'Minutenlanger Applaus, die Partei steht (+0.2).'; } },
        { label: 'Das Programm zuspitzen', hint: 'Wirkt je nach Kompetenz bei euren Kernthemen',
          apply: g => { coreOf(g).forEach(t => changeSalience(g, t, 0.02)); const d = 0.2 + 0.4 * coreComp(g); g.nat[g.party] += d; return 'Die Beschlüsse setzen die Agenda (' + fmt(d) + ').'; } },
        { label: 'Offene Debatte zulassen', hint: 'Riskant: lebendig oder zerstritten',
          apply: g => { if (rand(g) < 0.5) { g.nat[g.party] += 0.4; return 'Die Debatte wirkt lebendig und ehrlich (+0.4).'; } g.nat[g.party] -= 0.5; return 'Die Schlagzeile lautet „Streit auf dem Parteitag“ (−0.5).'; } }
      ]
    },
    {
      id: 'ms_wahlarena', milestone: 4, followUp: true, title: 'Die Wahlarena',
      text: g => 'Keine Moderation, keine Spickzettel: In der Wahlarena stellen Bürgerinnen und Bürger ' + g.candidate + ' ihre Fragen – eine Pflegekraft, ein Handwerksmeister, eine Rentnerin.',
      choices: [
        { label: 'Zuhören und ehrlich antworten', hint: 'Wirkt, wenn man die Kandidatur mag',
          apply: g => { candAdjust(g, 0.25, 0.03); const d = 0.1 + 0.08 * g.cand.like; g.nat[g.party] += d; return 'Ein Auftritt mit Herz (' + fmt(d) + ').'; } },
        { label: 'Konkrete Hilfe versprechen', hint: 'Kommt gut an – Faktenchecker prüfen nach',
          apply: g => { if (rand(g) < 0.65) { g.nat[g.party] += 0.4; return 'Die Zusage wird zum Clip des Abends (+0.4).'; } g.nat[g.party] -= 0.3; return 'Der Faktencheck zerlegt das Versprechen (−0.3).'; } },
        { label: 'Auf das Programm verweisen', hint: 'Wirkt je nach Kompetenz bei euren Kernthemen',
          apply: g => { const d = 0.05 + 0.25 * coreComp(g); g.nat[g.party] += d; return 'Sachlich, aber etwas hölzern (' + fmt(d) + ').'; } }
      ]
    },
    {
      id: 'ms_briefwahl', milestone: 5, followUp: true, title: 'Die Briefwahl beginnt',
      text: 'Die Wahlbenachrichtigungen sind verschickt, die ersten Briefwahlunterlagen liegen in den Briefkästen. Ab jetzt wird gewählt – und jede Woche gehen Stimmen verloren, die ihr nicht mehr erreicht.',
      choices: [
        { label: 'Aufruf an die Stammwähler: „Jetzt wählen!“', hint: 'Sichert eure Anhänger früh',
          apply: g => { const p = g.party; g.postalPush[p] = Math.min(0.25, (g.postalPush[p] || 0) + 0.05 * postalAffinity(p)); return 'Eure Anhänger füllen die Unterlagen früh aus.'; } },
        { label: 'Haustürkampagne mit Briefwahlhilfe', hint: '−0,3 Mio. €, mobilisiert',
          apply: g => { g.money -= 0.3; mobilize(g, g.party, 0.015); const p = g.party; g.postalPush[p] = Math.min(0.25, (g.postalPush[p] || 0) + 0.02); g.nat[g.party] += 0.1; return 'Freiwillige klingeln an Tausenden Türen (+0.1).'; } },
        { label: 'Auf den Wahlsonntag setzen', hint: 'Kein Aufwand', apply: () => 'Ihr spart euch die Kräfte für den Schlussspurt.' }
      ]
    },
    {
      id: 'ms_wahlomat', milestone: 6, followUp: true, title: 'Der Wahl-O-Mat ist online',
      text: 'Die Bundeszentrale für politische Bildung schaltet den Wahl-O-Mat frei. Millionen vergleichen ihre Positionen mit denen der Parteien – und teilen ihr Ergebnis.',
      choices: [
        { label: 'Eure Thesen im Netz bewerben', hint: 'Erreicht vor allem Jüngere – kleine Parteien profitieren mehr',
          apply: g => { const d = addGroups(g, g.party, nationalShares(g)[g.party] < 9 ? 0.6 : 0.3, 'social'); return 'Euer Wahl-O-Mat-Ergebnis wird geteilt (' + fmt(d) + ').'; } },
        { label: 'Begründungen schärfen', hint: 'Wirkt je nach Kompetenz bei euren Kernthemen',
          apply: g => { const d = 0.1 + 0.3 * coreComp(g); g.nat[g.party] += d; return 'Eure Antworten überzeugen beim Nachlesen (' + fmt(d) + ').'; } },
        { label: 'Den Wahl-O-Mat kritisieren', hint: 'Wirkt beleidigt',
          apply: g => { g.nat[g.party] -= 0.2; return 'Die Kritik wirkt wie Angst vor dem Vergleich (−0.2).'; } }
      ]
    },
    {
      id: 'ms_abschluss', milestone: 8, followUp: true, title: 'Der Schlussspurt',
      text: 'Das letzte Wochenende vor der Wahl. Viele Unentschlossene entscheiden sich erst jetzt. Wo setzt ihr den Schlusspunkt?',
      choices: [
        { label: 'Große Abschlusskundgebung', hint: '−0,5 Mio. €, mobilisiert stark',
          apply: g => { g.money -= 0.5; mobilize(g, g.party, 0.03); g.nat[g.party] += 0.2; return 'Ein Fahnenmeer auf dem Marktplatz (+0.2).'; } },
        { label: 'Tour durch die umkämpften Wahlkreise', hint: 'Macht die Kandidatur bekannt',
          apply: g => { candAdjust(g, 0.1, 0.05); const d = 0.2 + 0.05 * g.cand.like; g.nat[g.party] += d; return 'Hände schütteln bis zur letzten Minute (' + fmt(d) + ').'; } },
        { label: 'Letzter Appell im Fernsehen', hint: 'Wirkt, wenn man die Kandidatur mag',
          apply: g => { const d = 0.1 + 0.1 * g.cand.like; g.nat[g.party] += d; return 'Der Appell erreicht die Wohnzimmer (' + fmt(d) + ').'; } }
      ]
    }
  );

  // Kompetenz nach der Legislatur: eigene Zugewinne (Ressorts, Schattenkabinett) und die Lage im Land für die
  // damaligen Regierungsparteien. Dazu Meldungen, mit denen der Wahlkampf beginnt.
  function applyRecord(g) {
    const R = g.record;
    if (!R) return;
    Object.keys(R.comp || {}).forEach(t => { if (g.competence && t in g.competence) g.competence[t] = Math.max(5, Math.min(95, g.competence[t] + R.comp[t])); });
    (R.gov || []).forEach(p => Object.keys(R.govComp || {}).forEach(t => {
      if (p === g.party) { if (g.competence) g.competence[t] = Math.max(5, Math.min(95, g.competence[t] + R.govComp[t])); }
      else if (g.compAdj && g.compAdj[p]) g.compAdj[p][t] = Math.max(-8, Math.min(8, (g.compAdj[p][t] || 0) + R.govComp[t]));
    }));
    const lines = [];
    if (R.laws.length) lines.push('Eure Bilanz: ' + R.laws.length + ' Gesetze ' + (R.role === 'kanzler' || R.role === 'junior' ? 'als Regierungspartei' : 'mitgetragen') + (R.promises ? ', ' + R.promises + ' Wahlversprechen umgesetzt' : '') + '.');
    if (R.broken.length) lines.push('Nicht umgesetzt: ' + R.broken.map(t => topicById(t).name).join(', ') + ' – die Konkurrenz wird daran erinnern.');
    R.lage.forEach(x => lines.push('Lage im Land: ' + x.name + (x.imp > 0 ? ' hat sich verbessert.' : ' hat sich verschlechtert.')));
    lines.push('Glaubwürdigkeit nach der Legislatur: ' + R.cred + '/100.');
    lines.reverse().forEach(x => addLog(g, 'start', x));
  }

  function dueMilestone(g) {
    const ev = EVENTS.find(e => e.milestone === g.week && g.usedEvents.indexOf(e.id) === -1);
    if (!ev) return null;
    g.usedEvents.push(ev.id);
    return ev;
  }

  function eventById(id) { return EVENTS.find(e => e.id === id); }

  function eventText(g, ev) {
    let text = typeof ev.text === 'function' ? ev.text(g) : ev.text;
    if (ev.id === 'gegnerskandal' && g.eventTarget) {
      text = 'Bei der Partei „' + party(g.eventTarget).name + '“ ist eine peinliche Chatgruppe aufgeflogen. Ihre Umfragewerte sinken.';
    }
    return text;
  }

  // Spätfolgen: Entscheidungen, die euch Wochen später wieder einholen.
  function schedule(g, eventId, minWeeks, maxWeeks) {
    if (!g.delayed) g.delayed = [];
    const week = Math.min(g.maxWeeks, g.week + minWeeks + Math.floor(rand(g) * (maxWeeks - minWeeks + 1)));
    if (week <= g.week) return;
    g.delayed.push({ week, event: eventId });
  }

  function dueFollowUp(g) {
    if (!g.delayed || !g.delayed.length) return null;
    const i = g.delayed.findIndex(d => d.week <= g.week);
    if (i === -1) return null;
    const ev = eventById(g.delayed[i].event);
    g.delayed.splice(i, 1);
    if (!ev || (ev.cond && !ev.cond(g))) return null;
    g.usedEvents.push(ev.id);
    if (ev.before) ev.before(g);
    g.pendingEvent = ev.id;
    return ev;
  }

  function drawEvent(g) {
    const pool = EVENTS.filter(e => !e.followUp && g.usedEvents.indexOf(e.id) === -1 && (!e.cond || e.cond(g)));
    if (!pool.length) return null;
    // Ein Patzer aus der Fachkonferenz holt einen spätestens in Woche 3 ein.
    const gaffe = pool.find(e => e.id === 'patzer');
    const rest = pool.filter(e => e.id !== 'patzer');
    const ev = gaffe && (g.week >= 3 || !rest.length) ? gaffe : pick(g, rest);
    g.usedEvents.push(ev.id);
    if (ev.before) ev.before(g);
    g.pendingEvent = ev.id;
    return ev;
  }

  const eventScale = (g, p) => sizeFactor(nationalShares(g)[p]);

  // Punktangaben im Ergebnistext anpassen, z. B. „(+0.6)“ oder „Reaktion der Wähler: +0.4.“
  function scaleNumbers(text, f) {
    const conv = (sign, a, b) => {
      const v = Math.round(parseFloat(a + '.' + b) * f * 10) / 10;
      return sign + v.toFixed(1);
    };
    return String(text)
      .replace(/\(([+−-])(\d+)[.,](\d)\)/g, (m, sg, a, b) => '(' + conv(sg, a, b) + ')')
      .replace(/: ([+−-])(\d+)[.,](\d)\./g, (m, sg, a, b) => ': ' + conv(sg, a, b) + '.');
  }

  function resolveEvent(g, choiceIndex) {
    const ev = eventById(g.pendingEvent);
    if (!ev) return { ok: false, text: 'Kein offenes Ereignis.' };
    const choice = ev.choices[choiceIndex];
    if (!choice) return { ok: false, text: 'Ungültige Auswahl.' };
    // Ereignisse wirken – wie Aktionen – im Verhältnis zur Größe der Partei: +1 Punkt ist für eine
    // 4-%-Partei viel mehr als für eine 25-%-Partei. Die Änderung wird daher skaliert.
    const p = g.party;
    const shareBefore = nationalShares(g)[p];
    const natBefore = g.nat[p];
    const regBefore = {};
    D.STATES.forEach(st => { regBefore[st.id] = g.reg[st.id][p]; });
    let text = choice.apply(g);
    const f = choice.noScale ? 1 : eventScale(g, p);
    if (f !== 1) {
      g.nat[p] = natBefore + (g.nat[p] - natBefore) * f;
      D.STATES.forEach(st => { g.reg[st.id][p] = regBefore[st.id] + (g.reg[st.id][p] - regBefore[st.id]) * f; });
      text = scaleNumbers(text, f);
    }
    g.money = Math.max(0, Math.round(g.money * 100) / 100);
    const dEv = nationalShares(g)[p] - shareBefore;
    candAdjust(g, Math.max(-0.3, Math.min(0.2, 0.3 * dEv)), 0);
    journal(g, 'e', ev.title + ': ' + choice.label, dEv);
    g.pendingEvent = null;
    addLog(g, 'event', ev.title + ': ' + text);
    // Nach einem Kalendertermin folgt das Ereignis der Woche.
    if (ev.milestone && g.phase === 'campaign') dueFollowUp(g) || drawEvent(g);
    return { ok: true, text };
  }

  // ---------- TV-Duell / Elefantenrunde ----------

  const DUEL_STYLES = [
    { id: 'sachlich', name: 'Sachlich argumentieren', desc: 'Punktet, wenn du beim Thema kompetent bist.' },
    { id: 'angriff', name: 'Angreifen', desc: 'Hohes Risiko, hoher Gewinn.' },
    { id: 'emotional', name: 'Persönliche Geschichte erzählen', desc: 'Solide, kaum Abhängigkeit vom Thema.' },
    { id: 'konter', name: 'Den Angriff direkt kontern', desc: 'Schlagfertig zurück – wirkt, wenn man euch mag; gegen Angreifer besonders.' }
  ];
  // Angriffe der Gegenüber je nach Stil (frei formuliert nach typischen TV-Runden).
  const DUEL_ATTACKS = {
    angreifer: ['Ihre Partei hat beim Thema {t} auf ganzer Linie versagt!', 'Sie reden schön – die Menschen merken davon nichts. Beim Thema {t} schon gar nicht.'],
    staatsmann: ['Das Land braucht beim Thema {t} Ernsthaftigkeit statt Parolen.', 'Mit Verlaub: Was Sie zum Thema {t} vorschlagen, ist nicht durchgerechnet.'],
    populist: ['Beim Thema {t} wird über die Köpfe der Leute hinweg entschieden – auch von Ihnen!', 'Fragen Sie mal die Menschen draußen, was die von Ihrer {t}-Politik halten!'],
    technokrat: ['Ihre Zahlen zum Thema {t} stimmen hinten und vorne nicht.', 'Die Studienlage zum Thema {t} sagt etwas ganz anderes als Sie.']
  };
  const duelSize = g => sizeFactor(nationalShares(g)[g.party]);

  // Format nach Umfrage wie im echten Fernsehen: Duell der beiden Großen, Triell bei drei Kanzlerkandidaturen,
  // sonst die Elefantenrunde aller Spitzen. Je Frage greift ein Gegenüber an.
  function startDuel(g) {
    const topics = TOPIC_IDS.slice().sort((a, b) => g.salience[b] - g.salience[a]).slice(0, 3);
    const sh = nationalShares(g);
    // Eingeladen werden Parteien, die im Bundestag sitzen oder in den Umfragen über der Fünfprozenthürde liegen.
    const order = shownIds(g).filter(p => p === g.party || sh[p] >= 5 || (g.prevSeats ? g.prevSeats[p] > 0 : PARTY_IDS.indexOf(p) !== -1)).sort((a, b) => sh[b] - sh[a]);
    const top = order.slice(0, 3);
    let format = 'elefantenrunde';
    if (top.slice(0, 2).indexOf(g.party) !== -1 && sh[top[1]] - sh[top[2]] > 4) format = 'duell';
    else if (top.indexOf(g.party) !== -1 && sh[top[2]] - (sh[order[3]] || 0) > 3) format = 'triell';
    const opponents = (format === 'duell' ? top.slice(0, 2) : format === 'triell' ? top : order.slice(0, 7)).filter(p => p !== g.party);
    const rival = opponents[0];
    const attacks = topics.map((t, i) => {
      const p = opponents[i % opponents.length];
      const st = (g.rivals && g.rivals[p] && g.rivals[p].style) || 'staatsmann';
      return { p, name: rivalName(g, p), style: st, text: pick(g, DUEL_ATTACKS[st] || DUEL_ATTACKS.staatsmann).replace('{t}', topicById(t).name) };
    });
    g.duel = { topics, round: 0, points: 0, results: [], rival, format, opponents, attacks };
    return g.duel;
  }
  // Schlusswort nach der letzten Frage (nur über die Oberfläche): 0 Zukunft, 1 klare Kante, 2 Bitte um die Stimme.
  function duelClosing(g, choice) {
    const like = g.cand ? g.cand.like : 0;
    const fringe = ['afd', 'linke', 'bsw'].indexOf(g.party) !== -1;
    let d = between(g, -0.1, 0.25);
    if (choice === 0) d += like > 0 ? 0.15 : -0.05;
    else if (choice === 1) d += fringe ? 0.2 : -0.05;
    else d += 0.1;
    d = Math.round(d * duelSize(g) * 10) / 10;
    g.nat[g.party] += d;
    if (g.duelLast) g.duelLast.closing = d;
    return { ok: true, delta: d, text: d >= 0.2 ? 'Ein starkes Schlusswort – die Zuschauer sind bei euch.' : d > 0 ? 'Ein solides Schlusswort.' : 'Das Schlusswort verpufft.' };
  }

  function duelAnswer(g, styleId) {
    if (!g.duel) return { ok: false, text: 'Kein TV-Duell aktiv.' };
    const topic = g.duel.topics[g.duel.round];
    const comp = competenceOf(g, g.party)[topic] / 100;
    let score;
    if (styleId === 'sachlich') score = 0.15 + comp * 0.8 + between(g, -0.15, 0.15);
    else if (styleId === 'angriff') score = between(g, 0.0, 1.05);
    else if (styleId === 'emotional') score = 0.45 + between(g, -0.15, 0.2);
    else if (styleId === 'konter') {
      const at = g.duel.attacks && g.duel.attacks[g.duel.round];
      const st = at ? at.style : 'staatsmann';
      score = 0.35 + 0.08 * (g.cand ? g.cand.like : 0) + (st === 'angreifer' ? 0.15 : st === 'staatsmann' ? -0.1 : 0) + between(g, -0.25, 0.3);
      if (at && score > 0.55 && g.rivals && g.rivals[at.p]) g.rivals[at.p].feud = Math.min(5, (g.rivals[at.p].feud || 0) + 1);
    } else return { ok: false, text: 'Unbekannte Strategie.' };
    // Das Gegenüber: Gegen Angreifer wirkt Gelassenheit, gegen Staatsmännische kein Angriff, gegen Populisten der Faktencheck.
    const st = g.duel.rival && g.rivals && g.rivals[g.duel.rival] ? g.rivals[g.duel.rival].style : null;
    const DUEL_FIT = { angreifer: { emotional: 0.1, angriff: -0.05 }, staatsmann: { angriff: -0.1, sachlich: 0.05 }, populist: { sachlich: 0.1 }, technokrat: { emotional: 0.1, sachlich: -0.05 } };
    if (st && DUEL_FIT[st] && DUEL_FIT[st][styleId]) score += DUEL_FIT[st][styleId];

    const delta = Math.round((score - 0.5) * 2.4 * 10) / 10;
    const verdict = delta >= 0.6 ? 'Klarer Punktsieg!' : delta > 0 ? 'Knapp gewonnen.' : delta > -0.6 ? 'Das lief nicht rund.' : 'Ein Desaster!';
    g.duel.points += delta;
    g.duel.results.push({ topic, style: styleId, delta: delta + 0, verdict }); // + 0 vermeidet −0 (geht beim Speichern verloren)
    g.duel.round += 1;
    const res = { ok: true, topic, delta, verdict, done: g.duel.round >= g.duel.topics.length };
    if (res.done) {
      g.duel.points = Math.round(g.duel.points * sizeFactor(nationalShares(g)[g.party]) * 10) / 10;
      g.nat[g.party] += g.duel.points;
      candAdjust(g, Math.max(-0.5, Math.min(0.5, 0.15 * g.duel.points)), 0.04);
      journal(g, 'd', 'Elefantenrunde im Fernsehen', g.duel.points);
      addLog(g, 'duel', 'Elefantenrunde: Blitzumfrage ' + fmt(g.duel.points) + ' Punkte für euch.');
      res.total = g.duel.points;
      g.duelLast = { format: g.duel.format, opponents: g.duel.opponents, points: g.duel.points, results: g.duel.results };
      g.duel = null;
      g.duelDone = true;
    }
    return res;
  }

  // ---------- Wahlkreise und Erststimmen ----------
  // Jeder der 299 Wahlkreise startet mit seinem Erststimmenergebnis 2025. Die Erststimme folgt der
  // Entwicklung im Land (Hochburgen schwanken stärker), dazu kommt der Wahlkampf im Wahlkreis (g.wk).
  const WK_LIST = (WKD && WKD.list) || [];
  const WK_BY_NR = {};
  WK_LIST.forEach(w => { WK_BY_NR[w.nr] = w; });
  const WK_BY_STATE = {};
  WK_LIST.forEach(w => { (WK_BY_STATE[w.land] = WK_BY_STATE[w.land] || []).push(w); });
  const wkByNr = nr => WK_BY_NR[nr];
  const GRUNDMANDATE = 3; // Grundmandatsklausel: so viele Wahlkreissiege ersetzen die 5-%-Hürde

  function wkBonus(g, nr, p) {
    return (g.wk && g.wk[nr] && g.wk[nr][p]) || 0;
  }

  // Erststimmen im Wahlkreis aus den Stimmenanteilen des Landes (S).
  function wkSharesFrom(g, w, S) {
    const L = (WKD && WKD.land2025[w.land]) || {};
    const raw = {};
    let known = 0;
    CONTEST_IDS.forEach(p => {
      known += w.e[p] || 0;
      // Partei ohne Direktkandidatur 2025: Erststimme etwa 60 % ihrer Zweitstimme.
      const base = w.e[p] > 0 ? w.e[p] : 0.6 * (w.z[p] || 0);
      const ratio = Math.max(0.4, Math.min(1.8, base / Math.max(1, L[p] || 1)));
      const now = Number.isFinite(S[p]) ? S[p] : (L[p] || 0); // fehlt der Wert (alter Spielstand), keine Verschiebung
      raw[p] = Math.max(0.05, base + (now - (L[p] || 0)) * ratio + wkBonus(g, w.nr, p));
    });
    raw[D.OTHER.id] = Math.max(0.5, 100 - known);
    return normalize(raw);
  }

  function wkStanding(sh) {
    const order = CONTEST_IDS.slice().sort((a, b) => sh[b] - sh[a]);
    return { shares: sh, lead: order[0], second: order[1], margin: sh[order[0]] - sh[order[1]] };
  }

  // Projektion aller Wahlkreise: published = so, wie es die Umfragen zeigen.
  function wkProjection(g, published) {
    const cache = {};
    return WK_LIST.map(w => {
      const S = cache[w.land] || (cache[w.land] = published ? pollStateShares(g, w.land) : stateShares(g, w.land));
      return Object.assign({ nr: w.nr }, wkStanding(wkSharesFrom(g, w, S)));
    });
  }

  function wkShares(g, nr, published) {
    const w = WK_BY_NR[nr];
    if (!w) return null;
    return wkStanding(wkSharesFrom(g, w, published ? pollStateShares(g, w.land) : stateShares(g, w.land)));
  }

  function directCounts(proj) {
    const out = {};
    CONTEST_IDS.forEach(p => { out[p] = 0; });
    proj.forEach(x => { out[x.lead] = (out[x.lead] || 0) + 1; });
    return out;
  }

  // Direktkandidaturen: einmal je Spiel ausgelost, jeder Nachname nur einmal.
  const nameCache = { seed: null, gen: null, cand: null };
  function nameGen(g) {
    const seed = g.nameSeed || 1;
    if (nameCache.seed !== seed) {
      nameCache.seed = seed;
      nameCache.gen = NAMES ? NAMES.create(seed) : null;
      nameCache.cand = {};
      if (nameCache.gen) WK_LIST.forEach(w => CONTEST_IDS.forEach(p => { nameCache.cand[w.nr + ':' + p] = nameCache.gen.person(p, w.land); }));
    }
    return nameCache;
  }
  function wkCandidate(g, nr, p) {
    const c = nameGen(g).cand[nr + ':' + p];
    return c ? c.full : '';
  }
  // Neue Person (z. B. für ein Ministeramt), ohne Dopplung mit allen bisherigen Namen.
  function newPerson(g, p, land, opts) {
    const n = nameGen(g);
    return n.gen ? n.gen.person(p, land || 'NW', opts) : { first: 'N.', last: 'N.', full: 'N. N.', female: false };
  }

  function addWk(g, nr, p, amount) {
    if (!g.wk) g.wk = {};
    if (!g.wk[nr]) g.wk[nr] = {};
    g.wk[nr][p] = (g.wk[nr][p] || 0) + amount;
  }

  // Wahlabend: Wahlkreissieger, Grundmandate und Zweitstimmendeckung.
  function electWk(g) {
    const cache = {};
    return WK_LIST.map(w => {
      const S = cache[w.land] || (cache[w.land] = electionStateShares(g, w.land));
      const sh = wkSharesFrom(g, w, S);
      CONTEST_IDS.forEach(p => { sh[p] = Math.max(0.05, sh[p] + between(g, -1, 1)); });
      const st = wkStanding(sh);
      return { nr: w.nr, win: st.lead, second: st.second, pct: Math.round(sh[st.lead] * 10) / 10, margin: Math.round(st.margin * 10) / 10, seated: true };
    });
  }

  // Ein Wahlkreissieger erhält seinen Sitz nur, wenn die Zweitstimmen seiner Partei im Land genug
  // Sitze ergeben (Wahlrecht seit 2023). Die Sitze einer Partei werden dafür auf die Länder verteilt.
  function applyCoverage(g, wks, seats) {
    CONTEST_IDS.forEach(p => {
      const mine = wks.filter(x => x.win === p);
      if (!mine.length) return;
      if (!(seats[p] > 0)) { mine.forEach(x => { x.seated = false; }); return; }
      const votes = {};
      D.STATES.forEach(st => { votes[st.id] = electionStateShares(g, st.id)[p] * st.voters; });
      const per = sainteLague(votes, seats[p]);
      D.STATES.forEach(st => {
        const here = mine.filter(x => WK_BY_NR[x.nr].land === st.id).sort((a, b) => b.pct - a.pct);
        here.forEach((x, i) => { x.seated = i < (per[st.id] || 0); });
      });
    });
    return wks;
  }

  // ---------- Brandmauer ----------
  // Jede Partei kann die Brandmauer zur AfD in Stufen einreißen. Die Folgen kommen aus Umfragedaten
  // (D.FIREWALL): Anhänger, die eine Zusammenarbeit ablehnen, wenden sich ab; AfD-nahe Wähler kommen
  // dazu; Wählergruppen reagieren unterschiedlich; die Parteien, die die Mauer halten, mobilisieren.
  const FW_LEVELS = [
    { name: 'Brandmauer steht', short: 'hält' },
    { name: 'Zufallsmehrheiten mit der AfD in Kauf nehmen', short: 'bröckelt' },
    { name: 'Tolerierung durch die AfD nicht ausgeschlossen', short: 'Tolerierung' },
    { name: 'Offen für eine Koalition mit der AfD', short: 'Koalition' }
  ];
  // Wunschpartner für Leihstimmen: kleine Partei → großer Partner und umgekehrt.
  const LEIH = { fdp: 'union', gruene: 'spd', linke: 'spd', bsw: 'spd' };
  const LEIH_GROSS = { union: 'fdp', spd: 'gruene' };
  const fwLevel = (g, p) => (g && g.firewall && g.firewall[p]) || 0;
  const FW = () => D.FIREWALL || { acceptance: {}, groups: {}, mobilize: {}, ai: {} };

  function addSrc(g, p, q, amount) {
    if (!g.src) g.src = {};
    if (!g.src[p]) g.src[p] = {};
    g.src[p][q] = (g.src[p][q] || 0) + amount;
  }

  function openFirewall(g, p, level) {
    const old = fwLevel(g, p);
    if (p === 'afd' || !party(p) || level <= old) return '';
    level = Math.min(3, level);
    const steps = level - old;
    if (!g.firewall) g.firewall = {};
    g.firewall[p] = level;
    const fw = FW();
    const shares = nationalShares(g);
    const f = sizeFactor(shares[p]);
    // Je Stufe: AfD-nahe Wähler kommen dazu, Anhänger, die das ablehnen, wenden sich ab. Je weiter
    // die Öffnung, desto schwerer wiegt die Ablehnung (eine Koalition stößt viel mehr ab als Zufallsmehrheiten).
    const accs = (fw.acceptance && fw.acceptance[p]) || [0.3, 0.2, 0.1];
    const W = [1.2, 1.6, 2.4];
    let pull = 0;
    let loss = 0;
    let acc = 0;
    for (let l = old + 1; l <= level; l++) {
      acc = accs[l - 1];
      pull += 0.5 * f * (0.4 + acc);
      loss += W[l - 1] * f * (1 - acc);
    }
    g.nat[p] += pull - loss;
    addSrc(g, p, 'afd', pull);
    GROUP_IDS.forEach(k => { g.grp[k][p] += steps * f * ((fw.groups && fw.groups[k]) || 0) * 0.25; });
    // Im Osten ist die Zustimmung deutlich höher als im Westen.
    D.STATES.forEach(st => { g.reg[st.id][p] += steps * f * (fw.east || 0) * (st.east ? 3 : -0.6); });
    if (fw.youngLinke && p !== 'linke' && fwLevel(g, 'linke') === 0 && g.grp.jung) g.grp.jung.linke += fw.youngLinke * steps;
    // Wer die Brandmauer hält, mobilisiert dagegen.
    CONTEST_IDS.forEach(q => {
      if (q === p || q === 'afd' || fwLevel(g, q) > 0) return;
      g.mobPerm[q] = (g.mobPerm[q] || 0) + 0.015 * steps * ((fw.mobilize && fw.mobilize[q]) || 0.5);
    });
    g.nat.afd += 0.08 * steps; // Normalisierung: Die AfD gewinnt an Ansehen als möglicher Partner.
    changeSalience(g, 'demokratie', 0.012 * steps);
    changeSalience(g, 'migration', 0.006 * steps);
    if (p === g.party) {
      candAdjust(g, -0.3 * steps, 0); // die Kandidatur verliert an Ansehen in der Mitte
      g.money = Math.max(0, g.money - 0.3 * steps * (1 - acc)); // Spender und Verbände gehen auf Distanz
      if (!g.fwProtest) { g.fwProtest = true; schedule(g, 'fw_protest', 1, 2); }
    }
    return FW_LEVELS[level].name + ': Wähler aus dem AfD-Lager kommen dazu (' + fmt(pull) + '), aus der Mitte wenden sich viele ab (' + fmt(-loss) + ').';
  }

  function closeFirewall(g, p) {
    if (!fwLevel(g, p)) return '';
    g.firewall[p] = 0;
    const d = 0.3 * sizeFactor(nationalShares(g)[p]);
    g.nat[p] -= d;
    return 'Die Brandmauer steht wieder – aber die Kehrtwende kostet Glaubwürdigkeit (' + fmt(-d) + ').';
  }

  // KI-Parteien öffnen unter Druck: wenn die AfD sie überholt und Migration die Debatte bestimmt.
  function aiFirewall(g, me, shares, news) {
    const fw = FW();
    CONTEST_IDS.forEach(p => {
      if (p === me || p === 'afd' || !isShown(g, p)) return;
      const lv = fwLevel(g, p);
      if (lv >= 3) return;
      const pressure = 1 + Math.max(0, (shares.afd - shares[p]) / 10) + 20 * Math.max(0, g.salience.migration - D.SALIENCE0.migration);
      const offer = g.fwOffer && g.fwOffer[p] ? 2.5 : 1;
      if (g.week >= 2 && rand(g) < ((fw.ai && fw.ai[p]) || 0) * pressure * offer) {
        openFirewall(g, p, lv + 1);
        news.push({ prio: 2, text: 'Brandmauer: ' + party(p).name + ' – ' + FW_LEVELS[lv + 1].name + '. Proteste in vielen Städten.' });
      }
    });
  }

  // Wahlabend: Koalitionen mit der AfD, die mit eurer Partei eine Mehrheit hätten.
  function firewallOptions(g) {
    const r = g.result;
    const p = g.party;
    if (!r || p === 'afd' || !(r.seats[p] > 0) || !(r.seats.afd > 0) || fwLevel(g, p) >= 3) return [];
    const out = [];
    const two = r.seats[p] + r.seats.afd;
    if (two >= MAJORITY) out.push({ members: ['afd', p], seats: two });
    else {
      CONTEST_IDS.forEach(q => {
        if (q === p || q === 'afd' || !(r.seats[q] > 0) || fwLevel(g, q) < 3) return;
        const t = two + r.seats[q];
        if (t >= MAJORITY) out.push({ members: ['afd', p, q], seats: t });
      });
    }
    out.forEach(o => o.members.sort((a, b) => r.seats[b] - r.seats[a]));
    return out;
  }

  function breakFirewall(g, index) {
    const r = g.result;
    const opt = firewallOptions(g)[index];
    if (!opt) return { ok: false };
    openFirewall(g, g.party, 3);
    r.coalitions = findCoalitions(r.seats, g);
    r.government = opt.members;
    r.awaitingChoice = false;
    r.firewallBroken = true;
    finalizeOutcome(g, r);
    return { ok: true };
  }

  // ---------- Wochenwechsel ----------

  // ---------- Spitzenkandidatur: Bekanntheit, Beliebtheit, Kanzlerfrage ----------
  const candStart = p => (D.CAND_START && D.CAND_START[p]) || { known: 70, like: 0 };

  // ---------- Gegner mit Gesicht ----------
  // Fiktive Spitzenleute der anderen Parteien mit eigenem Stil; Rivalitäten (feud) bleiben über Legislaturen erhalten.
  const RIVAL_STYLES = [
    { id: 'angreifer', name: 'Angreifer:in', attack: 1.5, like: -0.2, desc: 'teilt hart aus' },
    { id: 'staatsmann', name: 'staatsmännisch', attack: 0.7, like: 0.3, desc: 'gibt sich über den Dingen stehend' },
    { id: 'populist', name: 'Populist:in', attack: 1.2, like: 0, desc: 'setzt auf Zuspitzung' },
    { id: 'technokrat', name: 'Technokrat:in', attack: 0.9, like: -0.1, desc: 'argumentiert mit Zahlen und Akten' }
  ];
  const rivalStyle = r => RIVAL_STYLES.find(s => s.id === (r && r.style)) || RIVAL_STYLES[1];
  function newRival(g, p) {
    const fringe = ['afd', 'linke', 'bsw'].indexOf(p) !== -1;
    const style = fringe && rand(g) < 0.5 ? 'populist' : pick(g, RIVAL_STYLES.filter(x => fringe || x.id !== 'populist')).id;
    const person = newPerson(g, p);
    return { name: String(person.full).replace(/\d+/g, '').trim(), style, born: (g.year || YEAR0) - 45 - Math.floor(rand(g) * 18), feud: 0, since: g.year || YEAR0 };
  }
  function initRivals(g) {
    g.rivals = g.rivals || {};
    delete g.rivals[g.party];
    CONTEST_IDS.forEach(p => {
      if (p === g.party) return;
      if (!g.rivals[p]) g.rivals[p] = newRival(g, p);
      g.aiLike[p] = Math.max(-5, Math.min(5, g.aiLike[p] + rivalStyle(g.rivals[p]).like));
    });
  }
  const rivalName = (g, p) => (g.rivals && g.rivals[p] ? g.rivals[p].name : party(p).short);
  const rivalLabel = (g, p) => (g.rivals && g.rivals[p] ? g.rivals[p].name + ' (' + party(p).short + ')' : party(p).name);
  const KNOWN_GAIN = { kundgebung: 0.04, talkshow: 0.06, presse: 0.03, buerger: 0.03, betrieb: 0.02, regional: 0.02 };

  // Wie sehr die Kandidatur gerade zieht (Punkte), im Verhältnis zur Größe der Partei.
  function candBonus(g) {
    if (!g.cand) return 0;
    const c0 = candStart(g.party);
    const raw = 0.3 * (g.cand.like - c0.like) + 0.015 * (g.cand.known - c0.known);
    return Math.max(-1.5, Math.min(1.5, raw * sizeFactor(BASE_SHARE[g.party] || 10)));
  }

  function candAdjust(g, dLike, dKnownShare) {
    if (!g.cand) return;
    g.cand.like = Math.max(-5, Math.min(5, g.cand.like + dLike));
    if (dKnownShare) g.cand.known = Math.min(99, g.cand.known + (100 - g.cand.known) * dKnownShare);
  }

  // Nach einem Auftritt: bekannter – und beliebter, wenn er gelingt.
  function candAfterAction(g, actionId, dShare, qm) {
    if (CANDIDATE_ACTIONS.indexOf(actionId) !== -1) {
      candAdjust(g, Math.max(-0.2, Math.min(0.1, 0.05 * (qm - 1) / 0.3 + 0.2 * dShare)), KNOWN_GAIN[actionId] || 0.02);
    }
    if (actionId === 'angriff') candAdjust(g, -0.08, 0); // Negativkampagnen kratzen am eigenen Image
  }

  // „Wen hätten Sie lieber als Bundeskanzler/in?“ – Kandidaturen mit Kanzleranspruch (und eure).
  function chancellorPoll(g) {
    const ids = (D.CHANCELLOR_RACE || []).slice();
    if (ids.indexOf(g.party) === -1) ids.push(g.party);
    const sh = pollShares(g);
    const like = p => (p === g.party ? g.cand.like : (g.aiLike && g.aiLike[p] !== undefined ? g.aiLike[p] : candStart(p).like));
    const score = {};
    let sum = 0;
    ids.forEach(p => { score[p] = Math.exp(0.6 * like(p) + 0.07 * sh[p]); sum += score[p]; });
    const out = {};
    ids.forEach(p => { out[p] = Math.round(score[p] / sum * 72 * 10) / 10; });
    out.keine = Math.round((100 - ids.reduce((s, p) => s + out[p], 0)) * 10) / 10;
    return out;
  }

  // Tagebuch des Wahlkampfs für den Rückblick am Wahlabend.
  function journal(g, kind, text, d) {
    if (!g.journal) g.journal = [];
    if (!g.nameSeed) g.nameSeed = 1;
    g.journal.push({ w: g.week, k: kind, x: text, d: Math.round(d * 100) / 100 + 0 });
  }

  // ---------- Kleinparteien ----------
  function furoreDown(g, d) {
    if (g.furore && g.minor && g.minor[g.furore]) g.minor[g.furore].trend -= d;
    else g.otherSwing -= d;
  }
  // Eigenständig ausgewiesen: Kleinparteien erst ab 3,5 %; die großen Parteien, solange sie nicht unter 2 % gefallen sind.
  // Die eigene Partei wird immer ausgewiesen.
  const isShown = (g, m) => {
    if (g && m === g.party) return true;
    if (PARTY_IDS.indexOf(m) !== -1) return !(g && g.folded && g.folded[m]);
    return !!(g && g.shown && g.shown[m]);
  };

  // Jede Woche: eigener Trend der Kleinparteien (Zufall, Protestwahl). Ihren Wahlkampf führen sie – sobald sie
  // ausgewiesen werden – wie die großen Parteien im KI-Zug (aiTurn).
  function minorTurn(g, shares, protest) {
    if (!g.minor) return;
    MINORS.forEach(m => {
      const mi = g.minor[m.id];
      mi.trend = Math.max(-1.2, Math.min(3.5, mi.trend + between(g, -0.37, 0.37) + 0.25 * protest));
    });
  }

  // Nach jeder Umfrage: Unter 2 % fällt eine Partei unter „Sonstige“, ab 3,5 % wird sie (wieder) eigenständig ausgewiesen.
  // Gibt die Änderungen zurück, damit auch die Legislatur sie melden kann.
  function updateMinorVisibility(g, quiet) {
    if (!g.shown) g.shown = {};
    if (!g.folded) g.folded = {};
    const nat = g.poll ? g.poll.nat : publishedShares(g);
    const changes = [];
    PARTY_IDS.forEach(p => {
      if (p === g.party) { delete g.folded[p]; return; }
      const v = nat[p] || 0;
      const name = party(p).name;
      if (!g.folded[p] && v < (D.MINOR_HIDE || 2)) {
        g.folded[p] = true;
        changes.push(name + ' rutscht mit ' + v.toFixed(1).replace('.', ',') + ' % unter „Sonstige“.');
      } else if (g.folded[p] && v >= (D.MINOR_SHOW || 3.5)) {
        delete g.folded[p];
        changes.push(name + ' wird mit ' + v.toFixed(1).replace('.', ',') + ' % wieder eigenständig ausgewiesen.');
      }
    });
    if (!quiet) changes.forEach(x => addLog(g, 'ai', x));
    MINORS.forEach(m => {
      const v = nat[m.id] || 0;
      if (!g.shown[m.id] && v >= (D.MINOR_SHOW || 3.5)) {
        g.shown[m.id] = true;
        const txt = 'Neu in der Sonntagsfrage: ' + m.name + (m.plural ? ' werden' : ' wird') + ' mit ' + v.toFixed(1).replace('.', ',') + ' % eigenständig ausgewiesen.';
        changes.push(txt);
        if (!quiet) addLog(g, 'ai', txt);
      } else if (g.shown[m.id] && v < (D.MINOR_HIDE || 2.5)) {
        g.shown[m.id] = false;
        const txt = m.name + (m.plural ? ' rutschen' : ' rutscht') + ' in den Umfragen wieder unter „Sonstige“ (' + v.toFixed(1).replace('.', ',') + ' %).';
        changes.push(txt);
        if (!quiet) addLog(g, 'ai', txt);
      }
    });
    return changes;
  }

  // Für die Anzeige: Kleinparteien, die nicht ausgewiesen werden, stecken in „Sonstige“.
  function shownIds(g) {
    return PARTY_IDS.filter(p => isShown(g, p)).concat(MINOR_IDS.filter(m => isShown(g, m)));
  }
  // Länderumfragen: Im Land zählt die Schwelle im Land – unter 3 % unter „Andere“, ab 3 % eigene Spalte, auch wenn die
  // Partei bundesweit unter „Sonstige“ läuft (z. B. Freie Wähler in Bayern). Die eigene Partei bleibt immer sichtbar.
  function mergeStateShares(g, sh) {
    const lim = D.STATE_HIDE || 3;
    return mergeShares(g, sh, m => (sh[m] || 0) >= lim, m => m !== g.party && (sh[m] || 0) < lim);
  }
  function mergeShares(g, sh, extra, fold) {
    const out = Object.assign({}, sh);
    PARTY_IDS.concat(MINOR_IDS).forEach(m => {
      if (!(m in out) || ((isShown(g, m) || (extra && extra(m))) && !(fold && fold(m)))) return;
      out[D.OTHER.id] = (out[D.OTHER.id] || 0) + (out[m] || 0);
      delete out[m];
    });
    return out;
  }

  // Die Konkurrenz macht echten Wahlkampf: Sie setzt ihre Themen, kämpft in knappen Ländern
  // und reagiert auf euch – mit Gegenkampagnen und indem sie eure Kernthemen besetzt.
  // Angriffe mit eurer Bilanz: gebrochene Versprechen, verschlechterte Lage, unpopuläre Gesetze (ohne Zufall – die Auswahl folgt der Woche).
  function recordJab(g) {
    const R = g.record;
    if (!R || g.week % 2) return null;
    const jabs = [];
    if (R.broken && R.broken.length) jabs.push('„Versprochen, gebrochen: ' + topicById(R.broken[0]).name + '!“');
    (R.lage || []).filter(x => x.imp < 0).forEach(x => jabs.push('„' + x.name + ': Unter euch ist es schlechter geworden!“'));
    (R.laws || []).filter(l => l.mine && !l.popular).forEach(l => jabs.push('„Wer „' + l.title + '“ beschlossen hat, sollte nicht mehr regieren!“'));
    return jabs.length ? jabs[g.week % jabs.length] : null;
  }

  function aiTurn(g) {
    const me = g.party;
    const shares = nationalShares(g);
    const prev = g.history.length ? (g.history[g.history.length - 1].real || g.history[g.history.length - 1].shares) : shares;
    const gain = shares[me] - prev[me];
    const states = {};
    D.STATES.forEach(st => { states[st.id] = electionStateShares(g, st.id); });
    const news = [];
    let attacks = 0;
    let steals = 0;
    // Wer euch am nächsten ist, reagiert zuerst.
    const rivals = CONTEST_IDS.filter(p => p !== me).sort((a, b) => Math.abs(shares[a] - shares[me]) - Math.abs(shares[b] - shares[me]));

    rivals.forEach(p => {
      if (!isShown(g, p)) return; // unter „Sonstige“ geführt: keine eigenen Kampagnen
      const name = party(p).name;
      const comp = competenceOf(g, p);
      let actions = 2;

      // Reaktion 1: Gegenkampagne, wenn ihr stark zulegt oder ihnen gefährlich nahe kommt.
      const gap = Math.abs(shares[p] - shares[me]);
      const hit = g.grudge && g.grudge[p] >= g.week - 1 ? 2 : 0; // gerade von euch angegriffen
      const rv = g.rivals && g.rivals[p];
      const threat = (gain >= 0.7 ? 1 : 0) + (gain >= 1.5 ? 1 : 0) + (gap < 3 ? 1 : 0) + hit + (rv && rv.feud >= 2 ? 1 : 0);
      if (threat && attacks < 1 && g.week >= 2 && rand(g) < (0.1 + 0.12 * threat) * rivalStyle(rv).attack) {
        const d = between(g, 0.2, 0.4) * (1 + 0.25 * (threat - 1)) * sizeFactor(shares[me]);
        g.nat[me] -= d;
        g.nat[p] += 0.1;
        attacks++;
        actions--;
        news.push({ prio: 2, text: (rv ? rivalLabel(g, p) + (rv.feud >= 2 ? ', euer Dauerrivale,' : '') + ' greift euch an – ' + (recordJab(g) || pick(g, ['„Die können es nicht!“', 'eine Negativkampagne läuft', 'Anzeigen gegen euer Programm', 'ein scharfes Interview'])) : name + ' startet eine Negativkampagne gegen euch') + ' (' + fmt(-d) + ').' });
      }

      // Reaktion 2: Themenklau – eines eurer Kernthemen wird besetzt.
      if (actions > 0 && steals < 1 && g.program && g.week >= 2 && rand(g) < 0.15) {
        const options = g.program.core.filter(t => !stolenBy(g, t) && comp[t] >= 30);
        if (options.length) {
          const t = options.reduce((a, b) => (comp[b] > comp[a] ? b : a));
          g.steal[t] = { party: p, until: g.week + 2 };
          g.compAdj[p][t] = Math.min(6, (g.compAdj[p][t] || 0) + 3);
          // Wer euer Kernthema besetzt, wirbt euch auch Wähler ab.
          if (!g.src) g.src = {};
          if (!g.src[p]) g.src[p] = {};
          g.src[p][me] = (g.src[p][me] || 0) + 0.2 * sizeFactor(shares[p]);
          g.nat[p] += 0.2 * sizeFactor(shares[p]);
          if (g.competence) g.competence[t] = Math.max(5, g.competence[t] - 2);
          changeSalience(g, t, 0.01);
          steals++;
          actions--;
          news.push({ prio: 2, text: name + ' besetzt euer Kernthema ' + topicById(t).name + ': Eure Aktionen dazu wirken zwei Wochen lang schwächer.' });
        }
      }

      while (actions > 0) {
        actions--;
        const nearHurdle = shares[p] > 2.5 && shares[p] < 7.5;
        const close = D.STATES.filter(st => {
          const s = states[st.id];
          const best = CONTEST_IDS.filter(q => q !== p).reduce((a, b) => (s[b] > s[a] ? b : a));
          return Math.abs(s[p] - s[best]) < 3;
        });
        if (rand(g) < (close.length ? 0.45 : 0.25) && !nearHurdle) {
          // Regionaler Kampf um knappe Länder.
          const st = close.length ? pick(g, close) : pick(g, D.STATES);
          const d = between(g, 0.5, 1.4) * sizeFactor(states[st.id][p]);
          g.reg[st.id][p] += d;
          mobilize(g, p, 0.012 * d, st.id);
          if (st.id in states && rand(g) < 0.35) {
            news.push({ prio: 1, text: name + ' kämpft mit einer Großkundgebung um ' + st.name + '.' });
          }
        } else {
          // Eigene Themen setzen.
          // Die Konkurrenz bespielt ihre Kernthemen (Wahlkampf 2025) – sichtbar in der Themenübersicht.
          const best = partyTopics(g, p).length ? partyTopics(g, p) : TOPIC_IDS.slice().sort((a, b) => comp[b] - comp[a]).slice(0, 3);
          const t = pick(g, best);
          g.aiPush = g.aiPush || {};
          (g.aiPush[p] = g.aiPush[p] || {})[t] = g.week;
          changeSalience(g, t, 0.01);
          const d = between(g, 0.02, 0.22) * sizeFactor(shares[p]);
          g.nat[p] += d;
          mobilize(g, p, 0.004);
          // Konfrontationslinie: Oft wird das Thema zum Schlagabtausch mit einem Rivalen.
          // Wer beim Thema kompetenter ist, gewinnt eher – und holt die Stimmen direkt beim Gegner.
          const foes = (D.RIVALS[p] || []).filter(o => o !== p);
          if (foes.length && rand(g) < 0.35) {
            const o = pick(g, foes);
            const won = rand(g) < Math.max(0.2, Math.min(0.8, 0.5 + (comp[t] - competenceOf(g, o)[t]) / 100));
            const w = won ? p : o;
            const l = won ? o : p;
            const dd = between(g, 0.1, 0.25) * sizeFactor(shares[w]);
            g.nat[w] += dd;
            if (!g.src) g.src = {};
            if (!g.src[w]) g.src[w] = {};
            g.src[w][l] = (g.src[w][l] || 0) + dd;
            const vs = o === me ? 'euch' : party(o).short;
            if (o === me || rand(g) < 0.4) {
              news.push({ prio: o === me ? 2 : 1, text: name + ' sucht beim Thema ' + topicById(t).name + ' den Schlagabtausch mit ' + vs + ' – ' +
                (w === me ? 'ihr behaltet die Oberhand (' + fmt(dd) + ').' : l === me ? party(w).short + ' punktet auf eure Kosten (' + fmt(-dd) + ').' : party(w).short + ' punktet.') });
            }
          } else if (rand(g) < 0.3) {
            news.push({ prio: 1, text: name + ' setzt im Wahlkampf auf das Thema ' + topicById(t).name + '.' });
          }
        }
      }
    });
    // Nachrichtenlage: Jede Woche schiebt sich ein Thema nach vorn. Davon profitieren die Parteien,
    // die dort als kompetent gelten – ihre Gegenpole verlieren.
    {
      const tot = TOPIC_IDS.reduce((s, t) => s + D.SALIENCE0[t], 0);
      let x = rand(g) * tot;
      const t = TOPIC_IDS.find(tt => (x -= D.SALIENCE0[tt]) <= 0) || TOPIC_IDS[0];
      const push = between(g, 0.006, 0.02);
      changeSalience(g, t, push);
      if (push >= 0.012) {
        const pc = shownIds(g).sort((a, b) => competenceOf(g, b)[t] - competenceOf(g, a)[t]);
        news.push({ prio: 1, text: 'Nachrichtenlage: ' + topicById(t).name + ' beherrscht die Schlagzeilen – Rückenwind für ' + party(pc[0]).short + ' und ' + party(pc[1]).short + ', Gegenwind für ' + party(pc[pc.length - 1]).short + '.' });
      }
    }
    PARTY_IDS.forEach(p => { g.nat[p] += between(g, -0.25, 0.25); }); // Stimmungsrauschen
    // Auch die Konkurrenz wirbt für die Briefwahl.
    if (g.week >= POSTAL_START - 1) {
      rivals.forEach(p => { if (rand(g) < 0.3) g.postalPush[p] = Math.min(0.25, (g.postalPush[p] || 0) + 0.04); });
    }

    // Auch die sonstigen Parteien gewinnen und verlieren: Verlieren die großen Parteien gemeinsam,
    // profitieren Kleinparteien von der Protest- und Frustwahl.
    const bigLoss = ['union', 'spd'].reduce((sum, p) => sum + (prev[p] - shares[p]), 0);
    const protest = Math.max(-0.3, Math.min(0.4, 0.25 * bigLoss));
    const swing = between(g, -0.3, 0.3) + 0.5 * protest;
    g.otherSwing = Math.max(-2, Math.min(3, (g.otherSwing || 0) + swing));
    minorTurn(g, shares, protest);

    // Die Konkurrenz kämpft auch um knappe Wahlkreise.
    if (WK_LIST.length) {
      const proj = wkProjection(g, false);
      CONTEST_IDS.forEach(p => {
        if (p === me || !isShown(g, p)) return;
        const close = proj.filter(x => (x.lead === p || x.second === p) && x.margin < 4);
        if (!close.length || rand(g) >= 0.6) return;
        const x = pick(g, close);
        addWk(g, x.nr, p, between(g, 0.4, 1.1));
        if ((x.lead === me || x.second === me) && rand(g) < 0.5) {
          news.push({ prio: 1, text: party(p).name + ' kämpft um den Wahlkreis ' + WK_BY_NR[x.nr].name + ' – dort ist es knapp.' });
        }
      });
    }

    aiFirewall(g, me, shares, news);

    // Höchstens drei Meldungen pro Woche: Angriffe zuerst.
    news.sort((a, b) => b.prio - a.prio).slice(0, 3).forEach(n => addLog(g, 'ai', n.text));
  }

  // Verbände im Wahlkampf: Verbündete mobilisieren und spenden, Gegner machen Stimmung gegen euch.
  function lobbyWeek(g) {
    if (!LB) return;
    const L = LB.init(g);
    const p = g.party;
    LB.LOBBIES.forEach(l => {
      const st = LB.status(L.rel[l.id]);
      if (st === 'ally') {
        if (l.power >= 2) mobilize(g, p, 0.002 * l.power);
        if (l.money >= 2) g.money = Math.round((g.money + 0.08 * l.money) * 100) / 100;
      } else if (st === 'foe' && l.power >= 2) g.nat[p] -= 0.02 * l.power;
    });
  }
  // Wahlprüfstein: Ein Verband fragt nach – eine Programmposition als Antwort.
  function lobbyPruefstein(g) { return LB ? LB.pickPruefstein(g, () => rand(g)) : null; }
  function lobbyAnswer(g, id, topic, opt) {
    if (!LB) return { ok: false };
    const r = LB.answerPruefstein(g, id, topic, opt);
    const l = LB.byId(id);
    let text = l.short + (r.s > 0 ? ' lobt eure Antwort und empfiehlt euch seinen Mitgliedern.' : r.s < 0 ? ' kritisiert eure Antwort öffentlich.' : ' nimmt eure Antwort zur Kenntnis.');
    if (r.s > 0 && l.power >= 2) mobilize(g, g.party, 0.003 * l.power);
    if (r.s < 0 && l.power >= 2) g.nat[g.party] -= 0.03 * l.power;
    if (!r.own) { candAdjust(g, -0.15, 0); text += ' Aber: Die Antwort widerspricht eurem eigenen Wahlprogramm – die Presse bemerkt es.'; }
    addLog(g, 'event', '📋 Wahlprüfstein: ' + text);
    return { ok: true, text, rel: r.rel };
  }

  function endWeek(g) {
    if (g.phase !== 'campaign' || g.pendingEvent || g.duel) return { ok: false };
    if (g.week === DUEL_WEEK && !g.duelDone) return { ok: false, text: 'Erst steht noch die Elefantenrunde an!' };

    aiTurn(g);
    lobbyWeek(g);
    castPostal(g);
    CONTEST_IDS.forEach(p => {
      g.nat[p] *= BONUS_DECAY;
      D.STATES.forEach(s => { g.reg[s.id][p] *= BONUS_DECAY; });
      GROUP_IDS.forEach(k => { g.grp[k][p] *= BONUS_DECAY; });
      g.mob[p] *= MOB_DECAY;
      D.STATES.forEach(s => { g.mobReg[s.id][p] *= MOB_DECAY; });
    });
    if (g.src) Object.keys(g.src).forEach(p => Object.keys(g.src[p]).forEach(q => { g.src[p][q] *= BONUS_DECAY; }));
    if (g.srcReg) Object.keys(g.srcReg).forEach(st => Object.keys(g.srcReg[st]).forEach(p => Object.keys(g.srcReg[st][p]).forEach(q => { g.srcReg[st][p][q] *= BONUS_DECAY; })));
    if (g.wk) Object.keys(g.wk).forEach(nr => Object.keys(g.wk[nr]).forEach(p => { g.wk[nr][p] *= BONUS_DECAY; }));
    if (g.cand) {
      const c0 = candStart(g.party);
      g.cand.like = c0.like + (g.cand.like - c0.like) * 0.92; // Eindrücke verblassen
      CONTEST_IDS.forEach(q => { if (q !== g.party) g.aiLike[q] = Math.max(-5, Math.min(5, (g.aiLike[q] || 0) + between(g, -0.12, 0.12))); });
      g.candHist.push({ w: g.week, like: Math.round(g.cand.like * 100) / 100 + 0, known: Math.round(g.cand.known) }); // + 0 vermeidet −0
    }
    g.otherSwing = (g.otherSwing || 0) * 0.92;
    if (g.sat) Object.keys(g.sat).forEach(c => Object.keys(g.sat[c]).forEach(k => { g.sat[c][k] *= BONUS_DECAY; })); // langsame Rückkehr zum Normalwert
    TOPIC_IDS.forEach(t => {
      g.salience[t] += SALIENCE_DRIFT * (salienceBase(g.year)[t] - g.salience[t]);
    });
    // Verbrauchte Aktionen erholen sich nur langsam.
    Object.keys(g.usage).forEach(k => { g.usage[k] *= 0.6; });

    rollPollErr(g);
    takePoll(g);
    updateMinorVisibility(g, false);
    g.history.push({ week: g.week, shares: g.poll.nat, real: nationalShares(g), groups: g.poll.groups });

    if (g.week >= g.maxWeeks) {
      g.phase = 'election';
      g.result = runElection(g);
      return { ok: true, election: true };
    }

    g.week += 1;
    g.ap = g.apMax;
    g.regWeek = {};
    g.natWeek = {};
    g.teamMax = teamMaxFor(g.week, g.party);
    g.team = g.teamMax;
    addLog(g, 'week', 'Woche ' + g.week + ' beginnt. Noch ' + (g.maxWeeks - g.week + 1) + ' Wochen bis zur Wahl.');
    const ms = dueMilestone(g);
    if (ms) g.pendingEvent = ms.id;
    const ev = ms || dueFollowUp(g) || drawEvent(g);
    return { ok: true, event: ev ? ev.id : null, duel: g.week === DUEL_WEEK };
  }

  // ---------- Wahlabend ----------

  function sainteLague(votes, seats) {
    const ids = Object.keys(votes);
    const out = {};
    ids.forEach(id => { out[id] = 0; });
    for (let i = 0; i < seats; i++) {
      let best = null;
      let bestQ = -1;
      ids.forEach(id => {
        const q = votes[id] / (2 * out[id] + 1);
        if (q > bestQ) { bestQ = q; best = id; }
      });
      out[best] += 1;
    }
    return out;
  }

  function coalitionViable(members, g) {
    if (members.indexOf('union') !== -1 && members.indexOf('linke') !== -1) return false; // Unvereinbarkeitsbeschluss
    const others = members.filter(m => m !== 'afd');
    // Brandmauer: Mit der AfD nur, wenn alle Partner offen für eine Koalition sind.
    if (members.length > 1 && members.indexOf('afd') !== -1 && !others.every(m => fwLevel(g, m) >= 3)) return false;
    // Wer die Brandmauer hält, regiert nicht mit Parteien, die Tolerierung oder Koalition mit der AfD anbieten.
    if (others.some(m => fwLevel(g, m) >= 2) && others.some(m => fwLevel(g, m) === 0)) return false;
    return true;
  }

  function findCoalitions(seats, g) {
    const ids = Object.keys(seats).filter(p => seats[p] > 0);
    const subsets = [];
    const n = ids.length;
    for (let mask = 1; mask < (1 << n); mask++) {
      const members = ids.filter((_, i) => mask & (1 << i));
      if (members.length > 3) continue;
      const total = members.reduce((s, p) => s + seats[p], 0);
      if (total < MAJORITY) continue;
      const minimal = members.every(m => total - seats[m] < MAJORITY);
      if (!minimal) continue;
      members.sort((a, b) => seats[b] - seats[a]);
      subsets.push({ members, seats: total, viable: coalitionViable(members, g) });
    }
    // Minderheitsregierung, von der AfD toleriert: nur mit Parteien, die das nicht ausschließen.
    if (g && seats.afd > 0) {
      for (let mask = 1; mask < (1 << n); mask++) {
        const members = ids.filter((_, i) => mask & (1 << i));
        if (members.length > 2 || members.indexOf('afd') !== -1) continue;
        const total = members.reduce((s, p) => s + seats[p], 0);
        if (total >= MAJORITY || total + seats.afd < MAJORITY) continue;
        if (!members.every(m => fwLevel(g, m) >= 2) || !coalitionViable(members, g)) continue;
        if (!members.every(m => total - seats[m] + seats.afd < MAJORITY)) continue;
        members.sort((a, b) => seats[b] - seats[a]);
        subsets.push({ members, seats: total, viable: true, tolerated: true });
      }
    }
    subsets.sort((a, b) => a.members.length - b.members.length || b.seats - a.seats);
    return subsets;
  }

  function formGovernment(seats, coalitions) {
    const order = Object.keys(seats).filter(p => seats[p] > 0).sort((a, b) => seats[b] - seats[a]);
    for (const formateur of order) {
      // Bevorzugt: echte Mehrheiten ohne AfD, dann Koalitionen mit der AfD, zuletzt Tolerierung.
      const rank = c => (c.tolerated ? 2 : 0) + (formateur !== 'afd' && c.members.indexOf('afd') !== -1 ? 1 : 0);
      const options = coalitions.filter(c => c.viable && c.members.indexOf(formateur) !== -1)
        .sort((a, b) => rank(a) - rank(b) || a.members.length - b.members.length || a.seats - b.seats);
      if (options.length) return { formateur, options };
    }
    return { formateur: order[0], options: [] };
  }

  function runElection(g) {
    const shares = electionShares(g);
    // Letzte Unsicherheit: Umfragen sind keine Wahlergebnisse.
    const raw = {};
    let sum = 0;
    ALL_IDS.forEach(p => { raw[p] = Math.max(0.3, shares[p] + between(g, -0.5, 0.5)); sum += raw[p]; });
    const final = {};
    ALL_IDS.forEach(p => { final[p] = Math.round(raw[p] / sum * 1000) / 10; });

    // Erststimmen: Wahlkreissieger; mit drei Direktmandaten zählt eine Partei auch unter 5 %.
    const wks = WK_LIST.length ? electWk(g) : [];
    const direct = directCounts(wks.map(x => ({ lead: x.win })));
    const inParliament = {};
    const grundmandat = [];
    CONTEST_IDS.forEach(p => {
      if (final[p] >= THRESHOLD) inParliament[p] = final[p];
      else if (direct[p] >= GRUNDMANDATE) { inParliament[p] = final[p]; grundmandat.push(p); }
    });
    const seats = sainteLague(inParliament, D.SEATS);
    CONTEST_IDS.forEach(p => { if (!(p in seats)) seats[p] = 0; });
    if (wks.length) applyCoverage(g, wks, seats);

    const coalitions = findCoalitions(seats, g);
    const gov = formGovernment(seats, coalitions);
    const home = g.homeWk && wks.find(x => x.nr === g.homeWk);

    const states = {};
    D.STATES.forEach(st => { states[st.id] = stateShares(g, st.id); });

    const result = {
      shares: final,
      seats,
      coalitions,
      formateur: gov.formateur,
      options: gov.options,
      government: null,
      states,
      strongest: leader(final),
      lastPoll: g.history.length ? g.history[g.history.length - 1].shares : null,
      wk: wks,
      direct,
      grundmandat,
      turnout: Math.round(turnout(g) * 10) / 10,
      turnoutStates: (() => { const o = {}; D.STATES.forEach(st => { o[st.id] = Math.round(turnout(g, st.id) * 10) / 10; }); return o; })(),
      homeWk: home ? { nr: home.nr, name: WK_BY_NR[home.nr].name, won: home.win === g.party, close: home.second === g.party } : null
    };

    // Ist die Spielerpartei Wahlsiegerin mit Optionen, wählt sie selbst die Koalition.
    if (gov.formateur === g.party && gov.options.length) {
      result.awaitingChoice = true;
    } else if (gov.options.length && gov.options[0].members.indexOf(g.party) !== -1 && gov.options[0].members.length > 1 && !gov.options[0].tolerated) {
      // Der Wahlsieger lädt euch zu Koalitionsverhandlungen ein.
      g.result = result;
      startNegotiation(g, gov.options[0].members, gov.formateur);
    } else if (gov.options.length) {
      result.government = gov.options[0].members;
      finalizeOutcome(g, result);
    } else {
      g.result = result;
      startHung(g);
    }
    return result;
  }

  function chooseCoalition(g, index) {
    const r = g.result;
    if (!r || !r.awaitingChoice) return { ok: false };
    const opt = r.options[index];
    if (!opt) return { ok: false };
    r.awaitingChoice = false;
    // Mit Partnern wird verhandelt; Alleinregierung oder tolerierte Minderheitsregierung gleich.
    if (opt.members.length > 1 && !opt.tolerated) { startNegotiation(g, opt.members, g.party); return { ok: true, negotiation: true }; }
    r.government = opt.members;
    finalizeOutcome(g, r);
    return { ok: true };
  }

  // ---------- Koalitionsverhandlungen ----------
  // Drei Streitthemen (wo euer Programm am weitesten von den Partnern entfernt ist), dann die
  // Ressortverteilung: Die Partner wählen reihum Ministerien, die Zahl richtet sich nach den Sitzen.
  // Das Verhandlungsklima muss am Ende mindestens 30 betragen, sonst platzen die Gespräche.
  const NEG_MIN = 30;
  const MINISTRIES = TD.MINISTRIES || [];
  const ministryById = id => MINISTRIES.find(m => m.id === id);
  const JUNIOR_BONUS = 1.15; // Juniorpartner bekommen meist etwas mehr Ressorts, als ihre Sitze hergeben

  function negotiationTopics(g, members) {
    const partners = members.filter(q => q !== g.party && party(q) && party(q).lean);
    const mine = t => (g.program && D.PROGRAM[t][g.program.positions[t]] ? D.PROGRAM[t][g.program.positions[t]].lean : party(g.party).lean[t]);
    const list = [];
    TOPIC_IDS.forEach(t => {
      let best = null;
      partners.forEach(q => {
        const diff = Math.abs(mine(t) - party(q).lean[t]);
        if (diff > 0 && (!best || diff > best.diff)) best = { q, diff };
      });
      if (best) list.push({ t, q: best.q, diff: best.diff, w: best.diff * g.salience[t] });
    });
    return list.sort((a, b) => b.w - a.w).slice(0, 3).map(x => ({
      t: x.t, q: x.q, diff: x.diff,
      mine: g.program ? g.program.positions[x.t] : D.PROGRAM[x.t].findIndex(o => o.lean === party(g.party).lean[x.t]),
      theirs: Math.max(0, D.PROGRAM[x.t].findIndex(o => o.lean === party(x.q).lean[x.t]))
    }));
  }

  function startNegotiation(g, members, lead) {
    const r = g.result;
    const topics = negotiationTopics(g, members);
    const avgDiff = topics.length ? topics.reduce((s, x) => s + x.diff, 0) / topics.length : 0;
    const mood = Math.max(35, Math.min(75, 58 + (lead === g.party ? 8 : 0) - 6 * avgDiff + Math.round(between(g, -4, 4))));
    r.neg = { members: members.slice(), lead, topics, step: 0, mood, kept: 0, given: 0, swap: 0, ministry: null, log: [], done: false, phase: 'sond' };
    return r.neg;
  }

  // Wie gern eine Partei ein Ressort hätte: Wunschliste zuerst, dann Gewicht × Kompetenz in den Themen.
  function ministryWish(p, id) {
    const wish = (TD.WISH && TD.WISH[p]) || [];
    const i = wish.indexOf(id);
    const m = ministryById(id);
    const P = party(p);
    const comp = P && P.competence ? m.topics.reduce((s, t) => s + (P.competence[t] || 40), 0) / m.topics.length : 40;
    return (i !== -1 ? 100 - 10 * i : 0) + m.weight * 4 + comp / 10;
  }

  // Reihenfolge der Auswahl: Sainte-Laguë über die 16 Ressorts (Kanzleramt geht an die führende Partei).
  function draftOrder(members, lead, seats) {
    const have = {};
    const w = {};
    members.forEach(p => { have[p] = 0; w[p] = (seats[p] || 1) * (p === lead ? 1 : JUNIOR_BONUS); });
    const order = [];
    for (let i = 0; i < MINISTRIES.length; i++) {
      let best = null;
      members.forEach(p => { if (!best || w[p] / (2 * have[p] + 1) > w[best] / (2 * have[best] + 1)) best = p; });
      order.push(best);
      have[best] += 1;
    }
    return order;
  }

  function startDraft(g) {
    const r = g.result;
    const n = r.neg;
    n.phase = 'draft';
    const order = draftOrder(n.members, n.lead, r.seats);
    // Tauschgeschäft „Inhalt gegen Ressort“: Für jedes Nachgeben im Tausch rückt eine eurer Wahlen nach vorn.
    for (let k = 0; k < (n.swap || 0); k++) {
      const i = order.indexOf(g.party, k);
      if (i > k) { order.splice(i, 1); order.splice(k, 0, g.party); }
    }
    n.draft = { order, pos: 0, picks: {} };
    draftAuto(g);
  }

  function draftPick(g, p, id, byPlayer) {
    const n = g.result.neg;
    n.draft.picks[id] = p;
    n.draft.pos += 1;
    if (!byPlayer) return;
    // Wer einem Partner sein Wunschressort wegnimmt, verschlechtert das Klima.
    n.members.filter(q => q !== p).forEach(q => {
      const i = ((TD.WISH && TD.WISH[q]) || []).indexOf(id);
      if (i === 0) n.mood -= 6;
      else if (i > 0 && i < 3) n.mood -= 3;
    });
    n.log.push(ministryById(id).short + ' geht an euch.');
  }

  // KI-Partner wählen, bis der Spieler dran ist oder alle Ressorts vergeben sind.
  function draftAuto(g) {
    const n = g.result.neg;
    const d = n.draft;
    while (d.pos < d.order.length && d.order[d.pos] !== g.party) {
      const p = d.order[d.pos];
      const free = MINISTRIES.filter(m => !d.picks[m.id]);
      const best = free.sort((a, b) => ministryWish(p, b.id) - ministryWish(p, a.id))[0];
      draftPick(g, p, best.id, false);
    }
    if (d.pos >= d.order.length) finishNegotiation(g);
  }

  function negotiate(g, choice) {
    const r = g.result;
    const n = r && r.neg;
    if (!n || n.done) return { ok: false };
    // Sondierung: offen in die Gespräche – oder eine rote Linie ziehen (das wichtigste Streitthema).
    if (n.phase === 'sond') {
      if (choice === 'rotelinie' && n.topics.length) {
        n.red = n.topics[0].t; n.mood -= 4;
        n.log.push('Sondierung: Ihr zieht eine rote Linie beim Thema ' + topicById(n.red).name + '.');
      } else { n.mood += 4; n.log.push('Sondierung in guter Atmosphäre – die Spitzen empfehlen Koalitionsverhandlungen.'); }
      n.phase = 'topics';
      if (!n.topics.length) startDraft(g);
      return { ok: true };
    }
    if (n.phase === 'ratify') return ratify(g, choice);
    if (n.phase === 'kanzler2') return kanzlerwahl(g, choice);
    if (n.step < n.topics.length) {
      const x = n.topics[n.step];
      const nameT = topicById(x.t).name;
      const red = n.red === x.t;
      if (choice === 'hart') { n.mood -= (10 + 4 * x.diff) * (red ? 0.5 : 1); n.kept += 1; n.log.push(nameT + ': Ihr setzt euch durch – „' + D.PROGRAM[x.t][x.mine].label + '“' + (red ? ' (rote Linie gehalten)' : '') + '.'); }
      else if (choice === 'kompromiss') { n.mood -= 3; n.kept += 0.5; if (red) n.redBroken = true; n.log.push(nameT + ': Kompromiss – beide Seiten geben etwas nach.' + (red ? ' Eure rote Linie ist aufgeweicht.' : '')); }
      else if (choice === 'nachgeben') { n.mood += 6; n.given += 1; if (red) n.redBroken = true; n.log.push(nameT + ': Ihr gebt nach – „' + D.PROGRAM[x.t][x.theirs].label + '“ kommt in den Vertrag.' + (red ? ' Die rote Linie ist gefallen!' : '')); }
      else if (choice === 'tausch') { n.mood += 3; n.given += 1; n.swap += 1; if (red) n.redBroken = true; n.log.push(nameT + ': Tauschgeschäft – ihr gebt nach und dürft dafür früher ein Ressort wählen.'); }
      else return { ok: false };
      x.choice = choice;
      n.mood = Math.max(0, Math.min(100, n.mood));
      n.step += 1;
      if (n.step === n.topics.length) startDraft(g);
      return { ok: true };
    }
    if (!n.draft) { startDraft(g); if (n.done) return { ok: true }; }
    const d = n.draft;
    if (d.order[d.pos] !== g.party) { draftAuto(g); return { ok: true }; }
    // Unbekannte Wahl (z. B. ein vergebenes Ressort): das liebste freie Ressort der eigenen Partei.
    let id = choice;
    if (!ministryById(id) || d.picks[id]) {
      id = MINISTRIES.filter(m => !d.picks[m.id]).sort((a, b) => ministryWish(g.party, b.id) - ministryWish(g.party, a.id))[0].id;
    }
    draftPick(g, g.party, id, true);
    n.mood = Math.max(0, Math.min(100, n.mood));
    draftAuto(g);
    return { ok: true };
  }

  // Punkte für die Ressorts: Gewicht der eigenen Ministerien gegenüber einem gleichmäßigen Anteil.
  function ministryPoints(n, p) {
    const picks = (n.draft && n.draft.picks) || {};
    const own = Object.keys(picks).filter(id => picks[id] === p);
    const total = MINISTRIES.reduce((s, m) => s + m.weight, 0);
    const ownW = own.reduce((s, id) => s + ministryById(id).weight, 0);
    return Math.round((ownW - total * own.length / Math.max(1, MINISTRIES.length)) * 0.8 + (picks.finanzen === p ? 3 : 0));
  }

  function finishNegotiation(g) {
    const r = g.result;
    const n = r.neg;
    n.step = n.topics.length + 1;
    if (n.mood >= NEG_MIN) {
      // Der Vertrag steht – jetzt muss die eigene Partei zustimmen (Mitgliedervotum oder Parteitag).
      n.phase = 'ratify';
      n.ministries = Object.assign({}, n.draft ? n.draft.picks : {});
      return;
    }
    n.done = true;
    failNegotiation(g);
  }
  // Zustimmung der Partei: SPD-Mitgliedervoten 2013–2025 zwischen 66 und 85 % Ja; Parteitage meist deutlicher.
  function approval(n) {
    return Math.max(0.2, Math.min(0.95, 0.72 + 0.05 * n.kept - 0.05 * n.given - (n.redBroken ? 0.18 : 0) + (n.red && !n.redBroken ? 0.05 : 0)));
  }
  function ratify(g, choice) {
    const n = g.result.neg;
    const vote = choice === 'mitglieder';
    const yes = Math.max(0.15, Math.min(0.97, approval(n) + between(g, -0.12, 0.12) + (vote ? -0.04 : 0.06)));
    n.ratify = { kind: vote ? 'mitglieder' : 'parteitag', yes: Math.round(yes * 1000) / 10 };
    if (yes < 0.5) {
      n.log.push((vote ? 'Mitgliedervotum' : 'Parteitag') + ': Nur ' + n.ratify.yes + ' % stimmen zu – der Koalitionsvertrag ist abgelehnt!');
      n.done = true;
      n.mood = 0;
      failNegotiation(g);
      return { ok: true };
    }
    n.log.push((vote ? 'Mitgliedervotum' : 'Parteitag') + ': ' + n.ratify.yes + ' % stimmen dem Koalitionsvertrag zu.' + (vote ? ' Starkes Mandat der Basis.' : ''));
    return kanzlerwahl(g);
  }
  // Kanzlerwahl nach Art. 63 GG: geheim, ohne Aussprache. Im 1. Wahlgang ist die Mehrheit der Mitglieder nötig
  // (Kanzlermehrheit). Scheitert er, folgt binnen 14 Tagen ein 2. Wahlgang (Vorbild: Merz am 6. Mai 2025, 310 von 316).
  function kanzlerwahl(g, choice) {
    const r = g.result;
    const n = r.neg;
    const seats = n.members.reduce((s, p) => s + (r.seats[p] || 0), 0);
    const cand = n.lead === g.party ? g.candidate : rivalName(g, n.lead);
    const unrest = (n.given >= 2 ? 0.01 : 0) + (n.redBroken ? 0.015 : 0) + (n.ratify && n.ratify.yes < 60 ? 0.01 : 0);
    const round = n.phase === 'kanzler2' ? 2 : 1;
    const rate = round === 1 ? between(g, 0, 0.035) + unrest : (choice === 'einschwoeren' ? between(g, 0, 0.01) : between(g, 0, 0.025));
    const yes = seats - Math.round(seats * rate);
    n.kanzler = n.kanzler || [];
    n.kanzler.push({ round, yes, need: MAJORITY });
    if (yes >= MAJORITY) {
      n.log.push((round === 2 ? '2. Wahlgang: ' : 'Kanzlerwahl: ') + cand + ' ist gewählt – ' + yes + ' Stimmen (nötig: ' + MAJORITY + ').');
      return completeNegotiation(g);
    }
    if (round === 1) {
      n.phase = 'kanzler2';
      n.log.push('Kanzlerwahl: ' + cand + ' fällt im 1. Wahlgang durch – nur ' + yes + ' von ' + MAJORITY + ' nötigen Stimmen. Abweichler in den eigenen Reihen!');
      return { ok: true };
    }
    // 3. Wahlphase (Art. 63 Abs. 4 GG): Es genügt die relative Mehrheit.
    n.log.push('Auch der 2. Wahlgang scheitert (' + yes + '). In der 3. Wahlphase reicht die relative Mehrheit – ' + cand + ' ist gewählt, aber angeschlagen.');
    n.weak = true;
    return completeNegotiation(g);
  }
  function completeNegotiation(g) {
    const r = g.result;
    const n = r.neg;
    n.done = true;
    n.phase = 'done';
    n.success = true;
    n.pts = Math.round(n.kept * 6 - n.given * 2 + ministryPoints(n, g.party) - (n.kanzler && n.kanzler.length > 1 ? 3 : 0) + (n.ratify && n.ratify.kind === 'mitglieder' ? 1 : 0));
    n.ministries = Object.assign({}, n.draft ? n.draft.picks : {});
    r.government = n.members.slice().sort((a, b) => (a === n.lead ? -1 : b === n.lead ? 1 : r.seats[b] - r.seats[a]));
    finalizeOutcome(g, r);
    return { ok: true };
  }
  function failNegotiation(g) {
    const r = g.result;
    const n = r.neg;
    n.success = false;
    const key = n.members.slice().sort().join();
    r.failedTalks = (r.failedTalks || []).concat([key]);
    const left = r.coalitions.filter(c => c.viable && r.failedTalks.indexOf(c.members.slice().sort().join()) === -1);
    if (n.lead === g.party) {
      r.options = (r.options || []).filter(o => r.failedTalks.indexOf(o.members.slice().sort().join()) === -1);
      if (r.options.length) { r.awaitingChoice = true; return; }
      startHung(g);
      return;
    } else {
      // Der Wahlsieger verhandelt mit anderen Partnern weiter – ohne euch.
      const other = left.filter(c => c.members.indexOf(n.lead) !== -1 && c.members.indexOf(g.party) === -1)
        .sort((a, b) => a.members.length - b.members.length || a.seats - b.seats)[0];
      if (!other) { startHung(g); return; }
      r.government = other.members;
    }
    finalizeOutcome(g, r);
  }

  // ---------- Keine Mehrheit: Kanzlerwahl nach Art. 63 GG ----------
  // Findet sich keine Koalition, schlägt der Bundespräsident die Spitze der stärksten Partei (ohne AfD) vor.
  // 1. und 2. Wahlphase: Kanzlermehrheit nötig. 3. Wahlphase (Art. 63 Abs. 4): Gewählt ist, wer die meisten
  // Stimmen erhält. Ohne Kanzlermehrheit könnte der Bundespräsident ernennen; im Spiel löst er dann immer den
  // Bundestag auf, und binnen 60 Tagen wird neu gewählt (Art. 39 GG). Vorbild für eine Duldung: das
  // „Magdeburger Modell“ (SPD-Grüne in Sachsen-Anhalt, 1994–2002, geduldet von der PDS).
  const leanE = (g, p, t) => (p === g.party && g.program && D.PROGRAM[t][g.program.positions[t]] ? D.PROGRAM[t][g.program.positions[t]].lean : ((party(p) && party(p).lean) ? party(p).lean[t] : 0));
  const partyDist = (g, a, b) => TOPIC_IDS.reduce((s, t) => s + Math.abs(leanE(g, a, t) - leanE(g, b, t)), 0);
  function startHung(g) {
    const r = g.result;
    const order = CONTEST_IDS.filter(p => r.seats[p] > 0 && p !== 'afd').sort((a, b) => r.seats[b] - r.seats[a]);
    const lead = order[0] || r.strongest;
    // Gefragt werden zuerst Parteien, die viele Stimmen bringen; bei Gleichstand die programmatisch nächsten.
    const tolerators = order.filter(p => p !== lead && coalitionViable([lead, p], g)).sort((a, b) => r.seats[b] - r.seats[a] || partyDist(g, lead, a) - partyDist(g, lead, b));
    r.hung = { lead, tolerators, tried: [], log: [], votes: [], duldung: null, done: false };
    r.awaitingChoice = false;
    g.phase = 'election';
    if (lead === g.party) { r.hung.step = 'strategy'; return; }
    aiHung(g);
  }
  // Die Wahlsiegerin ohne Mehrheit sucht eine Duldung – fragt sie euch, entscheidet ihr.
  function aiHung(g) {
    const r = g.result;
    const h = r.hung;
    for (const cand of h.tolerators.filter(p => h.tried.indexOf(p) === -1)) {
      if (cand === g.party) { h.step = 'ask'; return; }
      if (rand(g) < duldungChance(g, h.lead, cand)) {
        h.duldung = cand;
        h.log.push(party(h.lead).short + ' und ' + party(cand).short + ' vereinbaren eine Duldung: ' + party(cand).short + ' wählt mit und stützt die Regierung bei Haushalt und Gesetzen.');
        chancellorVote(g);
        return;
      }
      h.tried.push(cand);
      h.log.push('Gespräche über eine Duldung durch ' + party(cand).short + ' scheitern.');
    }
    h.log.push(party(h.lead).short + ' versucht es als Minderheitsregierung.');
    chancellorVote(g);
  }
  function duldungChance(g, lead, p) {
    return Math.max(0.2, Math.min(0.85, 0.85 - 0.025 * partyDist(g, lead, p)));
  }
  // Wo der Duldungspartner am weitesten von der Regierung entfernt ist, setzt er sein Anliegen durch.
  function concessionFor(g, lead, p) {
    const core = p === g.party && g.program && g.program.core.length ? g.program.core : TOPIC_IDS;
    const gap = t => Math.abs(leanE(g, p, t) - leanE(g, lead, t));
    const topic = core.slice().sort((a, b) => gap(b) - gap(a))[0];
    const lean = leanE(g, p, topic);
    return { topic, opt: Math.max(0, D.PROGRAM[topic].findIndex(o => o.lean === lean)) };
  }
  // Entscheidungen der Spielerpartei: strategy → 'minderheit' | 'duldung' (+ Partner) | 'neuwahl'; ask → 'dulden' | 'ablehnen'.
  function hungChoice(g, action, partner) {
    const r = g.result;
    const h = r && r.hung;
    if (!h || h.done) return { ok: false };
    if (h.step === 'strategy') {
      if (action === 'duldung') {
        const p = partner || h.tolerators.filter(x => h.tried.indexOf(x) === -1)[0];
        if (!p || h.tried.indexOf(p) !== -1 || h.tolerators.indexOf(p) === -1) return { ok: false };
        if (rand(g) < duldungChance(g, g.party, p)) {
          h.duldung = p;
          h.concession = concessionFor(g, g.party, p);
          h.log.push(party(p).short + ' sagt die Duldung zu. Der Preis: „' + D.PROGRAM[h.concession.topic][h.concession.opt].label + '“ kommt als Gesetz.');
          return chancellorVote(g);
        }
        h.tried.push(p);
        h.log.push(party(p).short + ' lehnt eine Duldung ab.');
        return { ok: true };
      }
      if (action === 'neuwahl') { h.wantNew = true; h.log.push(party(g.party).short + ' strebt Neuwahlen an und bittet den Bundespräsidenten, den Bundestag aufzulösen.'); }
      else h.log.push(party(g.party).short + ' wagt die Minderheitsregierung.');
      return chancellorVote(g);
    }
    if (h.step === 'ask') {
      if (action === 'dulden') {
        h.duldung = g.party;
        h.concession = concessionFor(g, h.lead, g.party);
        h.log.push('Ihr duldet die Minderheitsregierung von ' + party(h.lead).short + '. Euer Preis: „' + D.PROGRAM[h.concession.topic][h.concession.opt].label + '“ kommt als Gesetz.');
        return chancellorVote(g);
      }
      h.tried.push(g.party);
      h.log.push('Ihr lehnt eine Duldung ab.');
      aiHung(g);
      return { ok: true };
    }
    return { ok: false };
  }
  function chancellorVote(g) {
    const r = g.result;
    const h = r.hung;
    h.step = 'vote';
    const cand = h.lead === g.party ? g.candidate : rivalName(g, h.lead);
    const base = (r.seats[h.lead] || 0) + (h.duldung ? r.seats[h.duldung] || 0 : 0);
    for (let round = 1; round <= 2; round++) {
      const yes = base - Math.round(base * between(g, 0, 0.02));
      h.votes.push({ round, yes, need: MAJORITY });
      if (yes >= MAJORITY) { h.log.push(round + '. Wahlphase: ' + cand + ' ist mit ' + yes + ' Stimmen gewählt (Kanzlermehrheit ' + MAJORITY + ').'); return appointHung(g, true); }
      h.log.push(round + '. Wahlphase: ' + cand + ' erhält ' + yes + ' Stimmen – nötig wären ' + MAJORITY + '.');
    }
    // 3. Wahlphase: Gegenkandidaturen. Droht eine relative Mehrheit der AfD, stimmen die anderen für die Vorgeschlagene.
    const others = CONTEST_IDS.filter(p => r.seats[p] > 0 && p !== h.lead && p !== h.duldung);
    const rival = others.filter(p => p !== 'afd').sort((a, b) => r.seats[b] - r.seats[a])[0];
    let yes = base;
    const afd = r.seats.afd || 0;
    if (afd >= yes) { yes = CONTEST_IDS.filter(p => p !== 'afd').reduce((s, p) => s + (r.seats[p] || 0), 0); h.log.push('Um einen Kanzler der AfD zu verhindern, stimmen auch andere Fraktionen mit.'); }
    const rivalYes = rival ? r.seats[rival] : 0;
    h.phase3 = { yes, rival: rival || null, rivalYes, afd };
    h.log.push('3. Wahlphase: ' + cand + ' ' + yes + ' Stimmen' + (rival ? ', ' + party(rival).short + ' ' + rivalYes : '') + (afd ? ', AfD ' + afd : '') + '. ' + (yes >= MAJORITY ? 'Damit ist ' + cand + ' mit Kanzlermehrheit gewählt.' : 'Die Kanzlermehrheit wird wieder verfehlt.'));
    if (yes >= MAJORITY) return appointHung(g, true);
    // Art. 63 Abs. 4 GG lässt dem Bundespräsidenten die Wahl; im Spiel löst er ohne Kanzlermehrheit immer auf.
    h.log.push('Ohne Kanzlermehrheit ernennt der Bundespräsident niemanden und löst den Bundestag auf (Art. 63 Abs. 4 GG). Binnen 60 Tagen wird neu gewählt.');
    h.done = true;
    h.step = 'done';
    r.neuwahl = true;
    r.government = null;
    finalizeOutcome(g, r);
    return { ok: true };
  }
  function appointHung(g, majority) {
    const r = g.result;
    const h = r.hung;
    h.done = true;
    h.step = 'done';
    h.majority = majority;
    r.government = [h.lead];
    finalizeOutcome(g, r);
    return { ok: true };
  }
  // Neuwahl nach Auflösung: gleicher Wahltermin-Jahrgang, Stimmung vom Wahlabend, halbe Wahlkampfkasse
  // (die Erstattung der Wahlkampfkosten kommt erst später; Schätzung).
  function neuwahlCampaign(g) {
    const r = g.result;
    if (!r || !r.neuwahl) return null;
    const base = {};
    D.STATES.forEach(st => { base[st.id] = stateShares(g, st.id); });
    return {
      party: g.party,
      candidate: g.candidate,
      program: g.program ? JSON.parse(JSON.stringify(g.program)) : null,
      carry: { base, nameSeed: ((g.nameSeed || 1) * 31 + 104729) % 2147483647 || 1, career: g.career ? JSON.parse(JSON.stringify(g.career)) : undefined,
        firewall: Object.assign({}, g.firewall || {}), year: g.year || YEAR0, prevYear: g.prevYear, shown: Object.assign({}, g.shown || {}),
        money: Math.round(party(g.party).budget * 0.5 * 10) / 10, cand: g.cand ? Object.assign({}, g.cand) : undefined,
        world: g.world ? JSON.parse(JSON.stringify(g.world)) : undefined, prevSeats: Object.assign({}, r.seats), prevShares: Object.assign({}, r.shares),
        lobby: g.lobby ? Object.assign(JSON.parse(JSON.stringify(g.lobby)), { asked: [] }) : null, rivals: JSON.parse(JSON.stringify(g.rivals || {})),
        prevWk: (() => { const o = {}; (r.wk || []).forEach(w => { o[w.nr] = w.win; }); return o; })(),
        prevTurnout: { DE: r.turnout, states: r.turnoutStates || {} }, neuwahl: true }
    };
  }

  // Wahlziel der Partei: Mindestanteil, stärkste Kraft, eigene absolute Mehrheit
  // oder eine Sitzmehrheit gemeinsam mit Wunschpartnern (alle müssen im Bundestag sitzen).
  function goalReached(p, r) {
    const P = party(p);
    // „Wieder in den Bundestag“: Der Einzug zählt – auch über die Grundmandatsklausel.
    if (P.goalEnter) return r.seats[p] > 0;
    if (r.shares[p] < (P.goal || 0)) return false;
    if (P.mustLead && r.strongest !== p) return false;
    if (P.goalMajority && r.seats[p] < MAJORITY) return false;
    if (P.goalCoalition) {
      if (!P.goalCoalition.every(m => r.seats[m] > 0)) return false;
      if (P.goalCoalition.reduce((s, m) => s + r.seats[m], 0) < MAJORITY) return false;
    }
    return true;
  }

  function finalizeOutcome(g, r) {
    const p = g.party;
    const share = r.shares[p];
    const start = g.startShares[p];
    let status;
    if (!(r.seats[p] > 0)) status = 'raus';
    else if (r.government && r.government[0] === p) status = 'kanzler';
    else if (r.government && r.government.indexOf(p) !== -1) status = 'regierung';
    else status = 'opposition';

    const goal = goalReached(p, r);
    const bonus = { kanzler: 50, regierung: 30, opposition: 10, raus: 0 }[status];
    // Wer am Wahlabend die Brandmauer einreißt, regiert – aber gegen den Protest von Millionen.
    const fwPenalty = r.firewallBroken ? 25 : 0;
    // Erfolgreiche Koalitionsverhandlungen: durchgesetzte Positionen und Ressorts zählen.
    const negPts = r.neg && r.neg.success && r.government && r.government.indexOf(p) !== -1 ? r.neg.pts : 0;
    const score = Math.max(0, Math.round(50 + (share - start) * 10 + bonus + (goal ? 25 : 0) - fwPenalty + negPts));
    r.outcome = { status, goal, delta: share - start, score, rating: rating(score), firewall: !!r.firewallBroken };
    g.phase = 'done';
  }

  function rating(score) {
    if (score >= 140) return 'Historischer Triumph';
    if (score >= 110) return 'Glänzender Wahlsieg';
    if (score >= 85) return 'Respektables Ergebnis';
    if (score >= 60) return 'Durchwachsener Wahlabend';
    if (score >= 35) return 'Bittere Niederlage';
    return 'Debakel';
  }

  // ---------- Speichern ----------

  function serialize(g) { return JSON.stringify(g); }
  function deserialize(json) {
    const g = JSON.parse(json);
    if (g) applyYear(g.year || YEAR0);
    if (!g || !party(g.party) || (g.version !== 1 && g.version !== 2)) throw new Error('Ungültiger Spielstand');
    if (g.version === 1) {
      // Spielstände aus der Zeit vor dem Wahlprogramm: Parteilinie übernehmen, ohne Werte zu verändern.
      g.program = defaultProgram(g.party);
      g.competence = Object.assign({}, party(g.party).competence);
      g.prog = { nat: 0, east: 0 };
      g.finance = 'ok';
      g.version = 2;
    }
    // Themen, die nach dem Speichern dazugekommen sind (z. B. Wohnen), mit Ausgangswerten ergänzen.
    if (TOPIC_IDS.some(t => !(t in g.salience))) {
      TOPIC_IDS.forEach(t => { if (!(t in g.salience)) g.salience[t] = D.SALIENCE0[t]; });
      const sum = TOPIC_IDS.reduce((acc, t) => acc + g.salience[t], 0);
      TOPIC_IDS.forEach(t => { g.salience[t] /= sum; });
    }
    // Spielstände ohne Wählergruppen, KI-Gegner, Umfragefehler und Spätfolgen ergänzen.
    if (!g.grp) g.grp = {};
    GROUP_IDS.forEach(k => { if (!g.grp[k]) { g.grp[k] = {}; PARTY_IDS.forEach(p => { g.grp[k][p] = 0; }); } });
    if (!g.compAdj) { g.compAdj = {}; PARTY_IDS.forEach(p => { g.compAdj[p] = {}; }); }
    if (!g.steal) g.steal = {};
    if (!g.delayed) g.delayed = [];
    if (!g.pollErr) { g.pollErr = {}; ALL_IDS.forEach(p => { g.pollErr[p] = 0; }); }
    if (g.otherSwing === undefined) g.otherSwing = 0;
    if (!g.minor) { g.minor = {}; MINOR_IDS.forEach(m => { g.minor[m] = { trend: 0, nat: 0, reg: {} }; }); }
    if (!g.shown) g.shown = {};
    if (!g.cand) { g.cand = Object.assign({}, candStart(g.party)); g.aiLike = {}; PARTY_IDS.forEach(p => { g.aiLike[p] = candStart(p).like; }); g.candHist = [{ w: 0, like: g.cand.like, known: g.cand.known }]; }
    if (!g.rivals && g.aiLike) initRivals(g);
    if (!g.journal) g.journal = [];
    MINOR_IDS.forEach(m => { if (!(m in g.pollErr)) g.pollErr[m] = 0; });
    // Spielstände von vor den Kleinparteien: Umfrage mit den neuen Parteien neu erheben.
    if (g.poll && MINOR_IDS.some(m => !(m in g.poll.nat))) takePoll(g);
    // Ausweisung sofort nach aktuellem Stand prüfen (auch alte Spielstände: unter 2 % → „Sonstige“).
    if (g.poll) updateMinorVisibility(g, true);
    if (!g.postal) g.postal = { frac: {}, sum: {} };
    if (!g.postalPush) g.postalPush = {};
    if (!g.mobPerm) g.mobPerm = {};
    if (!g.grudge) g.grudge = {};
    if (!g.mob) { g.mob = {}; PARTY_IDS.forEach(p => { g.mob[p] = 0; }); }
    if (!g.mobReg) { g.mobReg = {}; D.STATES.forEach(st => { g.mobReg[st.id] = {}; PARTY_IDS.forEach(p => { g.mobReg[st.id][p] = 0; }); }); }
    // Kleinparteien voll im Spiel: fehlende Einträge ergänzen und ihren alten Sonderbonus (minor.nat/reg)
    // in die gemeinsamen Größen übernehmen – die Umfragewerte bleiben dabei gleich.
    MINOR_IDS.forEach(m => {
      if (!(m in g.nat)) g.nat[m] = 0;
      if (!(m in g.mob)) g.mob[m] = 0;
      if (g.aiLike && !(m in g.aiLike)) g.aiLike[m] = candStart(m).like;
      if (g.compAdj && !g.compAdj[m]) g.compAdj[m] = {};
      GROUP_IDS.forEach(k => { if (!(m in g.grp[k])) g.grp[k][m] = 0; });
      D.STATES.forEach(st => {
        if (g.reg[st.id] && !(m in g.reg[st.id])) g.reg[st.id][m] = 0;
        if (g.mobReg[st.id] && !(m in g.mobReg[st.id])) g.mobReg[st.id][m] = 0;
      });
      const mi = g.minor && g.minor[m];
      if (mi && (mi.nat || (mi.reg && Object.keys(mi.reg).length))) {
        g.nat[m] += mi.nat || 0;
        Object.keys(mi.reg || {}).forEach(st => { if (g.reg[st]) g.reg[st][m] += mi.reg[st]; });
        mi.nat = 0;
        mi.reg = {};
      }
    });
    if (g.rivals && g.aiLike && g.phase !== 'term' && MINOR_IDS.some(m => m !== g.party && !g.rivals[m])) initRivals(g);
    if (g.team === undefined) { g.teamMax = teamMaxFor(g.week, g.party); g.team = g.teamMax; }
    if (g.spendCount === undefined) { g.spendCount = 0; g.spendWeek = 0; }
    // In der Legislaturperiode wirkt das Wahlprogramm nicht mehr als Wahlkampf-Bonus.
    if (!g.progGroups && g.program && g.phase !== 'term') g.progGroups = programGroupEffects(g.party, g.program);
    if (!g.progState && g.program && g.phase !== 'term') g.progState = programTopicStates(programEffects(g.party, g.program));
    // Spielstände ohne Gruppenverlauf: aktuellen Stand nachtragen, damit die Gruppen-Umfragen funktionieren.
    if (g.history && g.history.length && !g.history[g.history.length - 1].groups) g.history[g.history.length - 1].groups = allGroupShares(g);
    if (g.sat && Object.keys(g.sat).some(key => key.indexOf('|') === -1)) g.sat = {}; // altes Format
    if (!g.poll) takePoll(g);
    if (!g.grpStart) g.grpStart = {};
    GROUP_IDS.forEach(k => { if (!(k in g.grpStart)) g.grpStart[k] = groupShares(g, k)[g.party]; });
    if (!g.lobby && LB && g.program) LB.init(g);
    const line = defaultProgram(g.party);
    TOPIC_IDS.forEach(t => {
      if (!(t in g.program.positions)) g.program.positions[t] = line.positions[t];
      if (!(t in g.competence)) g.competence[t] = party(g.party).competence[t];
    });
    return g;
  }

  const engine = {
    MAX_WEEKS, AP_PER_WEEK, TEAM_PER_WEEK, TEAM_LATE, TEAM_LATE_WEEK, CANDIDATE_ACTIONS, isTeamAction, DUEL_WEEK, THRESHOLD, MAJORITY,
    ACTIONS, EVENTS, DUEL_STYLES, MILESTONES, MEGATRENDS, salienceBase,
    party, stateById, topicById, eventById, eventText,
    goalReached, gaffeTopic, defaultProgram, validateProgram, programEffects, positionEffect, competenceOf, isCore,
    newGame, nationalShares, stateShares, leader, issueEffect,
    publishedShares, publishedStateShares, groupShares, pollShares, pollStateShares, pollGroupShares, groupMix, groupEfficiency, groupEffect, stolenBy, channelFit, stateWeights,
    POLL_RANGE, MONTHS, MONTHS_S, WEEKDAYS, dayUTC, addDays, dayNum, lastSunday, isoMonday, isoWeek, fmtDate, fmtRange, electionDate, weekStart, weekLabel, weekDay, weekOf,
    localRng, pollMargin, institutePolls, pollAverage, campaignPolls, campaignAverage, GROUP_IDS, RIVAL_STYLES, rivalName, rivalLabel, rivalStyle, wkCandidate, newPerson, candBonus, chancellorPoll, MINOR_IDS, CONTEST_IDS, isShown, shownIds, mergeShares, mergeStateShares, partyTopics, steerPreview, WK_LIST, WK_BY_STATE, wkByNr, wkShares, wkProjection, directCounts, GRUNDMANDATE, FW_LEVELS, fwLevel, openFirewall, closeFirewall, firewallOptions, breakFirewall, flowSummary, steerVotes, stateFlows, regionFactor, nationalFactor, pickScenarios, SCENARIOS: SC, CITIZEN_QUESTIONS: CQ, CQ_ACTIONS, CQ_COMP, pickCitizenQuestions, citizenCompetence, focusFactor, saturatedContexts, groupSat, turnout, mobFactor, mobPotential, postalCast, postalShare, groupPostal, postalAffinity, electionShares, POSTAL_START, positionAppeal, programStateEffect, stateTopicFactor, stateTopTopics, groupTopicsInState, localTopicFactor, programTopicStates,
    actionCost, canAct, performAction, moneyWarning, spendenAvailable, spendenYield,
    drawEvent, resolveEvent, hungChoice, neuwahlCampaign, startHung,
    startDuel, duelAnswer,
    endWeek, duelClosing, sainteLague, findCoalitions, coalitionViable, chooseCoalition, negotiate, MINISTRIES, NEG_MIN, ministryById, ministryWish, draftOrder,
    serialize, deserialize, applyYear, YEAR0, lobbyPruefstein, lobbyAnswer, LB
  };
  // Interne Bausteine für die Legislaturperiode (js/term.js).
  engine._api = { salienceBase, rand, between, pick, stateShares, nationalShares, takePoll, rollPollErr, updateMinorVisibility, changeSalience,
    fwLevel, candStart, sizeFactor, BASE_SHARE, PARTY_IDS, ALL_IDS, TOPIC_IDS, MINOR_IDS, normalize, positionAppeal, newPerson,
    pollShares, pollStateShares, TD, GEN, W, competenceOf };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = engine;
  } else {
    root.BTW_ENGINE = engine;
  }
})(this);
