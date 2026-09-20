import { mediaById, priorityScenarios } from "@fahrpilot/content";
import { PriorityTrainer } from "@/components/learn/priority-trainer";

export const metadata = { title: "Vorfahrt-Trainer" };

export default function PriorityPage() {
  const items = priorityScenarios.flatMap((sc) => { const m = mediaById(sc.media); return m ? [{ ...sc, file: m.file, alt: m.alt }] : []; });
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Vorfahrt-Trainer</h1>
        <p className="text-sm text-ink-700">Wer fährt zuerst? Tippe die Fahrzeuge in der richtigen Reihenfolge an. Die Situationen sind schematisch, die Regeln sind die der StVO.</p>
      </header>
      <PriorityTrainer scenarios={items} />
    </div>
  );
}
