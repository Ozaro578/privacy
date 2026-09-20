import Link from "next/link";
import { signs } from "@fahrpilot/content/signs";
import { SignCatalog } from "@/components/learn/sign-catalog";
import { btn } from "@/components/ui";

export const metadata = { title: "Verkehrszeichen" };

export default function SignsPage() {
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Verkehrszeichen</h1>
          <p className="text-sm text-ink-700">Alle Zeichen der StVO-Anlagen 1 bis 4 und die gebräuchlichen Zusatzzeichen mit Bedeutung. Tippe ein Zeichen an, um die Bedeutung zu sehen.</p>
        </div>
        <Link href="/lernen/session?mode=signs&limit=15" className={btn.primary}>Zeichen-Trainer starten</Link>
      </header>
      <p className="text-xs text-ink-500">Die Zeichnungen sind eigene Vektorgrafiken nach den StVO-Anlagen (amtliche Werke). Rechtsstand 1.9.2026.</p>
      <SignCatalog signs={signs} />
    </div>
  );
}
