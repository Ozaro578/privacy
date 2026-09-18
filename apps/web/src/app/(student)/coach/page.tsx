import { getStudentContext } from "@/lib/data/student";
import { CoachChat } from "@/components/coach/chat";

export const metadata = { title: "KI-Coach" };

export default async function CoachPage({ searchParams }: { searchParams: Promise<{ topic?: string; thema?: string }> }) {
  const p = await searchParams;
  await getStudentContext();
  const initial = p.thema === "praxis" ? "Starte Prüfungstraining: Führe mich Schritt für Schritt durch Sicherheitskontrollen, Fahrzeugtechnik, typische Verkehrssituationen, Grundfahraufgaben, mentale Vorbereitung und typische Fehler." : undefined;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dein KI-Fahrlehrer</h1>
      <CoachChat {...(p.topic ? { topicId: p.topic } : {})} {...(initial ? { initialPrompt: initial } : {})} />
    </div>
  );
}
