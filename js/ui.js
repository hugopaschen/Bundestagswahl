/* Oberfläche: verbindet die Spiel-Engine mit dem DOM. */
(function () {
  // Muss zur data-version in index.html passen (wird von tools/bump-version.js gesetzt).
  // Passen Seite und Skript nicht zusammen (alte Datei aus dem Browser-Cache), einmal neu laden.
  const APP_VERSION = '20261018-120658';
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
  const SPECTRUM = ['linke', 'tierschutz', 'gruene', 'volt', 'spd', 'bsw', 'fdp', 'fw', 'union', 'afd'];
  // Reihenfolge der Parteien in Umfragen: die großen sieben, dann ausgewiesene Kleinparteien, dann Sonstige.
  const MAIN_ORDER = ['union', 'afd', 'spd', 'gruene', 'linke', 'bsw', 'fdp'];
  const MINOR_ORDER = (D.MINORS || []).map(m => m.id);
  const CONTEST_ORDER = MAIN_ORDER.concat(MINOR_ORDER); // für Wahlkreise: alle, die gewinnen können
  const pollOrder = () => MAIN_ORDER.concat(g ? MINOR_ORDER.filter(m => E.isShown(g, m)) : []).concat([D.OTHER.id]);
  const merged = sh => (g ? E.mergeShares(g, sh) : sh);
  const short = p => (p === D.OTHER.id ? D.OTHER.short : E.party(p).short);
  // Die letzte Bundestagswahl: 2025 oder die letzte Wahl im Spiel (nach einer Legislaturperiode).
  const prevYear = () => (g && g.prevYear) || 2025;
  const prevTurnout = id => (g && g.prevTurnout ? (id ? g.prevTurnout.states && g.prevTurnout.states[id] : g.prevTurnout.DE) : (D.TURNOUT ? (id ? D.TURNOUT[id] : D.TURNOUT.DE) : null));
  // Bestätigung ohne Browser-Dialog: Der erste Klick fragt auf dem Knopf nach, der zweite führt aus.
  function confirmOnButton(btn, question) {
    if (btn.dataset.armed === '1') { btn.dataset.armed = ''; clearTimeout(btn._armT); if (btn._armHtml !== undefined) btn.innerHTML = btn._armHtml; return true; }
    btn._armHtml = btn.innerHTML;
    btn.dataset.armed = '1';
    btn.textContent = question;
    btn._armT = setTimeout(() => { btn.dataset.armed = ''; btn.innerHTML = btn._armHtml; }, 5000);
    return false;
  }

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
  let localTopic = ''; // Thema für Vor-Ort-Aktionen (leer = ohne Thema)
  let selGroup = 'jung'; // Zielgruppe für Online-Werbung
  let pendingLocal = null; // ausgewählte Vor-Ort-Aktion (wird nach Wahl der Zielgruppe durchgeführt)
  let localStep = 1;       // aktueller Schritt vor Ort: 1 Thema, 2 Aktion, 3 Zielgruppe
  let localGroup = '';     // Zielgruppe der Vor-Ort-Aktion ('' = alle)
  let mapMode = 'land';    // Karte: 'land' = Bundesländer, 'wk' = Wahlkreise
  let selWk = null;        // ausgewählter Wahlkreis (Nummer)
  let wkZoom = true;       // Wahlkreiskarte auf das gewählte Land gezoomt
  let selRival = null;   // Ziel eines Gegenangriffs
  let nextCarry = null;  // Übernahme aus der Legislaturperiode für den nächsten Wahlkampf

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
    ['intro', 'name', 'start', 'program', 'reveal', 'kickoff', 'game', 'election', 'term'].forEach(s => { $('screen-' + s).hidden = s !== screen; });
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
    renderHall();
  }

  // Ruhmeshalle: die besten Laufbahnen über alle Spiele (nur in diesem Browser gespeichert).
  const HALL_KEY = 'btw-ruhmeshalle';
  function loadHall() {
    try { return JSON.parse(localStorage.getItem(HALL_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveHall(game) {
    if (!game || !game.career || !window.BTW_TERM) return;
    const C = game.career;
    const L = window.BTW_TERM.legacy(C);
    const entry = { id: C.id, party: game.party, first: (C.leaders[0] || {}).name || game.candidate, leaders: (C.leaders || []).map(x => x.name),
      terms: L.terms, years: L.years, kanzlerJahre: L.kanzlerJahre, score: L.score, rating: L.rating, best: L.best ? L.best.share : null, at: Date.now() };
    const list = loadHall().filter(x => x.id !== entry.id).concat([entry]).sort((a, b) => b.score - a.score).slice(0, 10);
    try { localStorage.setItem(HALL_KEY, JSON.stringify(list)); } catch (e) { /* optional */ }
  }
  function renderHall() {
    const box = $('hall');
    if (!box) return;
    const list = loadHall();
    box.hidden = !list.length;
    if (!list.length) return;
    box.innerHTML = '<h2>🏆 Ruhmeshalle</h2><ol>' + list.slice(0, 5).map(x => '<li><span class="pill" style="--pc:' + col(x.party) + ';--pon:' + onCol(x.party) + '">' + esc(short(x.party)) + '</span> <b>' + esc(x.first) + '</b>' +
      (x.leaders.length > 1 ? ' und ' + (x.leaders.length - 1) + ' Nachfolge' + (x.leaders.length > 2 ? 'n' : '') : '') + ' · ' + x.terms + ' Legislatur' + (x.terms === 1 ? '' : 'en') +
      (x.kanzlerJahre ? ', ' + num1(x.kanzlerJahre).replace(',0', '') + ' Jahre Kanzleramt' : '') + ' · <b>' + x.score + '</b> Punkte <span class="muted">(' + esc(x.rating) + ')</span></li>').join('') + '</ol>';
  }

  function updateSignature() {
    const name = String($('candidate').value || '').trim();
    $('sign-name').textContent = name;
  }


  // ---------- Spielbildschirm ----------

  function renderGame() {
    const shares = E.pollShares(g);
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
    $('stat-ap').setAttribute('aria-label', g.ap + ' von ' + g.apMax + ' Terminen der Spitzenkandidatur übrig');
    $('stat-team').textContent = '●'.repeat(g.team || 0) + '○'.repeat(Math.max(0, (g.teamMax || 0) - (g.team || 0)));
    $('stat-team').setAttribute('aria-label', (g.team || 0) + ' von ' + (g.teamMax || 0) + ' Team-Einsätzen übrig');
    const diff = shares[me] - g.startShares[me];
    $('stat-poll').innerHTML = pct(shares[me]) + '<span class="poll-err"> ± ' + E.POLL_RANGE + '</span> <span class="small ' + (diff >= 0 ? 'pos' : 'neg') + '">' + signed(diff) + '</span>';
    $('week-bar').style.width = ((g.week - 1) / g.maxWeeks * 100) + '%';
    $('btn-end-week').textContent = g.week >= g.maxWeeks ? 'Zur Wahl! 🗳️' : 'Woche beenden';
    $('btn-end-week').dataset.armed = '';
    $('btn-end-week').disabled = !!(g.pendingEvent || g.duel || (g.week === E.DUEL_WEEK && !g.duelDone));

    renderMap();
    renderStateDetail();
    renderStateGroups();
    renderTopics();
    renderMoneyHint();
    renderActions();
    renderRivals();
    renderPollBars(shares);
    renderMobilization();
    renderFlows();
    renderFirewall();
    renderCandidate();
    renderGroups();
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
      const cur = gameTab === 'group' ? 'polls' : gameTab;
      if (b.dataset.tab === cur) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
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
    if (tab === 'polls' || tab === 'group') renderChart(); // Breite erst bekannt, wenn sichtbar
    const nav = $('game-nav');
    if (nav.getBoundingClientRect().top < 0 || window.scrollY > nav.offsetTop) window.scrollTo({ top: nav.offsetTop - 8, behavior: 'instant' });
  }

  document.querySelectorAll('#game-nav .game-tab').forEach(b => b.addEventListener('click', () => showGameTab(b.dataset.tab)));
  document.querySelectorAll('#map-mode button').forEach(b => b.addEventListener('click', () => { mapMode = b.dataset.mode; renderGame(); }));
  $('btn-group-back').addEventListener('click', () => showGameTab('polls'));
  // Wählergruppen im Land ein- und ausklappbar; der Zustand wird gemerkt.
  (function () {
    const d = $('sg-block');
    try { d.open = localStorage.getItem('btw-sg-open') === '1'; } catch (e) { /* optional */ }
    d.addEventListener('toggle', () => { try { localStorage.setItem('btw-sg-open', d.open ? '1' : '0'); } catch (e) { /* optional */ } });
  })();

  // Echte Umrisse der Bundesländer (js/germany.js). Kleine Länder bekommen ein Etikett mit Hinweislinie.
  const GEO = (typeof window !== 'undefined' && window.BTW_MAP) || null;
  const LABEL_AT = { BE: [556, 228], HB: [128, 190], HH: [336, 178], BB: [518, 330], NI: [238, 268] };
  // Gebräuchliche Kürzel auf der Karte (intern bleiben die ISO-Kürzel)
  const LABEL_TEXT = { ST: 'SA', SN: 'S', NW: 'NRW' };

  // ---------- Wahlkreise ----------
  const WKG = (typeof window !== 'undefined' && window.BTW_WK) || null;
  const wkInState = () => (selWk && E.wkByNr(selWk) && E.wkByNr(selWk).land === selState ? selWk : null);

  // Erfundene Namen für Direktkandidaturen (js/names.js, je Spiel ausgelost).
  const candName = (nr, p) => E.wkCandidate(g, nr, p);

  function wkBoxOf(list) {
    const b = [Infinity, Infinity, -Infinity, -Infinity];
    list.forEach(w => { b[0] = Math.min(b[0], w.box[0]); b[1] = Math.min(b[1], w.box[1]); b[2] = Math.max(b[2], w.box[2]); b[3] = Math.max(b[3], w.box[3]); });
    const pad = Math.max(b[2] - b[0], b[3] - b[1]) * 0.06;
    return [b[0] - pad, b[1] - pad, b[2] - b[0] + 2 * pad, b[3] - b[1] + 2 * pad];
  }

  // Wahlkreiskarte: Farbe = wer laut Umfrage vorn liegt, blass = knapp (unter 3 Punkten).
  function wkMapSvg(rows, opts) {
    const byNr = {};
    rows.forEach(x => { byNr[x.nr] = x; });
    const vb = opts.zoom ? wkBoxOf(E.WK_BY_STATE[opts.zoom] || E.WK_LIST) : [0, 0, WKG.w, WKG.h];
    let paths = '';
    let top = '';
    E.WK_LIST.forEach(w => {
      const x = byNr[w.nr];
      if (!x) return;
      const lead = x.win || x.lead;
      const cls = 'wk' + (x.margin < 3 ? ' close' : '') + (x.seated === false ? ' orphan' : '') + (w.nr === opts.sel ? ' selected' : '') +
        (opts.zoom && w.land !== opts.zoom ? ' other' : '') + (opts.hidden && opts.hidden(w) ? ' pending' : '');
      const p = '<path class="' + cls + '" data-wk="' + w.nr + '" data-land="' + w.land + '" d="' + w.d + '" style="fill:' + col(lead) + '"><title>' +
        esc('WK ' + w.nr + ' ' + w.name + ': ' + E.party(lead).short + ' vorn (+' + num1(x.margin) + ')' + (x.seated === false ? ' – ohne Sitz' : '')) + '</title></path>';
      if (w.nr === opts.sel) top = p; else paths += p;
    });
    return '<svg viewBox="' + vb.map(v => Math.round(v)).join(' ') + '" role="group" aria-label="Karte der Wahlkreise">' + paths + top + '</svg>';
  }

  function renderWkMap() {
    const map = $('map');
    const proj = E.wkProjection(g, true);
    map.innerHTML = wkMapSvg(proj, { zoom: wkZoom ? selState : null, sel: selWk });
    map.querySelectorAll('path.wk').forEach(pth => pth.addEventListener('click', () => {
      selWk = Number(pth.dataset.wk);
      selState = pth.dataset.land;
      renderGame();
    }));
    const direct = E.directCounts(proj);
    const me = g.party;
    const lg = $('wk-legend');
    lg.hidden = false;
    lg.innerHTML = '<div class="wk-zoom"><button type="button" class="btn small-btn" id="btn-wk-zoom">' +
      (wkZoom ? '🔍 Ganz Deutschland' : '🔍 ' + esc(E.stateById(selState).name) + ' heranzoomen') + '</button>' +
      '<span class="muted small">Blass = knapp (unter 3 Punkten Abstand)</span></div>' +
      '<p class="wk-direct"><b>Direktmandate laut Umfrage:</b> ' + CONTEST_ORDER.filter(p => direct[p] > 0)
        .map(p => '<span class="pill" style="--pc:' + col(p) + ';--pon:' + onCol(p) + '">' + short(p) + ' ' + direct[p] + '</span>').join(' ') + '</p>' +
      (E.pollShares(g)[me] < 7 ? '<p class="wk-gm">Grundmandatsklausel: Mit <b>' + E.GRUNDMANDATE + ' Direktmandaten</b> zieht ihr auch unter 5 % ein – laut Umfrage gewinnt ihr <b>' + (direct[me] || 0) + ' von ' + E.GRUNDMANDATE + '</b>.</p>' : '');
    $('btn-wk-zoom').addEventListener('click', () => { wkZoom = !wkZoom; renderGame(); });
  }

  // Seitenleiste in der Wahlkreis-Ansicht: gewählter Wahlkreis und alle Wahlkreise des Landes.
  function renderWkPanel() {
    const box = $('wk-panel');
    const st = E.stateById(selState);
    const list = (E.WK_BY_STATE[st.id] || []).map(w => Object.assign({ w }, E.wkShares(g, w.nr, true)));
    const me = g.party;
    let html = '';
    const cur = wkInState() && list.find(x => x.w.nr === selWk);
    if (cur) {
      const order = CONTEST_ORDER.slice().sort((a, b) => cur.shares[b] - cur.shares[a]).slice(0, 4);
      const max = cur.shares[order[0]];
      html += '<div class="wk-detail"><p class="eyebrow">Wahlkreis ' + cur.w.nr + '</p><h3>' + esc(cur.w.name) + '</h3>' +
        '<p class="muted small">Erststimmen laut Umfrage (' + prevYear() + ': ' + esc(short((g.prevWk && g.prevWk[cur.w.nr]) || (cur.w.win === 'sonstige' ? 'union' : cur.w.win))) + ' vorn' + (cur.w.seated || g.prevWk ? '' : ', aber ohne Sitz') + ')</p>' +
        order.map(p => '<div class="wk-row' + (p === me ? ' me' : '') + '"><span class="wk-cand"><b>' + esc(candName(cur.w.nr, p)) + '</b><small>' + short(p) + '</small></span>' +
          '<span class="wk-bar"><i style="width:' + Math.max(2, cur.shares[p] / max * 100) + '%;background:' + col(p) + '"></i></span><span class="wk-val">' + pct(cur.shares[p]) + '</span></div>').join('') +
        '<p class="small">' + (cur.lead === me ? '✅ Ihr liegt vorn – mit ' + num1(cur.margin) + ' Punkten Vorsprung.' :
          '➡️ Euch fehlen ' + num1(cur.shares[cur.lead] - cur.shares[me]) + ' Punkte auf ' + short(cur.lead) + '.') +
        ' Wählt diesen Wahlkreis vor Ort als <b>Schwerpunkt</b> oder startet eine <b>Erststimmen-Kampagne</b>.</p></div>';
    }
    list.sort((a, b) => (Math.abs(a.shares[a.lead] - a.shares[me]) - Math.abs(b.shares[b.lead] - b.shares[me])));
    html += '<h4>Wahlkreise in ' + esc(st.name) + ' <span class="muted small">(für euch am knappsten zuerst)</span></h4><ul class="wk-list">' +
      list.map(x => '<li><button type="button" class="wk-item' + (x.w.nr === selWk ? ' on' : '') + '" data-wk="' + x.w.nr + '">' +
        '<span class="wk-name">' + x.w.nr + ' · ' + esc(x.w.name) + '</span>' +
        '<span class="pill" style="--pc:' + col(x.lead) + ';--pon:' + onCol(x.lead) + '">' + short(x.lead) + ' +' + num1(x.margin) + '</span>' +
        '<span class="wk-me">ihr ' + pct(x.shares[me]) + '</span></button></li>').join('') + '</ul>';
    box.innerHTML = html;
    box.querySelectorAll('.wk-item').forEach(b => b.addEventListener('click', () => { selWk = Number(b.dataset.wk); renderGame(); }));
  }

  function renderMap() {
    const map = $('map');
    const wkMode = mapMode === 'wk' && WKG;
    document.querySelectorAll('#map-mode button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === (wkMode ? 'wk' : 'land'))));
    $('map-hint').textContent = wkMode ? 'Die 299 Wahlkreise: Farbe = wer bei den Erststimmen vorn liegt (laut Umfrage). Tippt einen Wahlkreis an.' :
      'Farbe = führende Partei · Zahl = euer Umfragewert im Land in Prozent. Tippe ein Land an.';
    $('state-detail').hidden = !!wkMode;
    $('wk-panel').hidden = !wkMode;
    $('wk-legend').hidden = !wkMode;
    if (wkMode) { renderWkMap(); renderWkPanel(); return; }
    if (!GEO) { map.textContent = 'Karte nicht verfügbar.'; return; }
    let shapes = '';
    let labels = '';
    let selected = '';
    D.STATES.forEach(st => {
      const geo = GEO.states[st.id];
      if (!geo) return;
      const s = E.pollStateShares(g, st.id);
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
  let CHART_ORDER = MAIN_ORDER.concat([D.OTHER.id]); // wie auf der Seite „Umfragen“ (inkl. ausgewiesener Kleinparteien)

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
    const s = merged(E.pollStateShares(g, st.id));
    // Feste Skala für alle Länder (0–50 %), damit die 5-%-Linie beim Wechsel nicht springt; höhere Werte werden gekappt.
    const top = CHART_TOP;
    const box = $('state-detail');
    const order = pollOrder();
    if (!box.querySelector('.col-chart') || order.join() !== CHART_ORDER.join()) { CHART_ORDER = order; buildStateChart(box); }
    box.querySelector('.cc-title').innerHTML = esc(st.name) + ' <span class="muted small">· ' + num1(st.voters) + ' Mio. Wahlberechtigte · erwartete Wahlbeteiligung ' + pct(E.turnout(g, st.id)) +
      (prevTurnout(st.id) ? ' (' + prevYear() + ': ' + pct(prevTurnout(st.id)) + ')' : '') + '</span>';
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

  function groupNames(ids) {
    return ids.map(id => { const k = D.GROUPS.find(x => x.id === id); return k.icon + ' ' + k.short; }).join(', ');
  }

  function topicGroupsLine(topic) {
    const fans = D.GROUPS.filter(k => k.topics[topic]).sort((a, b) => b.topics[topic] - a.topics[topic]).map(k => k.id);
    return '<p class="td-groups">' + (fans.length ? 'Besonders wichtig für: <b>' + groupNames(fans) + '</b>' : 'Kein Lieblingsthema einer bestimmten Wählergruppe.') + '</p>';
  }

  function stolenLine(topic) {
    const thief = E.stolenBy(g, topic);
    if (!thief) return '';
    return '<p class="td-stolen">⚠️ ' + esc(E.party(thief).name) + ' macht euch dieses Thema streitig: Eure Aktionen wirken bis Woche ' +
      g.steal[topic].until + ' um 30 % schwächer.</p>';
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
        '</div></div>' + topicGroupsLine(t.id) + stolenLine(t.id);
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
      const thief = E.stolenBy(g, t.id);
      b.innerHTML = (core ? '<span class="tc-badge">🎯 Kernthema</span>' : '') +
        (thief ? '<span class="tc-stolen" title="' + esc(E.party(thief).name) + ' macht euch das Thema streitig">⚠️ ' + esc(E.party(thief).short) + '</span>' : '') +
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
    if (a.id === 'tvspot') return (comp >= 60 ? 'eure Stärke – lohnt sich' : comp < 40 ? 'schwaches Thema – wenig Wirkung' : 'mittlere Wirkung') + ' · Sendezeit wird jede Woche teurer';
    if (a.id === 'presse') return comp >= 50 ? 'rückt eure Stärke in den Fokus' : 'Vorsicht: rückt eine Schwäche in den Fokus';
    return '';
  }

  // Schlüssel, unter dem der Spielkern die Abnutzung einer Aktion zählt.
  function usageKey(a) {
    if (a.id === 'talkshow') return 'talkshow';
    if (a.scope === 'region') return a.id + ':' + selState + ':' + (localTopic || '_');
    if (a.scope === 'topic') return a.id + ':' + selTopic;
    if (a.scope === 'group') return a.id + ':' + selGroup;
    if (a.scope === 'rival') return a.id + ':' + selRival;
    if (a.id === 'briefwahl') return 'briefwahl';
    return null;
  }

  // Wirkung im Vergleich zu einer frischen Aktion (Abnutzung × verbrauchte Zielgruppen).
  function freshness(a) {
    if (a.id === 'spenden' || a.id === 'presse') return 1;
    if (a.scope === 'group' || a.scope === 'rival' || a.id === 'briefwahl') {
      const n = g.usage[usageKey(a)] || 0;
      return 1 / (1 + 0.8 * n);
    }
    const key = usageKey(a);
    const n = (key && g.usage[key]) || 0;
    let f = 1 / (1 + 0.8 * n);
    f *= E.groupEfficiency(g, g.party, a.id, a.scope === 'topic' ? selTopic : a.scope === 'region' ? (localTopic || null) : null, a.scope === 'region' ? selState : null);
    return f;
  }

  function reachLine(a) {
    if (!D.CHANNELS[a.id]) return '';
    const mix = E.groupMix(a.id, a.scope === 'topic' ? selTopic : a.scope === 'region' ? (localTopic || null) : null, a.scope === 'region' ? selState : null);
    const top = E.GROUP_IDS.slice().sort((x, y) => mix[y] - mix[x]).slice(0, 2);
    return '<span class="areach">Erreicht v. a. ' + groupNames(top) + '</span>';
  }

  function actionTarget(a) {
    if (a.scope === 'region') return { state: selState, topic: localTopic || null, group: localGroup || null, wk: wkInState() };
    if (a.scope === 'group') return { group: selGroup, topic: selTopic };
    if (a.scope === 'rival') return { rival: selRival, topic: selTopic };
    return { state: selState, topic: selTopic };
  }

  function actionButton(a, extra) {
    const cost = E.actionCost(a.id, a.scope === 'group' ? selGroup : selState, g);
    const spendBlocked = a.id === 'spenden' && !E.spendenAvailable(g);
    const postalBlocked = a.id === 'briefwahl' && g.week < E.POSTAL_START - 1;
    if (a.id === 'briefwahl') extra = postalBlocked ? 'Unterlagen werden ab Woche ' + (E.POSTAL_START - 1) + ' verschickt' : 'sichert Stimmen vor späten Skandalen · ✉️ ' + Math.round(E.postalCast(g) * 100) + ' % schon abgegeben';
    const disabled = !E.canAct(g, a.id) || (a.scope === 'topic' && !selTopic) || (a.scope === 'rival' && !selRival) || g.money + 1e-9 < cost || spendBlocked || postalBlocked;
    if (a.id === 'spenden') extra = spendBlocked ? 'Diese Woche schon veranstaltet – wieder ab nächster Woche' : 'bringt ca. ' + money(E.spendenYield(g)) + ' · jedes Mal weniger';
    const f = freshness(a);
    const key = usageKey(a);
    const repeated = key && g.usage[key] > 0.1 && a.id !== 'presse';
    const worn = f < 0.92 ? '<span class="aworn">' + (repeated ? '♻️ Abgenutzt' : '👥 Zielgruppen schon stark umworben') +
      ': wirkt nur noch zu ca. ' + Math.round(f * 100) + ' %</span>' : '';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'action';
    b.disabled = disabled;
    b.innerHTML = '<span class="aname">' + a.icon + ' ' + esc(a.name) + '</span>' +
      '<span class="adesc">' + esc(a.desc) + '</span>' +
      (extra ? '<span class="ahint">' + esc(extra) + '</span>' : '') + reachLine(a) + worn +
      '<span class="ameta">' + (E.isTeamAction(a.id) ? '<span class="apool team">👥 Team-Einsatz</span>' : '<span class="apool cand">🎤 Termin</span>') + ' · ' + (cost ? money(cost) : 'kostenlos') + '</span>';
    if (a.scope === 'region') {
      // Vor Ort: Aktion erst auswählen, dann Zielgruppe wählen und durchführen.
      if (pendingLocal === a.id) b.classList.add('selected');
      b.setAttribute('aria-pressed', String(pendingLocal === a.id));
      b.addEventListener('click', () => {
        pendingLocal = a.id;
        localStep = 3;
        renderGame();
        const t = $('local-steps'); if (t) t.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
      return b;
    }
    b.addEventListener('click', () => {
      runAction(a, actionTarget(a), res => {
        $(a.scope === 'region' ? 'local-feedback' : 'feedback').textContent = res.text;
      });
    });
    return b;
  }

  // Vor jeder Aktion: drei Prüfungen. Meist drei Situationen (aus zehn je Aktion); bei Vor-Ort-Aktionen
  // mit Thema eine Situation und zwei Fragen von Bürgerinnen und Bürgern zum Thema. Gute Entscheidungen
  // und richtige Antworten machen die Aktion wirksamer, schlechte schwächen sie; richtige Antworten
  // stärken außerdem die Kompetenz im Thema. Ohne Vorbereitung wirkt die Aktion 10 % schwächer.
  // Szenen: jede Aktion mit eigenen Entscheidungen, eigenem Risiko und eigener Ergebniskarte (js/scenes.js).
  function runScene(a, target, done, scene) {
    const st = target.state ? E.stateById(target.state) : null;
    const tp = target.topic ? E.topicById(target.topic) : null;
    const S = { meter: scene.meter0 || 50, q: 0, fx: {}, flags: {}, cq: { right: 0, wrong: 0 }, quizRight: 0, quizTotal: 0 };
    let i = 0;
    const head = a.icon + ' ' + a.name + (st && a.scope === 'region' ? ' · ' + st.name : '') + (tp ? ' · ' + tp.name : '');
    const meterHtml = () => (scene.meter ? '<div class="sc-meter"><span>' + esc(scene.meter) + '</span><div class="sc-bar"><i style="width:' + Math.max(0, Math.min(100, S.meter)) + '%"></i></div><b>' + Math.round(S.meter) + '</b></div>' : '');
    const merge = (fx) => { if (!fx) return; Object.keys(fx).forEach(k => { if (typeof fx[k] === 'number' && k !== 'money' && k !== 'scandal') S.fx[k] = (S.fx[k] || 0) + fx[k]; else if (k === 'groups') { S.fx.groups = S.fx.groups || {}; Object.keys(fx.groups).forEach(x => { S.fx.groups[x] = (S.fx.groups[x] || 0) + fx.groups[x]; }); } else S.fx[k] = fx[k]; }); };
    const apply = o => {
      let r = o;
      if (o.roll) r = Object.assign({}, Math.random() < o.roll.p ? o.roll.win : o.roll.lose);
      S.meter = Math.max(0, Math.min(100, S.meter + (r.m || 0)));
      S.q += r.q || 0;
      merge(r.fx);
      if (r.flag) S.flags[r.flag] = true;
      return r;
    };
    const feedback = (title, body, m) => {
      i += 1;
      openModal(head, title, meterHtml() + (m ? '<p class="sc-delta ' + (m > 0 ? 'pos' : 'neg') + '">' + (m > 0 ? '▲ +' : '▼ ') + m + '</p>' : '') + body,
        [{ label: i < scene.steps.length ? 'Weiter →' : 'Ergebnis →', primary: true, onClick: () => (i < scene.steps.length ? step() : finish()) }]);
      $('modal').classList.add('scen-modal');
    };
    const step = () => {
      const it = scene.steps[i];
      if (it.title === '⚠️ Störer!') S.flags.stoerer = true;
      if (it.kind === 'cq') {
        const ids = E.pickCitizenQuestions(g, it.topic, 1);
        const q = E.CITIZEN_QUESTIONS[it.topic][ids[0]];
        openModal(head + ' · Bürgerfrage', '🙋 ' + E.topicById(it.topic).name, meterHtml() + '<p class="scen-text">' + esc(q.q) + '</p>',
          q.a.map((x, k) => ({ label: x, onClick: () => {
            const ok = k === q.c;
            if (ok) S.cq.right += 1; else S.cq.wrong += 1;
            S.q += ok ? 1 : -1;
            S.meter = Math.max(0, Math.min(100, S.meter + (ok ? 8 : -8)));
            feedback(ok ? '✅ Richtig' : '❌ Leider falsch', (ok ? '' : '<p>Richtig wäre: <b>' + esc(q.a[q.c]) + '</b></p>') + '<p>' + esc(q.e) + '</p>', ok ? 8 : -8);
          } })));
      } else if (it.kind === 'quiz') {
        openModal(head + ' · Frage', '🎙️ ' + (st ? st.name : ''), meterHtml() + '<p class="scen-text">' + esc(it.q) + '</p>',
          it.a.map((x, k) => ({ label: x, onClick: () => {
            const ok = k === it.c;
            S.quizTotal += 1;
            if (ok) S.quizRight += 1;
            S.q += ok ? 1 : -1;
            S.meter = Math.max(0, Math.min(100, S.meter + (ok ? 10 : -12)));
            feedback(ok ? '✅ Richtig' : '❌ Peinlich – falsch', '<p>' + esc(it.e) + '</p>', ok ? 10 : -12);
          } })));
      } else {
        openModal(head, it.title, meterHtml() + '<p class="scen-text">' + esc(it.text) + '</p>',
          it.options.map(o => ({ label: o.label, hint: o.hint || '', onClick: () => {
            const before = S.meter;
            const r = apply(o);
            feedback(r.q > 0 ? '👍 ' + it.title : r.q < 0 ? '👎 ' + it.title : '😐 ' + it.title, '<p>' + esc(r.reply || '') + '</p>', Math.round(S.meter - before));
          } })));
      }
      $('modal').classList.add('scen-modal');
    };
    const finish = skip => {
      const pre = { info: { stateShare: st ? E.pollStateShares(g, st.id)[g.party] : null } };
      const card = skip ? null : scene.result(S, pre);
      const fx = Object.assign({}, S.fx);
      if (card && card.headline) fx.headline = card.headline;
      const t = Object.assign({}, target, { prep: skip ? 'skip' : Math.max(-3, Math.min(3, Math.round(S.q))), fx });
      if (!skip && (S.cq.right || S.cq.wrong)) t.cq = S.cq;
      const res = E.performAction(g, a.id, t);
      if (done) done(res);
      save();
      renderGame();
      if (!res.ok) { closeModal(); toast(res.text); return; }
      const rows = card ? card.rows : [];
      const poster = card && card.poster ? '<div class="sc-poster sc-' + card.poster.motif + '"><b>' + esc(card.poster.motif === 'face' ? card.poster.cand : card.poster.motif === 'topic' ? card.poster.topic : 'Die anderen? Nein danke.') + '</b><span>„' + esc(card.poster.slogan) + '“</span><i>' + esc(E.party(g.party).short) + '</i></div>' : '';
      openModal(head, card && card.headline ? '📰 „' + card.headline + '“' : 'Ergebnis', poster +
        (rows.length ? '<table class="sc-card">' + rows.map(r => '<tr><td>' + esc(r[0]) + '</td><td><b>' + esc(r[1]) + '</b></td></tr>').join('') + '</table>' : '') +
        '<p class="sc-result">' + esc(res.text) + '</p>' + (!skip ? '<p class="muted small">Eure Entscheidungen: Wirkung ' + (t.prep >= 0 ? '+' : '−') + Math.abs(t.prep * 15) + ' %.</p>' : ''),
        [{ label: 'Weiter', primary: true, onClick: () => closeModal() }]);
      $('modal').classList.add('scen-modal');
    };
    openModal(head, scene.team ? 'Eine Entscheidung fürs Team' : 'Auftritt von ' + g.candidate, '<p>' + esc(scene.intro) + '</p>' + meterHtml(),
      [{ label: 'Los geht’s', primary: true, onClick: step },
        { label: 'Ohne Vorbereitung durchführen', hint: '−10 % Wirkung', onClick: () => finish(true) },
        { label: 'Abbrechen', onClick: () => closeModal() }]);
    $('modal').classList.add('scen-modal');
  }

  function runAction(a, target, done) {
    if (!E.canAct(g, a.id)) return;
    const scene = window.BTW_SCENES && window.BTW_SCENES.has(a.id) ? window.BTW_SCENES.build(a.id, {
      g, E, D, a, st: target.state ? E.stateById(target.state) : null, tp: target.topic ? E.topicById(target.topic) : null,
      group: target.group, rival: target.rival, cand: g.candidate, partyShort: E.party(g.party).short }) : null;
    if (scene) { runScene(a, target, done, scene); return; }
    let score = 0;
    const cq = { right: 0, wrong: 0 };
    const finish = prep => {
      const t = Object.assign({}, target, { prep });
      if (prep !== 'skip' && (cq.right || cq.wrong)) t.cq = cq;
      const res = E.performAction(g, a.id, t);
      closeModal();
      if (done) done(res);
      toast(res.text);
      save();
      renderGame();
    };
    const scen = (E.SCENARIOS && E.SCENARIOS[a.id]) || [];
    const tp = target.topic ? E.topicById(target.topic) : null;
    const withQuestions = tp && E.CQ_ACTIONS.indexOf(a.id) !== -1 && ((E.CITIZEN_QUESTIONS[tp.id] || []).length >= 2);
    if (!scen.length && !withQuestions) { finish(0); return; }
    const st = target.state ? E.stateById(target.state) : null;
    const fillRaw = txt => String(txt)
      .replace(/\{land\}/g, st ? st.name : 'eurem Land')
      .replace(/\{thema\}/g, tp ? tp.name : 'eurer Wahl')
      .replace(/\{kandidat\}/g, g.candidate);
    const fill = txt => esc(fillRaw(txt));
    const head = 'Vorbereitung · ' + a.name;
    const teamAct = E.isTeamAction(a.id);
    let items = [];
    let i = 0;
    const marks = [];
    const label = n => head + ' · ' + (items[n].type === 'cq' ? 'Bürgerfrage' : 'Situation') + ' ' + (n + 1) + ' von ' + items.length;
    const step = () => {
      const it = items[i];
      if (it.type === 'cq') {
        const q = E.CITIZEN_QUESTIONS[tp.id][it.idx];
        const order = q.a.map((x, k) => k).sort(() => Math.random() - 0.5);
        openModal(label(i), '🙋 ' + tp.icon + ' ' + tp.name,
          '<p class="scen-text">' + esc(q.q) + '</p><p class="muted small">Was antwortet ' + (teamAct ? 'euer Team' : esc(g.candidate)) + '?</p>',
          order.map(k => ({ label: q.a[k], onClick: () => answerQ(q, k) })));
      } else {
        const sc = scen[it.idx];
        const opts = sc.o.slice().sort(() => Math.random() - 0.5);
        openModal(label(i), a.icon + ' ' + a.name,
          '<p class="scen-text">' + fill(sc.s) + '</p><p class="muted small">Wie reagiert ihr?</p>',
          opts.map(o => ({ label: fillRaw(o.t), onClick: () => answer(o) })));
      }
      $('modal').classList.add('scen-modal');
    };
    const next = (title, body) => {
      i += 1;
      openModal(label(i - 1), title, body,
        [{ label: i < items.length ? 'Weiter →' : 'Zur Auswertung →', primary: true, onClick: () => (i < items.length ? step() : summary()) }]);
    };
    const answer = o => {
      score += o.q;
      marks.push(o.q);
      next(o.q > 0 ? '👍 Gute Entscheidung' : o.q < 0 ? '👎 Das ging daneben' : '😐 Geht so', '<p>' + fill(o.f) + '</p>');
    };
    const answerQ = (q, k) => {
      const ok = k === q.c;
      score += ok ? 1 : -1;
      marks.push(ok ? 1 : -1);
      if (ok) cq.right += 1; else cq.wrong += 1;
      next(ok ? '✅ Richtig beantwortet' : '❌ Leider falsch',
        (ok ? '' : '<p>Richtig wäre gewesen: <b>' + esc(q.a[q.c]) + '</b></p>') + '<p>' + esc(q.e) + '</p>' +
        '<p class="muted small">Kompetenz ' + esc(tp.name) + ': ' + (ok ? '+' : '−') + E.CQ_COMP + ' (wenn ihr die Aktion durchführt)</p>');
    };
    const summary = () => {
      const pctEff = Math.round(score * 15);
      const icons = marks.map(q => (q > 0 ? '👍' : q < 0 ? '👎' : '😐')).join(' ');
      const comp = cq.right || cq.wrong ? '<p>Bürgerfragen: ' + cq.right + ' von ' + (cq.right + cq.wrong) + ' richtig – Kompetenz ' + esc(tp.name) + ' ' +
        ((cq.right - cq.wrong) * E.CQ_COMP >= 0 ? '+' : '−') + Math.abs((cq.right - cq.wrong) * E.CQ_COMP) + '.</p>' : '';
      openModal(head, score > 0 ? 'Gut vorbereitet!' : score < 0 ? 'Holprige Vorbereitung' : 'Durchwachsene Vorbereitung',
        '<p class="scen-score">' + icons + '</p><p>Die Aktion wirkt dadurch <b>' + (pctEff >= 0 ? '+' : '−') + Math.abs(pctEff) + ' %</b> ' +
        (pctEff >= 0 ? 'stärker' : 'schwächer') + ' als üblich' + (a.id === 'buerger' || a.id === 'talkshow' || a.id === 'angriff' ? ', und die Erfolgschance ändert sich entsprechend' : '') + '.</p>' + comp,
        [{ label: '▶ ' + a.name + ' durchführen', primary: true, onClick: () => finish(score) }]);
    };
    const intro = withQuestions
      ? '<p>Vor Ort warten eine Situation und <b>zwei Fragen von Bürgerinnen und Bürgern zum Thema ' + esc(tp.name) + '</b> auf euch. Jede gute Entscheidung und jede richtige Antwort macht die Aktion <b>15 % wirksamer</b>, jede schlechte <b>15 % schwächer</b>. Richtige Antworten stärken eure Kompetenz im Thema, falsche schwächen sie.</p>'
      : teamAct
        ? '<p>Euer Team ist im Einsatz – eine Situation müsst ihr entscheiden. Eine gute Entscheidung macht den Einsatz <b>15 % wirksamer</b>, eine schlechte <b>15 % schwächer</b>.</p>'
        : '<p>Bevor es losgeht, müsst ihr drei Situationen meistern. Jede gute Entscheidung macht die Aktion <b>15 % wirksamer</b>, jede schlechte <b>15 % schwächer</b>.</p>';
    openModal(head, withQuestions ? 'Situation und Bürgerfragen' : teamAct ? 'Eine Situation – wie entscheidet ihr?' : 'Drei Situationen – wie reagiert ihr?', intro,
      [{ label: 'Los geht’s', primary: true, onClick: () => {
        const sIds = E.pickScenarios(g, a.id, withQuestions || teamAct ? 1 : 3).map(idx => ({ type: 'scen', idx }));
        const qIds = withQuestions ? E.pickCitizenQuestions(g, tp.id, 2).map(idx => ({ type: 'cq', idx })) : [];
        items = sIds.concat(qIds);
        step();
      } },
        { label: 'Ohne Vorbereitung durchführen', hint: '−10 % Wirkung', onClick: () => finish('skip') },
        { label: 'Abbrechen', onClick: () => closeModal() }]);
  }

  // Schritt 3 vor Ort: Zielgruppe wählen und Aktion durchführen.
  function renderLocalTarget() {
    const box = $('local-target');
    if (!box) return;
    const a = pendingLocal && E.ACTIONS.find(x => x.id === pendingLocal);
    if (!a || localStep !== 3) { box.hidden = true; box.innerHTML = ''; return; }
    const st = E.stateById(selState);
    const w = E.stateWeights(st.id);
    const tf = E.localTopicFactor(g, st.id, localTopic || null);
    const all = E.groupEfficiency(g, g.party, a.id, localTopic || null, st.id) * E.channelFit(a.id, st.id) * tf;
    if (localGroup && !(w[localGroup] > 0)) localGroup = '';
    const pctOf = v => Math.round(v * 100);
    const chip = (id, icon, name, v, extra) => '<button type="button" class="tg-chip' + (localGroup === id ? ' on' : '') + '" data-g="' + id + '" aria-pressed="' + (localGroup === id) + '">' +
      '<span class="tg-name">' + icon + ' ' + esc(name) + '</span><span class="tg-val ' + (v >= 1.05 ? 'pos' : v < 0.9 ? 'neg' : '') + '">Wirkung ' + pctOf(v) + ' %</span>' + (extra || '') + '</button>';
    let html = '<h4>3 · Zielgruppe für „' + esc(a.name) + '“' + (localTopic ? ' zum Thema ' + esc(E.topicById(localTopic).name) : '') + '</h4>' +
      '<p class="muted small">Wen wollt ihr ansprechen? Die Wirkung hängt davon ab, ob Aktion und Thema zur Gruppe passen, wie groß sie im Land ist – und ob ihr sie <b>mit diesem Thema</b> schon umworben habt.</p>' +
      '<div class="tg-all">' + chip('', '👥', 'Alle Gruppen', all) + '</div>';
    html += D.GROUP_DIMS.map(dim => '<div class="tg-dim"><span class="tg-dim-name">' + esc(dim.name) + '</span><div class="tg-row">' +
      D.GROUPS.filter(k => k.dim === dim.id && w[k.id] > 0).map(k => {
        const v = E.focusFactor(g, a.id, localTopic || null, st.id, k.id) * tf;
        const sat = E.groupSat(g, k.id, g.party, localTopic || null, st.id, a.id) < 0.8;
        return chip(k.id, k.icon, k.short, v, sat ? '<span class="tg-sat">schon umworben</span>' : '');
      }).join('') + '</div></div>').join('');
    // Wahlkreis-Schwerpunkt (bei der Erststimmen-Kampagne Pflicht).
    const wks = (E.WK_BY_STATE[st.id] || []).map(w => Object.assign({ w }, E.wkShares(g, w.nr, true)));
    const me = g.party;
    wks.sort((x, y) => Math.abs(x.shares[x.lead] - x.shares[me]) - Math.abs(y.shares[y.lead] - y.shares[me]));
    const needWk = a.id === 'erststimme';
    if (needWk && !wkInState() && wks.length) selWk = wks[0].w.nr;
    if (wks.length) {
      html += '<label class="local-topic-row wk-focus"><span>✖️ Wahlkreis-Schwerpunkt' + (needWk ? '' : ' (optional)') + '</span><select id="wk-focus">' +
        (needWk ? '' : '<option value="">Kein Schwerpunkt – ganzes Land</option>') +
        wks.map(x => '<option value="' + x.w.nr + '"' + (x.w.nr === wkInState() ? ' selected' : '') + '>' + x.w.nr + ' · ' + esc(x.w.name) + ' – ' +
          (x.lead === me ? 'ihr vorn +' + num1(x.margin) : short(x.lead) + ' vorn, euch fehlen ' + num1(x.shares[x.lead] - x.shares[me])) + '</option>').join('') +
        '</select></label><p class="muted small">' + (needWk ? 'Die Kampagne wirkt nur im gewählten Wahlkreis.' :
          'Mit Schwerpunkt fließt ein Teil der Wirkung gezielt in die Erststimme dieses Wahlkreises – im übrigen Land wirkt die Aktion etwas schwächer.') + '</p>';
    }
    const cost = E.actionCost(a.id, selState, g);
    const ok = E.canAct(g, a.id) && g.money + 1e-9 >= cost && (!needWk || wkInState());
    const who = localGroup ? D.GROUPS.find(k => k.id === localGroup).name : 'alle Gruppen';
    html += '<div class="tg-go"><button type="button" class="btn primary" id="btn-local-go"' + (ok ? '' : ' disabled') + '>▶ ' + esc(a.name) +
      (localTopic ? ' zu ' + esc(E.topicById(localTopic).name) : '') + ' für ' + esc(who) + ' in ' + esc(st.name) + ' (' + (cost ? money(cost) : 'kostenlos') + ')</button>' +
      '<button type="button" class="link-btn" id="btn-local-cancel">← Andere Aktion</button></div>';
    box.innerHTML = html;
    box.hidden = false;
    box.querySelectorAll('.tg-chip').forEach(c => c.addEventListener('click', () => { localGroup = c.dataset.g; renderGame(); }));
    if ($('wk-focus')) $('wk-focus').addEventListener('change', e => { selWk = e.target.value ? Number(e.target.value) : null; renderGame(); });
    $('btn-local-cancel').addEventListener('click', () => { pendingLocal = null; localStep = 2; renderGame(); });
    $('btn-local-go').addEventListener('click', () => {
      runAction(a, actionTarget(a), res => {
        $('local-feedback').textContent = res.text;
        if (res.ok) { pendingLocal = null; localStep = 1; }
      });
    });
  }

  // Online-Werbung für eine Zielgruppe und Gegenangriff (Aktionen-Seite).
  function renderExtraActions() {
    const gs = $('online-group');
    if (!gs) return;
    gs.innerHTML = D.GROUP_DIMS.map(dim => '<optgroup label="' + esc(dim.name) + '">' +
      D.GROUPS.filter(k => k.dim === dim.id).map(k => '<option value="' + k.id + '"' + (k.id === selGroup ? ' selected' : '') + '>' +
        k.icon + ' ' + esc(k.name) + ' (' + Math.round(k.weight * 100) + ' %)</option>').join('') + '</optgroup>').join('');
    if (!gs.dataset.bound) { gs.addEventListener('change', () => { selGroup = gs.value; renderGame(); }); gs.dataset.bound = '1'; }
    const k = D.GROUPS.find(x => x.id === selGroup);
    const tp = selTopic ? E.topicById(selTopic) : null;
    const fav = tp && (k.topics[tp.id] || 1) >= 1.3;
    const online = E.ACTIONS.find(a => a.id === 'online');
    $('online-action').innerHTML = '';
    $('online-action').appendChild(actionButton(online, 'für ' + k.name + (tp ? ' · Thema ' + tp.name + (fav ? ' – Lieblingsthema der Gruppe 👍' : '') : ' · ohne Thema (oben wählbar)')));

    const rs = $('rival-party');
    const rivals = MAIN_ORDER.filter(p => p !== g.party);
    if (!selRival || rivals.indexOf(selRival) === -1) selRival = rivals[0];
    const sh = E.nationalShares(g);
    rs.innerHTML = rivals.map(p => '<option value="' + p + '"' + (p === selRival ? ' selected' : '') + '>' + esc(E.party(p).name) + '</option>').join('');
    if (!rs.dataset.bound) { rs.addEventListener('change', () => { selRival = rs.value; renderGame(); }); rs.dataset.bound = '1'; }
    const adv = tp ? (E.competenceOf(g, g.party)[tp.id] - E.competenceOf(g, selRival)[tp.id]) / 50 : 0;
    const down = sh[selRival] < 0.6 * sh[g.party];
    const chance = Math.max(0.2, Math.min(0.85, 0.55 + 0.25 * adv - (down ? 0.15 : 0)));
    const angriff = E.ACTIONS.find(a => a.id === 'angriff');
    $('rival-action').innerHTML = '';
    $('rival-action').appendChild(actionButton(angriff, 'gegen ' + E.party(selRival).short + (tp ? ' beim Thema ' + tp.name : '') +
      ' · Erfolgschance ca. ' + Math.round(chance * 100) + ' %' + (down ? ' · Vorsicht: deutlich kleinere Partei' : '')));
  }

  // Wie gut eine Vor-Ort-Aktion zur Wählerschaft des Landes passt.
  function regionHint(a) {
    const name = E.stateById(selState).name;
    const fit = E.channelFit(a.id, selState) * E.localTopicFactor(g, selState, localTopic || null);
    const pctFit = Math.round((fit - 1) * 100);
    const what = localTopic ? 'Kanal und Thema passen' : 'passt';
    const mob = a.id === 'haustuer' || a.id === 'infostand' ? ' · 🗳️ mobilisiert stark' : a.id === 'kundgebung' || a.id === 'betrieb' ? ' · 🗳️ mobilisiert' : '';
    if (pctFit >= 4) return 'in ' + name + mob + ' · ' + what + ' gut (+' + pctFit + ' %)';
    if (pctFit <= -4) return 'in ' + name + mob + ' · ' + (localTopic ? 'Kanal und Thema passen schlecht' : 'passt schlecht zur Wählerschaft') + ' (−' + Math.abs(pctFit) + ' %)';
    return 'in ' + name + mob;
  }

  // Wählergruppen im ausgewählten Bundesland: Anteil an der Wählerschaft (mit Bundesvergleich)
  // und euer Umfragewert in der Gruppe.
  function renderStateGroups() {
    const box = $('state-groups');
    if (!box) return;
    const st = E.stateById(selState);
    const w = E.stateWeights(st.id);
    $('sg-state').textContent = st.name;
    box.innerHTML = D.GROUP_DIMS.map(dim => '<h4 class="gp-dim">' + esc(dim.name) + '</h4><div class="gp-row">' +
      D.GROUPS.filter(k => k.dim === dim.id && w[k.id] > 0).map(k => {
        const v = E.pollGroupShares(g, k.id, st.id)[g.party];
        const share = w[k.id] * 100;
        const cmp = 'Bund ' + num1(k.weight * 100) + ' %';
        const topics = E.groupTopicsInState(k.id, st.id, 3)
          .map(id => { const t = E.topicById(id); return '<span class="gp-topic' + (E.isCore(g, id) ? ' core' : '') + '">' + t.icon + ' ' + esc(t.name) + (E.isCore(g, id) ? ' 🎯' : '') + '</span>'; }).join('');
        return '<div class="gp-card"><div class="gp-head"><span class="gp-icon" aria-hidden="true">' + k.icon + '</span>' +
          '<span class="gp-name">' + esc(k.name) + '<small>' + num1(share) + ' % der Wähler (' + cmp + ') · ✉️ ' + Math.round(E.groupPostal(k.id)) + ' % per Brief</small></span>' +
          '<span class="gp-val">' + pct(v) + '<small>ihr in der Gruppe</small></span></div>' +
          '<div class="gp-bar sg-bar" title="Anteil an der Wählerschaft im Land; Strich = Bundesschnitt"><span style="width:' + share + '%"></span><i style="left:' + (k.weight * 100) + '%"></i></div>' +
          '<div class="gp-topics">' + topics + '</div></div>';
      }).join('') + '</div>').join('');
    const src = $('sg-sources');
    if (src && !src.dataset.done) {
      src.innerHTML = '<ul>' + (D.GROUP_SOURCES || []).concat(D.STATE_TOPIC_SOURCES || []).map(q => '<li><b>' + esc(q.dim) + ':</b> ' + esc(q.text) +
        (q.url ? ' <a href="' + esc(q.url) + '" target="_blank" rel="noopener">Quelle</a>' : '') + '</li>').join('') + '</ul>';
      src.dataset.done = '1';
    }
  }

  // Themenwahl für Vor-Ort-Aktionen, sortiert nach Wirkung im gewählten Land.
  // Wahlkampf vor Ort als Schritte: 1 Thema → 2 Aktion → 3 Zielgruppe. Sichtbar ist nur der aktuelle Schritt.
  function renderLocalTopic() {
    const box = $('local-topic-step');
    if (!box) return;
    const st = E.stateById(selState);
    const top = E.stateTopTopics(st.id, 3);
    $('state-top-topics').innerHTML = 'Was die Menschen in ' + esc(st.name) + ' bewegt: ' +
      top.map(id => {
        const t = E.topicById(id);
        const core = E.isCore(g, id);
        return '<span class="stt' + (core ? ' core' : '') + '"' + (core ? ' title="Euer Kernthema"' : '') + '>' + t.icon + ' ' + esc(t.name) + (core ? ' 🎯' : '') + '</span>';
      }).join('');

    // Schrittleiste: erledigte Schritte sind anklickbar, um zurückzugehen.
    const act = pendingLocal && E.ACTIONS.find(x => x.id === pendingLocal);
    const topicName = localTopic ? E.topicById(localTopic).name : 'ohne Thema';
    const stepBtn = (n, label, value) => '<button type="button" class="ls-step' + (localStep === n ? ' current' : '') + (localStep > n ? ' done' : '') + '" data-step="' + n + '"' +
      (localStep > n ? '' : ' disabled') + '><b>' + n + '</b> ' + label + (localStep > n && value ? ': <em>' + esc(value) + '</em>' : '') + '</button>';
    $('local-steps').innerHTML = stepBtn(1, 'Thema', topicName) + '<span class="ls-sep">›</span>' +
      stepBtn(2, 'Aktion', act ? act.name : '') + '<span class="ls-sep">›</span>' + stepBtn(3, 'Zielgruppe', '');
    $('local-steps').querySelectorAll('.ls-step.done').forEach(bt => bt.addEventListener('click', () => {
      localStep = Number(bt.dataset.step);
      if (localStep < 3) pendingLocal = localStep === 2 ? pendingLocal : null;
      renderGame();
    }));

    box.hidden = localStep !== 1;
    if (localStep !== 1) return;
    const ranked = D.TOPICS.map(t => ({ t, f: E.localTopicFactor(g, st.id, t.id) })).sort((a, b) => b.f - a.f);
    const card = (id, icon, name, f, tags) => {
      const d = Math.round((f - 1) * 100);
      return '<button type="button" class="lt-card' + ((localTopic || '') === id ? ' on' : '') + '" data-t="' + id + '">' +
        '<span class="lt-name">' + icon + ' ' + esc(name) + '</span>' +
        '<span class="lt-val ' + (d >= 4 ? 'pos' : d <= -4 ? 'neg' : '') + '">' + (d >= 0 ? '+' : '−') + Math.abs(d) + ' % Wirkung</span>' +
        (tags ? '<span class="lt-tags">' + tags + '</span>' : '') + '</button>';
    };
    box.innerHTML = '<h4>1 · Mit welchem Thema geht ihr in ' + esc(st.name) + ' auf die Menschen zu?</h4>' +
      '<p class="muted small">Sortiert nach Wirkung im Land: Landesthemen, Interessen der Gruppen hier und eure Kompetenz.</p>' +
      '<div class="lt-grid">' + ranked.map(x => card(x.t.id, x.t.icon, x.t.name, x.f,
        (E.isCore(g, x.t.id) ? '🎯 Kernthema ' : '') + (top.indexOf(x.t.id) !== -1 ? '📍 Landesthema' : ''))).join('') +
      card('', '⚪', 'Ohne Thema', 1, '') + '</div>';
    box.querySelectorAll('.lt-card').forEach(c => c.addEventListener('click', () => {
      localTopic = c.dataset.t;
      localStep = 2;
      renderGame();
    }));
  }

  const LOCAL_GROUPS = [
    { title: '🎤 Auftritte', desc: '🎤 Termine eurer Spitzenkandidatur – große Bühne, starke Wirkung im Land.', ids: ['kundgebung', 'buerger', 'betrieb'] },
    { title: '🚪 Basisarbeit &amp; Mobilisierung', desc: '👥 Einsätze eures Teams – nah an den Menschen, bringt Anhänger und Nichtwähler an die Urne.', ids: ['haustuer', 'infostand', 'plakate', 'erststimme'] },
    { title: '📻 Medien im Land', desc: '🎤 Termin eurer Spitzenkandidatur – Lokalzeitung und Landesradio, am besten mit einem Landesthema.', ids: ['regional'] }
  ];

  function renderActions() {
    renderLocalTopic();
    const list = $('action-list');
    const local = $('local-actions');
    list.innerHTML = '';
    local.innerHTML = '';
    if (selTopic) {
      const comp = E.competenceOf(g, g.party)[selTopic];
      E.ACTIONS.filter(a => a.scope === 'topic').forEach(a => list.appendChild(actionButton(a, topicActionHint(a, comp))));
    }
    // Vor-Ort-Aktionen nach Art gruppiert; Kasse und Briefwahl stehen auf der Aktionen-Seite.
    LOCAL_GROUPS.forEach(grp => {
      const sec = document.createElement('section');
      sec.className = 'local-group';
      sec.innerHTML = '<h4>' + grp.title + '</h4><p class="muted small">' + grp.desc + '</p>';
      const listEl = document.createElement('div');
      listEl.className = 'action-list';
      grp.ids.forEach(id => { const a = E.ACTIONS.find(x => x.id === id); if (a) listEl.appendChild(actionButton(a, regionHint(a))); });
      sec.appendChild(listEl);
      local.appendChild(sec);
    });
    local.hidden = localStep !== 2;
    if (localStep === 2) {
      const intro = document.createElement('h4');
      intro.className = 'ls-title';
      intro.textContent = '2 · Welche Aktion' + (localTopic ? ' zum Thema ' + E.topicById(localTopic).name : '') + '?';
      local.prepend(intro);
    }
    renderLocalTarget();
    const nat = $('national-actions');
    if (nat) {
      nat.innerHTML = '';
      E.ACTIONS.filter(a => a.scope === 'none').forEach(a => nat.appendChild(actionButton(a, 'füllt die Kasse')));
    }
    renderExtraActions();
    const hint = 'Keine Aktionen mehr – Zeit, die Woche zu beenden.';
    const fb = $('feedback');
    if (g.phase === 'campaign' && !E.canAct(g) && !fb.textContent.includes(hint)) {
      fb.textContent += (fb.textContent ? ' ' : '') + hint;
    }
  }

  // Sonntagsfrage als Säulendiagramm: Wert über der Säule, Partei und Veränderung seit Wahlkampfstart darunter.

  function renderPollBars(shares) {
    $('poll-bars').innerHTML = pollColumnsHtml(shares, g.startShares);
  }

  // Säulendiagramm der Sonntagsfrage (auch für einzelne Wählergruppen).
  function pollColumnsHtml(shares, base) {
    shares = merged(shares);
    if (base) base = merged(base);
    const POLL_ORDER = pollOrder();
    const R = E.POLL_RANGE;
    const top = Math.max(35, Math.ceil((Math.max.apply(null, POLL_ORDER.map(p => shares[p])) + R + 4) / 5) * 5);
    let cols = '';
    let labels = '';
    POLL_ORDER.forEach(p => {
      const d = base && base[p] !== undefined ? shares[p] - base[p] : null;
      const lo = Math.max(0, shares[p] - R);
      const range = '<i class="pc-range" style="bottom:' + (lo / top * 100) + '%;height:' + ((shares[p] + R - lo) / top * 100) + '%" title="Fehlerspanne ± ' + R + '"></i>';
      cols += '<div class="pc-col" data-p="' + p + '"><span class="pc-val" style="bottom:' + ((shares[p] + R) / top * 100) + '%">' + pct(shares[p]) +
        '<small>± ' + R + '</small></span>' + range +
        '<div class="pc-bar" style="height:' + (shares[p] / top * 100) + '%;background:' + col(p) + '"></div></div>';
      labels += '<div class="pc-label' + (p === (g ? g.party : chosenParty) ? ' me' : '') + '" data-p="' + p + '"><span class="pc-name">' + (p === D.OTHER.id ? 'Andere' : short(p)) + '</span>' +
        '<span class="pc-diff">' + (d === null ? '' : signed(d)) + '</span></div>';
    });
    return '<div class="pc-plot"><i class="pc-hurdle" style="bottom:' + (5 / top * 100) + '%" title="5-%-Hürde"></i>' + cols + '</div>' +
      '<div class="pc-labels">' + labels + '</div>';
  }


  // Wahlbeteiligung und Mobilisierung aller Parteien.
  function renderMobilization() {
    const box = $('mobilization');
    if (!box) return;
    const t = E.turnout(g);
    const base = (D.TURNOUT && D.TURNOUT.DE) || 82.5;
    const ids = MAIN_ORDER.slice();
    const vals = ids.map(p => ({ p, v: (E.mobFactor(g, p) - 1) * 100 }));
    const max = Math.max(4, ...vals.map(x => Math.abs(x.v)));
    box.innerHTML = '<div class="mob-turnout"><span class="mob-label">Erwartete Wahlbeteiligung</span><span class="mob-big">' + pct(t) + '</span>' +
      '<span class="muted small">Bundestagswahl ' + prevYear() + ': ' + pct(prevTurnout() || base) + '</span>' +
      '<span class="mob-postal">✉️ Briefwahl: ' + (E.postalCast(g) > 0 ? Math.round(E.postalCast(g) * 100) + ' % der Stimmen schon abgegeben'
        : 'beginnt in Woche ' + E.POSTAL_START) + '</span></div>' +
      '<div class="mob-bars"><span class="mob-label">Mobilisierung der Anhänger (bundesweit)</span>' + vals.map(x => {
        const w = Math.min(50, Math.abs(x.v) / max * 50);
        return '<div class="bg-row' + (x.p === g.party ? ' me' : '') + '"><span class="bg-name">' + short(x.p) + '</span>' +
          '<span class="bg-track"><i style="background:' + col(x.p) + ';' + (x.v >= 0 ? 'left:50%' : 'left:' + (50 - w) + '%') + ';width:' + w + '%"></i></span>' +
          '<span class="bg-val">' + signed(x.v) + ' %</span></div>';
      }).join('') + '</div>';
  }

  // Wählerwanderung: netto gewonnene (+) bzw. abgegebene (−) Punkte je Partei seit Wahlkampfbeginn.
  function flowBarsHtml(net, me) {
    net = merged(net);
    const ids = pollOrder().filter(p => p !== me).concat(['nw']).filter(q => q in net);
    const max = Math.max(1, ...ids.map(q => Math.abs(net[q])));
    return ids.map(q => {
      const v = net[q];
      const w = Math.min(50, Math.abs(v) / max * 50);
      const name = q === 'nw' ? 'Nichtwähler' : q === D.OTHER.id ? 'Andere' : short(q);
      const c = q === 'nw' ? 'var(--text-2)' : col(q);
      return '<div class="bg-row"><span class="bg-name">' + name + '</span>' +
        '<span class="bg-track"><i style="background:' + c + ';' + (v >= 0 ? 'left:50%' : 'left:' + (50 - w) + '%') + ';width:' + w + '%"></i></span>' +
        '<span class="bg-val">' + signed(v) + '</span></div>';
    }).join('');
  }

  function renderFlows() {
    const box = $('flows');
    if (!box) return;
    const net = E.flowSummary(g, g.party);
    const top = Object.keys(net).filter(q => net[q] > 0.05).sort((a, b) => net[b] - net[a])[0];
    const low = Object.keys(net).filter(q => net[q] < -0.05).sort((a, b) => net[a] - net[b])[0];
    const DAT = { union: 'der Union', afd: 'der AfD', spd: 'der SPD', gruene: 'den Grünen', linke: 'der Linken', bsw: 'dem BSW', fdp: 'der FDP', sonstige: 'den Kleinparteien', nw: 'den Nichtwählern' };
    const AKK = { union: 'die Union', afd: 'die AfD', spd: 'die SPD', gruene: 'die Grünen', linke: 'die Linke', bsw: 'das BSW', fdp: 'die FDP', sonstige: 'die Kleinparteien', nw: 'die Nichtwähler' };
    box.innerHTML = '<div class="mob-bars"><span class="mob-label">Saldo mit … (Prozentpunkte, bundesweit)</span>' + flowBarsHtml(net, g.party) + '</div>' +
      '<p class="muted small">' + (top ? 'Am meisten holt ihr bei ' + DAT[top] + ' (' + signed(net[top]) + ').' : 'Noch kaum Wählerwanderung.') +
      (low ? ' Am meisten verliert ihr an ' + AKK[low] + ' (' + signed(net[low]) + ').' : '') + '</p>';
  }

  // Spitzenkandidatur: Bekanntheit, Beliebtheit (−5 … +5) und Kanzlerfrage.
  function renderCandidate() {
    const box = $('cand-panel');
    if (!box || !g.cand) return;
    const c = g.cand;
    const c0 = g.candHist && g.candHist.length ? g.candHist[0] : c;
    const dl = c.like - c0.like;
    const pos = (c.like + 5) / 10 * 100;
    const hist = g.candHist || [];
    const W = 160;
    const H = 40;
    const pts = hist.map((h, i) => (i / Math.max(1, g.maxWeeks)) * W + ',' + (H / 2 - h.like / 5 * (H / 2 - 3)).toFixed(1)).join(' ');
    const kp = E.chancellorPoll(g);
    const ids = Object.keys(kp).filter(p => p !== 'keine').sort((a, b) => kp[b] - kp[a]);
    const max = Math.max(...ids.map(p => kp[p]));
    box.innerHTML = '<div class="cand-card"><p class="cand-name">' + esc(g.candidate) + '<small>Spitzenkandidatur ' + esc(E.party(g.party).short) + '</small></p>' +
      '<div class="cand-stat"><span class="mob-label">Bekanntheit</span><div class="cand-bar"><i style="width:' + c.known + '%"></i></div><b>' + Math.round(c.known) + ' %</b></div>' +
      '<div class="cand-stat"><span class="mob-label">Beliebtheit</span><div class="cand-scale"><i class="cand-zero"></i><i class="cand-mark ' + (c.like >= 0 ? 'pos' : 'neg') + '" style="left:' + pos + '%"></i></div>' +
        '<b>' + (c.like >= 0 ? '+' : '−') + num1(Math.abs(c.like)) + '</b></div>' +
      '<p class="muted small">Skala von −5 bis +5 wie im Politbarometer · seit Wahlkampfstart <span class="' + (dl >= 0 ? 'pos' : 'neg') + '">' + signed(dl) + '</span>' +
        ' · Wirkung auf euer Ergebnis: ' + signed(E.candBonus(g)) + ' Pkt.</p>' +
      (hist.length > 1 ? '<svg class="cand-spark" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><line x1="0" x2="' + W + '" y1="' + H / 2 + '" y2="' + H / 2 + '"></line><polyline points="' + pts + '"></polyline></svg>' : '') +
      '</div><div class="cand-race"><span class="mob-label">Wen hätten Sie lieber als Bundeskanzler/in?</span>' +
      ids.map(p => '<div class="bg-row' + (p === g.party ? ' me' : '') + '"><span class="bg-name">' + (p === g.party ? esc(g.candidate) : 'Kandidatur ' + short(p)) + '</span>' +
        '<span class="bg-track"><i style="background:' + col(p) + ';left:0;width:' + (kp[p] / max * 100) + '%"></i></span><span class="bg-val">' + pct(kp[p]) + '</span></div>').join('') +
      '<p class="muted small">Keine/weiß nicht: ' + pct(kp.keine) + '</p></div>';
  }

  // Wer hält die Brandmauer zur AfD noch?
  function renderFirewall() {
    const box = $('firewall');
    if (!box) return;
    const ids = MAIN_ORDER.filter(p => p !== 'afd');
    box.innerHTML = ids.map(p => {
      const lv = E.fwLevel(g, p);
      return '<div class="fw-row' + (p === g.party ? ' me' : '') + '"><span class="fw-party"><i style="background:' + col(p) + '"></i>' + short(p) + '</span>' +
        '<span class="fw-meter" aria-hidden="true">' + [0, 1, 2].map(i => '<b class="' + (i < 3 - lv ? 'on' : '') + '"></b>').join('') + '</span>' +
        '<span class="fw-level l' + lv + '">' + esc(E.FW_LEVELS[lv].name) + '</span></div>';
    }).join('') + (g.party === 'afd'
      ? '<p class="muted small">Ihr braucht Partner: Öffnet sich eine Partei für eine Koalition, wird ein Bündnis mit euch rechnerisch möglich.</p>'
      : '<p class="muted small">Steine = wie fest die Brandmauer noch steht. Wer sie einreißt, gewinnt AfD-nahe Wähler, verliert aber in der Mitte – und Parteien, die die Mauer halten, regieren nicht mehr mit ihm.</p>');
  }

  // Wählergruppen: euer Umfragewert je Gruppe, Veränderung seit Start und die Lieblingsthemen.
  function renderGroups() {
    const box = $('groups');
    if (!box) return;
    box.innerHTML = D.GROUP_DIMS.map(dim => '<h4 class="gp-dim">' + esc(dim.name) + '</h4><div class="gp-row">' +
      D.GROUPS.filter(k => k.dim === dim.id).map(k => {
      const v = E.pollGroupShares(g, k.id)[g.party];
      const d = v - (g.grpStart ? g.grpStart[k.id] : v);
      const satT = E.saturatedContexts(g, k.id).map(c => {
        const act = c.channel && E.ACTIONS.find(x => x.id === c.channel);
        return (act ? act.name : 'Aktionen') + ' zu ' + (c.topic ? E.topicById(c.topic).name : 'ohne Thema') + ' ' + (c.state ? 'in ' + E.stateById(c.state).name : 'bundesweit');
      });
      const topics = Object.keys(k.topics).sort((a, b) => k.topics[b] - k.topics[a]).slice(0, 3).map(id => {
        const t = E.topicById(id);
        return '<span class="gp-topic' + (E.isCore(g, id) ? ' core' : '') + '" title="' + esc(t.name) + '">' + t.icon + ' ' + esc(t.name) + (E.isCore(g, id) ? ' 🎯' : '') + '</span>';
      }).join('');
      return '<div class="gp-card gp-link" role="button" tabindex="0" data-group="' + k.id + '" title="Umfrage in dieser Gruppe ansehen"><div class="gp-head"><span class="gp-icon" aria-hidden="true">' + k.icon + '</span>' +
        '<span class="gp-name">' + esc(k.name) + '<small>' + Math.round(k.weight * 100) + ' % der Wähler · ✉️ ' + Math.round(E.groupPostal(k.id)) + ' % per Brief</small></span>' +
        '<span class="gp-val">' + pct(v) + '<small class="' + (d >= 0 ? 'pos' : 'neg') + '">' + signed(d) + '</small></span></div>' +
        '<div class="gp-bar"><span style="width:' + Math.min(100, v / 50 * 100) + '%"></span></div>' +
        '<div class="gp-topics">' + topics + '</div>' +
        (satT.length ? '<p class="gp-sat">Schon stark umworben durch: ' + esc(satT.join('; ')) + '. Andere Aktionen, Themen oder Länder wirken wieder voll.</p>' : '') + '</div>';
      }).join('') + '</div>').join('');
    box.querySelectorAll('.gp-link').forEach(c => {
      c.addEventListener('click', () => openGroupPoll(c.dataset.group));
      c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openGroupPoll(c.dataset.group); } });
    });
  }

  // Eigene Seite mit der Umfrage einer Wählergruppe (nur bundesweit).
  let selGroupView = null;

  function openGroupPoll(id) {
    selGroupView = id;
    showGameTab('group');
    renderGroupPoll();
  }

  function renderGroupPoll() {
    const k = D.GROUPS.find(x => x.id === selGroupView);
    if (!k) return;
    const shares = E.pollGroupShares(g, k.id);
    const start = g.history[0] && g.history[0].groups ? g.history[0].groups[k.id] : null;
    const dim = D.GROUP_DIMS.find(d => d.id === k.dim);
    const lead = E.leader(shares);
    $('group-head').innerHTML = '<span class="gh-icon" aria-hidden="true">' + k.icon + '</span><div>' +
      '<p class="gh-dim">Wählergruppe · ' + esc(dim ? dim.name : '') + '</p><h2>' + esc(k.name) + '</h2>' +
      '<p class="muted">' + Math.round(k.weight * 100) + ' % der Wahlberechtigten · ✉️ ' + Math.round(E.groupPostal(k.id)) + ' % wählen per Brief · vorn: <b>' + esc(E.party(lead).short) + '</b> · ihr: <b>' + pct(shares[g.party]) + '</b></p></div>';
    $('group-poll-bars').innerHTML = pollColumnsHtml(shares, start);
    // Ältere Spielstände haben keinen Gruppenverlauf: dann zumindest der aktuelle Stand.
    const series = g.history.filter(h => h.groups && h.groups[k.id]).map(h => h.groups[k.id]);
    drawChart('group-poll-chart', series.length ? series : [shares]);
    // Themen dieser Gruppe: Vorliebe × aktuelles Wählerinteresse
    const ranked = D.TOPICS.map(t => ({ t, v: g.salience[t.id] * (k.topics[t.id] || 1) })).sort((a, b) => b.v - a.v);
    const sum = ranked.reduce((x, r) => x + r.v, 0);
    const max = ranked[0].v;
    $('group-agenda').innerHTML = ranked.map(r => {
      const core = E.isCore(g, r.t.id);
      return '<span class="' + (core ? 'strong' : '') + '">' + r.t.icon + ' ' + esc(r.t.name) + (core ? ' 🎯' : '') + '</span>' +
        '<div class="track"><div class="fill" style="width:' + (r.v / max * 100) + '%"></div></div>' +
        '<span class="num">' + Math.round(r.v / sum * 100) + ' %</span>';
    }).join('') + '<span class="muted small" style="grid-column:1/-1">🎯 = eure Kernthemen. Gewichtet nach den Lieblingsthemen der Gruppe.</span>';
    const ch = Object.keys(D.CHANNELS).map(c => ({ c, v: D.CHANNELS[c][k.id] || 1 })).sort((a, b) => b.v - a.v);
    const name = c => (E.ACTIONS.find(a => a.id === c) || { name: c }).name;
    $('group-facts').innerHTML = '<h3>So erreicht ihr diese Gruppe</h3><p class="muted small">Am besten: ' +
      ch.slice(0, 3).map(x => '<b>' + esc(name(x.c)) + '</b>').join(', ') + '. Am schwächsten: ' + ch.slice(-2).map(x => esc(name(x.c))).join(', ') +
      '. Oder gezielt per Online-Werbung auf der Aktionen-Seite.</p>';
  }

  // Was die Konkurrenz in der letzten Woche getan hat.
  function renderRivals() {
    const box = $('rival-news');
    if (!box) return;
    const items = g.log.filter(l => l.type === 'ai' && l.week === g.week - 1);
    box.hidden = !items.length;
    box.innerHTML = '<strong>🥊 Die Konkurrenz letzte Woche</strong><ul>' + items.map(l => '<li>' + esc(l.text) + '</li>').join('') + '</ul>';
  }

  function renderChart() {
    drawChart('poll-chart', g.history.map(h => h.shares));
    if (gameTab === 'group' && selGroupView) renderGroupPoll();
  }

  // Umfrageverlauf als Liniendiagramm in einen Container zeichnen.
  function drawChart(boxId, series) {
    // Breite an den Platz anpassen, damit Beschriftungen bei Vollbild nicht mitwachsen.
    const W = Math.max(300, Math.round($(boxId).clientWidth || 320));
    const H = Math.round(Math.min(260, Math.max(170, W * 0.42)));
    const L = 26;
    const R = 8;
    const T = 8;
    const B = 20;
    if (!series.length) { $(boxId).innerHTML = ''; return; }
    const hist = series.map(sh => ({ shares: merged(sh) }));
    const ids = pollOrder();
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

    const box = $(boxId);
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
      '<li><span class="wk">Woche ' + l.week + '</span><span class="' + (l.type === 'event' || l.type === 'duel' ? 'event' : l.type === 'ai' ? 'ai' : '') + '">' + esc(l.text) + '</span></li>'
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

  function closeModal() { $('modal').hidden = true; $('modal').classList.remove('scen-modal'); }

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
        hint: c.hint + (c.later ? ' · ⏳ kann Spätfolgen haben' : ''),
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
    calcSel = [];
    $('toast').hidden = true;
    show('election');
    const screen = $('screen-election');
    applyPartyTheme(screen, g.party);
    document.body.style.background = getComputedStyle(screen).getPropertyValue('--fl-paper').trim();
    const cand = String(g.candidate || '').trim();
    $('el-candidate').textContent = 'Bundestagswahl ' + (g.year || E.YEAR0) + ' · Wahlparty: ' + E.party(g.party).name + (cand && cand !== DEFAULT_CANDIDATE ? ' · Spitzenkandidatur: ' + cand : '');
    renderElection(true);
  }

  function renderElection(animate) {
    const r = g.result;
    const me = g.party;

    // Balken: Kleinparteien erscheinen, wenn sie ausgewiesen wurden, über 3 % liegen oder Sitze haben.
    const showM = m => r.shares[m] >= 3 || r.seats[m] > 0;
    const rs = E.mergeShares(g, r.shares, showM);
    const ss = E.mergeShares(g, g.startShares, showM);
    const ids = Object.keys(rs).sort((a, b) => (a === D.OTHER.id) - (b === D.OTHER.id) || rs[b] - rs[a]);
    const max = Math.max.apply(null, ids.map(p => rs[p])) * 1.15;
    let bars = '<div class="rhurdle" style="bottom:' + (5 / max * 100) + '%"></div>';
    ids.forEach(p => {
      bars += '<div class="col"><span class="rval">' + num1(rs[p]) + '</span>' +
        '<div class="rbar" data-h="' + (rs[p] / max * 100) + '" style="background:' + col(p) + '"></div></div>';
    });
    $('result-bars').innerHTML = bars;
    $('result-labels').innerHTML = ids.map(p => {
      const d = rs[p] - (ss[p] || 0);
      return '<div class="' + (p === me ? 'me' : '') + '" data-p="' + p + '">' + short(p) +
        '<span class="rdiff ' + (d >= 0 ? 'pos' : 'neg') + '">' + signed(d) + '</span></div>';
    }).join('');

    // Sitze
    $('seat-total').textContent = '(' + D.SEATS + ' Sitze, Mehrheit ab ' + E.MAJORITY + ')';
    $('hemicycle').innerHTML = hemicycle(r.seats);
    $('seat-legend').innerHTML = seatLegend(r.seats);

    renderWkResult();
    renderCoalition();
    renderOutcome();
    renderRetro();
    renderCalc(false);
    if (animate) electionReveal(ids); else finishElectionReveal();
  }

  // Koalitionsrechner: Parteien antippen, der Halbkreis füllt sich von links nach rechts.
  let calcSel = [];
  const CALC_R0 = 0.44; // größere Mitte für die Sitzanzeige
  function renderCalc(animateLast) {
    const box = $('calc');
    const r = g.result;
    if (!box || !r || !r.seats) return;
    const total = D.SEATS;
    const maj = E.MAJORITY;
    calcSel = calcSel.filter(p => r.seats[p] > 0);
    const sum = calcSel.reduce((x, p) => x + r.seats[p], 0);
    const am = Math.PI * (1 - maj / total);
    let svg = '<svg viewBox="-1.02 -1.12 2.04 1.14" role="img" aria-label="Koalitionsrechner: ' + sum + ' von ' + total + ' Sitzen">' +
      '<path class="calc-bg" d="' + segPath(Math.PI, 0.00001, CALC_R0) + '"></path>';
    let acc = 0;
    calcSel.forEach((p, i) => {
      const a0 = Math.PI * (1 - acc / total);
      acc += r.seats[p];
      const a1 = Math.PI * (1 - acc / total);
      svg += '<path class="calc-seg" data-i="' + i + '" data-a0="' + a0 + '" data-a1="' + a1 + '" data-r0="' + CALC_R0 + '" d="' + segPath(a0, a1, CALC_R0) + '" style="fill:' + col(p) + '"></path>';
    });
    svg += '<line class="calc-major" x1="' + (CALC_R0 * Math.cos(am)).toFixed(4) + '" y1="' + (-CALC_R0 * Math.sin(am)).toFixed(4) +
      '" x2="' + (1.08 * Math.cos(am)).toFixed(4) + '" y2="' + (-1.08 * Math.sin(am)).toFixed(4) + '"></line>' +
      '<rect class="calc-chip" x="-0.26" y="-0.27" width="0.52" height="0.12" rx="0.025"></rect>' +
      '<text class="calc-chip-text" x="0" y="-0.188" text-anchor="middle">' + sum + '/' + total + ' Sitze</text>' +
      '<text class="calc-sub" x="0" y="-0.08" text-anchor="middle">Mehrheit</text><text class="calc-sub" x="0" y="-0.015" text-anchor="middle">ab ' + maj + ' Sitzen</text></svg>';
    let status;
    if (!calcSel.length) status = 'Bitte Partei auswählen';
    else if (sum >= maj) {
      const ok = E.coalitionViable(calcSel, g);
      status = (ok ? '✅ Mehrheit! ' : '⚠️ Rechnerisch eine Mehrheit – politisch ausgeschlossen. ') + (sum - maj + 1) + ' Sitz' + (sum - maj + 1 === 1 ? '' : 'e') + ' über der Mehrheit.';
    } else status = 'Es fehlen noch ' + (maj - sum) + ' Sitz' + (maj - sum === 1 ? '' : 'e') + ' zur Mehrheit.';
    const ids = SPECTRUM.filter(p => r.seats[p] > 0);
    box.innerHTML = svg + '<p class="calc-status ' + (sum >= maj ? (E.coalitionViable(calcSel, g) ? 'ok' : 'warn') : '') + '">' + status + '</p>' +
      '<div class="calc-chips">' + ids.map(p => {
        const on = calcSel.indexOf(p) !== -1;
        return '<button type="button" class="calc-party' + (on ? ' on' : '') + '" data-p="' + p + '" aria-pressed="' + on + '" style="--pc:' + col(p) + ';--pon:' + onCol(p) + '">' +
          '<span class="calc-ico">' + (on ? '−' : '+') + '</span>' + short(p) + '<span class="calc-n">' + r.seats[p] + '</span></button>';
      }).join('') + '</div>';
    box.querySelectorAll('.calc-party').forEach(b => b.addEventListener('click', () => {
      const p = b.dataset.p;
      const i = calcSel.indexOf(p);
      if (i === -1) { calcSel.push(p); renderCalc(true); } else { calcSel.splice(i, 1); renderCalc(false); }
    }));
    if (animateLast && calcSel.length) {
      const seg = box.querySelector('.calc-seg[data-i="' + (calcSel.length - 1) + '"]');
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (seg) sweepSegment(seg, reduce ? 60 : Math.max(350, 1400 * r.seats[calcSel[calcSel.length - 1]] / total));
    }
  }

  // Rückblick: Umfrageverlauf, beste und teuerste Entscheidungen, Woche für Woche – und zum Teilen.
  function renderRetro() {
    const card = $('retro-card');
    const r = g.result;
    if (!r.outcome || !g.journal) { card.hidden = true; return; }
    card.hidden = false;
    const me = g.party;
    const hist = g.history.map(h => h.shares[me]);
    const final = r.shares[me];
    const vals = hist.concat([final]);
    const W = 520;
    const H = 150;
    const lo = Math.max(0, Math.floor(Math.min(...vals) - 2));
    const hi = Math.ceil(Math.max(...vals) + 2);
    const x = i => 30 + (W - 50) * i / (g.maxWeeks + 1);
    const y = v => 10 + (H - 34) * (1 - (v - lo) / Math.max(1, hi - lo));
    let svg = '<svg class="retro-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Euer Umfrageverlauf bis zur Wahl">';
    for (let v = Math.ceil(lo); v <= hi; v += Math.max(1, Math.round((hi - lo) / 4))) svg += '<line class="rg" x1="30" x2="' + (W - 20) + '" y1="' + y(v) + '" y2="' + y(v) + '"></line><text class="rt" x="24" y="' + (y(v) + 4) + '" text-anchor="end">' + v + '</text>';
    svg += '<polyline points="' + hist.map((v, i) => x(i) + ',' + y(v)).join(' ') + '" style="stroke:' + col(me) + '"></polyline>';
    hist.forEach((v, i) => { svg += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="3" style="fill:' + col(me) + '"></circle><text class="rt" x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="middle">' + (i === 0 ? 'Start' : 'W' + i) + '</text>'; });
    svg += '<line class="rfin" x1="' + x(hist.length - 1) + '" y1="' + y(hist[hist.length - 1]) + '" x2="' + x(g.maxWeeks + 1) + '" y2="' + y(final) + '"></line>' +
      '<circle cx="' + x(g.maxWeeks + 1) + '" cy="' + y(final) + '" r="6" style="fill:' + col(me) + '"></circle><text class="rt strong" x="' + x(g.maxWeeks + 1) + '" y="' + (H - 6) + '" text-anchor="middle">Wahl</text>' +
      '<text class="rt strong" x="' + (x(g.maxWeeks + 1) - 10) + '" y="' + (y(final) - 10) + '" text-anchor="end">' + num1(final) + ' %</text></svg>';
    const items = g.journal.filter(j => Math.abs(j.d) >= 0.05);
    const best = items.slice().sort((a, b) => b.d - a.d).filter(j => j.d > 0).slice(0, 4);
    const worst = items.slice().sort((a, b) => a.d - b.d).filter(j => j.d < 0).slice(0, 3);
    const li = j => '<li><span class="retro-w">W' + j.w + '</span> ' + esc(j.x) + ' <b class="' + (j.d >= 0 ? 'pos' : 'neg') + '">' + signed(j.d) + '</b></li>';
    const weeks = [];
    for (let w = 1; w <= g.maxWeeks; w++) {
      const js = g.journal.filter(j => j.w === w);
      const ev = js.find(j => j.k === 'e' || j.k === 'd');
      const prev = g.history[w - 1] ? g.history[w - 1].shares[me] : null;
      const now = g.history[w] ? g.history[w].shares[me] : final;
      weeks.push('<tr><td>Woche ' + w + '</td><td>' + js.filter(j => j.k === 'a').length + ' Aktionen</td><td>' + (ev ? esc(ev.x) : '–') + '</td><td class="' + (prev !== null && now >= prev ? 'pos' : 'neg') + '">' +
        (prev !== null ? signed(now - prev) : '') + '</td></tr>');
    }
    const c = g.cand;
    $('retro').innerHTML = '<div class="retro-grid"><div>' + svg + '<p class="muted small">Eure veröffentlichten Umfragewerte Woche für Woche – und das Ergebnis am Wahlabend.</p>' +
      (c ? '<p class="small">🎤 ' + esc(g.candidate) + ': Bekanntheit ' + Math.round(c.known) + ' %, Beliebtheit ' + (c.like >= 0 ? '+' : '−') + num1(Math.abs(c.like)) + '</p>' : '') + '</div>' +
      '<div><h4>👍 Das hat am meisten gebracht</h4><ul class="retro-list">' + (best.map(li).join('') || '<li>–</li>') + '</ul>' +
      '<h4>👎 Das hat geschadet</h4><ul class="retro-list">' + (worst.map(li).join('') || '<li>Nichts Nennenswertes – sauberer Wahlkampf!</li>') + '</ul></div></div>' +
      '<details class="retro-weeks"><summary>Woche für Woche</summary><table>' + weeks.join('') + '</table></details>' +
      '<p class="muted small">Wirkung = sofortige Veränderung eures Stimmenanteils; im Wahlkampf verblassen Effekte mit der Zeit wieder.</p>' +
      '<button type="button" class="btn" id="btn-share">📋 Ergebnis zum Teilen kopieren</button> <span id="share-ok" class="muted small"></span>';
    $('btn-share').addEventListener('click', () => {
      const o = r.outcome;
      const p = E.party(me);
      const text = 'Wahlkampf! – Bundestagswahl-Spiel\n' + p.name + ' mit ' + g.candidate + ': ' + pct(final) + ' (' + signed(o.delta) + ')\n' +
        o.rating + ' – ' + o.score + ' Punkte\n' + (o.goal ? '✅ Wahlziel erreicht: ' : '❌ Wahlziel verfehlt: ') + p.goalText +
        (r.government ? '\nRegierung: ' + r.government.map(short).join(', ') : '');
      const done = () => { $('share-ok').textContent = 'Kopiert!'; };
      // Ohne Zugriff auf die Zwischenablage: Text zum Markieren anzeigen.
      const fallback = () => {
        let ta = $('share-text');
        if (!ta) { ta = document.createElement('textarea'); ta.id = 'share-text'; ta.className = 'share-text'; ta.readOnly = true; $('btn-share').after(ta); }
        ta.value = text; ta.hidden = false; ta.focus(); ta.select();
        $('share-ok').textContent = 'Text markiert – jetzt kopieren.';
      };
      try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
    });
  }

  // Erststimmen am Wahlabend: Karte der Wahlkreissieger, Direktmandate, knappste Duelle, Grundmandate.
  function renderWkResult() {
    const r = g.result;
    const card = $('wk-card');
    if (!r.wk || !r.wk.length || !WKG) { card.hidden = true; return; }
    card.hidden = false;
    const map = $('wk-result-map');
    map.innerHTML = wkMapSvg(r.wk, {});
    const me = g.party;
    const won = {};
    const seated = {};
    r.wk.forEach(x => { won[x.win] = (won[x.win] || 0) + 1; if (x.seated) seated[x.win] = (seated[x.win] || 0) + 1; });
    const orphans = r.wk.filter(x => !x.seated);
    const close = r.wk.slice().sort((a, b) => a.margin - b.margin).slice(0, 5);
    const mine = won[me] || 0;
    let html = '<h3>Direktmandate</h3><div class="wk-res-pills">' + CONTEST_ORDER.filter(p => won[p] > 0).map(p =>
      '<span class="sl-item' + (p === me ? ' me' : '') + '"><span class="sl-name">' + short(p) + '</span><span class="sl-seats" style="background:' + col(p) + ';color:' + onCol(p) + '">' + won[p] + '</span>' +
      '<span class="sl-diff">' + (seated[p] || 0) + ' mit Sitz</span></span>').join('') + '</div>';
    html += '<p>' + (mine ? '✖️ Eure Direktkandidaturen gewinnen <b>' + mine + ' Wahlkreis' + (mine > 1 ? 'e' : '') + '</b>' + ((seated[me] || 0) < mine ? ' – ' + (mine - (seated[me] || 0)) + ' davon ohne Sitz.' : '.') :
      '✖️ Eure Direktkandidaturen gewinnen keinen Wahlkreis.') + '</p>';
    (r.grundmandat || []).forEach(p => {
      html += '<p class="wk-gm-hit">🎉 <b>Grundmandatsklausel:</b> ' + esc(E.party(p).name) + ' zieht mit ' + won[p] + ' Direktmandaten trotz ' + pct(r.shares[p]) + ' in den Bundestag ein.</p>';
    });
    if (orphans.length) html += '<p class="small"><b>' + orphans.length + ' Wahlkreissieger ohne Sitz:</b> Die Zweitstimmen ihrer Partei reichen nicht für alle gewonnenen Wahlkreise (Zweitstimmendeckung). Auf der Karte blass.</p>';
    html += '<h4>Die knappsten Duelle</h4><ul class="wk-close">' + close.map(x => '<li><b>' + esc(E.wkByNr(x.nr).name) + ':</b> ' +
      esc(candName(x.nr, x.win)) + ' (' + short(x.win) + ') vor ' + short(x.second) + ' – ' + (x.margin < 0.05 ? 'weniger als 0,1' : num1(x.margin)) + ' Punkte</li>').join('') + '</ul>';
    $('wk-result-info').innerHTML = html;
  }

  // Wahlabend mit Spannung: erst die Zweitstimmen Partei für Partei (die eigene zuletzt),
  // dann die Sitzverteilung Segment für Segment, zum Schluss Regierungsbildung und Bilanz.
  let electionTimers = [];
  function electionReveal(ids) {
    const r = g.result;
    const me = g.party;
    electionTimers.forEach(clearTimeout);
    electionTimers = [];
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Ein Balken fährt in 1,4 s aus (CSS); der nächste startet erst danach.
    const step = reduce ? 80 : 1700;
    const at = (t, fn) => electionTimers.push(setTimeout(fn, t));
    const votes = $('votes-card');
    votes.classList.add('el-revealing');
    ['seat-card', 'wk-card', 'coalition-card', 'outcome-card', 'calc-card', 'retro-card'].forEach(id => $(id).classList.add('el-pending'));
    $('btn-el-skip').hidden = false;
    const sus = $('el-suspense');
    sus.textContent = '18:00 Uhr – die Wahllokale haben geschlossen. Die Stimmen werden ausgezählt …';
    const cols = {};
    votes.querySelectorAll('.result-bars .col').forEach((c, i) => { cols[ids[i]] = c; });
    const showBar = p => {
      const c = cols[p];
      if (!c) return;
      c.classList.add('shown');
      c.querySelector('.rbar').style.height = c.querySelector('.rbar').dataset.h + '%';
      const l = votes.querySelector('.result-labels [data-p="' + p + '"]');
      if (l) l.classList.add('shown');
    };
    // Von links nach rechts (wie die Balken stehen); vor der eigenen Partei eine kurze Kunstpause.
    let t = 900;
    ids.forEach(p => {
      if (p === me) {
        at(t, () => { sus.textContent = '… und ' + E.party(me).name + '?'; });
        t += reduce ? 100 : 1500;
        at(t, () => {
          showBar(me);
          const v = r.shares[me];
          sus.textContent = E.party(me).short + ': ' + pct(v) + (v < 5 ? ' – unter der 5-%-Hürde.' : r.strongest === me ? ' – stärkste Kraft!' : '.');
        });
        t += reduce ? 100 : 2200;
      } else {
        at(t, () => showBar(p));
        t += step;
      }
    });
    t += reduce ? 200 : 1400;
    // Sitzverteilung
    at(t, () => {
      const card = $('seat-card');
      card.classList.remove('el-pending');
      card.classList.add('el-revealing');
      card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
    t += reduce ? 100 : 700;
    // Die Parteien füllen den Halbkreis von links nach rechts, jede so lange, wie sie Sitze hat.
    const segs = SPECTRUM.filter(p => r.seats[p] > 0);
    const totalSeats = segs.reduce((x, p) => x + r.seats[p], 0);
    segs.forEach(p => {
      const dur = reduce ? 60 : Math.max(450, 4200 * r.seats[p] / totalSeats);
      at(t, () => {
        const card = $('seat-card');
        const seg = card.querySelector('.hc-seg[data-p="' + p + '"]');
        if (seg) sweepSegment(seg, dur);
        const it = card.querySelector('.sl-item[data-p="' + p + '"]');
        if (it) it.classList.add('shown');
      });
      t += dur + (reduce ? 20 : 350);
    });
    // Erststimmen: Die Wahlkreise färben sich Land für Land.
    if (!$('wk-card').hidden && r.wk && r.wk.length) {
      t += reduce ? 100 : 900;
      at(t, () => {
        const card = $('wk-card');
        card.classList.remove('el-pending');
        card.classList.add('el-revealing');
        card.querySelectorAll('path.wk').forEach(p => p.classList.add('pending'));
        card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      });
      t += reduce ? 100 : 700;
      D.STATES.slice().sort((a, b) => (GEO && GEO.states[a.id] ? GEO.states[a.id].cy : 0) - (GEO && GEO.states[b.id] ? GEO.states[b.id].cy : 0)).forEach(st => {
        at(t, () => $('wk-card').querySelectorAll('path.wk[data-land="' + st.id + '"]').forEach(p => p.classList.remove('pending')));
        t += reduce ? 30 : 320;
      });
      t += reduce ? 100 : 600;
      at(t, () => { $('wk-card').classList.remove('el-revealing'); });
      t += reduce ? 100 : 1600;
    }
    at(t, () => finishElectionReveal(true));
  }

  function finishElectionReveal(scroll) {
    electionTimers.forEach(clearTimeout);
    electionTimers = [];
    sweepFrames.forEach(cancelAnimationFrame);
    sweepFrames = [];
    document.querySelectorAll('#screen-election .hc-seg').forEach(seg => seg.setAttribute('d', segPath(Number(seg.dataset.a0), Number(seg.dataset.a1))));
    document.querySelectorAll('#screen-election .rbar').forEach(b => { b.style.height = b.dataset.h + '%'; });
    document.querySelectorAll('#screen-election .result-bars .col, #screen-election .result-labels > div, #screen-election .hc-seg, #screen-election .sl-item')
      .forEach(el => el.classList.add('shown'));
    ['votes-card', 'seat-card', 'wk-card'].forEach(id => $(id).classList.remove('el-revealing'));
    ['seat-card', 'wk-card', 'coalition-card', 'outcome-card', 'calc-card', 'retro-card'].forEach(id => $(id).classList.remove('el-pending'));
    document.querySelectorAll('#wk-card path.wk.pending').forEach(p => p.classList.remove('pending'));
    $('btn-el-skip').hidden = true;
    if (scroll) {
      const target = g.result.awaitingChoice || (g.result.neg && !g.result.neg.done) ? $('coalition-card') : $('outcome-card');
      if (target && !target.hidden) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  $('btn-el-skip').addEventListener('click', () => { finishElectionReveal(true); $('el-suspense').textContent = ''; });

  // Ringsegment des Halbkreises zwischen den Winkeln a0 > a1 (links = π, rechts = 0).
  const HC_R0 = 0.34;
  function segPath(a0, a1, inner) {
    const R = 1;
    const r0 = inner || HC_R0;
    const pt = (rad, a) => (rad * Math.cos(a)).toFixed(4) + ' ' + (-rad * Math.sin(a)).toFixed(4);
    const large = a0 - a1 > Math.PI ? 1 : 0;
    return 'M ' + pt(r0, a0) + ' L ' + pt(R, a0) + ' A ' + R + ' ' + R + ' 0 ' + large + ' 1 ' + pt(R, a1) +
      ' L ' + pt(r0, a1) + ' A ' + r0 + ' ' + r0 + ' 0 ' + large + ' 0 ' + pt(r0, a0) + ' Z';
  }

  // Ein Segment füllt sich von links nach rechts (Winkel wächst von a0 bis a1).
  let sweepFrames = [];
  function sweepSegment(seg, dur) {
    const a0 = Number(seg.dataset.a0);
    const a1 = Number(seg.dataset.a1);
    const inner = Number(seg.dataset.r0) || HC_R0;
    seg.setAttribute('d', segPath(a0, a0 - 0.0001, inner));
    seg.classList.add('shown');
    const t0 = performance.now();
    const frame = now => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 2);
      seg.setAttribute('d', segPath(a0, a0 - (a0 - a1) * Math.max(0.0001, e), inner));
      if (k < 1) sweepFrames.push(requestAnimationFrame(frame));
    };
    sweepFrames.push(requestAnimationFrame(frame));
  }

  // Sitzverteilung als Halbkreis mit einem Segment je Partei (von links nach rechts im politischen Spektrum).
  function hemicycle(seats) {
    const ids = SPECTRUM.filter(p => seats[p] > 0);
    const total = ids.reduce((s, p) => s + seats[p], 0);
    const r0 = HC_R0;
    let svg = '<svg viewBox="-1.02 -1.02 2.04 1.04" role="img" aria-label="Sitzverteilung im Bundestag: ' +
      ids.map(p => short(p) + ' ' + seats[p]).join(', ') + '">';
    let acc = 0;
    ids.forEach(p => {
      const a0 = Math.PI * (1 - acc / total);
      acc += seats[p];
      const a1 = Math.PI * (1 - acc / total);
      svg += '<path class="hc-seg" data-p="' + p + '" data-a0="' + a0 + '" data-a1="' + a1 + '" d="' + segPath(a0, a1) + '" style="fill:' + col(p) + '"><title>' +
        esc(E.party(p).name) + ': ' + seats[p] + ' Sitze</title></path>';
    });
    // Mehrheitsmarke
    const am = Math.PI * (1 - E.MAJORITY / total);
    svg += '<line class="hc-major" x1="' + (r0 * Math.cos(am)).toFixed(4) + '" y1="' + (-r0 * Math.sin(am)).toFixed(4) +
      '" x2="' + (1.0 * Math.cos(am)).toFixed(4) + '" y2="' + (-1.0 * Math.sin(am)).toFixed(4) + '"><title>Mehrheit: ' + E.MAJORITY + ' Sitze</title></line>';
    svg += '<rect class="hc-chip" x="-0.2" y="-0.17" width="0.4" height="0.11" rx="0.02"></rect>';
    svg += '<text class="hc-chip-text" x="0" y="-0.095" text-anchor="middle">' + total + ' Sitze</text></svg>';
    return svg;
  }

  // Legende unter dem Halbkreis: Partei, Sitze und Veränderung zur Bundestagswahl 2025.
  function seatLegend(seats) {
    const prev = (g && g.prevSeats) || D.SEATS_2025 || {};
    return SPECTRUM.filter(p => seats[p] > 0 || prev[p] > 0).map(p => {
      const d = (seats[p] || 0) - (prev[p] || 0);
      return '<div class="sl-item' + (p === g.party ? ' me' : '') + '" data-p="' + p + '"><span class="sl-name">' + short(p) + '</span>' +
        '<span class="sl-seats" style="background:' + col(p) + ';color:' + onCol(p) + '">' + (seats[p] || 0) + '</span>' +
        '<span class="sl-diff">' + (d > 0 ? '+' : d < 0 ? '−' : '±') + Math.abs(d) + '</span></div>';
    }).join('');
  }

  function pills(members, seats) {
    return '<span class="coal-members">' + members.map(p =>
      '<span class="pill" style="--pc:' + col(p) + ';--pon:' + onCol(p) + '">' + short(p) + (seats ? ' ' + seats[p] : '') + '</span>').join('') + '</span>';
  }

  // Koalitionsverhandlungen: drei Streitthemen, dann die Ressorts; das Klima muss halten.
  function renderNegotiation(box) {
    const r = g.result;
    const n = r.neg;
    const partners = n.members.filter(p => p !== g.party);
    const moodCls = n.mood >= 50 ? 'good' : n.mood >= E.NEG_MIN ? 'mid' : 'bad';
    let html = '<p><strong>' + (n.lead === g.party ? 'Koalitionsverhandlungen' : esc(E.party(n.lead).name) + ' lädt euch zu Koalitionsverhandlungen ein') + '</strong></p>' +
      '<p>' + pills(n.members, r.seats) + '</p>' +
      '<div class="neg-mood"><span class="mob-label">Verhandlungsklima</span><div class="neg-bar ' + moodCls + '"><i style="width:' + n.mood + '%"></i><b class="neg-min" style="left:' + E.NEG_MIN + '%" title="Darunter platzen die Gespräche"></b></div><span class="neg-val">' + Math.round(n.mood) + '</span></div>' +
      '<p class="muted small">Fällt das Klima am Ende unter ' + E.NEG_MIN + ', platzen die Gespräche. Durchgesetzte Positionen und wichtige Ressorts bringen Punkte.</p>';
    if (n.log.length) html += '<ul class="neg-log">' + n.log.map(l => '<li>' + esc(l) + '</li>').join('') + '</ul>';
    const steps = n.topics.length + 1;
    html += '<p class="neg-step">Runde ' + Math.min(steps, n.step + 1) + ' von ' + steps + '</p>';
    if (n.step < n.topics.length) {
      const x = n.topics[n.step];
      const t = E.topicById(x.t);
      html += '<div class="neg-topic"><h4>' + t.icon + ' ' + esc(t.name) + '</h4>' +
        '<p><b>Ihr wollt:</b> ' + esc(D.PROGRAM[x.t][x.mine].label) + '</p>' +
        '<p><b>' + esc(E.party(x.q).short) + ' will:</b> ' + esc(D.PROGRAM[x.t][x.theirs].label) + '</p></div>';
      html += '<div class="neg-choices">' + [['hart', '💪 Hart bleiben', 'Eure Position kommt in den Vertrag – das Klima leidet'],
        ['kompromiss', '🤝 Kompromiss', 'Beide geben etwas nach'], ['nachgeben', '🙏 Nachgeben', 'Besseres Klima, aber eure Basis murrt']]
        .map(c => '<button type="button" class="btn coalition-option neg-btn" data-c="' + c[0] + '"><b>' + c[1] + '</b><span class="hint">' + c[2] + '</span></button>').join('') + '</div>';
    } else if (n.draft) {
      // Ressortverteilung: reihum nach Sitzen, die Kanzlerpartei hat das Kanzleramt.
      const d = n.draft;
      const mine = d.order.filter(p => p === g.party).length;
      const got = Object.keys(d.picks).filter(id => d.picks[id] === g.party).length;
      html += '<div class="neg-topic"><h4>🏛️ Ressortverteilung</h4><p>Die Partner wählen reihum Ministerien – nach Sitzen stehen euch <b>' + mine + '</b> von ' + E.MINISTRIES.length +
        ' zu' + (n.lead === g.party ? ' (dazu das Kanzleramt)' : '') + '. Ihr habt ' + got + ' gewählt. Nehmt ihr einem Partner sein Wunschressort weg (❤️), leidet das Klima.</p></div>';
      html += '<div class="neg-ministries">' + E.MINISTRIES.map(m => {
        const holder = d.picks[m.id];
        const wish = n.members.filter(p => p !== g.party && ((window.BTW_TERMDATA.WISH[p] || []).slice(0, 3).indexOf(m.id) !== -1));
        return '<button type="button" class="btn neg-min-btn neg-btn" data-c="' + m.id + '"' + (holder ? ' disabled' : '') + '>' + m.icon + ' <b>' + esc(m.short) + '</b>' +
          (holder ? ' ' + pills([holder]) : '') + (!holder && wish.length ? '<span class="hint">❤️ ' + wish.map(p => esc(E.party(p).short)).join(', ') + '</span>' : '') + '</button>';
      }).join('') + '</div>';
    }
    box.innerHTML = html;
    box.querySelectorAll('.neg-btn').forEach(b => b.addEventListener('click', () => { E.negotiate(g, b.dataset.c); save(); renderElection(false); }));
  }

  function renderCoalition() {
    const r = g.result;
    const box = $('coalition');
    if (r.neg && !r.neg.done) { renderNegotiation(box); return; }
    if (r.awaitingChoice) {
      box.innerHTML = (r.neg && r.neg.done && !r.neg.success ? '<p class="fw-note">💥 Die Verhandlungen mit ' + esc(r.neg.members.filter(p => p !== g.party).map(p => E.party(p).short).join(' und ')) + ' sind gescheitert. Versucht es mit anderen Partnern.</p>' : '') +
        '<p><strong>' + (r.strongest === g.party ? 'Ihr seid stärkste Kraft und habt den Auftrag zur Regierungsbildung!'
        : esc(E.party(r.strongest).name) + ' findet keine Partner – ihr habt den Auftrag zur Regierungsbildung!') + '</strong> Mit wem wollt ihr koalieren?</p>';
      r.options.forEach((o, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn coalition-option choice';
        b.innerHTML = pills(o.members, r.seats) + '<span class="hint">' + (o.tolerated
          ? o.seats + ' Sitze · Minderheitsregierung, von der AfD toleriert'
          : o.seats + ' Sitze · Mehrheit +' + (o.seats - E.MAJORITY + 1)) + '</span>';
        b.addEventListener('click', () => { E.chooseCoalition(g, i); save(); renderElection(false); });
        box.appendChild(b);
      });
      appendFirewallBreak(box);
      return;
    }
    let html;
    if (r.government) {
      const seats = r.government.reduce((s, p) => s + r.seats[p], 0);
      const tol = r.coalitions.some(c => c.tolerated && c.members.join() === r.government.join());
      html = '<p>Neue Bundesregierung (' + seats + ' Sitze' + (tol ? ', Minderheitsregierung – von der AfD toleriert' : '') + '):</p><p>' + pills(r.government) + '</p>' +
        (r.firewallBroken ? '<p class="fw-note">🧱 Die Brandmauer ist gefallen: erstmals regiert die AfD im Bund mit.</p>' : '') +
        (r.neg && r.neg.success && r.government.indexOf(g.party) !== -1 ? '<p class="small">📜 Koalitionsvertrag: ' + num1(r.neg.kept).replace(',0', '') + ' von ' + r.neg.topics.length +
          ' Streitpunkten durchgesetzt; eure Ressorts: ' + esc(Object.keys(r.neg.ministries || {}).filter(id => r.neg.ministries[id] === g.party).map(id => E.ministryById(id).short).join(', ') || '–') + ' (' + (r.neg.pts >= 0 ? '+' : '') + r.neg.pts + ' Punkte).</p>' : '') +
        (r.neg && r.neg.done && !r.neg.success ? '<p class="fw-note">💥 Die Verhandlungen mit euch sind gescheitert.</p>' : '') +
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
        '<p class="muted small">Ausgeschlossen: Koalitionen mit der AfD, solange ein Partner die Brandmauer hält; CDU/CSU mit der Linken; ' +
        'Parteien, die die Brandmauer halten, regieren nicht mit Parteien, die eine Tolerierung oder Koalition mit der AfD anbieten.</p>';
    }
    box.innerHTML = html;
    appendFirewallBreak(box);
  }

  // Wahlabend: Mit der AfD gäbe es eine Mehrheit – Brandmauer einreißen?
  function appendFirewallBreak(box) {
    const r0 = g.result;
    if (r0.government && r0.government.indexOf(g.party) !== -1) return; // ihr regiert schon
    if (r0.neg && !r0.neg.done) return;
    const opts = E.firewallOptions(g);
    if (!opts.length) return;
    const div = document.createElement('div');
    div.className = 'fw-break';
    div.innerHTML = '<h3>🧱 Brandmauer einreißen?</h3><p class="small">Mit der AfD hättet ihr eine Mehrheit im Bundestag. Ihr würdet regieren – ' +
      'aber gegen den Protest von Millionen, mit Austritten, Demonstrationen und Kritik von Kirchen, Gewerkschaften und Verbänden. ' +
      'Das kostet euch 25 Punkte in der Bilanz.</p>';
    opts.forEach((o, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn coalition-option fw-option';
      b.innerHTML = pills(o.members, g.result.seats) + '<span class="hint">' + o.seats + ' Sitze · Koalition mit der AfD</span>';
      b.addEventListener('click', () => {
        if (!confirmOnButton(b, 'Wirklich? Nochmal tippen: Brandmauer einreißen und mit der AfD regieren')) return;
        E.breakFirewall(g, i); save(); renderElection(false);
      });
      div.appendChild(b);
    });
    box.appendChild(div);
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
      (r.turnout ? '<p class="muted small">Wahlbeteiligung: ' + pct(r.turnout) + (prevTurnout() ? ' (' + prevYear() + ': ' + pct(prevTurnout()) + ')' : '') + '</p>' : '') +
      (r.lastPoll ? '<p class="muted small">Letzte Umfrage: ' + pct(r.lastPoll[g.party]) + ' ± ' + E.POLL_RANGE + ' – das echte Ergebnis lag ' +
        (Math.abs(r.shares[g.party] - r.lastPoll[g.party]) < 0.3 ? 'fast genau darauf.' : signed(r.shares[g.party] - r.lastPoll[g.party]) + ' Punkte daneben.') + '</p>' : '') +
      '<p>' + esc(statusText) + '</p>' +
      (o.firewall ? '<p class="fw-note">🧱 Ihr habt die Brandmauer eingerissen. Proteste im ganzen Land (−25 Punkte).</p>' : '') +
      '<p>' + (o.goal ? '✅ Wahlziel erreicht: ' : '❌ Wahlziel verfehlt: ') + esc(p.goalText) + '</p>' +
      '<div class="mob-bars flows result-flows"><span class="mob-label">Wählerwanderung seit Wahlkampfstart (Prozentpunkte)</span>' + flowBarsHtml(E.flowSummary(g, g.party), g.party) + '</div>';
    card.hidden = false;
  }

  // Nach dem Wahlabend: weiter in die Legislaturperiode.
  $('btn-term').addEventListener('click', () => {
    if (!g || !g.result || !g.result.outcome || !window.BTW_TERM) return;
    window.BTW_TERM.startTerm(g);
    save();
    window.BTW_TERMUI.start(g);
  });

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

  // Koalitionsaussage zur AfD beim Programmparteitag.
  const FW_CHOICES = [
    { icon: '🧱', desc: 'Keine Zusammenarbeit mit der AfD – keine gemeinsamen Mehrheiten, keine Tolerierung, keine Koalition.' },
    { icon: '🗳️', desc: 'Keine Koalition – aber eure Anträge bringt ihr ein, auch wenn sie nur mit AfD-Stimmen eine Mehrheit finden.' },
    { icon: '🤝', desc: 'Eine Minderheitsregierung, die von der AfD toleriert wird, schließt ihr nicht aus.' },
    { icon: '⚠️', desc: 'Ihr seid offen für eine Koalition mit der AfD.' }
  ];
  const FW_CHOICES_AFD = [
    { icon: '💪', name: 'Auf eigene Stärke setzen', desc: 'Ihr kämpft für eine eigene Mehrheit und umwerbt niemanden.' },
    { icon: '🤝', name: 'Offen um Partner werben', desc: 'Ihr bietet Union, FDP und BSW eine Zusammenarbeit an. Das erhöht den Druck, sich zu öffnen – und mobilisiert eure Gegner.' }
  ];
  function renderFirewallChoice() {
    const box = $('fw-choice');
    if (!box || !draft) return;
    const afd = chosenParty === 'afd';
    const list = afd ? FW_CHOICES_AFD : FW_CHOICES;
    const cur = Math.min(list.length - 1, draft.firewall || 0);
    const taboo = ['spd', 'gruene', 'linke'].indexOf(chosenParty) !== -1;
    box.innerHTML = '<h3>' + (afd ? 'Unsere Haltung zu Koalitionen' : 'Koalitionsaussage: Wie haltet ihr es mit der AfD?') + '</h3>' +
      '<p class="flyer-hint">' + (afd
        ? 'Ohne Partner bleibt ihr in der Opposition – es sei denn, ihr holt die absolute Mehrheit.'
        : 'Wer die Brandmauer öffnet, gewinnt AfD-nahe Wähler, verliert aber in der Mitte. Parteien, die die Brandmauer halten, mobilisieren dagegen und regieren ab einer Tolerierung nicht mehr mit euch. Im Wahlkampf könnt ihr eure Haltung noch ändern.' +
          (taboo ? ' <strong>Für eure Anhänger wäre jede Öffnung ein Tabubruch – die Verluste wären massiv.</strong>' : '')) + '</p>' +
      '<div class="fw-grid">' + list.map((c, i) => '<button type="button" class="core-card fw-card' + (i === cur ? ' picked' : '') + '" data-fw="' + i + '" aria-pressed="' + (i === cur) + '">' +
        '<span class="fw-icon" aria-hidden="true">' + c.icon + '</span><b>' + esc(c.name || E.FW_LEVELS[i].name) + '</b><span class="fw-desc">' + esc(c.desc) + '</span></button>').join('') + '</div>';
    box.querySelectorAll('.fw-card').forEach(b => b.addEventListener('click', () => {
      draft.firewall = Number(b.dataset.fw);
      renderFirewallChoice();
      renderProgramSummary();
    }));
  }

  function renderProgram() {
    renderFirewallChoice();
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
        tags.push(positionGroupTags(t.id, i, D.PROGRAM[t.id].findIndex(x => x.lean === p.lean[t.id])));
        return '<label class="option"><input type="radio" name="pos-' + t.id + '" value="' + i + '"' +
          (draft.positions[t.id] === i ? ' checked' : '') + '>' +
          '<span class="olabel">' + esc(o.label) + '</span><span class="odesc">' + esc(o.desc) + '</span>' +
          '<span class="ometa">' + tags.join('') + '</span></label>';
      }).join('');
      const fans = topicFans(t.id);
      return '<fieldset class="topic-set" data-topic="' + t.id + '"><legend>' + t.icon + ' ' + esc(t.name) +
        '<span class="core-mark" data-core="' + t.id + '" hidden>🎯 Kernthema</span></legend>' +
        (fans.length ? '<p class="set-fans">Besonders wichtig für ' + groupIcons(fans) + '</p>' : '') +
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

  // Gruppen, denen ein Thema besonders wichtig ist.
  function topicFans(topic, min) {
    return D.GROUPS.filter(k => (k.topics[topic] || 1) >= (min || 1.4)).sort((a, b) => b.topics[topic] - a.topics[topic]);
  }

  function groupIcons(list) {
    return list.map(k => '<span class="gfan" title="' + esc(k.name) + '">' + k.icon + ' ' + esc(k.short) + '</span>').join('');
  }

  // Wem eine Position mehr oder weniger gefällt als die Parteilinie.
  function positionGroupTags(topic, i, lineIndex) {
    if (i === lineIndex) return '';
    const a = E.positionAppeal(topic, i);
    const b = E.positionAppeal(topic, lineIndex);
    const d = D.GROUPS.map(k => ({ k, v: a[k.id] - b[k.id] }));
    const plus = d.filter(x => x.v >= 0.12).sort((x, y) => y.v - x.v).slice(0, 3).map(x => x.k);
    const minus = d.filter(x => x.v <= -0.12).sort((x, y) => x.v - y.v).slice(0, 3).map(x => x.k);
    return (plus.length ? '<span class="tag gtag plus">👍 ' + plus.map(k => k.icon + ' ' + esc(k.short)).join(', ') + '</span>' : '') +
      (minus.length ? '<span class="tag gtag minus">👎 ' + minus.map(k => k.icon + ' ' + esc(k.short)).join(', ') + '</span>' : '');
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
        '<span class="core-bar"><span style="width:' + Math.min(100, interest * 4) + '%"></span></span></span>' +
        (topicFans(t.id).length ? '<span class="core-fans">Wichtig für ' + groupIcons(topicFans(t.id)) + '</span>' : '');
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
    if (prog.firewall > 0) {
      html += '<p class="fp-fw">' + (partyId === 'afd' ? '🤝 Offen für Koalitionen mit Union, FDP und BSW' : '⚠️ Koalitionsaussage: ' + esc(E.FW_LEVELS[prog.firewall].name)) + '</p>';
    }
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
      // Die erste Umfrage bleibt bis nach dem Parteitag geheim (eigener Bildschirm).
      const poll = '';
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
        '<p class="flyer-hint comp-legend">Der Strich im Balken zeigt die Kompetenz vor eurem Programm.</p>' +
        bilanzGroupsHtml(fx.groups);
    }
    if (errors.length) html += '<ul class="errors">' + errors.map(e => '<li>' + esc(e) + '</li>').join('') + '</ul>';
    $('program-summary').innerHTML = html;
  }

  // Bilanz: Wie das Programm bei den Wählergruppen ankommt und wo es regional wirkt.
  function bilanzGroupsHtml(groups) {
    const max = Math.max(2, ...Object.values(groups).map(v => Math.abs(v)));
    const rows = D.GROUP_DIMS.map(dim => '<div class="bg-dim"><h4 class="gp-dim">' + esc(dim.name) + '</h4>' +
      D.GROUPS.filter(k => k.dim === dim.id).map(k => {
        const v = groups[k.id] || 0;
        const w = Math.min(50, Math.abs(v) / max * 50);
        return '<div class="bg-row"><span class="bg-name">' + k.icon + ' ' + esc(k.short) + '</span>' +
          '<span class="bg-track"><i class="' + (v >= 0 ? 'good' : 'bad') + '" style="' + (v >= 0 ? 'left:50%' : 'left:' + (50 - w) + '%') + ';width:' + w + '%"></i></span>' +
          '<span class="bg-val ' + (v > 0.05 ? 'good' : v < -0.05 ? 'bad' : '') + '">' + signed(v) + '</span></div>';
      }).join('') + '</div>').join('');
    const states = D.STATES.map(st => ({ st, v: E.programStateEffect(groups, st.id) })).sort((a, b) => b.v - a.v);
    const any = states.some(x => Math.abs(x.v) >= 0.05);
    const list = arr => arr.map(x => esc(x.st.name) + ' <b class="' + (x.v >= 0 ? 'good' : 'bad') + '">' + signed(x.v) + '</b>').join(', ');
    return '<h3 class="bilanz-h3">Wie das Programm bei den Wählergruppen ankommt</h3>' +
      '<p class="flyer-hint">Gemessen an der Parteilinie: Wer Positionen wechselt oder andere Kernthemen setzt, gewinnt manche Gruppen und verliert andere. ' +
      'Gruppen, die euer Programm mögen, lassen sich im Wahlkampf außerdem leichter mobilisieren.</p>' +
      '<div class="bilanz-groups">' + rows + '</div>' +
      (any ? '<p class="bilanz-regional">🗺️ <b>Regional:</b> Plus in ' + list(states.slice(0, 3)) + ' · Minus in ' + list(states.slice(-3).reverse()) + '</p>'
        : '<p class="bilanz-regional muted">Auf Parteilinie: Die Wählergruppen bleiben, wie sie sind.</p>');
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
    // Einführung vorauswählen, solange sie noch nie gesehen wurde.
    let seen = false;
    try { seen = !!localStorage.getItem(TOUR_KEY); } catch (e) { /* optional */ }
    $('tour-yes').checked = !seen;
    $('tour-no').checked = seen;
    const p = E.party(game.party);
    const k = KICKOFF[game.party] || { title: 'Auf in den Wahlkampf!', place: 'Wahlkampfauftakt', speech: '' };
    const screen = $('screen-kickoff');
    show('kickoff');
    applyPartyTheme(screen, game.party);
    document.body.style.background = getComputedStyle(screen).getPropertyValue('--fl-paper').trim();
    const shares = E.pollShares(game);
    const weeks = game.maxWeeks;
    $('ko-kicker').textContent = k.place + ' · noch ' + weeks + ' Wochen bis zur Bundestagswahl';
    $('ko-title').textContent = k.title;
    $('ko-slogan').textContent = '„' + game.program.slogan + '“';
    $('ko-candidate').textContent = candidateLine(game.candidate);
    const speaker = String(game.candidate || '').trim() && game.candidate !== DEFAULT_CANDIDATE ? game.candidate : 'Eure Spitzenkandidatur';
    $('ko-speech').innerHTML = '<p>„' + esc(k.speech) + '“</p><footer>— ' + esc(speaker) + ' bei der Auftaktkundgebung</footer>';
    const core = game.program.core.map(id => E.topicById(id));
    $('ko-stats').innerHTML =
      '<div class="ko-stat"><span class="ko-label">📊 Erste Umfrage</span><span class="ko-big">' + pct(shares[game.party]) + '<small> ± ' + E.POLL_RANGE + '</small></span></div>' +
      '<div class="ko-stat"><span class="ko-label">🏁 Euer Wahlziel</span><span class="ko-goal">' + esc(p.goalText) + '</span></div>' +
      '<div class="ko-stat"><span class="ko-label">💶 Wahlkampfkasse</span><span class="ko-big">' + money(game.money) + '</span></div>' +
      '<div class="ko-stat"><span class="ko-label">👥 Wahlkampfteam</span><span class="ko-big">' + game.teamMax + '<small> Einsätze/Woche</small></span>' +
        '<span class="ko-goal">' + (p.members ? p.members.toLocaleString('de-DE') + ' Mitglieder' : '') + '</span></div>' +
      '<div class="ko-stat ko-core"><span class="ko-label">🎯 Eure Kernthemen</span><span class="ko-topics">' +
        core.map(t => '<span>' + t.icon + ' ' + esc(t.name) + '</span>').join('') + '</span></div>';
    $('ko-steps').innerHTML = [
      ['🗺️', 'Vor Ort kämpfen', 'Auf der Seite „Deutschland“ sucht ihr euch Bundesländer aus und geht mit Kundgebungen, Plakaten und Haustürwahlkampf auf Stimmenfang.'],
      ['📣', 'Themen setzen', 'Unter „Aktionen“ wählt ihr ein Thema und macht es mit TV-Spots, Social Media, Pressekonferenzen und Talkshows groß – am besten eure Kernthemen.'],
      ['📅', 'Woche für Woche', 'Jede Woche hat eure Spitzenkandidatur ' + game.apMax + ' Termine (Kundgebung, Bürgerdialog, Betriebsbesuch, Talkshow, Presse, Interview), euer Team ' + game.teamMax + ' Einsätze (ab Woche ' + E.TEAM_LATE_WEEK + ': ' + (game.teamMax + E.TEAM_LATE - E.TEAM_PER_WEEK) + ') für Haustür, Infostand, Plakate, Social Media und mehr. Danach gibt es eine neue Umfrage – und manchmal eine Eilmeldung, auf die ihr reagieren müsst.'],
      ['📺', 'TV-Duell in Woche ' + E.DUEL_WEEK, 'Kurz vor der Wahl kommt die Elefantenrunde. Wer bei den wichtigsten Themen sattelfest ist, punktet.'],
      ['🥊', 'Die Konkurrenz schläft nicht', 'Die anderen Parteien setzen ihre Themen, kämpfen um knappe Länder – und schlagen zurück, wenn ihr zu stark werdet oder ihnen eure Kernthemen streitig machen wollt.'],
      ['👥', 'Wählergruppen und Abnutzung', 'Jung, mittel und alt, niedrige bis hohe Bildung, Stadt und Land, Männer und Frauen wollen unterschiedlich angesprochen werden. Wer immer dasselbe macht, verliert Wirkung – Geld ist knapp, TV-Zeit wird teurer.'],
      ['✉️', 'Briefwahl', 'Ab Woche ' + E.POSTAL_START + ' wählt ein Teil der Menschen per Brief – mit der Stimmung dieser Woche. Mit Briefwahl-Kampagnen sichert ihr eure Stimmen früh.'],
      ['🗳️', 'Mobilisieren', 'Nur wer wählen geht, zählt: Haustürwahlkampf, Kundgebungen und Social Media bringen Anhänger und Nichtwähler an die Urne – am meisten kurz vor der Wahl.'],
      ['📊', 'Umfragen sind nur Umfragen', 'Jede Umfrage hat eine Fehlerspanne von ± ' + E.POLL_RANGE + ' Punkten. Wo ihr wirklich steht, zeigt erst der Wahlabend. Und manche Entscheidung holt euch Wochen später wieder ein.']
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
    if (g.phase === 'term' && window.BTW_TERMUI) { window.BTW_TERMUI.start(g); return; }
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
    const game = E.newGame(chosenParty, $('candidate').value, undefined, draft, nextCarry || undefined);
    nextCarry = null;
    g = game;
    save();
    showReveal(game);
  });

  // Erste Umfrage nach dem Parteitag: Die Säulen erscheinen nacheinander, die eigene Partei zuletzt.
  let revealTimers = [];
  function showReveal(game) {
    const screen = $('screen-reveal');
    show('reveal');
    window.scrollTo(0, 0);
    applyPartyTheme(screen, game.party);
    document.body.style.background = getComputedStyle(screen).getPropertyValue('--fl-paper').trim();
    const shares = E.pollShares(game);
    const box = $('reveal-bars');
    box.innerHTML = pollColumnsHtml(shares, game.startShares);
    const me = game.party;
    const cols = {};
    box.querySelectorAll('.pc-col').forEach(c => {
      const bar = c.querySelector('.pc-bar');
      c.dataset.h = bar.style.height;
      bar.style.height = '0';
      cols[c.dataset.p] = c;
    });
    box.querySelectorAll('.pc-label').forEach(l => { cols[l.dataset.p + ':label'] = l; });
    box.classList.add('revealing');
    $('reveal-verdict').hidden = true;
    $('btn-reveal-go').hidden = true;
    $('btn-reveal-skip').hidden = false;
    $('reveal-suspense').textContent = 'Die Stimmen werden ausgezählt …';
    revealTimers.forEach(clearTimeout);
    revealTimers = [];
    // Erst „Andere“, dann die übrigen Parteien von klein nach groß, zum Schluss die eigene.
    const others = pollOrder().filter(p => p !== me && p !== D.OTHER.id).sort((a, b) => shares[a] - shares[b]);
    const order = [D.OTHER.id].concat(others);
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const step = reduce ? 80 : 750;
    const showCol = p => {
      const c = cols[p];
      if (!c) return;
      c.classList.add('shown');
      c.querySelector('.pc-bar').style.height = c.dataset.h;
      if (cols[p + ':label']) cols[p + ':label'].classList.add('shown');
    };
    order.forEach((p, i) => revealTimers.push(setTimeout(() => showCol(p), 600 + i * step)));
    const tMe = 600 + order.length * step + (reduce ? 100 : 1300);
    revealTimers.push(setTimeout(() => { $('reveal-suspense').textContent = '… und ' + E.party(me).name + '?'; }, tMe - (reduce ? 50 : 1100)));
    revealTimers.push(setTimeout(() => { showCol(me); }, tMe));
    revealTimers.push(setTimeout(() => finishReveal(game, shares), tMe + (reduce ? 100 : 1100)));
  }

  function finishReveal(game, shares) {
    revealTimers.forEach(clearTimeout);
    revealTimers = [];
    const box = $('reveal-bars');
    box.querySelectorAll('.pc-col').forEach(c => { c.classList.add('shown'); c.querySelector('.pc-bar').style.height = c.dataset.h; });
    box.querySelectorAll('.pc-label').forEach(l => l.classList.add('shown'));
    const me = game.party;
    const now = shares[me];
    const d = now - game.startShares[me];
    const rank = MAIN_ORDER.slice().sort((a, b) => shares[b] - shares[a]).indexOf(me) + 1;
    const mood = d >= 1.5 ? 'Der Parteitag war ein voller Erfolg!' : d >= 0.3 ? 'Rückenwind vom Parteitag.' : d > -0.3 ? 'Das Programm hat die Stimmung kaum bewegt.' : 'Der Parteitag kam nicht gut an.';
    $('reveal-suspense').textContent = '';
    const v = $('reveal-verdict');
    v.innerHTML = '<span class="rv-big">' + pct(now) + '<small> ± ' + E.POLL_RANGE + '</small></span>' +
      '<span class="rv-delta ' + (d >= 0 ? 'pos' : 'neg') + '">' + signed(d) + ' Punkte seit vor dem Parteitag</span>' +
      '<span class="rv-mood">' + mood + ' Platz ' + rank + ' von ' + MAIN_ORDER.length + '.</span>';
    v.hidden = false;
    $('btn-reveal-skip').hidden = true;
    $('btn-reveal-go').hidden = false;
    $('btn-reveal-go').focus();
  }

  $('btn-reveal-skip').addEventListener('click', () => { if (g) finishReveal(g, E.pollShares(g)); });
  $('btn-reveal-go').addEventListener('click', () => { if (g) showKickoff(g); });

  $('btn-kickoff-go').addEventListener('click', () => {
    if (!g) return;
    const want = $('tour-yes').checked;
    try { localStorage.setItem(TOUR_KEY, '1'); } catch (e) { /* optional */ }
    startGame(g);
    if (want) startTour();
  });

  // ---------- Einführung ----------
  // Schritt für Schritt durch den ersten Wahlkampftag: Bereich hervorheben, kurz erklären.
  const TOUR_KEY = 'btw-tour-seen';
  const tourSteps = () => [
    { title: 'Willkommen im Wahlkampf!', text: '<p>Ihr habt <b>' + g.maxWeeks + ' Wochen</b> bis zur Bundestagswahl. Euer Ziel: <b>' + esc(E.party(g.party).goalText) + '</b>.</p><p>Diese Einführung zeigt euch alle Bereiche. Ihr könnt sie jederzeit beenden und später über <b>❓ Einführung</b> wieder starten.</p>' },
    { sel: '#screen-game .topbar .stats', title: 'Eure Lage auf einen Blick', text: '<p><b>Woche</b> und <b>Wahlkampfkasse</b>. <b>🎤 Termine</b>: ' + g.apMax + ' Auftritte eurer Spitzenkandidatur pro Woche (Kundgebung, Bürgerdialog, Talkshow …). <b>👥 Team</b>: Einsätze eurer Mitglieder (Haustür, Infostand, Plakate, Social Media …) – große Parteien haben mehr Leute.</p><p><b>Umfrage</b>: euer Wert in der Sonntagsfrage, mit ± ' + E.POLL_RANGE + ' Punkten Fehlerspanne.</p>' },
    { sel: '#game-nav', title: 'Fünf Bereiche', text: '<p>Hier wechselt ihr zwischen <b>Deutschland</b> (Wahlkampf vor Ort), <b>Aktionen</b> (bundesweit), <b>Umfragen</b>, eurem <b>Wahlprogramm</b> und den <b>Nachrichten</b>.</p>' },
    { tab: 'map', sel: '#map', title: 'Die Deutschlandkarte', text: '<p>Die Farbe zeigt, wer im Land vorn liegt, die Zahl euren Umfragewert dort. Tippt ein Land an, um dort Wahlkampf zu machen.</p>' },
    { tab: 'map', sel: '#map-mode', title: 'Wahlkreise und Erststimmen', text: '<p>Schaltet um auf die <b>299 Wahlkreise</b>: Wer liegt bei den Erststimmen vorn? Mit <b>drei Direktmandaten</b> zieht eine Partei auch unter 5 % in den Bundestag ein (Grundmandatsklausel).</p><p>Vor Ort könnt ihr einen Wahlkreis als <b>Schwerpunkt</b> wählen oder eine <b>Erststimmen-Kampagne</b> starten.</p>' },
    { tab: 'map', sel: '#state-detail', title: 'Das Land im Detail', text: '<p>Umfrage im Land, Wahlberechtigte und erwartete Wahlbeteiligung. Große Länder bringen mehr Stimmen, knappe Länder lohnen sich besonders.</p>' },
    { tab: 'map', sel: '#screen-game .local-block', title: 'Wahlkampf vor Ort', text: '<p>In drei Schritten: erst ein <b>Thema</b> (🎯 = Kernthema, das die Menschen im Land bewegt), dann die <b>Aktion</b>, dann die <b>Zielgruppe</b>.</p><p>Vor jeder Aktion stellt euch das Team Fragen zur Vorbereitung – gute Antworten machen die Aktion wirksamer. Bei Bürgerdialog, Infostand & Co. stellen euch Bürger Fachfragen: Richtige Antworten stärken eure Kompetenz im Thema.</p><p>Wer dieselbe Gruppe immer wieder mit demselben Thema umwirbt, erreicht sie schlechter – Abwechslung lohnt sich.</p>' },
    { tab: 'map', sel: '#sg-block', title: 'Wählergruppen im Land', text: '<p>Wer in diesem Land wählt – nach Alter, Bildung, Wohnort, Geschlecht, Konfession und Beruf – und wie ihr bei jeder Gruppe dasteht. Passt der Kanal zu den Gruppen im Land, wirkt eure Aktion besser.</p>' },
    { tab: 'actions', sel: '#topic-list', title: 'Themen bundesweit setzen', text: '<p>Wählt ein Thema und macht es mit TV-Spots, Social Media, Pressekonferenzen oder Talkshows groß. Zu euren <b>Kernthemen</b> wirkt das 25 % stärker.</p><p>Wird ein Thema wichtiger, profitieren die Parteien, die dort als kompetent gelten.</p>' },
    { tab: 'actions', sel: '#national-actions', title: 'Geld und Briefwahl', text: '<p>Einmal pro Woche ein <b>Spendendinner</b> für die Kasse. Ab Woche ' + (E.POSTAL_START - 1) + ' eine <b>Briefwahl-Kampagne</b>: Ab Woche ' + E.POSTAL_START + ' wählen viele per Brief – diese Stimmen sind sicher.</p>' },
    { tab: 'actions', sel: '#rival-party', up: '.act-block', title: 'Zielgruppen-Werbung und Angriffe', text: '<p>Darüber: Online-Anzeigen für genau eine Wählergruppe. Hier: eine Vergleichskampagne gegen eine andere Partei – riskant, und die Angegriffenen schlagen eher zurück.</p>' },
    { tab: 'polls', sel: '#poll-bars', title: 'Die Sonntagsfrage', text: '<p>Einmal pro Woche eine neue Umfrage. Die helle Fläche zeigt die Fehlerspanne: Wo ihr wirklich steht, zeigt erst der Wahlabend.</p>' },
    { tab: 'polls', sel: '#cand-panel', title: 'Eure Spitzenkandidatur', text: '<p><b>Bekanntheit</b> wächst mit jedem Auftritt, <b>Beliebtheit</b> mit gelungenen Terminen, guter Vorbereitung und einem starken TV-Duell. Patzer, Skandale und Negativkampagnen kosten Ansehen.</p><p>Eine beliebte Kandidatur zieht Stimmen – und entscheidet die <b>Kanzlerfrage</b>.</p>' },
    { tab: 'polls', sel: '#mobilization', title: 'Wahlbeteiligung und Mobilisierung', text: '<p>Nur wer wählen geht, zählt. Haustürwahlkampf, Infostände und Kundgebungen bringen eure Anhänger an die Urne – kurz vor der Wahl wirkt das am meisten.</p>' },
    { tab: 'polls', sel: '#flows', title: 'Wählerwanderung', text: '<p>Von wem ihr Stimmen holt und an wen ihr verliert. Habt ihr bei einem Thema Kompetenz aufgebaut und sprecht damit eine Zielgruppe an, holt ihr die Stimmen gezielt bei der Partei, die das Thema sonst besetzt.</p>' },
    { tab: 'polls', sel: '#firewall', title: 'Die Brandmauer', text: '<p>Welche Partei die Abgrenzung zur AfD noch hält. Wer sie einreißt, gewinnt AfD-nahe Wähler, verliert aber in der Mitte – und verändert, wer mit wem regieren kann.</p>' },
    { tab: 'polls', sel: '#groups', title: 'Wählergruppen bundesweit', text: '<p>Euer Wert in jeder Gruppe und ihre Lieblingsthemen. Tippt eine Gruppe an, um ihre eigene Umfrage samt Verlauf zu sehen.</p>' },
    { tab: 'program', sel: '#program-view', title: 'Euer Wahlprogramm', text: '<p>Euer Flyer vom Programmparteitag: Kernthemen und Positionen. Die Kompetenz aus der Fachkonferenz begleitet euch durch den Wahlkampf.</p>' },
    { tab: 'news', sel: '#screen-game .news-card', title: 'Nachrichten', text: '<p>Was ihr getan habt, was die Konkurrenz plant und welche Eilmeldungen kamen. Die anderen Parteien reagieren auf euch – mit Gegenkampagnen und indem sie eure Themen besetzen.</p>' },
    { tab: 'map', sel: '#btn-end-week', title: 'Woche beenden', text: '<p>Habt ihr eure Termine und Einsätze genutzt, beendet ihr die Woche. Dann gibt es eine neue Umfrage – und manchmal eine <b>Eilmeldung</b>, auf die ihr reagieren müsst.</p><p>In Woche ' + E.DUEL_WEEK + ' wartet die <b>Elefantenrunde</b> im Fernsehen.</p>' },
    { title: 'Viel Erfolg!', text: '<p>Das war’s. Fangt am besten mit einem Land an, in dem es knapp ist, oder setzt eines eurer Kernthemen. Die Einführung findet ihr jederzeit unter <b>❓ Einführung</b>.</p>' }
  ];
  let tourIdx = -1;
  let tourList = [];
  function startTour() {
    if (!g || g.phase !== 'campaign') return;
    closeModal();
    tourList = tourSteps();
    tourIdx = 0;
    $('tour').hidden = false;
    document.body.classList.add('touring');
    showTourStep();
  }
  function endTour() {
    tourIdx = -1;
    $('tour').hidden = true;
    document.body.classList.remove('touring');
    showGameTab('map');
    window.scrollTo({ top: 0, behavior: 'instant' });
    checkPending();
  }
  function tourTarget(st) {
    if (!st.sel) return null;
    let el = document.querySelector(st.sel);
    if (el && st.up) el = el.closest(st.up) || el;
    return el && el.getClientRects().length ? el : null;
  }
  function showTourStep() {
    const st = tourList[tourIdx];
    if (!st) { endTour(); return; }
    if (st.tab) showGameTab(st.tab);
    $('tour-count').textContent = 'Einführung · ' + (tourIdx + 1) + ' von ' + tourList.length;
    $('tour-title').textContent = st.title;
    $('tour-text').innerHTML = st.text;
    $('tour-prev').disabled = tourIdx === 0;
    $('tour-next').textContent = tourIdx === tourList.length - 1 ? 'Los geht’s!' : 'Weiter →';
    const el = tourTarget(st);
    if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' });
    placeTour();
    $('tour-next').focus();
  }
  function placeTour() {
    if (tourIdx < 0) return;
    const st = tourList[tourIdx];
    const el = tourTarget(st);
    const spot = $('tour-spot');
    const box = $('tour-box');
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    box.classList.remove('center');
    if (!el) {
      spot.hidden = true;
      box.classList.add('center');
      box.style.left = box.style.top = '';
      return;
    }
    spot.hidden = false;
    const r = el.getBoundingClientRect();
    const pad = 6;
    const top = Math.max(4, r.top - pad);
    const bottom = Math.min(vh - 4, r.bottom + pad);
    spot.style.left = Math.max(4, r.left - pad) + 'px';
    spot.style.top = top + 'px';
    spot.style.width = Math.min(vw - 8, r.width + 2 * pad) + 'px';
    spot.style.height = Math.max(20, bottom - top) + 'px';
    // Erklärung unter oder über dem Bereich; auf schmalen Bildschirmen unten am Rand.
    const bw = Math.min(420, vw - 24);
    box.style.width = bw + 'px';
    const bh = box.offsetHeight;
    let bt;
    if (vh - bottom > bh + 16) bt = bottom + 10;
    else if (top > bh + 16) bt = top - bh - 10;
    else bt = vh - bh - 12;
    box.style.top = Math.max(8, bt) + 'px';
    box.style.left = Math.max(12, Math.min(vw - bw - 12, r.left + r.width / 2 - bw / 2)) + 'px';
  }
  $('tour-next').addEventListener('click', () => { tourIdx += 1; if (tourIdx >= tourList.length) endTour(); else showTourStep(); });
  $('tour-prev').addEventListener('click', () => { if (tourIdx > 0) { tourIdx -= 1; showTourStep(); } });
  $('tour-skip').addEventListener('click', endTour);
  $('btn-tour').addEventListener('click', startTour);
  window.addEventListener('resize', placeTour);
  window.addEventListener('scroll', placeTour, { passive: true });
  document.addEventListener('keydown', e => {
    if (tourIdx < 0) return;
    if (e.key === 'Escape') endTour();
    else if (e.key === 'ArrowRight') $('tour-next').click();
    else if (e.key === 'ArrowLeft') $('tour-prev').click();
  });

  const resume = () => {
    const saved = loadSave();
    if (saved) startGame(saved);
  };
  $('btn-intro-resume').addEventListener('click', resume);

  $('btn-end-week').addEventListener('click', () => {
    const left = g.ap + (g.team || 0);
    if (left > 0 && !confirmOnButton($('btn-end-week'), 'Noch ' + left + ' Aktion' + (left > 1 ? 'en' : '') + ' übrig – trotzdem beenden?')) return;
    const before = E.pollShares(g)[g.party];
    const res = E.endWeek(g);
    if (!res.ok) { if (res.text) toast(res.text); return; }
    save();
    $('feedback').textContent = '';
    $('local-feedback').textContent = '';
    if (res.election) { closeModal(); showElection(); return; }
    const after = E.pollShares(g)[g.party];
    const rivals = g.log.filter(l => l.type === 'ai' && l.week === g.week - 1 && /euch|Kernthema/.test(l.text)).length;
    toast('Neue Umfrage: ' + pct(after) + ' ± ' + E.POLL_RANGE + ' (' + signed(after - before) + ' zur Vorwoche)' +
      (rivals ? ' · 🥊 Die Konkurrenz greift euch an!' : ''));
    renderGame();
    weekReview(before, after, checkPending);
  });

  // Wochenrückblick wie in den Abendnachrichten: die Bilder eurer Woche.
  function weekReview(before, after, next) {
    const wk = g.week - 1;
    const shots = (g.shots || []).filter(x => x.w === wk).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 3);
    if (!shots.length) { next(); return; }
    openModal('Woche ' + wk + ' · Der Wahlkampf in Bildern', '📺 Die Woche von ' + g.candidate,
      '<ol class="sc-review">' + shots.map(x => '<li><span class="sc-rv-icon">' + x.icon + '</span><div><b>„' + esc(x.text) + '“</b><small>' + esc(x.title) + (x.d ? ' · ' + signed(x.d) + ' bundesweit' : '') + '</small></div></li>').join('') + '</ol>' +
      '<p>Neue Umfrage: <b>' + pct(after) + '</b> (' + signed(after - before) + ' zur Vorwoche)</p>',
      [{ label: 'Weiter', primary: true, onClick: () => { closeModal(); next(); } }]);
  }

  $('btn-restart').addEventListener('click', () => {
    clearSave();
    nextCarry = null;
    E.applyYear(E.YEAR0);
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

  // Schnittstelle für die Legislaturperiode (js/termui.js).
  window.BTW_UI = {
    setGame: x => { g = x; }, show, applyPartyTheme, save, saveHall, toast,
    runAction: (id, target, done) => runAction(E.ACTIONS.find(x => x.id === id), target || {}, done), confirmOnButton, openModal, closeModal,
    esc, col, onCol, num1, pct, signed, short, money, pollColumnsHtml, hemicycle, seatLegend, pills,
    // Nach der Legislaturperiode: Programmparteitag für den nächsten Wahlkampf mit dem Stand von heute.
    startNextCampaign(next) {
      if (!next) return;
      nextCarry = next.carry;
      chosenParty = next.party;
      E.applyYear(next.carry.year);
      $('candidate').value = next.candidate || '';
      updateSignature();
      enterProgram();
      if (next.program) {
        Object.keys(next.program.positions).forEach(t => { draft.positions[t] = next.program.positions[t]; });
        draft.slogan = next.program.slogan || draft.slogan;
        renderProgram();
      }
      toast('Bundestagswahl ' + next.carry.year + ': Neues Wahlprogramm, neuer Wahlkampf!');
    }
  };

  renderStart();
})();
