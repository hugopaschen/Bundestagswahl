// Erzeugt js/wahlkreise.js aus den amtlichen Daten der Bundeswahlleiterin (quellen/btw25):
// Wahlkreisgrenzen (Shapefile auf Basis VG250, nicht generalisiert, WGS84) und Erst-/Zweitstimmen je Wahlkreis (kerg2.csv).
// Die Grenzen werden grenztreu vereinfacht: Gemeinsame Grenzabschnitte zweier Wahlkreise werden nur einmal vereinfacht,
// damit Nachbarn lückenlos aneinanderpassen. Die Genauigkeit richtet sich nach der Größe des Landes (Zoomstufe im Spiel).
// Aufruf: node tools/build-wahlkreise.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'quellen', 'btw25');
const ZIP = path.join(SRC, 'btw25_geometrie_wahlkreise_vg250_shp_geo.zip');
const unzip = name => execSync('unzip -p "' + ZIP + '" "' + name + '"', { maxBuffer: 64 << 20 });

const LAND = { '01': 'SH', '02': 'HH', '03': 'NI', '04': 'HB', '05': 'NW', '06': 'HE', '07': 'RP', '08': 'BW',
  '09': 'BY', '10': 'SL', '11': 'BE', '12': 'BB', '13': 'MV', '14': 'SN', '15': 'ST', '16': 'TH' };
const PARTY = { CDU: 'union', CSU: 'union', AfD: 'afd', SPD: 'spd', 'GRÜNE': 'gruene', 'Die Linke': 'linke', BSW: 'bsw', FDP: 'fdp',
  'FREIE WÄHLER': 'fw', Volt: 'volt', Tierschutzpartei: 'tierschutz' };
const IDS = ['union', 'afd', 'spd', 'gruene', 'linke', 'bsw', 'fdp', 'fw', 'volt', 'tierschutz'];

// ---------- Shapefile (Polygone) und DBF lesen ----------
function readShp(buf) {
  const shapes = [];
  let o = 100;
  while (o < buf.length) {
    const len = buf.readInt32BE(o + 4) * 2;
    const c = o + 8;
    const type = buf.readInt32LE(c);
    if (type === 5) {
      const nParts = buf.readInt32LE(c + 36);
      const nPts = buf.readInt32LE(c + 40);
      const parts = [];
      for (let i = 0; i < nParts; i++) parts.push(buf.readInt32LE(c + 44 + 4 * i));
      const p0 = c + 44 + 4 * nParts;
      const rings = parts.map((s, i) => {
        const e = i + 1 < nParts ? parts[i + 1] : nPts;
        const ring = [];
        for (let k = s; k < e; k++) ring.push([buf.readDoubleLE(p0 + 16 * k), buf.readDoubleLE(p0 + 16 * k + 8)]);
        return ring;
      });
      shapes.push(rings);
    } else shapes.push([]);
    o = c + len;
  }
  return { shapes, bbox: [buf.readDoubleLE(36), buf.readDoubleLE(44), buf.readDoubleLE(52), buf.readDoubleLE(60)] };
}

function readDbf(buf) {
  const n = buf.readUInt32LE(4);
  const headLen = buf.readUInt16LE(8);
  const recLen = buf.readUInt16LE(10);
  const fields = [];
  for (let i = 32; buf[i] !== 0x0d; i += 32) {
    fields.push({ name: buf.toString('latin1', i, i + 11).replace(/\0.*$/, ''), len: buf[i + 16] });
  }
  const rows = [];
  for (let r = 0; r < n; r++) {
    let o = headLen + r * recLen + 1;
    const row = {};
    fields.forEach(f => { row[f.name] = buf.toString('utf8', o, o + f.len).trim(); o += f.len; });
    rows.push(row);
  }
  return rows;
}

// ---------- Projektion und Vereinfachung ----------
const shp = readShp(unzip('btw25_geometrie_wahlkreise_vg250_shp_geo.shp'));
const dbf = readDbf(unzip('btw25_geometrie_wahlkreise_vg250_shp_geo.dbf'));
const [lonMin, latMin, lonMax, latMax] = shp.bbox;
const K = Math.cos(51.2 * Math.PI / 180); // Längengrade wie bei der Länderkarte gestaucht
const W = 600;
const S = W / ((lonMax - lonMin) * K);
const H = Math.round((latMax - latMin) * S);
const proj = ([lon, lat]) => [(lon - lonMin) * K * S, (latMax - lat) * S];

function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let best = -1;
    let bi = -1;
    const [x1, y1] = pts[a];
    const [x2, y2] = pts[b];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const L = Math.hypot(dx, dy) || 1e-9;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / L;
      if (d > best) { best = d; bi = i; }
    }
    if (best > tol) { keep[bi] = 1; stack.push([a, bi], [bi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
// Geschlossene Ringe in zwei Hälften vereinfachen (Anfang = Ende würde sonst alles wegkürzen).
function ringDp(r, tol) {
  const pts = r.length > 1 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1] ? r.slice(0, -1) : r;
  if (pts.length < 6) return pts;
  const m = Math.floor(pts.length / 2);
  const a = dp(pts.slice(0, m + 1), tol);
  const b = dp(pts.slice(m).concat([pts[0]]), tol);
  return a.concat(b.slice(1, -1));
}
const area = r => { let s = 0; for (let i = 0; i < r.length; i++) { const [x1, y1] = r[i]; const [x2, y2] = r[(i + 1) % r.length]; s += x1 * y2 - x2 * y1; } return s / 2; };
function centroid(r) {
  let a = 0; let cx = 0; let cy = 0;
  for (let i = 0; i < r.length; i++) {
    const [x1, y1] = r[i]; const [x2, y2] = r[(i + 1) % r.length];
    const f = x1 * y2 - x2 * y1; a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f;
  }
  return a ? [cx / (3 * a), cy / (3 * a)] : r[0];
}
const r1 = v => Math.round(v * 10) / 10;

// ---------- Ergebnisse ----------
const lines = fs.readFileSync(path.join(SRC, 'kerg2.csv'), 'utf8').replace(/^﻿/, '').split(/\r?\n/);
const head = lines.findIndex(l => l.startsWith('Wahlart;'));
const num = s => (s ? parseFloat(s.replace(',', '.')) : 0);
const wk = {};
const land = {};
for (const l of lines.slice(head + 1)) {
  const c = l.split(';');
  if (c.length < 13) continue;
  const [, , art, nr, name, , , gart, gname, , stimme, anzahl, pct, , , , , , gewaehlt] = c;
  if (art === 'Wahlkreis') {
    const w = wk[+nr] || (wk[+nr] = { nr: +nr, name, e: {}, z: {}, eMax: 0, eWin: null, seated: true });
    if (gart === 'System-Gruppe' && gname === 'Gültige' && stimme === '1') w.valid = +anzahl;
    if (gart !== 'System-Gruppe' && pct) {
      const p = PARTY[gname];
      const v = num(pct);
      const tgt = stimme === '1' ? w.e : w.z;
      if (p) tgt[p] = (tgt[p] || 0) + v;
      if (stimme === '1' && v > w.eMax) { w.eMax = v; w.eWin = p || 'sonstige'; }
    }
    if (gewaehlt === '–') w.seated = false;
  } else if (art === 'Land' && gart === 'Partei' && stimme === '2' && PARTY[gname]) {
    const id = LAND[nr.padStart(2, '0')];
    const t = land[id] || (land[id] = {});
    t[PARTY[gname]] = (t[PARTY[gname]] || 0) + num(pct);
  }
}

// ---------- Grenztreue Vereinfachung ----------
const Q = 50; // Raster: 1/50 Karteneinheit ≈ 20 m
const keyOf = ([lon, lat]) => Math.round(lon * 1e7) + ',' + Math.round(lat * 1e7);
const raw = shp.shapes.map(rings => rings.map(r => {
  const pts = r.length > 1 && keyOf(r[0]) === keyOf(r[r.length - 1]) ? r.slice(0, -1) : r.slice();
  return pts;
}));
// Welche Wahlkreise teilen sich einen Punkt?
const members = new Map();
raw.forEach((rings, si) => rings.forEach(r => r.forEach(pt => {
  const k = keyOf(pt);
  const m = members.get(k);
  if (!m) members.set(k, [si]); else if (m.indexOf(si) === -1) m.push(si);
})));
const setOf = pt => members.get(keyOf(pt)).slice().sort((a, b) => a - b).join('.');
// Genauigkeit je Land: etwa ein halbes Pixel, wenn das Land die Karte (600 px) füllt.
const landOfShape = dbf.map(row => LAND[String(row.LAND_NR).padStart(2, '0')]);
const landBox = {};
raw.forEach((rings, si) => rings.forEach(r => r.forEach(pt => {
  const [x, y] = proj(pt);
  const b = landBox[landOfShape[si]] || (landBox[landOfShape[si]] = [Infinity, Infinity, -Infinity, -Infinity]);
  b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y);
})));
const landTol = {};
Object.keys(landBox).forEach(l => { const b = landBox[l]; landTol[l] = Math.max(0.02, Math.max(b[2] - b[0], b[3] - b[1]) / 600 * 0.45); });
const arcCache = new Map();
function simplifyArc(pts) {
  // Kanonische Richtung, damit beide Nachbarn denselben Abschnitt identisch vereinfachen.
  const ka = keyOf(pts[0]), kb = keyOf(pts[pts.length - 1]);
  let rev = ka > kb;
  if (ka === kb && pts.length > 2) rev = keyOf(pts[1]) > keyOf(pts[pts.length - 2]);
  const seq = rev ? pts.slice().reverse() : pts;
  const id = keyOf(seq[0]) + '|' + (seq[1] ? keyOf(seq[1]) : '') + '|' + keyOf(seq[seq.length - 1]) + '|' + seq.length;
  let res = arcCache.get(id);
  if (!res) {
    const shapes = members.get(keyOf(seq[Math.floor(seq.length / 2)])) || [];
    const tol = Math.min(...shapes.map(si => landTol[landOfShape[si]]));
    res = dp(seq.map(proj), tol);
    arcCache.set(id, res);
  }
  return rev ? res.slice().reverse() : res;
}
function simplifyRing(r) {
  const n = r.length;
  if (n < 4) return r.map(proj);
  const sets = r.map(setOf);
  const fixed = [];
  for (let i = 0; i < n; i++) if (sets[i] !== sets[(i - 1 + n) % n] || sets[i] !== sets[(i + 1) % n] || sets[i].indexOf('.') !== sets[i].lastIndexOf('.')) fixed.push(i);
  // Ring ohne Nachbarn (Insel, Außengrenze): an zwei weit entfernten Punkten teilen.
  if (fixed.length < 2) {
    const a = fixed.length ? fixed[0] : 0;
    fixed.length = 0;
    fixed.push(a, (a + Math.floor(n / 2)) % n);
    fixed.sort((x, y) => x - y);
  }
  const outPts = [];
  for (let f = 0; f < fixed.length; f++) {
    const a = fixed[f], b = fixed[(f + 1) % fixed.length];
    const seg = [];
    for (let i = a; ; i = (i + 1) % n) { seg.push(r[i]); if (i === b && seg.length > 1) break; if (seg.length > n + 1) break; }
    const simp = simplifyArc(seg);
    outPts.push(...simp.slice(0, -1));
  }
  return outPts;
}
const out = [];
dbf.forEach((row, i) => {
  const nr = +row.WKR_NR;
  const w = wk[nr];
  if (!w) throw new Error('Wahlkreis ' + nr + ' fehlt in kerg2.csv');
  const ringsP = raw[i].map(r => ({ r, a: Math.abs(area(r.map(proj))) }));
  const big = ringsP.reduce((x, y) => (y.a > x.a ? y : x));
  const minArea = Math.pow(landTol[landOfShape[i]] * 3, 2);
  const kept = ringsP.filter(x => x === big || x.a > minArea).map(x => simplifyRing(x.r)).filter(r => r.length >= 3);
  // Relative Pfade im feinen Raster halten die Datei klein.
  const d = kept.map(r => {
    const q = r.map(([x, y]) => [Math.round(x * Q), Math.round(y * Q)]);
    let px = q[0][0];
    let py = q[0][1];
    const parts = [];
    for (let k = 1; k < q.length; k++) {
      const dx = q[k][0] - px;
      const dy = q[k][1] - py;
      if (!dx && !dy) continue;
      parts.push(dx + ',' + dy);
      px = q[k][0]; py = q[k][1];
    }
    return 'M' + q[0][0] + ',' + q[0][1] + 'l' + parts.join(' ').replace(/ -/g, '-') + 'z';
  }).join('');
  const xs = kept.flat().map(p => p[0]);
  const ys = kept.flat().map(p => p[1]);
  const [cx, cy] = centroid(simplifyRing(big.r));
  const e = {}; const z = {};
  IDS.forEach(p => { e[p] = r1(w.e[p] || 0); z[p] = r1(w.z[p] || 0); });
  out.push({ nr, name: row.WKR_NAME || w.name, land: landOfShape[i], d,
    cx: Math.round(cx * Q), cy: Math.round(cy * Q), box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(v => Math.round(v * Q)),
    v: w.valid, e, z, win: w.eWin, seated: w.seated });
});
out.sort((a, b) => a.nr - b.nr);
Object.keys(land).forEach(id => IDS.forEach(p => { land[id][p] = r1(land[id][p] || 0); }));

const js = '/*\n * Wahlkreise der Bundestagswahl 2025 – erzeugt von tools/build-wahlkreise.js, nicht von Hand ändern.\n' +
  ' * Quelle: © Die Bundeswahlleiterin, Wiesbaden 2025, Datenlizenz Deutschland – Namensnennung – 2.0:\n' +
  ' * Ergebnisse nach Wahlkreisen (kerg2.csv, endgültig) und Wahlkreisgeometrie (VG250, WGS84, grenztreu vereinfacht).\n' +
  ' * e = Erststimmen 2025 in %, z = Zweitstimmen 2025 in % (auch Freie Wähler, Volt, Tierschutzpartei),\n * win = Erststimmen-Sieger 2025,\n' +
  ' * seated = Sieger hat ein Mandat erhalten (false: wegen fehlender Zweitstimmendeckung ohne Sitz).\n' +
  ' * Karte: Längengrade mit cos 51,2° gestaucht, auf ' + W * Q + ' × ' + H * Q + ' Einheiten skaliert (ganze Zahlen).\n */\n' +
  '(function (root) {\n  var WK = ' + JSON.stringify({ w: W * Q, h: H * Q, land2025: land, list: out }) + ';\n' +
  "  if (typeof module !== 'undefined' && module.exports) module.exports = WK; else root.BTW_WK = WK;\n})(this);\n";
fs.writeFileSync(path.join(ROOT, 'js', 'wahlkreise.js'), js);
const seats = {};
out.forEach(w => { if (w.seated) seats[w.win] = (seats[w.win] || 0) + 1; });
console.log('Wahlkreise:', out.length, '· Größe:', Math.round(js.length / 1024) + ' KB', '· Direktmandate 2025:', JSON.stringify(seats),
  '· ohne Sitz:', out.filter(w => !w.seated).length);
