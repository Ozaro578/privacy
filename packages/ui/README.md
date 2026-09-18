# @fahrpilot/ui

Design Language "Klar" und React-Komponenten für FahrPilot (apps/web mit Next.js und Tailwind v4; Token-Export für apps/mobile mit React Native).

## Design-Prinzipien

1. Ruhe vor Reiz. Warme Neutraltöne bilden die Fläche, ein tiefes Verkehrsblau ist die einzige Aktionsfarbe. Signalgelb erscheint sparsam: Streak, aktuelle Aufgabe, heutiger Tag im Kalender.
2. Status nie nur über Farbe. Jede Statusfarbe kommt mit Text und Symbol. Die Prüfungsreife-Anzeige zeigt Zahl, Bandtext, Symbol je Stufe und immer den Disclaimer.
3. Kontrast ist Pflicht. Alle Textpaare der semantischen Tokens erreichen mindestens 4,5:1, Grafikpaare 3:1, in Light und Dark. `tokens.test.ts` prüft das für jede Kombination.
4. Touch-Ziele mindestens 44 px (`min-h-touch`, `h-touch`, `w-touch`). Die Button-Größe `sm` ist nur für dichte Desktop-Tabellen gedacht.
5. Logische Richtungen. Komponenten verwenden `ps`, `pe`, `ms`, `me`, `start`, `end`, `border-s`, damit Arabisch (RTL) ohne Sonderfälle funktioniert. Pfeiltasten in Tabs und Sternen respektieren die Schreibrichtung.
6. Bewegung reduziert. Dauern sind Tokens; bei `prefers-reduced-motion` werden sie auf 0 gesetzt, Animationen deaktiviert.
7. Texte kommen von außen. Komponenten haben deutsche Standardtexte, die App übergibt Beschriftungen aus `@fahrpilot/i18n`.
8. Leere Zustände haben eine Aktion (`EmptyState` verlangt `action`), Ladezustände sind Skeletons in Form des Inhalts, Fehler nennen Ursache und nächsten Schritt.

## Tokens

- `src/tokens.ts`: Palette (`palette`), semantische Farben je Theme (`themes.light`, `themes.dark`), Prüfungsreife-Bandfarben (`readiness.red|orange|yellow_green|green` mit `text`, `fill`, `surface`), Typografie, 4er-Raster (`spacing`), `radius`, `shadow`, `motion`, `TOUCH_TARGET_MIN`, `contrastRatio()`.
- `readinessBandFor(score)` nutzt dieselben Schwellen wie die learning-engine (< 40 rot, < 70 orange, < 85 gelbgrün, sonst grün).
- `src/css.ts`: `generateCssVariables()` (reines CSS mit `:root`, `[data-theme="dark"]` und Systemvorgabe), `generateThemeCss()` (theme.css für Tailwind).
- `src/native.ts`: `nativeLight`, `nativeDark`, `nativeTheme(name)` mit Zahlen für React Native.

## Einbindung in apps/web

1. `@fahrpilot/ui` als Dependency (`"@fahrpilot/ui": "workspace:*"`).
2. In `globals.css`:

```css
@import "tailwindcss";
@import "@fahrpilot/ui/theme.css";
```

theme.css enthält `@source "./components"`, damit Tailwind die Klassen der Komponenten findet, den `@theme inline`-Block (Utilities wie `bg-primary`, `text-fg-muted`, `bg-readiness-green-surface`, `min-h-touch`, `ease-standard`) und Basisstile (Fokusring, Schriftfamilie, reduzierte Bewegung).

3. Dark Mode: Systemeinstellung wird automatisch übernommen. `data-theme="dark"` oder `data-theme="light"` auf `<html>` erzwingt ein Theme.
4. Nach Änderungen an `tokens.ts`: `pnpm build:css` ausführen; der Test `css.test.ts` prüft, dass theme.css synchron ist.

Verfügbare Tailwind-Farben: `canvas`, `surface`, `raised`, `muted`, `inverse`, `overlay`, `fg`, `fg-secondary`, `fg-muted`, `fg-inverse`, `link`, `on-primary`, `on-accent`, `line-subtle`, `line`, `line-strong`, `focus`, `primary`, `primary-hover`, `primary-active`, `secondary`, `secondary-hover`, `danger`, `danger-hover`, `disabled`, `on-disabled`, `accent`, `accent-strong`, `accent-surface`, `{success|warning|danger|info}-{text|fill|surface}`, `readiness-{red|orange|yellow-green|green}-{text|fill|surface}`.

## Komponenten

Alle Komponenten sind Server-Component-tauglich, außer `Tabs`, `Dialog` und `StarRating` (`"use client"`).

```tsx
import { Button, Card, ReadinessGauge, Input, Dialog, Tabs, StarRating, ToastRegion } from "@fahrpilot/ui";

<Button variant="primary" loading={saving} loadingLabel={t("common.loading")}>{t("common.save")}</Button>
<Button href="/lernen" variant="secondary">{t("nav.learn")}</Button>

<Card title={t("dashboard.readiness")}>
  <ReadinessGauge
    score={72}
    labels={{ red: t("dashboard.readinessBandRed"), orange: t("dashboard.readinessBandOrange"), yellow_green: t("dashboard.readinessBandYellowGreen"), green: t("dashboard.readinessBandGreen") }}
    disclaimer={t("dashboard.readinessDisclaimer")}
  />
</Card>

<Input label={t("auth.email")} type="email" required error={errors.email} />

<Dialog open={open} onClose={() => setOpen(false)} title={t("booking.cancelConfirm")} footer={<Button variant="danger">{t("booking.cancel")}</Button>}>
  {t("booking.cancelFee", { deadline, fee })}
</Dialog>

<StarRating value={rating} onChange={setRating} label={t("instructor.rateSkill", { skill })} getStarLabel={(n, max) => t("a11y.starRating", { value: n, max })} />

<ToastRegion label={t("notifications.title")} toasts={toasts} onDismiss={dismiss} />
```

| Komponente | Zweck | Barrierefreiheit |
|---|---|---|
| `Button` | primary, secondary, ghost, danger; sm, md, lg; `loading`; `href` rendert `a` | aria-busy, Screenreader-Text beim Laden, Fokusring |
| `Card` | Fläche mit Titel, Aktion, Fußzeile | semantisches `section`, h2 |
| `ProgressBar`, `ProgressRing` | Fortschritt linear oder rund (SVG) | role progressbar mit valuenow/valuetext |
| `ReadinessGauge` | Prüfungsreife 0 bis 100 mit Band, Symbol, Pflicht-Disclaimer | role group mit sprechendem Label |
| `StatTile`, `Badge`, `Alert`, `EmptyState`, `Skeleton`, `SkeletonGroup` | Kennzahl, Chip, Hinweis, leerer Zustand, Ladeplatzhalter | Alert wählt role alert/status; SkeletonGroup meldet Laden |
| `Tabs` | Reiter mit Roving Tabindex | Pfeiltasten, Home, End, RTL |
| `Dialog` | natives `dialog`, modal | Escape, Fokusfalle, Fokusrückgabe, Backdrop-Klick |
| `Input`, `Select`, `Textarea`, `Checkbox`, `RadioGroup` | Formularfelder, Label oben, Fehler unten | aria-describedby, aria-invalid, Live-Region für Fehler |
| `StarRating` | Sterne 1 bis n | Radiogruppe, Pfeiltasten, 44-px-Ziele, Lesemodus als img |
| `CalendarGrid`, `CalendarMonthGrid`, `CalendarTimeGrid` | Layout für Tag, Woche, Monat; Helfer `getWeekDays`, `getMonthGridDays`, `timeToOffset` | role grid, aria-current für heute |
| `BottomTabBar`, `SidebarNav` | Mobile Tab-Leiste, Web-Seitennavigation; `linkComponent` für next/link | nav mit Label, aria-current page, Badges mit Screenreader-Text |
| `ToastRegion` | Live-Region für Rückmeldungen | aria-live polite, danger/warning als alert |
| `VisuallyHidden` | Screenreader-Text, optional beim Fokus sichtbar | sr-only |

## Tests

`pnpm test` führt Kontrastprüfungen für alle Token-Paare, CSS-Erzeugung und Komponententests (jsdom, Testing Library) aus. `pnpm typecheck` prüft mit `strict`, `exactOptionalPropertyTypes` und `noUncheckedIndexedAccess`.
