/*
 * Spieldaten: Parteien, Bundesländer, Themen.
 * Die Startwerte entsprechen bundesweit der Sonntagsfrage von Infratest dimap
 * (Stand: Anfang Oktober 2026; BSW mit 3 % angesetzt, Sonstige 6 %). Die Verteilung
 * auf die Bundesländer folgt proportional dem Muster der Bundestagswahl 2025.
 * Gerundet und vereinfacht – es handelt sich um ein Spiel.
 */
(function (root) {
  var TOPICS = [
    { id: 'wirtschaft', name: 'Wirtschaft', icon: '📈' },
    { id: 'migration', name: 'Migration', icon: '🛂' },
    { id: 'soziales', name: 'Soziales & Rente', icon: '🤝' },
    { id: 'klima', name: 'Klima & Energie', icon: '🌱' },
    { id: 'sicherheit', name: 'Innere Sicherheit', icon: '🛡️' },
    { id: 'bildung', name: 'Bildung', icon: '🎓' },
    { id: 'digitales', name: 'Digitalisierung', icon: '💻' },
    { id: 'wohnen', name: 'Wohnen & Mieten', icon: '🏠' },
    { id: 'verteidigung', name: 'Verteidigung & Außenpolitik', icon: '🪖' },
    { id: 'gesundheit', name: 'Gesundheit & Pflege', icon: '🏥' },
    { id: 'verkehr', name: 'Verkehr & Infrastruktur', icon: '🚆' },
    { id: 'europa', name: 'Europa', icon: '🇪🇺' },
    { id: 'familie', name: 'Familie & Gleichstellung', icon: '👨‍👩‍👧' },
    { id: 'land', name: 'Landwirtschaft & ländlicher Raum', icon: '🌾' },
    { id: 'demokratie', name: 'Demokratie & Bürgerrechte', icon: '🗳️' },
    { id: 'finanzen', name: 'Steuern & Staatsfinanzen', icon: '🏦' }
  ];

  // Wie wichtig ist ein Thema den Wählerinnen und Wählern zu Beginn (Summe = 1)?
  // Durchschnitt der Nennungen „wichtigstes Problem“ (ARD-DeutschlandTrend 6/2026 und 7/2025,
  // Landtagswahlen 2026 Baden-Württemberg und Sachsen-Anhalt), auf 100 % umgerechnet.
  // Themen ohne Umfragewert behalten ihr bisheriges Verhältnis zu den gemessenen Themen.
  var SALIENCE0 = {
    wirtschaft: 0.14,
    migration: 0.10,
    soziales: 0.10,
    klima: 0.06,
    sicherheit: 0.07,
    bildung: 0.07,
    digitales: 0.03,
    wohnen: 0.05,
    verteidigung: 0.07,
    gesundheit: 0.07,
    verkehr: 0.05,
    europa: 0.03,
    familie: 0.03,
    land: 0.03,
    demokratie: 0.05,
    finanzen: 0.05
  };

  // Spielbare Parteien. "competence" = zugeschriebene Kompetenz je Thema (0–100).
  // Angelehnt an Kompetenzumfragen („Welche Partei kann … am besten lösen?“): Durchschnitt aus Bundesumfragen
  // (ARD-DeutschlandTrend 9/2026, Außen-/Verteidigungspolitik 9/2025, soziale Gerechtigkeit 2026) und den
  // Landtagswahlen 2026 (BW, RP, Sachsen-Anhalt, Berlin), umgerechnet mit Wert = 20 + 1,5 × Prozent (auf 5 gerundet).
  // Beispiel Wirtschaft Union: BW 36, RP 24, ST 27, Bund 24 → Ø 27,8 % → 60. Themen ohne Umfrage geschätzt.
  // "budget" = Wahlkampfkasse in Mio. €, angelehnt an die Wahlkampfbudgets zur Bundestagswahl 2025
  // (RND-Umfrage unter den Parteien): CDU 28 (+ geschätzter CSU-Anteil), Grüne 19, SPD 15, BSW 6.
  // Linke aus der RND-Gesamtsumme abgeleitet (~7). AfD und FDP haben keine Zahlen genannt:
  // AfD nach Medienberichten etwa halb so viel wie die SPD (~8), FDP geschätzt aus ihren Spenden (~6).
  // team = Einsätze des Wahlkampfteams pro Woche (ab Woche 5 einer mehr), nach Mitgliederzahl
  // (members, Stand 31.12.2025, Oskar Niedermayer „Parteimitglieder in Deutschland“, FU Berlin;
  // BSW nach Parteiangaben Dez. 2025, ca. 11.200).
  var PARTIES = [
    {
      id: 'union', team: 6, members: 482333, ballot: 'CDU/CSU', fullName: 'Christlich Demokratische Union / Christlich-Soziale Union', flyerLogo: 'CDU', short: 'Union', name: 'CDU/CSU',
      budget: 30, goal: 0, mustLead: true,
      goalText: 'Stärkste Kraft werden',
      desc: 'Die Volkspartei der Mitte. Stark bei Wirtschaft und Sicherheit, großes Budget.',
      competence: { wirtschaft: 60, migration: 55, soziales: 40, klima: 35, sicherheit: 60, bildung: 60, digitales: 45, wohnen: 40, verteidigung: 70, gesundheit: 45, verkehr: 60, europa: 75, familie: 50, land: 60, demokratie: 50, finanzen: 60 },
      // Traditionelle Parteilinie je Thema: -1 = links/progressiv, 0 = Mitte, 1 = konservativ/marktliberal
      lean: { wirtschaft: 1, migration: 1, soziales: 0, klima: 0, sicherheit: 1, bildung: 1, digitales: 0, wohnen: 1 , verteidigung: 1, gesundheit: 0, verkehr: 1, europa: 0, familie: 1, land: 1, demokratie: 0, finanzen: 1 }
    },
    {
      id: 'afd', team: 4, members: 73249, ballot: 'AfD', fullName: 'Alternative für Deutschland', flyerLogo: 'AfD', short: 'AfD', name: 'AfD',
      budget: 8, goal: 0, goalMajority: true,
      goalText: 'Die absolute Mehrheit der Sitze im Bundestag erringen',
      desc: 'Rechtspopulistische Oppositionspartei, besonders stark im Osten. Kein anderer Partner will koalieren.',
      competence: { wirtschaft: 45, migration: 60, soziales: 45, klima: 15, sicherheit: 65, bildung: 55, digitales: 20, wohnen: 35, verteidigung: 45, gesundheit: 30, verkehr: 30, europa: 45, familie: 30, land: 40, demokratie: 25, finanzen: 40 },
      // Traditionelle Parteilinie je Thema: -1 = links/progressiv, 0 = Mitte, 1 = konservativ/marktliberal
      lean: { wirtschaft: 1, migration: 1, soziales: 0, klima: 1, sicherheit: 1, bildung: 1, digitales: 0, wohnen: 1 , verteidigung: -1, gesundheit: 0, verkehr: 1, europa: 1, familie: 1, land: 1, demokratie: 1, finanzen: 1 }
    },
    {
      id: 'spd', team: 6, members: 348451, ballot: 'SPD', fullName: 'Sozialdemokratische Partei Deutschlands', flyerLogo: 'SPD', short: 'SPD', name: 'SPD',
      budget: 15, goal: 20,
      goalText: '20 % holen',
      desc: 'Die traditionsreiche Sozialdemokratie. Stark bei Sozialem und Rente.',
      competence: { wirtschaft: 40, migration: 30, soziales: 50, klima: 45, sicherheit: 35, bildung: 35, digitales: 35, wohnen: 50, verteidigung: 50, gesundheit: 65, verkehr: 45, europa: 35, familie: 55, land: 35, demokratie: 45, finanzen: 50 },
      // Traditionelle Parteilinie je Thema: -1 = links/progressiv, 0 = Mitte, 1 = konservativ/marktliberal
      lean: { wirtschaft: 0, migration: 0, soziales: -1, klima: 0, sicherheit: 0, bildung: -1, digitales: 0, wohnen: 0 , verteidigung: 0, gesundheit: -1, verkehr: 0, europa: 0, familie: -1, land: 0, demokratie: -1, finanzen: -1 }
    },
    {
      id: 'gruene', team: 5, members: 183761, ballot: 'GRÜNE', fullName: 'Bündnis 90/Die Grünen', flyerLogo: 'GRÜNE', short: 'Grüne', name: 'Bündnis 90/Die Grünen',
      budget: 19, goal: 20,
      goalText: '20 % holen',
      desc: 'Die Ökopartei mit Hochburgen in den Großstädten. Unschlagbar beim Klima.',
      competence: { wirtschaft: 45, migration: 25, soziales: 40, klima: 85, sicherheit: 25, bildung: 45, digitales: 45, wohnen: 30, verteidigung: 25, gesundheit: 40, verkehr: 50, europa: 30, familie: 50, land: 40, demokratie: 45, finanzen: 35 },
      // Traditionelle Parteilinie je Thema: -1 = links/progressiv, 0 = Mitte, 1 = konservativ/marktliberal
      lean: { wirtschaft: 0, migration: -1, soziales: -1, klima: -1, sicherheit: -1, bildung: -1, digitales: -1, wohnen: 0 , verteidigung: 0, gesundheit: -1, verkehr: -1, europa: -1, familie: -1, land: -1, demokratie: -1, finanzen: -1 }
    },
    {
      id: 'linke', team: 5, members: 123558, ballot: 'Die Linke', fullName: 'Die Linke', flyerLogo: 'Die Linke', short: 'Linke', name: 'Die Linke',
      budget: 7, goal: 0, goalCoalition: ['spd', 'gruene', 'linke'],
      goalText: 'Genug Stimmen für eine Regierungsmehrheit mit SPD und Grünen holen',
      desc: 'Linke Oppositionspartei mit junger Basis. Stark bei Mieten, Preisen und sozialer Gerechtigkeit.',
      competence: { wirtschaft: 25, migration: 25, soziales: 45, klima: 40, sicherheit: 15, bildung: 40, digitales: 25, wohnen: 60, verteidigung: 20, gesundheit: 50, verkehr: 30, europa: 25, familie: 45, land: 25, demokratie: 30, finanzen: 30 },
      // Traditionelle Parteilinie je Thema: -1 = links/progressiv, 0 = Mitte, 1 = konservativ/marktliberal
      lean: { wirtschaft: -1, migration: -1, soziales: -1, klima: -1, sicherheit: -1, bildung: -1, digitales: -1, wohnen: -1 , verteidigung: -1, gesundheit: -1, verkehr: -1, europa: 0, familie: -1, land: 0, demokratie: -1, finanzen: -1 }
    },
    {
      id: 'bsw', team: 2, members: 11200, ballot: 'BSW', fullName: 'Bündnis Soziale Gerechtigkeit und Wirtschaftliche Vernunft', flyerLogo: 'BSW', short: 'BSW', name: 'Bündnis Soziale Gerechtigkeit und Wirtschaftliche Vernunft',
      budget: 6, goal: 5,
      goalText: 'Unter neuem Namen 5 % holen',
      desc: 'Neu benannte Partei, 2025 knapp an der Hürde gescheitert. Kleines Budget, viel zu gewinnen.',
      competence: { wirtschaft: 35, migration: 55, soziales: 45, klima: 20, sicherheit: 35, bildung: 30, digitales: 20, wohnen: 40, verteidigung: 30, gesundheit: 35, verkehr: 25, europa: 30, familie: 30, land: 30, demokratie: 30, finanzen: 35 },
      // Traditionelle Parteilinie je Thema: -1 = links/progressiv, 0 = Mitte, 1 = konservativ/marktliberal
      lean: { wirtschaft: -1, migration: 1, soziales: -1, klima: 1, sicherheit: 0, bildung: 0, digitales: 0, wohnen: 0 , verteidigung: -1, gesundheit: -1, verkehr: 0, europa: 1, familie: 0, land: 0, demokratie: 1, finanzen: -1 }
    },
    {
      id: 'fdp', team: 4, members: 64781, ballot: 'FDP', fullName: 'Freie Demokratische Partei', flyerLogo: 'FDP', short: 'FDP', name: 'FDP',
      budget: 6, goal: 5,
      goalText: 'Wieder in den Bundestag einziehen (5 %)',
      desc: 'Die Liberalen kämpfen um den Wiedereinzug. Stark bei Wirtschaft und Digitalisierung.',
      competence: { wirtschaft: 45, migration: 30, soziales: 20, klima: 25, sicherheit: 30, bildung: 50, digitales: 60, wohnen: 40, verteidigung: 35, gesundheit: 30, verkehr: 40, europa: 35, familie: 35, land: 35, demokratie: 45, finanzen: 45 },
      // Traditionelle Parteilinie je Thema: -1 = links/progressiv, 0 = Mitte, 1 = konservativ/marktliberal
      lean: { wirtschaft: 1, migration: 0, soziales: 1, klima: 1, sicherheit: -1, bildung: 1, digitales: 1, wohnen: 1 , verteidigung: 1, gesundheit: 1, verkehr: 1, europa: 0, familie: 0, land: 1, demokratie: 0, finanzen: 1 }
    }
  ];

  var OTHER = { id: 'sonstige', short: 'Sonst.', name: 'Sonstige' };

  // Bundesländer mit Wahlberechtigten (Mio., gerundet) (x/y: frühere Kachelkarte, heute ungenutzt)
  // und Startwerte in Prozent (Sonntagsfrage, regional verteilt nach dem Muster der BTW 2025). Rest = Sonstige.
  var STATES = [
    { id: 'SH', name: 'Schleswig-Holstein', voters: 2.2, x: 2, y: 0, east: false,
      result: { union: 20.7, afd: 21.4, spd: 15.4, gruene: 20.1, linke: 9.7, bsw: 2.2, fdp: 4.5 } },
    { id: 'MV', name: 'Mecklenburg-Vorpommern', voters: 1.3, x: 3, y: 0, east: true,
      result: { union: 11.9, afd: 43.5, spd: 9.5, gruene: 6.7, linke: 15.4, bsw: 5.9, fdp: 2.3 } },
    { id: 'HB', name: 'Bremen', voters: 0.46, x: 1, y: 1, east: false,
      result: { union: 13.9, afd: 19.1, spd: 18.4, gruene: 22.5, linke: 19.1, bsw: 2.6, fdp: 3.4 } },
    { id: 'HH', name: 'Hamburg', voters: 1.3, x: 2, y: 1, east: false,
      result: { union: 14.0, afd: 13.7, spd: 17.7, gruene: 26.2, linke: 18.1, bsw: 2.4, fdp: 4.0 } },
    { id: 'BB', name: 'Brandenburg', voters: 2.1, x: 3, y: 1, east: true,
      result: { union: 12.2, afd: 40.9, spd: 11.5, gruene: 9.0, linke: 13.4, bsw: 6.0, fdp: 2.5 } },
    { id: 'BE', name: 'Berlin', voters: 2.4, x: 4, y: 1, east: true,
      result: { union: 12.0, afd: 18.5, spd: 11.4, gruene: 22.1, linke: 24.2, bsw: 3.6, fdp: 3.1 } },
    { id: 'NW', name: 'Nordrhein-Westfalen', voters: 12.8, x: 0, y: 2, east: false,
      result: { union: 21.5, afd: 22.3, spd: 16.4, gruene: 17.2, linke: 10.5, bsw: 2.6, fdp: 4.1 } },
    { id: 'NI', name: 'Niedersachsen', voters: 6.1, x: 1, y: 2, east: false,
      result: { union: 19.9, afd: 23.8, spd: 17.0, gruene: 16.5, linke: 9.7, bsw: 2.6, fdp: 4.0 } },
    { id: 'ST', name: 'Sachsen-Anhalt', voters: 1.7, x: 2, y: 2, east: true,
      result: { union: 12.9, afd: 46.4, spd: 8.5, gruene: 6.2, linke: 13.7, bsw: 6.3, fdp: 2.6 } },
    { id: 'SN', name: 'Sachsen', voters: 3.2, x: 3, y: 2, east: true,
      result: { union: 12.9, afd: 45.6, spd: 6.4, gruene: 8.6, linke: 13.8, bsw: 4.9, fdp: 2.8 } },
    { id: 'RP', name: 'Rheinland-Pfalz', voters: 3.0, x: 0, y: 3, east: false,
      result: { union: 21.8, afd: 26.7, spd: 14.8, gruene: 13.4, linke: 8.2, bsw: 2.6, fdp: 4.6 } },
    { id: 'HE', name: 'Hessen', voters: 4.3, x: 1, y: 3, east: false,
      result: { union: 20.3, afd: 23.3, spd: 14.1, gruene: 17.1, linke: 10.2, bsw: 2.6, fdp: 5.0 } },
    { id: 'TH', name: 'Thüringen', voters: 1.6, x: 2, y: 3, east: true,
      result: { union: 12.1, afd: 46.9, spd: 6.2, gruene: 6.3, linke: 18.4, bsw: 5.1, fdp: 2.2 } },
    { id: 'SL', name: 'Saarland', voters: 0.75, x: 0, y: 4, east: false,
      result: { union: 21.3, afd: 29.4, spd: 18.7, gruene: 8.2, linke: 8.3, bsw: 3.8, fdp: 3.2 } },
    { id: 'BW', name: 'Baden-Württemberg', voters: 7.6, x: 1, y: 4, east: false,
      result: { union: 22.1, afd: 25.8, spd: 11.4, gruene: 19.1, linke: 8.8, bsw: 2.4, fdp: 5.2 } },
    { id: 'BY', name: 'Bayern', voters: 9.4, x: 2, y: 4, east: false,
      result: { union: 26.4, afd: 25.1, spd: 9.5, gruene: 17.1, linke: 7.5, bsw: 2.0, fdp: 3.9 } }
  ];


  // Wahlprogramm: drei Positionen je Thema.
  // lean = Richtung (-1/0/1), pop = Zustimmung bundesweit, east = zusätzliche Zustimmung im Osten,
  // cost = Belastung des Haushalts (Finanzierungspunkte).
  var PROGRAM = {
    wirtschaft: [
      { lean: -1, label: 'Vermögensteuer und Investitionsoffensive', desc: 'Superreiche stärker besteuern, Milliarden in Bahn, Brücken und Schulen.', pop: 0.2, east: 0.1, cost: 1 },
      { lean: 0, label: 'Schuldenbremse reformieren, gezielt investieren', desc: 'Investitionen erleichtern, Mittelstand entlasten, Haushalt solide halten.', pop: 0.3, east: 0, cost: 1 },
      { lean: 1, label: 'Steuern senken, Bürokratie abbauen', desc: 'Unternehmenssteuern runter, Soli abschaffen, Regeln entrümpeln.', pop: 0.3, east: 0, cost: 2 }
    ],
    migration: [
      { lean: -1, label: 'Humanitäre Aufnahme, schnellere Einbürgerung', desc: 'Sichere Fluchtwege, Arbeitsverbote abschaffen, Integration fördern.', pop: -0.3, east: -0.3, cost: 1 },
      { lean: 0, label: 'Steuern und ordnen', desc: 'Fachkräfteeinwanderung erleichtern, Rückführungen konsequent umsetzen.', pop: 0.4, east: 0, cost: 1 },
      { lean: 1, label: 'Strikte Begrenzung', desc: 'Zurückweisungen an den Grenzen, Leistungen für Asylbewerber kürzen.', pop: 0.3, east: 0.5, cost: 1 }
    ],
    soziales: [
      { lean: -1, label: 'Mindestlohn 15 €, Rentenniveau 53 %', desc: 'Höhere Löhne und Renten, mehr Geld für Pflege und Familien.', pop: 0.5, east: 0.3, cost: 2 },
      { lean: 0, label: 'Rentenniveau 48 % sichern', desc: 'Stabile Renten, Bürgergeld reformieren, Pflege stärken.', pop: 0.3, east: 0, cost: 1 },
      { lean: 1, label: 'Sozialstaat verschlanken, Aktienrente', desc: 'Mehr Eigenvorsorge, Leistungen zielgenauer, Anreize zur Arbeit.', pop: -0.2, east: -0.2, cost: 0 }
    ],
    klima: [
      { lean: -1, label: 'Klimaneutral bis 2040', desc: 'Kohleausstieg 2030, Tempolimit, massiver Ausbau der Erneuerbaren.', pop: -0.1, east: -0.4, cost: 2 },
      { lean: 0, label: 'Klimaziele halten, Klimageld auszahlen', desc: 'CO₂-Preis sozial ausgleichen, Netze und Speicher ausbauen.', pop: 0.3, east: 0, cost: 1 },
      { lean: 1, label: 'Technologieoffenheit statt Verbote', desc: 'Verbrenner-Aus stoppen, Heizungsgesetz zurücknehmen.', pop: 0.2, east: 0.3, cost: 0 }
    ],
    sicherheit: [
      { lean: -1, label: 'Prävention und Bürgerrechte', desc: 'Sozialarbeit statt Überwachung, unabhängige Polizeibeauftragte.', pop: -0.1, east: -0.1, cost: 1 },
      { lean: 0, label: 'Mehr Polizei, bessere Ausstattung', desc: '10.000 zusätzliche Stellen, moderne Technik, schnellere Verfahren.', pop: 0.4, east: 0, cost: 1 },
      { lean: 1, label: 'Härtere Strafen, mehr Überwachung', desc: 'Videoüberwachung ausbauen, Strafrahmen verschärfen.', pop: 0.2, east: 0.2, cost: 1 }
    ],
    bildung: [
      { lean: -1, label: 'Gemeinschaftsschule und kostenlose Kitas', desc: 'Längeres gemeinsames Lernen, gebührenfreie Bildung von Anfang an.', pop: 0.2, east: 0.1, cost: 2 },
      { lean: 0, label: 'Schulen sanieren, Digitalpakt 2.0', desc: 'Bundesprogramm für marode Schulen und digitale Ausstattung.', pop: 0.3, east: 0, cost: 1 },
      { lean: 1, label: 'Leistung zählt', desc: 'Gymnasium stärken, verbindliche Deutschtests vor der Einschulung.', pop: 0.1, east: 0, cost: 0 }
    ],
    digitales: [
      { lean: -1, label: 'Datenschutz und Open Source', desc: 'Freie Software in Behörden, Recht auf Verschlüsselung.', pop: 0.0, east: 0, cost: 1 },
      { lean: 0, label: 'Digitale Verwaltung bis 2030', desc: 'Jeder Behördengang online, Glasfaser für alle Regionen.', pop: 0.3, east: 0.1, cost: 1 },
      { lean: 1, label: 'Digitalministerium und KI-Offensive', desc: 'Eigenes Ministerium, Regeln lockern, Start-ups fördern.', pop: 0.2, east: 0, cost: 1 }
    ],
    wohnen: [
      { lean: -1, label: 'Mietendeckel und Vergesellschaftung', desc: 'Mieten bundesweit einfrieren, große Wohnungskonzerne in öffentliche Hand.', pop: 0.3, east: 0.2, cost: 1 },
      { lean: 0, label: 'Mietpreisbremse und sozialer Wohnungsbau', desc: 'Mietpreisbremse verlängern, 100.000 Sozialwohnungen pro Jahr fördern.', pop: 0.4, east: 0, cost: 1 },
      { lean: 1, label: 'Bauen, bauen, bauen', desc: 'Bauvorschriften entrümpeln, Grunderwerbsteuer senken, Eigentum fördern.', pop: 0.2, east: 0, cost: 1 }
    ],
    verteidigung: [
      { lean: -1, label: 'Diplomatie statt Aufrüstung', desc: 'Verhandlungen in den Vordergrund, Waffenlieferungen stoppen, Rüstungsetat deckeln.', pop: -0.1, east: 0.4, cost: 0 },
      { lean: 0, label: 'Bundeswehr stärken, Bündnisse pflegen', desc: 'Verteidigung dauerhaft solide finanzieren, Ukraine weiter unterstützen, NATO verlässlich.', pop: 0.4, east: -0.1, cost: 1 },
      { lean: 1, label: 'Wehrpflicht zurück, 3,5 % für Verteidigung', desc: 'Allgemeine Wehrpflicht, massive Aufrüstung, Abschreckung zuerst.', pop: 0.1, east: -0.3, cost: 2 }
    ],
    gesundheit: [
      { lean: -1, label: 'Bürgerversicherung für alle', desc: 'Gesetzliche und private Kassen zusammenführen, Pflege-Vollversicherung einführen.', pop: 0.3, east: 0.2, cost: 2 },
      { lean: 0, label: 'Krankenhausreform und mehr Pflegekräfte', desc: 'Kliniken bündeln, Pflegelöhne anheben, schneller zum Facharzttermin.', pop: 0.4, east: 0, cost: 1 },
      { lean: 1, label: 'Mehr Wettbewerb, mehr Eigenverantwortung', desc: 'Kassenleistungen begrenzen, Wahltarife, private Vorsorge stärken.', pop: -0.2, east: -0.2, cost: 0 }
    ],
    verkehr: [
      { lean: -1, label: 'Tempolimit und 29-€-Ticket', desc: 'Tempo 130 auf Autobahnen, günstiges Deutschlandticket, Vorrang für die Schiene.', pop: 0.1, east: -0.2, cost: 2 },
      { lean: 0, label: 'Bahn und Brücken sanieren', desc: 'Sondervermögen für marode Schienen, Straßen und Brücken.', pop: 0.4, east: 0.1, cost: 1 },
      { lean: 1, label: 'Freie Fahrt für Pendler', desc: 'Kein Tempolimit, Straßen ausbauen, Pendlerpauschale erhöhen.', pop: 0.2, east: 0.3, cost: 1 }
    ],
    europa: [
      { lean: -1, label: 'Vereinigte Staaten von Europa', desc: 'Mehr Macht für das Europaparlament, gemeinsame Armee, Erweiterung beschleunigen.', pop: -0.2, east: -0.3, cost: 1 },
      { lean: 0, label: 'Starke EU mit Reformen', desc: 'Binnenmarkt vertiefen, EU-Bürokratie abbauen, Außengrenzen gemeinsam schützen.', pop: 0.4, east: 0, cost: 0 },
      { lean: 1, label: 'Kompetenzen zurück nach Berlin', desc: 'Weniger Brüssel, Nettozahlungen kürzen, Euro-Austritt prüfen.', pop: -0.1, east: 0.4, cost: 0 }
    ],
    familie: [
      { lean: -1, label: 'Kindergrundsicherung und Parität', desc: 'Familienleistungen bündeln, Ehegattensplitting abschaffen, gleiche Bezahlung durchsetzen.', pop: 0.1, east: 0.1, cost: 2 },
      { lean: 0, label: 'Mehr Kitaplätze, höheres Elterngeld', desc: 'Rechtsanspruch auf Betreuung durchsetzen, Elterngeld anheben, Familien entlasten.', pop: 0.4, east: 0, cost: 1 },
      { lean: 1, label: 'Die klassische Familie stärken', desc: 'Ehegattensplitting behalten, Betreuungsgeld, Familiensplitting einführen.', pop: 0.0, east: 0.2, cost: 1 }
    ],
    land: [
      { lean: -1, label: 'Agrarwende: Tierwohl und Ökolandbau', desc: 'Massentierhaltung abbauen, Förderung nur für umweltgerechte Höfe.', pop: 0.0, east: -0.2, cost: 1 },
      { lean: 0, label: 'Höfe sichern, Landärzte und Busse fürs Land', desc: 'Bürokratie für Bauern abbauen, Ärzte und Nahverkehr auf dem Land stärken.', pop: 0.4, east: 0.2, cost: 1 },
      { lean: 1, label: 'Agrardiesel zurück, Auflagen streichen', desc: 'Steuervorteile für Landwirte wiederherstellen, Umweltauflagen lockern.', pop: 0.2, east: 0.3, cost: 1 }
    ],
    demokratie: [
      { lean: -1, label: 'Wahlrecht ab 16, wehrhafte Demokratie', desc: 'Junge Menschen beteiligen, Verbotsverfahren gegen Verfassungsfeinde prüfen.', pop: -0.1, east: -0.4, cost: 0 },
      { lean: 0, label: 'Starke Institutionen, politische Bildung', desc: 'Verfassungsgericht absichern, politische Bildung und Ehrenamt fördern.', pop: 0.3, east: 0, cost: 1 },
      { lean: 1, label: 'Volksentscheide auf Bundesebene', desc: 'Bürger direkt entscheiden lassen, Macht der Parteien begrenzen.', pop: 0.3, east: 0.4, cost: 0 }
    ],
    finanzen: [
      { lean: -1, label: 'Spitzensteuer und Erbschaftsteuer rauf', desc: 'Hohe Einkommen und große Erbschaften stärker besteuern – das bringt Geld in die Kasse.', pop: 0.2, east: 0.2, cost: -1 },
      { lean: 0, label: 'Kleine und mittlere Einkommen entlasten', desc: 'Kalte Progression ausgleichen, Grundfreibetrag erhöhen, gegenfinanziert.', pop: 0.4, east: 0.1, cost: 1 },
      { lean: 1, label: 'Schuldenbremse einhalten, Ausgaben kürzen', desc: 'Keine neuen Schulden, Subventionen streichen, Staat verschlanken – schafft Spielraum.', pop: 0.1, east: -0.1, cost: -1 }
    ]
  };

  var PROGRAM_RULES = {
    coreCount: 3,        // Anzahl Kernthemen
    budget: 18,          // Finanzierungsrahmen in Punkten
    solidMargin: 4,      // so viele Punkte unter dem Rahmen gilt ein Programm als solide finanziert
    quizCount: 5,        // Fragen der Fachkonferenz je Kernthema
    // Kompetenzänderung je Kernthema nach Zahl der richtigen Antworten (0 bis 5)
    quizEffect: [-10, -5, 0, 5, 10, 15],
    slogans: [
      'Zukunft. Jetzt.',
      'Anpacken statt abwarten',
      'Für alle, nicht für wenige',
      'Sicher. Stark. Gerecht.',
      'Mut für Deutschland',
      'Das Land kann mehr'
    ]
  };

  // Wählergruppen in mehreren Dimensionen (Alter, Bildung, Wohnort, Geschlecht, Konfession, Beruf). Eine Person gehört zu je einer
  // Gruppe pro Dimension (z. B. jung + hohe Bildung + Stadt). Innerhalb jeder Dimension ergeben
  // die Anteile zusammen 100 % der Wahlberechtigten:
  // – Alter: Wahlberechtigte zur Bundestagswahl 2025 (Bundeswahlleiterin/bpb): 13,0 / 44,4 / 42,6 %
  // – Bildung: ISCED-Bildungsstand der 25- bis 64-Jährigen, Mikrozensus 2024: niedrig = ohne
  //   Berufsabschluss/Abitur (16,2 %), mittel = Berufsausbildung oder Abitur (50 %),
  //   hoch = Meister/Techniker, Fach-/Hochschulabschluss (33,8 %)
  // – Wohnort: 31,9 % leben in Großstädten ab 100.000 Einwohnern (Summe der 79 Großstädte)
  // – Geschlecht: 51,4 % der Wahlberechtigten 2025 sind Frauen (bpb)
  // Länderwerte: STATE_GROUPS, Quellen: GROUP_SOURCES.
  // factor = Ergebnis der Partei in der Gruppe geteilt durch ihr Bundesergebnis, nach den
  // Wahltagsbefragungen zur Bundestagswahl 2025 (Infratest dimap, Forschungsgruppe Wahlen);
  // z. B. Linke bei 18–29: rund 24 % statt 8,8 % → 2,7. Die Engine gleicht die Faktoren je
  // Dimension aus. topics = Lieblingsthemen (Faktor auf die Wirkung).
  var GROUPS = [
    { id: 'jung', dim: 'alter', name: 'Junge Wähler (18–29)', short: 'Junge', icon: '🧑‍🎓', weight: 0.13,
      topics: { klima: 1.8, bildung: 1.8, digitales: 1.9, wohnen: 1.9, europa: 1.3 },
      factor: { union: 0.54, afd: 1.0, spd: 0.76, gruene: 1.0, linke: 2.7, bsw: 1.2, fdp: 1.23 } },
    { id: 'mitte', dim: 'alter', name: 'Mittleres Alter (30–59)', short: '30–59', icon: '🧑‍💼', weight: 0.444,
      topics: { familie: 1.8, wirtschaft: 1.6, wohnen: 1.5, bildung: 1.4, finanzen: 1.3, migration: 1.2 },
      factor: { union: 0.89, afd: 1.19, spd: 0.82, gruene: 1.09, linke: 0.89, bsw: 1.0, fdp: 1.0 } },
    { id: 'aelter', dim: 'alter', name: 'Ältere (60+)', short: 'Ältere', icon: '👵', weight: 0.426,
      topics: { soziales: 1.8, gesundheit: 1.9, sicherheit: 1.6, migration: 1.3, verteidigung: 1.3 },
      factor: { union: 1.28, afd: 0.86, spd: 1.37, gruene: 0.74, linke: 0.55, bsw: 1.0, fdp: 1.0 } },
    { id: 'niedrig', dim: 'bildung', name: 'Niedrige Bildung', short: 'Niedrig', icon: '🛠️', weight: 0.162,
      topics: { soziales: 1.8, migration: 1.6, sicherheit: 1.5, gesundheit: 1.3, finanzen: 1.2 },
      factor: { union: 1.15, afd: 1.3, spd: 1.35, gruene: 0.4, linke: 0.6, bsw: 1.2, fdp: 0.6 } },
    { id: 'mittel', dim: 'bildung', name: 'Mittlere Bildung', short: 'Mittel', icon: '👷', weight: 0.50,
      topics: { wirtschaft: 1.7, wohnen: 1.4, familie: 1.4, soziales: 1.3, verkehr: 1.2 },
      factor: { union: 1.0, afd: 1.3, spd: 0.9, gruene: 0.6, linke: 0.8, bsw: 1.1, fdp: 0.85 } },
    { id: 'hoch', dim: 'bildung', name: 'Hohe Bildung', short: 'Hoch', icon: '🎓', weight: 0.338,
      topics: { klima: 1.6, bildung: 1.6, europa: 1.8, digitales: 1.5, demokratie: 1.7 },
      factor: { union: 0.9, afd: 0.6, spd: 0.85, gruene: 1.65, linke: 1.35, bsw: 0.8, fdp: 1.3 } },
    { id: 'stadt', dim: 'ort', name: 'Großstädter', short: 'Stadt', icon: '🏙️', weight: 0.319,
      topics: { wohnen: 2.0, verkehr: 1.7, klima: 1.4, sicherheit: 1.3 },
      factor: { union: 0.86, afd: 0.71, spd: 1.0, gruene: 1.52, linke: 1.57, bsw: 0.8, fdp: 1.23 } },
    { id: 'land', dim: 'ort', name: 'Kleinstadt & Land', short: 'Land', icon: '🌾', weight: 0.681,
      topics: { land: 2.2, verkehr: 1.5, migration: 1.4, familie: 1.4, wirtschaft: 1.2 },
      factor: { union: 1.07, afd: 1.14, spd: 1.0, gruene: 0.74, linke: 0.77, bsw: 1.0, fdp: 1.0 } },
    { id: 'maenner', dim: 'geschlecht', name: 'Männer', short: 'Männer', icon: '👨', weight: 0.486,
      topics: { wirtschaft: 1.4, verteidigung: 1.5, migration: 1.3, verkehr: 1.3, digitales: 1.3 },
      factor: { union: 1.02, afd: 1.15, spd: 0.91, gruene: 0.86, linke: 0.8, bsw: 1.0, fdp: 1.16 } },
    { id: 'frauen', dim: 'geschlecht', name: 'Frauen', short: 'Frauen', icon: '👩', weight: 0.514,
      topics: { familie: 1.6, gesundheit: 1.5, soziales: 1.4, bildung: 1.4, klima: 1.3 },
      factor: { union: 0.98, afd: 0.85, spd: 1.1, gruene: 1.12, linke: 1.25, bsw: 1.0, fdp: 0.84 } },
    { id: 'kath', dim: 'konfession', name: 'Katholiken', short: 'Katholisch', icon: '⛪', weight: 0.23,
      topics: { familie: 1.5, soziales: 1.3, land: 1.3, migration: 1.2, sicherheit: 1.2 },
      factor: { union: 1.37, afd: 0.87, spd: 0.91, gruene: 0.95, linke: 0.57, bsw: 0.6, fdp: 1.16 } },
    { id: 'evang', dim: 'konfession', name: 'Protestanten', short: 'Evangelisch', icon: '✝️', weight: 0.208,
      topics: { soziales: 1.4, gesundheit: 1.3, klima: 1.2, familie: 1.2, europa: 1.2 },
      factor: { union: 1.02, afd: 0.96, spd: 1.22, gruene: 0.95, linke: 0.8, bsw: 0.8, fdp: 1.16 } },
    { id: 'konfl', dim: 'konfession', name: 'Konfessionslose & andere', short: 'Konfessionslos', icon: '🔹', weight: 0.562,
      topics: { wirtschaft: 1.2, wohnen: 1.3, digitales: 1.3, klima: 1.2, migration: 1.2 },
      factor: { union: 0.77, afd: 1.15, spd: 0.85, gruene: 1.21, linke: 1.36, bsw: 1.2, fdp: 0.93 } },
    { id: 'arbeiter', dim: 'beruf', name: 'Arbeiter', short: 'Arbeiter', icon: '🔧', weight: 0.104,
      topics: { wirtschaft: 1.6, migration: 1.5, soziales: 1.4, finanzen: 1.2, verkehr: 1.2 },
      factor: { union: 0.77, afd: 1.83, spd: 0.73, gruene: 0.43, linke: 0.91, bsw: 1.2, fdp: 0.7 } },
    { id: 'angest', dim: 'beruf', name: 'Angestellte', short: 'Angestellte', icon: '💼', weight: 0.403,
      topics: { wirtschaft: 1.3, wohnen: 1.3, bildung: 1.2, digitales: 1.2, familie: 1.2 },
      factor: { union: 0.91, afd: 1.01, spd: 0.85, gruene: 1.29, linke: 1.02, bsw: 1.0, fdp: 0.93 } },
    { id: 'beamte', dim: 'beruf', name: 'Beamte', short: 'Beamte', icon: '🏛️', weight: 0.03,
      topics: { sicherheit: 1.4, bildung: 1.4, finanzen: 1.3, demokratie: 1.3, verteidigung: 1.2 },
      factor: { union: 1.16, afd: 0.67, spd: 1.04, gruene: 1.47, linke: 0.8, bsw: 0.6, fdp: 0.93 } },
    { id: 'selbst', dim: 'beruf', name: 'Selbstständige', short: 'Selbstständige', icon: '🧾', weight: 0.053,
      topics: { wirtschaft: 1.8, finanzen: 1.6, digitales: 1.4, verkehr: 1.2 },
      factor: { union: 1.23, afd: 0.91, spd: 0.55, gruene: 1.12, linke: 0.68, bsw: 0.8, fdp: 1.63 } },
    { id: 'rentner', dim: 'beruf', name: 'Rentner & Pensionäre', short: 'Rentner', icon: '🧓', weight: 0.288,
      topics: { soziales: 1.9, gesundheit: 1.8, sicherheit: 1.4, migration: 1.2 },
      factor: { union: 1.37, afd: 0.72, spd: 1.46, gruene: 0.6, linke: 0.57, bsw: 0.8, fdp: 0.93 } },
    { id: 'arbeitslos', dim: 'beruf', name: 'Arbeitslose', short: 'Arbeitslose', icon: '📉', weight: 0.042,
      topics: { soziales: 2.0, wohnen: 1.5, wirtschaft: 1.4, migration: 1.2 },
      factor: { union: 0.53, afd: 1.63, spd: 0.85, gruene: 0.6, linke: 1.48, bsw: 1.4, fdp: 0.47 } },
    { id: 'ausbild', dim: 'beruf', name: 'In Ausbildung & Sonstige', short: 'Ausbildung', icon: '📚', weight: 0.08,
      topics: { bildung: 1.8, wohnen: 1.6, klima: 1.5, digitales: 1.3 },
      factor: { union: 0.53, afd: 0.82, spd: 0.73, gruene: 1.21, linke: 2.5, bsw: 1.0, fdp: 1.16 } }
  ];

  var GROUP_DIMS = [
    { id: 'alter', name: 'Alter' },
    { id: 'bildung', name: 'Bildung' },
    { id: 'ort', name: 'Wohnort' },
    { id: 'geschlecht', name: 'Geschlecht' },
    { id: 'konfession', name: 'Konfession' },
    { id: 'beruf', name: 'Beruf' }
  ];

  // Zusammensetzung der Wählerschaft je Bundesland (Anteile je Dimension, Summe jeweils 1).
  // Quellen und Belastbarkeit siehe GROUP_SOURCES.
  var STATE_GROUPS = {
    BW: { jung: 0.142, mitte: 0.441, aelter: 0.417, niedrig: 0.17, mittel: 0.457, hoch: 0.373, stadt: 0.191, land: 0.809, maenner: 0.487, frauen: 0.513, kath: 0.271, evang: 0.233, konfl: 0.496, arbeiter: 0.114, angest: 0.422, beamte: 0.032, selbst: 0.053, rentner: 0.274, arbeitslos: 0.03, ausbild: 0.075 },
    BY: { jung: 0.135, mitte: 0.456, aelter: 0.409, niedrig: 0.13, mittel: 0.5, hoch: 0.37, stadt: 0.227, land: 0.773, maenner: 0.487, frauen: 0.513, kath: 0.407, evang: 0.149, konfl: 0.444, arbeiter: 0.108, angest: 0.421, beamte: 0.033, selbst: 0.061, rentner: 0.276, arbeitslos: 0.027, ausbild: 0.074 },
    BE: { jung: 0.149, mitte: 0.478, aelter: 0.373, niedrig: 0.15, mittel: 0.389, hoch: 0.461, stadt: 1, land: 0, maenner: 0.489, frauen: 0.511, kath: 0.07, evang: 0.118, konfl: 0.812, arbeiter: 0.057, angest: 0.399, beamte: 0.031, selbst: 0.07, rentner: 0.252, arbeitslos: 0.067, ausbild: 0.124 },
    BB: { jung: 0.096, mitte: 0.437, aelter: 0.467, niedrig: 0.07, mittel: 0.612, hoch: 0.318, stadt: 0.072, land: 0.928, maenner: 0.49, frauen: 0.51, kath: 0.033, evang: 0.119, konfl: 0.848, arbeiter: 0.123, angest: 0.371, beamte: 0.026, selbst: 0.05, rentner: 0.335, arbeitslos: 0.039, ausbild: 0.056 },
    HB: { jung: 0.149, mitte: 0.433, aelter: 0.418, niedrig: 0.24, mittel: 0.453, hoch: 0.307, stadt: 1, land: 0, maenner: 0.487, frauen: 0.513, kath: 0.079, evang: 0.247, konfl: 0.674, arbeiter: 0.088, angest: 0.377, beamte: 0.03, selbst: 0.04, rentner: 0.274, arbeitslos: 0.073, ausbild: 0.118 },
    HH: { jung: 0.16, mitte: 0.492, aelter: 0.348, niedrig: 0.17, mittel: 0.408, hoch: 0.422, stadt: 1, land: 0, maenner: 0.49, frauen: 0.51, kath: 0.078, evang: 0.191, konfl: 0.731, arbeiter: 0.062, angest: 0.441, beamte: 0.034, selbst: 0.064, rentner: 0.239, arbeitslos: 0.058, ausbild: 0.102 },
    HE: { jung: 0.133, mitte: 0.448, aelter: 0.419, niedrig: 0.17, mittel: 0.476, hoch: 0.354, stadt: 0.245, land: 0.755, maenner: 0.486, frauen: 0.514, kath: 0.178, evang: 0.269, konfl: 0.553, arbeiter: 0.084, angest: 0.412, beamte: 0.032, selbst: 0.058, rentner: 0.275, arbeitslos: 0.039, ausbild: 0.1 },
    MV: { jung: 0.101, mitte: 0.422, aelter: 0.477, niedrig: 0.08, mittel: 0.638, hoch: 0.282, stadt: 0.13, land: 0.87, maenner: 0.489, frauen: 0.511, kath: 0.031, evang: 0.121, konfl: 0.848, arbeiter: 0.125, angest: 0.38, beamte: 0.025, selbst: 0.05, rentner: 0.324, arbeitslos: 0.051, ausbild: 0.045 },
    NI: { jung: 0.133, mitte: 0.442, aelter: 0.425, niedrig: 0.18, mittel: 0.502, hoch: 0.318, stadt: 0.184, land: 0.816, maenner: 0.486, frauen: 0.514, kath: 0.145, evang: 0.355, konfl: 0.5, arbeiter: 0.108, angest: 0.393, beamte: 0.033, selbst: 0.05, rentner: 0.29, arbeitslos: 0.041, ausbild: 0.085 },
    NW: { jung: 0.135, mitte: 0.444, aelter: 0.421, niedrig: 0.21, mittel: 0.479, hoch: 0.311, stadt: 0.457, land: 0.543, maenner: 0.486, frauen: 0.514, kath: 0.312, evang: 0.197, konfl: 0.491, arbeiter: 0.094, angest: 0.405, beamte: 0.028, selbst: 0.048, rentner: 0.283, arbeitslos: 0.054, ausbild: 0.088 },
    RP: { jung: 0.127, mitte: 0.436, aelter: 0.437, niedrig: 0.19, mittel: 0.5, hoch: 0.31, stadt: 0.174, land: 0.826, maenner: 0.486, frauen: 0.514, kath: 0.331, evang: 0.223, konfl: 0.446, arbeiter: 0.11, angest: 0.397, beamte: 0.037, selbst: 0.051, rentner: 0.293, arbeitslos: 0.038, ausbild: 0.074 },
    SL: { jung: 0.116, mitte: 0.412, aelter: 0.472, niedrig: 0.19, mittel: 0.54, hoch: 0.27, stadt: 0.182, land: 0.818, maenner: 0.484, frauen: 0.516, kath: 0.451, evang: 0.145, konfl: 0.404, arbeiter: 0.11, angest: 0.378, beamte: 0.032, selbst: 0.045, rentner: 0.31, arbeitslos: 0.049, ausbild: 0.076 },
    SN: { jung: 0.116, mitte: 0.429, aelter: 0.455, niedrig: 0.06, mittel: 0.6, hoch: 0.34, stadt: 0.354, land: 0.646, maenner: 0.491, frauen: 0.509, kath: 0.034, evang: 0.148, konfl: 0.818, arbeiter: 0.127, angest: 0.365, beamte: 0.02, selbst: 0.052, rentner: 0.339, arbeitslos: 0.044, ausbild: 0.053 },
    ST: { jung: 0.101, mitte: 0.414, aelter: 0.485, niedrig: 0.08, mittel: 0.67, hoch: 0.25, stadt: 0.222, land: 0.778, maenner: 0.489, frauen: 0.511, kath: 0.029, evang: 0.098, konfl: 0.873, arbeiter: 0.133, angest: 0.349, beamte: 0.021, selbst: 0.038, rentner: 0.345, arbeitslos: 0.049, ausbild: 0.065 },
    SH: { jung: 0.125, mitte: 0.442, aelter: 0.433, niedrig: 0.16, mittel: 0.54, hoch: 0.3, stadt: 0.158, land: 0.842, maenner: 0.486, frauen: 0.514, kath: 0.05, evang: 0.358, konfl: 0.592, arbeiter: 0.097, angest: 0.401, beamte: 0.036, selbst: 0.056, rentner: 0.302, arbeitslos: 0.041, ausbild: 0.067 },
    TH: { jung: 0.102, mitte: 0.417, aelter: 0.481, niedrig: 0.06, mittel: 0.638, hoch: 0.302, stadt: 0.156, land: 0.844, maenner: 0.489, frauen: 0.511, kath: 0.069, evang: 0.171, konfl: 0.76, arbeiter: 0.146, angest: 0.353, beamte: 0.023, selbst: 0.047, rentner: 0.338, arbeitslos: 0.041, ausbild: 0.052 }
  };

  var GROUP_SOURCES = [
    { dim: 'Alter', text: 'Wahlberechtigte zur Bundestagswahl 2025 nach Altersgruppen. Bund amtlich (13,0 / 44,4 / 42,6 %). Amtlich je Land: Baden-Württemberg (Statistisches Landesamt BW) und Sachsen (repräsentative Wahlstatistik). Übrige Länder geschätzt aus den Strukturdaten der Bundeswahlleiterin (Bevölkerung nach Altersgruppen, Ausländeranteil), auf den Bundeswert geeicht – Genauigkeit etwa ± 1 Punkt.',
      url: 'https://www.bundeswahlleiterin.de/bundestagswahlen/2025/strukturdaten/bund-99.html' },
    { dim: 'Alter (BW)', text: 'Statistisches Monatsheft Baden-Württemberg 10/2025.', url: 'https://www.statistik-bw.de/fileadmin/user_upload/Service/Veroeff/Statistisches_Monatsheft/Beitrag25_10_03.pdf' },
    { dim: 'Alter (SN)', text: 'Statistik Sachsen, repräsentative Wahlstatistik zur Bundestagswahl 2025.', url: 'https://wahlen.sachsen.de/bundestagswahl-2025-rws-repraesentative-wahlstatistik.html' },
    { dim: 'Bildung', text: 'Bildungsstand der 25- bis 64-Jährigen nach ISCED 2011 (niedrig 0–2, mittel 3–4, hoch 5–8), Mikrozensus 2024, „Internationale Bildungsindikatoren im Ländervergleich 2025“. Anteil „hoch“ für die meisten Länder aus der Veröffentlichung; „niedrig“ je Land und „hoch“ für RP, SN, SH geschätzt (± 1–3 Punkte), „mittel“ = Rest.',
      url: 'https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bildung-Forschung-Kultur/Bildungsstand/Publikationen/Downloads-Bildungsstand/bildungsindikatoren-1023017257004.pdf?__blob=publicationFile&v=2' },
    { dim: 'Geschlecht', text: 'Bund: 51,4 % der Wahlberechtigten zur Bundestagswahl 2025 waren Frauen (bpb nach Bundeswahlleiterin). Länderwerte geschätzt aus der Altersstruktur des Landes (Frauenanteil 18–29: 48,3 %, 30–59: 49,6 %, 60+: 54,2 %; in den ostdeutschen Flächenländern bei Jüngeren 1–1,5 Punkte weniger wegen Abwanderung junger Frauen). Parteiwerte nach den Wahltagsbefragungen 2025.',
      url: 'https://www.bpb.de/kurz-knapp/zahlen-und-fakten/bundestagswahlen/564029/wahlberechtigte/' },
    { dim: 'Konfession', text: 'Katholiken je Land: Kirchenstatistik der Deutschen Bischofskonferenz 2025 (Bevölkerung nach Zensus 2022 fortgeschrieben). Protestanten: EKD-Mitgliederzahl 31.12.2025 (Bund 20,8 %), je Land für NI, NW, HB belegt, sonst aus der Ländertabelle 2023 mit dem bundesweiten Rückgang hochgerechnet. Anteile an der Gesamtbevölkerung, nicht nur an den Wahlberechtigten. Wahlverhalten: Forschungsgruppe Wahlen (ZDF), Wahltagsbefragung 2025.',
      url: 'https://fowid.de/meldung/wahlverhalten-bundestagswahl-2025' },
    { dim: 'Beruf', text: 'Wahlverhalten nach Beruf: Wahltagsbefragungen 2025 von Infratest dimap (ARD, über FES-Analyse) und Forschungsgruppe Wahlen (ZDF, über KAS); belegt u. a. Arbeiter AfD 38 %, Rentner Union 39 %, Arbeitslose AfD 34 %, Selbstständige Union 35 %, übrige Werte geschätzt und am Bundesergebnis geeicht. Anteile je Land: Modellrechnung aus Mikrozensus (Stellung im Beruf), Arbeitslosenzahlen der Bundesagentur für Arbeit 2025 und Altersstruktur – geschätzt; Basis Bevölkerung ab 18.',
      url: 'https://dc.fes.de/fileadmin/user_upload/FES_Analyse_der_Bundestagswahl_2025_DE.pdf' },
    { dim: 'Wahlbeteiligung', text: 'Wahlbeteiligung 2025 je Land: amtliche Endergebnisse der Landeswahlleitungen (Bund 82,5 %; höchste Bayern 84,3 %, niedrigste Sachsen-Anhalt 77,7 %). Schleswig-Holstein und Thüringen nur über Sekundärquellen. Mobilisierungspotenzial: Gewinne aus dem Nichtwählerlager 2025 laut Infratest dimap (KAS-, FES-Analysen) – Modellschätzungen.',
      url: 'https://www.kas.de/documents/d/guest/wahlanalyse_bundestagswahl_23-02-2025' },
    { dim: 'Briefwahl', text: 'Briefwähleranteil 2025: Bund 37,0 %, Länder amtlich (Bayern 52,2 % am höchsten, Thüringen 25,6 % am niedrigsten). Je Gruppe: Alter und Geschlecht aus den Antragsquoten der repräsentativen Wahlstatistik geschätzt (± 3 Punkte), Stadt/Land und Beruf grob geschätzt, für Bildung und Konfession keine Daten (Bundesschnitt).',
      url: 'https://www.bpb.de/kurz-knapp/zahlen-und-fakten/bundestagswahlen/560708/wahlbeteiligung-und-briefwahl/' },
    { dim: 'Wohnort', text: 'Anteil der Einwohner in Großstädten ab 100.000 Einwohnern: Summe der 79 Großstädte je Land geteilt durch die Landesbevölkerung (Destatis, Statistische Landesämter, Stand 31.12.2024/2025, Zensus-2022-Basis). Berlin, Hamburg und Bremen: 100 %. Genauigkeit etwa ± 0,3 Punkte.',
      url: 'https://de.wikipedia.org/wiki/Liste_der_Gro%C3%9Fst%C3%A4dte_in_Deutschland' }
  ];

  // Landesthemen: wichtigste Probleme je Land nach Landesumfragen (offene Nennungen, oft bis zu
  // zwei). Die Engine vergleicht jedes Land mit den anderen Ländern; nicht genannte Themen zählen
  // wie im Bundesschnitt. vollstaendig = Umfrage führt alle nennenswerten Themen auf.
  var STATE_TOPICS = {
    BW: { werte: {wirtschaft:  31,  klima:  14,  bildung:  14,  verkehr:  13,  migration:  12,  wohnen:  10}, vollstaendig: false,
      quelle: 'ZDF-Politbarometer Extra Baden-Württemberg, Feb. 2026', url: 'https://www.forschungsgruppe.de/Umfragen/Politbarometer/Archiv/Politbarometer-Extra/PB-Extra_Baden-Wuerttemberg_Februar_2026/' },
    BY: { werte: {migration:  29,  wirtschaft:  20,  bildung:  13,  klima:  11}, vollstaendig: false,
      quelle: 'Infratest dimap, BayernTREND (BR), Jan. 2026', url: 'https://www.infratest-dimap.de/umfragen-analysen/bundeslaender/bayern/laendertrend/2026/januar/' },
    BE: { werte: {wohnen:  32,  migration:  10,  sicherheit:  9,  verkehr:  8}, vollstaendig: false,
      quelle: 'Infratest dimap, BerlinTREND (rbb), Sep. 2026', url: 'https://www.echo24.de/welt/berlin-wahl-umfrage-cdu-ueberholt-linke-trotz-mieten-frust-zr-94473215.html' },
    BB: { werte: {demokratie:  21,  bildung:  15,  migration:  13,  wirtschaft:  13,  klima:  12,  verkehr:  11}, vollstaendig: true,
      quelle: 'forsa, Brandenburg-Monitor 2026 (Staatskanzlei), Juli/Aug. 2026', url: 'https://www.brandenburg.de/sixcms/detail.php?id=242495' },
    HB: { werte: {bildung:  45,  verkehr:  28,  sicherheit:  15,  soziales:  13,  migration:  12,  wohnen:  8,  wirtschaft:  5}, vollstaendig: true,
      quelle: 'Infratest dimap, BremenTREND (Radio Bremen), Apr. 2023', url: 'https://de.statista.com/statistik/daten/studie/1379910/umfrage/wichtigste-politische-probleme-in-bremen' },
    HH: { werte: {verkehr:  42,  wohnen:  32,  migration:  15,  bildung:  12,  wirtschaft:  10}, vollstaendig: false,
      quelle: 'ZDF-Politbarometer Extra Hamburg, Feb. 2025', url: 'https://www.zdfheute.de/politik/politbarometer-hamburg-buergerschaftswahl-100.html' },
    HE: { werte: {bildung:  29,  migration:  22,  verkehr:  16,  wirtschaft:  13,  wohnen:  11}, vollstaendig: false,
      quelle: 'Infratest dimap, hr-HessenTREND, Jan. 2026', url: 'https://www.infratest-dimap.de/umfragen-analysen/bundeslaender/hessen/laendertrend/2026/februar/' },
    MV: { werte: {wirtschaft:  30,  bildung:  25,  migration:  16,  soziales:  6}, vollstaendig: false,
      quelle: 'Infratest dimap, MV-TREND (NDR), 2026 – Werte nur über Social-Media-Zitat', url: 'https://x.com/Wahlen_DE/status/2095567466701226140' },
    NI: { werte: {wirtschaft:  29,  migration:  27,  bildung:  20,  klima:  10}, vollstaendig: false,
      quelle: 'Infratest dimap, NiedersachsenTREND (NDR), Nov. 2024', url: 'https://www.infratest-dimap.de/umfragen-analysen/bundeslaender/niedersachsen/laendertrend/2024/november/' },
    NW: { werte: {verkehr:  31,  bildung:  24,  migration:  20,  soziales:  12,  wirtschaft:  9,  wohnen:  9,  klima:  9}, vollstaendig: false,
      quelle: 'Infratest dimap, NRW-TREND (WDR), Juni 2026', url: 'https://www.infratest-dimap.de/umfragen-analysen/bundeslaender/nordrhein-westfalen/laendertrend/2026/juni/' },
    RP: { werte: {bildung:  29,  migration:  22,  verkehr:  18,  wirtschaft:  13}, vollstaendig: false,
      quelle: 'Infratest dimap, Rheinland-PfalzTREND (SWR), Jan. 2026 (statt Aug. 2026 mit hitzebedingter Klima-Spitze)', url: 'https://www.infratest-dimap.de/umfragen-analysen/bundeslaender/rheinland-pfalz/laendertrend/2026/august/' },
    SL: { werte: {wirtschaft:  40,  migration:  25,  bildung:  23,  gesundheit:  12,  sicherheit:  11,  verkehr:  10,  klima:  9}, vollstaendig: false,
      quelle: 'Infratest dimap, SaarlandTREND (SR), Apr. 2025', url: 'https://de.statista.com/statistik/daten/studie/2143/umfrage/wichtigste-politische-probleme-im-saarland' },
    SN: { werte: {migration:  44,  bildung:  19,  demokratie:  19,  soziales:  12,  wirtschaft:  11,  gesundheit:  7,  verkehr:  7,  klima:  6,  sicherheit:  6}, vollstaendig: true,
      quelle: 'Infratest dimap, SachsenTREND (MDR), Juni 2024', url: 'https://www.infratest-dimap.de/umfragen-analysen/bundeslaender/sachsen/laendertrend/2024/juni/' },
    ST: { werte: {wirtschaft:  39,  bildung:  17,  migration:  14}, vollstaendig: false,
      quelle: 'ZDF-Politbarometer Extra Sachsen-Anhalt, Aug. 2026; Migration aus Infratest dimap (MDR), Mai 2026', url: 'https://presseportal.zdf.de/pressemitteilung/zdf-politbarometer-extra-i-sachsen-anhalt-august-2026' },
    SH: { werte: {verkehr:  28,  bildung:  22,  migration:  20}, vollstaendig: false,
      quelle: 'Infratest dimap, Schleswig-HolsteinTREND (NDR), Apr. 2026 – nur Rangfolge bekannt, Werte geschätzt', url: 'https://www.infratest-dimap.de/umfragen-analysen/bundeslaender/schleswig-holstein/laendertrend/2026/april/' },
    TH: { werte: {migration:  39,  bildung:  25,  wirtschaft:  11,  demokratie:  19,  soziales:  8,  verkehr:  8}, vollstaendig: true,
      quelle: 'Infratest dimap, ThüringenTREND (MDR), Juni 2024', url: 'https://www.infratest-dimap.de/umfragen-analysen/bundeslaender/thueringen/laendertrend/2024/juni/' }
  };

  var STATE_TOPIC_SOURCES = [
    { dim: 'Landesthemen', text: 'Wichtigste Probleme je Land aus Landesumfragen (Infratest dimap LänderTRENDs, ZDF-Politbarometer Extra, forsa Brandenburg-Monitor), meist 2025/2026; Sachsen und Thüringen Juni 2024, Bremen 2023, Niedersachsen Nov. 2024. Weil Landesumfragen nach Landespolitik fragen (Bildung, Verkehr oben), vergleicht das Spiel jedes Land nur mit den anderen Ländern. Werte über Suchergebnis-Auszüge erhoben; Schleswig-Holstein nur Rangfolge (Werte geschätzt), Mecklenburg-Vorpommern über Social-Media-Zitat.' },
    { dim: 'Landesthemen (BW)', text: 'ZDF-Politbarometer Extra Baden-Württemberg, Feb. 2026', url: 'https://www.forschungsgruppe.de/Umfragen/Politbarometer/Archiv/Politbarometer-Extra/PB-Extra_Baden-Wuerttemberg_Februar_2026/' },
    { dim: 'Landesthemen (BY)', text: 'Infratest dimap, BayernTREND (BR), Jan. 2026', url: 'https://www.infratest-dimap.de/umfragen-analysen/bundeslaender/bayern/laendertrend/2026/januar/' },
    { dim: 'Landesthemen (BE)', text: 'Infratest dimap, BerlinTREND (rbb), Sep. 2026', url: 'https://www.echo24.de/welt/berlin-wahl-umfrage-cdu-ueberholt-linke-trotz-mieten-frust-zr-94473215.html' },
    { dim: 'Landesthemen (BB)', text: 'forsa, Brandenburg-Monitor 2026 (Staatskanzlei), Juli/Aug. 2026', url: 'https://www.brandenburg.de/sixcms/detail.php?id=242495' },
    { dim: 'Landesthemen (HB)', text: 'Infratest dimap, BremenTREND (Radio Bremen), Apr. 2023', url: 'https://de.statista.com/statistik/daten/studie/1379910/umfrage/wichtigste-politische-probleme-in-bremen' },
    { dim: 'Landesthemen (HH)', text: 'ZDF-Politbarometer Extra Hamburg, Feb. 2025', url: 'https://www.zdfheute.de/politik/politbarometer-hamburg-buergerschaftswahl-100.html' },
    { dim: 'Landesthemen (HE)', text: 'Infratest dimap, hr-HessenTREND, Jan. 2026', url: 'https://www.infratest-dimap.de/umfragen-analysen/bundeslaender/hessen/laendertrend/2026/februar/' },
    { dim: 'Landesthemen (MV)', text: 'Infratest dimap, MV-TREND (NDR), 2026 – Werte nur über Social-Media-Zitat', url: 'https://x.com/Wahlen_DE/status/2095567466701226140' },
    { dim: 'Landesthemen (NI)', text: 'Infratest dimap, NiedersachsenTREND (NDR), Nov. 2024', url: 'https://www.infratest-dimap.de/umfragen-analysen/bundeslaender/niedersachsen/laendertrend/2024/november/' },
    { dim: 'Landesthemen (NW)', text: 'Infratest dimap, NRW-TREND (WDR), Juni 2026', url: 'https://www.infratest-dimap.de/umfragen-analysen/bundeslaender/nordrhein-westfalen/laendertrend/2026/juni/' },
    { dim: 'Landesthemen (RP)', text: 'Infratest dimap, Rheinland-PfalzTREND (SWR), Jan. 2026 (statt Aug. 2026 mit hitzebedingter Klima-Spitze)', url: 'https://www.infratest-dimap.de/umfragen-analysen/bundeslaender/rheinland-pfalz/laendertrend/2026/august/' },
    { dim: 'Landesthemen (SL)', text: 'Infratest dimap, SaarlandTREND (SR), Apr. 2025', url: 'https://de.statista.com/statistik/daten/studie/2143/umfrage/wichtigste-politische-probleme-im-saarland' },
    { dim: 'Landesthemen (SN)', text: 'Infratest dimap, SachsenTREND (MDR), Juni 2024', url: 'https://www.infratest-dimap.de/umfragen-analysen/bundeslaender/sachsen/laendertrend/2024/juni/' },
    { dim: 'Landesthemen (ST)', text: 'ZDF-Politbarometer Extra Sachsen-Anhalt, Aug. 2026; Migration aus Infratest dimap (MDR), Mai 2026', url: 'https://presseportal.zdf.de/pressemitteilung/zdf-politbarometer-extra-i-sachsen-anhalt-august-2026' },
    { dim: 'Landesthemen (SH)', text: 'Infratest dimap, Schleswig-HolsteinTREND (NDR), Apr. 2026 – nur Rangfolge bekannt, Werte geschätzt', url: 'https://www.infratest-dimap.de/umfragen-analysen/bundeslaender/schleswig-holstein/laendertrend/2026/april/' },
    { dim: 'Landesthemen (TH)', text: 'Infratest dimap, ThüringenTREND (MDR), Juni 2024', url: 'https://www.infratest-dimap.de/umfragen-analysen/bundeslaender/thueringen/laendertrend/2024/juni/' }
  ];

  // Wahlbeteiligung bei der Bundestagswahl 2025 (amtliches Endergebnis, Landeswahlleitungen/Bundeswahlleiterin).
  var TURNOUT = { DE: 82.5, BW: 83.4, BY: 84.3, BE: 80.3, BB: 81.6, HB: 77.8, HH: 80.9, HE: 83.1, MV: 79.5,
    NI: 83.4, NW: 82.2, RP: 83.0, SL: 82.4, SN: 81.1, ST: 77.7, SH: 83.5, TH: 80.7 };

  // Mobilisierungspotenzial im Nichtwählerlager: Gewinne aus dem Nichtwählerlager 2025 (Infratest dimap,
  // Wählerwanderung) im Verhältnis zur Stimmenzahl der Partei, auf 0,6–1,5 skaliert. AfD: 1,81 Mio.,
  // BSW: 0,40 Mio., Union: 0,90 Mio., Linke: 0,29 Mio., SPD: 0,25 Mio., Grüne: 0,11 Mio., FDP: ~0.
  // Wählerwanderung Bundestagswahl 2025 gegenüber 2021: Netto-Salden in Tsd. Wählern laut infratest dimap
  // (ARD), aktualisierte Fassung. Zitiert nach LpB Baden-Württemberg („Wer wählt wen?“), KAS-Wahlanalyse
  // vom 23.02.2025, FES-Analyse der BTW 2025 und Statista; Original: tagesschau.de/wahl/archiv/
  // 2025-02-23-BT-DE/analyse-wanderung.shtml. Linke ↔ AfD ist nicht beziffert (laut KAS „kaum“), hier
  // geschätzt aus der Bilanz. Nicht ausgewiesene Paare (z. B. Union ↔ Sonstige) zählen als 0.
  // Im Spiel dient die Größe des Austauschs als Nähe: Wer zulegt, holt die Stimmen anteilig von den
  // Parteien, mit denen er 2025 am meisten Wähler getauscht hat (nw = Nichtwähler).
  var FLOW_PAIRS = [
    ['spd', 'union', 1760], ['fdp', 'union', 1350], ['nw', 'union', 900], ['gruene', 'union', 460],
    ['union', 'afd', 1010], ['union', 'bsw', 220], ['union', 'linke', 70],
    ['nw', 'afd', 1810], ['fdp', 'afd', 890], ['sonstige', 'afd', 790], ['spd', 'afd', 720], ['gruene', 'afd', 100],
    ['linke', 'afd', 100], ['afd', 'bsw', 60],
    ['spd', 'linke', 560], ['spd', 'bsw', 440], ['spd', 'gruene', 100], ['nw', 'spd', 250], ['fdp', 'spd', 120], ['sonstige', 'spd', 60],
    ['gruene', 'linke', 700], ['gruene', 'bsw', 150], ['fdp', 'gruene', 140], ['nw', 'gruene', 110],
    ['sonstige', 'linke', 310], ['nw', 'linke', 290], ['fdp', 'linke', 100], ['linke', 'bsw', 350],
    ['sonstige', 'bsw', 500], ['nw', 'bsw', 400], ['fdp', 'bsw', 260],
    ['fdp', 'nw', 40]
  ];
  // Zweitstimmenergebnis 2025 (Bundeswahlleiterin, amtlich): Bezugsgröße für die Wanderungsdaten.
  var RESULT_2025 = { union: 28.5, afd: 20.8, spd: 16.4, gruene: 11.6, linke: 8.8, bsw: 4.98, fdp: 4.3, sonstige: 4.6 };
  // Sitzverteilung im 21. Bundestag nach der Wahl 2025 (Bundeswahlleiterin; ohne den SSW-Sitz).
  var SEATS_2025 = { union: 208, afd: 152, spd: 120, gruene: 85, linke: 64, bsw: 0, fdp: 0 };
  var FLOWS = {};
  FLOW_PAIRS.forEach(function (f) {
    [[f[0], f[1]], [f[1], f[0]]].forEach(function (ab) {
      if (ab[0] === 'nw' || ab[0] === 'sonstige') return;
      FLOWS[ab[0]] = FLOWS[ab[0]] || {};
      FLOWS[ab[0]][ab[1]] = (FLOWS[ab[0]][ab[1]] || 0) + f[2];
    });
  });

  // Brandmauer: Wie die Anhänger einer Partei eine Zusammenarbeit mit der AfD bewerten – je Stufe
  // [eigene Anträge auch mit AfD-Stimmen, gemeinsame Anträge/Tolerierung, Koalition], Anteil „akzeptabel“.
  // Quelle: ARD-DeutschlandTrend Februar 2025 (infratest dimap, 3.–5.2.2025, nach Parteianhängern; zitiert
  // nach Statista 761033): alle 44/38/28, Union 61/39/19, SPD 11/7/2, Grüne 8/7/1, AfD 83/95/94.
  // Linke laut Vorschau 12/12/11 (Zuordnung unsicher) – hier wie Grüne angesetzt (geschätzt). FDP und BSW
  // wurden nicht ausgewiesen; beide stimmten am 29.1.2025 für den Unionsantrag – geschätzt nahe der Union.
  // Folgen des 29.1.2025: Union in den Umfragen danach −2 bis +1 (Forsa, YouGov, infratest, FGW) – also
  // kaum Schaden durch Zufallsmehrheiten; Großdemos (Berlin ~160.000, München >250.000 laut Polizei),
  // Eintrittswelle bei Linken (+17.000) und Grünen (Rekord); Linke bei 18–24-Jährigen bei 25 %.
  // Ost/West: Forsa 2026 – Koalitionen mit der AfD im Osten 53 % dafür, im Westen 37 %.
  // Gruppeneffekte (Punkte je Stufe): Männer offener als Frauen (INSA, ohne Zahlen), Kritik der Kirchen
  // (EKD/Katholisches Büro, 28.1.2025) – Stärke geschätzt.
  var FIREWALL = {
    acceptance: {
      union: [0.61, 0.39, 0.19], spd: [0.11, 0.07, 0.02], gruene: [0.08, 0.07, 0.01],
      linke: [0.08, 0.07, 0.02], fdp: [0.55, 0.35, 0.18], bsw: [0.5, 0.35, 0.2]
    },
    east: 0.16, // Ost-West-Unterschied in der Zustimmung (53 % vs. 37 %)
    groups: { maenner: 2, frauen: -2, kath: -1.5, evang: -1.5 },
    mobilize: { linke: 1.5, gruene: 1.2, spd: 0.8, union: 0.4, fdp: 0.3, bsw: 0.3 },
    youngLinke: 0.6, // Gegenmobilisierung der Jungen zur Linken (Punkte in der Gruppe je Stufe)
    // Neigung der KI-Parteien, unter Druck einen Schritt zu gehen (je Woche, vor Druckfaktor) – geschätzt.
    ai: { union: 0.015, fdp: 0.01, bsw: 0.015, spd: 0.0005, gruene: 0.0003, linke: 0.0003 }
  };

  // Konfrontationslinien im Wahlkampf 2025 (Hauptgegner, gegen die eine Partei sich profiliert):
  // Union ↔ AfD (Migration, „Brandmauer“), Union ↔ SPD (Kanzlerduell Merz–Scholz), Union ↔ Grüne,
  // Grüne ↔ AfD, SPD/Grüne ↔ FDP (Ampel-Bruch), Linke ↔ Union/AfD, BSW ↔ Grüne (Ukraine-Politik) und ↔ Linke.
  var RIVALS = {
    union: ['afd', 'spd', 'gruene'],
    afd: ['union', 'gruene'],
    spd: ['union', 'fdp'],
    gruene: ['union', 'afd', 'fdp'],
    linke: ['union', 'afd', 'spd'],
    bsw: ['gruene', 'linke', 'union'],
    fdp: ['gruene', 'spd']
  };

  var NONVOTER_POTENTIAL = { union: 0.92, afd: 1.48, spd: 0.76, gruene: 0.7, linke: 0.93, bsw: 1.41, fdp: 0.6 };

  // Briefwahl 2025 (Anteil der Briefwähler an allen Wählern, %): Bund und Länder amtlich
  // (Bundeswahlleiterin, Landesämter). Gruppen: Alter und Geschlecht aus den Antragsquoten der
  // repräsentativen Wahlstatistik geschätzt; Stadt/Land grobe Faustregel; Beruf geschätzt
  // (Rentner ähnlich wie 70+); für Bildung und Konfession gibt es keine Daten (Bundesschnitt).
  var POSTAL = {
    states: { DE: 37.0, BW: 36.8, BY: 52.2, BE: 39.7, BB: 29.2, HB: 33.1, HH: 40.7, HE: 36.2, MV: 28.9,
      NI: 25.9, NW: 36.1, RP: 45.7, SL: 37.9, SN: 31.5, ST: 26.8, SH: 28.8, TH: 25.6 },
    groups: { jung: 32, mitte: 34, aelter: 41, niedrig: 37, mittel: 37, hoch: 37, stadt: 40, land: 35,
      maenner: 35, frauen: 39, kath: 37, evang: 37, konfl: 37, arbeiter: 33, angest: 34, beamte: 35,
      selbst: 35, rentner: 43, arbeitslos: 33, ausbild: 32 }
  };

  // Wie gut ein Kanal die einzelnen Gruppen erreicht.
  var CHANNELS = {
    social:     { jung: 2.2, mitte: 1.0, aelter: 0.4, niedrig: 0.8, mittel: 1.0, hoch: 1.2, stadt: 1.4, land: 0.7, maenner: 1.05, frauen: 0.95, kath: 0.9, evang: 0.95, konfl: 1.1, arbeiter: 0.9, angest: 1.1, beamte: 0.9, selbst: 1.1, rentner: 0.4, arbeitslos: 1.1, ausbild: 2.0 },
    tvspot:     { jung: 0.5, mitte: 1.0, aelter: 1.6, niedrig: 1.4, mittel: 1.1, hoch: 0.7, stadt: 0.8, land: 1.2, maenner: 0.95, frauen: 1.05, kath: 1.05, evang: 1.05, konfl: 0.95, arbeiter: 1.2, angest: 1.0, beamte: 1.0, selbst: 0.9, rentner: 1.6, arbeitslos: 1.3, ausbild: 0.5 },
    talkshow:   { jung: 0.5, mitte: 0.9, aelter: 1.4, niedrig: 0.6, mittel: 0.9, hoch: 1.6, stadt: 1.0, land: 0.8, maenner: 0.9, frauen: 1.1, kath: 1.0, evang: 1.05, konfl: 0.98, arbeiter: 0.6, angest: 1.0, beamte: 1.3, selbst: 1.1, rentner: 1.3, arbeitslos: 0.7, ausbild: 0.7 },
    presse:     { jung: 0.7, mitte: 0.9, aelter: 1.2, niedrig: 0.6, mittel: 0.9, hoch: 1.5, stadt: 1.1, land: 0.8, maenner: 1.0, frauen: 1.0, kath: 1.0, evang: 1.0, konfl: 1.0, arbeiter: 0.6, angest: 1.0, beamte: 1.3, selbst: 1.2, rentner: 1.1, arbeitslos: 0.6, ausbild: 0.8 },
    kundgebung: { jung: 0.7, mitte: 1.0, aelter: 1.1, niedrig: 1.4, mittel: 1.1, hoch: 0.6, stadt: 1.1, land: 1.3, maenner: 1.1, frauen: 0.9, kath: 1.1, evang: 1.0, konfl: 0.95, arbeiter: 1.4, angest: 0.9, beamte: 0.9, selbst: 0.9, rentner: 1.1, arbeitslos: 1.1, ausbild: 0.8 },
    plakate:    { jung: 0.8, mitte: 1.0, aelter: 1.2, niedrig: 1.3, mittel: 1.0, hoch: 0.7, stadt: 0.9, land: 1.4, maenner: 1.0, frauen: 1.0, kath: 1.05, evang: 1.0, konfl: 0.98, arbeiter: 1.2, angest: 1.0, beamte: 0.9, selbst: 0.9, rentner: 1.2, arbeitslos: 1.1, ausbild: 0.8 },
    haustuer:   { jung: 0.5, mitte: 0.9, aelter: 1.5, niedrig: 1.2, mittel: 1.0, hoch: 0.8, stadt: 1.1, land: 1.3, maenner: 0.9, frauen: 1.1, kath: 1.15, evang: 1.05, konfl: 0.92, arbeiter: 1.0, angest: 0.9, beamte: 1.0, selbst: 0.8, rentner: 1.5, arbeitslos: 1.3, ausbild: 0.6 },
    betrieb: { jung: 0.9, mitte: 1.4, aelter: 0.5, niedrig: 1.3, mittel: 1.5, hoch: 0.7, stadt: 0.95, land: 1.1, maenner: 1.2, frauen: 0.85, kath: 1.0, evang: 1.0, konfl: 1.0, arbeiter: 2.2, angest: 1.4, beamte: 0.7, selbst: 0.9, rentner: 0.3, arbeitslos: 0.6, ausbild: 0.8 },
    buerger: { jung: 0.7, mitte: 1.0, aelter: 1.3, niedrig: 0.8, mittel: 1.0, hoch: 1.3, stadt: 1.0, land: 1.0, maenner: 1.0, frauen: 1.0, kath: 1.05, evang: 1.05, konfl: 1.0, arbeiter: 1.0, angest: 1.0, beamte: 1.2, selbst: 1.0, rentner: 1.3, arbeitslos: 1.0, ausbild: 0.7 },
    infostand: { jung: 0.7, mitte: 0.9, aelter: 1.3, niedrig: 1.0, mittel: 1.0, hoch: 1.0, stadt: 1.3, land: 0.9, maenner: 1.0, frauen: 1.05, kath: 1.0, evang: 1.0, konfl: 1.0, arbeiter: 1.0, angest: 1.0, beamte: 1.0, selbst: 1.0, rentner: 1.3, arbeitslos: 1.1, ausbild: 0.9 },
    regional: { jung: 0.5, mitte: 0.9, aelter: 1.5, niedrig: 1.1, mittel: 1.0, hoch: 0.9, stadt: 0.85, land: 1.25, maenner: 1.0, frauen: 1.0, kath: 1.1, evang: 1.05, konfl: 0.95, arbeiter: 1.0, angest: 1.0, beamte: 1.0, selbst: 1.0, rentner: 1.5, arbeitslos: 1.0, ausbild: 0.5 }
  };

  var SEATS = 630;

  var data = {
    TOPICS: TOPICS,
    SALIENCE0: SALIENCE0,
    PARTIES: PARTIES,
    OTHER: OTHER,
    STATES: STATES,
    SEATS: SEATS,
    PROGRAM: PROGRAM,
    PROGRAM_RULES: PROGRAM_RULES,
    GROUPS: GROUPS,
    GROUP_DIMS: GROUP_DIMS,
    STATE_GROUPS: STATE_GROUPS,
    GROUP_SOURCES: GROUP_SOURCES,
    STATE_TOPICS: STATE_TOPICS,
    TURNOUT: TURNOUT,
    POSTAL: POSTAL,
    NONVOTER_POTENTIAL: NONVOTER_POTENTIAL,
    RIVALS: RIVALS,
    FIREWALL: FIREWALL,
    FLOWS: FLOWS,
    FLOW_PAIRS: FLOW_PAIRS,
    RESULT_2025: RESULT_2025,
    SEATS_2025: SEATS_2025,
    STATE_TOPIC_SOURCES: STATE_TOPIC_SOURCES,
    CHANNELS: CHANNELS
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = data;
  } else {
    root.BTW_DATA = data;
  }
})(this);
