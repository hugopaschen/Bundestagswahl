/*
 * Namen für Direktkandidaturen, Ministerinnen und Minister – alle erfunden.
 * Die Verteilung folgt grob der Wirklichkeit: Frauenanteil je Fraktion (AfD und Union deutlich
 * männlicher, Grüne und Linke mehr Frauen), Zuwanderungsgeschichte häufiger bei Grünen, Linken und
 * SPD und in Großstädten, regionale Vornamen (Bayern, Osten, Norden) und Altersjahrgänge.
 * Jeder Nachname kommt in einem Spiel nur einmal vor. Bekannte Politikernamen sind ausgeschlossen.
 */
(function (root) {
  // ---------- Vornamen ----------
  const FIRST = {
    de: {
      m: {
        old: ['Wolfgang', 'Klaus', 'Jürgen', 'Dieter', 'Manfred', 'Rainer', 'Hans-Peter', 'Ulrich', 'Gerhard', 'Bernd', 'Horst', 'Heinz', 'Karl-Heinz', 'Helmut', 'Reinhard', 'Lothar', 'Günter', 'Hartmut', 'Friedhelm', 'Werner', 'Norbert', 'Eckhard', 'Volker', 'Detlef', 'Winfried', 'Hans-Jürgen', 'Burkhard', 'Gunnar', 'Siegfried', 'Joachim'],
        mid: ['Thomas', 'Michael', 'Stefan', 'Andreas', 'Frank', 'Markus', 'Christian', 'Oliver', 'Matthias', 'Carsten', 'Sven', 'Jens', 'Torsten', 'Dirk', 'Marco', 'Holger', 'Ralf', 'Martin', 'Alexander', 'Tobias', 'Daniel', 'Sebastian', 'Florian', 'Patrick', 'Björn', 'Kai', 'Nils', 'Jan', 'Christoph', 'Philipp', 'Benjamin', 'Dennis', 'Timo', 'Johannes', 'Henrik'],
        young: ['Lukas', 'Leon', 'Jonas', 'Niklas', 'Finn', 'Luca', 'Moritz', 'Paul', 'Julian', 'Felix', 'Tim', 'Max', 'Jannik', 'Noah', 'Elias', 'Ben', 'Malte', 'Lennart', 'Vincent', 'Fabian', 'Linus', 'Marlon', 'Til', 'Jakob', 'Mats']
      },
      f: {
        old: ['Renate', 'Gabriele', 'Monika', 'Ursula', 'Brigitte', 'Karin', 'Helga', 'Ingrid', 'Christa', 'Elke', 'Marion', 'Heike', 'Petra', 'Bärbel', 'Hannelore', 'Gudrun', 'Rosemarie', 'Doris', 'Angelika', 'Dagmar', 'Waltraud', 'Edeltraud', 'Irmgard', 'Sigrid', 'Annegret'],
        mid: ['Andrea', 'Sabine', 'Claudia', 'Susanne', 'Nicole', 'Stefanie', 'Katrin', 'Anja', 'Silke', 'Tanja', 'Christina', 'Daniela', 'Julia', 'Katharina', 'Sandra', 'Melanie', 'Simone', 'Kerstin', 'Birgit', 'Miriam', 'Nadine', 'Jessica', 'Judith', 'Nina', 'Sarah', 'Anne', 'Franziska', 'Svenja', 'Carolin', 'Verena', 'Ina', 'Britta', 'Maren', 'Antje', 'Bettina'],
        young: ['Lena', 'Laura', 'Lea', 'Hannah', 'Sophie', 'Marie', 'Anna', 'Lisa', 'Johanna', 'Clara', 'Emma', 'Mia', 'Charlotte', 'Paula', 'Luisa', 'Greta', 'Lina', 'Jana', 'Frieda', 'Ronja', 'Merle', 'Alina', 'Theresa', 'Pia', 'Nele']
      }
    },
    // Regionale Färbung: Bayern/Süden katholisch-traditionell, Osten mit typischen DDR-Jahrgängen, Norden friesisch.
    by: {
      m: ['Josef', 'Franz', 'Alois', 'Korbinian', 'Maximilian', 'Florian', 'Sebastian', 'Georg', 'Anton', 'Xaver', 'Michael', 'Andreas', 'Benedikt', 'Quirin', 'Leonhard', 'Ludwig', 'Hubert', 'Konrad'],
      f: ['Theresa', 'Franziska', 'Magdalena', 'Rosi', 'Veronika', 'Monika', 'Barbara', 'Kathrin', 'Elisabeth', 'Maria', 'Anna-Lena', 'Johanna', 'Regina', 'Kreszenz']
    },
    ost: {
      m: ['Ronny', 'Steffen', 'René', 'Sandro', 'Enrico', 'Mike', 'Maik', 'Silvio', 'Rico', 'Danny', 'Uwe', 'Jörg', 'Lutz', 'Heiko', 'Mirko', 'Falk', 'Thilo', 'Ingo', 'Andy', 'Toralf'],
      f: ['Mandy', 'Peggy', 'Kathleen', 'Yvonne', 'Ramona', 'Manuela', 'Jacqueline', 'Doreen', 'Anett', 'Cindy', 'Ines', 'Grit', 'Kerstin', 'Romy', 'Antje', 'Sindy', 'Diana', 'Nancy']
    },
    nord: {
      m: ['Hauke', 'Jannes', 'Ole', 'Fiete', 'Hinnerk', 'Broder', 'Momme', 'Knut', 'Arne', 'Jens', 'Sönke', 'Thore', 'Keno'],
      f: ['Inken', 'Wiebke', 'Frauke', 'Tomke', 'Maike', 'Swantje', 'Imke', 'Silke', 'Hilke', 'Gesa', 'Ilka']
    },
    tr: { m: ['Mehmet', 'Murat', 'Cem', 'Serkan', 'Emre', 'Kerem', 'Can', 'Burak', 'Deniz', 'Erkan', 'Ömer', 'Tarkan', 'Hakan', 'Ozan', 'Mustafa', 'Volkan', 'Okan', 'Baran'], f: ['Aylin', 'Elif', 'Zeynep', 'Fatma', 'Derya', 'Gülşen', 'Sevim', 'Ayşe', 'Canan', 'Ebru', 'Melike', 'Hatice', 'Leyla', 'Nilay', 'Sibel', 'Özlem', 'Filiz', 'Büşra', 'Dilan'] },
    ar: { m: ['Karim', 'Omar', 'Tarek', 'Samir', 'Ahmad', 'Yusuf', 'Bilal', 'Rami', 'Hassan', 'Nabil', 'Jamal', 'Ali'], f: ['Lina', 'Nour', 'Yasmin', 'Amira', 'Rania', 'Dalia', 'Samira', 'Leila', 'Hiba', 'Mariam'] },
    ku: { m: ['Azad', 'Rojhat', 'Serhat', 'Dilshad', 'Berzan'], f: ['Rojda', 'Berivan', 'Nesrin', 'Zilan', 'Hevin'] },
    pl: { m: ['Paweł', 'Tomasz', 'Krzysztof', 'Marek', 'Piotr', 'Jakub', 'Łukasz', 'Adam'], f: ['Agnieszka', 'Katarzyna', 'Joanna', 'Magdalena', 'Anna', 'Ewa', 'Monika', 'Justyna'] },
    ru: { m: ['Waldemar', 'Eduard', 'Viktor', 'Andrej', 'Dimitri', 'Alexej', 'Artur', 'Eugen', 'Juri', 'Witali'], f: ['Olga', 'Swetlana', 'Natalia', 'Irina', 'Tatjana', 'Jelena', 'Larissa', 'Anastasia', 'Valentina'] },
    it: { m: ['Marco', 'Luca', 'Giuseppe', 'Antonio', 'Matteo', 'Francesco', 'Salvatore', 'Davide'], f: ['Giulia', 'Francesca', 'Chiara', 'Valentina', 'Alessandra', 'Federica', 'Paola', 'Sara'] },
    gr: { m: ['Georgios', 'Dimitrios', 'Konstantinos', 'Nikos', 'Stavros', 'Christos'], f: ['Eleni', 'Maria', 'Sofia', 'Katerina', 'Despina', 'Ioanna'] },
    bal: { m: ['Milan', 'Dragan', 'Goran', 'Ivan', 'Zoran', 'Nenad', 'Amir', 'Edin', 'Admir'], f: ['Jelena', 'Ivana', 'Marija', 'Amra', 'Lejla', 'Snježana', 'Tamara', 'Mirela'] },
    ir: { m: ['Arash', 'Reza', 'Kian', 'Omid', 'Babak', 'Dariush'], f: ['Shirin', 'Parisa', 'Nasrin', 'Mina', 'Golnar', 'Ladan'] },
    vn: { m: ['Minh', 'Duc', 'Tuan', 'Hung', 'Quang'], f: ['Lan', 'Mai', 'Thu', 'Huong', 'Linh'] },
    af: { m: ['Kwame', 'Kofi', 'Emeka', 'Moussa', 'Joel'], f: ['Ama', 'Adaeze', 'Fatou', 'Abena', 'Grace'] }
  };

  // ---------- Nachnamen ----------
  const LAST = {
    de: ['Abel', 'Achenbach', 'Adler', 'Ahlborn', 'Albers', 'Alt', 'Althaus', 'Altmann', 'Ammann', 'Amsel', 'Andres', 'Angerer', 'Anker', 'Appel', 'Arendt', 'Arndt', 'Aschenbrenner', 'Aßmann', 'Auer', 'August', 'Aumann', 'Axt', 'Baader', 'Bachmann', 'Backhaus', 'Bader', 'Baier', 'Balzer', 'Bannert', 'Bartels', 'Barthel', 'Bartl', 'Bast', 'Bauch', 'Baum', 'Baumgart', 'Baumgartner', 'Bayerl', 'Bechtel', 'Beckmann', 'Beer', 'Behr', 'Behrendt', 'Beier', 'Beil', 'Beilke', 'Bell', 'Benz', 'Berendt', 'Berg', 'Bergner', 'Berndt', 'Bernhardt', 'Bertram', 'Besser', 'Bethke', 'Betz', 'Beutel', 'Bieber', 'Biel', 'Bierbaum', 'Biermann', 'Bild', 'Binder', 'Birkner', 'Bittner', 'Blank', 'Blaschke', 'Blechschmidt', 'Bleich', 'Block', 'Blume', 'Bluhm', 'Bock', 'Bode', 'Bodenstein', 'Böhme', 'Bohn', 'Boll', 'Bolz', 'Bonn', 'Borchers', 'Borchert', 'Born', 'Bosch', 'Brachmann', 'Brandes', 'Brandner', 'Brauner', 'Brede', 'Bremer', 'Brendel', 'Brockhaus', 'Brodbeck', 'Bruder', 'Brüggemann', 'Brunke', 'Buchholz', 'Buchner', 'Buck', 'Budde', 'Bürger', 'Burger', 'Burmeister', 'Buss', 'Butz', 'Christ', 'Clausen', 'Conrad', 'Cramer', 'Dahl', 'Dahlke', 'Damm', 'Dammann', 'Danner', 'David', 'Decker', 'Dehn', 'Deichmann', 'Deppe', 'Determann', 'Deutsch', 'Diekmann', 'Diel', 'Dietz', 'Dietzel', 'Dinkel', 'Doll', 'Domm', 'Döring', 'Dorn', 'Drechsler', 'Dreyer', 'Drews', 'Dürr2', 'Ebel', 'Eberhardt', 'Ebner', 'Eckardt', 'Eckstein', 'Eder', 'Egger', 'Ehrhardt', 'Eich', 'Eichhorn', 'Eichler', 'Eisele', 'Eisenmann', 'Elsner', 'Emmerich', 'Ende', 'Endres', 'Engler', 'Enders', 'Erbe', 'Ertel', 'Evers', 'Fabian', 'Fahrenholz', 'Falk', 'Fay', 'Fehr', 'Feist', 'Feldhaus', 'Fenske', 'Fett', 'Feuerstein', 'Fey', 'Fichte', 'Fichtner', 'Filler', 'Fischbach', 'Fleck', 'Flemming', 'Flick', 'Fock', 'Förster', 'Frahm', 'Franz', 'Freitag', 'Frick', 'Fricke', 'Friedel', 'Friese', 'Fritsche', 'Fröhner', 'Fromm', 'Fürst', 'Gabriel', 'Gall', 'Gand', 'Gans', 'Gast', 'Gebhardt', 'Geier', 'Geisler', 'Gerber', 'Gerhard', 'Gerken', 'Gerstner', 'Giese', 'Gießler', 'Glas', 'Gläser', 'Gleich', 'Glück', 'Göller', 'Görner', 'Gosch', 'Götz', 'Graf', 'Gräber', 'Grabow', 'Grams', 'Graul', 'Greiner', 'Grieger', 'Gries', 'Grimme', 'Gröger', 'Groth', 'Grün', 'Grundmann', 'Gründler', 'Günzel', 'Gutmann', 'Haack', 'Haag', 'Haber', 'Habermann', 'Häcker', 'Hackl', 'Hader', 'Hager', 'Hahne', 'Halbach', 'Hamann', 'Hampel', 'Hanisch', 'Harder', 'Harnisch', 'Hartig', 'Hartwig', 'Hasse', 'Haubold', 'Hauck', 'Haug', 'Hauschild', 'Hecker', 'Hegemann', 'Heid', 'Heide', 'Heidrich', 'Heil2', 'Heim', 'Heinemann', 'Heinze', 'Heise', 'Held', 'Helm', 'Hempel', 'Hendrich', 'Henke', 'Henkel', 'Henze', 'Herbst', 'Herold', 'Herz', 'Herzog', 'Hess', 'Heuer', 'Heyer', 'Hildebrandt', 'Hilger', 'Hille', 'Hiller', 'Hilt', 'Himmel', 'Hinze', 'Hirt', 'Hock', 'Hoffmeister', 'Hofmeister', 'Höhn', 'Hohmann', 'Holl', 'Holler', 'Holst', 'Holtz', 'Holz', 'Holzer', 'Homann', 'Hopf', 'Hörmann', 'Hornung', 'Hoyer', 'Hube', 'Hübsch', 'Hug', 'Hummel', 'Hund', 'Hunger', 'Hupfer', 'Ihle', 'Imhof', 'Iser', 'Jacob', 'Jahn', 'Jäkel', 'Janke', 'Jaschke', 'Jeschke', 'John', 'Jordan', 'Jost', 'Junge', 'Junker', 'Jürgens', 'Just', 'Kahl', 'Kalb', 'Kaminski2', 'Kampe', 'Kappel', 'Karl', 'Kasper', 'Kauer', 'Keil', 'Keim', 'Kell', 'Keppler', 'Kern', 'Kersten', 'Kessel', 'Kiel', 'Kienast', 'Kirsch', 'Kirschner', 'Kirst', 'Klaus', 'Klee', 'Klemm', 'Klett', 'Klier', 'Kling', 'Klinger', 'Klose', 'Kluge', 'Knapp', 'Knauer', 'Knebel', 'Knecht', 'Knop', 'Knorr', 'Koberg', 'Kober', 'Köck', 'Kohl', 'Kohlmann', 'Kolbe', 'Konrad', 'Kopf', 'Koppe', 'Körner', 'Kort', 'Kost', 'Krah', 'Kramer', 'Kranz', 'Krause', 'Krebs', 'Kreft', 'Kreis', 'Krieg', 'Krieger', 'Kroll', 'Krone', 'Kruse', 'Kubitz', 'Kuck', 'Kugler', 'Kühl', 'Kuhlmann', 'Kunert', 'Kunkel', 'Kurth', 'Lach', 'Lack', 'Lambert', 'Lammert', 'Landgraf', 'Lange', 'Langhans', 'Laub', 'Lauer', 'Laux', 'Lay', 'Lehner', 'Leicht', 'Leitner', 'Lemke', 'Lenk', 'Leopold', 'Lerch', 'Lessing', 'Leuschner', 'Licht', 'Lieb', 'Liebig', 'Lindner4', 'Link', 'List', 'Loch', 'Lohmann', 'Löhr', 'Lohse', 'Lotz', 'Löw', 'Lück', 'Lüders', 'Ludwig', 'Lux', 'Maas', 'Mack', 'Mahler', 'Maier', 'Malz', 'Mangold', 'Manz', 'Marquardt', 'Martens', 'Matthes', 'Mattern', 'Matthies', 'Mauer', 'Mehl', 'Meinhardt', 'Meister', 'Melzer', 'Menke', 'Menzel', 'Merkle', 'Mertz', 'Messner', 'Metz', 'Meurer', 'Meyerhoff', 'Michaelis', 'Mies', 'Mikat', 'Mittelstädt', 'Möbius', 'Mohr2', 'Moll', 'Morgenstern', 'Moritz', 'Mosler', 'Mühlbauer', 'Mühlenbeck', 'Münch', 'Mundt', 'Muth', 'Nadler', 'Naumann', 'Neef', 'Nehls', 'Neubauer', 'Neubert', 'Neuhaus', 'Niemann', 'Niemeyer', 'Nitsche', 'Noack', 'Nolting', 'Nordmann', 'Obermann', 'Oertel', 'Ohm', 'Olbrich', 'Oppermann', 'Ostermann', 'Otten', 'Pabst', 'Pahl', 'Paulus', 'Pech', 'Peter', 'Petri', 'Pfaff', 'Pfister', 'Philipp', 'Pilz', 'Platz', 'Plum', 'Pohle', 'Pöhlmann', 'Popp', 'Porsch', 'Prager', 'Preuß', 'Prinz', 'Probst', 'Prokop', 'Pusch', 'Putz', 'Quast', 'Rabe2', 'Rach', 'Rademann', 'Radtke', 'Rapp2', 'Rasch', 'Rath', 'Ratz', 'Rauch', 'Rausch', 'Rebmann', 'Recht', 'Rehm', 'Reich', 'Reichert', 'Reif', 'Reimer', 'Rein', 'Reinecke', 'Reis', 'Rentsch', 'Reuß', 'Richard', 'Riemer', 'Rieß', 'Rinke', 'Risch', 'Ritz', 'Rode', 'Röder', 'Rohde', 'Röhl', 'Rohr', 'Roller', 'Rösner', 'Roß', 'Rost', 'Rübsam', 'Ruck', 'Rüdiger', 'Ruf', 'Ruppert', 'Rusch', 'Saal', 'Sachs', 'Sack', 'Salzmann', 'Sattler', 'Sauter', 'Schaaf', 'Schaller', 'Scharf', 'Schauer', 'Scheel', 'Scheffler', 'Schell', 'Scherer', 'Scheuer', 'Schiller', 'Schindler', 'Schirmer', 'Schlaf', 'Schleicher', 'Schlüter', 'Schmelzer', 'Schmitz', 'Schnabel', 'Schnell', 'Schober', 'Scholz2', 'Schön', 'Schott2', 'Schrader', 'Schramm', 'Schreiner', 'Schröter', 'Schubert', 'Schuh', 'Schulten', 'Schuller', 'Schumann', 'Schuppe', 'Schur', 'Schwan', 'Schweitzer2', 'Seeger', 'Seibert', 'Seibel', 'Seidl', 'Seiler', 'Selig', 'Sell', 'Siebert', 'Siegel', 'Siegert', 'Sieg', 'Simons', 'Sinn', 'Specht', 'Speck', 'Spengler', 'Sperling', 'Spieß', 'Springer', 'Stadler', 'Stange', 'Starck', 'Staub', 'Steffen', 'Steger', 'Steinbach', 'Steinert', 'Steinke', 'Stemmler', 'Stender', 'Stern', 'Stiller', 'Stock', 'Stöhr', 'Storch', 'Stoltz', 'Strack', 'Stratmann', 'Strobel', 'Struck', 'Sturm2', 'Süß', 'Täuber', 'Tank', 'Teubner', 'Thamm', 'Theis', 'Thieme', 'Thoma', 'Timm', 'Tischer', 'Trapp', 'Treiber', 'Trost', 'Uhl', 'Uhlig', 'Ullmann', 'Unger', 'Urban', 'Vetter', 'Viehweg', 'Vogl', 'Volk', 'Voll', 'Voss', 'Wachter', 'Wagener', 'Wahl', 'Waldmann', 'Walz', 'Wanner', 'Warnke', 'Weckesser', 'Wedel', 'Wehner', 'Weidemann', 'Weigel', 'Weiland', 'Weinert', 'Weinmann', 'Weise', 'Weiser', 'Weller', 'Welsch', 'Wendler', 'Wenger', 'Wengert', 'Werth', 'Wessel', 'Westphal', 'Wetzel', 'Weyer', 'Wichert', 'Widmann', 'Wiedemann', 'Wiegmann', 'Wild', 'Wilke', 'Will', 'Willms', 'Winkelmann', 'Winkels', 'Winter2', 'Wirtz', 'Wischnewski', 'Witte', 'Wittig', 'Wöhler', 'Wolfram', 'Wollny', 'Wulff', 'Wunder', 'Wurm', 'Zahn', 'Zander', 'Zapf', 'Zech', 'Zeller', 'Zenker', 'Zeuner', 'Ziegert', 'Zimmer', 'Zink', 'Zorn', 'Zuber', 'Zwick', 'Becker', 'Schulz', 'Wagner', 'Hoffmann', 'Koch', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Braun', 'Zimmermann', 'Krüger', 'Hartmann', 'Lange', 'Werner', 'Krause', 'Lehmann', 'Schmitt', 'Meier', 'Vogel', 'Friedrich', 'Keller', 'Günther', 'Frank', 'Berger', 'Winkler', 'Roth', 'Lorenz', 'Peters', 'Engel', 'Seidel', 'Müller', 'Schmidt', 'Fischer', 'Weber', 'Meyer', 'Schäfer', 'Bauer', 'Schulze', 'Kaiser', 'Fuchs', 'Scholl', 'Hahn', 'Herrmann', 'König', 'Walter', 'Mayer', 'Huber', 'Kaufmann', 'Ludwig', 'Böhm', 'Winter', 'Kraus', 'Martin', 'Schumacher', 'Krämer', 'Vogt', 'Stein', 'Jäger', 'Otto', 'Sommer', 'Groß', 'Seifert', 'Heinrich', 'Brandt', 'Haas', 'Schreiber', 'Graf', 'Schulte', 'Dietrich', 'Ziegler', 'Kuhn', 'Kühn', 'Pohl', 'Engelhardt', 'Busch', 'Horn', 'Bergmann', 'Thomas', 'Voigt', 'Sauer', 'Arnold', 'Wolff', 'Pfeiffer', 'Albrecht', 'Ernst', 'Franke', 'Simon', 'Beck', 'Lindemann', 'Brinkmann', 'Hesse', 'Wendt', 'Haase', 'Gerlach', 'Kühne', 'Böttcher', 'Thiel', 'Rudolph', 'Ebert', 'Möller', 'Kraft', 'Witt', 'Reuter', 'Hübner', 'Jansen', 'Ackermann', 'Hansen', 'Heinz', 'Behrens', 'Dittrich', 'Kunz', 'Schütz', 'Schuster', 'Bach', 'Baumann', 'Mertens', 'Sander', 'Wilhelm', 'Ott', 'Wenzel', 'Marx', 'Paul', 'Schmid', 'Riedel', 'Brenner', 'Hofmann', 'Steiner', 'Kessler', 'Fiedler', 'Michel', 'Gärtner', 'Lenz', 'Jung', 'Hoppe', 'Schade', 'Stahl', 'Nowak', 'Fink', 'Rieger', 'Pieper', 'Eckert', 'Bock', 'Funk', 'Heller', 'Maurer', 'Rose', 'Schneider', 'Wirth', 'Henning', 'Thiele', 'Hennig', 'Wiese', 'Frey', 'Rau', 'Kirchner', 'Löffler', 'Ritter', 'Geiger', 'Beyer', 'Lang', 'Kolb', 'Reinhardt', 'Moser', 'Hagen', 'Weiß', 'Busse', 'Blum', 'Mohr', 'Nagel', 'Wegner', 'Koller', 'Kopp', 'Schenk', 'Strauß', 'Ulrich', 'Weis', 'Kurz', 'Barth', 'Glaser', 'Schwab', 'Stark', 'Kremer', 'Bischoff', 'Hermann', 'Schlegel', 'Burkhardt', 'Langer', 'Fritz', 'Wagenführ', 'Dörr', 'Frenzel', 'Köhler', 'Heine', 'Hirsch', 'Lindner2', 'Rothe', 'Mann', 'Grimm', 'Brückner', 'Schilling', 'Kretschmar', 'Raab', 'Petzold', 'Reichel', 'Ehlers', 'Hecht', 'Brand', 'Faber', 'Wolter', 'Sturm', 'Trautmann', 'Bieler', 'Adam', 'Krebs', 'Hein', 'Stoll', 'Linke', 'Hofer', 'Engels', 'Wille', 'Rademacher', 'Kranz', 'Bender', 'Esser', 'Lüdtke', 'Brockmann', 'Kemper', 'Tiedemann', 'Gebauer', 'Stolz', 'Wolters', 'Schott', 'Lutz', 'Göbel', 'Schick', 'Fleischer', 'Pfeifer', 'Mayr', 'Kast', 'Bartsch2', 'Reimann', 'Kroll', 'Hartung', 'Dreher', 'Sprenger', 'Wiegand', 'Heßler', 'Feldmann', 'Diehl', 'Vollmer', 'Brauer', 'Kunze', 'Ahrens', 'Bühler', 'Metzger', 'Lampe', 'Bruns', 'Wichmann', 'Steffens', 'Kamps', 'Tillmann', 'Fröhlich', 'Kamm', 'Gottschalk', 'Wulf', 'Nolte', 'Hanke', 'Wendel', 'Hinz', 'Schwarze', 'Kerner', 'Nickel', 'Sievers', 'Hoff', 'Mielke', 'Stephan', 'Knoll', 'Rupp', 'Stumpf', 'Reiter', 'Erdmann', 'Gruber', 'Bayer', 'Pape', 'Wittmann', 'Hauser', 'Ahlers', 'Ortmann', 'Haupt', 'Rösler2', 'Kiefer', 'Brunner', 'Jakob', 'Lindner3'],
    by: ['Gruber', 'Wimmer', 'Brandl', 'Hinterberger', 'Moosbauer', 'Obermaier', 'Huber', 'Stadler', 'Eder', 'Lechner', 'Reischl', 'Hofbauer', 'Wallner', 'Pichler', 'Aigner2', 'Rottmeier', 'Kronawitter', 'Gschwendtner', 'Zehetmair', 'Haslinger', 'Schwaiger', 'Mittermeier', 'Brunnhuber', 'Feichtner', 'Englmaier', 'Sedlmayr', 'Ostermaier', 'Hartl', 'Strobl', 'Kiermeier', 'Lindinger', 'Ertl', 'Schmuck', 'Wagenhuber', 'Ziegltrum', 'Zellner', 'Gerstl', 'Zwickl', 'Fröschl', 'Kufner'],
    sw: ['Häberle', 'Bäuerle', 'Kächele', 'Schäufele', 'Bürkle', 'Fritschle', 'Maier-Leibnitz', 'Riedlinger', 'Eberle', 'Wäschle', 'Haug', 'Schempp', 'Kienzle', 'Rapp', 'Gaiser', 'Gutekunst', 'Kimmich2', 'Bechtle', 'Schuon', 'Ruoff'],
    ost: ['Lehmke', 'Kaschke', 'Pfützner', 'Ulbrich', 'Kretzschmar', 'Pietsch', 'Wachtel', 'Fritzsche', 'Jänicke', 'Lindow', 'Pankow', 'Reschke', 'Matschke', 'Gnauck', 'Wustrow', 'Tetzlaff', 'Rabe', 'Zschoche', 'Bölke', 'Krenzlin', 'Lehnert', 'Starke', 'Teichert', 'Görlitz', 'Rösch', 'Schiemenz', 'Dalitz', 'Plötz', 'Henschke', 'Mittag', 'Petrick', 'Kuschel', 'Wünsche', 'Bräuer', 'Domke'],
    nord: ['Janssen', 'Petersen', 'Thomsen', 'Ehlers', 'Ohlsen', 'Carstensen', 'Jacobsen', 'Lorenzen', 'Brodersen', 'Feddersen', 'Hinrichs', 'Harms', 'Dirks', 'Onken', 'Eilers', 'Boysen', 'Momsen', 'Christiansen', 'Nissen', 'Hamkens', 'Ketelsen', 'Rickmers', 'Gerdes', 'Folkerts', 'Wübbena'],
    sorb: ['Nowka', 'Krawc', 'Dzumbir', 'Wjelan', 'Šołta', 'Mróz'],
    tr: ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir2', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek', 'Polat', 'Korkmaz', 'Erdem', 'Akın', 'Güler', 'Uçar', 'Tekin', 'Bulut', 'Karaca', 'Aktaş', 'Ünal', 'Keskin', 'Avcı', 'Özer', 'Turan', 'Güneş', 'Taş', 'Akgül', 'Bozkurt', 'Erdoğan2', 'Karakaya', 'Sarı', 'Altun', 'Işık', 'Duman', 'Çakır', 'Sönmez', 'Güven', 'Yavuz', 'Ateş', 'Bayram', 'Tuncer', 'Coşkun', 'Gündoğdu', 'Akbulut', 'Yücel', 'Ekinci', 'Kaplan', 'Uysal', 'Toprak', 'Tunç', 'Çiftçi', 'Oral', 'Eren', 'Kahraman', 'Özgür', 'Durmaz', 'Baysal', 'Esen', 'Soylu', 'Alkan', 'Kocabaş', 'Gürbüz', 'Elmas', 'Sevinç', 'Kartal'],
    ar: ['Haddad', 'Khalil', 'Nasser', 'Saleh', 'Hamdan', 'Mansour', 'Darwish', 'Haidar', 'Abboud', 'El-Masri', 'Youssef', 'Karimi2', 'Rahman', 'Barakat', 'Aziz', 'Hussein', 'Ibrahim', 'Kassem', 'Chaaban', 'Fayad', 'Jaber', 'Mahmoud'],
    ku: ['Bozan', 'Zana', 'Akyol', 'Doğru', 'Kızıl', 'Botan', 'Baran', 'Ekin'],
    pl: ['Nowicki', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański', 'Woźniak', 'Dąbrowski', 'Kozłowski', 'Jankowski', 'Mazur', 'Krawczyk', 'Kaczmarek', 'Piotrowski', 'Grabowski', 'Pawlak', 'Michalski', 'Król', 'Wieczorek', 'Jabłoński', 'Wróbel', 'Majewski', 'Olszewski', 'Stępień', 'Malinowski', 'Jaworski', 'Adamczyk', 'Dudek', 'Górski', 'Sikora', 'Walczak', 'Rutkowski', 'Baran2', 'Szewczyk', 'Ostrowski', 'Tomaszewski', 'Pietrzak', 'Marciniak'],
    ru: ['Becker-Iwanow', 'Schmidt-Kowaljow', 'Petrow', 'Iwanow', 'Smirnow', 'Kusnezow', 'Popow', 'Wolkow', 'Sokolow', 'Lebedew', 'Morosow', 'Nowikow', 'Fedorow', 'Pawlow', 'Semjonow', 'Wagner-Orlow', 'Klassen', 'Penner', 'Friesen', 'Dyck', 'Unruh', 'Neufeld', 'Thiessen', 'Wiens', 'Janzen'],
    it: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Costa', 'Giordano', 'Mancini', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Caruso', 'Ferrara', 'Galli', 'Leone', 'Longo', 'Martinelli', 'Vitale', 'Serra', 'Coppola', 'De Santis', 'D\'Angelo', 'Marchetti', 'Parisi', 'Villa', 'Ferri', 'Fabbri'],
    gr: ['Papadopoulos', 'Georgiou', 'Dimitriou', 'Nikolaou', 'Ioannidis', 'Konstantinidis', 'Papageorgiou', 'Christodoulou', 'Vasileiou', 'Athanasiou', 'Karagiannis', 'Pappas', 'Antoniou', 'Oikonomou', 'Makris', 'Alexiou', 'Theodorou', 'Michailidis', 'Lazaridis', 'Stavrou', 'Petridis', 'Kostopoulos', 'Angelidis', 'Samaras2', 'Tsakiris'],
    bal: ['Jovanović', 'Petrović', 'Nikolić', 'Marković', 'Đorđević', 'Stojanović', 'Ilić', 'Horvat', 'Kovačević', 'Babić', 'Marić', 'Novak', 'Hodžić', 'Begić', 'Hadžić', 'Delić', 'Kovač', 'Jurić', 'Knežević', 'Vuković', 'Pavlović', 'Mehmedović', 'Šarić', 'Tomić', 'Popović', 'Radić', 'Lukić', 'Perić', 'Bašić', 'Kurtović'],
    ir: ['Karimi', 'Hosseini', 'Rezaei', 'Mohammadi', 'Ahmadi', 'Jafari', 'Rahimi', 'Moradi', 'Sadeghi', 'Ghorbani', 'Farahani', 'Tehrani', 'Amini', 'Nazari', 'Shirazi'],
    vn: ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Vu', 'Dang', 'Bui', 'Do', 'Ngo'],
    af: ['Mensah', 'Asante', 'Okafor', 'Diallo', 'Traoré', 'Owusu', 'Nwosu', 'Boateng2', 'Adeyemi', 'Kamara', 'Ndiaye', 'Abiodun']
  };

  // Bausteine für weitere, plausibel klingende deutsche Nachnamen (damit sich keiner wiederholt).
  const STEM = ['Linden', 'Eichen', 'Buchen', 'Rosen', 'Wald', 'Feld', 'Berg', 'Stein', 'Bach', 'Mühl', 'Kirch', 'Hof', 'Neu', 'Ober', 'Unter', 'Hoch', 'Klein', 'Groß', 'Lang', 'Schön', 'Grün', 'Weiß', 'Gold', 'Silber', 'Eisen', 'Wein', 'Korn', 'Sonnen', 'Heide', 'Brunn', 'Holz', 'Busch', 'Wies', 'Moos', 'Kreuz', 'Brück', 'Ditt', 'Ehr', 'Hart', 'Wolf', 'Bern', 'Diet', 'Rein', 'Fried', 'Gott', 'Hel', 'Adel'];
  const SUFFIX = ['mann', 'er', 'meier', 'bauer', 'berger', 'hofer', 'brink', 'kamp', 'haus', 'hagen', 'horst', 'hoff', 'beck', 'bach', 'stein', 'feld', 'ner', 'hardt', 'mund', 'rich', 'ling'];

  // Bekannte Politikernamen – kommen im Spiel nicht vor.
  const BLOCK = new Set(['Merz', 'Scholz', 'Habeck', 'Weidel', 'Lindner', 'Wagenknecht', 'Söder', 'Baerbock', 'Steinmeier', 'Merkel', 'Klingbeil', 'Esken', 'Reichinnek', 'Chrupalla', 'Spahn', 'Laschet', 'Wüst', 'Kretschmer', 'Pistorius', 'Faeser', 'Dobrindt', 'Linnemann', 'Banaszak', 'Brantner', 'Dröge', 'Haßelmann', 'Mützenich', 'Miersch', 'Kubicki', 'Dürr', 'Seehofer', 'Gysi', 'Ramelow', 'Höcke', 'Gauland', 'Wadephul', 'Reiche', 'Klöckner', 'Prien', 'Bär', 'Hubertz', 'Wildberger', 'Hubig', 'Özdemir', 'Aigner', 'Kimmich', 'Boateng', 'Bartsch', 'Rösler', 'Samaras', 'Erdoğan', 'Kretschmann', 'Lauterbach', 'Heil', 'Schulze-Föcking', 'Woidke', 'Voigt-Ministerpräsident', 'Schwesig', 'Rhein', 'Günther-MP', 'Weil', 'Lies', 'Rehlinger', 'Schweitzer', 'Wegner-RBM', 'Tschentscher', 'Bovenschulte', 'Haseloff', 'Schulze-MP']);

  // Wie Parteien ihre Kandidaturen aufstellen (grob nach den Fraktionen 2025).
  const PROFILE = {
    union: { female: 0.25, age: [0.45, 0.45, 0.10], mig: 0.05, origin: { tr: 0.25, pl: 0.2, ru: 0.15, it: 0.15, gr: 0.1, bal: 0.1, ir: 0.05 } },
    afd: { female: 0.12, age: [0.45, 0.47, 0.08], mig: 0.04, origin: { ru: 0.6, pl: 0.2, bal: 0.1, it: 0.1 } },
    spd: { female: 0.45, age: [0.3, 0.5, 0.2], mig: 0.15, origin: { tr: 0.4, ar: 0.08, ku: 0.07, pl: 0.1, it: 0.1, gr: 0.08, bal: 0.1, ir: 0.04, af: 0.03 } },
    gruene: { female: 0.58, age: [0.12, 0.5, 0.38], mig: 0.18, origin: { tr: 0.38, ku: 0.1, ar: 0.07, ir: 0.12, it: 0.08, gr: 0.05, bal: 0.06, vn: 0.04, af: 0.06, pl: 0.04 } },
    linke: { female: 0.55, age: [0.2, 0.38, 0.42], mig: 0.2, origin: { tr: 0.35, ku: 0.15, ar: 0.12, ir: 0.08, bal: 0.08, gr: 0.06, it: 0.05, af: 0.06, vn: 0.05 } },
    bsw: { female: 0.42, age: [0.42, 0.48, 0.10], mig: 0.1, origin: { ru: 0.3, tr: 0.25, pl: 0.15, bal: 0.15, it: 0.15 } },
    fdp: { female: 0.25, age: [0.22, 0.5, 0.28], mig: 0.07, origin: { tr: 0.3, it: 0.2, gr: 0.15, ir: 0.15, pl: 0.1, bal: 0.1 } },
    fw: { female: 0.2, age: [0.4, 0.5, 0.1], mig: 0.02, origin: { it: 0.5, bal: 0.5 } },
    volt: { female: 0.5, age: [0.05, 0.35, 0.6], mig: 0.22, origin: { it: 0.2, gr: 0.1, tr: 0.25, ir: 0.15, pl: 0.1, af: 0.1, vn: 0.1 } },
    tierschutz: { female: 0.6, age: [0.3, 0.5, 0.2], mig: 0.05, origin: { tr: 0.4, pl: 0.3, it: 0.3 } }
  };
  const CITY = { BE: 2.2, HH: 2, HB: 1.8, NW: 1.3, HE: 1.35, BW: 1.3, BY: 1, NI: 0.9, RP: 0.9, SL: 0.9, SH: 0.7, MV: 0.3, BB: 0.35, ST: 0.3, SN: 0.35, TH: 0.3 };
  const EAST = { MV: 1, BB: 1, ST: 1, SN: 1, TH: 1, BE: 0.3 };

  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const clean = s => s.replace(/[0-9]+$/, '').replace(/-(MP|RBM|Ministerpräsident)$/, '');

  function create(seed) {
    const r = rng(seed);
    const pick = a => a[Math.floor(r() * a.length)];
    const weighted = obj => { let x = r() * Object.values(obj).reduce((a, b) => a + b, 0); for (const k in obj) { x -= obj[k]; if (x <= 0) return k; } return Object.keys(obj)[0]; };
    const used = new Set(BLOCK);
    // Vorrat je Herkunft, gemischt; deutsche Namen werden um zusammengesetzte ergänzt.
    const pools = {};
    Object.keys(LAST).forEach(k => {
      pools[k] = LAST[k].map(clean).filter(n => !BLOCK.has(n));
      for (let i = pools[k].length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pools[k][i], pools[k][j]] = [pools[k][j], pools[k][i]]; }
    });
    // Alle Kombinationen einmal gemischt vorhalten – so wiederholt sich kein zusammengesetzter Name.
    const compounds = [];
    STEM.forEach(st => SUFFIX.forEach(su => { if (st.slice(-2).toLowerCase() !== su.slice(0, 2)) compounds.push(st + su); }));
    for (let i = compounds.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [compounds[i], compounds[j]] = [compounds[j], compounds[i]]; }
    let serial = 0;
    function compound() {
      while (compounds.length) { const n = compounds.pop(); if (!used.has(n)) return n; }
      serial += 1;
      return pick(STEM) + pick(SUFFIX) + ['s', 'e', 'ing', 'inger'][serial % 4] + (serial > 4 ? serial : '');
    }
    function surname(origin) {
      const p = pools[origin] || pools.de;
      while (p.length) { const n = p.pop(); if (!used.has(n)) { used.add(n); return n; } }
      if (origin !== 'de') return surname('de');
      const n = compound();
      used.add(n);
      return n;
    }

    // Eine Person: Partei, Land, optional Geschlecht. Gibt Vor- und Nachname zurück.
    function person(party, land, opts) {
      opts = opts || {};
      const pr = PROFILE[party] || PROFILE.spd;
      const female = opts.female !== undefined ? opts.female : r() < pr.female;
      const g = female ? 'f' : 'm';
      const age = r() < pr.age[0] ? 'old' : r() < pr.age[1] / (1 - pr.age[0] || 1) ? 'mid' : 'young';
      const migP = Math.min(0.6, pr.mig * (CITY[land] || 1));
      let origin = 'de';
      if (r() < migP) origin = weighted(pr.origin);
      let first;
      if (origin === 'de') {
        const east = EAST[land] || 0;
        if ((land === 'BY' || land === 'BW') && r() < 0.35) first = pick(FIRST.by[g]);
        else if (east && age !== 'young' && r() < 0.45 * east) first = pick(FIRST.ost[g]);
        else if ((land === 'SH' || land === 'HB' || land === 'HH' || land === 'NI') && r() < 0.2) first = pick(FIRST.nord[g]);
        else first = pick(FIRST.de[g][age]);
      } else {
        // In der zweiten Generation oft ein deutscher oder internationaler Vorname.
        first = r() < 0.25 ? pick(FIRST.de[g][age === 'old' ? 'mid' : age]) : pick((FIRST[origin] || FIRST.de.m)[g] || FIRST.de[g].mid);
      }
      let lastOrigin = origin;
      if (origin === 'de') {
        if (land === 'BY' && r() < 0.4) lastOrigin = 'by';
        else if (land === 'BW' && r() < 0.3) lastOrigin = 'sw';
        else if (EAST[land] === 1 && r() < 0.35) lastOrigin = r() < 0.06 && land === 'SN' || land === 'BB' && r() < 0.05 ? 'sorb' : 'ost';
        else if ((land === 'SH' || land === 'NI' || land === 'HB') && r() < 0.3) lastOrigin = 'nord';
        else if (party === 'afd' && r() < 0.15) lastOrigin = 'ru';
      }
      const last = surname(lastOrigin);
      return { first, last, full: first + ' ' + last, female, origin };
    }

    return { person };
  }

  const NAMES = { create, PROFILE };
  if (typeof module !== 'undefined' && module.exports) module.exports = NAMES;
  else root.BTW_NAMES = NAMES;
})(this);
