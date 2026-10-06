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

  const MAX_WEEKS = 8;
  const AP_PER_WEEK = 3;
  const DUEL_WEEK = 7;
  const ISSUE_K = 40;          // Stärke des Themen-Effekts
  const BONUS_DECAY = 0.88;    // Wahlkampf-Effekte verblassen pro Woche
  const SALIENCE_DRIFT = 0.1;  // Themen kehren langsam zur Normalität zurück
  const THRESHOLD = 5;
  const MAJORITY = Math.floor(D.SEATS / 2) + 1;

  const PARTY_IDS = D.PARTIES.map(p => p.id);
  const ALL_IDS = PARTY_IDS.concat([D.OTHER.id]);
  const TOPIC_IDS = D.TOPICS.map(t => t.id);
  const TOTAL_VOTERS = D.STATES.reduce((s, st) => s + st.voters, 0);

  const party = id => D.PARTIES.find(p => p.id === id);
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
      const dComp = -10 * deviation + (core ? 12 : 0);
      competence[t] += dComp;
      nat += dNat;
      east += dEast;
      cost += opt.cost;
      details[t] = { deviation, nat: dNat, east: dEast, comp: dComp, core };
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
    return { competence, nat, east, cost, budget, finance, details };
  }

  function applyProgram(g, prog) {
    const fx = programEffects(g.party, prog);
    g.program = { slogan: String(prog.slogan).trim().slice(0, 60), core: prog.core.slice(), positions: Object.assign({}, prog.positions) };
    g.competence = fx.competence;
    g.prog = { nat: fx.nat, east: fx.east };
    g.finance = fx.finance;
    g.program.core.forEach(t => changeSalience(g, t, 0.02));
  }

  function competenceOf(g, p) {
    return p === g.party && g.competence ? g.competence : party(p).competence;
  }

  function isCore(g, topic) {
    return !!(g.program && g.program.core.indexOf(topic) !== -1);
  }

  function newGame(partyId, candidate, seed, program) {
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
      rng: (seed === undefined ? Math.floor(Math.random() * 2 ** 31) : seed) | 0
    };
    PARTY_IDS.forEach(p => { g.nat[p] = 0; });
    D.STATES.forEach(s => {
      g.reg[s.id] = {};
      PARTY_IDS.forEach(p => { g.reg[s.id][p] = 0; });
    });
    // Startpunkt ist die aktuelle Sonntagsfrage, das Programm wirkt ab der ersten Umfrage.
    g.startShares = nationalShares(g);
    g.history.push({ week: 0, shares: g.startShares });
    addLog(g, 'start', 'Der Wahlkampf beginnt! Noch ' + MAX_WEEKS + ' Wochen bis zur Bundestagswahl.');
    applyProgram(g, program);
    const now = nationalShares(g)[partyId];
    addLog(g, 'event', 'Wahlprogramm „' + g.program.slogan + '“ vorgestellt. Erste Umfrage: ' +
      now.toFixed(1).replace('.', ',') + ' % (' + fmt(now - g.startShares[partyId]) + ').');
    return g;
  }

  function addLog(g, type, text) {
    g.log.unshift({ week: g.week, type, text });
    if (g.log.length > 80) g.log.length = 80;
  }

  // ---------- Umfragewerte ----------

  function issueEffect(g, p) {
    const comp = competenceOf(g, p);
    let e = 0;
    TOPIC_IDS.forEach(t => {
      e += (g.salience[t] - D.SALIENCE0[t]) * (comp[t] - MEAN_COMPETENCE[t]) / 100;
    });
    return ISSUE_K * e;
  }

  function stateShares(g, stateId) {
    const st = stateById(stateId);
    const raw = {};
    let other = 100;
    PARTY_IDS.forEach(p => {
      other -= st.result[p];
      const prog = p === g.party && g.prog ? g.prog.nat + (st.east ? g.prog.east : 0) : 0;
      raw[p] = Math.max(0.2, st.result[p] + g.nat[p] + g.reg[stateId][p] + prog + issueEffect(g, p));
    });
    raw[D.OTHER.id] = Math.max(0.5, other);
    const sum = ALL_IDS.reduce((s, p) => s + raw[p], 0);
    const out = {};
    ALL_IDS.forEach(p => { out[p] = raw[p] / sum * 100; });
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

  function leader(shares) {
    return PARTY_IDS.reduce((best, p) => (shares[p] > shares[best] ? p : best), PARTY_IDS[0]);
  }

  // ---------- Hilfsfunktionen für Effekte ----------

  function compMod(g, topic) {
    return (competenceOf(g, g.party)[topic] - 50) / 50;
  }

  function changeSalience(g, topic, delta) {
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
    return 1 / (1 + 0.5 * n);
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
      desc: 'Füllt die Wahlkampfkasse auf.' }
  ];

  function actionCost(actionId, stateId) {
    switch (actionId) {
      case 'kundgebung': return 0.4;
      case 'plakate': return Math.round((0.2 + 0.12 * (stateById(stateId) || { voters: 3 }).voters) * 10) / 10;
      case 'haustuer': return 0.1;
      case 'tvspot': return 2.5;
      case 'social': return 0.6;
      default: return 0;
    }
  }

  // Hinweis, wenn voraussichtlich Geld übrig bleibt: mehr in der Kasse, als ein TV-Spot pro
  // verbleibender Woche kosten würde (in der letzten Woche: genug für mindestens einen TV-Spot).
  function moneyWarning(g) {
    if (g.phase !== 'campaign') return null;
    const tv = actionCost('tvspot');
    const weeksLeft = g.maxWeeks - g.week + 1;
    const lastWeek = weeksLeft <= 1;
    const threshold = lastWeek ? tv : weeksLeft * tv;
    if (lastWeek ? g.money + 1e-9 < threshold : g.money <= threshold) return null;
    return { money: g.money, weeksLeft, lastWeek, tvCost: tv };
  }

  function canAct(g) {
    return g.phase === 'campaign' && !g.pendingEvent && !g.duel && g.ap > 0;
  }

  function performAction(g, actionId, target) {
    target = target || {};
    const action = ACTIONS.find(a => a.id === actionId);
    if (!action) return { ok: false, text: 'Unbekannte Aktion.' };
    if (!canAct(g)) return { ok: false, text: 'Gerade ist keine Aktion möglich.' };
    const st = stateById(target.state);
    const topic = target.topic;
    if (action.scope === 'region' && !st) return { ok: false, text: 'Bitte zuerst ein Bundesland wählen.' };
    if (action.scope === 'topic' && !topicById(topic)) return { ok: false, text: 'Bitte zuerst ein Thema wählen.' };
    const cost = actionCost(actionId, target.state);
    if (g.money + 1e-9 < cost) return { ok: false, text: 'Dafür reicht das Geld in der Wahlkampfkasse nicht.' };

    g.ap -= 1;
    g.money = Math.round((g.money - cost) * 100) / 100;
    const p = g.party;
    // Aktionen zu Kernthemen des Wahlprogramms wirken stärker.
    const r = reach(g) * (action.scope === 'topic' && isCore(g, topic) ? 1.25 : 1);
    let text;

    switch (actionId) {
      case 'kundgebung': {
        const d = 1.7 * wear(g, 'kundgebung:' + st.id) * r * between(g, 0.7, 1.3);
        g.reg[st.id][p] += d;
        g.nat[p] += 0.1;
        text = pick(g, ['Volle Plätze', 'Begeisterte Menge', 'Solider Auftritt']) +
          ' bei der Kundgebung in ' + st.name + ' (' + fmt(d) + ' Pkt. im Land).';
        break;
      }
      case 'plakate': {
        const d = 1.3 * wear(g, 'plakate:' + st.id) * r * between(g, 0.8, 1.2);
        g.reg[st.id][p] += d;
        text = 'Plakate hängen in ganz ' + st.name + ' (' + fmt(d) + ' Pkt. im Land).';
        break;
      }
      case 'haustuer': {
        const d = (1.0 + 0.6 / Math.sqrt(st.voters)) * wear(g, 'haustuer:' + st.id) * r * between(g, 0.7, 1.3);
        g.reg[st.id][p] += d;
        text = 'Ehrenamtliche klingeln an tausenden Türen in ' + st.name + ' (' + fmt(d) + ' Pkt. im Land).';
        break;
      }
      case 'tvspot': {
        const d = Math.max(0.1, (0.5 + 0.8 * compMod(g, topic)) * wear(g, 'tvspot:' + topic) * r * between(g, 0.8, 1.2));
        g.nat[p] += d;
        changeSalience(g, topic, 0.03);
        text = 'Euer TV-Spot zum Thema ' + topicById(topic).name + ' läuft zur besten Sendezeit (' + fmt(d) + ' bundesweit).';
        break;
      }
      case 'social': {
        changeSalience(g, topic, 0.015);
        if (rand(g) < 0.25 - 0.1 * compMod(g, topic)) {
          const d = between(g, 0.4, 1.0);
          g.nat[p] -= d;
          text = 'Shitstorm! Ein Post zum Thema ' + topicById(topic).name + ' geht nach hinten los (' + fmt(-d) + ').';
        } else {
          const d = between(g, 0.3, 0.8) * wear(g, 'social:' + topic) * r;
          g.nat[p] += d;
          text = 'Euer Clip zum Thema ' + topicById(topic).name + ' geht viral (' + fmt(d) + ').';
        }
        break;
      }
      case 'presse': {
        changeSalience(g, topic, 0.045);
        const d = 0.15 * compMod(g, topic);
        g.nat[p] += d;
        text = 'Pressekonferenz: ' + topicById(topic).name + ' bestimmt jetzt stärker die Debatte.';
        break;
      }
      case 'talkshow': {
        const comp = competenceOf(g, p)[topic];
        if (rand(g) < 0.35 + 0.45 * comp / 100) {
          const d = 0.7 * wear(g, 'talkshow') * r;
          g.nat[p] += d;
          text = 'Starker Talkshow-Auftritt zum Thema ' + topicById(topic).name + ' (' + fmt(d) + ').';
        } else {
          g.nat[p] -= 0.5;
          text = 'In der Talkshow zum Thema ' + topicById(topic).name + ' ins Schwimmen geraten (−0.5).';
        }
        break;
      }
      case 'spenden': {
        const m = Math.round((0.8 + 0.08 * party(p).budget + between(g, 0, 0.5)) * wear(g, 'spenden') * 10) / 10;
        g.money = Math.round((g.money + m) * 100) / 100;
        text = 'Das Spendendinner bringt ' + m.toFixed(1).replace('.', ',') + ' Mio. € ein.';
        break;
      }
    }
    addLog(g, 'action', text);
    return { ok: true, text };
  }

  // ---------- Ereignisse ----------

  function otherParty(g) {
    return pick(g, PARTY_IDS.filter(p => p !== g.party));
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
          apply: g => { g.money -= 0.3; g.nat[g.party] += 1.0; return 'Das gemeinsame Konzert wird ein Erfolg (+1.0).'; } },
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
        { label: 'Strompreisdeckel fordern', hint: 'Wirkt je nach Sozialkompetenz',
          apply: g => { const d = 0.2 + 0.7 * compMod(g, 'soziales'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
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
        { label: 'Rentenniveau garantieren', hint: 'Wirkt je nach Sozialkompetenz',
          apply: g => { const d = 0.2 + 0.9 * compMod(g, 'soziales'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
        { label: 'Ehrlich sein: Wir müssen länger arbeiten', hint: 'Mutig, eher unpopulär',
          apply: g => { const d = 0.5 * compMod(g, 'wirtschaft') - 0.5; g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } }
      ]
    },
    {
      id: 'grossspende', title: 'Unternehmer bietet Spende an',
      text: 'Ein Unternehmer möchte euren Wahlkampf mit 2 Mio. € unterstützen.',
      choices: [
        { label: 'Annehmen', hint: '+2 Mio. €, kleines Risiko',
          apply: g => { g.money += 2; if (rand(g) < 0.25) { g.nat[g.party] -= 0.5; return 'Die Spende wird kritisch diskutiert (−0.5), aber die Kasse ist voll.'; } return 'Die Wahlkampfkasse ist gut gefüllt (+2 Mio. €).'; } },
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
      id: 'parteitag', title: 'Streit auf dem Parteitag',
      text: 'Zwei Parteiflügel liefern sich einen offenen Schlagabtausch. Die Kameras laufen.',
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
      id: 'wahlomat', title: 'Der Wahl-O-Mat ist online',
      text: 'Millionen Menschen testen ihre Übereinstimmung mit den Parteien. Gerade kleinere Parteien profitieren.',
      choices: [
        { label: 'Prima!', hint: 'Mehr Effekt für kleine Parteien',
          apply: g => { const d = nationalShares(g)[g.party] < 9 ? 0.6 : 0.2; g.nat[g.party] += d; return 'Mehr Aufmerksamkeit für euer Programm (' + fmt(d) + ').'; } }
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
        { label: 'Kita-Garantie versprechen', hint: 'Wirkt je nach Familienkompetenz',
          apply: g => { const d = 0.3 + 0.8 * compMod(g, 'familie'); g.nat[g.party] += d; return 'Reaktion der Wähler: ' + fmt(d) + '.'; } },
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

  function eventById(id) { return EVENTS.find(e => e.id === id); }

  function eventText(g, ev) {
    let text = typeof ev.text === 'function' ? ev.text(g) : ev.text;
    if (ev.id === 'gegnerskandal' && g.eventTarget) {
      text = 'Bei der Partei „' + party(g.eventTarget).name + '“ ist eine peinliche Chatgruppe aufgeflogen. Ihre Umfragewerte sinken.';
    }
    return text;
  }

  function drawEvent(g) {
    const pool = EVENTS.filter(e => g.usedEvents.indexOf(e.id) === -1);
    if (!pool.length) return null;
    const ev = pick(g, pool);
    g.usedEvents.push(ev.id);
    if (ev.before) ev.before(g);
    g.pendingEvent = ev.id;
    return ev;
  }

  function resolveEvent(g, choiceIndex) {
    const ev = eventById(g.pendingEvent);
    if (!ev) return { ok: false, text: 'Kein offenes Ereignis.' };
    const choice = ev.choices[choiceIndex];
    if (!choice) return { ok: false, text: 'Ungültige Auswahl.' };
    const text = choice.apply(g);
    g.money = Math.max(0, Math.round(g.money * 100) / 100);
    g.pendingEvent = null;
    addLog(g, 'event', ev.title + ': ' + text);
    return { ok: true, text };
  }

  // ---------- TV-Duell / Elefantenrunde ----------

  const DUEL_STYLES = [
    { id: 'sachlich', name: 'Sachlich argumentieren', desc: 'Punktet, wenn du beim Thema kompetent bist.' },
    { id: 'angriff', name: 'Angreifen', desc: 'Hohes Risiko, hoher Gewinn.' },
    { id: 'emotional', name: 'Persönliche Geschichte erzählen', desc: 'Solide, kaum Abhängigkeit vom Thema.' }
  ];

  function startDuel(g) {
    const topics = TOPIC_IDS.slice().sort((a, b) => g.salience[b] - g.salience[a]).slice(0, 3);
    g.duel = { topics, round: 0, points: 0, results: [] };
    return g.duel;
  }

  function duelAnswer(g, styleId) {
    if (!g.duel) return { ok: false, text: 'Kein TV-Duell aktiv.' };
    const topic = g.duel.topics[g.duel.round];
    const comp = competenceOf(g, g.party)[topic] / 100;
    let score;
    if (styleId === 'sachlich') score = 0.15 + comp * 0.8 + between(g, -0.15, 0.15);
    else if (styleId === 'angriff') score = between(g, 0.0, 1.05);
    else if (styleId === 'emotional') score = 0.45 + between(g, -0.15, 0.2);
    else return { ok: false, text: 'Unbekannte Strategie.' };

    const delta = Math.round((score - 0.5) * 2.4 * 10) / 10;
    const verdict = delta >= 0.6 ? 'Klarer Punktsieg!' : delta > 0 ? 'Knapp gewonnen.' : delta > -0.6 ? 'Das lief nicht rund.' : 'Ein Desaster!';
    g.duel.points += delta;
    g.duel.results.push({ topic, style: styleId, delta, verdict });
    g.duel.round += 1;
    const res = { ok: true, topic, delta, verdict, done: g.duel.round >= g.duel.topics.length };
    if (res.done) {
      g.nat[g.party] += g.duel.points;
      addLog(g, 'duel', 'Elefantenrunde: Blitzumfrage ' + fmt(g.duel.points) + ' Punkte für euch.');
      res.total = g.duel.points;
      g.duel = null;
      g.duelDone = true;
    }
    return res;
  }

  // ---------- Wochenwechsel ----------

  function aiTurn(g) {
    PARTY_IDS.forEach(p => {
      if (p !== g.party) {
        g.nat[p] += between(g, -0.3, 0.45);
        for (let i = 0; i < 2; i++) {
          g.reg[pick(g, D.STATES).id][p] += between(g, 0, 1.3);
        }
        if (rand(g) < 0.4) {
          const comp = party(p).competence;
          const best = TOPIC_IDS.reduce((a, b) => (comp[b] > comp[a] ? b : a));
          changeSalience(g, best, 0.012);
        }
      }
      g.nat[p] += between(g, -0.25, 0.25); // Umfragerauschen
    });
  }

  function endWeek(g) {
    if (g.phase !== 'campaign' || g.pendingEvent || g.duel) return { ok: false };
    if (g.week === DUEL_WEEK && !g.duelDone) return { ok: false, text: 'Erst steht noch die Elefantenrunde an!' };

    aiTurn(g);
    PARTY_IDS.forEach(p => {
      g.nat[p] *= BONUS_DECAY;
      D.STATES.forEach(s => { g.reg[s.id][p] *= BONUS_DECAY; });
    });
    TOPIC_IDS.forEach(t => {
      g.salience[t] += SALIENCE_DRIFT * (D.SALIENCE0[t] - g.salience[t]);
    });
    Object.keys(g.usage).forEach(k => { g.usage[k] *= 0.5; });

    g.history.push({ week: g.week, shares: nationalShares(g) });

    if (g.week >= g.maxWeeks) {
      g.phase = 'election';
      g.result = runElection(g);
      return { ok: true, election: true };
    }

    g.week += 1;
    g.ap = g.apMax;
    addLog(g, 'week', 'Woche ' + g.week + ' beginnt. Noch ' + (g.maxWeeks - g.week + 1) + ' Wochen bis zur Wahl.');
    const ev = drawEvent(g);
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

  function coalitionViable(members) {
    if (members.length > 1 && members.indexOf('afd') !== -1) return false; // Brandmauer
    if (members.indexOf('union') !== -1 && members.indexOf('linke') !== -1) return false; // Unvereinbarkeitsbeschluss
    return true;
  }

  function findCoalitions(seats) {
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
      subsets.push({ members, seats: total, viable: coalitionViable(members) });
    }
    subsets.sort((a, b) => a.members.length - b.members.length || b.seats - a.seats);
    return subsets;
  }

  function formGovernment(seats, coalitions) {
    const order = Object.keys(seats).filter(p => seats[p] > 0).sort((a, b) => seats[b] - seats[a]);
    for (const formateur of order) {
      const options = coalitions.filter(c => c.viable && c.members.indexOf(formateur) !== -1)
        .sort((a, b) => a.members.length - b.members.length || a.seats - b.seats);
      if (options.length) return { formateur, options };
    }
    return { formateur: order[0], options: [] };
  }

  function runElection(g) {
    const shares = nationalShares(g);
    // Letzte Unsicherheit: Umfragen sind keine Wahlergebnisse.
    const raw = {};
    let sum = 0;
    ALL_IDS.forEach(p => { raw[p] = Math.max(0.3, shares[p] + between(g, -0.8, 0.8)); sum += raw[p]; });
    const final = {};
    ALL_IDS.forEach(p => { final[p] = Math.round(raw[p] / sum * 1000) / 10; });

    const inParliament = {};
    PARTY_IDS.forEach(p => { if (final[p] >= THRESHOLD) inParliament[p] = final[p]; });
    const seats = sainteLague(inParliament, D.SEATS);
    PARTY_IDS.forEach(p => { if (!(p in seats)) seats[p] = 0; });

    const coalitions = findCoalitions(seats);
    const gov = formGovernment(seats, coalitions);

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
      strongest: leader(final)
    };

    // Ist die Spielerpartei Wahlsiegerin mit Optionen, wählt sie selbst die Koalition.
    if (gov.formateur === g.party && gov.options.length) {
      result.awaitingChoice = true;
    } else {
      result.government = gov.options.length ? gov.options[0].members : null;
      finalizeOutcome(g, result);
    }
    return result;
  }

  function chooseCoalition(g, index) {
    const r = g.result;
    if (!r || !r.awaitingChoice) return { ok: false };
    const opt = r.options[index];
    if (!opt) return { ok: false };
    r.government = opt.members;
    r.awaitingChoice = false;
    finalizeOutcome(g, r);
    return { ok: true };
  }

  function finalizeOutcome(g, r) {
    const p = g.party;
    const share = r.shares[p];
    const start = g.startShares[p];
    let status;
    if (share < THRESHOLD) status = 'raus';
    else if (r.government && r.government[0] === p) status = 'kanzler';
    else if (r.government && r.government.indexOf(p) !== -1) status = 'regierung';
    else status = 'opposition';

    const goal = share >= party(p).goal && (!party(p).mustLead || r.strongest === p);
    const bonus = { kanzler: 50, regierung: 30, opposition: 10, raus: 0 }[status];
    const score = Math.max(0, Math.round(50 + (share - start) * 10 + bonus + (goal ? 25 : 0)));
    r.outcome = { status, goal, delta: share - start, score, rating: rating(score) };
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
    const line = defaultProgram(g.party);
    TOPIC_IDS.forEach(t => {
      if (!(t in g.program.positions)) g.program.positions[t] = line.positions[t];
      if (!(t in g.competence)) g.competence[t] = party(g.party).competence[t];
    });
    return g;
  }

  const engine = {
    MAX_WEEKS, AP_PER_WEEK, DUEL_WEEK, THRESHOLD, MAJORITY,
    ACTIONS, EVENTS, DUEL_STYLES,
    party, stateById, topicById, eventById, eventText,
    defaultProgram, validateProgram, programEffects, positionEffect, competenceOf, isCore,
    newGame, nationalShares, stateShares, leader, issueEffect,
    actionCost, canAct, performAction, moneyWarning,
    drawEvent, resolveEvent,
    startDuel, duelAnswer,
    endWeek, sainteLague, findCoalitions, coalitionViable, chooseCoalition,
    serialize, deserialize
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = engine;
  } else {
    root.BTW_ENGINE = engine;
  }
})(this);
