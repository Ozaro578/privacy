import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { computeInvoiceTotals, computeLineTotals, vatBreakdown } from "./invoice";
import { formatCents, formatDateDe, formatVatRate } from "./money";

export interface Party {
  name: string;
  /** Adresszeilen (Straße, PLZ Ort, optional Land). */
  addressLines: string[];
  /** Steuernummer oder USt-IdNr. des Ausstellers (Pflichtangabe nach § 14 Abs. 4 UStG). */
  taxNumber?: string;
  vatId?: string;
  email?: string;
  phone?: string;
}

export interface InvoicePdfItem {
  position: number;
  description: string;
  quantity: number;
  unit?: string;
  unit_net_cents: number;
  vat_rate: number;
  /** Leistungsdatum, falls abweichend vom Rechnungsdatum (ISO-Datum). */
  service_date?: string;
}

export interface InvoicePdfData {
  issuer: Party;
  recipient: Party;
  invoice_number: string;
  /** Rechnungsdatum als ISO-Datum. */
  issued_at: string;
  due_at?: string;
  /** Leistungszeitraum als Freitext, falls nicht je Position angegeben. */
  service_period?: string;
  currency?: string;
  items: InvoicePdfItem[];
  /** Kleinunternehmerregelung nach § 19 UStG: keine Umsatzsteuer ausweisen und Hinweis drucken. */
  small_business?: boolean;
  payment_terms?: string;
  bank_details?: { account_holder: string; iban: string; bic?: string; bank_name?: string };
  /** SEPA-Hinweis mit Mandatsreferenz und Gläubiger-ID, wenn per Lastschrift eingezogen wird. */
  sepa?: { creditor_id: string; mandate_reference: string; collection_date?: string };
  /** Bereits bezahlte Beträge (z. B. Anzahlung), werden vom Bruttobetrag abgezogen. */
  paid_cents?: number;
  notes?: string;
  /** Rechnungskorrektur: Nummer der ursprünglichen Rechnung. */
  credit_note_for?: string;
}

export interface ReceiptPdfData {
  issuer: Party;
  recipient: Party;
  receipt_number: string;
  /** Zahlungsdatum als ISO-Datum. */
  paid_at: string;
  amount_cents: number;
  currency?: string;
  method: "sepa_debit" | "card" | "bank_transfer" | "cash" | "other";
  invoice_number?: string;
  provider_payment_id?: string;
  notes?: string;
}

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 56;
const LINE = 13;
const FONT_SIZE = 10;
const GREY = rgb(0.35, 0.35, 0.35);
const BLACK = rgb(0, 0, 0);

const METHOD_LABELS: Record<ReceiptPdfData["method"], string> = {
  sepa_debit: "SEPA-Lastschrift",
  card: "Kartenzahlung",
  bank_transfer: "Überweisung",
  cash: "Barzahlung",
  other: "Sonstige",
};

/** Ersetzt Zeichen, die die Standardschrift (WinAnsi) nicht darstellen kann, z. B. geschützte Leerzeichen oder fremde Schriftsysteme. */
function sanitize(text: string): string {
  let out = "";
  for (const ch of text.replace(/[  ]/g, " ")) {
    const code = ch.codePointAt(0) ?? 0;
    const supported = code <= 0xff || code === 0x20ac || code === 0x2013 || code === 0x2014 || code === 0x201e || code === 0x201c || code === 0x201d || code === 0x2019;
    out += supported ? ch : "?";
  }
  return out;
}

class Writer {
  page!: PDFPage;
  y = 0;
  constructor(
    readonly doc: PDFDocument,
    readonly font: PDFFont,
    readonly bold: PDFFont,
  ) {
    this.newPage();
  }

  newPage(): void {
    this.page = this.doc.addPage(A4);
    this.y = A4[1] - MARGIN;
  }

  ensure(height: number): void {
    if (this.y - height < MARGIN + 30) this.newPage();
  }

  text(text: string, x: number, opts: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb>; y?: number; alignRight?: number } = {}): void {
    const font = opts.bold ? this.bold : this.font;
    const size = opts.size ?? FONT_SIZE;
    const clean = sanitize(text);
    let drawX = x;
    if (opts.alignRight !== undefined) drawX = opts.alignRight - font.widthOfTextAtSize(clean, size);
    this.page.drawText(clean, { x: drawX, y: opts.y ?? this.y, size, font, color: opts.color ?? BLACK });
  }

  line(text: string, x = MARGIN, opts: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb> } = {}): void {
    this.ensure(LINE);
    this.text(text, x, opts);
    this.y -= LINE;
  }

  rule(): void {
    this.page.drawLine({ start: { x: MARGIN, y: this.y + 4 }, end: { x: A4[0] - MARGIN, y: this.y + 4 }, thickness: 0.5, color: GREY });
  }

  gap(n = 1): void {
    this.y -= LINE * n;
  }

  /** Bricht Text an Wortgrenzen auf die verfügbare Breite um. */
  wrap(text: string, width: number, size = FONT_SIZE): string[] {
    const words = sanitize(text).split(/\s+/);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (this.font.widthOfTextAtSize(candidate, size) <= width) current = candidate;
      else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  /** Zeilen am unteren Seitenrand jeder Seite. */
  footerAll(lines: string[]): void {
    for (const page of this.doc.getPages()) {
      let y = MARGIN - 8;
      for (const l of [...lines].reverse()) {
        page.drawText(sanitize(l), { x: MARGIN, y, size: 8, font: this.font, color: GREY });
        y += 10;
      }
    }
  }
}

async function createWriter(): Promise<Writer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  return new Writer(doc, font, bold);
}

function partyLines(party: Party): string[] {
  return [party.name, ...party.addressLines];
}

function drawHeader(w: Writer, issuer: Party, recipient: Party, title: string, meta: [string, string][]): void {
  const rightX = A4[0] - MARGIN;
  const top = w.y;
  for (const l of partyLines(issuer)) w.line(l, MARGIN, { size: 9, color: GREY });
  if (issuer.phone) w.line(`Telefon ${issuer.phone}`, MARGIN, { size: 9, color: GREY });
  if (issuer.email) w.line(issuer.email, MARGIN, { size: 9, color: GREY });
  let metaY = top;
  for (const [label, value] of meta) {
    w.text(label, 0, { y: metaY, size: 9, color: GREY, alignRight: rightX - 120 });
    w.text(value, 0, { y: metaY, size: 9, alignRight: rightX });
    metaY -= LINE;
  }
  w.y = Math.min(w.y, metaY) - LINE * 2;
  for (const l of partyLines(recipient)) w.line(l);
  w.gap(2);
  w.line(title, MARGIN, { bold: true, size: 14 });
  w.gap(0.5);
}

function footerLines(issuer: Party): string[] {
  const tax = [issuer.taxNumber ? `Steuernummer ${issuer.taxNumber}` : null, issuer.vatId ? `USt-IdNr. ${issuer.vatId}` : null].filter((v): v is string => v !== null).join("  |  ");
  return [`${issuer.name}, ${issuer.addressLines.join(", ")}`, tax].filter((l) => l.length > 0);
}

/** Rechnung als PDF mit den Pflichtangaben nach § 14 Abs. 4 UStG. Liefert die PDF-Bytes. */
export async function renderInvoicePdf(data: InvoicePdfData): Promise<Uint8Array> {
  if (!data.issuer.taxNumber && !data.issuer.vatId) throw new Error("Aussteller benötigt Steuernummer oder USt-IdNr. (§ 14 Abs. 4 Nr. 2 UStG)");
  if (data.items.length === 0) throw new Error("Rechnung ohne Positionen");
  const currency = data.currency ?? "EUR";
  const w = await createWriter();
  const isCredit = Boolean(data.credit_note_for);
  const title = isCredit ? `Rechnungskorrektur Nr. ${data.invoice_number}` : `Rechnung Nr. ${data.invoice_number}`;
  const meta: [string, string][] = [
    ["Rechnungsnummer", data.invoice_number],
    ["Rechnungsdatum", formatDateDe(data.issued_at)],
  ];
  if (data.due_at) meta.push(["Fällig am", formatDateDe(data.due_at)]);
  if (data.service_period) meta.push(["Leistungszeitraum", data.service_period]);
  if (data.credit_note_for) meta.push(["Korrektur zu", data.credit_note_for]);
  drawHeader(w, data.issuer, data.recipient, title, meta);

  const cols = { pos: MARGIN, desc: MARGIN + 28, qty: 330, unit: 410, vat: 450, total: A4[0] - MARGIN };
  const drawTableHead = (): void => {
    w.ensure(LINE * 2);
    w.text("Pos.", cols.pos, { bold: true, size: 9 });
    w.text("Leistung", cols.desc, { bold: true, size: 9 });
    w.text("Menge", 0, { bold: true, size: 9, alignRight: cols.qty });
    w.text("Einzelpreis netto", 0, { bold: true, size: 9, alignRight: cols.unit });
    w.text("USt", 0, { bold: true, size: 9, alignRight: cols.vat });
    w.text("Gesamt netto", 0, { bold: true, size: 9, alignRight: cols.total });
    w.y -= 4;
    w.rule();
    w.y -= LINE;
  };
  drawTableHead();

  for (const item of data.items) {
    const totals = computeLineTotals({ quantity: item.quantity, unit_net_cents: item.unit_net_cents, vat_rate: data.small_business ? 0 : item.vat_rate });
    const descText = item.description + (item.service_date ? ` (Leistungsdatum ${formatDateDe(item.service_date)})` : "");
    const descLines = w.wrap(descText, cols.qty - cols.desc - 60);
    const height = LINE * Math.max(1, descLines.length) + 2;
    if (w.y - height < MARGIN + 30) {
      w.newPage();
      drawTableHead();
    }
    w.text(String(item.position), cols.pos);
    w.text(descLines[0] ?? "", cols.desc);
    const qty = Number.isInteger(item.quantity) ? String(item.quantity) : item.quantity.toFixed(2).replace(".", ",");
    w.text(`${qty}${item.unit ? ` ${item.unit}` : ""}`, 0, { alignRight: cols.qty });
    w.text(formatCents(item.unit_net_cents, currency), 0, { alignRight: cols.unit });
    w.text(data.small_business ? "0 %" : formatVatRate(item.vat_rate), 0, { alignRight: cols.vat });
    w.text(formatCents(totals.net, currency), 0, { alignRight: cols.total });
    w.y -= LINE;
    for (const extra of descLines.slice(1)) {
      w.text(extra, cols.desc);
      w.y -= LINE;
    }
    w.y -= 2;
  }
  w.rule();
  w.gap(0.5);

  const effectiveItems = data.items.map((i) => ({ quantity: i.quantity, unit_net_cents: i.unit_net_cents, vat_rate: data.small_business ? 0 : i.vat_rate }));
  const totals = computeInvoiceTotals(effectiveItems);
  const sumLine = (label: string, value: string, bold = false): void => {
    w.ensure(LINE);
    w.text(label, 0, { bold, alignRight: cols.unit });
    w.text(value, 0, { bold, alignRight: cols.total });
    w.y -= LINE;
  };
  sumLine("Nettobetrag", formatCents(totals.net, currency));
  if (!data.small_business) {
    for (const group of vatBreakdown(effectiveItems)) sumLine(`zzgl. ${formatVatRate(group.vat_rate)} USt auf ${formatCents(group.net, currency)}`, formatCents(group.vat, currency));
  }
  sumLine("Rechnungsbetrag brutto", formatCents(totals.gross, currency), true);
  if (data.paid_cents && data.paid_cents > 0) {
    sumLine("abzüglich bereits gezahlt", formatCents(-data.paid_cents, currency));
    sumLine("Noch zu zahlen", formatCents(Math.max(0, totals.gross - data.paid_cents), currency), true);
  }
  w.gap();

  if (data.small_business) w.line("Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).");
  if (data.payment_terms) for (const l of w.wrap(data.payment_terms, A4[0] - 2 * MARGIN)) w.line(l);
  else if (data.due_at && !isCredit) w.line(`Zahlbar ohne Abzug bis zum ${formatDateDe(data.due_at)}.`);
  if (data.sepa) {
    const when = data.sepa.collection_date ? ` am ${formatDateDe(data.sepa.collection_date)}` : "";
    for (const l of w.wrap(`Der Betrag wird${when} per SEPA-Lastschrift eingezogen. Gläubiger-ID ${data.sepa.creditor_id}, Mandatsreferenz ${data.sepa.mandate_reference}.`, A4[0] - 2 * MARGIN)) w.line(l);
  }
  if (data.bank_details) {
    w.gap(0.5);
    w.line("Bankverbindung", MARGIN, { bold: true });
    w.line(`Kontoinhaber ${data.bank_details.account_holder}`);
    w.line(`IBAN ${data.bank_details.iban}${data.bank_details.bic ? `, BIC ${data.bank_details.bic}` : ""}${data.bank_details.bank_name ? `, ${data.bank_details.bank_name}` : ""}`);
  }
  if (data.notes) {
    w.gap(0.5);
    for (const l of w.wrap(data.notes, A4[0] - 2 * MARGIN)) w.line(l, MARGIN, { color: GREY });
  }
  w.footerAll(footerLines(data.issuer));
  w.doc.setTitle(title);
  w.doc.setProducer("fahrpilot payments");
  return w.doc.save();
}

/** Zahlungsbeleg (Quittung) als PDF. */
export async function renderReceiptPdf(data: ReceiptPdfData): Promise<Uint8Array> {
  const currency = data.currency ?? "EUR";
  const w = await createWriter();
  const meta: [string, string][] = [
    ["Belegnummer", data.receipt_number],
    ["Zahlungsdatum", formatDateDe(data.paid_at)],
  ];
  if (data.invoice_number) meta.push(["Zu Rechnung", data.invoice_number]);
  drawHeader(w, data.issuer, data.recipient, `Zahlungsbeleg Nr. ${data.receipt_number}`, meta);
  const label = (k: string, v: string, bold = false): void => {
    w.text(k, MARGIN, { color: GREY });
    w.text(v, MARGIN + 160, { bold });
    w.y -= LINE;
  };
  label("Betrag", formatCents(data.amount_cents, currency), true);
  label("Zahlungsart", METHOD_LABELS[data.method]);
  if (data.invoice_number) label("Rechnung", data.invoice_number);
  if (data.provider_payment_id) label("Zahlungsreferenz", data.provider_payment_id);
  w.gap();
  w.line(`Wir bestätigen den Erhalt von ${formatCents(data.amount_cents, currency)}${data.invoice_number ? ` zur Rechnung ${data.invoice_number}` : ""}. Vielen Dank.`);
  w.line("Dieser Beleg ersetzt nicht die Rechnung; die Umsatzsteuer ist dort ausgewiesen.", MARGIN, { color: GREY, size: 9 });
  if (data.notes) {
    w.gap(0.5);
    for (const l of w.wrap(data.notes, A4[0] - 2 * MARGIN)) w.line(l, MARGIN, { color: GREY });
  }
  w.footerAll(footerLines(data.issuer));
  w.doc.setTitle(`Zahlungsbeleg ${data.receipt_number}`);
  w.doc.setProducer("fahrpilot payments");
  return w.doc.save();
}
