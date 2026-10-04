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
| **Wahlprogramm** | Gestaltet als Wahlflyer im Stil der jeweiligen Partei (angelehnt an die Kampagnen 2025, FDP nach ihrer Corporate Design Guideline vom 24.07.2026, CDU nach ihrem Corporate Design Manual vom Mai 2026; ohne Originallogos), an dessen Ende das gewählte Programm steht. Nach der Parteiwahl: Slogan, 2 Kernthemen und je Thema eine von drei Positionen. Populäre Positionen bringen Stimmen, Abweichungen von der Parteilinie kosten Stammwähler und Glaubwürdigkeit, und das Programm muss in den Finanzierungsrahmen (10 💶) passen |
| **Wochen** | 8 Wochen Wahlkampf, je 3 Aktionen pro Woche |
| **Regionale Aktionen** | Kundgebung, Plakatkampagne, Haustürwahlkampf – wirken im gewählten Bundesland |
| **Bundesweite Aktionen** | TV-Spot, Social Media (Shitstorm-Risiko), Pressekonferenz (setzt Themen), Talkshow |
| **Geld** | Spendendinner füllt die Wahlkampfkasse |
| **Themen** | Wirtschaft, Migration, Soziales, Klima, Sicherheit, Bildung, Digitalisierung, Wohnen. Wird ein Thema wichtiger, profitieren Parteien mit hoher Kompetenz dort |
| **Ereignisse** | Jede Woche eine Eilmeldung (Hochwasser, Bahnstreik, Spendenaffäre …) mit Entscheidungen |
| **Elefantenrunde** | In Woche 7: drei Fragen, drei Strategien |
| **Wahlabend** | 630 Sitze, 5-%-Hürde, Sainte-Laguë, Koalitionsbildung (Brandmauer zur AfD, kein Union-Linke-Bündnis) |

Die Startwerte orientieren sich an den Zweitstimmen der Bundestagswahl 2025 (nach Bundesland, gerundet).
Vereinfachungen: keine Wahlkreise/Erststimmen, keine Grundmandatsklausel. Alle Ereignisse sind fiktiv.

## Projektstruktur

```
index.html        Seitengerüst (Start, Wahlkampf, Wahlabend)
css/style.css     Gestaltung inkl. Dark Mode und Mobilansicht
js/data.js        Parteien, Bundesländer, Themen, Programmpositionen
js/engine.js      Spiellogik ohne DOM (Umfragemodell, Aktionen, Ereignisse, Sitzverteilung)
js/ui.js          Oberfläche
tests/            Tests der Spiellogik (`npm test`, Node ≥ 18)
```
