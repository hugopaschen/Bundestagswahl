#!/usr/bin/env node
/*
 * Setzt eine neue Versionsnummer für index.html (data-version, ?v= an CSS/JS) und js/ui.js (APP_VERSION).
 * So laden Browser nach einem Update garantiert zusammenpassende Dateien statt alter Kopien aus dem Cache.
 * Aufruf: npm run bump
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const d = new Date();
const pad = n => String(n).padStart(2, '0');
const version = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;

const indexPath = path.join(root, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/<html lang="de"[^>]*>/, `<html lang="de" data-version="${version}">`);
html = html.replace(/(href="css\/style\.css)(\?v=[^"]*)?"/, `$1?v=${version}"`);
html = html.replace(/(src="js\/[a-z]+\.js)(\?v=[^"]*)?"/g, `$1?v=${version}"`);
fs.writeFileSync(indexPath, html);

const uiPath = path.join(root, 'js', 'ui.js');
let ui = fs.readFileSync(uiPath, 'utf8');
ui = ui.replace(/const APP_VERSION = '[^']*';/, `const APP_VERSION = '${version}';`);
fs.writeFileSync(uiPath, ui);
console.log('Version gesetzt:', version);
