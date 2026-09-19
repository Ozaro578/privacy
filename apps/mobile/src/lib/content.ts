import { supabase } from "./supabase";
import { loadQuestions, loadTopics, saveQuestions, kvSet, kvGet } from "./content-store";
import type { LocalQuestion, LocalQuestionState, LocalTopic } from "@/offline/types";
import { stateStore } from "./sync";

export interface StudentProfile { studentId: string; tenantId: string; firstName: string; licenseId: string; licenseCode: string; baseClass: string | null; transmission: string; locale: string; theoryExamStatus: string; practicalExamStatus: string }

export async function loadProfile(userId: string, tenantId: string): Promise<StudentProfile | null> {
  const { data: s } = await supabase.from("students").select("id, first_name, preferred_locale").eq("user_id", userId).eq("tenant_id", tenantId).maybeSingle();
  if (!s) return null;
  const { data: lic } = await supabase.from("student_licenses").select("id, license_code, transmission, theory_exam_status, practical_exam_status, licenses(base_class)").eq("student_id", s.id).eq("status", "active").order("started_at", { ascending: false }).limit(1).maybeSingle();
  if (!lic) return null;
  return { studentId: s.id, tenantId, firstName: s.first_name, licenseId: lic.id, licenseCode: lic.license_code, baseClass: (lic.licenses as unknown as { base_class: string | null } | null)?.base_class ?? null, transmission: lic.transmission, locale: s.preferred_locale, theoryExamStatus: lic.theory_exam_status, practicalExamStatus: lic.practical_exam_status };
}

/** Lädt Fragenpool, Themen und Zustände vom Server in SQLite (Offline-Bundle). */
export async function refreshContent(profile: StudentProfile): Promise<{ questions: number; topics: number }> {
  const [{ data: qs }, { data: ts }, { data: states }] = await Promise.all([
    supabase.from("theory_questions").select("id, topic_id, material_kind, points, difficulty, question_kind, source, license_codes, tags, updated_at, question_versions!theory_questions_current_version_fk(id, locale, text, media_path, media_alt, media_credit, explanation, mnemonic, legal_reference, legal_basis_date, numeric_answer, numeric_tolerance, question_answers(position, text, is_correct, explanation))").eq("status", "published"),
    supabase.from("topics").select("id, code, name_i18n, material_kind, practical_skill_code, sort_order").eq("active", true),
    supabase.from("student_question_state").select("*").eq("student_id", profile.studentId),
  ]);
  const codes = [profile.licenseCode, profile.baseClass].filter(Boolean) as string[];
  const questions: LocalQuestion[] = [];
  for (const q of qs ?? []) {
    const v = q.question_versions as unknown as { id: string; locale: string; text: string; media_path: string | null; media_alt: string | null; media_credit: string | null; explanation: string | null; mnemonic: string | null; legal_reference: string | null; legal_basis_date: string | null; numeric_answer: number | null; numeric_tolerance: number | null; question_answers: Array<{ position: number; text: string; is_correct: boolean; explanation: string | null }> } | null;
    if (!v || v.locale !== "de") continue;
    const lc = (q.license_codes ?? []) as string[];
    if (lc.length && !lc.some((c) => codes.includes(c))) continue;
    questions.push({ id: q.id, topic_id: q.topic_id, material_kind: q.material_kind as "basic" | "class_specific", points: q.points, difficulty: Number(q.difficulty), question_kind: q.question_kind, source: q.source, license_codes: lc, tags: (q.tags ?? []) as string[], version_id: v.id, locale: v.locale, text: v.text, media_path: v.media_path, media_alt: v.media_alt, media_credit: v.media_credit, explanation: v.explanation, mnemonic: v.mnemonic, legal_reference: v.legal_reference, legal_basis_date: v.legal_basis_date, numeric_answer: v.numeric_answer === null ? null : Number(v.numeric_answer), numeric_tolerance: v.numeric_tolerance === null ? null : Number(v.numeric_tolerance), answers: [...v.question_answers].sort((a, b) => a.position - b.position), updated_at: q.updated_at });
  }
  const topics: LocalTopic[] = (ts ?? []).map((t) => ({ id: t.id, code: t.code, name: ((t.name_i18n as Record<string, string>)[profile.locale] ?? (t.name_i18n as Record<string, string>)["de"] ?? t.code), material_kind: t.material_kind, practical_skill_code: t.practical_skill_code, sort_order: t.sort_order }));
  await saveQuestions(questions, topics);
  const local = await stateStore.loadAll();
  const merged: LocalQuestionState[] = [];
  for (const r of states ?? []) {
    const l = local.get(r.question_id);
    if (l?.dirty) continue; // lokale unbestätigte Antworten bleiben bis zum Sync
    merged.push({ question_id: r.question_id, attempts: r.attempts, correct: r.correct, consecutive_correct: r.consecutive_correct, last_correct: r.last_correct, last_answered_at: r.last_answered_at, last_confidence: r.last_confidence, avg_response_ms: r.avg_response_ms, ease: Number(r.ease), interval_days: Number(r.interval_days), due_at: r.due_at, mastery: Number(r.mastery), bookmarked: r.bookmarked, row_version: r.row_version, dirty: false });
  }
  await stateStore.saveMany(merged);
  await kvSet("content.refreshed_at", new Date().toISOString());
  return { questions: questions.length, topics: topics.length };
}

export { loadQuestions, loadTopics, kvGet };
