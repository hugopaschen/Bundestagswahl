/*
 * Inhalte der Legislaturperiode: Ministerien, Bundesrat, Landtagswahlen, Wirtschaft, Haushalt,
 * Steuern, Gesetzgebung und Ereignisse. Zahlen mit Quelle; Schätzungen sind als „geschätzt“ markiert.
 */
(function (root) {
  // Zuschnitt der Bundesministerien nach dem Organisationserlass vom 6. Mai 2025 (Kabinett Merz).
  // weight = politisches Gewicht des Ressorts (geschätzt), topics = Themen, für die es federführend ist.
  var MINISTRIES = [
    { id: 'finanzen', short: 'Finanzen', name: 'Bundesministerium der Finanzen', icon: '🏦', weight: 8, topics: ['finanzen', 'wirtschaft'] },
    { id: 'aa', short: 'Auswärtiges', name: 'Auswärtiges Amt', icon: '🌍', weight: 6, topics: ['europa', 'verteidigung'] },
    { id: 'innen', short: 'Inneres', name: 'Bundesministerium des Innern', icon: '🛡️', weight: 6, topics: ['sicherheit', 'migration', 'demokratie'] },
    { id: 'verteidigung', short: 'Verteidigung', name: 'Bundesministerium der Verteidigung', icon: '🪖', weight: 5, topics: ['verteidigung'] },
    { id: 'wirtschaft', short: 'Wirtschaft & Energie', name: 'Bundesministerium für Wirtschaft und Energie', icon: '📈', weight: 5, topics: ['wirtschaft', 'klima'] },
    { id: 'arbeit', short: 'Arbeit & Soziales', name: 'Bundesministerium für Arbeit und Soziales', icon: '🤝', weight: 4, topics: ['soziales'] },
    { id: 'justiz', short: 'Justiz', name: 'Bundesministerium der Justiz und für Verbraucherschutz', icon: '⚖️', weight: 3, topics: ['demokratie'] },
    { id: 'gesundheit', short: 'Gesundheit', name: 'Bundesministerium für Gesundheit', icon: '🏥', weight: 3, topics: ['gesundheit'] },
    { id: 'familie', short: 'Bildung & Familie', name: 'Bundesministerium für Bildung, Familie, Senioren, Frauen und Jugend', icon: '👨‍👩‍👧', weight: 3, topics: ['familie', 'bildung'] },
    { id: 'umwelt', short: 'Umwelt & Klima', name: 'Bundesministerium für Umwelt, Klimaschutz, Naturschutz und nukleare Sicherheit', icon: '🌱', weight: 3, topics: ['klima'] },
    { id: 'verkehr', short: 'Verkehr', name: 'Bundesministerium für Verkehr', icon: '🚆', weight: 3, topics: ['verkehr'] },
    { id: 'digital', short: 'Digitales', name: 'Bundesministerium für Digitales und Staatsmodernisierung', icon: '💻', weight: 2, topics: ['digitales'] },
    { id: 'bau', short: 'Wohnen & Bau', name: 'Bundesministerium für Wohnen, Stadtentwicklung und Bauwesen', icon: '🏠', weight: 2, topics: ['wohnen'] },
    { id: 'landwirtschaft', short: 'Landwirtschaft', name: 'Bundesministerium für Landwirtschaft, Ernährung und Heimat', icon: '🌾', weight: 2, topics: ['land'] },
    { id: 'forschung', short: 'Forschung', name: 'Bundesministerium für Forschung, Technologie und Raumfahrt', icon: '🔬', weight: 2, topics: ['bildung', 'digitales'] },
    { id: 'entwicklung', short: 'Entwicklung', name: 'Bundesministerium für wirtschaftliche Zusammenarbeit und Entwicklung', icon: '🌐', weight: 1, topics: ['europa'] }
  ];
  var KANZLERAMT = { id: 'kanzleramt', short: 'Kanzleramt', name: 'Bundeskanzleramt', icon: '🏛️' };

  // Federführendes Ressort je Thema (für Gesetzentwürfe).
  var TOPIC_MINISTRY = {
    wirtschaft: 'wirtschaft', migration: 'innen', soziales: 'arbeit', klima: 'umwelt', sicherheit: 'innen', bildung: 'familie',
    digitales: 'digital', wohnen: 'bau', verteidigung: 'verteidigung', gesundheit: 'gesundheit', verkehr: 'verkehr', europa: 'aa',
    familie: 'familie', land: 'landwirtschaft', demokratie: 'justiz', finanzen: 'finanzen'
  };

  // Wunschressorts der Parteien in Koalitionsverhandlungen (geschätzt nach früheren Koalitionen
  // und Schwerpunkten: Union 2025 Finanzen abgegeben, aber Inneres/Wirtschaft/Auswärtiges besetzt usw.).
  var WISH = {
    union: ['finanzen', 'innen', 'wirtschaft', 'aa', 'verteidigung'],
    spd: ['finanzen', 'arbeit', 'verteidigung', 'justiz', 'gesundheit'],
    gruene: ['wirtschaft', 'aa', 'umwelt', 'familie', 'landwirtschaft'],
    fdp: ['finanzen', 'justiz', 'digital', 'verkehr', 'forschung'],
    linke: ['arbeit', 'bau', 'gesundheit', 'familie', 'umwelt'],
    bsw: ['aa', 'arbeit', 'wirtschaft', 'gesundheit', 'innen'],
    afd: ['innen', 'finanzen', 'aa', 'verteidigung', 'justiz']
  };

  // Ministerkandidaturen: vier Typen mit unterschiedlichen Stärken.
  var MINISTER_KINDS = [
    { id: 'fach', name: 'Fachpolitiker:in', desc: 'Kennt das Ressort seit Jahren. Kompetent, aber kein Liebling der Basis.', comp: [70, 88], loyal: [50, 68], risk: [3, 8], unity: -1 },
    { id: 'soldat', name: 'Parteisoldat:in', desc: 'Treu, verlässlich, gut vernetzt in der Fraktion. Fachlich solide.', comp: [45, 62], loyal: [82, 96], risk: [4, 9], unity: 3 },
    { id: 'fuerst', name: 'Landesfürst:in', desc: 'Schwergewicht aus einem starken Landesverband. Beruhigt die eigene Region.', comp: [55, 72], loyal: [45, 62], risk: [6, 12], unity: 1, lv: -12 },
    { id: 'quer', name: 'Quereinsteiger:in', desc: 'Kommt aus Wirtschaft, Wissenschaft oder Zivilgesellschaft. Frischer Wind, unberechenbar.', comp: [55, 92], loyal: [35, 58], risk: [8, 16], unity: -2, like: 0.3 }
  ];

  // Stimmen im Bundesrat nach Art. 51 Abs. 2 GG (Stand 2025, zusammen 69).
  // Landesregierungen Stand Januar 2026 (bundesrat.de); erste Partei stellt die Regierungschefin/den Regierungschef.
  // Vereinfachung: Zu Beginn jeder Legislaturperiode im Spiel gelten diese Regierungen, bis im Land gewählt wird.
  var LAENDER = {
    BW: { votes: 6, gov: ['gruene', 'union'] },
    BY: { votes: 6, gov: ['union', 'fw'] },
    BE: { votes: 4, gov: ['union', 'spd'] },
    BB: { votes: 4, gov: ['spd', 'bsw'] },
    HB: { votes: 3, gov: ['spd', 'gruene', 'linke'] },
    HH: { votes: 3, gov: ['spd', 'gruene'] },
    HE: { votes: 5, gov: ['union', 'spd'] },
    MV: { votes: 3, gov: ['spd', 'linke'] },
    NI: { votes: 6, gov: ['spd', 'gruene'] },
    NW: { votes: 6, gov: ['union', 'gruene'] },
    RP: { votes: 4, gov: ['spd', 'gruene', 'fdp'] },
    SL: { votes: 3, gov: ['spd'] },
    SN: { votes: 4, gov: ['union', 'spd'] },
    ST: { votes: 4, gov: ['union', 'spd', 'fdp'] },
    SH: { votes: 4, gov: ['union', 'gruene'] },
    TH: { votes: 4, gov: ['union', 'bsw', 'spd'] }
  };
  var BUNDESRAT_MAJ = 35;

  // Wahltermine: letzte Landtagswahl (Jahr, Monat) und Wahlperiode in Jahren (Landesverfassungen;
  // Bremen 4 Jahre, sonst 5). Danach werden die Termine fortgeschrieben.
  var LTW = {
    BW: [2026, 3, 5], RP: [2026, 3, 5], ST: [2026, 9, 5], MV: [2026, 9, 5], BE: [2026, 9, 5],
    SL: [2027, 3, 5], SH: [2027, 5, 5], NW: [2027, 5, 5], HB: [2027, 5, 4], NI: [2027, 10, 5],
    BY: [2028, 10, 5], HE: [2028, 10, 5], SN: [2029, 9, 5], TH: [2029, 9, 5], BB: [2029, 9, 5], HH: [2030, 3, 5]
  };
  var EUROPAWAHL = [2029, 6, 5];       // Europawahl alle 5 Jahre, keine Sperrklausel in Deutschland
  var BUNDESVERSAMMLUNG = [2027, 2, 5]; // Wahl des Bundespräsidenten alle 5 Jahre
  // Amtsbonus der Partei der Regierungschefin/des Regierungschefs bei Landtagswahlen und Freie Wähler
  // in Bayern (LTW 2023: 15,8 % gegenüber 4,3 % bei der BTW 2025) – geschätzt.
  var LTW_BONUS = { incumbent: 4, fw: { BY: 10, RP: 2 } };

  // Wirtschaft zum Spielstart (geschätzt: BIP 2026 nominal ~4.600 Mrd. €, Arbeitslosenquote ~6,3 %,
  // Inflation ~2 %, Schuldenquote ~64 %). gap = Produktionslücke in % des BIP (schwache Konjunktur).
  var ECON0 = { growth: 1.0, unemp: 6.3, infl: 2.0, debt: 64, gdp: 4600, trend: 1.0, gap: -0.6 };

  // Bundeshaushalt nach dem Haushaltsgesetz 2026 (vom Bundestag am 28.11.2025 beschlossen; Ausgaben
  // 524,54 Mrd. €, Nettokreditaufnahme 97,965 Mrd. €, davon schuldenregelrelevant 40,392 Mrd. €).
  // Quelle: Bericht des Haushaltsausschusses, BT-Drucksache 21/2063; Einzelpläne gerundet, teils Stand
  // Regierungsentwurf (in der Bereinigungssitzung nur wenig verändert). Wirkung je 10 Mrd. € mehr pro Jahr geschätzt.
  // drift = jährlicher Anstieg über das Wirtschaftswachstum hinaus in % (Demografie, Refinanzierung zu höheren Zinsen; geschätzt).
  var AREAS = [
    { id: 'sozial', name: 'Arbeit & Soziales (inkl. Rentenzuschuss, Epl. 11)', icon: '🤝', base: 197.4, topic: 'soziales', groups: { rentner: 0.4, arbeitslos: 0.6, arbeiter: 0.2 }, growth: 0.01, drift: 1.5 },
    { id: 'verteidigung', name: 'Verteidigung (Epl. 14)', icon: '🪖', base: 82.7, topic: 'verteidigung', intl: 2, growth: 0.02 },
    { id: 'verkehr', name: 'Verkehr (Epl. 12, ohne Sondervermögen)', icon: '🚆', base: 28.2, topic: 'verkehr', groups: { land: 0.2 }, growth: 0.06 },
    { id: 'gesundheit', name: 'Gesundheit & Pflege (Epl. 15)', icon: '🏥', base: 21.8, topic: 'gesundheit', groups: { aelter: 0.3 }, growth: 0.01, drift: 1 },
    { id: 'familie', name: 'Bildung & Familie (Epl. 17)', icon: '👨‍👩‍👧', base: 14.7, topic: 'familie', groups: { frauen: 0.3, jung: 0.2 }, growth: 0.04 },
    { id: 'innen', name: 'Innere Sicherheit (Epl. 06)', icon: '🛡️', base: 16.0, topic: 'sicherheit', groups: { aelter: 0.2 }, growth: 0 },
    { id: 'forschung', name: 'Forschung & Digitales (Epl. 30, 24)', icon: '🔬', base: 22.7, topic: 'digitales', groups: { hoch: 0.3 }, growth: 0.07 },
    { id: 'wirtschaft', name: 'Wirtschaft, Energie & Umwelt (Epl. 09, 16)', icon: '📈', base: 10.8, topic: 'klima', groups: { selbst: 0.2 }, growth: 0.05 },
    { id: 'entwicklung', name: 'Entwicklung & Auswärtiges (Epl. 23, 05)', icon: '🌐', base: 16.0, topic: 'europa', intl: 2, growth: 0 },
    { id: 'wohnen', name: 'Wohnen & Bau (Epl. 25)', icon: '🏠', base: 7.6, topic: 'wohnen', groups: { stadt: 0.3, jung: 0.2 }, growth: 0.04 },
    { id: 'landwirtschaft', name: 'Landwirtschaft (Epl. 10)', icon: '🌾', base: 7.0, topic: 'land', groups: { land: 0.3 }, growth: 0.01 },
    { id: 'zinsen', name: 'Zinsen (Bundesschuld, Epl. 32)', icon: '💶', base: 33.6, fixed: true, drift: 4 },
    { id: 'sonstiges', name: 'Allgemeine Finanzverwaltung, Kanzleramt, Verfassungsorgane u. a.', icon: '🗂️', base: 66.0, fixed: true }
  ];
  // Einnahmen ohne Kredite 2026: Steuern 387,21 Mrd. € plus sonstige Einnahmen (zusammen 426,6 Mrd. €).
  var REVENUE0 = 426.6;
  // Schuldenbremse (Art. 115 GG): 0,35 % des BIP strukturell, Konjunkturkomponente (Budgetsemielastizität ~0,5
  // mal Produktionslücke) und finanzielle Transaktionen (~0,25 % des BIP, geschätzt). Seit März 2025 sind
  // Verteidigung, Zivil- und Bevölkerungsschutz, Nachrichtendienste und Ukraine-Hilfe über 1 % des BIP ausgenommen;
  // außerhalb von Epl. 14 rund 20 Mrd. € (geschätzt aus 97,965 − 40,392 Mrd. € ausgenommener Kreditaufnahme 2026).
  // Sondervermögen Infrastruktur und Klimaneutralität: 500 Mrd. € über 12 Jahre (≈ 42 Mrd. € pro Jahr, außerhalb).
  var DEBT_RULE = { structural: 0.35, cyc: 0.5, trans: 0.25, defenseFree: 1.0, defenseOther: 20, sv: 42 };
  var BUDGET_STEPS = [-10, -5, 0, 5, 10]; // Änderung je Bereich in Prozent

  // Wie die Parteien zu den Haushaltsbereichen stehen (+1 mehr Geld, −1 eher kürzen) – geschätzt nach Wahlprogrammen 2025.
  var AREA_PREF = {
    union: { verteidigung: 1, innen: 1, wirtschaft: 1, sozial: -1, entwicklung: -1 },
    spd: { sozial: 1, wohnen: 1, verkehr: 1, gesundheit: 1 },
    gruene: { wirtschaft: 1, verkehr: 1, entwicklung: 1, forschung: 1, familie: 1 },
    fdp: { forschung: 1, verteidigung: 1, sozial: -1, entwicklung: -1, wohnen: -1 },
    linke: { sozial: 1, wohnen: 1, gesundheit: 1, verteidigung: -1 },
    bsw: { sozial: 1, gesundheit: 1, verteidigung: -1, entwicklung: -1 },
    afd: { verteidigung: 1, innen: 1, entwicklung: -1, wirtschaft: -1 }
  };

  // Steuern: Stufen mit Mehr-/Mindereinnahmen für den Bund in Mrd. € je Jahr (geschätzt nach
  // Aufkommen 2024 und Bundesanteil), Wirkung auf Wachstum/Inflation und Lager (−1 links … +1 rechts).
  // zust = zustimmungspflichtig im Bundesrat (Gemeinschaftssteuern, Art. 105 Abs. 3 GG).
  var TAXES = [
    { id: 'spitzen', name: 'Spitzensteuersatz', icon: '💼', zust: true, start: 1,
      levels: [{ label: '39 %', rev: -5, growth: 0.05, lean: 1 }, { label: '42 % (heute)', rev: 0, lean: 0 }, { label: '45 %', rev: 5, growth: -0.03, lean: -1 }, { label: '48 %', rev: 10, growth: -0.07, lean: -1 }],
      groups: { hoch: -1, selbst: -1, niedrig: 0.5, arbeiter: 0.5 } },
    { id: 'entlastung', name: 'Entlastung kleiner und mittlerer Einkommen', icon: '👷', zust: true, start: 0,
      levels: [{ label: 'keine', rev: 0, lean: 0 }, { label: 'Grundfreibetrag +1.000 €', rev: -6, growth: 0.04, lean: 0 }, { label: 'Tarifreform „Mittelstandsbauch“', rev: -14, growth: 0.08, infl: 0.1, lean: 0 }],
      groups: { mittel: 1, angest: 1, arbeiter: 1 } },
    { id: 'mwst', name: 'Mehrwertsteuer', icon: '🛒', zust: true, start: 1,
      levels: [{ label: '17 %', rev: -17, growth: 0.1, infl: -0.6, lean: -1 }, { label: '19 % (heute)', rev: 0, lean: 0 }, { label: '21 %', rev: 17, growth: -0.12, infl: 0.8, lean: 1 }],
      groups: { niedrig: -1, rentner: -1, arbeitslos: -1 } },
    { id: 'koerp', name: 'Körperschaftsteuer', icon: '🏭', zust: true, start: 1,
      levels: [{ label: '10 % (Plan bis 2032)', rev: -7, growth: 0.1, lean: 1 }, { label: '15 % (heute)', rev: 0, lean: 0 }, { label: '20 %', rev: 7, growth: -0.1, lean: -1 }],
      groups: { selbst: -1 } },
    { id: 'soli', name: 'Solidaritätszuschlag', icon: '🧾', zust: false, start: 1,
      levels: [{ label: 'abgeschafft', rev: -13, growth: 0.05, lean: 1 }, { label: 'für Spitzenverdiener und Firmen (heute)', rev: 0, lean: 0 }],
      groups: { hoch: -1, selbst: -1 } },
    { id: 'vermoegen', name: 'Vermögen und Erbschaften', icon: '💎', zust: true, start: 0,
      levels: [{ label: 'wie heute', rev: 0, lean: 0 }, { label: 'Ausnahmen bei der Erbschaftsteuer streichen', rev: 4, growth: -0.02, lean: -1 }, { label: 'zusätzlich Vermögensteuer ab 2 Mio. €', rev: 12, growth: -0.06, lean: -1 }],
      groups: { selbst: -1, hoch: -0.5, niedrig: 0.5, arbeitslos: 0.5 } },
    { id: 'co2', name: 'CO₂-Preis (Gebäude und Verkehr)', icon: '🏭', zust: false, start: 1,
      levels: [{ label: 'eingefroren', rev: -6, infl: -0.2, lean: 1 }, { label: 'europäischer Emissionshandel (heute)', rev: 0, lean: 0 }, { label: 'höher, mit Klimageld zurück', rev: 0, infl: 0.2, lean: -1, climate: 1 }],
      groups: { land: -1, jung: 0.5, stadt: 0.3 } },
    { id: 'strom', name: 'Stromsteuer', icon: '⚡', zust: false, start: 1,
      levels: [{ label: 'EU-Minimum für alle', rev: -5, growth: 0.03, infl: -0.15, lean: 0 }, { label: 'nur für Industrie gesenkt (heute)', rev: 0, lean: 0 }],
      groups: { rentner: 0.5, niedrig: 0.5 } }
  ];

  // Gesetzgebung: Wirkung, wenn eine Programmposition Gesetz wird (geschätzt).
  // cost = Mrd. € pro Jahr je Kostenstufe der Programmposition (PROGRAM[t][i].cost).
  var LAW_COST = 6;
  // Zustimmungspflichtige Themen (Länder führen aus oder Gemeinschaftssteuern betroffen).
  var ZUST_TOPICS = ['finanzen', 'bildung', 'wohnen', 'gesundheit', 'verkehr', 'sicherheit', 'migration'];
  // Wirtschaftliche Wirkung einer Programmposition nach Lager (−1/0/1), Wachstum in Prozentpunkten (geschätzt).
  var TOPIC_ECON = {
    wirtschaft: { '-1': { growth: 0.1, unemp: -0.1 }, '0': { growth: 0.1 }, '1': { growth: 0.15, unemp: -0.1 } },
    soziales: { '-1': { unemp: 0.05, growth: 0.02 }, '1': { unemp: -0.1, growth: 0.05 } },
    klima: { '-1': { growth: -0.05, infl: 0.15 }, '1': { growth: 0.05, infl: -0.1 } },
    digitales: { '-1': { growth: 0.05 }, '0': { growth: 0.08 }, '1': { growth: 0.1 } },
    verkehr: { '-1': { growth: 0.05 }, '0': { growth: 0.06 }, '1': { growth: 0.04 } },
    bildung: { '-1': { growth: 0.04 }, '0': { growth: 0.04 }, '1': { growth: 0.02 } },
    wohnen: { '-1': { growth: -0.03, infl: -0.1 }, '1': { growth: 0.06 } },
    migration: { '-1': { unemp: 0.05, growth: 0.03 }, '1': { growth: -0.04, unemp: -0.03 } },
    finanzen: { '-1': { growth: -0.05 }, '1': { growth: 0.08, infl: 0.05 } },
    europa: { '-1': { growth: 0.03 }, '1': { growth: -0.08 } }
  };
  // Status quo zu Beginn: vereinfacht die Mitte (Lager 0) – außer bei der Migration, wo die
  // Koalition 2025 Zurückweisungen an den Grenzen eingeführt hat (dennoch Mitte, Lager 0).
  var POLICY0 = 0;

  var ROLES = {
    kanzler: { name: 'Kanzlerschaft', icon: '🏛️', ap: 4, desc: 'Ihr führt die Bundesregierung. Ihr setzt die Richtlinien der Politik (Art. 65 GG) – und haftet für alles.' },
    junior: { name: 'Juniorpartner', icon: '🤝', ap: 4, desc: 'Ihr regiert mit, besetzt Ministerien und müsst euer Profil gegen den großen Partner schärfen.' },
    opposition: { name: 'Opposition', icon: '🪑', ap: 4, desc: 'Ihr kontrolliert die Regierung: Anfragen, Anträge, Untersuchungsausschüsse und Klagen in Karlsruhe.' },
    apo: { name: 'Außerparlamentarische Opposition', icon: '📣', ap: 3, desc: 'Ohne Sitze im Bundestag kämpft ihr auf der Straße, im Netz und in den Ländern um den Wiedereinzug.' }
  };

  // Parteienfinanzierung (PartG § 18): rund 1 € je Stimme und Jahr; Mitgliedsbeitrag im Schnitt ~80 € (geschätzt).
  var FINANCE = { perVote: 1.0, perMember: 80 };

  /*
   * Ereignisse. roles: gov (Kanzler oder Juniorpartner), kanzler, junior, opp (Opposition im Bundestag), apo.
   * parties: nur für diese Spielerparteien. land: mögliche Länder ({land}). minQ: frühestens ab Quartal.
   * fx-Schlüssel: own (Umfrage eigene Partei), gov (Regierungsparteien), chanc (Kanzlerpartei), unity, lv (Unruhe
   * im Landesverband {land}), mood (Koalitionsklima), growth/unemp/infl (Wirtschaft, einmalig), intl (Ansehen),
   * like (Beliebtheit der Spitze), sal {Thema: Δ}, members (%), cash (Mio. €), budget (Mrd. € einmalig),
   * def (Verteidigungsausgaben Mrd. €/Jahr), comp {Thema: Δ}, fw (Brandmauer-Stufe der eigenen Partei).
   * chance: Erfolgswahrscheinlichkeit; dann gilt fx bei Erfolg, fail bei Misserfolg.
   */
  var EVENTS = [
    // ---------- Internationale Krisen ----------
    { id: 'ukraine_offensive', cat: 'intl', roles: ['gov'], w: 3, title: 'Neue russische Offensive', text: 'Russland startet eine Großoffensive in der Ostukraine. Kiew bittet dringend um Luftverteidigung und Munition. Washington zögert.',
      choices: [
        { label: 'Zusätzliche Patriot-Systeme liefern', hint: 'Ansehen in Europa steigt, teuer', fx: { intl: 8, budget: 4, def: 2, sal: { verteidigung: 0.02 }, gov: 0.2 } },
        { label: 'Europäische Initiative anführen', hint: 'Gemeinsam mit Paris und Warschau', fx: { intl: 10, budget: 2, like: 0.2, sal: { europa: 0.015 } }, chance: 0.65, fail: { intl: 2, like: -0.2 }, okText: 'Die EU zieht mit – ein Erfolg für Berlin.', failText: 'Ungarn blockiert, die Initiative versandet.' },
        { label: 'Zurückhaltung, Verhandlungen fordern', hint: 'Im Osten populär, in Europa Kritik', fx: { intl: -10, gov: -0.1, sal: { verteidigung: 0.01 }, own: 0.2 } }
      ] },
    { id: 'ukraine_ceasefire', cat: 'intl', roles: ['gov'], w: 2, minQ: 3, title: 'Waffenstillstand in der Ukraine?', text: 'Unter Vermittlung der Türkei liegt ein Waffenstillstandsabkommen auf dem Tisch. Europa soll die Sicherheitsgarantien stellen – auch mit Bundeswehr-Soldaten.',
      choices: [
        { label: 'Bundeswehr für eine Friedenstruppe anbieten', hint: 'Braucht ein Mandat im Bundestag', fx: { intl: 12, def: 3, sal: { verteidigung: 0.03 }, mood: -4 }, mandate: true },
        { label: 'Nur Ausbildung und Geld, keine Soldaten', hint: 'Sicher, aber Partner sind enttäuscht', fx: { intl: -2, budget: 3 } },
        { label: 'Wiederaufbaukonferenz in Berlin ausrichten', hint: 'Chance für die Wirtschaft', fx: { intl: 6, growth: 0.05, like: 0.2 } }
      ] },
    { id: 'us_tariffs', cat: 'intl', roles: ['gov'], w: 3, title: 'US-Strafzölle auf Autos', text: 'Washington verhängt 25 % Zölle auf europäische Autos und Maschinen. Die deutsche Exportindustrie schlägt Alarm.',
      choices: [
        { label: 'Hart bleiben: EU-Gegenzölle', hint: 'Risiko Handelskrieg', fx: { growth: -0.15, intl: 3, gov: 0.1 }, chance: 0.5, fail: { growth: -0.35, unemp: 0.15 }, okText: 'Washington lenkt nach Wochen ein.', failText: 'Der Handelskrieg eskaliert – die Konjunktur bricht ein.' },
        { label: 'Deal: mehr US-Flüssiggas und Waffen kaufen', hint: 'Schadensbegrenzung', fx: { growth: -0.05, intl: -2, budget: 3, def: 1 } },
        { label: 'Hilfspaket für die Industrie', hint: 'Teuer, sichert Jobs', fx: { growth: -0.08, budget: 8, unemp: -0.05, gov: 0.1 } }
      ] },
    { id: 'taiwan', cat: 'intl', roles: ['gov', 'opp'], w: 1.5, minQ: 4, title: 'Krise um Taiwan', text: 'China hält Manöver rund um Taiwan ab und droht mit einer Seeblockade. Deutsche Unternehmen fürchten um ihre Lieferketten und ihr China-Geschäft.',
      gov: [
        { label: 'Klare Solidarität mit Taiwan', hint: 'Peking droht mit Sanktionen', fx: { intl: 6, growth: -0.12, sal: { wirtschaft: 0.02 } } },
        { label: 'Diplomatisch vermitteln, De-Risking beschleunigen', hint: 'Lieferketten diversifizieren', fx: { intl: 3, growth: -0.04, budget: 2 } },
        { label: 'Wirtschaftsbeziehungen nicht gefährden', hint: 'Kritik aus Washington', fx: { intl: -8, growth: 0.02 } }
      ],
      choices: [
        { label: 'Regierung zu klarer Haltung drängen', hint: 'Profil in der Außenpolitik', fx: { own: 0.2, comp: { verteidigung: 2 } } },
        { label: 'Vor Eskalation warnen', hint: 'Friedenspolitisches Profil', fx: { own: 0.1, sal: { wirtschaft: 0.01 } } }
      ] },
    { id: 'nato_target', cat: 'intl', roles: ['gov'], w: 2, title: 'NATO-Gipfel: Druck beim Verteidigungsziel', text: 'Die Alliierten haben 2025 in Den Haag 3,5 % des BIP für die Kernverteidigung bis 2035 vereinbart. Washington verlangt, dass Deutschland schneller liefert.',
      choices: [
        { label: 'Aufwuchs beschleunigen (+10 Mrd. €/Jahr)', hint: 'Ausgenommen von der Schuldenbremse', fx: { def: 10, intl: 8, mood: -3, sal: { verteidigung: 0.02 } } },
        { label: 'Am Pfad festhalten', hint: 'Keine Mehrkosten', fx: { intl: -3 } },
        { label: 'Europäische Beschaffung vorschlagen', hint: 'Spart langfristig, braucht Partner', fx: { intl: 4, def: 3 }, chance: 0.6, fail: { intl: -2 }, okText: 'Frankreich und Polen machen mit.', failText: 'Die Partner bleiben skeptisch.' }
      ] },
    { id: 'middle_east', cat: 'intl', roles: ['gov', 'opp'], w: 2, title: 'Eskalation im Nahen Osten', text: 'Nach Angriffen auf Schiffe im Roten Meer steigen Öl- und Frachtpreise. Die EU berät über einen erweiterten Marineeinsatz.',
      gov: [
        { label: 'Fregatte entsenden (Mandat nötig)', hint: 'Sichert Handelswege', fx: { intl: 5, def: 1, infl: 0.1, sal: { verteidigung: 0.015 } }, mandate: true },
        { label: 'Diplomatie und humanitäre Hilfe', hint: 'Kosten 1 Mrd. €', fx: { intl: 3, budget: 1, infl: 0.2 } }
      ],
      choices: [
        { label: 'Einsatz mittragen', hint: 'Staatspolitische Verantwortung', fx: { own: 0.1, unity: -2 } },
        { label: 'Einsatz ablehnen', hint: 'Klare Kante', fx: { own: 0.15, unity: 1 } }
      ] },
    { id: 'refugees', cat: 'intl', roles: ['gov'], w: 2.5, title: 'Neue Fluchtbewegung', text: 'Nach einem Bürgerkrieg im Nahen Osten machen sich Hunderttausende auf den Weg nach Europa. Kommunen melden: Wir sind am Limit.',
      choices: [
        { label: 'Grenzkontrollen verschärfen', hint: 'Streit mit Nachbarländern', fx: { intl: -5, gov: 0.1, sal: { migration: 0.04 }, mood: -3 } },
        { label: 'EU-Verteilung durchsetzen', hint: 'Mühsame Verhandlungen', fx: { intl: 5, sal: { migration: 0.03 } }, chance: 0.45, fail: { gov: -0.3, sal: { migration: 0.02 } }, okText: 'Die EU einigt sich auf einen Verteilschlüssel.', failText: 'Die Verhandlungen scheitern, die Kommunen sind wütend.' },
        { label: 'Kommunen mit 3 Mrd. € unterstützen', hint: 'Entlastung vor Ort', fx: { budget: 3, sal: { migration: 0.03 }, gov: 0.05 } }
      ] },
    { id: 'gas_crisis', cat: 'intl', roles: ['gov'], w: 1.5, title: 'Energiepreise explodieren', text: 'Ein Anschlag auf eine Pipeline in der Nordsee und ein kalter Winter treiben die Gaspreise auf Rekordniveau.',
      choices: [
        { label: 'Preisbremse für Haushalte', hint: 'Teuer, aber spürbar', fx: { budget: 12, infl: -0.3, gov: 0.3 } },
        { label: 'Gezielte Hilfen für Geringverdiener', hint: 'Günstiger', fx: { budget: 4, infl: 0.3, gov: 0.1 } },
        { label: 'Markt wirken lassen', hint: 'Spart Geld, sorgt für Ärger', fx: { infl: 0.7, gov: -0.4, growth: -0.1 } }
      ] },
    { id: 'cyber', cat: 'intl', roles: ['gov', 'opp'], w: 1.5, title: 'Cyberangriff auf Krankenhäuser', text: 'Hacker legen die IT von 40 Kliniken lahm. Spuren führen zu einer staatsnahen Gruppe aus Russland.',
      gov: [
        { label: 'Cyberabwehr massiv ausbauen', hint: '2 Mrd. €, Kompetenz Digitales', fx: { budget: 2, comp: { digitales: 3 }, sal: { digitales: 0.02, sicherheit: 0.01 } } },
        { label: 'Diplomaten ausweisen, Sanktionen', hint: 'Starkes Signal', fx: { intl: 3, like: 0.1 } }
      ],
      choices: [
        { label: 'Regierung Versäumnisse vorwerfen', hint: 'Die Digitalisierung hinkt', fx: { own: 0.2, gov: -0.1 } },
        { label: 'Überparteiliche Zusammenarbeit anbieten', hint: 'Staatsmännisch', fx: { own: 0.1, like: 0.1 } }
      ] },
    { id: 'eu_budget', cat: 'intl', roles: ['gov'], w: 1.5, title: 'Streit um den EU-Haushalt', text: 'Die Kommission will gemeinsame Schulden für Verteidigung und Klimaschutz aufnehmen. Deutschland müsste mithaften.',
      choices: [
        { label: 'Zustimmen – Europa stärken', hint: 'Kritik von rechts', fx: { intl: 8, sal: { europa: 0.02 }, mood: -2 } },
        { label: 'Ablehnen – keine Schuldenunion', hint: 'Isolation in Brüssel', fx: { intl: -8, sal: { finanzen: 0.01 } } },
        { label: 'Kompromiss: zweckgebunden und befristet', hint: 'Zähe Verhandlungen', fx: { intl: 3 } }
      ] },
    { id: 'us_troops', cat: 'intl', roles: ['gov'], w: 1, minQ: 5, title: 'USA ziehen Truppen ab', text: 'Washington kündigt an, 15.000 Soldaten aus Deutschland abzuziehen. Ramstein bleibt, aber die Lücke ist groß.',
      choices: [
        { label: 'Wehrpflicht-Debatte anstoßen', hint: 'Polarisiert', fx: { sal: { verteidigung: 0.03 }, mood: -4, def: 4 } },
        { label: 'Europäische Säule der NATO vorantreiben', hint: 'Mit Frankreich und Polen', fx: { intl: 6, def: 5 } },
        { label: 'Um Verbleib werben', hint: 'Bittsteller in Washington', fx: { intl: -2, like: -0.1 } }
      ] },
    { id: 'climate_summit', cat: 'intl', roles: ['gov'], w: 1, title: 'Weltklimakonferenz', text: 'Auf der Klimakonferenz fordern Inselstaaten mehr Geld von den Industriestaaten.',
      choices: [
        { label: 'Klimafinanzierung erhöhen', hint: '+2 Mrd. €/Jahr', fx: { intl: 6, budget: 2, sal: { klima: 0.02 } } },
        { label: 'Zusagen halten, nicht erhöhen', hint: 'Unauffällig', fx: { intl: 0 } }
      ] },

    // ---------- Wirtschaft und Inland ----------
    { id: 'industry_jobs', cat: 'wirtschaft', roles: ['gov'], w: 2.5, title: 'Werksschließungen in der Autoindustrie', text: 'Ein großer Autozulieferer kündigt an, drei Werke zu schließen – 12.000 Arbeitsplätze in Niedersachsen, Sachsen und dem Saarland.',
      choices: [
        { label: 'Staatshilfe gegen Jobgarantie', hint: '2 Mrd. €', fx: { budget: 2, unemp: -0.05, gov: 0.15 } },
        { label: 'Transformationsfonds für die Regionen', hint: 'Langfristig klug', fx: { budget: 1, growth: 0.03 } },
        { label: 'Keine Subventionen für Einzelfirmen', hint: 'Ordnungspolitisch sauber, Wut vor Ort', fx: { unemp: 0.08, gov: -0.2 } }
      ] },
    { id: 'rail_chaos', cat: 'inland', roles: ['gov', 'opp'], w: 2, title: 'Bahnchaos und Brückensperrungen', text: 'Eine Autobahnbrücke im Ruhrgebiet wird gesperrt, gleichzeitig fallen tausende Züge aus. Die Wut der Pendler ist riesig.',
      gov: [
        { label: 'Sanierungsoffensive aus dem Sondervermögen', hint: 'Schneller planen und bauen', fx: { growth: 0.03, sal: { verkehr: 0.03 }, gov: 0.05 } },
        { label: 'Bahnvorstand austauschen', hint: 'Symbolpolitik', fx: { like: 0.15 } }
      ],
      choices: [
        { label: 'Verkehrsminister angreifen', hint: 'Rücktrittsforderung', fx: { own: 0.25, gov: -0.15, sal: { verkehr: 0.02 } } },
        { label: 'Eigenes Infrastrukturkonzept vorlegen', hint: 'Kompetenz zeigen', fx: { own: 0.15, comp: { verkehr: 3 } } }
      ] },
    { id: 'pension_gap', cat: 'inland', roles: ['gov'], w: 2, minQ: 2, title: 'Rentenkasse unter Druck', text: 'Die Rentenversicherung meldet: Ohne Reform steigen die Beiträge 2031 auf über 20 %. Die Babyboomer gehen in Rente.',
      choices: [
        { label: 'Rentenniveau sichern, Zuschuss erhöhen', hint: '+8 Mrd. €/Jahr aus dem Haushalt', fx: { budget: 8, gov: 0.2, sal: { soziales: 0.03 } } },
        { label: 'Renteneintritt an Lebenserwartung koppeln', hint: 'Sehr unpopulär', fx: { gov: -0.5, growth: 0.05, mood: -5, sal: { soziales: 0.04 } } },
        { label: 'Rentenkommission einsetzen', hint: 'Zeit gewinnen', fx: { sal: { soziales: 0.01 } } }
      ] },
    { id: 'hospital_reform', cat: 'inland', roles: ['gov'], w: 1.5, title: 'Klinikschließungen auf dem Land', text: 'Durch die Krankenhausreform schließen kleine Häuser. In ländlichen Regionen gehen Tausende auf die Straße.',
      choices: [
        { label: 'Übergangsfonds für Landkliniken', hint: '2 Mrd. €', fx: { budget: 2, gov: 0.1 } },
        { label: 'Reform konsequent durchziehen', hint: 'Spart langfristig', fx: { gov: -0.2, budget: -1 } }
      ] },
    { id: 'housing_crisis', cat: 'inland', roles: ['gov', 'opp', 'apo'], w: 2, title: 'Mieten auf Rekordhoch', text: 'In Großstädten steigen die Angebotsmieten um 9 % in einem Jahr. Der Wohnungsbau stockt.',
      gov: [
        { label: 'Bauoffensive: 2 Mrd. € für sozialen Wohnungsbau', hint: 'Wirkt erst später', fx: { budget: 2, sal: { wohnen: 0.02 }, gov: 0.1 } },
        { label: 'Mietpreisbremse verschärfen', hint: 'Vermieterverbände protestieren', fx: { gov: 0.15, growth: -0.02, mood: -2 } }
      ],
      choices: [
        { label: 'Kampagne „Mieten runter“', hint: 'Mobilisiert in Städten', fx: { own: 0.25, sal: { wohnen: 0.03 }, members: 1 } },
        { label: 'Bündnis mit dem Mieterbund', hint: 'Glaubwürdigkeit', fx: { own: 0.15, comp: { wohnen: 3 } } }
      ] },
    { id: 'flood', cat: 'inland', roles: ['gov', 'opp', 'apo'], w: 1.5, title: 'Jahrhunderthochwasser', text: 'Starkregen setzt ganze Täler in Bayern und Sachsen unter Wasser. Es gibt Tote, die Schäden gehen in die Milliarden.',
      gov: [
        { label: 'Sofort ins Krisengebiet, Fluthilfe 5 Mrd. €', hint: 'Krisenmanagement zählt', fx: { budget: 5, like: 0.4, gov: 0.3, sal: { klima: 0.03 } } },
        { label: 'Hilfe zusagen, aber in Berlin bleiben', hint: 'Bilder fehlen', fx: { budget: 5, like: -0.2 } }
      ],
      choices: [
        { label: 'Helfer schicken, nicht politisieren', hint: 'Anständig', fx: { own: 0.1, like: 0.2 } },
        { label: 'Versäumnisse beim Klimaschutz anprangern', hint: 'Riskant', fx: { own: 0.1, sal: { klima: 0.03 } }, chance: 0.5, fail: { own: -0.3 }, okText: 'Die Debatte kommt an.', failText: 'Euch wird vorgeworfen, das Leid zu instrumentalisieren.' }
      ] },
    { id: 'attack', cat: 'inland', roles: ['gov', 'opp', 'apo'], w: 1.5, title: 'Anschlag auf einen Weihnachtsmarkt', text: 'Ein Attentäter fährt in einen Weihnachtsmarkt. Es gibt Tote und Verletzte. Das Land steht unter Schock, die Debatte über innere Sicherheit und Migration kocht hoch.',
      gov: [
        { label: 'Sicherheitspaket: mehr Befugnisse für Behörden', hint: 'Streit um Bürgerrechte', fx: { sal: { sicherheit: 0.05, migration: 0.03 }, mood: -3, gov: 0.1 } },
        { label: 'Besonnen bleiben, Aufklärung abwarten', hint: 'Kritik: zu weich', fx: { sal: { sicherheit: 0.04 }, gov: -0.15, like: 0.1 } }
      ],
      choices: [
        { label: 'Schärfere Gesetze fordern', hint: 'Rückenwind von rechts', fx: { own: 0.2, sal: { sicherheit: 0.04 } } },
        { label: 'Vor Spaltung warnen', hint: 'Zusammenhalt', fx: { own: 0.05, like: 0.15, sal: { sicherheit: 0.03 } } }
      ] },
    { id: 'recession', cat: 'wirtschaft', roles: ['gov'], w: 1.5, minQ: 2, title: 'Rezessionswarnung', text: 'Die Wirtschaftsforschungsinstitute senken ihre Prognose: Deutschland droht ein drittes Rezessionsjahr innerhalb von sechs Jahren.',
      choices: [
        { label: 'Konjunkturpaket (15 Mrd. €)', hint: 'Schulden steigen', fx: { budget: 15, growth: 0.3, unemp: -0.1 } },
        { label: 'Bürokratieabbau-Gesetz', hint: 'Billig, wirkt langsam', fx: { growth: 0.08, comp: { wirtschaft: 2 } } },
        { label: 'Sparkurs halten', hint: 'Solide, aber riskant', fx: { growth: -0.1, unemp: 0.05 } }
      ] },
    { id: 'strike', cat: 'wirtschaft', roles: ['gov', 'opp'], w: 1.5, title: 'Großstreik bei Bahn und Flughäfen', text: 'Verdi und die GDL legen das Land eine Woche lahm. Die Wirtschaft fordert ein Streikrecht mit Grenzen.',
      gov: [
        { label: 'Schlichtung anbieten', hint: 'Vermitteln', fx: { like: 0.1 }, chance: 0.6, fail: { growth: -0.05 }, okText: 'Die Schlichtung gelingt.', failText: 'Die Schlichtung scheitert, der Streik geht weiter.' },
        { label: 'Gesetz zur kritischen Infrastruktur ankündigen', hint: 'Gewerkschaften empört', fx: { mood: -3, growth: 0.02 } }
      ],
      choices: [
        { label: 'Solidarität mit den Streikenden', hint: 'Bei Arbeitnehmern beliebt', fx: { own: 0.1 } },
        { label: 'Streikrecht reformieren', hint: 'Bei Pendlern beliebt', fx: { own: 0.1 } }
      ] },
    { id: 'heat', cat: 'inland', roles: ['gov', 'opp', 'apo'], w: 1, title: 'Dürresommer', text: 'Wochenlange Hitze, Waldbrände in Brandenburg, Ernteausfälle. Die Landwirte fordern Hilfe.',
      gov: [
        { label: 'Dürrehilfe für Landwirte', hint: '1 Mrd. €', fx: { budget: 1, sal: { klima: 0.02, land: 0.02 } } },
        { label: 'Hitzeschutzplan für Städte', hint: 'Vorsorge', fx: { budget: 0.5, comp: { gesundheit: 2 } } }
      ],
      choices: [
        { label: 'Klimaschutz einfordern', hint: 'Junge Wähler', fx: { own: 0.1, sal: { klima: 0.03 } } },
        { label: 'Bauern unterstützen', hint: 'Ländlicher Raum', fx: { own: 0.1, sal: { land: 0.02 } } }
      ] },
    { id: 'digital_fail', cat: 'inland', roles: ['gov', 'opp'], w: 1, title: 'Digitalisierungspanne', text: 'Die neue Bürger-App des Bundes stürzt zum Start ab. Millionen kommen nicht an ihre Daten.',
      gov: [
        { label: 'Neustart mit Tech-Firmen', hint: 'Teuer, aber richtig', fx: { budget: 0.5, comp: { digitales: 2 } } },
        { label: 'Verantwortung beim Dienstleister abladen', hint: 'Spart Ärger, kostet Glaubwürdigkeit', fx: { like: -0.1 } }
      ],
      choices: [
        { label: 'Regierung verspotten', hint: 'Kommt online gut an', fx: { own: 0.15, gov: -0.1 } },
        { label: 'Eigenes Digitalkonzept vorstellen', hint: 'Kompetenz', fx: { own: 0.05, comp: { digitales: 3 } } }
      ] },

    // ---------- Parlamentarische Aufgaben ----------
    { id: 'judge', cat: 'parlament', roles: ['gov', 'opp'], w: 1.5, once: true, title: 'Wahl von Verfassungsrichtern', text: 'Am Bundesverfassungsgericht sind zwei Stellen frei. Die Wahl braucht im Bundestag eine Zweidrittelmehrheit (§ 6 BVerfGG) – die Koalition braucht also Stimmen aus der Opposition.',
      gov: [
        { label: 'Einvernehmlichen Kandidaten mit der Opposition suchen', hint: 'Klappt meistens', fx: { like: 0.1 }, chance: 0.8, fail: { gov: -0.2, mood: -3 }, okText: 'Die Richter werden mit großer Mehrheit gewählt.', failText: 'Die Wahl scheitert im ersten Anlauf – Streit wie im Sommer 2025.' },
        { label: 'Eigene Kandidatin durchsetzen', hint: 'Riskant', fx: { mood: 2 }, chance: 0.4, fail: { gov: -0.4, mood: -6, like: -0.2 }, okText: 'Knapp, aber es reicht.', failText: 'Die Kandidatin fällt durch, die Koalition ist blamiert.' }
      ],
      choices: [
        { label: 'Zustimmen gegen Mitsprache beim nächsten Mal', hint: 'Staatspolitische Verantwortung', fx: { own: 0.05, like: 0.1 } },
        { label: 'Blockieren', hint: 'Macht zeigen', fx: { own: 0.1, gov: -0.1, unity: 2 } }
      ] },
    { id: 'bundesversammlung', cat: 'parlament', roles: ['gov', 'opp', 'apo'], w: 0, title: 'Bundesversammlung', text: 'Die Bundesversammlung – Bundestag und ebenso viele Delegierte der Länder – wählt eine neue Bundespräsidentin oder einen neuen Bundespräsidenten.',
      choices: [
        { label: 'Eigene Kandidatur aufstellen', hint: 'Profil, aber wohl chancenlos', fx: { own: 0.15, unity: 2 } },
        { label: 'Überparteiliche Kandidatin unterstützen', hint: 'Staatstragend', fx: { like: 0.15 } }
      ] },
    { id: 'gg_change', cat: 'parlament', roles: ['gov'], w: 1, minQ: 4, once: true, title: 'Grundgesetzänderung: Schuldenbremse reformieren?', text: 'Ökonomen und Länder fordern eine Reform der Schuldenbremse für Investitionen. Dafür braucht es zwei Drittel in Bundestag und Bundesrat.',
      choices: [
        { label: 'Reform anstreben', hint: 'Braucht die Opposition', fx: { mood: -2 }, chance: 0.45, fx2: { debtRule: 0.5 }, fail: { gov: -0.1 }, okText: 'Die Reform kommt: Investitionen bis 0,5 % des BIP mehr erlaubt.', failText: 'Die Zweidrittelmehrheit kommt nicht zustande.' },
        { label: 'Nicht anfassen', hint: 'Solide Finanzen', fx: {} }
      ] },
    { id: 'afd_ban', cat: 'parlament', roles: ['gov', 'opp'], w: 1, minQ: 3, once: true, notParty: ['afd'], title: 'AfD-Verbotsverfahren?', text: 'Der Verfassungsschutz stuft die AfD bundesweit als gesichert rechtsextremistisch ein. Abgeordnete mehrerer Fraktionen wollen ein Verbotsverfahren in Karlsruhe beantragen (Art. 21 GG).',
      choices: [
        { label: 'Antrag unterstützen', hint: 'Polarisiert stark', fx: { own: 0.1, sal: { demokratie: 0.04 }, unity: -2 } },
        { label: 'Politisch stellen statt verbieten', hint: 'Vorsichtig', fx: { sal: { demokratie: 0.02 } } }
      ] },
    { id: 'afd_vs', cat: 'partei', roles: ['opp', 'gov', 'apo'], w: 1.5, parties: ['afd'], minQ: 2, title: 'Verfassungsschutz und Verbotsdebatte', text: 'Der Verfassungsschutz veröffentlicht ein Gutachten über eure Partei. Andere Fraktionen fordern ein Verbotsverfahren.',
      choices: [
        { label: 'Klagen und Opferrolle betonen', hint: 'Mobilisiert die Basis', fx: { own: 0.3, unity: 4, sal: { demokratie: 0.03 } } },
        { label: 'Radikale Mitglieder ausschließen', hint: 'Moderater, aber Streit', fx: { own: 0.1, unity: -8, like: 0.3 } }
      ] },

    // ---------- Landesverbände im Konflikt mit der Bundespartei ----------
    { id: 'lv_union_afd', cat: 'lv', roles: ['gov', 'opp', 'apo'], parties: ['union'], land: ['ST', 'TH', 'SN', 'MV', 'BB'], w: 2.5, title: 'Landesverband {landName} gegen die Bundespartei', text: 'Die CDU {landName} will nach der Landtagswahl über eine von der AfD tolerierte Minderheitsregierung reden. Der Landesvorsitzende sagt: „Die Brandmauer haben sich Berliner ausgedacht.“ Das Konrad-Adenauer-Haus ist alarmiert.',
      choices: [
        { label: 'Machtwort: Unvereinbarkeitsbeschluss gilt', hint: 'Bundespartei setzt sich durch, Landesverband grollt', fx: { lv: 20, unity: -3, like: 0.1 } },
        { label: 'Gespräche über Sachfragen dulden', hint: 'Landesverband beruhigt, bundesweit Empörung', fx: { lv: -15, own: -0.4, unity: -2, fwLand: true } },
        { label: 'Landesvorsitzenden zum Rücktritt drängen', hint: 'Riskant', fx: { lv: 10, unity: -5 }, chance: 0.55, fail: { lv: 25, unity: -8, own: -0.2 }, okText: 'Der Landeschef tritt zurück, Ruhe kehrt ein.', failText: 'Der Landesverband stellt sich hinter ihn – offener Machtkampf.' }
      ] },
    { id: 'lv_csu', cat: 'lv', roles: ['gov', 'opp'], parties: ['union'], w: 2, title: 'Die CSU schert aus', text: 'Die CSU droht, den gemeinsamen Kurs zu verlassen, und fordert eine Obergrenze bei der Migration und eine Pkw-Maut nur für Ausländer 2.0. In München spricht man von „Berliner Arroganz“.',
      choices: [
        { label: 'Der CSU entgegenkommen', hint: 'Schwesternfrieden', fx: { lv: -10, unity: 4, own: -0.1, mood: -3 }, landFix: 'BY' },
        { label: 'Hart bleiben', hint: 'Riskiert Streit mit München', fx: { lv: 15, unity: -6 }, landFix: 'BY' }
      ] },
    { id: 'lv_spd_jusos', cat: 'lv', roles: ['gov', 'opp', 'apo'], parties: ['spd'], w: 2, title: 'Juso-Aufstand', text: 'Die Jusos starten ein Mitgliederbegehren gegen den Kurs der Parteiführung. Der Landesverband {landName} unterstützt sie.',
      land: ['NW', 'BE', 'HH', 'NI', 'HB'],
      choices: [
        { label: 'Auf die Basis zugehen', hint: 'Linker Kurs, Koalitionspartner verärgert', fx: { unity: 5, lv: -12, mood: -4, own: 0.1 } },
        { label: 'Führung behauptet sich', hint: 'Basis murrt', fx: { unity: -5, lv: 15, members: -1 } }
      ] },
    { id: 'lv_spd_east', cat: 'lv', roles: ['gov', 'opp', 'apo'], parties: ['spd'], land: ['BB', 'MV'], w: 1.5, title: '{landName} geht eigene Wege', text: 'Der Ministerpräsident aus {landName} kritisiert offen die Russland-Politik der Bundespartei und fordert Verhandlungen. Die Presse spricht von einer Spaltung.',
      choices: [
        { label: 'Öffentlich zurechtweisen', hint: 'Klare Linie', fx: { lv: 15, unity: -3, intl: 1 } },
        { label: 'Intern klären', hint: 'Leiser', fx: { lv: -5, unity: 1, own: -0.1 } }
      ] },
    { id: 'lv_gruene', cat: 'lv', roles: ['gov', 'opp', 'apo'], parties: ['gruene'], land: ['BW', 'BE', 'HH', 'NW'], w: 2, title: 'Realos gegen Fundis', text: 'Der Landesverband {landName} fordert, die Partei müsse „endlich wieder Klimapartei statt Kompromisspartei“ sein. Der Realo-Flügel um den Ministerpräsidenten hält dagegen.',
      choices: [
        { label: 'Klimakurs verschärfen', hint: 'Basis jubelt, Mitte skeptisch', fx: { unity: 5, lv: -10, sal: { klima: 0.02 }, mood: -3 } },
        { label: 'Pragmatischen Kurs halten', hint: 'Regierungsfähig', fx: { unity: -4, lv: 12, like: 0.1 } }
      ] },
    { id: 'lv_linke', cat: 'lv', roles: ['gov', 'opp', 'apo'], parties: ['linke'], land: ['BE', 'TH', 'MV', 'SN', 'HB'], w: 2, title: 'Streit um Regierungsbeteiligung', text: 'Der Landesverband {landName} will in eine Landesregierung, die Parteijugend lehnt jede Koalition mit „neoliberalen Parteien“ ab.',
      choices: [
        { label: 'Regierungsbeteiligung unterstützen', hint: 'Pragmatisch', fx: { lv: -10, unity: -3, like: 0.1 } },
        { label: 'Bewegungspartei bleiben', hint: 'Junge Basis zufrieden', fx: { lv: 12, unity: 3, members: 2 } }
      ] },
    { id: 'lv_bsw', cat: 'lv', roles: ['gov', 'opp', 'apo'], parties: ['bsw'], land: ['TH', 'BB', 'SN'], w: 2.5, title: 'Landesverband {landName} rebelliert', text: 'Die Landtagsfraktion in {landName} verweigert der Bundesführung die Gefolgschaft und will in der Landesregierung bleiben – gegen den ausdrücklichen Willen der Parteispitze.',
      choices: [
        { label: 'Landesvorstand absetzen', hint: 'Durchgreifen', fx: { lv: 25, unity: -6, members: -3 } },
        { label: 'Landesverband gewähren lassen', hint: 'Autorität der Spitze leidet', fx: { lv: -15, unity: -4, like: -0.2 } },
        { label: 'Kompromiss: Sonderparteitag', hint: 'Kostet Zeit und Geld', fx: { lv: -5, unity: 2, cash: -0.3 } }
      ] },
    { id: 'lv_fdp', cat: 'lv', roles: ['gov', 'opp', 'apo'], parties: ['fdp'], land: ['NW', 'BW', 'RP', 'HE'], w: 1.5, title: 'Richtungsstreit in {landName}', text: 'Der Landesverband {landName} fordert eine Rückkehr zum sozialliberalen Kurs. Der Wirtschaftsflügel droht mit Austritten.',
      choices: [
        { label: 'Wirtschaftsliberal bleiben', hint: 'Kernklientel', fx: { lv: 12, unity: -2 } },
        { label: 'Bürgerrechte stärker betonen', hint: 'Breiter aufstellen', fx: { lv: -10, unity: -2, comp: { demokratie: 2 } } }
      ] },
    { id: 'lv_afd', cat: 'lv', roles: ['gov', 'opp', 'apo'], parties: ['afd'], land: ['TH', 'SN', 'BB', 'ST'], w: 2, title: 'Radikale Töne aus {landName}', text: 'Der Landesvorsitzende aus {landName} fordert auf einer Kundgebung „Remigration im großen Stil“. Die Bundesspitze will bürgerlicher wirken.',
      choices: [
        { label: 'Distanzieren', hint: 'Bürgerlich, aber Ärger im Osten', fx: { lv: 18, unity: -5, like: 0.2 } },
        { label: 'Schweigen', hint: 'Basis zufrieden, Medien empört', fx: { lv: -8, own: -0.1, unity: 2 } }
      ] },
    { id: 'lv_generic', cat: 'lv', roles: ['gov', 'opp', 'apo'], w: 1.5, title: 'Ärger im Landesverband {landName}', text: 'Der Landesverband {landName} fühlt sich von der Bundespartei übergangen: Bei der Listenaufstellung und den Posten seien die eigenen Leute leer ausgegangen.',
      choices: [
        { label: 'Posten und Aufmerksamkeit zusagen', hint: 'Beruhigt', fx: { lv: -15, unity: 1, cash: -0.2 } },
        { label: 'Aussitzen', hint: 'Kann eskalieren', fx: { lv: 8 } }
      ] },

    // ---------- Koalition ----------
    { id: 'coal_leak', cat: 'koalition', roles: ['gov'], w: 2, title: 'Durchgestochene Kabinettsvorlage', text: 'Ein interner Entwurf von {partner} landet bei der „Bild“ – mit spöttischen Randnotizen über euch.',
      choices: [
        { label: 'Öffentlich Konsequenzen fordern', hint: 'Klima leidet', fx: { mood: -8, own: 0.1 } },
        { label: 'Intern im Koalitionsausschuss klären', hint: 'Diskret', fx: { mood: -2 } }
      ] },
    { id: 'coal_dispute', cat: 'koalition', roles: ['gov'], w: 2.5, minQ: 1, title: 'Koalitionsstreit um {topic}', text: '{partner} stellt den Kompromiss beim Thema {topic} öffentlich infrage. Talkshows sprechen von einer „Koalition im Dauerstreit“.',
      choices: [
        { label: 'Nachgeben', hint: 'Ruhe, aber eure Basis murrt', fx: { mood: 6, unity: -3, own: -0.1 } },
        { label: 'Hart bleiben', hint: 'Profil, aber Streit', fx: { mood: -7, own: 0.15, gov: -0.1 } },
        { label: 'Koalitionsausschuss einberufen', hint: 'Mühsam, aber geordnet', fx: { mood: 2, ap: -1 } }
      ] },
    { id: 'coal_poll', cat: 'koalition', roles: ['junior'], w: 1.5, title: 'Juniorpartner in der Krise?', text: 'Eine Umfrage sieht euch deutlich unter eurem Wahlergebnis. Parteifreunde fordern: „Wir müssen sichtbarer werden – notfalls mit Krach.“',
      choices: [
        { label: 'Profil schärfen, auch gegen den Partner', hint: 'Klima leidet', fx: { own: 0.3, mood: -8 } },
        { label: 'Solide Regierungsarbeit betonen', hint: 'Langfristig', fx: { mood: 3, like: 0.1 } }
      ] },

    // ---------- Skandale ----------
    { id: 'lobby', cat: 'skandal', roles: ['gov', 'opp', 'apo'], w: 1.5, title: 'Maskenaffäre 2.0', text: 'Recherchen zeigen: Ein Bundestagsabgeordneter eurer Partei hat Provisionen für die Vermittlung von Rüstungsaufträgen kassiert.',
      choices: [
        { label: 'Sofortiger Fraktionsausschluss', hint: 'Klare Kante', fx: { own: -0.1, like: 0.2, unity: -1 } },
        { label: 'Auf die Unschuldsvermutung verweisen', hint: 'Riskant', fx: { own: -0.2 }, chance: 0.5, fail: { own: -0.6, like: -0.3 }, okText: 'Die Vorwürfe lösen sich auf.', failText: 'Neue Belege tauchen auf – der Schaden ist groß.' }
      ] },
    { id: 'plagiat', cat: 'skandal', roles: ['gov', 'opp', 'apo'], w: 1, title: 'Plagiatsvorwurf', text: 'Ein Plagiatsjäger findet in der Doktorarbeit eurer stellvertretenden Vorsitzenden zahlreiche ungekennzeichnete Stellen.',
      choices: [
        { label: 'Rücktritt nahelegen', hint: 'Sauber', fx: { unity: -2, like: 0.1 } },
        { label: 'Prüfung der Universität abwarten', hint: 'Zieht sich hin', fx: { own: -0.15 } }
      ] },
    { id: 'donation', cat: 'skandal', roles: ['gov', 'opp', 'apo'], w: 1, title: 'Fragwürdige Großspende', text: 'Eure Partei hat eine Spende von 500.000 € von einem Unternehmer erhalten, der von einem Gesetz profitieren würde.',
      choices: [
        { label: 'Spende zurückzahlen', hint: 'Kostet Geld', fx: { cash: -0.5, like: 0.1 } },
        { label: 'Spende behalten, alles legal', hint: 'Imageschaden', fx: { own: -0.25, cash: 0 } }
      ] },

    // ---------- Partei ----------
    { id: 'party_congress', cat: 'partei', roles: ['gov', 'opp', 'apo'], w: 1, minQ: 5, title: 'Bundesparteitag', text: 'Der Bundesparteitag steht an. Die Delegierten wollen über einen Leitantrag zum Thema {topic} abstimmen.',
      choices: [
        { label: 'Leitantrag nach dem Willen der Basis', hint: 'Geschlossenheit', fx: { unity: 6, comp: {} } },
        { label: 'Kurs der Führung durchsetzen', hint: 'Disziplin', fx: { unity: -3, like: 0.2 } }
      ] },
    { id: 'member_surge', cat: 'partei', roles: ['opp', 'apo'], w: 1, title: 'Eintrittswelle', text: 'Nach einer viralen Rede eurer Spitze treten binnen einer Woche Tausende in die Partei ein.',
      choices: [
        { label: 'Neumitglieder sofort einbinden', hint: 'Mehr Aktive', fx: { members: 4, unity: 2 } },
        { label: 'Spendenaufruf hinterherschicken', hint: 'Geld für die Kasse', fx: { members: 2, cash: 0.4 } }
      ] },
    { id: 'apo_media', cat: 'partei', roles: ['apo'], w: 2, title: 'Kaum noch Sendezeit', text: 'Ohne Fraktion im Bundestag werdet ihr nicht mehr in Talkshows eingeladen. Junge Mitglieder schlagen vor, voll auf TikTok und Instagram zu setzen.',
      choices: [
        { label: 'Social-Media-Offensive', hint: 'Junge Wähler', fx: { own: 0.2, cash: -0.2 } },
        { label: 'Klassisch: Präsenz in den Ländern', hint: 'Landtagswahlen im Blick', fx: { lv: -10, own: 0.1 } }
      ] },
    { id: 'apo_staff', cat: 'partei', roles: ['apo'], w: 1.5, minQ: 1, title: 'Weniger Geld, weniger Personal', text: 'Mit dem Ausscheiden aus dem Bundestag fallen Fraktionsmittel und Mitarbeiterstellen weg. Die Geschäftsstelle muss Personal abbauen.',
      choices: [
        { label: 'Hart sparen', hint: 'Kasse geschont, Stimmung sinkt', fx: { cash: 0.5, unity: -4 } },
        { label: 'Kredit aufnehmen, Personal halten', hint: 'Risiko', fx: { cash: -0.6, unity: 2 } }
      ] },
    { id: 'opp_leader', cat: 'partei', roles: ['opp'], w: 1, minQ: 4, title: 'Wer führt die Opposition?', text: 'Die Medien fragen: Wer ist die wahre Oppositionsführerin? Eine Generaldebatte zum Haushalt steht an.',
      choices: [
        { label: 'Scharfe Generalabrechnung', hint: 'Polarisierend', fx: { own: 0.3, gov: -0.15, like: -0.1 } },
        { label: 'Konstruktive Gegenrede mit eigenem Konzept', hint: 'Seriös', fx: { own: 0.15, like: 0.2 } }
      ] },

    // ---------- Stufe 2: weitere Ereignisse, mit Zuständigkeit (ministry) und Folgeereignissen (next) ----------
    { id: 'china_ev', cat: 'wirtschaft', ministry: 'wirtschaft', roles: ['gov'], w: 1.5, title: 'Billige E-Autos aus China', text: 'Chinesische Hersteller erobern den europäischen Markt. Die EU-Kommission schlägt Strafzölle vor, Peking droht mit Gegenmaßnahmen gegen deutsche Autobauer.',
      choices: [
        { label: 'EU-Zölle mittragen', hint: 'Schützt Jobs hier, riskiert das China-Geschäft', fx: { growth: -0.05, intl: 2, unemp: -0.03 }, chance: 0.6, fail: { growth: -0.15 }, okText: 'Peking reagiert verhalten.', failText: 'China verhängt Zölle auf deutsche Premiumautos.' },
        { label: 'Gegen Zölle stimmen', hint: 'Exportinteressen zuerst', fx: { intl: -4, growth: 0.03, gov: -0.05 } },
        { label: 'Ansiedlung chinesischer Werke fördern', hint: 'Jobs in Ostdeutschland, Kritik aus Brüssel', fx: { unemp: -0.05, intl: -3, sal: { wirtschaft: 0.01 } } }
      ] },
    { id: 'hostage', cat: 'intl', ministry: 'aa', roles: ['gov'], w: 1, once: true, title: 'Deutsche Geiseln in der Sahelzone', text: 'Eine Miliz hat vier deutsche Entwicklungshelfer entführt. Die Familien flehen die Bundesregierung öffentlich an, alles zu tun.',
      choices: [
        { label: 'Diskret verhandeln lassen', hint: 'Krisenstab im Auswärtigen Amt', fx: { budget: 0.2 }, chance: 0.6, fail: { gov: -0.2, like: -0.2 }, okText: 'Nach Wochen kommt die Nachricht: Sie sind frei.', failText: 'Die Verhandlungen stocken, die Familien gehen an die Presse.', next: { id: 'hostage_home', in: 1 } },
        { label: 'Befreiungsaktion des KSK', hint: 'Hohes Risiko', fx: { intl: 2 }, chance: 0.45, fail: { gov: -0.6, like: -0.5, intl: -4 }, okText: 'Die Befreiung gelingt ohne Verluste.', failText: 'Die Aktion scheitert – ein Soldat wird schwer verletzt.' }
      ] },
    { id: 'hostage_home', cat: 'intl', ministry: 'aa', roles: ['gov'], w: 0, title: 'Die Geiseln kommen nach Hause', text: 'Das Flugzeug mit den befreiten Entwicklungshelfern landet in Berlin-Tegel. Die Kameras warten.',
      choices: [
        { label: 'Persönlich am Rollfeld empfangen', hint: 'Starke Bilder', fx: { like: 0.3, gov: 0.1 } },
        { label: 'Die Familien unter sich lassen', hint: 'Respektvoll, unauffällig', fx: { like: 0.1 } }
      ] },
    { id: 'drones_east', cat: 'intl', ministry: 'verteidigung', roles: ['gov', 'opp'], w: 1.5, title: 'Drohnen über der NATO-Ostflanke', text: 'Russische Drohnen dringen in den Luftraum Polens und Litauens ein. Die Partner bitten um deutsche Luftverteidigung.',
      gov: [
        { label: 'Patriot-Staffel und Eurofighter verlegen', hint: '+2 Mrd. €/Jahr, Ansehen steigt', fx: { def: 2, intl: 6, sal: { verteidigung: 0.02 } } },
        { label: 'Zur Deeskalation aufrufen', hint: 'Partner sind irritiert', fx: { intl: -5, own: 0.05 } }
      ],
      choices: [
        { label: 'Schnelle Unterstützung verlangen', hint: 'Sicherheitspolitisches Profil', fx: { own: 0.1, comp: { verteidigung: 2 } } },
        { label: 'Vor Eskalation warnen', hint: 'Friedenspolitisches Profil', fx: { own: 0.1 } }
      ] },
    { id: 'eu_hungary', cat: 'intl', ministry: 'aa', roles: ['gov'], w: 1, title: 'Blockade in Brüssel', text: 'Ein Mitgliedstaat blockiert per Veto die nächste Ukraine-Hilfe und das EU-Sanktionspaket.',
      choices: [
        { label: 'EU-Gelder des Landes einfrieren lassen', hint: 'Harte Linie', fx: { intl: 5, sal: { europa: 0.02 } }, chance: 0.6, fail: { intl: -2 }, okText: 'Die Blockade fällt.', failText: 'Die Blockade bleibt – Europa wirkt gelähmt.' },
        { label: 'Kompromiss mit Zugeständnissen', hint: 'Geräuschlos', fx: { intl: 1 } }
      ] },
    { id: 'us_nato', cat: 'intl', ministry: 'verteidigung', roles: ['gov', 'opp'], w: 1, minQ: 6, once: true, title: 'Washington stellt die NATO infrage', text: 'Der US-Präsident erklärt, die Beistandspflicht gelte nur für Länder, die „ihre Rechnungen bezahlen“.',
      gov: [
        { label: 'Europäische Verteidigungsunion vorantreiben', hint: '+8 Mrd. €/Jahr Verteidigung', fx: { def: 8, intl: 6, sal: { verteidigung: 0.03, europa: 0.02 } } },
        { label: 'In Washington um Vertrauen werben', hint: 'Bittsteller-Rolle', fx: { intl: -2, like: -0.1 } }
      ],
      choices: [
        { label: 'Mehr europäische Souveränität fordern', hint: 'Zeitgeist', fx: { own: 0.15, sal: { europa: 0.02 } } },
        { label: 'Die Regierung der Naivität bezichtigen', hint: 'Angriff', fx: { own: 0.1, gov: -0.1 } }
      ] },
    { id: 'famine', cat: 'intl', ministry: 'entwicklung', roles: ['gov'], w: 1, title: 'Hungersnot in Ostafrika', text: 'Nach der dritten Dürre in Folge droht Millionen Menschen der Hungertod. Die Vereinten Nationen bitten um Geld.',
      choices: [
        { label: 'Eine Milliarde Nothilfe', hint: 'Ansehen steigt', fx: { budget: 1, intl: 5 } },
        { label: 'Bei den Kürzungen bleiben', hint: 'Spart Geld, Kritik von Kirchen und NGOs', fx: { intl: -5, gov: -0.05 } }
      ] },
    { id: 'teachers', cat: 'inland', ministry: 'familie', roles: ['gov', 'opp', 'apo'], w: 1.5, title: 'Lehrermangel: Unterricht fällt aus', text: 'Bundesweit fehlen 30.000 Lehrkräfte. In manchen Grundschulen fällt jede fünfte Stunde aus.',
      gov: [
        { label: 'Startchancen-Programm ausweiten', hint: '2 Mrd. € für Brennpunktschulen', fx: { budget: 2, comp: { bildung: 2 }, gov: 0.1 } },
        { label: 'Auf die Länder verweisen', hint: 'Bildung ist Ländersache', fx: { gov: -0.1, sal: { bildung: 0.02 } } }
      ],
      choices: [
        { label: 'Bildungsgipfel fordern', hint: 'Familien im Blick', fx: { own: 0.15, sal: { bildung: 0.02 } } },
        { label: 'Eigenes Schulkonzept vorlegen', hint: 'Kompetenz', fx: { own: 0.05, comp: { bildung: 3 } } }
      ] },
    { id: 'drugs', cat: 'inland', ministry: 'gesundheit', roles: ['gov'], w: 1.2, title: 'Medikamente werden knapp', text: 'Fiebersäfte und Antibiotika für Kinder sind vielerorts ausverkauft. Apotheken schlagen Alarm.',
      choices: [
        { label: 'Produktion nach Europa zurückholen', hint: '1,5 Mrd. € Förderung', fx: { budget: 1.5, comp: { gesundheit: 2 } }, chance: 0.6, fail: { gov: -0.15 }, okText: 'Erste Werke kündigen Ausbau an.', failText: 'Die Engpässe halten an.' },
        { label: 'Festbeträge für Kinderarznei anheben', hint: 'Schnell, aber teuer für die Kassen', fx: { gov: 0.05 } }
      ] },
    { id: 'pflege', cat: 'inland', ministry: 'gesundheit', roles: ['gov'], w: 1.2, minQ: 4, once: true, title: 'Pflegeversicherung vor der Pleite', text: 'Die Pflegekassen melden ein Defizit von sechs Milliarden Euro. Die Eigenanteile im Heim liegen bei über 3.000 Euro im Monat.',
      choices: [
        { label: 'Beiträge erhöhen', hint: 'Arbeitgeber und Beschäftigte zahlen mehr', fx: { gov: -0.25, growth: -0.03 }, next: { id: 'pflege_firms', in: 2 } },
        { label: 'Steuerzuschuss', hint: '+4 Mrd. €', fx: { budget: 4 } },
        { label: 'Eigenanteile deckeln', hint: '+6 Mrd. €, sehr beliebt', fx: { budget: 6, gov: 0.3, sal: { gesundheit: 0.02 } } }
      ] },
    { id: 'pflege_firms', cat: 'wirtschaft', ministry: 'wirtschaft', roles: ['gov'], w: 0, title: 'Wirtschaft klagt über Lohnnebenkosten', text: 'Nach der Beitragserhöhung warnen Arbeitgeberverbände: Die Sozialabgaben steigen über 42 Prozent – Gift für Arbeitsplätze.',
      choices: [
        { label: 'Entlastung bei der Stromsteuer zusagen', hint: 'Teuer', fx: { budget: 2, growth: 0.03 } },
        { label: 'Hart bleiben', hint: 'Die Wirtschaft grollt', fx: { growth: -0.04, gov: -0.05 } }
      ] },
    { id: 'clans', cat: 'inland', ministry: 'innen', roles: ['gov', 'opp'], w: 1, title: 'Großrazzia gegen Clankriminalität', text: 'Nach einer spektakulären Razzia in drei Bundesländern debattiert das Land über Clankriminalität und Abschiebungen.',
      gov: [
        { label: 'Vermögensabschöpfung verschärfen', hint: 'Mehr Befugnisse für Ermittler', fx: { sal: { sicherheit: 0.03 }, gov: 0.1, mood: -2 } },
        { label: 'Präventionsprogramme stärken', hint: 'Langfristig', fx: { budget: 0.3, comp: { sicherheit: 1 } } }
      ],
      choices: [
        { label: 'Härteres Durchgreifen fordern', hint: 'Sicherheit', fx: { own: 0.15, sal: { sicherheit: 0.02 } } },
        { label: 'Vor Pauschalurteilen warnen', hint: 'Bürgerrechte', fx: { own: 0.05, comp: { demokratie: 1 } } }
      ] },
    { id: 'dataleak', cat: 'inland', ministry: 'digital', roles: ['gov'], w: 1, title: 'Datenleck bei der Rentenversicherung', text: 'Die Daten von zwölf Millionen Versicherten tauchen im Darknet auf. Die IT stammt aus den Neunzigern.',
      choices: [
        { label: 'Modernisierungsoffensive für die Verwaltung', hint: '1 Mrd. €', fx: { budget: 1, comp: { digitales: 3 } } },
        { label: 'Den Dienstleister haftbar machen', hint: 'Kurzfristig', fx: { like: -0.1, gov: -0.1 } }
      ] },
    { id: 'wolf', cat: 'inland', ministry: 'landwirtschaft', roles: ['gov', 'opp', 'apo'], land: ['NI', 'BB', 'SN', 'MV', 'ST'], w: 1, title: 'Wolfsrisse in {landName}', text: 'In {landName} hat ein Wolfsrudel binnen einer Woche über 60 Schafe gerissen. Weidetierhalter fordern den Abschuss.',
      gov: [
        { label: 'Schnellabschuss erlauben', hint: 'Ländlicher Raum zufrieden, Naturschützer empört', fx: { sal: { land: 0.02 }, lv: -5, mood: -2 } },
        { label: 'Herdenschutz fördern', hint: '0,2 Mrd. €', fx: { budget: 0.2 } }
      ],
      choices: [
        { label: 'Mit den Weidetierhaltern solidarisieren', hint: 'Land', fx: { own: 0.1, lv: -5 } },
        { label: 'Artenschutz verteidigen', hint: 'Stadt', fx: { own: 0.05 } }
      ] },
    { id: 'farmers', cat: 'inland', ministry: 'landwirtschaft', roles: ['gov'], w: 1.2, title: 'Traktoren vor dem Brandenburger Tor', text: 'Tausende Landwirte blockieren mit Traktoren die Hauptstadt. Sie protestieren gegen Bürokratie, Dieselpreise und EU-Auflagen.',
      choices: [
        { label: 'Agrardiesel-Entlastung zurückbringen', hint: '0,5 Mrd. €/Jahr', fx: { budget: 0.5, gov: 0.1, sal: { land: 0.02 } } },
        { label: 'Bürokratieabbau versprechen', hint: 'Günstig, aber vage', fx: { gov: 0.03 }, chance: 0.5, fail: { gov: -0.1 }, okText: 'Die Bauern ziehen ab.', failText: 'Die Bauern fühlen sich hingehalten.', failNext: { id: 'farmers2', in: 1 } },
        { label: 'Hart bleiben', hint: 'Riskant', fx: { gov: -0.1 }, next: { id: 'farmers2', in: 1 } }
      ] },
    { id: 'farmers2', cat: 'inland', ministry: 'landwirtschaft', roles: ['gov'], w: 0, title: 'Die Bauernproteste eskalieren', text: 'Autobahnauffahrten werden blockiert, vor Ministerbüros wird Mist abgeladen. Die Stimmung auf dem Land kippt.',
      choices: [
        { label: 'Doch nachgeben', hint: '0,8 Mrd. €, Gesichtsverlust', fx: { budget: 0.8, like: -0.2 } },
        { label: 'Runder Tisch Landwirtschaft', hint: 'Dialog', fx: { gov: 0.05, sal: { land: 0.01 } }, chance: 0.6, fail: { gov: -0.2 }, okText: 'Der Runde Tisch beruhigt die Lage.', failText: 'Der Bauernverband verlässt den Tisch.' }
      ] },
    { id: 'kita', cat: 'inland', ministry: 'familie', roles: ['gov', 'opp', 'apo'], w: 1, title: 'Kita-Notstand', text: 'Eltern gehen auf die Straße: 300.000 Kitaplätze fehlen, Einrichtungen kürzen wegen Personalmangel die Öffnungszeiten.',
      gov: [
        { label: 'Kita-Qualitätsgesetz aufstocken', hint: '1,5 Mrd. €', fx: { budget: 1.5, gov: 0.1, comp: { familie: 2 } } },
        { label: 'Fachkräfteoffensive Erzieherinnen', hint: 'Wirkt langsam', fx: { budget: 0.5 } }
      ],
      choices: [
        { label: 'Mit den Eltern demonstrieren', hint: 'Junge Familien', fx: { own: 0.15, sal: { familie: 0.02 } } },
        { label: 'Eigenes Familienkonzept vorlegen', hint: 'Kompetenz', fx: { own: 0.05, comp: { familie: 3 } } }
      ] },
    { id: 'whistle', cat: 'parlament', roles: ['opp'], w: 1.2, title: 'Ein Whistleblower meldet sich', text: 'Eine Beamtin aus einem Bundesministerium bietet euch interne Dokumente an: Die Regierung soll Gutachten geschönt haben.',
      choices: [
        { label: 'Veröffentlichen', hint: 'Großer Wurf – oder Bumerang', fx: {}, chance: 0.6, fx2: { gov: -0.4, own: 0.3 }, fail: { own: -0.3, like: -0.2 }, okText: 'Die Dokumente sind echt – die Regierung gerät unter Druck.', failText: 'Die Dokumente erweisen sich als aus dem Zusammenhang gerissen.' },
        { label: 'An den Bundesrechnungshof geben', hint: 'Seriös', fx: { like: 0.1 } }
      ] },
    { id: 'pact', cat: 'parlament', roles: ['opp'], w: 1, minQ: 3, title: 'Die Regierung bietet einen Pakt an', text: 'Die Kanzlerin/der Kanzler bietet euch einen überparteilichen „Deutschlandpakt“ zu Infrastruktur und Bürokratieabbau an.',
      choices: [
        { label: 'Einschlagen', hint: 'Staatspolitische Verantwortung – aber ihr helft der Regierung', fx: { like: 0.2, gov: 0.1, unity: -2 } },
        { label: 'Ablehnen', hint: 'Klare Opposition', fx: { own: 0.05, unity: 2 } }
      ] },
    { id: 'crowdfund', cat: 'partei', roles: ['apo'], w: 1.2, title: 'Crowdfunding für den Neuanfang', text: 'Ein Mitglied startet eine Online-Spendenaktion: „Holt uns zurück in den Bundestag!“ Nach drei Tagen sind schon 200.000 Euro zusammen.',
      choices: [
        { label: 'Groß bewerben', hint: 'Mehr Geld, mehr Aufmerksamkeit', fx: { cash: 0.6, own: 0.05 } },
        { label: 'Klein halten', hint: 'Kein Risiko, falls es floppt', fx: { cash: 0.2 } }
      ] },
    { id: 'split', cat: 'partei', roles: ['apo', 'opp'], w: 1, minQ: 4, once: true, title: 'Abspaltung droht', text: 'Eine Gruppe prominenter Mitglieder um einen früheren Bundestagsabgeordneten droht, eine eigene Partei zu gründen.',
      choices: [
        { label: 'Zugeständnisse machen', hint: 'Posten und Programmpunkte', fx: { unity: 5, cash: -0.2 } },
        { label: 'Ziehen lassen', hint: 'Klarheit, aber Verluste', fx: { members: -6, unity: 3, own: -0.25 } }
      ] },
    { id: 'youth', cat: 'partei', roles: ['gov', 'opp', 'apo'], w: 1, title: 'Ärger mit der Parteijugend', text: 'Die Parteijugend fordert in einem Beschluss Dinge, die weit über das Wahlprogramm hinausgehen. Die Medien fragen: Wofür steht die Partei?',
      choices: [
        { label: 'Distanzieren', hint: 'Mitte beruhigt, Junge verärgert', fx: { unity: -3, like: 0.1 } },
        { label: 'Als Diskussionsbeitrag würdigen', hint: 'Jugend zufrieden, Medien kritisch', fx: { unity: 2, own: -0.1 } }
      ] },
    { id: 'celebrity', cat: 'partei', roles: ['gov', 'opp', 'apo'], w: 0.8, title: 'Prominenz will mitmachen', text: 'Eine bekannte Fernsehmoderatorin will für euch bei der nächsten Wahl kandidieren. Altgediente Mitglieder sind skeptisch.',
      choices: [
        { label: 'Mit offenen Armen aufnehmen', hint: 'Aufmerksamkeit', fx: { like: 0.3, own: 0.1, unity: -2 } },
        { label: 'Freundlich absagen', hint: 'Die Basis zuerst', fx: { unity: 2 } }
      ] }
  ];

  // Ministerskandale: Text mit {minister} und {ministry}.
  var SCANDALS = [
    'Der Bundesrechnungshof rügt: Das {ministry} hat Beraterverträge über 80 Mio. € ohne Ausschreibung vergeben – unterschrieben von {minister}.',
    '{minister} soll Freunden aus der Heimatstadt Posten im {ministry} verschafft haben.',
    'Interne Chats von {minister} mit abfälligen Bemerkungen über die eigene Koalition sind aufgetaucht.',
    '{minister} hat einen Flug mit der Flugbereitschaft für einen privaten Urlaub genutzt.',
    'Im {ministry} wurden Warnungen vor einem Milliardenschaden monatelang ignoriert. Hat {minister} davon gewusst?'
  ];

  var TD = {
    MINISTRIES: MINISTRIES, KANZLERAMT: KANZLERAMT, TOPIC_MINISTRY: TOPIC_MINISTRY, WISH: WISH, MINISTER_KINDS: MINISTER_KINDS,
    LAENDER: LAENDER, BUNDESRAT_MAJ: BUNDESRAT_MAJ, LTW: LTW, EUROPAWAHL: EUROPAWAHL, BUNDESVERSAMMLUNG: BUNDESVERSAMMLUNG, LTW_BONUS: LTW_BONUS,
    ECON0: ECON0, AREAS: AREAS, AREA_PREF: AREA_PREF, REVENUE0: REVENUE0, DEBT_RULE: DEBT_RULE, BUDGET_STEPS: BUDGET_STEPS, TAXES: TAXES,
    LAW_COST: LAW_COST, ZUST_TOPICS: ZUST_TOPICS, TOPIC_ECON: TOPIC_ECON, POLICY0: POLICY0, ROLES: ROLES, FINANCE: FINANCE,
    EVENTS: EVENTS, SCANDALS: SCANDALS
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = TD; else root.BTW_TERMDATA = TD;
})(this);
