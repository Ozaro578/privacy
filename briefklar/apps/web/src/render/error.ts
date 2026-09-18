import { h, icon } from "./dom";
import { t } from "../i18n";

export function renderError(message: string, onRetry: (() => void) | null, onNew: () => void): HTMLElement {
  return h(
    "section",
    { class: "screen error-screen", role: "alert" },
    icon("sad"),
    h("h1", null, t("error_title")),
    h("p", null, message),
    onRetry ? h("button", { type: "button", class: "btn btn-primary", onclick: onRetry }, icon("refresh"), t("retry")) : null,
    h("button", { type: "button", class: "btn btn-secondary", onclick: onNew }, icon("camera"), t("new_letter")),
  );
}
