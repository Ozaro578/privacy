import { h, icon } from "./dom";
import { t, type UiKey } from "../i18n";

const HINTS: UiKey[] = ["hint_1", "hint_2", "hint_3", "hint_4", "hint_5"];

export interface LoadingHandle {
  el: HTMLElement;
  stop: () => void;
}

export function renderLoading(onCancel: () => void): LoadingHandle {
  const hint = h("p", { class: "hint-line", "aria-live": "polite" }, t(HINTS[0]!));
  const elapsed = h("p", { class: "muted small" }, t("loading_elapsed", { s: 0 }));
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 160 160");
  svg.setAttribute("class", "env-anim");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = `
    <rect x="20" y="52" width="120" height="88" rx="12" fill="#fff" stroke="#1e3a8a" stroke-width="5"/>
    <rect class="paper" x="36" y="72" width="88" height="80" rx="6" fill="#faf8f4" stroke="#1e3a8a" stroke-width="4"/>
    <path class="tick" d="M58 108l14 14 30-32" fill="none" stroke="#16a34a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M20 108 V128 a12 12 0 0 0 12 12 h96 a12 12 0 0 0 12 -12 V108 L80 134 z" fill="#e4e9f7" stroke="#1e3a8a" stroke-width="5" stroke-linejoin="round"/>
    <path d="M20 108 L80 134 L140 108" fill="none" stroke="#1e3a8a" stroke-width="5" stroke-linejoin="round"/>`;

  const started = Date.now();
  let i = 0;
  const hintTimer = window.setInterval(() => {
    i = Math.min(i + 1, HINTS.length - 1);
    hint.textContent = t(HINTS[i]!);
  }, 7000);
  const secTimer = window.setInterval(() => {
    elapsed.textContent = t("loading_elapsed", { s: Math.round((Date.now() - started) / 1000) });
  }, 1000);

  const el = h(
    "section",
    { class: "screen loading", "aria-busy": "true" },
    svg,
    h("h1", null, t("loading_title")),
    hint,
    h("div", { class: "progress", role: "progressbar", "aria-label": t("loading_title") }, h("span")),
    h("p", { class: "muted" }, t("loading_note")),
    elapsed,
    h("button", { type: "button", class: "btn btn-ghost", onclick: onCancel }, icon("close"), t("cancel")),
  );
  return {
    el,
    stop: () => {
      window.clearInterval(hintTimer);
      window.clearInterval(secTimer);
    },
  };
}
