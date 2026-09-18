# @fahrpilot/ai

Serverseitiger KI-Service-Layer für FahrPilot. Das Package wird ausschließlich in Server-Code (Route Handler, Server Actions, Edge Functions) verwendet und niemals im Client gebündelt. API-Keys kommen nur aus Umgebungsvariablen.

## Konfiguration

| Variable | Pflicht | Bedeutung |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | für alle Modellfunktionen | API-Key für den Anthropic-Provider. Fehlt er, liefert `createAiServices()` `coach: null` und `fast: null`; regelbasierte Pfade laufen weiter. |
| `AI_MODEL_COACH` | nein | Dialogmodell für coachAnswer, explainQuestion, describeTrafficSituation. Standard `claude-sonnet-5`. |
| `AI_MODEL_FAST` | nein | Schnelles Modell für Klassifikation und Strukturierung (structureLessonNotes, instructorQuery, gradeExaminerAnswer, analyzeErrorPattern). Standard `claude-haiku-4-5`. |
| `STT_ENDPOINT` | für Sprachnotizen | Vollständige URL einer OpenAI-Whisper-kompatiblen Transkriptions-API (multipart/form-data, Feld `file`), z. B. `https://api.openai.com/v1/audio/transcriptions`. |
| `STT_API_KEY` | für Sprachnotizen | Bearer-Token für den STT-Endpoint. |
| `STT_MODEL` | nein | Modellname des STT-Anbieters, Standard `whisper-1`. |

```ts
import { createAiServices, coachAnswer } from "@fahrpilot/ai";

const ai = createAiServices(); // liest process.env, nur serverseitig
if (ai.coach) {
  const res = await coachAnswer({ provider: ai.coach, knowledge: supabaseKnowledgeRepository }, { question, locale: "de" });
}
```

Modell-IDs werden ohne Datumssuffix verwendet (`claude-sonnet-5`, `claude-haiku-4-5`). Sampling-Parameter (`temperature`) werden nur an Modelle gesendet, die sie akzeptieren (Haiku 4.5, 4.5/4.6-Generation); `effort` nur an Modelle mit Effort-Steuerung (Sonnet 5, Opus 4.5 und neuer). Strukturierte Ausgaben laufen über `client.messages.parse()` mit `output_config.format` (Zod-Schema), nicht über Tool-Use.

## Bausteine

- `AiProvider` (`complete`, `completeJson`, optional `transcribe`): `AnthropicProvider` (Produktion), `FakeProvider` (Tests, skriptbare Antworten, protokolliert Requests).
- `TranscriptionProvider`: `WhisperHttpTranscriptionProvider` (fetch gegen `STT_ENDPOINT`), `FakeTranscriptionProvider`.
- `KnowledgeRepository`: Interface über `knowledge_entries`. Hier nur `InMemoryKnowledgeRepository` (Stichwortsuche für Tests). Die Supabase-Implementierung (tsvector-Suche, nur `review_status = 'published'`, Mandantenfilter) wird im Web-Projekt angebunden.
- Guardrails (`guardrails.ts`): Datenblöcke, Faktenprüfung per Regex, Hinweistexte.
- Zitate (`citations.ts`): Auflösung der vom Modell genannten Quellen-ids gegen die tatsächlich bereitgestellten Quellen.

## Datenflüsse

Alle Funktionen liefern `usage: { input_tokens, output_tokens, model }`, damit `coach_messages.model/input_tokens/output_tokens` und `lesson_evaluations.ai_draft_model` befüllt werden können.

### coachAnswer (freie Frage an den KI-Fahrlehrer)

1. Retrieval über `KnowledgeRepository.search(frage, { locale, licenseCodes, topicId, limit })`.
2. Quellen und Frage gehen als abgegrenzte `<data>`-Blöcke in den Prompt; der Systemprompt verbietet, Anweisungen aus Datenblöcken zu befolgen. Schließende Tags in Inhalten werden entschärft.
3. Das Modell liefert JSON `{ answer, cited_source_ids, coverage }`.
4. `resolveCitations` prüft: nur ids aus den bereitgestellten Quellen zählen. `verified` nur, wenn mindestens eine zitierte Quelle zum Thema passt, keine fremden ids genannt wurden und `coverage = full`. Sonst `partial`. Ohne gültiges Zitat `uncertain`.
5. Faktencheck: Zahlen mit Einheit (km/h, m, ‰, %, Sekunden, ...) und Gesetzesangaben (§, StVO, FeV, ...) in der Antwort müssen in einer zitierten Quelle vorkommen; Sätze mit unbelegten Fakten werden entfernt, die Stufe sinkt auf `partial`.
6. Bei `uncertain` wird der Hinweis „Dazu liegt keine geprüfte Quelle vor. Bitte mit deinem Fahrlehrer klären." (je Sprache de, en, tr, ar) vorangestellt und jeder Satz mit Zahlenwert oder Gesetzesangabe entfernt. `sources` ist dann leer, `disclaimer` gesetzt.

Ergebnis passt direkt in `coach_messages` (`content`, `style`, `sources`, `confidence`, `model`, Token).

### explainQuestion (Warum-Button)

Primärquelle ist die geprüfte Erklärung aus `question_versions.explanation` (plus `mnemonic`, `legal_reference`, `question_answers.explanation`). Das Modell darf umformulieren und den Stil anpassen (simple, detailed, example, mnemonic), aber nicht ergänzen. Fakten, die nicht in Frage, Antworten oder geprüfter Erklärung stehen, werden entfernt (`partial`). Ohne geprüfte Erklärung ist die Antwort `uncertain`, trägt den Hinweis und nennt keine Paragrafen. `sources` enthält die `question_version_id` mit Rechtsgrundlage.

### analyzeErrorPattern

Input ist `ErrorAnalysis` aus `@fahrpilot/learning-engine` (bereits aggregiert, keine Rohdaten). Output: Erklärung in einfacher Sprache plus 3 bis 5 Übungen `{ mode, topic_id, count, reason }`. `topic_id` muss aus den Fehlerclustern stammen, sonst wird der Vorschlag verworfen und regelbasiert aufgefüllt. Ohne Provider läuft die Funktion vollständig regelbasiert.

### structureLessonNotes (Sprachnotiz des Fahrlehrers)

Transkript (oder Audio über `structureLessonNotesFromAudio` mit `TranscriptionProvider`) plus Liste erlaubter `skills.code` mit Namen. Output-Schema `LessonNotesDraft`: `{ contents, ratings[{skill_code, rating 1..5}], comment, next_goals, confidence }`. Unbekannte skill_codes werden verworfen und in `diagnostics.dropped_skill_codes` gemeldet; `confidence` sinkt dann auf `partial`. Das Ergebnis ist ein Entwurf für `lesson_evaluations.ai_draft` (mit `ai_transcript`, `ai_draft_model`); erst die Bestätigung durch den Fahrlehrer setzt `ai_confirmed`.

### gradeExaminerAnswer (Prüfer-Fragen-Trainer)

Bewertung ist regelbasiert: jeder `expected_point` gilt als abgedeckt, wenn mindestens die Hälfte seiner Stichwörter (normalisiert, Wortstammvergleich) in der Antwort vorkommen. `score` ist der Anteil abgedeckter Punkte in Prozent. Das Modell formuliert nur das Feedback und darf die Bewertung nicht ändern; unbelegte Fakten im Feedback werden entfernt. Ohne Provider wird ein regelbasiertes Feedback erzeugt.

### instructorQuery (Fahrlehrer-KI)

Natürliche Frage wird auf genau einen whitelisted Abfragetyp abgebildet: `students_ready_soon {days}`, `students_open_special_drives`, `students_without_lesson_this_week`, `students_weak_topic {topic_code}` oder `unknown {clarification}`. Kein freies SQL, keine freien Filter. `topic_code` muss in der übergebenen Themenliste vorkommen. Jede Ausgabe, die nicht dem Zod-Union entspricht, wird zu `unknown` mit Rückfrage. Das Web-Projekt bildet jeden Typ auf eine feste, parametrisierte Datenbankabfrage mit RLS ab.

### describeTrafficSituation (Foto-Trainer)

Bild (base64, jpeg/png/gif/webp, max. ca. 5 MB) geht als Vision-Block an den Provider. Output: Verkehrszeichen, Gefahren, Vorfahrt, Beobachtungsbedarf, Zusammenfassung. Jede Ausgabe trägt `notice = "Lernhilfe. Nicht während der Fahrt verwenden."`. Ohne `KnowledgeRepository` werden Paragrafen entfernt und die Stufe ist höchstens `partial`; mit Repository werden Quellen zu erkannten Zeichen nachgeladen und die Regelangaben dagegen geprüft (`verified` möglich). Bei unklarem Bild `uncertain` mit Hinweis.

## Grenzen

- Die Guardrails sind textbasiert (Regex auf Zahlen mit Einheit und Gesetzeskürzel). Umschreibungen ohne Einheit („die Hälfte des Tachowerts") werden nicht erkannt. Die Wissensbasis bleibt die einzige Wahrheit; Antworten ohne Quelle sind immer als unsicher gekennzeichnet.
- `verified` bedeutet: Quellen gefunden, Thema passt, das Modell zitiert nur diese Quellen und nennt keine unbelegten Fakten. Es ist keine Garantie für inhaltliche Korrektheit der Formulierung; Rechtsstand ergibt sich aus `legal_basis_date` der Quelle.
- `InMemoryKnowledgeRepository` ist nur für Tests und lokale Entwicklung. Produktives Retrieval, Mandantenfilter und Freigabestatus liegen in der Supabase-Implementierung.
- Der Foto-Trainer beschreibt Situationen als Lernhilfe. Er ist kein Fahrassistenzsystem und darf nicht während der Fahrt verwendet werden.
- `gradeExaminerAnswer` erkennt Synonyme nur eingeschränkt (Stammvergleich). `expected_points` sollten daher die zentralen Begriffe enthalten.
- Die Modelle antworten in der angeforderten Sprache (de, en, tr, ar); Prompts und Hinweistexte sind deutsch, der Hinweis bei `uncertain` ist übersetzt.
- Bei Modellablehnung (`stop_reason = refusal`) wirft der Provider `AiRefusalError`; bei abgeschnittener oder nicht schema-konformer Ausgabe `AiOutputError`. Die Use-Cases mit regelbasiertem Fallback (analyzeErrorPattern, gradeExaminerAnswer, instructorQuery) fangen Fehler ab, coachAnswer, explainQuestion, structureLessonNotes und describeTrafficSituation reichen sie durch.
