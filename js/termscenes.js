/*
 * Szenen für Aktionen in der Legislatur: Regierungserklärung mit Zwischenrufen, Nachtsitzung im Koalitionsausschuss,
 * Gipfelverhandlung, Zeugenbefragung im Untersuchungsausschuss, Bundestagsdebatte, Regierungsbefragung, Demonstration.
 * Gleiches Format wie scenes.js: { intro, meter, meter0, steps, result(S) }. Ohne DOM; termui.js spielt die Schritte ab.
 * Wirkung: S.q (−3 … 3) verstärkt oder schwächt die Aktion; S.fx = { mood, like, unity, cred, intl, gov } wirkt zusätzlich.
 * Abläufe nach der Geschäftsordnung des Bundestages (GOBT): Zwischenfragen § 27, Aktuelle Stunde § 106,
 * Regierungsbefragung § 106 mit Anlage 7, Untersuchungsausschüsse nach PUAG.
 */
(function (root) {
  const pickR = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function helpers(ctx) {
    const { g, t, E, D, T } = ctx;
    const like = t.party.leader.like;
    const topic = ctx.topic || (g.program ? g.program.core[0] : 'wirtschaft');
    const tp = D.TOPICS.find(x => x.id === topic);
    const opt = D.PROGRAM[topic][g.program ? g.program.positions[topic] : 1];
    const opp = Object.keys(t.seats).filter(p => t.gov.indexOf(p) === -1 && p !== g.party && t.seats[p] > 0).sort((a, b) => t.seats[b] - t.seats[a]);
    const comp = (g.competence && g.competence[topic]) || 40;
    return {
      like, topic, tName: tp ? tp.name : topic, opt, comp, opp,
      rival: opp[0] || 'afd',
      partner: t.gov.filter(p => p !== g.party)[0],
      short: p => (E.party(p) ? E.party(p).short : p),
      leader: t.party.leader.name,
      chanc: t.chancellor ? t.chancellor.name : 'die Kanzlerin',
      skill: clamp(0.4 + (comp - 50) / 120 + like * 0.05, 0.15, 0.85),
      T
    };
  }

  // Zwischenrufe aus dem Plenum (frei formuliert nach typischen Debatten).
  const HECKLES = ['Das glauben Sie doch selbst nicht!', 'Wo bleiben denn die Taten?', 'Schon wieder nur Ankündigungen!', 'Reden Sie mal mit den Leuten draußen!',
    'Das steht so nicht im Koalitionsvertrag!', 'Wer soll das bezahlen?'];

  // ---------- 🎙️ Regierungserklärung ----------
  function regerkl(ctx) {
    const h = helpers(ctx);
    const { t } = ctx;
    const delivered = t.stats.lawsOwn;
    const crisis = t.q - (t.crisisQ === undefined ? -99 : t.crisisQ) <= 2;
    const pk = ctx.id === 'presse';
    return {
      intro: pk ? 'Pressekonferenz in der Bundespressekonferenz zum Thema ' + h.tName + ' – die Hauptstadtpresse ist gut vorbereitet.' : 'Regierungserklärung im Bundestag zum Thema ' + h.tName + '. Danach Aussprache – die Opposition wartet schon.',
      meter: 'Stimmung im Plenum', meter0: 45,
      steps: [
        { title: 'Der Auftakt', text: (pk ? 'Guten Tag, meine Damen und Herren … ' : 'Frau Präsidentin, meine Damen und Herren … ') + 'Womit beginnt ' + h.leader + '?', options: [
          { label: 'Bilanz: „Wir haben geliefert.“', hint: delivered ? delivered + ' eigene Gesetze in Kraft' : 'Bisher wenig vorzuweisen', m: delivered >= 2 ? 12 : -4, q: delivered >= 2 ? 1 : -1, reply: delivered >= 2 ? 'Langer Applaus aus den Reihen der Koalition.' : 'Gelächter von der Opposition: „Was denn?“' },
          { label: crisis ? 'Die Krise ernst nehmen' : 'Die Sorgen der Menschen ansprechen', hint: crisis ? 'Das Land erwartet Führung' : 'Nahbar', m: crisis ? 14 : 7, q: 1, fx: { like: 0.04 }, reply: 'Konzentrierte Stille im Saal – man hört zu.' },
          { label: 'Mit einer großen Vision einsteigen', hint: 'Wirkt nur, wenn man der Spitze glaubt', m: h.like > 0.5 ? 12 : 2, q: h.like > 0.5 ? 1 : 0, reply: h.like > 0.5 ? 'Aufbruchsstimmung auf der Regierungsbank.' : 'Höflicher Applaus.' }
        ] },
        { title: pk ? '🗣️ Kritische Nachfrage' : '🗣️ Zwischenruf!', text: pk ? 'Ein Korrespondent unterbricht: „' + pickR(HECKLES) + '“' : 'Aus den Reihen der ' + h.short(h.rival) + ' ruft es: „' + pickR(HECKLES) + '“', options: [
          { label: 'Schlagfertig kontern', hint: 'Treffer oder Eigentor', roll: { p: clamp(0.5 + h.like * 0.08, 0.2, 0.85), win: { m: 14, q: 1, fx: { like: 0.06 }, reply: 'Gelächter und Applaus – der Konter wird zum Clip des Tages.' }, lose: { m: -8, q: -1, reply: 'Der Konter verpufft, die Opposition johlt.' } } },
          { label: 'Ruhig weiterreden', hint: 'Souverän, aber unspektakulär', m: 3, q: 0, reply: 'Die Rede geht weiter. Kein Drama.' },
          { label: '„Hören Sie doch erst einmal zu!“', hint: 'Wirkt leicht gereizt', m: -2, q: 0, fx: { like: -0.02 }, reply: 'Die Präsidentin mahnt zur Ruhe – beide Seiten.' }
        ] },
        { title: 'Die Kernbotschaft', text: 'Jetzt das Entscheidende zum Thema ' + h.tName + '.', options: [
          { label: 'Ankündigen: „' + h.opt.label + '“', hint: 'Euer Programm, konkret', m: Math.round(4 + 18 * h.opt.pop), q: h.opt.pop >= 0.15 ? 1 : 0, reply: h.opt.pop >= 0.15 ? 'Starker Applaus – auch einzelne in der Opposition klatschen.' : 'Geteilte Reaktionen im Saal.' },
          { label: 'Der Opposition die Hand reichen', hint: 'Staatsmännisch', m: 7, q: 1, fx: { like: 0.05 }, reply: 'Überraschte Gesichter – die Presse lobt den Ton.' },
          h.partner ? { label: 'Den Koalitionspartner würdigen', hint: 'Gut fürs Klima', m: 4, q: 0, fx: { mood: 4 }, reply: 'Die ' + h.short(h.partner) + '-Fraktion applaudiert demonstrativ.' }
            : { label: 'Die eigenen Erfolge betonen', hint: 'Für die eigene Basis', m: 6, q: 0, fx: { unity: 2 }, reply: 'Die eigene Fraktion steht auf.' }
        ] }
      ],
      result(S) { return { rows: [['Plenum', S.meter >= 60 ? 'überzeugt' : S.meter >= 40 ? 'aufmerksam' : 'unruhig']], headline: S.meter >= 60 ? 'Starke Regierungserklärung' : 'Regierungserklärung ohne Glanz' }; }
    };
  }

  // ---------- 🤝 Koalitionsausschuss ----------
  function koaausschuss(ctx) {
    const h = helpers(ctx);
    const { t, D } = ctx;
    const pt = h.partner ? h.short(h.partner) : 'Partner';
    const dm = (t.demands || []).find(d => !d.done);
    const theirs = dm ? D.PROGRAM[dm.topic][dm.opt].label : 'ihr Lieblingsprojekt';
    return {
      intro: 'Koalitionsausschuss im Kanzleramt: Partei- und Fraktionsspitzen, Brezeln, kalter Kaffee. Es wird eine lange Nacht.',
      meter: 'Koalitionsklima heute Nacht', meter0: clamp(Math.round(t.mood), 10, 90),
      steps: [
        { title: '22 Uhr – Die Tagesordnung', text: 'Was kommt zuerst auf den Tisch?', options: [
          { label: 'Das Anliegen von ' + pt + ': „' + theirs + '“', hint: 'Entgegenkommen schafft Vertrauen', m: 10, q: 0, fx: { mood: 4 }, reply: pt + ' ist sichtlich erleichtert.' },
          { label: 'Euer eigenes Herzensthema: ' + h.tName, hint: 'Profil – aber der Partner fühlt sich überfahren', m: -6, q: 1, fx: { mood: -2 }, reply: 'Stirnrunzeln auf der anderen Seite des Tisches.' },
          { label: 'Erst einmal der Haushalt', hint: 'Nüchtern, sachlich', m: 4, q: 0, reply: 'Zahlenkolonnen bis Mitternacht.' }
        ] },
        { title: '1 Uhr – Das Paket', text: pt + ' schlägt einen Tausch vor: Ihr tragt ihr Projekt mit, sie tragen eures mit.', options: [
          { label: 'Einschlagen', hint: 'Klima steigt, beide geben etwas', m: 10, q: 0, fx: { mood: 5 }, reply: 'Handschlag über den Tisch.' },
          { label: 'Nachverhandeln', hint: 'Mehr herausholen – oder Streit', roll: { p: 0.5, win: { m: 4, q: 1, fx: { mood: 2 }, reply: 'Ihr holt noch etwas heraus – und alle sind zufrieden.' }, lose: { m: -10, q: 0, fx: { mood: -4 }, reply: 'Türenknallen. Pause bis halb drei.' } } },
          { label: 'Ablehnen', hint: 'Linie halten', m: -14, q: 0, fx: { mood: -6, unity: 2 }, reply: 'Eisiges Schweigen.' }
        ] },
        { title: '4 Uhr – Vor den Kameras', text: 'Die Hauptstadtpresse wartet seit Stunden vor dem Kanzleramt.', options: [
          { label: 'Gemeinsam vor die Kameras', hint: 'Bild der Geschlossenheit', m: 8, q: 0, fx: { mood: 4 }, reply: '„Wir haben gute Ergebnisse erzielt“ – Seite an Seite.' },
          { label: 'Eure Erfolge herausstellen', hint: 'Gut für euch, schlecht fürs Klima', m: -8, q: 1, fx: { mood: -4 }, reply: 'Am Morgen liest ' + pt + ' die Schlagzeilen – und schäumt.' },
          { label: 'Wortlos ins Auto steigen', hint: 'Die Presse spekuliert', m: -2, q: -1, reply: '„Ergebnisse? Kein Kommentar.“ Die Gerüchteküche brodelt.' }
        ] }
      ],
      result(S) { return { rows: [['Klima nach der Nacht', Math.round(S.meter) + '/100']], headline: S.meter >= 55 ? 'Koalition rauft sich zusammen' : 'Koalitionsausschuss ohne Durchbruch' }; }
    };
  }

  // ---------- ✈️ Gipfel ----------
  const SUMMITS = [
    { name: 'EU-Gipfel in Brüssel', issue: 'den EU-Haushalt und gemeinsame Verteidigungsausgaben', ally: 'Frankreich', foe: 'den „Sparsamen Vier“' },
    { name: 'G7-Gipfel', issue: 'die Unterstützung der Ukraine und Handelsfragen', ally: 'Kanada und Italien', foe: 'die USA' },
    { name: 'NATO-Gipfel', issue: 'das Ziel für Verteidigungsausgaben', ally: 'Polen und die Balten', foe: 'die Südflanke' },
    { name: 'Staatsbesuch in Washington', issue: 'Zölle auf deutsche Autos', ally: 'die Wirtschaftsdelegation', foe: 'das Weiße Haus' },
    { name: 'Staatsbesuch in Peking', issue: 'Marktzugang und Menschenrechte', ally: 'die mitreisenden Konzernchefs', foe: 'die chinesische Führung' }
  ];
  function reise(ctx) {
    const h = helpers(ctx);
    const s = pickR(SUMMITS);
    return {
      intro: s.name + ': Auf dem Tisch liegt ' + s.issue + '.', meter: 'Verhandlungsposition', meter0: clamp(Math.round(ctx.t.intl), 20, 80),
      steps: [
        { title: 'Die Linie', text: 'Mit welcher Linie geht ' + h.leader + ' in die Gespräche?', options: [
          { label: 'Deutsche Interessen hart vertreten', hint: 'Kommt zu Hause gut an, verärgert Partner', m: -6, q: 1, fx: { intl: -2 }, reply: 'Kühle Blicke am Verhandlungstisch.' },
          { label: 'Als Brückenbauer auftreten', hint: 'Ansehen in der Welt', m: 10, q: 0, fx: { intl: 3 }, reply: 'Man hört auf Berlin.' },
          { label: 'Vorher eine Allianz mit ' + s.ally + ' schmieden', hint: 'Stark – wenn es klappt', roll: { p: 0.55, win: { m: 14, q: 1, fx: { intl: 2 }, reply: 'Gemeinsam setzt ihr die Agenda.' }, lose: { m: -6, q: 0, reply: 'Die Allianz bröckelt schon beim Abendessen.' } } }
        ] },
        { title: 'Die Nachtsitzung', text: 'Um zwei Uhr nachts blockiert ' + s.foe + '. Was tun?', options: [
          { label: 'Kompromiss vorschlagen', hint: 'Ergebnis sicher, aber verwässert', m: 6, q: 0, fx: { intl: 2 }, reply: 'Der Kompromiss steht kurz vor Sonnenaufgang.' },
          { label: 'Hart bleiben', hint: 'Alles oder nichts', roll: { p: clamp(0.35 + ctx.t.intl / 250, 0.25, 0.7), win: { m: 12, q: 2, reply: 'Die anderen geben nach – ein Erfolg für Berlin.' }, lose: { m: -12, q: -1, fx: { intl: -2 }, reply: 'Der Gipfel endet ohne Einigung. Die Presse: „Deutschland isoliert“.' } } },
          { label: 'Vertagen', hint: 'Kein Risiko, kein Erfolg', m: 0, q: -1, reply: '„Wir arbeiten weiter daran.“' }
        ] },
        { title: 'Abschlusspressekonferenz', text: 'Die Kameras aus aller Welt sind auf ' + h.leader + ' gerichtet.', options: [
          { label: 'Den Erfolg verkaufen', hint: 'Nur glaubwürdig, wenn es einen gab', m: 4, q: 1, reply: 'Die Bilder laufen in den Abendnachrichten.' },
          { label: 'Ehrlich bilanzieren', hint: 'Unspektakulär, aber glaubwürdig', m: 2, q: 0, fx: { cred: 1 }, reply: 'Kommentatoren loben den nüchternen Ton.' },
          { label: 'Gegen ' + s.foe + ' austeilen', hint: 'Zu Hause beliebt, draußen nicht', m: -6, q: 1, fx: { intl: -3 }, reply: 'Diplomatische Verstimmung – aber Applaus in der Heimat.' }
        ] }
      ],
      result(S) { return { rows: [['Verhandlungsposition', Math.round(S.meter) + '/100']], headline: S.q >= 2 ? s.name + ': Erfolg für Deutschland' : s.name + ': mäßiges Ergebnis' }; }
    };
  }

  // ---------- 🔎 Untersuchungsausschuss: Zeugenbefragung ----------
  function ua(ctx) {
    const h = helpers(ctx);
    const witness = pickR(['ein ehemaliger Staatssekretär', 'die frühere Büroleiterin des Ministers', 'ein Abteilungsleiter aus dem Kanzleramt', 'ein Berater einer Unternehmensberatung']);
    return {
      intro: 'Untersuchungsausschuss zum Thema ' + h.tName + ' (PUAG). Heute sagt ' + witness + ' aus. Eure Obfrau hat zehn Minuten Fragezeit.',
      meter: 'Druck auf die Regierung', meter0: 30,
      steps: [
        { title: 'Die erste Frage', text: 'Der Zeuge wirkt gut vorbereitet. Womit fangt ihr an?', options: [
          { label: 'Eine E-Mail aus den Akten vorhalten', hint: 'Akribisch – meist wirksam', m: 14, q: 1, reply: '„Daran … kann ich mich nicht erinnern.“ Raunen im Saal.' },
          { label: 'Eine Suggestivfrage stellen', hint: 'Der Vorsitz könnte sie zurückweisen', roll: { p: 0.45, win: { m: 18, q: 1, reply: 'Der Zeuge gerät ins Stottern.' }, lose: { m: -6, q: -1, reply: 'Der Vorsitzende weist die Frage zurück. Peinlich.' } } },
          { label: 'Offen nach den Abläufen fragen', hint: 'Solide, wenig spektakulär', m: 6, q: 0, reply: 'Lange, ausweichende Antwort.' }
        ] },
        { title: 'Die Nachfrage', text: 'Ein Widerspruch zu einer früheren Aussage tut sich auf.', options: [
          { label: 'Den Widerspruch scharf herausarbeiten', hint: 'Der Moment der Wahrheit', roll: { p: 0.5, win: { m: 22, q: 2, fx: { gov: 1 }, reply: 'Der Zeuge räumt ein: Das Ministerium wusste Bescheid. Eilmeldung!' }, lose: { m: -4, q: 0, reply: 'Der Zeuge bleibt dabei – es steht Aussage gegen Akte.' } } },
          { label: 'Für die nächste Sitzung weitere Akten anfordern', hint: 'Geduldig', m: 8, q: 0, reply: 'Beweisantrag beschlossen. Fortsetzung folgt.' },
          { label: 'Der Presse vorab ein Zitat geben', hint: 'Laut – verstößt gegen die Gepflogenheiten', m: 4, q: 1, fx: { cred: -1 }, reply: 'Die Schlagzeile sitzt, aber die Koalition spricht von Vorverurteilung.' }
        ] },
        { title: 'Vor den Kameras', text: 'Nach der Sitzung warten die Mikrofone vor dem Saal.', options: [
          { label: 'Sachlich bleiben: „Wir klären weiter auf.“', hint: 'Glaubwürdig', m: 2, q: 0, fx: { cred: 1 }, reply: 'Seriöser Auftritt.' },
          { label: 'Rücktritt fordern', hint: 'Nur mit Beweisen klug', m: 6, q: 1, fx: { gov: 0.5 }, reply: 'Die Forderung macht die Runde.' }
        ] }
      ],
      result(S) { return { rows: [['Druck', S.meter >= 55 ? 'hoch' : S.meter >= 35 ? 'spürbar' : 'gering']], headline: S.meter >= 55 ? 'U-Ausschuss bringt Regierung in Bedrängnis' : 'Zäher Tag im Untersuchungsausschuss' }; }
    };
  }

  // ---------- 📄 Antrag / ⏱️ Aktuelle Stunde: Bundestagsdebatte ----------
  function debatte(ctx) {
    const h = helpers(ctx);
    const aktuell = ctx.id === 'aktuelle';
    const govP = ctx.t.chanc;
    return {
      intro: (aktuell ? 'Aktuelle Stunde (§ 106 GOBT) auf Verlangen eurer Fraktion: ' : 'Erste Beratung eures Antrags: ') + h.tName + '. Fünf Minuten Redezeit.',
      meter: 'Wirkung der Rede', meter0: 40,
      steps: [
        { title: 'Die Rede', text: 'Womit eröffnet ihr die Debatte?', options: [
          { label: 'Mit Zahlen und Fakten', hint: h.comp >= 55 ? 'Ihr kennt euch aus' : 'Riskant, wenn eine Zahl nicht stimmt', roll: { p: h.skill, win: { m: 12, q: 1, reply: 'Die Regierungsbank schaut betreten ins Manuskript.' }, lose: { m: -8, q: -1, reply: 'Die Koalition korrigiert eine Zahl – genüsslich.' } } },
          { label: 'Mit einem Fall aus dem Wahlkreis', hint: 'Menschen statt Statistik', m: 9, q: 1, reply: 'Stille im Saal – das Beispiel sitzt.' },
          { label: 'Mit einem scharfen Angriff auf die Regierung', hint: 'Für die eigene Basis', m: 7, q: 0, fx: { unity: 1 }, reply: 'Johlen auf beiden Seiten.' }
        ] },
        { title: '🙋 Zwischenfrage', text: 'Eine Abgeordnete der ' + h.short(govP) + ' meldet sich zu einer Zwischenfrage (§ 27 GOBT). Lasst ihr sie zu?', options: [
          { label: 'Zulassen und kontern', hint: 'Mehr Redezeit – und Risiko', roll: { p: h.skill + 0.05, win: { m: 14, q: 1, fx: { like: 0.04 }, reply: 'Souveräne Antwort. Die Fragestellerin setzt sich kleinlaut.' }, lose: { m: -10, q: -1, reply: 'Die Frage trifft – ihr müsst ausweichen.' } } },
          { label: 'Ablehnen: „Nein danke, ich möchte im Zusammenhang vortragen.“', hint: 'Sicher', m: 0, q: 0, reply: 'Weiter im Text.' }
        ] },
        { title: 'Der Schluss', text: 'Die Präsidentin mahnt: „Ihre Redezeit ist abgelaufen.“', options: [
          { label: 'Zur Zustimmung aufrufen', hint: 'Klassisch', m: 4, q: 0, reply: 'Applaus aus der eigenen Fraktion.' },
          { label: 'Ein Satz für die sozialen Netzwerke', hint: 'Zugespitzt', m: 6, q: 1, reply: 'Der Clip wird geteilt.' }
        ] }
      ],
      result(S) { return { rows: [['Rede', S.meter >= 60 ? 'stark' : S.meter >= 40 ? 'ordentlich' : 'schwach']], headline: S.meter >= 60 ? 'Starke Rede im Bundestag' : 'Debatte ohne Echo' }; }
    };
  }

  // ---------- ❓ Regierungsbefragung ----------
  function befragung(ctx) {
    const h = helpers(ctx);
    return {
      intro: 'Regierungsbefragung im Bundestag (§ 106 GOBT, Anlage 7): ' + h.chanc + ' stellt sich den Fragen der Abgeordneten. Eure Fraktion hat zwei Fragen – Thema ' + h.tName + '.',
      meter: 'Bedrängnis der Regierung', meter0: 35,
      steps: [
        { title: 'Die erste Frage', text: 'Welche Frage stellt ihr?', options: [
          { label: 'Eine Detailfrage mit Zahlen', hint: 'Die Regierung muss sattelfest sein – ihr auch', roll: { p: h.skill, win: { m: 14, q: 1, reply: 'Die Kanzlerin muss passen: „Das reichen wir schriftlich nach.“' }, lose: { m: -6, q: -1, reply: 'Souveräne Antwort mit genaueren Zahlen als eure.' } } },
          { label: '„Ja oder nein: Halten Sie Ihr Versprechen?“', hint: 'Zwingt zur Festlegung', m: 10, q: 1, reply: 'Ein langes „Nun ja …“ – das Bild ist gesetzt.' },
          { label: 'Eine persönliche Frage nach Verantwortung', hint: 'Kann als unfair gelten', roll: { p: 0.45, win: { m: 16, q: 1, fx: { gov: 0.5 }, reply: 'Spürbare Verärgerung auf der Regierungsbank.' }, lose: { m: -8, q: -1, fx: { like: -0.03 }, reply: 'Buhrufe: „Unter der Gürtellinie!“' } } }
        ] },
        { title: 'Die Nachfrage', text: 'Die Antwort weicht aus. Ihr habt eine Nachfrage.', options: [
          { label: 'Nachhaken: „Sie haben meine Frage nicht beantwortet.“', hint: 'Druck erhöhen', m: 10, q: 1, reply: 'Das Ausweichen wird zum Thema des Tages.' },
          { label: 'Eine eigene Alternative vorstellen', hint: 'Konstruktiv', m: 4, q: 1, fx: { cred: 1 }, reply: 'Kommentatoren: „Die Opposition hat einen Plan.“' }
        ] }
      ],
      result(S) { return { rows: [['Regierung', S.meter >= 55 ? 'in Bedrängnis' : 'souverän']], headline: S.meter >= 55 ? 'Kanzlerin in der Regierungsbefragung unter Druck' : 'Regierungsbefragung ohne Folgen' }; }
    };
  }

  // ---------- ✊ Demonstration ----------
  function protest(ctx) {
    const h = helpers(ctx);
    return {
      intro: 'Großdemonstration zum Thema ' + h.tName + ' in Berlin. Anmeldung bei der Versammlungsbehörde ist erledigt.',
      meter: 'Teilnehmende (Tausend)', meter0: 20,
      steps: [
        { title: 'Das Motto', text: 'Unter welchem Motto ruft ihr auf?', options: [
          { label: 'Breit und anschlussfähig', hint: 'Verbände und Kirchen machen mit', m: 14, q: 1, reply: 'Ein breites Bündnis unterzeichnet den Aufruf.' },
          { label: 'Zugespitzt gegen die Regierung', hint: 'Mobilisiert die eigenen Leute', m: 8, q: 1, fx: { unity: 2 }, reply: 'Die eigene Basis ist elektrisiert.' }
        ] },
        { title: 'Die Bühne', text: 'Wer spricht zum Abschluss?', options: [
          { label: 'Betroffene', hint: 'Authentisch', m: 8, q: 1, fx: { like: 0.03 }, reply: 'Tränen in den ersten Reihen.' },
          { label: 'Ein prominenter Musiker', hint: 'Zieht Publikum und Kameras', m: 14, q: 0, reply: 'Tausende kommen nur für das Konzert – aber sie sind da.' },
          { label: h.leader + ' selbst', hint: 'Bekanntheit für die Spitze', m: 6, q: 1, fx: { like: 0.05 }, reply: 'Die Rede ist laut, die Bilder stark.' }
        ] },
        { title: '⚠️ Gegendemonstration', text: 'Am Rand provozieren Gegendemonstranten, die Polizei zieht Kräfte zusammen.', options: [
          { label: 'Ordner einsetzen und deeskalieren', hint: 'Friedliche Bilder', m: 4, q: 1, reply: 'Die Demo bleibt friedlich – das ist die Nachricht.' },
          { label: 'Laut dagegenhalten', hint: 'Riskant', roll: { p: 0.5, win: { m: 6, q: 1, reply: 'Die Gegendemo wird übertönt.' }, lose: { m: -10, q: -2, reply: 'Rangeleien – die Abendnachrichten zeigen nur das.' } } }
        ] }
      ],
      result(S) { return { rows: [['Teilnehmende', Math.max(2, Math.round(S.meter * 1.5)) + '.000 (laut Veranstalter)']], headline: S.meter >= 45 ? 'Zehntausende demonstrieren' : 'Demonstration mit mäßigem Zulauf' }; }
    };
  }

  const BUILDERS = { regerkl, presse: regerkl, koaausschuss, reise, ua, antrag: debatte, aktuelle: debatte, befragung, protest };
  function build(id, ctx) {
    const b = BUILDERS[id];
    return b ? b(Object.assign({ id }, ctx)) : null;
  }
  const TS = { build, has: id => !!BUILDERS[id] };
  if (typeof module !== 'undefined' && module.exports) module.exports = TS; else root.BTW_TERMSCENES = TS;
})(this);
