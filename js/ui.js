/* Oberfläche: verbindet die Spiel-Engine mit dem DOM. */
(function () {
  // Muss zur data-version in index.html passen (wird von tools/bump-version.js gesetzt).
  // Passen Seite und Skript nicht zusammen (alte Datei aus dem Browser-Cache), einmal neu laden.
  const APP_VERSION = '20261010-214404';
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
    wohnen: 'Viele finden keine bezahlbare Wohnung mehr. Was tun Sie gegen steigende Mieten?',
    verteidigung: 'Ist Deutschland verteidigungsfähig? Wie viel wollen Sie in die Bundeswehr stecken?',
    gesundheit: 'Monatelang auf einen Facharzttermin warten, Kliniken schließen – wie wollen Sie das ändern?',
    verkehr: 'Züge zu spät, Brücken gesperrt: Wie bringen Sie Deutschland wieder in Bewegung?',
    europa: 'Welche Rolle soll Deutschland in der Europäischen Union spielen?',
    familie: 'Familien fehlen Kitaplätze und Geld. Was ist Ihr Angebot an junge Eltern?',
    land: 'Bauern protestieren, auf dem Land schließen Praxen und Läden. Was tun Sie für den ländlichen Raum?',
    demokratie: 'Das Vertrauen in die Politik sinkt. Wie wollen Sie die Demokratie stärken?',
    finanzen: 'Wer soll das alles bezahlen? Wie sieht Ihr Steuer- und Haushaltskonzept aus?'
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
    ['intro', 'name', 'start', 'program', 'kickoff', 'game', 'election'].forEach(s => { $('screen-' + s).hidden = s !== screen; });
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
    badge.textContent = p.flyerLogo || p.short;
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
    applyGameTab();
  }

  // ---------- Wahlkampf als Website: immer nur ein Bereich sichtbar ----------
  let gameTab = 'map';
  let newsSeen = null; // oberste Meldung beim letzten Blick in die Nachrichten

  function applyGameTab() {
    document.querySelectorAll('#screen-game .layout > .card').forEach(c => { c.hidden = c.dataset.tab !== gameTab; });
    document.querySelectorAll('#game-nav .game-tab').forEach(b => {
      if (b.dataset.tab === gameTab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    if (gameTab === 'news' && g.log.length) newsSeen = g.log[0];
    let unread = newsSeen ? g.log.indexOf(newsSeen) : g.log.length;
    if (unread === -1) unread = g.log.length;
    const badge = $('news-badge');
    badge.textContent = unread;
    badge.hidden = !unread || gameTab === 'news';
  }

  function showGameTab(tab) {
    gameTab = tab;
    applyGameTab();
    if (tab === 'polls') renderChart(); // Breite erst bekannt, wenn sichtbar
    const nav = $('game-nav');
    if (nav.getBoundingClientRect().top < 0 || window.scrollY > nav.offsetTop) window.scrollTo({ top: nav.offsetTop - 8, behavior: 'instant' });
  }

  document.querySelectorAll('#game-nav .game-tab').forEach(b => b.addEventListener('click', () => showGameTab(b.dataset.tab)));

  // Echte Umrisse der Bundesländer (js/germany.js). Kleine Länder bekommen ein Etikett mit Hinweislinie.
  const GEO = (typeof window !== 'undefined' && window.BTW_MAP) || null;
  const LABEL_AT = { BE: [556, 228], HB: [128, 190], HH: [336, 178], BB: [518, 330], NI: [238, 268] };
  // Gebräuchliche Kürzel auf der Karte (intern bleiben die ISO-Kürzel)
  const LABEL_TEXT = { ST: 'SA', SN: 'S', NW: 'NRW' };

  function renderMap() {
    const map = $('map');
    if (!GEO) { map.textContent = 'Karte nicht verfügbar.'; return; }
    let shapes = '';
    let labels = '';
    let selected = '';
    D.STATES.forEach(st => {
      const geo = GEO.states[st.id];
      if (!geo) return;
      const s = E.stateShares(g, st.id);
      const lead = E.leader(s);
      const isSel = st.id === selState;
      const shape = '<path class="land-shape" d="' + geo.d + '" style="fill:' + col(lead) + '"></path>';
      const group = '<g class="land' + (isSel ? ' selected' : '') + '" data-state="' + st.id + '" tabindex="0" role="button" aria-pressed="' + isSel + '" ' +
        'aria-label="' + esc(st.name) + ': ' + E.party(lead).short + ' vorn, ihr ' + pct(s[g.party]) + '">' +
        '<title>' + esc(st.name) + ' – ' + E.party(lead).short + ' vorn, ihr ' + pct(s[g.party]) + '</title>' + shape + '</g>';
      if (isSel) selected = group; else shapes += group; // ausgewähltes Land zuletzt zeichnen, damit der Rahmen oben liegt
      const at = LABEL_AT[st.id] || [geo.cx, geo.cy];
      const line = LABEL_AT[st.id] && st.id !== 'BB' && st.id !== 'NI'
        ? '<line x1="' + geo.cx + '" y1="' + geo.cy + '" x2="' + at[0] + '" y2="' + at[1] + '"></line><circle cx="' + geo.cx + '" cy="' + geo.cy + '" r="3.5"></circle>' : '';
      labels += '<g class="land-label' + (isSel ? ' selected' : '') + '" data-state="' + st.id + '">' + line +
        '<rect x="' + (at[0] - 31) + '" y="' + (at[1] - 21) + '" width="62" height="42" rx="9"></rect>' +
        '<text class="ll-id" x="' + at[0] + '" y="' + (at[1] - 6) + '" text-anchor="middle">' + (LABEL_TEXT[st.id] || st.id) + '</text>' +
        '<text class="ll-val" x="' + at[0] + '" y="' + (at[1] + 14) + '" text-anchor="middle">' + num1(s[g.party]) + '</text></g>';
    });
    map.innerHTML = '<svg viewBox="-4 -4 ' + (GEO.w + 8) + ' ' + (GEO.h + 8) + '" role="group" aria-label="Karte der Bundesländer mit euren Umfragewerten">' +
      shapes + selected + labels + '</svg>';
    map.querySelectorAll('.land, .land-label').forEach(t => {
      const choose = () => { selState = t.dataset.state; renderGame(); };
      t.addEventListener('click', choose);
      t.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); } });
    });
  }

  // Säulendiagramm wie bei Hochrechnungen im Fernsehen: feste Reihenfolge, Wert unter dem Parteinamen.
  const CHART_TOP = 50;
  const CHART_ORDER = ['union', 'spd', 'gruene', 'linke', 'afd', 'fdp', 'bsw', D.OTHER.id];

  // Das Diagramm wird nur einmal aufgebaut und danach nur noch verändert: So wachsen und schrumpfen
  // die Säulen beim Wechsel des Bundeslands sichtbar (CSS-Übergang), die Zahlen zählen mit.
  let chartAnim = null;

  function buildStateChart(box) {
    box.innerHTML = '<h3 class="cc-title"></h3><div class="col-chart" role="img"><div class="cc-plot"><i class="cc-hurdle" title="5-%-Hürde"></i>' +
      CHART_ORDER.map(p => '<div class="cc-col"><div class="cc-bar" data-p="' + p + '" style="height:0;background:' + col(p) + '"></div></div>').join('') +
      '</div><div class="cc-labels">' +
      CHART_ORDER.map(p => '<div class="cc-label" data-p="' + p + '"><span class="cc-name">' + short(p) + '</span>' +
        '<span class="cc-val" style="--cc:' + col(p) + '">0,0</span></div>').join('') + '</div></div>';
  }

  function renderStateDetail() {
    const st = E.stateById(selState);
    const s = E.stateShares(g, st.id);
    // Feste Skala für alle Länder (0–50 %), damit die 5-%-Linie beim Wechsel nicht springt; höhere Werte werden gekappt.
    const top = CHART_TOP;
    const box = $('state-detail');
    if (!box.querySelector('.col-chart')) buildStateChart(box);
    box.querySelector('.cc-title').innerHTML = esc(st.name) + ' <span class="muted small">· ' + num1(st.voters) + ' Mio. Wahlberechtigte</span>';
    box.querySelector('.col-chart').setAttribute('aria-label', 'Umfrage in ' + st.name + ': ' + CHART_ORDER.map(p => short(p) + ' ' + pct(s[p])).join(', '));
    box.querySelector('.cc-hurdle').style.bottom = (5 / top * 100) + '%';
    // Höhe im nächsten Frame setzen, damit der Übergang auch beim ersten Aufbau greift
    requestAnimationFrame(() => {
      box.querySelectorAll('.cc-bar').forEach(b => { b.style.height = Math.min(100, s[b.dataset.p] / top * 100) + '%'; });
    });
    const vals = box.querySelectorAll('.cc-label');
    const from = {};
    vals.forEach(l => {
      l.classList.toggle('me', l.dataset.p === g.party);
      from[l.dataset.p] = parseFloat(l.dataset.v || '0');
      l.dataset.v = s[l.dataset.p];
    });
    if (chartAnim) cancelAnimationFrame(chartAnim);
    const t0 = performance.now();
    const DUR = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1200;
    const step = now => {
      const k = DUR ? Math.min(1, (now - t0) / DUR) : 1;
      const e = 1 - Math.pow(1 - k, 3);
      vals.forEach(l => { l.querySelector('.cc-val').textContent = num1(from[l.dataset.p] + (s[l.dataset.p] - from[l.dataset.p]) * e); });
      chartAnim = k < 1 ? requestAnimationFrame(step) : null;
    };
    chartAnim = requestAnimationFrame(step);
    $('local-state').textContent = st.name;
  }

  // Themenwahl als Karten; nach der Wahl eines Themas erscheinen die passenden Aktionen.
  function topicOrder() {
    const comp = E.competenceOf(g, g.party);
    const core = g.program.core.map(id => E.topicById(id));
    const rest = D.TOPICS.filter(t => g.program.core.indexOf(t.id) === -1).sort((a, b) => comp[b.id] - comp[a.id]);
    return core.concat(rest);
  }

  function topicStats(t) {
    const comp = E.competenceOf(g, g.party)[t.id];
    const now = g.salience[t.id] * 100;
    const trend = now - D.SALIENCE0[t.id] * 100;
    return { comp, now, trend };
  }

  function renderTopics() {
    const list = $('topic-list');
    const detail = $('topic-detail');
    $('topic-intro').hidden = !!selTopic;
    list.hidden = !!selTopic;
    detail.hidden = !selTopic;
    if (selTopic) {
      const t = E.topicById(selTopic);
      const st = topicStats(t);
      detail.innerHTML = '<button type="button" class="link-btn td-back">← Alle Themen</button>' +
        '<div class="td-head"><span class="td-icon" aria-hidden="true">' + t.icon + '</span><div>' +
        '<p class="td-name">' + esc(t.name) + (E.isCore(g, t.id) ? ' <span class="td-core">🎯 Kernthema · Aktionen +25 %</span>' : '') + '</p>' +
        '<p class="td-stats">Kompetenz <b>' + st.comp + '</b>/100 · Wählerinteresse <b>' + Math.round(st.now) + ' %</b> ' +
        '<span class="' + (st.trend > 0.5 ? 'pos' : st.trend < -0.5 ? 'neg' : 'muted') + '">' + (st.trend > 0.5 ? '▲' : st.trend < -0.5 ? '▼' : '•') + '</span></p>' +
        '</div></div>';
      detail.querySelector('.td-back').addEventListener('click', () => { selTopic = null; renderGame(); $('topic-list').scrollIntoView({ block: 'nearest' }); });
      return;
    }
    list.innerHTML = '';
    topicOrder().forEach(t => {
      const st = topicStats(t);
      const core = E.isCore(g, t.id);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'topic-card' + (core ? ' core' : '');
      b.innerHTML = (core ? '<span class="tc-badge">🎯 Kernthema</span>' : '') +
        '<span class="tc-icon" aria-hidden="true">' + t.icon + '</span>' +
        '<span class="tc-name">' + cardName(t.name) + '</span>' +
        '<span class="tc-meter"><span>Kompetenz <b>' + st.comp + '</b></span><span class="core-bar"><span style="width:' + st.comp + '%"></span></span></span>' +
        '<span class="tc-interest">Wählerinteresse <b>' + Math.round(st.now) + ' %</b> ' +
        '<span class="' + (st.trend > 0.5 ? 'pos' : st.trend < -0.5 ? 'neg' : 'muted') + '">' + (st.trend > 0.5 ? '▲' : st.trend < -0.5 ? '▼' : '') + '</span></span>';
      b.addEventListener('click', () => { selTopic = t.id; renderGame(); $('topic-detail').scrollIntoView({ block: 'nearest' }); });
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

  // Zusatzinfo je Aktion zum gewählten Thema (aus denselben Formeln wie im Spielkern).
  function topicActionHint(a, comp) {
    if (a.id === 'talkshow') return 'Erfolgschance ca. ' + Math.round((0.35 + 0.45 * comp / 100) * 100) + ' %';
    if (a.id === 'social') return 'Shitstorm-Risiko ca. ' + Math.round(Math.max(0, 0.25 - 0.1 * (comp - 50) / 50) * 100) + ' %';
    if (a.id === 'tvspot') return comp >= 60 ? 'eure Stärke – lohnt sich' : comp < 40 ? 'schwaches Thema – wenig Wirkung' : 'mittlere Wirkung';
    if (a.id === 'presse') return comp >= 50 ? 'rückt eure Stärke in den Fokus' : 'Vorsicht: rückt eine Schwäche in den Fokus';
    return '';
  }

  function actionButton(a, extra) {
    const cost = E.actionCost(a.id, selState);
    const disabled = !E.canAct(g) || (a.scope === 'topic' && !selTopic) || g.money + 1e-9 < cost;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'action';
    b.disabled = disabled;
    b.innerHTML = '<span class="aname">' + a.icon + ' ' + esc(a.name) + '</span>' +
      '<span class="adesc">' + esc(a.desc) + '</span>' +
      (extra ? '<span class="ahint">' + esc(extra) + '</span>' : '') +
      '<span class="ameta">' + (cost ? money(cost) : 'kostenlos') + '</span>';
    b.addEventListener('click', () => {
      const res = E.performAction(g, a.id, { state: selState, topic: selTopic });
      $(a.scope === 'topic' ? 'feedback' : 'local-feedback').textContent = res.text;
      toast(res.text);
      save();
      renderGame();
    });
    return b;
  }

  function renderActions() {
    const list = $('action-list');
    const local = $('local-actions');
    list.innerHTML = '';
    local.innerHTML = '';
    if (selTopic) {
      const comp = E.competenceOf(g, g.party)[selTopic];
      E.ACTIONS.filter(a => a.scope === 'topic').forEach(a => list.appendChild(actionButton(a, topicActionHint(a, comp))));
    }
    E.ACTIONS.filter(a => a.scope !== 'topic').forEach(a => local.appendChild(actionButton(a, a.scope === 'region' ? 'in ' + E.stateById(selState).name : 'füllt die Kasse')));
    const hint = 'Keine Aktionen mehr – Zeit, die Woche zu beenden.';
    const fb = $('feedback');
    if (g.phase === 'campaign' && g.ap === 0 && !fb.textContent.includes(hint)) {
      fb.textContent += (fb.textContent ? ' ' : '') + hint;
    }
  }

  // Sonntagsfrage als Säulendiagramm: Wert über der Säule, Partei und Veränderung seit Wahlkampfstart darunter.
  const POLL_ORDER = ['union', 'afd', 'spd', 'gruene', 'linke', 'bsw', 'fdp', D.OTHER.id];

  function renderPollBars(shares) {
    const top = Math.max(35, Math.ceil((Math.max.apply(null, POLL_ORDER.map(p => shares[p])) + 4) / 5) * 5);
    let cols = '';
    let labels = '';
    POLL_ORDER.forEach(p => {
      const d = p === D.OTHER.id ? null : shares[p] - g.startShares[p];
      cols += '<div class="pc-col"><span class="pc-val">' + pct(shares[p]) + '</span>' +
        '<div class="pc-bar" style="height:' + (shares[p] / top * 100) + '%;background:' + col(p) + '"></div></div>';
      labels += '<div class="pc-label' + (p === g.party ? ' me' : '') + '"><span class="pc-name">' + (p === D.OTHER.id ? 'Andere' : short(p)) + '</span>' +
        '<span class="pc-diff">' + (d === null ? '' : signed(d)) + '</span></div>';
    });
    $('poll-bars').innerHTML = '<div class="pc-plot"><i class="pc-hurdle" style="bottom:' + (5 / top * 100) + '%" title="5-%-Hürde"></i>' + cols + '</div>' +
      '<div class="pc-labels">' + labels + '</div>';
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
      const last = hist[hist.length - 1];
      svg += '<circle cx="' + x(hist.length - 1) + '" cy="' + y(last.shares[p]) + '" r="' + (p === g.party ? 4.5 : 3) + '" style="fill:' + col(p) + '"></circle>';
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
    const ids = D.TOPICS.slice().sort((a, b) => g.salience[b.id] - g.salience[a.id]);
    const max = g.salience[ids[0].id];
    let html = '';
    ids.forEach(t => {
      const core = E.isCore(g, t.id);
      html += '<span class="' + (core ? 'strong' : '') + '">' + t.icon + ' ' + esc(t.name) + (core ? ' 🎯' : '') + '</span>' +
        '<div class="track"><div class="fill" style="width:' + (g.salience[t.id] / max * 100) + '%"></div></div>' +
        '<span class="num">' + Math.round(g.salience[t.id] * 100) + ' %</span>';
    });
    $('agenda').innerHTML = html + '<span class="muted small" style="grid-column:1/-1">🎯 = eure Kernthemen. Macht sie wichtiger!</span>';
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
  // Die Aktionsleiste ist fest am unteren Rand; damit sie nichts verdeckt, bekommt die
  // Programmseite unten genau so viel Platz, wie die Leiste hoch ist.
  (function reserveBarSpace() {
    const bar = document.querySelector('.program-bar');
    const fit = () => {
      $('screen-program').style.paddingBottom = bar.offsetHeight + 'px';
      document.documentElement.style.setProperty('--bar-h', bar.offsetHeight + 'px');
    };
    if (window.ResizeObserver) new ResizeObserver(fit).observe(bar);
    window.addEventListener('resize', fit);
    fit();
  })();

  const PROGRAM_STEPS = [
    { id: 'sec-slogan', name: 'Slogan' },
    { id: 'sec-kern', name: 'Kernthemen' },
    { id: 'sec-quiz', name: 'Fachkonferenz' },
    { id: 'sec-positionen', name: 'Positionen' },
    { id: 'sec-bilanz', name: 'Bilanz' },
    { id: 'flyer-program', name: 'Unser Programm' }
  ];
  let programStep = 0;
  let programMaxStep = 0;

  function enterProgram() {
    draft = E.defaultProgram(chosenParty);
    draft.core = []; // Kernthemen wählt der Spieler selbst, ohne Vorauswahl
    draft.quiz = {};
    quiz = {};
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
    if (step === 2) {
      const done = draft.core.filter(t => Number.isInteger(draft.quiz[t])).length;
      if (done < draft.core.length) return 'Bitte die Fachkonferenz abschließen (' + done + ' / ' + draft.core.length + ' Themen).';
    }
    return null;
  }

  function goToStep(n) {
    for (let i = 0; i < n; i++) if (stepBlocker(i)) n = i; // nicht an offenen Schritten vorbei
    programStep = n;
    programMaxStep = Math.max(programMaxStep, n);
    if (PROGRAM_STEPS[n].id === 'sec-quiz') renderQuiz();
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


  // ---------- Fachkonferenz (Quiz je Kernthema) ----------
  // quiz[topic] = { qs: [Fragenindizes], i: aktuelle Frage, correct: Anzahl, answer: gewählte Antwort oder null }
  let quiz = {};
  const QUIZ_EFFECT = D.PROGRAM_RULES.quizEffect;
  const QUIZ_COUNT = D.PROGRAM_RULES.quizCount;
  const QBANK = (typeof window !== 'undefined' && window.BTW_QUESTIONS) || {};

  function drawQuestions(topic) {
    const all = (QBANK[topic] || []).map((_, i) => i);
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    return all.slice(0, QUIZ_COUNT);
  }

  function quizState(topic) {
    if (!quiz[topic]) quiz[topic] = { qs: drawQuestions(topic), i: 0, correct: 0, answer: null };
    return quiz[topic];
  }

  function signedInt(n) { return n > 0 ? '+' + n : n < 0 ? '−' + Math.abs(n) : '±0'; }

  function renderQuiz() {
    const box = $('quiz');
    const topics = draft.core.slice();
    const current = topics.find(t => !Number.isInteger(draft.quiz[t]));
    let html = '<ol class="quiz-steps">' + topics.map((t, k) => {
      const tp = E.topicById(t);
      const done = Number.isInteger(draft.quiz[t]);
      const cls = done ? 'done' : t === current ? 'active' : '';
      return '<li class="' + cls + '"><span class="quiz-step-num">' + (k + 1) + '</span>' + tp.icon + ' ' + cardName(tp.name) +
        (done ? ' <b>' + (quiz[t] && quiz[t].skipped ? 'übersprungen' : draft.quiz[t] + '/' + QUIZ_COUNT) + ' · ' + signedInt(QUIZ_EFFECT[draft.quiz[t]]) + '</b>' : '') + '</li>';
    }).join('') + '</ol>';

    if (current) {
      const st = quizState(current);
      const tp = E.topicById(current);
      const q = QBANK[current] && QBANK[current][st.qs[st.i]];
      if (!q) {
        html += '<p class="quiz-empty">Für dieses Thema liegen noch keine Fragen vor.</p>';
      } else {
        const answered = st.answer !== null;
        html += '<div class="quiz-card">' +
          '<div class="quiz-meta"><span>' + tp.icon + ' ' + esc(tp.name) + '</span><span>Frage ' + (st.i + 1) + ' von ' + st.qs.length + '</span></div>' +
          '<div class="quiz-dots" aria-hidden="true">' + st.qs.map((_, k) => '<i class="' + (k < st.i ? 'past' : k === st.i ? 'now' : '') + '"></i>').join('') + '</div>' +
          '<p class="quiz-q">' + esc(q.q) + '</p><div class="quiz-answers">' +
          q.a.map((a, k) => {
            let cls = 'quiz-answer';
            if (answered && k === q.c) cls += ' right';
            else if (answered && k === st.answer) cls += ' wrong';
            return '<button type="button" class="' + cls + '" data-k="' + k + '"' + (answered ? ' disabled' : '') + '><span class="quiz-letter">' + 'ABCD'[k] + '</span>' + esc(a) + '</button>';
          }).join('') + '</div>';
        if (answered) {
          const ok = st.answer === q.c;
          const last = st.i === st.qs.length - 1;
          html += '<div class="quiz-feedback ' + (ok ? 'ok' : 'no') + '" role="status"><b>' + (ok ? '✓ Richtig!' : '✗ Leider falsch.') + '</b> ' + esc(q.e) + '</div>' +
            '<button type="button" class="btn primary quiz-next">' + (last ? 'Auswertung „' + esc(tp.name) + '“ →' : 'Nächste Frage →') + '</button>';
        }
        html += '</div>';
      }
      html += '<button type="button" class="quiz-skip">Fachkonferenz zu „' + esc(tp.name) + '“ überspringen (Kompetenz ±0)</button>';
    } else {
      html += '<div class="quiz-card quiz-summary"><p class="quiz-q">Fachkonferenz abgeschlossen</p><ul>' + topics.map(t => {
        const tp = E.topicById(t);
        const n = draft.quiz[t];
        const fx = QUIZ_EFFECT[n];
        return '<li><span>' + tp.icon + ' ' + esc(tp.name) + '</span><span>' + (quiz[t] && quiz[t].skipped ? 'übersprungen' : n + ' von ' + QUIZ_COUNT + ' richtig') + '</span><b class="' + (fx > 0 ? 'pos' : fx < 0 ? 'neg' : '') + '">Kompetenz ' + signedInt(fx) + '</b></li>';
      }).join('') + '</ul>' +
        (E.gaffeTopic(draft) ? '<p class="quiz-warn">⚠️ Bei „' + esc(E.topicById(E.gaffeTopic(draft)).name) + '“ sitzt das Wissen nicht – im Wahlkampf droht ein peinlicher Patzer.</p>' : '') +
        '</div>';
    }
    box.innerHTML = html;

    box.querySelectorAll('.quiz-answer').forEach(b => b.addEventListener('click', () => {
      const st = quiz[current];
      st.answer = Number(b.dataset.k);
      if (st.answer === QBANK[current][st.qs[st.i]].c) st.correct += 1;
      renderQuiz();
      const next = box.querySelector('.quiz-next');
      if (next) { next.focus({ preventScroll: true }); next.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    }));
    const next = box.querySelector('.quiz-next');
    if (next) next.addEventListener('click', () => {
      const st = quiz[current];
      if (st.i < st.qs.length - 1) { st.i += 1; st.answer = null; }
      else draft.quiz[current] = st.correct;
      afterQuizChange();
      const first = box.querySelector('.quiz-answer');
      if (first) first.focus({ preventScroll: true });
      const card = box.querySelector('.quiz-card');
      if (card && card.getBoundingClientRect().top < 60) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    const skip = box.querySelector('.quiz-skip');
    if (skip) skip.addEventListener('click', () => {
      draft.quiz[current] = QUIZ_EFFECT.indexOf(0);
      quizState(current).skipped = true;
      afterQuizChange();
    });
  }

  function afterQuizChange() {
    renderQuiz();
    renderProgramSummary();
  }

  function renderProgram() {
    const p = E.party(chosenParty);
    $('program-party').textContent = (p.name.length > 30 ? p.short : p.name) + ' · Programmparteitag';
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
      b.className = 'core-card slogan-card';
      b.dataset.slogan = sl;
      b.innerHTML = '<span class="core-badge"></span><span class="slogan-text"></span>';
      b.querySelector('.slogan-text').textContent = sl;
      b.addEventListener('click', () => {
        draft.slogan = sl;
        $('slogan').value = sl;
        markSlogan();
        renderProgramSummary();
      });
      sc.appendChild(b);
    });
    markSlogan();

    renderCoreChips();

    $('positions').innerHTML = topicsByCompetence(chosenParty).map(t => {
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
        tags.push('<span class="tag' + (o.cost < 0 ? ' line' : '') + '">' + (o.cost > 0 ? '💶'.repeat(o.cost) : o.cost < 0 ? '💶 entlastet den Haushalt' : 'kostenneutral') + '</span>');
        return '<label class="option"><input type="radio" name="pos-' + t.id + '" value="' + i + '"' +
          (draft.positions[t.id] === i ? ' checked' : '') + '>' +
          '<span class="olabel">' + esc(o.label) + '</span><span class="odesc">' + esc(o.desc) + '</span>' +
          '<span class="ometa">' + tags.join('') + '</span></label>';
      }).join('');
      return '<fieldset class="topic-set" data-topic="' + t.id + '"><legend>' + t.icon + ' ' + esc(t.name) +
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
    topicsByCompetence(chosenParty).forEach(t => {
      const on = draft.core.indexOf(t.id) !== -1;
      const comp = p.competence[t.id];
      const interest = Math.round(D.SALIENCE0[t.id] * 100);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'core-card';
      b.dataset.topic = t.id;
      b.setAttribute('aria-pressed', String(on));
      b.disabled = !on && draft.core.length >= max;
      b.innerHTML =
        '<span class="core-badge">' + (on ? '✓ Kernthema ' + (draft.core.indexOf(t.id) + 1) : 'Auswählen') + '</span>' +
        '<span class="core-icon" aria-hidden="true">' + t.icon + '</span>' +
        '<span class="core-name">' + cardName(t.name) + '</span>' +
        '<span class="core-meter"><span class="core-meter-label">Kompetenz <b>' + comp + '</b>/100</span>' +
        '<span class="core-bar"><span style="width:' + comp + '%"></span></span></span>' +
        '<span class="core-meter"><span class="core-meter-label">Wählerinteresse <b>' + interest + '&nbsp;%</b></span>' +
        '<span class="core-bar"><span style="width:' + Math.min(100, interest * 4) + '%"></span></span></span>';
      b.title = 'Kompetenz deiner Partei: ' + comp + '/100 · so wichtig ist das Thema den Wählern zu Beginn: ' + interest + ' %';
      b.addEventListener('click', () => {
        if (on) {
          draft.core = draft.core.filter(c => c !== t.id);
          delete draft.quiz[t.id]; // abgewählt: Fachkonferenz zu diesem Thema verfällt
          delete quiz[t.id];
          programMaxStep = Math.min(programMaxStep, 2);
        } else if (draft.core.length < max) draft.core.push(t.id);
        renderCoreChips();
        updateCoreMarks();
        renderProgramSummary();
        const again = box.querySelector('[data-topic="' + t.id + '"]');
        if (again) again.focus();
      });
      box.appendChild(b);
    });
    $('core-count').textContent = '(' + draft.core.length + '/' + max + ' gewählt)';
  }

  // Themen nach der Kompetenz der Partei sortiert, stärkste zuerst (bei Gleichstand in der üblichen Reihenfolge).
  function topicsByCompetence(partyId) {
    const comp = E.party(partyId).competence;
    return D.TOPICS.slice().sort((a, b) => comp[b.id] - comp[a.id]);
  }

  // Weiches Trennzeichen, damit lange Themennamen auf schmalen Karten sauber umbrechen.
  function cardName(name) {
    const parts = { Digitalisierung: 'Digitali&shy;sierung', Landwirtschaft: 'Land&shy;wirtschaft', Gleichstellung: 'Gleich&shy;stellung',
      Infrastruktur: 'Infra&shy;struktur', Außenpolitik: 'Außen&shy;politik', Staatsfinanzen: 'Staats&shy;finanzen',
      Bürgerrechte: 'Bürger&shy;rechte', Verteidigung: 'Vertei&shy;digung' };
    return esc(name).replace(/[A-Za-zÄÖÜäöüß]+/g, w => parts[w] || w);
  }

  function updateCoreMarks() {
    document.querySelectorAll('[data-core]').forEach(el => { el.hidden = draft.core.indexOf(el.dataset.core) === -1; });
    // Kernthemen (in Wahlreihenfolge) stehen bei den Positionen immer ganz oben.
    const box = $('positions');
    const order = draft.core.concat(topicsByCompetence(chosenParty).map(t => t.id).filter(id => draft.core.indexOf(id) === -1));
    order.forEach(id => {
      const set = box.querySelector('.topic-set[data-topic="' + id + '"]');
      if (set) box.appendChild(set);
    });
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
    html += '</div><ul class="fp-list">' + topicsByCompetence(partyId).filter(t => core.indexOf(t.id) === -1).map(t =>
      '<li><span class="fp-check">✔</span><span><span class="fp-topic">' + t.icon + ' ' + esc(t.name) + '</span>' +
      '<span class="fp-label">' + esc(D.PROGRAM[t.id][prog.positions[t.id]].label) + '</span></span></li>').join('') + '</ul>';
    if (finance) {
      html += '<span class="fp-stamp ' + finance + '">' +
        { solid: 'Solide finanziert', ok: 'Durchgerechnet', over: 'Nicht gegenfinanziert' }[finance] + '</span>';
    }
    html += '<div class="fp-ballot"><div class="fp-ballot-call"><small>Am Wahlsonntag</small>' + esc(partyId === 'union' ? 'CDU/CSU' : p.short) + ' wählen!</div>' +
      '<div class="fp-ballot-box"><span>Zweitstimme</span><span class="fp-name-long">' + esc(p.name.length > 24 ? p.short : p.name) + '</span><span class="fp-name-short">' + esc(partyId === 'union' ? 'CDU/CSU' : p.short) + '</span><span class="fp-cross" aria-hidden="true"></span></div></div>';
    return html;
  }

  function renderProgramSummary() {
    const p = E.party(chosenParty);
    const errors = E.validateProgram(draft);
    const coreReady = draft.core.length === D.PROGRAM_RULES.coreCount;
    const fx = coreReady ? E.programEffects(chosenParty, draft) : null;

    // Flyer
    // Nicht trimmen: Leerzeichen beim Tippen sollen sofort sichtbar werden (z. B. im FDP-Balken).
    const typed = String(draft.slogan || '');
    $('flyer-slogan').innerHTML = sloganHtml(typed.trim() ? typed.replace(/^\s+/, '') : 'Euer Slogan');
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
      const finance = {
        over: { cls: 'bad', badge: '⚠️ Nicht gegenfinanziert', text: 'Kostet Stimmen und Wirtschaftskompetenz. Streicht teure Positionen.' },
        ok: { cls: '', badge: 'Im Rahmen', text: 'Das Programm passt in den Haushalt.' },
        solid: { cls: 'good', badge: '✅ Solide finanziert', text: 'Spielraum im Haushalt bringt +5 Wirtschaftskompetenz.' }
      }[fx.finance];
      const slots = Math.max(fx.budget, fx.cost);
      let seg = '';
      for (let i = 0; i < slots; i++) seg += '<span class="' + (i < fx.cost ? (i >= fx.budget ? 'on over' : 'on') : '') + '"></span>';
      let poll = '';
      if (!errors.length) {
        const tmp = E.newGame(chosenParty, '', 1, draft);
        const now = E.nationalShares(tmp)[chosenParty];
        const d = now - tmp.startShares[chosenParty];
        poll = '<div class="bilanz-card"><span class="bilanz-label">📊 Erste Umfrage</span>' +
          '<span class="bilanz-big">' + pct(now) + '</span>' +
          '<span class="bilanz-delta ' + (d >= 0 ? 'good' : 'bad') + '">' + signed(d) + ' Punkte durch das Programm</span></div>';
      }
      html += '<div class="bilanz-top">' +
        '<div class="bilanz-card bilanz-finance' + (over ? ' over' : '') + '">' +
          '<span class="bilanz-label">💶 Finanzierung <span class="bilanz-pill ' + finance.cls + '">' + finance.badge + '</span></span>' +
          '<span class="bilanz-big">' + fx.cost + ' <small>von ' + fx.budget + ' Punkten</small></span>' +
          '<span class="bilanz-seg" style="--n:' + slots + '" aria-hidden="true">' + seg + '</span>' +
          '<span class="bilanz-text">' + finance.text + '</span></div>' +
        poll +
        '<div class="bilanz-card"><span class="bilanz-label">🗺️ Zusätzlich im Osten</span>' +
          '<span class="bilanz-big ' + (fx.east > 0.05 ? 'good' : fx.east < -0.05 ? 'bad' : '') + '">' + signed(fx.east) + '</span>' +
          '<span class="bilanz-text">Punkte in den ostdeutschen Ländern</span></div>' +
        '</div>' +
        '<h3 class="bilanz-h3">Kompetenz in den Augen der Wähler</h3>' +
        '<div class="core-grid comp-grid">' + topicsByCompetence(chosenParty).map(t => {
          const before = p.competence[t.id];
          const now = fx.competence[t.id];
          const d = now - before;
          const core = fx.details[t.id].core;
          return '<div class="comp-card' + (core ? ' core' : '') + '">' +
            '<span class="core-badge">' + (core ? '🎯 Kernthema' : 'Thema') + '</span>' +
            '<span class="core-icon" aria-hidden="true">' + t.icon + '</span>' +
            '<span class="core-name">' + cardName(t.name) + '</span>' +
            '<span class="comp-value"><b>' + now + '</b>/100 <span class="comp-delta ' + (d > 0 ? 'good' : d < 0 ? 'bad' : '') + '">' +
              (d ? (d > 0 ? '+' : '−') + Math.abs(d) : '±0') + '</span></span>' +
            '<span class="core-bar comp-bar"><span style="width:' + Math.max(0, Math.min(100, now)) + '%"></span>' +
              '<i style="left:' + Math.max(0, Math.min(100, before)) + '%" title="vorher ' + before + '"></i></span>' +
            (core && Number.isInteger(draft.quiz[t.id]) ? '<span class="comp-quiz">Fachkonferenz ' + signedInt(QUIZ_EFFECT[draft.quiz[t.id]]) + '</span>' : '') +
            '</div>';
        }).join('') + '</div>' +
        '<p class="flyer-hint comp-legend">Der Strich im Balken zeigt die Kompetenz vor eurem Programm.</p>';
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


  // ---------- Wahlkampfauftakt ----------
  // Einstimmung je Partei: Überschrift und eine kurze (fiktive) Auftaktrede.
  const KICKOFF = {
    union: { title: 'Jetzt geht’s los!', place: 'Auftaktkundgebung der Union',
      speech: 'Wir sind die Kraft der Mitte – und wir wollen wieder die Nummer eins werden. Acht Wochen lang zeigen wir, dass wir es können: Wirtschaft ankurbeln, Sicherheit garantieren, Deutschland wieder nach vorne bringen. Packen wir’s an!' },
    afd: { title: 'Acht Wochen. Eine Chance.', place: 'Wahlkampfauftakt der AfD',
      speech: 'Wir haben einen langen Weg hinter uns. Jetzt wollen wir mehr als je zuvor: eine eigene Mehrheit. Wir gehen in jede Stadt und jedes Dorf, im Osten wie im Westen – und kämpfen um jede einzelne Stimme.' },
    spd: { title: 'Zusammen schaffen wir das!', place: 'Wahlkampfauftakt der SPD',
      speech: 'Wir kämpfen für die, die jeden Tag den Laden am Laufen halten: für gute Löhne, sichere Renten und Respekt. Die Umfragen sagen, wir liegen zurück – das hat uns noch nie aufgehalten. Auf geht’s, Genossinnen und Genossen!' },
    gruene: { title: 'Zuversicht wählen!', place: 'Wahlkampfauftakt von Bündnis 90/Die Grünen',
      speech: 'Wir stehen für Mut statt Angst. Für Klimaschutz, der allen nützt, und für ein Land, das zusammenhält. Acht Wochen – lasst uns mit jedem Gespräch, an jeder Haustür zeigen, dass Zukunft machbar ist.' },
    linke: { title: 'Jetzt wird’s gerecht!', place: 'Wahlkampfauftakt der Linken',
      speech: 'Mieten runter, Löhne rauf, Reiche zur Kasse: Dafür gehen wir in diesen Wahlkampf. Gemeinsam mit SPD und Grünen ist eine soziale Mehrheit möglich – wenn wir jetzt richtig Druck machen.' },
    bsw: { title: 'Neuer Name. Volle Kraft.', place: 'Wahlkampfauftakt des Bündnisses',
      speech: 'Soziale Gerechtigkeit und wirtschaftliche Vernunft – dafür stehen wir, jetzt auch im Namen. Die Fünf-Prozent-Hürde ist hoch, aber nicht zu hoch. Acht Wochen, um alle zu überraschen.' },
    fdp: { title: 'Das Comeback beginnt.', place: 'Wahlkampfauftakt der Freien Demokraten',
      speech: 'Viele haben uns schon abgeschrieben. Genau deshalb kämpfen wir jetzt mit allem, was wir haben: für Freiheit, Fortschritt und ein Land, das wieder mehr kann. Zurück in den Bundestag – Schritt für Schritt.' }
  };

  function showKickoff(game) {
    const p = E.party(game.party);
    const k = KICKOFF[game.party] || { title: 'Auf in den Wahlkampf!', place: 'Wahlkampfauftakt', speech: '' };
    const screen = $('screen-kickoff');
    show('kickoff');
    applyPartyTheme(screen, game.party);
    document.body.style.background = getComputedStyle(screen).getPropertyValue('--fl-paper').trim();
    const shares = E.nationalShares(game);
    const weeks = game.maxWeeks;
    $('ko-kicker').textContent = k.place + ' · noch ' + weeks + ' Wochen bis zur Bundestagswahl';
    $('ko-title').textContent = k.title;
    $('ko-slogan').textContent = '„' + game.program.slogan + '“';
    $('ko-candidate').textContent = candidateLine(game.candidate);
    const speaker = String(game.candidate || '').trim() && game.candidate !== DEFAULT_CANDIDATE ? game.candidate : 'Eure Spitzenkandidatur';
    $('ko-speech').innerHTML = '<p>„' + esc(k.speech) + '“</p><footer>— ' + esc(speaker) + ' bei der Auftaktkundgebung</footer>';
    const core = game.program.core.map(id => E.topicById(id));
    $('ko-stats').innerHTML =
      '<div class="ko-stat"><span class="ko-label">📊 Erste Umfrage</span><span class="ko-big">' + pct(shares[game.party]) + '</span></div>' +
      '<div class="ko-stat"><span class="ko-label">🏁 Euer Wahlziel</span><span class="ko-goal">' + esc(p.goalText) + '</span></div>' +
      '<div class="ko-stat"><span class="ko-label">💶 Wahlkampfkasse</span><span class="ko-big">' + money(game.money) + '</span></div>' +
      '<div class="ko-stat ko-core"><span class="ko-label">🎯 Eure Kernthemen</span><span class="ko-topics">' +
        core.map(t => '<span>' + t.icon + ' ' + esc(t.name) + '</span>').join('') + '</span></div>';
    $('ko-steps').innerHTML = [
      ['🗺️', 'Vor Ort kämpfen', 'Auf der Seite „Deutschland“ sucht ihr euch Bundesländer aus und geht mit Kundgebungen, Plakaten und Haustürwahlkampf auf Stimmenfang.'],
      ['📣', 'Themen setzen', 'Unter „Aktionen“ wählt ihr ein Thema und macht es mit TV-Spots, Social Media, Pressekonferenzen und Talkshows groß – am besten eure Kernthemen.'],
      ['📅', 'Woche für Woche', 'Jede Woche habt ihr ' + game.apMax + ' Aktionen. Danach gibt es eine neue Umfrage – und manchmal eine Eilmeldung, auf die ihr reagieren müsst.'],
      ['📺', 'TV-Duell in Woche ' + E.DUEL_WEEK, 'Kurz vor der Wahl kommt die Elefantenrunde. Wer bei den wichtigsten Themen sattelfest ist, punktet.']
    ].map(st => '<li><span class="ko-step-icon" aria-hidden="true">' + st[0] + '</span><div><b>' + st[1] + '</b><p>' + st[2] + '</p></div></li>').join('');
  }

  // Wahlkampf-Bildschirm und Dialoge im Design der gespielten Partei.
  function applyPartyTheme(el, partyId) {
    el.classList.add('party-site');
    el.dataset.party = partyId;
    el.style.setProperty('--pc', col(partyId));
    el.style.setProperty('--pon', onCol(partyId));
  }

  function startGame(game) {
    g = game;
    selState = 'NW';
    selTopic = null;
    $('feedback').textContent = '';
    $('local-feedback').textContent = '';
    if (g.phase !== 'campaign') { showElection(); return; }
    gameTab = 'map';
    newsSeen = g.log[0] || null; // Meldungen ab jetzt zählen als neu
    show('game');
    applyPartyTheme($('screen-game'), g.party);
    applyPartyTheme(document.querySelector('#modal .modal-box'), g.party);
    document.body.style.background = getComputedStyle($('screen-game')).getPropertyValue('--fl-paper').trim();
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
    markSlogan();
    renderProgramSummary();
  });

  function markSlogan() {
    $('slogan-chips').querySelectorAll('.slogan-card').forEach(c => {
      const on = c.dataset.slogan === draft.slogan;
      c.setAttribute('aria-pressed', String(on));
      c.querySelector('.core-badge').textContent = on ? '✓ Unser Slogan' : 'Auswählen';
    });
    const own = draft.slogan.trim() !== '' && D.PROGRAM_RULES.slogans.indexOf(draft.slogan) === -1;
    $('slogan-own').classList.toggle('active', own);
  }

  $('btn-program-reset').addEventListener('click', () => {
    const slogan = draft.slogan;
    const core = draft.core.slice();
    const quizResults = Object.assign({}, draft.quiz);
    draft = E.defaultProgram(chosenParty);
    draft.slogan = slogan;
    draft.core = core; // selbst gewählte Kernthemen bleiben erhalten
    draft.quiz = quizResults;
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
    const game = E.newGame(chosenParty, $('candidate').value, undefined, draft);
    g = game;
    save();
    showKickoff(game);
  });

  $('btn-kickoff-go').addEventListener('click', () => { if (g) startGame(g); });

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
    $('local-feedback').textContent = '';
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
