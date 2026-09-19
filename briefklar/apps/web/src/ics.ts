/**
 * Kalender-Dateien nach RFC 5545 – ohne Bibliothek.
 * Termine mit Uhrzeit werden in Europe/Berlin angelegt, ohne Uhrzeit ganztägig.
 */
export interface IcsEvent {
  uid?: string;
  title: string;
  description?: string | null;
  location?: string | null;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM (24h) oder null → ganztägig */
  time?: string | null;
  /** Dauer in Minuten (Default 60) */
  durationMinutes?: number | null;
  /** Erinnerungen: Minuten vor Beginn */
  alarmsMinutesBefore: number[];
}

const TZID = "Europe/Berlin";
const CRLF = "\r\n";

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Zeilen auf 75 Oktette falten (RFC 5545 §3.1). */
function fold(line: string): string {
  const enc = new TextEncoder();
  const bytes = enc.encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let cur = "";
  let curBytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // Folgezeilen beginnen mit Leerzeichen
    if (curBytes + b > limit) {
      out.push(cur);
      cur = ch;
      curBytes = b;
    } else {
      cur += ch;
      curBytes += b;
    }
  }
  if (cur) out.push(cur);
  return out.map((l, i) => (i === 0 ? l : ` ${l}`)).join(CRLF);
}

function parseDate(date: string): { y: number; m: number; d: number } | null {
  if (!isIsoDate(date)) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

function parseTime(time: string | null | undefined): { hh: number; mm: number } | null {
  if (!time) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh > 23 || mm > 59) return null;
  return { hh, mm };
}

function dateStr(y: number, m: number, d: number): string {
  return `${y}${pad(m)}${pad(d)}`;
}

function nowUtcStamp(): string {
  const n = new Date();
  return `${n.getUTCFullYear()}${pad(n.getUTCMonth() + 1)}${pad(n.getUTCDate())}T${pad(n.getUTCHours())}${pad(n.getUTCMinutes())}${pad(n.getUTCSeconds())}Z`;
}

function addMinutes(y: number, m: number, d: number, hh: number, mm: number, minutes: number) {
  const dt = new Date(Date.UTC(y, m - 1, d, hh, mm) + minutes * 60_000);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), hh: dt.getUTCHours(), mm: dt.getUTCMinutes() };
}

function uid(): string {
  const rnd = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${rnd}@briefklar`;
}

const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  `TZID:${TZID}`,
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

export function isIsoDate(s: string | null | undefined): s is string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function buildIcs(events: IcsEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Briefklar//Briefklar Web//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  const needsTz = events.some((e) => parseTime(e.time));
  if (needsTz) lines.push(...VTIMEZONE);

  for (const ev of events) {
    const d = parseDate(ev.date);
    if (!d) continue;
    const tm = parseTime(ev.time);
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${ev.uid ?? uid()}`);
    lines.push(`DTSTAMP:${nowUtcStamp()}`);
    if (tm) {
      const dur = ev.durationMinutes && ev.durationMinutes > 0 ? ev.durationMinutes : 60;
      const end = addMinutes(d.y, d.m, d.d, tm.hh, tm.mm, dur);
      lines.push(`DTSTART;TZID=${TZID}:${dateStr(d.y, d.m, d.d)}T${pad(tm.hh)}${pad(tm.mm)}00`);
      lines.push(`DTEND;TZID=${TZID}:${dateStr(end.y, end.m, end.d)}T${pad(end.hh)}${pad(end.mm)}00`);
    } else {
      const next = addMinutes(d.y, d.m, d.d, 0, 0, 24 * 60);
      lines.push(`DTSTART;VALUE=DATE:${dateStr(d.y, d.m, d.d)}`);
      lines.push(`DTEND;VALUE=DATE:${dateStr(next.y, next.m, next.d)}`);
    }
    lines.push(`SUMMARY:${esc(ev.title)}`);
    if (ev.location) lines.push(`LOCATION:${esc(ev.location)}`);
    if (ev.description) lines.push(`DESCRIPTION:${esc(ev.description)}`);
    for (const min of ev.alarmsMinutesBefore) {
      lines.push("BEGIN:VALARM");
      lines.push("ACTION:DISPLAY");
      lines.push(`DESCRIPTION:${esc(ev.title)}`);
      lines.push(`TRIGGER:-PT${min}M`);
      lines.push("END:VALARM");
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join(CRLF) + CRLF;
}

/** Dateiname nur aus ASCII: Umlaute transliterieren, Rest ersetzen (Browser verwerfen sonst den Namen). */
export function safeFilename(name: string): string {
  const map: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", Ä: "Ae", Ö: "Oe", Ü: "Ue", ß: "ss" };
  const ascii = name
    .replace(/[äöüÄÖÜß]/g, (c) => map[c] ?? c)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  const base = ascii.replace(/\.ics$/i, "") || "termin";
  return `${base}.ics`;
}

export function downloadIcs(filename: string, ics: string): void {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeFilename(filename);
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Google-Kalender-Link (öffnet Web/App mit vorausgefülltem Termin). */
export function googleCalendarUrl(ev: IcsEvent): string | null {
  const d = parseDate(ev.date);
  if (!d) return null;
  const tm = parseTime(ev.time);
  let dates: string;
  if (tm) {
    const dur = ev.durationMinutes && ev.durationMinutes > 0 ? ev.durationMinutes : 60;
    const end = addMinutes(d.y, d.m, d.d, tm.hh, tm.mm, dur);
    dates = `${dateStr(d.y, d.m, d.d)}T${pad(tm.hh)}${pad(tm.mm)}00/${dateStr(end.y, end.m, end.d)}T${pad(end.hh)}${pad(end.mm)}00`;
  } else {
    const next = addMinutes(d.y, d.m, d.d, 0, 0, 24 * 60);
    dates = `${dateStr(d.y, d.m, d.d)}/${dateStr(next.y, next.m, next.d)}`;
  }
  const p = new URLSearchParams({ action: "TEMPLATE", text: ev.title, dates });
  if (tm) p.set("ctz", TZID);
  if (ev.location) p.set("location", ev.location);
  if (ev.description) p.set("details", ev.description);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
