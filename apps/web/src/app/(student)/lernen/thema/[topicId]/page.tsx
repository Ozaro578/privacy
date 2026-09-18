import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudentContext } from "@/lib/data/student";
import { Card, btn } from "@/components/ui";

/** Lernkapitel eines Themas (geprüfter Lesestoff) mit Einstieg ins Üben. */
export default async function TopicPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  const ctx = await getStudentContext();
  const locale = ctx.student.preferred_locale;
  const [{ data: topic }, { data: chapters }] = await Promise.all([
    ctx.db.from("topics").select("id, name_i18n, description_i18n").eq("id", topicId).maybeSingle(),
    ctx.db.from("chapters").select("id, title, body_markdown, estimated_minutes, valid_from, source, locale").eq("topic_id", topicId).eq("review_status", "published").order("sort_order"),
  ]);
  if (!topic) notFound();
  const names = topic.name_i18n as Record<string, string>;
  const chapter = (chapters ?? []).find((c) => c.locale === locale) ?? (chapters ?? []).find((c) => c.locale === "de");
  return (
    <div className="space-y-4">
      <Link href="/lernen" className="text-sm text-brand-700 underline">‹ Alle Themen</Link>
      <h1 className="text-2xl font-bold">{names[locale] ?? names["de"]}</h1>
      <div className="flex flex-wrap gap-2">
        <Link href={`/lernen/session?mode=topic&topic=${topic.id}&limit=15`} className={btn.primary}>Fragen üben</Link>
        <Link href={`/coach?topic=${topic.id}`} className={btn.secondary}>Frag den KI-Coach</Link>
      </div>
      {chapter ? (
        <Card title={chapter.title}>
          <p className="mb-3 text-xs text-ink-500">Lesezeit etwa {chapter.estimated_minutes} Minuten · Stand {new Date(chapter.valid_from).toLocaleDateString("de-DE")} · Quelle: {chapter.source ?? "Plattforminhalt"}</p>
          <article className="prose prose-sm max-w-none whitespace-pre-wrap text-ink-900">{chapter.body_markdown}</article>
          {chapter.locale !== locale && <p className="mt-3 text-xs text-ink-500">Dieses Kapitel liegt noch nicht in deiner Sprache vor.</p>}
        </Card>
      ) : <p className="text-sm text-ink-700">Für dieses Thema gibt es noch kein Lernkapitel. Du kannst trotzdem Fragen üben.</p>}
    </div>
  );
}
