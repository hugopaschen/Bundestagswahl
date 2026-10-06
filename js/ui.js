/* Oberfläche: verbindet die Spiel-Engine mit dem DOM. */
(function () {
  // Muss zur data-version in index.html passen (wird von tools/bump-version.js gesetzt).
  // Passen Seite und Skript nicht zusammen (alte Datei aus dem Browser-Cache), einmal neu laden.
  const APP_VERSION = '20261006-190845';
  if (document.documentElement.dataset.version !== APP_VERSION) {
    let reloaded = false;
    try { reloaded = sessionStorage.getItem('btw-version-reload') === APP_VERSION; } catch (e) { /* ignorieren */ }
    if (!reloaded) {
      try { sessionStorage.setItem('btw-version-reload', APP_VERSION); } catch (e) { /* ignorieren */ }
      location.reload();
      return;
    }
  }

  const D = window.BTW_DATA;
  const E = window.BTW_ENGINE;
  const SAVE_KEY = 'btw-wahlkampf-save';

  const $ = id => document.getElementById(id);
  const col = p => 'var(--c-' + p + ')';
  const onCol = p => 'var(--on-' + p + ')';
  const num1 = x => x.toFixed(1).replace('.', ',');
  const pct = x => num1(x) + ' %';
  const signed = x => (x >= 0 ? '+' : '−') + num1(Math.abs(x));
  const money = x => num1(x) + ' Mio. €';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ALL_IDS = D.PARTIES.map(p => p.id).concat([D.OTHER.id]);
  const SPECTRUM = ['linke', 'gruene', 'spd', 'bsw', 'fdp', 'union', 'afd'];
  const short = p => (p === D.OTHER.id ? D.OTHER.short : E.party(p).short);

  const QUESTIONS = {
    wirtschaft: 'Die Wirtschaft schwächelt. Wie wollen Sie Arbeitsplätze sichern?',
    migration: 'Wie wollen Sie Migration steuern und Integration verbessern?',
    soziales: 'Viele Menschen haben Angst vor Altersarmut. Was ist Ihr Plan für die Rente?',
    klima: 'Wie erreichen wir die Klimaziele, ohne die Menschen zu überfordern?',
    sicherheit: 'Viele fühlen sich nicht mehr sicher. Was tun Sie dagegen?',
    bildung: 'Unsere Schulen fallen zurück. Was wollen Sie ändern?',
    digitales: 'Warum ist Deutschland bei der Digitalisierung so langsam?',
    wohnen: 'Viele finden keine bezahlbare Wohnung mehr. Was tun Sie gegen steigende Mieten?'
  };

  let g = null;
  let chosenParty = null;
  let selState = 'NW';
  let selTopic = null;
  let toastTimer = null;
  let draft = null; // Wahlprogramm in Bearbeitung

  // ---------- Speichern ----------

  function save() {
    try { localStorage.setItem(SAVE_KEY, E.serialize(g)); } catch (e) { /* Speichern optional */ }
  }
  function loadSave() {
    try {
      const s = localStorage.getItem(SAVE_KEY);
      return s ? E.deserialize(s) : null;
    } catch (e) { return null; }
  }
  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignorieren */ }
  }

  function show(screen) {
    ['intro', 'name', 'start', 'program', 'game', 'election'].forEach(s => { $('screen-' + s).hidden = s !== screen; });
    // Die Programm-Website färbt den ganzen Seitenhintergrund in der Papierfarbe der Partei.
    // Seiten, die randlos über die ganze Breite gehen, färben auch den Seitenhintergrund ein.
    if (screen === 'start') document.body.style.background = '#f4f4f1';
    else if (screen !== 'program') document.body.style.background = '';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function toast(text) {
    const t = $('toast');
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3500);
  }

  // ---------- Startbildschirm ----------

  // Ein handgezeichnetes Kreuz für Stimmzettel (Kugelschreiber-Optik).
  const PEN_X = '<svg class="pen-x" viewBox="0 0 40 40" aria-hidden="true">' +
    '<path d="M7 9 C 15 16, 24 25, 34 33" /><path d="M33 7 C 24 15, 15 25, 6 34" /></svg>';

  function candidateName() {
    return String($('candidate').value || '').trim() || DEFAULT_CANDIDATE;
  }

  function renderStart() {
    const list = $('party-list');
    list.innerHTML = '';
    const start = E.newGame('union', '', 1).startShares;
    D.PARTIES.forEach((p, i) => {
      const strengths = D.TOPICS.slice().sort((a, b) => p.competence[b.id] - p.competence[a.id]).slice(0, 2);
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'ballot-row';
      row.setAttribute('role', 'radio');
      row.setAttribute('aria-checked', String(p.id === chosenParty));
      row.style.setProperty('--pc', col(p.id));
      row.setAttribute('aria-label', (i + 1) + '. ' + p.fullName + ' (' + p.ballot + ')');
      row.innerHTML =
        // linke, schwarze Spalte: Parteiprofil (Aufbau wie die Erststimmen-Spalte)
        '<span class="b-left">' +
          '<span class="b-num">' + (i + 1) + '</span>' +
          '<span class="b-profile">' +
            '<span class="b-lead">Umfrage ' + pct(start[p.id]) + '</span>' +
            '<span class="b-small">Wahlkampfkasse ' + p.budget + ' Mio. €<br>Stärken: ' + strengths.map(t => esc(t.name)).join(', ') + '</span>' +
            '<span class="b-small"><b>Ziel:</b> ' + esc(p.goalText) + '</span>' +
          '</span>' +
          '<span class="b-lshort">' + esc(p.ballot).replace('/', '/<wbr>') + '</span>' +
          '<span class="b-lfull">' + esc(p.fullName) + '</span>' +
        '</span>' +
        // rechte, blaue Spalte: Zweitstimme
        '<span class="b-right">' +
          '<span class="b-circle"><span class="b-ring">' + PEN_X + '</span></span>' +
          '<span class="b-short">' + esc(p.ballot).replace('/', '/<wbr>') + '</span>' +
          '<span class="b-rtext"><span class="b-full">' + esc(p.fullName) + '</span>' +
            '<span class="b-desc">' + esc(p.desc) + '</span></span>' +
          '<span class="b-rnum">' + (i + 1) + '</span>' +
        '</span>';
      row.addEventListener('click', () => {
        chosenParty = p.id;
        list.querySelectorAll('.ballot-row').forEach(b => b.setAttribute('aria-checked', String(b === row)));
        $('btn-start').disabled = false;
      });
      list.appendChild(row);
    });
    $('ballot-candidate').textContent = candidateName();
    $('btn-start').disabled = !chosenParty;
    $('btn-intro-resume').hidden = !loadSave();
  }

  function updateSignature() {
    const name = String($('candidate').value || '').trim();
    $('sign-name').textContent = name;
  }


  // ---------- Spielbildschirm ----------

  function renderGame() {
    const shares = E.nationalShares(g);
    const me = g.party;
    const p = E.party(me);

    const badge = $('party-badge');
    badge.textContent = p.short;
    badge.style.setProperty('--pc', col(me));
    badge.style.setProperty('--pon', onCol(me));
    $('candidate-name').textContent = g.candidate;
    $('party-goal').textContent = '„' + g.program.slogan + '“ · Ziel: ' + p.goalText;
    $('stat-week').textContent = g.week + ' / ' + g.maxWeeks;
    $('stat-money').textContent = money(g.money);
    $('stat-ap').textContent = '●'.repeat(g.ap) + '○'.repeat(g.apMax - g.ap);
    $('stat-ap').setAttribute('aria-label', g.ap + ' von ' + g.apMax + ' Aktionen übrig');
    const diff = shares[me] - g.startShares[me];
    $('stat-poll').innerHTML = pct(shares[me]) + ' <span class="small ' + (diff >= 0 ? 'pos' : 'neg') + '">' + signed(diff) + '</span>';
    $('week-bar').style.width = ((g.week - 1) / g.maxWeeks * 100) + '%';
    $('btn-end-week').textContent = g.week >= g.maxWeeks ? 'Zur Wahl! 🗳️' : 'Woche beenden';
    $('btn-end-week').disabled = !!(g.pendingEvent || g.duel || (g.week === E.DUEL_WEEK && !g.duelDone));

    renderMap();
    renderStateDetail();
    renderTopics();
    renderMoneyHint();
    renderActions();
    renderPollBars(shares);
    renderChart();
    renderAgenda();
    renderNews();
    renderProgramView();
  }

  function renderMap() {
    const size = 72;
    const gap = 4;
    const cols = 5;
    const rows = 5;
    let svg = '<svg viewBox="0 0 ' + (cols * size) + ' ' + (rows * size) + '" role="group" aria-label="Kachelkarte der Bundesländer">';
    D.STATES.forEach(st => {
      const s = E.stateShares(g, st.id);
      const lead = E.leader(s);
      const x = st.x * size + gap / 2;
      const y = st.y * size + gap / 2;
      const w = size - gap;
      const sel = st.id === selState ? ' selected' : '';
      svg += '<g class="tile' + sel + '" data-state="' + st.id + '" tabindex="0" role="button" aria-pressed="' + (st.id === selState) + '" ' +
        'aria-label="' + esc(st.name) + ': ' + E.party(lead).short + ' vorn, ihr ' + pct(s[g.party]) + '">' +
        '<title>' + esc(st.name) + ' – ' + E.party(lead).short + ' vorn</title>' +
        '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + w + '" rx="10" style="fill:' + col(lead) + '"></rect>' +
        '<text x="' + (x + w / 2) + '" y="' + (y + 28) + '" text-anchor="middle" font-size="17" style="fill:' + onCol(lead) + '">' + st.id + '</text>' +
        '<text x="' + (x + w / 2) + '" y="' + (y + 50) + '" text-anchor="middle" font-size="13" style="fill:' + onCol(lead) + '">' + num1(s[g.party]) + '</text>' +
        '</g>';
    });
    svg += '</svg>';
    const map = $('map');
    map.innerHTML = svg;
    map.querySelectorAll('.tile').forEach(t => {
      const choose = () => { selState = t.dataset.state; renderGame(); };
      t.addEventListener('click', choose);
      t.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); } });
    });
  }

  function renderStateDetail() {
    const st = E.stateById(selState);
    const s = E.stateShares(g, st.id);
    const ids = ALL_IDS.slice().sort((a, b) => s[b] - s[a]);
    const max = Math.max.apply(null, ids.map(p => s[p]));
    let html = '<h3>' + esc(st.name) + ' <span class="muted small">· ' + num1(st.voters) + ' Mio. Wahlberechtigte</span></h3><div class="mini-bars">';
    ids.forEach(p => {
      html += '<span' + (p === g.party ? ' style="font-weight:700"' : '') + '>' + short(p) + '</span>' +
        '<div class="bar" style="width:' + (s[p] / max * 100) + '%;background:' + col(p) + '"></div>' +
        '<span class="num">' + pct(s[p]) + '</span>';
    });
    $('state-detail').innerHTML = html + '</div>';
    $('target-state').textContent = st.name;
  }

  function renderTopics() {
    const comp = E.competenceOf(g, g.party);
    const list = $('topic-list');
    list.innerHTML = '';
    D.TOPICS.forEach(t => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.setAttribute('aria-pressed', String(t.id === selTopic));
      b.textContent = t.icon + ' ' + t.name + (comp[t.id] >= 60 ? ' ★' : '') + (E.isCore(g, t.id) ? ' 🎯' : '');
      b.title = 'Kompetenz deiner Partei: ' + comp[t.id] + '/100';
      b.addEventListener('click', () => { selTopic = t.id; renderGame(); });
      list.appendChild(b);
    });
  }

  function renderMoneyHint() {
    const w = E.moneyWarning(g);
    const box = $('money-hint');
    if (!w) { box.hidden = true; return; }
    box.innerHTML = '<span class="mh-icon" aria-hidden="true">💶</span><span>' +
      (w.lastWeek
        ? '<strong>Letzte Woche vor der Wahl: noch ' + money(w.money) + ' in der Kasse.</strong> Jetzt ausgeben – nicht ausgegebenes Geld verfällt am Wahltag.'
        : '<strong>Noch ' + money(w.money) + ' in der Kasse</strong> – nicht ausgegebenes Geld verfällt am Wahltag.') +
      ' Ein TV-Spot (' + money(w.tvCost) + ') wirkt bundesweit, am stärksten bei euren Kernthemen und Stärken.</span>';
    box.hidden = false;
  }

  function renderActions() {
    const list = $('action-list');
    list.innerHTML = '';
    E.ACTIONS.forEach(a => {
      const cost = E.actionCost(a.id, selState);
      let where = '';
      if (a.scope === 'region') where = 'in ' + selState;
      if (a.scope === 'topic') where = selTopic ? E.topicById(selTopic).name : 'Thema wählen';
      const disabled = !E.canAct(g) || (a.scope === 'topic' && !selTopic) || g.money + 1e-9 < cost;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'action';
      b.disabled = disabled;
      b.innerHTML = '<span class="aname">' + a.icon + ' ' + esc(a.name) + '</span>' +
        '<span class="adesc">' + esc(a.desc) + '</span>' +
        '<span class="ameta">' + (cost ? money(cost) : 'kostenlos') + (where ? ' · ' + esc(where) : '') + '</span>';
      b.addEventListener('click', () => {
        const res = E.performAction(g, a.id, { state: selState, topic: selTopic });
        $('feedback').textContent = res.text;
        save();
        renderGame();
      });
      list.appendChild(b);
    });
    const hint = 'Keine Aktionen mehr – Zeit, die Woche zu beenden.';
    const fb = $('feedback');
    if (g.phase === 'campaign' && g.ap === 0 && !fb.textContent.includes(hint)) {
      fb.textContent += (fb.textContent ? ' ' : '') + hint;
    }
  }

  function renderPollBars(shares) {
    const ids = ALL_IDS.slice().sort((a, b) => (a === D.OTHER.id) - (b === D.OTHER.id) || shares[b] - shares[a]);
    const scale = Math.max(35, Math.max.apply(null, ids.map(p => shares[p])) + 3);
    let html = '';
    ids.forEach(p => {
      const d = p === D.OTHER.id ? null : shares[p] - g.startShares[p];
      html += '<span class="label' + (p === g.party ? ' me' : '') + '">' + short(p) + '</span>' +
        '<div class="track"><div class="bar" style="width:' + (shares[p] / scale * 100) + '%;background:' + col(p) + '"></div>' +
        '<div class="hurdle" style="left:' + (5 / scale * 100) + '%" title="5-%-Hürde"></div></div>' +
        '<span class="num">' + pct(shares[p]) + '</span>' +
        '<span class="diff ' + (d === null ? '' : d >= 0 ? 'pos' : 'neg') + '">' + (d === null ? '' : signed(d)) + '</span>';
    });
    $('poll-bars').innerHTML = html;
  }

  function renderChart() {
    // Breite an den Platz anpassen, damit Beschriftungen bei Vollbild nicht mitwachsen.
    const W = Math.max(300, Math.round($('poll-chart').clientWidth || 320));
    const H = Math.round(Math.min(260, Math.max(170, W * 0.42)));
    const L = 26;
    const R = 8;
    const T = 8;
    const B = 20;
    const hist = g.history;
    const ids = D.PARTIES.map(p => p.id);
    let maxV = 0;
    hist.forEach(h => ids.forEach(p => { maxV = Math.max(maxV, h.shares[p]); }));
    const yMax = Math.ceil((maxV + 2) / 10) * 10;
    const x = i => L + (W - L - R) * i / g.maxWeeks;
    const y = v => T + (H - T - B) * (1 - v / yMax);

    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Umfrageverlauf nach Wochen"><g class="grid">';
    for (let v = 0; v <= yMax; v += 10) svg += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"></line>';
    svg += '</g><g class="axis">';
    for (let v = 0; v <= yMax; v += 10) svg += '<text x="' + (L - 5) + '" y="' + (y(v) + 3) + '" text-anchor="end">' + v + '</text>';
    for (let i = 0; i <= g.maxWeeks; i++) svg += '<text x="' + x(i) + '" y="' + (H - 5) + '" text-anchor="middle">' + (i === 0 ? 'Start' : i) + '</text>';
    svg += '</g>';
    ids.slice().sort((a, b) => (a === g.party) - (b === g.party)).forEach(p => {
      const pts = hist.map((h, i) => x(i) + ',' + y(h.shares[p])).join(' ');
      svg += '<polyline class="series' + (p === g.party ? ' me' : '') + '" points="' + pts + '" style="stroke:' + col(p) + '"></polyline>';
    });
    svg += '<line class="crosshair" y1="' + T + '" y2="' + (H - B) + '" x1="0" x2="0" visibility="hidden"></line>';
    svg += '<rect class="hit" x="' + L + '" y="0" width="' + (W - L - R) + '" height="' + H + '" fill="transparent"></rect></svg>';
    svg += '<div class="tooltip" hidden></div>';

    const box = $('poll-chart');
    box.innerHTML = svg;
    const svgEl = box.querySelector('svg');
    const cross = box.querySelector('.crosshair');
    const tip = box.querySelector('.tooltip');
    const hit = box.querySelector('.hit');
    const move = e => {
      const rect = svgEl.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width * W;
      const i = Math.max(0, Math.min(hist.length - 1, Math.round((px - L) / (W - L - R) * g.maxWeeks)));
      cross.setAttribute('x1', x(i));
      cross.setAttribute('x2', x(i));
      cross.setAttribute('visibility', 'visible');
      const sh = hist[i].shares;
      tip.innerHTML = '<strong>' + (i === 0 ? 'Start' : 'Woche ' + i) + '</strong><br>' +
        ids.slice().sort((a, b) => sh[b] - sh[a]).map(p => '<span class="sw" style="background:' + col(p) + '"></span>' + short(p) + ' ' + pct(sh[p])).join('<br>');
      tip.hidden = false;
      const left = x(i) / W * rect.width;
      tip.style.left = (left > rect.width / 2 ? left - tip.offsetWidth - 10 : left + 10) + 'px';
      tip.style.top = '4px';
    };
    hit.addEventListener('pointermove', move);
    hit.addEventListener('pointerdown', move);
    hit.addEventListener('pointerleave', () => { tip.hidden = true; cross.setAttribute('visibility', 'hidden'); });
  }

  function renderAgenda() {
    const comp = E.competenceOf(g, g.party);
    const ids = D.TOPICS.slice().sort((a, b) => g.salience[b.id] - g.salience[a.id]);
    const max = g.salience[ids[0].id];
    let html = '';
    ids.forEach(t => {
      html += '<span class="' + (comp[t.id] >= 60 ? 'strong' : '') + '">' + t.icon + ' ' + esc(t.name) + (comp[t.id] >= 60 ? ' ★' : '') + '</span>' +
        '<div class="track"><div class="fill" style="width:' + (g.salience[t.id] / max * 100) + '%"></div></div>' +
        '<span class="num">' + Math.round(g.salience[t.id] * 100) + ' %</span>';
    });
    $('agenda').innerHTML = html + '<span class="muted small" style="grid-column:1/-1">★ = Stärke deiner Partei. Mach deine Themen wichtiger!</span>';
  }

  function renderNews() {
    $('news').innerHTML = g.log.map(l =>
      '<li><span class="wk">Woche ' + l.week + '</span><span class="' + (l.type === 'event' || l.type === 'duel' ? 'event' : '') + '">' + esc(l.text) + '</span></li>'
    ).join('');
  }

  // ---------- Dialoge ----------

  function openModal(eyebrow, title, bodyHtml, actions) {
    $('modal-eyebrow').textContent = eyebrow;
    $('modal-title').textContent = title;
    $('modal-body').innerHTML = bodyHtml;
    const box = $('modal-actions');
    box.innerHTML = '';
    actions.forEach(a => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn choice' + (a.primary ? ' primary' : '');
      b.innerHTML = '<span>' + esc(a.label) + '</span>' + (a.hint ? '<span class="hint">' + esc(a.hint) + '</span>' : '');
      b.addEventListener('click', a.onClick);
      box.appendChild(b);
    });
    $('modal').hidden = false;
    const first = box.querySelector('button');
    if (first) first.focus();
  }

  function closeModal() { $('modal').hidden = true; }

  function checkPending() {
    if (g.phase !== 'campaign') { closeModal(); showElection(); return; }
    if (g.pendingEvent) { showEvent(); return; }
    if (g.week === E.DUEL_WEEK && !g.duelDone) {
      if (g.duel) showDuelRound(); else showDuelIntro();
      return;
    }
    closeModal();
  }

  function showEvent() {
    const ev = E.eventById(g.pendingEvent);
    openModal('Woche ' + g.week + ' · Eilmeldung', ev.title, '<p>' + esc(E.eventText(g, ev)) + '</p><p class="muted small">Wie reagiert ihr?</p>',
      ev.choices.map((c, i) => ({
        label: c.label,
        hint: c.hint,
        onClick: () => {
          const res = E.resolveEvent(g, i);
          save();
          renderGame();
          openModal('Woche ' + g.week + ' · ' + ev.title, 'Eure Reaktion: ' + c.label, '<p>' + esc(res.text) + '</p>',
            [{ label: 'Weiter', primary: true, onClick: () => { renderGame(); checkPending(); } }]);
        }
      })));
  }

  function showDuelIntro() {
    const topics = D.TOPICS.slice().sort((a, b) => g.salience[b.id] - g.salience[a.id]).slice(0, 3);
    openModal('Woche ' + g.week + ' · Live im Fernsehen', 'Die große Elefantenrunde',
      '<p>Eine Woche vor der Wahl treffen alle Spitzenkandidierenden im Fernsehstudio aufeinander. Millionen schauen zu.</p>' +
      '<p>Es wird um die wichtigsten Themen gehen: <strong>' + topics.map(t => esc(t.name)).join(', ') + '</strong>.</p>' +
      '<p class="muted small">Wähle für jede Frage deine Strategie. Sachliche Antworten gelingen bei deinen Stärken, Angriffe sind ein Glücksspiel.</p>',
      [{ label: 'Ab ins Studio', primary: true, onClick: () => { E.startDuel(g); save(); showDuelRound(); } }]);
  }

  function duelScoreHtml(results) {
    if (!results.length) return '';
    return '<div class="duel-score">' + results.map(r => '<span>' + esc(E.topicById(r.topic).name) + ': ' + signed(r.delta) + '</span>').join('') + '</div>';
  }

  function showDuelRound() {
    const d = g.duel;
    const topic = d.topics[d.round];
    openModal('Elefantenrunde · Frage ' + (d.round + 1) + ' von ' + d.topics.length, E.topicById(topic).icon + ' ' + E.topicById(topic).name,
      duelScoreHtml(d.results) + '<p class="duel-question">„' + esc(QUESTIONS[topic]) + '“</p>' +
      '<p class="muted small">Kompetenz deiner Partei bei diesem Thema: ' + E.competenceOf(g, g.party)[topic] + '/100' +
        (E.isCore(g, topic) ? ' · 🎯 Kernthema eures Programms' : '') + '</p>',
      E.DUEL_STYLES.map(s => ({
        label: s.name,
        hint: s.desc,
        onClick: () => {
          const results = d.results;
          const res = E.duelAnswer(g, s.id);
          save();
          const body = '<p><strong>' + esc(res.verdict) + '</strong> Wirkung: ' + signed(res.delta) + ' Punkte.</p>' + duelScoreHtml(results);
          if (res.done) {
            renderGame();
            openModal('Elefantenrunde · Blitzumfrage', res.total >= 0 ? 'Die Zuschauer sehen euch vorn!' : 'Kein guter Abend für euch',
              body + '<p>Gesamtwirkung der Elefantenrunde: <strong>' + signed(res.total) + ' Punkte</strong>.</p>',
              [{ label: 'Zurück in den Wahlkampf', primary: true, onClick: () => { closeModal(); renderGame(); } }]);
          } else {
            openModal('Elefantenrunde', 'Antwort: ' + s.name, body, [{ label: 'Nächste Frage', primary: true, onClick: showDuelRound }]);
          }
        }
      })));
  }

  // ---------- Wahlabend ----------

  function showElection() {
    $('toast').hidden = true;
    show('election');
    renderElection(true);
  }

  function renderElection(animate) {
    const r = g.result;
    const me = g.party;

    // Balken
    const ids = ALL_IDS.slice().sort((a, b) => (a === D.OTHER.id) - (b === D.OTHER.id) || r.shares[b] - r.shares[a]);
    const max = Math.max.apply(null, ids.map(p => r.shares[p])) * 1.15;
    let bars = '<div class="rhurdle" style="bottom:' + (5 / max * 100) + '%"></div>';
    ids.forEach(p => {
      bars += '<div class="col"><span class="rval">' + num1(r.shares[p]) + '</span>' +
        '<div class="rbar" data-h="' + (r.shares[p] / max * 100) + '" style="background:' + col(p) + '"></div></div>';
    });
    $('result-bars').innerHTML = bars;
    $('result-labels').innerHTML = ids.map(p => {
      const d = r.shares[p] - g.startShares[p];
      return '<div class="' + (p === me ? 'me' : '') + '">' + short(p) +
        '<span class="rdiff ' + (d >= 0 ? 'pos' : 'neg') + '">' + signed(d) + '</span></div>';
    }).join('');
    const grow = () => document.querySelectorAll('.rbar').forEach(b => { b.style.height = b.dataset.h + '%'; });
    if (animate) requestAnimationFrame(() => requestAnimationFrame(grow)); else grow();

    // Sitze
    $('seat-total').textContent = '(' + D.SEATS + ' Sitze, Mehrheit ab ' + E.MAJORITY + ')';
    $('hemicycle').innerHTML = hemicycle(r.seats);
    $('seat-legend').innerHTML = SPECTRUM.filter(p => r.seats[p] > 0)
      .map(p => '<span><i style="background:' + col(p) + '"></i>' + short(p) + ' ' + r.seats[p] + '</span>').join('');

    renderCoalition();
    renderOutcome();
  }

  function hemicycle(seats) {
    const total = SPECTRUM.reduce((s, p) => s + (seats[p] || 0), 0);
    const rows = 12;
    const r0 = 0.38;
    const radii = [];
    for (let i = 0; i < rows; i++) radii.push(r0 + (1 - r0) * i / (rows - 1));
    const sumR = radii.reduce((a, b) => a + b, 0);
    const counts = radii.map(rad => Math.round(total * rad / sumR));
    counts[rows - 1] += total - counts.reduce((a, b) => a + b, 0);
    const pts = [];
    radii.forEach((rad, i) => {
      const n = counts[i];
      for (let j = 0; j < n; j++) {
        const a = n === 1 ? Math.PI / 2 : Math.PI * (1 - j / (n - 1));
        pts.push({ a, x: Math.cos(a) * rad, y: -Math.sin(a) * rad });
      }
    });
    pts.sort((p, q) => q.a - p.a);
    const owners = [];
    SPECTRUM.forEach(p => { for (let i = 0; i < (seats[p] || 0); i++) owners.push(p); });
    let svg = '<svg viewBox="-1.05 -1.05 2.1 1.12" role="img" aria-label="Sitzverteilung im Bundestag">';
    pts.forEach((pt, i) => {
      svg += '<circle cx="' + pt.x.toFixed(4) + '" cy="' + pt.y.toFixed(4) + '" r="0.0165" style="fill:' + col(owners[i]) + '"></circle>';
    });
    svg += '<text x="0" y="-0.05" text-anchor="middle" font-size="0.13" font-weight="800" style="fill:var(--text)">' + total + '</text>';
    svg += '<text x="0" y="0.05" text-anchor="middle" font-size="0.06" style="fill:var(--muted)">Sitze</text></svg>';
    return svg;
  }

  function pills(members, seats) {
    return '<span class="coal-members">' + members.map(p =>
      '<span class="pill" style="--pc:' + col(p) + ';--pon:' + onCol(p) + '">' + short(p) + (seats ? ' ' + seats[p] : '') + '</span>').join('') + '</span>';
  }

  function renderCoalition() {
    const r = g.result;
    const box = $('coalition');
    if (r.awaitingChoice) {
      box.innerHTML = '<p><strong>Ihr seid stärkste Kraft und habt den Auftrag zur Regierungsbildung!</strong> Mit wem wollt ihr koalieren?</p>';
      r.options.forEach((o, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn coalition-option choice';
        b.innerHTML = pills(o.members, r.seats) + '<span class="hint">' + o.seats + ' Sitze · Mehrheit +' + (o.seats - E.MAJORITY + 1) + '</span>';
        b.addEventListener('click', () => { E.chooseCoalition(g, i); save(); renderElection(false); });
        box.appendChild(b);
      });
      return;
    }
    let html;
    if (r.government) {
      const seats = r.government.reduce((s, p) => s + r.seats[p], 0);
      html = '<p>Neue Bundesregierung (' + seats + ' Sitze):</p><p>' + pills(r.government) + '</p>' +
        '<p class="muted small">Das Kanzleramt geht an: <strong>' + esc(E.party(r.government[0]).name) + '</strong>' +
        (r.government[0] === g.party ? ' – ' + esc(g.candidate) + ' wird Regierungschef:in!' : '') + '</p>';
    } else {
      html = '<p><strong>Keine regierungsfähige Mehrheit.</strong> Es droht eine Minderheitsregierung oder sogar eine Neuwahl.</p>';
    }
    const list = r.coalitions.filter(c => c.viable).concat(r.coalitions.filter(c => !c.viable)).slice(0, 6);
    if (list.length) {
      html += '<h3>Rechnerische Mehrheiten</h3><ul class="coal-list">' + list.map(c =>
        '<li class="' + (c.viable ? '' : 'nope') + '">' + pills(c.members) + '<span class="small">' + c.seats + ' Sitze' +
        (c.viable ? '' : ' · ausgeschlossen') + '</span></li>').join('') + '</ul>' +
        '<p class="muted small">Ausgeschlossen: Koalitionen mit der AfD (Brandmauer) sowie CDU/CSU mit der Linken.</p>';
    }
    box.innerHTML = html;
  }

  function renderOutcome() {
    const r = g.result;
    const card = $('outcome-card');
    if (!r.outcome) { card.hidden = true; return; }
    const o = r.outcome;
    const p = E.party(g.party);
    const statusText = {
      kanzler: '🏛️ ' + g.candidate + ' zieht ins Kanzleramt ein!',
      regierung: '🤝 Ihr seid Teil der neuen Bundesregierung.',
      opposition: '🪑 Ihr geht in die Opposition.',
      raus: '🚪 An der 5-%-Hürde gescheitert – ihr seid nicht im Bundestag.'
    }[o.status];
    $('outcome').innerHTML =
      '<p class="eyebrow">Euer Wahlabend</p><h2>' + esc(o.rating) + '</h2>' +
      '<div class="score">' + o.score + '</div><p class="muted small">Punkte</p>' +
      '<p><strong>' + esc(p.name) + ': ' + pct(r.shares[g.party]) + '</strong> (' + signed(o.delta) + ' seit Wahlkampfstart)</p>' +
      '<p>' + esc(statusText) + '</p>' +
      '<p>' + (o.goal ? '✅ Wahlziel erreicht: ' : '❌ Wahlziel verfehlt: ') + esc(p.goalText) + '</p>';
    card.hidden = false;
  }

  // ---------- Wahlprogramm ----------

  // Der Programmparteitag läuft in Schritten: jeweils nur ein Abschnitt ist sichtbar.
  const PROGRAM_STEPS = [
    { id: 'sec-slogan', name: 'Slogan' },
    { id: 'sec-kern', name: 'Kernthemen' },
    { id: 'sec-positionen', name: 'Positionen' },
    { id: 'sec-bilanz', name: 'Bilanz' },
    { id: 'flyer-program', name: 'Unser Programm' }
  ];
  let programStep = 0;
  let programMaxStep = 0;

  function enterProgram() {
    draft = E.defaultProgram(chosenParty);
    draft.core = []; // Kernthemen wählt der Spieler selbst, ohne Vorauswahl
    programStep = 0;
    programMaxStep = 0;
    show('program');
    renderProgram();
  }

  // Warum man den aktuellen Schritt noch nicht verlassen kann (oder null).
  function stepBlocker(step) {
    const max = D.PROGRAM_RULES.coreCount;
    if (step === 0 && !String(draft.slogan || '').trim()) return 'Bitte einen Wahlslogan festlegen.';
    if (step === 1 && draft.core.length !== max) return 'Bitte ' + max + ' Kernthemen wählen (' + draft.core.length + ' / ' + max + ').';
    return null;
  }

  function goToStep(n) {
    for (let i = 0; i < n; i++) if (stepBlocker(i)) n = i; // nicht an offenen Schritten vorbei
    programStep = n;
    programMaxStep = Math.max(programMaxStep, n);
    renderProgramStep();
    if (n === 0) window.scrollTo({ top: 0, behavior: 'instant' });
    else $(PROGRAM_STEPS[n].id).scrollIntoView({ behavior: 'instant', block: 'start' });
  }

  function renderProgramStep() {
    const last = PROGRAM_STEPS.length - 1;
    PROGRAM_STEPS.forEach((st, i) => { $(st.id).hidden = i !== programStep; });
    document.querySelectorAll('.flyer-nav .step-link').forEach(b => {
      const i = Number(b.dataset.step);
      if (i === programStep) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      b.disabled = i > programMaxStep;
    });
    const blocker = stepBlocker(programStep);
    const next = $('btn-program-next');
    next.hidden = programStep === last;
    next.disabled = !!blocker;
    if (programStep < last) next.textContent = 'Weiter: ' + PROGRAM_STEPS[programStep + 1].name + ' →';
    $('btn-program-prev').textContent = programStep === 0 ? '← Parteiwahl' : '← Zurück';
    const confirm = $('btn-program-confirm');
    confirm.hidden = programStep !== last;
    confirm.disabled = E.validateProgram(draft).length > 0;
    const label = programStep === last ? 'Zusammenfassung' : 'Schritt ' + (programStep + 1) + ' von ' + last + ': ' + PROGRAM_STEPS[programStep].name;
    const stats = $('program-bar-stats');
    stats.querySelector('.step-label').textContent = label;
    const hint = stats.querySelector('.step-hint');
    hint.textContent = blocker || '';
    hint.hidden = !blocker;
  }

  function renderProgram() {
    const p = E.party(chosenParty);
    $('program-party').textContent = p.name + ' · Programmparteitag';
    $('slogan').value = draft.slogan;
    const flyer = $('flyer');
    flyer.style.setProperty('--pc', col(chosenParty));
    flyer.style.setProperty('--pon', onCol(chosenParty));
    flyer.dataset.party = chosenParty;
    $('flyer-logo').innerHTML = logoHtml(chosenParty);
    $('flyer-stoerer').innerHTML = STOERER[chosenParty] || '';
    $('flyer-candidate').textContent = candidateLine($('candidate').value);

    const sc = $('slogan-chips');
    sc.innerHTML = '';
    D.PROGRAM_RULES.slogans.forEach(sl => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = sl;
      b.setAttribute('aria-pressed', String(sl === draft.slogan));
      b.addEventListener('click', () => {
        draft.slogan = sl;
        $('slogan').value = sl;
        sc.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === b)));
        renderProgramSummary();
      });
      sc.appendChild(b);
    });

    renderCoreChips();

    $('positions').innerHTML = D.TOPICS.map(t => {
      const options = D.PROGRAM[t.id].map((o, i) => {
        const dev = Math.abs(o.lean - p.lean[t.id]);
        const tags = [];
        if (dev === 0) tags.push('<span class="tag line">Parteilinie</span>');
        else {
          const line = D.PROGRAM[t.id].find(x => x.lean === p.lean[t.id]);
          const fx = E.positionEffect(o, line, dev);
          tags.push('<span class="tag dev">' + (dev === 2 ? 'Starke Abweichung' : 'Abweichung') + '</span>');
          tags.push(fx.nat > 0
            ? '<span class="tag line">📈 gewinnt neue Wähler</span>'
            : '<span class="tag dev">📉 ' + (dev === 2 ? 'verprellt Stammwähler' : 'kostet Stimmen') + '</span>');
        }
        if (o.pop >= 0.3) tags.push('<span class="tag">👍 populär</span>');
        if (o.pop < 0) tags.push('<span class="tag">👎 unpopulär</span>');
        if (o.east >= 0.3) tags.push('<span class="tag">im Osten beliebt</span>');
        if (o.east <= -0.3) tags.push('<span class="tag">im Osten unbeliebt</span>');
        tags.push('<span class="tag">' + (o.cost ? '💶'.repeat(o.cost) : 'kostenneutral') + '</span>');
        return '<label class="option"><input type="radio" name="pos-' + t.id + '" value="' + i + '"' +
          (draft.positions[t.id] === i ? ' checked' : '') + '>' +
          '<span class="olabel">' + esc(o.label) + '</span><span class="odesc">' + esc(o.desc) + '</span>' +
          '<span class="ometa">' + tags.join('') + '</span></label>';
      }).join('');
      return '<fieldset class="topic-set"><legend>' + t.icon + ' ' + esc(t.name) +
        '<span class="core-mark" data-core="' + t.id + '" hidden>🎯 Kernthema</span></legend>' +
        '<div class="options">' + options + '</div></fieldset>';
    }).join('');
    $('positions').querySelectorAll('input[type=radio]').forEach(inp => {
      inp.addEventListener('change', () => {
        draft.positions[inp.name.slice(4)] = Number(inp.value);
        renderProgramSummary();
      });
    });
    updateCoreMarks();
    renderProgramSummary();
    document.body.style.background = getComputedStyle(flyer).getPropertyValue('--fl-paper').trim();
  }

  function renderCoreChips() {
    const p = E.party(chosenParty);
    const max = D.PROGRAM_RULES.coreCount;
    const box = $('core-chips');
    box.innerHTML = '';
    D.TOPICS.forEach(t => {
      const on = draft.core.indexOf(t.id) !== -1;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.setAttribute('aria-pressed', String(on));
      b.disabled = !on && draft.core.length >= max;
      b.textContent = t.icon + ' ' + t.name + ' · ' + p.competence[t.id];
      b.title = 'Kompetenz deiner Partei: ' + p.competence[t.id] + '/100';
      b.addEventListener('click', () => {
        if (on) draft.core = draft.core.filter(c => c !== t.id);
        else if (draft.core.length < max) draft.core.push(t.id);
        renderCoreChips();
        updateCoreMarks();
        renderProgramSummary();
        const again = Array.from(box.querySelectorAll('.chip')).find(c => c.textContent === b.textContent);
        if (again) again.focus();
      });
      box.appendChild(b);
    });
    $('core-count').textContent = '(' + draft.core.length + '/' + max + ' gewählt)';
  }

  function updateCoreMarks() {
    document.querySelectorAll('[data-core]').forEach(el => { el.hidden = draft.core.indexOf(el.dataset.core) === -1; });
  }

  const DEFAULT_CANDIDATE = 'Unsere Spitzenkandidatin';

  // Text-Logo der Partei; die CDU bekommt zusätzlich den angedeuteten Bogen.
  function logoHtml(partyId) {
    const p = E.party(partyId);
    if (partyId === 'afd') return '<span class="lang">Alternative<small>für</small>Deutschland</span><span class="pfeil" aria-hidden="true"></span>';
    if (partyId === 'spd') return '<span class="word">SPD</span><span class="claim">Soziale<br>Politik für<br>Dich.</span>';
    return (partyId === 'union' ? '<span class="bogen" aria-hidden="true"><i></i><i></i><i></i></span>' : '') + esc(p.flyerLogo);
  }

  // Störer (nur bei Parteien, deren Design einen vorsieht).
  const STOERER = {
    union: '<span>Beide</span><span class="dark">Stimmen</span><span>CDU</span>',
    spd: '<span>Am Wahltag</span><span class="b">SPD</span><span class="b">wählen!</span>',
    afd: '<span class="x">✘</span><span>Am Wahlsonntag AfD wählen!</span>'
  };

  // Slogan mit markiertem ersten Wort (für Gestaltungselemente wie den FDP-Balken).
  function sloganHtml(text) {
    const m = String(text).match(/^(\S+)(.*)$/s);
    return '<span>' + (m ? '<span class="fw">' + esc(m[1]) + '</span>' + esc(m[2]) : esc(text)) + '</span>';
  }

  function candidateLine(name) {
    name = String(name || '').trim();
    return name && name !== DEFAULT_CANDIDATE ? 'Mit ' + name + ' für Deutschland' : 'Für ein Deutschland, das mehr kann';
  }

  // Inhalt des fertigen Programms am Ende des Flyers (auch für den Mini-Flyer im Spiel).
  function flyerProgramHtml(partyId, prog, finance) {
    const p = E.party(partyId);
    const core = prog.core.filter(t => E.topicById(t));
    let html = '<h2 class="fp-title">Unser Programm</h2>' +
      '<p class="fp-sub">Das packen wir an, wenn Sie uns am Wahltag Ihre Stimme geben.</p><div class="fp-core">';
    for (let i = 0; i < D.PROGRAM_RULES.coreCount; i++) {
      const t = core[i];
      if (!t) { html += '<div class="fp-core-empty">🎯 Kernthema wählen …</div>'; continue; }
      const topic = E.topicById(t);
      const o = D.PROGRAM[t][prog.positions[t]];
      html += '<div class="fp-core-item"><div class="fp-icon">' + topic.icon + '</div>' +
        '<div class="fp-topic">Kernthema · ' + esc(topic.name) + '</div>' +
        '<div class="fp-label">' + esc(o.label) + '</div><div class="fp-desc">' + esc(o.desc) + '</div></div>';
    }
    html += '</div><ul class="fp-list">' + D.TOPICS.filter(t => core.indexOf(t.id) === -1).map(t =>
      '<li><span class="fp-check">✔</span><span><span class="fp-topic">' + t.icon + ' ' + esc(t.name) + '</span>' +
      '<span class="fp-label">' + esc(D.PROGRAM[t.id][prog.positions[t.id]].label) + '</span></span></li>').join('') + '</ul>';
    if (finance) {
      html += '<span class="fp-stamp ' + finance + '">' +
        { solid: 'Solide finanziert', ok: 'Durchgerechnet', over: 'Nicht gegenfinanziert' }[finance] + '</span>';
    }
    html += '<div class="fp-ballot"><div class="fp-ballot-call"><small>Am Wahlsonntag</small>' + esc(partyId === 'union' ? 'CDU/CSU' : p.short) + ' wählen!</div>' +
      '<div class="fp-ballot-box"><span>Zweitstimme</span><span>' + esc(p.name.length > 24 ? p.short : p.name) + '</span><span class="fp-cross" aria-hidden="true"></span></div></div>';
    return html;
  }

  function renderProgramSummary() {
    const p = E.party(chosenParty);
    const errors = E.validateProgram(draft);
    const coreReady = draft.core.length === D.PROGRAM_RULES.coreCount;
    const fx = coreReady ? E.programEffects(chosenParty, draft) : null;

    // Flyer
    $('flyer-slogan').innerHTML = sloganHtml(String(draft.slogan || '').trim() || 'Euer Slogan');
    $('flyer-program').innerHTML = flyerProgramHtml(chosenParty, draft, fx && fx.finance);

    // Aktionsleiste
    let bar = '<span class="step-label"></span>';
    if (!errors.length) {
      const tmp = E.newGame(chosenParty, '', 1, draft);
      const now = E.nationalShares(tmp)[chosenParty];
      const d = now - tmp.startShares[chosenParty];
      bar += '<span>Erste Umfrage: <strong>' + pct(now) + '</strong> <span class="' + (d >= 0 ? 'pos' : 'neg') + '">' + signed(d) + '</span></span>';
    }
    if (fx) bar += '<span>Finanzierung: <strong class="' + (fx.finance === 'over' ? 'neg' : '') + '">' + fx.cost + ' / ' + fx.budget + ' 💶</strong></span>';
    bar += '<span>Kernthemen: <strong>' + draft.core.length + ' / ' + D.PROGRAM_RULES.coreCount + '</strong></span>';
    bar += '<span class="neg step-hint" hidden></span>';
    $('program-bar-stats').innerHTML = bar;
    renderProgramStep();

    // Details für Strategen
    let html = '';
    if (fx) {
      const over = fx.finance === 'over';
      const financeText = {
        over: '⚠️ Nicht gegenfinanziert: kostet Stimmen und Wirtschaftskompetenz.',
        ok: 'Im Rahmen des Haushalts.',
        solid: '✅ Solide finanziert: +5 Wirtschaftskompetenz.'
      }[fx.finance];
      html += '<div class="summary-row"><span>Finanzierung</span><strong>' + fx.cost + ' / ' + fx.budget + ' 💶</strong></div>' +
        '<div class="meter' + (over ? ' over' : '') + '"><div style="width:' + Math.min(100, fx.cost / fx.budget * 100) + '%"></div></div>' +
        '<p class="small ' + (over ? 'neg' : 'muted') + '" style="margin:0 0 10px">' + financeText + '</p>' +
        '<div class="summary-row"><span>Zusätzlich im Osten</span><strong class="' + (fx.east >= 0 ? 'pos' : 'neg') + '">' + signed(fx.east) + '</strong></div>' +
        '<h3>Kompetenz in den Augen der Wähler</h3><div class="comp-list">' + D.TOPICS.map(t => {
          const d = fx.competence[t.id] - p.competence[t.id];
          return '<span>' + t.icon + ' ' + esc(t.name) + (fx.details[t.id].core ? ' 🎯' : '') + '</span><span>' + fx.competence[t.id] + '</span>' +
            '<span class="small ' + (d > 0 ? 'pos' : d < 0 ? 'neg' : 'muted') + '">' + (d ? (d > 0 ? '+' : '−') + Math.abs(d) : '±0') + '</span>';
        }).join('') + '</div>';
    }
    if (errors.length) html += '<ul class="errors">' + errors.map(e => '<li>' + esc(e) + '</li>').join('') + '</ul>';
    $('program-summary').innerHTML = html;
  }

  function renderProgramView() {
    const p = E.party(g.party);
    $('program-view').innerHTML =
      '<article class="flyer mini" data-party="' + g.party + '" style="--pc:' + col(g.party) + ';--pon:' + onCol(g.party) + '">' +
      '<header class="flyer-head"><div class="flyer-brand"><span class="flyer-logo">' + logoHtml(g.party) + '</span></div>' +
      '<p class="flyer-kicker">Bundestagswahl – Ihre Stimme zählt.</p>' +
      '<p class="flyer-slogan">' + sloganHtml(g.program.slogan) + '</p>' +
      '<p class="flyer-candidate">' + esc(candidateLine(g.candidate)) + '</p></header>' +
      '<section class="flyer-program">' + flyerProgramHtml(g.party, g.program, g.finance) + '</section></article>';
  }

  // ---------- Ereignis-Handler ----------

  function startGame(game) {
    g = game;
    selState = 'NW';
    selTopic = null;
    $('feedback').textContent = '';
    if (g.phase !== 'campaign') { showElection(); return; }
    show('game');
    renderGame();
    checkPending();
  }

  $('btn-start').addEventListener('click', () => {
    if (chosenParty) enterProgram();
  });

  $('candidate').addEventListener('input', () => {
    updateSignature();
    if (!$('screen-program').hidden) $('flyer-candidate').textContent = candidateLine($('candidate').value);
  });

  $('slogan').addEventListener('input', () => {
    draft.slogan = $('slogan').value;
    $('slogan-chips').querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c.textContent === draft.slogan)));
    renderProgramSummary();
  });

  $('btn-program-reset').addEventListener('click', () => {
    const slogan = draft.slogan;
    const core = draft.core.slice();
    draft = E.defaultProgram(chosenParty);
    draft.slogan = slogan;
    draft.core = core; // selbst gewählte Kernthemen bleiben erhalten
    renderProgram();
  });

  $('btn-program-back').addEventListener('click', () => show('start'));
  $('btn-intro-start').addEventListener('click', () => {
    $('sign-date').textContent = 'Berlin, ' + new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    updateSignature();
    show('name');
    $('candidate').focus({ preventScroll: true });
  });
  $('btn-name-back').addEventListener('click', () => show('intro'));
  $('name-form').addEventListener('submit', e => {
    e.preventDefault();
    renderStart();
    show('start');
  });
  $('btn-to-name').addEventListener('click', () => show('name'));

  $('btn-program-next').addEventListener('click', () => {
    if (!stepBlocker(programStep)) goToStep(programStep + 1);
  });
  $('btn-program-prev').addEventListener('click', () => {
    if (programStep === 0) show('start'); else goToStep(programStep - 1);
  });
  document.querySelectorAll('.flyer-nav .step-link').forEach(b => {
    b.addEventListener('click', () => goToStep(Number(b.dataset.step)));
  });

  $('btn-program-confirm').addEventListener('click', () => {
    if (E.validateProgram(draft).length) return;
    startGame(E.newGame(chosenParty, $('candidate').value, undefined, draft));
    save();
  });

  const resume = () => {
    const saved = loadSave();
    if (saved) startGame(saved);
  };
  $('btn-intro-resume').addEventListener('click', resume);

  $('btn-end-week').addEventListener('click', () => {
    if (g.ap > 0 && !window.confirm('Du hast noch ' + g.ap + ' Aktion(en) übrig. Woche trotzdem beenden?')) return;
    const before = E.nationalShares(g)[g.party];
    const res = E.endWeek(g);
    if (!res.ok) { if (res.text) toast(res.text); return; }
    save();
    $('feedback').textContent = '';
    if (res.election) { closeModal(); showElection(); return; }
    const after = E.nationalShares(g)[g.party];
    toast('Neue Umfrage: ' + pct(after) + ' (' + signed(after - before) + ' zur Vorwoche)');
    renderGame();
    checkPending();
  });

  $('btn-restart').addEventListener('click', () => {
    clearSave();
    g = null;
    chosenParty = null;
    $('btn-start').disabled = true;
    renderStart();
    show('name');
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (g && !$('screen-game').hidden) renderChart(); }, 150);
  });

  renderStart();
})();
