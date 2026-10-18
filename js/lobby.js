/*
 * Lobbyismus: Interessenverbände mit eigenen Positionen, ihre Beziehung zu eurer Partei, Unterstützung und
 * Gegenwind, Lobbyregister, Drehtür und Lobbynähe. Ohne DOM, von Wahlkampf (engine.js) und Legislatur (term.js) genutzt.
 *
 * Realer Hintergrund: Lobbyregister des Bundestages seit 2022 (Lobbyregistergesetz); Großspenden über 35.000 €
 * müssen sofort veröffentlicht werden (§ 25 Abs. 3 PartG, Schwelle seit 2024); Karenzzeit für ausscheidende
 * Regierungsmitglieder bis zu 18 Monate (§ 6b BMinG). Positionen der Verbände geschätzt nach ihren Stellungnahmen.
 */
(function (root) {
  const node = typeof module !== 'undefined' && module.exports;
  const D = node ? require('./data.js') : root.BTW_DATA;

  // prefs: Thema → bevorzugte Linie (−1 links/progressiv … 1 konservativ/marktliberal), wie im Wahlprogramm.
  // power = Kampagnenkraft, money = Spendenkraft (0–3), groups = Wählergruppen, die der Verband erreicht.
  const LOBBIES = [
    { id: 'bdi', name: 'Bundesverband der Deutschen Industrie', short: 'Industrie (BDI)', icon: '🏭', prefs: { wirtschaft: 1, klima: 1, finanzen: 1, digitales: 1 }, power: 2, money: 3, groups: ['selbst', 'angest'], taxes: { koerp: -1, strom: -1, spitzen: -1, vermoegen: -1 } },
    { id: 'bda', name: 'Bundesvereinigung der Deutschen Arbeitgeberverbände', short: 'Arbeitgeber (BDA)', icon: '💼', prefs: { soziales: 1, wirtschaft: 1, finanzen: 1 }, power: 2, money: 2, groups: ['selbst'], taxes: { spitzen: -1, soli: -1 } },
    { id: 'vda', name: 'Verband der Automobilindustrie', short: 'Autoindustrie (VDA)', icon: '🚗', prefs: { klima: 1, verkehr: 1, wirtschaft: 1 }, power: 2, money: 2, groups: ['arbeiter', 'maenner'], taxes: { co2: -1 } },
    { id: 'bdew', name: 'Bundesverband der Energie- und Wasserwirtschaft', short: 'Energiewirtschaft', icon: '⚡', prefs: { klima: 0, wirtschaft: 1 }, power: 1, money: 2, groups: [], taxes: { strom: -1 } },
    { id: 'banken', name: 'Bankenverband und Finanzbranche', short: 'Banken', icon: '🏦', prefs: { finanzen: 1, europa: 0 }, power: 1, money: 3, groups: ['hoch'], taxes: { vermoegen: -1 } },
    { id: 'pharma', name: 'Verband forschender Arzneimittelhersteller', short: 'Pharma (vfa)', icon: '💊', prefs: { gesundheit: 1 }, power: 1, money: 2, groups: [] },
    { id: 'dgb', name: 'Deutscher Gewerkschaftsbund', short: 'Gewerkschaften (DGB)', icon: '✊', prefs: { soziales: -1, wirtschaft: -1, finanzen: -1, wohnen: -1 }, power: 3, money: 1, groups: ['arbeiter', 'angest'], taxes: { spitzen: 1, vermoegen: 1, mwst: -1 } },
    { id: 'vdk', name: 'Sozialverband VdK', short: 'Sozialverband VdK', icon: '🤝', prefs: { soziales: -1, gesundheit: -1 }, power: 2, money: 0, groups: ['rentner', 'aelter'], taxes: { mwst: -1 } },
    { id: 'mieter', name: 'Deutscher Mieterbund', short: 'Mieterbund', icon: '🏠', prefs: { wohnen: -1 }, power: 1, money: 0, groups: ['stadt', 'jung'] },
    { id: 'bauern', name: 'Deutscher Bauernverband', short: 'Bauernverband', icon: '🚜', prefs: { land: 1, klima: 1 }, power: 2, money: 1, groups: ['land'], taxes: { co2: -1 } },
    { id: 'umwelt', name: 'Umweltverbände (BUND, NABU, Greenpeace)', short: 'Umweltverbände', icon: '🌳', prefs: { klima: -1, verkehr: -1, land: -1 }, power: 2, money: 0, groups: ['jung', 'hoch', 'stadt'], taxes: { co2: 1 } },
    { id: 'aerzte', name: 'Ärzteschaft (Bundesärztekammer, KBV)', short: 'Ärzteschaft', icon: '🩺', prefs: { gesundheit: 0 }, power: 1, money: 1, groups: ['aelter'] },
    { id: 'hausgrund', name: 'Haus & Grund', short: 'Haus & Grund', icon: '🔑', prefs: { wohnen: 1, finanzen: 1 }, power: 1, money: 1, groups: ['aelter', 'selbst'], taxes: { vermoegen: -1 } }
  ];
  const byId = id => LOBBIES.find(l => l.id === id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function partyLean(g, topic) {
    if (g.program && D.PROGRAM[topic][g.program.positions[topic]]) return D.PROGRAM[topic][g.program.positions[topic]].lean;
    const P = D.PARTIES.find(p => p.id === g.party);
    return P && P.lean ? P.lean[topic] : 0;
  }
  // Startbeziehung aus dem Wahlprogramm: Übereinstimmung mit den Positionen des Verbands.
  function init(g) {
    if (g.lobby && g.lobby.rel) return g.lobby;
    const rel = {};
    LOBBIES.forEach(l => {
      const ts = Object.keys(l.prefs);
      const avg = ts.reduce((s, t) => s + (1 - Math.abs(partyLean(g, t) - l.prefs[t])), 0) / ts.length; // −1 … 1
      rel[l.id] = Math.round(clamp(50 + 25 * avg, 5, 95));
    });
    g.lobby = { rel, near: 15, register: [], donations: 0, asked: [] };
    return g.lobby;
  }
  function rel(g, id) { return init(g).rel[id]; }
  function addRel(g, id, v) { const L = init(g); L.rel[id] = clamp((L.rel[id] || 50) + v, 0, 100); }
  function addNear(g, v) { const L = init(g); L.near = clamp(L.near + v, 0, 100); }
  const status = r => (r >= 70 ? 'ally' : r <= 25 ? 'foe' : 'neutral');

  // Wie ein Verband zu einer Position steht: +1 dafür, −1 dagegen, 0 egal.
  function stanceTopic(l, topic, lean) {
    if (!(topic in l.prefs)) return 0;
    const d = Math.abs(lean - l.prefs[topic]);
    return d === 0 ? 1 : d === 2 ? -1 : 0;
  }
  // Betroffene Verbände eines Gesetzes (Thema oder Steuer).
  function affected(law, D2) {
    const out = [];
    LOBBIES.forEach(l => {
      let s = 0;
      if (law.kind === 'tax') {
        const tx = (D2 || root.BTW_TERMDATA).TAXES.find(x => x.id === law.tax);
        const dir = l.taxes && l.taxes[law.tax];
        if (dir) { const before = tx.levels[law.from === undefined ? tx.start : law.from].rev; const after = tx.levels[law.level].rev; s = Math.sign((after - before) * dir); }
      } else s = stanceTopic(l, law.topic, D.PROGRAM[law.topic][law.opt].lean);
      if (s) out.push({ l, s });
    });
    return out.sort((a, b) => b.l.power - a.l.power);
  }

  // Eintrag im Lobbyregister (öffentlich einsehbar).
  function register(g, id, text, when) {
    const L = init(g);
    L.register.unshift({ id, text, when });
    if (L.register.length > 30) L.register.length = 30;
  }

  // Wahlprüfstein: Ein Verband fragt nach einem seiner Themen; Antwort = eine Programmposition.
  function pickPruefstein(g, rand) {
    const L = init(g);
    const open = LOBBIES.filter(l => L.asked.indexOf(l.id) === -1);
    if (!open.length) return null;
    const l = open[Math.floor(rand() * open.length)];
    const ts = Object.keys(l.prefs);
    const topic = ts[Math.floor(rand() * ts.length)];
    return { id: l.id, topic };
  }
  function answerPruefstein(g, id, topic, opt) {
    const L = init(g);
    const l = byId(id);
    L.asked.push(id);
    const lean = D.PROGRAM[topic][opt].lean;
    const s = stanceTopic(l, topic, lean);
    addRel(g, id, s * 18 + (s === 0 ? 3 : 0));
    // Wer anders antwortet als im eigenen Programm, widerspricht sich.
    const own = g.program && g.program.positions[topic] === opt;
    return { s, own, rel: L.rel[id] };
  }

  const LB = { LOBBIES, byId, init, rel, addRel, addNear, status, stanceTopic, affected, register, pickPruefstein, answerPruefstein, partyLean };
  if (node) module.exports = LB; else root.BTW_LOBBY = LB;
})(this);
