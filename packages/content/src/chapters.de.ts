// Lernkapitel je Thema (eigene Formulierungen, Stand September 2026). Markdown, 250 bis 500 Wörter je Kapitel.
// Nur allgemein dokumentierte Regeln; keine amtlichen Prüfungsinhalte.
import { defaultLicenseCodes, materialKindOf } from "./topics.js";
import { CONTENT_SOURCE, LEGAL_BASIS_DATE, type Chapter, type ReviewStatus, type TopicCode } from "./types.js";

function ch(topic: TopicCode, title: string, estimatedMinutes: number, bodyMarkdown: string, reviewStatus: ReviewStatus = "published"): Chapter {
  return {
    topic,
    title,
    bodyMarkdown: bodyMarkdown.trim() + "\n",
    estimatedMinutes,
    licenseCodes: defaultLicenseCodes(materialKindOf(topic)),
    legalBasisDate: LEGAL_BASIS_DATE,
    source: CONTENT_SOURCE,
    reviewStatus,
  };
}

export const chapters: readonly Chapter[] = [
  ch("gefahrenlehre", "Gefahrenlehre und Risikofaktor Mensch", 12, `
# Gefahrenlehre und Risikofaktor Mensch

Die meisten Unfälle entstehen nicht durch Technik, sondern durch Menschen. Wer die eigenen Grenzen kennt, fährt sicherer.

## Kernregeln

- **Reaktionszeit:** Ein aufmerksamer Fahrer braucht etwa eine Sekunde, bis er auf eine Gefahr reagiert. Bei 50 km/h legt das Fahrzeug in dieser Zeit rund 15 Meter zurück. Müdigkeit, Alkohol, Medikamente und Ablenkung verlängern die Reaktionszeit deutlich.
- **Anhalteweg:** Der Anhalteweg besteht aus Reaktionsweg und Bremsweg. Faustformeln: Reaktionsweg = (km/h ÷ 10) × 3, Bremsweg = (km/h ÷ 10)².
- **Ablenkung:** Elektronische Geräte dürfen beim Fahren nur benutzt werden, wenn sie weder aufgenommen noch gehalten werden (§ 23 Abs. 1a StVO). Das gilt auch an der roten Ampel bei laufendem Motor.
- **Müdigkeit:** Gegen Sekundenschlaf hilft nur eine echte Pause oder Schlaf. Offene Fenster und laute Musik wirken höchstens kurz.
- **Emotionen:** Wut, Stress und Trauer verengen die Wahrnehmung und erhöhen die Risikobereitschaft.
- **Blickführung:** Weit vorausschauen, regelmäßig in die Spiegel sehen und vor jedem Richtungswechsel den Schulterblick machen, damit der tote Winkel abgedeckt ist.

## Typische Fehler

- Das eigene Können überschätzen, besonders in den ersten Jahren nach der Prüfung.
- Nur auf das Fahrzeug direkt voraus schauen statt auf den Verkehr weit vorn.
- Kurze Blicke auf das Smartphone für harmlos halten. Zwei Sekunden Blindflug bei 50 km/h sind fast 30 Meter.
- Müdigkeit ignorieren, weil das Ziel nah ist.

## Merksätze

- Eine Sekunde Schrecksekunde.
- Anhalten = Reagieren + Bremsen.
- Wer weit schaut, hat Zeit.

## Hintergrund

Fahranfänger haben ein deutlich erhöhtes Unfallrisiko, weil viele Teilaufgaben noch bewusst gesteuert werden müssen und Erfahrung mit kritischen Situationen fehlt. Deshalb gibt es die zweijährige Probezeit und das absolute Alkoholverbot für Fahranfänger und unter 21-Jährige. Gute Fahrer planen Reserven ein: mehr Abstand, weniger Tempo an unübersichtlichen Stellen und Bremsbereitschaft, sobald Kinder, Radfahrende oder ältere Menschen im Blickfeld sind.
`),
  ch("recht", "Fahrerlaubnis und Recht", 12, `
# Fahrerlaubnis und Recht

Dieses Kapitel fasst die Regeln zusammen, die den Weg zur Fahrerlaubnis und die ersten Jahre danach betreffen.

## Kernregeln

- **Klasse B:** Kraftfahrzeuge bis 3.500 kg zulässiger Gesamtmasse mit höchstens acht Sitzplätzen außer dem Fahrersitz. Anhänger bis 750 kg immer, schwerere nur, wenn die Kombination 3.500 kg nicht überschreitet.
- **Probezeit:** Zwei Jahre ab Erteilung. Ein schwerwiegender Verstoß führt zum Aufbauseminar und verlängert die Probezeit um zwei Jahre.
- **Theorieprüfung:** Beim Ersterwerb 30 Fragen, höchstens zehn Fehlerpunkte, aber nicht zwei Fünf-Punkte-Fragen falsch. Die bestandene Theorie ist zwölf Monate gültig.
- **Sperrfrist:** Nach einer nicht bestandenen Prüfung frühestens nach zwei Wochen erneut antreten.
- **Sonderfahrten:** Mindestens 5 Überlandfahrten, 4 Autobahnfahrten und 3 Fahrten bei Dunkelheit.
- **BF17:** Begleitpersonen mindestens 30 Jahre alt, seit mindestens fünf Jahren Klasse B, höchstens ein Punkt im Fahreignungsregister.
- **B197:** Prüfung auf Automatik, aber mindestens zehn Schaltstunden und eine bescheinigte Testfahrt von mindestens 15 Minuten. Der Führerschein enthält keine Automatikbeschränkung.
- **B196:** Nach einer Schulung ohne Prüfung dürfen Inhaber der Klasse B (mindestens 25 Jahre, fünf Jahre Klasse B) Leichtkrafträder bis 125 cm³ und 11 kW fahren, nur in Deutschland.
- **Punkte:** Bei acht Punkten im Fahreignungsregister wird die Fahrerlaubnis entzogen.
- **Mitführpflicht:** Führerschein und Zulassungsbescheinigung Teil I gehören ins Fahrzeug.

## Typische Fehler

- Die Gültigkeit der Theorieprüfung aus den Augen verlieren und die Praxis zu spät planen.
- Annehmen, dass ein Foto des Führerscheins auf dem Handy genügt.
- Die 0,0-Promille-Regel in der Probezeit mit der 0,5-Grenze verwechseln.

## Merksätze

- 5-4-3: Überland, Autobahn, Nacht.
- Zwölf Monate Theorie, zwei Wochen Sperre.
- Acht Punkte, Schein weg.

## Hintergrund

Die Fahrerlaubnis ist die Berechtigung, der Führerschein nur das Dokument dazu. Wer den Führerschein vergisst, handelt ordnungswidrig, verliert aber nicht die Fahrerlaubnis. Wer ohne Fahrerlaubnis fährt, begeht dagegen eine Straftat. Diese Unterscheidung hilft in vielen Fragen.
`),
  ch("verkehrszeichen", "Verkehrszeichen", 15, `
# Verkehrszeichen

Verkehrszeichen ordnen sich in drei Gruppen. Wer die Form kennt, erkennt die Bedeutung auch bei schlechter Sicht.

## Kernregeln

- **Gefahrzeichen** (dreieckig, roter Rand) mahnen zu erhöhter Aufmerksamkeit. Außerorts stehen sie in der Regel 150 bis 250 Meter vor der Gefahrstelle.
- **Vorschriftzeichen** (meist rund) enthalten Gebote und Verbote: Stoppschild (Zeichen 206) verlangt immer das Anhalten, Vorfahrt gewähren (Zeichen 205) nur, wenn es nötig ist. Verbot der Einfahrt (Zeichen 267) steht meist am Ende einer Einbahnstraße.
- **Richtzeichen** (meist rechteckig) geben Hinweise: Vorfahrtstraße (Zeichen 306), Vorfahrt an der nächsten Kreuzung (Zeichen 301), verkehrsberuhigter Bereich (Zeichen 325.1).
- **Halteverbote:** Im eingeschränkten Halteverbot (Zeichen 286) sind bis zu drei Minuten Halten sowie Ein- und Aussteigen und Be- und Entladen erlaubt. Im absoluten Halteverbot (Zeichen 283) ist jedes Halten verboten.
- **Zonen:** Tempo-30-Zonen und andere Zonenregelungen gelten bis zum Aufhebungszeichen, auch über Kreuzungen hinweg.
- **Fahrradstraße** (Zeichen 244.1): Tempo 30, Radfahrende dürfen nebeneinander fahren, Kraftfahrzeuge nur mit Zusatzzeichen.
- **Andreaskreuz** (Zeichen 201): Der Schienenverkehr hat Vorrang.
- **Überholverbot** (Zeichen 276): Mehrspurige Kraftfahrzeuge und Krafträder mit Beiwagen dürfen nicht überholt werden; Fahrräder mit ausreichendem Abstand schon.

## Typische Fehler

- Zeichen 301 mit Zeichen 306 verwechseln: Das Dreieck mit dem breiten schwarzen Pfeil (301) gilt nur für die nächste Kreuzung, das gelbe Quadrat (306) bis zum Ende der Vorfahrtstraße.
- Am Stoppschild nur abbremsen statt vollständig anzuhalten.
- Im verkehrsberuhigten Bereich außerhalb markierter Flächen parken oder schneller als Schrittgeschwindigkeit fahren.

## Merksätze

- Dreieck warnt, Kreis befiehlt, Rechteck informiert.
- Zeichen 301 gilt nur einmal, 306 bis zum Ende.
- Stopp heißt Stillstand.

## Hintergrund

Zusatzzeichen ändern oder beschränken die Bedeutung eines Verkehrszeichens, etwa mit Zeitangaben oder Fahrzeugarten. Sie gehören immer zum darüber stehenden Zeichen. Verkehrszeichen stehen im Regelfall rechts; Lichtzeichen und Weisungen der Polizei gehen ihnen vor.
`),
  ch("strassenbenutzung", "Straßenbenutzung und Autobahn", 12, `
# Straßenbenutzung und Autobahn

Auf Autobahnen und Kraftfahrstraßen gelten besondere Regeln, weil dort mit hohen Geschwindigkeiten gefahren wird.

## Kernregeln

- **Zulassung:** Autobahnen und Kraftfahrstraßen dürfen nur Kraftfahrzeuge benutzen, deren bauartbedingte Höchstgeschwindigkeit über 60 km/h liegt.
- **Auffahren:** Der Beschleunigungsstreifen dient dem Angleichen der Geschwindigkeit. Wer auffährt, hat keine Vorfahrt.
- **Verbote:** Wenden, Rückwärtsfahren und Halten sind auf der Autobahn verboten. Der Seitenstreifen darf nur in Notfällen oder bei Freigabe durch Verkehrszeichen befahren werden.
- **Richtgeschwindigkeit:** 130 km/h sind eine Empfehlung. Wer deutlich schneller fährt, kann bei einem Unfall mithaften.
- **Rettungsgasse:** Sobald der Verkehr stockt, weichen Fahrzeuge auf dem linken Fahrstreifen nach links aus, alle anderen nach rechts. Die Gasse liegt also zwischen dem linken und dem rechts daneben liegenden Fahrstreifen.
- **Reißverschluss:** Bei Fahrstreifenverengung erst unmittelbar vor der Verengung abwechselnd einordnen.
- **Rechts überholen:** Grundsätzlich wird links überholt. Bildet sich links eine Schlange, darf rechts nur mit geringfügig höherer Geschwindigkeit vorbeigefahren werden.
- **Kinder auf dem Rad:** Bis zum vollendeten achten Lebensjahr müssen Kinder den Gehweg benutzen, bis zum vollendeten zehnten dürfen sie es. Eine Aufsichtsperson ab 16 Jahren darf ein Kind bis acht Jahre begleiten.

## Typische Fehler

- Am Ende des Beschleunigungsstreifens anhalten und auf eine Lücke warten.
- Die Rettungsgasse erst bilden, wenn Blaulicht zu sehen ist.
- Nach einer verpassten Ausfahrt zurücksetzen. Die nächste Ausfahrt kostet nur Zeit.
- Bei einer Verengung früh einordnen und die Fahrbahnfläche verschenken.

## Merksätze

- Rechte Hand: Daumen links, Finger rechts, so liegt die Rettungsgasse.
- Auffahren heißt anpassen, nicht erzwingen.
- Verpasst ist nicht verloren: nächste Ausfahrt.

## Hintergrund

Das Rechtsfahrgebot gilt auch auf mehrspurigen Straßen. Der linke Fahrstreifen ist zum Überholen da, nicht zum Dauerfahren. Wer auf dem Seitenstreifen liegen bleibt, sichert ab und verlässt das Fahrzeug hinter die Schutzplanke, weil dort die Gefahr durch auffahrende Fahrzeuge am größten ist.
`),
  ch("vorfahrt", "Vorfahrt", 15, `
# Vorfahrt

Vorfahrtfehler gehören zu den häufigsten Unfallursachen mit schweren Folgen. Deshalb zählen Vorfahrtfragen in der Prüfung fünf Punkte.

## Kernregeln

- **Rangfolge:** Weisungen der Polizei gehen Lichtzeichen vor, Lichtzeichen gehen Verkehrszeichen vor, Verkehrszeichen gehen der Grundregel vor.
- **Rechts vor links:** An Kreuzungen und Einmündungen ohne Zeichen hat Vorfahrt, wer von rechts kommt. Das gilt auch an T-Einmündungen: Die durchgehende Straße hat keinen automatischen Vorrang.
- **Ausnahmen:** Wer aus einem Feld- oder Waldweg, aus einem Grundstück, einem verkehrsberuhigten Bereich, einer Fußgängerzone oder über einen abgesenkten Bordstein einfährt, hat keine Vorfahrt und muss alle anderen durchfahren lassen (§ 8 und § 10 StVO).
- **Linksabbiegen:** Wer links abbiegt, muss den Gegenverkehr durchfahren lassen, der geradeaus fährt oder rechts abbiegt (§ 9 Abs. 3 StVO).
- **Abknickende Vorfahrt:** Wer dem Verlauf folgt, behält die Vorfahrt, muss aber blinken.
- **Einsatzfahrzeuge:** Blaues Blinklicht mit Einsatzhorn bedeutet sofort freie Bahn schaffen, auch auf der Vorfahrtstraße und bei Grün.
- **Ausgefallene Ampel:** Es gelten die Verkehrszeichen; fehlen sie, rechts vor links.
- **Verzicht:** Auf die Vorfahrt kann verzichtet werden, aber nur bei eindeutiger Verständigung. Wer den Verzicht annimmt, bleibt für die sichere Weiterfahrt verantwortlich.
- **Radverkehr beim Abbiegen:** Radfahrende, die auf oder neben der Fahrbahn geradeaus weiterfahren, müssen durchgelassen werden.

## Typische Fehler

- Auf der breiteren oder durchgehenden Straße Vorfahrt vermuten.
- Rechts vor links auch für Feldwege oder Grundstücksausfahrten anwenden.
- Beim Linksabbiegen den Gegenverkehr unterschätzen, weil man zuerst da war.
- Beim Rechtsabbiegen den Radweg nicht mit dem Schulterblick prüfen.

## Merksätze

- Rechts vor links, wenn keiner winkt und kein Schild blinkt.
- Wer abbiegt, wartet: links auf den Gegenverkehr, rechts auf Rad und Fuß.
- Polizei vor Ampel vor Schild vor Regel.

## Hintergrund

Vorfahrt ist kein Recht, das man erzwingen darf. Auch der Berechtigte muss bremsbereit bleiben, wenn erkennbar ist, dass ein anderer die Vorfahrt missachtet. Die Gefährdung anderer ist immer zu vermeiden (§ 1 StVO).
`),
  ch("verkehrsregelung", "Lichtzeichen und Verkehrsregelung", 10, `
# Lichtzeichen und Verkehrsregelung

Ampeln, Dauerlichtzeichen und Polizeibeamte regeln den Verkehr dort, wo die Grundregeln nicht ausreichen.

## Kernregeln

- **Ampelphasen:** Rot heißt Halt vor der Kreuzung. Rot und Gelb zusammen kündigen Grün an, man macht sich fahrbereit. Gelb bedeutet: vor der Kreuzung auf das nächste Zeichen warten. Nur wer so nah ist, dass ein gefahrloses Anhalten nicht mehr möglich ist, darf noch fahren.
- **Grün ist keine Garantie:** Fußgänger, die bei Grün noch auf der Fahrbahn sind, müssen sie ungefährdet räumen können.
- **Grünpfeilschild** (Zeichen 720): Rechtsabbiegen bei Rot ist erlaubt, aber nur nach vollständigem Anhalten an der Haltlinie und ohne Behinderung oder Gefährdung anderer. Für den Radverkehr gibt es das eigene Zeichen 721.
- **Leuchtender grüner Pfeil:** Gibt nur die angezeigte Richtung frei; der kreuzende Verkehr hat in dieser Phase Rot.
- **Dauerlichtzeichen:** Rotes Kreuz sperrt den Fahrstreifen, grüner Pfeil nach unten gibt ihn frei, gelb blinkender Schrägpfeil kündigt den Wechsel an.
- **Gelbes Blinklicht:** Warnt vor Gefahr, verpflichtet nicht zum Anhalten.
- **Polizei:** Seitlich ausgestreckte Arme quer zu Ihrer Fahrtrichtung (Brust oder Rücken zugewandt) bedeuten Halt. Wer in Richtung der Arme fährt, also den Beamten von der Seite sieht, hat freie Fahrt. Ein hoch erhobener Arm kündigt den Wechsel an.
- **Bahnübergang:** Rotes Licht oder rotes Blinklicht bedeutet Halt, auch bei offener Schranke.

## Typische Fehler

- Bei Gelb beschleunigen statt anzuhalten.
- Am Grünpfeilschild ohne Anhalten abbiegen.
- Den leuchtenden grünen Pfeil mit dem Grünpfeilschild verwechseln.
- Ein gelbes Blinklicht als Anhaltepflicht deuten.

## Merksätze

- Rot-Gelb: bereit machen, Grün: fahren.
- Grünpfeilschild: Erst stehen, dann sehen, dann gehen.
- Seite = Grün, Brust und Rücken = Rot, Arm hoch = Gelb.

## Hintergrund

Fällt eine Ampel aus, gelten die aufgestellten Verkehrszeichen und sonst rechts vor links. Eine Ampel mit gelbem Blinklicht ist ebenfalls außer Betrieb; dann entscheiden die Schilder an der Kreuzung. Haltlinien markieren, wo bei Rot anzuhalten ist. Fehlt eine Haltlinie, hält man vor der Ampel so, dass die Kreuzung übersehbar bleibt.
`),
  ch("geschwindigkeit", "Geschwindigkeit und Abstand", 15, `
# Geschwindigkeit und Abstand

Geschwindigkeit bestimmt Bremsweg, Aufprallenergie und die Zeit, die zum Reagieren bleibt.

## Kernregeln

- **Innerorts** gilt für alle Kraftfahrzeuge 50 km/h, wenn nichts anderes angeordnet ist.
- **Außerorts** dürfen Pkw ohne Anhänger 100 km/h fahren. Pkw mit Anhänger dürfen außerorts und auf der Autobahn 80 km/h, mit Tempo-100-Zulassung des Gespanns 100 km/h.
- **Autobahn:** Für Pkw gilt ohne Beschilderung keine Höchstgeschwindigkeit, aber die Richtgeschwindigkeit von 130 km/h.
- **Sicht:** Man darf nur so schnell fahren, dass innerhalb der übersehbaren Strecke angehalten werden kann. Bei Sichtweiten unter 50 Metern durch Nebel, Schneefall oder Regen gilt höchstens 50 km/h.
- **Faustformeln:** Reaktionsweg = (km/h ÷ 10) × 3. Bremsweg = (km/h ÷ 10)². Gefahrenbremsung = halber Bremsweg. Anhalteweg = Reaktionsweg + Bremsweg.
- **Abstand:** Halber Tacho als Mindestabstand in Metern, also 50 Meter bei 100 km/h. Außerorts hilft die Zwei-Sekunden-Regel. Lkw über 3,5 t müssen auf der Autobahn bei mehr als 50 km/h mindestens 50 Meter Abstand halten.
- **Schneeketten:** höchstens 50 km/h.

## Rechenbeispiele

- 50 km/h: Reaktionsweg 15 m, Bremsweg 25 m, Anhalteweg 40 m.
- 100 km/h: Reaktionsweg 30 m, Bremsweg 100 m, Anhalteweg 130 m.
- Doppelte Geschwindigkeit bedeutet vierfachen Bremsweg, aber nur doppelten Reaktionsweg.

## Typische Fehler

- Den Bremsweg linear mit der Geschwindigkeit hochrechnen.
- Den Reaktionsweg beim Anhalteweg vergessen.
- Bei Nässe oder Glätte den Abstand nicht vergrößern.
- Das Tempolimit als Sollwert verstehen, obwohl die Sicht weniger erlaubt.

## Merksätze

- Reaktionsweg: Tempo durch 10, mal 3.
- Bremsweg: Tempo durch 10, dann quadrieren.
- Abstand halber Tacho.

## Hintergrund

Die Aufprallenergie wächst wie der Bremsweg mit dem Quadrat der Geschwindigkeit. Ein Aufprall mit 50 km/h entspricht ungefähr einem Sturz aus zehn Metern Höhe. Deshalb retten schon wenige km/h weniger in Ortschaften Leben, besonders für Fußgänger und Radfahrende.
`),
  ch("andere_teilnehmer", "Andere Verkehrsteilnehmer", 12, `
# Andere Verkehrsteilnehmer

Fußgänger, Radfahrende, Kinder, ältere Menschen und Motorradfahrer sind ungeschützt. Ihnen gegenüber gilt besondere Rücksicht.

## Kernregeln

- **Überholabstand:** Beim Überholen von Radfahrenden, zu Fuß Gehenden und E-Scootern mindestens 1,5 Meter innerorts und 2 Meter außerorts.
- **Zebrastreifen:** Fußgänger, die erkennbar überqueren wollen, haben Vorrang. Nur mit mäßiger Geschwindigkeit heranfahren, nötigenfalls warten, nicht überholen.
- **Linienbusse:** Steht ein Bus mit Warnblinklicht an der Haltestelle, darf nur mit Schrittgeschwindigkeit und ausreichendem Abstand vorbeigefahren werden, das gilt auch für den Gegenverkehr. Nähert sich der Bus mit Warnblinklicht, darf er nicht überholt werden. Innerorts ist Bussen das Abfahren von Haltestellen zu ermöglichen.
- **Straßenbahn:** An Haltestellen ohne Verkehrsinsel rechts nur mit Schrittgeschwindigkeit vorbei, bei ein- und aussteigenden Fahrgästen warten.
- **Kinder, Hilfsbedürftige, ältere Menschen:** Geschwindigkeit verringern und Bremsbereitschaft (§ 3 Abs. 2a StVO). Ein weißer Stock oder eine gelbe Armbinde kennzeichnet blinde oder sehbehinderte Menschen.
- **E-Scooter:** Ab 14 Jahren, 20 km/h, auf Radwegen oder sonst auf der Fahrbahn, keine Helmpflicht, keine Mitfahrer.
- **Lkw beim Rechtsabbiegen:** Fahrzeuge über 3,5 t dürfen innerorts nur mit Schrittgeschwindigkeit rechts abbiegen, wenn mit Rad- oder Fußverkehr zu rechnen ist.
- **Radfahrende** dürfen nebeneinander fahren, wenn niemand behindert wird.

## Typische Fehler

- Radfahrende mit zu geringem Abstand überholen, weil die Fahrbahn schmal ist. Dann ist Überholen nicht erlaubt.
- Am Zebrastreifen Gas geben, weil der Fußgänger noch am Bordstein steht.
- Am Bus mit Warnblinklicht normal vorbeifahren.
- Motorräder beim Abbiegen übersehen, weil sie schmal sind und schnell näher kommen.

## Merksätze

- Innerorts 1,5, außerorts 2: Abstand zu Rad und Fuß.
- Bus mit Warnblinker: Schritttempo für alle.
- Kinder rechnen nicht mit Autos, Autos müssen mit Kindern rechnen.

## Hintergrund

Kinder können Geschwindigkeiten und Entfernungen schlecht einschätzen und handeln spontan. Ältere Menschen brauchen mehr Zeit zum Überqueren. Motorradfahrer werden oft übersehen, weil ihre Silhouette mit dem Hintergrund verschmilzt. Wer diese Besonderheiten kennt, fährt vorausschauender.
`),
  ch("fahrmanoever", "Abbiegen, Überholen, Fahrstreifenwechsel", 15, `
# Abbiegen, Überholen, Fahrstreifenwechsel

Jede Richtungsänderung braucht die gleiche Reihenfolge: Spiegel, Blinker, Schulterblick, dann handeln.

## Kernregeln

- **Rechtsabbiegen:** Rechtzeitig blinken, möglichst weit rechts einordnen, langsam fahren, Schulterblick nach rechts. Radfahrende und Fußgänger, die geradeaus wollen, haben Vorrang.
- **Linksabbiegen:** Bis zur Fahrbahnmitte einordnen, in Einbahnstraßen ganz links. Gegenverkehr durchfahren lassen. Entgegenkommende Linksabbieger biegen voreinander ab, wenn Markierungen nichts anderes vorgeben.
- **Überholen:** Nur bei ausreichender Übersicht, ohne Gegenverkehr während des gesamten Vorgangs, mit wesentlich höherer Geschwindigkeit und ohne Gefährdung. Verboten bei unklarer Verkehrslage, an unübersichtlichen Stellen, an Fußgängerüberwegen, an Bahnübergängen ab den Baken und bei Zeichen 276 oder durchgezogener Linie.
- **Rechts überholen innerorts:** Auf Fahrbahnen mit mehreren markierten Fahrstreifen für eine Richtung dürfen Kraftfahrzeuge bis 3,5 t den Fahrstreifen frei wählen und rechts schneller fahren als links.
- **Straßenbahnen** werden rechts überholt; links nur, wenn rechts kein Platz ist oder in Einbahnstraßen.
- **Fahrstreifenwechsel:** Nur wenn eine Gefährdung anderer ausgeschlossen ist. Blinken gibt kein Vorrecht.
- **Wenden** ist auf Autobahnen, Kraftfahrstraßen und in Einbahnstraßen verboten.
- **Rückwärtsfahren:** Nur langsam, nötigenfalls einweisen lassen; wer rückwärtsfährt, hat keinen Vorrang.
- **Hindernis auf der eigenen Seite:** Wer über die Gegenfahrbahn ausweichen muss, lässt den Gegenverkehr durch.

## Typische Fehler

- Blinken und sofort wechseln, ohne Schulterblick.
- Zum Rechtsabbiegen weit ausholen und so Radfahrende einladen, rechts vorbeizufahren.
- Überholen beginnen, obwohl der Vorgang nicht sicher zu Ende gebracht werden kann.
- Am Hindernis die Vorfahrt des Gegenverkehrs ignorieren, weil man zuerst da war.

## Merksätze

- Spiegel, Blinker, Schulterblick.
- Links abbiegen heißt warten.
- Wer sein Hindernis hat, hat auch das Warten.

## Hintergrund

Der Überholweg ist oft viel länger als gedacht. Bei 100 km/h gegenüber 80 km/h braucht ein Überholvorgang mehrere hundert Meter freie Strecke. Wer zweifelt, überholt nicht.
`),
  ch("kreisverkehr", "Kreisverkehr", 8, `
# Kreisverkehr

Der Kreisverkehr ist sicher, solange alle die wenigen Regeln kennen: Vorfahrt im Kreis, Blinken nur beim Verlassen.

## Kernregeln

- **Beschilderung:** Vor dem Kreisverkehr stehen üblicherweise Zeichen 215 (Kreisverkehr) und Zeichen 205 (Vorfahrt gewähren). Dann hat der Verkehr im Kreis Vorfahrt.
- **Ohne Zeichen:** Fehlt die Beschilderung, gilt rechts vor links. Dann haben die Einfahrenden Vorfahrt, weil sie für die Fahrzeuge im Kreis von rechts kommen.
- **Blinken:** Beim Einfahren wird nicht geblinkt. Das Verlassen wird rechtzeitig nach rechts angezeigt.
- **Fahrtrichtung:** Rechts herum, also entgegen dem Uhrzeigersinn.
- **Mittelinsel:** Darf nicht überfahren werden, außer mit großen Fahrzeugen, wenn es unvermeidbar ist.
- **Halten:** Auf der Fahrbahn im Kreis ist Halten verboten.
- **Ausfahren:** Das Verlassen ist ein Abbiegevorgang. Fußgänger am Zebrastreifen und Radfahrende auf begleitenden Radwegen müssen durchgelassen werden.
- **Wenden:** Der Kreis darf vollständig durchfahren werden, um die Richtung zu wechseln.

## Typische Fehler

- Beim Einfahren links blinken, weil man mehrere Ausfahrten weit fährt.
- Im Kreis Vorfahrt vermuten, obwohl kein Zeichen 205 an der Zufahrt steht.
- Beim Ausfahren den Zebrastreifen und den Radweg übersehen.
- Im Kreis anhalten, um jemanden einfahren zu lassen.

## Merksätze

- Rein ohne Blinken, raus mit Blinken.
- Schild 205 an der Zufahrt: Der Kreis hat Vorfahrt.
- Ausfahren ist Abbiegen.

## Hintergrund

Das Blinkverbot beim Einfahren hat einen praktischen Grund: Wer wartend an der Zufahrt steht, muss sich darauf verlassen können, dass ein nach rechts blinkendes Fahrzeug den Kreis tatsächlich verlässt. Nur dann kann er sicher einfahren. Wer bei jeder Einfahrt blinkt, macht das Signal wertlos. Bei mehrspurigen Kreisverkehren gelten zusätzlich die Regeln für den Fahrstreifenwechsel; dort ist besondere Vorsicht geboten, weil andere Fahrzeuge beim Verlassen die Fahrstreifen kreuzen. Wer unsicher ist, wählt den äußeren Fahrstreifen und fährt vorausschauend.
`),
  ch("halten_parken", "Halten und Parken", 12, `
# Halten und Parken

Halten ist eine kurze, gewollte Fahrtunterbrechung. Wer das Fahrzeug verlässt oder länger als drei Minuten hält, parkt.

## Kernregeln

- **Halteverbot** gilt an engen und unübersichtlichen Stellen, in scharfen Kurven, auf Bahnübergängen, auf Fußgängerüberwegen und bis fünf Meter davor, auf Schutzstreifen für den Radverkehr sowie vor und in Feuerwehrzufahrten.
- **Parkverbot** gilt zusätzlich bis fünf Meter vor und hinter Kreuzungen und Einmündungen, bei baulich angelegtem Radweg bis acht Meter davor, vor Grundstücksein- und -ausfahrten (auf schmalen Fahrbahnen auch gegenüber), bis 15 Meter vor und hinter Haltestellenschildern und vor Andreaskreuzen innerorts bis fünf Meter, außerorts bis 50 Meter.
- **Verkehrszeichen:** Eingeschränktes Halteverbot (Zeichen 286) erlaubt drei Minuten Halten sowie Ein- und Aussteigen und Be- und Entladen. Absolutes Halteverbot (Zeichen 283) verbietet jedes Halten.
- **Seite:** Gehalten und geparkt wird rechts. Links nur in Einbahnstraßen oder wenn rechts Schienen liegen.
- **Parkscheibe:** Auf die halbe Stunde einstellen, die der Ankunft folgt.
- **Sichern:** Feststellbremse, Gang oder Stellung P, an Steigung und Gefälle zusätzlich die Lenkung einschlagen.
- **Behindertenparkplätze** sind nur mit dem blauen EU-Parkausweis erlaubt.
- **Verkehrsberuhigter Bereich:** Parken nur auf gekennzeichneten Flächen.

## Typische Fehler

- Fünf Meter an der Kreuzung ab dem Bordstein-Ende schätzen statt ab dem Schnittpunkt der Fahrbahnkanten.
- Mit Warnblinklicht in zweiter Reihe halten. Das Warnblinklicht macht verbotenes Halten nicht erlaubt.
- Beim Aussteigen auf der Fahrbahnseite nicht auf Radfahrende achten. Der holländische Griff (mit der fernen Hand öffnen) erzwingt den Blick nach hinten.
- Vor der eigenen Garageneinfahrt parken und andere Ausfahrten blockieren.

## Merksätze

- Drei Minuten trennen Halten von Parken.
- Fünf Meter an der Kreuzung, acht mit Radweg, fünfzehn an der Haltestelle.
- Bremse, Gang, Lenkung: dreifach gesichert.

## Hintergrund

Parkverbote schützen vor allem die Sicht. Wer zu nah an der Kreuzung parkt, nimmt Kindern und Radfahrenden die Sichtlinie. Das Parkverbot von acht Metern bei baulichen Radwegen wurde 2020 eingeführt, damit abbiegende Fahrzeuge Radfahrende früher sehen.
`),
  ch("besondere_situationen", "Besondere Verkehrssituationen", 12, `
# Besondere Verkehrssituationen

Wetter, Wild, Baustellen und Notfälle verlangen ein Verhalten, das man vorher kennen muss, weil im Ernstfall keine Zeit zum Nachdenken bleibt.

## Kernregeln

- **Aquaplaning:** Gas wegnehmen, bei Schaltgetriebe auskuppeln, Lenkrad ruhig halten, nicht stark bremsen, bis die Reifen wieder greifen.
- **Wildwechsel:** Abblenden, hupen, kontrolliert bremsen, Spur halten. Nicht ausweichen und mit weiteren Tieren rechnen.
- **Glätte:** Brücken, Waldstücke und schattige Abschnitte vereisen zuerst. Weiche Lenk- und Bremsbewegungen, großer Abstand.
- **Stauende:** Warnblinklicht einschalten, Geschwindigkeit verringern, nachfolgenden Verkehr im Spiegel beobachten.
- **Einsatzfahrzeuge:** Blaulicht mit Einsatzhorn bedeutet sofort freie Bahn schaffen, nach rechts fahren, notfalls anhalten. Nicht auf die Gegenfahrbahn ausweichen.
- **Tunnel:** Abblendlicht auch am Tag, Sonnenbrille absetzen, nicht wenden, nicht rückwärtsfahren, Notausgänge beachten.
- **Seitenwind:** Auf Brücken, in Schneisen und beim Überholen von Lkw Lenkrad fest halten und Geschwindigkeit anpassen.
- **Bahnübergang:** Ab den Baken Überholverbot, nur mit mäßiger Geschwindigkeit nähern, bei Rotlicht anhalten, auch bei offener Schranke.
- **Blendung:** Langsamer fahren, Sonnenblende nutzen, Abstand vergrößern.
- **Reifenplatzer:** Lenkrad mit beiden Händen festhalten, Gas wegnehmen, sanft bremsen, Warnblinklicht, auf den Seitenstreifen.

## Typische Fehler

- Bei Aquaplaning oder Reifenplatzer eine Vollbremsung einleiten.
- Vor Wild ausweichen und dabei im Gegenverkehr oder am Baum landen.
- Bei Blaulicht panisch stehen bleiben, statt kontrolliert Platz zu machen.
- Im Tunnel mit Nebelschlussleuchte fahren und nachfolgende Fahrer blenden.

## Merksätze

- Wild: abblenden, hupen, bremsen, Spur halten.
- Aquaplaning: Fuß weg, Kupplung, Lenkrad still.
- Blaulicht plus Horn: rechts ran.

## Hintergrund

In Baustellen gelten die gelben Markierungen vor den weißen. Fahrstreifen sind dort oft schmaler; wer unsicher ist, fährt rechts und hält Abstand zu Lkw. Bei Gewitter oder Starkregen ist es sinnvoll, auf einem Parkplatz zu warten, statt mit Sichtweite null weiterzufahren.
`),
  ch("unfall_panne", "Unfall, Panne und Erste Hilfe", 12, `
# Unfall, Panne und Erste Hilfe

Bei einem Unfall zählt die richtige Reihenfolge: absichern, Notruf, Erste Hilfe. Eigenschutz geht vor.

## Kernregeln

- **Absichern:** Warnblinklicht einschalten, Warnweste anziehen, Warndreieck in ausreichender Entfernung aufstellen (§ 15 StVO nennt keine Meterzahl). Faustregel aus der Praxis: innerorts etwa 50 Meter, Landstraße etwa 100 Meter, Autobahn 150 bis 200 Meter, vor Kurven und Kuppen entsprechend weiter.
- **Notruf 112:** Wo ist es passiert, was ist passiert, wie viele Verletzte, welche Verletzungen, warten auf Rückfragen.
- **Erste Hilfe:** Bewusstlose mit normaler Atmung in die stabile Seitenlage bringen und die Atmung überwachen. Ohne normale Atmung Wiederbelebung beginnen. Bewusstlosen Motorradfahrern wird der Helm vorsichtig abgenommen, damit die Atemwege frei bleiben.
- **Panne auf der Autobahn:** Seitenstreifen, Warnblinklicht, Warnweste, Warndreieck, dann hinter die Schutzplanke. Notrufsäulen sind über die Pfeile auf den Leitpfosten zu finden.
- **Ausrüstung:** Warndreieck, Verbandkasten und Warnweste sind Pflicht im Pkw.
- **Pflichten am Unfallort:** Anhalten, Unfallstelle sichern, Personalien und Fahrzeugdaten angeben. Ist niemand anzutreffen, angemessene Zeit warten und danach unverzüglich Polizei oder Geschädigten verständigen. Ein Zettel allein reicht nicht (§ 142 StGB).
- **Hilfeleistung:** Wer zumutbare Hilfe unterlässt, macht sich strafbar (§ 323c StGB).

## Typische Fehler

- Verletzte ohne Not aus dem Fahrzeug ziehen.
- Das Warndreieck direkt hinter dem Fahrzeug aufstellen.
- Auf dem Seitenstreifen im Fahrzeug sitzen bleiben.
- Nach einem Parkrempler mit Zettel wegfahren.

## Merksätze

- Absichern, Notruf, Erste Hilfe.
- Wo, Was, Wie viele, Welche, Warten.
- Hinter der Planke ist man sicher.

## Hintergrund

Erste Hilfe kann nicht falsch gemacht werden, wenn man überhaupt hilft. Wer nichts tut, riskiert am meisten. Der Erste-Hilfe-Kurs vor der Fahrerlaubnis ist die Grundlage; eine Auffrischung alle paar Jahre hält das Wissen wach. Bei Unfällen mit Verletzten oder hohem Sachschaden sollte immer die Polizei gerufen werden; bei kleinen Blechschäden reicht der Austausch der Daten, wenn beide Seiten einverstanden sind.
`),
  ch("umwelt", "Umweltschonendes Fahren", 10, `
# Umweltschonendes Fahren

Umweltschonend fahren heißt vor allem vorausschauend fahren. Das spart Kraftstoff, schont Bremsen und senkt den Lärm.

## Kernregeln

- **Schalten:** Früh hochschalten, etwa bei 2.000 Umdrehungen pro Minute, und mit niedriger Drehzahl im hohen Gang fahren.
- **Ausrollen:** Vor roten Ampeln früh vom Gas gehen und im eingelegten Gang rollen. Die Schubabschaltung stoppt dann die Kraftstoffzufuhr; im Leerlauf würde der Motor weiter verbrauchen.
- **Motor aus:** Bei längerem Warten, etwa am Bahnübergang, den Motor abstellen. Warmlaufen lassen im Stand ist verboten (§ 30 StVO).
- **Reifendruck:** Zu niedriger Druck erhöht Rollwiderstand, Verbrauch und Verschleiß. Regelmäßig bei kalten Reifen prüfen.
- **Ballast und Anbauten:** Nicht benötigte Dachträger abnehmen, unnötiges Gewicht entfernen.
- **Verbraucher:** Klimaanlage, Heckscheibenheizung und offene Fenster bei hohem Tempo kosten Kraftstoff.
- **Kurzstrecken:** Ein kalter Motor verbraucht deutlich mehr und der Katalysator wirkt noch nicht voll. Kurze Wege besser zu Fuß oder mit dem Rad.
- **Umweltzonen:** Einfahrt nur mit der auf dem Zusatzzeichen angegebenen Plakette.
- **Entsorgung:** Altöl gehört zur Sammelstelle oder zurück zur Verkaufsstelle, nie in den Hausmüll oder die Kanalisation.

## Typische Fehler

- Jeden Gang hoch ausdrehen, weil man glaubt, das Auto brauche das.
- Vor Ampeln beschleunigen und dann stark bremsen.
- Im Winter den Motor minutenlang warmlaufen lassen.
- Den Dachgepäckträger das ganze Jahr montiert lassen.

## Merksätze

- Hoher Gang, niedrige Drehzahl.
- Rollen im Gang statt im Leerlauf.
- Wer weit schaut, bremst weniger.

## Hintergrund

Vorausschauendes Fahren ist zugleich das sicherste Fahren. Wer früh erkennt, dass eine Ampel umschaltet oder der Verkehr stockt, hat mehr Reserven und gleicht Geschwindigkeitsunterschiede sanft aus. Gleichmäßiges Tempo auf der Autobahn spart mehr als jedes Sparprogramm des Fahrzeugs. Auch Elektrofahrzeuge profitieren: Rekuperation ersetzt einen Teil des Bremsens, aber die Physik des Anhaltewegs bleibt dieselbe.
`),
  ch("alkohol_drogen", "Alkohol, Drogen, Medikamente", 12, `
# Alkohol, Drogen, Medikamente

Alkohol und Drogen verändern Wahrnehmung, Reaktion und Risikobereitschaft. Die Grenzwerte sind klar geregelt.

## Kernregeln

- **0,0 Promille** für Fahranfänger in der Probezeit und für Fahrer unter 21 Jahren (§ 24c StVG).
- **Ab 0,3 Promille** mit Ausfallerscheinungen wie Schlangenlinien liegt eine Straftat wegen relativer Fahruntüchtigkeit vor.
- **Ab 0,5 Promille** liegt eine Ordnungswidrigkeit vor, auch ohne Fahrfehler: Bußgeld, Punkte, Fahrverbot (§ 24a StVG).
- **Ab 1,1 Promille** gilt absolute Fahruntüchtigkeit: Straftat mit Entzug der Fahrerlaubnis (§ 316 StGB).
- **Ab 1,6 Promille** wird in der Regel eine medizinisch-psychologische Untersuchung angeordnet. Für Radfahrer gilt 1,6 Promille als Grenze der absoluten Fahruntüchtigkeit.
- **Abbau:** Etwa 0,1 Promille pro Stunde. Kaffee, Schlaf, Bewegung oder Essen beschleunigen nichts. Restalkohol am Morgen ist ein häufiges Problem.
- **Cannabis:** Seit August 2024 gilt ein Grenzwert von 3,5 ng THC pro ml Blutserum. Für Fahranfänger und unter 21-Jährige gilt ein vollständiges Cannabisverbot am Steuer. Mischkonsum mit Alkohol wird strenger geahndet.
- **Medikamente:** Auch rezeptfreie Mittel können die Fahrtüchtigkeit beeinträchtigen. Beipackzettel lesen, im Zweifel Arzt oder Apotheke fragen.

## Wirkung von Alkohol

- Die Reaktionszeit verlängert sich.
- Das Blickfeld verengt sich (Tunnelblick), Entfernungen werden falsch eingeschätzt.
- Die Risikobereitschaft steigt, Gefahren erscheinen kleiner.

## Typische Fehler

- Glauben, ein Bier sei in der Probezeit erlaubt.
- Nach einer langen Nacht am Morgen fahren, obwohl der Alkohol noch nicht abgebaut ist.
- Die 0,5-Grenze als Freibrief für 0,4 Promille verstehen.
- Medikamente mit Alkohol kombinieren und die Wechselwirkung unterschätzen.

## Merksätze

- Probezeit: null Komma null.
- 0,3 mit Fehler, 0,5 ohne, 1,1 immer Straftat.
- Nur die Zeit baut ab.

## Hintergrund

Die Verantwortung beginnt vor dem ersten Glas: Wer fahren will, plant vorher, wie er nach Hause kommt. Wer trinkt, lässt den Schlüssel liegen. Auch die Mitfahrt bei einem angetrunkenen Fahrer ist ein Risiko, das sich vermeiden lässt.
`),
  ch("fahrzeugtechnik", "Fahrzeugtechnik und Sicherheitskontrollen", 12, `
# Fahrzeugtechnik und Sicherheitskontrollen

Ein verkehrssicheres Fahrzeug ist Pflicht des Fahrers. Die wichtigsten Kontrollen dauern nur wenige Minuten.

## Kernregeln

- **Reifen:** Mindestprofiltiefe 1,6 mm; empfohlen sind mindestens 3 mm bei Sommer- und 4 mm bei Winterreifen. Reifendruck bei kalten Reifen prüfen, Werte stehen in der Betriebsanleitung, im Tankdeckel oder im Türholm. Auf Risse, Beulen und Fremdkörper achten.
- **Winterreifen:** Bei Glatteis, Schneeglätte, Schneematsch, Eis- oder Reifglätte nur mit Alpine-Symbol. Reine M+S-Reifen gelten seit dem 1. Oktober 2024 nicht mehr.
- **Schneeketten:** höchstens 50 km/h.
- **Motoröl:** Auf ebener Fläche bei warmem, abgestelltem Motor nach kurzer Wartezeit am Peilstab messen. Rote Öldruckleuchte: sofort anhalten, Motor aus.
- **Bremsflüssigkeit:** Nimmt Wasser auf, der Siedepunkt sinkt. Wechsel nach Herstellervorgabe, meist etwa alle zwei Jahre.
- **Stoßdämpfer:** Nachschwingen nach Bodenwellen deutet auf Verschleiß hin. Folgen: längerer Bremsweg, schlechtere Kurvenstabilität.
- **Hauptuntersuchung:** Pkw alle zwei Jahre, Neuwagen erstmals nach drei Jahren.
- **Papiere:** Zulassungsbescheinigung Teil I mitführen, Teil II sicher zu Hause verwahren.
- **Kontrollleuchten:** Rot bedeutet anhalten und prüfen, Gelb bedeutet bald handeln, Grün und Blau zeigen aktive Funktionen an.

## Typische Fehler

- Reifendruck nach längerer Fahrt prüfen und den zu hohen Wert absenken.
- Bei roter Öldruckleuchte bis zur Werkstatt weiterfahren.
- M+S-Reifen für ausreichend halten.
- Die HU-Plakette ignorieren, bis die Frist deutlich überschritten ist.

## Merksätze

- 1,6 ist Gesetz, 3 und 4 sind Vernunft.
- Kalt messen, warm fahren.
- Rot heißt stopp, Gelb heißt bald.

## Hintergrund

In der praktischen Prüfung werden Sicherheitskontrollen abgefragt: Beleuchtung, Reifen, Bremsen, Flüssigkeitsstände, Warnleuchten und Lenkung. Wer die Kontrollen am eigenen Fahrschulwagen mehrmals durchgeht, beantwortet die Fragen sicher und erkennt später Mängel am eigenen Fahrzeug frühzeitig.
`),
  ch("beleuchtung", "Beleuchtung", 10, `
# Beleuchtung

Licht dient dem Sehen und dem Gesehenwerden. Jede Leuchte hat eine klar geregelte Aufgabe.

## Kernregeln

- **Abblendlicht:** Pflicht bei Dunkelheit, Dämmerung und bei Sichtbehinderung durch Regen, Nebel oder Schneefall, auch am Tag. In Tunneln immer. Fahren nur mit Standlicht ist verboten.
- **Tagfahrlicht:** Macht nur nach vorn sichtbar; die Rückleuchten bleiben meist aus. Bei schlechter Sicht deshalb auf Abblendlicht wechseln.
- **Fernlicht:** Abblenden bei Gegenverkehr, wenn man dicht hinter anderen fährt und innerorts auf ausreichend beleuchteten Straßen. Bei Nebel verschlechtert Fernlicht die Sicht.
- **Nebelscheinwerfer:** Bei erheblicher Sichtbehinderung durch Nebel, Schneefall oder Regen erlaubt.
- **Nebelschlussleuchte:** Nur bei Nebel mit Sichtweite unter 50 Metern. Dann gilt zugleich höchstens 50 km/h.
- **Lichthupe:** Als Warnzeichen erlaubt, außerorts auch zum Ankündigen des Überholens. Nicht zum Erzwingen von Vorfahrt.
- **Warnblinklicht:** Bei Annäherung an ein Stauende, bei liegen gebliebenem Fahrzeug und beim Abschleppen an beiden Fahrzeugen. Nicht zum Absichern von Parkverstößen.
- **Parken bei Dunkelheit:** Außerorts mit Standlicht oder Parkleuchten. Innerorts nicht nötig, wenn die Straßenbeleuchtung das Fahrzeug ausreichend sichtbar macht.
- **Leuchtweite:** Bei schwerer Beladung senkt sich das Heck; die Leuchtweitenregulierung verhindert Blendung.

## Typische Fehler

- Bei Regen mit Tagfahrlicht fahren und hinten unsichtbar sein.
- Die Nebelschlussleuchte bei leichtem Nebel oder Regen anlassen und andere blenden.
- Fernlicht auf der Landstraße vergessen, wenn Gegenverkehr kommt.
- Warnblinklicht als Parkerlaubnis in zweiter Reihe nutzen.

## Merksätze

- Unter 50 Meter Sicht: Nebelschlussleuchte an, höchstens 50 km/h.
- Tagfahrlicht sieht nur nach vorn.
- Fernlicht aus, sobald jemand entgegenkommt.

## Hintergrund

Vor jeder Fahrt bei Dunkelheit lohnt ein kurzer Rundgang: Funktionieren alle Leuchten, sind die Scheinwerfer sauber, ist die Leuchtweite richtig eingestellt? Verschmutzte Scheinwerfer verlieren erheblich an Reichweite. Auch die Innenraumbeleuchtung sollte während der Fahrt aus sein, weil sie Spiegelungen in der Windschutzscheibe erzeugt und die Anpassung der Augen an die Dunkelheit stört. Auf unbeleuchteten Landstraßen ist Fernlicht ein Sicherheitsgewinn, solange niemand geblendet wird.
`),
  ch("befoerderung", "Personen- und Güterbeförderung, Anhänger", 10, `
# Personen- und Güterbeförderung, Anhänger

Alles, was im oder am Fahrzeug mitfährt, muss gesichert sein: Menschen, Tiere und Ladung.

## Kernregeln

- **Gurtpflicht** gilt für alle Insassen auf allen Sitzplätzen mit Gurten. Für Kinder ist der Fahrer verantwortlich.
- **Kindersitz:** Kinder unter zwölf Jahren, die kleiner als 150 cm sind, brauchen eine geeignete und zugelassene Rückhalteeinrichtung. Rückwärtsgerichtete Babyschalen dürfen auf dem Beifahrersitz nur mit deaktiviertem Frontairbag benutzt werden.
- **Ladungssicherung:** Ladung muss so verstaut sein, dass sie auch bei Vollbremsung und Ausweichmanöver nicht verrutscht, umfällt oder herabfällt (§ 22 StVO). Zurrgurte, Antirutschmatten und Trennnetze helfen. Nichts Loses auf die Hutablage.
- **Überstand nach hinten:** Bis 1,5 Meter, bei Fahrten bis 100 Kilometer bis 3 Meter. Ab einem Meter Überstand ist das Ende mit einer hellroten Fahne oder einem hellroten Schild von mindestens 30 mal 30 cm zu kennzeichnen, bei Dunkelheit zusätzlich mit roter Leuchte und rotem Rückstrahler.
- **Abmessungen:** Fahrzeug und Ladung zusammen höchstens 4 Meter hoch und 2,55 Meter breit.
- **Tiere** gelten als Ladung und müssen gesichert werden, etwa mit Gurtsystem, Box oder Trenngitter.
- **Anhänger mit Klasse B:** Bis 750 kg zulässiger Gesamtmasse immer. Schwerere nur, wenn die Kombination 3.500 kg nicht überschreitet; darüber B96 oder BE.
- **Abreißseil:** Löst sich ein Anhänger mit Auflaufbremse vom Zugfahrzeug, zieht das Seil die Anhängerbremse.
- **Gespanne:** Außerorts und auf der Autobahn 80 km/h, mit Tempo-100-Zulassung 100 km/h.

## Typische Fehler

- Kinder nur nach Alter oder nur nach Größe einordnen; beide Kriterien zählen.
- Den Hund frei auf der Rückbank mitnehmen.
- Ladung mit einem weißen Tuch kennzeichnen.
- Schwere Ladung hoch stapeln statt tief und nah an der Rückbank.

## Merksätze

- Unter zwölf und unter 150: Kindersitz.
- Ab einem Meter: rote Fahne.
- Schwer nach unten, leicht nach oben.

## Hintergrund

Bei einem Aufprall mit 50 km/h wirkt auf ungesicherte Gegenstände ein Vielfaches ihres Gewichts. Ein loser Laptop wird so zum Geschoss. Ladungssicherung ist deshalb keine Formalität, sondern Insassenschutz.
`),
  ch("fahrphysik", "Fahrphysik und Assistenzsysteme", 12, `
# Fahrphysik und Assistenzsysteme

Physik lässt sich nicht überlisten. Assistenzsysteme helfen, verschieben aber die Grenzen der Haftung nicht.

## Kernregeln

- **Fliehkraft:** In der Kurve wächst sie mit dem Quadrat der Geschwindigkeit. Doppeltes Tempo bedeutet vierfache Fliehkraft. Deshalb vor der Kurve bremsen, in der Kurve rollen, am Ausgang beschleunigen.
- **Kammscher Kreis:** Ein Reifen überträgt nur eine begrenzte Gesamtkraft. Wer voll bremst, kann kaum lenken; wer stark lenkt, kann kaum bremsen.
- **Bremsweg:** Faustformel (km/h ÷ 10)², bei Gefahrenbremsung etwa die Hälfte. Bei 100 km/h also 100 Meter beziehungsweise 50 Meter.
- **Nässe:** Weniger Reibung, längerer Bremsweg, weniger Seitenführung. Abstand und Geschwindigkeit anpassen.
- **Gefahrenbremsung mit Schaltgetriebe:** Bremse voll durchtreten, gleichzeitig Kupplung treten, Pedal halten und mit ABS weiter lenken.
- **ABS:** Verhindert Blockieren und erhält die Lenkfähigkeit. Auf losem Untergrund kann der Bremsweg länger sein.
- **ESP:** Erkennt Schleudern und bremst einzelne Räder gezielt ab. Ersetzt keine Winterreifen und keine Vorsicht.
- **Untersteuern:** Das Fahrzeug schiebt über die Vorderräder geradeaus. Gas wegnehmen, Lenkeinschlag nicht vergrößern.
- **Beladung:** Dachlasten heben den Schwerpunkt und erhöhen die Kippneigung. Schwere Ladung tief und mittig verstauen.
- **Assistenzsysteme:** Notbremsassistent, Abstandsregeltempomat und Spurhalteassistent unterstützen, ersetzen aber weder Aufmerksamkeit noch Verantwortung.

## Typische Fehler

- In der Kurve bremsen statt davor.
- Bei ABS das Pedal pumpen oder nach dem Pulsieren nachlassen.
- ESP als Freibrief für hohes Tempo bei Glätte verstehen.
- Sich auf den Abstandsregeltempomaten verlassen, obwohl stehende Hindernisse nicht sicher erkannt werden.

## Merksätze

- Vor der Kurve bremsen, in der Kurve rollen.
- Bremsen oder lenken, selten beides ganz.
- Assistenz ist Hilfe, nicht Ersatz.

## Hintergrund

Bei Elektrofahrzeugen sorgt die Rekuperation für Verzögerung, sobald der Fuß vom Fahrpedal geht. Das ändert die Gewohnheiten, nicht die Physik: Anhalteweg und Kammscher Kreis gelten unverändert. Wer ein neues Fahrzeug fährt, sollte die Assistenzsysteme und ihre Grenzen in der Betriebsanleitung nachlesen und auf leerer Strecke ausprobieren.
`),
];
