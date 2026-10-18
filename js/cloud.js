/*
 * Spielstand im Claude-Konto: Im veröffentlichten Spiel auf claude.ai wird der Spielstand privat pro Person
 * gespeichert (db-Capability, Pfad data/users/<id>/…) und ist so auf allen Geräten verfügbar. Außerhalb von
 * claude.ai (lokale Datei, eigene Website) bleibt alles wie bisher im Browser – das Modul meldet dann „aus“.
 *
 * Ein Spielstand ist über 100 KB groß, ein Dokument darf höchstens 256 KiB haben: Der Text wird in Stücke
 * geteilt (save-0, save-1, …); das Kopfdokument „save“ nennt Zahl und Zeitstempel der Stücke. Geschrieben wird
 * nacheinander, erst die Stücke, dann der Kopf – so liest ein anderes Gerät nie einen halben Stand.
 */
(function (root) {
  const CHUNK = 180000;
  let db = null;
  let col = null;
  let status = 'off';        // off | connecting | on | error
  let pending = null;        // nächster zu schreibender Stand { s, at }
  let writing = false;
  let timer = null;
  const listeners = [];

  const setStatus = s => { status = s; listeners.forEach(fn => { try { fn(s); } catch (e) { /* ignorieren */ } }); };

  async function init() {
    if (!root.claude || typeof root.claude.use !== 'function') return null;
    setStatus('connecting');
    try {
      const [d, user] = await Promise.all([root.claude.use('db'), root.claude.use('user')]);
      const uid = user ? await user.id() : null;
      if (!d || !uid) { setStatus('off'); return null; }
      db = d;
      col = db.collection('data/users/' + uid);
      const remote = await readSave();
      const hall = await col.doc('hall').get().then(x => (x.exists ? x.data().list : null)).catch(() => null);
      setStatus('on');
      return { save: remote, hall };
    } catch (e) {
      setStatus('error');
      return null;
    }
  }

  async function readSave() {
    const head = await col.doc('save').get();
    if (!head.exists) return null;
    const h = head.data();
    if (!h.n) return { s: null, at: h.at || 0 };
    const parts = [];
    for (let i = 0; i < h.n; i++) {
      const p = await col.doc('save-' + i).get();
      if (!p.exists || p.data().at !== h.at) return null; // unvollständig: lieber nichts als ein halber Stand
      parts.push(p.data().s);
    }
    return { s: parts.join(''), at: h.at };
  }

  async function flush() {
    if (writing || !pending || !col) return;
    writing = true;
    const job = pending;
    pending = null;
    try {
      const n = job.s ? Math.ceil(job.s.length / CHUNK) : 0;
      for (let i = 0; i < n; i++) await col.doc('save-' + i).set({ at: job.at, s: job.s.slice(i * CHUNK, (i + 1) * CHUNK) });
      await col.doc('save').set({ at: job.at, n, label: job.label || '' });
      if (status !== 'on') setStatus('on');
    } catch (e) {
      if (e && e.code === 'unavailable' && !pending) pending = job; // einmal später erneut
      setStatus(e && (e.code === 'revoked' || e.code === 'invalid_argument') ? 'off' : 'error');
    }
    writing = false;
    if (pending) timer = setTimeout(flush, 2000);
  }

  // Speichern bündeln: Viele Klicks hintereinander ergeben einen Schreibvorgang pro Pause.
  function push(s, at, label) {
    if (!col) return;
    pending = { s, at, label };
    clearTimeout(timer);
    timer = setTimeout(flush, 1500);
  }
  function clear(at) { push(null, at, ''); }

  async function pushHall(list) {
    if (!col) return;
    try { await col.doc('hall').set({ list }); } catch (e) { /* optional */ }
  }

  root.BTW_CLOUD = { init, push, clear, pushHall, status: () => status, onStatus: fn => listeners.push(fn) };
})(this);
