import { LANGUAGES, isRtl, type LanguageCode } from "@briefklar/shared";
import { h, icon } from "./dom";
import { t } from "../i18n";
import { consentText, consentLanguage } from "../consent";

export interface StartActions {
  language: LanguageCode;
  onPickFiles: (files: File[]) => void;
  onOpenLanguage: () => void;
  /** true, wenn der Nutzer die Hinweise noch bestätigen muss */
  needsConsent: () => boolean;
  onConsent: () => void;
}

function fileInput(capture: boolean, onFiles: (files: File[]) => void): HTMLInputElement {
  const input = h("input", {
    type: "file",
    accept: "image/*,application/pdf",
    multiple: true,
    class: "sr-only",
    tabindex: -1,
    "aria-hidden": "true",
  });
  if (capture) input.setAttribute("capture", "environment");
  input.addEventListener("change", () => {
    const files = Array.from(input.files ?? []);
    input.value = "";
    if (files.length) onFiles(files);
  });
  return input;
}

/** Startbildschirm: ein großer Button, Sprache, Vertrauen. */
export function renderStart(a: StartActions): HTMLElement {
  const cam = fileInput(true, a.onPickFiles);
  const gal = fileInput(false, a.onPickFiles);
  const lang = LANGUAGES.find((l) => l.code === a.language);

  const open = (input: HTMLInputElement) => () => {
    if (a.needsConsent()) {
      showConsent(a, () => input.click());
      return;
    }
    input.click();
  };

  return h(
    "section",
    { class: "screen start" },
    h(
      "header",
      { class: "brand" },
      h("img", { src: "/icon.svg", alt: "", width: 44, height: 44 }),
      h("h1", null, t("app_name")),
    ),
    h("p", { class: "tagline" }, t("tagline")),
    cam,
    gal,
    h("button", { type: "button", class: "btn btn-primary btn-giant", onclick: open(cam) }, icon("camera"), t("btn_photo")),
    h("button", { type: "button", class: "btn btn-secondary", onclick: open(gal) }, icon("gallery"), t("btn_gallery")),
    h(
      "button",
      { type: "button", class: "lang-btn", onclick: a.onOpenLanguage, "aria-label": t("choose_language") },
      icon("globe"),
      h("span", null, h("span", { class: "lang-label" }, t("lang_label")), h("span", { class: "lang-name" }, lang?.nativeLabel ?? a.language)),
      icon("chevron_down", "chev"),
    ),
    h("p", { class: "trust" }, icon("shield"), h("span", null, t("trust"))),
    h(
      "div",
      { class: "card" },
      h("h2", { class: "card-title" }, icon("sparkle"), t("how_title")),
      h(
        "ol",
        { class: "how" },
        ...[t("how_1"), t("how_2"), t("how_3")].map((txt, i) => h("li", null, h("span", { class: "num" }, String(i + 1)), h("span", null, txt))),
      ),
    ),
    h(
      "nav",
      { class: "footer-links" },
      h("a", { href: "/datenschutz.html" }, t("privacy")),
      h("a", { href: "/impressum.html" }, t("imprint")),
    ),
  );
}

/** Vollbild-Sprachauswahl: große Zeilen, Name in der Sprache selbst. */
export function renderLanguagePicker(current: LanguageCode, onChoose: (code: LanguageCode) => void, onBack: () => void): HTMLElement {
  const list = h("div", { class: "lang-list", role: "radiogroup", "aria-label": t("choose_language") });
  for (const l of LANGUAGES) {
    const row = h(
      "button",
      {
        type: "button",
        class: "lang-row",
        role: "radio",
        "aria-checked": l.code === current ? "true" : "false",
        lang: l.code,
        dir: isRtl(l.code) ? "rtl" : "ltr",
        onclick: () => onChoose(l.code),
      },
      h("span", null, h("span", { class: "native" }, l.nativeLabel), h("span", { class: "german", lang: "de" }, l.label)),
      l.code === current ? icon("check", "check") : null,
    );
    list.appendChild(row);
  }
  return h(
    "section",
    { class: "screen" },
    h(
      "header",
      { class: "topbar" },
      h("button", { type: "button", class: "icon-btn", onclick: onBack, "aria-label": t("back") }, icon("chevron_start")),
      h("h1", null, t("choose_language")),
    ),
    list,
  );
}

/** Einmaliger Hinweis vor dem ersten Hochladen (Einwilligung). */
export function showConsent(a: StartActions, next: () => void): void {
  const code = consentLanguage(a.language);
  const c = consentText(a.language);
  const overlay = h("div", { class: "overlay", role: "dialog", "aria-modal": "true", "aria-labelledby": "consent-title", lang: code, dir: isRtl(code) ? "rtl" : "ltr" });
  const box = h(
    "div",
    { class: "sheet" },
    h("h2", { id: "consent-title", class: "card-title" }, icon("info"), c.title),
    h("ul", { class: "consent-list" }, ...c.bullets.map((b) => h("li", null, b))),
    h(
      "button",
      {
        type: "button",
        class: "btn btn-primary",
        onclick: () => {
          a.onConsent();
          overlay.remove();
          next();
        },
      },
      icon("check"),
      c.button,
    ),
    h("nav", { class: "footer-links" }, h("a", { href: "/datenschutz.html" }, c.privacy), h("a", { href: "/impressum.html" }, c.imprint)),
  );
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  (box.querySelector("button") as HTMLButtonElement | null)?.focus();
}
