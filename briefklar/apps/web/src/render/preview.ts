import { LIMITS } from "@briefklar/shared";
import { h, icon } from "./dom";
import { t, formatBytes } from "../i18n";
import type { Page } from "../image";

export interface PreviewActions {
  pages: Page[];
  error: string | null;
  busy: boolean;
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onExplain: () => void;
  onBack: () => void;
}

export function renderPreview(a: PreviewActions): HTMLElement {
  const input = h("input", { type: "file", accept: "image/*,application/pdf", multiple: true, class: "sr-only", tabindex: -1, "aria-hidden": "true" });
  input.addEventListener("change", () => {
    const files = Array.from(input.files ?? []);
    input.value = "";
    if (files.length) a.onAdd(files);
  });

  const total = a.pages.reduce((s, p) => s + p.bytes, 0);
  const grid = h("div", { class: "pages" });
  a.pages.forEach((p, i) => {
    grid.appendChild(
      h(
        "div",
        { class: "page-tile" },
        p.thumbUrl ? h("img", { src: p.thumbUrl, alt: t("page_label", { n: i + 1 }) }) : h("div", { class: "pdf" }, t("pdf_badge")),
        h("span", { class: "label" }, t("page_label", { n: i + 1 })),
        h("button", { type: "button", class: "remove", disabled: a.busy, "aria-label": t("remove_page", { n: i + 1 }), onclick: () => a.onRemove(p.id) }, icon("close")),
      ),
    );
  });
  if (a.pages.length < LIMITS.MAX_IMAGES) {
    grid.appendChild(h("button", { type: "button", class: "page-add", disabled: a.busy, onclick: () => input.click() }, icon("plus"), t("add_page")));
  }

  return h(
    "section",
    { class: "screen" },
    h(
      "header",
      { class: "topbar" },
      h("button", { type: "button", class: "icon-btn", disabled: a.busy, onclick: a.onBack, "aria-label": t("back") }, icon("chevron_start")),
      h("h1", null, t("preview_title")),
    ),
    h("p", { class: "muted" }, `${t("pages_count", { n: a.pages.length })} · ${t("total_size", { size: formatBytes(total) })}`),
    input,
    grid,
    a.error ? h("p", { class: "msg-error", role: "alert" }, a.error) : null,
    a.busy ? h("p", { class: "hint" }, t("preparing")) : null,
    h("div", { class: "grow" }),
    h("button", { type: "button", class: "btn btn-primary", disabled: a.pages.length === 0 || a.busy, onclick: a.onExplain }, icon("sparkle"), t("explain")),
    h("p", { class: "hint" }, t("trust")),
  );
}
