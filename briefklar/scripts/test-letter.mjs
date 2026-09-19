#!/usr/bin/env node
// Echter End-to-End-Test: schickt docs/musterbrief.jpg (oder eine eigene Datei) an die laufende API.
// Nutzung: node scripts/test-letter.mjs [datei] [sprache] [api-url]
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const file = resolve(process.argv[2] ?? new URL("../docs/musterbrief.jpg", import.meta.url).pathname);
const language = process.argv[3] ?? "de";
const api = (process.argv[4] ?? process.env.BRIEFKLAR_API ?? "http://localhost:8787").replace(/\/$/, "");

const bytes = readFileSync(file);
const type = file.toLowerCase().endsWith(".pdf") ? "application/pdf" : file.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
const form = new FormData();
form.append("language", language);
form.append("images", new Blob([bytes], { type }), basename(file));

console.log(`→ ${api}/api/explain  (${basename(file)}, ${Math.round(bytes.length / 1024)} KB, Sprache ${language})`);
const started = Date.now();
const res = await fetch(`${api}/api/explain`, { method: "POST", body: form });
const json = await res.json();
console.log(`← HTTP ${res.status} nach ${((Date.now() - started) / 1000).toFixed(1)} s\n`);
if (!res.ok) {
  console.error(JSON.stringify(json, null, 2));
  process.exit(1);
}
const r = json;
const line = (k, v) => v != null && v !== "" && console.log(`${k.padEnd(14)} ${v}`);
line("Das ist:", r.document_type);
line("Absender:", `${r.sender.name ?? "?"} (${r.sender.type})`);
line("Dringlichkeit:", r.urgency);
line("Betrug:", `${r.scam_risk}${r.warnings.length ? " – " + r.warnings.join(" | ") : ""}`);
line("Sicherheit:", r.confidence);
console.log("\n" + r.summary + "\n\n" + r.what_it_means + "\n");
for (const a of r.appointments) console.log(`📅 ${a.date} ${a.time ?? ""} ${a.title} @ ${a.location ?? "-"}${a.mandatory ? " (Pflicht)" : ""}`);
for (const d of r.deadlines) console.log(`⏰ ${d.date ?? "kein Datum"}: ${d.description}`);
for (const s of r.actions) console.log(`${s.step}. ${s.text}${s.required ? "" : " (optional)"}`);
if (r.money.direction !== "keine") console.log(`\n💶 ${r.money.direction}: ${r.money.amount ?? "?"} – ${r.money.details ?? ""}`);
if (r.payment) console.log(`   ${r.payment.recipient} · ${r.payment.iban} · ${r.payment.reference} · bis ${r.payment.due_date}`);
console.log(`\nKontakt: ${JSON.stringify(r.sender.contact)}`);
console.log(`Glossar: ${r.glossary.map((g) => g.term_de).join(", ")}`);
console.log(`Hilfe: ${r.where_to_get_help.map((h) => h.name).join("; ")}`);
console.log("\nVollständige Antwort:");
console.log(JSON.stringify(r, null, 2));
