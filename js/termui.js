/* Oberfläche der Legislaturperiode: regieren, mitregieren, opponieren – oder außerparlamentarisch kämpfen. */
(function () {
  const D = window.BTW_DATA;
  const E = window.BTW_ENGINE;
  const T = window.BTW_TERM;
  const TD = window.BTW_TERMDATA;
  const U = window.BTW_UI;
  const TS = window.BTW_TERMSCENES;
  if (!T || !U) return;

  const $ = id => document.getElementById(id);
  const esc = U.esc;
  const col = U.col;
  const onCol = U.onCol;
  const num1 = U.num1;
  const pct = U.pct;
  const signed = U.signed;
  const short = U.short;
  const mio = x => num1(x) + ' Mio. €';
  const mrd = x => num1(x) + ' Mrd. €';
  const MAIN = ['union', 'afd', 'spd', 'gruene', 'linke', 'bsw', 'fdp'];
  const STAGES = [['kabinett', 'Kabinett'], ['br1', 'Bundesrat (1.)'], ['bundestag', 'Bundestag'], ['bundesrat', 'Bundesrat (2.)'], ['vermittlung', 'Vermittlung'], ['inkraft', 'In Kraft']];
  const STAGE_NAME = { kabinett: 'Kabinett', kabinett_wait: 'Kabinett', veto: 'Veto im Kabinett', bundestag: 'Bundestag', bundesrat: 'Bundesrat',
    vermittlung: 'Vermittlungsausschuss', inkraft: 'In Kraft', gescheitert: 'Gescheitert', zurueckgezogen: 'Zurückgezogen', aufgehoben: 'Von Karlsruhe aufgehoben' };

  let g = null;
  let tab = 'lage';
  let lawTopic = null;   // ausgewähltes Thema im Gesetzentwurf
  let lawRoute = 'regierung'; // Regierungs- oder Fraktionsentwurf
  let budgetPlan = null; // Haushaltsentwurf in Bearbeitung
  let budgetNotlage = false;
  let newsSeen = null;

  const save = () => U.save();
  const term = () => g.term;
  const pname = p => (E.party(p) ? E.party(p).name : p);
  const pill = p => '<span class="pill" style="--pc:' + col(p) + ';--pon:' + onCol(p) + '">' + esc(short(p)) + '</span>';
  const bar = (v, max, cls) => '<span class="t-meter ' + (cls || '') + '"><i style="width:' + Math.max(0, Math.min(100, v / max * 100)) + '%"></i></span>';

  function start(game) {
    g = game;
    U.setGame(g);
    tab = 'lage';
    budgetPlan = null;
    lawTopic = null;
    newsSeen = term().news[0] || null;
    U.show('term');
    U.applyPartyTheme($('screen-term'), g.party);
    U.applyPartyTheme(document.querySelector('#modal .modal-box'), g.party);
    document.body.style.background = getComputedStyle($('screen-term')).getPropertyValue('--fl-paper').trim();
    render();
    checkPending();
  }

  // ---------- Kopfzeile ----------
  function renderTop() {
    const t = term();
    const role = TD.ROLES[t.role];
    const P = E.party(g.party);
    $('t-badge').textContent = P.flyerLogo || P.short;
    const age = T.leaderAge(g, T.cal(t).year);
    $('t-leader').textContent = t.party.leader.name + (age ? ' (' + age + ')' : '') + (t.role === 'kanzler' ? ' · Bundeskanzler:in' : t.role === 'junior' ? ' · Vizekanzler:in' : '');
    $('t-role').textContent = role.icon + ' ' + role.name + ' · ' + t.gov.map(short).join('-') + (t.tolerated ? '-Minderheitsregierung' : '-Regierung');
    const poll = g.poll.nat[g.party];
    const stats = [
      ['Zeit', T.quarterLabel(t)],
      ['Aktionen', '●'.repeat(t.ap) + '○'.repeat(Math.max(0, t.apMax - t.ap))],
      ['Umfrage', pct(poll) + ' <small>(' + signed(poll - t.share0) + ')</small>'],
      ['Parteikasse', mio(t.party.cash)]
    ];
    if (T.isGov(t.role) && t.gov.length > 1) stats.splice(3, 0, ['Koalitionsklima', Math.round(t.mood) + '/100']);
    $('t-stats').innerHTML = stats.map(s => '<div class="stat"><span class="stat-label">' + s[0] + '</span><span class="stat-value">' + s[1] + '</span></div>').join('');
    $('term-bar').style.width = Math.min(100, t.q / T.QUARTERS * 100) + '%';
    $('btn-end-quarter').textContent = t.over ? 'Bilanz ansehen' : t.q === T.QUARTERS - 1 ? 'Legislatur beenden' : 'Quartal beenden';
    const unseen = t.news.indexOf(newsSeen);
    const n = unseen === -1 ? t.news.length : unseen;
    $('t-news-badge').hidden = !n || tab === 'lage';
    $('t-news-badge').textContent = n;
    const nb = $('t-cab-badge');
    nb.hidden = !T.needsNames(g);
    const bb = $('t-budget-badge');
    bb.hidden = !(t.budget.draft && !t.budget.draft.done && T.playerDraftsBudget(g));
  }

  function render() {
    renderTop();
    document.querySelectorAll('#term-nav .game-tab').forEach(b => b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false'));
    // Ein Tab kann mehrere Karten zeigen (Lage mit Nachrichten, Regierung = Kabinett + Parlament, Partei mit Laufbahn).
    const R = { 't-lage': renderLage, 't-news': renderNews, 't-gesetze': renderLaws, 't-haushalt': renderBudget, 't-kabinett': renderCabinet, 't-parlament': renderParliament, 't-partei': renderParty, 't-laufbahn': renderCareer, 't-umfragen': renderPolls };
    document.querySelectorAll('#screen-term .term-layout > .card').forEach(c => { c.hidden = c.dataset.tab !== tab; if (!c.hidden && R[c.id]) R[c.id](); });
  }

  // ---------- Lage ----------
  function kpi(label, value, sub, cls) {
    return '<div class="t-kpi ' + (cls || '') + '"><span class="t-kpi-label">' + label + '</span><span class="t-kpi-val">' + value + '</span>' + (sub ? '<span class="t-kpi-sub">' + sub + '</span>' : '') + '</div>';
  }
  // Was jetzt ansteht: höchstens fünf Punkte, jeweils mit Sprung an die richtige Stelle.
  function todos() {
    const t = term();
    const out = [];
    const c = T.cal(t);
    const b = T.budgetCalc(t);
    if (t.over) return out;
    if (T.needsNames(g)) out.push({ icon: '👥', text: 'Kabinett benennen: Es sind noch Ressorts unbesetzt.', go: 'regierung', btn: 'Zum Kabinett' });
    if (t.budget.draft && !t.budget.draft.done && T.playerDraftsBudget(g)) out.push({ icon: '🏦', text: 'Haushaltsentwurf ' + t.budget.draft.year + ' aufstellen – sonst entscheidet das Finanzministerium.', go: 'haushalt', btn: 'Zum Haushalt', warn: true });
    else if (T.isGov(t.role) && b.gap > 0.5) out.push({ icon: '🏦', text: 'Der Haushalt reißt die Schuldenbremse um ' + mrd(b.gap) + ' – Karlsruhe droht.', go: 'haushalt', btn: 'Zum Haushalt', warn: true });
    (t.demands || []).filter(d => !d.done).forEach(d => out.push({ icon: '📌', text: 'Forderung von ' + short(d.p) + ': „' + D.PROGRAM[d.topic][d.opt].label + '“ bis ' + T.quarterLabel(t, d.due) + ' (Klima +8 / −10).', go: 'gesetze', btn: 'Gesetz einbringen', warn: true }));
    t.laws.filter(l => l.stage === 'bundestag').forEach(l => {
      const v = T.predict(g, l).bt;
      const mine = t.gov.indexOf(l.by) !== -1 && T.isGov(t.role);
      if (mine && (!v.pass || v.yes - v.no < 20)) out.push({ icon: '🗳️', text: 'Knappe Abstimmung zum Quartalsende: „' + T.lawName(l) + '“ (' + v.yes + ':' + v.no + ').', go: 'gesetze', btn: 'Ansehen', warn: !v.pass });
      if (t.role === 'opposition' && l.by !== g.party) out.push({ icon: '🗳️', text: 'Abstimmung im Bundestag: „' + T.lawName(l) + '“ – eure Fraktion entscheidet mit.', go: 'gesetze', btn: 'Ansehen' });
    });
    T.calendar(g, 8).filter(x => x.kind === 'ltw' && x.q === t.q).forEach(x => out.push({ icon: '🗺️', text: 'Landtagswahl in ' + E.stateById(x.land).name + ' am Quartalsende.', act: 'ltwk', btn: 'Wahlkampf unterstützen' }));
    if (T.isGov(t.role) && t.gov.length > 1 && t.mood < 35) out.push({ icon: '🤝', text: 'Das Koalitionsklima ist kritisch (' + Math.round(t.mood) + '/100) – unter 12 droht der Bruch.', act: 'koaausschuss', btn: 'Koalitionsausschuss', warn: true });
    if (t.party.unity < 40) out.push({ icon: '🎪', text: 'Die Partei ist zerstritten (Geschlossenheit ' + Math.round(t.party.unity) + ').', act: 'basis', btn: 'Basisarbeit' });
    const wobbly = D.TOPICS.filter(tp => t.sq[tp.id] < 25).map(tp => tp.name);
    if (wobbly.length) out.push({ icon: '⚖️', text: 'Der Status quo wackelt: ' + wobbly.slice(0, 2).join(', ') + '.', go: 'gesetze', btn: 'Ansehen' });
    if (c.qn === 4 && t.budget.draft && t.budget.draft.done) out.push({ icon: '🏦', text: 'Am Quartalsende stimmt der Bundestag über den Haushalt ' + t.budget.draft.year + ' ab.', go: 'haushalt', btn: 'Ansehen' });
    return out.slice(0, 5);
  }
  // Aktionen in vier Gruppen, kompakt als Knöpfe.
  const ACT_GROUPS = [
    ['📜 Parlament & Gesetze', ['gesetz', 'disziplin', 'laender', 'forderung', 'antrag', 'anfrage', 'aktuelle', 'befragung', 'ua', 'klage', 'sq', 'vertrauen', 'misstrauen']],
    ['📣 Öffentlichkeit', ['regerkl', 'presse', 'talkshow', 'buerger', 'reise', 'social', 'protest', 'schatten', 'krisenstab']],
    ['🤝 Koalition & Partei', ['koaausschuss', 'profil', 'umbildung', 'basis', 'mitglieder', 'spenden', 'parteitag', 'lvpflege', 'austritt']],
    ['🗺️ Länder & Verbände', ['ltwk', 'lobbytermin', 'lobbyrecherche', 'buendnis']]
  ];
  function actionsHtml() {
    const t = term();
    const mine = T.ACTIONS.filter(a => a.roles.indexOf(t.role) !== -1);
    const blocked = [];
    let html = '<h3>🎯 Aktionen <span class="muted small">' + t.ap + ' von ' + t.apMax + ' übrig</span></h3><div class="t-act-groups">';
    ACT_GROUPS.forEach(([title, ids]) => {
      const list = mine.filter(a => ids.indexOf(a.id) !== -1 || (title.indexOf('Öffentlichkeit') !== -1 && !ACT_GROUPS.some(gr => gr[1].indexOf(a.id) !== -1)));
      const ok = list.filter(a => { const c = T.canAct(g, a.id); if (!c.ok) blocked.push({ a, why: c.text }); return c.ok; });
      if (!ok.length) return;
      html += '<div class="t-act-group"><h4>' + title + '</h4><div class="t-act-btns">' + ok.map(a => {
        const cost = T.actionCash(g, a.id);
        return '<button type="button" class="t-act" data-a="' + a.id + '" title="' + esc(a.desc) + '"><span>' + a.icon + ' ' + esc(a.name) + '</span>' + (cost || a.ap === 0 ? '<small>' + (a.ap === 0 ? 'keine Aktion' : '') + (cost ? mio(cost) : '') + '</small>' : '') + '</button>';
      }).join('') + '</div></div>';
    });
    html += '</div>';
    if (blocked.length) html += '<details class="t-more"><summary>Gerade nicht möglich (' + blocked.length + ')</summary><ul class="t-blocked">' + blocked.map(x => '<li>' + x.a.icon + ' <b>' + esc(x.a.name) + '</b>' + (x.why ? ' – ' + esc(x.why) : '') + '</li>').join('') + '</ul></details>';
    return html + '<p class="t-feedback" id="t-feedback"></p>';
  }
  function trend(v) { return v > 0.05 ? '<span class="pos">▲ ' + signed(v) + '</span>' : v < -0.05 ? '<span class="neg">▼ ' + signed(v) + '</span>' : '<span class="muted">• ±0</span>'; }
  function renderLage() {
    const t = term();
    const e = t.econ;
    const b = T.budgetCalc(t);
    const role = TD.ROLES[t.role];
    let html = '<h2>' + role.icon + ' ' + esc(role.name) + '</h2>';
    if (t.over) html += '<div class="t-over"><p><strong>Die Legislaturperiode ist vorbei.</strong> ' + esc(t.early || '') + '</p><button type="button" class="btn primary" id="t-show-summary">Bilanz und nächster Wahlkampf</button></div>';
    // Jetzt wichtig
    const td = todos();
    html += '<div class="t-todo"><h3>📋 Jetzt wichtig</h3>' + (td.length ? '<ul>' + td.map((x, i) => '<li class="' + (x.warn ? 'warn' : '') + '"><span class="t-todo-i">' + x.icon + '</span><span class="t-todo-t">' + esc(x.text) + '</span>' +
      '<button type="button" class="btn small t-todo-b" data-i="' + i + '">' + esc(x.btn) + ' →</button></li>').join('') + '</ul>' : '<p class="muted">Alles im Griff. Nutzt eure Aktionen, um Themen zu setzen.</p>') + '</div>';
    // Vier Kennzahlen mit Trend
    const h = t.history;
    const prev = h.length > 1 ? h[h.length - 2].nat[g.party] : t.share0;
    const cred = t.cred === undefined ? 55 : t.cred;
    html += '<div class="t-kpis t-kpis-4">' +
      kpi('Umfrage ' + esc(short(g.party)), pct(g.poll.nat[g.party]), trend(g.poll.nat[g.party] - prev) + ' zum Vorquartal · ' + signed(g.poll.nat[g.party] - t.share0) + ' seit der Wahl') +
      (T.isGov(t.role) && t.gov.length > 1 ? kpi('Koalitionsklima', Math.round(t.mood) + '/100', bar(t.mood, 100, t.mood < 30 ? 'bad' : t.mood < 50 ? 'mid' : 'good')) : kpi('Beliebtheit der Spitze', (t.party.leader.like >= 0 ? '+' : '−') + num1(Math.abs(t.party.leader.like)), esc(t.party.leader.name) + ' · Skala −5 bis +5')) +
      kpi('Geschlossenheit', Math.round(t.party.unity) + '/100', bar(t.party.unity, 100, t.party.unity < 40 ? 'bad' : 'good')) +
      kpi('Glaubwürdigkeit', Math.round(cred) + '/100', bar(cred, 100, cred < 40 ? 'bad' : cred < 55 ? 'mid' : 'good')) + '</div>';
    // Schmale Zeile: Wirtschaft und mehr
    const chip = (label, val, bad) => '<span class="t-strip-i' + (bad ? ' neg' : '') + '"><small>' + label + '</small> ' + val + '</span>';
    html += '<div class="t-strip">' + chip('Wachstum', (e.growth >= 0 ? '+' : '−') + num1(Math.abs(e.growth)) + ' %', e.growth < 0) + chip('Arbeitslosigkeit', num1(e.unemp) + ' %', e.unemp > TD.ECON0.unemp + 0.5) +
      chip('Inflation', num1(e.infl) + ' %', e.infl > 3) + chip('Schuldenquote', num1(e.debt) + ' %') + chip('Haushalt', (b.gap > 0 ? 'Schuldenbremse −' : 'Spielraum ') + mrd(Math.abs(b.gap)), b.gap > 0) +
      (T.isGov(t.role) && t.gov.length > 1 ? chip('Beliebtheit Spitze', (t.party.leader.like >= 0 ? '+' : '−') + num1(Math.abs(t.party.leader.like))) : '') +
      (T.isGov(t.role) ? chip('Ansehen in der Welt', Math.round(t.intl) + '/100') : '') + '</div>';
    html += actionsHtml();
    // Termine: die nächsten drei, der Rest zum Aufklappen
    const cal = T.calendar(g, 9);
    const li = x => '<li><span class="t-cal-q">' + esc(x.label) + '</span>' + esc(x.text) + (x.kind === 'ltw' ? ' <span class="muted small">· regiert von ' + t.laender[x.land].gov.map(short).join('-') + '</span>' : '') + '</li>';
    html += '<h3>📅 Termine</h3><ul class="t-cal">' + cal.slice(0, 3).map(li).join('') + '</ul>' + (cal.length > 3 ? '<details class="t-more"><summary>Weitere Termine (' + (cal.length - 3) + ')</summary><ul class="t-cal">' + cal.slice(3).map(li).join('') + '</ul></details>' : '');
    // Koalitionsvertrag (zum Aufklappen)
    if (T.isGov(t.role) && t.gov.length > 1) {
      const open = Object.keys(t.contract).filter(tp => t.contract[tp] !== t.policy[tp]);
      html += '<details class="t-more"><summary>📜 Koalitionsvertrag: noch ' + open.length + ' von ' + Object.keys(t.contract).length + ' Vorhaben offen</summary><p class="muted small">Gesetze aus dem Vertrag tragen die Partner mit.</p><ul class="t-contract">' +
        open.map(tp => '<li>' + E.topicById(tp).icon + ' ' + esc(D.PROGRAM[tp][t.contract[tp]].label) + '</li>').join('') + '</ul></details>';
    }
    $('t-lage').innerHTML = html;
    $('t-lage').querySelectorAll('.t-act[data-a]').forEach(btn => btn.addEventListener('click', () => onAction(btn.dataset.a, btn)));
    $('t-lage').querySelectorAll('.t-todo-b').forEach(btn => btn.addEventListener('click', () => {
      const x = td[Number(btn.dataset.i)];
      if (x.go) { tab = x.go; render(); window.scrollTo({ top: 0, behavior: 'instant' }); } else if (x.act) onAction(x.act, btn);
    }));
    const sb = $('t-show-summary');
    if (sb) sb.addEventListener('click', showSummary);
  }

  function feedback(text) {
    const f = $('t-feedback');
    if (f) f.textContent = text || '';
    if (text) U.toast(text);
  }

  // Aktion mit Zielauswahl im Dialog.
  function onAction(id, btn) {
    const t = term();
    const a = T.ACTIONS.find(x => x.id === id);
    const exec = (target, scene, card) => {
      const res = T.performAction(g, id, target, scene);
      save();
      render();
      feedback(res.text);
      if (card && res.ok) {
        U.openModal(T.quarterLabel(t) + ' · ' + a.icon + ' ' + a.name, card.headline || 'Ergebnis', '<table class="sc-card">' + (card.rows || []).map(r => '<tr><td>' + esc(r[0]) + '</td><td><b>' + esc(r[1]) + '</b></td></tr>').join('') + '</table><p>' + esc(res.text) + '</p>',
          [{ label: 'Weiter', primary: true, onClick: checkPending }]);
        return;
      }
      U.closeModal();
      checkPending();
    };
    const run = target => (TS && TS.has(id) && T.canAct(g, id).ok ? playScene(a, target, exec) : exec(target));
    if (a.confirm && !U.confirmOnButton(btn, 'Wirklich? Nochmal tippen')) return;
    if (!a.target) { run(null); return; }
    if (a.target === 'spec') { tab = 'gesetze'; render(); return; }
    const opts = [];
    if (a.target === 'topic') {
      D.TOPICS.slice().sort((x, y) => g.salience[y.id] - g.salience[x.id]).forEach(tp => opts.push({ label: tp.icon + ' ' + tp.name, hint: 'Wichtigkeit ' + Math.round(g.salience[tp.id] * 100) + ' % · Kompetenz ' + Math.round((g.competence || {})[tp.id] || 0), v: tp.id }));
    } else if (a.target === 'land') {
      const cal = T.calendar(g, 20).filter(c => c.kind === 'ltw').map(c => c.land);
      D.STATES.slice().sort((x, y) => (cal.indexOf(x.id) === -1) - (cal.indexOf(y.id) === -1) || t.party.lv[y.id] - t.party.lv[x.id]).forEach(st => {
        const next = T.calendar(g, 20).find(c => c.kind === 'ltw' && c.land === st.id);
        opts.push({ label: st.name, hint: (next ? '🗳️ ' + next.label + ' · ' : '') + 'Unruhe im Landesverband ' + Math.round(t.party.lv[st.id]) + '/100', v: st.id });
      });
    } else if (a.target === 'law') {
      t.laws.filter(l => l.stage === a.stage).forEach(l => opts.push({ label: T.lawTitle(l), hint: STAGE_NAME[l.stage], v: l.id }));
      if (!opts.length) { feedback('Kein passendes Gesetz in diesem Stadium.'); return; }
    } else if (a.target === 'ministry') {
      T.ownMinistries(t, g.party).filter(m => !t.cabinet[m].lead).forEach(m => opts.push({ label: T.ministryById(m).icon + ' ' + T.ministryById(m).short, hint: t.cabinet[m].name || 'unbesetzt', v: m }));
    } else if (a.target === 'mode') {
      opts.push({ label: 'Echte Vertrauensfrage', hint: 'Die Koalition hinter euch sammeln – geht sie verloren, gibt es Neuwahlen', v: 'echt' });
      opts.push({ label: 'Vertrauensfrage verlieren wollen', hint: 'Wie 2005 und 2024: der Weg zu vorgezogenen Neuwahlen', v: 'unecht' });
    } else if (a.target === 'klage') {
      if (t.budget.vote && t.budget.vote.pass) opts.push({ label: '💶 Haushalt ' + t.budget.vote.year, hint: 'Hält er die Schuldenbremse ein?', v: 'budget' });
      t.laws.filter(l => l.stage === 'inkraft').slice(-8).forEach(l => opts.push({ label: T.lawTitle(l), hint: 'in Kraft seit ' + T.quarterLabel(t, l.q1), v: l.id }));
      if (!opts.length) { feedback('Es gibt nichts, wogegen ihr klagen könntet.'); return; }
    } else if (a.target === 'lobby') {
      T.LB.LOBBIES.slice().sort((x, y) => T.LB.rel(g, y.id) - T.LB.rel(g, x.id)).forEach(l => {
        const r = Math.round(T.LB.rel(g, l.id));
        opts.push({ label: l.icon + ' ' + l.short, hint: 'Beziehung ' + r + '/100 · ' + ({ ally: 'Unterstützer', foe: 'Gegner', neutral: 'neutral' }[T.LB.status(r)]) + (l.money >= 2 ? ' · spendenstark' : '') + (l.power >= 2 ? ' · kampagnenstark' : ''), v: l.id });
      });
    } else if (a.target === 'contract') {
      Object.keys(t.contract).filter(tp => t.contract[tp] !== t.policy[tp]).forEach(tp => {
        const mine = g.program && g.program.positions[tp] === t.contract[tp];
        opts.push({ label: E.topicById(tp).icon + ' ' + D.PROGRAM[tp][t.contract[tp]].label + (mine ? ' ⭐' : ''), hint: E.topicById(tp).name + (mine ? ' · euer Wahlprogramm' : ''), v: tp });
      });
      if (!opts.length) { feedback('Alle Vorhaben des Koalitionsvertrags sind umgesetzt.'); return; }
    }
    const go = a.quiz ? (v => quiz(a, v, run)) : run;
    U.openModal(T.quarterLabel(t), a.icon + ' ' + a.name, '<p>' + esc(a.desc) + '</p>', opts.map(o => ({ label: o.label, hint: o.hint, onClick: () => go(o.v) }))
      .concat([{ label: 'Abbrechen', onClick: U.closeModal }]));
  }

  // Szene einer Legislatur-Aktion abspielen (termscenes.js): Entscheidungen, Anzeige, Ergebniskarte.
  function playScene(a, target, exec) {
    const sc = TS.build(a.id, { g, t: term(), E, D, T, topic: typeof target === 'string' && E.topicById(target) ? target : null });
    if (!sc) { exec(target); return; }
    const S = { meter: sc.meter0 || 50, q: 0, fx: {} };
    const head = T.quarterLabel(term()) + ' · ' + a.icon + ' ' + a.name;
    const meterHtml = () => (sc.meter ? '<div class="sc-meter"><span>' + esc(sc.meter) + '</span><div class="sc-bar"><i style="width:' + Math.max(0, Math.min(100, S.meter)) + '%"></i></div><b>' + Math.round(S.meter) + '</b></div>' : '');
    let i = -1;
    const finish = () => exec(target, { q: Math.max(-3, Math.min(3, Math.round(S.q))), fx: S.fx }, sc.result(S));
    const next = () => {
      i += 1;
      if (i >= sc.steps.length) { finish(); return; }
      const st = sc.steps[i];
      U.openModal(head + ' (' + (i + 1) + '/' + sc.steps.length + ')', st.title, meterHtml() + '<p class="scen-text">' + esc(st.text) + '</p>', st.options.map(o => ({ label: o.label, hint: o.hint || '', onClick: () => {
        const r = o.roll ? (Math.random() < o.roll.p ? o.roll.win : o.roll.lose) : o;
        const before = S.meter;
        S.meter = Math.max(0, Math.min(100, S.meter + (r.m || 0)));
        S.q += r.q || 0;
        Object.keys(r.fx || {}).forEach(k => { S.fx[k] = (S.fx[k] || 0) + r.fx[k]; });
        const dm = Math.round(S.meter - before);
        U.openModal(head, (r.q > 0 ? '👍 ' : r.q < 0 ? '👎 ' : '😐 ') + st.title, meterHtml() + (dm ? '<p class="sc-delta ' + (dm > 0 ? 'pos' : 'neg') + '">' + (dm > 0 ? '▲ +' : '▼ ') + dm + '</p>' : '') + '<p>' + esc(r.reply || '') + '</p>',
          [{ label: i + 1 < sc.steps.length ? 'Weiter →' : 'Ergebnis →', primary: true, onClick: next }]);
      } })));
    };
    U.openModal(head, a.name, '<p class="scen-text">' + esc(sc.intro) + '</p>', [{ label: 'Los geht’s', primary: true, onClick: next }, { label: 'Ohne Szene erledigen', hint: 'Normale Wirkung', onClick: () => exec(target) }, { label: 'Abbrechen', onClick: U.closeModal }]);
  }

  // Bürgerdialog und Talkshow: zwei Fachfragen zum Thema, jede richtige Antwort macht den Auftritt stärker.
  function quiz(a, topic, run) {
    const list = (E.CITIZEN_QUESTIONS || {})[topic] || [];
    if (!list.length) { run({ topic, right: 1, wrong: 0 }); return; }
    const ids = E.pickCitizenQuestions(g, topic, 2);
    let right = 0;
    let wrong = 0;
    const ask = i => {
      if (i >= ids.length) { run({ topic, right, wrong }); return; }
      const q = list[ids[i]];
      const text = a.id === 'talkshow' ? q.q.replace(/^[^:]*fragt:|^[^:]*will wissen:/, 'Die Moderatorin hakt nach:') : q.q;
      U.openModal(T.quarterLabel(term()) + ' · ' + a.name + ' · Frage ' + (i + 1) + ' von ' + ids.length, E.topicById(topic).icon + ' ' + E.topicById(topic).name, '<p>' + esc(text) + '</p>',
        q.a.map((ans, k) => ({ label: ans, onClick: () => {
          const ok = k === q.c;
          if (ok) right += 1; else wrong += 1;
          U.openModal(T.quarterLabel(term()) + ' · ' + a.name, ok ? '✅ Richtig' : '❌ Leider falsch', '<p>' + esc(q.e) + '</p>', [{ label: 'Weiter', primary: true, onClick: () => ask(i + 1) }]);
        } })));
    };
    ask(0);
  }

  // ---------- Gesetzgebung ----------
  // Stationen nach dem echten Verfahren; Fraktionsentwürfe beginnen im Bundestag, der Vermittlungsausschuss nur bei Bedarf.
  const STAGE_STEPS = { kabinett: T.LAW_STEPS.kabinett, br1: ['Stellungnahme der Länder (Art. 76 Abs. 2 GG)', 'Gegenäußerung der Bundesregierung'], bundestag: T.LAW_STEPS.bundestag.slice(1),
    bundesrat: [T.LAW_STEPS.bundesrat[0]], vermittlung: T.LAW_STEPS.vermittlung.concat(T.LAW_STEPS.einspruch), inkraft: T.LAW_STEPS.inkraft };
  function stageChips(l) {
    const idx = { kabinett: 0, kabinett_wait: 0, veto: 0, bundestag: 2, bundesrat: 3, vermittlung: 4, inkraft: 5 }[l.stage];
    const failed = ['gescheitert', 'zurueckgezogen', 'aufgehoben'].indexOf(l.stage) !== -1;
    return '<div class="t-stages">' + STAGES.filter(s => !(l.fraktion && (s[0] === 'kabinett' || s[0] === 'br1')) && (s[0] !== 'vermittlung' || l.vm)).map(s => {
      const k = STAGES.findIndex(x => x[0] === s[0]);
      const cls = failed ? 'off' : k < idx ? 'done' : k === idx ? 'now' : '';
      return '<span class="t-stage ' + cls + '" title="' + esc(STAGE_STEPS[s[0]].join(' → ')) + '">' + s[1] + '</span>';
    }).join('<i>›</i>') + (failed ? '<span class="t-stage fail">' + STAGE_NAME[l.stage] + '</span>' : '') + '</div>' +
      (idx !== undefined && idx < 5 && !failed ? '<p class="small muted">Jetzt: ' + esc(STAGE_STEPS[STAGES[idx][0]].join(' → ')) + (l.stage === 'bundestag' && !l.fraktion ? ' (vorher: Stellungnahme des Bundesrates)' : '') + '</p>' : '');
  }
  function voteBar(v) {
    const total = v.yes + v.no + (v.abst || 0);
    return '<div class="t-vote"><i class="yes" style="width:' + v.yes / total * 100 + '%"></i><i class="abst" style="width:' + (v.abst || 0) / total * 100 + '%"></i><i class="no" style="width:' + v.no / total * 100 + '%"></i></div>' +
      '<span class="small">' + v.yes + ' Ja · ' + v.no + ' Nein' + (v.abst ? ' · ' + v.abst + ' Enthaltungen' : '') + '</span>';
  }
  // Ein Gesetz als kompakte Zeile: Titel, Fortschritt, Prognose – Details zum Aufklappen.
  function lawCard(l) {
    const active = ['kabinett', 'kabinett_wait', 'veto', 'bundestag', 'bundesrat', 'vermittlung'].indexOf(l.stage) !== -1;
    const idx = { kabinett: 0, kabinett_wait: 0, veto: 0, bundestag: 2, bundesrat: 3, vermittlung: 4, inkraft: 5 }[l.stage];
    const prog = idx === undefined ? 0 : Math.round(((idx + 1) / 6) * 100);
    let prog2 = '';
    if (active) {
      const bits = [];
      if (['kabinett', 'kabinett_wait', 'veto', 'bundestag'].indexOf(l.stage) !== -1) { const v = T.predict(g, l).bt; bits.push('<span class="t-pg ' + (v.pass ? (v.yes - v.no < 20 ? 'mid' : 'good') : 'bad') + '">Bundestag ' + (v.pass ? (v.yes - v.no < 20 ? 'knapp ✓' : '✓') : '✗') + '</span>'); }
      const br = T.bundesratVote(g, l);
      const brOk = l.zust ? br.pass : 69 - br.yes < TD.BUNDESRAT_MAJ;
      bits.push('<span class="t-pg ' + (brOk ? 'good' : 'bad') + '">Bundesrat ' + (brOk ? '✓' : '✗') + '</span>');
      prog2 = bits.join('');
    }
    const status = active ? STAGE_NAME[l.stage] : STAGE_NAME[l.stage] || l.stage;
    let html = '<details class="t-law ' + l.stage + '"><summary><span class="t-law-t"><b>' + esc(T.lawTitle(l)) + '</b> ' + pill(l.by) + '</span>' +
      '<span class="t-law-s"><span class="t-law-prog"><i style="width:' + (active ? prog : 100) + '%"></i></span><small>' + esc(status) + '</small>' + prog2 + '</span></summary><div class="t-law-body">';
    html += '<p class="t-tags">' + (l.contract ? '<span class="t-tag">Koalitionsvertrag</span>' : '') + (l.zust ? '<span class="t-tag">Zustimmungsgesetz</span>' : '<span class="t-tag">Einspruchsgesetz</span>') +
      (l.fraktion ? '<span class="t-tag warn-tag">Fraktionsentwurf</span>' : '') + (l.fixed ? '<span class="t-tag good">nachgebessert</span>' : '') + (l.brDeal ? '<span class="t-tag">Länder eingebunden</span>' : '') + (l.promise ? '<span class="t-tag good">Wahlversprechen</span>' : '') +
      (l.ghost ? '<span class="t-tag warn-tag">Formulierungshilfe: ' + esc(T.LB.byId(l.ghost).short) + '</span>' : '') + '</p>' + stageChips(l) +
      ((l.backers && l.backers.length) || l.foe ? '<p class="small">' + (l.backers && l.backers.length ? '👍 ' + l.backers.map(id => esc(T.LB.byId(id).short)).join(', ') : '') + (l.foe ? ' · 👎 ' + esc(T.LB.byId(l.foe).short) : '') + '</p>' : '');
    if (l.stage === 'bundestag') {
      const v = T.predict(g, l).bt;
      html += '<p class="small">Prognose Bundestag:</p>' + voteBar(v) + (v.afdDecisive ? '<p class="small warn">⚠️ Mehrheit nur mit Stimmen der AfD</p>' : '') + (l.disc ? '<p class="small">📣 Fraktion auf Linie gebracht</p>' : '');
    }
    if (active) {
      const br = T.bundesratVote(g, l);
      html += '<p class="small">Prognose Bundesrat: <b>' + br.yes + '</b> von 69 Stimmen ' + (l.zust ? '(Zustimmung nötig: ' + TD.BUNDESRAT_MAJ + ')' : '(Einspruch erst ab ' + TD.BUNDESRAT_MAJ + ' Gegenstimmen)') + (l.bought && l.bought.length ? ' · Zusagen an ' + l.bought.join(', ') : '') + '</p>';
    }
    if (l.log.length) html += '<p class="small"><b>Verlauf</b></p><ul class="small">' + l.log.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
    return html + '</div></details>';
  }
  function renderLaws() {
    const t = term();
    let html = '<h2>📜 Gesetzgebung</h2>';
    const active = t.laws.filter(l => ['kabinett', 'kabinett_wait', 'veto', 'bundestag', 'bundesrat', 'vermittlung'].indexOf(l.stage) !== -1);
    html += '<details class="small"><summary class="muted">So läuft ein Gesetz (Art. 76–82 GG)</summary><p class="muted small">Regierungsentwurf: Referentenentwurf, Ressortabstimmung, Anhörung von Ländern und Verbänden, Kabinettsbeschluss (1 Quartal). ' +
      'Dann nimmt der Bundesrat Stellung (1. Durchgang), der Bundestag berät in 1. Lesung, der Ausschuss hört Sachverständige an, in 2./3. Lesung wird abgestimmt (Mehrheit der abgegebenen Stimmen; 1 Quartal). ' +
      'Im 2. Durchgang braucht ein Zustimmungsgesetz 35 von 69 Stimmen im Bundesrat; gegen ein Einspruchsgesetz kann der Bundesrat den Vermittlungsausschuss anrufen und Einspruch einlegen, den der Bundestag mit Kanzlermehrheit (Mehrheit der Mitglieder) zurückweisen kann. ' +
      'Ein Land stimmt nur zu, wenn alle Regierungsparteien dort einverstanden sind. Zum Schluss fertigt der Bundespräsident aus, das Gesetz wird im Bundesgesetzblatt verkündet. ' +
      'Fraktionsentwürfe („aus der Mitte des Bundestages“) sparen Kabinett und 1. Durchgang – schneller, aber fehleranfälliger.</p></details>';
    html += '<h3>In Arbeit (' + active.length + ')</h3>' + (active.length ? '<div class="t-laws">' + active.map(lawCard).join('') + '</div><p class="muted small">Antippen für Details, Prognosen und Verlauf.</p>' : '<p class="muted">Gerade liegt nichts an.</p>');
    if (T.isGov(t.role)) html += renderDraft();
    else html += '<p class="muted small">' + (t.role === 'opposition' ? 'Als Opposition stimmt ihr im Bundestag mit ab und könnt Gesetze in Karlsruhe prüfen lassen (Normenkontrollklage).' : 'Ohne Sitze im Bundestag schaut ihr zu – aber auf der Straße und in den Ländern könnt ihr Druck machen.') + '</p>';
    html += renderSq();
    const done = t.laws.filter(l => active.indexOf(l) === -1).slice().reverse();
    if (done.length) html += '<details class="t-more"><summary>Abgeschlossene Gesetze (' + done.length + ')</summary><div class="t-laws">' + done.map(lawCard).join('') + '</div></details>';
    $('t-gesetze').innerHTML = html;
    const more = $('t-gesetze').querySelector('.t-sq-more');
    if (more) more.addEventListener('click', () => { sqAll = !sqAll; renderLaws(); });
    bindDraft();
  }

  // Status quo: Rückhalt der geltenden Regelung je Thema, Angreifer und Verteidiger.
  let sqAll = false;
  function renderSq() {
    const t = term();
    const rows = D.TOPICS.map(tp => ({ tp, sq: t.sq[tp.id], f: T.sqForces(g, tp.id) })).sort((a, b) => a.sq - b.sq);
    let html = '<h3>⚖️ Status quo: die gefährdetsten Themen</h3><p class="muted small">Was heute gilt, hat Rückhalt. Die Ränder greifen ihn an, die Mitte verteidigt ihn. Unter 40 gewinnen die Angreifer an Zustimmung, unter 15 kippt die Lage und die Regierung muss reagieren. Ein starker Status quo macht Gesetze, die ihn ändern, schwerer – ein schwacher leichter.</p><div class="t-sq">';
    (sqAll ? rows : rows.slice(0, 3)).forEach(r => {
      const cls = r.sq < 15 ? 'bad' : r.sq < 40 ? 'mid' : 'good';
      const mine = T.leanOf(g, g.party, r.tp.id) === D.PROGRAM[r.tp.id][t.policy[r.tp.id]].lean;
      html += '<div class="t-sq-row"><div class="t-sq-head"><b>' + r.tp.icon + ' ' + esc(r.tp.name) + '</b><span class="small muted">' + esc(D.PROGRAM[r.tp.id][t.policy[r.tp.id]].label) + '</span></div>' +
        '<div class="t-sq-bar">' + bar(r.sq, 100, cls) + '<span class="num">' + Math.round(r.sq) + '</span></div>' +
        '<div class="small">🛡️ ' + (r.f.def.slice(0, 4).map(x => pill(x.p)).join(' ') || '–') + ' &nbsp; ⚔️ ' + (r.f.att.slice(0, 4).map(x => pill(x.p)).join(' ') || '–') +
        ' <span class="muted">· ihr ' + (mine ? 'verteidigt' : 'greift an') + '</span></div></div>';
    });
    html += '</div><button type="button" class="btn t-sq-more">' + (sqAll ? 'Weniger zeigen' : 'Alle 16 Themen zeigen') + '</button>';
    return html;
  }
  function leanName(l) { return l < 0 ? 'links/progressiv' : l > 0 ? 'konservativ/marktliberal' : 'Mitte'; }
  function renderDraft() {
    const t = term();
    const o = T.lawOptions(g);
    const can = T.canAct(g, 'gesetz');
    let html = '<h3>Neuen Gesetzentwurf einbringen</h3>';
    if (!can.ok) html += '<p class="muted small">' + esc(can.text) + '</p>';
    html += '<div class="t-topics"><span class="small muted">Verfahren:</span> ' + [['regierung', '🏛️ Regierungsentwurf', 'über das Kabinett und den Bundesrat – gründlich, ab Kabinett gut drei Quartale'], ['fraktion', '⚡ Fraktionsentwurf', 'aus der Mitte des Bundestages – Abstimmung schon zum Quartalsende, aber mehr Abweichler und Klagerisiko']]
      .map(r => '<button type="button" class="chip t-route" data-r="' + r[0] + '" aria-pressed="' + (lawRoute === r[0]) + '" title="' + r[2] + '">' + r[1] + '</button>').join('') + '</div>';
    if (t.role === 'junior') html += '<p class="muted small">Als Juniorpartner bringt ihr Gesetze aus euren Ressorts ein: ' + T.ownMinistries(t, g.party).map(m => T.ministryById(m).short).join(', ') + '.</p>';
    html += '<div class="t-topics">' + o.topics.map(x => '<button type="button" class="chip t-topic" data-t="' + x.topic + '" aria-pressed="' + (lawTopic === x.topic) + '">' +
      E.topicById(x.topic).icon + ' ' + esc(E.topicById(x.topic).name) + (x.contract !== undefined && x.contract !== x.current ? ' 📜' : '') + '</button>').join('') +
      (o.taxes.length ? '<button type="button" class="chip t-topic" data-t="taxes" aria-pressed="' + (lawTopic === 'taxes') + '">🏦 Steuern</button>' : '') + '</div>';
    if (lawTopic === 'taxes') {
      html += '<div class="t-opts">' + o.taxes.map(x => {
        const tx = T.taxById(x.tax);
        return '<div class="t-taxrow"><b>' + tx.icon + ' ' + esc(tx.name) + '</b><span class="muted small"> heute: ' + esc(tx.levels[x.current].label) + (tx.zust ? ' · Bundesrat' : '') + '</span><div class="t-taxlv">' +
          tx.levels.map((lv, i) => i === x.current ? '' : '<button type="button" class="btn t-draft" data-tax="' + x.tax + '" data-lv="' + i + '"' + (can.ok ? '' : ' disabled') + '>' + esc(lv.label) +
            '<span class="hint">' + (lv.rev - tx.levels[x.current].rev >= 0 ? '+' : '−') + mrd(Math.abs(lv.rev - tx.levels[x.current].rev)) + ' im Jahr</span></button>').join('') + '</div></div>';
      }).join('') + '</div>';
    } else if (lawTopic) {
      const x = o.topics.find(z => z.topic === lawTopic);
      if (x) {
        html += '<p class="small">Heute gilt: <b>' + esc(D.PROGRAM[lawTopic][x.current].label) + '</b> · federführend: ' + esc(T.ministryById(x.ministry).short) +
          (t.cabinet[x.ministry] ? ' (' + esc(short(t.cabinet[x.ministry].party)) + ')' : '') + '</p><div class="t-opts">';
        x.opts.forEach(i => {
          const op = D.PROGRAM[lawTopic][i];
          const partners = t.gov.filter(p => p !== g.party).map(p => {
            const d = Math.abs(T.leanOf(g, p, lawTopic) - op.lean);
            return pill(p) + (x.contract === i ? ' ✅' : d === 0 ? ' 👍' : d === 1 ? ' 😐' : ' 🛑');
          }).join(' ');
          const mine = g.program && g.program.positions[lawTopic] === i;
          const costD = (op.cost - D.PROGRAM[lawTopic][x.current].cost) * TD.LAW_COST;
          html += '<button type="button" class="btn t-draft coalition-option" data-topic="' + lawTopic + '" data-opt="' + i + '"' + (can.ok ? '' : ' disabled') + '><b>' + esc(op.label) + (mine ? ' ⭐' : '') + '</b>' +
            '<span class="hint">' + esc(op.desc) + '</span><span class="hint">' + leanName(op.lean) + ' · Kosten ' + (costD >= 0 ? '+' : '−') + mrd(Math.abs(costD)) + '/Jahr' +
            (x.contract === i ? ' · steht im Koalitionsvertrag' : '') + '</span>' + (partners ? '<span class="hint">Partner: ' + partners + '</span>' : '') + '</button>';
        });
        html += '</div><p class="muted small">⭐ = euer Wahlprogramm · 👍 Partner einverstanden · 😐 murrt · 🛑 Veto droht · 📜 offenes Vorhaben im Koalitionsvertrag</p>';
      }
    }
    return html;
  }
  function bindDraft() {
    const box = $('t-gesetze');
    box.querySelectorAll('.t-topic').forEach(b => b.addEventListener('click', () => { lawTopic = b.dataset.t; renderLaws(); }));
    box.querySelectorAll('.t-route').forEach(b => b.addEventListener('click', () => { lawRoute = b.dataset.r; renderLaws(); }));
    box.querySelectorAll('.t-draft').forEach(b => b.addEventListener('click', () => {
      const target = b.dataset.tax ? { tax: b.dataset.tax, level: Number(b.dataset.lv) } : { topic: b.dataset.topic, opt: Number(b.dataset.opt) };
      if (lawRoute === 'fraktion') target.fraktion = true;
      const res = T.performAction(g, 'gesetz', target);
      save();
      lawTopic = null;
      render();
      U.toast(res.text);
      checkPending();
    }));
  }

  // ---------- Haushalt & Steuern ----------
  function renderBudget() {
    const t = term();
    const d = t.budget.draft;
    const editing = d && !d.done && T.playerDraftsBudget(g) && !t.over;
    if (editing && !budgetPlan) { budgetPlan = Object.assign({}, d.plan); budgetNotlage = !!d.notlage; }
    if (!editing) budgetPlan = null;
    const plan = editing ? budgetPlan : t.budget.plan;
    const b = T.budgetCalc(t, plan);
    let html = '<h2>🏦 Haushalt & Steuern</h2>';
    const qn = T.cal(t).qn;
    // Ein Satz zum Stand
    const stand = editing ? '✍️ Euer Entwurf für ' + d.year + ' ist offen – im 4. Quartal stimmt der Bundestag ab.' : d && d.done ? '📄 Der Entwurf ' + d.year + ' liegt dem Bundestag vor.' : t.budget.status === 'vorlaeufig' ? '⚠️ Vorläufige Haushaltsführung – es fehlt ein beschlossener Haushalt.' : '✅ Der Haushalt ' + T.cal(t).year + ' ist beschlossen.';
    html += '<p class="t-lead ' + (b.gap > 0 ? 'neg' : '') + '"><b>' + stand + '</b> ' + (b.gap > 0 ? 'Die Schuldenbremse wird um ' + mrd(b.gap) + ' gerissen.' : 'Die Schuldenbremse wird eingehalten (Spielraum ' + mrd(-b.gap) + ').') + '</p>';
    const BSTEPS = [[1, 'Eckwerte'], [3, 'Regierungsentwurf'], [3, '1. Lesung'], [4, 'Bereinigungssitzung'], [4, '2./3. Lesung'], [4, 'Bundesrat']];
    html += '<div class="t-stages">' + BSTEPS.map(x => '<span class="t-stage ' + (x[0] < qn ? 'done' : x[0] === qn ? 'now' : '') + '">' + x[1] + '</span>').join('<i>›</i>') + '</div>' +
      '<p class="muted small">Haushaltsverfahren (Art. 110 GG): Eckwerte im Frühjahr, Regierungsentwurf im Sommer, 1. Lesung im September, Bereinigungssitzung im November, Beschluss im Dezember' + (t.budget.eck && t.budget.eck !== 'fort' ? ' · Eckwerte dieses Jahr: ' + (t.budget.eck === 'konsol' ? 'Konsolidierung' : 'Investitionen') : '') + '.</p>';
    html += '<div class="t-kpis">' +
      kpi('Ausgaben', mrd(b.spend), 'Bundeshaushalt ' + (editing ? d.year : T.cal(t).year)) +
      kpi('Einnahmen', mrd(b.revenue), 'davon Steueränderungen ' + (b.taxRev >= 0 ? '+' : '−') + mrd(Math.abs(b.taxRev))) +
      kpi('Neuverschuldung', mrd(b.deficit), 'erlaubt: ' + mrd(b.limit), b.gap > 0 ? 'neg' : '') +
      kpi('Schuldenbremse', b.gap > 0 ? 'gerissen um ' + mrd(b.gap) : 'eingehalten', 'Spielraum ' + mrd(-b.gap), b.gap > 0 ? 'neg' : 'pos') +
      kpi('Verteidigung', num1(b.defShare) + ' % des BIP', 'über 1 % von der Schuldenbremse ausgenommen') +
      '</div>';
    html += '<p class="muted small">Schuldenbremse (Art. 115 GG): 0,35 % des BIP' + (t.budget.reform ? ' + ' + num1(t.budget.reform) + ' % (Reform)' : '') + ', mehr bei schwacher Konjunktur (' + mrd(b.cyc) + '); Verteidigung über 1 % des BIP ist ausgenommen (' + mrd(b.defFree) + '). Das Sondervermögen Infrastruktur (rund ' + TD.DEBT_RULE.sv + ' Mrd. € im Jahr) läuft außerhalb des Kernhaushalts.</p>';
    if (editing) html += '<div class="t-callout">✍️ <b>Haushaltsentwurf ' + d.year + '</b>: Legt fest, wo ihr mehr ausgebt und wo ihr kürzt. Kürzungen in den Lieblingsbereichen der Partner verschlechtern das Klima. Im 4. Quartal stimmt der Bundestag ab.</div>';
    else if (d && d.done) html += '<div class="t-callout">Der Haushaltsentwurf ' + d.year + ' liegt dem Bundestag vor. Abstimmung am Ende des ' + (T.cal(t).qn === 3 ? 'nächsten' : 'laufenden') + ' Quartals.</div>';
    else if (t.budget.status === 'vorlaeufig') html += '<div class="t-callout warn">Vorläufige Haushaltsführung: Es fehlt ein beschlossener Haushalt.</div>';
    html += '<table class="t-budget"><thead><tr><th>Bereich</th><th>Mrd. €</th><th>' + (editing ? 'Änderung' : 'Plan') + '</th></tr></thead><tbody>';
    TD.AREAS.forEach(a => {
      const v = plan[a.id] || 0;
      const prefs = t.gov.filter(p => p !== g.party && (TD.AREA_PREF[p] || {})[a.id]).map(p => pill(p) + ((TD.AREA_PREF[p] || {})[a.id] > 0 ? '❤️' : '✂️')).join(' ');
      html += '<tr><td>' + a.icon + ' ' + esc(a.name) + (prefs ? ' <span class="small">' + prefs + '</span>' : '') + '</td><td class="num">' + num1(b.areas[a.id]) + '</td><td>' +
        (a.fixed ? '<span class="muted small">fest</span>' : editing ? '<span class="t-steps">' + TD.BUDGET_STEPS.map(s => '<button type="button" class="chip t-step" data-a="' + a.id + '" data-v="' + s + '" aria-pressed="' + (v === s) + '">' + (s > 0 ? '+' : s < 0 ? '−' : '±') + Math.abs(s) + ' %</button>').join('') + '</span>'
          : (v ? (v > 0 ? '+' : '−') + Math.abs(v) + ' %' : '±0')) + '</td></tr>';
    });
    html += '<tr><td>📜 Mehrkosten beschlossener Gesetze</td><td class="num">' + num1(t.budget.extra) + '</td><td></td></tr>';
    if (t.budget.def) html += '<tr><td>🪖 Zusätzliche Verteidigungszusagen</td><td class="num">' + num1(t.budget.def) + '</td><td><span class="muted small">in Verteidigung</span></td></tr>';
    if (t.budget.oneoff) html += '<tr><td>⚡ Einmalige Ausgaben dieses Jahres</td><td class="num">' + num1(t.budget.oneoff) + '</td><td></td></tr>';
    html += '</tbody></table>';
    if (editing) {
      html += '<label class="t-check"><input type="checkbox" id="t-notlage"' + (budgetNotlage ? ' checked' : '') + '> Notlage erklären (Art. 115 Abs. 2 GG) – setzt die Schuldenbremse aus. Ohne echte Krise kippt Karlsruhe das wahrscheinlich.</label>' +
        '<button type="button" class="btn primary" id="t-budget-submit">Entwurf im Kabinett beschließen</button>';
    }
    if (t.budget.vote) html += '<p class="small">Letzte Haushaltsabstimmung (' + t.budget.vote.year + '): ' + (t.budget.vote.pass ? '✅ angenommen' : '❌ abgelehnt') + ' – ' + t.budget.vote.yes + ' Ja, ' + t.budget.vote.no + ' Nein.</p>';
    if (t.budget.history.length) html += '<p class="small muted">Bisher: ' + t.budget.history.map(h => h.year + ': ' + (h.gap > 0 ? '−' : '+') + num1(Math.abs(h.gap)) + ' Mrd.' + (h.notlage ? ' (Notlage)' : '')).join(' · ') + '</p>';
    // Steuern
    html += '<h3>Steuern</h3><p class="muted small">Steueränderungen sind Gesetze: ' + (T.isGov(t.role) ? 'Bringt sie unter „Gesetze“ ein.' : 'Nur die Regierung kann sie einbringen.') + ' Die Werte zeigen Mehr- oder Mindereinnahmen des Bundes im Jahr.</p><table class="t-budget"><tbody>';
    TD.TAXES.forEach(x => {
      const lv = x.levels[t.taxes[x.id]];
      html += '<tr><td>' + x.icon + ' ' + esc(x.name) + (x.zust ? ' <span class="muted small">(Bundesrat)</span>' : '') + '</td><td>' + esc(lv.label) + '</td><td class="num">' + (lv.rev ? (lv.rev > 0 ? '+' : '−') + num1(Math.abs(lv.rev)) : '±0') + '</td></tr>';
    });
    html += '</tbody></table>';
    $('t-haushalt').innerHTML = html;
    const box = $('t-haushalt');
    box.querySelectorAll('.t-step').forEach(btn => btn.addEventListener('click', () => { budgetPlan[btn.dataset.a] = Number(btn.dataset.v); renderBudget(); }));
    const nl = $('t-notlage');
    if (nl) nl.addEventListener('change', () => { budgetNotlage = nl.checked; });
    const sub = $('t-budget-submit');
    if (sub) sub.addEventListener('click', () => {
      const res = T.setBudgetDraft(g, budgetPlan, budgetNotlage);
      budgetPlan = null;
      save();
      render();
      if (res.ok) U.toast('Haushaltsentwurf beschlossen. Abstimmung im Bundestag im 4. Quartal.');
    });
  }

  // ---------- Kabinett ----------
  function renderCabinet() {
    const t = term();
    let html = '<h2>👥 Bundesregierung</h2>';
    html += '<div class="t-cab-top"><div class="t-cab-card chanc"><span class="t-cab-min">' + TD.KANZLERAMT.icon + ' Bundeskanzler:in</span><b>' + esc(t.chancellor.name) + '</b>' + pill(t.chancellor.party) + '</div>' +
      (t.vize ? '<div class="t-cab-card"><span class="t-cab-min">Vizekanzler:in</span><b>' + esc(t.vize.name) + '</b>' + pill(t.vize.party) + '</div>' : '') + '</div>';
    const unnamed = Object.keys(t.cabinet).filter(id => t.cabinet[id].party === g.party && !t.cabinet[id].name);
    if (unnamed.length) {
      html += '<div class="t-callout">✍️ Benennt eure Ministerinnen und Minister. Jeder Typ hat Stärken: Fachleute sind kompetent, Parteisoldaten loyal, Landesfürsten beruhigen ihren Landesverband, Quereinsteiger bringen frischen Wind – und Risiken.</div>' +
        '<p><button type="button" class="btn primary" id="t-auto-names">⚡ Vorschläge der Fraktion übernehmen (' + unnamed.length + ' Ressorts)</button> <span class="small muted">Die Fraktionsführung wählt nach Kompetenz und Proporz; einzelne Ressorts könnt ihr später umbilden.</span></p>';
      unnamed.forEach(id => {
        const m = T.ministryById(id);
        const slot = t.cabinet[id];
        html += '<div class="t-name-box" data-m="' + id + '"><h4>' + m.icon + ' ' + esc(m.name) + '</h4><div class="t-cands">' + slot.cands.map((c, i) => {
          const k = TD.MINISTER_KINDS.find(x => x.id === c.kind);
          return '<button type="button" class="btn coalition-option t-cand" data-m="' + id + '" data-i="' + i + '"><b>' + esc(c.name) + '</b><span class="hint">' + esc(k.name) + ' aus ' + esc(E.stateById(c.land).name) + '</span>' +
            '<span class="hint">Kompetenz ' + c.comp + ' · Loyalität ' + c.loyal + ' · Skandalrisiko ' + c.risk + ' %</span><span class="hint">' + esc(k.desc) + '</span></button>';
        }).join('') + '</div><div class="t-custom"><input type="text" maxlength="60" placeholder="Eigener Name (optional, übernimmt die Werte des gewählten Vorschlags)" class="t-custom-name" data-m="' + id + '"></div></div>';
      });
    }
    html += '<div class="t-cab-grid">';
    TD.MINISTRIES.forEach(m => {
      const s = t.cabinet[m.id];
      if (!s) return;
      const k = TD.MINISTER_KINDS.find(x => x.id === s.kind);
      html += '<div class="t-cab-card' + (s.party === g.party ? ' own' : '') + '"><span class="t-cab-min">' + m.icon + ' ' + esc(m.short) + '</span><b>' + esc(s.name || 'noch unbesetzt') + '</b>' + pill(s.party) +
        (s.party === g.party && s.name ? '<span class="small muted">' + (s.lead ? 'Eure Spitze' : esc(k ? k.name : '')) + ' · Kompetenz ' + s.comp + ' · Loyalität ' + s.loyal + '</span>' : '') + '</div>';
    });
    html += '</div>';
    if (!T.isGov(t.role)) html += '<p class="muted small">Ihr sitzt nicht in der Regierung. Kanzlerpartei: ' + esc(pname(t.chanc)) + '.</p>';
    $('t-kabinett').innerHTML = html;
    const ab = $('t-auto-names');
    if (ab) ab.addEventListener('click', () => { T.autoNames(g); save(); render(); U.toast('Das Kabinett steht.'); });
    $('t-kabinett').querySelectorAll('.t-cand').forEach(b => b.addEventListener('click', () => {
      const inp = $('t-kabinett').querySelector('.t-custom-name[data-m="' + b.dataset.m + '"]');
      T.nameMinister(g, b.dataset.m, Number(b.dataset.i), inp ? inp.value : '');
      save();
      render();
    }));
  }

  // ---------- Parlament ----------
  function renderParliament() {
    const t = term();
    const seats = t.seats;
    let html = '<h2>🗳️ Bundestag und Bundesrat</h2><div class="t-parl"><div><h3>Bundestag (' + D.SEATS + ' Sitze)</h3><div class="hemicycle t-hemi">' + U.hemicycle(seats) + '</div><div class="seat-legend">' + U.seatLegend(seats) + '</div>' +
      '<p class="small">Regierung: ' + t.gov.map(pill).join(' ') + ' · ' + T.govSeats(t) + ' Sitze (Mehrheit ab ' + E.MAJORITY + ')' + (t.tolerated ? ' – Minderheitsregierung' : '') + '</p>';
    const q = T.quorum(g);
    if (t.role === 'opposition') html += '<p class="small">Viertel der Abgeordneten für Untersuchungsausschuss und Normenkontrollklage: ' + (q.ok ? '✅' : '❌') + ' ' + q.seats + ' von ' + Math.ceil(D.SEATS / 4) + ' nötigen Sitzen.</p>';
    let brRows = '';
    let fedGov = 0;
    Object.keys(t.laender).sort((a, b) => t.laender[b].votes - t.laender[a].votes).forEach(l => {
      const L = t.laender[l];
      const aligned = L.gov.every(p => t.gov.indexOf(p) !== -1);
      if (aligned) fedGov += L.votes;
      brRows += '<tr class="' + (aligned ? 'aligned' : '') + '"><td>' + esc(E.stateById(l).name) + '</td><td class="num">' + L.votes + '</td><td>' + L.gov.map(pill).join(' ') + '</td></tr>';
    });
    html += '</div></div><h3>Bundesrat (69 Stimmen)</h3>' + bundesratSvg(t) + '<p class="t-lead ' + (fedGov >= TD.BUNDESRAT_MAJ ? '' : 'neg') + '"><b>' + fedGov + ' von 69 Stimmen</b> kommen aus Ländern, in denen nur Bundesregierungsparteien regieren – ' +
      (fedGov >= TD.BUNDESRAT_MAJ ? 'genug für zustimmungspflichtige Gesetze.' : 'für zustimmungspflichtige Gesetze (' + TD.BUNDESRAT_MAJ + ') braucht ihr andere Länder.') + '</p>' +
      '<details class="t-more"><summary>Alle 16 Landesregierungen als Tabelle</summary><table class="t-br"><tbody>' + brRows + '</tbody></table></details>';
    if (t.ltwLog.length) {
      html += '<details class="t-more"><summary>Landtagswahlen in dieser Legislaturperiode (' + t.ltwLog.length + ')</summary><ul class="t-ltw">' + t.ltwLog.slice().reverse().map(x => '<li><b>' + esc(E.stateById(x.land).name) + '</b> (' + esc(T.quarterLabel(t, x.q)) + '): ' +
        esc(short(g.party)) + ' ' + pct(x.shares[g.party]) + ' (' + signed(x.diff) + ') · Regierung: ' + x.gov.map(pill).join(' ') + '</li>').join('') + '</ul></details>';
    }
    if (g.rivals) {
      const ids = Object.keys(g.rivals).filter(p => (t.seats[p] || 0) > 0).sort((a, b) => t.seats[b] - t.seats[a]);
      html += '<h3>Die Spitzen der anderen Parteien</h3><ul class="t-ltw">' + ids.map(p => {
        const r = g.rivals[p];
        const st = E.rivalStyle(r);
        return '<li>' + pill(p) + ' <b>' + esc(r.name) + '</b>' + (p === t.chanc ? ' (Kanzleramt)' : '') + ' · ' + esc(st.name) + ' – ' + esc(st.desc) + (r.feud >= 1 ? ' · Rivalität ' + '🔥'.repeat(Math.min(3, Math.round(r.feud))) : '') + '</li>';
      }).join('') + '</ul>';
    }
    $('t-parlament').innerHTML = html;
  }

  // Zusammensetzung des Bundesrates im Stil der offiziellen Grafik: Halbkreis, Länder alphabetisch, Breite nach Stimmen,
  // die Koalitionsparteien eines Landes als Ringe (außen die Partei der Regierungschefin/des Regierungschefs).
  const BR_SHORT = { BW: 'Baden-Württemberg', MV: 'Mecklenburg-Vorpommern', NW: 'Nordrhein-Westfalen', RP: 'Rheinland-Pfalz', SH: 'Schleswig-Holstein', ST: 'Sachsen-Anhalt' };
  function bundesratSvg(t) {
    const cx = 550; const cy = 70; const r0 = 175; const r1 = 380; const r2 = 418;
    const ids = Object.keys(t.laender).sort((a, b) => E.stateById(a).name.localeCompare(E.stateById(b).name, 'de'));
    const total = ids.reduce((s, l) => s + t.laender[l].votes, 0);
    const pt = (r, a) => (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1);
    const sector = (ra, rb, a0, a1) => 'M' + pt(ra, a0) + ' A' + ra + ' ' + ra + ' 0 0 0 ' + pt(ra, a1) + ' L' + pt(rb, a1) + ' A' + rb + ' ' + rb + ' 0 0 1 ' + pt(rb, a0) + 'Z';
    const fill = (l, p) => (l === 'BY' && p === 'union' ? 'var(--c-csu)' : col(p));
    let a = Math.PI;
    let body = '';
    let labels = '';
    const used = new Set();
    ids.forEach(l => {
      const L = t.laender[l];
      const a1 = a - Math.PI * L.votes / total;
      const n = L.gov.length;
      L.gov.forEach((p, k) => {
        used.add(l === 'BY' && p === 'union' ? 'csu' : p);
        body += '<path d="' + sector(r1 - (r1 - r0) * k / n, r1 - (r1 - r0) * (k + 1) / n, a, a1) + '" fill="' + fill(l, p) + '"><title>' + esc(E.stateById(l).name) + ': ' + esc(short(p)) + '</title></path>';
      });
      // Trennlinie, grauer Ring mit Stimmenzahl
      body += '<path d="' + sector(r2, r1 + 6, a, a1) + '" class="br-ring' + (L.gov.every(p => t.gov.indexOf(p) !== -1) ? ' fed' : '') + '"></path>';
      body += '<line x1="' + pt(r0, a1).split(' ')[0] + '" y1="' + pt(r0, a1).split(' ')[1] + '" x2="' + pt(r2, a1).split(' ')[0] + '" y2="' + pt(r2, a1).split(' ')[1] + '" class="br-sep"></line>';
      const m = (a + a1) / 2;
      const [vx, vy] = pt((r1 + 6 + r2) / 2, m).split(' ');
      body += '<circle cx="' + vx + '" cy="' + vy + '" r="14" class="br-num-bg"></circle><text x="' + vx + '" y="' + (Number(vy) + 6) + '" class="br-num">' + L.votes + '</text>';
      const c = Math.cos(m);
      // Wie im Original: das Land genau unten mittig und etwas tiefer, die übrigen links bzw. rechts ausgerichtet.
      const anchor = c < -0.1 ? 'end' : c > 0.1 ? 'start' : 'middle';
      const [lx, ly] = pt(r2 + (anchor === 'middle' ? 34 : 16), m).split(' ');
      const name = BR_SHORT[l] || E.stateById(l).name;
      const parts = name.indexOf('-') > 0 && name.length > 12 ? [name.slice(0, name.indexOf('-') + 1), name.slice(name.indexOf('-') + 1)] : [name];
      const y0 = Number(ly) + (Math.sin(m) > 0.3 ? 14 : 6) - (parts.length - 1) * 11;
      labels += '<text x="' + lx + '" y="' + y0 + '" text-anchor="' + anchor + '" class="br-label' + (L.gov.indexOf(g.party) !== -1 ? ' mine' : '') + '">' + parts.map((x, i) => '<tspan x="' + lx + '" dy="' + (i ? 22 : 0) + '">' + esc(x) + '</tspan>').join('') + '</text>';
      a = a1;
    });
    const center = '<text x="' + cx + '" y="' + (cy + 45) + '" class="br-c1">Stimmen insgesamt:</text><text x="' + cx + '" y="' + (cy + 90) + '" class="br-c2">' + total + '</text>' +
      '<text x="' + cx + '" y="' + (cy + 125) + '" class="br-c1">absolute Mehrheit:</text><text x="' + cx + '" y="' + (cy + 165) + '" class="br-c2">' + TD.BUNDESRAT_MAJ + '</text>';
    const order = ['union', 'csu', 'spd', 'fdp', 'gruene', 'linke', 'fw', 'bsw', 'afd', 'ssw'].filter(p => used.has(p)).concat([...used].filter(p => ['union', 'csu', 'spd', 'fdp', 'gruene', 'linke', 'fw', 'bsw', 'afd', 'ssw'].indexOf(p) === -1));
    const legend = '<div class="br-legend">' + order.map(p => '<span><i style="background:' + (p === 'csu' ? 'var(--c-csu)' : col(p)) + '"></i>' + (p === 'union' ? 'CDU' : p === 'csu' ? 'CSU' : esc(short(p))) + '</span>').join('') +
      '<span class="br-legend-fed"><i></i>nur Bundesregierungsparteien</span><span><b>fett</b>&nbsp;= ihr regiert mit</span></div>';
    return '<figure class="br-fig"><p class="br-title">Die Zusammensetzung des Bundesrates <small>Stand: ' + esc(T.quarterLabel(t)) + '</small></p>' +
      '<svg viewBox="-40 30 1180 530" role="img" aria-label="Sitzverteilung im Bundesrat nach Ländern und Landesregierungen">' + body + center + labels + '</svg>' + legend + '</figure>';
  }

  // ---------- Partei ----------
  function renderParty() {
    const t = term();
    const P = t.party;
    let html = '<h2>🎪 ' + esc(E.party(g.party).name) + '</h2><div class="t-kpis">' +
      kpi('Vorsitz', esc(P.leader.name), 'Beliebtheit ' + (P.leader.like >= 0 ? '+' : '−') + num1(Math.abs(P.leader.like))) +
      kpi('Mitglieder', P.members.toLocaleString('de-DE'), signed((P.members / E.party(g.party).members - 1) * 100) + ' % seit der Wahl') +
      kpi('Parteikasse', mio(P.cash), 'geht in den nächsten Wahlkampf') +
      kpi('Geschlossenheit', Math.round(P.unity) + '/100', bar(P.unity, 100, P.unity < 40 ? 'bad' : 'good')) + '</div>';
    const LBx = T.LB;
    const near = Math.round((g.lobby && g.lobby.near) || 0);
    // Verbände: die drei stärksten Unterstützer und Gegner, der Rest zum Aufklappen.
    const lrow = l => { const r = Math.round(LBx.rel(g, l.id)); return '<div class="t-lv-row"><span>' + l.icon + ' ' + esc(l.short) + '</span>' + bar(r, 100, r >= 70 ? 'good' : r <= 25 ? 'bad' : 'mid') + '<span class="num">' + r + '</span></div>'; };
    const sorted = LBx.LOBBIES.slice().sort((a, b) => LBx.rel(g, b.id) - LBx.rel(g, a.id));
    html += '<h3>🏛️ Verbände <span class="muted small">Lobbynähe ' + near + '/100</span></h3><div class="t-two"><div><h4>👍 Stärkste Unterstützer</h4><div class="t-lv">' + sorted.slice(0, 3).map(lrow).join('') + '</div></div>' +
      '<div><h4>👎 Stärkste Gegner</h4><div class="t-lv">' + sorted.slice(-3).reverse().map(lrow).join('') + '</div></div></div>' +
      '<details class="t-more"><summary>Alle Verbände und Lobbyregister</summary><p class="muted small">Verbündete (ab 70) mobilisieren und spenden, Gegner (bis 25) machen Stimmung gegen euch. Je höher die Lobbynähe, desto mehr Geld und Unterstützung, aber auch mehr Affärenrisiko.</p><div class="t-lv">' + sorted.map(lrow).join('') + '</div>' +
      (g.lobby && g.lobby.register.length ? '<h4>Lobbyregister (öffentlich)</h4><ul class="t-cred">' + g.lobby.register.slice(0, 8).map(x => '<li>' + esc(x.when) + ': ' + esc(LBx.byId(x.id).short) + ' – ' + esc(x.text) + '</li>').join('') + '</ul>' : '') + '</details>';
    // Landesverbände: nur die unruhigen.
    const lvRow = st => { const u = P.lv[st.id]; return '<div class="t-lv-row"><span>' + esc(st.name) + '</span>' + bar(u, 100, u > 60 ? 'bad' : u > 40 ? 'mid' : 'good') + '<span class="num">' + Math.round(u) + '</span></div>'; };
    const lvs = D.STATES.slice().sort((a, b) => P.lv[b.id] - P.lv[a.id]);
    const restless = lvs.filter(st => P.lv[st.id] >= 40);
    html += '<h3>🧩 Landesverbände</h3>' + (restless.length ? '<p class="muted small">Unruhig (ab 50 kostet es im Land Stimmen):</p><div class="t-lv">' + restless.map(lvRow).join('') + '</div>' : '<p class="muted">Alle Landesverbände sind ruhig.</p>') +
      '<details class="t-more"><summary>Alle Landesverbände</summary><div class="t-lv">' + lvs.map(lvRow).join('') + '</div></details>';
    const career = [];
    if (career.length) {
      html += '<h3>Eure Laufbahn</h3><ul class="t-career">' + career.map(c => '<li>' + c.n + '. Legislatur ' + c.from + '–' + c.to + ': ' + esc(TD.ROLES[c.role].name) + ' · ' + c.score + ' Punkte (' + esc(c.rating) + ')</li>').join('') + '</ul>';
    }
    $('t-partei').innerHTML = html;
  }

  // ---------- Umfragen ----------
  function renderPolls() {
    const t = term();
    let html = '<h2>📊 Sonntagsfrage</h2><div class="poll-cols">' + U.pollColumnsHtml(g.poll.nat, t.start) + '</div><p class="muted small">Veränderung zur Bundestagswahl ' + t.year0 + '. Fehlerspanne ± ' + E.POLL_RANGE + ' Punkte.</p>';
    html += '<h3>Verlauf seit der Wahl</h3><div class="t-chart" id="t-chart"></div>';
    html += fxHtml();
    html += groupsHtml();
    $('t-umfragen').innerHTML = html;
    drawTermChart();
  }
  // Was eure Umfrage bewegt: Wirkungen nach Ursache (Prozentpunkte, vor der Wählerwanderung).
  function fxRows(fx) {
    return Object.keys(fx).filter(c => Math.abs(fx[c]) >= 0.05).sort((a, b) => Math.abs(fx[b]) - Math.abs(fx[a]));
  }
  function fxBlock(title, fx, n) {
    const rows = fxRows(fx).slice(0, n || 99);
    if (!rows.length) return '<div class="t-fx-col"><h4>' + title + '</h4><p class="muted small">Noch keine Wirkungen.</p></div>';
    const max = Math.max(0.3, ...rows.map(c => Math.abs(fx[c])));
    return '<div class="t-fx-col"><h4>' + title + '</h4><div class="t-fx">' + rows.map(c => {
      const v = fx[c];
      return '<div class="t-fx-row"><span>' + esc(T.FX_NAMES[c] || c) + '</span><span class="t-fx-bar"><i class="' + (v >= 0 ? 'pos' : 'neg') + '" style="width:' + Math.abs(v) / max * 50 + '%;' + (v >= 0 ? 'left:50%' : 'right:50%') + '"></i></span><b class="' + (v >= 0 ? 'pos' : 'neg') + '">' + signed(v) + '</b></div>';
    }).join('') + '</div></div>';
  }
  function fxHtml() {
    const t = term();
    const hist = t.pollFxHist || [];
    const last = hist.length ? hist[hist.length - 1] : null;
    const total = {};
    hist.concat([{ fx: t.pollFx || {} }]).forEach(h => Object.keys(h.fx).forEach(c => { total[c] = (total[c] || 0) + h.fx[c]; }));
    let html = '<h3>🔍 Was euch bewegt hat</h3>' + fxBlock('Die fünf wichtigsten Ursachen seit der Wahl (Prozentpunkte)', total, 5).replace('<h4>', '<h4 class="muted small">');
    html += '<details class="t-more"><summary>Genauer: dieses und letztes Quartal, alle Ursachen</summary><p class="muted small">Krisen und Dauerstreit wirken lange nach, Routinearbeit verpufft schnell, ein Hype verglüht ohne Wahlerfolge (Werte geschätzt, vor der Wählerwanderung).</p><div class="t-fx-wrap">' +
      fxBlock('Seit Beginn dieses Quartals', t.pollFx || {}) + (last ? fxBlock('Im letzten Quartal (' + T.quarterLabel(t, last.q) + ')', last.fx) : '') + fxBlock('Alle Ursachen seit der Wahl', total) + '</div></details>';
    if (t.credLog && t.credLog.length) {
      const li = x => '<li><b class="' + (x.v >= 0 ? 'pos' : 'neg') + '">' + (x.v >= 0 ? '+' : '−') + Math.abs(x.v) + '</b> ' + esc(x.why) + '</li>';
      html += '<h3>🤝 Glaubwürdigkeit: ' + Math.round(t.cred) + '/100</h3><ul class="t-cred">' + t.credLog.slice(0, 3).map(li).join('') + '</ul>' +
        (t.credLog.length > 3 ? '<details class="t-more"><summary>Ältere Einträge</summary><ul class="t-cred">' + t.credLog.slice(3, 12).map(li).join('') + '</ul></details>' : '');
    }
    return html;
  }
  // Eure Werte in den Wählergruppen: heute gegenüber der Wahl.
  function groupsHtml() {
    const t = term();
    const now = g.poll.groups || {};
    const start = t.groups0 || {};
    const rows = D.GROUPS.filter(k => now[k.id]).map(k => ({ k, v: now[k.id][g.party] || 0, d: start[k.id] ? (now[k.id][g.party] || 0) - (start[k.id][g.party] || 0) : 0 }));
    if (!rows.length) return '';
    const max = Math.max(...rows.map(r => r.v), 1);
    const row = r => '<div class="t-grp"><span>' + r.k.icon + ' ' + esc(r.k.short) + '</span><span class="t-meter"><i style="width:' + r.v / max * 100 + '%;background:' + col(g.party) + '"></i></span><b>' + pct(r.v) + '</b><small class="' + (r.d >= 0 ? 'pos' : 'neg') + '">' + signed(r.d) + '</small></div>';
    const moved = rows.slice().sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
    return '<h3>👥 Wählergruppen: die größten Veränderungen</h3><div class="t-groups">' + moved.slice(0, 5).map(row).join('') + '</div>' +
      '<details class="t-more"><summary>Alle Wählergruppen (' + rows.length + ')</summary><div class="t-groups">' + rows.map(row).join('') + '</div></details>';
  }
  function drawTermChart() {
    const t = term();
    const box = $('t-chart');
    const W = Math.max(300, Math.round(box.clientWidth || 600));
    const H = Math.round(Math.min(280, Math.max(180, W * 0.4)));
    const L = 28; const R = 10; const Tp = 8; const B = 22;
    const hist = t.history;
    const ids = MAIN.filter(p => E.isShown(g, p)).concat((D.MINORS || []).map(m => m.id).filter(m => E.isShown(g, m)));
    let maxV = 0;
    hist.forEach(h => ids.forEach(p => { maxV = Math.max(maxV, h.nat[p] || 0); }));
    const yMax = Math.ceil((maxV + 2) / 10) * 10;
    const n = Math.max(1, T.QUARTERS);
    const x = i => L + (W - L - R) * i / n;
    const y = v => Tp + (H - Tp - B) * (1 - v / yMax);
    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Umfrageverlauf nach Quartalen"><g class="grid">';
    for (let v = 0; v <= yMax; v += 10) svg += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"></line>';
    svg += '</g><g class="axis">';
    for (let v = 0; v <= yMax; v += 10) svg += '<text x="' + (L - 5) + '" y="' + (y(v) + 3) + '" text-anchor="end">' + v + '</text>';
    for (let i = 0; i <= n; i++) { const c = T.absCal(t.abs0 + i - 1); if (c.qn === 1 || i === 0) svg += '<text x="' + x(i) + '" y="' + (H - 5) + '" text-anchor="middle">' + (i === 0 ? 'Wahl' : c.year) + '</text>'; }
    svg += '</g>';
    ids.slice().sort((a, b) => (a === g.party) - (b === g.party)).forEach(p => {
      const pts = hist.map((h, i) => x(i) + ',' + y(h.nat[p] || 0)).join(' ');
      svg += '<polyline class="series' + (p === g.party ? ' me' : '') + '" points="' + pts + '" style="stroke:' + col(p) + '"></polyline>';
    });
    svg += '</svg>';
    box.innerHTML = svg;
  }

  // ---------- Nachrichten ----------
  function renderNews() {
    const t = term();
    newsSeen = t.news[0] || null;
    $('t-news-badge').hidden = true;
    const li = n => '<li class="t-n-' + n.kind + '"><span class="wk">' + esc(T.quarterLabel(t, Math.min(n.q, T.QUARTERS - 1)).replace('. Quartal ', '/')) + '</span><span>' + esc(n.text) + '</span></li>';
    $('t-news').innerHTML = '<h3>📰 Letzte Meldungen</h3><ul class="news">' + t.news.slice(0, 4).map(li).join('') + '</ul>' +
      (t.news.length > 4 ? '<details class="t-more"><summary>Alle Nachrichten (' + t.news.length + ')</summary><ul class="news">' + t.news.slice(4).map(li).join('') + '</ul></details>' : '');
  }

  // ---------- Entscheidungen (Dialoge) ----------
  function checkPending() {
    const t = term();
    if (!t.pending.length) {
      U.closeModal();
      if (t.over && !t.summaryShown) { t.summaryShown = true; save(); showSummary(); }
      return;
    }
    const it = t.pending[0];
    const eyebrow = T.quarterLabel(t);
    const after = res => {
      save();
      render();
      if (res && res.text) {
        U.openModal(eyebrow, 'Ergebnis', '<p>' + esc(res.text) + '</p>', [{ label: 'Weiter', primary: true, onClick: checkPending }]);
      } else checkPending();
    };
    const choose = i => after(T.resolvePending(g, i));
    if (it.type === 'event') {
      const ev = T.eventById(it.id);
      const cat = { intl: '🌍 Internationale Krise', inland: '🇩🇪 Innenpolitik', wirtschaft: '📈 Wirtschaft', parlament: '🏛️ Parlament', lv: '🧩 Landesverband', koalition: '🤝 Koalition', skandal: '🔥 Skandal', partei: '🎪 Partei' }[ev.cat] || '';
      const resp = T.eventMinister(g, ev);
      U.openModal(eyebrow + ' · ' + cat, T.fillText(g, it, ev.title), '<p>' + esc(T.fillText(g, it, ev.text)) + '</p>' +
        (resp ? '<p class="small muted">Zuständig: ' + esc(resp.name) + ' (' + esc(short(resp.party)) + ', ' + esc(T.ministryById(resp.ministry).short) + ', Kompetenz ' + resp.comp + ') – Kompetenz verbessert die Erfolgsaussichten.</p>' : ''),
        T.eventChoices(g, ev).map((c, i) => ({ label: c.label, hint: (c.hint || '') + (c.chance !== undefined ? ' · Erfolgsaussicht ca. ' + Math.round(c.chance * 100) + ' %' : '') + (c.mandate ? ' · Abstimmung im Bundestag' : ''), onClick: () => choose(i) })));
    } else if (it.type === 'scandal') {
      U.openModal(eyebrow + ' · 🔥 Affäre', 'Affäre im ' + T.ministryById(it.ministry).short + '-Ministerium', '<p>' + esc(it.text) + '</p>',
        [{ label: 'Festhalten', hint: 'Riskant: Kommt mehr heraus, wird es teuer', onClick: () => choose(0) }, { label: 'Rücktritt nahelegen', hint: 'Ihr benennt eine Nachfolge', onClick: () => choose(1) }]);
    } else if (it.type === 'kbefragung') {
      const opp = it.opp ? (g.rivals && g.rivals[it.opp] ? g.rivals[it.opp].name + ' (' + short(it.opp) + ')' : short(it.opp)) : 'die Opposition';
      U.openModal(eyebrow + ' · 🎤 Regierungsbefragung', 'Fragen an die Kanzlerin/den Kanzler', '<p>Mittwoch, 13 Uhr, Plenarsaal. Nach einem kurzen Eingangsstatement stellen die Abgeordneten Fragen. ' + esc(opp) + ' eröffnet mit einer Frage zum Thema <b>' + esc(E.topicById(it.topic).name) + '</b>.</p>' +
        '<p class="small muted">Kompetenz eurer Partei bei diesem Thema: ' + Math.round((g.competence || {})[it.topic] || 40) + '/100</p>',
        [{ label: 'Mit Fakten antworten', hint: 'Gelingt bei hoher Kompetenz', onClick: () => choose(0) },
          { label: 'Gegenangriff auf die Opposition', hint: 'Die Fraktion jubelt, die Mitte weniger', onClick: () => choose(1) },
          { label: 'Ausweichen', hint: 'Sicher – aber kostet Glaubwürdigkeit', onClick: () => choose(2) }]);
    } else if (it.type === 'eckwerte') {
      U.openModal(eyebrow + ' · 🏦 Haushaltsverfahren', 'Eckwerte für den Haushalt ' + it.year, '<p>Im Frühjahr beschließt das Kabinett die Eckwerte – den Rahmen für den Regierungsentwurf im Sommer. Welche Linie gebt ihr vor?</p>',
        [{ label: 'Fortschreiben', hint: 'Der bisherige Haushalt als Grundlage', onClick: () => choose(0) },
          { label: 'Konsolidieren', hint: 'Entwurf startet mit Kürzungen · glaubwürdig, Partner murren', onClick: () => choose(1) },
          { label: 'Investieren', hint: 'Entwurf startet mit mehr Geld für Verkehr, Forschung, Verteidigung, Wohnen', onClick: () => choose(2) }]);
    } else if (it.type === 'bereinigung') {
      U.openModal(eyebrow + ' · 🏦 Haushaltsausschuss', 'Bereinigungssitzung', '<p>In der traditionellen Nachtsitzung vor der 2./3. Lesung legen die Haushälter letzte Änderungen fest. Die Abgeordneten der Koalition wollen Projekte in ihren Wahlkreisen.</p>',
        [{ label: 'Projekte zulassen', hint: '0,8 Mrd. € · gutes Klima in Fraktion und Koalition', onClick: () => choose(0) },
          { label: 'Hart bleiben', hint: 'Solide, aber die Haushälter murren', onClick: () => choose(1) }]);
    } else if (it.type === 'memory') {
      const m = it.m;
      U.openModal(eyebrow + ' · 🎙️ Interview', 'Rückblick: „' + m.title + '“', '<p>Vor ' + it.ago + ' Quartalen (' + esc(T.quarterLabel(term(), m.q)) + ') habt ihr entschieden: <b>' + esc(m.label) + '</b>. ' + (m.ok ? 'Im Rückblick ging die Rechnung auf.' : 'Im Rückblick ging das schief.') + '</p><p>Die Interviewerin hakt nach: „Würden Sie heute wieder so entscheiden?“</p>',
        [{ label: 'Zur Entscheidung stehen', hint: m.ok ? 'Ihr könnt auf das Ergebnis verweisen' : 'Riskant: Es hat nicht funktioniert', onClick: () => choose(0) },
          { label: m.ok ? 'Bescheiden bleiben' : 'Einen Fehler eingestehen', hint: m.ok ? 'Sympathisch' : 'Glaubwürdig, kostet kurz', onClick: () => choose(1) },
          { label: 'Ausweichen', hint: 'Die Frage bleibt hängen', onClick: () => choose(2) }]);
    } else if (it.type === 'ltwcamp') {
      const name = E.stateById(it.land).name;
      const L = term().laender[it.land];
      U.openModal(eyebrow + ' · 🗺️ Landtagswahlkampf', 'Wahl in ' + name + ' am Quartalsende', '<p>In ' + name + ' wird gewählt. Regierung bisher: ' + L.gov.map(pill).join(' ') + ' (' + L.votes + ' Stimmen im Bundesrat). Euer letztes Ergebnis dort: ' + pct(term().landPrev[it.land] || 0) + '.</p>' +
        '<p class="small muted">Ihr liegt bundesweit bei ' + pct(g.poll.nat[g.party]) + ' (' + signed(g.poll.nat[g.party] - term().share0) + ' seit der Bundestagswahl). ' + (T.isGov(term().role) ? 'Regierungsparteien werden bei Landtagswahlen oft abgestraft.' : '') + '</p>',
        [{ label: 'Den Landesverband machen lassen', hint: 'Er dankt es euch – kein Bundestrend-Schutz', onClick: () => choose(0) },
          { label: 'Bundesprominenz schicken', hint: 'Mehr Stimmen im Land · kostet eine Aktion und Geld', onClick: () => choose(1) },
          { label: 'Abstand zur Bundespartei halten', hint: 'Schützt vor dem Bundestrend; eine Niederlage fällt weniger auf euch zurück', onClick: () => choose(2) }]);
    } else if (it.type === 'landkoa') {
      const name = E.stateById(it.land).name;
      U.openModal(eyebrow + ' · 🤝 Regierungsbildung im Land', 'Koalitionsgespräche in ' + name, '<p>Nach der Landtagswahl könnt ihr in ' + name + ' mitregieren. Mit wem?</p><p class="small muted">Landesregierungen bestimmen das Abstimmungsverhalten im Bundesrat (' + term().laender[it.land].votes + ' Stimmen). Bündnisse quer zur Bundeskoalition belasten das Koalitionsklima.</p>',
        it.options.map((o, i) => ({ label: o.map(short).join('-'), hint: o.every(p => term().gov.indexOf(p) !== -1) ? 'Wie im Bund – stärkt die Bundesregierung im Bundesrat' : o.some(p => term().gov.indexOf(p) !== -1) ? 'Gemischte Koalition: Das Land enthält sich im Bundesrat meist' : 'Gegenmodell zum Bund', onClick: () => choose(i) }))
          .concat([{ label: 'In die Opposition gehen', hint: 'Die anderen bilden die Regierung', onClick: () => choose(it.options.length) }]));
    } else if (it.type === 'whip') {
      const l = term().laws.find(x => x.id === it.law);
      const v = T.bundestagVote(g, l);
      const gr = it.groups[it.i];
      const w = T.WOBBLE.find(x => x.id === gr.reason);
      const head = '<p>Die Abstimmung über „' + esc(T.lawName(l)) + '“ wird knapp. Prognose: <b>' + v.yes + ' Ja</b> gegen <b>' + v.no + ' Nein</b>' + (v.abst ? ', ' + v.abst + ' Enthaltungen' : '') + '.</p>' +
        '<ul class="small">' + it.groups.map((x, i) => '<li' + (i === it.i ? ' class="now"' : i < it.i ? ' class="muted"' : '') + '>' + esc(x.name) + ' (' + esc(short(x.p)) + ', WK ' + esc(x.wk) + ') + ' + (x.n - 1) + ' weitere</li>').join('') + '</ul>' +
        '<p><b>' + esc(gr.name) + '</b> aus dem Wahlkreis ' + esc(gr.wk) + ' und ' + (gr.n - 1) + ' weitere Abgeordnete ' + (w ? esc(w.text) : 'von ' + esc(pname(gr.p)) + ' wollen nicht mitziehen') + '.</p>';
      const opts = w ? [{ label: 'Gespräch unter vier Augen', hint: 'Überzeugen statt Druck – klappt nicht immer', onClick: () => choose(0) },
        { label: w.offer, hint: w.hint, onClick: () => choose(1) },
        { label: 'Fraktionsdisziplin einfordern', hint: 'Meist erfolgreich, kostet Geschlossenheit', onClick: () => choose(2) }]
        : [{ label: 'Die Spitze von ' + short(gr.p) + ' anrufen', hint: 'Hängt vom Koalitionsklima ab', onClick: () => choose(0) },
          { label: 'Zugeständnis in anderer Sache', hint: '0,5 Mrd. € für ein Projekt des Partners', onClick: () => choose(1) },
          { label: 'Darauf ankommen lassen', onClick: () => choose(2) }];
      U.openModal(eyebrow + ' · 🗳️ Abstimmungskrimi (' + (it.i + 1) + '/' + it.groups.length + ')', 'Wackelkandidaten', head, opts);
    } else if (it.type === 'brwhip') {
      const l = term().laws.find(x => x.id === it.law);
      const br = T.bundesratVote(g, l);
      const x = it.lands[it.i];
      U.openModal(eyebrow + ' · 🏛️ Bundesrat (' + (it.i + 1) + '/' + it.lands.length + ')', 'Kampf um ' + E.stateById(x.land).name, '<p>„' + esc(T.lawName(l)) + '“ kommt nach heutigem Stand auf <b>' + br.yes + ' von 69</b> Stimmen ' + (l.zust ? '(nötig: ' + TD.BUNDESRAT_MAJ + ')' : '(Einspruch ab ' + TD.BUNDESRAT_MAJ + ' Gegenstimmen)') + '.</p>' +
        '<p>' + esc(x.mp) + ' (' + esc(short(x.party)) + '), Regierungschef:in von ' + esc(E.stateById(x.land).name) + ' (' + x.votes + ' Stimmen), lässt durchblicken: Mit dem richtigen Angebot könnte das Land zustimmen. Bedenken hat ' + x.block.map(p => esc(short(p))).join(', ') + '.</p>',
        [{ label: 'Finanzzusage an das Land', hint: '1 Mrd. € aus dem Bundeshaushalt', onClick: () => choose(0) },
          { label: 'Zugeständnis im Gesetz', hint: 'Kostenlos, aber das Gesetz wirkt schwächer', onClick: () => choose(1) },
          { label: 'Hart bleiben', onClick: () => choose(2) }]);
    } else if (it.type === 'brstell') {
      const l = term().laws.find(x => x.id === it.law);
      U.openModal(eyebrow + ' · 🏛️ Bundesrat, 1. Durchgang', 'Stellungnahme der Länder', '<p>Der Bundesrat nimmt zu eurem Entwurf „' + esc(T.lawName(l)) + '“ Stellung: Die Länder verlangen Änderungen und eine Beteiligung des Bundes an den Kosten. Nach heutigem Stand bekäme das Gesetz im 2. Durchgang nur <b>' + it.yes + ' von 69</b> Stimmen.</p>' +
        '<p class="small muted">' + (l.zust ? 'Zustimmungsgesetz: Ohne 35 Stimmen ist es gescheitert, wenn auch der Vermittlungsausschuss keinen Kompromiss findet.' : 'Einspruchsgesetz: Der Bundesrat kann den Vermittlungsausschuss anrufen und Einspruch einlegen.') + '</p>',
        [{ label: 'Änderungswünsche übernehmen', hint: 'Länder mit kleinen Bedenken stimmen zu · der Bund trägt 1,5 Mrd. € Mehrkosten', onClick: () => choose(0) },
          { label: 'Gegenäußerung: zurückweisen', hint: 'Kein Geld, aber Risiko im 2. Durchgang', onClick: () => choose(1) }]);
    } else if (it.type === 'anhoerung') {
      const l = term().laws.find(x => x.id === it.law);
      U.openModal(eyebrow + ' · 🎓 Ausschuss', 'Öffentliche Anhörung', '<p>Im federführenden Ausschuss hören die Abgeordneten Sachverständige zu „' + esc(T.lawName(l)) + '“ an. ' + esc(it.expert) + '</p>',
        [{ label: 'Nachbessern', hint: 'Abstimmung ein Quartal später · weniger Abweichler, geringeres Klagerisiko', onClick: () => choose(0) },
          { label: 'Am Entwurf festhalten', hint: 'Abstimmung im Zeitplan · etwas Glaubwürdigkeit', onClick: () => choose(1) }]);
    } else if (it.type === 'veto') {
      const l = term().laws.find(x => x.id === it.law);
      const opts = [{ label: 'Entwurf zurückziehen', hint: 'Kein Streit', onClick: () => choose(0) }];
      if (l.kind === 'topic') opts.push({ label: 'Kompromiss in der Mitte', hint: '„' + D.PROGRAM[l.topic].find(o => o.lean === 0).label + '“', onClick: () => choose(1) });
      if (term().role === 'kanzler') opts.push({ label: 'Per Richtlinienkompetenz durchsetzen', hint: 'Art. 65 GG – das Koalitionsklima leidet stark', onClick: () => choose(2) });
      U.openModal(eyebrow + ' · 🛑 Kabinett', 'Veto von ' + short(l.vetoBy), '<p>' + esc(pname(l.vetoBy)) + ' trägt euren Entwurf „' + esc(T.lawName(l)) + '“ nicht mit.</p>', opts);
    } else if (it.type === 'cabinet') {
      const l = term().laws.find(x => x.id === it.law);
      const d = Math.abs(T.leanOf(g, g.party, l.kind === 'tax' ? 'finanzen' : l.topic) - (l.kind === 'tax' ? T.taxById(l.tax).levels[l.level].lean : D.PROGRAM[l.topic][l.opt].lean));
      U.openModal(eyebrow + ' · 🏛️ Kabinettssitzung', 'Vorlage von ' + short(l.by), '<p>' + esc(pname(l.by)) + ' legt einen Gesetzentwurf vor: <b>' + esc(T.lawTitle(l)) + '</b>.</p><p class="small">' +
        (l.contract ? '📜 Steht im Koalitionsvertrag. ' : '') + (d === 0 ? 'Entspricht eurer Linie.' : d === 1 ? 'Weicht etwas von eurer Linie ab.' : 'Widerspricht eurer Linie deutlich – eure Basis wird murren.') + '</p>',
        [{ label: 'Zustimmen', hint: d === 2 ? 'Geschlossenheit sinkt' : 'Der Entwurf geht in den Bundestag', onClick: () => choose(0) },
          { label: 'Nachverhandeln', hint: 'Kompromiss in der Mitte, etwas Streit', onClick: () => choose(1) },
          { label: 'Ablehnen', hint: 'Der Entwurf ist gestoppt – das Klima leidet', onClick: () => choose(2) }]);
    } else if (it.type === 'budgetcab') {
      const d = term().budget.draft;
      const b = T.budgetCalc(term(), d.plan);
      U.openModal(eyebrow + ' · 🏦 Haushalt', 'Haushaltsentwurf ' + d.year, '<p>Das Finanzministerium (' + esc(short(term().cabinet.finanzen ? term().cabinet.finanzen.party : term().chanc)) + ') legt den Entwurf vor: Neuverschuldung ' + mrd(b.deficit) + ', erlaubt ' + mrd(b.limit) + '.</p>',
        [{ label: 'Mittragen', hint: 'Gutes Klima', onClick: () => choose(0) }, { label: 'Nachbesserungen fordern', hint: '+5 % für einen eurer Schwerpunkte, das Klima leidet', onClick: () => choose(1) }]);
    } else if (it.type === 'lobby') {
      const l = T.LB.byId(it.lobby);
      const law = term().laws.find(x => x.id === it.law);
      U.openModal(eyebrow + ' · 🏛️ Lobbyismus', l.icon + ' ' + l.short + ' meldet sich', '<p>Zu eurem Entwurf „' + esc(law ? T.lawName(law) : '') + '“ bittet ' + esc(l.name) + ' um ein Gespräch: „Das gefährdet ' +
        (l.money >= 2 ? 'Arbeitsplätze und Investitionen' : 'die Menschen, die wir vertreten') + '. Wir haben da einen Vorschlag …“</p><p class="small muted">Beziehung: ' + Math.round(T.LB.rel(g, l.id)) + '/100 · Kampagnenkraft ' + '★'.repeat(l.power) + '</p>',
        [{ label: 'Anhören und Kompromiss machen', hint: 'Der Entwurf wird abgeschwächt, der Verband ist zufrieden', onClick: () => choose(0) },
          { label: 'Standhaft bleiben', hint: 'Der Verband startet eine Kampagne gegen euch', onClick: () => choose(1) },
          { label: '„Formulierungshilfe“ übernehmen', hint: 'Glatter Weg durchs Parlament – aber es kann herauskommen', onClick: () => choose(2) }]);
    } else if (it.type === 'door') {
      const l = T.LB.byId(it.lobby);
      U.openModal(eyebrow + ' · 🚪 Drehtür', 'Seitenwechsel?', '<p>' + esc(it.name) + ', bis eben im ' + esc(T.ministryById(it.ministry).short) + '-Ressort, soll Cheflobbyist:in bei ' + esc(l.name) + ' werden – sofort.</p>',
        [{ label: 'Karenzzeit von 18 Monaten durchsetzen', hint: 'Sauber, der Verband ist verärgert', onClick: () => choose(0) },
          { label: 'Den Wechsel hinnehmen', hint: 'Gute Kontakte – schlechte Presse', onClick: () => choose(1) }]);
    } else if (it.type === 'lobbyaffair') {
      const l = T.LB.byId(it.lobby);
      U.openModal(eyebrow + ' · 🔥 Lobbyaffäre', 'Bezahlte Nebentätigkeit?', '<p>Recherchen zeigen: Ein Abgeordneter eurer Fraktion hat für ' + esc(l.short) + ' gut bezahlte „Beratungsleistungen“ erbracht – und sich zugleich im Ausschuss für dessen Anliegen eingesetzt.</p>',
        [{ label: 'Alles offenlegen und Konsequenzen ziehen', hint: 'Kostet, aber begrenzt den Schaden', onClick: () => choose(0) },
          { label: 'Aussitzen', hint: 'Riskant – wie bei Amthor oder der Maskenaffäre', onClick: () => choose(1) }]);
    } else if (it.type === 'disloyal') {
      const m = term().cabinet[it.ministry];
      U.openModal(eyebrow + ' · 👥 Kabinett', 'Querschuss aus dem Kabinett', '<p>' + esc(m ? m.name : '') + ' (' + esc(T.ministryById(it.ministry).short) + ') kritisiert in einem Interview offen den Kurs der Regierung und der eigenen Parteiführung. Loyalität: ' + (m ? m.loyal : '?') + '/100.</p>',
        [{ label: 'Intern zurechtweisen', hint: 'Loyalität steigt, etwas Unruhe', onClick: () => choose(0) },
          { label: 'Ignorieren', hint: 'Führungsschwäche?', onClick: () => choose(1) },
          { label: 'Entlassen', hint: 'Durchgreifen – ihr benennt die Nachfolge', onClick: () => choose(2) }]);
    } else if (it.type === 'sq') {
      const tp = E.topicById(it.topic);
      const f = T.sqForces(g, it.topic);
      U.openModal(eyebrow + ' · ⚖️ Status quo', 'Druck beim Thema ' + tp.name, '<p>Der Rückhalt für die geltende Regelung („' + esc(D.PROGRAM[it.topic][term().policy[it.topic]].label) + '“) ist eingebrochen. ' +
        esc(f.att.slice(0, 2).map(x => pname(x.p)).join(' und ')) + ' machen massiv Druck – auf der Straße, in den Medien und in den Ländern.</p>',
        [{ label: 'Nachgeben: „' + D.PROGRAM[it.topic][it.opt].label + '“', hint: 'Ein Gesetzentwurf geht ins Kabinett', onClick: () => choose(0) },
          { label: 'Dagegenhalten', hint: 'Der Status quo wird gestärkt, aber das kostet Zustimmung', onClick: () => choose(1) },
          { label: 'Expertenkommission einsetzen', hint: 'Zeit gewinnen (1 Mrd. €)', onClick: () => choose(2) }]);
    } else if (it.type === 'break') {
      U.openModal(eyebrow + ' · 💥 Koalitionsbruch', short(it.leaver) + ' verlässt die Regierung', '<p>Die Koalition ist am Ende. Wie geht es weiter?</p>',
        it.options.map((o, i) => ({ label: o.label, hint: o.hint, onClick: () => choose(i) })));
    } else if (it.type === 'offer') {
      U.openModal(eyebrow + ' · 🤝 Angebot', 'Regierungsbeteiligung?', '<p>Nach dem Bruch der Koalition bietet sich eine neue Mehrheit an: <b>' + it.members.map(short).join('-') + '</b>' + (it.chanc === g.party ? ' – mit euch im Kanzleramt!' : '.') + '</p>',
        [{ label: 'Annehmen', hint: 'Ihr tretet in die Regierung ein', onClick: () => choose(0) }, { label: 'Ablehnen', hint: 'Lieber in der Opposition bleiben', onClick: () => choose(1) }]);
    } else if (it.type === 'vote') {
      if (it.budget) {
        U.openModal(eyebrow + ' · 🗳️ Abstimmung', 'Haushalt ' + term().budget.draft.year, '<p>Der Bundestag stimmt über den Haushalt der Regierung ab. Wie stimmt eure Fraktion?</p>',
          [{ label: 'Ja', onClick: () => choose(0) }, { label: 'Nein', hint: 'üblich für die Opposition', onClick: () => choose(1) }, { label: 'Enthaltung', onClick: () => choose(2) }]);
      } else {
        const l = term().laws.find(x => x.id === it.law);
        const def = T.defaultVote(g, l);
        U.openModal(eyebrow + ' · 🗳️ Abstimmung', 'Bundestag: ' + T.lawTitle(l), '<p>Die Regierung (' + esc(short(l.by)) + ') stellt den Entwurf zur Abstimmung. Eure Linie: <b>' + ({ ja: 'zustimmen', nein: 'ablehnen', enthaltung: 'enthalten' }[def]) + '</b>.</p>',
          [{ label: 'Ja', hint: def === 'ja' ? 'entspricht eurer Linie' : '', onClick: () => choose(0) }, { label: 'Nein', hint: def === 'nein' ? 'entspricht eurer Linie' : '', onClick: () => choose(1) }, { label: 'Enthaltung', onClick: () => choose(2) }]);
      }
    } else if (it.type === 'info') {
      let body = '';
      let title = '';
      if (it.kind === 'ltw') {
        const x = it.entry;
        title = 'Landtagswahl in ' + E.stateById(x.land).name;
        const ids = Object.keys(x.shares).filter(p => p !== 'sonstige' && x.shares[p] >= 2.5).sort((a, b) => x.shares[b] - x.shares[a]);
        const max = Math.max.apply(null, ids.map(p => x.shares[p]));
        body = '<div class="t-ltw-bars">' + ids.map(p => '<div class="t-ltw-row' + (p === g.party ? ' me' : '') + '"><span>' + esc(short(p)) + '</span><i style="width:' + x.shares[p] / max * 100 + '%;background:' + col(p) + '"></i><b>' + pct(x.shares[p]) + '</b></div>').join('') + '</div>' +
          '<p>Neue Landesregierung: ' + x.gov.map(pill).join(' ') + '</p><p class="small">' + esc(short(g.party)) + ': ' + signed(x.diff) + ' Punkte zur letzten Wahl im Land' + (x.inGov ? ' – ihr regiert mit!' : '') + '</p>';
      } else if (it.kind === 'ltwabend') {
        title = it.entries.length > 1 ? 'Superwahlabend: ' + it.entries.length + ' Landtagswahlen' : 'Wahlabend in ' + E.stateById(it.entries[0].land).name;
        body = it.entries.map(x => {
          const ids = Object.keys(x.shares).filter(p => p !== 'sonstige' && x.shares[p] >= 2.5).sort((a, b) => x.shares[b] - x.shares[a]).slice(0, 7);
          const max = Math.max.apply(null, ids.map(p => x.shares[p]));
          return '<h4>' + esc(E.stateById(x.land).name) + ' <span class="small ' + (x.diff >= 0 ? 'pos' : 'neg') + '">' + esc(short(g.party)) + ' ' + pct(x.shares[g.party]) + ' (' + signed(x.diff) + ')</span></h4>' +
            '<div class="t-ltw-bars">' + ids.map(p => '<div class="t-ltw-row' + (p === g.party ? ' me' : '') + '"><span>' + esc(short(p)) + '</span><i style="width:' + x.shares[p] / max * 100 + '%;background:' + col(p) + '"></i><b>' + pct(x.shares[p]) + '</b></div>').join('') + '</div>' +
            '<p class="small">' + (x.open ? '🤝 Ihr könnt mitregieren – gleich beginnen die Koalitionsgespräche.' : 'Neue Landesregierung: ' + x.gov.map(pill).join(' ') + (x.inGov ? ' – ihr regiert mit!' : '')) + '</p>';
        }).join('') + '<p class="small muted">Bundesrat: Länder nur mit Bundesregierungsparteien ' + T.brAligned(term()) + ' von 69 Stimmen (vor der Regierungsbildung).</p>';
      } else if (it.kind === 'ew') {
        title = 'Europawahl';
        body = '<p>' + esc(short(g.party)) + ': <b>' + pct(it.own) + '</b> (' + signed(it.diff) + ' zur Bundestagswahl), ' + it.seats + ' von 96 deutschen Sitzen im Europaparlament. Ohne Sperrklausel ziehen auch kleine Parteien ein.</p>';
      }
      U.openModal(eyebrow, title, body, [{ label: 'Weiter', primary: true, onClick: () => choose(0) }]);
    }
  }

  function showSummary() {
    const t = term();
    const s = t.summary;
    if (!s) return;
    if (U.saveHall) U.saveHall({ party: g.party, candidate: g.candidate, career: T.careerSnapshot(g) });
    const body = '<div class="score">' + s.score + '</div><p class="muted small">Punkte</p>' +
      '<ul class="t-sum"><li>Umfrage zum Schluss: <b>' + pct(s.share) + '</b> (' + signed(s.delta) + ' seit der Wahl)</li>' +
      '<li>Gesetze in Kraft: ' + s.lawsTotal + ', davon von euch eingebracht: ' + s.lawsOwn + ', Wahlversprechen umgesetzt: ' + s.promises + '</li>' +
      '<li>Haushalte beschlossen: ' + s.budgets + ' · Affären: ' + s.scandals + '</li>' +
      '<li>Landtagswahlen: ' + s.ltw + (s.ltwGov ? ', danach in ' + s.ltwGov + ' Ländern mitregiert' : '') + '</li>' +
      '<li>Wirtschaft: Wachstum ' + num1(s.growth) + ' %, Arbeitslosigkeit ' + num1(s.unemp) + ' %, Schuldenquote ' + num1(s.debt) + ' %</li></ul>' +
      (t.early ? '<p class="fw-note">' + esc(t.early) + '</p>' : '') +
      (() => { const L = T.legacy(T.careerSnapshot(g)); return '<p class="small">🏆 Ewigkeits-Bilanz eurer Partei: <b>' + L.score + ' Punkte</b> nach ' + L.terms + ' Legislatur' + (L.terms === 1 ? '' : 'en') + ' – „' + esc(L.rating) + '“.</p>'; })() +
      '<p>Jetzt beginnt der Wahlkampf – mit dem Stand von heute in allen Ländern.</p>';
    U.openModal('Bilanz der ' + t.n + '. Legislaturperiode', s.rating, body, [
      { label: 'Zum nächsten Wahlkampf', primary: true, hint: 'Erst die Spitzenkandidatur festlegen, dann Programmparteitag und Wahlkampf', onClick: () => chooseLeaderModal(T.nextCampaign(g)) },
      { label: 'Noch einmal umsehen', onClick: U.closeModal }
    ]);
  }

  // Generationswechsel: Wer führt die Partei in die nächste Bundestagswahl?
  function chooseLeaderModal(next) {
    const L = next.leaders;
    const go = choice => { U.closeModal(); U.startNextCampaign(T.chooseLeader(next, choice)); };
    const opts = [];
    if (L.stay.canStay) opts.push({ label: 'Weiter mit ' + L.stay.name + ' (' + L.stay.age + ')', hint: L.stay.hint, primary: !L.stay.pressure, onClick: () => go('stay') });
    L.options.forEach((o, i) => opts.push({ label: o.name + ' (' + o.age + ') – ' + o.type, hint: o.hint + ' Bekanntheit ' + o.known + ' %, Beliebtheit ' + (o.like >= 0 ? '+' : '−') + num1(Math.abs(o.like)) + '.', primary: !L.stay.canStay && i === 0, onClick: () => go(i) }));
    U.openModal('Bundestagswahl ' + L.year, 'Wer führt euch in den Wahlkampf?', '<p>' + (L.stay.canStay ? esc(L.stay.hint) : esc(L.stay.name) + ' tritt nicht mehr an: ' + esc(L.stay.hint)) + '</p><p class="small muted">Neue Gesichter sind weniger bekannt, bringen aber oft frischen Wind. Bekanntheit wächst im Wahlkampf mit jedem Auftritt.</p>', opts);
  }

  // ---------- Laufbahn und Ewigkeits-Bilanz ----------
  function renderCareer() {
    const C = g.career || {};
    const L = T.legacy(C);
    const role = r => TD.ROLES[r] ? TD.ROLES[r].icon + ' ' + TD.ROLES[r].name : r;
    const status = { kanzler: '🏛️ Kanzleramt', regierung: '🤝 Regierung', opposition: '🪑 Opposition', raus: '🚪 nicht im Bundestag' };
    let html = '<h2>🏆 Eure Laufbahn</h2><div class="t-kpis">' +
      kpi('Ewigkeits-Bilanz', L.score + ' Punkte', esc(L.rating)) +
      kpi('Bundestagswahlen', String(L.elections), L.wins + '× Kanzleramt gewonnen') +
      kpi('Jahre im Kanzleramt', num1(L.kanzlerJahre).replace(',0', ''), 'mitregiert: ' + num1(L.juniorJahre).replace(',0', '') + ' Jahre') +
      kpi('Opposition / APO', num1(L.oppJahre).replace(',0', '') + ' / ' + num1(L.apoJahre).replace(',0', '') + ' Jahre') +
      kpi('Eigene Gesetze', String(L.laws), L.promises + ' Wahlversprechen umgesetzt') +
      (L.best ? kpi('Bestes Ergebnis', pct(L.best.share), 'Bundestagswahl ' + L.best.year) : '') + '</div>';
    if ((C.elections || []).length) {
      html += '<h3>Bundestagswahlen</h3><table class="t-budget"><thead><tr><th>Jahr</th><th>Spitze</th><th>Ergebnis</th><th>Danach</th><th>Punkte</th></tr></thead><tbody>' +
        C.elections.map(x => '<tr><td>' + x.year + '</td><td>' + esc(x.leader || '') + '</td><td class="num">' + pct(x.share) + ' · ' + x.seats + ' Sitze</td><td>' + (status[x.status] || '') + '</td><td class="num">' + (x.score || 0) + '</td></tr>').join('') + '</tbody></table>';
    }
    if ((C.terms || []).length) {
      html += '<h3>Legislaturperioden</h3><table class="t-budget"><thead><tr><th>Zeit</th><th>Rolle</th><th>Regierung</th><th>Bilanz</th></tr></thead><tbody>' +
        C.terms.map(x => '<tr><td>' + x.from + '–' + x.to + (x.early ? ' *' : '') + '</td><td>' + role(x.role) + '</td><td>' + (x.gov || []).map(pill).join(' ') + '</td><td>' + x.score + ' Punkte · ' + esc(x.rating) + '</td></tr>').join('') +
        '</tbody></table><p class="muted small">* vorzeitig beendet</p>';
    }
    if ((C.leaders || []).length) {
      const yr = T.cal(term()).year;
      html += '<h3>Eure Spitzenleute</h3><ul class="t-leaders">' + C.leaders.map(l => '<li><b>' + esc(l.name) + '</b> ' + (l.born ? '(Jahrgang ' + l.born + (l.to ? '' : ', heute ' + (yr - l.born)) + ')' : '') +
        ' · ' + l.from + '–' + (l.to || 'heute') + (l.how ? ' · ' + esc(l.how) : '') + (l.offices && l.offices.length ? '<br><span class="small muted">' + l.offices.map(o => o.year + ': ' + esc(o.office)).join(' · ') + '</span>' : '') + '</li>').join('') + '</ul>' +
        '<p class="muted small">Ab ' + (T.MAX_AGE - 5) + ' Jahren fragt die Partei nach Nachfolge, mit ' + T.MAX_AGE + ' ist Schluss.</p>';
    }
    if (!(C.terms || []).length) html += '<p class="muted">Die erste Legislatur läuft noch. Nach ihrem Ende erscheinen hier Bilanz und Verlauf.</p>';
    $('t-laufbahn').innerHTML = html;
  }

  // ---------- Steuerung ----------
  document.querySelectorAll('#term-nav .game-tab').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); window.scrollTo({ top: 0, behavior: 'instant' }); }));
  $('btn-end-quarter').addEventListener('click', () => {
    const t = term();
    if (t.over) { showSummary(); return; }
    if (t.pending.length) { checkPending(); return; }
    const btn = $('btn-end-quarter');
    if (t.ap > 0 && !U.confirmOnButton(btn, 'Noch ' + t.ap + ' Aktion' + (t.ap > 1 ? 'en' : '') + ' übrig – trotzdem beenden?')) return;
    if (t.budget.draft && !t.budget.draft.done && T.playerDraftsBudget(g) && (T.cal(t).qn === 3 || t.budget.status === 'vorlaeufig') && btn.dataset.budget !== '1') {
      btn.dataset.budget = '1';
      U.toast('Euer Haushaltsentwurf fehlt – sonst übernimmt das Finanzministerium. Nochmal tippen zum Beenden.');
      tab = 'haushalt';
      render();
      setTimeout(() => { btn.dataset.budget = ''; }, 6000);
      return;
    }
    btn.dataset.budget = '';
    const before = g.poll.nat[g.party];
    const res = T.endQuarter(g);
    if (!res.ok) { U.toast(res.text); return; }
    save();
    budgetPlan = null;
    render();
    const lastFx = (t.pollFxHist || []).slice(-1)[0];
    const topFx = lastFx ? fxRows(lastFx.fx).filter(c => c !== 'verblassen')[0] : null;
    if (!t.over) U.toast(T.quarterLabel(t) + ' · Neue Umfrage: ' + pct(g.poll.nat[g.party]) + ' (' + signed(g.poll.nat[g.party] - before) + ')' +
      (topFx ? ' · größter Einfluss: ' + (T.FX_NAMES[topFx] || topFx).replace(/^\S+ /, '') + ' ' + signed(lastFx.fx[topFx]) : ''));
    checkPending();
  });
  let resizeT = null;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if (g && !$('screen-term').hidden && tab === 'umfragen') drawTermChart(); }, 150); });

  window.BTW_TERMUI = { start };
})();
