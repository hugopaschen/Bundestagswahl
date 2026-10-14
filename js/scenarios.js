/*
 * Szenarien zur Vorbereitung der Aktionen: je Aktion 10, vor jeder Aktion werden 3 gestellt.
 * s = Situation, o = drei Antworten (q: 1 gut, 0 mittel, -1 schlecht; f = Rückmeldung).
 * Platzhalter: {land}, {thema}, {kandidat}.
 */
(function (root) {
  var SCENARIOS = {
    "kundgebung": [
      {
        "s": "Zehn Minuten vor Beginn fällt die Lautsprecheranlage auf dem Marktplatz aus. Der Techniker braucht mindestens eine halbe Stunde für Ersatz, rund 400 Menschen warten bereits.",
        "o": [
          {
            "t": "Mit dem Megafon aus dem Kofferraum beginnen, das Publikum näher an die Bühne bitten und die Rede straffen.",
            "q": 1,
            "f": "Die improvisierte Nähe wirkt sympathisch – die Leute rücken zusammen und hören gebannt zu."
          },
          {
            "t": "Den Beginn um eine halbe Stunde verschieben und die Wartezeit mit Musik vom Handy überbrücken.",
            "q": 0,
            "f": "Die Anlage läuft am Ende, aber ein Teil des Publikums ist inzwischen weitergezogen."
          },
          {
            "t": "Ohne Verstärkung pünktlich die volle Rede halten – Präsenz zeigt Stärke.",
            "q": -1,
            "f": "Ab der dritten Reihe versteht niemand mehr etwas, die Leute wenden sich ab."
          }
        ]
      },
      {
        "s": "Mitten in der Rede setzt kräftiger Regen ein. Die Menge beginnt sich zu zerstreuen, am Rand des Platzes gibt es ein breites Vordach vor dem Rathaus.",
        "o": [
          {
            "t": "Schirme aus dem Materiallager verteilen lassen und wie geplant weitersprechen.",
            "q": 0,
            "f": "Ein harter Kern bleibt, aber die Schirme reichen nur für einen Bruchteil der Leute."
          },
          {
            "t": "Die Veranstaltung abbrechen und den Rest der Rede später als Video posten.",
            "q": -1,
            "f": "Der Abbruch wirkt wie Flucht – das Video sieht kaum jemand."
          },
          {
            "t": "Das Publikum unter das Rathausvordach einladen, selbst mitgehen und dort ohne Bühne kürzer weiterreden.",
            "q": 1,
            "f": "Der spontane Umzug sorgt für Applaus und starke Bilder vom Kandidaten mitten unter den Leuten."
          }
        ]
      },
      {
        "s": "Eine Gruppe von etwa zehn Personen mit Trillerpfeifen steht in der ersten Reihe und übertönt jeden zweiten Satz.",
        "o": [
          {
            "t": "Von der Bühne aus die Polizei auffordern, die Gruppe sofort vom Platz zu bringen.",
            "q": -1,
            "f": "Die Szene eskaliert, und die Bilder vom Polizeieinsatz dominieren die Berichterstattung."
          },
          {
            "t": "Die Gruppe kurz und gelassen ansprechen, mit einem trockenen Satz die Lacher auf die eigene Seite holen und die Ordner bitten, die Sicht freizuhalten.",
            "q": 1,
            "f": "Das Publikum stellt sich hinter Sie, die Pfeifer verlieren sichtlich die Lust."
          },
          {
            "t": "Die Störer konsequent ignorieren und einfach lauter sprechen.",
            "q": 0,
            "f": "Sie kommen durch die Rede, doch viele Passagen gehen im Lärm unter."
          }
        ]
      },
      {
        "s": "Kurz bevor Sie auf die Bühne gehen, bittet eine Lokalreporterin um ein fünfminütiges Interview. Der Zeitplan ist bereits knapp.",
        "o": [
          {
            "t": "Ein fertiges schriftliches Statement durch das Pressebüro schicken lassen.",
            "q": 0,
            "f": "Die Zeitung druckt ein paar Zeilen, aber ohne eigene Note."
          },
          {
            "t": "Das Interview fest für direkt nach der Rede zusagen und einen Ort dafür vereinbaren.",
            "q": 1,
            "f": "Die Reporterin bekommt Zeit und frische Eindrücke – der Artikel fällt ausführlich aus."
          },
          {
            "t": "Das Interview sofort geben, die Leute warten schon etwas.",
            "q": -1,
            "f": "Aus fünf werden fünfzehn Minuten, das Publikum wird unruhig und die Stimmung kippt."
          }
        ]
      },
      {
        "s": "Bei der Bühnenprobe am Nachmittag fällt auf: Zur Redezeit steht die Sonne genau hinter der Bühne. Fotos werden Gegenlicht haben, das Publikum blinzelt.",
        "o": [
          {
            "t": "Die Bühne um 90 Grad drehen lassen, auch wenn es eine Stunde Aufbau kostet.",
            "q": 1,
            "f": "Die Fotos werden hell und klar, das Publikum steht entspannt."
          },
          {
            "t": "Alles so lassen – kommt die Sonne halt von hinten.",
            "q": 0,
            "f": "Es klappt, aber die Pressefotos zeigen vor allem Silhouetten."
          },
          {
            "t": "Mit Sonnenbrille auftreten, damit man selbst nicht geblendet wird.",
            "q": -1,
            "f": "Das Foto mit dunkler Brille wirkt distanziert und macht im Netz als Meme die Runde."
          }
        ]
      },
      {
        "s": "Die Kundgebung findet in {land} statt. Die Redenschreiberin hat eine Standardrede vorbereitet, Sie haben noch 15 Minuten bis zum Auftritt.",
        "o": [
          {
            "t": "Mit einem lockeren Witz über den regionalen Dialekt einsteigen, das lockert auf.",
            "q": -1,
            "f": "Der Witz kommt als Spott von außen an – die ersten Buhrufe sind zu hören."
          },
          {
            "t": "Die Standardrede halten, sie ist erprobt und sauber formuliert.",
            "q": 0,
            "f": "Solide, aber austauschbar – niemand fühlt sich besonders angesprochen."
          },
          {
            "t": "Den Einstieg mit einem aktuellen, konkreten Problem aus der Region ersetzen, das die Leute vor Ort beschäftigt.",
            "q": 1,
            "f": "Sofort nicken Menschen im Publikum – Sie haben gezeigt, dass Sie wissen, wo Sie sind."
          }
        ]
      },
      {
        "s": "Bei großer Hitze bricht mitten in der Rede eine ältere Frau in der Menge zusammen. Nur wenige Umstehende bemerken es.",
        "o": [
          {
            "t": "Den Ordnern per Handzeichen Bescheid geben und weitersprechen, um keine Unruhe zu erzeugen.",
            "q": 0,
            "f": "Hilfe kommt, aber etwas verzögert, und einige Zuschauer finden Ihr Weiterreden befremdlich."
          },
          {
            "t": "Weiterreden – eine Unterbrechung würde die Dynamik der Rede zerstören.",
            "q": -1,
            "f": "Ein Handyvideo zeigt, wie Sie ungerührt weiterreden – es verbreitet sich rasant."
          },
          {
            "t": "Die Rede sofort unterbrechen, per Mikrofon Sanitäter rufen und eine Gasse bilden lassen.",
            "q": 1,
            "f": "Die Frau wird schnell versorgt, und Ihr ruhiges Handeln bringt Ihnen viel Respekt ein."
          }
        ]
      },
      {
        "s": "Auf derselben Platzseite ist kurzfristig eine Gegendemonstration mit rund 200 Teilnehmenden angemeldet worden.",
        "o": [
          {
            "t": "Zur Gegendemo hinübergehen und spontan eine Diskussion anbieten.",
            "q": -1,
            "f": "Die Situation wird unübersichtlich, die Polizei muss eingreifen und Ihre eigene Kundgebung leidet."
          },
          {
            "t": "Mit der Polizei Abstände und die Ausrichtung der Lautsprecher absprechen und die Ordner verstärken.",
            "q": 1,
            "f": "Beide Veranstaltungen laufen geordnet nebeneinander, Ihre Botschaft kommt durch."
          },
          {
            "t": "Die eigene Kundgebung um eine Stunde vorziehen, um der Gegendemo auszuweichen.",
            "q": 0,
            "f": "Es bleibt ruhig, doch viele Angemeldete kommen zur alten Zeit und verpassen alles."
          }
        ]
      },
      {
        "s": "Eine Stunde vor Beginn entdecken Sie einen peinlichen Tippfehler im großen Bühnenbanner.",
        "o": [
          {
            "t": "Den Fehler provisorisch mit Klebeband überkleben.",
            "q": 0,
            "f": "Aus der Nähe sieht man das Flickwerk, aber es fällt nur wenigen auf."
          },
          {
            "t": "Das Banner abhängen und stattdessen mit den Fahnen und Schildern des Ortsverbands dekorieren.",
            "q": 1,
            "f": "Die Bühne wirkt bodenständig, und kein Pressefoto zeigt den Fehler."
          },
          {
            "t": "Hängen lassen – bei der Menge achtet niemand auf jedes Wort.",
            "q": -1,
            "f": "Ein Zuschauer fotografiert das Banner, der Fehler wird zum Running Gag im Netz."
          }
        ]
      },
      {
        "s": "Erst am Vortag fällt auf, dass die Kundgebung genau zeitgleich mit dem Anpfiff eines wichtigen Länderspiels stattfindet.",
        "o": [
          {
            "t": "Den Beginn um eine Stunde vorziehen und die neue Zeit über alle Kanäle und die Lokalpresse bekanntgeben.",
            "q": 1,
            "f": "Der Platz ist gut gefüllt, und viele bedanken sich, dass sie das Spiel nicht verpassen."
          },
          {
            "t": "Am Termin festhalten – wer sich wirklich interessiert, kommt trotzdem.",
            "q": -1,
            "f": "Der Platz bleibt halb leer, und die Lokalzeitung titelt über die schwache Resonanz."
          },
          {
            "t": "Die Rede kürzen und versprechen, zwischendurch den Spielstand durchzusagen.",
            "q": 0,
            "f": "Die Idee kommt ganz gut an, aber viele schauen trotzdem lieber das Spiel."
          }
        ]
      }
    ],
    "buerger": [
      {
        "s": "Ein Rentner fragt sehr detailliert, wie sich ein bestimmter Rechenfaktor in der Rentenformel nach Ihren Plänen konkret verändern würde. Sie kennen die Zahl nicht auswendig.",
        "o": [
          {
            "t": "Eine plausible Größenordnung schätzen, um kompetent zu wirken.",
            "q": -1,
            "f": "Die Zahl ist falsch, und ein Faktencheck am nächsten Tag zitiert Sie genüsslich."
          },
          {
            "t": "Offen sagen, dass Sie die genaue Zahl nicht parat haben, und anbieten, sie ihm schriftlich nachzureichen.",
            "q": 1,
            "f": "Der Mann gibt Ihnen seine Adresse – und das Publikum honoriert die Ehrlichkeit."
          },
          {
            "t": "Die Grundsätze Ihrer Rentenpolitik erklären und die Detailfrage elegant umschiffen.",
            "q": 0,
            "f": "Die Antwort ist nicht falsch, aber der Fragesteller wirkt unzufrieden."
          }
        ]
      },
      {
        "s": "Ein Teilnehmer nutzt das Mikrofon für einen minutenlangen Monolog ohne erkennbare Frage. Im Saal wird schon gestöhnt.",
        "o": [
          {
            "t": "Ihn ausreden lassen – alles andere wirkt unhöflich.",
            "q": 0,
            "f": "Er fühlt sich gehört, aber für drei andere Fragen bleibt keine Zeit mehr."
          },
          {
            "t": "Die Technik bitten, das Saalmikrofon kurz abzudrehen.",
            "q": -1,
            "f": "Der Mann ruft „Zensur!“ – die Szene wird zum Gesprächsthema des Abends."
          },
          {
            "t": "Freundlich einhaken, sein Kernanliegen in einem Satz zusammenfassen, darauf antworten und an die Nächste übergeben.",
            "q": 1,
            "f": "Er nickt, der Saal ist erleichtert, und die Runde gewinnt wieder an Tempo."
          }
        ]
      },
      {
        "s": "Ein Journalist im Saal bemerkt laut, dass die Moderation bisher nur Fragen aus den Reihen bekannter Parteimitglieder aufgerufen hat.",
        "o": [
          {
            "t": "Für den Rest des Abends Fragekarten einsammeln und ziehen lassen – sichtbar für alle.",
            "q": 1,
            "f": "Die Fragen werden kritischer, aber der Abend gewinnt deutlich an Glaubwürdigkeit."
          },
          {
            "t": "Dem Journalisten versichern, die Auswahl sei rein zufällig gewesen.",
            "q": -1,
            "f": "Einige Mitglieder grinsen verlegen – der Bericht am nächsten Tag ist entsprechend bissig."
          },
          {
            "t": "Versprechen, kritischen Fragen am Ende eine eigene Runde zu geben.",
            "q": 0,
            "f": "Die Runde kommt, ist aber kurz – der Eindruck der Inszenierung bleibt teilweise."
          }
        ]
      },
      {
        "s": "Eine Frau erzählt unter Tränen, dass sie ihre demenzkranke Mutter seit Monaten allein pflegt und keinen Pflegeplatz findet.",
        "o": [
          {
            "t": "Ihr zuhören, ihre Belastung anerkennen, ehrlich sagen, was Sie politisch ändern wollen, und ihr nach der Veranstaltung einen Kontakt zur örtlichen Pflegeberatung geben.",
            "q": 1,
            "f": "Sie bedankt sich sichtlich bewegt – viele im Saal kennen ähnliche Geschichten."
          },
          {
            "t": "Ihr zusagen, sich persönlich um einen Platz für ihre Mutter zu kümmern.",
            "q": -1,
            "f": "Das Versprechen ist nicht haltbar – und weitere Betroffene fragen, warum nur sie Hilfe bekommt."
          },
          {
            "t": "Sachlich die Punkte Ihres Pflegeprogramms erläutern.",
            "q": 0,
            "f": "Inhaltlich korrekt, aber die Antwort wirkt kühl angesichts ihrer Lage."
          }
        ]
      },
      {
        "s": "Eine Teilnehmerin nennt bei einer Frage zum Thema {thema} eine Zahl, die nachweislich falsch ist. Ein Teil des Publikums applaudiert.",
        "o": [
          {
            "t": "Die falsche Zahl übergehen und direkt auf ihr eigentliches Anliegen eingehen.",
            "q": 0,
            "f": "Die Stimmung bleibt ruhig, aber die falsche Zahl steht unwidersprochen im Raum."
          },
          {
            "t": "Ihr Anliegen ernst nehmen, die Zahl ruhig korrigieren und die Quelle nennen.",
            "q": 1,
            "f": "Einige stutzen, doch Ihr respektvoller Ton überzeugt – auch die Fragestellerin nickt."
          },
          {
            "t": "Klarstellen, dass das schlicht Unsinn ist und man sich vorher informieren sollte.",
            "q": -1,
            "f": "Der Saal fühlt sich belehrt, der Applaus für die Fragestellerin wird noch lauter."
          }
        ]
      },
      {
        "s": "Der Livestream des Bürgerdialogs bricht nach 20 Minuten ab. Online schauen rund 300 Menschen zu, im Saal sind 120.",
        "o": [
          {
            "t": "Die Veranstaltung pausieren, bis der Stream wieder läuft.",
            "q": -1,
            "f": "Nach zwanzig Minuten Warten verlassen die ersten Gäste im Saal den Raum."
          },
          {
            "t": "Weitermachen, das Team zeichnet lokal auf und kündigt online an, dass die volle Aufzeichnung später kommt.",
            "q": 1,
            "f": "Der Saal bleibt bei der Sache, und das Video erreicht später sogar mehr Leute."
          },
          {
            "t": "Einfach weitermachen und den Stream sich selbst überlassen.",
            "q": 0,
            "f": "Im Saal läuft alles gut, online gibt es aber verärgerte Kommentare."
          }
        ]
      },
      {
        "s": "Eine Schülerin fragt: „Warum soll ich überhaupt wählen gehen, wenn sich sowieso nie etwas ändert?“",
        "o": [
          {
            "t": "Ein allgemeines Plädoyer für die Demokratie und das Wahlrecht halten.",
            "q": 0,
            "f": "Höflicher Applaus, aber die Schülerin wirkt nicht überzeugt."
          },
          {
            "t": "Lächelnd sagen, dass sie das mit etwas mehr Lebenserfahrung anders sehen wird.",
            "q": -1,
            "f": "Die jungen Leute im Saal verdrehen die Augen – der Satz wirkt herablassend."
          },
          {
            "t": "Ein konkretes Beispiel nennen, bei dem eine knappe Wahl vor Ort etwas verändert hat, und sie fragen, was sich für sie ändern müsste.",
            "q": 1,
            "f": "Es entsteht ein echtes Gespräch – und die Schülerin bleibt danach noch zum Reden."
          }
        ]
      },
      {
        "s": "Die geplante Zeit ist um, Ihr nächster Termin wartet. Noch immer sind zehn Hände oben.",
        "o": [
          {
            "t": "Offene Fragen auf Karten sammeln lassen, Antwort per Post oder Mail zusagen und noch fünf Minuten am Ausgang bleiben.",
            "q": 1,
            "f": "Niemand geht mit dem Gefühl, abgewimmelt worden zu sein – und Sie kommen fast pünktlich weg."
          },
          {
            "t": "Die Runde um 45 Minuten verlängern, bis alle drangekommen sind.",
            "q": 0,
            "f": "Der Saal ist zufrieden, doch der nächste Termin muss kurzfristig abgesagt werden."
          },
          {
            "t": "Pünktlich beenden – Zeitpläne sind nun mal Zeitpläne.",
            "q": -1,
            "f": "Unmut im Saal: „Fragen sind wohl doch nicht so erwünscht“, raunt es."
          }
        ]
      },
      {
        "s": "Sie verwechseln in einer Antwort den Namen des Ortes mit dem der Nachbargemeinde. Ein Zwischenruf korrigiert Sie, einige lachen.",
        "o": [
          {
            "t": "Behaupten, Sie hätten bewusst die Nachbargemeinde gemeint.",
            "q": -1,
            "f": "Niemand glaubt das – aus dem kleinen Versprecher wird eine peinliche Geschichte."
          },
          {
            "t": "Kurz selbst mitlachen, sich entschuldigen und weitermachen.",
            "q": 1,
            "f": "Die Selbstironie kommt gut an, der Versprecher ist schnell vergessen."
          },
          {
            "t": "Den Zwischenruf überhören und einfach weiterreden.",
            "q": 0,
            "f": "Es geht weiter, aber einige im Saal tuscheln noch eine Weile."
          }
        ]
      },
      {
        "s": "Ein Mann wird zunehmend aggressiv, beschimpft Sie persönlich und steht auf. Einige Gäste rücken unruhig von ihm ab.",
        "o": [
          {
            "t": "Ihn auf die Bühne bitten, um das direkt von Angesicht zu Angesicht auszudiskutieren.",
            "q": -1,
            "f": "Die Lage wird unberechenbar, die Ordner müssen ihn mühsam zurückhalten."
          },
          {
            "t": "Eine kurze Pause ansetzen und den Saal verlassen, bis sich die Lage beruhigt.",
            "q": 0,
            "f": "Es wird ruhiger, aber Ihr Abgang wirkt etwas unsouverän."
          },
          {
            "t": "Ruhig bleiben, eine klare Grenze ziehen und die Moderation bitten, mit den Ordnern zu übernehmen.",
            "q": 1,
            "f": "Der Mann wird hinausbegleitet, und Ihre Gelassenheit beeindruckt den Saal."
          }
        ]
      }
    ],
    "betrieb": [
      {
        "s": "In der Produktionshalle gelten Helm und Schutzbrille. Ihr Fotograf bittet Sie, beides für ein „schöneres“ Foto kurz abzunehmen.",
        "o": [
          {
            "t": "Die Ausrüstung anbehalten – auch auf allen Fotos.",
            "q": 1,
            "f": "Die Belegschaft registriert anerkennend, dass Sie die Regeln ernst nehmen."
          },
          {
            "t": "Für das Foto kurz in den Hof gehen und dort ohne Ausrüstung posieren.",
            "q": 0,
            "f": "Das Foto ist gut, wirkt aber weniger authentisch als die Bilder aus der Halle."
          },
          {
            "t": "Helm und Brille in der Halle nur für zwei Sekunden absetzen.",
            "q": -1,
            "f": "Die Sicherheitsfachkraft schreitet ein – und ein Mitarbeiter postet das Foto mit bissigem Kommentar."
          }
        ]
      },
      {
        "s": "Der Betriebsrat bittet um ein eigenes Gespräch ohne Geschäftsführung. Die Geschäftsführung reagiert reserviert.",
        "o": [
          {
            "t": "Nur mit der Geschäftsführung sprechen, um den Gastgeber nicht zu verärgern.",
            "q": 0,
            "f": "Der Besuch verläuft reibungslos, aber in der Belegschaft heißt es, Sie hätten nur „oben“ zugehört."
          },
          {
            "t": "Sich nach dem Besuch heimlich mit dem Betriebsrat auf dem Parkplatz treffen.",
            "q": -1,
            "f": "Das Treffen spricht sich herum, und beide Seiten fühlen sich hintergangen."
          },
          {
            "t": "Offen beide Gespräche einplanen und der Geschäftsführung erklären, dass Sie alle Seiten hören wollen.",
            "q": 1,
            "f": "Die Geschäftsführung akzeptiert es, und der Betriebsrat schätzt Ihre Transparenz."
          }
        ]
      },
      {
        "s": "Ein Arbeiter am Band fragt Sie direkt, ob sein Arbeitsplatz sicher ist – es gibt Gerüchte über eine Verlagerung ins Ausland.",
        "o": [
          {
            "t": "Ihm versichern, dass Sie keine Verlagerung zulassen werden.",
            "q": -1,
            "f": "Die Zusage ist nicht einzuhalten – und genau so wird sie später zitiert."
          },
          {
            "t": "Ehrlich sagen, dass Sie keine Garantie geben können, aber erklären, was Sie für Industriestandorte tun wollen.",
            "q": 1,
            "f": "Er ist nicht glücklich, aber er sagt: „Wenigstens erzählen Sie keine Märchen.“"
          },
          {
            "t": "Ihn an die Geschäftsführung verweisen, die das besser beurteilen kann.",
            "q": 0,
            "f": "Formal korrekt, aber er fühlt sich abgeschoben."
          }
        ]
      },
      {
        "s": "Die PR-Abteilung der Firma möchte ein Foto, auf dem Sie das neue Produkt in die Kamera halten, das Firmenlogo groß im Hintergrund.",
        "o": [
          {
            "t": "Das Foto wie gewünscht machen – der Gastgeber hat es verdient.",
            "q": 0,
            "f": "Die Firma freut sich, aber in den Kommentaren ist von Werbung die Rede."
          },
          {
            "t": "Ein gemeinsames Foto mit Beschäftigten an der Maschine vorschlagen statt einer Produkt-Pose.",
            "q": 1,
            "f": "Alle sind zufrieden – und das Bild zeigt die Menschen, um die es Ihnen geht."
          },
          {
            "t": "Das Foto machen und das Produkt dabei als „das beste seiner Art in Deutschland“ loben.",
            "q": -1,
            "f": "Konkurrenzfirmen beschweren sich, die Presse spricht von Schleichwerbung."
          }
        ]
      },
      {
        "s": "Sie kommen 45 Minuten zu spät an. Der Schichtwechsel steht unmittelbar bevor, die Frühschicht wollte Sie eigentlich noch treffen.",
        "o": [
          {
            "t": "Zuerst die gehende Schicht kurz begrüßen und dafür den Rundgang durch die Verwaltung streichen.",
            "q": 1,
            "f": "Die Beschäftigten freuen sich, dass Sie sie nicht übergangen haben."
          },
          {
            "t": "Die Frühschicht bitten, noch eine halbe Stunde zu bleiben.",
            "q": -1,
            "f": "Nach acht Stunden Arbeit ist das niemandem zuzumuten – die Stimmung kippt."
          },
          {
            "t": "Das komplette Programm im Schnelldurchlauf absolvieren.",
            "q": 0,
            "f": "Alles wird abgehakt, aber überall bleibt nur Zeit für einen Händedruck."
          }
        ]
      },
      {
        "s": "In der Ausbildungswerkstatt lädt ein Azubi Sie ein, selbst ein Werkstück an der Drehbank zu fertigen.",
        "o": [
          {
            "t": "Höflich ablehnen, um nicht ungeschickt auszusehen.",
            "q": 0,
            "f": "Kein Risiko, aber auch kein Moment, an den sich jemand erinnert."
          },
          {
            "t": "Mitmachen und sich vom Azubi Schritt für Schritt anleiten lassen.",
            "q": 1,
            "f": "Der Azubi erklärt stolz, alle lachen gemeinsam – ein sympathischer Moment."
          },
          {
            "t": "Mitmachen und erzählen, dass Sie so etwas früher auch schon gemacht haben.",
            "q": -1,
            "f": "Das Werkstück misslingt deutlich, und die Prahlerei wirkt nun doppelt peinlich."
          }
        ]
      },
      {
        "s": "Ihr Social-Media-Team filmt in der Entwicklungsabteilung. Im Hintergrund steht gut sichtbar ein Prototyp, der noch nicht vorgestellt wurde.",
        "o": [
          {
            "t": "Die Aufnahmen später schneiden lassen, wenn es Bedenken gibt.",
            "q": 0,
            "f": "Das Video wird entschärft, aber die Firma ist verunsichert, was noch alles gefilmt wurde."
          },
          {
            "t": "Das Video gleich posten – Innovation aus der Region ist doch eine gute Nachricht.",
            "q": -1,
            "f": "Die Firma ist entsetzt, das Betriebsgeheimnis ist öffentlich – ein ernsthafter Vertrauensbruch."
          },
          {
            "t": "Sofort stoppen und mit der Firma klären, welche Bereiche gefilmt werden dürfen.",
            "q": 1,
            "f": "Die Geschäftsführung bedankt sich für das Fingerspitzengefühl."
          }
        ]
      },
      {
        "s": "Vor versammelter Belegschaft fordert der Firmeninhaber eine klare Zusage für staatliche Förderung seines geplanten Werksausbaus.",
        "o": [
          {
            "t": "Die Förderung vor allen zusagen – das sichert Arbeitsplätze.",
            "q": -1,
            "f": "Die Zusage ist ungedeckt, und Konkurrenten fragen, warum gerade diese Firma."
          },
          {
            "t": "Auf das allgemeine Wirtschaftsprogramm verweisen.",
            "q": 0,
            "f": "Korrekt, aber der Inhaber und die Belegschaft wirken enttäuscht."
          },
          {
            "t": "Das Vorhaben ausdrücklich würdigen und ein Fachgespräch mit Ihren Wirtschaftsleuten vereinbaren – ohne Zusage.",
            "q": 1,
            "f": "Der Inhaber fühlt sich ernst genommen, und Sie haben nichts versprochen, was Sie nicht halten können."
          }
        ]
      },
      {
        "s": "Eine Arbeiterin spricht kaum Deutsch, möchte Ihnen aber etwas zu ihren Arbeitsbedingungen sagen. Eine Kollegin bietet an zu übersetzen.",
        "o": [
          {
            "t": "Sich Zeit nehmen und über die Kollegin in Ruhe mit ihr sprechen.",
            "q": 1,
            "f": "Die Arbeiterin strahlt, und viele Kolleginnen beobachten die Szene wohlwollend."
          },
          {
            "t": "Freundlich nicken und mit dem Rundgang weitermachen.",
            "q": 0,
            "f": "Nichts Schlimmes passiert, aber eine Chance zum Zuhören ist vertan."
          },
          {
            "t": "Ohne Übersetzung sehr langsam und laut auf Deutsch mit ihr reden.",
            "q": -1,
            "f": "Die Situation wirkt herablassend, die Kollegin schaut irritiert."
          }
        ]
      },
      {
        "s": "Zum Mittagessen hat die Geschäftsführung einen Besprechungsraum mit Catering vorbereitet, während die Belegschaft in der Kantine isst.",
        "o": [
          {
            "t": "Mit der Geschäftsführung in die Kantine gehen, aber an einem reservierten Extratisch sitzen.",
            "q": -1,
            "f": "Der abgesperrte Tisch mitten in der Kantine wirkt abgehoben – das Foto spricht Bände."
          },
          {
            "t": "Im Besprechungsraum essen und danach kurz durch die Kantine gehen.",
            "q": 0,
            "f": "Ein paar Hände geschüttelt, aber echte Gespräche entstehen kaum."
          },
          {
            "t": "Sich mit einem Tablett an einen Tisch mit Beschäftigten setzen.",
            "q": 1,
            "f": "Beim Essen entstehen die ehrlichsten Gespräche des ganzen Besuchs."
          }
        ]
      }
    ],
    "haustuer": [
      {
        "s": "Ein Ehrenamtlicher schlägt vor, nach jeder Runde Namen, Adressen und die geäußerte Wahlabsicht der Gesprächspartner in die private Messenger-Gruppe des Teams zu stellen.",
        "o": [
          {
            "t": "Zustimmen – so kann man gezielt nachfassen.",
            "q": -1,
            "f": "Ein Datenschutzverstoß mit sensiblen Daten – als das herauskommt, gibt es eine Beschwerde und schlechte Presse."
          },
          {
            "t": "Nur anonym erfassen, in welchen Straßen die Stimmung wie war, ohne Namen oder Hausnummern.",
            "q": 1,
            "f": "Das Team bekommt nützliche Auswertungen, ganz ohne personenbezogene Daten."
          },
          {
            "t": "Adressen notieren, aber die Wahlabsicht weglassen.",
            "q": 0,
            "f": "Weniger heikel, aber auch das ist ohne Einwilligung problematisch – die Geschäftsstelle bremst."
          }
        ]
      },
      {
        "s": "Ein Mann öffnet die Tür, hört den ersten Satz und sagt: „Kein Interesse.“",
        "o": [
          {
            "t": "Freundlich verabschieden, einen schönen Tag wünschen und einen Flyer anbieten.",
            "q": 1,
            "f": "Er nimmt den Flyer sogar mit – ein freundlicher Eindruck bleibt."
          },
          {
            "t": "Noch einmal nachhaken, ob ihn nicht wenigstens ein bestimmtes Thema interessiert.",
            "q": 0,
            "f": "Er wiederholt sein „Nein“ etwas gereizter, die Tür geht zu."
          },
          {
            "t": "Weiter argumentieren – oft überlegen es sich die Leute nach dem zweiten Satz anders.",
            "q": -1,
            "f": "Er schlägt die Tür zu und beschwert sich später bei der Lokalzeitung."
          }
        ]
      },
      {
        "s": "Am Briefkasten eines Mehrfamilienhauses klebt ein Aufkleber „Bitte keine Werbung“.",
        "o": [
          {
            "t": "Den Flyer trotzdem einwerfen – Wahlwerbung ist schließlich Information.",
            "q": -1,
            "f": "Ein Bewohner fotografiert das und beschwert sich öffentlich über die Missachtung."
          },
          {
            "t": "Das ganze Haus auslassen.",
            "q": 0,
            "f": "Korrekt, aber Sie verpassen die Chance auf Gespräche mit den Menschen dort."
          },
          {
            "t": "Klingeln und das Gespräch anbieten, aber keinen Flyer einwerfen.",
            "q": 1,
            "f": "Zwei Bewohner öffnen und reden gern – der Wunsch am Briefkasten wird respektiert."
          }
        ]
      },
      {
        "s": "Nach zwei Stunden im Nieselregen sind viele Ehrenamtliche frustriert: Kaum jemand war zu Hause, die Stimmung ist im Keller.",
        "o": [
          {
            "t": "Eine Pause im Café einlegen, die bisherigen guten Gespräche hervorheben und die Runde auf den frühen Abend verlegen.",
            "q": 1,
            "f": "Mit trockenen Füßen und neuer Energie läuft die Abendrunde deutlich besser."
          },
          {
            "t": "Die Runde wie geplant durchziehen – Disziplin gehört dazu.",
            "q": 0,
            "f": "Alle Straßen werden abgehakt, aber zwei Ehrenamtliche sagen ihre nächste Schicht ab."
          },
          {
            "t": "Abbrechen und die Zahlen im Bericht etwas großzügiger ausweisen.",
            "q": -1,
            "f": "Die geschönten Zahlen fallen bei der Auswertung auf – das Vertrauen im Team leidet."
          }
        ]
      },
      {
        "s": "Sie planen die Einsatzzeiten für die kommende Woche. Welches Zeitfenster setzen Sie als Schwerpunkt?",
        "o": [
          {
            "t": "Samstag zur Mittagszeit, dann sind viele Menschen zu Hause.",
            "q": 0,
            "f": "Viele sind tatsächlich da, aber oft beim Essen oder mit Einkäufen beschäftigt."
          },
          {
            "t": "Sonntagmorgen ab neun Uhr, da ist man garantiert nicht unterwegs.",
            "q": -1,
            "f": "Verschlafene, genervte Gesichter – die Gespräche enden schnell."
          },
          {
            "t": "Werktags zwischen 17 und 19:30 Uhr.",
            "q": 1,
            "f": "Die meisten sind von der Arbeit zurück und haben noch ein paar Minuten Zeit."
          }
        ]
      },
      {
        "s": "Hinter einem Gartentor bellt ein großer Hund aggressiv. Die Haustür liegt 20 Meter entfernt, eine Klingel am Tor gibt es nicht.",
        "o": [
          {
            "t": "Laut über den Zaun rufen, ob jemand zu Hause ist.",
            "q": 0,
            "f": "Niemand hört Sie über das Gebell – nur die Nachbarn schauen irritiert."
          },
          {
            "t": "Das Tor öffnen – der Hund wird schon an der Kette sein.",
            "q": -1,
            "f": "Der Hund war nicht angeleint – ein Hosenbein ist hin, der Schreck sitzt tief."
          },
          {
            "t": "Das Grundstück nicht betreten, den Flyer am Tor lassen und weitergehen.",
            "q": 1,
            "f": "Sicher und respektvoll – Sie schaffen dafür drei Häuser mehr."
          }
        ]
      },
      {
        "s": "Eine einsame ältere Dame bittet Ihre Ehrenamtliche herein, sie habe gerade Kaffee gekocht und würde gern länger reden. Die Ehrenamtliche ist allein an dieser Tür.",
        "o": [
          {
            "t": "Die Einladung höflich ablehnen und sich verabschieden.",
            "q": 0,
            "f": "Sicher, aber die Dame wirkt enttäuscht."
          },
          {
            "t": "An der Tür bleiben, sich ein paar Minuten Zeit für das Gespräch nehmen und auf den Teampartner warten.",
            "q": 1,
            "f": "Die Dame freut sich über die Aufmerksamkeit – und die Teamregel bleibt gewahrt."
          },
          {
            "t": "Hineingehen und sich eine Stunde Zeit nehmen – menschliche Nähe ist das Wichtigste.",
            "q": -1,
            "f": "Die Ehrenamtliche ist lange allein in einer fremden Wohnung, das Team sucht sie besorgt – ein Sicherheitsrisiko."
          }
        ]
      },
      {
        "s": "Eine Anwohnerin fragt misstrauisch, ob Sie „echt“ seien – in der Gegend hätten sich zuletzt Trickbetrüger an Haustüren ausgegeben.",
        "o": [
          {
            "t": "Auf das Parteilogo auf dem Flyer verweisen.",
            "q": 0,
            "f": "Sie bleibt skeptisch – ein Flyer lässt sich schließlich leicht drucken."
          },
          {
            "t": "Etwas gekränkt erklären, dass Sie ehrenamtlich unterwegs sind und keine Betrüger.",
            "q": -1,
            "f": "Sie schließt die Tür und warnt danach die Nachbarschaft vor Ihnen."
          },
          {
            "t": "Ihren Ausweis zeigen, die Nummer der Geschäftsstelle zum Gegenprüfen anbieten und betonen, dass Sie nicht hineinwollen.",
            "q": 1,
            "f": "Sie entspannt sich sichtlich, und es wird ein gutes Gespräch."
          }
        ]
      },
      {
        "s": "Ein Mann kritisiert Ihre Partei an der Tür lautstark und sehr grundsätzlich zum Thema {thema}.",
        "o": [
          {
            "t": "Zuhören, sein Anliegen ohne Namen notieren und anbieten, es weiterzugeben.",
            "q": 1,
            "f": "Er ist überrascht, dass ihm jemand zuhört – am Ende verabschiedet er sich fast freundlich."
          },
          {
            "t": "Ein kurzes Gegenargument bringen und sich dann verabschieden.",
            "q": 0,
            "f": "Er brummt, das Gespräch endet neutral."
          },
          {
            "t": "In eine ausführliche Debatte einsteigen, um ihn zu überzeugen.",
            "q": -1,
            "f": "Nach 30 Minuten hat sich niemand bewegt, und die halbe Straße ist nicht mehr zu schaffen."
          }
        ]
      },
      {
        "s": "Für den Haustürwahlkampf bleiben nur noch drei Abende. Welche Straßenzüge priorisieren Sie?",
        "o": [
          {
            "t": "Die Straßen, in denen die Ehrenamtlichen selbst wohnen – dort kennt man sie.",
            "q": 0,
            "f": "Angenehme Gespräche, aber ohne besonderen Fokus auf Unentschlossene."
          },
          {
            "t": "Viertel, in denen laut früheren Wahlergebnissen viele Unentschlossene und eine niedrige Wahlbeteiligung zu finden sind.",
            "q": 1,
            "f": "Die Gespräche sind fordernd, bewegen aber spürbar Menschen."
          },
          {
            "t": "Systematisch alphabetisch nach der Straßenliste der Gemeinde vorgehen.",
            "q": -1,
            "f": "Viel Laufarbeit, kaum Wirkung – die Planung verpufft."
          }
        ]
      }
    ],
    "infostand": [
      {
        "s": "Das Ordnungsamt kontrolliert Ihren Stand. Die Sondernutzungsgenehmigung liegt allerdings im Büro.",
        "o": [
          {
            "t": "Kooperativ bleiben und die Genehmigung sofort per Foto aus dem Büro schicken lassen.",
            "q": 1,
            "f": "Nach fünf Minuten ist alles geklärt, der Kontrolleur wünscht noch einen erfolgreichen Tag."
          },
          {
            "t": "Vorsichtshalber den Stand abbauen.",
            "q": 0,
            "f": "Ärger vermieden, aber der Samstagvormittag ist verloren."
          },
          {
            "t": "Dem Kontrolleur vorhalten, er würde andere Parteien nicht so genau kontrollieren.",
            "q": -1,
            "f": "Die Kontrolle wird ausgedehnt, und Passanten sehen einen Streit statt einen Infostand."
          }
        ]
      },
      {
        "s": "Plötzlich kommen starke Windböen auf. Flyer fliegen über die Straße, der Pavillon wackelt bedenklich.",
        "o": [
          {
            "t": "Den Pavillon stehen lassen und mit zwei Leuten festhalten.",
            "q": -1,
            "f": "Eine Böe reißt den Pavillon los – er verfehlt knapp einen Kinderwagen."
          },
          {
            "t": "Den Pavillon sofort abbauen, das Material beschweren und ohne Dach weitermachen.",
            "q": 1,
            "f": "Der Stand ist kleiner, aber sicher – und Sie sind weiter ansprechbar."
          },
          {
            "t": "Die Flyer einsammeln und den Stand für heute schließen.",
            "q": 0,
            "f": "Sicher, aber die beste Stunde des Markttages geht verloren."
          }
        ]
      },
      {
        "s": "Viele Kinder kommen zum Stand und wollen Luftballons, die Eltern gehen eher ungeduldig weiter.",
        "o": [
          {
            "t": "Ballons verteilen und die Wartezeit für einen kurzen, lockeren Satz mit den Eltern nutzen.",
            "q": 1,
            "f": "Mehrere Eltern bleiben stehen – der Ballon war der Türöffner."
          },
          {
            "t": "Den Kindern zusätzlich Flyer für die Eltern in die Hand drücken.",
            "q": -1,
            "f": "Ein Vater beschwert sich, dass Kinder für Wahlwerbung eingespannt werden."
          },
          {
            "t": "Ballons nur noch auf Nachfrage geben und sich auf Erwachsene konzentrieren.",
            "q": 0,
            "f": "Weniger Trubel, aber auch weniger Menschen am Stand."
          }
        ]
      },
      {
        "s": "Direkt neben Ihnen baut eine konkurrierende Partei einen Stand auf. Ein Ehrenamtlicher von drüben ruft schon die erste Spitze herüber.",
        "o": [
          {
            "t": "Mit einer schlagfertigen Stichelei antworten – die Passanten sollen sehen, wer den Ton angibt.",
            "q": -1,
            "f": "Es entsteht ein Wortgefecht, und viele Passanten machen einen Bogen um beide Stände."
          },
          {
            "t": "Die eigenen Leute bitten, den Stand ein paar Meter weiter wegzurücken.",
            "q": 0,
            "f": "Ruhe kehrt ein, aber der neue Platz ist weniger gut sichtbar."
          },
          {
            "t": "Hinübergehen, freundlich Hallo sagen und einen fairen Umgang vorschlagen.",
            "q": 1,
            "f": "Die Stimmung entspannt sich – Passanten loben den respektvollen Ton beider Stände."
          }
        ]
      },
      {
        "s": "Eine Passantin möchte gern den Newsletter bekommen und bietet an, ihre E-Mail-Adresse dazulassen.",
        "o": [
          {
            "t": "Die Adresse schnell auf einen Zettel notieren.",
            "q": -1,
            "f": "Ohne dokumentierte Einwilligung ist die Adresse nicht nutzbar – und der Zettel geht verloren."
          },
          {
            "t": "Ihr eine Karte mit dem QR-Code zur Anmeldung geben.",
            "q": 0,
            "f": "Datenschutzkonform, aber viele melden sich zu Hause dann doch nicht an."
          },
          {
            "t": "Das vorbereitete Anmeldeformular mit Datenschutzhinweis ausfüllen lassen.",
            "q": 1,
            "f": "Sauber dokumentiert – und sie erhält schon am Abend die Bestätigungsmail."
          }
        ]
      },
      {
        "s": "Sie können den Stand diese Woche nur einmal aufbauen. Welcher Ort und welche Zeit?",
        "o": [
          {
            "t": "Wochenmarkt am Samstagvormittag.",
            "q": 1,
            "f": "Volle Gassen und Menschen, die Zeit haben – ideale Bedingungen."
          },
          {
            "t": "Bahnhofsvorplatz zur Feierabendzeit.",
            "q": 0,
            "f": "Viele Menschen, aber die meisten eilen zum Zug."
          },
          {
            "t": "Ein ruhiger Platz am Stadtrand, wo man ungestört lange Gespräche führen kann.",
            "q": -1,
            "f": "In drei Stunden kommen nur eine Handvoll Menschen vorbei."
          }
        ]
      },
      {
        "s": "Sie kommen zum Stand zurück und sehen, wie ein betrunkener Mann eine junge Ehrenamtliche bedrängt, die dort gerade allein steht.",
        "o": [
          {
            "t": "Ihn mit Nachdruck vom Stand wegschieben.",
            "q": -1,
            "f": "Er fällt hin, es gibt Tumult – und plötzlich sind Sie Teil einer Anzeige."
          },
          {
            "t": "Sich neben die Ehrenamtliche stellen, den Mann ruhig auf Abstand bitten und bei Bedarf die Polizei rufen.",
            "q": 1,
            "f": "Er zieht murrend ab, und die Ehrenamtliche fühlt sich unterstützt."
          },
          {
            "t": "Ihn ignorieren, bis er von selbst weitergeht.",
            "q": 0,
            "f": "Er geht irgendwann, aber die Ehrenamtliche ist sichtlich mitgenommen."
          }
        ]
      },
      {
        "s": "Ein Lokaljournalist fragt einen Ehrenamtlichen am Stand, was er „wirklich“ von {kandidat} hält.",
        "o": [
          {
            "t": "„Kein Kommentar“ sagen und auf die Pressestelle verweisen.",
            "q": 0,
            "f": "Kein Fehler, aber der Artikel erwähnt einen „wortkargen Stand“."
          },
          {
            "t": "Persönlich erzählen, warum er sich engagiert, und für offizielle Zitate den Kontakt zur Pressestelle anbieten.",
            "q": 1,
            "f": "Ein sympathisches, authentisches Zitat landet in der Zeitung."
          },
          {
            "t": "Offen über Gerüchte zu internen Spannungen plaudern – Ehrlichkeit kommt an.",
            "q": -1,
            "f": "Die Schlagzeile am nächsten Tag lautet „Basis zweifelt an Spitze“."
          }
        ]
      },
      {
        "s": "Schon nach einer Stunde sind die Flyer aus. Der Markt ist noch drei Stunden lang voll.",
        "o": [
          {
            "t": "Die alten Flyer aus dem letzten Wahlkampf aus dem Lager holen.",
            "q": -1,
            "f": "Veraltete Aussagen und Gesichter sorgen für Spott und Verwirrung."
          },
          {
            "t": "Ein Schild mit QR-Code zum Programm aufstellen, mehr Gespräche führen und Nachschub aus der Geschäftsstelle holen lassen.",
            "q": 1,
            "f": "Die Gespräche werden sogar intensiver, und nach 40 Minuten ist Nachschub da."
          },
          {
            "t": "Den Stand früher abbauen.",
            "q": 0,
            "f": "Die Flyer waren ein Erfolg – die verbleibenden Chancen aber verschenkt."
          }
        ]
      },
      {
        "s": "Ein Passant fragt detailliert nach den Plänen zum Thema {thema}. Die Ehrenamtliche am Stand kennt sich damit kaum aus.",
        "o": [
          {
            "t": "Ihn auf die Website verweisen, dort stehe alles.",
            "q": 0,
            "f": "Er nickt, aber wirkt nicht so, als würde er nachschauen."
          },
          {
            "t": "Improvisieren und aus dem Gedächtnis zusammenfassen, was man so gehört hat.",
            "q": -1,
            "f": "Die Aussagen widersprechen dem Programm – er geht verärgert und schlechter informiert."
          },
          {
            "t": "Ehrlich sagen, dass sie es nicht genau weiß, das Kurzprogramm aufschlagen und seine Frage für eine Rückmeldung notieren.",
            "q": 1,
            "f": "Er schätzt die Ehrlichkeit und hinterlässt freiwillig seine Kontaktdaten."
          }
        ]
      }
    ],
    "plakate": [
      {
        "s": "In {land} sind die Großflächen an Ausfallstraßen fast ausgebucht. Ein Anbieter bietet Ihnen die letzten 40 Flächen an – allerdings in Gewerbegebieten am Stadtrand.",
        "o": [
          {
            "t": "Die 40 Flächen nehmen – Präsenz ist Präsenz.",
            "q": 0,
            "f": "Die Plakate stehen, werden aber vor allem von Lkw-Fahrern gesehen."
          },
          {
            "t": "Stattdessen kleinere Plakate an Bushaltestellen und Schulwegen in Wohnvierteln buchen.",
            "q": 1,
            "f": "Weniger spektakulär, aber die Motive hängen genau dort, wo Wählerinnen und Wähler täglich vorbeigehen."
          },
          {
            "t": "Dem Anbieter einen Aufpreis bieten, damit er bereits vergebene Flächen für Sie umbucht.",
            "q": -1,
            "f": "Der Anbieter lehnt ab, und der Vorgang landet prompt in der Lokalpresse."
          }
        ]
      },
      {
        "s": "Über Nacht wurden in einer Kreisstadt in {land} zahlreiche Ihrer Plakate beschmiert. Die Ortsgruppe fragt, wie sie reagieren soll.",
        "o": [
          {
            "t": "Ein Foto der Schmierereien groß posten und den politischen Gegner verantwortlich machen.",
            "q": -1,
            "f": "Ohne Beweise wirkt der Vorwurf haltlos – die Debatte dreht sich nun um Ihren Stil."
          },
          {
            "t": "Die Plakate bis zum regulären Austauschtermin einfach hängen lassen.",
            "q": 0,
            "f": "Es kostet nichts, aber die verschmierten Motive prägen eine Woche lang das Stadtbild."
          },
          {
            "t": "Anzeige erstatten, die Plakate zügig ersetzen und kein großes Aufheben machen.",
            "q": 1,
            "f": "Nach zwei Tagen hängen frische Plakate, und die Täter bekommen nicht die erhoffte Bühne."
          }
        ]
      },
      {
        "s": "Die Stadtverwaltung einer Großstadt in {land} erlaubt Wahlplakate erst sechs Wochen vor der Wahl. Ihr Team möchte aber schon jetzt sichtbar sein.",
        "o": [
          {
            "t": "Schon jetzt aufhängen – das Bußgeld ist kleiner als der Nutzen.",
            "q": -1,
            "f": "Das Ordnungsamt hängt alles ab, und Bußgelder samt Schlagzeilen kosten mehr als gedacht."
          },
          {
            "t": "Bis dahin auf private Flächen von Unterstützern ausweichen – Schaufenster, Gartenzäune, Balkone.",
            "q": 1,
            "f": "Die Plakate an Privathäusern wirken persönlich und sind völlig legal."
          },
          {
            "t": "Die Frist abwarten und die Zeit für die Standortplanung nutzen.",
            "q": 0,
            "f": "Am Stichtag läuft alles reibungslos, doch bis dahin sind Sie im Stadtbild unsichtbar."
          }
        ]
      },
      {
        "s": "Die Agentur legt zwei Motive vor: ein großes Porträt von {kandidat} mit kurzem Slogan oder ein Textplakat mit drei konkreten Forderungen.",
        "o": [
          {
            "t": "Das Porträt mit kurzem Slogan – Plakate werden im Vorbeifahren in Sekunden gelesen.",
            "q": 1,
            "f": "Das Gesicht prägt sich ein und wird in der ganzen Stadt wiedererkannt."
          },
          {
            "t": "Das Textplakat – Inhalte überzeugen mehr als Gesichter.",
            "q": 0,
            "f": "Wer stehen bleibt, liest gute Argumente – doch die meisten fahren einfach vorbei."
          },
          {
            "t": "Beides kombinieren: Porträt, Slogan und die drei Forderungen auf einem Plakat.",
            "q": -1,
            "f": "Das überladene Motiv ist aus dem Auto heraus kaum lesbar."
          }
        ]
      },
      {
        "s": "Eine Woche vor der Wahl ist in {land} noch Plakatbudget übrig. Die Wahlkampfleitung schlägt eine zweite Welle vor.",
        "o": [
          {
            "t": "Ein neues, provokantes Motiv nachschieben, um die Aufmerksamkeit zu erzwingen.",
            "q": -1,
            "f": "Die Provokation überlagert in der Schlussphase Ihre eigentliche Botschaft."
          },
          {
            "t": "Zusätzliche Plakate mit den bekannten Motiven an neuen Standorten aufhängen.",
            "q": 0,
            "f": "Mehr Plakate, doch in der Plakatflut der letzten Woche gehen sie unter."
          },
          {
            "t": "Auf die vorhandenen Plakate Aufkleber „Am Sonntag wählen gehen!“ kleben.",
            "q": 1,
            "f": "Die Erinnerung mobilisiert die eigenen Leute und kostet nur einen Bruchteil."
          }
        ]
      },
      {
        "s": "Die Druckerei meldet: Auf 5.000 bereits gedruckten Plakaten steht ein falsches Wahldatum. Ein Neudruck dauert fünf Tage.",
        "o": [
          {
            "t": "Alles neu drucken lassen und die Verzögerung in Kauf nehmen.",
            "q": 0,
            "f": "Korrekt, aber fünf Tage ohne Plakate sind im Wahlkampf eine Ewigkeit."
          },
          {
            "t": "Die Plakate trotzdem aufhängen – auf das Datum achtet kaum jemand.",
            "q": -1,
            "f": "Eine Lokalzeitung entdeckt den Fehler, und der Spott verbreitet sich schneller als die Plakate."
          },
          {
            "t": "Korrekturaufkleber mit dem richtigen Datum drucken und sofort plakatieren.",
            "q": 1,
            "f": "Die Aufkleber sind in einem Tag fertig, und die Plakate hängen pünktlich."
          }
        ]
      },
      {
        "s": "Ehrenamtliche haben Plakate direkt vor einer Grundschule und an einer Friedhofsmauer aufgehängt. Anwohner beschweren sich beim Ortsbeirat.",
        "o": [
          {
            "t": "Darauf verweisen, dass die Standorte formal genehmigt sind.",
            "q": 0,
            "f": "Rechtlich korrekt, aber der Ärger im Viertel bleibt."
          },
          {
            "t": "Die Plakate dort sofort abnehmen und den Anwohnern für den Hinweis danken.",
            "q": 1,
            "f": "Die schnelle Reaktion wird im Ort positiv vermerkt."
          },
          {
            "t": "Öffentlich erklären, die Ehrenamtlichen hätten eigenmächtig gehandelt.",
            "q": -1,
            "f": "Die Basis ist verärgert, und der Streit wird erst recht zum Thema."
          }
        ]
      },
      {
        "s": "Für den ländlichen Raum in {land} sind dieselben Motive geplant wie für die Großstädte. Die Kreisverbände fragen, ob das passt.",
        "o": [
          {
            "t": "Bei den bundesweiten Motiven bleiben – ein einheitliches Bild schafft Wiedererkennung.",
            "q": 0,
            "f": "Die Marke bleibt konsistent, aber auf dem Land fühlen sich viele nicht angesprochen."
          },
          {
            "t": "Auf dem Land auf Plakate verzichten und das Geld in die Städte stecken.",
            "q": -1,
            "f": "Die Konkurrenz füllt die Lücke, und vor Ort heißt es, Sie hätten die Region abgeschrieben."
          },
          {
            "t": "Zwei zusätzliche Motive zu Busverbindungen und Arztpraxen vor Ort entwickeln.",
            "q": 1,
            "f": "Die Plakate treffen die Alltagssorgen auf dem Land und werden dort viel diskutiert."
          }
        ]
      },
      {
        "s": "Ein Umweltverband kritisiert die Plastikplakate aller Parteien. Eine Journalistin aus {land} fragt, wie Ihre Kampagne damit umgeht.",
        "o": [
          {
            "t": "Zusagen, das Thema für den nächsten Wahlkampf zu prüfen.",
            "q": 0,
            "f": "Die Antwort ist unverbindlich und wird kaum zitiert."
          },
          {
            "t": "Darauf hinweisen, dass andere Parteien weit mehr plakatieren.",
            "q": -1,
            "f": "Der Fingerzeig wirkt kleinlich und bleibt als Ausrede hängen."
          },
          {
            "t": "Ankündigen, die Plakate nach der Wahl vollständig einzusammeln und zu recyceln.",
            "q": 1,
            "f": "Die konkrete Zusage überzeugt, und der Verband lobt sie sogar."
          }
        ]
      },
      {
        "s": "Ein Herbststurm hat in {land} Hunderte Plakate umgeworfen, einige liegen auf Geh- und Radwegen. Am Wochenende sind die Ortsgruppen kaum besetzt.",
        "o": [
          {
            "t": "Die Plakate bis Montag liegen lassen und dann einen Dienstleister schicken.",
            "q": -1,
            "f": "Eine Radfahrerin stürzt über ein Plakat – die Geschichte macht die Runde."
          },
          {
            "t": "Kurzfristig eine Aufräumaktion mit Freiwilligen und Kandidierenden organisieren.",
            "q": 1,
            "f": "Die Wege sind schnell frei, und die Lokalzeitung bringt ein freundliches Foto."
          },
          {
            "t": "Die Stadt bitten, die Plakate über den Bauhof einzusammeln.",
            "q": 0,
            "f": "Die Plakate verschwinden, doch es folgen eine Rechnung und ein genervter Unterton."
          }
        ]
      }
    ],
    "regional": [
      {
        "s": "Die Lokalzeitung in {land} fragt, wie Sie zum umstrittenen Ausbau einer regionalen Bahnstrecke stehen. Ihr Team hat dazu keine abgestimmte Position.",
        "o": [
          {
            "t": "Ehrlich sagen, dass Sie sich das Projekt genauer ansehen, und einen Besuch vor Ort zusagen.",
            "q": 1,
            "f": "Die Leser schätzen die Offenheit, und der angekündigte Besuch wird mit Spannung erwartet."
          },
          {
            "t": "Zusichern, dass Sie das Projekt mit voller Kraft unterstützen.",
            "q": -1,
            "f": "Tags darauf zeigt sich, dass die Finanzierung wackelt – Sie müssen zurückrudern."
          },
          {
            "t": "Auf die allgemeine Verkehrspolitik Ihrer Partei ausweichen.",
            "q": 0,
            "f": "Nicht falsch, aber die Leser merken, dass Sie die Region kaum kennen."
          }
        ]
      },
      {
        "s": "Der Moderator im Landesradio begrüßt Sie im örtlichen Dialekt und bittet Sie, ebenfalls „ein paar Worte in Mundart“ zu sagen.",
        "o": [
          {
            "t": "Eine längere Passage im Dialekt vortragen, die Sie vorher eingeübt haben.",
            "q": -1,
            "f": "Die Aussprache misslingt hörbar, und der Ausschnitt wird als Anbiederung geteilt."
          },
          {
            "t": "Lachend zugeben, dass Ihr Dialekt holpert, und ein einziges Wort wagen.",
            "q": 1,
            "f": "Die Selbstironie kommt gut an, und das Gespräch wird sofort lockerer."
          },
          {
            "t": "Freundlich ablehnen und direkt zum Thema überleiten.",
            "q": 0,
            "f": "Korrekt, aber der Einstieg wirkt etwas steif."
          }
        ]
      },
      {
        "s": "Ein Redakteur konfrontiert Sie mit der angekündigten Schließung eines großen Arbeitgebers in {land} und fragt, was Sie den Beschäftigten sagen.",
        "o": [
          {
            "t": "Mitgefühl ausdrücken und auf die Verantwortung der Unternehmensleitung verweisen.",
            "q": 0,
            "f": "Das klingt anständig, aber den Beschäftigten hilft es wenig."
          },
          {
            "t": "Versprechen, dass nach der Wahl alle Arbeitsplätze gerettet werden.",
            "q": -1,
            "f": "Das Versprechen ist offensichtlich nicht haltbar und wird Ihnen bald vorgehalten."
          },
          {
            "t": "Ein Treffen mit Betriebsrat und Belegschaft noch in dieser Woche ankündigen.",
            "q": 1,
            "f": "Der konkrete Termin zeigt Interesse und sorgt für einen zweiten Artikel."
          }
        ]
      },
      {
        "s": "Die Lokalzeitung schickt Interviews grundsätzlich nicht zur Autorisierung. Ihr Sprecher drängt darauf, das Gespräch deshalb abzusagen.",
        "o": [
          {
            "t": "Absagen – ohne Autorisierung ist das Risiko zu groß.",
            "q": -1,
            "f": "Die Zeitung schreibt, Sie hätten das Gespräch gescheut – das steht nun statt Ihres Interviews im Blatt."
          },
          {
            "t": "Nur schriftlich auf vorab eingereichte Fragen antworten.",
            "q": 0,
            "f": "Die Antworten sind sauber, lesen sich aber wie Pressemitteilungen."
          },
          {
            "t": "Das Interview führen und besonders präzise formulieren.",
            "q": 1,
            "f": "Das Gespräch läuft gut, und die Redaktion lobt Ihre Offenheit."
          }
        ]
      },
      {
        "s": "Im Landesradio ruft ein Hörer an und erzählt hörbar aufgewühlt, dass seine Mutter seit Monaten auf einen Pflegeplatz wartet.",
        "o": [
          {
            "t": "Betonen, dass für Pflegeplätze vor allem Land und Kommunen zuständig sind.",
            "q": -1,
            "f": "Teilweise richtig, aber es klingt kalt – die Hörer reagieren verärgert."
          },
          {
            "t": "Mit Zahlen zur bundesweiten Pflegepolitik antworten.",
            "q": 0,
            "f": "Sachlich, doch der Anrufer fühlt sich nicht gehört."
          },
          {
            "t": "Nachfragen, zuhören und anbieten, dass sich Ihr Büro nach der Sendung bei ihm meldet.",
            "q": 1,
            "f": "Der Hörer bedankt sich hörbar gerührt, und die Szene wird oft geteilt."
          }
        ]
      },
      {
        "s": "Der Journalist fragt nach einem geplanten Windpark in {land}. Ihre Partei hat sich bundesweit klar dafür positioniert, vor Ort sind viele dagegen.",
        "o": [
          {
            "t": "Sagen, dass Sie das vor Ort anders sehen als Ihre Bundespartei.",
            "q": -1,
            "f": "Die Schlagzeile „Kandidatur widerspricht eigener Partei“ geht bundesweit herum."
          },
          {
            "t": "Zur Position der Partei stehen und mehr Mitsprache und Beteiligung der Anwohner versprechen.",
            "q": 1,
            "f": "Die klare, aber zugewandte Haltung wird auch von Skeptikern respektiert."
          },
          {
            "t": "Darauf verweisen, dass das letztlich die Kommune entscheidet.",
            "q": 0,
            "f": "Formal richtig, aber es wirkt, als wollten Sie sich wegducken."
          }
        ]
      },
      {
        "s": "Ein Live-Interview im Landesradio kollidiert mit einer TV-Aufzeichnung am selben Abend. Beide Redaktionen haben Ihnen schon fest zugesagt.",
        "o": [
          {
            "t": "Das Radiointerview telefonisch aus dem Auto auf dem Weg zum TV-Studio führen.",
            "q": 0,
            "f": "Es klappt, aber der Ton ist schlecht und das Gespräch wirkt gehetzt."
          },
          {
            "t": "Das Radio live wahrnehmen und das TV-Team um einen späteren Aufzeichnungstermin bitten.",
            "q": 1,
            "f": "Die Aufzeichnung lässt sich problemlos verschieben, und beide Auftritte gelingen."
          },
          {
            "t": "Kurzfristig eine Vertretung ins Radio schicken, ohne die Redaktion vorzuwarnen.",
            "q": -1,
            "f": "Die Redaktion ist brüskiert und erwähnt den Tausch spitz in der Sendung."
          }
        ]
      },
      {
        "s": "Die Reporterin bittet Sie, drei Orte in {land} zu nennen, die Sie in diesem Wahlkampf besucht haben. Ihr Terminkalender war bisher eher bundesweit.",
        "o": [
          {
            "t": "Ein paar bekannte Städte aufzählen, auch wenn Sie dort nicht waren.",
            "q": -1,
            "f": "Die Redaktion prüft nach – die Korrektur erscheint am nächsten Tag."
          },
          {
            "t": "Die Frage umgehen und über Ihre Pläne für das Land sprechen.",
            "q": 0,
            "f": "Das Ausweichen fällt auf, schadet aber nicht ernsthaft."
          },
          {
            "t": "Die zwei echten Besuche nennen und offen sagen, dass Sie mehr Zeit im Land verbringen wollen.",
            "q": 1,
            "f": "Die Ehrlichkeit wirkt sympathisch, und die Zeitung druckt Ihre Zusage."
          }
        ]
      },
      {
        "s": "Mitten im Interview fragt der Journalist nach einer Meldung, die vor zehn Minuten veröffentlicht wurde und die Sie noch nicht kennen.",
        "o": [
          {
            "t": "Die Meldung sofort entschieden kommentieren, um handlungsfähig zu wirken.",
            "q": -1,
            "f": "Die Meldung war anders gemeint als gedacht – Ihr Kommentar wirkt voreilig."
          },
          {
            "t": "Offen sagen, dass Sie die Meldung noch nicht kennen, und um die Kernpunkte bitten.",
            "q": 1,
            "f": "Ihre Einschätzung danach ist fundiert, und die Ehrlichkeit kommt gut an."
          },
          {
            "t": "Eine allgemeine Einschätzung abgeben, die zu fast jeder Meldung passt.",
            "q": 0,
            "f": "Es geht gerade noch gut, wirkt aber ausweichend."
          }
        ]
      },
      {
        "s": "Die Lokalzeitung bietet statt eines Interviews ein anderes Format an: Sie begleiten einen Tag lang eine Pflegekraft oder einen Landwirt aus {land}.",
        "o": [
          {
            "t": "Annehmen, aber nur für eine Stunde und mit eigenem Fotografen.",
            "q": -1,
            "f": "Der Kurzbesuch wird als Fototermin entlarvt und genüsslich so beschrieben."
          },
          {
            "t": "Höflich ablehnen und beim klassischen Interview bleiben.",
            "q": 0,
            "f": "Das Interview wird solide, aber kaum beachtet."
          },
          {
            "t": "Annehmen und den ganzen Tag ohne Kamerateam der Partei mitarbeiten.",
            "q": 1,
            "f": "Die Reportage wird zur meistgelesenen Geschichte der Woche."
          }
        ]
      }
    ],
    "tvspot": [
      {
        "s": "Die Agentur will den Spot zum Thema {thema} mit Statistiken und Grafiken füllen. Die Alternative: eine einzelne Person erzählt ihre Geschichte.",
        "o": [
          {
            "t": "Die Grafiken nehmen – Zahlen schaffen Glaubwürdigkeit.",
            "q": 0,
            "f": "Seriös, aber nach dem nächsten Werbeblock schon vergessen."
          },
          {
            "t": "Eine Alltagsgeschichte erzählen und am Ende eine einzige Zahl einblenden.",
            "q": 1,
            "f": "Die Geschichte berührt, und die eine Zahl bleibt im Gedächtnis."
          },
          {
            "t": "Beides kombinieren: Geschichte, mehrere Grafiken und ein Statement von {kandidat}.",
            "q": -1,
            "f": "In 30 Sekunden ist das zu viel – die Zuschauer behalten nichts davon."
          }
        ]
      },
      {
        "s": "Für den Spot ist ein bekannter Popsong eingeplant. Die Rechteinhaber verlangen eine hohe Summe. Das Team schlägt vor, den Song einfach nachspielen zu lassen.",
        "o": [
          {
            "t": "Den Song nachspielen lassen – dann ist es ja eine eigene Aufnahme.",
            "q": -1,
            "f": "Der Verlag sieht eine Urheberrechtsverletzung und erwirkt eine einstweilige Verfügung."
          },
          {
            "t": "Eine eigene, eingängige Melodie komponieren lassen.",
            "q": 1,
            "f": "Die Melodie wird zum Erkennungszeichen Ihrer Kampagne."
          },
          {
            "t": "Die Lizenz trotz der Kosten kaufen.",
            "q": 0,
            "f": "Der Song zieht, aber das Geld fehlt an anderer Stelle."
          }
        ]
      },
      {
        "s": "Zum gleichen Preis können Sie den Spot einmal in der Halbzeitpause eines Länderspiels oder zwölfmal im Vorabendprogramm zeigen.",
        "o": [
          {
            "t": "Die Halbzeitpause – maximale Reichweite auf einen Schlag.",
            "q": 0,
            "f": "Millionen sehen den Spot einmal, doch zwischen Bierholen und Analyse verpufft er."
          },
          {
            "t": "Aufteilen und den Spot dafür auf 15 Sekunden kürzen.",
            "q": -1,
            "f": "Die Kurzfassung verliert ihre Botschaft, und keine Variante wirkt richtig."
          },
          {
            "t": "Die zwölf Ausstrahlungen am Vorabend – Wiederholung wirkt.",
            "q": 1,
            "f": "Durch die Wiederholung bleibt der Spot hängen und wird erkannt."
          }
        ]
      },
      {
        "s": "Kurz vor Drehbeginn stellt sich heraus, dass ein Darsteller vor Jahren im Wahlwerbespot einer Konkurrenzpartei mitgespielt hat.",
        "o": [
          {
            "t": "Mit ihm drehen – er ist Schauspieler, keine politische Person.",
            "q": -1,
            "f": "Ein Journalist entdeckt die Doppelrolle, und der Spot wird zur Lachnummer."
          },
          {
            "t": "Die Szene so schneiden, dass er nur kurz von hinten zu sehen ist.",
            "q": 0,
            "f": "Es fällt kaum jemandem auf, aber die Szene verliert an Wirkung."
          },
          {
            "t": "Den Darsteller ersetzen und den Dreh um einen Tag verschieben.",
            "q": 1,
            "f": "Ein Tag Verzug, dafür ein Spot ohne Angriffsfläche."
          }
        ]
      },
      {
        "s": "Im Rohschnitt spricht {kandidat} frontal in die Kamera. Testzuschauer finden das steif, loben aber die Klarheit der Aussage.",
        "o": [
          {
            "t": "Einen Profi-Sprecher aus dem Off sprechen lassen und {kandidat} nur im Bild zeigen.",
            "q": -1,
            "f": "Die Kandidatur wirkt wie eine Statistenrolle im eigenen Spot."
          },
          {
            "t": "Die Szene im Gespräch mit echten Menschen neu drehen und die Kernaussage beibehalten.",
            "q": 1,
            "f": "Die Aussage bleibt klar, wirkt aber nun nahbar und lebendig."
          },
          {
            "t": "So lassen – Klarheit ist wichtiger als Lockerheit.",
            "q": 0,
            "f": "Die Botschaft kommt an, die Sympathiewerte bleiben aber mau."
          }
        ]
      },
      {
        "s": "Der Spot zum Thema {thema} enthält eine Zahl, die stimmt, aber aus einer acht Jahre alten Studie stammt. Der Sendetermin ist morgen.",
        "o": [
          {
            "t": "Mit Quellenangabe und Jahreszahl im Bild senden.",
            "q": 0,
            "f": "Formal sauber, doch Kritiker greifen die alten Daten trotzdem auf."
          },
          {
            "t": "Senden wie geplant – die Zahl ist ja korrekt.",
            "q": -1,
            "f": "Ein Faktencheck nennt den Spot „irreführend“ – die Schlagzeile überdeckt die Botschaft."
          },
          {
            "t": "Die Zahl durch eine aktuelle ersetzen oder streichen, auch wenn der Start sich verschiebt.",
            "q": 1,
            "f": "Der Spot startet einen Tag später, ist aber unangreifbar."
          }
        ]
      },
      {
        "s": "Die Mediaagentur weist darauf hin, dass die meisten Menschen den Spot online ohne Ton sehen werden.",
        "o": [
          {
            "t": "Zu Beginn einen Hinweis „Ton an!“ einblenden.",
            "q": 0,
            "f": "Einige schalten den Ton ein, die meisten scrollen weiter."
          },
          {
            "t": "Eine Online-Fassung mit großen Untertiteln und stärkeren Bildern schneiden.",
            "q": 1,
            "f": "Die Fassung funktioniert auch stumm und wird deutlich häufiger zu Ende geschaut."
          },
          {
            "t": "Den Spot unverändert online stellen – die Sprache ist das Herzstück.",
            "q": -1,
            "f": "Ohne Ton versteht kaum jemand die Botschaft, die Abrufzahlen enttäuschen."
          }
        ]
      },
      {
        "s": "Die Kreativen schlagen einen humorvollen Spot vor, der die Konkurrenz augenzwinkernd aufs Korn nimmt. Andere im Team wollen lieber einen ernsten Ton.",
        "o": [
          {
            "t": "Humor ja – aber über die eigenen Schwächen statt über die Konkurrenz.",
            "q": 1,
            "f": "Die Selbstironie wirkt sympathisch und wird viel geteilt."
          },
          {
            "t": "Einen ernsten, klassischen Spot drehen.",
            "q": 0,
            "f": "Solide gemacht, aber einer von vielen."
          },
          {
            "t": "Die Konkurrenz aufs Korn nehmen – Humor bleibt hängen.",
            "q": -1,
            "f": "Die eigenen Anhänger lachen, alle anderen finden den Spot herablassend."
          }
        ]
      },
      {
        "s": "Der Spot soll vor einer Fabrik gedreht werden. Das Unternehmen erlaubt den Dreh nur, wenn sein Name im Spot genannt wird.",
        "o": [
          {
            "t": "Zustimmen und den Firmennamen im Abspann nennen.",
            "q": -1,
            "f": "Kritiker sprechen von Schleichwerbung, und auch die Firma gerät unter Druck."
          },
          {
            "t": "Im Studio vor einer digitalen Fabrikkulisse drehen.",
            "q": 0,
            "f": "Funktioniert, wirkt aber erkennbar künstlich."
          },
          {
            "t": "Auf einem öffentlichen Platz mit Blick auf das Industriegebiet drehen.",
            "q": 1,
            "f": "Die Kulisse wirkt echt, und niemand muss genannt werden."
          }
        ]
      },
      {
        "s": "Ein Sender lehnt den Spot vorerst ab: Im Hintergrund ist kurz das Wappen eines Bundesministeriums zu sehen, was als amtliche Werbung missverstanden werden könnte.",
        "o": [
          {
            "t": "Den Spot dann eben nur online zeigen.",
            "q": 0,
            "f": "Online läuft er, aber die geplante TV-Reichweite fehlt."
          },
          {
            "t": "Öffentlich von Zensur sprechen, um Aufmerksamkeit zu erzeugen.",
            "q": -1,
            "f": "Der Vorwurf verfängt nicht – Fachleute geben dem Sender recht."
          },
          {
            "t": "Die Einstellung austauschen und den Spot noch am selben Tag neu einreichen.",
            "q": 1,
            "f": "Der Spot wird freigegeben und läuft fast ohne Verzögerung."
          }
        ]
      }
    ],
    "social": [
      {
        "s": "Das Budget reicht für eine Plattform. Die wichtigste Zielgruppe für Ihre Kampagne zum Thema {thema} sind Menschen zwischen 18 und 29 Jahren.",
        "o": [
          {
            "t": "Die Plattform, auf der Ihre Partei die meisten Follower hat.",
            "q": 0,
            "f": "Die treuen Fans liken fleißig, aber junge Erstwähler erreichen Sie kaum."
          },
          {
            "t": "Die vorhandenen TV-Spots auf möglichst vielen Kanälen hochladen.",
            "q": -1,
            "f": "Die querformatigen Werbefilme gehen im Feed unter und wirken fehl am Platz."
          },
          {
            "t": "Eine Kurzvideo-Plattform mit eigens gedrehten Hochkant-Clips.",
            "q": 1,
            "f": "Die Clips werden von der Zielgruppe tatsächlich gesehen und weitergeschickt."
          }
        ]
      },
      {
        "s": "Unter einem Video sammeln sich Hunderte wütende Kommentare, darunter auch Beleidigungen. Das Team fragt, wie moderiert werden soll.",
        "o": [
          {
            "t": "Beleidigungen nach klaren, veröffentlichten Regeln entfernen und auf sachliche Kritik antworten.",
            "q": 1,
            "f": "Die Debatte beruhigt sich, und Ihre Antworten werden positiv hervorgehoben."
          },
          {
            "t": "Alle kritischen Kommentare löschen, damit die Stimmung positiv wirkt.",
            "q": -1,
            "f": "Screenshots der Löschungen kursieren – der Vorwurf der Zensur trifft hart."
          },
          {
            "t": "Die Kommentare ignorieren und einfach weiter posten.",
            "q": 0,
            "f": "Der Sturm zieht vorbei, hinterlässt aber einen schlechten Eindruck."
          }
        ]
      },
      {
        "s": "Ein frei erfundenes Zitat von {kandidat} verbreitet sich als Bildkachel und wurde schon tausendfach geteilt.",
        "o": [
          {
            "t": "Nichts tun, um dem Fake keine zusätzliche Aufmerksamkeit zu geben.",
            "q": -1,
            "f": "Das Zitat verfestigt sich und taucht bald als Frage in Interviews auf."
          },
          {
            "t": "Das Fake-Bild mit einem großen „FALSCH“-Stempel selbst posten.",
            "q": 0,
            "f": "Die Richtigstellung erreicht viele – das Fake allerdings auch erneut."
          },
          {
            "t": "Kurz und sachlich richtigstellen, ohne das Bild zu wiederholen, und es der Plattform melden.",
            "q": 1,
            "f": "Die Richtigstellung wird geteilt, und die Plattform markiert das Bild."
          }
        ]
      },
      {
        "s": "Ein Influencer mit großer Reichweite bietet an, gegen Bezahlung positiv über Ihre Kampagne zu posten – ohne Kennzeichnung als Werbung.",
        "o": [
          {
            "t": "Annehmen, aber auf einer klaren Werbekennzeichnung bestehen.",
            "q": 0,
            "f": "Rechtlich sauber, doch seine Follower reagieren skeptisch auf bezahlte Politik."
          },
          {
            "t": "Ablehnen und ihn stattdessen zu einem offenen, unbezahlten Gespräch mit {kandidat} einladen.",
            "q": 1,
            "f": "Er nimmt an, das ungeskriptete Gespräch wirkt glaubwürdig und erreicht viele."
          },
          {
            "t": "Annehmen – Reichweite ist im Wahlkampf alles.",
            "q": -1,
            "f": "Die fehlende Kennzeichnung fliegt auf – es drohen Ärger und Schlagzeilen."
          }
        ]
      },
      {
        "s": "Ein junges Teammitglied schlägt vor, mit {kandidat} ein gerade angesagtes Internet-Meme nachzustellen.",
        "o": [
          {
            "t": "Lieber bei sachlichen Posts bleiben.",
            "q": 0,
            "f": "Seriös, aber die Reichweite bleibt im üblichen Rahmen."
          },
          {
            "t": "Das Meme mit einem vorhandenen Foto von {kandidat} umsetzen, ohne lange zu fragen.",
            "q": -1,
            "f": "Die Kandidatur wusste nichts davon und distanziert sich im Interview – peinlich."
          },
          {
            "t": "Nur machen, wenn {kandidat} den Witz versteht und selbst Lust darauf hat.",
            "q": 1,
            "f": "Die Szene wirkt echt statt bemüht und wird gern geteilt."
          }
        ]
      },
      {
        "s": "Am Abend läuft ein großes TV-Duell. Das Team hat vorab Posts zu jeder denkbaren Aussage vorbereitet und will sie im Minutentakt absetzen.",
        "o": [
          {
            "t": "Ein kleines Live-Team einsetzen, das echte Kernaussagen schnell mit eigenen Clips aufgreift.",
            "q": 1,
            "f": "Ihre Clips gehören zu den meistgeteilten des Abends."
          },
          {
            "t": "Erst am nächsten Morgen eine sorgfältige Zusammenfassung posten.",
            "q": 0,
            "f": "Fehlerfrei, aber die Debatte ist dann längst gelaufen."
          },
          {
            "t": "Die vorbereiteten Posts nach Plan veröffentlichen.",
            "q": -1,
            "f": "Ein Post feiert eine Aussage, die nie gefallen ist – der Spott ist garantiert."
          }
        ]
      },
      {
        "s": "Die Agentur möchte bezahlte Anzeigen extrem fein zuschneiden – mit unterschiedlichen, teils widersprüchlichen Botschaften für verschiedene Zielgruppen.",
        "o": [
          {
            "t": "Mit maximaler Feinsteuerung starten – das bringt die beste Klickrate.",
            "q": -1,
            "f": "Journalisten werten die öffentliche Anzeigenbibliothek aus und finden die Widersprüche."
          },
          {
            "t": "Zielgruppen gezielt ansprechen, aber überall dieselbe Kernaussage verwenden.",
            "q": 1,
            "f": "Die Anzeigen wirken passgenau, ohne angreifbar zu sein."
          },
          {
            "t": "Auf Targeting verzichten und breit streuen.",
            "q": 0,
            "f": "Unangreifbar, aber ein guter Teil des Budgets verpufft."
          }
        ]
      },
      {
        "s": "Mehrere Ihrer Posts bekommen plötzlich auffällig viele Likes von offensichtlichen Bot-Accounts.",
        "o": [
          {
            "t": "Die betroffenen Posts stillschweigend löschen.",
            "q": 0,
            "f": "Das Problem verschwindet, aber auch Ihre Inhalte."
          },
          {
            "t": "Ignorieren – mehr Likes schaden ja nicht.",
            "q": -1,
            "f": "Ein Recherche-Team schreibt über „gekaufte Reichweite“ – und Sie stehen unter Verdacht."
          },
          {
            "t": "Öffentlich klarstellen, dass Sie damit nichts zu tun haben, und die Accounts melden.",
            "q": 1,
            "f": "Die Transparenz nimmt jedem Verdacht den Wind aus den Segeln."
          }
        ]
      },
      {
        "s": "Ein Post enthält einen Tippfehler im Slogan, der eine unfreiwillig komische Bedeutung ergibt. Er wurde schon 2.000 Mal geteilt.",
        "o": [
          {
            "t": "Behaupten, der Fehler sei Absicht gewesen, um Aufmerksamkeit zu erzeugen.",
            "q": -1,
            "f": "Niemand glaubt es, und nun gibt es zwei Witze über Sie."
          },
          {
            "t": "Den Fehler mit einem selbstironischen Folgepost aufgreifen und korrigieren.",
            "q": 1,
            "f": "Der Folgepost wird noch öfter geteilt als der Fehler – mit Sympathie."
          },
          {
            "t": "Den Post kommentarlos löschen und korrigiert neu veröffentlichen.",
            "q": 0,
            "f": "Sauber, aber Screenshots des Fehlers kursieren weiter."
          }
        ]
      },
      {
        "s": "{kandidat} soll eine Live-Fragestunde im Netz geben. Das Team überlegt, nur vorab ausgewählte Fragen zuzulassen.",
        "o": [
          {
            "t": "Nur vorab gesammelte und ausgewählte Fragen beantworten.",
            "q": 0,
            "f": "Die Fragestunde läuft glatt, wirkt aber einstudiert."
          },
          {
            "t": "Mitarbeitende unter Pseudonymen freundliche Fragen stellen lassen.",
            "q": -1,
            "f": "Ein Nutzer erkennt einen Mitarbeiter – der Mitschnitt wird zum Eigentor."
          },
          {
            "t": "Offene Fragen zulassen und nur Beleidigungen von einer Moderation herausfiltern lassen.",
            "q": 1,
            "f": "Auch kritische Fragen werden souverän beantwortet – das wirkt glaubwürdig."
          }
        ]
      }
    ],
    "presse": [
      {
        "s": "Eine Journalistin fragt, wie Ihr Vorschlag zum Thema {thema} finanziert werden soll. Die Gegenfinanzierung ist intern noch nicht beschlossen.",
        "o": [
          {
            "t": "Eine konkrete Summe nennen, die Ihnen plausibel erscheint.",
            "q": -1,
            "f": "Die Zahl wird nachgerechnet, passt nicht – und dominiert die Berichte."
          },
          {
            "t": "Allgemein auf Einsparungen und Wirtschaftswachstum verweisen.",
            "q": 0,
            "f": "Die Antwort wird als ausweichend vermerkt, aber nicht groß thematisiert."
          },
          {
            "t": "Einräumen, dass die Details noch abgestimmt werden, und einen Termin für die Vorlage nennen.",
            "q": 1,
            "f": "Die Offenheit wirkt seriös, und der angekündigte Termin wird notiert."
          }
        ]
      },
      {
        "s": "Während der Pressekonferenz merken Sie, dass Sie eine Zahl um den Faktor zehn falsch genannt haben. Bisher hat es niemand bemerkt.",
        "o": [
          {
            "t": "Nach der Pressekonferenz eine schriftliche Korrektur verschicken.",
            "q": 0,
            "f": "Korrekt, aber einige Liveticker haben die falsche Zahl bereits verbreitet."
          },
          {
            "t": "Noch in der laufenden Pressekonferenz kurz korrigieren.",
            "q": 1,
            "f": "Die Korrektur geht fast unter, und die richtige Zahl steht in allen Berichten."
          },
          {
            "t": "Nichts sagen und hoffen, dass es untergeht.",
            "q": -1,
            "f": "Eine Redaktion rechnet nach – „Kandidatur verrechnet sich“ wird zur Schlagzeile."
          }
        ]
      },
      {
        "s": "Ihre Pressekonferenz zum Thema {thema} ist für 11 Uhr angesetzt. Um 10 Uhr kommt die Eilmeldung über ein schweres Unwetter mit Verletzten.",
        "o": [
          {
            "t": "Wie geplant beginnen, aber mit einigen Worten zum Unwetter einsteigen.",
            "q": 0,
            "f": "Anständig, doch die Hälfte der Journalisten ist längst bei der Eilmeldung."
          },
          {
            "t": "Ihr Thema direkt mit dem Unwetter verknüpfen, um Aktualität zu gewinnen.",
            "q": -1,
            "f": "Der Versuch wirkt pietätlos und bestimmt die Berichterstattung."
          },
          {
            "t": "Kurz Anteilnahme ausdrücken und die Pressekonferenz auf morgen verschieben.",
            "q": 1,
            "f": "Am nächsten Tag ist der Saal voll und die Aufmerksamkeit ungeteilt."
          }
        ]
      },
      {
        "s": "Ein Journalist fragt nach einem Gerücht über Ihr Privatleben, das nichts mit dem Thema der Pressekonferenz zu tun hat.",
        "o": [
          {
            "t": "Ruhig sagen, dass Sie Privates nicht kommentieren, und die nächste Frage aufrufen.",
            "q": 1,
            "f": "Die Pressekonferenz kehrt sofort zum eigentlichen Thema zurück."
          },
          {
            "t": "Den Journalisten scharf zurechtweisen und ihm unseriöse Arbeit vorwerfen.",
            "q": -1,
            "f": "Der Ausbruch wird zum meistgezeigten Ausschnitt des Tages."
          },
          {
            "t": "Das Gerücht ausführlich und Punkt für Punkt widerlegen.",
            "q": 0,
            "f": "Sachlich gelungen, doch nun berichten alle über das Gerücht statt über Ihr Thema."
          }
        ]
      },
      {
        "s": "Ein Journalist stellt drei Fragen auf einmal. Die ersten beiden sind harmlos, die dritte ist heikel.",
        "o": [
          {
            "t": "Darum bitten, die Fragen einzeln zu stellen.",
            "q": 0,
            "f": "Er tut es – und stellt die heikle Frage nun prominent ganz allein."
          },
          {
            "t": "Alle drei der Reihe nach beantworten, auch die heikle.",
            "q": 1,
            "f": "Ihre klare Antwort nimmt der Frage die Brisanz."
          },
          {
            "t": "Nur die ersten beiden beantworten und hoffen, die dritte gerät in Vergessenheit.",
            "q": -1,
            "f": "Er hakt nach, und das Ausweichen wird zur Nachricht."
          }
        ]
      },
      {
        "s": "Kurz vor Beginn fällt auf, dass die Pressemappe noch einen internen Randvermerk enthält: „Zahlen etwas schönen?“. 30 Mappen liegen bereits aus.",
        "o": [
          {
            "t": "Den Vermerk auf den ausgelegten Mappen schnell schwärzen.",
            "q": 0,
            "f": "Die geschwärzten Stellen wecken Neugier – mehrere Journalisten fragen nach."
          },
          {
            "t": "Alle Mappen einsammeln und eine bereinigte Fassung digital verschicken.",
            "q": 1,
            "f": "Etwas Unruhe vor Beginn, aber kein Schaden."
          },
          {
            "t": "Die Mappen liegen lassen – die liest vor Beginn ohnehin niemand.",
            "q": -1,
            "f": "Ein Fotograf hält die Seite fest, und das Bild geht viral."
          }
        ]
      },
      {
        "s": "Sie könnten zur Pressekonferenz zum Thema {thema} eine Fachexpertin mitbringen, die Ihre Position weitgehend, aber nicht in allen Punkten teilt.",
        "o": [
          {
            "t": "Sie einladen und darum bitten, die Unterschiede nicht anzusprechen.",
            "q": -1,
            "f": "Sie spricht sie trotzdem an – und erwähnt Ihre Bitte gleich mit."
          },
          {
            "t": "Sie einladen und die Unterschiede selbst offen benennen.",
            "q": 1,
            "f": "Die unabhängige Stimme macht Ihren Vorschlag glaubwürdiger."
          },
          {
            "t": "Lieber eine Fachpolitikerin der eigenen Partei mitbringen, die voll zustimmt.",
            "q": 0,
            "f": "Harmonisch, aber ohne zusätzliche Überzeugungskraft."
          }
        ]
      },
      {
        "s": "Ihr Eingangsstatement ist auf 15 Minuten angelegt. Die meisten Journalisten haben insgesamt nur eine halbe Stunde Zeit.",
        "o": [
          {
            "t": "Das Statement auf fünf Minuten kürzen und mehr Zeit für Fragen lassen.",
            "q": 1,
            "f": "Die Fragen sind gut, und Ihre Kernbotschaft kommt in allen Berichten vor."
          },
          {
            "t": "Das Statement nur schriftlich verteilen und direkt mit den Fragen beginnen.",
            "q": 0,
            "f": "Effizient, aber den Nachrichten fehlt ein starker Originalton von Ihnen."
          },
          {
            "t": "Das Statement komplett vortragen – die Inhalte sind zu wichtig zum Kürzen.",
            "q": -1,
            "f": "Für Fragen bleibt kaum Zeit, und die Berichte fallen knapp und genervt aus."
          }
        ]
      },
      {
        "s": "Eine große Redaktion bittet um ein exklusives Vorabgespräch, um die Inhalte Ihrer Pressekonferenz schon am Morgen zu bringen.",
        "o": [
          {
            "t": "Zusagen, aber nur ein kurzes Zitat vorab freigeben.",
            "q": 0,
            "f": "Ein kleiner Vorabbericht erscheint, die übrigen Medien murren leise."
          },
          {
            "t": "Zusagen und die anderen Redaktionen nicht informieren.",
            "q": -1,
            "f": "Die übrigen Journalisten fühlen sich übergangen, der Saal bleibt halb leer."
          },
          {
            "t": "Ablehnen und allen Redaktionen die Unterlagen mit Sperrfrist schicken.",
            "q": 1,
            "f": "Alle berichten zeitgleich und gut vorbereitet – niemand fühlt sich übergangen."
          }
        ]
      },
      {
        "s": "Ein Journalist fragt, was Sie vom Vorschlag einer Konkurrenzpartei zum Thema {thema} halten. Er ähnelt Ihrem eigenen in mehreren Punkten.",
        "o": [
          {
            "t": "Sagen, dass Sie die Programme anderer Parteien grundsätzlich nicht kommentieren.",
            "q": 0,
            "f": "Unverfänglich, aber eine Chance zur Profilierung bleibt ungenutzt."
          },
          {
            "t": "Gemeinsamkeiten anerkennen und erklären, wo Ihr Vorschlag weiter geht.",
            "q": 1,
            "f": "Sie wirken souverän, und die Unterschiede werden klar herausgearbeitet."
          },
          {
            "t": "Den Vorschlag als unausgegoren und unseriös abtun.",
            "q": -1,
            "f": "Ein Journalist liest Ihnen die fast gleiche Passage aus Ihrem eigenen Programm vor."
          }
        ]
      }
    ],
    "talkshow": [
      {
        "s": "Die Moderatorin unterbricht dich nach zwanzig Sekunden: „Bitte kurz – was genau wollen Sie zum Thema {thema} ändern?“",
        "o": [
          {
            "t": "Höflich darum bitten, den Gedanken erst zu Ende führen zu dürfen.",
            "q": 0,
            "f": "Du darfst weiterreden, aber die Antwort wirkt langatmig."
          },
          {
            "t": "Die Kernforderung in einem Satz nennen, dann ein greifbares Beispiel.",
            "q": 1,
            "f": "Der Satz wird später als Clip geteilt – klar und zitierfähig."
          },
          {
            "t": "Anmerken, dass man komplexe Themen nicht in Schlagzeilen pressen sollte.",
            "q": -1,
            "f": "Das Publikum hört nur, dass du keine Antwort hast."
          }
        ]
      },
      {
        "s": "Ein Gast in der Runde nennt zum Thema {thema} eine Zahl, die du für deutlich überhöht hältst. Die Kamera schwenkt zu dir.",
        "o": [
          {
            "t": "„Diese Zahl ist schlicht gelogen!“",
            "q": -1,
            "f": "Ohne Beleg steht Aussage gegen Aussage – und du wirkst aggressiv."
          },
          {
            "t": "Die Zahl übergehen und bei der eigenen Botschaft bleiben.",
            "q": 0,
            "f": "Kein Schaden, aber die falsche Zahl bleibt unwidersprochen im Raum."
          },
          {
            "t": "Ruhig die richtige Zahl samt Quelle nennen und anbieten, sie der Redaktion zu schicken.",
            "q": 1,
            "f": "Der spätere Faktencheck gibt dir recht – ein klarer Punktsieg."
          }
        ]
      },
      {
        "s": "Eine Zuschauerin schildert per Videoeinspieler, dass sie trotz Vollzeitjob kaum über die Runden kommt, und fragt: „Was tun Sie konkret für Leute wie mich?“",
        "o": [
          {
            "t": "Sie direkt ansprechen und eine konkrete Maßnahme nennen, die ihr spürbar hilft.",
            "q": 1,
            "f": "Die Antwort wirkt nahbar und verbindlich – viele fühlen sich gemeint."
          },
          {
            "t": "Mit bundesweiten Statistiken erklären, wie groß das Problem insgesamt ist.",
            "q": 0,
            "f": "Sachlich korrekt, aber die Zuschauerin bleibt außen vor."
          },
          {
            "t": "Auf das ausführliche Kapitel im Wahlprogramm verweisen.",
            "q": -1,
            "f": "Im Netz kursiert der Clip als Beispiel für Politik ohne Empathie."
          }
        ]
      },
      {
        "s": "Die Redaktion spielt ein altes Zitat von {kandidat} ein, das dem heutigen Kurs der Partei widerspricht.",
        "o": [
          {
            "t": "Sagen, das Zitat sei aus dem Zusammenhang gerissen.",
            "q": 0,
            "f": "Die Moderation hakt nach, das Thema bleibt länger im Gespräch als nötig."
          },
          {
            "t": "Bestreiten, dass es so gesagt wurde.",
            "q": -1,
            "f": "Die Redaktion zeigt die Originalaufnahme – ein peinlicher Moment."
          },
          {
            "t": "Offen erklären, was sich seitdem geändert hat und warum man dazugelernt hat.",
            "q": 1,
            "f": "Ehrlichkeit kommt gut an, der Vorwurf verpufft."
          }
        ]
      },
      {
        "s": "Zwei andere Gäste streiten laut und gleichzeitig, du kommst seit Minuten nicht zu Wort.",
        "o": [
          {
            "t": "Lauter werden und dich in den Streit einschalten.",
            "q": -1,
            "f": "Für das Publikum ist es nur noch Lärm – niemand erinnert sich an deine Argumente."
          },
          {
            "t": "Abwarten und dann ruhig, fast leise, mit einer Frage an das Publikum einsteigen.",
            "q": 1,
            "f": "Der Kontrast wirkt souverän, plötzlich hören alle zu."
          },
          {
            "t": "Der Moderation per Handzeichen signalisieren, dass du auch etwas sagen möchtest.",
            "q": 0,
            "f": "Du bekommst später das Wort, aber der Moment ist vorbei."
          }
        ]
      },
      {
        "s": "Du wirst nach einer Detailzahl gefragt, die du nicht im Kopf hast.",
        "o": [
          {
            "t": "Eine plausible Zahl schätzen und selbstbewusst nennen.",
            "q": -1,
            "f": "Die Zahl stimmt nicht – am nächsten Tag titelt ein Portal über deinen Fehler."
          },
          {
            "t": "Zugeben, dass du die genaue Zahl nicht parat hast, und das Prinzip erklären.",
            "q": 1,
            "f": "Wirkt ehrlich und kompetent – niemand erwartet ein Lexikon."
          },
          {
            "t": "Geschickt zu einem Thema überleiten, bei dem du sattelfest bist.",
            "q": 0,
            "f": "Funktioniert halbwegs, aber aufmerksame Zuschauer merken das Ausweichen."
          }
        ]
      },
      {
        "s": "Am Vortag der Sendung: Wie bereitest du dich vor?",
        "o": [
          {
            "t": "Ein 40-seitiges Faktendossier durcharbeiten und Zahlen auswendig lernen.",
            "q": 0,
            "f": "Du weißt viel, verlierst dich aber in Details."
          },
          {
            "t": "Drei Kernbotschaften festlegen und ein Probeinterview mit unangenehmen Fragen führen.",
            "q": 1,
            "f": "Du bist auf die harten Fragen vorbereitet und bleibst bei deinen Botschaften."
          },
          {
            "t": "Bewusst nichts vorbereiten – spontan wirkt am authentischsten.",
            "q": -1,
            "f": "Eine unerwartete Frage bringt dich sichtbar ins Schwimmen."
          }
        ]
      },
      {
        "s": "Ein Gast macht einen spitzen Witz über dein Auftreten, das Studiopublikum lacht.",
        "o": [
          {
            "t": "Mit einem kurzen, gutmütigen Konter mitlachen und zurück zur Sache kommen.",
            "q": 1,
            "f": "Das Publikum ist auf deiner Seite – Humor entwaffnet."
          },
          {
            "t": "Den Witz ignorieren und einfach weitermachen.",
            "q": 0,
            "f": "Kein Schaden, aber auch keine Sympathiepunkte."
          },
          {
            "t": "Eine Entschuldigung für den persönlichen Angriff verlangen.",
            "q": -1,
            "f": "Du wirkst dünnhäutig, der Witz wird zum Netz-Hit."
          }
        ]
      },
      {
        "s": "Die Moderation fragt: „Ja oder nein – wird es mit Ihnen höhere Steuern geben?“",
        "o": [
          {
            "t": "„Das kommt darauf an“ – und dann die Abwägungen erläutern.",
            "q": 0,
            "f": "Inhaltlich vertretbar, aber es klingt nach Ausweichen."
          },
          {
            "t": "Mit einer Gegenfrage zur Steuerpolitik der anderen Gäste antworten.",
            "q": -1,
            "f": "Die Moderation lässt nicht locker, du wirkst ertappt."
          },
          {
            "t": "Klar mit Ja oder Nein antworten und in einem Satz begründen.",
            "q": 1,
            "f": "Eindeutige Antwort – genau das wollten die Zuschauer hören."
          }
        ]
      },
      {
        "s": "Nach der Sendung meldet ein Faktencheck, dass eine deiner Zahlen veraltet war. Die Aussage stimmt aber auch mit der aktuellen Zahl noch.",
        "o": [
          {
            "t": "Darauf bestehen, dass die alte Zahl aussagekräftiger sei.",
            "q": -1,
            "f": "Der Streit um die Zahl wird zur eigenen Geschichte."
          },
          {
            "t": "Schweigen – das Thema wird sich schon legen.",
            "q": 0,
            "f": "Es legt sich tatsächlich, bleibt aber als kleiner Makel hängen."
          },
          {
            "t": "Selbst die aktuelle Zahl posten und zeigen, dass die Kernaussage weiter gilt.",
            "q": 1,
            "f": "Die Korrektur wirkt souverän und stärkt deine Glaubwürdigkeit."
          }
        ]
      }
    ],
    "online": [
      {
        "s": "Du hast 20.000 € Budget, um Erstwählerinnen und Erstwähler zu erreichen. Die Agentur schlägt drei Wege vor.",
        "o": [
          {
            "t": "Mehrere kurze Hochkant-Videos mit kleinem Budget testen, dann auf die besten setzen.",
            "q": 1,
            "f": "Die Testphase zeigt schnell, was wirkt – das Budget arbeitet doppelt."
          },
          {
            "t": "Das gesamte Budget in Suchmaschinenanzeigen stecken.",
            "q": 0,
            "f": "Erreicht vor allem die, die ohnehin schon suchen."
          },
          {
            "t": "Ein einziges aufwendiges Video produzieren und alles auf einen Tag konzentrieren.",
            "q": -1,
            "f": "Das Video floppt – und das Budget ist weg."
          }
        ]
      },
      {
        "s": "Die Agentur will Anzeigen gezielt an Menschen ausspielen, die sich laut Plattformdaten für bestimmte Krankheiten interessieren.",
        "o": [
          {
            "t": "Statt der Krankheiten breitere Interessen wie „Gesundheit“ nutzen.",
            "q": 0,
            "f": "Rechtlich weniger heikel, aber ungenau und teuer."
          },
          {
            "t": "Ablehnen: Gesundheitsdaten sind besonders geschützt und für politische Werbung tabu.",
            "q": 1,
            "f": "Ihr bleibt sauber – eine andere Partei landet für so etwas in den Schlagzeilen."
          },
          {
            "t": "Zustimmen – die Plattform bietet die Option ja an.",
            "q": -1,
            "f": "Datenschützer schlagen Alarm, die Kampagne wird gestoppt."
          }
        ]
      },
      {
        "s": "A/B-Test: Motiv A bekommt doppelt so viele Klicks, Motiv B führt zu deutlich mehr Newsletter-Anmeldungen.",
        "o": [
          {
            "t": "Motiv A ausspielen – Reichweite ist im Wahlkampf alles.",
            "q": -1,
            "f": "Viele Klicks, wenig Wirkung."
          },
          {
            "t": "Motiv B ausspielen, weil es das eigentliche Ziel erfüllt.",
            "q": 1,
            "f": "Die Anmeldungen steigen – diese Menschen erreichst du wieder."
          },
          {
            "t": "Den Test mit doppeltem Budget noch eine Woche verlängern.",
            "q": 0,
            "f": "Mehr Daten, aber wertvolle Zeit verstreicht."
          }
        ]
      },
      {
        "s": "Die Plattform lehnt deine Anzeige ab: Die vorgeschriebene Angabe, wer die politische Werbung bezahlt, fehlt.",
        "o": [
          {
            "t": "Die Anzeige über das private Konto eines Helfers schalten.",
            "q": -1,
            "f": "Das fliegt auf – Vorwurf der verdeckten Wahlwerbung."
          },
          {
            "t": "Widerspruch einlegen und auf eine Prüfung durch Menschen hoffen.",
            "q": 0,
            "f": "Die Prüfung dauert Tage, die Anzeige läuft verspätet."
          },
          {
            "t": "Auftraggeber-Angabe ergänzen und die Anzeige neu einreichen.",
            "q": 1,
            "f": "Nach wenigen Stunden ist die Anzeige freigegeben."
          }
        ]
      },
      {
        "s": "Für das Anzeigenmotiv stehen drei Entwürfe zur Auswahl.",
        "o": [
          {
            "t": "Ein echtes Foto von Ehrenamtlichen bei einer Aktion im Wahlkreis.",
            "q": 1,
            "f": "Das Motiv wirkt authentisch und wird oft geteilt."
          },
          {
            "t": "Eine Grafik mit Slogan in Parteifarben.",
            "q": 0,
            "f": "Solide, aber geht im Feed unter."
          },
          {
            "t": "Ein KI-generiertes Bild einer glücklichen Familie, ohne Kennzeichnung.",
            "q": -1,
            "f": "Nutzer entlarven das Bild – der Spott ist groß."
          }
        ]
      },
      {
        "s": "Deine Anzeige wird manchen Nutzern über 15-mal pro Woche gezeigt. In den Kommentaren häufen sich genervte Reaktionen.",
        "o": [
          {
            "t": "Die Kommentarfunktion ausblenden.",
            "q": 0,
            "f": "Ruhe in den Kommentaren, der Ärger bleibt aber."
          },
          {
            "t": "Budget erhöhen – die Botschaft kommt offensichtlich an.",
            "q": -1,
            "f": "Aus Nervigkeit wird Ablehnung."
          },
          {
            "t": "Eine Frequenzbegrenzung setzen und neue Motive rotieren lassen.",
            "q": 1,
            "f": "Weniger Wiederholung, mehr neue Menschen erreicht."
          }
        ]
      },
      {
        "s": "Jemand schlägt vor, die komplette Mitgliederliste mit E-Mail-Adressen bei der Plattform hochzuladen, um ähnliche Zielgruppen zu finden.",
        "o": [
          {
            "t": "Nur Kontakte hochladen, die dafür nachweislich eingewilligt haben.",
            "q": 1,
            "f": "Kleinere Liste, aber rechtssicher und trotzdem wirksam."
          },
          {
            "t": "Ganz darauf verzichten und breit nach Region ausspielen.",
            "q": 0,
            "f": "Sicher, aber deutlich weniger zielgenau."
          },
          {
            "t": "Die ganze Liste hochladen – die Daten sind ja verschlüsselt.",
            "q": -1,
            "f": "Eine Beschwerde bei der Datenschutzbehörde folgt."
          }
        ]
      },
      {
        "s": "Ein Wahlvideo ist fertig. Das Team will einen aktuellen Charthit unterlegen, „nur 15 Sekunden, das ist erlaubt“.",
        "o": [
          {
            "t": "Den Hit verwenden – so kurze Ausschnitte sind frei.",
            "q": -1,
            "f": "Das Video wird wegen Urheberrechtsverletzung gesperrt."
          },
          {
            "t": "Lizenzfreie Musik nutzen, aber auf Untertitel verzichten.",
            "q": 0,
            "f": "Rechtlich sauber, doch wer ohne Ton schaut, versteht nichts."
          },
          {
            "t": "Untertitel einbrennen und lizenzfreie Musik nutzen.",
            "q": 1,
            "f": "Das Video funktioniert auch stumm – und bleibt online."
          }
        ]
      },
      {
        "s": "Zielgruppe diesmal: Menschen über 65, die online aktiv sind.",
        "o": [
          {
            "t": "Dasselbe Motiv wie für die Jungen nehmen, nur andere Altersgruppe.",
            "q": 0,
            "f": "Erreicht die Leute, berührt sie aber kaum."
          },
          {
            "t": "Ausschließlich in einer Kurzvideo-App werben.",
            "q": -1,
            "f": "Dort ist die Zielgruppe kaum unterwegs – teure Leerläufe."
          },
          {
            "t": "Auf Nachrichtenseiten und in sozialen Netzwerken mit großer Schrift und klarer Botschaft werben.",
            "q": 1,
            "f": "Die Anzeigen werden gelesen und kommentiert."
          }
        ]
      },
      {
        "s": "Eine große Plattform kündigt an, ab nächster Woche keine neuen politischen Anzeigen mehr anzunehmen.",
        "o": [
          {
            "t": "Anzeigen jetzt freigeben lassen und zeitgesteuert für später planen.",
            "q": 1,
            "f": "Die Anzeigen laufen pünktlich in der Schlussphase."
          },
          {
            "t": "Budget auf andere Kanäle verschieben.",
            "q": 0,
            "f": "Funktioniert, aber die Reichweite sinkt."
          },
          {
            "t": "Die Anzeigen künftig als „gesellschaftliches Thema“ statt als politisch einreichen.",
            "q": -1,
            "f": "Die Plattform sperrt das Werbekonto komplett."
          }
        ]
      }
    ],
    "angriff": [
      {
        "s": "Ein anonymer Blog behauptet, die Konkurrenz habe ein zentrales Versprechen gebrochen. Das Team will das sofort aufgreifen.",
        "o": [
          {
            "t": "Mit „Es heißt, …“ vorsichtig formulieren und veröffentlichen.",
            "q": 0,
            "f": "Die Andeutung verbreitet sich, wirkt aber unseriös."
          },
          {
            "t": "Erst Abstimmungsprotokolle und Beschlüsse prüfen und nur Belegtes verwenden.",
            "q": 1,
            "f": "Die Belege halten stand – der Vorwurf sitzt."
          },
          {
            "t": "Sofort plakatieren, bevor es jemand anderes tut.",
            "q": -1,
            "f": "Der Blog lag falsch – die Blamage ist eure."
          }
        ]
      },
      {
        "s": "Der Plakatentwurf zeigt die Spitzenkandidatur der Konkurrenz als überzeichnete Karikatur.",
        "o": [
          {
            "t": "Die Karikatur nehmen, sie ist witzig und auffällig.",
            "q": -1,
            "f": "Viele empfinden es als persönlich herabsetzend – Mitleid mit der Konkurrenz."
          },
          {
            "t": "Stattdessen beide Positionen nebeneinanderstellen, zugespitzt, aber sachlich.",
            "q": 1,
            "f": "Der Vergleich bleibt im Kopf und ist kaum angreifbar."
          },
          {
            "t": "Die Karikatur etwas entschärfen und dann verwenden.",
            "q": 0,
            "f": "Weniger Ärger, aber auch weniger Wirkung."
          }
        ]
      },
      {
        "s": "Die Konkurrenz kontert: Auch eure Partei habe in der Sache schon einmal anders abgestimmt.",
        "o": [
          {
            "t": "Den Unterschied kurz erklären und zum eigentlichen Vergleich zurückkehren.",
            "q": 1,
            "f": "Der Konter verpufft, deine Botschaft bleibt im Mittelpunkt."
          },
          {
            "t": "Sofort mit einem neuen, noch härteren Vorwurf nachlegen.",
            "q": -1,
            "f": "Es entsteht eine Schlammschlacht, von der niemand profitiert."
          },
          {
            "t": "Den Gegenvorwurf ignorieren.",
            "q": 0,
            "f": "Er verbreitet sich unwidersprochen weiter."
          }
        ]
      },
      {
        "s": "Ein Journalist fragt: „Fördern solche Angriffe nicht die Politikverdrossenheit?“",
        "o": [
          {
            "t": "„Die anderen haben damit angefangen.“",
            "q": -1,
            "f": "Klingt nach Schulhof – die Schlagzeile ist euch sicher."
          },
          {
            "t": "„Kein Kommentar.“",
            "q": 0,
            "f": "Der Artikel erscheint ohne eure Sicht."
          },
          {
            "t": "„Wähler haben ein Recht auf einen klaren Vergleich – hier sind die Belege zu jeder Aussage.“",
            "q": 1,
            "f": "Der Journalist zitiert die Belege – das stärkt die Kampagne."
          }
        ]
      },
      {
        "s": "Ein Zitat aus der Konkurrenz wirkt verkürzt deutlich schärfer als im Original.",
        "o": [
          {
            "t": "Die verkürzte Fassung nutzen, aber den Link zum Original dazustellen.",
            "q": 0,
            "f": "Kritiker werfen euch trotzdem Verzerrung vor."
          },
          {
            "t": "Die verkürzte Fassung ohne Kontext nutzen.",
            "q": -1,
            "f": "Ein Faktencheck entlarvt die Verkürzung."
          },
          {
            "t": "Das vollständige Zitat verwenden, auch wenn es weniger knackig ist.",
            "q": 1,
            "f": "Unangreifbar – und es wirkt trotzdem."
          }
        ]
      },
      {
        "s": "Im Team kursiert ein Gerücht über das Privatleben eines Kandidaten der Konkurrenz.",
        "o": [
          {
            "t": "Intern stoppen und bei Nachfragen klar sagen: Privates ist kein Wahlkampfthema.",
            "q": 1,
            "f": "Ihr gewinnt Respekt über Parteigrenzen hinweg."
          },
          {
            "t": "Nicht aufgreifen, aber auch nichts dazu sagen.",
            "q": 0,
            "f": "Das Gerücht verbreitet sich trotzdem – mit euch in Verbindung gebracht."
          },
          {
            "t": "In einer Rede eine vieldeutige Andeutung machen.",
            "q": -1,
            "f": "Die Andeutung wird zum Skandal – über euch."
          }
        ]
      },
      {
        "s": "Bei wem soll die Vergleichskampagne ausgespielt werden?",
        "o": [
          {
            "t": "Bei Anhängern der Konkurrenz, um sie umzustimmen.",
            "q": -1,
            "f": "Trotzreaktion – sie stehen jetzt noch fester zu ihrer Partei."
          },
          {
            "t": "Bei Unentschlossenen, kombiniert mit eurem eigenen Angebot.",
            "q": 1,
            "f": "Der Vergleich hilft genau denen, die noch abwägen."
          },
          {
            "t": "Bei den eigenen Stammwählern zur Mobilisierung.",
            "q": 0,
            "f": "Motiviert die eigenen Leute, bringt aber kaum neue Stimmen."
          }
        ]
      },
      {
        "s": "Ein Faktencheck-Portal bewertet eine eurer Aussagen über die Konkurrenz als „teilweise falsch“.",
        "o": [
          {
            "t": "Dem Portal Parteilichkeit vorwerfen.",
            "q": -1,
            "f": "Das Portal legt nach – jetzt mit noch mehr Reichweite."
          },
          {
            "t": "Die Aussage präzisieren und die korrigierte Fassung veröffentlichen.",
            "q": 1,
            "f": "Die neue Fassung wird als korrekt bestätigt – Glaubwürdigkeit gerettet."
          },
          {
            "t": "Das Portal ignorieren.",
            "q": 0,
            "f": "Die Bewertung taucht in jedem Artikel über die Kampagne auf."
          }
        ]
      },
      {
        "s": "Ein satirischer Clip über die Konkurrenz kommt im Team super an.",
        "o": [
          {
            "t": "Ihn sofort groß als Anzeige schalten.",
            "q": -1,
            "f": "Außerhalb der eigenen Blase wird der Humor als gehässig empfunden."
          },
          {
            "t": "Ihn auf dem eigenen Kanal posten.",
            "q": 0,
            "f": "Die Fans lachen, sonst sieht ihn kaum jemand."
          },
          {
            "t": "Ihn vorher mit Menschen außerhalb der Partei testen.",
            "q": 1,
            "f": "Nach kleinen Änderungen trifft er auch bei Neutralen ins Schwarze."
          }
        ]
      },
      {
        "s": "Die Konkurrenz droht mit einer Unterlassungsklage wegen einer eurer Aussagen.",
        "o": [
          {
            "t": "Die Aussage sofort zurückziehen.",
            "q": 0,
            "f": "Ärger vermieden, aber es wirkt wie ein Eingeständnis."
          },
          {
            "t": "Juristisch prüfen lassen und, wenn belegt, Aussage halten und Belege veröffentlichen.",
            "q": 1,
            "f": "Die Drohung läuft ins Leere, die Belege überzeugen."
          },
          {
            "t": "Die Drohung ignorieren und die Aussage noch zuspitzen.",
            "q": -1,
            "f": "Eine einstweilige Verfügung zwingt euch zur Rücknahme."
          }
        ]
      }
    ],
    "briefwahl": [
      {
        "s": "Wann sollen die Erinnerungen zur Briefwahl verschickt werden?",
        "o": [
          {
            "t": "Eine einzige Erinnerung eine Woche vor der Wahl.",
            "q": 0,
            "f": "Manche schaffen den Antrag noch, viele sind zu spät dran."
          },
          {
            "t": "Am Wahlwochenende, dann ist das Thema präsent.",
            "q": -1,
            "f": "Für die Briefwahl ist es da praktisch zu spät."
          },
          {
            "t": "Sobald Anträge möglich sind, und noch einmal gut zwei Wochen vor der Wahl.",
            "q": 1,
            "f": "Viele beantragen früh – und denken rechtzeitig ans Zurückschicken."
          }
        ]
      },
      {
        "s": "Ihr gestaltet einen Flyer, der zur Beantragung der Briefwahl anregen soll.",
        "o": [
          {
            "t": "Erklären, dass man per QR-Code auf der Wahlbenachrichtigung online beantragen kann.",
            "q": 1,
            "f": "Viele beantragen direkt vom Sofa aus."
          },
          {
            "t": "Auf ein eigenes Partei-Formular verweisen, über das ihr die Anträge sammelt.",
            "q": -1,
            "f": "Datenschutzbedenken und fehlende Vollmachten – Ärger mit dem Wahlamt."
          },
          {
            "t": "Allgemein darauf hinweisen, dass man beim Rathaus beantragen kann.",
            "q": 0,
            "f": "Richtig, aber viele schieben es auf."
          }
        ]
      },
      {
        "s": "Bei einem Hausbesuch bittet eine ältere Dame den Ehrenamtlichen, ihren Stimmzettel für sie auszufüllen.",
        "o": [
          {
            "t": "Nur kurz erklären, wie es geht, und weiterziehen.",
            "q": 0,
            "f": "Korrekt, aber sie bleibt unsicher zurück."
          },
          {
            "t": "Ausfüllen, wie sie es sagt, und den Wahlbrief gleich mitnehmen.",
            "q": -1,
            "f": "Als Wahlkämpfer hier zu helfen, wirkt wie Beeinflussung – es gibt Beschwerden."
          },
          {
            "t": "Freundlich ablehnen und vorschlagen, dass eine Vertrauensperson aus ihrem Umfeld hilft.",
            "q": 1,
            "f": "Sie fühlt sich ernst genommen, und alles bleibt einwandfrei."
          }
        ]
      },
      {
        "s": "Am Donnerstag vor der Wahl fragt ein Wähler, ob er seinen ausgefüllten Wahlbrief noch per Post schicken kann.",
        "o": [
          {
            "t": "„Heute noch einwerfen, das klappt meistens.“",
            "q": 0,
            "f": "Er hat Glück – aber manche Briefe kommen zu spät."
          },
          {
            "t": "Empfehlen, ihn direkt bei der auf dem Umschlag angegebenen Stelle abzugeben – er muss am Wahltag um 18 Uhr dort sein.",
            "q": 1,
            "f": "Der Brief ist sicher rechtzeitig da."
          },
          {
            "t": "„Kein Problem, der Poststempel bis Samstag zählt.“",
            "q": -1,
            "f": "Falsch – es zählt allein der Eingang bis 18 Uhr am Wahltag."
          }
        ]
      },
      {
        "s": "Viele Wahlbriefe sind ungültig, weil Fehler beim Verpacken passieren. Wie klärt ihr auf?",
        "o": [
          {
            "t": "Ein fünfminütiges Erklärvideo mit allen Details zum Wahlrecht.",
            "q": -1,
            "f": "Kaum jemand schaut es bis zum Ende."
          },
          {
            "t": "Eine Grafik mit drei Schritten: Stimmzettel in den blauen Umschlag, Wahlschein unterschreiben, beides in den roten.",
            "q": 1,
            "f": "Einfach, merkbar und tausendfach geteilt."
          },
          {
            "t": "Auf die offizielle Anleitung der Wahlleitung verlinken.",
            "q": 0,
            "f": "Korrekt, aber nur wenige klicken darauf."
          }
        ]
      },
      {
        "s": "Ehrenamtliche schlagen vor, an Haustüren ausgefüllte Wahlbriefe einzusammeln und gesammelt abzugeben.",
        "o": [
          {
            "t": "Nicht einsammeln, sondern auf Briefkästen und Abgabestellen des Wahlamts hinweisen.",
            "q": 1,
            "f": "Kein Anschein von Manipulation, und die Briefe kommen trotzdem an."
          },
          {
            "t": "Nur mitnehmen, wenn jemand ausdrücklich darum bittet.",
            "q": 0,
            "f": "Gut gemeint, sorgt aber für kritische Nachfragen."
          },
          {
            "t": "Systematisch einsammeln, das erhöht die Rücklaufquote.",
            "q": -1,
            "f": "Die Presse wittert Wahlbetrug – ein Desaster."
          }
        ]
      },
      {
        "s": "Ehrenamtliche fragen, ob man herausfinden kann, wer schon Briefwahl beantragt hat, um gezielt nachzufassen.",
        "o": [
          {
            "t": "Einen Bekannten im Wahlamt um die Liste bitten.",
            "q": -1,
            "f": "Ein schwerer Datenschutzverstoß – mit Folgen für beide."
          },
          {
            "t": "Eine offizielle Anfrage an die Gemeinde stellen.",
            "q": 0,
            "f": "Abgelehnt – Zeit verloren, aber kein Schaden."
          },
          {
            "t": "Erklären, dass diese Daten geschützt sind, und alle Unterstützer gleichermaßen erinnern.",
            "q": 1,
            "f": "Die Erinnerung erreicht alle – ohne Datenprobleme."
          }
        ]
      },
      {
        "s": "Eine Wählerin meldet sich: Ihre Wahlbenachrichtigung ist nicht angekommen, sie möchte aber per Brief wählen.",
        "o": [
          {
            "t": "Raten, beim Wahlamt zu prüfen, ob sie im Wählerverzeichnis steht, und dort mit Ausweis zu beantragen.",
            "q": 1,
            "f": "Sie bekommt ihre Unterlagen und kann wählen."
          },
          {
            "t": "Ihr sagen, sie solle abwarten, der Brief komme sicher noch.",
            "q": 0,
            "f": "Er kommt spät – es wird knapp."
          },
          {
            "t": "Ihr sagen, ohne Wahlbenachrichtigung gehe es leider nicht.",
            "q": -1,
            "f": "Falsch – eine Stimme geht unnötig verloren."
          }
        ]
      },
      {
        "s": "Studierende fragen, wie sie wählen können, obwohl sie am Wahltag weit weg vom Heimatort sind.",
        "o": [
          {
            "t": "Empfehlen, am Wahlsonntag nach Hause zu fahren.",
            "q": 0,
            "f": "Einige tun es, viele verzichten lieber."
          },
          {
            "t": "Raten, einfach im Wahllokal am Studienort zu wählen.",
            "q": -1,
            "f": "Ohne Eintrag dort werden sie abgewiesen."
          },
          {
            "t": "Erklären, dass man die Briefwahlunterlagen an eine andere Adresse schicken lassen kann.",
            "q": 1,
            "f": "Die Unterlagen kommen direkt in die WG."
          }
        ]
      },
      {
        "s": "Ein Unterstützer wird am Samstag vor der Wahl plötzlich krank und kann nicht ins Wahllokal. Die normale Antragsfrist ist vorbei.",
        "o": [
          {
            "t": "Ihm sagen, dass es dafür leider zu spät ist.",
            "q": 0,
            "f": "Gut gemeint, aber eine Stimme geht verloren."
          },
          {
            "t": "Darauf hinweisen, dass er bei plötzlicher Erkrankung noch bis Wahltag 15 Uhr einen Wahlschein beantragen kann.",
            "q": 1,
            "f": "Eine Vertrauensperson holt die Unterlagen mit Vollmacht ab – er wählt."
          },
          {
            "t": "Vorschlagen, dass jemand mit seiner Wahlbenachrichtigung für ihn wählen geht.",
            "q": -1,
            "f": "Das ist unzulässig – Ärger statt Stimme."
          }
        ]
      }
    ],
    "spenden": [
      {
        "s": "Ein Unternehmer möchte beim Dinner 50.000 € spenden.",
        "o": [
          {
            "t": "Annehmen und die Spende unverzüglich der Bundestagspräsidentin anzeigen.",
            "q": 1,
            "f": "Alles korrekt und veröffentlicht – kein Angriffspunkt."
          },
          {
            "t": "Aus Sorge vor Schlagzeilen ablehnen.",
            "q": 0,
            "f": "Sauber, aber die Kasse bleibt leer."
          },
          {
            "t": "Ihn bitten, zweimal 25.000 € zu überweisen, damit es nicht sofort veröffentlicht wird.",
            "q": -1,
            "f": "Die Stückelung fliegt auf – der Vorwurf der Umgehung wiegt schwer."
          }
        ]
      },
      {
        "s": "Ein Gast will dir am Ende des Abends 2.000 € in bar überreichen.",
        "o": [
          {
            "t": "1.000 € bar annehmen und für den Rest um eine Überweisung bitten.",
            "q": 0,
            "f": "Zulässig, aber umständlich und nicht ganz glücklich."
          },
          {
            "t": "Alles bar annehmen und ordentlich quittieren.",
            "q": -1,
            "f": "Barspenden über 1.000 € sind unzulässig – auch mit Quittung."
          },
          {
            "t": "Freundlich um eine Überweisung bitten, gern mit Spendenquittung.",
            "q": 1,
            "f": "Die Spende kommt korrekt und nachvollziehbar an."
          }
        ]
      },
      {
        "s": "Ein Branchenverband möchte einen ganzen Tisch kaufen – gerade läuft ein Gesetzgebungsverfahren, das ihn betrifft.",
        "o": [
          {
            "t": "Zusagen und dem Verband ein Gespräch zum Gesetzentwurf in Aussicht stellen.",
            "q": -1,
            "f": "Spenden in Erwartung eines Vorteils sind unzulässig – ein Skandal droht."
          },
          {
            "t": "Teilnahme ermöglichen, aber klar sagen: kein Einfluss auf das Gesetz, alles wird korrekt dokumentiert.",
            "q": 1,
            "f": "Transparent und rechtssicher – die Einnahme bleibt."
          },
          {
            "t": "Den Tisch vorsorglich ablehnen.",
            "q": 0,
            "f": "Kein Risiko, aber auch keine Einnahme."
          }
        ]
      },
      {
        "s": "Ein Unternehmer bietet an, seinen Festsaal kostenlos für das Dinner zur Verfügung zu stellen.",
        "o": [
          {
            "t": "Annehmen und die Überlassung als Sachspende mit Marktwert verbuchen.",
            "q": 1,
            "f": "Ihr spart Geld, und alles ist korrekt ausgewiesen."
          },
          {
            "t": "Annehmen – ist ja kein Geld, also keine Spende.",
            "q": -1,
            "f": "Auch Sachleistungen sind Spenden – die Nachprüfung wird unangenehm."
          },
          {
            "t": "Ablehnen und ein Luxushotel mieten.",
            "q": 0,
            "f": "Teuer – und die Fotos wirken abgehoben."
          }
        ]
      },
      {
        "s": "Du hältst die Tischrede vor den Gästen.",
        "o": [
          {
            "t": "Eine Grundsatzrede zum Wahlprogramm.",
            "q": 0,
            "f": "Höflicher Applaus, aber wenig Spendenbereitschaft."
          },
          {
            "t": "Konkret zeigen, was mit dem Geld passiert – etwa wie viele Plakate oder Veranstaltungen 100 € ermöglichen.",
            "q": 1,
            "f": "Die Gäste sehen die Wirkung – die Spenden steigen."
          },
          {
            "t": "Versprechen, dich nach der Wahl für die Anliegen der Anwesenden einzusetzen.",
            "q": -1,
            "f": "Das klingt nach gekauftem Einfluss – ein Gast plaudert es aus."
          }
        ]
      },
      {
        "s": "Nach dem Dinner findet ihr einen Umschlag mit 800 € ohne Namen auf einem Tisch.",
        "o": [
          {
            "t": "Den Betrag in die Kasse geben – Spende ist Spende.",
            "q": -1,
            "f": "Anonyme Spenden über 500 € sind unzulässig – ein Rechenschaftsproblem."
          },
          {
            "t": "Den Umschlag beiseitelegen und nach der Wahl entscheiden.",
            "q": 0,
            "f": "Aufgeschoben ist nicht gelöst – die Frist für die Weiterleitung droht."
          },
          {
            "t": "Versuchen, den Spender über die Gästeliste zu ermitteln, sonst das Geld an die Bundestagsverwaltung weiterleiten.",
            "q": 1,
            "f": "Der Spender meldet sich – die Spende ist nun korrekt verbucht."
          }
        ]
      },
      {
        "s": "Ihr legt den Ticketpreis fest. Das Essen kostet pro Person rund 80 €.",
        "o": [
          {
            "t": "100 € pro Gedeck, damit möglichst viele kommen.",
            "q": 0,
            "f": "Volles Haus, aber kaum Überschuss."
          },
          {
            "t": "500 € pro Gedeck mit dem Hinweis, alles sei für Firmen steuerlich absetzbar.",
            "q": -1,
            "f": "Falsch – Firmen können Parteispenden nicht absetzen. Gäste fühlen sich getäuscht."
          },
          {
            "t": "300 € pro Gedeck mit ausgewiesenem Spendenanteil und korrekter Quittung.",
            "q": 1,
            "f": "Gute Einnahmen, transparente Buchung."
          }
        ]
      },
      {
        "s": "Eine Lokalzeitung fragt, wer zum Spendendinner kommt und warum es stattfindet.",
        "o": [
          {
            "t": "Die Veranstaltung bestreiten.",
            "q": -1,
            "f": "Ein Foto vom Eingang taucht auf – jetzt wird es eine Geschichte."
          },
          {
            "t": "Die Journalistin zur Rede einladen und auf die gesetzliche Veröffentlichung von Großspenden verweisen.",
            "q": 1,
            "f": "Der Bericht ist neutral – Offenheit nimmt dem Thema die Spannung."
          },
          {
            "t": "„Kein Kommentar“ zur Gästeliste.",
            "q": 0,
            "f": "Der Artikel klingt etwas geheimnisvoller als nötig."
          }
        ]
      },
      {
        "s": "Ein Geschäftsmann aus einem Nicht-EU-Staat, ohne deutsche Staatsangehörigkeit, will 5.000 € spenden.",
        "o": [
          {
            "t": "Vorschlagen, das Geld über einen deutschen Bekannten spenden zu lassen.",
            "q": -1,
            "f": "Eine Strohmannspende – illegal und ein Skandal."
          },
          {
            "t": "Erklären, dass ihr von ihm höchstens 1.000 € annehmen dürft.",
            "q": 1,
            "f": "Er spendet den zulässigen Betrag – alles korrekt."
          },
          {
            "t": "Die Spende komplett ablehnen.",
            "q": 0,
            "f": "Auf der sicheren Seite, aber unnötig vorsichtig."
          }
        ]
      },
      {
        "s": "Mehrere Großspender wünschen sich einen Platz direkt neben {kandidat}.",
        "o": [
          {
            "t": "{kandidat} wechselt nach jedem Gang den Tisch.",
            "q": 1,
            "f": "Alle Gäste fühlen sich wertgeschätzt."
          },
          {
            "t": "{kandidat} sitzt den ganzen Abend am Tisch der Großspender.",
            "q": 0,
            "f": "Die Großspender sind zufrieden, die anderen Gäste weniger."
          },
          {
            "t": "Die Plätze neben {kandidat} gegen Aufpreis versteigern.",
            "q": -1,
            "f": "„Politik zu kaufen“ titelt die Presse am nächsten Tag."
          }
        ]
      }
    ]
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SCENARIOS;
  } else {
    root.BTW_SCENARIOS = SCENARIOS;
  }
})(this);
