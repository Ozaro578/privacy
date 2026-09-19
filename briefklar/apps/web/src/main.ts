import { isLanguageCode, type ExplainResult, type LanguageCode, LIMITS } from "@briefklar/shared";
import "./styles.css";
import { clear } from "./render/dom";
import { setUiLanguage, t, type UiKey } from "./i18n";
import { renderStart, renderLanguagePicker } from "./render/start";
import { renderPreview } from "./render/preview";
import { renderLoading } from "./render/loading";
import { renderResult } from "./render/result";
import { renderError } from "./render/error";
import { preparePage, revokePage, PageError, type Page } from "./image";
import { explain, ExplainError } from "./api";
import { DEMO_RESULT } from "./demo";

const LS_LANG = "briefklar.lang";
const LS_CONSENT = "briefklar.consent.v1";

type State =
  | { kind: "start" }
  | { kind: "lang" }
  | { kind: "preview"; pages: Page[]; error: string | null; busy: boolean }
  | { kind: "loading"; pages: Page[]; controller: AbortController }
  | { kind: "result"; result: ExplainResult; demo: boolean }
  | { kind: "error"; message: string; pages: Page[] };

const root = document.getElementById("app") as HTMLElement;
let state: State = { kind: "start" };
let language: LanguageCode = loadLanguage();
let stopLoading: (() => void) | null = null;

function ls(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function loadLanguage(): LanguageCode {
  const saved = ls()?.getItem(LS_LANG);
  if (isLanguageCode(saved)) return saved;
  const nav = (navigator.language || "de").slice(0, 2).toLowerCase();
  return isLanguageCode(nav) ? nav : "de";
}
function hasConsent(): boolean {
  return ls()?.getItem(LS_CONSENT) === "1";
}

function setState(next: State): void {
  stopLoading?.();
  stopLoading = null;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  state = next;
  render();
}

function render(): void {
  clear(root);
  root.setAttribute("aria-busy", state.kind === "loading" ? "true" : "false");
  window.scrollTo({ top: 0 });
  switch (state.kind) {
    case "start":
      root.appendChild(
        renderStart({
          language,
          onPickFiles: (files) => void addFiles([], files),
          onOpenLanguage: () => setState({ kind: "lang" }),
          needsConsent: () => !hasConsent(),
          onConsent: () => ls()?.setItem(LS_CONSENT, "1"),
        }),
      );
      break;
    case "lang":
      root.appendChild(
        renderLanguagePicker(
          language,
          (code) => {
            language = code;
            ls()?.setItem(LS_LANG, code);
            setUiLanguage(code);
            setState({ kind: "start" });
          },
          () => setState({ kind: "start" }),
        ),
      );
      break;
    case "preview": {
      const s = state;
      root.appendChild(
        renderPreview({
          pages: s.pages,
          error: s.error,
          busy: s.busy,
          onAdd: (files) => void addFiles(s.pages, files),
          onRemove: (id) => {
            const page = s.pages.find((p) => p.id === id);
            if (page) revokePage(page);
            const pages = s.pages.filter((p) => p.id !== id);
            setState(pages.length ? { kind: "preview", pages, error: null, busy: false } : { kind: "start" });
          },
          onExplain: () => void runExplain(s.pages),
          onBack: () => {
            s.pages.forEach(revokePage);
            setState({ kind: "start" });
          },
        }),
      );
      break;
    }
    case "loading": {
      const s = state;
      const handle = renderLoading(() => {
        s.controller.abort();
        setState({ kind: "preview", pages: s.pages, error: null, busy: false });
      });
      stopLoading = handle.stop;
      root.appendChild(handle.el);
      break;
    }
    case "result":
      root.appendChild(renderResult({ result: state.result, demo: state.demo, onNew: () => setState({ kind: "start" }) }));
      break;
    case "error": {
      const s = state;
      root.appendChild(
        renderError(
          s.message,
          s.pages.length ? () => setState({ kind: "preview", pages: s.pages, error: null, busy: false }) : null,
          () => {
            s.pages.forEach(revokePage);
            setState({ kind: "start" });
          },
        ),
      );
      break;
    }
  }
}

async function addFiles(existing: Page[], files: File[]): Promise<void> {
  if (state.kind === "preview" && state.busy) return; // läuft schon
  setState({ kind: "preview", pages: existing, error: null, busy: true });
  const added: Page[] = [];
  let error: string | null = null;
  for (const f of files) {
    if (existing.length + added.length >= LIMITS.MAX_IMAGES) {
      error = t("too_many_files", { n: LIMITS.MAX_IMAGES });
      break;
    }
    try {
      added.push(await preparePage(f));
    } catch (e) {
      error = e instanceof PageError ? e.message : t("image_failed", { name: f.name });
    }
  }
  if (state.kind !== "preview") {
    added.forEach(revokePage); // Nutzer hat inzwischen abgebrochen
    return;
  }
  const pages = [...state.pages, ...added];
  if (pages.length) setState({ kind: "preview", pages, error, busy: false });
  else if (error) setState({ kind: "error", message: error, pages: [] });
  else setState({ kind: "start" });
}

async function runExplain(pages: Page[]): Promise<void> {
  if (!pages.length) {
    setState({ kind: "preview", pages, error: t("no_pages"), busy: false });
    return;
  }
  const controller = new AbortController();
  setState({ kind: "loading", pages, controller });
  try {
    const result = await explain(
      pages.map((p) => p.file),
      language,
      controller.signal,
    );
    pages.forEach(revokePage);
    setState({ kind: "result", result, demo: false });
  } catch (e) {
    if (controller.signal.aborted) return;
    const message = e instanceof ExplainError ? errorMessage(e) : t("network_error");
    setState({ kind: "error", message, pages });
  }
}

/** Fehlertext in der UI-Sprache; Servertext (deutsch) nur als Rückfall. */
const ERROR_KEYS: Partial<Record<ExplainError["code"], UiKey>> = {
  network: "network_error",
  cancelled: "cancelled",
  invalid_response: "invalid_response",
  rate_limited: "err_rate_limited",
  refused: "err_refused",
  image_too_large: "err_image_too_large",
  unsupported_media_type: "err_unsupported",
  too_many_images: "err_too_many",
  no_image: "no_pages",
  upstream_error: "err_upstream",
  internal_error: "err_upstream",
  invalid_language: "err_upstream",
};
function errorMessage(e: ExplainError): string {
  const key = ERROR_KEYS[e.code];
  return key ? t(key, { n: LIMITS.MAX_IMAGES }) : e.message;
}

/* ---------- Start ---------- */
setUiLanguage(language);
const params = new URLSearchParams(location.search);
if (params.get("demo") === "1") {
  const demoLang = params.get("lang");
  const result: ExplainResult = isLanguageCode(demoLang) ? { ...DEMO_RESULT, language: demoLang } : DEMO_RESULT;
  setState({ kind: "result", result, demo: true });
} else {
  render();
}
