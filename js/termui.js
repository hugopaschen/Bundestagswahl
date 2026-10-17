/* Oberfläche der Legislaturperiode: regieren, mitregieren, opponieren – oder außerparlamentarisch kämpfen. */
(function () {
  const D = window.BTW_DATA;
  const E = window.BTW_ENGINE;
  const T = window.BTW_TERM;
  const TD = window.BTW_TERMDATA;
  const U = window.BTW_UI;
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
  const STAGES = [['kabinett', 'Kabinett'], ['bundestag', 'Bundestag'], ['bundesrat', 'Bundesrat'], ['inkraft', 'In Kraft']];
  const STAGE_NAME = { kabinett: 'Kabinett', kabinett_wait: 'Kabinett', veto: 'Veto im Kabinett', bundestag: 'Bundestag', bundesrat: 'Bundesrat',
    vermittlung: 'Vermittlungsausschuss', inkraft: 'In Kraft', gescheitert: 'Gescheitert', zurueckgezogen: 'Zurückgezogen', aufgehoben: 'Von Karlsruhe aufgehoben' };

  let g = null;
  let tab = 'lage';
  let lawTopic = null;   // ausgewähltes Thema im Gesetzentwurf
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
    $('t-leader').textContent = t.party.leader.name + (t.role === 'kanzler' ? ' · Bundeskanzler:in' : t.role === 'junior' ? ' · Vizekanzler:in' : '');
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
    $('t-news-badge').hidden = !n || tab === 'news';
    $('t-news-badge').textContent = n;
    const nb = $('t-cab-badge');
    nb.hidden = !T.needsNames(g);
    const bb = $('t-budget-badge');
    bb.hidden = !(t.budget.draft && !t.budget.draft.done && T.playerDraftsBudget(g));
  }

  function render() {
    renderTop();
    document.querySelectorAll('#term-nav .game-tab').forEach(b => b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false'));
    document.querySelectorAll('#screen-term .term-layout > .card').forEach(c => { c.hidden = c.dataset.tab !== tab; });
    ({ lage: renderLage, gesetze: renderLaws, haushalt: renderBudget, kabinett: renderCabinet, parlament: renderParliament, partei: renderParty, umfragen: renderPolls, news: renderNews })[tab]();
  }

  // ---------- Lage ----------
  function kpi(label, value, sub, cls) {
    return '<div class="t-kpi ' + (cls || '') + '"><span class="t-kpi-label">' + label + '</span><span class="t-kpi-val">' + value + '</span>' + (sub ? '<span class="t-kpi-sub">' + sub + '</span>' : '') + '</div>';
  }
  function renderLage() {
    const t = term();
    const e = t.econ;
    const b = T.budgetCalc(t);
    const role = TD.ROLES[t.role];
    let html = '<h2>' + role.icon + ' ' + esc(role.name) + '</h2><p class="lead-s">' + esc(role.desc) + '</p>';
    if (t.over) html += '<div class="t-over"><p><strong>Die Legislaturperiode ist vorbei.</strong> ' + esc(t.early || '') + '</p><button type="button" class="btn primary" id="t-show-summary">Bilanz und nächster Wahlkampf</button></div>';
    html += '<div class="t-kpis">' +
      kpi('Umfrage ' + esc(short(g.party)), pct(g.poll.nat[g.party]), signed(g.poll.nat[g.party] - t.share0) + ' seit der Wahl') +
      (T.isGov(t.role) && t.gov.length > 1 ? kpi('Koalitionsklima', Math.round(t.mood) + '/100', bar(t.mood, 100, t.mood < 30 ? 'bad' : t.mood < 50 ? 'mid' : 'good')) : '') +
      kpi('Geschlossenheit', Math.round(t.party.unity) + '/100', bar(t.party.unity, 100, t.party.unity < 40 ? 'bad' : 'good')) +
      kpi('Beliebtheit der Spitze', (t.party.leader.like >= 0 ? '+' : '−') + num1(Math.abs(t.party.leader.like)), esc(t.party.leader.name)) +
      (T.isGov(t.role) ? kpi('Ansehen in der Welt', Math.round(t.intl) + '/100', bar(t.intl, 100)) : '') +
      '</div>';
    html += '<h3>📈 Wirtschaft</h3><div class="t-kpis">' +
      kpi('Wachstum', (e.growth >= 0 ? '+' : '−') + num1(Math.abs(e.growth)) + ' %', 'BIP real, aufs Jahr gerechnet', e.growth < 0 ? 'neg' : '') +
      kpi('Arbeitslosigkeit', num1(e.unemp) + ' %', signed(e.unemp - TD.ECON0.unemp) + ' seit Start', e.unemp > TD.ECON0.unemp + 0.5 ? 'neg' : '') +
      kpi('Inflation', num1(e.infl) + ' %', 'Ziel der EZB: 2 %', e.infl > 3 ? 'neg' : '') +
      kpi('Schuldenquote', num1(e.debt) + ' %', 'des BIP') +
      kpi('Haushalt', (b.gap > 0 ? '−' : '+') + mrd(Math.abs(b.gap)), b.gap > 0 ? 'über der Schuldenbremse' : 'Spielraum unter der Schuldenbremse', b.gap > 0 ? 'neg' : '') +
      '</div>';
    // Termine
    const cal = T.calendar(g, 6);
    html += '<h3>📅 Termine</h3><ul class="t-cal">' + cal.map(c => '<li><span class="t-cal-q">' + esc(c.label) + '</span>' + esc(c.text) +
      (c.kind === 'ltw' ? ' · regiert von ' + t.laender[c.land].gov.map(short).join('-') : '') + '</li>').join('') + '</ul>';
    // Aktionen
    html += '<h3>🎯 Eure Aktionen in diesem Quartal <span class="muted small">(' + t.ap + ' von ' + t.apMax + ' übrig)</span></h3><div class="action-list t-actions">';
    T.ACTIONS.filter(a => a.roles.indexOf(t.role) !== -1).forEach(a => {
      const chk = T.canAct(g, a.id);
      const cost = T.actionCash(g, a.id);
      html += '<button type="button" class="action" data-a="' + a.id + '"' + (chk.ok ? '' : ' disabled title="' + esc(chk.text) + '"') + '>' +
        '<span class="aname">' + a.icon + ' ' + esc(a.name) + '</span><span class="adesc">' + esc(a.desc) + '</span>' +
        (!chk.ok && chk.text ? '<span class="ahint">' + esc(chk.text) + '</span>' : '') +
        '<span class="ameta">' + (a.ap === 0 ? 'keine Aktion' : '1 Aktion') + (cost ? ' · ' + mio(cost) : '') + '</span></button>';
    });
    html += '</div><p class="t-feedback" id="t-feedback"></p>';
    // Koalitionsvertrag
    if (T.isGov(t.role) && t.gov.length > 1) {
      const open = Object.keys(t.contract).filter(tp => t.contract[tp] !== t.policy[tp]);
      html += '<h3>📜 Koalitionsvertrag</h3><p class="muted small">Noch offen: ' + open.length + ' von ' + Object.keys(t.contract).length + ' Vorhaben. Gesetze aus dem Vertrag tragen die Partner mit.</p><ul class="t-contract">' +
        open.slice(0, 8).map(tp => '<li>' + E.topicById(tp).icon + ' ' + esc(D.PROGRAM[tp][t.contract[tp]].label) + '</li>').join('') + '</ul>';
    }
    $('t-lage').innerHTML = html;
    $('t-lage').querySelectorAll('.action[data-a]').forEach(btn => btn.addEventListener('click', () => onAction(btn.dataset.a, btn)));
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
    const run = target => {
      const res = T.performAction(g, id, target);
      U.closeModal();
      save();
      render();
      feedback(res.text);
      checkPending();
    };
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
    }
    U.openModal(T.quarterLabel(t), a.icon + ' ' + a.name, '<p>' + esc(a.desc) + '</p>', opts.map(o => ({ label: o.label, hint: o.hint, onClick: () => run(o.v) }))
      .concat([{ label: 'Abbrechen', onClick: U.closeModal }]));
  }

  // ---------- Gesetzgebung ----------
  function stageChips(l) {
    const idx = { kabinett: 0, kabinett_wait: 0, veto: 0, bundestag: 1, bundesrat: 2, vermittlung: 2, inkraft: 3 }[l.stage];
    const failed = ['gescheitert', 'zurueckgezogen', 'aufgehoben'].indexOf(l.stage) !== -1;
    return '<div class="t-stages">' + STAGES.filter(s => s[0] !== 'bundesrat' || l.zust).map((s, i) => {
      const k = STAGES.findIndex(x => x[0] === s[0]);
      const cls = failed ? 'off' : k < idx ? 'done' : k === idx ? 'now' : '';
      return '<span class="t-stage ' + cls + '">' + s[1] + '</span>';
    }).join('<i>›</i>') + (failed ? '<span class="t-stage fail">' + STAGE_NAME[l.stage] + '</span>' : '') + '</div>';
  }
  function voteBar(v) {
    const total = v.yes + v.no + (v.abst || 0);
    return '<div class="t-vote"><i class="yes" style="width:' + v.yes / total * 100 + '%"></i><i class="abst" style="width:' + (v.abst || 0) / total * 100 + '%"></i><i class="no" style="width:' + v.no / total * 100 + '%"></i></div>' +
      '<span class="small">' + v.yes + ' Ja · ' + v.no + ' Nein' + (v.abst ? ' · ' + v.abst + ' Enthaltungen' : '') + '</span>';
  }
  function lawCard(l) {
    const t = term();
    let html = '<div class="t-law ' + l.stage + '"><div class="t-law-head"><strong>' + esc(T.lawTitle(l)) + '</strong>' + pill(l.by) +
      (l.contract ? '<span class="t-tag">Koalitionsvertrag</span>' : '') + (l.zust ? '<span class="t-tag">zustimmungspflichtig</span>' : '') + (l.promise ? '<span class="t-tag good">Wahlversprechen</span>' : '') + '</div>' + stageChips(l);
    if (l.stage === 'bundestag') {
      const p = T.predict(g, l).bt;
      html += '<p class="small">Prognose Bundestag:</p>' + voteBar(p) + (p.afdDecisive ? '<p class="small warn">⚠️ Mehrheit nur mit Stimmen der AfD</p>' : '') + (l.disc ? '<p class="small">📣 Fraktion auf Linie gebracht</p>' : '');
    }
    if (l.stage === 'bundesrat' || (l.zust && ['kabinett', 'bundestag'].indexOf(l.stage) !== -1)) {
      const br = T.bundesratVote(g, l);
      html += '<p class="small">Prognose Bundesrat: <b>' + br.yes + '</b> von 69 Stimmen (nötig: ' + TD.BUNDESRAT_MAJ + ')' + (l.bought && l.bought.length ? ' · Zusagen an ' + l.bought.join(', ') : '') + '</p>';
    }
    if (l.log.length) html += '<details><summary class="small">Verlauf</summary><ul class="small">' + l.log.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></details>';
    return html + '</div>';
  }
  function renderLaws() {
    const t = term();
    let html = '<h2>📜 Gesetzgebung</h2>';
    const active = t.laws.filter(l => ['kabinett', 'kabinett_wait', 'veto', 'bundestag', 'bundesrat', 'vermittlung'].indexOf(l.stage) !== -1);
    html += '<p class="muted small">Ein Gesetz geht durch das Kabinett, den Bundestag (Mehrheit der abgegebenen Stimmen) und – wenn es zustimmungspflichtig ist – den Bundesrat (35 von 69 Stimmen; ein Land stimmt nur zu, wenn alle Regierungsparteien dort einverstanden sind). Jede Stufe dauert ein Quartal.</p>';
    html += renderSq();
    html += '<h3>In Arbeit</h3>' + (active.length ? active.map(lawCard).join('') : '<p class="muted">Gerade liegt nichts an.</p>');
    if (T.isGov(t.role)) html += renderDraft();
    else html += '<p class="muted small">' + (t.role === 'opposition' ? 'Als Opposition stimmt ihr im Bundestag mit ab und könnt Gesetze in Karlsruhe prüfen lassen (Normenkontrollklage).' : 'Ohne Sitze im Bundestag schaut ihr zu – aber auf der Straße und in den Ländern könnt ihr Druck machen.') + '</p>';
    const done = t.laws.filter(l => active.indexOf(l) === -1).slice().reverse();
    if (done.length) html += '<h3>Abgeschlossen</h3>' + done.map(lawCard).join('');
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
    let html = '<h3>⚖️ Status quo unter Druck</h3><p class="muted small">Was heute gilt, hat Rückhalt. Die Ränder greifen ihn an, die Mitte verteidigt ihn. Unter 40 gewinnen die Angreifer an Zustimmung, unter 15 kippt die Lage und die Regierung muss reagieren. Ein starker Status quo macht Gesetze, die ihn ändern, schwerer – ein schwacher leichter.</p><div class="t-sq">';
    (sqAll ? rows : rows.slice(0, 6)).forEach(r => {
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
    box.querySelectorAll('.t-draft').forEach(b => b.addEventListener('click', () => {
      const target = b.dataset.tax ? { tax: b.dataset.tax, level: Number(b.dataset.lv) } : { topic: b.dataset.topic, opt: Number(b.dataset.opt) };
      const res = T.performAction(g, 'gesetz', target);
      save();
      lawTopic = null;
      render();
      U.toast(res.text);
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
      html += '<div class="t-callout">✍️ Benennt eure Ministerinnen und Minister. Jeder Typ hat Stärken: Fachleute sind kompetent, Parteisoldaten loyal, Landesfürsten beruhigen ihren Landesverband, Quereinsteiger bringen frischen Wind – und Risiken.</div>';
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
    html += '</div><div><h3>Bundesrat (69 Stimmen)</h3><table class="t-br"><tbody>';
    let fedGov = 0;
    Object.keys(t.laender).sort((a, b) => t.laender[b].votes - t.laender[a].votes).forEach(l => {
      const L = t.laender[l];
      const aligned = L.gov.every(p => t.gov.indexOf(p) !== -1);
      if (aligned) fedGov += L.votes;
      html += '<tr class="' + (aligned ? 'aligned' : '') + '"><td>' + esc(E.stateById(l).name) + '</td><td class="num">' + L.votes + '</td><td>' + L.gov.map(pill).join(' ') + '</td></tr>';
    });
    html += '</tbody></table><p class="small">Länder nur mit Bundesregierungsparteien: <b>' + fedGov + '</b> von 69 Stimmen (nötig für zustimmungspflichtige Gesetze: ' + TD.BUNDESRAT_MAJ + ').</p></div></div>';
    if (t.ltwLog.length) {
      html += '<h3>Landtagswahlen in dieser Legislaturperiode</h3><ul class="t-ltw">' + t.ltwLog.slice().reverse().map(x => '<li><b>' + esc(E.stateById(x.land).name) + '</b> (' + esc(T.quarterLabel(t, x.q)) + '): ' +
        esc(short(g.party)) + ' ' + pct(x.shares[g.party]) + ' (' + signed(x.diff) + ') · Regierung: ' + x.gov.map(pill).join(' ') + '</li>').join('') + '</ul>';
    }
    $('t-parlament').innerHTML = html;
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
    html += '<h3>Landesverbände</h3><p class="muted small">Unruhe in den Landesverbänden: Ab 50 kostet sie im Land Stimmen und macht Konflikte mit der Bundespartei wahrscheinlicher.</p><div class="t-lv">';
    D.STATES.slice().sort((a, b) => P.lv[b.id] - P.lv[a.id]).forEach(st => {
      const u = P.lv[st.id];
      html += '<div class="t-lv-row"><span>' + esc(st.name) + '</span>' + bar(u, 100, u > 60 ? 'bad' : u > 40 ? 'mid' : 'good') + '<span class="num">' + Math.round(u) + '</span></div>';
    });
    html += '</div>';
    const career = (g.career && g.career.terms) || [];
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
    $('t-umfragen').innerHTML = html;
    drawTermChart();
  }
  function drawTermChart() {
    const t = term();
    const box = $('t-chart');
    const W = Math.max(300, Math.round(box.clientWidth || 600));
    const H = Math.round(Math.min(280, Math.max(180, W * 0.4)));
    const L = 28; const R = 10; const Tp = 8; const B = 22;
    const hist = t.history;
    const ids = MAIN.concat((D.MINORS || []).map(m => m.id).filter(m => E.isShown(g, m)));
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
    $('t-news').innerHTML = '<h2>📰 Nachrichten</h2><ul class="news">' + t.news.map(n => '<li class="t-n-' + n.kind + '"><span class="wk">' + esc(T.quarterLabel(t, Math.min(n.q, T.QUARTERS - 1)).replace('. Quartal ', '/')) + '</span><span>' + esc(n.text) + '</span></li>').join('') + '</ul>';
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
      U.openModal(eyebrow + ' · ' + cat, T.fillText(g, it, ev.title), '<p>' + esc(T.fillText(g, it, ev.text)) + '</p>',
        T.eventChoices(g, ev).map((c, i) => ({ label: c.label, hint: (c.hint || '') + (c.chance !== undefined ? ' · Erfolgsaussicht ca. ' + Math.round(c.chance * 100) + ' %' : '') + (c.mandate ? ' · Abstimmung im Bundestag' : ''), onClick: () => choose(i) })));
    } else if (it.type === 'scandal') {
      U.openModal(eyebrow + ' · 🔥 Affäre', 'Affäre im ' + T.ministryById(it.ministry).short + '-Ministerium', '<p>' + esc(it.text) + '</p>',
        [{ label: 'Festhalten', hint: 'Riskant: Kommt mehr heraus, wird es teuer', onClick: () => choose(0) }, { label: 'Rücktritt nahelegen', hint: 'Ihr benennt eine Nachfolge', onClick: () => choose(1) }]);
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
    const body = '<div class="score">' + s.score + '</div><p class="muted small">Punkte</p>' +
      '<ul class="t-sum"><li>Umfrage zum Schluss: <b>' + pct(s.share) + '</b> (' + signed(s.delta) + ' seit der Wahl)</li>' +
      '<li>Gesetze in Kraft: ' + s.lawsTotal + ', davon von euch eingebracht: ' + s.lawsOwn + ', Wahlversprechen umgesetzt: ' + s.promises + '</li>' +
      '<li>Haushalte beschlossen: ' + s.budgets + ' · Affären: ' + s.scandals + '</li>' +
      '<li>Landtagswahlen: ' + s.ltw + (s.ltwGov ? ', danach in ' + s.ltwGov + ' Ländern mitregiert' : '') + '</li>' +
      '<li>Wirtschaft: Wachstum ' + num1(s.growth) + ' %, Arbeitslosigkeit ' + num1(s.unemp) + ' %, Schuldenquote ' + num1(s.debt) + ' %</li></ul>' +
      (t.early ? '<p class="fw-note">' + esc(t.early) + '</p>' : '') + '<p>Jetzt beginnt der Wahlkampf – mit dem Stand von heute in allen Ländern.</p>';
    U.openModal('Bilanz der ' + t.n + '. Legislaturperiode', s.rating, body, [
      { label: 'Zum nächsten Wahlkampf', primary: true, hint: 'Programmparteitag und acht Wochen Wahlkampf', onClick: () => { U.closeModal(); U.startNextCampaign(T.nextCampaign(g)); } },
      { label: 'Noch einmal umsehen', onClick: U.closeModal }
    ]);
  }

  // ---------- Steuerung ----------
  document.querySelectorAll('#term-nav .game-tab').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); window.scrollTo({ top: 0, behavior: 'instant' }); }));
  $('btn-end-quarter').addEventListener('click', () => {
    const t = term();
    if (t.over) { showSummary(); return; }
    if (t.pending.length) { checkPending(); return; }
    const btn = $('btn-end-quarter');
    if (t.ap > 0 && !U.confirmOnButton(btn, 'Noch ' + t.ap + ' Aktion' + (t.ap > 1 ? 'en' : '') + ' übrig – trotzdem beenden?')) return;
    if (t.budget.draft && !t.budget.draft.done && T.playerDraftsBudget(g) && T.cal(t).qn === 3 && btn.dataset.budget !== '1') {
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
    if (!t.over) U.toast(T.quarterLabel(t) + ' · Neue Umfrage: ' + pct(g.poll.nat[g.party]) + ' (' + signed(g.poll.nat[g.party] - before) + ')');
    checkPending();
  });
  let resizeT = null;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if (g && !$('screen-term').hidden && tab === 'umfragen') drawTermChart(); }, 150); });

  window.BTW_TERMUI = { start };
})();
