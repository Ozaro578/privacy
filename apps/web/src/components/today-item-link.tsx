import Link from "next/link";
import type { TodayItem } from "@fahrpilot/learning-engine";

export function todayHref(item: TodayItem): string {
  const a = item.action;
  if (!a) return "/heute";
  if (a.type === "open") return a.route ?? "/heute";
  if (a.mode === "exam") return "/lernen/pruefung";
  const params = new URLSearchParams({ mode: a.mode ?? "review" });
  if (a.topic_id) params.set("topic", a.topic_id);
  if (a.minutes) params.set("limit", String(Math.max(5, a.minutes * 2)));
  return `/lernen/session?${params.toString()}`;
}

export function TodayItemLink({ item, index }: { item: TodayItem; index: number }) {
  const icon = { review: "↻", weakness: "◆", coupling: "⇄", lesson: "⌖", theory_class: "▤", document: "▣", exam: "★", invoice: "€", goal: "◎", streak: "▲", message: "✉" }[item.kind];
  return (
    <Link href={todayHref(item)} className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3 hover:border-brand-300">
      <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium"><span className="text-ink-500">{index}. </span>{item.title}</span>
        {item.subtitle && <span className="block truncate text-sm text-ink-700">{item.subtitle}</span>}
      </span>
      <span aria-hidden className="text-ink-300">›</span>
    </Link>
  );
}
