import { isRtl, type ExplainResult, type Appointment, type Deadline, type LanguageCode } from "@briefklar/shared";
import { h, icon, toast, copyText, type Child } from "./dom";
import { t, formatDate, bcp47, type UiKey } from "../i18n";
import { buildIcs, downloadIcs, googleCalendarUrl, isIsoDate, type IcsEvent } from "../ics";
import { canBuildGirocode, formatIban, paymentAsText, renderGirocode } from "../girocode";

export interface ResultActions {
  result: ExplainResult;
  demo: boolean;
  onNew: () => void;
}

const SENDER_KEY: Record<ExplainResult["sender"]["type"], UiKey> = {
  behoerde: "sender_behoerde",
  gericht: "sender_gericht",
  krankenkasse: "sender_krankenkasse",
  versicherung: "sender_versicherung",
  bank: "sender_bank",
  vermieter: "sender_vermieter",
  arbeitgeber: "sender_arbeitgeber",
  inkasso: "sender_inkasso",
  firma: "sender_firma",
  schule_kita: "sender_schule_kita",
  sonstiges: "sender_sonstiges",
  unbekannt: "sender_unbekannt",
};

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function mapsUrl(address: string): string {
  return isIos()
    ? `https://maps.apple.com/?q=${encodeURIComponent(address)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function safeHttpUrl(u: string): string | null {
  try {
    const url = new URL(u.startsWith("http") ? u : `https://${u}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Aufklappbare Karte; `open` = standardmäßig offen */
function section(iconName: string, title: string, open: boolean, meta: string | null, ...body: Child[]): HTMLElement {
  const d = h(
    "details",
    { class: "card", open: open || undefined },
    h("summary", null, icon(iconName, "ico"), h("span", null, title, meta ? h("span", { class: "sum-meta" }, meta) : null), icon("chevron_down", "chev")),
    h("div", { class: "details-body" }, ...body),
  );
  return d;
}

function calendarButtons(ev: IcsEvent, filename: string): HTMLElement[] {
  const g = googleCalendarUrl(ev);
  const out: HTMLElement[] = [
    h("button", { type: "button", class: "btn btn-primary", onclick: () => downloadIcs(filename, buildIcs([ev])) }, icon("calendar"), t("add_to_calendar")),
  ];
  if (g) out.push(h("a", { class: "btn btn-ghost", href: g, target: "_blank", rel: "noopener noreferrer" }, icon("link"), t("google_calendar")));
  return out;
}

function appointmentItem(ap: Appointment, r: ExplainResult, lang: LanguageCode): HTMLElement | null {
  if (!isIsoDate(ap.date)) return null;
  const when = ap.time ? t("at_time", { date: formatDate(ap.date, lang), time: ap.time }) : `${formatDate(ap.date, lang)} · ${t("all_day")}`;
  const descParts = [ap.notes, r.sender.name ? t("from_letter", { sender: r.sender.name }) : null, r.reference_number ? `${t("reference")}: ${r.reference_number}` : null].filter(Boolean);
  const ev: IcsEvent = {
    title: ap.title,
    date: ap.date,
    time: ap.time,
    durationMinutes: ap.duration_minutes,
    location: ap.location,
    description: descParts.join("\n"),
    alarmsMinutesBefore: [24 * 60, 120],
  };
  return h(
    "div",
    { class: "appt" },
    h("p", { class: "big-date" }, when),
    h("p", { class: "title" }, ap.title, " ", ap.mandatory ? h("span", { class: "badge badge-req" }, t("mandatory")) : null),
    ap.location ? h("p", { class: "muted" }, icon("pin", "inline-ico"), " ", ap.location) : null,
    ap.notes ? h("p", null, ap.notes) : null,
    ...calendarButtons(ev, `${ap.title}.ics`),
    ap.location ? h("a", { class: "btn btn-secondary", href: mapsUrl(ap.location), target: "_blank", rel: "noopener noreferrer" }, icon("pin"), t("route")) : null,
  );
}

function deadlineItem(dl: Deadline, r: ExplainResult, lang: LanguageCode): HTMLElement {
  const title = t("reminder_prefix", { text: dl.description });
  const ev: IcsEvent | null = isIsoDate(dl.date)
    ? {
        title,
        date: dl.date,
        time: null,
        description: [dl.consequence_if_missed, r.sender.name ? t("from_letter", { sender: r.sender.name }) : null, r.reference_number ? `${t("reference")}: ${r.reference_number}` : null].filter(Boolean).join("\n"),
        alarmsMinutesBefore: [3 * 24 * 60, 24 * 60],
      }
    : null;
  return h(
    "div",
    { class: "deadline" },
    h("p", { class: "big-date" }, dl.date ? formatDate(dl.date, lang) : t("deadline_no_date")),
    h("p", null, dl.description),
    dl.consequence_if_missed ? h("p", { class: "cons" }, h("strong", null, t("deadline_consequence")), " ", dl.consequence_if_missed) : null,
    ev ? h("button", { type: "button", class: "btn btn-secondary", onclick: () => downloadIcs(`${title}.ics`, buildIcs([ev])) }, icon("bell"), t("set_reminder")) : null,
    ev ? h("p", { class: "hint" }, t("reminder_hint")) : null,
  );
}

function resultAsText(r: ExplainResult, lang: LanguageCode): string {
  const L: string[] = [];
  L.push(`${t("this_is")} ${r.document_type}`);
  if (r.sender.name) L.push(r.sender.name);
  L.push(`${t("urgency_label")}: ${t(`urgency_${r.urgency}` as UiKey)}`);
  L.push("", `${t("summary_title")}`, r.summary, "", t("meaning_title"), r.what_it_means);
  if (r.appointments.length) {
    L.push("", t("appointments_title"));
    for (const ap of r.appointments) L.push(`- ${formatDate(ap.date, lang)}${ap.time ? ` ${ap.time}` : ""}: ${ap.title}${ap.location ? ` (${ap.location})` : ""}`);
  }
  if (r.deadlines.length) {
    L.push("", t("deadlines_title"));
    for (const d of r.deadlines) L.push(`- ${d.date ? formatDate(d.date, lang) : t("deadline_no_date")}: ${d.description}`);
  }
  if (r.actions.length) {
    L.push("", t("actions_title"));
    for (const a of r.actions) L.push(`${a.step}. ${a.text}`);
  }
  if (r.money.direction !== "keine") L.push("", `${t("money_title")}: ${r.money.amount ?? ""} ${r.money.details ?? ""}`.trim());
  if (r.can_object) L.push("", t("object_title"), r.can_object);
  if (r.where_to_get_help.length) {
    L.push("", t("help_title"));
    for (const hh of r.where_to_get_help) L.push(`- ${hh.name}: ${hh.how}`);
  }
  L.push("", t("disclaimer"), "— Briefklar");
  return L.join("\n");
}

function speakable(r: ExplainResult): string {
  return [r.summary, r.what_it_means, ...r.actions.map((a) => `${a.step}. ${a.text}`)].join(". ");
}

export function renderResult(a: ResultActions): HTMLElement {
  const r = a.result;
  const lang = r.language;
  const dir = isRtl(lang) ? "rtl" : "ltr";
  const senderType = r.sender.type === "unbekannt" && !r.sender.name ? t("sender_unknown") : t(SENDER_KEY[r.sender.type]);

  /* ---------- Antwortkarte ---------- */
  const answer = h(
    "div",
    { class: "card answer" },
    h("p", { class: "this-is" }, t("this_is")),
    h("h1", null, r.document_type),
    h("span", { class: `chip chip-${r.urgency}` }, t(`urgency_${r.urgency}` as UiKey)),
    h("p", { class: "summary" }, r.summary),
    h(
      "div",
      { class: "meta" },
      h("div", { class: "row" }, icon("doc"), h("strong", null, r.sender.name ?? senderType), r.sender.name ? h("span", { class: "badge" }, senderType) : null),
      r.letter_date ? h("div", { class: "row" }, icon("calendar"), `${t("letter_date")}: `, h("strong", null, formatDate(r.letter_date, lang))) : null,
      r.reference_number
        ? h(
            "div",
            { class: "row" },
            icon("copy"),
            `${t("reference")}: `,
            h("strong", null, r.reference_number),
            h("button", { type: "button", class: "btn btn-secondary btn-sm", onclick: async () => toast((await copyText(r.reference_number!)) ? t("copied") : t("copy")) }, t("copy")),
          )
        : null,
    ),
  );

  /* ---------- Warnungen / Qualität ---------- */
  const cards: Child[] = [];
  if (r.scam_risk !== "niedrig" || r.warnings.length) {
    cards.push(
      h(
        "div",
        { class: "card card-warn", role: "alert" },
        h("h2", { class: "card-title" }, icon("alert"), t("warning_title")),
        h("p", null, r.scam_risk === "hoch" ? t("scam_hoch") : r.scam_risk === "mittel" ? t("scam_mittel") : ""),
        r.warnings.length ? h("ul", { class: "warn-list" }, ...r.warnings.map((w) => h("li", null, w))) : null,
      ),
    );
  }
  if (!r.is_readable || r.quality_hint) {
    cards.push(h("div", { class: "card card-note" }, h("h2", { class: "card-title" }, icon("info"), t("quality_title")), h("p", null, r.quality_hint ?? t("not_readable"))));
  }

  /* ---------- Was tun ---------- */
  if (r.actions.length) {
    const list = h("ol", { class: "checklist" });
    r.actions.forEach((st, i) => {
      const id = `act-${i}`;
      const cb = h("input", { type: "checkbox", id });
      const li = h("li", null, cb, h("label", { for: id }, h("span", { class: "num" }, `${st.step}.`), st.text, " ", h("span", { class: `badge ${st.required ? "badge-req" : "badge-opt"}` }, st.required ? t("required") : t("optional"))));
      cb.addEventListener("change", () => li.classList.toggle("done", cb.checked));
      list.appendChild(li);
    });
    cards.push(h("div", { class: "card" }, h("h2", { class: "card-title" }, icon("check"), t("actions_title")), list));
  }

  /* ---------- Termine / Fristen ---------- */
  if (r.appointments.length) cards.push(section("calendar", t("appointments_title"), true, null, ...r.appointments.map((ap) => appointmentItem(ap, r, lang))));
  if (r.deadlines.length) cards.push(section("clock", t("deadlines_title"), true, null, ...r.deadlines.map((d) => deadlineItem(d, r, lang))));

  /* ---------- Was heißt das ---------- */
  cards.push(section("book", t("meaning_title"), true, null, h("p", null, r.what_it_means)));

  /* ---------- Geld / Zahlung ---------- */
  if (r.money.direction !== "keine") {
    const dirKey: UiKey = r.money.direction === "zahlen" ? "money_zahlen" : r.money.direction === "bekommen" ? "money_bekommen" : "money_unklar";
    const body: Child[] = [
      h("p", { class: `money-dir money-${r.money.direction}` }, icon(r.money.direction === "bekommen" ? "arrow_in" : "arrow_out"), t(dirKey)),
      r.money.amount ? h("p", { class: "money-amount" }, r.money.amount) : null,
      r.money.details ? h("p", null, r.money.details) : null,
    ];
    const p = r.payment;
    if (p && r.money.direction === "zahlen") {
      if (r.scam_risk === "hoch") {
        body.push(h("p", { class: "msg-error" }, t("payment_blocked")));
      } else {
        const suspicious = r.scam_risk === "mittel";
        const due = p.due_date ? formatDate(p.due_date, lang) : null;
        const kv = h("dl", { class: "kv" });
        const row = (k: string, v: string, cls = "") => kv.append(h("dt", null, k), h("dd", { class: cls }, v));
        if (p.recipient) row(t("recipient"), p.recipient);
        if (p.iban) row(t("iban"), formatIban(p.iban), "iban");
        if (p.bic) row("BIC", p.bic);
        if (p.reference) row(t("purpose"), p.reference);
        if (due) row(t("due_date"), due);
        body.push(kv);
        if (suspicious) body.push(h("p", { class: "msg-error" }, t("scam_mittel")));
        const btns = suspicious ? null : h(
          "div",
          { class: "btn-row" },
          p.iban ? h("button", { type: "button", class: "btn btn-secondary", onclick: async () => toast((await copyText(formatIban(p.iban!))) ? t("copied") : t("copy")) }, icon("copy"), t("copy_iban")) : null,
          h(
            "button",
            {
              type: "button",
              class: "btn btn-secondary",
              onclick: async () =>
                toast((await copyText(paymentAsText(p, { recipient: t("recipient"), iban: t("iban"), bic: "BIC", purpose: t("purpose"), amount: t("money_title"), due: t("due_date") }, due))) ? t("copied") : t("copy")),
            },
            icon("copy"),
            t("copy_all"),
          ),
        );
        if (btns) body.push(btns);
        if (!suspicious && canBuildGirocode(p)) {
          const canvas = h("canvas", { "aria-label": t("girocode_title") });
          const qr = h("div", { class: "qr" }, canvas, h("p", { class: "small muted center" }, t("girocode_hint")));
          body.push(h("h3", null, t("girocode_title")), qr);
          void renderGirocode(canvas, p).catch(() => qr.remove());
        }
        if (p.due_date && isIsoDate(p.due_date)) {
          const ev: IcsEvent = {
            title: t("reminder_prefix", { text: `${p.amount_eur != null ? `${p.amount_eur.toFixed(2).replace(".", ",")} € ` : ""}${r.sender.name ?? ""}`.trim() }),
            date: p.due_date,
            time: null,
            description: paymentAsText(p, { recipient: t("recipient"), iban: t("iban"), bic: "BIC", purpose: t("purpose"), amount: t("money_title"), due: t("due_date") }, due),
            alarmsMinutesBefore: [3 * 24 * 60, 24 * 60],
          };
          body.push(h("button", { type: "button", class: "btn btn-ghost", onclick: () => downloadIcs("zahlung.ics", buildIcs([ev])) }, icon("bell"), t("set_reminder")));
        }
      }
    }
    cards.push(section("euro", t("money_title"), true, r.money.amount, ...body));
  }

  /* ---------- Kontakt ---------- */
  const c = r.sender.contact;
  const contactBtns: Child[] = [];
  if (c.phone) contactBtns.push(h("a", { class: "btn btn-secondary", href: `tel:${c.phone.replace(/[^\d+]/g, "")}` }, icon("phone"), t("call")));
  const email = c.email && /^[^\s@?&#,;]+@[^\s@?&#,;]+\.[^\s@?&#,;]+$/.test(c.email) ? c.email : null;
  if (email) contactBtns.push(h("a", { class: "btn btn-secondary", href: `mailto:${email}${r.reference_number ? `?subject=${encodeURIComponent(r.reference_number)}` : ""}` }, icon("mail"), t("write_email")));
  const web = c.website ? safeHttpUrl(c.website) : null;
  if (web) contactBtns.push(h("a", { class: "btn btn-secondary", href: web, target: "_blank", rel: "noopener noreferrer" }, icon("link"), t("open_website")));
  if (c.address) contactBtns.push(h("a", { class: "btn btn-secondary", href: mapsUrl(c.address), target: "_blank", rel: "noopener noreferrer" }, icon("pin"), t("route")));
  if (contactBtns.length || c.office_hours) {
    cards.push(
      section(
        "phone",
        t("contact_title"),
        false,
        r.sender.name,
        c.address ? h("p", { class: "muted" }, c.address) : null,
        c.office_hours ? h("p", null, h("strong", null, `${t("office_hours")}: `), c.office_hours) : null,
        h("div", { class: "contact-grid" }, ...contactBtns),
      ),
    );
  }

  /* ---------- Wehren / Glossar / Hilfe ---------- */
  if (r.can_object) cards.push(section("hand", t("object_title"), false, null, h("p", null, r.can_object)));
  if (r.glossary.length) {
    const dl = h("dl", { class: "glossary" });
    for (const g of r.glossary) dl.append(h("dt", { lang: "de" }, g.term_de), h("dd", null, g.explanation));
    cards.push(section("book", t("glossary_title"), false, `${r.glossary.length}`, dl));
  }
  if (r.where_to_get_help.length) {
    cards.push(section("help", t("help_title"), false, null, ...r.where_to_get_help.map((hh) => h("div", { class: "help-item" }, h("strong", null, hh.name), h("span", null, hh.how)))));
  }

  /* ---------- Aktionen ---------- */
  const canSpeak = "speechSynthesis" in window;
  let speaking = false;
  const speakBtn = h(
    "button",
    {
      type: "button",
      class: "btn btn-secondary",
      onclick: () => {
        if (speaking) {
          window.speechSynthesis.cancel();
          return;
        }
        const u = new SpeechSynthesisUtterance(speakable(r));
        u.lang = bcp47(lang);
        u.rate = 0.95;
        u.onstart = () => {
          speaking = true;
          speakBtn.replaceChildren(icon("stop"), t("stop_reading"));
        };
        u.onend = u.onerror = () => {
          speaking = false;
          speakBtn.replaceChildren(icon("speaker"), t("read_aloud"));
        };
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      },
    },
    icon("speaker"),
    t("read_aloud"),
  );
  const shareBtn = h(
    "button",
    {
      type: "button",
      class: "btn btn-secondary",
      onclick: async () => {
        const text = resultAsText(r, lang);
        if (navigator.share) {
          try {
            await navigator.share({ title: `Briefklar – ${r.document_type}`, text });
            return;
          } catch {
            /* abgebrochen → Zwischenablage */
          }
        }
        toast((await copyText(text)) ? t("share_copied") : t("copy"));
      },
    },
    icon("share"),
    t("share"),
  );

  const footer = h(
    "div",
    { class: "stack" },
    h(
      "p",
      { class: "muted small center" },
      `${t("confidence_label")} ${t(`confidence_${r.confidence}` as UiKey)}. `,
      r.confidence === "niedrig" ? t("confidence_note_low") : null,
    ),
    h("div", { class: "btn-row" }, canSpeak ? speakBtn : null, shareBtn),
    h("button", { type: "button", class: "btn btn-primary", onclick: a.onNew }, icon("camera"), t("new_letter")),
    h("p", { class: "disclaimer" }, icon("lock", "inline-ico"), " ", t("disclaimer")),
  );

  const el = h(
    "section",
    { class: "screen result", lang, dir },
    a.demo ? h("span", { class: "demo-badge" }, t("demo_badge")) : null,
    h("header", { class: "topbar" }, h("button", { type: "button", class: "icon-btn", onclick: a.onNew, "aria-label": t("new_letter") }, icon("chevron_start")), h("h1", null, t("result_title"))),
    answer,
    ...cards,
    footer,
  );
  return el;
}
