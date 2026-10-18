/*
 * Szenen für die Wahlkampf-Aktionen: Jede Aktion fühlt sich anders an – eigene Entscheidungen, eigenes Risiko,
 * eigene Ergebniskarte. Ohne DOM; die Oberfläche (ui.js) spielt die Schritte ab.
 *
 * Eine Szene: { intro, meter (Name der Anzeige oder null), steps: [...], result(state, res) → { rows, headline } }.
 * Schritt: { title, text, options: [{ label, hint, m, q, fx, reply, roll }] } – m = Anzeige, q = Wirkung (±15 % je Punkt),
 * roll = { p, win: {...}, lose: {...} } für riskante Antworten. Sonderschritte: { kind: 'cq', topic } (Bürgerfrage),
 * { kind: 'quiz', q, a, c, e } (Wissensfrage).
 */
(function (root) {
  const FRINGE = ['afd', 'linke', 'bsw'];
  // Städte für Auftritte (größte Stadt oder Landeshauptstadt).
  const CITY = { BW: 'Stuttgart', BY: 'München', BE: 'Berlin', BB: 'Potsdam', HB: 'Bremen', HH: 'Hamburg', HE: 'Frankfurt', MV: 'Rostock',
    NI: 'Hannover', NW: 'Dortmund', RP: 'Mainz', SL: 'Saarbrücken', SN: 'Leipzig', ST: 'Magdeburg', SH: 'Kiel', TH: 'Erfurt' };
  // Typische Betriebe je Land (Industrieschwerpunkte).
  const COMPANY = { BW: 'einem Autozulieferer bei Stuttgart', BY: 'einem Maschinenbauer in Franken', NW: 'einem Stahlwerk in Duisburg', NI: 'einem Zulieferer bei Wolfsburg',
    HE: 'dem Chemiepark Frankfurt-Höchst', RP: 'einem Chemiewerk bei Ludwigshafen', SL: 'der Stahlhütte in Völklingen', SN: 'einer Chipfabrik in Dresden',
    TH: 'einem Optikbetrieb in Jena', ST: 'dem Chemiepark Leuna', BB: 'einer Batteriefabrik in der Lausitz', MV: 'einer Werft in Rostock',
    SH: 'einem Windanlagenbauer bei Husum', HH: 'einem Hafenlogistiker in Hamburg', HB: 'einem Flugzeugwerk in Bremen', BE: 'einer Fabrik in Berlin-Adlershof' };
  const SHOWS = ['Markus Lanz', 'Maischberger', 'Hart aber fair', 'Maybrit Illner', 'Caren Miosga'];
  const pickR = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function helpers(ctx) {
    const { g, E, D } = ctx;
    const P = E.party(g.party);
    const progOpt = t => D.PROGRAM[t][g.program ? g.program.positions[t] : 1];
    return {
      fringe: FRINGE.indexOf(g.party) !== -1,
      comp: t => (E.competenceOf(g, g.party)[t] || 40),
      like: () => (g.cand ? g.cand.like : 0),
      lean: t => (g.program ? progOpt(t).lean : P.lean[t]),
      fit: (t, lean) => { const d = Math.abs((g.program ? progOpt(t).lean : P.lean[t]) - lean); return d === 0 ? 1 : d === 1 ? 0 : -1; },
      progOpt,
      core: t => !!(g.program && g.program.core.indexOf(t) !== -1),
      stateTops: st => (st ? E.stateTopTopics(st.id, 3) : []),
      city: st => (st ? CITY[st.id] : 'der Stadt')
    };
  }

  // ---------- 📣 Kundgebung: Rede-Baukasten ----------
  function kundgebung(ctx) {
    const { g, D, st, tp } = ctx;
    const h = helpers(ctx);
    const topic = tp ? tp.id : (g.program ? g.program.core[0] : 'wirtschaft');
    const tName = D.TOPICS.find(x => x.id === topic).name;
    const opt = h.progOpt(topic);
    const hot = h.stateTops(st).indexOf(topic) !== -1;
    const like = h.like();
    const year = (g.year || 2029) + 4;
    const steps = [
      { title: 'Der Einstieg', text: 'Tausende Menschen auf dem Marktplatz in ' + h.city(st) + '. Die Kameras laufen. Wie beginnt ' + ctx.cand + '?', options: [
        { label: '„Schön, wieder in ' + h.city(st) + ' zu sein!“', hint: 'Lokaler Bezug – solide', m: 8, q: 1, reply: 'Freundlicher Applaus. Die Menge ist bei dir.' },
        { label: 'Mit einem Witz einsteigen', hint: 'Zündet nur, wenn man dich mag', roll: { p: clamp(0.45 + 0.12 * like, 0.15, 0.85), win: { m: 14, q: 1, reply: 'Lachen auf dem ganzen Platz – der Funke springt über.' }, lose: { m: -6, q: -1, reply: 'Betretenes Schweigen. Der Witz kam nicht an.' } } },
        { label: 'Direkt zur Sache: die Lage im Land', hint: hot ? 'Hier brennt das Thema ' + tName : 'Ernst und sachlich', m: hot ? 10 : 3, q: hot ? 1 : 0, reply: hot ? 'Zustimmendes Nicken – das Thema bewegt die Menschen hier.' : 'Aufmerksam, aber noch etwas kühl.' }
      ] },
      { title: 'Die Kernbotschaft', text: 'Jetzt kommt der Kern der Rede zum Thema ' + tName + '.', options: [
        { label: 'Euer Versprechen: „' + opt.label + '“', hint: 'Programm konkret', m: Math.round(6 + 20 * opt.pop + (h.core(topic) ? 4 : 0)), q: opt.pop >= 0.2 ? 1 : 0, reply: opt.pop >= 0.2 ? 'Jubel – ein Versprechen, das ankommt.' : 'Gemischte Reaktionen – das Thema spaltet.' },
        { label: 'Eine Geschichte aus ' + (st ? st.name : 'dem Land') + ' erzählen', hint: 'Menschen statt Zahlen', m: 10, q: 1, fx: { like: 0.05 }, reply: 'Es wird still – dann großer Applaus. Die Geschichte berührt.' },
        { label: 'Den politischen Gegner attackieren', hint: h.fringe ? 'Euer Publikum liebt das' : 'Heizt an – kann in der Mitte schaden', m: h.fringe ? 16 : 11, q: h.fringe ? 1 : 0, fx: { like: h.fringe ? 0 : -0.08 }, reply: 'Die Menge tobt. Ob das in den Abendnachrichten gut aussieht?' }
      ] },
      { title: 'Der Schluss', text: 'Noch zwei Minuten. Womit schickt ' + ctx.cand + ' die Menschen nach Hause?', options: [
        { label: '„Geht wählen – jede Stimme zählt!“', hint: 'Mobilisiert eure Anhänger', m: 6, q: 1, fx: { mob: 0.006 }, reply: 'Alle machen mit beim Schlusschor.' },
        { label: 'Eine Vision: „Deutschland ' + year + '“', hint: 'Wirkt, wenn man dir glaubt', m: like > 0 ? 10 : 3, q: like > 0 ? 1 : 0, reply: like > 0 ? 'Gänsehaut-Moment.' : 'Höflicher Applaus.' },
        { label: 'Kampfansage zum Schluss', hint: 'Laut und polarisierend', m: 9, q: h.fringe ? 1 : 0, fx: { like: h.fringe ? 0 : -0.05 }, reply: 'Laute Sprechchöre.' }
      ] }
    ];
    if (Math.random() < 0.3) {
      steps.splice(2, 0, { title: '⚠️ Störer!', text: 'Eine Gruppe pfeift, ein Ei fliegt knapp am Rednerpult vorbei. Alle Kameras schwenken herum.', options: [
        { label: 'Gelassen kontern: „Auch Sie sind herzlich eingeladen, zuzuhören!“', hint: 'Souverän', m: 12, q: 1, fx: { like: 0.1 }, reply: 'Großer Applaus – das wird das Bild des Tages.' },
        { label: 'Den Sicherheitsdienst eingreifen lassen', hint: 'Sicher, aber kühl', m: -3, q: 0, reply: 'Die Störer werden hinausbegleitet. Die Stimmung leidet etwas.' },
        { label: 'Scharf zurückschießen', hint: h.fringe ? 'Die eigene Basis feiert' : 'Riskant', m: h.fringe ? 6 : -8, q: h.fringe ? 0 : -1, fx: { like: h.fringe ? 0 : -0.1 }, reply: h.fringe ? 'Die Anhänger jubeln.' : 'Die Szene wirkt gereizt – kein gutes Bild.' }
      ] });
    }
    return {
      intro: 'Großkundgebung in ' + h.city(st) + '. Bau die Rede aus drei Teilen – die Menge reagiert auf jeden Satz.',
      meter: 'Stimmung auf dem Platz', meter0: 45, steps,
      result(s, res) {
        const share = res && res.info && res.info.stateShare ? res.info.stateShare : 15;
        const crowd = Math.round((800 + share * 220) * (0.6 + s.meter / 100) / 100) * 100;
        const headline = s.meter >= 75 ? 'Jubel in ' + h.city(st) + ': ' + crowd.toLocaleString('de-DE') + ' feiern ' + ctx.cand
          : s.meter >= 50 ? 'Volle Reihen beim Auftritt von ' + ctx.cand + ' in ' + h.city(st) : 'Verhaltener Auftritt von ' + ctx.cand + ' in ' + h.city(st);
        return { rows: [['Menschen auf dem Platz', crowd.toLocaleString('de-DE')], ['Stimmung', Math.round(s.meter) + '/100'], ['Bild des Tages', s.flags.stoerer ? 'Die Szene mit den Störern' : s.meter >= 70 ? 'Fahnenmeer vor der Bühne' : 'Halbvoller Platz']], headline };
      }
    };
  }

  // ---------- 🏭 Betriebsbesuch: Werksrundgang ----------
  function betrieb(ctx) {
    const { st } = ctx;
    const h = helpers(ctx);
    const where = (st && COMPANY[st.id]) || 'einem Mittelständler';
    const steps = [
      { title: 'Der Betriebsrat', text: 'Die Betriebsratsvorsitzende: „Unsere Leute haben Angst um ihre Jobs. Was tun Sie für den Standort?“', options: [
        { label: 'Standortgarantie, notfalls mit Staatshilfe', hint: 'Bei der Belegschaft beliebt', m: 8, q: h.fit('wirtschaft', -1) + 1 > 1 ? 1 : 0, fx: { groups: { arbeiter: 0.4 } }, reply: 'Kräftiges Nicken in der Runde.' },
        { label: 'Ehrlich sein: Der Wandel kommt – wir sichern Weiterbildung', hint: 'Unbequem, aber glaubwürdig', m: 5, q: 1, fx: { groups: { arbeiter: 0.2, angest: 0.2 } }, reply: '„Endlich mal jemand, der nicht drumherumredet.“' },
        { label: 'Tarifbindung stärken', hint: 'Gewerkschaftsnah', m: 6, q: h.fit('soziales', -1) >= 0 ? 1 : 0, fx: { groups: { arbeiter: 0.3 } }, reply: 'Der Betriebsrat ist zufrieden.' }
      ] },
      { title: 'Die Geschäftsführung', text: 'Der Geschäftsführer: „Energiepreise und Bürokratie bringen uns um. Wir überlegen, ins Ausland zu gehen.“', options: [
        { label: 'Strompreise runter, Bürokratie abbauen', hint: 'Wirtschaftsfreundlich', m: 6, q: h.fit('wirtschaft', 1) >= 0 ? 1 : 0, fx: { groups: { selbst: 0.4 } }, reply: '„Das hören wir gern – jetzt muss es nur kommen.“' },
        { label: 'Investitionsprämie für klimafreundliche Technik', hint: 'Modernisieren statt abwandern', m: 5, q: h.fit('klima', 0) >= 0 ? 1 : 0, fx: { groups: { selbst: 0.2, hoch: 0.2 } }, reply: 'Interessiertes Nachfragen.' },
        { label: '„Dann zahlen Sie Ihre Leute auch anständig!“', hint: 'Applaus in der Halle, Frost im Büro', m: 4, q: h.fit('soziales', -1) >= 0 ? 0 : -1, fx: { groups: { arbeiter: 0.3, selbst: -0.3 } }, reply: 'Die Belegschaft grinst, der Chef nicht.' }
      ] },
      { title: 'Die Azubine', text: 'Eine Auszubildende am Band: „Ich finde hier keine bezahlbare Wohnung. Wie soll ich bleiben?“', options: [
        { label: 'Azubi-Wohnheime fördern', hint: 'Konkret', m: 7, q: 1, fx: { groups: { jung: 0.4 } }, reply: '„Das wäre echt eine Hilfe.“' },
        { label: 'Mehr bauen, weniger Vorschriften', hint: 'Angebot schaffen', m: 5, q: h.fit('wohnen', 1) >= 0 ? 1 : 0, fx: { groups: { jung: 0.2 } }, reply: 'Sie nickt – überzeugt wirkt sie nicht ganz.' },
        { label: 'Mieten deckeln', hint: 'Mieterschutz', m: 6, q: h.fit('wohnen', -1) >= 0 ? 1 : 0, fx: { groups: { jung: 0.3 } }, reply: 'Kollegen klatschen.' }
      ] }
    ];
    if (Math.random() < 0.2) {
      steps.splice(1, 0, { title: '⚠️ Eilmeldung', text: 'Mitten im Rundgang: Der Konzern kündigt an, 800 Stellen am Standort abzubauen. Die Belegschaft ist geschockt.', options: [
        { label: 'Sofort mit dem Betriebsrat vor die Belegschaft', hint: 'Haltung zeigen', m: 12, q: 1, fx: { groups: { arbeiter: 0.6 }, like: 0.1 }, reply: 'Die Bilder gehen durchs Land: ' + ctx.cand + ' an der Seite der Beschäftigten.' },
        { label: 'Statement: Die Politik muss bessere Rahmenbedingungen setzen', hint: 'Sachlich', m: 0, q: 0, reply: 'Korrekt, aber blass.' },
        { label: 'Den Termin abbrechen', hint: 'Kein Risiko – aber …', m: -12, q: -2, reply: 'Die Schlagzeile: „Kandidatur flieht vor der Belegschaft“.' }
      ] });
    }
    return {
      intro: 'Werksbesuch bei ' + where + '. Drei Gespräche – drei Interessen. Wem gibst du was?',
      meter: 'Stimmung in der Halle', meter0: 45, steps,
      result(s) {
        const rec = s.q >= 2;
        return { rows: [['Betriebsrat', rec ? '✅ lobt euch öffentlich' : s.q >= 0 ? '😐 abwartend' : '❌ enttäuscht'], ['Stimmung in der Halle', Math.round(s.meter) + '/100'], ['Ort', where.replace(/^einem |^einer |^dem |^der /, '')]],
          headline: rec ? ctx.cand + ' punktet bei ' + where.replace(/^einem |^einer |^dem |^der /, '') : 'Kühler Empfang für ' + ctx.cand + ' bei ' + where.replace(/^einem |^einer |^dem |^der /, '') };
      }
    };
  }

  // ---------- 🛋️ Talkshow: Schlagabtausch ----------
  function talkshow(ctx) {
    const { g, E, D, tp } = ctx;
    const h = helpers(ctx);
    const topic = tp ? tp.id : 'wirtschaft';
    const tName = D.TOPICS.find(x => x.id === topic).name;
    const show = pickR(SHOWS);
    const rivals = ['union', 'spd', 'gruene', 'afd', 'linke', 'fdp', 'bsw'].filter(p => p !== g.party);
    const rival = ctx.rival && ctx.rival !== g.party ? ctx.rival : pickR(rivals.slice(0, 4));
    const rName = E.party(rival).short;
    // Schwächstes wichtiges Thema: dort greift der Gegner an.
    const weak = D.TOPICS.map(x => x.id).sort((a, b) => (h.comp(a) - g.salience[a] * 300) - (h.comp(b) - g.salience[b] * 300))[0];
    const wName = D.TOPICS.find(x => x.id === weak).name;
    const c = h.comp(topic);
    const like = h.like();
    const opt = h.progOpt(topic);
    return {
      intro: 'Live bei „' + show + '“. In der Runde sitzt auch jemand von ' + rName + '. Jede Antwort entscheidet über die Stimmung im Netz.',
      meter: 'Stimmung im Netz', meter0: 50, show, rival,
      steps: [
        { title: 'Die erste Frage', text: '„' + ctx.cand + ', reden wir über ' + tName + '. Was ist Ihr Plan?“', options: [
          { label: 'Mit Fakten und Zahlen antworten', hint: c >= 55 ? 'Euer starkes Thema' : 'Hier seid ihr nicht sattelfest', m: c >= 55 ? 12 : -6, q: c >= 55 ? 1 : -1, reply: c >= 55 ? 'Präzise und souverän.' : 'Die Moderation hakt nach – es wird wackelig.' },
          { label: 'Mit einem Beispiel aus dem Leben', hint: 'Emotion – wirkt, wenn man dich mag', m: like >= 0.3 ? 10 : 2, q: like >= 0.3 ? 1 : 0, reply: like >= 0.3 ? 'Das Publikum hängt an deinen Lippen.' : 'Nett, aber etwas dünn.' },
          { label: 'Gegenfrage an ' + rName, hint: 'Riskant, aber spektakulär', roll: { p: 0.5, win: { m: 16, q: 2, flag: 'clip', reply: 'Treffer! ' + rName + ' ringt um Worte.' }, lose: { m: -10, q: -1, flag: 'clip', reply: 'Die Gegenfrage verpufft – du wirkst ausweichend.' } } }
        ] },
        { title: 'Die Attacke', text: rName + ' greift an: „Beim Thema ' + wName + ' haben Sie doch überhaupt nichts vorzuweisen!“', options: [
          { label: 'Mit Zahlen widerlegen', hint: h.comp(weak) >= 50 ? 'Ihr kennt euch aus' : 'Gefährlich – das ist eure Schwachstelle', m: h.comp(weak) >= 50 ? 10 : -8, q: h.comp(weak) >= 50 ? 1 : -1, reply: h.comp(weak) >= 50 ? 'Angriff abgewehrt.' : 'Eine falsche Zahl – der Faktencheck wird gnadenlos.' },
          { label: 'Elegant zum eigenen Thema lenken', hint: 'Sicher, wenn ihr dort stark seid', m: h.core(topic) ? 8 : 3, q: h.core(topic) ? 1 : 0, reply: 'Geschickt umgelenkt.' },
          { label: 'Persönlich zurückschießen', hint: h.fringe ? 'Eure Anhänger feiern es' : 'Kann viral gehen – so oder so', roll: { p: h.fringe ? 0.6 : 0.4, win: { m: 14, q: 1, flag: 'clip', reply: 'Der Konter sitzt – das Studio raunt.' }, lose: { m: -14, q: -2, flag: 'clip', reply: 'Unter der Gürtellinie – das Publikum buht.' } } }
        ] },
        { title: 'Die Schlussrunde', text: '„Zum Schluss: Was sollen die Zuschauer heute Abend mitnehmen?“', options: [
          { label: 'Euer Versprechen: „' + opt.label + '“', hint: 'Klar und konkret', m: opt.pop >= 0.2 ? 8 : 2, q: opt.pop >= 0.2 ? 1 : 0, reply: 'Ein klarer Satz, der hängen bleibt.' },
          { label: 'Ein Appell an die Zuschauer', hint: 'Persönlich', m: 6, q: 1, reply: 'Warm und nahbar.' },
          { label: 'Nochmal gegen ' + rName + ' austeilen', hint: 'Letztes Wort – oder letzter Fehler', m: h.fringe ? 6 : -2, q: 0, flag: 'clip', reply: 'Das Studio ist gespalten.' }
        ] }
      ],
      result(s) {
        const won = s.meter >= 60;
        let clip = null;
        if (s.flags.clip && Math.random() < 0.35) clip = s.meter >= 55 ? 'Euer Konter geht viral: über eine Million Aufrufe.' : 'Ein Ausschnitt geht viral – leider gegen euch.';
        s.fx.force = won ? 'win' : s.meter < 45 ? 'lose' : null;
        if (clip) s.fx.viral = s.meter >= 55 ? 1 : -1;
        return { rows: [['Sendung', show], ['Gegenüber', rName], ['Netzstimmung', Math.round(s.meter) + ' % positiv'], ['Ergebnis', won ? '🏆 Abend gewonnen' : s.meter >= 45 ? '😐 unentschieden' : '❌ Abend verloren']].concat(clip ? [['Clip', clip]] : []),
          headline: won ? ctx.cand + ' dominiert bei „' + show + '“' : s.meter >= 45 ? 'Schlagabtausch ohne Sieger bei „' + show + '“' : ctx.cand + ' gerät bei „' + show + '“ ins Schwimmen' };
      }
    };
  }

  // ---------- 🎤 Pressekonferenz: Fangfragen ----------
  function presse(ctx) {
    const { g, E, D, tp } = ctx;
    const h = helpers(ctx);
    const topic = tp ? tp.id : 'wirtschaft';
    const tName = D.TOPICS.find(x => x.id === topic).name;
    const c = h.comp(topic);
    const fw = E.fwLevel ? E.fwLevel(g, g.party) : 0;
    const traps = [
      { title: 'Die Koalitionsfrage', text: '„Schließen Sie eine Zusammenarbeit mit der AfD kategorisch aus – auch eine Tolerierung?“', options: g.party === 'afd' ? [
        { label: '„Wir sind offen für jeden, der mit uns Politik für Deutschland macht.“', m: 4, q: 1, reply: 'Erwartbar – kein Aufreger.' },
        { label: '„Die anderen werden noch auf uns zukommen.“', m: 2, q: 0, reply: 'Selbstbewusst, aber provokant.' },
        { label: '„Kein Kommentar.“', m: -6, q: -1, reply: 'Wirkt unsicher.' }
      ] : [
        { label: '„Ja. Ohne Wenn und Aber.“', hint: fw >= 2 ? 'Widerspricht eurer Linie' : 'Klar', m: fw >= 2 ? -10 : 8, q: fw >= 2 ? -2 : 1, reply: fw >= 2 ? 'Ein Journalist hält euch das eigene Angebot vor – peinlich.' : 'Klar und glaubwürdig.' },
        { label: '„Wir spekulieren nicht über Koalitionen.“', hint: 'Ausweichen', m: -4, q: -1, reply: '„Also schließen Sie es nicht aus?“ – genau diese Schlagzeile wollt ihr nicht.' },
        { label: '„Wir reden mit allen demokratischen Parteien.“', hint: 'Klar, aber diplomatisch', m: 4, q: fw >= 2 ? 0 : 1, reply: 'Saubere Antwort.' }
      ] },
      { title: 'Die Steuerfrage', text: '„Wollen Sie die Steuern erhöhen? Ja oder nein?“', options: [
        { label: 'Klare Antwort nach eurem Programm', hint: 'Ehrlich', m: 8, q: 1, reply: 'Klarheit wird belohnt.' },
        { label: '„Das hängt von der Haushaltslage ab.“', hint: 'Ausweichend', m: -5, q: -1, reply: 'Die Schlagzeile: „Kandidatur schließt Steuererhöhung nicht aus“.' },
        { label: '„Mit uns gibt es keine Steuererhöhungen – für niemanden!“', hint: 'Riskant, wenn euer Programm etwas anderes sagt', m: h.lean('finanzen') >= 0 ? 8 : -10, q: h.lean('finanzen') >= 0 ? 1 : -2, reply: h.lean('finanzen') >= 0 ? 'Ein klares Versprechen.' : 'Ein Journalist zitiert euer Programm – Widerspruch!' }
      ] },
      { title: 'Der Streit im Team', text: '„Ihr Generalsekretär hat Ihnen gestern öffentlich widersprochen. Wer bestimmt eigentlich Ihren Kurs?“', options: [
        { label: '„Ich. Und das Team steht geschlossen.“', hint: 'Führungsstärke', m: 8, q: 1, reply: 'Souverän.' },
        { label: '„Das war ein Missverständnis.“', hint: 'Abwiegeln', m: -2, q: 0, reply: 'Glaubt euch keiner so richtig.' },
        { label: '„Fragen Sie ihn doch selbst.“', hint: 'Gereizt', m: -10, q: -2, reply: 'Die Schlagzeile schreibt sich von selbst: „Machtkampf!“' }
      ] }
    ];
    const rumor = pickR(['Nebeneinkünfte aus Vorträgen', 'einen Dienstwagen für private Fahrten', 'Ungereimtheiten im Lebenslauf']);
    return {
      intro: 'Bundespressekonferenz zum Thema ' + tName + '. Drei Fragen – eine davon ist eine Falle.',
      meter: 'Eindruck bei den Journalisten', meter0: 50,
      steps: [
        { title: 'Die Sachfrage', text: '„Was genau planen Sie beim Thema ' + tName + '?“', options: [
          { label: 'Konkret und mit Zahlen', hint: c >= 50 ? 'Ihr seid vorbereitet' : 'Dünnes Eis', m: c >= 50 ? 12 : -6, q: c >= 50 ? 1 : -1, reply: c >= 50 ? 'Die Journalisten schreiben eifrig mit.' : 'Eine Zahl stimmt nicht – sofort korrigiert ein Reporter.' },
          { label: 'Die großen Linien erklären', hint: 'Sicher, aber blass', m: 4, q: 0, reply: 'Solide, nichts Neues.' },
          { label: 'Erst einmal die Regierung angreifen', hint: 'Lenkt ab', m: h.fringe ? 6 : 0, q: 0, reply: '„Das war nicht die Frage …“' }
        ] },
        pickR(traps),
        { title: 'Die persönliche Frage', text: '„Stimmt es, dass es Fragen gibt zu ' + rumor + '?“', options: [
          { label: 'Alles offenlegen', hint: 'Transparenz', m: 8, q: 1, reply: 'Damit ist die Geschichte erledigt.' },
          { label: 'Entschieden dementieren', hint: 'Hoffentlich stimmt es …', roll: { p: 0.65, win: { m: 6, q: 1, reply: 'Die Geschichte fällt in sich zusammen.' }, lose: { m: -16, q: -2, flag: 'versprecher', reply: 'Am Abend tauchen Belege auf – das Dementi war ein Fehler.' } } },
          { label: '„Kein Kommentar.“', hint: 'Klingt nach Schuld', m: -8, q: -1, reply: 'Die Spekulationen gehen weiter.' }
        ] }
      ],
      result(s) {
        const head = s.flags.versprecher ? 'Dementi geplatzt: Neue Fragen an ' + ctx.cand : s.meter >= 65 ? ctx.cand + ' setzt das Thema ' + tName : s.meter >= 45 ? ctx.cand + ' stellt Pläne zu ' + tName + ' vor' : 'Holpriger Auftritt: ' + ctx.cand + ' weicht aus';
        return { rows: [['Eindruck bei den Journalisten', Math.round(s.meter) + '/100'], ['Fangfrage', s.flags.versprecher ? '❌ Dementi geplatzt' : s.meter >= 55 ? '✅ souverän gemeistert' : '😐 holprig']], headline: head };
      }
    };
  }

  // ---------- 🎙️ Bürgerdialog: Wutbürger und Fachfragen ----------
  function buerger(ctx) {
    const { st, tp } = ctx;
    const steps = [
      { title: 'Ein Zwischenruf', text: 'Ein Mann steht auf und ruft: „Ihr da oben habt doch keine Ahnung, wie es uns hier in ' + (st ? st.name : 'der Region') + ' geht!“ Die Kameras schwenken zu ihm.', options: [
        { label: 'Zuhören: „Erzählen Sie – ich will es wissen.“', hint: 'Empathie', m: 12, q: 1, fx: { like: 0.08 }, reply: 'Er erzählt von seiner Rente. Am Ende gibt er dir die Hand – Applaus.' },
        { label: 'Mit Fakten dagegenhalten', hint: 'Korrekt, aber kühl', m: 0, q: 0, reply: 'Er setzt sich murrend hin.' },
        { label: '„Lassen Sie mich bitte ausreden.“', hint: 'Abwiegeln', m: -10, q: -1, reply: 'Buhrufe aus dem Saal.' }
      ] }
    ];
    if (tp) steps.push({ kind: 'cq', topic: tp.id }, { kind: 'cq', topic: tp.id });
    return {
      intro: 'Offener Bürgerdialog' + (st ? ' in ' + st.name : '') + '. Kein Drehbuch – und die Menschen fragen nach.',
      meter: 'Stimmung im Saal', meter0: 50, steps,
      result(s) {
        return { rows: [['Stimmung im Saal', s.meter >= 65 ? '👏 Applaus' : s.meter >= 45 ? '😐 gemischt' : '👎 Buhrufe']].concat(s.cq.right + s.cq.wrong ? [['Fachfragen', s.cq.right + ' von ' + (s.cq.right + s.cq.wrong) + ' richtig']] : []),
          headline: s.meter >= 65 ? ctx.cand + ' stellt sich den Fragen der Bürger – und überzeugt' : s.meter >= 45 ? 'Bürgerdialog mit ' + ctx.cand + ': kritische Fragen, ehrliche Antworten' : 'Buhrufe beim Bürgerdialog mit ' + ctx.cand };
      }
    };
  }

  // ---------- 📻 Regionalinterview: Lokalwissen ----------
  function regional(ctx) {
    const { g, E, D, st, tp } = ctx;
    if (!st) return null;
    const qs = [];
    // Wer regiert im Land?
    const TD = root.BTW_TERMDATA;
    const govs = (g.world && g.world.laender) || (TD && TD.LAENDER) || {};
    if (govs[st.id]) {
      const name = list => list.map(p => (E.party(p) ? E.party(p).short : p)).join('-');
      const right = name(govs[st.id].gov);
      const others = Object.keys(govs).map(k => name(govs[k].gov)).filter((x, i, a) => x !== right && a.indexOf(x) === i);
      const a = [right].concat(others.sort(() => Math.random() - 0.5).slice(0, 3)).sort(() => Math.random() - 0.5);
      qs.push({ kind: 'quiz', q: 'Die Moderatorin: „Wer regiert eigentlich gerade hier in ' + st.name + '?“', a, c: a.indexOf(right), e: 'In ' + st.name + ' regiert ' + right + '.' });
    }
    // Was bewegt die Menschen im Land?
    const tops = E.stateTopTopics(st.id, 1);
    if (tops.length) {
      const right = D.TOPICS.find(x => x.id === tops[0]).name;
      const a = [right].concat(D.TOPICS.filter(x => x.id !== tops[0]).sort(() => Math.random() - 0.5).slice(0, 3).map(x => x.name)).sort(() => Math.random() - 0.5);
      qs.push({ kind: 'quiz', q: '„Was ist laut Umfragen das wichtigste Problem für die Menschen in ' + st.name + '?“', a, c: a.indexOf(right), e: 'Laut Landesumfragen steht in ' + st.name + ' das Thema ' + right + ' ganz oben.' });
    }
    // Wie viele Wahlkreise?
    const n = (E.WK_BY_STATE[st.id] || []).length;
    if (n) {
      const a = [n, n + 3, Math.max(1, n - 2), n * 2].map(String).filter((x, i, arr) => arr.indexOf(x) === i).sort(() => Math.random() - 0.5);
      qs.push({ kind: 'quiz', q: '„Wie viele Bundestagswahlkreise hat ' + st.name + '?“', a, c: a.indexOf(String(n)), e: st.name + ' hat ' + n + ' Wahlkreise.' });
    }
    const steps = qs.sort(() => Math.random() - 0.5).slice(0, 2);
    steps.push({ title: 'Die letzte Frage', text: '„Und was wollen Sie ganz konkret für ' + st.name + ' tun' + (tp ? ', gerade beim Thema ' + tp.name : '') + '?“', options: [
      { label: 'Ein konkretes Projekt im Land nennen', hint: 'Brücke, Klinik, Bahnstrecke', m: 10, q: 1, reply: 'Die Moderatorin nickt anerkennend.' },
      { label: 'Die Bundespolitik erklären', hint: 'Korrekt, aber fern', m: 0, q: 0, reply: 'Etwas abstrakt für das Landesradio.' },
      { label: 'Versprechen, sich zu kümmern', hint: 'Unverbindlich', m: -4, q: 0, reply: '„Das sagen alle.“' }
    ] });
    return {
      intro: 'Interview im Landesradio und in der Lokalzeitung von ' + st.name + '. Wer sich vor Ort nicht auskennt, blamiert sich.',
      meter: 'Eindruck bei den Hörern', meter0: 50, steps,
      result(s) {
        return { rows: [['Lokalwissen', s.quizRight + ' von ' + s.quizTotal + ' Fragen richtig'], ['Eindruck', Math.round(s.meter) + '/100']],
          headline: s.quizRight === s.quizTotal && s.meter >= 55 ? ctx.cand + ' kennt sich aus: starkes Interview im ' + st.name + '-Radio' : s.quizRight < s.quizTotal ? 'Peinlich: ' + ctx.cand + ' patzt bei Fragen zu ' + st.name : 'Interview mit ' + ctx.cand + ' im Landesradio' };
      }
    };
  }

  // ---------- Team-Aktionen: je eine echte Entscheidung ----------
  function plakate(ctx) {
    const { g, D, tp, st } = ctx;
    const h = helpers(ctx);
    const topic = tp ? tp.id : (g.program ? g.program.core[0] : 'wirtschaft');
    const tName = D.TOPICS.find(x => x.id === topic).name;
    const hot = h.stateTops(st).indexOf(topic) !== -1;
    const slogan = g.program && g.program.slogan ? g.program.slogan : 'Für dich.';
    return {
      intro: 'Plakatkampagne' + (st ? ' in ' + st.name : '') + '. Welches Motiv hängt an jeder Laterne?', meter: null, team: true,
      steps: [{ title: 'Das Motiv', text: 'Die Agentur hat drei Entwürfe. Der Slogan: „' + slogan + '“', options: [
        { label: '🙂 Das Gesicht von ' + ctx.cand, hint: h.like() > 0.4 ? 'Ihr habt ein beliebtes Gesicht' : 'Wer kennt sie/ihn schon?', q: h.like() > 0.4 ? 1 : 0, fx: { known: 0.03, motif: 'face' }, reply: 'Großflächig, freundlich, überall.' },
        { label: '📌 Das Thema ' + tName, hint: hot ? 'Trifft den Nerv im Land' : 'Sachlich', q: hot || h.core(topic) ? 1 : 0, fx: { motif: 'topic' }, reply: 'Eine klare Botschaft zu ' + tName + '.' },
        { label: '🥊 Attacke auf den Gegner', hint: 'Fällt auf – und provoziert', roll: { p: 0.7, win: { q: h.fringe ? 2 : 1, fx: { motif: 'attack' }, reply: 'Das Plakat ist Gesprächsthema.' }, lose: { q: -1, fx: { motif: 'attack' }, flag: 'satire', reply: 'Satiriker verballhornen das Plakat – es geht viral, aber gegen euch.' } } }
      ] }],
      result(s) {
        const m = s.fx.motif;
        return { rows: [['Motiv', m === 'face' ? 'Porträt von ' + ctx.cand : m === 'topic' ? 'Thema ' + tName : 'Attacke auf den Gegner'], ['Slogan', '„' + slogan + '“']].concat(s.flags.satire ? [['Achtung', 'Satire im Netz']] : []),
          poster: { slogan, motif: m, topic: tName, cand: ctx.cand }, headline: s.flags.satire ? 'Spott im Netz über neue Plakate' : 'Neue Plakate' + (st ? ' in ' + st.name : '') };
      }
    };
  }

  function tvspot(ctx) {
    const { D, tp, g } = ctx;
    const h = helpers(ctx);
    const topic = tp ? tp.id : 'wirtschaft';
    const tName = D.TOPICS.find(x => x.id === topic).name;
    const c = h.comp(topic);
    const sal = g.salience[topic] / D.SALIENCE0[topic];
    return {
      intro: 'Ein TV-Spot zum Thema ' + tName + ' zur besten Sendezeit. Welcher Ton?', meter: null, team: true,
      steps: [{ title: 'Der Ton des Spots', text: 'Die Fokusgruppe sitzt schon bereit.', options: [
        { label: '☀️ Positiv und zuversichtlich', hint: c >= 50 ? 'Ihr habt hier Kompetenz' : 'Wirkt nur mit Glaubwürdigkeit', q: c >= 50 ? 1 : 0, reply: c >= 50 ? 'Die Fokusgruppe: „Glaubwürdig.“' : 'Die Fokusgruppe: „Schön gemacht – aber trauen wir ihnen das zu?“' },
        { label: '⚠️ Sorgen ansprechen', hint: sal > 1.1 ? 'Das Thema brennt gerade' : 'Gerade kein Topthema', q: sal > 1.1 || h.fringe ? 1 : 0, reply: 'Die Fokusgruppe nickt ernst.' },
        { label: '😄 Mit Humor', hint: 'Bleibt hängen – oder floppt', roll: { p: 0.5, win: { q: 2, reply: 'Die Fokusgruppe lacht – der Spot wird geteilt.' }, lose: { q: -1, reply: 'Die Fokusgruppe findet es peinlich.' } } }
      ] }],
      result(s) { return { rows: [['Fokusgruppe', s.q >= 2 ? '🤩 begeistert' : s.q >= 1 ? '🙂 überzeugt' : s.q >= 0 ? '😐 unentschlossen' : '🙁 abgeschreckt']], headline: 'Neuer TV-Spot zum Thema ' + tName }; }
    };
  }

  function social(ctx) {
    const { D, tp } = ctx;
    const h = helpers(ctx);
    const tName = tp ? D.TOPICS.find(x => x.id === tp.id).name : 'eurem Thema';
    return {
      intro: 'Social-Media-Kampagne zu ' + tName + '. Welches Format?', meter: null, team: true,
      steps: [{ title: 'Das Format', text: 'Das Social-Team wartet auf grünes Licht.', options: [
        { label: '🎬 Kurzes Erklärvideo', hint: 'Solide Reichweite', q: 1, fx: { force: 'normal' }, reply: 'Gute Kommentare, ordentliche Reichweite.' },
        { label: '😂 Meme', hint: 'Viral – oder Shitstorm', roll: { p: 0.6, win: { q: 2, fx: { force: 'viral' }, reply: 'Das Meme verbreitet sich rasend schnell.' }, lose: { q: -1, fx: { force: 'shitstorm' }, reply: 'Shitstorm! Der Witz kommt gar nicht gut an.' } } },
        { label: '📡 Live-Fragestunde mit ' + ctx.cand, hint: h.like() > 0 ? 'Nahbar' : 'Riskant bei geringer Beliebtheit', q: h.like() > 0 ? 1 : -1, fx: { force: h.like() > 0 ? 'normal' : 'shitstorm', like: h.like() > 0 ? 0.05 : -0.05 }, reply: h.like() > 0 ? 'Tausende Fragen, gute Stimmung im Chat.' : 'Der Chat kippt – Trolle übernehmen.' }
      ] }],
      result(s) {
        const views = s.fx.force === 'viral' ? Math.round(1.5 + Math.random() * 3) * 1000000 : s.fx.force === 'shitstorm' ? Math.round(200 + Math.random() * 600) * 1000 : Math.round(150 + Math.random() * 300) * 1000;
        return { rows: [['Aufrufe', views.toLocaleString('de-DE')], ['Reaktionen', s.fx.force === 'shitstorm' ? '🔥 Shitstorm' : s.fx.force === 'viral' ? '🚀 viral' : '👍 überwiegend positiv']], headline: s.fx.force === 'viral' ? 'Viraler Hit: ' + views.toLocaleString('de-DE') + ' Aufrufe' : s.fx.force === 'shitstorm' ? 'Shitstorm im Netz' : 'Neue Social-Media-Kampagne' };
      }
    };
  }

  function haustuer(ctx) {
    const { g, D, st } = ctx;
    const h = helpers(ctx);
    const PEOPLE = [
      { who: 'Eine Rentnerin', ask: '„Reicht meine Rente noch?“', good: 'Über die Rente sprechen', bad: 'Ein Flyer zum Klimaschutz', alt: 'Zuhören und Kaffee trinken' },
      { who: 'Ein Student', ask: '„Warum ist Wohnen so teuer?“', good: 'Über Mieten und Wohnungsbau reden', bad: 'Über die Erbschaftsteuer reden', alt: 'Auf Instagram verweisen' },
      { who: 'Ein Handwerksmeister', ask: '„Die Bürokratie bringt mich um.“', good: 'Bürokratieabbau versprechen', bad: 'Mehr Kontrollen ankündigen', alt: 'Ihn zum Stammtisch einladen' },
      { who: 'Eine junge Mutter', ask: '„Ich finde keinen Kitaplatz.“', good: 'Über Kitaplätze reden', bad: 'Über die Bundeswehr reden', alt: 'Kurz und freundlich bleiben' },
      { who: 'Ein wütender Nachbar', ask: '„Ihr seid doch alle gleich!“', good: 'Ruhig bleiben und nachfragen', bad: 'Zurückschimpfen', alt: 'Höflich weitergehen' },
      { who: 'Ein Pendler', ask: '„Mein Zug fällt ständig aus.“', good: 'Über Bahn und Brücken reden', bad: 'Über das Tempolimit reden', alt: 'Ein Kugelschreiber zum Abschied' }
    ];
    const doors = PEOPLE.sort(() => Math.random() - 0.5).slice(0, 4);
    return {
      intro: 'Haustürwahlkampf' + (st ? ' in ' + st.name : '') + '. Vier Türen – vier Menschen. Wer sich angesprochen fühlt, geht wählen.', meter: null, team: true,
      steps: doors.map((d, i) => ({ title: 'Tür ' + (i + 1) + ' von ' + doors.length, text: d.who + ' öffnet: ' + d.ask, options: [
        { label: d.good, q: 0.75, fx: { door: 1 }, reply: 'Überzeugt! „Ich überlege es mir.“' },
        { label: d.alt, q: 0.25, reply: 'Freundlich, aber unverbindlich.' },
        { label: d.bad, q: -0.5, reply: 'Die Tür geht zu.' }
      ].sort(() => Math.random() - 0.5) })),
      result(s) { return { rows: [['Überzeugt', (s.fx.door || 0) + ' von ' + doors.length + ' Türen']], headline: 'Haustürwahlkampf' + (st ? ' in ' + st.name : '') }; }
    };
  }

  function spenden(ctx) {
    const DONORS = [
      { lobby: 'hausgrund', who: 'Ein Immobilienunternehmer', ask: 'dass Sie sich gegen eine Verschärfung der Mietpreisbremse stellen' },
      { lobby: 'bdi', who: 'Eine Industriellenfamilie', ask: 'dass Sie sich bei der Erbschaftsteuer für Familienunternehmen einsetzen' },
      { lobby: 'vda', who: 'Ein Autozulieferer', ask: 'dass Sie das Verbrenner-Aus noch einmal auf den Prüfstand stellen' },
      { lobby: 'pharma', who: 'Ein Pharmaunternehmer', ask: 'dass Sie die Preisregeln für neue Medikamente lockern' },
      { lobby: 'banken', who: 'Ein Bankier', ask: 'dass Sie die Finanztransaktionssteuer verhindern' }
    ];
    const dn = pickR(DONORS);
    return {
      intro: 'Spendendinner in einem Berliner Hotel. ' + dn.who + ' nimmt dich beiseite. (Großspenden über 35.000 € müssen sofort veröffentlicht werden.)', meter: null,
      steps: [{ title: 'Ein Angebot', text: '„Ich spende gern 300.000 Euro. Ich erwarte nur, ' + dn.ask + '.“', options: [
        { label: 'Annehmen', hint: 'Viel Geld und ein Freund im Verband – aber was, wenn das herauskommt?', q: 1, fx: { money: 1.6, scandal: 0.3, lobby: dn.lobby }, reply: 'Der Scheck ist unterschrieben.' },
        { label: 'Freundlich ablehnen: „Spenden ja, Bedingungen nein.“', hint: 'Weniger Geld, saubere Weste', q: 0, fx: { money: 0.8, like: 0.03 }, reply: 'Er spendet trotzdem – weniger.' },
        { label: 'Um eine Spende ohne Bedingungen bitten', hint: 'Verhandeln', roll: { p: 0.5, win: { q: 1, fx: { money: 1.2 }, reply: 'Er lacht und spendet trotzdem.' }, lose: { q: 0, fx: { money: 0.9 }, reply: 'Er spendet nur einen kleinen Betrag.' } } }
      ] }],
      result(s) { return { rows: [['Spende', s.fx.money >= 1.5 ? 'groß – mit Bedingung' : s.fx.money >= 1.1 ? 'ordentlich' : 'eher klein'], ['Risiko', s.fx.scandal ? 'Die Bedingung könnte bekannt werden' : 'keins']], headline: 'Spendendinner der ' + ctx.partyShort }; }
    };
  }

  function angriff(ctx) {
    const { g, E, D, tp, rival } = ctx;
    const h = helpers(ctx);
    const rv = rival && E.party(rival) ? rival : 'union';
    const tName = tp ? D.TOPICS.find(x => x.id === tp.id).name : null;
    const adv = tp ? h.comp(tp.id) - (E.competenceOf(g, rv)[tp.id] || 40) : 0;
    return {
      intro: 'Vergleichskampagne gegen ' + E.party(rv).name + (tName ? ' beim Thema ' + tName : '') + '. Welche Angriffslinie?', meter: null, team: true,
      steps: [{ title: 'Die Angriffslinie', text: 'Das Kampagnenteam hat drei Varianten vorbereitet.', options: [
        { label: '📊 Fakten: das Versagen von ' + E.party(rv).short + ' belegen', hint: adv > 0 ? 'Ihr habt hier die besseren Argumente' : 'Der Faktencheck könnte euch treffen', q: adv > 0 ? 1 : -1, fx: { force: adv > 0 ? 'win' : 'lose' }, reply: adv > 0 ? 'Der Faktencheck bestätigt euch.' : 'Der Faktencheck: „irreführend“.' },
        { label: '🎯 Persönlich: ' + (E.rivalName ? E.rivalName(g, rv) + ' (' + E.party(rv).short + ')' : 'die Spitze von ' + E.party(rv).short) + ' angreifen', hint: 'Hart – und riskant', roll: { p: h.fringe ? 0.55 : 0.4, win: { q: 2, fx: { force: 'win' }, reply: 'Die Kampagne sitzt.' }, lose: { q: -2, fx: { force: 'lose' }, reply: 'Schmutzkampagne! Die Empörung trifft euch selbst.' } } },
        { label: '😏 Satire', hint: 'Witzig ist mächtig', roll: { p: 0.55, win: { q: 1, fx: { force: 'win' }, reply: 'Das Netz lacht über ' + E.party(rv).short + '.' }, lose: { q: -1, fx: { force: 'lose' }, reply: 'Zu bemüht – die Satire verpufft.' } } }
      ] }],
      result(s) { return { rows: [['Faktencheck / Echo', s.fx.force === 'win' ? '✅ Treffer' : '❌ Bumerang']], headline: s.fx.force === 'win' ? 'Kampagne gegen ' + E.party(rv).short + ' sitzt' : 'Angriff auf ' + E.party(rv).short + ' geht nach hinten los' }; }
    };
  }

  const BUILDERS = { kundgebung, betrieb, talkshow, presse, buerger, regional, plakate, tvspot, social, haustuer, spenden, angriff };
  function build(actionId, ctx) {
    const b = BUILDERS[actionId];
    if (!b) return null;
    const s = b(ctx);
    return s;
  }

  const SC = { build, has: id => !!BUILDERS[id] };
  if (typeof module !== 'undefined' && module.exports) module.exports = SC; else root.BTW_SCENES = SC;
})(this);
