/*
 * Bürgerfragen zum Thema einer Vor-Ort-Aktion: 20 je Thema (Stand Oktober 2026), andere als in der Fachkonferenz.
 * q = Frage, a = vier Antworten, c = Index der richtigen Antwort, e = kurze Erklärung.
 */
(function (root) {
  var CITIZEN_QUESTIONS = {
    "wirtschaft": [
      {
        "q": "Eine Bäckereiverkäuferin fragt: ‚Welcher Mehrwertsteuersatz gilt für Brot und die meisten anderen Lebensmittel?‘",
        "a": [
          "5 Prozent",
          "16 Prozent",
          "7 Prozent",
          "10 Prozent"
        ],
        "c": 2,
        "e": "Für die meisten Lebensmittel gilt der ermäßigte Mehrwertsteuersatz von 7 Prozent."
      },
      {
        "q": "Ein Lagerarbeiter will wissen: ‚Wie viele Urlaubstage stehen mir bei einer Fünftagewoche gesetzlich mindestens zu?‘",
        "a": [
          "20 Arbeitstage",
          "24 Arbeitstage",
          "25 Arbeitstage",
          "30 Arbeitstage"
        ],
        "c": 0,
        "e": "Das Bundesurlaubsgesetz garantiert 24 Werktage bei einer Sechstagewoche, was bei fünf Arbeitstagen pro Woche 20 Urlaubstagen entspricht."
      },
      {
        "q": "Eine Berufseinsteigerin fragt: ‚Mit welcher Frist kann während der Probezeit gekündigt werden?‘",
        "a": [
          "Ganz ohne Frist",
          "Eine Woche",
          "Vier Wochen",
          "Zwei Wochen"
        ],
        "c": 3,
        "e": "Während einer vereinbarten Probezeit von höchstens sechs Monaten beträgt die Kündigungsfrist nach § 622 BGB zwei Wochen."
      },
      {
        "q": "Ein Maschinenbauer fragt: ‚Nach wie langer Betriebszugehörigkeit greift der allgemeine Kündigungsschutz?‘",
        "a": [
          "Nach drei Monaten",
          "Nach sechs Monaten",
          "Nach einem Jahr",
          "Nach zwei Jahren"
        ],
        "c": 1,
        "e": "Das Kündigungsschutzgesetz gilt, wenn das Arbeitsverhältnis länger als sechs Monate besteht und der Betrieb mehr als zehn Beschäftigte hat."
      },
      {
        "q": "Eine Mitarbeiterin eines kleinen Handwerksbetriebs fragt: ‚Ab wie vielen Beschäftigten kann bei uns ein Betriebsrat gewählt werden?‘",
        "a": [
          "Ab 5 Beschäftigten",
          "Ab 10 Beschäftigten",
          "Ab 20 Beschäftigten",
          "Ab 50 Beschäftigten"
        ],
        "c": 0,
        "e": "Nach dem Betriebsverfassungsgesetz kann ein Betriebsrat in Betrieben mit mindestens fünf ständigen wahlberechtigten Arbeitnehmern gewählt werden."
      },
      {
        "q": "Ein Bürokaufmann fragt: ‚Welche gesetzliche Grundkündigungsfrist gilt für Arbeitnehmer nach der Probezeit?‘",
        "a": [
          "Vier Wochen zum 15. oder zum Monatsende",
          "Sechs Wochen zum Ende eines Quartals",
          "Einen Monat zum Ende des Kalendermonats",
          "Drei Monate zum Ende eines Monats"
        ],
        "c": 0,
        "e": "Nach § 622 BGB beträgt die Grundkündigungsfrist vier Wochen zum 15. oder zum Ende eines Kalendermonats."
      },
      {
        "q": "Ein Azubi im Einzelhandel will wissen: ‚Wer nimmt meine Abschlussprüfung als Kaufmann im Einzelhandel ab?‘",
        "a": [
          "Die Berufsschule",
          "Die Bundesagentur für Arbeit",
          "Die zuständige IHK",
          "Das Kultusministerium des Landes"
        ],
        "c": 2,
        "e": "Bei kaufmännischen Ausbildungsberufen ist die Industrie- und Handelskammer als zuständige Stelle für die Abschlussprüfung verantwortlich."
      },
      {
        "q": "Eine Unternehmensgründerin fragt: ‚Wie viele Beschäftigte darf ein Unternehmen nach EU-Definition höchstens haben, um als KMU zu gelten?‘",
        "a": [
          "Weniger als 100 Beschäftigte",
          "Weniger als 500 Beschäftigte",
          "Weniger als 1.000 Beschäftigte",
          "Weniger als 250 Beschäftigte"
        ],
        "c": 3,
        "e": "Nach EU-Definition sind kleine und mittlere Unternehmen solche mit weniger als 250 Beschäftigten und begrenztem Umsatz oder begrenzter Bilanzsumme."
      },
      {
        "q": "Ein Paketbote fragt: ‚Wie lange zahlt der Arbeitgeber bei Krankheit den Lohn weiter?‘",
        "a": [
          "Bis zu drei Wochen",
          "Bis zu zwölf Wochen",
          "Bis zu sechs Monate",
          "Bis zu sechs Wochen"
        ],
        "c": 3,
        "e": "Nach dem Entgeltfortzahlungsgesetz zahlt der Arbeitgeber bei Arbeitsunfähigkeit bis zu sechs Wochen den Lohn weiter, danach folgt das Krankengeld."
      },
      {
        "q": "Eine Betriebsrätin in der Zulieferindustrie fragt: ‚Wer trägt eigentlich das Kurzarbeitergeld?‘",
        "a": [
          "Der Arbeitgeber aus eigenen Mitteln",
          "Die Bundesagentur für Arbeit",
          "Die gesetzliche Krankenkasse",
          "Das jeweilige Bundesland"
        ],
        "c": 1,
        "e": "Kurzarbeitergeld ist eine Leistung der Bundesagentur für Arbeit; der Arbeitgeber zahlt es aus und bekommt es erstattet."
      },
      {
        "q": "Ein Schichtarbeiter, dessen Firma insolvent ist, fragt: ‚Für welchen Zeitraum ersetzt das Insolvenzgeld ausgefallenen Lohn?‘",
        "a": [
          "Für den letzten Monat",
          "Für die letzten drei Monate",
          "Für die letzten sechs Monate",
          "Für das letzte Jahr"
        ],
        "c": 1,
        "e": "Das Insolvenzgeld der Bundesagentur für Arbeit gleicht ausstehendes Nettoentgelt für die letzten drei Monate vor dem Insolvenzereignis aus."
      },
      {
        "q": "Eine Werkstudentin fragt: ‚Wer führt die Lohnsteuer von meinem Gehalt an das Finanzamt ab?‘",
        "a": [
          "Ich selbst über die Steuererklärung",
          "Die Krankenkasse",
          "Mein Arbeitgeber",
          "Meine Hausbank"
        ],
        "c": 2,
        "e": "Der Arbeitgeber behält die Lohnsteuer vom Bruttolohn ein und führt sie an das Finanzamt ab."
      },
      {
        "q": "Ein arbeitsuchender Ingenieur fragt: ‚In welcher Stadt hat die Bundesagentur für Arbeit ihren Hauptsitz?‘",
        "a": [
          "Berlin",
          "Frankfurt am Main",
          "Kassel",
          "Nürnberg"
        ],
        "c": 3,
        "e": "Die Zentrale der Bundesagentur für Arbeit befindet sich in Nürnberg."
      },
      {
        "q": "Ein Kleinanleger fragt: ‚Wie viele Unternehmen sind im deutschen Leitindex DAX enthalten?‘",
        "a": [
          "40 Unternehmen",
          "30 Unternehmen",
          "50 Unternehmen",
          "100 Unternehmen"
        ],
        "c": 0,
        "e": "Seit September 2021 umfasst der DAX 40 statt zuvor 30 Unternehmen."
      },
      {
        "q": "Eine Steuerfachangestellte fragt: ‚Welche Steuer bringt dem Staat insgesamt die höchsten Einnahmen?‘",
        "a": [
          "Die Umsatzsteuer",
          "Die Gewerbesteuer",
          "Die Energiesteuer",
          "Die Körperschaftsteuer"
        ],
        "c": 0,
        "e": "Die Umsatzsteuer ist noch vor der Lohnsteuer die aufkommensstärkste Steuer in Deutschland."
      },
      {
        "q": "Ein Exportleiter eines Mittelständlers fragt: ‚Wie heißt das Freihandelsabkommen der EU mit Kanada?‘",
        "a": [
          "TTIP",
          "JEFTA",
          "CETA",
          "NAFTA"
        ],
        "c": 2,
        "e": "Das Abkommen CETA zwischen der EU und Kanada wird seit 2017 in weiten Teilen vorläufig angewendet."
      },
      {
        "q": "Eine Weinhändlerin fragt: ‚Wer verhandelt für Deutschland Handelsabkommen und Zölle mit Drittstaaten?‘",
        "a": [
          "Das Bundeswirtschaftsministerium allein",
          "Die Europäische Union",
          "Die Welthandelsorganisation",
          "Die Bundesländer gemeinsam"
        ],
        "c": 1,
        "e": "Die gemeinsame Handelspolitik ist ausschließliche Zuständigkeit der EU; die Kommission verhandelt im Auftrag der Mitgliedstaaten."
      },
      {
        "q": "Ein Busfahrer fragt: ‚Wer darf in Deutschland rechtmäßig zu einem Streik aufrufen?‘",
        "a": [
          "Jeder Betriebsrat",
          "Nur eine Gewerkschaft",
          "Jede Belegschaftsversammlung",
          "Jeder einzelne Beschäftigte"
        ],
        "c": 1,
        "e": "Streiks sind nur auf Aufruf einer Gewerkschaft zur Durchsetzung tariflicher Ziele zulässig; „wilde“ Streiks sind rechtswidrig."
      },
      {
        "q": "Ein Geselle im Elektrohandwerk will wissen: ‚Was brauche ich in der Regel, um einen eigenen Elektrobetrieb zu eröffnen?‘",
        "a": [
          "Einen Hochschulabschluss",
          "Eine Lizenz der Bundesnetzagentur",
          "Nur eine Gewerbeanmeldung",
          "Den Meisterbrief"
        ],
        "c": 3,
        "e": "Das Elektrotechnikerhandwerk ist zulassungspflichtig; für die Eintragung in die Handwerksrolle ist in der Regel der Meisterbrief nötig."
      },
      {
        "q": "Die Mutter eines 16-Jährigen fragt: ‚Wie viele Stunden pro Woche darf mein Sohn in der Ausbildung höchstens arbeiten?‘",
        "a": [
          "35 Stunden",
          "45 Stunden",
          "40 Stunden",
          "48 Stunden"
        ],
        "c": 2,
        "e": "Das Jugendarbeitsschutzgesetz begrenzt die Arbeitszeit Minderjähriger auf acht Stunden täglich und 40 Stunden wöchentlich."
      }
    ],
    "migration": [
      {
        "q": "Ein Sprachkursteilnehmer aus Syrien fragt: ‚Aus welchen zwei Teilen besteht der Integrationskurs?‘",
        "a": [
          "Sprachkurs und Orientierungskurs",
          "Sprachkurs und Berufspraktikum",
          "Orientierungskurs und Einbürgerungstest",
          "Sprachkurs und Bewerbungstraining"
        ],
        "c": 0,
        "e": "Der Integrationskurs besteht aus einem Sprachkurs und einem Orientierungskurs zu Rechtsordnung, Geschichte und Kultur in Deutschland."
      },
      {
        "q": "Der Personalchef eines Pflegeheims fragt: ‚Seit wann gilt das Fachkräfteeinwanderungsgesetz in seiner ersten Fassung?‘",
        "a": [
          "Seit 2015",
          "Seit 2020",
          "Seit 2005",
          "Seit 2012"
        ],
        "c": 1,
        "e": "Das erste Fachkräfteeinwanderungsgesetz trat am 1. März 2020 in Kraft und wurde 2023 weiterentwickelt."
      },
      {
        "q": "Ein Bauunternehmer fragt: ‚Was braucht ein polnischer Fliesenleger, um bei mir als Arbeitnehmer anzufangen?‘",
        "a": [
          "Ein nationales Arbeitsvisum",
          "Eine Zustimmung der Arbeitsagentur",
          "Eine Blaue Karte EU",
          "Keinen Aufenthaltstitel"
        ],
        "c": 3,
        "e": "Als EU-Bürger genießt er Arbeitnehmerfreizügigkeit und braucht weder Visum noch Arbeitserlaubnis."
      },
      {
        "q": "Eine Studentin aus Indien fragt: ‚Welche Behörde stellt mir vor Ort meinen Aufenthaltstitel aus?‘",
        "a": [
          "Das Bundesamt für Migration und Flüchtlinge",
          "Die Ausländerbehörde",
          "Das Standesamt",
          "Die Bundespolizei"
        ],
        "c": 1,
        "e": "Für die Erteilung und Verlängerung von Aufenthaltstiteln im Inland sind die Ausländerbehörden der Kreise und Städte zuständig."
      },
      {
        "q": "Ein Gastwirt aus Albanien fragt: ‚Was zeichnet die Niederlassungserlaubnis aus?‘",
        "a": [
          "Sie ist unbefristet",
          "Sie gilt nur für ein Bundesland",
          "Sie ist auf ein Jahr befristet",
          "Sie gilt nur für Selbstständige"
        ],
        "c": 0,
        "e": "Die Niederlassungserlaubnis ist ein unbefristeter Aufenthaltstitel, der auch zur Erwerbstätigkeit berechtigt."
      },
      {
        "q": "Eine Frau, deren Bruder in Marokko lebt, fragt: ‚Wo beantragt mein Bruder ein Visum für einen Besuch in Deutschland?‘",
        "a": [
          "Bei der Ausländerbehörde in Deutschland",
          "Bei der deutschen Auslandsvertretung",
          "Beim Bundesamt für Migration",
          "Beim Auswärtigen Ausschuss des Bundestages"
        ],
        "c": 1,
        "e": "Visa werden von den deutschen Botschaften und Konsulaten im Ausland erteilt, die zum Auswärtigen Amt gehören."
      },
      {
        "q": "Ein Reisebüroangestellter fragt: ‚Wie lange dürfen visumfreie Touristen aus Drittstaaten im Schengenraum bleiben?‘",
        "a": [
          "Bis zu 30 Tage in jedem Kalenderhalbjahr",
          "Bis zu sechs Monate am Stück",
          "Bis zu 90 Tage innerhalb von 180 Tagen",
          "Bis zu 180 Tage pro Kalenderjahr"
        ],
        "c": 2,
        "e": "Für Kurzaufenthalte im Schengenraum gilt die Regel von höchstens 90 Tagen innerhalb eines Zeitraums von 180 Tagen."
      },
      {
        "q": "Ein Bundespolizist fragt: ‚Wie heißt die EU-Datenbank, in der Fingerabdrücke von Asylsuchenden gespeichert werden?‘",
        "a": [
          "Europol-Index",
          "Eurodac",
          "Schengen-Visa-Kartei",
          "Frontex-Register"
        ],
        "c": 1,
        "e": "In Eurodac werden Fingerabdrücke von Asylsuchenden gespeichert, um Mehrfachanträge zu erkennen und die Zuständigkeit zu klären."
      },
      {
        "q": "Ein Schüler fragt: ‚Wo hat das UN-Flüchtlingshilfswerk UNHCR seinen Hauptsitz?‘",
        "a": [
          "New York",
          "Wien",
          "Brüssel",
          "Genf"
        ],
        "c": 3,
        "e": "Das 1950 gegründete UNHCR hat seinen Hauptsitz in Genf."
      },
      {
        "q": "Eine Einbürgerungsbewerberin fragt: ‚Was muss ich bei der Einbürgerung unter anderem abgeben?‘",
        "a": [
          "Eine Bürgschaft eines deutschen Staatsbürgers",
          "Einen Nachweis über eigenes Wohneigentum in Deutschland",
          "Ein Bekenntnis zur freiheitlichen Grundordnung",
          "Eine schriftliche Empfehlung des Bürgermeisters"
        ],
        "c": 2,
        "e": "Wer sich einbürgern lässt, muss sich zur freiheitlichen demokratischen Grundordnung des Grundgesetzes bekennen."
      },
      {
        "q": "Ein Jobcenter-Mitarbeiter fragt: ‚Was gilt bei der Einbürgerung grundsätzlich für den Lebensunterhalt?‘",
        "a": [
          "Er muss ohne Sozialleistungen gesichert sein",
          "Er spielt bei der Einbürgerung keine Rolle",
          "Er muss durch Vermögen von 50.000 Euro gedeckt sein",
          "Er muss durch ein Bundesland garantiert werden"
        ],
        "c": 0,
        "e": "In der Regel muss der Lebensunterhalt ohne Bürgergeld oder Sozialhilfe gesichert sein; Ausnahmen sind eng begrenzt."
      },
      {
        "q": "Ein anerkannter Flüchtling aus Eritrea fragt: ‚Mit welchem Dokument kann ich ins Ausland reisen, wenn ich keinen Pass meines Landes beantragen kann?‘",
        "a": [
          "Mit dem Reiseausweis für Flüchtlinge",
          "Mit einer Duldungsbescheinigung",
          "Mit dem Ankunftsnachweis",
          "Mit einem vorläufigen Personalausweis"
        ],
        "c": 0,
        "e": "Anerkannte Flüchtlinge erhalten nach der Genfer Flüchtlingskonvention einen Reiseausweis für Flüchtlinge („blauer Pass“) – Reisen ins Herkunftsland können den Schutz gefährden."
      },
      {
        "q": "Ein Verwaltungsbeamter in Ausbildung fragt: ‚Welches Gesetz regelt Einreise und Aufenthalt von Drittstaatsangehörigen?‘",
        "a": [
          "Das Asylgesetz",
          "Das Freizügigkeitsgesetz/EU",
          "Das Bundesmeldegesetz",
          "Das Aufenthaltsgesetz"
        ],
        "c": 3,
        "e": "Das Aufenthaltsgesetz regelt Einreise, Aufenthalt und Erwerbstätigkeit von Nicht-EU-Bürgern; für EU-Bürger gilt das Freizügigkeitsgesetz/EU."
      },
      {
        "q": "Ein Informatiker aus Brasilien fragt: ‚Welche Stelle bewertet ausländische Hochschulabschlüsse für Deutschland?‘",
        "a": [
          "Die Zentralstelle für ausländisches Bildungswesen",
          "Das Bundesamt für Migration und Flüchtlinge in Nürnberg",
          "Die Hochschulrektorenkonferenz",
          "Das Auswärtige Amt"
        ],
        "c": 0,
        "e": "Die Zentralstelle für ausländisches Bildungswesen (ZAB) bei der Kultusministerkonferenz stellt Zeugnisbewertungen für ausländische Hochschulabschlüsse aus."
      },
      {
        "q": "Eine Frau, deren Tante in Kasachstan lebt, fragt: ‚Welche Behörde führt das Aufnahmeverfahren für Spätaussiedler durch?‘",
        "a": [
          "Das Bundesamt für Migration und Flüchtlinge",
          "Das Auswärtige Amt",
          "Das Bundesinnenministerium direkt",
          "Das Bundesverwaltungsamt"
        ],
        "c": 3,
        "e": "Das Bundesverwaltungsamt in Köln führt das Aufnahmeverfahren nach dem Bundesvertriebenengesetz durch."
      },
      {
        "q": "Eine Jurastudentin fragt: ‚Wer darf Abschiebungshaft anordnen?‘",
        "a": [
          "Die Ausländerbehörde selbst",
          "Die Bundespolizei",
          "Ein Richter am Amtsgericht",
          "Das Bundesamt für Migration"
        ],
        "c": 2,
        "e": "Über Freiheitsentziehungen wie die Abschiebungshaft darf nach Artikel 104 GG nur ein Richter entscheiden, zuständig ist das Amtsgericht."
      },
      {
        "q": "Ein Ausbilder im Kfz-Handwerk fragt: ‚Wofür steht die sogenannte 3+2-Regelung für geduldete Auszubildende?‘",
        "a": [
          "Drei Jahre Sprachkurs und zwei Jahre Praktikum",
          "Drei Monate Probezeit und zwei Jahre Befristung",
          "Ausbildungsduldung, danach zwei Jahre Aufenthalt",
          "Drei Jahre Duldung, danach zwei Jahre Einbürgerungsfrist"
        ],
        "c": 2,
        "e": "Während der Ausbildung gibt es eine Ausbildungsduldung, danach bei passender Beschäftigung eine Aufenthaltserlaubnis für zwei Jahre."
      },
      {
        "q": "Ein Lehrer fragt: ‚Wo hat die Asylagentur der Europäischen Union (EUAA) ihren Sitz?‘",
        "a": [
          "Brüssel",
          "Straßburg",
          "Valletta",
          "Den Haag"
        ],
        "c": 2,
        "e": "Die Asylagentur der EU, früher EASO genannt, hat ihren Sitz in Valletta auf Malta."
      },
      {
        "q": "Ein Grenzpendler fragt: ‚Wann dürfen Schengen-Staaten vorübergehend wieder an ihren Binnengrenzen kontrollieren?‘",
        "a": [
          "Bei ernster Gefahr für die innere Sicherheit",
          "Niemals, das ist ausnahmslos verboten",
          "Jederzeit und ohne jede Begründung",
          "Nur nach einstimmigem Beschluss der EU-Staaten"
        ],
        "c": 0,
        "e": "Der Schengener Grenzkodex erlaubt befristete Binnengrenzkontrollen bei ernsthafter Bedrohung der öffentlichen Ordnung oder inneren Sicherheit; sie sind der EU-Kommission zu melden."
      },
      {
        "q": "Eine Erzieherin aus der Ukraine fragt: ‚Seit wann gibt es einen Anspruch auf Prüfung, ob mein ausländischer Berufsabschluss gleichwertig ist?‘",
        "a": [
          "Seit 1993",
          "Seit 2005",
          "Seit 2020",
          "Seit 2012"
        ],
        "c": 3,
        "e": "Mit dem Anerkennungsgesetz des Bundes besteht seit April 2012 ein Anspruch auf ein Verfahren zur Gleichwertigkeitsprüfung, unabhängig von der Staatsangehörigkeit."
      }
    ],
    "soziales": [
      {
        "q": "Ein Fliesenleger fragt: ‚Wer bezahlt die Beiträge zur gesetzlichen Rentenversicherung?‘",
        "a": [
          "Allein die Beschäftigten über ihren Lohn",
          "Allein die Arbeitgeber",
          "Arbeitgeber und Beschäftigte je hälftig",
          "Allein der Bund aus Steuermitteln"
        ],
        "c": 2,
        "e": "Der Rentenbeitrag wird in der Regel je zur Hälfte von Arbeitgebern und Beschäftigten getragen; der Bund zahlt zusätzlich Zuschüsse an die Rentenkasse."
      },
      {
        "q": "Eine Hausfrau mit zwei Kindern fragt: ‚Muss ich ohne eigenes Einkommen Krankenkassenbeiträge zahlen, wenn mein Mann gesetzlich versichert ist?‘",
        "a": [
          "Nein, Familienversicherung ist beitragsfrei",
          "Ja, den gesetzlichen Mindestbeitrag für Nichterwerbstätige",
          "Ja, die Hälfte seines Beitrags",
          "Nur bis die Kinder volljährig sind"
        ],
        "c": 0,
        "e": "Ehepartner und Kinder ohne oder mit geringem Einkommen sind in der gesetzlichen Krankenversicherung beitragsfrei familienversichert."
      },
      {
        "q": "Ein kinderloser Mittvierziger fragt: ‚Wie hoch ist mein Zuschlag zur Pflegeversicherung, weil ich keine Kinder habe?‘",
        "a": [
          "0,25 Prozentpunkte",
          "0,35 Prozentpunkte",
          "1,0 Prozentpunkte",
          "0,6 Prozentpunkte"
        ],
        "c": 3,
        "e": "Seit Juli 2023 zahlen Kinderlose ab 23 Jahren einen Zuschlag von 0,6 Prozentpunkten zum Beitrag der Pflegeversicherung."
      },
      {
        "q": "Eine Tochter, die ihre Mutter pflegt, fragt: ‚Wer begutachtet meine gesetzlich versicherte Mutter, um den Pflegegrad festzustellen?‘",
        "a": [
          "Der behandelnde Hausarzt",
          "Das örtliche Gesundheitsamt",
          "Der Medizinische Dienst",
          "Das Sozialamt der Stadt"
        ],
        "c": 2,
        "e": "Im Auftrag der Pflegekasse begutachtet der Medizinische Dienst gesetzlich Versicherte und empfiehlt einen Pflegegrad."
      },
      {
        "q": "Eine Witwe fragt: ‚Wie hoch ist die große Witwenrente nach neuem Recht im Verhältnis zur Rente des Verstorbenen?‘",
        "a": [
          "55 Prozent",
          "25 Prozent",
          "45 Prozent",
          "60 Prozent"
        ],
        "c": 0,
        "e": "Nach neuem Recht beträgt die große Witwenrente 55 Prozent, nach altem Recht 60 Prozent der Rente des verstorbenen Ehepartners."
      },
      {
        "q": "Ein 61-jähriger Dachdecker fragt: ‚Um wie viel Prozent sinkt meine Rente für jeden Monat, den ich vorzeitig in Rente gehe?‘",
        "a": [
          "0,3 Prozent",
          "0,1 Prozent",
          "0,5 Prozent",
          "1,0 Prozent"
        ],
        "c": 0,
        "e": "Für jeden Monat des vorzeitigen Rentenbeginns sinkt die Rente dauerhaft um 0,3 Prozent, also um 3,6 Prozent pro Jahr."
      },
      {
        "q": "Eine Frührentnerin fragt: ‚Wie viel darf ich seit 2023 neben einer vorgezogenen Altersrente hinzuverdienen?‘",
        "a": [
          "Höchstens 520 Euro im Monat",
          "Höchstens 6.300 Euro im Jahr",
          "Unbegrenzt ohne Rentenkürzung",
          "Höchstens 2.000 Euro im Monat"
        ],
        "c": 2,
        "e": "Seit dem 1. Januar 2023 ist die Hinzuverdienstgrenze bei vorgezogenen Altersrenten vollständig entfallen."
      },
      {
        "q": "Ein Lagerist nach einem Bandscheibenvorfall fragt: ‚Ab wann gilt man als voll erwerbsgemindert?‘",
        "a": [
          "Wenn man weniger als sechs Stunden täglich arbeiten kann",
          "Wenn man weniger als drei Stunden täglich arbeiten kann",
          "Wenn man den bisherigen Beruf nicht mehr ausüben kann",
          "Wenn man länger als ein Jahr krankgeschrieben ist"
        ],
        "c": 1,
        "e": "Voll erwerbsgemindert ist, wer auf dem allgemeinen Arbeitsmarkt weniger als drei Stunden täglich arbeiten kann; unter sechs Stunden gilt als teilweise Erwerbsminderung."
      },
      {
        "q": "Ein junger Vater fragt: ‚Welche Stelle zahlt das Kindergeld aus?‘",
        "a": [
          "Das Finanzamt",
          "Das Jugendamt",
          "Die Elterngeldstelle",
          "Die Familienkasse"
        ],
        "c": 3,
        "e": "Das Kindergeld wird von der Familienkasse bei der Bundesagentur für Arbeit festgesetzt und ausgezahlt."
      },
      {
        "q": "Die Mutter einer Studentin fragt: ‚Bis zu welchem Alter kann es für Kinder in Ausbildung oder Studium Kindergeld geben?‘",
        "a": [
          "Bis 18 Jahre",
          "Bis 21 Jahre",
          "Bis 27 Jahre",
          "Bis 25 Jahre"
        ],
        "c": 3,
        "e": "Für Kinder in Ausbildung oder Studium gibt es Kindergeld in der Regel bis zum 25. Geburtstag."
      },
      {
        "q": "Ein Erstsemester fragt: ‚Wie viel vom BAföG für Studierende muss ich später zurückzahlen?‘",
        "a": [
          "Den vollen Betrag mit Zinsen",
          "Die Hälfte, zinslos",
          "Nichts, alles ist ein Zuschuss",
          "Ein Viertel, mit Zinsen"
        ],
        "c": 1,
        "e": "Studierende erhalten BAföG in der Regel zur Hälfte als Zuschuss und zur Hälfte als zinsloses Staatsdarlehen."
      },
      {
        "q": "Ein Busfahrer mit langer Krankheit fragt: ‚Wie lange gibt es wegen derselben Krankheit höchstens Krankengeld?‘",
        "a": [
          "26 Wochen innerhalb von zwei Jahren",
          "52 Wochen innerhalb von drei Jahren",
          "78 Wochen innerhalb von drei Jahren",
          "104 Wochen innerhalb von vier Jahren"
        ],
        "c": 2,
        "e": "Wegen derselben Krankheit gibt es Krankengeld höchstens 78 Wochen innerhalb von drei Jahren, die Zeit der Lohnfortzahlung eingerechnet."
      },
      {
        "q": "Eine chronisch kranke Rentnerin fragt: ‚Wie hoch ist meine jährliche Belastungsgrenze für Zuzahlungen bei der Krankenkasse?‘",
        "a": [
          "0,5 Prozent der Bruttoeinnahmen",
          "2 Prozent der Bruttoeinnahmen",
          "5 Prozent der Bruttoeinnahmen",
          "1 Prozent der Bruttoeinnahmen"
        ],
        "c": 3,
        "e": "Für chronisch Kranke liegt die Belastungsgrenze bei 1 Prozent, für alle anderen bei 2 Prozent der jährlichen Bruttoeinnahmen zum Lebensunterhalt."
      },
      {
        "q": "Ein Radfahrer, der auf dem Weg zur Arbeit gestürzt ist, fragt: ‚Welche Versicherung ist für meinen Unfall auf dem direkten Arbeitsweg zuständig?‘",
        "a": [
          "Meine private Haftpflichtversicherung",
          "Die gesetzliche Unfallversicherung",
          "Nur meine Krankenkasse",
          "Die Rentenversicherung"
        ],
        "c": 1,
        "e": "Unfälle auf dem direkten Weg zur und von der Arbeit sind als Wegeunfälle über die gesetzliche Unfallversicherung abgesichert."
      },
      {
        "q": "Ein Rentner fragt: ‚Was kostet mich eine Klage vor dem Sozialgericht an Gerichtskosten?‘",
        "a": [
          "Eine pauschale Gebühr von 500 Euro",
          "Zehn Prozent des strittigen Betrags",
          "Gebühren gestaffelt nach Einkommen",
          "Keine, das ist gerichtskostenfrei"
        ],
        "c": 3,
        "e": "Für Versicherte und Leistungsempfänger ist das Verfahren vor den Sozialgerichten gerichtskostenfrei; Anwaltskosten können aber anfallen."
      },
      {
        "q": "Ein Mann mit Schwerbehinderung fragt: ‚Wie lange habe ich Zeit, gegen einen Bescheid der Rentenversicherung Widerspruch einzulegen?‘",
        "a": [
          "Zwei Wochen",
          "Einen Monat",
          "Drei Monate",
          "Ein Jahr"
        ],
        "c": 1,
        "e": "Widerspruch gegen einen Sozialleistungsbescheid ist bei korrekter Rechtsbehelfsbelehrung innerhalb eines Monats nach Bekanntgabe einzulegen."
      },
      {
        "q": "Eine 28-jährige Erzieherin fragt: ‚Ab welchem Alter bekomme ich jährlich eine Renteninformation zugeschickt?‘",
        "a": [
          "Ab 27 Jahren",
          "Ab 18 Jahren",
          "Ab 40 Jahren",
          "Ab 55 Jahren"
        ],
        "c": 0,
        "e": "Versicherte ab 27 Jahren mit mindestens fünf Beitragsjahren erhalten jährlich eine Renteninformation der Deutschen Rentenversicherung."
      },
      {
        "q": "Ein Sohn einer pflegebedürftigen Mutter fragt: ‚Ab welchem eigenen Jahreseinkommen kann das Sozialamt mich für ihre Pflegekosten heranziehen?‘",
        "a": [
          "Ab 30.000 Euro brutto",
          "Ab 60.000 Euro brutto",
          "Ab 100.000 Euro brutto",
          "Ab 150.000 Euro brutto"
        ],
        "c": 2,
        "e": "Seit dem Angehörigen-Entlastungsgesetz von 2020 werden Kinder erst ab einem Jahresbruttoeinkommen von mehr als 100.000 Euro zum Unterhalt herangezogen."
      },
      {
        "q": "Ein werdender Vater fragt: ‚Wie viele Monate Basiselterngeld gibt es höchstens, wenn sich beide Eltern beteiligen?‘",
        "a": [
          "12 Monate",
          "14 Monate",
          "18 Monate",
          "24 Monate"
        ],
        "c": 1,
        "e": "Basiselterngeld gibt es für bis zu zwölf Monate plus zwei Partnermonate, also insgesamt 14 Monate."
      },
      {
        "q": "Eine Verkäuferin, deren Vater plötzlich pflegebedürftig wird, fragt: ‚Wie viele Arbeitstage darf ich in einer akuten Pflegesituation kurzfristig fernbleiben?‘",
        "a": [
          "Bis zu 10 Arbeitstage",
          "Bis zu 3 Arbeitstage",
          "Bis zu 5 Arbeitstage",
          "Bis zu 20 Arbeitstage"
        ],
        "c": 0,
        "e": "Bei akut auftretendem Pflegebedarf erlaubt das Pflegezeitgesetz bis zu zehn Arbeitstage Fernbleiben, auf Antrag mit Pflegeunterstützungsgeld."
      }
    ],
    "klima": [
      {
        "q": "Eine Schülerin fragt: ‚In welchem Jahr wurde das erste Bundes-Klimaschutzgesetz beschlossen?‘",
        "a": [
          "2009",
          "2015",
          "2021",
          "2019"
        ],
        "c": 3,
        "e": "Das Bundes-Klimaschutzgesetz wurde Ende 2019 beschlossen und seitdem mehrfach geändert."
      },
      {
        "q": "Ein Ingenieur fragt: ‚Um wie viel will die EU ihre Netto-Treibhausgasemissionen bis 2030 gegenüber 1990 senken?‘",
        "a": [
          "Um mindestens 40 Prozent",
          "Um mindestens 65 Prozent",
          "Um mindestens 80 Prozent",
          "Um mindestens 55 Prozent"
        ],
        "c": 3,
        "e": "Mit dem Paket „Fit for 55“ setzt die EU ihr Ziel um, die Netto-Emissionen bis 2030 um mindestens 55 Prozent zu senken."
      },
      {
        "q": "Ein Landwirt fragt: ‚Bis wann will die EU laut Europäischem Klimagesetz klimaneutral sein?‘",
        "a": [
          "2050",
          "2040",
          "2045",
          "2060"
        ],
        "c": 0,
        "e": "Das Europäische Klimagesetz von 2021 schreibt die Klimaneutralität der EU bis 2050 verbindlich fest."
      },
      {
        "q": "Ein Geschichtslehrer fragt: ‚In welchem Jahr wurde das Pariser Klimaabkommen beschlossen?‘",
        "a": [
          "2009",
          "2012",
          "2015",
          "2019"
        ],
        "c": 2,
        "e": "Das Pariser Abkommen wurde im Dezember 2015 auf der Weltklimakonferenz COP21 beschlossen."
      },
      {
        "q": "Ein Wohnungssuchender fragt: ‚Wann muss mir ein Vermieter den Energieausweis des Gebäudes vorlegen?‘",
        "a": [
          "Nur auf Anfrage nach Vertragsende",
          "Spätestens bei der Besichtigung",
          "Nie, er ist freiwillig",
          "Erst nach einem Jahr Mietdauer"
        ],
        "c": 1,
        "e": "Nach dem Gebäudeenergiegesetz muss der Energieausweis Miet- und Kaufinteressenten spätestens bei der Besichtigung vorgelegt werden."
      },
      {
        "q": "Eine Mieterin fragt: ‚Bis zu welcher Wechselrichterleistung gilt ein Balkonkraftwerk als vereinfachtes Steckersolargerät?‘",
        "a": [
          "300 Watt",
          "600 Watt",
          "1.000 Watt",
          "800 Watt"
        ],
        "c": 3,
        "e": "Seit dem Solarpaket I von 2024 gelten Steckersolargeräte bis 800 Watt Wechselrichterleistung mit vereinfachter Anmeldung."
      },
      {
        "q": "Ein Solarteur fragt: ‚Für wie viele Jahre wird die EEG-Einspeisevergütung für eine Solaranlage gezahlt?‘",
        "a": [
          "10 Jahre",
          "15 Jahre",
          "20 Jahre",
          "30 Jahre"
        ],
        "c": 2,
        "e": "Die Einspeisevergütung nach dem EEG wird für 20 Jahre zuzüglich des Jahres der Inbetriebnahme gezahlt."
      },
      {
        "q": "Ein Hausbesitzer fragt: ‚Welche Förderbank vergibt die Bundeszuschüsse für den Einbau einer Wärmepumpe?‘",
        "a": [
          "Die Europäische Investitionsbank",
          "Die KfW",
          "Die Deutsche Bundesbank",
          "Die jeweilige Landesbank"
        ],
        "c": 1,
        "e": "Seit 2024 beantragen Privatleute die Heizungsförderung der Bundesförderung für effiziente Gebäude bei der KfW."
      },
      {
        "q": "Ein Azubi im Heizungsbau fragt: ‚Was gibt die Jahresarbeitszahl einer Wärmepumpe an?‘",
        "a": [
          "Die erwartete Lebensdauer in vollen Jahren",
          "Die jährlichen Wartungskosten in Euro",
          "Die Betriebsstunden pro Kalenderjahr",
          "Das Verhältnis von Wärme zu Stromeinsatz"
        ],
        "c": 3,
        "e": "Die Jahresarbeitszahl gibt an, wie viele Kilowattstunden Wärme eine Wärmepumpe im Jahresmittel pro Kilowattstunde Strom erzeugt."
      },
      {
        "q": "Ein Fischer von Rügen fragt: ‚In welchem Meer steht der Großteil der deutschen Offshore-Windkraft?‘",
        "a": [
          "In der Nordsee",
          "In der Ostsee",
          "Zu gleichen Teilen in beiden",
          "Vor allem in Binnenseen"
        ],
        "c": 0,
        "e": "Der weit überwiegende Teil der deutschen Offshore-Windleistung ist in der Nordsee installiert."
      },
      {
        "q": "Eine ältere Dame fragt: ‚Welches Ereignis führte 2011 zum beschleunigten Atomausstieg in Deutschland?‘",
        "a": [
          "Der Unfall in Tschernobyl",
          "Die Reaktorkatastrophe von Fukushima",
          "Ein Störfall in Brokdorf",
          "Ein Urteil des Bundesverfassungsgerichts"
        ],
        "c": 1,
        "e": "Nach der Reaktorkatastrophe von Fukushima im März 2011 beschloss der Bundestag den schrittweisen Atomausstieg bis Ende 2022."
      },
      {
        "q": "Eine Geografiestudentin fragt: ‚Welche Region ist kein deutsches Braunkohlerevier?‘",
        "a": [
          "Das Lausitzer Revier",
          "Das Rheinische Revier",
          "Das Ruhrgebiet",
          "Das Mitteldeutsche Revier"
        ],
        "c": 2,
        "e": "Im Ruhrgebiet wurde Steinkohle gefördert; Braunkohle stammt aus dem Rheinischen, dem Lausitzer und dem Mitteldeutschen Revier."
      },
      {
        "q": "Ein ehemaliger Bergmann aus Bottrop fragt: ‚In welchem Jahr schloss die letzte deutsche Steinkohlenzeche?‘",
        "a": [
          "2018",
          "2008",
          "2015",
          "2022"
        ],
        "c": 0,
        "e": "Mit der Zeche Prosper-Haniel in Bottrop endete im Dezember 2018 der Steinkohlebergbau in Deutschland."
      },
      {
        "q": "Ein Vater im Elektromarkt fragt: ‚Welche Skala nutzt das EU-Energielabel etwa für Kühlschränke seit 2021?‘",
        "a": [
          "A+++ bis D",
          "1 bis 10 Sterne",
          "A bis F",
          "A bis G"
        ],
        "c": 3,
        "e": "Seit 2021 gilt für viele Haushaltsgeräte wieder die Skala A bis G ohne Plus-Klassen."
      },
      {
        "q": "Eine Studentin der Elektrotechnik fragt: ‚Wie speichert ein Pumpspeicherkraftwerk Energie?‘",
        "a": [
          "Es pumpt Wasser in ein Oberbecken",
          "Es komprimiert Luft in Salzkavernen",
          "Es lädt große Lithium-Batterien",
          "Es erzeugt Wasserstoff aus Flusswasser"
        ],
        "c": 0,
        "e": "Bei Stromüberschuss wird Wasser in ein höher gelegenes Becken gepumpt und bei Bedarf über Turbinen wieder abgelassen."
      },
      {
        "q": "Ein Elektriker fragt: ‚Ab welchem Jahresstromverbrauch ist ein intelligentes Messsystem (Smart Meter) Pflicht?‘",
        "a": [
          "Ab 1.500 kWh",
          "Ab 3.000 kWh",
          "Ab 6.000 kWh",
          "Ab 10.000 kWh"
        ],
        "c": 2,
        "e": "Nach dem Messstellenbetriebsgesetz ist ein intelligentes Messsystem ab 6.000 kWh Jahresverbrauch verpflichtend."
      },
      {
        "q": "Ein frisch Zugezogener fragt: ‚Wer liefert mir Strom, wenn ich nach dem Einzug keinen Vertrag abschließe?‘",
        "a": [
          "Niemand, der Strom wird gesperrt",
          "Der örtliche Grundversorger",
          "Der Übertragungsnetzbetreiber",
          "Die Stadtverwaltung"
        ],
        "c": 1,
        "e": "Wer ohne Vertrag Strom bezieht, wird nach dem Energiewirtschaftsgesetz automatisch vom örtlichen Grundversorger beliefert."
      },
      {
        "q": "Ein Austauschschüler fragt: ‚Welches Land stößt weltweit am meisten Treibhausgase aus?‘",
        "a": [
          "Die USA",
          "Indien",
          "China",
          "Russland"
        ],
        "c": 2,
        "e": "China ist seit Mitte der 2000er-Jahre der größte Emittent von Treibhausgasen, vor den USA und Indien."
      },
      {
        "q": "Eine Lokaljournalistin fragt: ‚Welches unabhängige Gremium prüft jährlich die deutschen Emissionsdaten nach dem Klimaschutzgesetz?‘",
        "a": [
          "Der Rat für Nachhaltige Entwicklung",
          "Der Expertenrat für Klimafragen",
          "Der Sachverständigenrat für Umweltfragen",
          "Der Weltklimarat der Vereinten Nationen"
        ],
        "c": 1,
        "e": "Der Expertenrat für Klimafragen prüft die vom Umweltbundesamt vorgelegten Emissionsdaten und bewertet die Zielerreichung."
      },
      {
        "q": "Ein Rentner mit Solardach-Plänen fragt: ‚Welcher Mehrwertsteuersatz gilt für den Kauf einer kleinen Photovoltaikanlage auf dem Wohnhaus?‘",
        "a": [
          "0 Prozent",
          "7 Prozent",
          "19 Prozent",
          "5 Prozent"
        ],
        "c": 0,
        "e": "Seit 2023 gilt für Lieferung und Installation von Photovoltaikanlagen bis 30 kW auf Wohngebäuden ein Nullsteuersatz."
      }
    ],
    "sicherheit": [
      {
        "q": "Eine Urlauberin fragt: ‚Welche Notrufnummer funktioniert in allen EU-Staaten einheitlich?‘",
        "a": [
          "110",
          "116 117",
          "112",
          "999"
        ],
        "c": 2,
        "e": "Die 112 ist die europaweit einheitliche, kostenlose Notrufnummer in allen EU-Staaten."
      },
      {
        "q": "Ein Jurastudent fragt: ‚Wie lange darf die Polizei jemanden ohne richterliche Entscheidung höchstens festhalten?‘",
        "a": [
          "Bis zum Ende des Tages nach der Festnahme",
          "Höchstens 12 Stunden nach der Festnahme",
          "Bis zu 96 Stunden bei Fluchtgefahr",
          "Bis zu einer Woche bei schweren Straftaten"
        ],
        "c": 0,
        "e": "Nach Art. 104 GG darf die Polizei niemanden länger als bis zum Ende des Tages nach dem Ergreifen ohne richterliche Entscheidung festhalten."
      },
      {
        "q": "Ein Rentner will wissen: ‚Wer leitet in Deutschland ein strafrechtliches Ermittlungsverfahren?‘",
        "a": [
          "Die Kriminalpolizei",
          "Das zuständige Amtsgericht",
          "Das Ordnungsamt",
          "Die Staatsanwaltschaft"
        ],
        "c": 3,
        "e": "Die Staatsanwaltschaft ist „Herrin des Ermittlungsverfahrens“; die Polizei ermittelt in ihrem Auftrag."
      },
      {
        "q": "Eine Kampfsporttrainerin fragt: ‚Was gilt rechtlich für eine Tat, die durch Notwehr geboten ist?‘",
        "a": [
          "Sie wird nur milder bestraft",
          "Sie ist nicht rechtswidrig",
          "Sie gilt als Ordnungswidrigkeit",
          "Sie ist nur mit Zeugen straffrei"
        ],
        "c": 1,
        "e": "Nach § 32 StGB handelt nicht rechtswidrig, wer eine Tat begeht, die durch Notwehr geboten ist."
      },
      {
        "q": "Ein Ladendetektiv fragt: ‚Darf eine Privatperson einen Dieb auf frischer Tat festhalten?‘",
        "a": [
          "Nein, das dürfen nur Polizeikräfte",
          "Ja, vorläufig, etwa bei Fluchtverdacht",
          "Nur mit vorheriger Erlaubnis der Polizei",
          "Nur wenn der Schaden über 500 Euro liegt"
        ],
        "c": 1,
        "e": "§ 127 StPO erlaubt jedem die vorläufige Festnahme eines auf frischer Tat Betroffenen, wenn er fluchtverdächtig ist oder seine Identität nicht sofort feststellbar ist."
      },
      {
        "q": "Eine Krimiautorin fragt: ‚Nach wie vielen Jahren verjährt in Deutschland ein Mord?‘",
        "a": [
          "Nach 20 Jahren",
          "Nach 30 Jahren",
          "Nach 50 Jahren",
          "Mord verjährt nie"
        ],
        "c": 3,
        "e": "Mord ist nach § 78 StGB von der Verjährung ausgenommen und kann zeitlich unbegrenzt verfolgt werden."
      },
      {
        "q": "Ein Gymnasiast fragt: ‚Wie lange darf eine zeitige Freiheitsstrafe nach dem Strafgesetzbuch höchstens dauern?‘",
        "a": [
          "15 Jahre",
          "10 Jahre",
          "20 Jahre",
          "25 Jahre"
        ],
        "c": 0,
        "e": "Das Höchstmaß der zeitigen Freiheitsstrafe beträgt nach § 38 StGB 15 Jahre; darüber hinaus gibt es nur die lebenslange Freiheitsstrafe."
      },
      {
        "q": "Eine Sozialarbeiterin fragt: ‚Wie lange darf die Jugendstrafe für Jugendliche bei schwersten Verbrechen höchstens sein?‘",
        "a": [
          "5 Jahre",
          "15 Jahre",
          "10 Jahre",
          "Lebenslang"
        ],
        "c": 2,
        "e": "Nach dem Jugendgerichtsgesetz beträgt das Höchstmaß der Jugendstrafe für Jugendliche bei schwersten Verbrechen zehn Jahre."
      },
      {
        "q": "Ein Kioskbesitzer fragt: ‚Wie lange habe ich Zeit, wegen Hausfriedensbruchs Strafantrag zu stellen?‘",
        "a": [
          "Zwei Wochen ab dem Tag der Tat",
          "Ein Jahr ab dem Tag der Tat",
          "Unbegrenzt bis zur Verjährung der Tat",
          "Drei Monate ab Kenntnis von Tat und Täter"
        ],
        "c": 3,
        "e": "Hausfriedensbruch ist ein Antragsdelikt; nach § 77b StGB beträgt die Antragsfrist drei Monate ab Kenntnis von Tat und Täter."
      },
      {
        "q": "Eine Erzieherin fragt: ‚Welche Behörde führt das Bundeszentralregister, aus dem das Führungszeugnis stammt?‘",
        "a": [
          "Das Bundeskriminalamt",
          "Das Bundesamt für Justiz",
          "Das örtliche Einwohnermeldeamt",
          "Das Bundesverwaltungsamt"
        ],
        "c": 1,
        "e": "Das Bundeszentralregister wird vom Bundesamt für Justiz in Bonn geführt; das Bürgeramt nimmt nur den Antrag entgegen."
      },
      {
        "q": "Ein Feuerwehrmann fragt: ‚Wer ist in Deutschland in erster Linie Träger des örtlichen Brandschutzes?‘",
        "a": [
          "Der Bund über das THW",
          "Die Bundespolizei",
          "Die Städte und Gemeinden",
          "Die Berufsgenossenschaften"
        ],
        "c": 2,
        "e": "Der abwehrende Brandschutz ist nach den Feuerwehrgesetzen der Länder eine Pflichtaufgabe der Gemeinden."
      },
      {
        "q": "Eine Bauunternehmerin fragt: ‚Wer kontrolliert Baustellen auf Schwarzarbeit und Mindestlohnverstöße?‘",
        "a": [
          "Die Finanzkontrolle Schwarzarbeit des Zolls",
          "Die Gewerbeaufsichtsämter der Länder",
          "Die Bundesagentur für Arbeit vor Ort",
          "Das Bundeskriminalamt mit Sonderteams"
        ],
        "c": 0,
        "e": "Die Finanzkontrolle Schwarzarbeit (FKS) gehört zum Zoll und prüft unter anderem Schwarzarbeit und die Einhaltung des Mindestlohns."
      },
      {
        "q": "Ein Pendler fragt: ‚Welche Polizei ist auf den Bahnhöfen der Deutschen Bahn zuständig?‘",
        "a": [
          "Die Bundespolizei",
          "Die Landespolizei",
          "Allein die DB Sicherheit",
          "Der Zoll"
        ],
        "c": 0,
        "e": "Die Bundespolizei nimmt die bahnpolizeilichen Aufgaben auf den Bahnanlagen des Bundes wahr."
      },
      {
        "q": "Eine 16-jährige Schülerin fragt: ‚Muss ich meinen Personalausweis immer bei mir tragen?‘",
        "a": [
          "Ja, ab 16 Jahren immer",
          "Ja, aber erst ab 18 Jahren",
          "Nein, ich muss ihn nur besitzen",
          "Nur bei Fahrten mit Bus und Bahn"
        ],
        "c": 2,
        "e": "Ab 16 Jahren muss man einen gültigen Ausweis besitzen; eine allgemeine Pflicht, ihn ständig mitzuführen, gibt es nicht."
      },
      {
        "q": "Ein Hausmeister fragt: ‚Wann findet der bundesweite Warntag regulär statt?‘",
        "a": [
          "Am ersten Samstag im Mai",
          "Am zweiten Donnerstag im September",
          "Am ersten Montag im März",
          "Am letzten Freitag im Oktober"
        ],
        "c": 1,
        "e": "Der bundesweite Warntag ist jährlich am zweiten Donnerstag im September; dabei werden Sirenen, Warn-Apps und Cell Broadcast getestet."
      },
      {
        "q": "Eine Seniorin fragt: ‚Über welches System bekomme ich Warnmeldungen aufs Handy, auch ganz ohne App?‘",
        "a": [
          "Bluetooth-Funk",
          "Near Field Communication",
          "Premium-SMS-Dienst",
          "Cell Broadcast"
        ],
        "c": 3,
        "e": "Seit Februar 2023 werden Warnungen in Deutschland per Cell Broadcast an alle eingeschalteten Handys in einer Funkzelle verschickt."
      },
      {
        "q": "Ein Bäcker fragt: ‚Was sind Schöffen an einem Strafgericht?‘",
        "a": [
          "Gerichtlich bestellte Pflichtverteidiger",
          "Ehrenamtliche Richterinnen und Richter",
          "Protokollführer in der Verhandlung",
          "Gutachter zur Schuldfähigkeit"
        ],
        "c": 1,
        "e": "Schöffen sind ehrenamtliche Richter, die gleichberechtigt mit Berufsrichtern über Schuld und Strafe entscheiden."
      },
      {
        "q": "Ein Student fragt: ‚Bis wann gilt ein Angeklagter rechtlich als unschuldig?‘",
        "a": [
          "Bis zur rechtskräftigen Verurteilung",
          "Bis zur Erhebung der Anklage",
          "Bis zur Festnahme durch die Polizei",
          "Bis zur Eröffnung des Hauptverfahrens"
        ],
        "c": 0,
        "e": "Nach der Unschuldsvermutung (Art. 6 EMRK) gilt jeder bis zum gesetzlichen Nachweis seiner Schuld, also bis zur rechtskräftigen Verurteilung, als unschuldig."
      },
      {
        "q": "Ein Lkw-Fahrer fragt: ‚In welcher Stadt hat die internationale Polizeiorganisation Interpol ihren Sitz?‘",
        "a": [
          "Genf",
          "Brüssel",
          "Wien",
          "Lyon"
        ],
        "c": 3,
        "e": "Das Generalsekretariat von Interpol befindet sich in Lyon in Frankreich."
      },
      {
        "q": "Eine Zollbeamtin fragt: ‚Wo hat die EU-Grenzschutzagentur Frontex ihren Sitz?‘",
        "a": [
          "Brüssel",
          "Luxemburg",
          "Warschau",
          "Straßburg"
        ],
        "c": 2,
        "e": "Die Europäische Agentur für die Grenz- und Küstenwache (Frontex) hat ihren Sitz in Warschau."
      }
    ],
    "bildung": [
      {
        "q": "Eine Mutter fragt: ‚Wie viele Jahre dauert die Vollzeitschulpflicht in Deutschland?‘",
        "a": [
          "Sieben oder acht Jahre",
          "Neun oder zehn Jahre",
          "Elf oder zwölf Jahre",
          "Genau dreizehn Jahre"
        ],
        "c": 1,
        "e": "Je nach Bundesland umfasst die Vollzeitschulpflicht neun oder zehn Schuljahre; danach folgt meist eine Berufsschulpflicht."
      },
      {
        "q": "Ein Oberstufenschüler fragt: ‚Wie viele Punkte gibt es in der gymnasialen Oberstufe pro Fach höchstens?‘",
        "a": [
          "10 Punkte",
          "20 Punkte",
          "100 Punkte",
          "15 Punkte"
        ],
        "c": 3,
        "e": "In der Oberstufe wird mit 0 bis 15 Punkten bewertet; 15 Punkte entsprechen der Note 1+."
      },
      {
        "q": "Ein Pfarrer fragt: ‚Welchen Status hat der Religionsunterricht an öffentlichen Schulen laut Grundgesetz?‘",
        "a": [
          "Ordentliches Lehrfach",
          "Freiwillige Arbeitsgemeinschaft",
          "Reines Wahlfach ab Klasse 10",
          "Außerschulisches Kirchenangebot"
        ],
        "c": 0,
        "e": "Art. 7 Abs. 3 GG bestimmt den Religionsunterricht an öffentlichen Schulen grundsätzlich als ordentliches Lehrfach, mit Ausnahmen etwa für Bremen."
      },
      {
        "q": "Ein Vater fragt: ‚Was darf eine private Ersatzschule laut Grundgesetz nicht fördern?‘",
        "a": [
          "Einen eigenen pädagogischen Ansatz",
          "Eine bestimmte religiöse Ausrichtung",
          "Eine Sonderung nach Besitzverhältnissen",
          "Den Unterricht in kleineren Klassen"
        ],
        "c": 2,
        "e": "Nach Art. 7 Abs. 4 GG werden Ersatzschulen nur genehmigt, wenn eine Sonderung der Schüler nach den Besitzverhältnissen der Eltern nicht gefördert wird."
      },
      {
        "q": "Eine Studentin fragt: ‚Seit welchem Jahr gibt es das BAföG?‘",
        "a": [
          "1949",
          "1962",
          "1971",
          "1990"
        ],
        "c": 2,
        "e": "Das Bundesausbildungsförderungsgesetz trat 1971 in Kraft."
      },
      {
        "q": "Ein Unternehmer fragt: ‚Wie hoch ist ein Deutschlandstipendium pro Monat?‘",
        "a": [
          "300 Euro",
          "150 Euro",
          "500 Euro",
          "800 Euro"
        ],
        "c": 0,
        "e": "Das Deutschlandstipendium beträgt 300 Euro im Monat; je die Hälfte tragen private Förderer und der Bund."
      },
      {
        "q": "Eine Ausbilderin fragt: ‚Welches Gesetz regelt die betriebliche Berufsausbildung?‘",
        "a": [
          "Das Schulgesetz des Landes",
          "Das Hochschulrahmengesetz",
          "Das Arbeitszeitgesetz",
          "Das Berufsbildungsgesetz"
        ],
        "c": 3,
        "e": "Das Berufsbildungsgesetz (BBiG) regelt die betriebliche Ausbildung; für Handwerksberufe ergänzt es die Handwerksordnung."
      },
      {
        "q": "Ein Handwerksmeister fragt: ‚Darf ich mit meinem Meisterbrief ohne Abitur studieren?‘",
        "a": [
          "Nein, das Abitur ist immer Pflicht",
          "Ja, mit allgemeinem Hochschulzugang",
          "Nur an privaten Hochschulen",
          "Nur nach einer Begabtenprüfung"
        ],
        "c": 1,
        "e": "Seit einem KMK-Beschluss von 2009 erhalten Meisterinnen und Meister eine allgemeine Hochschulzugangsberechtigung."
      },
      {
        "q": "Eine Personalerin fragt: ‚Auf welcher Stufe des Deutschen Qualifikationsrahmens steht der Meister?‘",
        "a": [
          "Stufe 6, wie der Bachelor",
          "Stufe 4, unter dem Bachelor",
          "Stufe 7, wie der Master",
          "Stufe 8, wie die Promotion"
        ],
        "c": 0,
        "e": "Im Deutschen Qualifikationsrahmen (DQR) sind Meister und Bachelor gleichermaßen der Niveaustufe 6 zugeordnet."
      },
      {
        "q": "Eine Abiturientin fragt: ‚Wer vergibt bundesweit die Studienplätze in Medizin?‘",
        "a": [
          "Die Kassenärztliche Bundesvereinigung",
          "Das Bundesgesundheitsministerium",
          "Die Stiftung für Hochschulzulassung",
          "Die Kultusministerkonferenz"
        ],
        "c": 2,
        "e": "Studienplätze in Medizin, Zahnmedizin, Tiermedizin und Pharmazie vergibt die Stiftung für Hochschulzulassung (hochschulstart.de) in Dortmund."
      },
      {
        "q": "Ein Erstsemester fragt: ‚Wie viele ECTS-Punkte umfasst ein Studienjahr in Vollzeit regulär?‘",
        "a": [
          "30",
          "60",
          "120",
          "180"
        ],
        "c": 1,
        "e": "Ein Vollzeit-Studienjahr umfasst 60 ECTS-Leistungspunkte, ein Bachelorstudium meist 180 bis 240."
      },
      {
        "q": "Eine Neuntklässlerin fragt: ‚Nach welcher Klasse erwirbt man regulär den mittleren Schulabschluss?‘",
        "a": [
          "Nach der 8. Klasse",
          "Nach der 9. Klasse",
          "Nach der 12. Klasse",
          "Nach der 10. Klasse"
        ],
        "c": 3,
        "e": "Der mittlere Schulabschluss (Realschulabschluss) wird in der Regel nach Klasse 10 erworben."
      },
      {
        "q": "Ein Kita-Leiter fragt: ‚In welchem Sozialgesetzbuch ist die Kindertagesbetreuung bundesrechtlich geregelt?‘",
        "a": [
          "SGB II – Grundsicherung für Arbeitsuchende",
          "SGB V – Gesetzliche Krankenversicherung",
          "SGB XII – Sozialhilfe",
          "SGB VIII – Kinder- und Jugendhilfe"
        ],
        "c": 3,
        "e": "Die Förderung in Kitas und Kindertagespflege ist im Achten Buch Sozialgesetzbuch (Kinder- und Jugendhilfe) geregelt."
      },
      {
        "q": "Eine Krankenpflegerin fragt: ‚Wie viele Tage Bildungsurlaub pro Jahr sehen die meisten Landesgesetze vor?‘",
        "a": [
          "Zwei Arbeitstage",
          "Fünf Arbeitstage",
          "Zehn Arbeitstage",
          "Fünfzehn Arbeitstage"
        ],
        "c": 1,
        "e": "Die meisten Länder gewähren fünf Arbeitstage Bildungsurlaub pro Jahr; Bayern und Sachsen haben kein Bildungsurlaubsgesetz."
      },
      {
        "q": "Ein Professor fragt: ‚Welches Gremium berät Bund und Länder zur Entwicklung von Hochschulen und Wissenschaft?‘",
        "a": [
          "Der Bundesrat",
          "Der Deutsche Ethikrat",
          "Der Wissenschaftsrat",
          "Der Sachverständigenrat"
        ],
        "c": 2,
        "e": "Der 1957 gegründete Wissenschaftsrat berät Bund und Länder in Fragen der Hochschulen, der Wissenschaft und der Forschung."
      },
      {
        "q": "Eine Schulleiterin fragt: ‚Wie viele Kinder und Jugendliche besuchen in Deutschland ungefähr allgemeinbildende Schulen?‘",
        "a": [
          "Rund 11 Millionen",
          "Rund 4 Millionen",
          "Rund 18 Millionen",
          "Rund 25 Millionen"
        ],
        "c": 0,
        "e": "An allgemeinbildenden Schulen in Deutschland lernen seit Jahren rund 11 Millionen Schülerinnen und Schüler."
      },
      {
        "q": "Eine Bürgermeisterin fragt: ‚Wie viele Hochschulen gibt es in Deutschland ungefähr?‘",
        "a": [
          "Rund 90",
          "Rund 1.100",
          "Rund 420",
          "Rund 2.500"
        ],
        "c": 2,
        "e": "Deutschland hat rund 420 staatliche und private Hochschulen, darunter gut 100 Universitäten."
      },
      {
        "q": "Ein Journalist fragt: ‚Wie viele Studierende sind in Deutschland ungefähr eingeschrieben?‘",
        "a": [
          "Rund 1 Million",
          "Rund 5 Millionen",
          "Rund 8 Millionen",
          "Knapp 3 Millionen"
        ],
        "c": 3,
        "e": "In Deutschland sind seit einigen Jahren knapp drei Millionen Studierende eingeschrieben."
      },
      {
        "q": "Eine Lehramtsstudentin fragt: ‚Was folgt nach dem Lehramtsstudium als zweite Ausbildungsphase?‘",
        "a": [
          "Das Referendariat",
          "Ein Promotionsstudium",
          "Ein Praxissemester im Ausland",
          "Eine Prüfung bei der KMK"
        ],
        "c": 0,
        "e": "Nach dem Studium folgt der Vorbereitungsdienst (Referendariat), der mit dem Zweiten Staatsexamen abschließt."
      },
      {
        "q": "Ein Auszubildender fragt: ‚Wie lange darf die Probezeit in einer Berufsausbildung dauern?‘",
        "a": [
          "Immer genau sechs Monate",
          "Einen bis vier Monate",
          "Bis zu zwölf Monate",
          "Höchstens zwei Wochen"
        ],
        "c": 1,
        "e": "Nach § 20 BBiG beträgt die Probezeit in der Ausbildung mindestens einen und höchstens vier Monate."
      }
    ],
    "digitales": [
      {
        "q": "Ein Rentner fragt: ‚Wie schnell muss ein Unternehmen meine Auskunftsanfrage nach der DSGVO grundsätzlich beantworten?‘",
        "a": [
          "Innerhalb von drei Tagen",
          "Innerhalb eines halben Jahres",
          "Es gibt keine feste Frist",
          "Innerhalb eines Monats"
        ],
        "c": 3,
        "e": "Nach Art. 12 DSGVO ist die Auskunft grundsätzlich innerhalb eines Monats zu erteilen; in Ausnahmefällen kann die Frist verlängert werden."
      },
      {
        "q": "Eine Webdesignerin fragt: ‚Welches deutsche Gesetz regelt die Einwilligung in Cookies auf Endgeräten?‘",
        "a": [
          "Das Telemediengesetz",
          "Das TDDDG",
          "Das Urheberrechtsgesetz",
          "Das Produkthaftungsgesetz"
        ],
        "c": 1,
        "e": "§ 25 des Telekommunikation-Digitale-Dienste-Datenschutz-Gesetzes (früher TTDSG) verlangt für nicht notwendige Cookies grundsätzlich eine Einwilligung."
      },
      {
        "q": "Ein Online-Händler fragt: ‚Wie lange haben Verbraucher bei Online-Käufen grundsätzlich ein Widerrufsrecht?‘",
        "a": [
          "7 Tage",
          "30 Tage",
          "14 Tage",
          "2 Jahre"
        ],
        "c": 2,
        "e": "Bei Fernabsatzverträgen haben Verbraucher in der EU grundsätzlich ein 14-tägiges Widerrufsrecht."
      },
      {
        "q": "Eine Gamerin fragt: ‚Was müssen Verkäufer digitaler Produkte seit 2022 bereitstellen?‘",
        "a": [
          "Nötige Updates, etwa für Sicherheit",
          "Lebenslangen kostenlosen Support",
          "Ein Jahr Geld-zurück-Garantie",
          "Kostenlose Upgrades auf neue Versionen"
        ],
        "c": 0,
        "e": "Seit 2022 gilt im BGB eine Aktualisierungspflicht: Verkäufer müssen für einen angemessenen Zeitraum funktionserhaltende und Sicherheitsupdates bereitstellen."
      },
      {
        "q": "Ein Student fragt: ‚Seit wann telefoniert und surft man im EU-Ausland zu Inlandspreisen?‘",
        "a": [
          "Seit Juni 2017",
          "Seit Januar 2010",
          "Seit Mai 2014",
          "Seit März 2021"
        ],
        "c": 0,
        "e": "Die Regel „Roam like at home“ gilt seit dem 15. Juni 2017 und wurde 2022 bis 2032 verlängert."
      },
      {
        "q": "Eine Elektronikverkäuferin fragt: ‚Welcher Ladeanschluss ist seit Ende 2024 für neue Handys in der EU vorgeschrieben?‘",
        "a": [
          "Micro-USB",
          "Lightning",
          "USB-C",
          "Mini-USB"
        ],
        "c": 2,
        "e": "Seit dem 28. Dezember 2024 müssen neue Smartphones, Tablets und viele weitere Geräte in der EU einen USB-C-Ladeanschluss haben."
      },
      {
        "q": "Ein Gründer fragt: ‚Wer verwaltet die Internetadressen mit der Endung .de?‘",
        "a": [
          "Die Bundesnetzagentur in Bonn",
          "Die DENIC eG in Frankfurt",
          "Das BSI in Bonn",
          "Die ICANN in Kalifornien"
        ],
        "c": 1,
        "e": "Die Top-Level-Domain .de wird von der Genossenschaft DENIC mit Sitz in Frankfurt am Main verwaltet."
      },
      {
        "q": "Eine Bankkauffrau fragt: ‚Was versteht man unter Zwei-Faktor-Authentifizierung?‘",
        "a": [
          "Ein Passwort, das man zweimal eintippt",
          "Zwei verschiedene Passwörter pro Gerät",
          "Verschlüsselung mit zwei Schlüssellängen",
          "Anmeldung mit zwei unabhängigen Merkmalen"
        ],
        "c": 3,
        "e": "Bei der Zwei-Faktor-Authentifizierung werden zwei unabhängige Faktoren wie Wissen (Passwort) und Besitz (Smartphone) kombiniert."
      },
      {
        "q": "Ein Notar fragt: ‚Welche elektronische Signatur ist nach EU-Recht der handschriftlichen Unterschrift gleichgestellt?‘",
        "a": [
          "Die einfache elektronische Signatur",
          "Eine eingescannte Unterschrift",
          "Die qualifizierte Signatur",
          "Die fortgeschrittene Signatur"
        ],
        "c": 2,
        "e": "Nach der eIDAS-Verordnung hat nur die qualifizierte elektronische Signatur die Rechtswirkung einer handschriftlichen Unterschrift."
      },
      {
        "q": "Ein Streamer fragt: ‚Was bedeutet Netzneutralität?‘",
        "a": [
          "Provider behandeln Datenverkehr gleich",
          "Netze gehören vollständig dem Staat",
          "Anbieter dürfen keine Werbung zeigen",
          "Alle Anschlüsse kosten überall dasselbe"
        ],
        "c": 0,
        "e": "Nach der EU-Verordnung 2015/2120 müssen Internetanbieter den Datenverkehr grundsätzlich gleich behandeln, unabhängig von Absender, Empfänger und Inhalt."
      },
      {
        "q": "Eine Lehrerin fragt: ‚Wie viele Stellen hat die selbst gewählte PIN für die Online-Ausweisfunktion?‘",
        "a": [
          "Vier",
          "Fünf",
          "Acht",
          "Sechs"
        ],
        "c": 3,
        "e": "Die persönliche PIN der Online-Ausweisfunktion ist sechsstellig; die fünfstellige Transport-PIN dient nur der Ersteinrichtung."
      },
      {
        "q": "Ein Landwirt fragt: ‚Was regelt der EU Data Act, der seit September 2025 gilt?‘",
        "a": [
          "Steuern auf digitale Werbung",
          "Zugang zu Daten vernetzter Geräte",
          "Ein Verbot der Gesichtserkennung",
          "Mindestbandbreiten im Mobilfunk"
        ],
        "c": 1,
        "e": "Der Data Act gibt Nutzern vernetzter Produkte wie Maschinen oder Autos Rechte auf Zugang zu den erzeugten Daten und gilt seit dem 12. September 2025."
      },
      {
        "q": "Eine Softwareentwicklerin fragt: ‚Was verlangt der Cyber Resilience Act der EU?‘",
        "a": [
          "Ein Verbot anonymer Nutzerkonten",
          "Sicherheitsvorgaben für vernetzte Produkte",
          "Offenen Quellcode für jede App",
          "Altersprüfungen in sozialen Netzwerken"
        ],
        "c": 1,
        "e": "Der Cyber Resilience Act schreibt Cybersicherheitsanforderungen für Produkte mit digitalen Elementen über ihren gesamten Lebenszyklus vor."
      },
      {
        "q": "Ein Vater fragt: ‚Ab welchem Alter dürfen Kinder in Deutschland selbst in die Datenverarbeitung durch Online-Dienste einwilligen?‘",
        "a": [
          "Ab 12 Jahren",
          "Ab 14 Jahren",
          "Ab 18 Jahren",
          "Ab 16 Jahren"
        ],
        "c": 3,
        "e": "Art. 8 DSGVO setzt die Grenze bei 16 Jahren; Deutschland hat keine niedrigere Altersgrenze festgelegt."
      },
      {
        "q": "Eine Ladenbesitzerin fragt: ‚Wer beaufsichtigt den Datenschutz bei privaten Unternehmen grundsätzlich?‘",
        "a": [
          "Die Datenschutzbehörden der Länder",
          "Die Bundesnetzagentur",
          "Das Bundeskartellamt",
          "Die Verbraucherzentralen der Länder"
        ],
        "c": 0,
        "e": "Für Unternehmen sind grundsätzlich die Landesdatenschutzbehörden zuständig; der Bundesdatenschutzbeauftragte vor allem für Bundesbehörden sowie Telekommunikations- und Postdienste."
      },
      {
        "q": "Ein IT-Leiter fragt: ‚In welcher Frist muss eine Datenpanne in der Regel der Aufsichtsbehörde gemeldet werden?‘",
        "a": [
          "Binnen 24 Stunden",
          "Binnen sieben Tagen",
          "Binnen 72 Stunden",
          "Binnen 30 Tagen"
        ],
        "c": 2,
        "e": "Nach Art. 33 DSGVO ist eine Verletzung des Schutzes personenbezogener Daten möglichst binnen 72 Stunden nach Bekanntwerden zu melden."
      },
      {
        "q": "Eine Kundin fragt: ‚Was erlaubt mir das Recht auf Datenübertragbarkeit?‘",
        "a": [
          "Meine Daten in gängigem Format mitnehmen",
          "Gelöschte Daten zurückholen lassen",
          "Den Mobilfunkvertrag sofort kündigen",
          "Daten nur verschlüsselt speichern lassen"
        ],
        "c": 0,
        "e": "Nach Art. 20 DSGVO kann man bereitgestellte Daten in einem strukturierten, gängigen und maschinenlesbaren Format erhalten und an andere Anbieter übermitteln lassen."
      },
      {
        "q": "Ein Selbstständiger fragt: ‚Wie heißt das offizielle Online-Portal der Finanzverwaltung für Steuererklärungen?‘",
        "a": [
          "DATEV",
          "ELSTER",
          "FinanzBox",
          "SteuerNet"
        ],
        "c": 1,
        "e": "Über das Portal ELSTER (Elektronische Steuererklärung) können Steuererklärungen kostenlos online an das Finanzamt übermittelt werden."
      },
      {
        "q": "Eine Psychotherapeutin fragt: ‚Was sind DiGA?‘",
        "a": [
          "Digitale Arztbriefe der Kliniken",
          "Datenbanken der Gesundheitsämter",
          "Gesundheits-Apps auf Rezept",
          "Diagnose-Software in Krankenhäusern"
        ],
        "c": 2,
        "e": "Seit 2020 können Ärzte und Psychotherapeuten geprüfte Digitale Gesundheitsanwendungen (DiGA) verordnen, die Krankenkassen übernehmen die Kosten."
      },
      {
        "q": "Ein Fotograf fragt: ‚Wer ist nach der EU-Urheberrechtsreform von 2019 für Uploads auf großen Plattformen verantwortlich?‘",
        "a": [
          "Allein die hochladende Person",
          "Der jeweilige Internetanbieter",
          "Die zuständige Verwertungsgesellschaft",
          "Die Plattform selbst"
        ],
        "c": 3,
        "e": "Nach Art. 17 der Urheberrechtsrichtlinie (in Deutschland im Urheberrechts-Diensteanbieter-Gesetz umgesetzt) sind große Upload-Plattformen selbst urheberrechtlich verantwortlich."
      }
    ],
    "wohnen": [
      {
        "q": "Eine Mieterin fragt: ‚Muss der Vermieter eine Mietminderung wegen eines Mangels erst genehmigen?‘",
        "a": [
          "Nein, sie gilt kraft Gesetzes",
          "Ja, immer schriftlich vorab",
          "Ja, durch das Amtsgericht",
          "Nur mit Sachverständigengutachten"
        ],
        "c": 0,
        "e": "Nach § 536 BGB mindert sich die Miete bei einem erheblichen Mangel automatisch; der Mangel muss dem Vermieter aber angezeigt werden."
      },
      {
        "q": "Ein Student fragt: ‚Ist eine Mietvertragsklausel mit starren Fristen für Schönheitsreparaturen wirksam?‘",
        "a": [
          "Ja, bei Fristen von fünf Jahren",
          "Ja, wenn sie fett gedruckt ist",
          "Nein, sie ist unwirksam",
          "Nur bei Altbauwohnungen"
        ],
        "c": 2,
        "e": "Der BGH hält formularmäßige Renovierungsklauseln mit starren Fristen für unwirksam, weil sie den tatsächlichen Zustand der Wohnung nicht berücksichtigen."
      },
      {
        "q": "Eine Rentnerin will wissen: ‚Darf ich ein Zimmer meiner Mietwohnung einfach untervermieten?‘",
        "a": [
          "Ja, ganz ohne jede Erlaubnis",
          "Nur mit Erlaubnis des Vermieters",
          "Nein, das ist grundsätzlich verboten",
          "Nur an nahe Familienangehörige"
        ],
        "c": 1,
        "e": "Untervermietung braucht die Erlaubnis des Vermieters; bei berechtigtem Interesse hat der Mieter nach § 553 BGB aber meist einen Anspruch darauf."
      },
      {
        "q": "Ein Auszubildender fragt: ‚Darf ich die Mietkaution in Raten zahlen?‘",
        "a": [
          "Nein, nur in einer Summe",
          "Ja, in zwölf Monatsraten",
          "Nur mit Bürgschaft der Eltern",
          "Ja, in drei Monatsraten"
        ],
        "c": 3,
        "e": "Nach § 551 BGB darf der Mieter die Kaution in drei gleichen monatlichen Teilzahlungen leisten."
      },
      {
        "q": "Ein Mieter fragt: ‚Wie lange habe ich Zeit, einer Mieterhöhung auf die Vergleichsmiete zuzustimmen?‘",
        "a": [
          "Eine Woche nach dem Zugang",
          "Genau 14 Tage nach dem Zugang",
          "Bis zum Ende des laufenden Mietjahres",
          "Bis Ende des zweiten Folgemonats"
        ],
        "c": 3,
        "e": "Nach § 558b BGB hat der Mieter bis zum Ablauf des zweiten Kalendermonats nach Zugang des Erhöhungsverlangens Zeit zur Zustimmung."
      },
      {
        "q": "Eine Krankenschwester fragt: ‚Wann frühestens nach meinem Einzug darf eine Mieterhöhung auf die Vergleichsmiete wirksam werden?‘",
        "a": [
          "Nach 6 Monaten",
          "Nach 15 Monaten",
          "Nach 12 Monaten",
          "Nach 24 Monaten"
        ],
        "c": 1,
        "e": "Ein Erhöhungsverlangen ist frühestens ein Jahr nach Einzug zulässig und wird erst nach der Überlegungsfrist, also frühestens nach 15 Monaten, wirksam."
      },
      {
        "q": "Ein Familienvater fragt: ‚Welche Kündigungsfrist gilt für den Vermieter nach mehr als acht Jahren Mietdauer?‘",
        "a": [
          "Drei Monate",
          "Sechs Monate",
          "Neun Monate",
          "Zwölf Monate"
        ],
        "c": 2,
        "e": "Nach § 573c BGB verlängert sich die Kündigungsfrist des Vermieters nach fünf Jahren auf sechs und nach acht Jahren auf neun Monate."
      },
      {
        "q": "Eine Studentin fragt: ‚Kann ich meine Wohnung wirksam per E-Mail kündigen?‘",
        "a": [
          "Nein, es gilt die Schriftform",
          "Ja, eine E-Mail reicht immer",
          "Ja, mit Lesebestätigung",
          "Ja, per Messenger mit Foto des Briefs"
        ],
        "c": 0,
        "e": "Nach § 568 BGB muss die Kündigung eines Wohnraummietvertrags schriftlich mit eigenhändiger Unterschrift erfolgen."
      },
      {
        "q": "Ein Vermieter fragt: ‚Ab welchem Mietrückstand ist eine fristlose Kündigung grundsätzlich möglich?‘",
        "a": [
          "Eine halbe Monatsmiete",
          "Zwei Monatsmieten",
          "Sechs Monatsmieten",
          "Eine volle Jahresmiete"
        ],
        "c": 1,
        "e": "Nach § 543 BGB kann fristlos gekündigt werden, wenn der Rückstand zwei Monatsmieten erreicht oder an zwei aufeinanderfolgenden Terminen mehr als eine Monatsmiete beträgt."
      },
      {
        "q": "Ein junges Paar fragt: ‚Wer legt die Höhe der Grunderwerbsteuer fest?‘",
        "a": [
          "Der Bund einheitlich",
          "Die Städte und Gemeinden",
          "Die Notarkammern",
          "Die Bundesländer"
        ],
        "c": 3,
        "e": "Seit 2006 legen die Länder den Steuersatz der Grunderwerbsteuer selbst fest; er liegt zwischen 3,5 und 6,5 Prozent."
      },
      {
        "q": "Eine Käuferin fragt: ‚Was ist für einen wirksamen Grundstückskaufvertrag zwingend nötig?‘",
        "a": [
          "Die notarielle Beurkundung",
          "Eine Bankbürgschaft",
          "Ein schriftlicher Maklervertrag",
          "Ein amtliches Wertgutachten"
        ],
        "c": 0,
        "e": "Nach § 311b BGB muss ein Vertrag über den Kauf eines Grundstücks notariell beurkundet werden."
      },
      {
        "q": "Ein Erbe fragt: ‚Bei welcher Stelle wird das Grundbuch geführt?‘",
        "a": [
          "Beim Finanzamt",
          "Beim Katasteramt",
          "Beim Amtsgericht",
          "Beim Vermessungsamt"
        ],
        "c": 2,
        "e": "Das Grundbuch wird von den Grundbuchämtern geführt, die bei den Amtsgerichten angesiedelt sind."
      },
      {
        "q": "Eine Mieterin fragt: ‚Welcher Anteil der Heizkosten muss im Mehrfamilienhaus nach Verbrauch abgerechnet werden?‘",
        "a": [
          "10 bis 30 Prozent",
          "80 bis 90 Prozent",
          "50 bis 70 Prozent",
          "Genau 100 Prozent"
        ],
        "c": 2,
        "e": "Nach der Heizkostenverordnung sind mindestens 50 und höchstens 70 Prozent der Heizkosten verbrauchsabhängig zu verteilen."
      },
      {
        "q": "Ein Hausverkäufer fragt: ‚Wie lange ist ein Energieausweis für ein Gebäude gültig?‘",
        "a": [
          "Zehn Jahre",
          "Zwei Jahre",
          "Fünf Jahre",
          "Unbegrenzt"
        ],
        "c": 0,
        "e": "Energieausweise nach dem Gebäudeenergiegesetz sind zehn Jahre gültig und müssen bei Verkauf oder Vermietung vorgelegt werden."
      },
      {
        "q": "Ein Mieter fragt: ‚Wie werden seit 2023 die CO₂-Kosten fürs Heizen zwischen Mieter und Vermieter aufgeteilt?‘",
        "a": [
          "Immer genau zur Hälfte",
          "Vollständig durch den Mieter",
          "Nach der Zahl der gemeldeten Bewohner",
          "Nach Energieeffizienz des Gebäudes"
        ],
        "c": 3,
        "e": "Nach dem CO₂-Kostenaufteilungsgesetz gilt ein Stufenmodell: Je schlechter die Energiebilanz des Gebäudes, desto mehr trägt der Vermieter."
      },
      {
        "q": "Ein Architekt fragt: ‚Wie wird ein Balkon bei der Wohnflächenberechnung in der Regel angerechnet?‘",
        "a": [
          "Gar nicht",
          "Zu einem Viertel",
          "Zu einem Drittel",
          "Vollständig"
        ],
        "c": 1,
        "e": "Nach der Wohnflächenverordnung werden Balkone und Terrassen in der Regel zu einem Viertel, höchstens zur Hälfte angerechnet."
      },
      {
        "q": "Eine Katzenbesitzerin fragt: ‚Darf ein Formularmietvertrag Hunde und Katzen generell verbieten?‘",
        "a": [
          "Ja, das ist immer zulässig",
          "Nur in Wohnungen unter 60 m²",
          "Nur in Neubauten ab dem Jahr 2010",
          "Nein, das Pauschalverbot ist unwirksam"
        ],
        "c": 3,
        "e": "Der BGH entschied 2013, dass ein generelles Hunde- und Katzenverbot im Formularmietvertrag unwirksam ist; es kommt auf eine Abwägung im Einzelfall an."
      },
      {
        "q": "Ein Lehrer fragt: ‚Wie viel Zeit muss bei einer Staffelmiete mindestens zwischen zwei Erhöhungen liegen?‘",
        "a": [
          "Drei Monate",
          "Sechs Monate",
          "Ein Jahr",
          "Drei Jahre"
        ],
        "c": 2,
        "e": "Nach § 557a BGB muss die Miete bei einer Staffelmiete jeweils mindestens ein Jahr unverändert bleiben."
      },
      {
        "q": "Eine Vermieterin fragt: ‚Darf die Grundsteuer über die Nebenkosten auf Mieter umgelegt werden?‘",
        "a": [
          "Nein, unter keinen Umständen",
          "Ja, wenn es vereinbart ist",
          "Nur zur Hälfte",
          "Nur bei Gewerbemietern"
        ],
        "c": 1,
        "e": "Die Grundsteuer gehört nach der Betriebskostenverordnung zu den umlagefähigen Betriebskosten, sofern der Mietvertrag die Umlage vorsieht."
      },
      {
        "q": "Ein Mieter fragt: ‚Welches Recht habe ich, wenn meine Mietwohnung in eine Eigentumswohnung umgewandelt und verkauft wird?‘",
        "a": [
          "Ein gesetzliches Vorkaufsrecht",
          "Ein Anspruch auf 20 Prozent Rabatt",
          "Ein lebenslanges Wohnrecht",
          "Eine gesetzliche Abfindung"
        ],
        "c": 0,
        "e": "Nach § 577 BGB hat der Mieter beim ersten Verkauf einer umgewandelten Wohnung ein Vorkaufsrecht zu den Bedingungen des Kaufvertrags."
      }
    ],
    "verteidigung": [
      {
        "q": "Ein Zivildienstleistender von damals fragt: ‚Wo ist das Recht verankert, den Kriegsdienst mit der Waffe aus Gewissensgründen zu verweigern?‘",
        "a": [
          "Im Soldatengesetz",
          "Im Wehrpflichtgesetz",
          "Im Grundgesetz (Artikel 4)",
          "In der Europäischen Sozialcharta"
        ],
        "c": 2,
        "e": "Artikel 4 Absatz 3 des Grundgesetzes garantiert, dass niemand gegen sein Gewissen zum Kriegsdienst mit der Waffe gezwungen werden darf."
      },
      {
        "q": "Eine Feuerwehrfrau aus dem Ahrtal fragt: ‚Auf welcher Grundlage darf die Bundeswehr bei einer Flutkatastrophe im Inland helfen?‘",
        "a": [
          "Amtshilfe und Katastrophenhilfe nach Art. 35 GG",
          "Nur nach Ausrufung des Verteidigungsfalls",
          "Auf Grundlage eines NATO-Beschlusses",
          "Durch Anordnung des Bundesrates allein"
        ],
        "c": 0,
        "e": "Nach Artikel 35 Grundgesetz kann die Bundeswehr bei Naturkatastrophen und schweren Unglücksfällen zur Hilfe angefordert werden."
      },
      {
        "q": "Ein Politikstudent fragt: ‚Welcher Bundestagsausschuss kann sich laut Grundgesetz selbst als Untersuchungsausschuss einsetzen?‘",
        "a": [
          "Der Auswärtige Ausschuss",
          "Der Haushaltsausschuss",
          "Der Innenausschuss",
          "Der Verteidigungsausschuss"
        ],
        "c": 3,
        "e": "Artikel 45a Grundgesetz gibt dem Verteidigungsausschuss die Rechte eines Untersuchungsausschusses."
      },
      {
        "q": "Ein junger Offiziersanwärter will wissen: ‚Wie heißt das Leitbild der Bundeswehr vom „Staatsbürger in Uniform“?‘",
        "a": [
          "Auftragstaktik",
          "Innere Führung",
          "Wehrhafte Demokratie",
          "Primat der Politik"
        ],
        "c": 1,
        "e": "Die Innere Führung ist die Führungsphilosophie der Bundeswehr mit dem Leitbild des Staatsbürgers in Uniform."
      },
      {
        "q": "Eine Abiturientin fragt: ‚In welchen Städten gibt es eigene Universitäten der Bundeswehr?‘",
        "a": [
          "Koblenz und Bonn",
          "Hamburg und München",
          "Berlin und Dresden",
          "Hannover und Köln"
        ],
        "c": 1,
        "e": "Die Bundeswehr unterhält die Helmut-Schmidt-Universität in Hamburg und die Universität der Bundeswehr München."
      },
      {
        "q": "Ein Wachmann einer Kaserne fragt: ‚Welcher Nachrichtendienst schützt die Bundeswehr vor Spionage und Extremismus?‘",
        "a": [
          "Der Bundesnachrichtendienst (BND)",
          "Das Bundeskriminalamt (BKA)",
          "Die Bundespolizei",
          "Der Militärische Abschirmdienst (MAD)"
        ],
        "c": 3,
        "e": "Der Militärische Abschirmdienst ist der Nachrichtendienst für den Schutz der Bundeswehr."
      },
      {
        "q": "Ein Rentner beim Infostand fragt: ‚Welcher Stelle ist der Bundesnachrichtendienst direkt unterstellt?‘",
        "a": [
          "Dem Bundeskanzleramt",
          "Dem Verteidigungsministerium",
          "Dem Auswärtigen Amt",
          "Dem Bundesinnenministerium"
        ],
        "c": 0,
        "e": "Der BND ist eine Bundesoberbehörde im Geschäftsbereich des Bundeskanzleramts."
      },
      {
        "q": "Eine Ingenieurin aus der Rüstungsindustrie fragt: ‚Wer muss laut Grundgesetz Herstellung und Handel mit Kriegswaffen genehmigen?‘",
        "a": [
          "Der Bundestag",
          "Das Bundesverfassungsgericht",
          "Die Bundesregierung",
          "Das jeweilige Bundesland"
        ],
        "c": 2,
        "e": "Artikel 26 Absatz 2 Grundgesetz macht Kriegswaffen genehmigungspflichtig durch die Bundesregierung."
      },
      {
        "q": "Ein Friedensaktivist fragt: ‚Was sagt das Grundgesetz über die Vorbereitung eines Angriffskrieges?‘",
        "a": [
          "Sie ist nur mit UN-Mandat erlaubt",
          "Sie bedarf einer Zweidrittelmehrheit",
          "Dazu enthält es keine Regelung",
          "Sie ist verfassungswidrig und strafbar"
        ],
        "c": 3,
        "e": "Nach Artikel 26 Grundgesetz sind Handlungen zur Vorbereitung eines Angriffskrieges verfassungswidrig und unter Strafe zu stellen."
      },
      {
        "q": "Eine Lehrerin aus der Eifel fragt: ‚Auf welchem Fliegerhorst ist die nukleare Teilhabe der Luftwaffe angesiedelt?‘",
        "a": [
          "Ramstein im Saarland",
          "Büchel in Rheinland-Pfalz",
          "Laage in Mecklenburg",
          "Wunstorf in Niedersachsen"
        ],
        "c": 1,
        "e": "Das Taktische Luftwaffengeschwader 33 in Büchel (Rheinland-Pfalz) ist für die nukleare Teilhabe zuständig."
      },
      {
        "q": "Ein Flugzeugmechaniker fragt: ‚Mit welchen Ländern hat Deutschland den Eurofighter gemeinsam entwickelt?‘",
        "a": [
          "Frankreich, Italien und Belgien",
          "Schweden, Spanien und Polen",
          "Großbritannien, Italien und Spanien",
          "Frankreich, Großbritannien und Niederlande"
        ],
        "c": 2,
        "e": "Der Eurofighter Typhoon ist ein Gemeinschaftsprojekt von Deutschland, Großbritannien, Italien und Spanien."
      },
      {
        "q": "Ein Student aus Bonn fragt: ‚Welche deutsche Stadt ist Sitz eines eigenen UN-Campus mit zahlreichen UN-Organisationen?‘",
        "a": [
          "Bonn",
          "Hamburg",
          "Frankfurt am Main",
          "Berlin"
        ],
        "c": 0,
        "e": "Auf dem UN-Campus in Bonn arbeiten zahlreiche UN-Organisationen, etwa das Klimasekretariat."
      },
      {
        "q": "Eine Geschichtslehrerin fragt: ‚In welchem Jahr wurden beide deutsche Staaten Mitglied der Vereinten Nationen?‘",
        "a": [
          "1973",
          "1955",
          "1949",
          "1990"
        ],
        "c": 0,
        "e": "Die Bundesrepublik und die DDR wurden am 18. September 1973 in die UN aufgenommen."
      },
      {
        "q": "Ein Hotelier aus Bayern fragt: ‚In welchem Monat findet die Münchner Sicherheitskonferenz üblicherweise statt?‘",
        "a": [
          "Im Mai",
          "Im September",
          "Im Februar",
          "Im November"
        ],
        "c": 2,
        "e": "Die Münchner Sicherheitskonferenz tagt traditionell jedes Jahr im Februar."
      },
      {
        "q": "Ein Feldwebel fragt: ‚Wer ernennt laut Grundgesetz die Offiziere der Bundeswehr?‘",
        "a": [
          "Der Generalinspekteur",
          "Der Bundespräsident",
          "Der Bundestag",
          "Der Bundesrat"
        ],
        "c": 1,
        "e": "Nach Artikel 60 Grundgesetz ernennt und entlässt der Bundespräsident Offiziere und Unteroffiziere, soweit nicht delegiert."
      },
      {
        "q": "Eine Exportkauffrau fragt: ‚Warum heißt die Gruppe der großen Industriestaaten seit 2014 wieder G7 statt G8?‘",
        "a": [
          "Kanada ist freiwillig ausgetreten",
          "China hat die Mitgliedschaft abgelehnt",
          "Die EU hat ihren Sitz abgegeben",
          "Russland wurde nach der Krim-Annexion ausgeschlossen"
        ],
        "c": 3,
        "e": "Nach der Annexion der Krim 2014 wurde Russlands Teilnahme ausgesetzt, seitdem tagt wieder die G7."
      },
      {
        "q": "Ein Jurastudent fragt: ‚Wo hat der Internationale Strafgerichtshof seinen Sitz?‘",
        "a": [
          "Genf",
          "Straßburg",
          "New York",
          "Den Haag"
        ],
        "c": 3,
        "e": "Der Internationale Strafgerichtshof sitzt in Den Haag in den Niederlanden."
      },
      {
        "q": "Ein Schüler der Oberstufe fragt: ‚Ab welchem Alter dürfen Männer laut Grundgesetz zum Wehrdienst verpflichtet werden?‘",
        "a": [
          "Ab dem vollendeten 18. Lebensjahr",
          "Ab dem vollendeten 17. Lebensjahr",
          "Ab dem vollendeten 19. Lebensjahr",
          "Ab dem vollendeten 21. Lebensjahr"
        ],
        "c": 0,
        "e": "Artikel 12a Grundgesetz erlaubt die Dienstverpflichtung von Männern ab dem vollendeten 18. Lebensjahr."
      },
      {
        "q": "Eine Soldatin fragt: ‚Seit wann stehen Frauen alle Laufbahnen der Bundeswehr einschließlich des Dienstes an der Waffe offen?‘",
        "a": [
          "Seit 1975",
          "Seit 2001",
          "Seit 1990",
          "Seit 2011"
        ],
        "c": 1,
        "e": "Nach einem Urteil des Europäischen Gerichtshofs öffnete die Bundeswehr 2001 alle Laufbahnen für Frauen."
      },
      {
        "q": "Ein Veteran fragt: ‚Wie lange war die Bundeswehr ungefähr in Afghanistan im Einsatz?‘",
        "a": [
          "Rund 5 Jahre",
          "Rund 10 Jahre",
          "Rund 20 Jahre",
          "Rund 30 Jahre"
        ],
        "c": 2,
        "e": "Der Afghanistan-Einsatz der Bundeswehr dauerte von Ende 2001 bis Juni 2021."
      }
    ],
    "gesundheit": [
      {
        "q": "Ein Handwerker fragt: ‚Wie hoch ist das Krankengeld der gesetzlichen Krankenkasse in der Regel?‘",
        "a": [
          "50 % des Bruttolohns, höchstens 70 % des Nettos",
          "70 % des Bruttolohns, höchstens 90 % des Nettos",
          "100 % des Nettolohns für bis zu 18 Monate",
          "60 % des Nettolohns, mindestens 30 € täglich"
        ],
        "c": 1,
        "e": "Das Krankengeld beträgt 70 % des regelmäßigen Bruttoentgelts, aber höchstens 90 % des Nettoentgelts."
      },
      {
        "q": "Eine Verkäuferin fragt: ‚Wie lange zahlt mein Arbeitgeber bei Krankheit den Lohn weiter?‘",
        "a": [
          "Bis zu zwei Wochen",
          "Bis zu drei Monaten",
          "Bis zu einem halben Jahr",
          "Bis zu sechs Wochen"
        ],
        "c": 3,
        "e": "Nach dem Entgeltfortzahlungsgesetz zahlt der Arbeitgeber bis zu sechs Wochen den vollen Lohn weiter."
      },
      {
        "q": "Ein Azubi fragt: ‚Ab wann brauche ich gesetzlich eine ärztliche Arbeitsunfähigkeitsbescheinigung?‘",
        "a": [
          "Ab mehr als drei Kalendertagen Krankheit",
          "Bereits ab dem ersten Krankheitstag immer",
          "Erst ab einer Krankheit von zwei Wochen",
          "Nur bei Krankheiten länger als fünf Arbeitstage"
        ],
        "c": 0,
        "e": "Dauert die Arbeitsunfähigkeit länger als drei Kalendertage, ist spätestens am folgenden Arbeitstag eine Bescheinigung nötig; der Arbeitgeber kann sie früher verlangen."
      },
      {
        "q": "Eine Apothekerin wird gefragt: ‚Wie hoch ist die Zuzahlung für ein verschreibungspflichtiges Medikament?‘",
        "a": [
          "5 %, mindestens 2 € und höchstens 8 €",
          "Pauschal 15 € pro Packung",
          "10 %, mindestens 5 € und höchstens 10 €",
          "20 %, höchstens jedoch 25 €"
        ],
        "c": 2,
        "e": "Gesetzlich Versicherte zahlen 10 % des Preises, mindestens 5 Euro und höchstens 10 Euro je Mittel."
      },
      {
        "q": "Ein chronisch kranker Rentner fragt: ‚Wo liegt die Belastungsgrenze für Zuzahlungen bei chronisch Kranken?‘",
        "a": [
          "2 % der jährlichen Bruttoeinnahmen",
          "5 % der jährlichen Bruttoeinnahmen",
          "Pauschal 500 € pro Jahr",
          "1 % der jährlichen Bruttoeinnahmen"
        ],
        "c": 3,
        "e": "Die Belastungsgrenze liegt bei 2 % der Bruttoeinnahmen, für schwerwiegend chronisch Kranke bei 1 %."
      },
      {
        "q": "Eine junge Mutter fragt: ‚Was kostet es, mein Kind in der gesetzlichen Krankenkasse mitzuversichern?‘",
        "a": [
          "Nichts, es ist beitragsfrei mitversichert",
          "Einen halben Beitrag des versicherten Elternteils",
          "Einen festen Kinderbeitrag von 50 € im Monat",
          "Nur den Zusatzbeitrag der jeweiligen Kasse"
        ],
        "c": 0,
        "e": "Kinder ohne eigenes ausreichendes Einkommen sind in der GKV beitragsfrei familienversichert."
      },
      {
        "q": "Ein IT-Berater fragt: ‚Wann dürfen Angestellte in die private Krankenversicherung wechseln?‘",
        "a": [
          "Jederzeit nach fünf Jahren Mitgliedschaft in der GKV",
          "Nur mit schriftlicher Zustimmung des Arbeitgebers",
          "Bei Einkommen über der Pflichtgrenze",
          "Erst ab einem Lebensalter von 40 Jahren"
        ],
        "c": 2,
        "e": "Angestellte, deren Einkommen die Jahresarbeitsentgeltgrenze überschreitet, sind versicherungsfrei und können sich privat versichern."
      },
      {
        "q": "Eine Studentin fragt: ‚Welche Nummer wähle ich nachts für den ärztlichen Bereitschaftsdienst?‘",
        "a": [
          "110",
          "116117",
          "115",
          "19222"
        ],
        "c": 1,
        "e": "Der ärztliche Bereitschaftsdienst ist bundesweit unter 116117 erreichbar; 112 bleibt für Notfälle."
      },
      {
        "q": "Ein pflegender Sohn fragt: ‚Ab welchem Pflegegrad gibt es Pflegegeld für die Pflege durch Angehörige?‘",
        "a": [
          "Ab Pflegegrad 2",
          "Ab Pflegegrad 1",
          "Ab Pflegegrad 3",
          "Ab Pflegegrad 4"
        ],
        "c": 0,
        "e": "Pflegegeld wird ab Pflegegrad 2 gezahlt; bei Pflegegrad 1 gibt es nur den Entlastungsbetrag und einzelne Leistungen."
      },
      {
        "q": "Eine Bürokauffrau fragt: ‚Wie lange darf ich kurzfristig der Arbeit fernbleiben, um die Pflege eines Angehörigen akut zu organisieren?‘",
        "a": [
          "Bis zu drei Arbeitstage",
          "Bis zu sechs Wochen",
          "Bis zu zehn Arbeitstage",
          "Bis zu drei Monate"
        ],
        "c": 2,
        "e": "Bei einer akuten Pflegesituation können Beschäftigte bis zu zehn Arbeitstage fernbleiben und Pflegeunterstützungsgeld erhalten."
      },
      {
        "q": "Ein Kita-Leiter fragt: ‚Welche Bundesbehörde ist zentral für die Erkennung und Überwachung von Infektionskrankheiten zuständig?‘",
        "a": [
          "Das Paul-Ehrlich-Institut",
          "Das Umweltbundesamt",
          "Das Bundesinstitut für Risikobewertung",
          "Das Robert Koch-Institut"
        ],
        "c": 3,
        "e": "Das Robert Koch-Institut ist die zentrale Bundeseinrichtung für Infektionsschutz und Krankheitsüberwachung."
      },
      {
        "q": "Ein Pharmareferent fragt: ‚Welche Bundesbehörde lässt die meisten Arzneimittel in Deutschland zu?‘",
        "a": [
          "Das BVL in Braunschweig",
          "Das BfArM in Bonn",
          "Das RKI in Berlin",
          "Der G-BA in Berlin"
        ],
        "c": 1,
        "e": "Das BfArM in Bonn ist für die Zulassung der meisten Arzneimittel zuständig, Impfstoffe und Blutprodukte prüft das Paul-Ehrlich-Institut."
      },
      {
        "q": "Eine Hausärztin fragt: ‚Welches Gesetz regelt, welche Krankheiten dem Gesundheitsamt gemeldet werden müssen?‘",
        "a": [
          "Das Arzneimittelgesetz",
          "Das Infektionsschutzgesetz",
          "Das Sozialgesetzbuch V",
          "Das Patientenrechtegesetz"
        ],
        "c": 1,
        "e": "Meldepflichtige Krankheiten und Erreger sind im Infektionsschutzgesetz festgelegt."
      },
      {
        "q": "Ein Altenpfleger fragt: ‚In welchem Buch des Sozialgesetzbuchs ist die Pflegeversicherung geregelt?‘",
        "a": [
          "Im SGB XI",
          "Im SGB V",
          "Im SGB IX",
          "Im SGB XII"
        ],
        "c": 0,
        "e": "Die soziale Pflegeversicherung ist im Elften Buch Sozialgesetzbuch (SGB XI) geregelt."
      },
      {
        "q": "Eine Personalchefin fragt: ‚Wer trägt den Zusatzbeitrag zur gesetzlichen Krankenversicherung bei Beschäftigten?‘",
        "a": [
          "Allein die Beschäftigten selbst",
          "Allein der jeweilige Arbeitgeber",
          "Der Bund aus Steuermitteln",
          "Beide Seiten je zur Hälfte"
        ],
        "c": 3,
        "e": "Seit 2019 wird auch der Zusatzbeitrag wieder paritätisch von Arbeitgebern und Beschäftigten getragen."
      },
      {
        "q": "Ein 30-jähriger Single fragt: ‚Wer muss in der Pflegeversicherung den Kinderlosenzuschlag zahlen?‘",
        "a": [
          "Alle Mitglieder ohne Kinder unter 18",
          "Kinderlose Mitglieder ab 30 Jahren",
          "Kinderlose Mitglieder ab 23 Jahren",
          "Nur kinderlose Selbstständige"
        ],
        "c": 2,
        "e": "Den Beitragszuschlag zahlen Mitglieder ab 23 Jahren, die keine Kinder haben."
      },
      {
        "q": "Eine Seniorin fragt: ‚Seit wann ist das E-Rezept für verschreibungspflichtige Arzneimittel verpflichtend?‘",
        "a": [
          "Seit Januar 2019",
          "Seit Januar 2021",
          "Seit Januar 2024",
          "Seit Januar 2026"
        ],
        "c": 2,
        "e": "Seit dem 1. Januar 2024 müssen Praxen verschreibungspflichtige Arzneimittel für gesetzlich Versicherte als E-Rezept ausstellen."
      },
      {
        "q": "Ein Vater fragt: ‚Bis zu welchem Alter zahlt die Kasse rezeptfreie Arzneimittel für Kinder?‘",
        "a": [
          "Bis zum vollendeten 6. Lebensjahr",
          "Bis zum vollendeten 12. Lebensjahr",
          "Bis zum vollendeten 16. Lebensjahr",
          "Bis zum vollendeten 18. Lebensjahr ohne Ausnahme"
        ],
        "c": 1,
        "e": "Rezeptfreie Arzneimittel werden für Kinder bis 12 Jahre (bei Entwicklungsstörungen bis 18) erstattet."
      },
      {
        "q": "Ein Patient nach einer OP fragt: ‚Wie hoch ist die Zuzahlung für einen Krankenhausaufenthalt?‘",
        "a": [
          "5 € pro Tag ohne zeitliche Begrenzung",
          "20 € pro Tag für höchstens 14 Tage",
          "Pauschal 100 € je Aufenthalt",
          "10 € pro Tag für höchstens 28 Tage im Jahr"
        ],
        "c": 3,
        "e": "Erwachsene zahlen 10 Euro je Kliniktag, begrenzt auf 28 Tage pro Kalenderjahr."
      },
      {
        "q": "Eine Medizinstudentin fragt: ‚Welche Rechtsfolge droht Ärztinnen und Ärzten bei Verletzung der Schweigepflicht?‘",
        "a": [
          "Sie ist nach dem Strafgesetzbuch strafbar",
          "Sie ist nur eine Ordnungswidrigkeit",
          "Sie hat ausschließlich berufsrechtliche Folgen",
          "Sie ist nur bei Privatpatienten verboten"
        ],
        "c": 0,
        "e": "Nach § 203 StGB ist die unbefugte Offenbarung von Patientengeheimnissen strafbar."
      }
    ],
    "verkehr": [
      {
        "q": "Eine Gastwirtin fragt: ‚Ab welchem Blutalkoholwert ist Autofahren auch ohne Ausfallerscheinungen eine Ordnungswidrigkeit?‘",
        "a": [
          "Ab 0,3 Promille",
          "Ab 0,8 Promille",
          "Ab 0,5 Promille",
          "Ab 1,1 Promille"
        ],
        "c": 2,
        "e": "Ab 0,5 Promille liegt eine Ordnungswidrigkeit vor; ab 1,1 Promille gilt absolute Fahruntüchtigkeit."
      },
      {
        "q": "Eine Fahranfängerin fragt: ‚Für wen gilt am Steuer ein absolutes Alkoholverbot?‘",
        "a": [
          "In der Probezeit und für alle unter 21 Jahren",
          "Nur für Fahrer unter 18 Jahren",
          "Nur für Berufskraftfahrer",
          "Für alle im ersten Führerscheinjahr"
        ],
        "c": 0,
        "e": "Für Fahranfänger in der Probezeit und Fahrer unter 21 Jahren gilt eine 0,0-Promille-Grenze."
      },
      {
        "q": "Ein Fahrlehrer fragt: ‚Wie lange dauert die Probezeit nach dem ersten Führerschein regulär?‘",
        "a": [
          "Ein Jahr",
          "Drei Jahre",
          "Fünf Jahre",
          "Zwei Jahre"
        ],
        "c": 3,
        "e": "Die Probezeit dauert zwei Jahre und verlängert sich bei schweren Verstößen auf vier Jahre."
      },
      {
        "q": "Ein 16-jähriger Schüler fragt: ‚Ab welchem Alter darf ich mit Begleitperson Auto fahren?‘",
        "a": [
          "Ab 16 Jahren",
          "Ab 17 Jahren",
          "Ab 16 Jahren und 6 Monaten",
          "Erst ab 18 Jahren"
        ],
        "c": 1,
        "e": "Beim begleiteten Fahren darf man ab 17 Jahren mit einer eingetragenen Begleitperson fahren."
      },
      {
        "q": "Ein Autohändler fragt: ‚Wann muss ein neuer Pkw zum ersten Mal zur Hauptuntersuchung?‘",
        "a": [
          "Nach zwei Jahren, danach jährlich",
          "Nach drei Jahren, danach alle zwei Jahre",
          "Nach vier Jahren, danach alle drei Jahre",
          "Nach fünf Jahren, danach alle zwei Jahre"
        ],
        "c": 1,
        "e": "Neue Pkw müssen nach 36 Monaten zur ersten HU, danach alle 24 Monate."
      },
      {
        "q": "Eine Pendlerin fragt: ‚Wie ist die Winterreifenpflicht in Deutschland geregelt?‘",
        "a": [
          "Sie gilt fest von Oktober bis Ostern",
          "Sie gilt fest von November bis März",
          "Es gibt keine gesetzliche Pflicht",
          "Sie gilt bei winterlichen Straßenverhältnissen"
        ],
        "c": 3,
        "e": "Deutschland hat eine situative Winterreifenpflicht: Bei Glatteis, Schnee oder Reifglätte sind Winterreifen vorgeschrieben."
      },
      {
        "q": "Ein Rettungssanitäter fragt: ‚Wo bildet man auf einer dreispurigen Autobahn die Rettungsgasse?‘",
        "a": [
          "Zwischen der linken und der mittleren Spur",
          "Zwischen der mittleren und der rechten Spur",
          "Auf dem Standstreifen ganz rechts",
          "Auf der linken Spur selbst"
        ],
        "c": 0,
        "e": "Die Rettungsgasse entsteht zwischen dem äußerst linken und dem daneben liegenden Fahrstreifen."
      },
      {
        "q": "Ein Taxifahrer fragt: ‚Welche Strafe droht regulär, wenn man am Steuer das Handy in der Hand benutzt?‘",
        "a": [
          "50 € Bußgeld ohne Punkt",
          "200 € Bußgeld und zwei Punkte",
          "100 € Bußgeld und ein Punkt",
          "Ein Monat Fahrverbot"
        ],
        "c": 2,
        "e": "Für die verbotene Handynutzung am Steuer gelten in der Regel 100 Euro Bußgeld und ein Punkt in Flensburg."
      },
      {
        "q": "Eine Mutter fragt: ‚Ab welchem Alter darf mein Kind einen E-Scooter fahren?‘",
        "a": [
          "Ab 12 Jahren",
          "Ab 16 Jahren",
          "Ab 18 Jahren",
          "Ab 14 Jahren"
        ],
        "c": 3,
        "e": "Elektrokleinstfahrzeuge dürfen laut eKFV ab 14 Jahren ohne Führerschein gefahren werden."
      },
      {
        "q": "Ein Großvater fragt: ‚Bis zu welchem Alter müssen Kinder mit dem Fahrrad auf dem Gehweg fahren?‘",
        "a": [
          "Bis zum vollendeten 6. Lebensjahr",
          "Bis zum vollendeten 8. Lebensjahr",
          "Bis zum vollendeten 10. Lebensjahr",
          "Bis zum vollendeten 12. Lebensjahr"
        ],
        "c": 1,
        "e": "Kinder bis acht Jahre müssen den Gehweg nutzen, bis zehn Jahre dürfen sie es."
      },
      {
        "q": "Eine Radfahrerin fragt: ‚Welchen Mindestabstand müssen Autos innerorts beim Überholen von Radfahrern halten?‘",
        "a": [
          "1 Meter",
          "2 Meter",
          "1,5 Meter",
          "2,5 Meter"
        ],
        "c": 2,
        "e": "Seit 2020 gilt beim Überholen von Radfahrern innerorts mindestens 1,5 Meter, außerorts 2 Meter Abstand."
      },
      {
        "q": "Ein Bauingenieur fragt: ‚Wer verwaltet die Bundesstraßen außerhalb der Autobahnen?‘",
        "a": [
          "Die Länder im Auftrag des Bundes",
          "Die Autobahn GmbH des Bundes",
          "Die Landkreise in eigener Regie",
          "Das Eisenbahn-Bundesamt"
        ],
        "c": 0,
        "e": "Bundesstraßen werden in Auftragsverwaltung von den Ländern betreut, der Bund trägt die Kosten."
      },
      {
        "q": "Eine Busfahrerin fragt: ‚Wie heißen die Bundesgelder, mit denen die Länder den Nahverkehr auf der Schiene finanzieren?‘",
        "a": [
          "Regionalisierungsmittel",
          "Entflechtungsmittel",
          "Kohäsionsmittel",
          "Konnexitätsmittel"
        ],
        "c": 0,
        "e": "Der Bund zahlt den Ländern nach dem Regionalisierungsgesetz jährlich Milliarden für den Nahverkehr."
      },
      {
        "q": "Ein Bahnpendler fragt: ‚Wie viel vom Fahrpreis bekomme ich bei 60 Minuten Verspätung im Fernverkehr zurück?‘",
        "a": [
          "10 % des Fahrpreises",
          "50 % des Fahrpreises",
          "25 % des Fahrpreises",
          "Den vollen Fahrpreis"
        ],
        "c": 2,
        "e": "Ab 60 Minuten Verspätung gibt es 25 %, ab 120 Minuten 50 % Entschädigung."
      },
      {
        "q": "Eine Urlauberin fragt: ‚Ab welcher Ankunftsverspätung steht mir bei Flügen in der EU eine Ausgleichszahlung zu?‘",
        "a": [
          "Ab einer Stunde",
          "Ab drei Stunden",
          "Ab zwei Stunden",
          "Ab fünf Stunden"
        ],
        "c": 1,
        "e": "Nach der EU-Fluggastrechteverordnung und der EuGH-Rechtsprechung besteht ab drei Stunden Verspätung am Ziel ein Anspruch."
      },
      {
        "q": "Ein Lokführer fragt: ‚Welche Behörde ist für Zulassung und Sicherheitsaufsicht bei den Eisenbahnen des Bundes zuständig?‘",
        "a": [
          "Das Kraftfahrt-Bundesamt",
          "Das Luftfahrt-Bundesamt",
          "Die Bundesanstalt für Straßenwesen",
          "Das Eisenbahn-Bundesamt"
        ],
        "c": 3,
        "e": "Das Eisenbahn-Bundesamt ist Aufsichts- und Genehmigungsbehörde für die Eisenbahnen des Bundes."
      },
      {
        "q": "Ein Logistiker aus dem Ruhrgebiet fragt: ‚Wo liegt der größte Binnenhafen Europas?‘",
        "a": [
          "Mannheim",
          "Köln",
          "Magdeburg",
          "Duisburg"
        ],
        "c": 3,
        "e": "Der Duisburger Hafen gilt als größter Binnenhafen Europas."
      },
      {
        "q": "Ein Motorradfahrer fragt: ‚Ab wie viel km/h zu schnell innerorts droht in der Regel ein Fahrverbot?‘",
        "a": [
          "Ab 31 km/h",
          "Ab 16 km/h",
          "Ab 21 km/h",
          "Ab 41 km/h"
        ],
        "c": 0,
        "e": "Innerorts droht ab 31 km/h, außerorts ab 41 km/h Überschreitung ein Regelfahrverbot."
      },
      {
        "q": "Ein Wohnmobil-Fan fragt: ‚Bis zu welchem zulässigen Gesamtgewicht darf man mit Führerscheinklasse B fahren?‘",
        "a": [
          "2,8 Tonnen",
          "3,5 Tonnen",
          "4,25 Tonnen",
          "7,5 Tonnen"
        ],
        "c": 1,
        "e": "Die Klasse B gilt für Kraftfahrzeuge bis 3.500 kg zulässiger Gesamtmasse."
      },
      {
        "q": "Eine Spediteurin fragt: ‚Wann gilt das allgemeine Sonntagsfahrverbot für schwere Lkw?‘",
        "a": [
          "Sonntags von 6 bis 18 Uhr",
          "Ganztägig von Samstag bis Montag",
          "Sonn- und feiertags von 0 bis 22 Uhr",
          "Nur an hohen Feiertagen"
        ],
        "c": 2,
        "e": "Lkw über 7,5 Tonnen dürfen an Sonn- und Feiertagen von 0 bis 22 Uhr grundsätzlich nicht fahren."
      }
    ],
    "europa": [
      {
        "q": "Ein Unternehmer fragt: ‚An wen kann ich mich mit einer Beschwerde über Missstände in der EU-Verwaltung wenden?‘",
        "a": [
          "An den Europarat",
          "An die Europäische Bürgerbeauftragte",
          "An den Europäischen Gerichtshof für Menschenrechte",
          "An den Bundesrat"
        ],
        "c": 1,
        "e": "Der oder die Europäische Bürgerbeauftragte untersucht Beschwerden über Missstände in EU-Organen und -Einrichtungen."
      },
      {
        "q": "Eine Steuerberaterin fragt: ‚Welche EU-Institution prüft, ob der EU-Haushalt ordnungsgemäß verwendet wird?‘",
        "a": [
          "Die Europäische Zentralbank",
          "Der Rat der EU",
          "Der Ausschuss der Regionen",
          "Der Europäische Rechnungshof"
        ],
        "c": 3,
        "e": "Der Europäische Rechnungshof mit Sitz in Luxemburg prüft Einnahmen und Ausgaben der EU."
      },
      {
        "q": "Ein Gymnasiast fragt: ‚Wie viele Mitglieder hat die Europäische Kommission einschließlich ihrer Spitze?‘",
        "a": [
          "27, eines je Mitgliedstaat",
          "20, nach Bevölkerung verteilt",
          "32, mit Sitzen für Beitrittskandidaten",
          "15, je ein Mitglied pro Ressort"
        ],
        "c": 0,
        "e": "Die Kommission besteht aus einem Mitglied je Mitgliedstaat, also derzeit 27."
      },
      {
        "q": "Eine Beamtin fragt: ‚Für wie viele Jahre wird die Europäische Kommission ernannt?‘",
        "a": [
          "Für vier Jahre",
          "Für sechs Jahre",
          "Für fünf Jahre",
          "Für sieben Jahre"
        ],
        "c": 2,
        "e": "Die Amtszeit der Kommission beträgt fünf Jahre und orientiert sich an der Wahlperiode des Parlaments."
      },
      {
        "q": "Ein Erstwähler fragt: ‚Wer wählt die Präsidentin oder den Präsidenten der Europäischen Kommission?‘",
        "a": [
          "Die Bürger der EU in direkter Wahl",
          "Der Rat der EU auf Vorschlag des Parlaments",
          "Der Europäische Gerichtshof nach Anhörung",
          "Das Europaparlament auf Vorschlag des Europäischen Rates"
        ],
        "c": 3,
        "e": "Der Europäische Rat schlägt eine Person vor, die das Europäische Parlament mit der Mehrheit seiner Mitglieder wählt."
      },
      {
        "q": "Eine Studentin aus Spanien fragt: ‚Wie lange darf ich als EU-Bürgerin ohne weitere Bedingungen in Deutschland bleiben?‘",
        "a": [
          "Bis zu drei Monate",
          "Bis zu vier Wochen",
          "Bis zu sechs Monate",
          "Bis zu einem Jahr"
        ],
        "c": 0,
        "e": "Für Aufenthalte bis zu drei Monaten genügt EU-Bürgern ein gültiger Ausweis oder Reisepass."
      },
      {
        "q": "Ein Austauschstudent fragt: ‚In welchem Jahr startete das Erasmus-Programm der EU?‘",
        "a": [
          "1972",
          "1993",
          "1987",
          "2004"
        ],
        "c": 2,
        "e": "Das Austauschprogramm Erasmus wurde 1987 ins Leben gerufen."
      },
      {
        "q": "Ein Grundschüler fragt: ‚Wofür stehen die zwölf Sterne auf der Europaflagge?‘",
        "a": [
          "Für die zwölf Gründungsstaaten",
          "Für Einheit und Vollkommenheit",
          "Für die zwölf Mitglieder des Euroraums",
          "Für die zwölf EU-Verträge"
        ],
        "c": 1,
        "e": "Die Zahl zwölf ist ein Symbol für Vollkommenheit und Einheit und hängt nicht von der Zahl der Mitgliedstaaten ab."
      },
      {
        "q": "Eine Politiklehrerin fragt: ‚Welcher Artikel des EU-Vertrags regelt den Austritt eines Mitgliedstaats?‘",
        "a": [
          "Artikel 50",
          "Artikel 5",
          "Artikel 23",
          "Artikel 146"
        ],
        "c": 0,
        "e": "Artikel 50 des Vertrags über die Europäische Union regelt das Austrittsverfahren."
      },
      {
        "q": "Ein Landtagsmitarbeiter fragt: ‚Welcher Grundgesetzartikel regelt die Mitwirkung Deutschlands an der EU?‘",
        "a": [
          "Artikel 20",
          "Artikel 79",
          "Artikel 23",
          "Artikel 116"
        ],
        "c": 2,
        "e": "Artikel 23 Grundgesetz, der Europaartikel, regelt die Mitwirkung von Bundestag und Bundesrat in EU-Angelegenheiten."
      },
      {
        "q": "Eine Vielreisende fragt: ‚Seit wann telefoniert man im EU-Ausland ohne Roaming-Aufschläge?‘",
        "a": [
          "Seit Januar 2012",
          "Seit Mai 2015",
          "Seit Januar 2020",
          "Seit Juni 2017"
        ],
        "c": 3,
        "e": "Seit dem 15. Juni 2017 gilt in der EU das Prinzip „Roam like at home“."
      },
      {
        "q": "Ein Vereinsvorsitzender fragt: ‚Seit wann gilt die Datenschutz-Grundverordnung verbindlich?‘",
        "a": [
          "Seit Januar 2016",
          "Seit Mai 2018",
          "Seit Mai 2020",
          "Seit Dezember 2009"
        ],
        "c": 1,
        "e": "Die DSGVO ist seit dem 25. Mai 2018 in allen EU-Staaten unmittelbar anwendbar."
      },
      {
        "q": "Eine Jurastudentin fragt: ‚Was unterscheidet eine EU-Verordnung von einer EU-Richtlinie?‘",
        "a": [
          "Die Verordnung ist rechtlich unverbindlich",
          "Die Verordnung gilt unmittelbar in allen Staaten",
          "Die Verordnung gilt nur für Euro-Staaten",
          "Die Verordnung braucht Zustimmung der Parlamente"
        ],
        "c": 1,
        "e": "Verordnungen gelten unmittelbar, Richtlinien müssen erst in nationales Recht umgesetzt werden."
      },
      {
        "q": "Ein Bundespolizist fragt: ‚Wo hat die EU-Grenzschutzagentur Frontex ihren Sitz?‘",
        "a": [
          "Warschau",
          "Brüssel",
          "Wien",
          "Prag"
        ],
        "c": 0,
        "e": "Die Europäische Agentur für die Grenz- und Küstenwache Frontex sitzt in Warschau."
      },
      {
        "q": "Eine Kriminalbeamtin fragt: ‚In welcher Stadt sitzt die europäische Polizeibehörde Europol?‘",
        "a": [
          "Lyon",
          "Brüssel",
          "Luxemburg",
          "Den Haag"
        ],
        "c": 3,
        "e": "Europol hat seinen Sitz in Den Haag in den Niederlanden."
      },
      {
        "q": "Ein Apotheker fragt: ‚Wo hat die Europäische Arzneimittel-Agentur EMA seit dem Brexit ihren Sitz?‘",
        "a": [
          "Bonn",
          "Paris",
          "Amsterdam",
          "Mailand"
        ],
        "c": 2,
        "e": "Die EMA zog 2019 von London nach Amsterdam um."
      },
      {
        "q": "Ein Italiener aus München fragt: ‚An welchen Wahlen in Deutschland darf ich als EU-Bürger teilnehmen?‘",
        "a": [
          "An allen Wahlen einschließlich Bundestag",
          "Nur an Landtagswahlen",
          "An Kommunal- und Europawahlen",
          "An keiner Wahl ohne Einbürgerung"
        ],
        "c": 2,
        "e": "EU-Bürger dürfen in Deutschland an Kommunal- und Europawahlen teilnehmen, nicht aber an Bundestags- oder Landtagswahlen."
      },
      {
        "q": "Eine Übersetzerin fragt: ‚Wie heißen die Bedingungen, die ein Staat für einen EU-Beitritt erfüllen muss?‘",
        "a": [
          "Maastricht-Kriterien",
          "Kopenhagener Kriterien",
          "Lissabonner Kriterien",
          "Schengener Kriterien"
        ],
        "c": 1,
        "e": "Die Kopenhagener Kriterien von 1993 legen politische, wirtschaftliche und rechtliche Beitrittsbedingungen fest."
      },
      {
        "q": "Ein Grenzgänger fragt: ‚Welches dieser Länder gehört zum Schengen-Raum, aber nicht zur EU?‘",
        "a": [
          "Irland",
          "Zypern",
          "Großbritannien",
          "Die Schweiz"
        ],
        "c": 3,
        "e": "Die Schweiz, Norwegen, Island und Liechtenstein sind Schengen-Mitglieder ohne EU-Mitgliedschaft."
      },
      {
        "q": "Ein Europaabgeordneter a. D. wird gefragt: ‚Welche Mehrheit braucht das Europaparlament für ein Misstrauensvotum gegen die Kommission?‘",
        "a": [
          "Eine Zweidrittelmehrheit",
          "Eine einfache Mehrheit",
          "Eine Dreiviertelmehrheit",
          "Einstimmigkeit"
        ],
        "c": 0,
        "e": "Ein Misstrauensantrag erfordert zwei Drittel der abgegebenen Stimmen und die Mehrheit der Mitglieder."
      }
    ],
    "familie": [
      {
        "q": "Eine schwangere Bankkauffrau fragt: ‚Wie viele Wochen vor dem errechneten Geburtstermin beginnt mein Mutterschutz?‘",
        "a": [
          "Sechs Wochen",
          "Vierzehn Wochen",
          "Zehn Wochen",
          "Zwölf Wochen"
        ],
        "c": 0,
        "e": "Die Schutzfrist beginnt sechs Wochen vor der Entbindung; in dieser Zeit darf nur auf ausdrücklichen eigenen Wunsch gearbeitet werden."
      },
      {
        "q": "Eine Erzieherin, die Zwillinge erwartet, fragt: ‚Auf wie viele Wochen nach der Geburt verlängert sich die Schutzfrist bei Mehrlingsgeburten?‘",
        "a": [
          "Auf zehn Wochen",
          "Auf zwölf Wochen",
          "Auf vierzehn Wochen",
          "Auf 16 Wochen"
        ],
        "c": 1,
        "e": "Bei Früh- und Mehrlingsgeburten sowie bei einer Behinderung des Kindes dauert der Mutterschutz nach der Geburt zwölf statt acht Wochen."
      },
      {
        "q": "Ein junger Vater, Ingenieur, will wissen: ‚Wie viele Monate ElterngeldPlus bekomme ich anstelle eines Monats Basiselterngeld?‘",
        "a": [
          "Einen Monat",
          "Anderthalb Monate",
          "Zwei Monate",
          "Drei Monate"
        ],
        "c": 2,
        "e": "Ein Monat Basiselterngeld entspricht zwei Monaten ElterngeldPlus, das dafür höchstens halb so hoch ausfällt."
      },
      {
        "q": "Ein Paar mit Neugeborenem fragt: ‚Wie viele Wochenstunden müssen wir beide arbeiten, um den Partnerschaftsbonus zu bekommen?‘",
        "a": [
          "15 bis 20 Stunden",
          "Mindestens 35 Stunden",
          "20 bis 30 Stunden",
          "24 bis 32 Stunden"
        ],
        "c": 3,
        "e": "Den Partnerschaftsbonus (zusätzliche ElterngeldPlus-Monate) gibt es, wenn beide Eltern gleichzeitig 24 bis 32 Wochenstunden arbeiten."
      },
      {
        "q": "Eine Pflegefachfrau in Elternzeit fragt: ‚Wie viele Wochenstunden darf ich während der Elternzeit höchstens in Teilzeit arbeiten?‘",
        "a": [
          "32 Stunden",
          "24 Stunden",
          "20 Stunden",
          "Höchstens 15 Stunden"
        ],
        "c": 0,
        "e": "Seit September 2021 ist während der Elternzeit eine Teilzeitarbeit von bis zu 32 Wochenstunden erlaubt."
      },
      {
        "q": "Ein Vater aus dem Einzelhandel fragt: ‚Wie viele Monate Elternzeit kann ich mir für die Zeit zwischen dem dritten und achten Geburtstag aufheben?‘",
        "a": [
          "Bis zu 12 Monate",
          "Bis zu 24 Monate",
          "Bis zu 30 Monate",
          "Keine, die Restzeit verfällt"
        ],
        "c": 1,
        "e": "Von den drei Jahren Elternzeit können bis zu 24 Monate zwischen dem dritten und achten Geburtstag des Kindes genommen werden."
      },
      {
        "q": "Ein Lagerist, der bald Vater wird, fragt: ‚Wie lange vorher muss ich Elternzeit für die ersten drei Lebensjahre beim Arbeitgeber anmelden?‘",
        "a": [
          "Zwei Wochen vorher",
          "Vier Wochen vorher",
          "Sieben Wochen vorher",
          "Drei Monate im Voraus"
        ],
        "c": 2,
        "e": "Elternzeit bis zum dritten Geburtstag muss spätestens sieben Wochen vor Beginn schriftlich beim Arbeitgeber verlangt werden."
      },
      {
        "q": "Eine schwangere Verkäuferin fragt: ‚Bis wann nach der Geburt bin ich besonders vor einer Kündigung geschützt?‘",
        "a": [
          "Bis zum Ende des Mutterschutzes",
          "Bis sechs Wochen nach der Entbindung",
          "Bis zum ersten Geburtstag des Kindes",
          "Bis vier Monate nach der Entbindung"
        ],
        "c": 3,
        "e": "Das Mutterschutzgesetz verbietet Kündigungen während der Schwangerschaft und bis vier Monate nach der Entbindung; mit Elternzeit verlängert sich der Schutz."
      },
      {
        "q": "Eine werdende Mutter, Bürokauffrau, fragt: ‚Wer zahlt mir im Mutterschutz die Differenz zwischen Mutterschaftsgeld und meinem bisherigen Nettolohn?‘",
        "a": [
          "Der Arbeitgeber",
          "Die Krankenkasse",
          "Die Familienkasse",
          "Das Jobcenter"
        ],
        "c": 0,
        "e": "Die Krankenkasse zahlt höchstens 13 Euro täglich; den Rest bis zum Nettolohn trägt der Arbeitgeber als Zuschuss, der ihm über ein Umlageverfahren erstattet wird."
      },
      {
        "q": "Eine Studentin, frisch Mutter geworden, fragt: ‚Wie weit rückwirkend wird Elterngeld ab dem Antrag höchstens gezahlt?‘",
        "a": [
          "Einen Monat",
          "Drei Monate",
          "Sechs Monate",
          "Zwölf Monate"
        ],
        "c": 1,
        "e": "Elterngeld wird rückwirkend nur für die letzten drei Lebensmonate vor dem Monat der Antragstellung gezahlt."
      },
      {
        "q": "Ein unverheirateter Vater fragt: ‚Wer hat bei nicht verheirateten Eltern das Sorgerecht, wenn sie nichts weiter erklären?‘",
        "a": [
          "Beide Eltern gemeinsam",
          "Zunächst das Jugendamt",
          "Allein die Mutter",
          "Allein der Vater"
        ],
        "c": 2,
        "e": "Ohne Sorgeerklärung, Heirat oder Gerichtsentscheidung hat bei unverheirateten Eltern die Mutter das alleinige Sorgerecht."
      },
      {
        "q": "Ein frischgebackener Vater fragt: ‚Innerhalb welcher Frist muss die Geburt beim Standesamt angezeigt werden?‘",
        "a": [
          "Innerhalb von 24 Stunden",
          "Innerhalb von drei Tagen",
          "Innerhalb von fünf Tagen",
          "Innerhalb einer Woche"
        ],
        "c": 3,
        "e": "Nach dem Personenstandsgesetz ist eine Geburt dem Standesamt binnen einer Woche anzuzeigen; oft übernimmt das die Klinik."
      },
      {
        "q": "Eine Braut kurz vor der Hochzeit fragt: ‚Welcher Güterstand gilt automatisch, wenn wir keinen Ehevertrag schließen?‘",
        "a": [
          "Zugewinngemeinschaft",
          "Gütertrennung",
          "Gütergemeinschaft",
          "Errungenschaftsgemeinschaft"
        ],
        "c": 0,
        "e": "Gesetzlicher Güterstand ist die Zugewinngemeinschaft: Das Vermögen bleibt getrennt, der Zugewinn wird bei Scheidung ausgeglichen."
      },
      {
        "q": "Eine getrennt lebende Mutter fragt: ‚Woran orientieren sich Gerichte meist bei der Höhe des Kindesunterhalts?‘",
        "a": [
          "Am Mietspiegel der Gemeinde",
          "An der Düsseldorfer Tabelle",
          "An den Regelsätzen des Bürgergelds",
          "An der Frankfurter Liste"
        ],
        "c": 1,
        "e": "Die Düsseldorfer Tabelle des Oberlandesgerichts Düsseldorf ist die bundesweit genutzte Leitlinie für den Kindesunterhalt."
      },
      {
        "q": "Eine Tochter, deren Vater plötzlich pflegebedürftig wurde, fragt: ‚Wie viele Arbeitstage darf ich in einer akuten Pflegesituation kurzfristig fernbleiben?‘",
        "a": [
          "Bis zu 3 Arbeitstage",
          "Bis zu 5 Arbeitstage",
          "Bis zu 10 Arbeitstage",
          "Bis zu einem ganzen Monat"
        ],
        "c": 2,
        "e": "Das Pflegezeitgesetz erlaubt bis zu zehn Arbeitstage Fernbleiben; dafür gibt es Pflegeunterstützungsgeld als Lohnersatz."
      },
      {
        "q": "Ein Krankenpfleger fragt: ‚Wie lange kann ich mich nach dem Pflegezeitgesetz höchstens ganz von der Arbeit freistellen lassen, um einen Angehörigen zu pflegen?‘",
        "a": [
          "Bis zu acht Wochen",
          "Drei Monate",
          "Vier Monate",
          "Sechs Monate"
        ],
        "c": 3,
        "e": "Die Pflegezeit erlaubt eine vollständige oder teilweise Freistellung von bis zu sechs Monaten in Betrieben mit mehr als 15 Beschäftigten."
      },
      {
        "q": "Eine Sozialarbeiterin fragt: ‚Unter welcher Nummer erreichen gewaltbetroffene Frauen rund um die Uhr das bundesweite Hilfetelefon?‘",
        "a": [
          "116 016",
          "110 110",
          "0800 111 0 111",
          "115"
        ],
        "c": 0,
        "e": "Das Hilfetelefon „Gewalt gegen Frauen“ ist unter 116 016 kostenlos, anonym und in vielen Sprachen erreichbar."
      },
      {
        "q": "Eine Grundschullehrerin fragt: ‚Was kann ein Gericht nach dem Gewaltschutzgesetz bei häuslicher Gewalt anordnen?‘",
        "a": [
          "Pflicht des Opfers zum Umzug ins Frauenhaus",
          "Überlassung der Wohnung an das Opfer",
          "Sofortige Scheidung der Ehe",
          "Ein Berufsverbot für den Täter"
        ],
        "c": 1,
        "e": "Das Gericht kann dem Opfer die gemeinsame Wohnung zur alleinigen Nutzung zuweisen sowie Kontakt- und Näherungsverbote erlassen."
      },
      {
        "q": "Ein kinderloses Ehepaar fragt: ‚Wie alt muss bei einer gemeinsamen Adoption mindestens einer von uns sein?‘",
        "a": [
          "Volljährigkeit genügt",
          "21 Jahre",
          "25 Jahre",
          "30 Jahre"
        ],
        "c": 2,
        "e": "Bei der gemeinsamen Adoption muss ein Ehegatte mindestens 25, der andere mindestens 21 Jahre alt sein."
      },
      {
        "q": "Ein Großvater beim Bürgerdialog will wissen: ‚Welcher Artikel des Grundgesetzes stellt Ehe und Familie unter den besonderen Schutz des Staates?‘",
        "a": [
          "Artikel 14",
          "Artikel 2",
          "Artikel 4",
          "Artikel 6"
        ],
        "c": 3,
        "e": "Artikel 6 GG schützt Ehe und Familie und nennt Pflege und Erziehung der Kinder das natürliche Recht und die Pflicht der Eltern."
      }
    ],
    "land": [
      {
        "q": "Ein Biobauer aus der Uckermark fragt: ‚Welcher Anteil der landwirtschaftlichen Fläche in Deutschland wird ungefähr ökologisch bewirtschaftet?‘",
        "a": [
          "Rund 11 Prozent",
          "Rund 3 Prozent",
          "Rund 25 Prozent",
          "Rund 35 Prozent"
        ],
        "c": 0,
        "e": "Gut ein Zehntel der landwirtschaftlich genutzten Fläche Deutschlands wird nach den Regeln des Ökolandbaus bewirtschaftet."
      },
      {
        "q": "Eine Bürgermeisterin einer kleinen Gemeinde fragt: ‚Welcher Begriff aus dem Grundgesetz steht für die Forderung, dass ländliche Regionen nicht abgehängt werden dürfen?‘",
        "a": [
          "Gleiche Mindeststandards",
          "Gleichwertige Lebensverhältnisse",
          "Identische Versorgung in Stadt und Land",
          "Einheitliche Regionalbudgets"
        ],
        "c": 1,
        "e": "Artikel 72 GG nennt die „Herstellung gleichwertiger Lebensverhältnisse im Bundesgebiet“ – ein zentraler Bezugspunkt der Politik für ländliche Räume."
      },
      {
        "q": "Ein Schweinehalter aus dem Münsterland fragt: ‚Wie viele Schweine werden in Deutschland ungefähr gehalten?‘",
        "a": [
          "Rund 3 Millionen",
          "Rund 8 Millionen",
          "Rund 21 Millionen",
          "Rund 60 Millionen"
        ],
        "c": 2,
        "e": "Der Schweinebestand liegt bei rund 21 Millionen Tieren und ist seit Jahren rückläufig."
      },
      {
        "q": "Eine Milchbäuerin aus dem Allgäu fragt: ‚Wie viele Milchkühe gibt es in Deutschland ungefähr?‘",
        "a": [
          "Rund 400.000",
          "Rund 1 Million",
          "Rund 2 Millionen",
          "Rund 3,6 Millionen"
        ],
        "c": 3,
        "e": "In Deutschland stehen gut 3,5 Millionen Milchkühe; die meisten davon in Bayern und Niedersachsen."
      },
      {
        "q": "Ein Agrarstudent fragt: ‚Wie groß ist ein landwirtschaftlicher Betrieb in Deutschland im Durchschnitt?‘",
        "a": [
          "Rund 65 Hektar",
          "Rund 15 Hektar",
          "Rund 250 Hektar",
          "Rund 600 Hektar"
        ],
        "c": 0,
        "e": "Ein Betrieb bewirtschaftet im Schnitt rund 65 Hektar, im Osten deutlich mehr, im Süden deutlich weniger."
      },
      {
        "q": "Ein Gemüsebauer am Niederrhein fragt: ‚Welche EU-Vorgabe setzt die deutsche Düngeverordnung vor allem um?‘",
        "a": [
          "Die Vogelschutzrichtlinie",
          "Die Nitratrichtlinie",
          "Die Wasserrahmenrichtlinie",
          "Die Trinkwasserrichtlinie"
        ],
        "c": 1,
        "e": "Die Düngeverordnung dient vor allem der Umsetzung der EU-Nitratrichtlinie zum Schutz der Gewässer vor Nitrat aus der Landwirtschaft."
      },
      {
        "q": "Ein Energiewirt mit Biogasanlage fragt: ‚Welche Pflanze wird in Deutschland am häufigsten als Substrat für Biogas angebaut?‘",
        "a": [
          "Raps",
          "Weizen",
          "Mais",
          "Zuckerrüben"
        ],
        "c": 2,
        "e": "Silomais ist mit großem Abstand die wichtigste Energiepflanze für Biogasanlagen."
      },
      {
        "q": "Eine Gärtnermeisterin fragt: ‚Welche Behörde erteilt in Deutschland die Zulassung für ein Pflanzenschutzmittel?‘",
        "a": [
          "Die Landwirtschaftskammer des jeweiligen Landes",
          "Das Robert Koch-Institut in Berlin",
          "Die EU-Lebensmittelbehörde EFSA",
          "Das BVL in Braunschweig"
        ],
        "c": 3,
        "e": "Pflanzenschutzmittel werden vom Bundesamt für Verbraucherschutz und Lebensmittelsicherheit (BVL) zugelassen; die Wirkstoffe genehmigt die EU."
      },
      {
        "q": "Ein Investor aus der Stadt fragt: ‚Was brauche ich in der Regel, wenn ich eine größere Ackerfläche kaufen will?‘",
        "a": [
          "Eine Genehmigung nach dem Grundstückverkehrsrecht",
          "Einen Sachkundenachweis als staatlich geprüfter Landwirt",
          "Die Zustimmung der EU-Kommission",
          "Eine Mitgliedschaft im Bauernverband"
        ],
        "c": 0,
        "e": "Der Verkauf landwirtschaftlicher Flächen ist genehmigungspflichtig, damit Landwirte beim Erwerb Vorrang haben und eine ungesunde Bodenverteilung vermieden wird."
      },
      {
        "q": "Eine Waldbesitzerin fragt: ‚Ab welcher zusammenhängenden Fläche bildet mein Grundbesitz nach dem Bundesjagdgesetz einen eigenen Jagdbezirk?‘",
        "a": [
          "Ab 10 Hektar",
          "Ab 75 Hektar",
          "Ab 250 Hektar",
          "Ab 500 Hektar"
        ],
        "c": 1,
        "e": "Ein Eigenjagdbezirk entsteht ab 75 Hektar zusammenhängender land-, forst- oder fischereiwirtschaftlich nutzbarer Fläche; kleinere Flächen bilden Jagdgenossenschaften."
      },
      {
        "q": "Eine Joggerin aus der Kreisstadt fragt: ‚Darf ich einen Privatwald einfach so betreten?‘",
        "a": [
          "Nein, nur mit schriftlicher Erlaubnis des Eigentümers",
          "Nur auf ausgeschilderten Wanderwegen",
          "Ja, zur Erholung ist das Betreten erlaubt",
          "Nur in Begleitung eines Försters"
        ],
        "c": 2,
        "e": "Das Bundeswaldgesetz erlaubt allen das Betreten des Waldes zum Zweck der Erholung, unabhängig von den Eigentumsverhältnissen."
      },
      {
        "q": "Ein Förster im Ruhestand fragt: ‚Welche ist die häufigste Laubbaumart in deutschen Wäldern?‘",
        "a": [
          "Die Stieleiche",
          "Die Birke",
          "Die Esche",
          "Die Rotbuche"
        ],
        "c": 3,
        "e": "Die Rotbuche ist der häufigste Laubbaum Deutschlands und würde von Natur aus große Teile des Landes bedecken."
      },
      {
        "q": "Ein Spargelbauer fragt: ‚Wie viele Arbeitstage im Jahr darf eine kurzfristige, sozialversicherungsfreie Beschäftigung höchstens umfassen?‘",
        "a": [
          "70 Arbeitstage",
          "50 Arbeitstage",
          "90 Arbeitstage",
          "115 Arbeitstage"
        ],
        "c": 0,
        "e": "Kurzfristige Beschäftigungen, wie sie für Saisonkräfte üblich sind, sind bis drei Monate oder 70 Arbeitstage im Kalenderjahr sozialversicherungsfrei."
      },
      {
        "q": "Eine Landfrau aus dem Dorfverein fragt: ‚Wann wird in Deutschland meist das Erntedankfest gefeiert?‘",
        "a": [
          "Am letzten Sonntag im August",
          "Am ersten Sonntag im Oktober",
          "Am Martinstag im November",
          "Am dritten Sonntag im September"
        ],
        "c": 1,
        "e": "Die Kirchen feiern Erntedank in Deutschland in der Regel am ersten Sonntag im Oktober."
      },
      {
        "q": "Eine Winzerin fragt: ‚Welches ist das flächenmäßig größte Weinanbaugebiet Deutschlands?‘",
        "a": [
          "Mosel",
          "Pfalz",
          "Rheinhessen",
          "Franken"
        ],
        "c": 2,
        "e": "Rheinhessen ist mit rund 27.000 Hektar Rebfläche das größte der 13 deutschen Weinanbaugebiete, knapp vor der Pfalz."
      },
      {
        "q": "Ein Brauer im Regionalradio fragt: ‚Wie heißt das größte zusammenhängende Hopfenanbaugebiet der Welt, das in Bayern liegt?‘",
        "a": [
          "Das Allgäu",
          "Der Chiemgau",
          "Das Altmühltal",
          "Die Hallertau"
        ],
        "c": 3,
        "e": "Die Hallertau zwischen Ingolstadt und Landshut ist das größte zusammenhängende Hopfenanbaugebiet der Welt."
      },
      {
        "q": "Ein Obstbauer aus Niedersachsen fragt: ‚Wie heißt das größte zusammenhängende Obstanbaugebiet Nordeuropas an der Unterelbe?‘",
        "a": [
          "Das Alte Land",
          "Die Wesermarsch",
          "Das Wendland",
          "Das Emsland"
        ],
        "c": 0,
        "e": "Das Alte Land bei Hamburg ist vor allem für Äpfel bekannt und das größte geschlossene Obstanbaugebiet Nordeuropas."
      },
      {
        "q": "Ein Junglandwirt fragt: ‚Welche Förderbank ist speziell auf Kredite für die Agrarwirtschaft und den ländlichen Raum ausgerichtet?‘",
        "a": [
          "Die Deutsche Bundesbank",
          "Die Landwirtschaftliche Rentenbank",
          "Die Europäische Investitionsbank (EIB)",
          "Die Deutsche Ausgleichsbank"
        ],
        "c": 1,
        "e": "Die Landwirtschaftliche Rentenbank in Frankfurt am Main ist die Förderbank für Agrarwirtschaft und ländlichen Raum."
      },
      {
        "q": "Eine Rentnerin aus einem kleinen Dorf fragt: ‚Was ist mit der Landarztquote gemeint?‘",
        "a": [
          "Eine Mindestzahl an Praxen je Landkreis",
          "Ein Zuschlag auf das Honorar für Landärzte",
          "Studienplätze für künftige Landärzte",
          "Eine Altersgrenze für Hausärzte auf dem Land"
        ],
        "c": 2,
        "e": "Mehrere Länder reservieren Medizinstudienplätze für Bewerber, die sich verpflichten, später einige Jahre in unterversorgten ländlichen Regionen zu praktizieren."
      },
      {
        "q": "Ein Schinkenhersteller aus dem Schwarzwald fragt: ‚Wofür steht das EU-Kürzel g.g.A. auf regionalen Spezialitäten?‘",
        "a": [
          "Garantiert gentechnikfreier Anbau",
          "Gemeinsam geprüfte Agrarqualität",
          "Gesetzlich geregelte Ausfuhr",
          "Geschützte geografische Angabe"
        ],
        "c": 3,
        "e": "Eine geschützte geografische Angabe verlangt, dass mindestens eine Produktionsstufe im namensgebenden Gebiet stattfindet."
      }
    ],
    "demokratie": [
      {
        "q": "Eine 14-jährige Schülerin fragt: ‚Darf ich mich mit einer Petition an den Bundestag wenden?‘",
        "a": [
          "Ja, das Petitionsrecht hat jede Person",
          "Nein, erst ab 16 Jahren",
          "Nein, nur volljährige deutsche Staatsangehörige",
          "Nur mit Unterschrift der Eltern"
        ],
        "c": 0,
        "e": "Nach Artikel 17 GG darf sich jede Person – unabhängig von Alter und Staatsangehörigkeit – mit Bitten oder Beschwerden an die Volksvertretung wenden."
      },
      {
        "q": "Ein Klimaaktivist fragt: ‚Wie lange vorher muss ich eine Demonstration unter freiem Himmel in der Regel anmelden?‘",
        "a": [
          "24 Stunden vor Beginn",
          "48 Stunden vor der Bekanntgabe",
          "Eine Woche vor dem geplanten Termin",
          "Zwei Wochen vor dem geplanten Termin"
        ],
        "c": 1,
        "e": "Versammlungen unter freiem Himmel sind in der Regel spätestens 48 Stunden vor ihrer Bekanntgabe anzumelden; Spontanversammlungen sind davon ausgenommen."
      },
      {
        "q": "Ein Lokaljournalist fragt: ‚Was sagt das Grundgesetz in Artikel 5 ausdrücklich über Zensur?‘",
        "a": [
          "Sie ist nur im Verteidigungsfall erlaubt",
          "Sie bedarf eines Richterbeschlusses",
          "Eine Zensur findet nicht statt",
          "Sie ist auf den Jugendschutz beschränkt"
        ],
        "c": 2,
        "e": "Artikel 5 Absatz 1 GG garantiert Presse- und Rundfunkfreiheit und stellt klar: „Eine Zensur findet nicht statt.“"
      },
      {
        "q": "Ein Mieter beim Infostand fragt: ‚Wer darf eine Durchsuchung meiner Wohnung grundsätzlich anordnen?‘",
        "a": [
          "Jede Polizeibeamtin",
          "Der Vermieter mit Zeugen",
          "Das Ordnungsamt",
          "Ein Richter"
        ],
        "c": 3,
        "e": "Nach Artikel 13 GG dürfen Durchsuchungen grundsätzlich nur durch Richter angeordnet werden, nur bei Gefahr im Verzug auch durch andere Organe."
      },
      {
        "q": "Ein Jurastudent fragt: ‚Wie lange darf die Polizei jemanden aus eigener Machtvollkommenheit höchstens festhalten?‘",
        "a": [
          "Bis zum Ende des Folgetages",
          "Höchstens zwölf Stunden",
          "Bis zu 72 Stunden",
          "Bis zu einer Woche"
        ],
        "c": 0,
        "e": "Nach Artikel 104 GG darf die Polizei niemanden länger als bis zum Ende des Tages nach der Festnahme ohne richterliche Entscheidung festhalten."
      },
      {
        "q": "Eine Rentnerin fragt: ‚Was kostet es, Verfassungsbeschwerde beim Bundesverfassungsgericht einzulegen?‘",
        "a": [
          "Pauschal 500 Euro",
          "Grundsätzlich nichts",
          "Ein Prozent des Streitwerts",
          "Eine Gebühr nach Einkommen"
        ],
        "c": 1,
        "e": "Das Verfahren ist gebührenfrei und ohne Anwaltszwang möglich; nur bei Missbrauch kann eine Missbrauchsgebühr verhängt werden."
      },
      {
        "q": "Ein Gewerkschafter fragt: ‚Wer entscheidet in Deutschland über das Verbot einer Partei?‘",
        "a": [
          "Der Bundestag",
          "Das Bundesamt für Verfassungsschutz",
          "Das Bundesverfassungsgericht",
          "Der Bundespräsident"
        ],
        "c": 2,
        "e": "Nur das Bundesverfassungsgericht kann eine Partei verbieten, und zwar auf Antrag von Bundestag, Bundesrat oder Bundesregierung."
      },
      {
        "q": "Ein Geschichtslehrer fragt: ‚Wie oft darf ein Bundespräsident im Anschluss an seine Amtszeit wiedergewählt werden?‘",
        "a": [
          "Gar nicht",
          "Zweimal",
          "Beliebig oft",
          "Einmal"
        ],
        "c": 3,
        "e": "Artikel 54 GG erlaubt die anschließende Wiederwahl nur einmal; die Amtszeit beträgt jeweils fünf Jahre."
      },
      {
        "q": "Eine Politikstudentin fragt: ‚Wie alt muss man mindestens sein, um zum Bundespräsidenten gewählt zu werden?‘",
        "a": [
          "40 Jahre",
          "35 Jahre",
          "30 Jahre",
          "45 Jahre"
        ],
        "c": 0,
        "e": "Wählbar ist jeder Deutsche, der das Wahlrecht zum Bundestag besitzt und das 40. Lebensjahr vollendet hat."
      },
      {
        "q": "Eine Wahlhelferin fragt: ‚An welchem Tag muss eine Bundestagswahl laut Gesetz stattfinden?‘",
        "a": [
          "An einem beliebigen Werktag",
          "An einem Sonntag oder Feiertag",
          "An einem Samstag oder Sonntag",
          "An einem von den Ländern gewählten Tag"
        ],
        "c": 1,
        "e": "Das Bundeswahlgesetz schreibt vor, dass der Wahltag ein Sonntag oder gesetzlicher Feiertag sein muss."
      },
      {
        "q": "Ein Außendienstmitarbeiter fragt: ‚Muss ich für die Briefwahl bei der Bundestagswahl einen Grund angeben?‘",
        "a": [
          "Ja, eine schriftliche Bescheinigung des Arbeitgebers",
          "Ja, nur Krankheit oder Reise zählen",
          "Nein, seit 2008 ist kein Grund nötig",
          "Nein, aber eine Gebühr ist fällig"
        ],
        "c": 2,
        "e": "Seit 2008 kann jede wahlberechtigte Person ohne Angabe von Gründen per Brief wählen."
      },
      {
        "q": "Eine Datenschützerin fragt: ‚Durch welches Urteil des Bundesverfassungsgerichts von 1983 wurde das Recht auf informationelle Selbstbestimmung begründet?‘",
        "a": [
          "Das Lüth-Urteil",
          "Das Maastricht-Urteil",
          "Das Spiegel-Urteil",
          "Das Volkszählungsurteil"
        ],
        "c": 3,
        "e": "Im Volkszählungsurteil von 1983 leitete das Gericht aus Artikel 2 und 1 GG das Recht ab, selbst über die Preisgabe persönlicher Daten zu bestimmen."
      },
      {
        "q": "Ein IT-Berater fragt: ‚Seit wann gilt die Datenschutz-Grundverordnung der EU unmittelbar in allen Mitgliedstaaten?‘",
        "a": [
          "Seit Mai 2018",
          "Seit Januar 2002",
          "Seit Dezember 2009",
          "Seit März 2020"
        ],
        "c": 0,
        "e": "Die DSGVO wurde 2016 beschlossen und gilt seit dem 25. Mai 2018 unmittelbar in der gesamten EU."
      },
      {
        "q": "Ein Student fragt: ‚Was ermöglicht mir das Informationsfreiheitsgesetz des Bundes?‘",
        "a": [
          "Freien Zugang zu allen Akten der Geheimdienste",
          "Einsicht in Behördenakten ohne Begründung",
          "Kostenloses WLAN in allen Bundesbehörden",
          "Einsicht in die Steuerakten anderer"
        ],
        "c": 1,
        "e": "Seit 2006 hat jede Person gegenüber Bundesbehörden einen Anspruch auf Zugang zu amtlichen Informationen, ohne ein Interesse begründen zu müssen."
      },
      {
        "q": "Eine Abiturientin fragt: ‚Wer darf Gesetzentwürfe beim Bundestag einbringen?‘",
        "a": [
          "Nur die Bundesregierung",
          "Bundesregierung und Bundespräsident",
          "Regierung, Bundesrat und Bundestag",
          "Nur Fraktionen und Bundesrat"
        ],
        "c": 2,
        "e": "Nach Artikel 76 GG können Gesetzesvorlagen von der Bundesregierung, aus der Mitte des Bundestages oder vom Bundesrat eingebracht werden."
      },
      {
        "q": "Ein Mitarbeiter einer Abgeordneten fragt: ‚Welcher Anteil der Bundestagsmitglieder kann die Einsetzung eines Untersuchungsausschusses erzwingen?‘",
        "a": [
          "Die Hälfte",
          "Ein Drittel",
          "Zwei Drittel",
          "Ein Viertel"
        ],
        "c": 3,
        "e": "Nach Artikel 44 GG muss der Bundestag einen Untersuchungsausschuss einsetzen, wenn ein Viertel seiner Mitglieder das beantragt."
      },
      {
        "q": "Ein junges Parteimitglied fragt: ‚Wie viele Abgeordnete braucht man mindestens, um im Bundestag eine Fraktion zu bilden?‘",
        "a": [
          "Fünf Prozent der Mitglieder",
          "Mindestens zehn Abgeordnete",
          "Drei Prozent der Mitglieder",
          "Zehn Prozent der Mitglieder"
        ],
        "c": 0,
        "e": "Laut Geschäftsordnung des Bundestages braucht eine Fraktion mindestens fünf Prozent der Mitglieder des Bundestages."
      },
      {
        "q": "Eine Französin, die in Freiburg lebt, fragt: ‚An welchen Wahlen in Deutschland darf ich als EU-Bürgerin teilnehmen?‘",
        "a": [
          "Nur an der Bundestagswahl",
          "An Kommunal- und Europawahlen",
          "An allen Wahlen in Deutschland",
          "An Landtags- und Kommunalwahlen"
        ],
        "c": 1,
        "e": "Seit dem Vertrag von Maastricht dürfen EU-Bürger an ihrem Wohnort an Kommunal- und Europawahlen teilnehmen, nicht aber an Bundestags- oder Landtagswahlen."
      },
      {
        "q": "Ein Umweltschützer fragt: ‚Wie viele Unterschriften braucht eine Europäische Bürgerinitiative?‘",
        "a": [
          "100.000 aus drei Staaten",
          "Eine halbe Million aus fünf Staaten",
          "Eine Million aus sieben Staaten",
          "Zwei Millionen aus 14 Staaten"
        ],
        "c": 2,
        "e": "Eine Europäische Bürgerinitiative braucht eine Million Unterschriften, wobei in mindestens sieben Mitgliedstaaten Mindestzahlen erreicht werden müssen."
      },
      {
        "q": "Eine Erstwählerin fragt: ‚Wie viele Sitze hat Deutschland im Europäischen Parlament?‘",
        "a": [
          "72 Sitze",
          "81 Sitze",
          "99 Sitze",
          "96 Sitze"
        ],
        "c": 3,
        "e": "Deutschland stellt mit 96 Abgeordneten die größte nationale Gruppe im Europäischen Parlament; das ist die vertragliche Obergrenze pro Staat."
      }
    ],
    "finanzen": [
      {
        "q": "Eine Café-Betreiberin fragt: ‚Wie hoch ist der reguläre Umsatzsteuersatz in Deutschland?‘",
        "a": [
          "19 Prozent",
          "16 Prozent",
          "21 Prozent",
          "18,5 Prozent"
        ],
        "c": 0,
        "e": "Der Regelsatz der Umsatzsteuer beträgt seit 2007 19 Prozent; für bestimmte Güter gilt der ermäßigte Satz."
      },
      {
        "q": "Ein Auszubildender fragt: ‚Bis wann muss ich eine Pflicht-Steuererklärung ohne Steuerberater regulär abgeben?‘",
        "a": [
          "Bis 31. Mai des Folgejahres",
          "Bis 31. Juli des Folgejahres",
          "Bis 30. September des Folgejahres",
          "Bis 31. Dezember des Folgejahres"
        ],
        "c": 1,
        "e": "Wer zur Abgabe verpflichtet ist und keinen Steuerberater hat, muss die Erklärung bis zum 31. Juli des Folgejahres einreichen."
      },
      {
        "q": "Ein Elektriker fragt: ‚Wie hoch ist der Arbeitnehmer-Pauschbetrag für Werbungskosten im Jahr?‘",
        "a": [
          "600 Euro",
          "1.000 Euro",
          "1.230 Euro",
          "2.000 Euro"
        ],
        "c": 2,
        "e": "Ohne Nachweis werden jedem Arbeitnehmer 1.230 Euro Werbungskosten pro Jahr pauschal angerechnet."
      },
      {
        "q": "Eine Sparerin mittleren Alters fragt: ‚Bis zu welcher Höhe bleiben meine Kapitalerträge als Alleinstehende jährlich steuerfrei?‘",
        "a": [
          "500 Euro",
          "801 Euro",
          "1.230 Euro",
          "1.000 Euro"
        ],
        "c": 3,
        "e": "Der Sparer-Pauschbetrag beträgt seit 2023 1.000 Euro für Alleinstehende und 2.000 Euro für zusammenveranlagte Paare."
      },
      {
        "q": "Ein alleinerziehender Vater fragt: ‚In welche Steuerklasse gehöre ich als Alleinerziehender?‘",
        "a": [
          "Steuerklasse II",
          "Steuerklasse III",
          "Steuerklasse IV",
          "Steuerklasse V"
        ],
        "c": 0,
        "e": "Steuerklasse II berücksichtigt den Entlastungsbetrag für Alleinerziehende bereits beim Lohnsteuerabzug."
      },
      {
        "q": "Eine neu zugezogene Krankenpflegerin fragt: ‚Welche Behörde vergibt die steuerliche Identifikationsnummer?‘",
        "a": [
          "Das örtliche Finanzamt",
          "Das Bundeszentralamt für Steuern",
          "Das Einwohnermeldeamt",
          "Die Deutsche Rentenversicherung Bund"
        ],
        "c": 1,
        "e": "Die elfstellige Steuer-ID wird vom Bundeszentralamt für Steuern vergeben und gilt ein Leben lang."
      },
      {
        "q": "Ein junges Paar beim Hauskauf fragt: ‚Wer legt den Steuersatz der Grunderwerbsteuer fest?‘",
        "a": [
          "Der Bund einheitlich für alle Länder",
          "Die Gemeinde",
          "Das jeweilige Bundesland",
          "Der Gutachterausschuss"
        ],
        "c": 2,
        "e": "Seit der Föderalismusreform 2006 bestimmen die Länder den Satz der Grunderwerbsteuer selbst; er liegt je nach Land zwischen 3,5 und 6,5 Prozent."
      },
      {
        "q": "Ein Pendler fragt: ‚Wem steht das Aufkommen der Kfz-Steuer heute zu?‘",
        "a": [
          "Den Ländern",
          "Den Gemeinden",
          "Der EU",
          "Dem Bund"
        ],
        "c": 3,
        "e": "Seit 2009 ist die Kfz-Steuer eine Bundessteuer; die Länder erhalten dafür einen Ausgleich."
      },
      {
        "q": "Eine Hundehalterin fragt: ‚Wer erhebt die Hundesteuer?‘",
        "a": [
          "Die Gemeinde",
          "Das Land",
          "Der Bund",
          "Das Veterinäramt"
        ],
        "c": 0,
        "e": "Die Hundesteuer ist eine örtliche Aufwandsteuer; Höhe und Regeln legt jede Gemeinde per Satzung fest."
      },
      {
        "q": "Eine Tochter, die ihre Eltern beerben wird, fragt: ‚Wie hoch ist der Erbschaftsteuer-Freibetrag für ein Kind je Elternteil?‘",
        "a": [
          "200.000 Euro",
          "400.000 Euro",
          "500.000 Euro",
          "1 Million Euro"
        ],
        "c": 1,
        "e": "Kinder können von jedem Elternteil 400.000 Euro steuerfrei erben; für Ehegatten gilt ein Freibetrag von 500.000 Euro."
      },
      {
        "q": "Eine Großmutter fragt: ‚Nach wie vielen Jahren kann ich die Freibeträge der Schenkungsteuer wieder voll ausschöpfen?‘",
        "a": [
          "Nach 3 Jahren",
          "Nach 5 Jahren",
          "Nach 10 Jahren",
          "Nach 15 Jahren"
        ],
        "c": 2,
        "e": "Schenkungen an dieselbe Person werden über zehn Jahre zusammengerechnet; danach steht der Freibetrag erneut zur Verfügung."
      },
      {
        "q": "Ein Kleinvermieter fragt: ‚Nach wie vielen Jahren Haltedauer ist der Gewinn aus dem Verkauf einer vermieteten Wohnung steuerfrei?‘",
        "a": [
          "Nach 2 Jahren",
          "Nach 5 Jahren",
          "Nach 7 Jahren",
          "Nach 10 Jahren"
        ],
        "c": 3,
        "e": "Private Veräußerungsgewinne bei Immobilien sind nach einer Haltedauer von mehr als zehn Jahren steuerfrei, bei Selbstnutzung schon früher."
      },
      {
        "q": "Eine selbstständige Grafikdesignerin fragt: ‚Bis zu welchem Vorjahresumsatz kann ich seit 2025 die Kleinunternehmerregelung nutzen?‘",
        "a": [
          "25.000 Euro",
          "22.000 Euro",
          "17.500 Euro",
          "50.000 Euro"
        ],
        "c": 0,
        "e": "Seit 2025 gilt die Kleinunternehmerregelung bis 25.000 Euro Umsatz im Vorjahr und 100.000 Euro im laufenden Jahr."
      },
      {
        "q": "Ein Handwerksmeister mit Einzelbetrieb fragt: ‚Welcher Freibetrag gilt für mich bei der Gewerbesteuer?‘",
        "a": [
          "10.000 Euro",
          "24.500 Euro",
          "100.000 Euro",
          "5.000 Euro"
        ],
        "c": 1,
        "e": "Einzelunternehmen und Personengesellschaften haben beim Gewerbeertrag einen Freibetrag von 24.500 Euro, Kapitalgesellschaften keinen."
      },
      {
        "q": "Ein Unternehmensberater fragt: ‚Wie hoch ist der Solidaritätszuschlag, bezogen auf die Einkommen- oder Körperschaftsteuer?‘",
        "a": [
          "3 Prozent",
          "4,5 Prozent",
          "5,5 Prozent",
          "7,5 Prozent"
        ],
        "c": 2,
        "e": "Der Solidaritätszuschlag beträgt 5,5 Prozent der Steuer; seit 2021 zahlen ihn die meisten Lohnsteuerzahler wegen hoher Freigrenzen nicht mehr."
      },
      {
        "q": "Eine Teilzeitkraft fragt: ‚Mit welchem Steuersatz beginnt die Einkommensteuer oberhalb des Grundfreibetrags?‘",
        "a": [
          "10 Prozent",
          "12 Prozent",
          "15 Prozent",
          "14 Prozent"
        ],
        "c": 3,
        "e": "Der Eingangssteuersatz liegt bei 14 Prozent und steigt dann progressiv an."
      },
      {
        "q": "Eine Verwaltungsangestellte fragt: ‚Welchen Zeitraum umfasst das Haushaltsjahr des Bundes?‘",
        "a": [
          "Das Kalenderjahr",
          "Juli bis Juni",
          "April bis März",
          "Oktober bis September"
        ],
        "c": 0,
        "e": "Das Haushaltsjahr des Bundes entspricht dem Kalenderjahr, also dem Zeitraum vom 1. Januar bis 31. Dezember."
      },
      {
        "q": "Ein Importeur fragt: ‚Wem stehen die Zolleinnahmen, die der deutsche Zoll erhebt, im Wesentlichen zu?‘",
        "a": [
          "Dem Bund",
          "Der Europäischen Union",
          "Den Ländern",
          "Den Hafen- und Grenzgemeinden"
        ],
        "c": 1,
        "e": "Zölle sind Eigenmittel der EU; Deutschland behält nur einen Anteil von 25 Prozent als Erhebungskosten ein."
      },
      {
        "q": "Eine Steuerfachangestellte fragt: ‚Wo hat der Bundesfinanzhof, das oberste Gericht für Steuersachen, seinen Sitz?‘",
        "a": [
          "In Karlsruhe",
          "In Leipzig",
          "In München",
          "In Kassel"
        ],
        "c": 2,
        "e": "Der Bundesfinanzhof sitzt in München und entscheidet in letzter Instanz über Revisionen gegen Urteile der Finanzgerichte."
      },
      {
        "q": "Ein Softwareentwickler im Homeoffice fragt: ‚Wie viel kann ich pro Tag im Homeoffice als Pauschale steuerlich absetzen?‘",
        "a": [
          "4 Euro",
          "5 Euro",
          "8 Euro",
          "6 Euro"
        ],
        "c": 3,
        "e": "Die Homeoffice-Pauschale beträgt seit 2023 6 Euro pro Tag, höchstens 1.260 Euro im Jahr."
      }
    ]
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CITIZEN_QUESTIONS;
  } else {
    root.BTW_CITIZENQ = CITIZEN_QUESTIONS;
  }
})(this);
