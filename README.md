# Wahlkampf! – Das Bundestagswahl-Spiel

Ein Browserspiel: Du wählst eine der im Bundestag vertretenen Parteien (bzw. eine der knapp gescheiterten)
und führst sie als Spitzenkandidat:in durch die letzten acht Wochen vor der Bundestagswahl.

## Spielen

Kein Build-Schritt nötig – reines HTML, CSS und JavaScript.

- `index.html` direkt im Browser öffnen, **oder**
- lokal einen Server starten: `npm start` (bzw. `npx serve .`)

Der Spielstand wird automatisch im Browser gespeichert (localStorage).

## Spielprinzip

| Element | Beschreibung |
|---|---|
| **Parteien** | CDU/CSU, AfD, SPD, Grüne, Linke, BSW, FDP – mit unterschiedlichem Budget, eigenen Themenstärken und Wahlziel |
| **Wahlprogramm** | Gestaltet als ganzseitige Partei-Website (mit Navigation) im Stil der jeweiligen Partei (angelehnt an die Kampagnen 2025, FDP nach ihrer Corporate Design Guideline vom 24.07.2026, CDU nach ihrem Corporate Design Manual vom Mai 2026, SPD nach ihrem CD-Manual vom August 2024, AfD nach ihrem Corporate Design vom 14.03.2017; ohne Originallogos), an dessen Ende das gewählte Programm steht. Nach der Parteiwahl: Slogan, 3 Kernthemen und je Thema eine von drei Positionen. Leichte Abweichungen von der Parteilinie hin zu populären Positionen bringen Stimmen, starke Abweichungen kosten immer Stammwähler; jede Abweichung kostet etwas Themenkompetenz, und das Programm muss in den Finanzierungsrahmen (10 💶) passen |
| **Wochen** | 8 Wochen Wahlkampf, je 3 Aktionen pro Woche |
| **Regionale Aktionen** | Kundgebung, Plakatkampagne, Haustürwahlkampf – wirken im gewählten Bundesland |
| **Bundesweite Aktionen** | TV-Spot, Social Media (Shitstorm-Risiko), Pressekonferenz (setzt Themen), Talkshow |
| **Geld** | Spendendinner füllt die Wahlkampfkasse |
| **Themen** | Wirtschaft, Migration, Soziales, Klima, Sicherheit, Bildung, Digitalisierung, Wohnen. Wird ein Thema wichtiger, profitieren Parteien mit hoher Kompetenz dort |
| **Ereignisse** | Jede Woche eine Eilmeldung (Hochwasser, Bahnstreik, Spendenaffäre …) mit Entscheidungen |
| **Elefantenrunde** | In Woche 7: drei Fragen, drei Strategien |
| **Wahlabend** | 630 Sitze, 5-%-Hürde, Sainte-Laguë, Koalitionsbildung (Brandmauer zur AfD, kein Union-Linke-Bündnis) |

Die Startwerte entsprechen bundesweit der Sonntagsfrage von Infratest dimap (Anfang Oktober 2026: Union 20, AfD 27, SPD 13, Grüne 16, Linke 11, FDP 4, BSW 3, Sonstige 6 %). Die Verteilung auf die Bundesländer folgt proportional dem Muster der Bundestagswahl 2025.
Vereinfachungen: keine Wahlkreise/Erststimmen, keine Grundmandatsklausel. Alle Ereignisse sind fiktiv.

## Neue Version veröffentlichen

Vor jedem Commit, der CSS oder JavaScript ändert, `npm run bump` ausführen. Das setzt eine neue
Versionsnummer an alle Datei-Verweise in `index.html` und in `js/ui.js`. So laden Browser nach einem
Update garantiert zusammenpassende Dateien; passt trotzdem etwas nicht zusammen (alte Datei im Cache),
lädt das Spiel die Seite einmal automatisch neu.

## Projektstruktur

```
index.html        Seitengerüst (Start, Wahlkampf, Wahlabend)
css/style.css     Gestaltung inkl. Dark Mode und Mobilansicht
js/data.js        Parteien, Bundesländer, Themen, Programmpositionen
js/engine.js      Spiellogik ohne DOM (Umfragemodell, Aktionen, Ereignisse, Sitzverteilung)
js/ui.js          Oberfläche
tests/            Tests der Spiellogik (`npm test`, Node ≥ 18)
tools/            bump-version.js: Versionsnummer gegen veraltete Browser-Caches
```
