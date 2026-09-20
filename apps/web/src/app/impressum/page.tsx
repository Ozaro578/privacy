export const metadata = { title: "Impressum" };

/** Anbieterkennzeichnung nach § 5 DDG. Die Betreiberangaben werden vor dem Produktivbetrieb eingetragen; bis dahin zeigt die Seite an, dass sie fehlen. */
const OPERATOR = {
  name: process.env["NEXT_PUBLIC_OPERATOR_NAME"] ?? "",
  address: process.env["NEXT_PUBLIC_OPERATOR_ADDRESS"] ?? "",
  email: process.env["NEXT_PUBLIC_OPERATOR_EMAIL"] ?? "",
  phone: process.env["NEXT_PUBLIC_OPERATOR_PHONE"] ?? "",
  register: process.env["NEXT_PUBLIC_OPERATOR_REGISTER"] ?? "",
  vatId: process.env["NEXT_PUBLIC_OPERATOR_VAT_ID"] ?? "",
  responsible: process.env["NEXT_PUBLIC_OPERATOR_RESPONSIBLE"] ?? "",
};

export default function ImprintPage() {
  const complete = OPERATOR.name && OPERATOR.address && OPERATOR.email;
  return (
    <main className="prose prose-sm mx-auto max-w-3xl p-6">
      <h1>Impressum</h1>
      {complete ? (
        <>
          <h2>Anbieter</h2>
          <p>{OPERATOR.name}<br />{OPERATOR.address.split("\\n").map((l, i) => <span key={i}>{l}<br /></span>)}</p>
          <h2>Kontakt</h2>
          <p>E-Mail: {OPERATOR.email}{OPERATOR.phone ? <><br />Telefon: {OPERATOR.phone}</> : null}</p>
          {OPERATOR.register && <><h2>Registereintrag</h2><p>{OPERATOR.register}</p></>}
          {OPERATOR.vatId && <><h2>Umsatzsteuer-Identifikationsnummer</h2><p>{OPERATOR.vatId}</p></>}
          {OPERATOR.responsible && <><h2>Verantwortlich für den Inhalt</h2><p>{OPERATOR.responsible}</p></>}
        </>
      ) : (
        <p>Die Anbieterangaben nach § 5 DDG werden vor dem Produktivbetrieb eingetragen (Umgebungsvariablen NEXT_PUBLIC_OPERATOR_NAME, NEXT_PUBLIC_OPERATOR_ADDRESS, NEXT_PUBLIC_OPERATOR_EMAIL sowie optional Telefon, Registereintrag, Umsatzsteuer-ID und Verantwortlicher).</p>
      )}
      <h2>Streitbeilegung</h2>
      <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
      <h2>Hinweis zu den Lerninhalten</h2>
      <p>Die Übungsfragen dieser Plattform sind eigene Inhalte und kein amtlicher Prüfungsinhalt. Verkehrszeichen werden nach den Anlagen der Straßenverkehrs-Ordnung dargestellt.</p>
    </main>
  );
}
