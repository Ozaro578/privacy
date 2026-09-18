export const metadata = { title: "Datenschutzerklärung" };

/** Datenschutzerklärung der Plattform (Betreiberangaben werden vor Produktivbetrieb ergänzt; Version 2026-09). */
export default function PrivacyPage() {
  return (
    <main className="prose prose-sm mx-auto max-w-3xl p-6">
      <h1>Datenschutzerklärung</h1>
      <p>Version 2026-09. Diese Erklärung beschreibt, wie die Fahrschulplattform FahrPilot personenbezogene Daten verarbeitet. Verantwortlich für die Verarbeitung der Ausbildungsdaten ist die jeweilige Fahrschule; der Plattformbetreiber handelt als Auftragsverarbeiter nach Art. 28 DSGVO.</p>
      <h2>Welche Daten verarbeitet werden</h2>
      <ul>
        <li>Stammdaten: Name, Geburtsdatum, Kontaktdaten, bei Minderjährigen Angaben der Erziehungsberechtigten.</li>
        <li>Ausbildungsdaten: Führerscheinklasse, Fahrstunden, Bewertungen durch Fahrlehrer, Theorieunterricht, Prüfungen.</li>
        <li>Lerndaten: beantwortete Fragen, Antwortzeiten, Sicherheitsangaben, Lernfortschritt, Prüfungssimulationen.</li>
        <li>Dokumente: von dir hochgeladene Nachweise (Sehtest, Erste-Hilfe, Ausweis, Passfoto).</li>
        <li>Finanzdaten: Rechnungen, Zahlungsstatus; Bankdaten verbleiben beim Zahlungsanbieter, wir speichern nur maskierte Angaben.</li>
        <li>Kommunikation: Nachrichten in der App, Benachrichtigungseinstellungen, Push-Token deines Geräts.</li>
        <li>KI-Coach: deine Fragen und die Antworten werden gespeichert, um den Dialog fortzuführen; Anfragen werden an einen KI-Anbieter übermittelt, ohne Namen oder Kontaktdaten.</li>
      </ul>
      <h2>Zwecke und Rechtsgrundlagen</h2>
      <p>Durchführung des Ausbildungsvertrags (Art. 6 Abs. 1 lit. b DSGVO), gesetzliche Pflichten wie Ausbildungsnachweise und Aufbewahrung von Rechnungen (Art. 6 Abs. 1 lit. c), berechtigtes Interesse an Sicherheit und Missbrauchsschutz (Art. 6 Abs. 1 lit. f) sowie Einwilligung für optionale Funktionen wie Push-Benachrichtigungen oder den Foto-Trainer (Art. 6 Abs. 1 lit. a). Einwilligungen kannst du jederzeit in den Einstellungen widerrufen.</p>
      <h2>Speicherort und Empfänger</h2>
      <p>Die Daten werden in Rechenzentren in der Europäischen Union gespeichert. Dienstleister (Hosting, Zahlungsabwicklung, Push-Versand, KI-Anbieter) sind vertraglich zur Auftragsverarbeitung verpflichtet. Fahrlehrer und Büro deiner Fahrschule sehen nur die Daten, die für ihre Aufgabe nötig sind.</p>
      <h2>Speicherdauer</h2>
      <p>Lerndaten werden nach Abschluss der Ausbildung nach den Aufbewahrungsregeln deiner Fahrschule gelöscht. Rechnungen unterliegen der gesetzlichen Aufbewahrungsfrist von zehn Jahren. Ausbildungsnachweise werden entsprechend den fahrschulrechtlichen Fristen aufbewahrt.</p>
      <h2>Deine Rechte</h2>
      <p>Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch (Art. 15 bis 21 DSGVO) sowie Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO). In der App kannst du unter Profil eine Datenkopie anfordern oder die Löschung beantragen.</p>
      <h2>Kontakt</h2>
      <p>Datenschutzanfragen richtest du an deine Fahrschule oder an den Plattformbetreiber. Die Kontaktdaten des Verantwortlichen und des Datenschutzbeauftragten werden vor dem Produktivbetrieb hier ergänzt.</p>
    </main>
  );
}
