/*
 * Spieldaten: Parteien, Bundesländer, Themen.
 * Die Ausgangswerte sind an das Zweitstimmen-Ergebnis der Bundestagswahl 2025
 * angelehnt, aber gerundet und vereinfacht – es handelt sich um ein Spiel.
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
    { id: 'wohnen', name: 'Wohnen & Mieten', icon: '🏠' }
  ];

  // Wie wichtig ist ein Thema den Wählerinnen und Wählern zu Beginn (Summe = 1)?
  var SALIENCE0 = {
    wirtschaft: 0.23,
    migration: 0.19,
    soziales: 0.15,
    klima: 0.11,
    sicherheit: 0.11,
    bildung: 0.07,
    digitales: 0.06,
    wohnen: 0.08
  };

  // Spielbare Parteien. "competence" = zugeschriebene Kompetenz je Thema (0–100).
  var PARTIES = [
    {
      id: 'union', flyerLogo: 'CDU · CSU', short: 'Union', name: 'CDU/CSU',
      budget: 30, goal: 32,
      goalText: 'Stärkste Kraft werden und über 32 % holen',
      desc: 'Die Volkspartei der Mitte. Stark bei Wirtschaft und Sicherheit, großes Budget.',
      competence: { wirtschaft: 70, migration: 55, soziales: 40, klima: 35, sicherheit: 65, bildung: 50, digitales: 45, wohnen: 45 },
      // Traditionelle Parteilinie je Thema: -1 = links/progressiv, 0 = Mitte, 1 = konservativ/marktliberal
      lean: { wirtschaft: 1, migration: 1, soziales: 0, klima: 0, sicherheit: 1, bildung: 1, digitales: 0, wohnen: 1 }
    },
    {
      id: 'afd', flyerLogo: 'AfD', short: 'AfD', name: 'AfD',
      budget: 15, goal: 25,
      goalText: 'Über 25 % der Zweitstimmen holen',
      desc: 'Rechtspopulistische Oppositionspartei, besonders stark im Osten. Kein anderer Partner will koalieren.',
      competence: { wirtschaft: 35, migration: 75, soziales: 35, klima: 15, sicherheit: 55, bildung: 25, digitales: 20, wohnen: 25 },
      // Traditionelle Parteilinie je Thema: -1 = links/progressiv, 0 = Mitte, 1 = konservativ/marktliberal
      lean: { wirtschaft: 1, migration: 1, soziales: 0, klima: 1, sicherheit: 1, bildung: 1, digitales: 0, wohnen: 1 }
    },
    {
      id: 'spd', flyerLogo: 'SPD', short: 'SPD', name: 'SPD',
      budget: 20, goal: 20,
      goalText: 'Wieder über 20 % kommen',
      desc: 'Die traditionsreiche Sozialdemokratie. Stark bei Sozialem und Rente.',
      competence: { wirtschaft: 45, migration: 30, soziales: 70, klima: 45, sicherheit: 40, bildung: 50, digitales: 35, wohnen: 55 },
      // Traditionelle Parteilinie je Thema: -1 = links/progressiv, 0 = Mitte, 1 = konservativ/marktliberal
      lean: { wirtschaft: 0, migration: 0, soziales: -1, klima: 0, sicherheit: 0, bildung: -1, digitales: 0, wohnen: 0 }
    },
    {
      id: 'gruene', flyerLogo: 'GRÜNE', short: 'Grüne', name: 'Bündnis 90/Die Grünen',
      budget: 12, goal: 15,
      goalText: 'Über 15 % holen',
      desc: 'Die Ökopartei mit Hochburgen in den Großstädten. Unschlagbar beim Klima.',
      competence: { wirtschaft: 35, migration: 25, soziales: 40, klima: 85, sicherheit: 25, bildung: 50, digitales: 45, wohnen: 40 },
      // Traditionelle Parteilinie je Thema: -1 = links/progressiv, 0 = Mitte, 1 = konservativ/marktliberal
      lean: { wirtschaft: 0, migration: -1, soziales: -1, klima: -1, sicherheit: -1, bildung: -1, digitales: -1, wohnen: 0 }
    },
    {
      id: 'linke', flyerLogo: 'Die Linke', short: 'Linke', name: 'Die Linke',
      budget: 6, goal: 10,
      goalText: 'Zweistellig werden (über 10 %)',
      desc: 'Linke Oppositionspartei mit junger Basis. Stark bei Mieten, Preisen und sozialer Gerechtigkeit.',
      competence: { wirtschaft: 25, migration: 25, soziales: 75, klima: 40, sicherheit: 15, bildung: 40, digitales: 25, wohnen: 75 },
      // Traditionelle Parteilinie je Thema: -1 = links/progressiv, 0 = Mitte, 1 = konservativ/marktliberal
      lean: { wirtschaft: -1, migration: -1, soziales: -1, klima: -1, sicherheit: -1, bildung: -1, digitales: -1, wohnen: -1 }
    },
    {
      id: 'bsw', flyerLogo: 'BSW', short: 'BSW', name: 'Bündnis Sahra Wagenknecht',
      budget: 5, goal: 5,
      goalText: 'Die 5-%-Hürde knacken',
      desc: 'Junge Partei, 2025 knapp an der Hürde gescheitert. Kleines Budget, viel zu gewinnen.',
      competence: { wirtschaft: 35, migration: 55, soziales: 55, klima: 20, sicherheit: 35, bildung: 30, digitales: 20, wohnen: 40 },
      // Traditionelle Parteilinie je Thema: -1 = links/progressiv, 0 = Mitte, 1 = konservativ/marktliberal
      lean: { wirtschaft: -1, migration: 1, soziales: -1, klima: 1, sicherheit: 0, bildung: 0, digitales: 0, wohnen: 0 }
    },
    {
      id: 'fdp', flyerLogo: 'FDP', short: 'FDP', name: 'FDP',
      budget: 8, goal: 5,
      goalText: 'Zurück in den Bundestag (über 5 %)',
      desc: 'Die Liberalen kämpfen um den Wiedereinzug. Stark bei Wirtschaft und Digitalisierung.',
      competence: { wirtschaft: 60, migration: 30, soziales: 20, klima: 25, sicherheit: 30, bildung: 50, digitales: 70, wohnen: 40 },
      // Traditionelle Parteilinie je Thema: -1 = links/progressiv, 0 = Mitte, 1 = konservativ/marktliberal
      lean: { wirtschaft: 1, migration: 0, soziales: 1, klima: 1, sicherheit: -1, bildung: 1, digitales: 1, wohnen: 1 }
    }
  ];

  var OTHER = { id: 'sonstige', short: 'Sonst.', name: 'Sonstige' };

  // Bundesländer mit Wahlberechtigten (Mio., gerundet), Position in der Kachelkarte
  // und Zweitstimmen 2025 (vereinfacht, in Prozent). Rest = Sonstige.
  var STATES = [
    { id: 'SH', name: 'Schleswig-Holstein', voters: 2.2, x: 2, y: 0, east: false,
      result: { union: 29.4, afd: 16.3, spd: 19.0, gruene: 14.2, linke: 7.4, bsw: 3.8, fdp: 4.9 } },
    { id: 'MV', name: 'Mecklenburg-Vorpommern', voters: 1.3, x: 3, y: 0, east: true,
      result: { union: 17.8, afd: 35.0, spd: 12.4, gruene: 5.0, linke: 12.4, bsw: 10.6, fdp: 2.6 } },
    { id: 'HB', name: 'Bremen', voters: 0.46, x: 1, y: 1, east: false,
      result: { union: 20.5, afd: 15.1, spd: 23.6, gruene: 16.5, linke: 15.1, bsw: 4.6, fdp: 3.8 } },
    { id: 'HH', name: 'Hamburg', voters: 1.3, x: 2, y: 1, east: false,
      result: { union: 20.7, afd: 10.9, spd: 22.7, gruene: 19.3, linke: 14.4, bsw: 4.2, fdp: 4.5 } },
    { id: 'BB', name: 'Brandenburg', voters: 2.1, x: 3, y: 1, east: true,
      result: { union: 18.1, afd: 32.5, spd: 14.8, gruene: 6.6, linke: 10.7, bsw: 10.7, fdp: 2.8 } },
    { id: 'BE', name: 'Berlin', voters: 2.4, x: 4, y: 1, east: true,
      result: { union: 18.3, afd: 15.2, spd: 15.1, gruene: 16.8, linke: 19.9, bsw: 6.6, fdp: 3.6 } },
    { id: 'NW', name: 'Nordrhein-Westfalen', voters: 12.8, x: 0, y: 2, east: false,
      result: { union: 30.1, afd: 16.8, spd: 20.0, gruene: 12.0, linke: 7.9, bsw: 4.4, fdp: 4.4 } },
    { id: 'NI', name: 'Niedersachsen', voters: 6.1, x: 1, y: 2, east: false,
      result: { union: 28.1, afd: 18.0, spd: 20.9, gruene: 11.6, linke: 7.4, bsw: 4.4, fdp: 4.3 } },
    { id: 'ST', name: 'Sachsen-Anhalt', voters: 1.7, x: 2, y: 2, east: true,
      result: { union: 19.2, afd: 37.1, spd: 11.0, gruene: 4.6, linke: 11.0, bsw: 11.2, fdp: 2.9 } },
    { id: 'SN', name: 'Sachsen', voters: 3.2, x: 3, y: 2, east: true,
      result: { union: 19.7, afd: 37.3, spd: 8.5, gruene: 6.5, linke: 11.3, bsw: 9.0, fdp: 3.2 } },
    { id: 'RP', name: 'Rheinland-Pfalz', voters: 3.0, x: 0, y: 3, east: false,
      result: { union: 30.6, afd: 20.1, spd: 18.0, gruene: 9.4, linke: 6.2, bsw: 4.4, fdp: 4.9 } },
    { id: 'HE', name: 'Hessen', voters: 4.3, x: 1, y: 3, east: false,
      result: { union: 28.9, afd: 17.8, spd: 17.5, gruene: 12.1, linke: 7.8, bsw: 4.4, fdp: 5.4 } },
    { id: 'TH', name: 'Thüringen', voters: 1.6, x: 2, y: 3, east: true,
      result: { union: 18.6, afd: 38.6, spd: 8.3, gruene: 4.8, linke: 15.2, bsw: 9.4, fdp: 2.6 } },
    { id: 'SL', name: 'Saarland', voters: 0.75, x: 0, y: 4, east: false,
      result: { union: 29.1, afd: 21.6, spd: 22.3, gruene: 5.6, linke: 6.1, bsw: 6.3, fdp: 3.3 } },
    { id: 'BW', name: 'Baden-Württemberg', voters: 7.6, x: 1, y: 4, east: false,
      result: { union: 31.6, afd: 19.8, spd: 14.2, gruene: 13.6, linke: 6.8, bsw: 4.1, fdp: 5.6 } },
    { id: 'BY', name: 'Bayern', voters: 9.4, x: 2, y: 4, east: false,
      result: { union: 37.2, afd: 19.0, spd: 11.6, gruene: 12.0, linke: 5.7, bsw: 3.4, fdp: 4.2 } }
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
    ]
  };

  var PROGRAM_RULES = {
    coreCount: 2,        // Anzahl Kernthemen
    budget: 10,          // Finanzierungsrahmen in Punkten
    slogans: [
      'Zukunft. Jetzt.',
      'Anpacken statt abwarten',
      'Für alle, nicht für wenige',
      'Sicher. Stark. Gerecht.',
      'Mut für Deutschland',
      'Das Land kann mehr'
    ]
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
    PROGRAM_RULES: PROGRAM_RULES
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = data;
  } else {
    root.BTW_DATA = data;
  }
})(this);
