# @fahrpilot/i18n

Typsichere Message-Kataloge und Formatierer für FahrPilot. Deutsch ist die Quelle; Englisch, Türkisch und Arabisch müssen exakt dieselbe Schlüsselstruktur haben (der Test `i18n.test.ts` erzwingt das in CI).

## Wichtiger Hinweis: App-Sprache ist nicht Prüfungssprache

Übersetzungen der Lerninhalte sind Lernhilfen. Welche Sprachen in der theoretischen Prüfung zulässig sind, entscheidet die Prüforganisation. Diese Liste wird nicht hier, sondern in der Regel-Engine (`rule_type = exam_languages`) gepflegt und in der Prüfungsplanung getrennt angezeigt. Die Konstante `TRANSLATION_NOTICE` enthält diesen Hinweis für die Oberfläche.

## Verwendung

```ts
import { createT, createI18n, formatDate, isRtl, SUPPORTED_LOCALES } from "@fahrpilot/i18n";

const t = createT("de");
t("dashboard.greeting", { name: "Ayşe" });          // "Hallo Ayşe"
t("learn.questions", { count: 5 });                  // "5 Fragen"
t("common.legalStatus", { date: formatDate("de", new Date()) });

const i18n = createI18n("ar");
i18n.dir;                                            // "rtl"
i18n.formatCurrency(49.9);
```

- Interpolation: `{name}` wird durch `params.name` ersetzt.
- Plural: `{count, plural, one {# Frage} other {# Fragen}}` wählt die Form über `Intl.PluralRules`; `#` ist die Zahl. Arabisch nutzt alle sechs CLDR-Kategorien, exakte Formen sind mit `=0` möglich.
- Fallback: Fehlt ein Schlüssel in einer Locale, wird der deutsche Text verwendet und in Entwicklung mit `console.warn` gemeldet. Über `createT(locale, { catalogs })` lassen sich Kataloge ersetzen (Tenant-Overrides, Tests).
- Formatierung: `formatDate`, `formatTime`, `formatDateTime`, `formatCurrency`, `formatCents`, `formatNumber`, `formatPercent` arbeiten immer in `Europe/Berlin` und `EUR`. Arabisch nutzt lateinische Ziffern (`ar-EG-u-nu-latn`), da der Markt Deutschland ist.
- Richtung: `isRtl(locale)` und `textDirection(locale)` für das `dir`-Attribut.

## Bereiche

`common`, `auth`, `nav`, `dashboard`, `learn`, `exam`, `lessons`, `booking`, `finance`, `documents`, `instructor`, `admin`, `notifications`, `errors`, `a11y`.

## Regeln für neue Schlüssel

1. Zuerst in `src/locales/de.ts` anlegen, dann in `en.ts`, `tr.ts`, `ar.ts` ergänzen. TypeScript und der Test schlagen bei fehlenden Schlüsseln fehl.
2. Keine Gedankenstriche in Texten; kurze, klare Sätze (siehe Accessibility-Prinzipien in `docs/01-informationsarchitektur.md`).
3. Rechtsstand und Regelversionen werden nicht übersetzt, nur eingebettet (`common.legalStatus`, `common.ruleVersion`).
4. Disclaimer sind Pflichttexte: Prüfungsreife (`dashboard.readinessDisclaimer`), Kostenprognose (`finance.forecastDisclaimer`), Foto-Trainer (`learn.photoTrainerDisclaimer`), KI-Coach (`learn.coachDisclaimer`).
