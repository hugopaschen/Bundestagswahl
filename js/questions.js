/*
 * Fragen der Fachkonferenz: 30 Faktenfragen je Thema (Stand Oktober 2026), mittlere Schwierigkeit.
 * q = Frage, a = vier Antworten, c = Index der richtigen Antwort, e = kurze Erklärung.
 */
(function (root) {
  var QUESTIONS = {
    "wirtschaft": [
      {
        "q": "Welche Institution ist für die Geldpolitik im Euroraum zuständig?",
        "a": [
          "Bundesfinanzministerium",
          "Europäische Zentralbank",
          "Deutsche Bundesbank",
          "Europäische Kommission"
        ],
        "c": 1,
        "e": "Die EZB legt im Euroraum die Leitzinsen fest; die Bundesbank ist Teil des Eurosystems."
      },
      {
        "q": "In welcher Stadt hat die Europäische Zentralbank ihren Sitz?",
        "a": [
          "Brüssel",
          "Luxemburg",
          "Straßburg",
          "Frankfurt am Main"
        ],
        "c": 3,
        "e": "Die EZB sitzt seit ihrer Gründung 1998 in Frankfurt am Main."
      },
      {
        "q": "Welche Inflationsrate strebt die EZB mittelfristig an?",
        "a": [
          "0 Prozent",
          "3 Prozent",
          "2 Prozent",
          "1 Prozent"
        ],
        "c": 2,
        "e": "Seit ihrer Strategieüberprüfung 2021 verfolgt die EZB ein symmetrisches Inflationsziel von 2 Prozent."
      },
      {
        "q": "Wie hoch ist der reguläre Mehrwertsteuersatz in Deutschland?",
        "a": [
          "16 Prozent",
          "19 Prozent",
          "21 Prozent",
          "17 Prozent"
        ],
        "c": 1,
        "e": "Der Regelsatz beträgt 19 Prozent, der ermäßigte Satz etwa für viele Lebensmittel 7 Prozent."
      },
      {
        "q": "Wie viel strukturelle Neuverschuldung erlaubt die Schuldenbremse dem Bund pro Jahr?",
        "a": [
          "3 % des BIP",
          "0,5 % des BIP",
          "1 % des BIP",
          "0,35 % des BIP"
        ],
        "c": 3,
        "e": "Art. 115 GG begrenzt die strukturelle Kreditaufnahme des Bundes auf 0,35 Prozent des Bruttoinlandsprodukts."
      },
      {
        "q": "In welchem Jahr wurde die Schuldenbremse ins Grundgesetz aufgenommen?",
        "a": [
          "1999",
          "2013",
          "2009",
          "2002"
        ],
        "c": 2,
        "e": "Die Schuldenbremse wurde 2009 im Rahmen der Föderalismusreform II beschlossen."
      },
      {
        "q": "Welche Behörde berechnet die offizielle Inflationsrate in Deutschland?",
        "a": [
          "Statistisches Bundesamt",
          "Deutsche Bundesbank",
          "ifo Institut",
          "Bundeskartellamt"
        ],
        "c": 0,
        "e": "Das Statistische Bundesamt (Destatis) ermittelt den Verbraucherpreisindex."
      },
      {
        "q": "Wie viele Mitglieder hat der Sachverständigenrat, die sogenannten „Wirtschaftsweisen“?",
        "a": [
          "Fünf",
          "Neun",
          "Drei",
          "Sieben"
        ],
        "c": 0,
        "e": "Der Sachverständigenrat zur Begutachtung der gesamtwirtschaftlichen Entwicklung besteht aus fünf Mitgliedern."
      },
      {
        "q": "Welches Gremium schlägt regelmäßig die Anpassung des gesetzlichen Mindestlohns vor?",
        "a": [
          "Die Bundesagentur für Arbeit",
          "Die Mindestlohnkommission",
          "Der Bundesrat",
          "Der Sachverständigenrat"
        ],
        "c": 1,
        "e": "Die Mindestlohnkommission aus Arbeitgeber- und Gewerkschaftsvertretern empfiehlt die Höhe, die Regierung setzt sie per Verordnung um."
      },
      {
        "q": "Seit welchem Jahr gibt es in Deutschland einen flächendeckenden gesetzlichen Mindestlohn?",
        "a": [
          "2015",
          "2019",
          "2005",
          "2010"
        ],
        "c": 0,
        "e": "Der gesetzliche Mindestlohn wurde zum 1. Januar 2015 mit 8,50 Euro pro Stunde eingeführt."
      },
      {
        "q": "Wie hoch ist der gesetzliche Mindestlohn seit dem 1. Januar 2026 pro Stunde?",
        "a": [
          "13,90 Euro",
          "14,60 Euro",
          "15,00 Euro",
          "12,82 Euro"
        ],
        "c": 0,
        "e": "Auf Empfehlung der Mindestlohnkommission stieg der Mindestlohn 2026 auf 13,90 Euro, 2027 folgen 14,60 Euro."
      },
      {
        "q": "Welcher staatlichen Ebene fließt die Gewerbesteuer hauptsächlich zu?",
        "a": [
          "Dem Bund",
          "Den Gemeinden",
          "Der EU",
          "Den Ländern"
        ],
        "c": 1,
        "e": "Die Gewerbesteuer ist die wichtigste eigene Steuerquelle der Kommunen, die auch den Hebesatz festlegen."
      },
      {
        "q": "Für etwa welchen Anteil der Steuerzahler entfiel 2021 der Solidaritätszuschlag vollständig?",
        "a": [
          "Rund 90 Prozent",
          "Rund 50 Prozent",
          "Rund 70 Prozent",
          "Rund 99 Prozent"
        ],
        "c": 0,
        "e": "Seit 2021 zahlen dank hoher Freigrenzen nur noch Gutverdienende, Unternehmen und Kapitalanleger den Soli."
      },
      {
        "q": "Wie hoch ist der Solidaritätszuschlag, bezogen auf die Einkommensteuer?",
        "a": [
          "7,5 Prozent",
          "3,5 Prozent",
          "10 Prozent",
          "5,5 Prozent"
        ],
        "c": 3,
        "e": "Der Solidaritätszuschlag beträgt 5,5 Prozent der festgesetzten Einkommen- bzw. Körperschaftsteuer."
      },
      {
        "q": "Wie hoch ist der Spitzensteuersatz der Einkommensteuer (ohne „Reichensteuer“)?",
        "a": [
          "45 Prozent",
          "53 Prozent",
          "42 Prozent",
          "39 Prozent"
        ],
        "c": 2,
        "e": "Der Spitzensteuersatz liegt bei 42 Prozent; für sehr hohe Einkommen gilt die „Reichensteuer“ von 45 Prozent."
      },
      {
        "q": "Auf welchem Platz lag Deutschland 2024 weltweit beim nominalen Bruttoinlandsprodukt?",
        "a": [
          "Platz 3",
          "Platz 4",
          "Platz 5",
          "Platz 2"
        ],
        "c": 0,
        "e": "Deutschland lag hinter den USA und China auf Platz 3, nachdem es 2023 Japan überholt hatte."
      },
      {
        "q": "Welches Land war 2024 gemessen am Gesamthandel Deutschlands wichtigster Handelspartner?",
        "a": [
          "China",
          "Niederlande",
          "Frankreich",
          "USA"
        ],
        "c": 3,
        "e": "2024 lösten die USA China erstmals seit 2015 als wichtigsten Handelspartner Deutschlands ab."
      },
      {
        "q": "Welche Warengruppe ist traditionell Deutschlands wichtigstes Exportgut?",
        "a": [
          "Chemische Erzeugnisse",
          "Kraftfahrzeuge und Kfz-Teile",
          "Pharmazeutische Produkte",
          "Maschinen"
        ],
        "c": 1,
        "e": "Autos und Autoteile sind seit Jahren die wertmäßig größte deutsche Exportwarengruppe."
      },
      {
        "q": "Wann spricht man von einer „technischen Rezession“?",
        "a": [
          "Inflation steigt über 5 Prozent",
          "BIP sinkt ein Quartal lang",
          "BIP sinkt zwei Quartale in Folge",
          "Arbeitslosigkeit über 10 Prozent"
        ],
        "c": 2,
        "e": "Als technische Rezession gelten zwei aufeinanderfolgende Quartale mit schrumpfender Wirtschaftsleistung."
      },
      {
        "q": "Welche Behörde prüft in Deutschland Unternehmensfusionen und verfolgt Kartelle?",
        "a": [
          "BaFin",
          "Bundesrechnungshof",
          "Bundesnetzagentur",
          "Bundeskartellamt"
        ],
        "c": 3,
        "e": "Das Bundeskartellamt mit Sitz in Bonn wacht über den Wettbewerb und kontrolliert Zusammenschlüsse."
      },
      {
        "q": "Welche Behörde beaufsichtigt Banken, Versicherungen und den Wertpapierhandel?",
        "a": [
          "Statistisches Bundesamt",
          "Bundeskartellamt",
          "BaFin",
          "Bundesrechnungshof"
        ],
        "c": 2,
        "e": "Die Bundesanstalt für Finanzdienstleistungsaufsicht (BaFin) ist die zentrale deutsche Finanzaufsicht."
      },
      {
        "q": "Wie groß ist das 2025 per Grundgesetzänderung beschlossene Sondervermögen für Infrastruktur?",
        "a": [
          "200 Milliarden Euro",
          "100 Milliarden Euro",
          "1 Billion Euro",
          "500 Milliarden Euro"
        ],
        "c": 3,
        "e": "Das Sondervermögen über 500 Milliarden Euro ist auf zwölf Jahre angelegt."
      },
      {
        "q": "In welchem Grundgesetzartikel ist die Koalitionsfreiheit verankert, auf der die Tarifautonomie beruht?",
        "a": [
          "Artikel 20",
          "Artikel 9",
          "Artikel 14",
          "Artikel 1"
        ],
        "c": 1,
        "e": "Art. 9 Abs. 3 GG garantiert das Recht, Gewerkschaften und Arbeitgeberverbände zu bilden."
      },
      {
        "q": "Welcher Politiker gilt als „Vater des Wirtschaftswunders“ und der Sozialen Marktwirtschaft?",
        "a": [
          "Karl Schiller",
          "Ludwig Erhard",
          "Konrad Adenauer",
          "Helmut Schmidt"
        ],
        "c": 1,
        "e": "Ludwig Erhard setzte als Wirtschaftsminister ab 1949 die Soziale Marktwirtschaft durch."
      },
      {
        "q": "Seit wann gibt es Euro-Bargeld in Deutschland?",
        "a": [
          "1. Januar 2002",
          "1. Januar 2001",
          "1. Juli 1990",
          "1. Januar 1999"
        ],
        "c": 0,
        "e": "Als Buchgeld startete der Euro 1999, Münzen und Scheine kamen am 1. Januar 2002."
      },
      {
        "q": "Welche unabhängige Institution prüft die Haushalts- und Wirtschaftsführung des Bundes?",
        "a": [
          "Bundesrechnungshof",
          "Haushaltsausschuss",
          "Bundesverfassungsgericht",
          "Bundesbank"
        ],
        "c": 0,
        "e": "Der Bundesrechnungshof prüft unabhängig, ob der Bund Steuergeld wirtschaftlich und ordnungsgemäß einsetzt."
      },
      {
        "q": "In welcher Stadt sitzt das ifo Institut, das den bekannten Geschäftsklimaindex veröffentlicht?",
        "a": [
          "Essen",
          "Kiel",
          "München",
          "Berlin"
        ],
        "c": 2,
        "e": "Das ifo Institut ist in München ansässig; in Kiel sitzt das IfW, in Berlin das DIW, in Essen das RWI."
      },
      {
        "q": "Welche ist gemessen an der Mitgliederzahl die größte Einzelgewerkschaft in Deutschland?",
        "a": [
          "GEW",
          "IG BCE",
          "IG Metall",
          "ver.di"
        ],
        "c": 2,
        "e": "Die IG Metall hat gut zwei Millionen Mitglieder und liegt knapp vor ver.di."
      },
      {
        "q": "Wie hoch ist der Steuersatz der Abgeltungsteuer auf Kapitalerträge (ohne Soli und Kirchensteuer)?",
        "a": [
          "30 Prozent",
          "19 Prozent",
          "15 Prozent",
          "25 Prozent"
        ],
        "c": 3,
        "e": "Zinsen, Dividenden und Kursgewinne werden seit 2009 pauschal mit 25 Prozent besteuert."
      },
      {
        "q": "Welcher staatlichen Ebene stehen die Einnahmen aus der Erbschaftsteuer zu?",
        "a": [
          "Bund und Ländern je zur Hälfte",
          "Den Ländern",
          "Dem Bund",
          "Den Gemeinden"
        ],
        "c": 1,
        "e": "Die Erbschaft- und Schenkungsteuer ist eine reine Ländersteuer nach Art. 106 GG."
      }
    ],
    "migration": [
      {
        "q": "In welchem Artikel des Grundgesetzes ist das Asylrecht verankert?",
        "a": [
          "Artikel 20a",
          "Artikel 16a",
          "Artikel 3",
          "Artikel 116"
        ],
        "c": 1,
        "e": "Art. 16a GG bestimmt: „Politisch Verfolgte genießen Asylrecht.“"
      },
      {
        "q": "Welche Bundesbehörde entscheidet über Asylanträge in Deutschland?",
        "a": [
          "Bundesverwaltungsamt",
          "Bundesagentur für Arbeit",
          "Bundesamt für Migration und Flüchtlinge",
          "Bundespolizei"
        ],
        "c": 2,
        "e": "Das BAMF mit Sitz in Nürnberg prüft und entscheidet über Asylanträge."
      },
      {
        "q": "In welchem Jahr wurde die Genfer Flüchtlingskonvention verabschiedet?",
        "a": [
          "1989",
          "1967",
          "1945",
          "1951"
        ],
        "c": 3,
        "e": "Die Genfer Flüchtlingskonvention wurde 1951 verabschiedet und 1967 durch ein Protokoll erweitert."
      },
      {
        "q": "Welcher Staat ist nach der Dublin-Verordnung in der Regel für ein Asylverfahren zuständig?",
        "a": [
          "Das Land mit der kürzesten Verfahrensdauer",
          "Der Staat mit den meisten Plätzen",
          "Das Wunschland des Antragstellers",
          "Der Staat der Ersteinreise in die EU"
        ],
        "c": 3,
        "e": "Grundsätzlich ist der EU-Staat zuständig, über den die schutzsuchende Person zuerst eingereist ist."
      },
      {
        "q": "Ab welchem Jahr ist die 2024 beschlossene Reform des Gemeinsamen Europäischen Asylsystems anzuwenden?",
        "a": [
          "2025",
          "2027",
          "2026",
          "2028"
        ],
        "c": 2,
        "e": "Die GEAS-Reform wurde 2024 verabschiedet und gilt nach zweijähriger Übergangsfrist ab Juni 2026."
      },
      {
        "q": "Was gilt seit der Reform des Staatsangehörigkeitsrechts 2024 bei Einbürgerungen?",
        "a": [
          "Mehrstaatigkeit ist grundsätzlich erlaubt",
          "Ein Sprachtest entfällt",
          "Der alte Pass muss abgegeben werden",
          "Nur EU-Bürger dürfen zwei Pässe haben"
        ],
        "c": 0,
        "e": "Seit Juni 2024 müssen Eingebürgerte ihre bisherige Staatsangehörigkeit nicht mehr aufgeben."
      },
      {
        "q": "Nach wie vielen Jahren rechtmäßigen Aufenthalts ist seit 2024 regulär eine Einbürgerung möglich?",
        "a": [
          "Zehn Jahren",
          "Drei Jahren",
          "Acht Jahren",
          "Fünf Jahren"
        ],
        "c": 3,
        "e": "Die Reform 2024 senkte die Regelfrist von acht auf fünf Jahre; die Express-Einbürgerung nach drei Jahren wurde 2025 wieder gestrichen."
      },
      {
        "q": "Wie heißt der EU-weite Aufenthaltstitel für akademisch qualifizierte Fachkräfte aus Drittstaaten?",
        "a": [
          "Niederlassungserlaubnis",
          "Blaue Karte EU",
          "Grüne Karte EU",
          "Chancenkarte"
        ],
        "c": 1,
        "e": "Die Blaue Karte EU richtet sich an Hochqualifizierte mit Arbeitsplatzangebot und Mindestgehalt."
      },
      {
        "q": "Wie heißt der 2024 eingeführte Aufenthaltstitel, der per Punktesystem die Arbeitssuche ermöglicht?",
        "a": [
          "Green Card",
          "Chancenkarte",
          "Westbalkanregelung",
          "Blaue Karte EU"
        ],
        "c": 1,
        "e": "Mit der Chancenkarte können Fachkräfte aus Drittstaaten bis zu einem Jahr in Deutschland Arbeit suchen."
      },
      {
        "q": "Was bedeutet eine „Duldung“ im deutschen Aufenthaltsrecht?",
        "a": [
          "Vorübergehende Aussetzung der Abschiebung",
          "Zusage der Einbürgerung",
          "Anerkennung als Flüchtling",
          "Befristete Aufenthaltserlaubnis"
        ],
        "c": 0,
        "e": "Eine Duldung ist kein Aufenthaltstitel, sondern bescheinigt, dass die Abschiebung vorerst ausgesetzt ist."
      },
      {
        "q": "Welcher Schutz greift, wenn keine individuelle Verfolgung, aber etwa Gefahr durch Bürgerkrieg droht?",
        "a": [
          "Subsidiärer Schutz",
          "Flüchtlingsschutz nach GFK",
          "Kirchenasyl",
          "Asylberechtigung"
        ],
        "c": 0,
        "e": "Subsidiären Schutz erhält, wem im Herkunftsland ernsthafter Schaden wie Folter oder Kriegsgewalt droht."
      },
      {
        "q": "Für wie lange wurde 2025 der Familiennachzug zu subsidiär Schutzberechtigten ausgesetzt?",
        "a": [
          "Sechs Monate",
          "Fünf Jahre",
          "Zwei Jahre",
          "Ein Jahr"
        ],
        "c": 2,
        "e": "Der Bundestag setzte den Familiennachzug zu subsidiär Schutzberechtigten im Sommer 2025 für zwei Jahre aus."
      },
      {
        "q": "Staatsangehörige welchen Landes bildeten Ende 2024 die größte Gruppe der Ausländer in Deutschland?",
        "a": [
          "Polen",
          "Syrien",
          "Türkei",
          "Ukraine"
        ],
        "c": 2,
        "e": "Türkische Staatsangehörige sind seit Jahrzehnten die größte Gruppe, vor Ukrainern und Syrern."
      },
      {
        "q": "Etwa welcher Anteil der Bevölkerung in Deutschland hatte 2024 eine Einwanderungsgeschichte?",
        "a": [
          "Rund ein Viertel",
          "Rund ein Zehntel",
          "Rund ein Drittel",
          "Rund die Hälfte"
        ],
        "c": 0,
        "e": "Laut Mikrozensus 2024 hatte gut ein Viertel der Bevölkerung eine eigene oder elterliche Einwanderungsgeschichte."
      },
      {
        "q": "In welchem Jahr schloss die Bundesrepublik das Anwerbeabkommen mit der Türkei?",
        "a": [
          "1968",
          "1955",
          "1961",
          "1973"
        ],
        "c": 2,
        "e": "Das Anwerbeabkommen mit der Türkei wurde am 30. Oktober 1961 unterzeichnet."
      },
      {
        "q": "Mit welchem Land schloss die Bundesrepublik 1955 ihr erstes Anwerbeabkommen?",
        "a": [
          "Türkei",
          "Spanien",
          "Griechenland",
          "Italien"
        ],
        "c": 3,
        "e": "Das erste Abkommen zur Anwerbung von „Gastarbeitern“ wurde 1955 mit Italien geschlossen."
      },
      {
        "q": "In welchem Jahr verhängte die Bundesregierung den Anwerbestopp für ausländische Arbeitskräfte?",
        "a": [
          "1961",
          "1980",
          "1973",
          "1966"
        ],
        "c": 2,
        "e": "Im Zuge der Ölkrise beendete die Bundesregierung im November 1973 die Anwerbung."
      },
      {
        "q": "In welchem Jahr wurde mit dem „Asylkompromiss“ die Drittstaatenregelung ins Grundgesetz aufgenommen?",
        "a": [
          "2001",
          "1993",
          "2015",
          "1989"
        ],
        "c": 1,
        "e": "Der Asylkompromiss von 1993 ersetzte Art. 16 Abs. 2 durch den neuen Art. 16a mit der Drittstaatenregelung."
      },
      {
        "q": "In welchem Jahr trat das erste Zuwanderungsgesetz in Kraft?",
        "a": [
          "1998",
          "2005",
          "2010",
          "2000"
        ],
        "c": 1,
        "e": "Das Zuwanderungsgesetz trat am 1. Januar 2005 in Kraft und brachte u. a. die Integrationskurse."
      },
      {
        "q": "Welches Prinzip wurde im Jahr 2000 ergänzend ins Staatsangehörigkeitsrecht eingeführt?",
        "a": [
          "Geburtsortprinzip (ius soli)",
          "Abstammungsprinzip (ius sanguinis)",
          "Wohnsitzprinzip",
          "Optionsverbot"
        ],
        "c": 0,
        "e": "Seit 2000 erhalten in Deutschland geborene Kinder ausländischer Eltern unter Bedingungen die deutsche Staatsangehörigkeit."
      },
      {
        "q": "Was folgt rechtlich aus der Einstufung eines Landes als „sicherer Herkunftsstaat“?",
        "a": [
          "Asylanträge werden bevorzugt geprüft",
          "Bürger erhalten automatisch ein Visum",
          "Abschiebungen dorthin sind verboten",
          "Asylanträge gelten meist als offensichtlich unbegründet"
        ],
        "c": 3,
        "e": "Für Antragsteller aus sicheren Herkunftsstaaten wird vermutet, dass keine Verfolgung droht; Verfahren laufen beschleunigt."
      },
      {
        "q": "In welchem Land liegt der Ort Schengen, nach dem das Abkommen über offene Binnengrenzen benannt ist?",
        "a": [
          "Belgien",
          "Luxemburg",
          "Frankreich",
          "Niederlande"
        ],
        "c": 1,
        "e": "Das Schengener Abkommen wurde 1985 im luxemburgischen Moselort Schengen unterzeichnet."
      },
      {
        "q": "Wo hat die EU-Grenzschutzagentur Frontex ihren Sitz?",
        "a": [
          "Warschau",
          "Brüssel",
          "Wien",
          "Valletta"
        ],
        "c": 0,
        "e": "Frontex, die Europäische Agentur für die Grenz- und Küstenwache, sitzt in Warschau."
      },
      {
        "q": "Welches Gesetz regelt die Sozialleistungen für Asylsuchende während des Verfahrens?",
        "a": [
          "Aufenthaltsgesetz",
          "Asylbewerberleistungsgesetz",
          "Sozialgesetzbuch II",
          "Bundesversorgungsgesetz"
        ],
        "c": 1,
        "e": "Das Asylbewerberleistungsgesetz von 1993 regelt Grundleistungen für Asylsuchende und Geduldete."
      },
      {
        "q": "Welches Sprachniveau ist das Ziel des Sprachkurses im Integrationskurs?",
        "a": [
          "A1",
          "C1",
          "B1",
          "A2"
        ],
        "c": 2,
        "e": "Der Integrationskurs schließt mit dem „Deutsch-Test für Zuwanderer“ ab, Ziel ist Niveau B1."
      },
      {
        "q": "Wie viele Fragen umfasst der Einbürgerungstest?",
        "a": [
          "33",
          "25",
          "17",
          "50"
        ],
        "c": 0,
        "e": "Der Test hat 33 Fragen; wer mindestens 17 richtig beantwortet, hat bestanden."
      },
      {
        "q": "Auf welcher Grundlage erhalten Geflüchtete aus der Ukraine seit 2022 Schutz in der EU?",
        "a": [
          "Dublin-Verordnung",
          "EU-Richtlinie zum vorübergehenden Schutz",
          "Blaue Karte EU",
          "Reguläres Asylverfahren"
        ],
        "c": 1,
        "e": "Die EU aktivierte 2022 erstmals die Massenzustrom-Richtlinie; ein Asylverfahren ist dafür nicht nötig."
      },
      {
        "q": "Wer ist in Deutschland für die Durchführung von Abschiebungen grundsätzlich zuständig?",
        "a": [
          "Die Bundesländer",
          "Das Bundesinnenministerium",
          "Das BAMF",
          "Das Auswärtige Amt"
        ],
        "c": 0,
        "e": "Abschiebungen vollziehen die Ausländerbehörden der Länder, die Bundespolizei unterstützt etwa bei Flügen."
      },
      {
        "q": "In welchem Jahr wurden in Deutschland bislang die meisten Asylanträge gestellt?",
        "a": [
          "2015",
          "2023",
          "1992",
          "2016"
        ],
        "c": 3,
        "e": "2016 wurden rund 745.000 Asylanträge gestellt, da viele 2015 Eingereiste erst dann ihren Antrag stellen konnten."
      },
      {
        "q": "Nach welchem Schlüssel werden Asylsuchende auf die Bundesländer verteilt?",
        "a": [
          "Länderfinanzschlüssel",
          "Bonner Schlüssel",
          "Dublin-Schlüssel",
          "Königsteiner Schlüssel"
        ],
        "c": 3,
        "e": "Der Königsteiner Schlüssel richtet sich nach Steueraufkommen und Bevölkerungszahl der Länder."
      }
    ],
    "soziales": [
      {
        "q": "Nach welchem Verfahren wird die gesetzliche Rente in Deutschland hauptsächlich finanziert?",
        "a": [
          "Umlageverfahren",
          "Reine Steuerfinanzierung",
          "Anwartschaftsdeckung",
          "Kapitaldeckungsverfahren"
        ],
        "c": 0,
        "e": "Die laufenden Beiträge der Erwerbstätigen finanzieren direkt die aktuellen Renten („Generationenvertrag“)."
      },
      {
        "q": "Für welchen Geburtsjahrgang gilt erstmals die Regelaltersgrenze von 67 Jahren?",
        "a": [
          "1964",
          "1958",
          "1970",
          "1960"
        ],
        "c": 0,
        "e": "Die Altersgrenze steigt schrittweise; ab Jahrgang 1964 gilt die Rente mit 67 voll."
      },
      {
        "q": "Wie hoch ist der Beitragssatz zur gesetzlichen Rentenversicherung im Jahr 2026?",
        "a": [
          "19,9 Prozent",
          "16,2 Prozent",
          "20,5 Prozent",
          "18,6 Prozent"
        ],
        "c": 3,
        "e": "Der Beitragssatz liegt seit 2018 unverändert bei 18,6 Prozent, je zur Hälfte von Arbeitgeber und Beschäftigten."
      },
      {
        "q": "Wie viele Beitragsjahre braucht man für die abschlagsfreie „Rente für besonders langjährig Versicherte“?",
        "a": [
          "50 Jahre",
          "40 Jahre",
          "45 Jahre",
          "35 Jahre"
        ],
        "c": 2,
        "e": "Nach 45 Beitragsjahren ist ein früherer Rentenbeginn ohne Abschläge möglich (umgangssprachlich „Rente mit 63“)."
      },
      {
        "q": "Welche Haltelinie für das Rentenniveau verlängerte das 2025 beschlossene Rentenpaket bis 2031?",
        "a": [
          "53 Prozent",
          "48 Prozent",
          "50 Prozent",
          "43 Prozent"
        ],
        "c": 1,
        "e": "Das Rentenpaket sichert ein Rentenniveau von mindestens 48 Prozent bis 2031 zu."
      },
      {
        "q": "Wie viel dürfen Beschäftigte nach Erreichen der Regelaltersgrenze seit 2026 dank „Aktivrente“ steuerfrei verdienen?",
        "a": [
          "3.000 Euro im Monat",
          "2.000 Euro im Monat",
          "520 Euro im Monat",
          "1.000 Euro im Monat"
        ],
        "c": 1,
        "e": "Die Aktivrente stellt seit 1. Januar 2026 Arbeitslohn bis 2.000 Euro monatlich nach der Regelaltersgrenze steuerfrei."
      },
      {
        "q": "Welche Leistung ersetzte zum 1. Januar 2023 das Arbeitslosengeld II („Hartz IV“)?",
        "a": [
          "Kinderzuschlag",
          "Bürgergeld",
          "Arbeitslosengeld I",
          "Grundsicherung im Alter"
        ],
        "c": 1,
        "e": "Das Bürgergeld löste 2023 das Arbeitslosengeld II und das Sozialgeld ab."
      },
      {
        "q": "Wie hoch ist das Kindergeld im Jahr 2026 pro Kind und Monat?",
        "a": [
          "250 Euro",
          "255 Euro",
          "275 Euro",
          "259 Euro"
        ],
        "c": 3,
        "e": "Das Kindergeld stieg zum 1. Januar 2026 von 255 auf 259 Euro pro Kind."
      },
      {
        "q": "In welchem Jahr wurde die gesetzliche Pflegeversicherung eingeführt?",
        "a": [
          "2005",
          "1995",
          "1975",
          "1985"
        ],
        "c": 1,
        "e": "Die Pflegeversicherung startete 1995 als fünfte Säule der Sozialversicherung."
      },
      {
        "q": "Welcher Zweig der Sozialversicherung wird allein von den Arbeitgebern finanziert?",
        "a": [
          "Gesetzliche Unfallversicherung",
          "Pflegeversicherung",
          "Rentenversicherung",
          "Arbeitslosenversicherung"
        ],
        "c": 0,
        "e": "Die Beiträge zur Unfallversicherung an die Berufsgenossenschaften zahlen ausschließlich die Arbeitgeber."
      },
      {
        "q": "Welche Sozialversicherung wurde unter Reichskanzler Bismarck 1883 als erste eingeführt?",
        "a": [
          "Krankenversicherung",
          "Unfallversicherung",
          "Rentenversicherung",
          "Arbeitslosenversicherung"
        ],
        "c": 0,
        "e": "1883 kam die Krankenversicherung, 1884 die Unfall- und 1889 die Invaliditäts- und Altersversicherung."
      },
      {
        "q": "Wie viel Prozent des vorherigen Nettoeinkommens ersetzt das Elterngeld in der Regel?",
        "a": [
          "65 bis 67 Prozent",
          "80 Prozent",
          "50 Prozent",
          "100 Prozent"
        ],
        "c": 0,
        "e": "Das Elterngeld beträgt meist 65 bis 67 Prozent des Nettoeinkommens, mindestens 300 und höchstens 1.800 Euro."
      },
      {
        "q": "Wie viel Prozent des pauschalierten Nettolohns beträgt das Arbeitslosengeld I für Kinderlose?",
        "a": [
          "67 Prozent",
          "50 Prozent",
          "60 Prozent",
          "75 Prozent"
        ],
        "c": 2,
        "e": "Kinderlose erhalten 60 Prozent, Arbeitslose mit Kind 67 Prozent des pauschalierten Nettoentgelts."
      },
      {
        "q": "Welches Amt hatte Walter Riester inne, nach dem die Riester-Rente benannt ist?",
        "a": [
          "Präsident der Rentenversicherung",
          "Bundeswirtschaftsminister",
          "Bundesfinanzminister",
          "Bundesarbeitsminister"
        ],
        "c": 3,
        "e": "Walter Riester (SPD) führte die staatlich geförderte Privatvorsorge 2001/2002 als Arbeitsminister ein."
      },
      {
        "q": "Seit welchem Jahr gibt es die Grundrente als Zuschlag für langjährig Versicherte mit niedrigem Einkommen?",
        "a": [
          "2015",
          "2018",
          "2024",
          "2021"
        ],
        "c": 3,
        "e": "Die Grundrente wird seit 1. Januar 2021 bei mindestens 33 Jahren Grundrentenzeiten gezahlt."
      },
      {
        "q": "Was legt die Beitragsbemessungsgrenze in der Sozialversicherung fest?",
        "a": [
          "Ab welchem Einkommen Beiträge anfallen",
          "Bis zu welchem Einkommen Beiträge anfallen",
          "Die Höhe des Mindestlohns",
          "Den maximalen Rentenanspruch pro Jahr"
        ],
        "c": 1,
        "e": "Einkommen oberhalb der Beitragsbemessungsgrenze ist beitragsfrei; die Grenze wird jährlich angepasst."
      },
      {
        "q": "Wie hoch ist der allgemeine Beitragssatz der gesetzlichen Krankenversicherung (ohne Zusatzbeitrag)?",
        "a": [
          "12,4 Prozent",
          "16,2 Prozent",
          "14,6 Prozent",
          "18,6 Prozent"
        ],
        "c": 2,
        "e": "Der allgemeine Satz liegt bei 14,6 Prozent; hinzu kommt der kassenindividuelle Zusatzbeitrag."
      },
      {
        "q": "Wie viele Pflegegrade gibt es in der Pflegeversicherung?",
        "a": [
          "Drei",
          "Sechs",
          "Vier",
          "Fünf"
        ],
        "c": 3,
        "e": "Seit 2017 ersetzen fünf Pflegegrade die früheren drei Pflegestufen."
      },
      {
        "q": "In welcher Stadt hat das Bundessozialgericht seinen Sitz?",
        "a": [
          "Karlsruhe",
          "Kassel",
          "Leipzig",
          "Erfurt"
        ],
        "c": 1,
        "e": "Das Bundessozialgericht sitzt in Kassel; Erfurt ist Sitz des Bundesarbeitsgerichts."
      },
      {
        "q": "In welchem Artikel des Grundgesetzes wird die Bundesrepublik als „sozialer Bundesstaat“ bezeichnet?",
        "a": [
          "Artikel 20",
          "Artikel 14",
          "Artikel 1",
          "Artikel 79"
        ],
        "c": 0,
        "e": "Art. 20 Abs. 1 GG verankert das Sozialstaatsprinzip, das durch die Ewigkeitsklausel geschützt ist."
      },
      {
        "q": "Woran ist die Verdienstgrenze für Minijobs seit Oktober 2022 gekoppelt?",
        "a": [
          "An die Inflationsrate",
          "An die Rentenerhöhung",
          "An den Mindestlohn",
          "An das Durchschnittseinkommen"
        ],
        "c": 2,
        "e": "Die Minijob-Grenze steigt automatisch mit dem Mindestlohn, bezogen auf zehn Wochenstunden."
      },
      {
        "q": "Wer finanziert das Wohngeld?",
        "a": [
          "Bund und Länder je zur Hälfte",
          "Allein der Bund",
          "Die Rentenversicherung",
          "Allein die Kommunen"
        ],
        "c": 0,
        "e": "Das Wohngeld wird je zur Hälfte von Bund und Ländern getragen."
      },
      {
        "q": "Zu welchem Datum werden die gesetzlichen Renten jährlich angepasst?",
        "a": [
          "1. April",
          "1. Oktober",
          "1. Juli",
          "1. Januar"
        ],
        "c": 2,
        "e": "Die jährliche Rentenanpassung tritt traditionell zum 1. Juli in Kraft."
      },
      {
        "q": "Wie viele Entgeltpunkte erhält man für ein Beitragsjahr mit genau durchschnittlichem Verdienst?",
        "a": [
          "Zwei",
          "Zehn",
          "Einen halben",
          "Einen"
        ],
        "c": 3,
        "e": "Ein Jahr mit Durchschnittsverdienst bringt einen Entgeltpunkt, dessen Wert der aktuelle Rentenwert angibt."
      },
      {
        "q": "Wie lange muss man mindestens versichert sein, um eine Regelaltersrente zu erhalten?",
        "a": [
          "Zwei Jahre",
          "Fünf Jahre",
          "15 Jahre",
          "Zehn Jahre"
        ],
        "c": 1,
        "e": "Die allgemeine Wartezeit für die Regelaltersrente beträgt fünf Jahre."
      },
      {
        "q": "Wie lange gilt der Mutterschutz regulär vor und nach der Geburt?",
        "a": [
          "Zwei Wochen davor, zwölf danach",
          "Acht Wochen davor, acht danach",
          "Sechs Wochen davor, acht danach",
          "Vier Wochen davor, sechs danach"
        ],
        "c": 2,
        "e": "Der Mutterschutz beginnt sechs Wochen vor der Entbindung und endet in der Regel acht Wochen danach."
      },
      {
        "q": "Wie lange können Eltern pro Kind höchstens Elternzeit nehmen?",
        "a": [
          "Drei Jahre",
          "14 Monate",
          "Fünf Jahre",
          "Ein Jahr"
        ],
        "c": 0,
        "e": "Jeder Elternteil hat Anspruch auf bis zu drei Jahre Elternzeit pro Kind, ohne durchgehende Bezahlung."
      },
      {
        "q": "Welche Stelle ist für die Auszahlung der Grundsicherung für Arbeitsuchende (Bürgergeld) zuständig?",
        "a": [
          "Das Finanzamt",
          "Das Jobcenter",
          "Die Krankenkasse",
          "Die Rentenversicherung"
        ],
        "c": 1,
        "e": "Jobcenter, getragen von Arbeitsagentur und Kommunen, betreuen Leistungsberechtigte der Grundsicherung."
      },
      {
        "q": "Was bildet der „Nachhaltigkeitsfaktor“ in der Rentenanpassungsformel ab?",
        "a": [
          "Die Höhe der Staatsverschuldung",
          "Den Ausstoß von Treibhausgasen",
          "Verhältnis von Rentnern zu Beitragszahlern",
          "Die Entwicklung der Inflation"
        ],
        "c": 2,
        "e": "Der Nachhaltigkeitsfaktor dämpft Rentenerhöhungen, wenn auf Beitragszahler mehr Rentner kommen."
      },
      {
        "q": "Was ermöglicht das Überschreiten der Versicherungspflichtgrenze Angestellten?",
        "a": [
          "Höheres Arbeitslosengeld",
          "Vorzeitigen Renteneintritt",
          "Befreiung von der Lohnsteuer",
          "Wechsel in die private Krankenversicherung"
        ],
        "c": 3,
        "e": "Wer mit seinem Einkommen über der Versicherungspflichtgrenze liegt, kann sich privat krankenversichern."
      }
    ],
    "klima": [
      {
        "q": "Bis zu welchem Jahr soll Deutschland laut Klimaschutzgesetz treibhausgasneutral sein?",
        "a": [
          "2040",
          "2035",
          "2045",
          "2050"
        ],
        "c": 2,
        "e": "Das 2021 verschärfte Klimaschutzgesetz sieht Treibhausgasneutralität bis 2045 vor."
      },
      {
        "q": "Um wie viel sollen Deutschlands Emissionen bis 2030 gegenüber 1990 sinken?",
        "a": [
          "Mindestens 65 Prozent",
          "Mindestens 40 Prozent",
          "Mindestens 80 Prozent",
          "Mindestens 55 Prozent"
        ],
        "c": 0,
        "e": "Das Klimaschutzgesetz verlangt bis 2030 eine Minderung um mindestens 65 Prozent gegenüber 1990."
      },
      {
        "q": "Welche Erwärmungsgrenze soll laut Pariser Abkommen möglichst nicht überschritten werden?",
        "a": [
          "2,5 Grad Celsius",
          "1,5 Grad Celsius",
          "3 Grad Celsius",
          "1 Grad Celsius"
        ],
        "c": 1,
        "e": "Das Abkommen von 2015 zielt auf deutlich unter 2 Grad und Anstrengungen für 1,5 Grad Erwärmung."
      },
      {
        "q": "In welchem Jahr wurde das Kyoto-Protokoll beschlossen?",
        "a": [
          "2005",
          "1997",
          "2009",
          "1992"
        ],
        "c": 1,
        "e": "Das Kyoto-Protokoll wurde 1997 beschlossen und trat 2005 in Kraft."
      },
      {
        "q": "In welchem Jahr gingen die letzten drei deutschen Atomkraftwerke vom Netz?",
        "a": [
          "2022",
          "2011",
          "2023",
          "2021"
        ],
        "c": 2,
        "e": "Isar 2, Emsland und Neckarwestheim 2 wurden am 15. April 2023 abgeschaltet."
      },
      {
        "q": "Bis spätestens wann soll Deutschland laut Kohleausstiegsgesetz aus der Kohleverstromung aussteigen?",
        "a": [
          "2045",
          "2035",
          "2030",
          "2038"
        ],
        "c": 3,
        "e": "Das Kohleausstiegsgesetz von 2020 legt das Ende der Kohleverstromung spätestens auf 2038 fest."
      },
      {
        "q": "In welchem Jahr trat das Erneuerbare-Energien-Gesetz (EEG) erstmals in Kraft?",
        "a": [
          "2011",
          "2005",
          "1991",
          "2000"
        ],
        "c": 3,
        "e": "Das EEG löste im Jahr 2000 das Stromeinspeisungsgesetz von 1991 ab."
      },
      {
        "q": "Etwa welchen Anteil am Bruttostromverbrauch deckten erneuerbare Energien im Jahr 2024?",
        "a": [
          "Rund ein Viertel",
          "Gut die Hälfte",
          "Rund drei Viertel",
          "Rund ein Drittel"
        ],
        "c": 1,
        "e": "2024 stammten rund 54 Prozent des verbrauchten Stroms aus erneuerbaren Quellen."
      },
      {
        "q": "Welche Quelle lieferte 2024 den meisten erneuerbaren Strom in Deutschland?",
        "a": [
          "Wasserkraft",
          "Windenergie",
          "Biomasse",
          "Photovoltaik"
        ],
        "c": 1,
        "e": "Windkraft an Land und auf See ist die wichtigste erneuerbare Stromquelle, vor der Photovoltaik."
      },
      {
        "q": "Welche Bereiche erfasst der nationale CO₂-Preis nach dem Brennstoffemissionshandelsgesetz?",
        "a": [
          "Stromerzeugung und Industrie",
          "Luft- und Seeverkehr",
          "Landwirtschaft und Forst",
          "Verkehr und Wärme"
        ],
        "c": 3,
        "e": "Seit 2021 verteuert der nationale CO₂-Preis fossile Heiz- und Kraftstoffe; Strom und Industrie fallen unter den EU-ETS."
      },
      {
        "q": "Seit welchem Jahr gibt es den EU-Emissionshandel (EU-ETS)?",
        "a": [
          "2005",
          "2021",
          "1997",
          "2012"
        ],
        "c": 0,
        "e": "Der EU-Emissionshandel für Kraftwerke und Industrie startete 2005."
      },
      {
        "q": "Welchen Anteil erneuerbarer Energien sah das 2023 novellierte Gebäudeenergiegesetz für neue Heizungen vor?",
        "a": [
          "100 Prozent",
          "80 Prozent",
          "50 Prozent",
          "65 Prozent"
        ],
        "c": 3,
        "e": "Neu eingebaute Heizungen sollen nach dem GEG zu mindestens 65 Prozent mit erneuerbaren Energien betrieben werden."
      },
      {
        "q": "Welches Gericht erklärte 2021 das Klimaschutzgesetz teilweise für verfassungswidrig?",
        "a": [
          "Bundesverfassungsgericht",
          "Bundesgerichtshof",
          "Europäischer Gerichtshof",
          "Bundesverwaltungsgericht"
        ],
        "c": 0,
        "e": "Der Klimabeschluss des BVerfG forderte Reduktionsziele auch für die Zeit nach 2030 zum Schutz künftiger Freiheit."
      },
      {
        "q": "Welcher Artikel des Grundgesetzes schützt die natürlichen Lebensgrundlagen als Staatsziel?",
        "a": [
          "Artikel 2",
          "Artikel 74",
          "Artikel 20a",
          "Artikel 14"
        ],
        "c": 2,
        "e": "Art. 20a GG wurde 1994 eingefügt und 2002 um den Tierschutz ergänzt."
      },
      {
        "q": "Welcher Sektor verursachte 2024 in Deutschland die meisten Treibhausgasemissionen?",
        "a": [
          "Landwirtschaft",
          "Verkehr",
          "Energiewirtschaft",
          "Gebäude"
        ],
        "c": 2,
        "e": "Die Energiewirtschaft blieb 2024 trotz deutlicher Rückgänge der größte Emittent, vor Industrie und Verkehr."
      },
      {
        "q": "Welcher Sektor ist in Deutschland die größte Quelle von Methanemissionen?",
        "a": [
          "Gebäude",
          "Energiewirtschaft",
          "Verkehr",
          "Landwirtschaft"
        ],
        "c": 3,
        "e": "Methan entsteht vor allem in der Tierhaltung, etwa bei der Verdauung von Rindern."
      },
      {
        "q": "Wie lautet die englische Abkürzung für den Weltklimarat?",
        "a": [
          "UNEP",
          "UNFCCC",
          "IPCC",
          "IRENA"
        ],
        "c": 2,
        "e": "Der Intergovernmental Panel on Climate Change fasst den Stand der Klimaforschung in Sachstandsberichten zusammen."
      },
      {
        "q": "In welcher Stadt fand die Weltklimakonferenz COP30 im Jahr 2025 statt?",
        "a": [
          "Dubai",
          "Belém",
          "Rio de Janeiro",
          "Baku"
        ],
        "c": 1,
        "e": "Die COP30 tagte im November 2025 in Belém am Rand des Amazonasgebiets; COP29 war 2024 in Baku."
      },
      {
        "q": "Wie viel Geld aus dem Infrastruktur-Sondervermögen von 2025 fließt in den Klima- und Transformationsfonds?",
        "a": [
          "500 Milliarden Euro",
          "200 Milliarden Euro",
          "50 Milliarden Euro",
          "100 Milliarden Euro"
        ],
        "c": 3,
        "e": "Von den 500 Milliarden Euro des Sondervermögens gehen 100 Milliarden in den Klima- und Transformationsfonds."
      },
      {
        "q": "Wo ging Ende 2022 das erste deutsche LNG-Terminal in Betrieb?",
        "a": [
          "Lubmin",
          "Brunsbüttel",
          "Stade",
          "Wilhelmshaven"
        ],
        "c": 3,
        "e": "Das schwimmende Terminal in Wilhelmshaven nahm im Dezember 2022 als erstes den Betrieb auf."
      },
      {
        "q": "Wie wird Wasserstoff genannt, der per Elektrolyse mit Strom aus erneuerbaren Energien erzeugt wird?",
        "a": [
          "Grüner Wasserstoff",
          "Türkiser Wasserstoff",
          "Grauer Wasserstoff",
          "Blauer Wasserstoff"
        ],
        "c": 0,
        "e": "Grüner Wasserstoff entsteht klimaneutral mit Ökostrom; grauer stammt aus Erdgas ohne CO₂-Abscheidung."
      },
      {
        "q": "Was besagt das „Merit-Order-Prinzip“ an der Strombörse?",
        "a": [
          "Der Staat legt den Strompreis fest",
          "Das teuerste benötigte Kraftwerk setzt den Preis",
          "Das günstigste Kraftwerk setzt den Preis",
          "Ökostrom wird zum Festpreis verkauft"
        ],
        "c": 1,
        "e": "Kraftwerke kommen nach Grenzkosten zum Zug; das letzte noch benötigte bestimmt den Marktpreis für alle."
      },
      {
        "q": "Wann wurde die EEG-Umlage auf der Stromrechnung abgeschafft?",
        "a": [
          "2022",
          "2020",
          "2019",
          "2024"
        ],
        "c": 0,
        "e": "Seit dem 1. Juli 2022 wird die EEG-Umlage nicht mehr erhoben; die Förderung zahlt der Bund."
      },
      {
        "q": "Wie viele Übertragungsnetzbetreiber für das Höchstspannungsnetz gibt es in Deutschland?",
        "a": [
          "Sechs",
          "Vier",
          "Acht",
          "Zwei"
        ],
        "c": 1,
        "e": "Die vier Übertragungsnetzbetreiber sind 50Hertz, Amprion, TenneT und TransnetBW."
      },
      {
        "q": "Welche Technik nutzt die Stromtrasse SuedLink zum Transport von Windstrom nach Süden?",
        "a": [
          "Supraleitendes Kabel",
          "Hochspannungs-Gleichstrom-Übertragung",
          "Wasserstoffpipeline",
          "Wechselstrom-Freileitung"
        ],
        "c": 1,
        "e": "SuedLink überträgt Strom per HGÜ und wird überwiegend als Erdkabel verlegt."
      },
      {
        "q": "Welcher Standort schied 2020 aus der Suche nach einem Atommüll-Endlager aus?",
        "a": [
          "Gorleben",
          "Morsleben",
          "Asse",
          "Schacht Konrad"
        ],
        "c": 0,
        "e": "Im Zwischenbericht der Endlagersuche 2020 wurde der Salzstock Gorleben als ungeeignet eingestuft."
      },
      {
        "q": "Wo hat das Umweltbundesamt seinen Hauptsitz?",
        "a": [
          "Dessau-Roßlau",
          "Berlin",
          "Bonn",
          "Potsdam"
        ],
        "c": 0,
        "e": "Das Umweltbundesamt zog 2005 von Berlin nach Dessau-Roßlau in Sachsen-Anhalt."
      },
      {
        "q": "Wie viel kostet das Deutschlandticket seit Januar 2026 pro Monat?",
        "a": [
          "49 Euro",
          "69 Euro",
          "63 Euro",
          "58 Euro"
        ],
        "c": 2,
        "e": "Das Ticket startete 2023 mit 49 Euro, kostete 2025 58 Euro und seit 2026 63 Euro."
      },
      {
        "q": "Welcher Energieträger hat in Deutschland den größten Anteil am Primärenergieverbrauch?",
        "a": [
          "Mineralöl",
          "Braunkohle",
          "Windenergie",
          "Erdgas"
        ],
        "c": 0,
        "e": "Mineralöl, vor allem für Verkehr und Wärme, ist weiterhin der größte Primärenergieträger vor Erdgas."
      },
      {
        "q": "Welche Behörde reguliert in Deutschland die Strom- und Gasnetze?",
        "a": [
          "Umweltbundesamt",
          "Bundesamt für Energie",
          "Bundesnetzagentur",
          "Bundeskartellamt"
        ],
        "c": 2,
        "e": "Die Bundesnetzagentur in Bonn reguliert Netze für Strom, Gas, Telekommunikation, Post und Eisenbahn."
      }
    ],
    "sicherheit": [
      {
        "q": "Welchem Bundesministerium ist die Bundespolizei unterstellt?",
        "a": [
          "Bundesministerium des Innern",
          "Bundesministerium der Finanzen",
          "Bundesministerium der Verteidigung",
          "Bundesministerium der Justiz"
        ],
        "c": 0,
        "e": "Die Bundespolizei ist eine Bundesbehörde im Geschäftsbereich des Bundesinnenministeriums."
      },
      {
        "q": "In welcher Stadt hat das Bundeskriminalamt (BKA) seinen Hauptsitz?",
        "a": [
          "Wiesbaden",
          "Köln",
          "Karlsruhe",
          "Berlin"
        ],
        "c": 0,
        "e": "Das BKA hat seinen Hauptsitz in Wiesbaden, weitere große Standorte sind Meckenheim und Berlin."
      },
      {
        "q": "Wo hat das Bundesamt für Verfassungsschutz seinen Hauptsitz?",
        "a": [
          "Pullach",
          "Köln",
          "Bonn",
          "Wiesbaden"
        ],
        "c": 1,
        "e": "Das Bundesamt für Verfassungsschutz sitzt in Köln und unterhält zusätzlich eine Außenstelle in Berlin."
      },
      {
        "q": "Welcher deutsche Nachrichtendienst ist für die Auslandsaufklärung zuständig?",
        "a": [
          "Bundesamt für Verfassungsschutz",
          "Bundeskriminalamt",
          "Militärischer Abschirmdienst",
          "Bundesnachrichtendienst"
        ],
        "c": 3,
        "e": "Der BND sammelt Informationen über das Ausland und hat seine Zentrale heute in Berlin."
      },
      {
        "q": "Wer ist nach dem Grundgesetz grundsätzlich für die Polizei zuständig?",
        "a": [
          "Die Europäische Union",
          "Die Bundesländer",
          "Der Bund",
          "Die Kommunen"
        ],
        "c": 1,
        "e": "Polizeirecht ist Ländersache; der Bund hat nur eigene Polizeien wie die Bundespolizei und das BKA."
      },
      {
        "q": "Welches Gremium des Bundestags kontrolliert die Nachrichtendienste des Bundes?",
        "a": [
          "Vermittlungsausschuss",
          "Parlamentarisches Kontrollgremium",
          "Ältestenrat",
          "Petitionsausschuss"
        ],
        "c": 1,
        "e": "Das Parlamentarische Kontrollgremium tagt geheim und überwacht BND, Verfassungsschutz und MAD."
      },
      {
        "q": "Was erfasst die Polizeiliche Kriminalstatistik (PKS)?",
        "a": [
          "Rechtskräftige Verurteilungen durch Gerichte",
          "Ergebnisse von Opferbefragungen",
          "Der Polizei bekannt gewordene Straftaten",
          "Die Zahl der Gefängnisinsassen"
        ],
        "c": 2,
        "e": "Die PKS bildet das polizeiliche Hellfeld ab; nicht angezeigte Taten (Dunkelfeld) fehlen darin."
      },
      {
        "q": "Wo hat der Generalbundesanwalt seinen Sitz?",
        "a": [
          "Leipzig",
          "Berlin",
          "Bonn",
          "Karlsruhe"
        ],
        "c": 3,
        "e": "Der Generalbundesanwalt beim Bundesgerichtshof sitzt wie dieser in Karlsruhe."
      },
      {
        "q": "Welcher Nachrichtendienst ist für Spionage- und Extremismusabwehr in der Bundeswehr zuständig?",
        "a": [
          "Kommando Spezialkräfte",
          "Militärischer Abschirmdienst",
          "Bundesnachrichtendienst",
          "Bundesamt für Verfassungsschutz"
        ],
        "c": 1,
        "e": "Der MAD ist der Nachrichtendienst der Bundeswehr und gehört zum Geschäftsbereich des Verteidigungsministeriums."
      },
      {
        "q": "Nach welchem Ereignis wurde 1972 die Spezialeinheit GSG 9 gegründet?",
        "a": [
          "Dem Anschlag auf das Oktoberfest",
          "Dem Olympia-Attentat in München",
          "Der Entführung von Hanns Martin Schleyer",
          "Der Entführung der „Landshut“"
        ],
        "c": 1,
        "e": "Nach der gescheiterten Geiselbefreiung beim Olympia-Attentat 1972 wurde die GSG 9 beim Bundesgrenzschutz aufgebaut."
      },
      {
        "q": "Wofür steht die Abkürzung GTAZ in der deutschen Sicherheitsarchitektur?",
        "a": [
          "Gemeinsames Terrorismusabwehrzentrum",
          "Gesamtdeutsches Tatort-Analysezentrum",
          "Gemeinsames Technik- und Abhörzentrum",
          "Grenzschutz-Taktik- und Alarmzentrale"
        ],
        "c": 0,
        "e": "Im 2004 gegründeten GTAZ in Berlin tauschen Polizeien und Nachrichtendienste von Bund und Ländern Informationen aus."
      },
      {
        "q": "Wo hat die europäische Polizeibehörde Europol ihren Sitz?",
        "a": [
          "Den Haag",
          "Luxemburg",
          "Brüssel",
          "Straßburg"
        ],
        "c": 0,
        "e": "Europol unterstützt von Den Haag aus die Polizeibehörden der EU-Staaten bei grenzüberschreitender Kriminalität."
      },
      {
        "q": "Ab welchem Alter ist man in Deutschland strafmündig?",
        "a": [
          "18 Jahre",
          "16 Jahre",
          "14 Jahre",
          "12 Jahre"
        ],
        "c": 2,
        "e": "Nach § 19 StGB ist schuldunfähig, wer bei Begehung der Tat noch nicht 14 Jahre alt ist."
      },
      {
        "q": "Bis zu welchem Alter kann bei „Heranwachsenden“ noch Jugendstrafrecht angewendet werden?",
        "a": [
          "Bis unter 19 Jahren",
          "Bis unter 21 Jahren",
          "Bis unter 25 Jahren",
          "Bis unter 23 Jahren"
        ],
        "c": 1,
        "e": "Heranwachsende sind 18- bis 20-Jährige; bei ihnen entscheidet das Gericht, ob Jugend- oder Erwachsenenstrafrecht gilt."
      },
      {
        "q": "Wer entscheidet in Deutschland über das Verbot einer politischen Partei?",
        "a": [
          "Der Bundestag",
          "Das Bundesverwaltungsgericht",
          "Das Bundesverfassungsgericht",
          "Das Bundesinnenministerium"
        ],
        "c": 2,
        "e": "Nach Art. 21 GG kann nur das Bundesverfassungsgericht eine Partei verbieten, etwa auf Antrag von Bundestag oder Bundesrat."
      },
      {
        "q": "Wer kann einen bundesweit tätigen Verein nach dem Vereinsgesetz verbieten?",
        "a": [
          "Der Bundespräsident",
          "Das Bundesverfassungsgericht",
          "Das Bundesinnenministerium",
          "Der Generalbundesanwalt"
        ],
        "c": 2,
        "e": "Anders als Parteien können Vereine von der Exekutive verboten werden, bei bundesweiter Tätigkeit vom Bundesinnenministerium."
      },
      {
        "q": "Wozu berechtigt der sogenannte „Kleine Waffenschein“?",
        "a": [
          "Scharfe Kurzwaffen verdeckt tragen",
          "Schreckschuss- und Reizstoffwaffen führen",
          "Jagdgewehre besitzen und benutzen",
          "Sportpistolen im Verein erwerben"
        ],
        "c": 1,
        "e": "Der Kleine Waffenschein erlaubt das Führen von Schreckschuss-, Reizstoff- und Signalwaffen in der Öffentlichkeit."
      },
      {
        "q": "Welcher Artikel des Grundgesetzes schützt das Brief-, Post- und Fernmeldegeheimnis?",
        "a": [
          "Artikel 10",
          "Artikel 16",
          "Artikel 5",
          "Artikel 13"
        ],
        "c": 0,
        "e": "Art. 10 GG schützt vertrauliche Kommunikation; Eingriffe wie Telefonüberwachung brauchen eine gesetzliche Grundlage."
      },
      {
        "q": "Was bezeichnet man umgangssprachlich als „Großen Lauschangriff“?",
        "a": [
          "Auswertung von Funkzellendaten",
          "Akustische Überwachung von Wohnungen",
          "Flächendeckende Videoüberwachung",
          "Abhören von Botschaften im Ausland"
        ],
        "c": 1,
        "e": "Der Große Lauschangriff wurde 1998 durch eine Änderung von Art. 13 GG ermöglicht und erlaubt das Abhören von Wohnräumen."
      },
      {
        "q": "Welches Gericht entschied 2022, dass die deutsche Vorratsdatenspeicherung nicht mit EU-Recht vereinbar ist?",
        "a": [
          "Europäischer Menschenrechtsgerichtshof",
          "Bundesgerichtshof",
          "Europäischer Gerichtshof",
          "Bundesverfassungsgericht"
        ],
        "c": 2,
        "e": "Der EuGH urteilte im September 2022, dass die anlasslose Speicherung von Verkehrs- und Standortdaten gegen EU-Recht verstößt."
      },
      {
        "q": "Was ist mit einem „Staatstrojaner“ gemeint?",
        "a": [
          "Überwachungssoftware von Behörden",
          "Eine Firewall für Regierungsnetze",
          "Eine abhörsichere Behörden-App",
          "Ein staatlicher Virenscanner"
        ],
        "c": 0,
        "e": "Behörden nutzen solche Software zur Quellen-Telekommunikationsüberwachung oder zur Online-Durchsuchung von Geräten."
      },
      {
        "q": "Was besagt das „Trennungsgebot“ in der deutschen Sicherheitsarchitektur?",
        "a": [
          "Bund und Länder haben getrennte Gerichte",
          "Zoll und Bundespolizei arbeiten getrennt",
          "Polizei und Nachrichtendienste sind getrennt",
          "Militär und Polizei nutzen getrennte Funknetze"
        ],
        "c": 2,
        "e": "Nachrichtendienste haben keine polizeilichen Befugnisse wie Festnahmen – eine Lehre aus der Zeit der Gestapo."
      },
      {
        "q": "In welchem Fall darf die Bundeswehr laut Grundgesetz im Inland Amtshilfe leisten?",
        "a": [
          "Bei Verkehrskontrollen auf Autobahnen",
          "Bei der Sicherung von Demonstrationen",
          "Bei Streiks im öffentlichen Dienst",
          "Bei Naturkatastrophen und schweren Unglücken"
        ],
        "c": 3,
        "e": "Art. 35 GG erlaubt den Einsatz der Bundeswehr zur Hilfe bei Naturkatastrophen und besonders schweren Unglücksfällen."
      },
      {
        "q": "Wer leistet die Einsatzarbeit im Technischen Hilfswerk (THW) ganz überwiegend?",
        "a": [
          "Ehrenamtliche Helferinnen und Helfer",
          "Beauftragte private Firmen",
          "Berufssoldatinnen und -soldaten",
          "Beamte der Bundespolizei"
        ],
        "c": 0,
        "e": "Rund 98 Prozent der THW-Kräfte sind ehrenamtlich engagiert; das THW ist eine Bundesanstalt im Geschäftsbereich des BMI."
      },
      {
        "q": "Welche Bundesbehörde betreibt die Warn-App NINA?",
        "a": [
          "Deutscher Wetterdienst",
          "Bundesanstalt Technisches Hilfswerk",
          "Bundesamt für Sicherheit in der Informationstechnik",
          "Bundesamt für Bevölkerungsschutz und Katastrophenhilfe"
        ],
        "c": 3,
        "e": "Das BBK mit Sitz in Bonn betreibt das Modulare Warnsystem des Bundes und die Warn-App NINA."
      },
      {
        "q": "Wie viele Morde werden der rechtsterroristischen Gruppe NSU zugerechnet?",
        "a": [
          "Drei",
          "Vierzehn",
          "Zehn",
          "Sechs"
        ],
        "c": 2,
        "e": "Der NSU ermordete zwischen 2000 und 2007 neun Männer mit Migrationsgeschichte und eine Polizistin."
      },
      {
        "q": "In welchem Jahr verübte ein Islamist den Anschlag auf den Weihnachtsmarkt am Berliner Breitscheidplatz?",
        "a": [
          "2018",
          "2015",
          "2014",
          "2016"
        ],
        "c": 3,
        "e": "Am 19. Dezember 2016 tötete der Attentäter mit einem gestohlenen Lkw zunächst zwölf Menschen."
      },
      {
        "q": "Was gilt im Schengen-Raum grundsätzlich an den Binnengrenzen?",
        "a": [
          "Keine regelmäßigen Personenkontrollen",
          "Kontrollen nur für Nicht-EU-Bürger",
          "Kontrolle durch eine EU-Grenzpolizei",
          "Pflicht zum Mitführen des Reisepasses"
        ],
        "c": 0,
        "e": "Vorübergehende Kontrollen an Binnengrenzen sind nur ausnahmsweise erlaubt und müssen der EU-Kommission gemeldet werden."
      },
      {
        "q": "Wie hoch war die Aufklärungsquote laut Polizeilicher Kriminalstatistik im Jahr 2024 ungefähr?",
        "a": [
          "Gut 45 Prozent",
          "Gut 75 Prozent",
          "Knapp 30 Prozent",
          "Knapp 60 Prozent"
        ],
        "c": 3,
        "e": "2024 lag die Aufklärungsquote laut PKS bei rund 58 Prozent der erfassten Fälle."
      },
      {
        "q": "Wie viele Straftaten erfasste die Polizeiliche Kriminalstatistik im Jahr 2024 ungefähr?",
        "a": [
          "Rund 2 Millionen",
          "Rund 3,5 Millionen",
          "Rund 10 Millionen",
          "Rund 6 Millionen"
        ],
        "c": 3,
        "e": "Die PKS 2024 verzeichnete knapp 5,84 Millionen Straftaten, etwas weniger als im Vorjahr."
      }
    ],
    "bildung": [
      {
        "q": "Wer ist in Deutschland hauptsächlich für das Schulwesen zuständig?",
        "a": [
          "Der Bund",
          "Die Kommunen",
          "Die Kirchen",
          "Die Bundesländer"
        ],
        "c": 3,
        "e": "Das Schulwesen gehört zur Kulturhoheit der Länder; Kommunen sind meist Schulträger für Gebäude und Ausstattung."
      },
      {
        "q": "Wofür steht die Abkürzung KMK?",
        "a": [
          "Koordinierungsstelle Musik und Kultur",
          "Kommission für Medienkompetenz",
          "Kultusministerkonferenz",
          "Konferenz der Kommunalen Schulträger"
        ],
        "c": 2,
        "e": "In der KMK stimmen sich die Bildungs- und Kulturminister der Länder etwa über Abschlüsse und Bildungsstandards ab."
      },
      {
        "q": "Welche Organisation führt die internationale Schulleistungsstudie PISA durch?",
        "a": [
          "EU-Kommission",
          "UNESCO",
          "Weltbank",
          "OECD"
        ],
        "c": 3,
        "e": "PISA wird von der Organisation für wirtschaftliche Zusammenarbeit und Entwicklung (OECD) organisiert."
      },
      {
        "q": "Wann wurden die ersten PISA-Ergebnisse veröffentlicht, die in Deutschland den „PISA-Schock“ auslösten?",
        "a": [
          "1997",
          "2008",
          "2004",
          "2001"
        ],
        "c": 3,
        "e": "Die Ergebnisse der PISA-Studie 2000 erschienen im Dezember 2001 und zeigten nur mittelmäßige Leistungen deutscher Schüler."
      },
      {
        "q": "Wie schnitt Deutschland bei der Ende 2023 veröffentlichten Studie PISA 2022 ab?",
        "a": [
          "So schwach wie noch nie zuvor",
          "Nahezu unverändert gegenüber 2018",
          "Erstmals bestes Land Europas",
          "So gut wie noch nie zuvor"
        ],
        "c": 0,
        "e": "In Mathematik, Lesen und Naturwissenschaften erzielten deutsche 15-Jährige die bislang schwächsten PISA-Werte."
      },
      {
        "q": "Wie wird BAföG für Studierende grundsätzlich gewährt?",
        "a": [
          "Vollständig als nicht rückzahlbarer Zuschuss",
          "Halb als Zuschuss, halb als zinsloses Darlehen",
          "Vollständig als verzinstes Bankdarlehen",
          "Als Steuergutschrift für die Eltern"
        ],
        "c": 1,
        "e": "Beim Studierenden-BAföG muss in der Regel nur die Darlehenshälfte zurückgezahlt werden, und zwar gedeckelt."
      },
      {
        "q": "Wie viel Geld stellte der Bund mit dem Digitalpakt Schule ab 2019 ursprünglich bereit?",
        "a": [
          "20 Milliarden Euro",
          "2 Milliarden Euro",
          "5 Milliarden Euro",
          "500 Millionen Euro"
        ],
        "c": 2,
        "e": "Der Digitalpakt Schule startete 2019 mit 5 Milliarden Euro Bundesmitteln für die digitale Ausstattung von Schulen."
      },
      {
        "q": "Wie viele Schulen sollen im Startchancen-Programm ab dem Schuljahr 2024/25 gefördert werden?",
        "a": [
          "Rund 15.000",
          "Rund 4.000",
          "Rund 400",
          "Rund 1.000"
        ],
        "c": 1,
        "e": "Das Programm von Bund und Ländern unterstützt über zehn Jahre rund 4.000 Schulen mit vielen benachteiligten Kindern."
      },
      {
        "q": "Ab welchem Schuljahr beginnt der stufenweise Rechtsanspruch auf Ganztagsbetreuung für Grundschulkinder?",
        "a": [
          "2023/24",
          "2029/30",
          "2026/27",
          "2024/25"
        ],
        "c": 2,
        "e": "Der Anspruch gilt ab August 2026 zunächst für Erstklässler und wird bis 2029 auf alle vier Klassenstufen ausgeweitet."
      },
      {
        "q": "Seit wann gibt es einen Rechtsanspruch auf einen Betreuungsplatz ab dem ersten Geburtstag?",
        "a": [
          "Seit 2019",
          "Seit 2013",
          "Seit 1996",
          "Seit 2008"
        ],
        "c": 1,
        "e": "Seit August 2013 haben Kinder ab dem vollendeten ersten Lebensjahr Anspruch auf einen Platz in Kita oder Tagespflege."
      },
      {
        "q": "Was kennzeichnet die duale Berufsausbildung in Deutschland?",
        "a": [
          "Ausbildung in zwei Berufen parallel",
          "Abschluss auf Deutsch und Englisch",
          "Studium an zwei Hochschulen zugleich",
          "Lernen in Betrieb und Berufsschule"
        ],
        "c": 3,
        "e": "Auszubildende lernen praktisch im Ausbildungsbetrieb und theoretisch an der Berufsschule."
      },
      {
        "q": "Welche Reform schränkte 2006 die Mitfinanzierung von Schulen durch den Bund ein („Kooperationsverbot“)?",
        "a": [
          "Föderalismusreform II",
          "Agenda 2010",
          "Föderalismusreform I",
          "Bologna-Reform"
        ],
        "c": 2,
        "e": "Die Föderalismusreform I stärkte 2006 die Länder; das Verbot wurde später, etwa 2019 für den Digitalpakt, gelockert."
      },
      {
        "q": "Welche Studienabschlüsse wurden durch den Bologna-Prozess flächendeckend eingeführt?",
        "a": [
          "Bachelor und Master",
          "Staatsexamen und Promotion",
          "Diplom und Magister",
          "Vordiplom und Diplom"
        ],
        "c": 0,
        "e": "Der 1999 begonnene Bologna-Prozess schuf einen europäischen Hochschulraum mit gestuften Abschlüssen."
      },
      {
        "q": "Was bedeutet „G8“ in der Schulpolitik?",
        "a": [
          "Abitur nach acht Jahren Gymnasium",
          "Acht Pflichtfächer bis zum Abitur",
          "Gemeinschaftsschule ab Klasse acht",
          "Verbund der acht größten Schulträger"
        ],
        "c": 0,
        "e": "Beim G8 dauert das Gymnasium acht statt neun Jahre; viele Länder sind inzwischen zu G9 zurückgekehrt."
      },
      {
        "q": "Ist Hausunterricht (Homeschooling) als Ersatz für den Schulbesuch in Deutschland grundsätzlich erlaubt?",
        "a": [
          "Ja, mit Genehmigung des Bundes",
          "Ja, aber nur in der Grundschule",
          "Nein, es gilt eine Schulbesuchspflicht",
          "Ja, in allen Bundesländern"
        ],
        "c": 2,
        "e": "Anders als etwa in Österreich gilt in Deutschland eine Schulbesuchspflicht; Ausnahmen sind sehr selten."
      },
      {
        "q": "Wie viele Jahre dauert die Grundschule in Berlin und Brandenburg regulär?",
        "a": [
          "Vier Jahre",
          "Fünf Jahre",
          "Acht Jahre",
          "Sechs Jahre"
        ],
        "c": 3,
        "e": "Während die Grundschule in den meisten Ländern vier Jahre dauert, umfasst sie in Berlin und Brandenburg sechs Jahre."
      },
      {
        "q": "Was fördern Bund und Länder mit der „Exzellenzstrategie“?",
        "a": [
          "Spitzenforschung an Universitäten",
          "Vorbildliche Ausbildungsbetriebe",
          "Frühförderung in Kindergärten",
          "Hochbegabte Schüler an Gymnasien"
        ],
        "c": 0,
        "e": "Die Exzellenzstrategie fördert Exzellenzcluster und Exzellenzuniversitäten als Nachfolgerin der Exzellenzinitiative."
      },
      {
        "q": "Welches Bundesland schaffte 2014 als letztes die allgemeinen Studiengebühren ab?",
        "a": [
          "Bayern",
          "Hamburg",
          "Baden-Württemberg",
          "Niedersachsen"
        ],
        "c": 3,
        "e": "Nachdem Bayern 2013 die Gebühren abgeschafft hatte, folgte Niedersachsen zum Wintersemester 2014/15 als letztes Land."
      },
      {
        "q": "Welche Studie prüft im Auftrag der KMK, ob Schüler die bundesweiten Bildungsstandards erreichen?",
        "a": [
          "Shell-Jugendstudie",
          "PISA-Studie",
          "IQB-Bildungstrend",
          "TIMSS-Studie"
        ],
        "c": 2,
        "e": "Der IQB-Bildungstrend des Instituts zur Qualitätsentwicklung im Bildungswesen misst das Erreichen der KMK-Standards."
      },
      {
        "q": "Wer nimmt in der dualen Ausbildung meist die Abschlussprüfungen ab?",
        "a": [
          "Die Bundesagentur für Arbeit",
          "Die Kultusministerien",
          "Kammern wie IHK und Handwerkskammer",
          "Die Berufsschulen"
        ],
        "c": 2,
        "e": "Zuständige Stellen sind vor allem Industrie- und Handels- sowie Handwerkskammern, die die Prüfungen organisieren."
      },
      {
        "q": "Wie viele staatlich anerkannte Ausbildungsberufe gibt es in Deutschland ungefähr?",
        "a": [
          "Rund 900",
          "Rund 320",
          "Rund 80",
          "Rund 150"
        ],
        "c": 1,
        "e": "Laut Bundesinstitut für Berufsbildung gibt es etwa 320 bis 330 anerkannte Ausbildungsberufe."
      },
      {
        "q": "Wofür gibt es das „Aufstiegs-BAföG“?",
        "a": [
          "Fortbildungen etwa zum Meister",
          "Promotionen an Universitäten",
          "Ein Zweitstudium im Ausland",
          "Den Besuch eines Gymnasiums"
        ],
        "c": 0,
        "e": "Das Aufstiegs-BAföG fördert berufliche Fortbildungen wie Meister, Techniker oder Fachwirt."
      },
      {
        "q": "Wozu berechtigt die Fachhochschulreife?",
        "a": [
          "Zum Lehramtsstudium an Unis",
          "Zum Studium an Fachhochschulen",
          "Zum Studium an allen Universitäten",
          "Nur zur dualen Berufsausbildung"
        ],
        "c": 1,
        "e": "Die Fachhochschulreife erlaubt ein Studium an Fachhochschulen bzw. Hochschulen für angewandte Wissenschaften."
      },
      {
        "q": "Welche Organisation ist die zentrale Selbstverwaltung der Wissenschaft zur Forschungsförderung an Hochschulen?",
        "a": [
          "Hochschulrektorenkonferenz",
          "Deutsche Forschungsgemeinschaft",
          "Stiftung für Hochschulzulassung",
          "Kultusministerkonferenz"
        ],
        "c": 1,
        "e": "Die DFG fördert vor allem erkenntnisorientierte Forschungsprojekte und wird von Bund und Ländern finanziert."
      },
      {
        "q": "Was ist die Hauptaufgabe des DAAD?",
        "a": [
          "Akkreditierung von Studiengängen",
          "Internationaler akademischer Austausch",
          "Vergabe von Medizinstudienplätzen",
          "Anerkennung ausländischer Schulzeugnisse"
        ],
        "c": 1,
        "e": "Der Deutsche Akademische Austauschdienst fördert vor allem Stipendien und internationale Hochschulkooperationen."
      },
      {
        "q": "Seit wann gibt es das EU-Austauschprogramm Erasmus für Studierende?",
        "a": [
          "1987",
          "1999",
          "2004",
          "1957"
        ],
        "c": 0,
        "e": "Erasmus startete 1987 und steht heute als Erasmus+ auch Schulen, Auszubildenden und dem Sport offen."
      },
      {
        "q": "Welches Abkommen verpflichtet Deutschland seit 2009 zu einem inklusiven Bildungssystem?",
        "a": [
          "Europäische Sozialcharta",
          "UN-Behindertenrechtskonvention",
          "Bologna-Erklärung",
          "UN-Kinderrechtskonvention"
        ],
        "c": 1,
        "e": "Die UN-Behindertenrechtskonvention trat 2009 in Deutschland in Kraft und fordert gemeinsames Lernen."
      },
      {
        "q": "Welchem Bundesministerium ist die Bildungspolitik des Bundes seit 2025 zugeordnet? Dem Ministerium für …",
        "a": [
          "Bildung, Familie, Senioren, Frauen und Jugend",
          "Digitales und Staatsmodernisierung",
          "Arbeit und Soziales",
          "Forschung, Technologie und Raumfahrt"
        ],
        "c": 0,
        "e": "Die Bundesregierung verlagerte 2025 die Bildung ins Familienministerium, die Forschung in ein eigenes Ministerium."
      },
      {
        "q": "Wer rief 2008 auf einem Bildungsgipfel die „Bildungsrepublik Deutschland“ aus?",
        "a": [
          "Frank-Walter Steinmeier",
          "Gerhard Schröder",
          "Annette Schavan",
          "Angela Merkel"
        ],
        "c": 3,
        "e": "Bundeskanzlerin Angela Merkel prägte den Begriff 2008 beim Bildungsgipfel in Dresden."
      },
      {
        "q": "Welche große Forschungsorganisation ist vor allem auf angewandte Forschung ausgerichtet?",
        "a": [
          "Fraunhofer-Gesellschaft",
          "Max-Planck-Gesellschaft",
          "Leopoldina",
          "Deutsche Forschungsgemeinschaft"
        ],
        "c": 0,
        "e": "Fraunhofer forscht anwendungsorientiert, oft im Auftrag von Unternehmen; Max-Planck betreibt Grundlagenforschung."
      }
    ],
    "digitales": [
      {
        "q": "Welche Bundesbehörde ist die zentrale Stelle für Cybersicherheit in Deutschland?",
        "a": [
          "Bundesbeauftragte für den Datenschutz",
          "Bundeskriminalamt",
          "Bundesamt für Sicherheit in der Informationstechnik",
          "Bundesnetzagentur"
        ],
        "c": 2,
        "e": "Das BSI in Bonn schützt die IT des Bundes und berät Wirtschaft sowie Bürger in Fragen der IT-Sicherheit."
      },
      {
        "q": "Seit wann ist die Datenschutz-Grundverordnung (DSGVO) in der EU verbindlich anzuwenden?",
        "a": [
          "Seit Mai 2018",
          "Seit Januar 2012",
          "Seit März 2021",
          "Seit Juli 2015"
        ],
        "c": 0,
        "e": "Die DSGVO trat 2016 in Kraft und gilt seit dem 25. Mai 2018 unmittelbar in allen EU-Staaten."
      },
      {
        "q": "Wie hoch kann ein Bußgeld nach der DSGVO im Höchstfall sein?",
        "a": [
          "5 Mio. Euro oder 2 % des Jahresumsatzes",
          "20 Mio. Euro oder 4 % des Jahresumsatzes",
          "50 Mio. Euro oder 10 % des Jahresumsatzes",
          "1 Mio. Euro oder 1 % des Jahresumsatzes"
        ],
        "c": 1,
        "e": "Maßgeblich ist der jeweils höhere Betrag – bei Konzernen bezogen auf den weltweiten Jahresumsatz."
      },
      {
        "q": "Welche Behörde ist in Deutschland Koordinator für digitale Dienste nach dem Digital Services Act?",
        "a": [
          "Bundesamt für Justiz",
          "Bundeskartellamt",
          "Bundesbeauftragte für den Datenschutz",
          "Bundesnetzagentur"
        ],
        "c": 3,
        "e": "Seit dem Digitale-Dienste-Gesetz von 2024 ist die Bundesnetzagentur zentrale Aufsicht für Online-Plattformen."
      },
      {
        "q": "Wofür steht die Abkürzung BfDI?",
        "a": [
          "Bundesagentur für Digitale Innovationen",
          "Bundesbeauftragte für den Datenschutz und die Informationsfreiheit",
          "Bundesamt für Digitales und Infrastruktur",
          "Bundesforum für Datensicherheit im Internet"
        ],
        "c": 1,
        "e": "Die oder der BfDI überwacht den Datenschutz bei Bundesbehörden und unter anderem bei Telekommunikationsanbietern."
      },
      {
        "q": "Was regelt der Digital Services Act (DSA) der EU vor allem?",
        "a": [
          "Roaming-Gebühren im EU-Ausland",
          "Pflichten von Plattformen bei illegalen Inhalten",
          "Glasfaserausbau in ländlichen Räumen",
          "Steuern auf digitale Werbeumsätze"
        ],
        "c": 1,
        "e": "Der DSA verpflichtet Online-Plattformen etwa zu Meldeverfahren für illegale Inhalte und zu mehr Transparenz."
      },
      {
        "q": "Wie nennt der Digital Markets Act (DMA) besonders mächtige Plattformkonzerne?",
        "a": [
          "Torwächter (Gatekeeper)",
          "Systemische Anbieter",
          "Leitplattformen",
          "Hyperscaler"
        ],
        "c": 0,
        "e": "Als Torwächter eingestufte Konzerne wie Alphabet oder Meta müssen besondere Wettbewerbsregeln einhalten."
      },
      {
        "q": "Nach welchem Grundprinzip reguliert die KI-Verordnung (AI Act) der EU Künstliche Intelligenz?",
        "a": [
          "Nach der Größe des Herstellers",
          "Nach dem Herkunftsland der Software",
          "Nach dem Risiko der Anwendung",
          "Nach dem Verkaufspreis des Produkts"
        ],
        "c": 2,
        "e": "Je höher das Risiko einer KI-Anwendung, desto strenger die Pflichten; manche Praktiken wie Social Scoring sind verboten."
      },
      {
        "q": "Welches deutsche Gesetz verpflichtete ab 2017 große soziale Netzwerke, offensichtlich rechtswidrige Inhalte rasch zu löschen?",
        "a": [
          "IT-Sicherheitsgesetz",
          "Netzwerkdurchsetzungsgesetz",
          "Telekommunikationsgesetz",
          "Telemediengesetz"
        ],
        "c": 1,
        "e": "Das NetzDG verlangte die Löschung offensichtlich rechtswidriger Inhalte binnen 24 Stunden; heute gilt weitgehend der DSA."
      },
      {
        "q": "Bis wann sollten laut Onlinezugangsgesetz (OZG) von 2017 Verwaltungsleistungen online verfügbar sein?",
        "a": [
          "Ende 2022",
          "Ende 2019",
          "Ende 2025",
          "Ende 2030"
        ],
        "c": 0,
        "e": "Das OZG setzte die Frist Ende 2022, die deutlich verfehlt wurde; 2024 folgte eine Reform als OZG 2.0."
      },
      {
        "q": "Seit welchem Jahr besitzt der Personalausweis im Scheckkartenformat eine Online-Ausweisfunktion?",
        "a": [
          "2010",
          "2005",
          "2019",
          "2015"
        ],
        "c": 0,
        "e": "Der neue Personalausweis mit Chip und eID-Funktion wurde im November 2010 eingeführt."
      },
      {
        "q": "Was bedeutet die Abkürzung FTTH beim Breitbandausbau?",
        "a": [
          "Glasfaser bis zum Verteilerkasten",
          "Kupferkabel mit Vectoring",
          "Funkanschluss über einen 5G-Mast",
          "Glasfaser bis in die Wohnung"
        ],
        "c": 3,
        "e": "„Fiber to the Home“ heißt, dass die Glasfaser bis in Haus oder Wohnung reicht statt nur bis zum Verteiler."
      },
      {
        "q": "Wer wurde 2025 erster Bundesminister für Digitales und Staatsmodernisierung?",
        "a": [
          "Dorothee Bär",
          "Thomas Jarzombek",
          "Karsten Wildberger",
          "Volker Wissing"
        ],
        "c": 2,
        "e": "Der frühere Handelsmanager Karsten Wildberger leitet das 2025 neu geschaffene Digitalministerium."
      },
      {
        "q": "Was garantiert das „Recht auf schnelles Internet“ im Telekommunikationsgesetz?",
        "a": [
          "Gigabit-Tempo für jeden Haushalt",
          "Einen kostenlosen Glasfaseranschluss",
          "Freies WLAN in allen Behörden",
          "Eine Mindestversorgung mit Internet"
        ],
        "c": 3,
        "e": "Seit der TKG-Novelle 2021 haben Haushalte Anspruch auf eine von der Bundesnetzagentur festgelegte Mindestbandbreite."
      },
      {
        "q": "Wie viel Geld brachte die Versteigerung der 5G-Frequenzen 2019 ungefähr ein?",
        "a": [
          "Rund 6,5 Milliarden Euro",
          "Rund 100 Milliarden Euro",
          "Rund 650 Millionen Euro",
          "Rund 50 Milliarden Euro"
        ],
        "c": 0,
        "e": "Die 5G-Auktion 2019 erzielte rund 6,5 Milliarden Euro, weit weniger als die UMTS-Auktion im Jahr 2000."
      },
      {
        "q": "Nach welchem Prinzip wird die elektronische Patientenakte (ePA) seit 2025 bereitgestellt?",
        "a": [
          "Automatisch, außer man widerspricht",
          "Nur auf ausdrücklichen Antrag",
          "Nur für privat Versicherte",
          "Nur für chronisch Kranke"
        ],
        "c": 0,
        "e": "Gesetzlich Versicherte erhalten seit 2025 automatisch eine ePA, sofern sie nicht widersprechen (Opt-out)."
      },
      {
        "q": "Seit wann ist das E-Rezept für verschreibungspflichtige Arzneimittel in Arztpraxen Pflicht?",
        "a": [
          "Seit Januar 2022",
          "Seit Januar 2026",
          "Seit Januar 2024",
          "Seit Januar 2020"
        ],
        "c": 2,
        "e": "Seit dem 1. Januar 2024 müssen Praxen Kassenrezepte für verschreibungspflichtige Medikamente elektronisch ausstellen."
      },
      {
        "q": "Was bedeutet es, wenn Software „Open Source“ ist?",
        "a": [
          "Ihr Quellcode ist offen einsehbar",
          "Sie läuft nur auf Linux-Systemen",
          "Sie wurde von Behörden entwickelt",
          "Sie ist stets werbefinanziert"
        ],
        "c": 0,
        "e": "Open-Source-Software legt den Quellcode offen und erlaubt je nach Lizenz Nutzung, Änderung und Weitergabe."
      },
      {
        "q": "In welchem Jahr stärkte der EuGH im Fall „Google Spain“ das Recht auf Vergessenwerden?",
        "a": [
          "2014",
          "2021",
          "2018",
          "2008"
        ],
        "c": 0,
        "e": "Seit dem EuGH-Urteil vom Mai 2014 können Betroffene von Suchmaschinen die Entfernung bestimmter Links verlangen."
      },
      {
        "q": "Welches Datenabkommen mit den USA erklärte der EuGH 2020 im Urteil „Schrems II“ für ungültig?",
        "a": [
          "SWIFT-Abkommen",
          "Safe Harbor",
          "Data Privacy Framework",
          "Privacy Shield"
        ],
        "c": 3,
        "e": "Safe Harbor war bereits 2015 gekippt worden; 2020 folgte das Nachfolgeabkommen Privacy Shield."
      },
      {
        "q": "Welches Grundrecht leitete das Bundesverfassungsgericht 1983 im Volkszählungsurteil ab?",
        "a": [
          "Recht auf Vergessenwerden",
          "Informationelle Selbstbestimmung",
          "Recht auf Internetzugang",
          "Recht auf digitale Teilhabe"
        ],
        "c": 1,
        "e": "Danach darf jeder grundsätzlich selbst über Preisgabe und Verwendung seiner persönlichen Daten bestimmen."
      },
      {
        "q": "Was regelt die EU-Richtlinie NIS-2?",
        "a": [
          "Altersgrenzen für soziale Medien",
          "Cybersicherheitspflichten für viele Unternehmen",
          "Datenschutz bei Online-Werbung",
          "Netzneutralität im Mobilfunk"
        ],
        "c": 1,
        "e": "NIS-2 weitet Pflichten wie Risikomanagement und Meldung von Sicherheitsvorfällen auf deutlich mehr Branchen aus."
      },
      {
        "q": "Was verlangt das seit Juni 2025 geltende Barrierefreiheitsstärkungsgesetz?",
        "a": [
          "Rampen an allen öffentlichen Gebäuden",
          "Barrierefreie Bahnhöfe bis 2030",
          "Barrierefreie digitale Produkte und Dienste",
          "Gebärdensprache in allen TV-Sendungen"
        ],
        "c": 2,
        "e": "Etwa Online-Shops, Bankdienste und E-Books müssen seit dem 28. Juni 2025 grundsätzlich barrierefrei sein."
      },
      {
        "q": "Was ist „Gaia-X“?",
        "a": [
          "Satellitennavigationssystem der EU",
          "Cloud-App der Bundesverwaltung",
          "Supercomputer des Bundes in Jülich",
          "Europäisches Projekt für Dateninfrastruktur"
        ],
        "c": 3,
        "e": "Gaia-X wurde 2019 von Deutschland und Frankreich angestoßen, um souveräne, vernetzte Datenräume in Europa zu schaffen."
      },
      {
        "q": "Was ist die „BundID“?",
        "a": [
          "Digitaler Führerschein auf dem Handy",
          "Steuer-Identifikationsnummer des Bundes",
          "Dienstausweis für Bundesbeamte",
          "Nutzerkonto für Online-Verwaltungsleistungen"
        ],
        "c": 3,
        "e": "Mit der BundID melden sich Bürger bei Online-Diensten der Verwaltung an, etwa mithilfe des Online-Ausweises."
      },
      {
        "q": "Welcher Hackerverein wurde 1981 gegründet und äußert sich häufig zu IT-Sicherheit und Datenschutz?",
        "a": [
          "Initiative D21",
          "eco – Verband der Internetwirtschaft",
          "Bitkom",
          "Chaos Computer Club"
        ],
        "c": 3,
        "e": "Der CCC wurde 1981 in Berlin gegründet und ist bekannt für die Aufdeckung von Sicherheitslücken."
      },
      {
        "q": "Bis wann soll laut Gigabitstrategie der Bundesregierung von 2022 Glasfaser flächendeckend verfügbar sein?",
        "a": [
          "2040",
          "2030",
          "2025",
          "2035"
        ],
        "c": 1,
        "e": "Die Gigabitstrategie strebt Glasfaser bis ins Haus und den neuesten Mobilfunkstandard überall bis 2030 an."
      },
      {
        "q": "Wem wird der Hackerangriff auf den Bundestag im Jahr 2015 zugeschrieben?",
        "a": [
          "Chinesische Gruppe APT41",
          "Lazarus-Gruppe aus Nordkorea",
          "APT28, russischer Militärgeheimdienst",
          "Hackerkollektiv Anonymous"
        ],
        "c": 2,
        "e": "Die Gruppe APT28 wird dem russischen Militärgeheimdienst GRU zugerechnet; die EU verhängte deswegen 2020 Sanktionen."
      },
      {
        "q": "Was ist ein DDoS-Angriff?",
        "a": [
          "Verschlüsseln von Daten zur Erpressung",
          "Mitlesen von Daten in offenen WLANs",
          "Lahmlegen eines Dienstes durch Massenanfragen",
          "Ausspähen von Passwörtern per E-Mail"
        ],
        "c": 2,
        "e": "Bei einer Distributed-Denial-of-Service-Attacke überlasten viele Rechner gleichzeitig einen Server oder Dienst."
      },
      {
        "q": "Welcher Landkreis rief 2021 als erster in Deutschland wegen eines Cyberangriffs den Katastrophenfall aus?",
        "a": [
          "Landkreis Görlitz",
          "Anhalt-Bitterfeld",
          "Rhein-Pfalz-Kreis",
          "Landkreis Harz"
        ],
        "c": 1,
        "e": "Nach einem Ransomware-Angriff war die Kreisverwaltung Anhalt-Bitterfeld ab Juli 2021 monatelang stark eingeschränkt."
      }
    ],
    "wohnen": [
      {
        "q": "Wie weit darf die Miete bei Wiedervermietung unter der Mietpreisbremse höchstens über der ortsüblichen Vergleichsmiete liegen?",
        "a": [
          "10 Prozent",
          "15 Prozent",
          "20 Prozent",
          "5 Prozent"
        ],
        "c": 0,
        "e": "In Gebieten mit angespanntem Wohnungsmarkt darf die neue Miete grundsätzlich höchstens 10 Prozent darüber liegen."
      },
      {
        "q": "Bis wann wurde die Mietpreisbremse 2025 vom Bundestag verlängert?",
        "a": [
          "Bis Ende 2035",
          "Bis Ende 2027",
          "Bis Ende 2029",
          "Bis Ende 2026"
        ],
        "c": 2,
        "e": "Die 2015 eingeführte Mietpreisbremse wurde 2025 um vier Jahre bis zum 31. Dezember 2029 verlängert."
      },
      {
        "q": "Um wie viel Prozent darf eine Bestandsmiete in drei Jahren höchstens steigen (allgemeine Kappungsgrenze)?",
        "a": [
          "10 Prozent",
          "30 Prozent",
          "20 Prozent",
          "15 Prozent"
        ],
        "c": 2,
        "e": "Die allgemeine Kappungsgrenze liegt bei 20 Prozent; Länder können sie in angespannten Märkten auf 15 Prozent senken."
      },
      {
        "q": "Was gibt ein Mietspiegel an?",
        "a": [
          "Die ortsübliche Vergleichsmiete",
          "Die durchschnittlichen Nebenkosten",
          "Die gesetzliche Höchstmiete",
          "Die Leerstandsquote einer Stadt"
        ],
        "c": 0,
        "e": "Der Mietspiegel dient als Grundlage für Mieterhöhungen und für die Anwendung der Mietpreisbremse."
      },
      {
        "q": "Wie hoch darf eine Mietkaution für eine Wohnung höchstens sein?",
        "a": [
          "Sechs Nettokaltmieten",
          "Zwei Warmmieten",
          "Eine Nettokaltmiete",
          "Drei Nettokaltmieten"
        ],
        "c": 3,
        "e": "Nach § 551 BGB darf die Kaution drei Monatsmieten ohne Betriebskosten nicht übersteigen und in Raten gezahlt werden."
      },
      {
        "q": "Welchen Anteil der Modernisierungskosten darf ein Vermieter seit 2019 jährlich auf die Miete umlegen?",
        "a": [
          "11 Prozent",
          "8 Prozent",
          "15 Prozent",
          "5 Prozent"
        ],
        "c": 1,
        "e": "Seit 2019 sind es 8 statt zuvor 11 Prozent pro Jahr; zusätzlich gelten Obergrenzen je Quadratmeter."
      },
      {
        "q": "Warum erklärte das Bundesverfassungsgericht 2021 den Berliner Mietendeckel für nichtig?",
        "a": [
          "Er verstieß gegen EU-Recht",
          "Er verletzte die Menschenwürde",
          "Dem Land fehlte die Gesetzgebungskompetenz",
          "Ein Volksentscheid fehlte"
        ],
        "c": 2,
        "e": "Der Bund hat das Mietpreisrecht im BGB abschließend geregelt, daher durfte Berlin keine eigenen Regeln erlassen."
      },
      {
        "q": "Wer finanziert das Wohngeld?",
        "a": [
          "Die Jobcenter",
          "Bund und Länder je zur Hälfte",
          "Allein die Kommunen",
          "Allein der Bund"
        ],
        "c": 1,
        "e": "Das Wohngeld ist ein Zuschuss für Haushalte mit geringem Einkommen, getragen je zur Hälfte von Bund und Ländern."
      },
      {
        "q": "Wie viele Sozialwohnungen gab es Mitte der 2020er-Jahre in Deutschland ungefähr?",
        "a": [
          "Rund 1 Million",
          "Rund 3 Millionen",
          "Rund 200.000",
          "Rund 6 Millionen"
        ],
        "c": 0,
        "e": "Der Bestand liegt bei gut einer Million und sinkt, weil mehr Wohnungen aus der Bindung fallen als neu entstehen."
      },
      {
        "q": "Was benötigt man in der Regel, um eine geförderte Sozialwohnung zu mieten?",
        "a": [
          "Einen Bausparvertrag",
          "Einen Wohnberechtigungsschein",
          "Eine Bürgschaft der Kommune",
          "Eine Empfehlung des Jobcenters"
        ],
        "c": 1,
        "e": "Einen Wohnberechtigungsschein (WBS) erhält, wer bestimmte Einkommensgrenzen nicht überschreitet."
      },
      {
        "q": "Seit wann wird die Grundsteuer nach den neuen Bewertungsregeln erhoben?",
        "a": [
          "Seit 2027",
          "Seit 2025",
          "Seit 2019",
          "Seit 2022"
        ],
        "c": 1,
        "e": "Nach einem BVerfG-Urteil von 2018 musste die Grundsteuer reformiert werden; die neuen Werte gelten seit 1. Januar 2025."
      },
      {
        "q": "Wem steht das Aufkommen aus der Grundsteuer zu?",
        "a": [
          "Bund und Ländern gemeinsam",
          "Den Ländern",
          "Den Gemeinden",
          "Dem Bund"
        ],
        "c": 2,
        "e": "Die Grundsteuer ist eine wichtige Einnahme der Kommunen, die ihre Höhe über den Hebesatz beeinflussen."
      },
      {
        "q": "Wie hoch ist in Deutschland ungefähr der Anteil der Haushalte, die im eigenen Wohneigentum leben?",
        "a": [
          "Rund 65 Prozent",
          "Gut 40 Prozent",
          "Rund 80 Prozent",
          "Rund 20 Prozent"
        ],
        "c": 1,
        "e": "Mit gut 40 Prozent der Haushalte hat Deutschland eine der niedrigsten Eigentumsquoten in der EU."
      },
      {
        "q": "In welchem Gesetz ist das Mietrecht für Wohnungen im Wesentlichen geregelt?",
        "a": [
          "Bürgerliches Gesetzbuch",
          "Wohnungseigentumsgesetz",
          "Baugesetzbuch",
          "Handelsgesetzbuch"
        ],
        "c": 0,
        "e": "Die Regeln zu Mietvertrag, Mieterhöhung und Kündigung stehen vor allem in den §§ 535 ff. BGB."
      },
      {
        "q": "Wann darf ein Vermieter wegen „Eigenbedarf“ kündigen?",
        "a": [
          "Wenn er die Wohnung für sich oder Angehörige braucht",
          "Wenn er die Wohnung verkaufen möchte",
          "Wenn er die Miete deutlich erhöhen will",
          "Wenn er die Wohnung renovieren will"
        ],
        "c": 0,
        "e": "Eigenbedarf liegt vor, wenn der Vermieter die Räume für sich, Familien- oder Haushaltsangehörige benötigt."
      },
      {
        "q": "Welche Kündigungsfrist gilt für Mieter bei einem unbefristeten Wohnungsmietvertrag in der Regel?",
        "a": [
          "Ein Monat",
          "Sechs Monate",
          "Zwölf Monate",
          "Drei Monate"
        ],
        "c": 3,
        "e": "Mieter können grundsätzlich mit drei Monaten Frist kündigen; für Vermieter verlängert sich die Frist mit der Mietdauer."
      },
      {
        "q": "Bis wann muss ein Vermieter die Betriebskostenabrechnung spätestens mitteilen?",
        "a": [
          "12 Monate nach Ende des Abrechnungszeitraums",
          "6 Monate nach Ende des Abrechnungszeitraums",
          "36 Monate nach Ende des Abrechnungszeitraums",
          "3 Monate nach Ende des Abrechnungszeitraums"
        ],
        "c": 0,
        "e": "Nach Ablauf dieser Frist kann der Vermieter Nachforderungen in der Regel nicht mehr geltend machen."
      },
      {
        "q": "Wer zahlt seit 2015 bei der Vermittlung einer Mietwohnung den Makler?",
        "a": [
          "Mieter und Vermieter je zur Hälfte",
          "Wer den Makler beauftragt hat",
          "Immer der Mieter",
          "Immer der Vermieter"
        ],
        "c": 1,
        "e": "Mit dem Bestellerprinzip gilt seit Juni 2015: Wer bestellt, bezahlt – meist also der Vermieter."
      },
      {
        "q": "Was gilt seit Ende 2020 für die Maklerprovision, wenn Privatleute eine Wohnung oder ein Einfamilienhaus kaufen?",
        "a": [
          "Allein der Verkäufer zahlt",
          "Allein der Käufer zahlt",
          "Die Provision ist auf 1 % gedeckelt",
          "Käufer zahlen höchstens die Hälfte"
        ],
        "c": 3,
        "e": "Seit Dezember 2020 muss der Käufer höchstens so viel zahlen wie der Verkäufer, der Makler wird also geteilt."
      },
      {
        "q": "Welchen Anteil erneuerbarer Energien verlangt das seit 2024 geltende Gebäudeenergiegesetz grundsätzlich für neue Heizungen?",
        "a": [
          "30 Prozent",
          "65 Prozent",
          "50 Prozent",
          "100 Prozent"
        ],
        "c": 1,
        "e": "Die GEG-Novelle 2024 knüpfte die 65-Prozent-Vorgabe für Bestandsgebäude an die kommunale Wärmeplanung."
      },
      {
        "q": "Wer erlässt die Bauordnungen, die etwa Brandschutz und Abstandsflächen regeln?",
        "a": [
          "Der Bund",
          "Die Gemeinden",
          "Die Europäische Union",
          "Die Bundesländer"
        ],
        "c": 3,
        "e": "Bauplanungsrecht regelt der Bund im Baugesetzbuch, das Bauordnungsrecht jedes Land in seiner Landesbauordnung."
      },
      {
        "q": "Wie viele neue Wohnungen pro Jahr setzte sich die Ampel-Koalition 2021 als Ziel?",
        "a": [
          "400.000",
          "250.000",
          "150.000",
          "750.000"
        ],
        "c": 0,
        "e": "Das Ziel von 400.000 Wohnungen, davon 100.000 öffentlich gefördert, wurde in keinem Jahr erreicht."
      },
      {
        "q": "Wie viele Wohnungen wurden in Deutschland im Jahr 2024 ungefähr fertiggestellt?",
        "a": [
          "Rund 400.000",
          "Rund 600.000",
          "Rund 250.000",
          "Rund 120.000"
        ],
        "c": 2,
        "e": "Laut Statistischem Bundesamt wurden 2024 knapp 252.000 Wohnungen fertiggestellt, deutlich weniger als im Vorjahr."
      },
      {
        "q": "Wann wurde die Wohnungsgemeinnützigkeit in Westdeutschland abgeschafft?",
        "a": [
          "2001",
          "2010",
          "1972",
          "1990"
        ],
        "c": 3,
        "e": "Nach dem Skandal um den Konzern Neue Heimat wurde die steuerliche Wohnungsgemeinnützigkeit zum 1. Januar 1990 aufgehoben."
      },
      {
        "q": "Woran ist eine Indexmiete gekoppelt?",
        "a": [
          "An den Leitzins der EZB",
          "An den örtlichen Mietspiegel",
          "An den Verbraucherpreisindex",
          "An die Lohnentwicklung"
        ],
        "c": 2,
        "e": "Bei einer Indexmiete darf die Miete entsprechend der Inflation, gemessen am Verbraucherpreisindex, angepasst werden."
      },
      {
        "q": "Was soll ein kommunales Zweckentfremdungsverbot verhindern?",
        "a": [
          "Untervermietung durch Mieter",
          "Umwandlung von Büros in Wohnungen",
          "Wohnraum als Dauer-Ferienwohnung",
          "Bebauung von Gärten"
        ],
        "c": 2,
        "e": "Solche Verbote sollen Wohnraum erhalten, etwa gegen dauerhafte Ferienvermietung, langen Leerstand oder Abriss."
      },
      {
        "q": "Was ist das Ziel eines „Milieuschutzgebiets“ (soziale Erhaltungsverordnung)?",
        "a": [
          "Erhalt der ansässigen Wohnbevölkerung",
          "Schutz von Natur und Artenvielfalt",
          "Förderung von Neubaugebieten",
          "Erhalt historischer Fassaden"
        ],
        "c": 0,
        "e": "Dort sind z. B. Luxussanierungen oder Umwandlungen in Eigentum genehmigungspflichtig, um Verdrängung zu bremsen."
      },
      {
        "q": "Welches ist das größte private Wohnungsunternehmen in Deutschland?",
        "a": [
          "TAG Immobilien",
          "Adler Group",
          "LEG Immobilien",
          "Vonovia"
        ],
        "c": 3,
        "e": "Vonovia aus Bochum besitzt mehrere hunderttausend Wohnungen und übernahm 2021 den Konkurrenten Deutsche Wohnen."
      },
      {
        "q": "Wie viel Baukindergeld gab es pro Kind und Jahr für Familien, die ab 2018 Wohneigentum erwarben?",
        "a": [
          "500 Euro",
          "1.200 Euro",
          "2.400 Euro",
          "5.000 Euro"
        ],
        "c": 1,
        "e": "Das Baukindergeld wurde zehn Jahre lang gezahlt, insgesamt also 12.000 Euro pro Kind."
      },
      {
        "q": "Seit wann gibt es wieder ein eigenständiges Bundesministerium für Wohnen und Bauen?",
        "a": [
          "Seit 2013",
          "Seit 2025",
          "Seit 1998",
          "Seit 2021"
        ],
        "c": 3,
        "e": "Ende 2021 entstand das Ministerium für Wohnen, Stadtentwicklung und Bauwesen; zuvor war Bauen anderen Ressorts zugeordnet."
      }
    ],
    "verteidigung": [
      {
        "q": "Wer hat in Friedenszeiten die Befehls- und Kommandogewalt über die Bundeswehr?",
        "a": [
          "Verteidigungsminister/-in",
          "Bundeskanzler/-in",
          "Bundespräsident/-in",
          "Generalinspekteur/-in"
        ],
        "c": 0,
        "e": "Laut Art. 65a GG liegt sie im Frieden beim Bundesminister der Verteidigung."
      },
      {
        "q": "Auf wen geht die Befehls- und Kommandogewalt im Verteidigungsfall über?",
        "a": [
          "Bundespräsident/-in",
          "Bundeskanzler/-in",
          "Bundestagspräsident/-in",
          "Generalinspekteur/-in"
        ],
        "c": 1,
        "e": "Mit Verkündung des Verteidigungsfalls geht sie nach Art. 115b GG auf den Bundeskanzler über."
      },
      {
        "q": "Wer stellt laut Grundgesetz den Verteidigungsfall fest?",
        "a": [
          "Bundesregierung durch Kabinettsbeschluss",
          "Bundespräsident auf Antrag des Kanzlers",
          "Bundestag mit Zustimmung des Bundesrates",
          "Bundesverfassungsgericht auf Antrag"
        ],
        "c": 2,
        "e": "Nach Art. 115a GG stellt der Bundestag mit Zustimmung des Bundesrates den Verteidigungsfall fest."
      },
      {
        "q": "Seit welchem Jahr ist die allgemeine Wehrpflicht in Deutschland ausgesetzt?",
        "a": [
          "2001",
          "2008",
          "2015",
          "2011"
        ],
        "c": 3,
        "e": "Die Wehrpflicht wurde zum 1. Juli 2011 ausgesetzt, aber nicht aus dem Grundgesetz gestrichen."
      },
      {
        "q": "Wer muss bewaffneten Auslandseinsätzen der Bundeswehr grundsätzlich zustimmen?",
        "a": [
          "Der Bundesrat",
          "Der Bundespräsident",
          "Der Bundestag",
          "Die Innenministerkonferenz"
        ],
        "c": 2,
        "e": "Nach dem Parlamentsvorbehalt ist die Bundeswehr eine Parlamentsarmee; der Bundestag muss zustimmen."
      },
      {
        "q": "In welchem Jahr trat die Bundesrepublik Deutschland der NATO bei?",
        "a": [
          "1955",
          "1949",
          "1961",
          "1973"
        ],
        "c": 0,
        "e": "Die Bundesrepublik wurde 1955 NATO-Mitglied, im selben Jahr wurde die Bundeswehr gegründet."
      },
      {
        "q": "In welcher Stadt hat das politische Hauptquartier der NATO seinen Sitz?",
        "a": [
          "Den Haag",
          "Genf",
          "Luxemburg",
          "Brüssel"
        ],
        "c": 3,
        "e": "Das NATO-Hauptquartier befindet sich in Brüssel."
      },
      {
        "q": "Welcher Artikel des NATO-Vertrags regelt die gegenseitige Beistandsverpflichtung?",
        "a": [
          "Artikel 2",
          "Artikel 5",
          "Artikel 4",
          "Artikel 9"
        ],
        "c": 1,
        "e": "Artikel 5 besagt, dass ein Angriff auf ein Mitglied als Angriff auf alle gilt."
      },
      {
        "q": "Nach welchem Ereignis wurde der NATO-Bündnisfall bislang einzige Mal ausgerufen?",
        "a": [
          "Irakische Invasion Kuwaits 1990",
          "Terroranschläge vom 11. September 2001",
          "Russische Annexion der Krim 2014",
          "Russischer Angriff auf die Ukraine 2022"
        ],
        "c": 1,
        "e": "Der Bündnisfall nach Artikel 5 wurde nur nach den Anschlägen vom 11. September 2001 festgestellt."
      },
      {
        "q": "Wie groß war das 2022 beschlossene Sondervermögen für die Bundeswehr?",
        "a": [
          "50 Milliarden Euro",
          "200 Milliarden Euro",
          "500 Milliarden Euro",
          "100 Milliarden Euro"
        ],
        "c": 3,
        "e": "Nach dem russischen Angriff auf die Ukraine wurde ein Sondervermögen von 100 Mrd. Euro beschlossen."
      },
      {
        "q": "Welches Ausgabenziel für Verteidigung im weiteren Sinne vereinbarte die NATO 2025 in Den Haag bis 2035?",
        "a": [
          "5 % des BIP",
          "2 % des BIP",
          "3 % des BIP",
          "10 % des BIP"
        ],
        "c": 0,
        "e": "Vereinbart wurden 5 % des BIP: 3,5 % für Kernverteidigung und 1,5 % für verteidigungsrelevante Ausgaben."
      },
      {
        "q": "Wem ist der bzw. die Wehrbeauftragte als Hilfsorgan zugeordnet?",
        "a": [
          "Dem Verteidigungsministerium",
          "Dem Bundespräsidenten",
          "Dem Bundestag",
          "Dem Bundesrat"
        ],
        "c": 2,
        "e": "Der Wehrbeauftragte wird vom Bundestag gewählt und unterstützt ihn bei der parlamentarischen Kontrolle."
      },
      {
        "q": "Wie heißt der ranghöchste Soldat bzw. die ranghöchste Soldatin der Bundeswehr?",
        "a": [
          "Wehrbeauftragter",
          "Inspekteur des Heeres",
          "Oberbefehlshaber",
          "Generalinspekteur"
        ],
        "c": 3,
        "e": "Der Generalinspekteur ist der höchste militärische Repräsentant der Bundeswehr."
      },
      {
        "q": "Wer prägte im Februar 2022 in einer Regierungserklärung den Begriff „Zeitenwende“?",
        "a": [
          "Annalena Baerbock",
          "Christine Lambrecht",
          "Olaf Scholz",
          "Frank-Walter Steinmeier"
        ],
        "c": 2,
        "e": "Bundeskanzler Scholz sprach am 27. Februar 2022 im Bundestag von einer „Zeitenwende“."
      },
      {
        "q": "In welchem Land stationiert die Bundeswehr dauerhaft die Panzerbrigade 45?",
        "a": [
          "Polen",
          "Litauen",
          "Estland",
          "Rumänien"
        ],
        "c": 1,
        "e": "Die Panzerbrigade 45 ist die erste dauerhaft im Ausland stationierte Brigade der Bundeswehr, in Litauen."
      },
      {
        "q": "Welches Land trat der NATO im April 2023 als 31. Mitglied bei?",
        "a": [
          "Finnland",
          "Schweden",
          "Österreich",
          "Irland"
        ],
        "c": 0,
        "e": "Finnland trat im April 2023 bei, Schweden folgte im März 2024 als 32. Mitglied."
      },
      {
        "q": "Wo hat das Bundesministerium der Verteidigung seinen ersten Dienstsitz?",
        "a": [
          "Bonn",
          "Berlin",
          "Koblenz",
          "Potsdam"
        ],
        "c": 0,
        "e": "Erster Dienstsitz ist die Hardthöhe in Bonn, der zweite Dienstsitz liegt im Berliner Bendlerblock."
      },
      {
        "q": "Welche Teilstreitkraft wurde 2024 als vierte neben Heer, Luftwaffe und Marine eingerichtet?",
        "a": [
          "Sanitätsdienst",
          "Cyber- und Informationsraum",
          "Streitkräftebasis",
          "Weltraumkommando"
        ],
        "c": 1,
        "e": "Der Cyber- und Informationsraum wurde 2024 zur eigenständigen vierten Teilstreitkraft."
      },
      {
        "q": "Welche Ausnahme von der Schuldenbremse beschloss der Bundestag im März 2025 für Verteidigung?",
        "a": [
          "Ausgaben über 2 % des BIP",
          "Nur Ausgaben für Munition",
          "Ausgaben über 1 % des BIP",
          "Nur Ausgaben im Verteidigungsfall"
        ],
        "c": 2,
        "e": "Verteidigungsausgaben oberhalb von 1 % des BIP sind seitdem von der Schuldenbremse ausgenommen."
      },
      {
        "q": "Wo hat die Organisation für Sicherheit und Zusammenarbeit in Europa (OSZE) ihren Sitz?",
        "a": [
          "Genf",
          "Helsinki",
          "Straßburg",
          "Wien"
        ],
        "c": 3,
        "e": "Das Sekretariat der OSZE hat seinen Sitz in Wien; ihre Wurzeln liegen in der KSZE-Schlussakte von Helsinki."
      },
      {
        "q": "Wie viele ständige Mitglieder mit Vetorecht hat der UN-Sicherheitsrat?",
        "a": [
          "Drei",
          "Sieben",
          "Fünf",
          "Zehn"
        ],
        "c": 2,
        "e": "Ständige Mitglieder sind USA, Russland, China, Frankreich und Großbritannien."
      },
      {
        "q": "Welche Obergrenze für deutsche Streitkräfte legte der Zwei-plus-Vier-Vertrag 1990 fest?",
        "a": [
          "370.000 Soldaten",
          "250.000 Soldaten",
          "495.000 Soldaten",
          "600.000 Soldaten"
        ],
        "c": 0,
        "e": "Deutschland verpflichtete sich, die Personalstärke seiner Streitkräfte auf 370.000 zu begrenzen."
      },
      {
        "q": "Wessen Sache ist laut Grundgesetz die Pflege der Beziehungen zu auswärtigen Staaten?",
        "a": [
          "Der Länder",
          "Des Bundesrates",
          "Des Bundestagspräsidiums",
          "Des Bundes"
        ],
        "c": 3,
        "e": "Art. 32 GG weist die Pflege der auswärtigen Beziehungen dem Bund zu."
      },
      {
        "q": "Wer vertritt die Bundesrepublik Deutschland völkerrechtlich?",
        "a": [
          "Der Bundeskanzler",
          "Der Bundespräsident",
          "Der Außenminister",
          "Der Bundestagspräsident"
        ],
        "c": 1,
        "e": "Nach Art. 59 GG vertritt der Bundespräsident den Bund völkerrechtlich."
      },
      {
        "q": "In welchem Jahr veröffentlichte die Bundesregierung erstmals eine Nationale Sicherheitsstrategie?",
        "a": [
          "2006",
          "2023",
          "2016",
          "2019"
        ],
        "c": 1,
        "e": "Die erste Nationale Sicherheitsstrategie Deutschlands wurde im Juni 2023 vorgestellt."
      },
      {
        "q": "Bei welchem Konflikt beteiligte sich die Bundeswehr 1999 erstmals an Kampfeinsätzen?",
        "a": [
          "Golfkrieg",
          "Afghanistan-Krieg",
          "Bosnienkrieg",
          "Kosovo-Krieg"
        ],
        "c": 3,
        "e": "Im Kosovo-Krieg 1999 flog die Luftwaffe im NATO-Rahmen Kampfeinsätze."
      },
      {
        "q": "Wie viele aktive Soldatinnen und Soldaten hat die Bundeswehr im Jahr 2025 ungefähr?",
        "a": [
          "Rund 180.000",
          "Rund 80.000",
          "Rund 280.000",
          "Rund 400.000"
        ],
        "c": 0,
        "e": "Die Bundeswehr hatte 2025 etwa 180.000 aktive Soldatinnen und Soldaten."
      },
      {
        "q": "Wofür steht das sogenannte „Ramstein-Format“?",
        "a": [
          "NATO-Gipfel zur Nuklearstrategie",
          "EU-Treffen der Verteidigungsminister",
          "Kontaktgruppe zur Militärhilfe für die Ukraine",
          "Abrüstungsverhandlungen mit Russland"
        ],
        "c": 2,
        "e": "Die Ukraine Defense Contact Group traf sich erstmals 2022 auf der US-Airbase Ramstein."
      },
      {
        "q": "Was ist „Taurus“, über dessen Lieferung an die Ukraine lange debattiert wurde?",
        "a": [
          "Ein Kampfpanzer",
          "Ein Flugabwehrsystem",
          "Ein Kampfflugzeug",
          "Ein Marschflugkörper"
        ],
        "c": 3,
        "e": "Taurus ist ein deutsch-schwedischer Marschflugkörper mit über 500 km Reichweite."
      },
      {
        "q": "Welche Initiative zur gemeinsamen europäischen Luftverteidigung stieß Deutschland 2022 an?",
        "a": [
          "Permanent Structured Cooperation",
          "Strategic Compass",
          "European Sky Shield Initiative",
          "European Peace Facility"
        ],
        "c": 2,
        "e": "Bundeskanzler Scholz regte die European Sky Shield Initiative (ESSI) im August 2022 an."
      }
    ],
    "gesundheit": [
      {
        "q": "In welchem Jahr wurde die gesetzliche Pflegeversicherung eingeführt?",
        "a": [
          "1989",
          "1995",
          "2001",
          "2005"
        ],
        "c": 1,
        "e": "Die soziale Pflegeversicherung trat 1995 als fünfte Säule der Sozialversicherung in Kraft."
      },
      {
        "q": "Unter welchem Reichskanzler wurde 1883 die gesetzliche Krankenversicherung eingeführt?",
        "a": [
          "Otto von Bismarck",
          "Leo von Caprivi",
          "Bernhard von Bülow",
          "Theobald von Bethmann Hollweg"
        ],
        "c": 0,
        "e": "Die Krankenversicherung von 1883 war Teil der Bismarck’schen Sozialgesetzgebung."
      },
      {
        "q": "Wie viele Pflegegrade gibt es in Deutschland seit 2017?",
        "a": [
          "Fünf",
          "Drei",
          "Vier",
          "Sechs"
        ],
        "c": 0,
        "e": "Seit 2017 ersetzen fünf Pflegegrade die früheren drei Pflegestufen."
      },
      {
        "q": "Welches Gremium legt fest, welche Leistungen die gesetzlichen Krankenkassen bezahlen?",
        "a": [
          "Bundesgesundheitsministerium",
          "Gemeinsamer Bundesausschuss",
          "Bundesärztekammer",
          "Robert Koch-Institut"
        ],
        "c": 1,
        "e": "Der G-BA ist das oberste Beschlussgremium der Selbstverwaltung im Gesundheitswesen."
      },
      {
        "q": "Welches Bundesinstitut ist in Deutschland für Impfstoffe zuständig?",
        "a": [
          "Robert Koch-Institut",
          "Bundesinstitut für Risikobewertung",
          "Paul-Ehrlich-Institut",
          "Friedrich-Loeffler-Institut"
        ],
        "c": 2,
        "e": "Das Paul-Ehrlich-Institut ist das Bundesinstitut für Impfstoffe und biomedizinische Arzneimittel."
      },
      {
        "q": "Wofür steht die Abkürzung STIKO?",
        "a": [
          "Staatliche Infektionskontrolle",
          "Stiftung Krankenhausordnung",
          "Statistik der Krankenkassen",
          "Ständige Impfkommission"
        ],
        "c": 3,
        "e": "Die STIKO am Robert Koch-Institut gibt Impfempfehlungen für Deutschland heraus."
      },
      {
        "q": "Wie hoch ist der allgemeine Beitragssatz der gesetzlichen Krankenversicherung (ohne Zusatzbeitrag)?",
        "a": [
          "12,4 %",
          "15,5 %",
          "14,6 %",
          "18,6 %"
        ],
        "c": 2,
        "e": "Der allgemeine Beitragssatz liegt seit 2015 bei 14,6 %, je zur Hälfte von Arbeitgeber und Arbeitnehmer."
      },
      {
        "q": "Wie hoch war der durchschnittliche Zusatzbeitrag in der GKV im Jahr 2025?",
        "a": [
          "2,5 %",
          "0,9 %",
          "1,7 %",
          "3,8 %"
        ],
        "c": 0,
        "e": "Der durchschnittliche Zusatzbeitrag wurde für 2025 auf 2,5 % festgelegt."
      },
      {
        "q": "Etwa welcher Anteil der Bevölkerung ist in Deutschland gesetzlich krankenversichert?",
        "a": [
          "Rund 50 %",
          "Rund 70 %",
          "Rund 99 %",
          "Rund 90 %"
        ],
        "c": 3,
        "e": "Rund 90 % der Menschen sind gesetzlich, etwa 10 % privat versichert."
      },
      {
        "q": "Welche neue Vergütungsform führt die Krankenhausreform von 2024 (KHVVG) neben Fallpauschalen ein?",
        "a": [
          "Kopfpauschale",
          "Vorhaltevergütung",
          "Tagessatzvergütung",
          "Erfolgsprämie"
        ],
        "c": 1,
        "e": "Ein großer Teil der Vergütung soll künftig für das Vorhalten von Leistungen gezahlt werden."
      },
      {
        "q": "Was bezeichnet das DRG-System in deutschen Krankenhäusern?",
        "a": [
          "Digitale Rezeptvergabe",
          "Abrechnung über Fallpauschalen",
          "Dienstplanregelung für Pflegekräfte",
          "Register für Organspenden"
        ],
        "c": 1,
        "e": "Diagnosis Related Groups vergüten Behandlungen pauschal je nach Diagnose und Eingriff."
      },
      {
        "q": "Nach welchem Prinzip wurde 2025 die elektronische Patientenakte für gesetzlich Versicherte eingeführt?",
        "a": [
          "Zustimmungslösung (Opt-in)",
          "Verpflichtung ohne Widerspruch",
          "Freiwillige Kassenauswahl",
          "Widerspruchslösung (Opt-out)"
        ],
        "c": 3,
        "e": "Alle gesetzlich Versicherten erhalten eine ePA, sofern sie nicht widersprechen."
      },
      {
        "q": "Welche Regelung gilt in Deutschland bei der Organspende?",
        "a": [
          "Entscheidungslösung mit Zustimmung",
          "Widerspruchslösung",
          "Notstandslösung",
          "Verpflichtende Organspende"
        ],
        "c": 0,
        "e": "Organe dürfen nur mit Zustimmung des Spenders oder der Angehörigen entnommen werden."
      },
      {
        "q": "Seit wann ist der Besitz geringer Mengen Cannabis für Erwachsene in Deutschland erlaubt?",
        "a": [
          "Seit Januar 2022",
          "Seit Juli 2023",
          "Seit April 2024",
          "Seit Januar 2025"
        ],
        "c": 2,
        "e": "Das Cannabisgesetz trat am 1. April 2024 in Kraft."
      },
      {
        "q": "Wer hat den Sicherstellungsauftrag für die ambulante ärztliche Versorgung gesetzlich Versicherter?",
        "a": [
          "Gesundheitsämter",
          "Landesärztekammern",
          "Krankenkassen",
          "Kassenärztliche Vereinigungen"
        ],
        "c": 3,
        "e": "Die Kassenärztlichen Vereinigungen müssen eine ausreichende ambulante Versorgung sicherstellen."
      },
      {
        "q": "Wer trägt nach der dualen Krankenhausfinanzierung die Investitionskosten der Kliniken?",
        "a": [
          "Die Krankenkassen",
          "Der Bund",
          "Die Bundesländer",
          "Die Kommunen allein"
        ],
        "c": 2,
        "e": "Investitionen finanzieren die Länder, laufende Betriebskosten die Krankenkassen."
      },
      {
        "q": "Wie hoch war der allgemeine Beitragssatz zur Pflegeversicherung im Jahr 2025 (ohne Kinderlosenzuschlag)?",
        "a": [
          "2,4 %",
          "3,6 %",
          "3,05 %",
          "4,6 %"
        ],
        "c": 1,
        "e": "Zum 1. Januar 2025 stieg der Beitragssatz zur Pflegeversicherung auf 3,6 %."
      },
      {
        "q": "Welches Prinzip kennzeichnet die gesetzliche Pflegeversicherung?",
        "a": [
          "Sie deckt nur einen Teil der Kosten",
          "Sie übernimmt alle Pflegekosten",
          "Sie zahlt nur bei Heimunterbringung",
          "Sie ist rein steuerfinanziert"
        ],
        "c": 0,
        "e": "Die Pflegeversicherung gilt als „Teilkasko“, ein Eigenanteil bleibt bei den Pflegebedürftigen."
      },
      {
        "q": "In welcher Stadt hat die Weltgesundheitsorganisation (WHO) ihren Hauptsitz?",
        "a": [
          "Genf",
          "New York",
          "Wien",
          "Paris"
        ],
        "c": 0,
        "e": "Die WHO ist eine Sonderorganisation der Vereinten Nationen mit Sitz in Genf."
      },
      {
        "q": "Was regelt das Pflegeberufegesetz seit 2020?",
        "a": [
          "Einen Mindestlohn für Pflegehilfskräfte",
          "Eine generalistische Pflegeausbildung",
          "Die Anwerbung ausländischer Pflegekräfte",
          "Die Pflegepflicht für Angehörige"
        ],
        "c": 1,
        "e": "Alten-, Kranken- und Kinderkrankenpflege wurden zu einer gemeinsamen Ausbildung zusammengeführt."
      },
      {
        "q": "Für welche Impfung gilt seit März 2020 eine Nachweispflicht für Kinder in Kitas und Schulen?",
        "a": [
          "Keuchhusten",
          "Windpocken",
          "Masern",
          "Grippe"
        ],
        "c": 2,
        "e": "Das Masernschutzgesetz verlangt einen Impf- oder Immunitätsnachweis."
      },
      {
        "q": "Wohin fließen die Beiträge zur gesetzlichen Krankenversicherung seit 2009 zentral?",
        "a": [
          "In den Bundeshaushalt",
          "Direkt an die Ärzte",
          "In die Rentenkasse",
          "In den Gesundheitsfonds"
        ],
        "c": 3,
        "e": "Der Gesundheitsfonds verteilt die Mittel per Zuweisung an die einzelnen Krankenkassen."
      },
      {
        "q": "Was soll der morbiditätsorientierte Risikostrukturausgleich (Morbi-RSA) ausgleichen?",
        "a": [
          "Einkommensunterschiede zwischen Ärzten",
          "Preisunterschiede bei Medikamenten",
          "Unterschiede in der Krankheitslast zwischen Kassen",
          "Personalmangel in Kliniken"
        ],
        "c": 2,
        "e": "Kassen mit vielen kranken Versicherten erhalten höhere Zuweisungen aus dem Gesundheitsfonds."
      },
      {
        "q": "Wie viele gesetzliche Krankenkassen gab es im Jahr 2025 ungefähr?",
        "a": [
          "Knapp 100",
          "Rund 20",
          "Rund 300",
          "Über 1.000"
        ],
        "c": 0,
        "e": "Durch Fusionen sank die Zahl von über 1.000 (1990er) auf unter 100 Kassen."
      },
      {
        "q": "Welcher Anteil des Bruttoinlandsprodukts entfällt in Deutschland ungefähr auf Gesundheitsausgaben?",
        "a": [
          "Rund 5 %",
          "Rund 20 %",
          "Rund 30 %",
          "Rund 12 %"
        ],
        "c": 3,
        "e": "Die Gesundheitsausgaben liegen laut Statistischem Bundesamt bei gut 12 % des BIP."
      },
      {
        "q": "Wie viele Menschen galten Ende 2023 in Deutschland als pflegebedürftig?",
        "a": [
          "Rund 1,5 Millionen",
          "Rund 5,7 Millionen",
          "Rund 12 Millionen",
          "Rund 20 Millionen"
        ],
        "c": 1,
        "e": "Laut Statistischem Bundesamt waren Ende 2023 etwa 5,7 Millionen Menschen pflegebedürftig."
      },
      {
        "q": "Welche Gebühr für Arztbesuche wurde 2013 abgeschafft?",
        "a": [
          "Die Rezeptgebühr",
          "Die Praxisgebühr",
          "Die Krankenhausgebühr",
          "Die Notdienstgebühr"
        ],
        "c": 1,
        "e": "Die 2004 eingeführte Praxisgebühr von 10 Euro pro Quartal wurde 2013 abgeschafft."
      },
      {
        "q": "Wonach richten sich die Beiträge in der privaten Krankenversicherung grundsätzlich?",
        "a": [
          "Höhe des Einkommens",
          "Zahl der Familienmitglieder",
          "Wohnort und Region",
          "Gesundheitsrisiko und Eintrittsalter"
        ],
        "c": 3,
        "e": "Die PKV kalkuliert risikobasiert, während GKV-Beiträge vom Einkommen abhängen."
      },
      {
        "q": "Wer prüft bei gesetzlich Versicherten, ob und in welchem Grad Pflegebedürftigkeit vorliegt?",
        "a": [
          "Der Medizinische Dienst",
          "Das Gesundheitsamt",
          "Der Hausarzt allein",
          "Das Sozialgericht"
        ],
        "c": 0,
        "e": "Der Medizinische Dienst begutachtet im Auftrag der Pflegekasse."
      },
      {
        "q": "Wie viele Filialapotheken darf ein Apotheker neben seiner Hauptapotheke höchstens betreiben?",
        "a": [
          "Eine",
          "Fünf",
          "Drei",
          "Zehn"
        ],
        "c": 2,
        "e": "Das Apothekengesetz erlaubt eine Hauptapotheke mit bis zu drei Filialen."
      }
    ],
    "verkehr": [
      {
        "q": "Zu welchem Monatspreis startete das Deutschlandticket im Mai 2023?",
        "a": [
          "9 Euro",
          "29 Euro",
          "49 Euro",
          "69 Euro"
        ],
        "c": 2,
        "e": "Das Deutschlandticket startete am 1. Mai 2023 für 49 Euro im Monat."
      },
      {
        "q": "Welches Gericht stoppte 2019 die geplante deutsche Pkw-Maut?",
        "a": [
          "Bundesverfassungsgericht",
          "Bundesverwaltungsgericht",
          "Europäischer Gerichtshof für Menschenrechte",
          "Europäischer Gerichtshof"
        ],
        "c": 3,
        "e": "Der EuGH sah in der Maut eine Diskriminierung von Fahrern aus anderen EU-Staaten."
      },
      {
        "q": "Ab welchem zulässigen Gesamtgewicht gilt die Lkw-Maut seit Juli 2024?",
        "a": [
          "Über 7,5 Tonnen",
          "Über 12 Tonnen",
          "Über 3,5 Tonnen",
          "Über 2,8 Tonnen"
        ],
        "c": 2,
        "e": "Seit Juli 2024 sind auch Lkw ab mehr als 3,5 Tonnen mautpflichtig, zuvor ab 7,5 Tonnen."
      },
      {
        "q": "Wer ist seit 2021 für Planung, Bau und Betrieb der Autobahnen zuständig?",
        "a": [
          "Die Länder im Auftrag des Bundes",
          "Die Autobahn GmbH des Bundes",
          "Die Kommunen",
          "Die DEGES allein"
        ],
        "c": 1,
        "e": "Seit 2021 verwaltet die bundeseigene Autobahn GmbH die Autobahnen statt der Länder."
      },
      {
        "q": "In welchem Jahr entstand die Deutsche Bahn AG aus Bundesbahn und Reichsbahn?",
        "a": [
          "1994",
          "1990",
          "1999",
          "2002"
        ],
        "c": 0,
        "e": "Mit der Bahnreform wurden 1994 Bundesbahn und Reichsbahn zur Deutschen Bahn AG."
      },
      {
        "q": "Welche DB-Gesellschaft ist seit 2024 für Schienennetz und Bahnhöfe zuständig?",
        "a": [
          "DB InfraGO",
          "DB Netz",
          "DB Regio",
          "DB Cargo"
        ],
        "c": 0,
        "e": "Die gemeinwohlorientierte DB InfraGO entstand 2024 aus DB Netz und DB Station&Service."
      },
      {
        "q": "Wem gehört die Deutsche Bahn AG?",
        "a": [
          "Mehrheitlich privaten Aktionären",
          "Zu 100 % dem Bund",
          "Zu gleichen Teilen Bund und Ländern",
          "Zu 51 % dem Bund"
        ],
        "c": 1,
        "e": "Die Deutsche Bahn AG ist eine Aktiengesellschaft, deren Aktien vollständig beim Bund liegen."
      },
      {
        "q": "Wer ist für die Bestellung des Schienenpersonennahverkehrs (SPNV) zuständig?",
        "a": [
          "Der Bund",
          "Die Deutsche Bahn",
          "Die Länder",
          "Die EU"
        ],
        "c": 2,
        "e": "Die Länder bestellen den Regionalverkehr und erhalten dafür Regionalisierungsmittel vom Bund."
      },
      {
        "q": "Wie heißt das zentrale Planungsinstrument des Bundes für Investitionen in Verkehrswege?",
        "a": [
          "Nationaler Mobilitätsplan",
          "Masterplan Schiene",
          "Infrastrukturatlas",
          "Bundesverkehrswegeplan"
        ],
        "c": 3,
        "e": "Der Bundesverkehrswegeplan legt fest, welche Straßen-, Schienen- und Wasserprojekte Vorrang haben."
      },
      {
        "q": "Wie lang ist das deutsche Autobahnnetz ungefähr?",
        "a": [
          "Rund 6.000 km",
          "Rund 25.000 km",
          "Rund 13.000 km",
          "Rund 40.000 km"
        ],
        "c": 2,
        "e": "Das Autobahnnetz umfasst rund 13.000 Kilometer."
      },
      {
        "q": "Wie lang ist das Schienennetz der Deutschen Bahn ungefähr?",
        "a": [
          "Rund 33.000 km",
          "Rund 15.000 km",
          "Rund 60.000 km",
          "Rund 90.000 km"
        ],
        "c": 0,
        "e": "Die DB betreibt ein Schienennetz von rund 33.000 Kilometern Länge."
      },
      {
        "q": "In welcher Stadt stürzte im September 2024 ein Teil der Carolabrücke ein?",
        "a": [
          "Leipzig",
          "Magdeburg",
          "Chemnitz",
          "Dresden"
        ],
        "c": 3,
        "e": "Der Teileinsturz der Dresdner Carolabrücke wurde zum Symbol für marode Brücken."
      },
      {
        "q": "An welcher Autobahn musste 2021 die marode Talbrücke Rahmede gesperrt werden?",
        "a": [
          "A1",
          "A45",
          "A7",
          "A3"
        ],
        "c": 1,
        "e": "Die Sperrung der A45 bei Lüdenscheid führte zu jahrelangen Umleitungen; 2023 wurde die Brücke gesprengt."
      },
      {
        "q": "Wie groß ist das 2025 beschlossene Sondervermögen für Infrastruktur und Klimaneutralität?",
        "a": [
          "100 Milliarden Euro",
          "500 Milliarden Euro",
          "250 Milliarden Euro",
          "1 Billion Euro"
        ],
        "c": 1,
        "e": "Bundestag und Bundesrat beschlossen im März 2025 ein Sondervermögen von 500 Mrd. Euro."
      },
      {
        "q": "Welche dänische Insel wird der Fehmarnbelt-Tunnel mit Fehmarn verbinden?",
        "a": [
          "Seeland",
          "Fünen",
          "Bornholm",
          "Lolland"
        ],
        "c": 3,
        "e": "Der Absenktunnel soll Fehmarn mit Lolland verbinden und Hamburg und Kopenhagen näher bringen."
      },
      {
        "q": "Was ist der Kern des Bahnprojekts Stuttgart 21?",
        "a": [
          "Umbau zum unterirdischen Durchgangsbahnhof",
          "Neubau eines Flughafenbahnhofs",
          "Elektrifizierung aller Regionalstrecken",
          "Bau einer Magnetschwebebahn"
        ],
        "c": 0,
        "e": "Der Kopfbahnhof wird durch einen tiefergelegten Durchgangsbahnhof ersetzt."
      },
      {
        "q": "In welchem Jahr wurde der Hauptstadtflughafen BER eröffnet?",
        "a": [
          "2012",
          "2017",
          "2020",
          "2022"
        ],
        "c": 2,
        "e": "Nach jahrelangen Verzögerungen ging der BER im Oktober 2020 in Betrieb."
      },
      {
        "q": "Welche Behörde führt das Fahreignungsregister („Punkte in Flensburg“)?",
        "a": [
          "Bundesamt für Logistik und Mobilität",
          "Bundesanstalt für Straßenwesen",
          "Eisenbahn-Bundesamt",
          "Kraftfahrt-Bundesamt"
        ],
        "c": 3,
        "e": "Das Kraftfahrt-Bundesamt mit Sitz in Flensburg führt das Fahreignungsregister."
      },
      {
        "q": "Bei wie vielen Punkten im Fahreignungsregister wird die Fahrerlaubnis entzogen?",
        "a": [
          "5 Punkte",
          "10 Punkte",
          "8 Punkte",
          "18 Punkte"
        ],
        "c": 2,
        "e": "Seit der Reform 2014 führen 8 Punkte zum Entzug der Fahrerlaubnis."
      },
      {
        "q": "Welche Richtgeschwindigkeit gilt auf deutschen Autobahnen ohne Tempolimit?",
        "a": [
          "100 km/h",
          "130 km/h",
          "120 km/h",
          "150 km/h"
        ],
        "c": 1,
        "e": "Die Richtgeschwindigkeit von 130 km/h ist eine Empfehlung, kein verbindliches Limit."
      },
      {
        "q": "Was ist das Ziel des „Deutschlandtakts“ bei der Bahn?",
        "a": [
          "Ein abgestimmter Taktfahrplan mit Anschlüssen",
          "Ein bundesweit einheitlicher Ticketpreis",
          "Die Privatisierung des Fernverkehrs",
          "Nachtzüge in alle Nachbarländer"
        ],
        "c": 0,
        "e": "Züge sollen in festen Takten fahren und an Knoten optimal aufeinander abgestimmt sein."
      },
      {
        "q": "Welche Behörde reguliert den Zugang zum Schienennetz und die Trassenpreise?",
        "a": [
          "Bundesnetzagentur",
          "Eisenbahn-Bundesamt",
          "Bundeskartellamt",
          "Kraftfahrt-Bundesamt"
        ],
        "c": 0,
        "e": "Die Bundesnetzagentur ist Regulierungsbehörde auch für die Eisenbahninfrastruktur."
      },
      {
        "q": "Welche Strecke wurde 2024 als erster Hochleistungskorridor generalsaniert?",
        "a": [
          "Hamburg–Berlin",
          "Riedbahn Frankfurt–Mannheim",
          "Köln–Hagen",
          "Nürnberg–Regensburg"
        ],
        "c": 1,
        "e": "Die Riedbahn wurde von Juli bis Dezember 2024 als Pilotprojekt komplett gesperrt und saniert."
      },
      {
        "q": "Wie pünktlich war der DB-Fernverkehr im Jahr 2024 ungefähr?",
        "a": [
          "Rund 45 %",
          "Rund 80 %",
          "Rund 62 %",
          "Rund 92 %"
        ],
        "c": 2,
        "e": "2024 erreichten nur rund 62,5 % der Fernzüge ihr Ziel weniger als sechs Minuten verspätet."
      },
      {
        "q": "Wem steht das Aufkommen der Kfz-Steuer seit 2009 zu?",
        "a": [
          "Den Ländern",
          "Den Kommunen",
          "Der EU",
          "Dem Bund"
        ],
        "c": 3,
        "e": "Seit 2009 ist die Kfz-Steuer eine Bundessteuer; die Länder erhalten dafür einen Ausgleich."
      },
      {
        "q": "Wie heißt die Steuer, die heute auf Benzin und Diesel erhoben wird?",
        "a": [
          "Mineralölsteuer",
          "Ökosteuer",
          "Energiesteuer",
          "Kraftfahrzeugsteuer"
        ],
        "c": 2,
        "e": "Die frühere Mineralölsteuer wurde 2006 durch die Energiesteuer abgelöst."
      },
      {
        "q": "Wie wird die Entfernungspauschale („Pendlerpauschale“) berechnet?",
        "a": [
          "Pro Kilometer der einfachen Strecke",
          "Pro gefahrenem Kilometer hin und zurück",
          "Als feste Monatspauschale",
          "Nach den tatsächlichen Tankkosten"
        ],
        "c": 0,
        "e": "Angesetzt wird jeder volle Entfernungskilometer zwischen Wohnung und Arbeitsstätte."
      },
      {
        "q": "Welche künstliche Wasserstraße gilt als meistbefahrene der Welt?",
        "a": [
          "Mittellandkanal",
          "Main-Donau-Kanal",
          "Dortmund-Ems-Kanal",
          "Nord-Ostsee-Kanal"
        ],
        "c": 3,
        "e": "Der Nord-Ostsee-Kanal zwischen Brunsbüttel und Kiel wird von mehr Schiffen genutzt als Suez- oder Panamakanal."
      },
      {
        "q": "Welcher ist der größte Seehafen Deutschlands?",
        "a": [
          "Bremerhaven",
          "Hamburg",
          "Wilhelmshaven",
          "Rostock"
        ],
        "c": 1,
        "e": "Hamburg ist gemessen am Umschlag der mit Abstand größte deutsche Seehafen."
      },
      {
        "q": "Welcher ist der passagierstärkste Flughafen Deutschlands?",
        "a": [
          "München",
          "Frankfurt am Main",
          "Berlin (BER)",
          "Düsseldorf"
        ],
        "c": 1,
        "e": "Frankfurt ist Deutschlands größtes Luftverkehrsdrehkreuz, gefolgt von München."
      }
    ],
    "europa": [
      {
        "q": "In welchem Jahr wurden die Römischen Verträge unterzeichnet?",
        "a": [
          "1957",
          "1951",
          "1963",
          "1972"
        ],
        "c": 0,
        "e": "Mit den Römischen Verträgen 1957 entstanden die EWG und Euratom."
      },
      {
        "q": "Durch welchen Vertrag wurde 1992 die Europäische Union gegründet?",
        "a": [
          "Vertrag von Lissabon",
          "Vertrag von Nizza",
          "Vertrag von Maastricht",
          "Vertrag von Amsterdam"
        ],
        "c": 2,
        "e": "Der Vertrag von Maastricht wurde 1992 unterzeichnet und trat 1993 in Kraft."
      },
      {
        "q": "In welchem Jahr trat der Vertrag von Lissabon in Kraft?",
        "a": [
          "2004",
          "2007",
          "2012",
          "2009"
        ],
        "c": 3,
        "e": "Der 2007 unterzeichnete Vertrag von Lissabon trat am 1. Dezember 2009 in Kraft."
      },
      {
        "q": "Seit wann gibt es Euro-Bargeld in Deutschland?",
        "a": [
          "1999",
          "2000",
          "2002",
          "2005"
        ],
        "c": 2,
        "e": "Der Euro wurde 1999 als Buchgeld eingeführt, Münzen und Scheine folgten am 1. Januar 2002."
      },
      {
        "q": "Wie viele Mitgliedstaaten hat die Europäische Union nach dem Brexit?",
        "a": [
          "25",
          "27",
          "28",
          "30"
        ],
        "c": 1,
        "e": "Seit dem Austritt Großbritanniens hat die EU 27 Mitgliedstaaten."
      },
      {
        "q": "Wann trat das Vereinigte Königreich offiziell aus der EU aus?",
        "a": [
          "Januar 2020",
          "Juni 2016",
          "März 2019",
          "Januar 2021"
        ],
        "c": 0,
        "e": "Der Austritt wurde am 31. Januar 2020 wirksam, die Übergangsphase endete Ende 2020."
      },
      {
        "q": "Wo finden die meisten Plenartagungen des Europäischen Parlaments statt?",
        "a": [
          "Straßburg",
          "Brüssel",
          "Luxemburg",
          "Frankfurt"
        ],
        "c": 0,
        "e": "Offizieller Sitz ist Straßburg; Ausschüsse und Zusatzsitzungen finden in Brüssel statt."
      },
      {
        "q": "In welcher Stadt hat die Europäische Zentralbank ihren Sitz?",
        "a": [
          "Brüssel",
          "Frankfurt am Main",
          "Luxemburg",
          "Amsterdam"
        ],
        "c": 1,
        "e": "Die EZB sitzt in Frankfurt am Main."
      },
      {
        "q": "Wo hat der Gerichtshof der Europäischen Union seinen Sitz?",
        "a": [
          "Den Haag",
          "Straßburg",
          "Luxemburg",
          "Brüssel"
        ],
        "c": 2,
        "e": "Der EuGH sitzt in Luxemburg; in Straßburg sitzt dagegen der Menschenrechtsgerichtshof des Europarats."
      },
      {
        "q": "Wie viele Abgeordnete stellt Deutschland im Europäischen Parlament?",
        "a": [
          "72",
          "99",
          "120",
          "96"
        ],
        "c": 3,
        "e": "Deutschland stellt mit 96 Sitzen die nach EU-Recht maximal mögliche Zahl."
      },
      {
        "q": "Wie viele Abgeordnete hat das 2024 gewählte Europäische Parlament insgesamt?",
        "a": [
          "500",
          "651",
          "720",
          "751"
        ],
        "c": 2,
        "e": "Seit der Europawahl 2024 umfasst das Parlament 720 Abgeordnete."
      },
      {
        "q": "Wer ist seit Dezember 2024 Präsident des Europäischen Rates?",
        "a": [
          "António Costa",
          "Charles Michel",
          "Mark Rutte",
          "Donald Tusk"
        ],
        "c": 0,
        "e": "Der frühere portugiesische Ministerpräsident Costa folgte auf Charles Michel."
      },
      {
        "q": "Welches EU-Organ hat grundsätzlich das Initiativrecht für Gesetzesvorschläge?",
        "a": [
          "Europäisches Parlament",
          "Europäischer Rat",
          "Rat der EU",
          "Europäische Kommission"
        ],
        "c": 3,
        "e": "Gesetzgebungsvorschläge kommen in der Regel von der Kommission."
      },
      {
        "q": "Welche dieser Einrichtungen ist KEIN Organ der Europäischen Union?",
        "a": [
          "Europäischer Rat",
          "Europarat",
          "Rat der EU",
          "Europäischer Rechnungshof"
        ],
        "c": 1,
        "e": "Der Europarat in Straßburg ist eine eigenständige Organisation mit 46 Mitgliedstaaten."
      },
      {
        "q": "In welchem Land wurde 1985 das Schengener Abkommen unterzeichnet?",
        "a": [
          "Belgien",
          "Luxemburg",
          "Frankreich",
          "Niederlande"
        ],
        "c": 1,
        "e": "Schengen ist ein kleiner Ort in Luxemburg an der Grenze zu Deutschland und Frankreich."
      },
      {
        "q": "Welches Land führte am 1. Januar 2026 den Euro ein?",
        "a": [
          "Rumänien",
          "Polen",
          "Tschechien",
          "Bulgarien"
        ],
        "c": 3,
        "e": "Bulgarien wurde 2026 das 21. Mitglied der Eurozone."
      },
      {
        "q": "Welches Land trat 2013 als bislang letztes der EU bei?",
        "a": [
          "Kroatien",
          "Bulgarien",
          "Rumänien",
          "Slowenien"
        ],
        "c": 0,
        "e": "Kroatien wurde am 1. Juli 2013 28. Mitglied der EU."
      },
      {
        "q": "Wie viele Staaten traten der EU bei der Osterweiterung 2004 bei?",
        "a": [
          "Fünf",
          "Acht",
          "Zehn",
          "Zwölf"
        ],
        "c": 2,
        "e": "2004 traten zehn Staaten bei, darunter Polen, Tschechien und die baltischen Staaten."
      },
      {
        "q": "Was erfordert eine qualifizierte Mehrheit im Rat der EU in der Regel?",
        "a": [
          "Zwei Drittel aller Staaten",
          "Einfache Mehrheit der Staaten",
          "Einstimmigkeit aller Staaten",
          "55 % der Staaten mit 65 % der Bevölkerung"
        ],
        "c": 3,
        "e": "Die doppelte Mehrheit gilt seit dem Vertrag von Lissabon."
      },
      {
        "q": "Für wie viele Jahre wird der Mehrjährige Finanzrahmen der EU üblicherweise festgelegt?",
        "a": [
          "Drei",
          "Fünf",
          "Sieben",
          "Zehn"
        ],
        "c": 2,
        "e": "Der aktuelle Finanzrahmen umfasst die Jahre 2021 bis 2027."
      },
      {
        "q": "Welcher Mitgliedstaat ist in absoluten Zahlen der größte Nettozahler der EU?",
        "a": [
          "Frankreich",
          "Deutschland",
          "Italien",
          "Niederlande"
        ],
        "c": 1,
        "e": "Deutschland zahlt absolut am meisten mehr in den EU-Haushalt ein, als es zurückerhält."
      },
      {
        "q": "Welche Obergrenzen nennen die EU-Fiskalregeln für Defizit und Schuldenstand?",
        "a": [
          "3 % und 60 % des BIP",
          "1 % und 40 % des BIP",
          "5 % und 90 % des BIP",
          "2 % und 100 % des BIP"
        ],
        "c": 0,
        "e": "Die Maastricht-Kriterien begrenzen das Defizit auf 3 % und die Schulden auf 60 % des BIP."
      },
      {
        "q": "Wann erhielt die Ukraine den Status eines EU-Beitrittskandidaten?",
        "a": [
          "Juni 2022",
          "Februar 2014",
          "Dezember 2019",
          "Januar 2024"
        ],
        "c": 0,
        "e": "Der Europäische Rat verlieh der Ukraine und Moldau im Juni 2022 den Kandidatenstatus."
      },
      {
        "q": "Ab welchem Alter durfte man in Deutschland bei der Europawahl 2024 wählen?",
        "a": [
          "17 Jahre",
          "16 Jahre",
          "18 Jahre",
          "21 Jahre"
        ],
        "c": 1,
        "e": "Für die Europawahl 2024 wurde das Wahlalter in Deutschland auf 16 Jahre gesenkt."
      },
      {
        "q": "Wie hieß die 1951 gegründete Vorläufergemeinschaft der EU?",
        "a": [
          "Europäische Freihandelsassoziation",
          "Europäische Verteidigungsgemeinschaft",
          "Europäische Gemeinschaft für Kohle und Stahl",
          "Europäisches Währungssystem"
        ],
        "c": 2,
        "e": "Die EGKS („Montanunion“) stellte Kohle und Stahl unter gemeinsame Aufsicht."
      },
      {
        "q": "Wie lange dauert eine Präsidentschaft im Rat der EU?",
        "a": [
          "Drei Monate",
          "Ein Jahr",
          "Zweieinhalb Jahre",
          "Sechs Monate"
        ],
        "c": 3,
        "e": "Die Mitgliedstaaten wechseln sich halbjährlich im Ratsvorsitz ab."
      },
      {
        "q": "Auf welchem Werk beruht die Europahymne?",
        "a": [
          "Händels Feuerwerksmusik",
          "Mozarts Zauberflöte",
          "Beethovens 9. Sinfonie",
          "Haydns Kaiserquartett"
        ],
        "c": 2,
        "e": "Die Hymne nutzt die Melodie der „Ode an die Freude“ aus Beethovens 9. Sinfonie."
      },
      {
        "q": "Woran erinnert der Europatag am 9. Mai?",
        "a": [
          "An die Schuman-Erklärung von 1950",
          "An die Römischen Verträge von 1957",
          "An den Mauerfall 1989",
          "An die erste Europawahl 1979"
        ],
        "c": 0,
        "e": "Am 9. Mai 1950 schlug Robert Schuman eine Gemeinschaft für Kohle und Stahl vor."
      },
      {
        "q": "In welchem Bereich hat die EU eine ausschließliche Zuständigkeit?",
        "a": [
          "Schulbildung",
          "Krankenhausversorgung",
          "Einkommensteuer",
          "Gemeinsame Handelspolitik"
        ],
        "c": 3,
        "e": "Die Handelspolitik gegenüber Drittstaaten liegt allein bei der EU."
      },
      {
        "q": "Wie viele Unterschriften braucht eine Europäische Bürgerinitiative mindestens?",
        "a": [
          "100.000",
          "1 Million",
          "500.000",
          "5 Millionen"
        ],
        "c": 1,
        "e": "Nötig sind eine Million Unterschriften aus mindestens sieben Mitgliedstaaten."
      }
    ],
    "familie": [
      {
        "q": "Wie viel Prozent des wegfallenden Nettoeinkommens ersetzt das Elterngeld in der Regel?",
        "a": [
          "50 bis 55 Prozent",
          "65 bis 67 Prozent",
          "75 bis 80 Prozent",
          "85 bis 90 Prozent"
        ],
        "c": 1,
        "e": "Das Elterngeld ersetzt in der Regel 65 bis 67 Prozent, bei geringem Einkommen anteilig mehr."
      },
      {
        "q": "Wie hoch ist das Basiselterngeld pro Monat höchstens?",
        "a": [
          "1.200 Euro",
          "1.500 Euro",
          "2.100 Euro",
          "1.800 Euro"
        ],
        "c": 3,
        "e": "Das Basiselterngeld beträgt mindestens 300 und höchstens 1.800 Euro im Monat."
      },
      {
        "q": "Wie viele Monate Basiselterngeld können Eltern zusammen höchstens beziehen, wenn sich beide beteiligen?",
        "a": [
          "12 Monate",
          "14 Monate",
          "18 Monate",
          "24 Monate"
        ],
        "c": 1,
        "e": "Zu den 12 Monaten kommen zwei Partnermonate, wenn beide Eltern Einkommen einbüßen."
      },
      {
        "q": "Wie lange kann jeder Elternteil pro Kind höchstens Elternzeit nehmen?",
        "a": [
          "Ein Jahr",
          "Zwei Jahre",
          "Drei Jahre",
          "Vier Jahre"
        ],
        "c": 2,
        "e": "Jeder Elternteil hat pro Kind Anspruch auf bis zu drei Jahre Elternzeit, teils auch nach dem dritten Geburtstag."
      },
      {
        "q": "Seit welchem Jahr gibt es einen Rechtsanspruch auf einen Betreuungsplatz ab dem ersten Geburtstag?",
        "a": [
          "2013",
          "2008",
          "2017",
          "2020"
        ],
        "c": 0,
        "e": "Seit dem 1. August 2013 haben Kinder ab dem vollendeten ersten Lebensjahr Anspruch auf frühkindliche Förderung."
      },
      {
        "q": "Ab welchem Schuljahr gilt der stufenweise Rechtsanspruch auf Ganztagsbetreuung für Grundschulkinder?",
        "a": [
          "2024/25",
          "2025/26",
          "2026/27",
          "2028/29"
        ],
        "c": 2,
        "e": "Der Anspruch startet am 1. August 2026 für Erstklässler und wächst bis 2029 auf alle vier Klassenstufen."
      },
      {
        "q": "In welchem Jahr wurde die Ehe für gleichgeschlechtliche Paare in Deutschland eingeführt?",
        "a": [
          "2001",
          "2013",
          "2015",
          "2017"
        ],
        "c": 3,
        "e": "Der Bundestag beschloss die „Ehe für alle“ im Juni 2017, sie gilt seit dem 1. Oktober 2017."
      },
      {
        "q": "Was regelt das Selbstbestimmungsgesetz, das im November 2024 in Kraft trat?",
        "a": [
          "Änderung des Geschlechtseintrags beim Standesamt",
          "Recht auf Teilzeit nach der Elternzeit",
          "Wahl des Familiennamens bei der Heirat",
          "Freie Schulwahl für Minderjährige"
        ],
        "c": 0,
        "e": "Seit November 2024 können Geschlechtseintrag und Vornamen per Erklärung beim Standesamt geändert werden."
      },
      {
        "q": "In welchem Grundgesetzartikel steht der Satz „Männer und Frauen sind gleichberechtigt“?",
        "a": [
          "Artikel 1",
          "Artikel 3",
          "Artikel 6",
          "Artikel 12"
        ],
        "c": 1,
        "e": "Artikel 3 Absatz 2 GG garantiert die Gleichberechtigung und verpflichtet den Staat, sie zu fördern."
      },
      {
        "q": "Welche Juristin setzte im Parlamentarischen Rat den Satz zur Gleichberechtigung von Mann und Frau durch?",
        "a": [
          "Helene Weber",
          "Marie Juchacz",
          "Elisabeth Selbert",
          "Hildegard Hamm-Brücher"
        ],
        "c": 2,
        "e": "Die SPD-Juristin Elisabeth Selbert setzte den Gleichberechtigungssatz 1948/49 gegen anfänglichen Widerstand durch."
      },
      {
        "q": "In welchem Jahr erhielten Frauen in Deutschland das Wahlrecht?",
        "a": [
          "1908",
          "1918",
          "1925",
          "1949"
        ],
        "c": 1,
        "e": "Das Frauenwahlrecht wurde im November 1918 eingeführt und bei der Wahl im Januar 1919 erstmals ausgeübt."
      },
      {
        "q": "Welche Politikerin hielt 1919 als erste Frau eine Rede in einem deutschen Parlament?",
        "a": [
          "Clara Zetkin",
          "Rosa Luxemburg",
          "Louise Otto-Peters",
          "Marie Juchacz"
        ],
        "c": 3,
        "e": "Marie Juchacz (SPD) sprach im Februar 1919 in der Weimarer Nationalversammlung; sie gründete auch die AWO."
      },
      {
        "q": "Seit welchem Jahr ist Vergewaltigung in der Ehe in Deutschland strafbar?",
        "a": [
          "1977",
          "1990",
          "1997",
          "2005"
        ],
        "c": 2,
        "e": "Erst 1997 wurde die Vergewaltigung in der Ehe der außerehelichen strafrechtlich gleichgestellt."
      },
      {
        "q": "Wie hoch war das Kindergeld pro Kind und Monat im Jahr 2025?",
        "a": [
          "219 Euro",
          "238 Euro",
          "255 Euro",
          "280 Euro"
        ],
        "c": 2,
        "e": "Seit Januar 2025 betrug das Kindergeld einheitlich 255 Euro pro Kind und Monat."
      },
      {
        "q": "Welche Stelle zahlt in Deutschland das Kindergeld aus?",
        "a": [
          "Die Familienkasse",
          "Das örtliche Jugendamt",
          "Das Wohnsitzfinanzamt",
          "Die Rentenversicherung"
        ],
        "c": 0,
        "e": "Kindergeld wird von der Familienkasse ausgezahlt, die zur Bundesagentur für Arbeit gehört."
      },
      {
        "q": "Bis zu welchem Alter kann für Kinder in Ausbildung oder Studium höchstens Kindergeld bezogen werden?",
        "a": [
          "Bis 18 Jahre",
          "Bis 21 Jahre",
          "Bis 27 Jahre",
          "Bis 25 Jahre"
        ],
        "c": 3,
        "e": "Für Kinder in Ausbildung gibt es Kindergeld längstens bis zur Vollendung des 25. Lebensjahres."
      },
      {
        "q": "Wie lange dauert die Mutterschutzfrist nach einer Geburt im Regelfall?",
        "a": [
          "Acht Wochen",
          "Vier Wochen",
          "Sechs Wochen",
          "Zwölf Wochen"
        ],
        "c": 0,
        "e": "Der Mutterschutz umfasst sechs Wochen vor und in der Regel acht Wochen nach der Entbindung."
      },
      {
        "q": "Was ist der Unterhaltsvorschuss?",
        "a": [
          "Ein KfW-Kredit für junge Familien",
          "Eine vorgezogene Kindergeldzahlung",
          "Staatsgeld, wenn ein Elternteil nicht zahlt",
          "Ein Zuschuss zur Ausbildungsvergütung"
        ],
        "c": 2,
        "e": "Der Staat springt bei Alleinerziehenden ein, wenn Unterhalt ausbleibt, und holt sich das Geld möglichst beim anderen Elternteil zurück."
      },
      {
        "q": "Welche Leistung gibt es für Eltern, deren Einkommen für sie selbst, aber nicht für die Kinder reicht?",
        "a": [
          "Kinderfreibetrag",
          "Betreuungsgeld",
          "Elterngeld",
          "Kinderzuschlag"
        ],
        "c": 3,
        "e": "Der Kinderzuschlag wird bei der Familienkasse beantragt und ergänzt das Kindergeld bei kleinen Einkommen."
      },
      {
        "q": "Warum erklärte das Bundesverfassungsgericht 2015 das Betreuungsgeld für nichtig?",
        "a": [
          "Fehlende Gesetzgebungskompetenz des Bundes",
          "Verstoß gegen die Gleichberechtigung",
          "Unzulässige Rückwirkung des Gesetzes",
          "Verletzung der Religionsfreiheit"
        ],
        "c": 0,
        "e": "Das Gericht entschied, dass für das Betreuungsgeld die Länder und nicht der Bund zuständig gewesen wären."
      },
      {
        "q": "Wie hoch war der unbereinigte Gender Pay Gap in Deutschland im Jahr 2024 laut Statistischem Bundesamt?",
        "a": [
          "Rund 6 Prozent",
          "Rund 16 Prozent",
          "Rund 26 Prozent",
          "Rund 36 Prozent"
        ],
        "c": 1,
        "e": "Frauen verdienten 2024 pro Stunde im Schnitt rund 16 Prozent weniger als Männer, bereinigt rund 6 Prozent."
      },
      {
        "q": "Welches Rechtsinstitut stand gleichgeschlechtlichen Paaren in Deutschland ab 2001 offen?",
        "a": [
          "Eingetragene Lebenspartnerschaft",
          "Zivile Solidaritätsehe",
          "Bürgerliche Partnerschaft",
          "Registrierte Hausgemeinschaft"
        ],
        "c": 0,
        "e": "Das Lebenspartnerschaftsgesetz trat 2001 in Kraft; seit 2017 werden keine neuen Lebenspartnerschaften mehr begründet."
      },
      {
        "q": "Was schreibt das FüPoG II seit 2021 für große börsennotierte Unternehmen mit mehr als drei Vorständen vor?",
        "a": [
          "Mindestens 30 Prozent Frauen im Vorstand",
          "Mindestens eine Frau im Vorstand",
          "Einen paritätisch besetzten Vorstand",
          "Eine Gleichstellungsbeauftragte im Vorstand"
        ],
        "c": 1,
        "e": "Solche Vorstände mit mehr als drei Mitgliedern müssen mit mindestens einer Frau und einem Mann besetzt sein."
      },
      {
        "q": "Welche Geschlechterquote gilt seit 2016 für Aufsichtsräte großer börsennotierter, mitbestimmter Unternehmen?",
        "a": [
          "20 Prozent",
          "40 Prozent",
          "50 Prozent",
          "30 Prozent"
        ],
        "c": 3,
        "e": "Das erste Führungspositionengesetz schreibt für diese Aufsichtsräte mindestens 30 Prozent Frauen und Männer vor."
      },
      {
        "q": "Ab welcher Schwangerschaftswoche gibt es seit Juni 2025 Mutterschutz nach einer Fehlgeburt?",
        "a": [
          "Ab der 8. Woche",
          "Ab der 13. Woche",
          "Ab der 20. Woche",
          "Ab der 24. Woche"
        ],
        "c": 1,
        "e": "Seit dem 1. Juni 2025 gilt ab der 13. Woche ein gestaffelter Mutterschutz von zwei bis acht Wochen."
      },
      {
        "q": "In welchem Jahr verabschiedeten die Vereinten Nationen die Kinderrechtskonvention?",
        "a": [
          "1959",
          "1979",
          "1989",
          "1999"
        ],
        "c": 2,
        "e": "Die UN-Generalversammlung verabschiedete die Konvention 1989, Deutschland ratifizierte sie 1992."
      },
      {
        "q": "Seit welchem Jahr ist das Recht von Kindern auf gewaltfreie Erziehung im BGB verankert?",
        "a": [
          "2000",
          "1980",
          "1990",
          "2010"
        ],
        "c": 0,
        "e": "Seit 2000 bestimmt § 1631 BGB, dass körperliche Bestrafungen und seelische Verletzungen unzulässig sind."
      },
      {
        "q": "Was ist die Istanbul-Konvention?",
        "a": [
          "UN-Abkommen über Kinderrechte",
          "EU-Richtlinie zur Lohngleichheit",
          "OECD-Leitlinie zur Familienpolitik",
          "Europaratsabkommen gegen Gewalt an Frauen"
        ],
        "c": 3,
        "e": "Das Übereinkommen des Europarats verpflichtet zur Bekämpfung von Gewalt gegen Frauen; in Deutschland gilt es seit 2018."
      },
      {
        "q": "Welches Mindestalter für die Eheschließung gilt in Deutschland seit 2017 ausnahmslos?",
        "a": [
          "16 Jahre",
          "17 Jahre",
          "18 Jahre",
          "21 Jahre"
        ],
        "c": 2,
        "e": "Das Gesetz zur Bekämpfung von Kinderehen hob 2017 die frühere Ausnahme ab 16 Jahren auf."
      },
      {
        "q": "Ab welchem zu versteuernden Jahreseinkommen entfällt das Elterngeld für Geburten ab April 2025?",
        "a": [
          "Über 150.000 Euro",
          "Über 175.000 Euro",
          "Über 250.000 Euro",
          "Über 300.000 Euro"
        ],
        "c": 1,
        "e": "Für Geburten ab dem 1. April 2025 gibt es kein Elterngeld, wenn das Einkommen 175.000 Euro übersteigt."
      }
    ],
    "land": [
      {
        "q": "Was bezeichnet die „zweite Säule“ der Gemeinsamen Agrarpolitik der EU?",
        "a": [
          "Direktzahlungen an die Betriebe",
          "Förderung der ländlichen Entwicklung",
          "Gemeinsame Marktordnungen",
          "Exporterstattungen für Agrargüter"
        ],
        "c": 1,
        "e": "Die zweite Säule fördert ländliche Entwicklung, Agrarumweltmaßnahmen und Investitionen und wird national kofinanziert."
      },
      {
        "q": "In welchem Jahr trat die Gemeinsame Agrarpolitik der damaligen EWG in Kraft?",
        "a": [
          "1957",
          "1973",
          "1992",
          "1962"
        ],
        "c": 3,
        "e": "Die GAP startete 1962 und ist eine der ältesten gemeinsamen Politiken der europäischen Integration."
      },
      {
        "q": "Wie viele landwirtschaftliche Betriebe gab es in Deutschland laut Agrarstrukturerhebung 2023 ungefähr?",
        "a": [
          "Rund 255.000",
          "Rund 55.000",
          "Rund 655.000",
          "Rund 1,1 Millionen"
        ],
        "c": 0,
        "e": "2023 zählte das Statistische Bundesamt rund 255.000 Betriebe, Tendenz seit Jahrzehnten sinkend."
      },
      {
        "q": "Welcher Anteil der Fläche Deutschlands wird ungefähr landwirtschaftlich genutzt?",
        "a": [
          "Rund ein Zehntel",
          "Rund ein Viertel",
          "Rund drei Viertel",
          "Rund die Hälfte"
        ],
        "c": 3,
        "e": "Mit rund 16,6 Millionen Hektar wird etwa die Hälfte der Landesfläche landwirtschaftlich genutzt."
      },
      {
        "q": "Welcher Anteil der Fläche Deutschlands ist ungefähr mit Wald bedeckt?",
        "a": [
          "Knapp ein Drittel",
          "Rund ein Zehntel",
          "Rund ein Fünftel",
          "Gut die Hälfte"
        ],
        "c": 0,
        "e": "Wald bedeckt rund 11,5 Millionen Hektar und damit knapp ein Drittel Deutschlands."
      },
      {
        "q": "Welche Form hat das staatliche deutsche Bio-Siegel?",
        "a": [
          "Kreis",
          "Dreieck",
          "Quadrat",
          "Sechseck"
        ],
        "c": 3,
        "e": "Das 2001 eingeführte staatliche Bio-Siegel ist ein grün umrandetes Sechseck mit dem Schriftzug „Bio“."
      },
      {
        "q": "Wie viele Haltungsformen unterscheidet das staatliche Tierhaltungskennzeichnungsgesetz von 2023?",
        "a": [
          "Drei",
          "Vier",
          "Fünf",
          "Sechs"
        ],
        "c": 2,
        "e": "Das Gesetz kennt fünf Stufen: Stall, Stall+Platz, Frischluftstall, Auslauf/Freiland und Bio."
      },
      {
        "q": "Wofür steht die Ziffer 0 am Anfang des Erzeugercodes auf Eiern?",
        "a": [
          "Freilandhaltung",
          "Ökologische Erzeugung",
          "Bodenhaltung",
          "Kleingruppenhaltung"
        ],
        "c": 1,
        "e": "Der Code beginnt mit 0 für Bio, 1 für Freiland, 2 für Boden und 3 für Kleingruppenhaltung."
      },
      {
        "q": "Was ist das Johann Heinrich von Thünen-Institut?",
        "a": [
          "Bundesforschungsinstitut für ländliche Räume",
          "Dachverband der Landfrauenvereine",
          "Privates Institut für Agrarmärkte",
          "Zulassungsstelle für Pflanzenschutzmittel"
        ],
        "c": 0,
        "e": "Das Thünen-Institut gehört zum Bundeslandwirtschaftsministerium und forscht zu Landwirtschaft, Wald und Fischerei."
      },
      {
        "q": "Wie heißt das Bundeslandwirtschaftsministerium seit 2025?",
        "a": [
          "Ministerium für Ernährung und Landwirtschaft",
          "Ministerium für Landwirtschaft, Ernährung und Heimat",
          "Ministerium für ländliche Räume und Verbraucher",
          "Ministerium für Landwirtschaft und Umwelt"
        ],
        "c": 1,
        "e": "Seit Mai 2025 heißt es Bundesministerium für Landwirtschaft, Ernährung und Heimat, geleitet von Alois Rainer (CSU)."
      },
      {
        "q": "Welche geplante Subventionskürzung löste die Bauernproteste im Winter 2023/24 vor allem aus?",
        "a": [
          "Abschaffung der Milchquote",
          "Kürzung der Flächenprämie",
          "Wegfall der Agrardiesel-Rückvergütung",
          "Ende der Düngemittelzuschüsse"
        ],
        "c": 2,
        "e": "Auslöser war der Sparplan der Ampel, die Steuerbegünstigung für Agrardiesel zu streichen."
      },
      {
        "q": "In welchem Jahr wurde die EU-Milchquote abgeschafft?",
        "a": [
          "2015",
          "2005",
          "2010",
          "2020"
        ],
        "c": 0,
        "e": "Die 1984 eingeführte Milchquote endete am 31. März 2015."
      },
      {
        "q": "Welcher Grenzwert für Nitrat im Grundwasser gilt nach EU-Recht?",
        "a": [
          "25 Milligramm pro Liter",
          "50 Milligramm pro Liter",
          "100 Milligramm pro Liter",
          "10 Milligramm pro Liter"
        ],
        "c": 1,
        "e": "Der Wert von 50 mg/l ist Maßstab der Nitratrichtlinie; Überschreitungen führten zu strengeren Düngeregeln."
      },
      {
        "q": "Um wie viele Jahre verlängerte die EU-Kommission 2023 die Zulassung von Glyphosat?",
        "a": [
          "Drei Jahre",
          "Fünf Jahre",
          "Fünfzehn Jahre",
          "Zehn Jahre"
        ],
        "c": 3,
        "e": "Nachdem die Mitgliedstaaten keine Mehrheit fanden, verlängerte die Kommission die Zulassung bis 2033."
      },
      {
        "q": "Welche Gemeinschaftsaufgabe von Bund und Ländern nach Art. 91a GG betrifft die Landwirtschaft?",
        "a": [
          "Förderung der Land- und Forstwirtschaft",
          "Sicherung von Ernährung und Landwirtschaft",
          "Verbesserung der Agrarstruktur und des Küstenschutzes",
          "Entwicklung des ländlichen Raums und der Dörfer"
        ],
        "c": 2,
        "e": "Die GAK ist das wichtigste nationale Förderinstrument für Landwirtschaft und ländliche Räume."
      },
      {
        "q": "Welcher Träger ist für die gesetzliche Sozialversicherung der Landwirte zuständig?",
        "a": [
          "Deutsche Rentenversicherung Bund",
          "Bundesagentur für Arbeit",
          "Deutscher Raiffeisenverband",
          "Die SVLFG in Kassel"
        ],
        "c": 3,
        "e": "Die Sozialversicherung für Landwirtschaft, Forsten und Gartenbau bündelt u. a. Alterskasse, Kranken- und Unfallversicherung."
      },
      {
        "q": "Wer gilt als Begründer der ländlichen Genossenschaftsbewegung in Deutschland?",
        "a": [
          "Albrecht Thaer",
          "Friedrich Wilhelm Raiffeisen",
          "Justus von Liebig",
          "Ernst Abbe"
        ],
        "c": 1,
        "e": "Raiffeisen gründete im 19. Jahrhundert Hilfs- und Darlehnsvereine für Bauern, aus denen die Raiffeisenbanken hervorgingen."
      },
      {
        "q": "In welcher Stadt findet jedes Jahr im Januar die Internationale Grüne Woche statt?",
        "a": [
          "Hannover",
          "München",
          "Berlin",
          "Köln"
        ],
        "c": 2,
        "e": "Die Grüne Woche ist seit 1926 eine große Publikumsmesse für Ernährung, Landwirtschaft und Gartenbau in Berlin."
      },
      {
        "q": "Bei welchem Lebensmittel liegt Deutschlands Selbstversorgungsgrad deutlich unter 50 Prozent?",
        "a": [
          "Kartoffeln",
          "Obst",
          "Schweinefleisch",
          "Milch"
        ],
        "c": 1,
        "e": "Beim Obst erzeugt Deutschland nur etwa ein Fünftel des Verbrauchs, bei Kartoffeln und Schweinefleisch mehr als den Bedarf."
      },
      {
        "q": "Welche Kultur wird in Deutschland auf der größten Ackerfläche angebaut?",
        "a": [
          "Winterraps",
          "Silomais",
          "Weizen",
          "Kartoffeln"
        ],
        "c": 2,
        "e": "Weizen ist die flächenstärkste Ackerkultur in Deutschland, gefolgt von Mais und Gerste."
      },
      {
        "q": "Welches Bundesland hat die meisten landwirtschaftlichen Betriebe?",
        "a": [
          "Bayern",
          "Niedersachsen",
          "Baden-Württemberg",
          "Nordrhein-Westfalen"
        ],
        "c": 0,
        "e": "Bayern hat mit Abstand die meisten, überwiegend kleinen und mittelgroßen Betriebe in Deutschland."
      },
      {
        "q": "Wofür stand in der DDR die Abkürzung LPG?",
        "a": [
          "Ländliche Produktionsgemeinschaft",
          "Landwirtschaftlicher Planungsgrundsatz",
          "Land- und Pachtgesellschaft",
          "Landwirtschaftliche Produktionsgenossenschaft"
        ],
        "c": 3,
        "e": "Die Kollektivierung in LPGs prägt bis heute die größeren Betriebsstrukturen in Ostdeutschland."
      },
      {
        "q": "Was versteht man unter Flurbereinigung?",
        "a": [
          "Neuordnung zersplitterter ländlicher Grundstücke",
          "Entfernung von Hecken für größere Felder",
          "Sanierung belasteter Ackerböden",
          "Stilllegung von Flächen gegen Prämie"
        ],
        "c": 0,
        "e": "Bei der Flurbereinigung werden Flurstücke zusammengelegt und Wege neu geordnet, geregelt im Flurbereinigungsgesetz."
      },
      {
        "q": "Was regelt die Höfeordnung, die in mehreren nordwestdeutschen Ländern gilt?",
        "a": [
          "Mindestgrößen für neue Betriebe",
          "Ungeteilte Vererbung eines Hofes an einen Erben",
          "Höchstpachtpreise für Ackerland",
          "Abstände von Ställen zu Wohnhäusern"
        ],
        "c": 1,
        "e": "Das Anerbenrecht der Höfeordnung soll verhindern, dass Höfe durch Erbteilung zersplittert werden."
      },
      {
        "q": "Was fördert das EU-Programm LEADER?",
        "a": [
          "Den Export regionaler Spezialitäten",
          "Die Ausbildung junger Landwirte",
          "Lokale Entwicklungsprojekte im ländlichen Raum",
          "Den Breitbandausbau in Großstädten"
        ],
        "c": 2,
        "e": "Bei LEADER entscheiden lokale Aktionsgruppen aus Bürgern, Vereinen und Kommunen über Projekte in ihrer Region."
      },
      {
        "q": "Wie änderte die EU im Jahr 2025 den Schutzstatus des Wolfs?",
        "a": [
          "Von „streng geschützt“ auf „geschützt“ gesenkt",
          "Von „geschützt“ auf „streng geschützt“ erhöht",
          "Schutzstatus vollständig aufgehoben",
          "Feste EU-weite Abschussquoten eingeführt"
        ],
        "c": 0,
        "e": "Nach der Berner Konvention wurde 2025 auch die FFH-Richtlinie geändert, was die Regulierung von Wölfen erleichtert."
      },
      {
        "q": "In welchem Bundesland wurde die Afrikanische Schweinepest 2020 erstmals in Deutschland nachgewiesen?",
        "a": [
          "Bayern",
          "Niedersachsen",
          "Brandenburg",
          "Schleswig-Holstein"
        ],
        "c": 2,
        "e": "Im September 2020 wurde die ASP bei einem Wildschwein in Brandenburg nahe der polnischen Grenze festgestellt."
      },
      {
        "q": "In welchem Jahr trat die Maul- und Klauenseuche erstmals seit 1988 wieder in Deutschland auf?",
        "a": [
          "2019",
          "2021",
          "2023",
          "2025"
        ],
        "c": 3,
        "e": "Im Januar 2025 wurde die Seuche bei Wasserbüffeln in Brandenburg nachgewiesen, was zeitweise Exportsperren auslöste."
      },
      {
        "q": "Seit wann ist das routinemäßige Töten männlicher Eintagsküken in Deutschland verboten?",
        "a": [
          "2015",
          "2019",
          "2022",
          "2025"
        ],
        "c": 2,
        "e": "Seit 1. Januar 2022 ist das Kükentöten verboten; Alternativen sind Geschlechtsbestimmung im Ei oder Bruderhahn-Aufzucht."
      },
      {
        "q": "Wie heißt das System von Auflagen, an das EU-Direktzahlungen seit 2023 geknüpft sind?",
        "a": [
          "Modulation",
          "Konditionalität",
          "Degression",
          "Kofinanzierung"
        ],
        "c": 1,
        "e": "Die Konditionalität (früher Cross Compliance und Greening) verknüpft Zahlungen mit Umwelt-, Klima- und Tierschutzstandards."
      }
    ],
    "demokratie": [
      {
        "q": "Wie viele gewonnene Wahlkreise lassen eine Partei trotz unter 5 Prozent der Zweitstimmen in den Bundestag einziehen?",
        "a": [
          "Einer",
          "Zwei",
          "Drei",
          "Fünf"
        ],
        "c": 2,
        "e": "Nach der Grundmandatsklausel genügen drei Wahlkreissiege; das Bundesverfassungsgericht ließ sie 2024 bestehen."
      },
      {
        "q": "Wie viele Sitze hat der Bundestag nach der Wahlrechtsreform von 2023 regulär?",
        "a": [
          "598",
          "630",
          "709",
          "736"
        ],
        "c": 1,
        "e": "Seit der Reform ist die Größe auf 630 Abgeordnete festgelegt, Überhang- und Ausgleichsmandate entfallen."
      },
      {
        "q": "Was passiert seit der Wahlrechtsreform 2023, wenn eine Partei mehr Wahlkreise gewinnt, als ihr Sitze zustehen?",
        "a": [
          "Sie erhält zusätzliche Überhangmandate",
          "Andere Parteien erhalten Ausgleichsmandate",
          "Die betroffenen Wahlkreise wählen neu",
          "Die schwächsten Wahlkreissieger gehen leer aus"
        ],
        "c": 3,
        "e": "Nach dem Prinzip der Zweitstimmendeckung erhalten die Wahlkreissieger mit den schwächsten Ergebnissen kein Mandat."
      },
      {
        "q": "In wie viele Wahlkreise ist Deutschland bei der Bundestagswahl eingeteilt?",
        "a": [
          "250",
          "299",
          "315",
          "328"
        ],
        "c": 1,
        "e": "Es gibt 299 Wahlkreise; die übrigen Sitze werden über die Landeslisten der Parteien vergeben."
      },
      {
        "q": "Wie setzt sich die Bundesversammlung zusammen, die den Bundespräsidenten wählt?",
        "a": [
          "Bundestagsmitglieder und gleich viele Ländervertreter",
          "Mitglieder von Bundestag und Bundesrat",
          "Alle Landtagsabgeordneten Deutschlands",
          "Bundesregierung und Ministerpräsidenten"
        ],
        "c": 0,
        "e": "Ihr gehören alle Bundestagsabgeordneten und ebenso viele von den Landtagen gewählte Mitglieder an."
      },
      {
        "q": "Was macht das Misstrauensvotum nach Art. 67 GG „konstruktiv“?",
        "a": [
          "Abwahl nur durch Wahl eines Nachfolgers",
          "Abwahl nur mit Zweidrittelmehrheit",
          "Abwahl nur nach Bestätigung des Bundesrats",
          "Abwahl führt automatisch zu Neuwahlen"
        ],
        "c": 0,
        "e": "Der Bundestag kann den Kanzler nur abwählen, indem er zugleich mit Mehrheit einen Nachfolger wählt."
      },
      {
        "q": "Welcher Bundeskanzler wurde 1982 durch ein konstruktives Misstrauensvotum abgelöst?",
        "a": [
          "Willy Brandt",
          "Kurt Georg Kiesinger",
          "Ludwig Erhard",
          "Helmut Schmidt"
        ],
        "c": 3,
        "e": "Am 1. Oktober 1982 wählte der Bundestag Helmut Kohl zum Kanzler und löste damit Helmut Schmidt ab."
      },
      {
        "q": "Welcher Grundgesetzartikel enthält die sogenannte Ewigkeitsklausel?",
        "a": [
          "Artikel 20",
          "Artikel 79",
          "Artikel 116",
          "Artikel 146"
        ],
        "c": 1,
        "e": "Art. 79 Abs. 3 GG verbietet Änderungen, die die Grundsätze der Art. 1 und 20 oder die Gliederung in Länder berühren."
      },
      {
        "q": "Welche Mehrheit ist für eine Änderung des Grundgesetzes nötig?",
        "a": [
          "Zwei Drittel im Bundestag allein",
          "Drei Viertel im Bundestag",
          "Zwei Drittel in Bundestag und Bundesrat",
          "Absolute Mehrheit plus Volksentscheid"
        ],
        "c": 2,
        "e": "Nötig sind zwei Drittel der Mitglieder des Bundestages und zwei Drittel der Stimmen des Bundesrates."
      },
      {
        "q": "Wer war Präsident des Parlamentarischen Rates, der 1948/49 das Grundgesetz ausarbeitete?",
        "a": [
          "Konrad Adenauer",
          "Carlo Schmid",
          "Theodor Heuss",
          "Kurt Schumacher"
        ],
        "c": 0,
        "e": "Adenauer leitete den Parlamentarischen Rat in Bonn, Carlo Schmid führte den Hauptausschuss."
      },
      {
        "q": "Wie viele Richterinnen und Richter hat das Bundesverfassungsgericht insgesamt?",
        "a": [
          "Neun",
          "Zwölf",
          "Sechzehn",
          "Zwanzig"
        ],
        "c": 2,
        "e": "Das Gericht besteht aus zwei Senaten mit je acht Mitgliedern."
      },
      {
        "q": "Für welche Amtszeit werden Richter am Bundesverfassungsgericht gewählt?",
        "a": [
          "8 Jahre",
          "10 Jahre",
          "15 Jahre",
          "12 Jahre"
        ],
        "c": 3,
        "e": "Die Amtszeit beträgt zwölf Jahre ohne Wiederwahl, längstens bis zum Alter von 68 Jahren."
      },
      {
        "q": "Wer wählt die Richter des Bundesverfassungsgerichts?",
        "a": [
          "Der Bundespräsident allein",
          "Die Bundesregierung auf Vorschlag der Länder",
          "Die Bundesrichter in geheimer Wahl",
          "Je zur Hälfte Bundestag und Bundesrat"
        ],
        "c": 3,
        "e": "Bundestag und Bundesrat wählen je die Hälfte der Richter, jeweils mit Zweidrittelmehrheit."
      },
      {
        "q": "Welche Folge verhängte das Bundesverfassungsgericht 2024 gegen die Partei „Die Heimat“ (früher NPD)?",
        "a": [
          "Ausschluss von der staatlichen Parteienfinanzierung",
          "Ein vollständiges Parteiverbot",
          "Verbot der Teilnahme an Bundestagswahlen",
          "Auflösung ihrer Jugendorganisation"
        ],
        "c": 0,
        "e": "Das Gericht schloss die Partei im Januar 2024 für sechs Jahre von der staatlichen Finanzierung aus."
      },
      {
        "q": "Wie viele Stimmen haben die Länder im Bundesrat insgesamt?",
        "a": [
          "59",
          "69",
          "79",
          "99"
        ],
        "c": 1,
        "e": "Je nach Einwohnerzahl hat jedes Land drei bis sechs Stimmen, zusammen sind es 69."
      },
      {
        "q": "Wie viele Mitglieder hat der Vermittlungsausschuss von Bundestag und Bundesrat?",
        "a": [
          "16",
          "24",
          "32",
          "48"
        ],
        "c": 2,
        "e": "Er besteht aus je 16 Mitgliedern des Bundestages und des Bundesrates."
      },
      {
        "q": "Ab welchem Alter durfte man in Deutschland bei der Europawahl 2024 wählen?",
        "a": [
          "14 Jahre",
          "16 Jahre",
          "17 Jahre",
          "18 Jahre"
        ],
        "c": 1,
        "e": "Für die Europawahl 2024 wurde das Wahlalter erstmals auf 16 gesenkt; bei Bundestagswahlen gilt weiter 18."
      },
      {
        "q": "Welcher Begriff gehört nicht zu den Wahlrechtsgrundsätzen in Art. 38 GG?",
        "a": [
          "unmittelbar",
          "geheim",
          "allgemein",
          "verpflichtend"
        ],
        "c": 3,
        "e": "Art. 38 GG nennt allgemeine, unmittelbare, freie, gleiche und geheime Wahlen; eine Wahlpflicht gibt es nicht."
      },
      {
        "q": "An welchem Tag fand die vorgezogene Bundestagswahl 2025 statt?",
        "a": [
          "26. Januar 2025",
          "23. Februar 2025",
          "23. März 2025",
          "28. September 2025"
        ],
        "c": 1,
        "e": "Nach dem Bruch der Ampel-Koalition wurde der Bundestag aufgelöst und am 23. Februar 2025 neu gewählt."
      },
      {
        "q": "Wie hoch war die Wahlbeteiligung bei der Bundestagswahl 2025 ungefähr?",
        "a": [
          "Rund 66 Prozent",
          "Rund 74 Prozent",
          "Rund 82 Prozent",
          "Rund 90 Prozent"
        ],
        "c": 2,
        "e": "Mit 82,5 Prozent war die Beteiligung so hoch wie bei keiner Bundestagswahl seit der Wiedervereinigung."
      },
      {
        "q": "Auf welchem Weg wurde die vorgezogene Bundestagswahl 2025 möglich?",
        "a": [
          "Konstruktives Misstrauensvotum",
          "Selbstauflösung des Bundestages",
          "Gescheiterte Vertrauensfrage des Kanzlers",
          "Rücktritt des Bundespräsidenten"
        ],
        "c": 2,
        "e": "Olaf Scholz verlor im Dezember 2024 die Vertrauensfrage, daraufhin löste der Bundespräsident den Bundestag auf."
      },
      {
        "q": "Was war bei der Wahl von Friedrich Merz zum Bundeskanzler im Mai 2025 ein Novum?",
        "a": [
          "Er wurde erst im zweiten Wahlgang gewählt",
          "Er war der erste Kanzler ohne Mandat",
          "Die Wahl fand erstmals offen statt",
          "Er wurde mit relativer Mehrheit gewählt"
        ],
        "c": 0,
        "e": "Merz verfehlte am 6. Mai 2025 im ersten Wahlgang die Kanzlermehrheit und wurde am selben Tag im zweiten gewählt."
      },
      {
        "q": "Welches Recht gewährt Art. 20 Abs. 4 GG allen Deutschen, wenn andere Abhilfe nicht möglich ist?",
        "a": [
          "Recht zum Widerstand",
          "Recht auf Asyl",
          "Recht auf Generalstreik",
          "Recht auf Volksentscheid"
        ],
        "c": 0,
        "e": "Gegen jeden, der die verfassungsmäßige Ordnung beseitigen will, gilt das Widerstandsrecht als letztes Mittel."
      },
      {
        "q": "Wofür sieht das Grundgesetz auf Bundesebene ausdrücklich einen Volksentscheid vor?",
        "a": [
          "Für Änderungen des Grundgesetzes",
          "Für den Beitritt zu Bündnissen",
          "Für die Wahl des Bundespräsidenten",
          "Für die Neugliederung des Bundesgebiets"
        ],
        "c": 3,
        "e": "Volksentscheide auf Bundesebene sind nur bei der Neugliederung der Länder nach Art. 29 GG vorgesehen."
      },
      {
        "q": "Wer eröffnet seit 2017 als Alterspräsident die konstituierende Sitzung des Bundestages?",
        "a": [
          "Das lebensälteste Mitglied",
          "Der bisherige Bundestagspräsident",
          "Das dienstälteste Mitglied",
          "Der Bundespräsident"
        ],
        "c": 2,
        "e": "Seit einer Änderung der Geschäftsordnung 2017 ist das am längsten dem Bundestag angehörende Mitglied Alterspräsident."
      },
      {
        "q": "Wer ist seit März 2025 Präsidentin des Deutschen Bundestages?",
        "a": [
          "Bärbel Bas",
          "Julia Klöckner",
          "Aydan Özoğuz",
          "Yvonne Magwas"
        ],
        "c": 1,
        "e": "Die CDU-Politikerin Julia Klöckner wurde in der konstituierenden Sitzung am 25. März 2025 gewählt."
      },
      {
        "q": "Was bedeutet die Immunität von Bundestagsabgeordneten?",
        "a": [
          "Strafverfolgung nur mit Genehmigung des Bundestages",
          "Befreiung von der Einkommensteuer",
          "Schutz vor Abberufung durch die Partei",
          "Befreiung von jedem Wehrdienst"
        ],
        "c": 0,
        "e": "Nach Art. 46 GG dürfen Abgeordnete grundsätzlich nur mit Genehmigung des Bundestages strafrechtlich verfolgt werden."
      },
      {
        "q": "Wer bestimmt laut Grundgesetz die Richtlinien der Politik?",
        "a": [
          "Der Bundespräsident",
          "Der Bundestag",
          "Der Koalitionsausschuss",
          "Der Bundeskanzler"
        ],
        "c": 3,
        "e": "Nach Art. 65 GG bestimmt der Kanzler die Richtlinien, die Minister leiten ihr Ressort innerhalb dieser selbstständig."
      },
      {
        "q": "Welche Partei scheiterte bei der Bundestagswahl 2025 mit 4,98 Prozent denkbar knapp an der Sperrklausel?",
        "a": [
          "FDP",
          "BSW",
          "Freie Wähler",
          "Die Linke"
        ],
        "c": 1,
        "e": "Dem Bündnis Sahra Wagenknecht fehlten nur rund 9.500 Stimmen; die FDP kam auf 4,3 Prozent."
      },
      {
        "q": "Welche Partei ist als Partei einer nationalen Minderheit von der Fünf-Prozent-Hürde befreit?",
        "a": [
          "SSW",
          "Bayernpartei",
          "Freie Wähler",
          "ÖDP"
        ],
        "c": 0,
        "e": "Der Südschleswigsche Wählerverband vertritt die dänische Minderheit und die Friesen und zog 2025 mit einem Sitz ein."
      }
    ],
    "finanzen": [
      {
        "q": "Wie hoch darf die strukturelle Neuverschuldung des Bundes laut Schuldenbremse höchstens sein?",
        "a": [
          "0,35 Prozent des BIP",
          "0,5 Prozent des BIP",
          "1,0 Prozent des BIP",
          "3,0 Prozent des BIP"
        ],
        "c": 0,
        "e": "Art. 115 GG erlaubt dem Bund ein strukturelles Defizit von höchstens 0,35 Prozent des Bruttoinlandsprodukts."
      },
      {
        "q": "Wie groß ist das im März 2025 per Grundgesetzänderung beschlossene Sondervermögen für Infrastruktur?",
        "a": [
          "100 Milliarden Euro",
          "200 Milliarden Euro",
          "500 Milliarden Euro",
          "1 Billion Euro"
        ],
        "c": 2,
        "e": "Das Sondervermögen umfasst 500 Milliarden Euro über zwölf Jahre, davon 100 Milliarden für die Länder."
      },
      {
        "q": "Welche Ausgaben sind seit der Grundgesetzänderung 2025 oberhalb von 1 Prozent des BIP von der Schuldenbremse ausgenommen?",
        "a": [
          "Bildungsausgaben",
          "Verteidigungsausgaben",
          "Klimaschutzausgaben",
          "Rentenzuschüsse"
        ],
        "c": 1,
        "e": "Ausgaben für Verteidigung und bestimmte Sicherheitsbereiche über 1 Prozent des BIP dürfen kreditfinanziert werden."
      },
      {
        "q": "Welche Obergrenze für die Staatsschuldenquote sehen die Maastricht-Kriterien vor?",
        "a": [
          "40 Prozent des BIP",
          "80 Prozent des BIP",
          "100 Prozent des BIP",
          "60 Prozent des BIP"
        ],
        "c": 3,
        "e": "Die Maastricht-Kriterien begrenzen die Schuldenquote auf 60 Prozent und das jährliche Defizit auf 3 Prozent des BIP."
      },
      {
        "q": "Welche Steuer brachte im Jahr 2024 in Deutschland das meiste Aufkommen?",
        "a": [
          "Lohnsteuer",
          "Umsatzsteuer",
          "Energiesteuer",
          "Gewerbesteuer"
        ],
        "c": 1,
        "e": "Die Steuern vom Umsatz brachten rund 300 Milliarden Euro und lagen damit vor der Lohnsteuer."
      },
      {
        "q": "Wie hoch ist der ermäßigte Umsatzsteuersatz in Deutschland?",
        "a": [
          "7 Prozent",
          "5 Prozent",
          "9 Prozent",
          "10 Prozent"
        ],
        "c": 0,
        "e": "Der ermäßigte Satz von 7 Prozent gilt etwa für viele Lebensmittel und Bücher; regulär sind es 19 Prozent."
      },
      {
        "q": "Welche dieser Steuern ist eine Gemeinschaftsteuer von Bund und Ländern?",
        "a": [
          "Erbschaftsteuer",
          "Energiesteuer",
          "Grundsteuer",
          "Körperschaftsteuer"
        ],
        "c": 3,
        "e": "Einkommen-, Körperschaft- und Umsatzsteuer stehen Bund und Ländern gemeinsam zu (Art. 106 Abs. 3 GG)."
      },
      {
        "q": "Wem steht das Aufkommen der Erbschaftsteuer zu?",
        "a": [
          "Dem Bund",
          "Den Ländern",
          "Den Gemeinden",
          "Bund und Ländern je zur Hälfte"
        ],
        "c": 1,
        "e": "Die Erbschaft- und Schenkungsteuer ist eine reine Ländersteuer, das Gesetz dazu erlässt aber der Bund."
      },
      {
        "q": "Wer legt den Hebesatz der Gewerbesteuer fest?",
        "a": [
          "Die jeweilige Gemeinde",
          "Das jeweilige Bundesland",
          "Das Bundesfinanzministerium",
          "Das örtliche Finanzamt"
        ],
        "c": 0,
        "e": "Jede Gemeinde bestimmt ihren Hebesatz selbst, der gesetzliche Mindesthebesatz liegt bei 200 Prozent."
      },
      {
        "q": "Warum musste die Grundsteuer reformiert werden, die seit 2025 nach neuen Regeln erhoben wird?",
        "a": [
          "Das BVerfG beanstandete veraltete Einheitswerte",
          "Die EU verbot die alte Berechnung",
          "Die Gemeinden verzichteten auf sie",
          "Der Bundesrechnungshof verlangte es"
        ],
        "c": 0,
        "e": "2018 erklärte das BVerfG die auf Werten von 1964 bzw. 1935 beruhende Bewertung für verfassungswidrig."
      },
      {
        "q": "Wie hoch ist der Spitzensteuersatz der Einkommensteuer ohne „Reichensteuer“?",
        "a": [
          "38 Prozent",
          "45 Prozent",
          "42 Prozent",
          "53 Prozent"
        ],
        "c": 2,
        "e": "Der Spitzensteuersatz beträgt 42 Prozent; für sehr hohe Einkommen gilt die „Reichensteuer“ von 45 Prozent."
      },
      {
        "q": "Wie hoch war der Grundfreibetrag der Einkommensteuer für Ledige im Jahr 2025 ungefähr?",
        "a": [
          "Rund 8.000 Euro",
          "Rund 10.000 Euro",
          "Rund 12.100 Euro",
          "Rund 15.000 Euro"
        ],
        "c": 2,
        "e": "2025 lag der Grundfreibetrag bei 12.096 Euro; bis zu diesem Einkommen fällt keine Einkommensteuer an."
      },
      {
        "q": "Wie entschied das Bundesverfassungsgericht im März 2025 über den Solidaritätszuschlag?",
        "a": [
          "Er ist weiterhin verfassungsgemäß",
          "Er muss sofort abgeschafft werden",
          "Er muss rückwirkend erstattet werden",
          "Er darf nur noch Firmen treffen"
        ],
        "c": 0,
        "e": "Das Gericht wies die Verfassungsbeschwerde ab, mahnte aber, den Finanzbedarf weiter zu überprüfen."
      },
      {
        "q": "Was bewirkt das Ehegattensplitting bei der Einkommensteuer?",
        "a": [
          "Jeder Partner zahlt nur den halben Steuersatz",
          "Der Besserverdienende trägt die gesamte Steuer",
          "Die Steuer auf das halbierte Gesamteinkommen wird verdoppelt",
          "Ehepaare erhalten pauschal 50 Prozent Abzug"
        ],
        "c": 2,
        "e": "Wegen des progressiven Tarifs ist der Vorteil umso größer, je unterschiedlicher die Einkommen der Partner sind."
      },
      {
        "q": "Was bezeichnet man als „kalte Progression“?",
        "a": [
          "Steuerliche Mehrbelastung durch Inflationsausgleich beim Lohn",
          "Höhere Steuern auf Heizenergie im Winter",
          "Sinkende Steuereinnahmen in einer Rezession",
          "Steuerbefreiung für besonders niedrige Renten"
        ],
        "c": 0,
        "e": "Steigen Löhne nur mit der Inflation, rutschen Steuerzahler in höhere Tarifzonen, obwohl ihre Kaufkraft nicht wächst."
      },
      {
        "q": "Wie hoch ist der Steuersatz der Abgeltungsteuer auf Kapitalerträge?",
        "a": [
          "15 Prozent",
          "20 Prozent",
          "30 Prozent",
          "25 Prozent"
        ],
        "c": 3,
        "e": "Seit 2009 werden Kapitalerträge pauschal mit 25 Prozent plus Soli und gegebenenfalls Kirchensteuer besteuert."
      },
      {
        "q": "Wie hoch ist der Körperschaftsteuersatz in Deutschland im Jahr 2026?",
        "a": [
          "10 Prozent",
          "15 Prozent",
          "20 Prozent",
          "25 Prozent"
        ],
        "c": 1,
        "e": "Der Satz liegt seit 2008 bei 15 Prozent; eine schrittweise Senkung auf 10 Prozent ab 2028 ist beschlossen."
      },
      {
        "q": "Wer beschließt in Deutschland den Bundeshaushalt?",
        "a": [
          "Die Bundesregierung",
          "Der Bundesfinanzminister",
          "Der Bundesrechnungshof",
          "Der Bundestag"
        ],
        "c": 3,
        "e": "Der Haushaltsplan wird per Haushaltsgesetz vom Bundestag festgestellt; das Budgetrecht ist ein Kernrecht des Parlaments."
      },
      {
        "q": "Welche unabhängige Institution prüft die Haushalts- und Wirtschaftsführung des Bundes?",
        "a": [
          "Die Deutsche Bundesbank",
          "Der Stabilitätsrat",
          "Das Bundeszentralamt für Steuern",
          "Der Bundesrechnungshof"
        ],
        "c": 3,
        "e": "Der Bundesrechnungshof mit Sitz in Bonn ist eine oberste Bundesbehörde, seine Mitglieder sind richterlich unabhängig."
      },
      {
        "q": "Welches Ressort hat den größten Einzelplan im Bundeshaushalt?",
        "a": [
          "Verteidigung",
          "Arbeit und Soziales",
          "Verkehr",
          "Bildung und Forschung"
        ],
        "c": 1,
        "e": "Vor allem wegen der Zuschüsse zur Rentenversicherung macht der Sozialetat mehr als ein Drittel des Haushalts aus."
      },
      {
        "q": "Wie hoch waren die geplanten Ausgaben im Bundeshaushalt 2025 ungefähr?",
        "a": [
          "Rund 200 Milliarden Euro",
          "Rund 350 Milliarden Euro",
          "Rund 500 Milliarden Euro",
          "Rund 900 Milliarden Euro"
        ],
        "c": 2,
        "e": "Der Bundeshaushalt 2025 sah Ausgaben von rund 502 Milliarden Euro vor, Sondervermögen nicht eingerechnet."
      },
      {
        "q": "Was ersetzte im Jahr 2020 den bisherigen Länderfinanzausgleich?",
        "a": [
          "Ein Finanzkraftausgleich über die Umsatzsteuer",
          "Direkte Zahlungen der Geberländer",
          "Ein eigener EU-Kohäsionsfonds",
          "Der Solidarpakt III"
        ],
        "c": 0,
        "e": "Seit 2020 erfolgt der Ausgleich über Zu- und Abschläge bei der Umsatzsteuerverteilung statt über Zahlungen zwischen Ländern."
      },
      {
        "q": "Welches Land zahlte im Finanzkraftausgleich 2024 mit Abstand am meisten ein?",
        "a": [
          "Baden-Württemberg",
          "Hessen",
          "Bayern",
          "Hamburg"
        ],
        "c": 2,
        "e": "Bayern trug 2024 rund 9,8 Milliarden Euro und damit etwa die Hälfte des Ausgleichsvolumens."
      },
      {
        "q": "Wer ist seit Mai 2025 Bundesminister der Finanzen?",
        "a": [
          "Christian Lindner",
          "Jörg Kukies",
          "Lars Klingbeil",
          "Thorsten Frei"
        ],
        "c": 2,
        "e": "Der SPD-Vorsitzende Lars Klingbeil ist im Kabinett Merz Finanzminister und Vizekanzler."
      },
      {
        "q": "Wie hoch war die Staatsschuldenquote Deutschlands Ende 2024 ungefähr?",
        "a": [
          "Rund 43 Prozent",
          "Rund 63 Prozent",
          "Rund 83 Prozent",
          "Rund 103 Prozent"
        ],
        "c": 1,
        "e": "Ende 2024 lag der Schuldenstand bei gut 62 Prozent des BIP und damit knapp über dem Maastricht-Wert."
      },
      {
        "q": "Welche Einrichtung nimmt für den Bund Kredite am Kapitalmarkt auf?",
        "a": [
          "Die Deutsche Bundesbank",
          "Die KfW",
          "Die Europäische Zentralbank",
          "Die Deutsche Finanzagentur"
        ],
        "c": 3,
        "e": "Die Finanzagentur in Frankfurt managt im Auftrag des Finanzministeriums die Schulden des Bundes, etwa über Bundesanleihen."
      },
      {
        "q": "Wofür wurde die Schaumweinsteuer 1902 ursprünglich eingeführt?",
        "a": [
          "Bau der Reichseisenbahn",
          "Finanzierung der Kolonien",
          "Start der Rentenversicherung",
          "Aufbau der kaiserlichen Kriegsflotte"
        ],
        "c": 3,
        "e": "Die Sektsteuer sollte die Flotte unter Wilhelm II. mitfinanzieren und wird bis heute erhoben."
      },
      {
        "q": "Wie hoch ist die Kirchensteuer in Bayern und Baden-Württemberg, bezogen auf die Einkommensteuer?",
        "a": [
          "6 Prozent",
          "8 Prozent",
          "9 Prozent",
          "10 Prozent"
        ],
        "c": 1,
        "e": "In Bayern und Baden-Württemberg beträgt sie 8 Prozent der Einkommensteuer, in den übrigen Ländern 9 Prozent."
      },
      {
        "q": "Seit welchem Jahr wird die Vermögensteuer in Deutschland nicht mehr erhoben?",
        "a": [
          "1989",
          "1997",
          "2005",
          "2013"
        ],
        "c": 1,
        "e": "Nach einem BVerfG-Urteil von 1995 lief die Erhebung Ende 1996 aus; das Gesetz gilt formal weiter."
      },
      {
        "q": "Wie hoch ist die globale Mindeststeuer für große Konzerne, die Deutschland seit 2024 anwendet?",
        "a": [
          "10 Prozent",
          "12,5 Prozent",
          "15 Prozent",
          "21 Prozent"
        ],
        "c": 2,
        "e": "Das Mindeststeuergesetz setzt die OECD-Einigung um: Konzerne ab 750 Mio. Euro Umsatz zahlen effektiv mindestens 15 Prozent."
      }
    ]
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = QUESTIONS;
  } else {
    root.BTW_QUESTIONS = QUESTIONS;
  }
})(this);
