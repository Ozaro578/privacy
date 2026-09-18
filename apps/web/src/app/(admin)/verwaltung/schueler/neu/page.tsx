import Link from "next/link";
import { getStudentFormOptions } from "@/lib/data/admin-students";
import { createStudent } from "@/lib/actions/admin-students";
import { Card } from "@/components/ui";
import { ActionForm } from "@/components/admin/action-form";
import { LicenseFields, StudentFields } from "@/components/admin/students/student-fields";

export const metadata = { title: "Schüler anlegen" };

export default async function NewStudentPage() {
  const o = await getStudentFormOptions();
  return (
    <div className="space-y-6">
      <header>
        <Link href="/verwaltung/schueler" className="text-sm text-brand-700 underline">Zurück zur Liste</Link>
        <h1 className="text-2xl font-semibold">Schüler anlegen</h1>
        <p className="text-sm text-ink-700">Stammdaten, erste Ausbildung und optional Einladung zur App. Die Dokumenten-Checkliste wird automatisch angelegt.</p>
      </header>
      <ActionForm action={createStudent} submitLabel="Schüler anlegen" pendingLabel="Lege an …" className="grid gap-3 md:grid-cols-2">
        <Card title="Stammdaten" className="grid gap-3 md:col-span-2 md:grid-cols-2">
          <StudentFields locations={o.locations} />
        </Card>
        <Card title="Ausbildung" className="grid gap-3 md:col-span-2 md:grid-cols-2">
          <LicenseFields licenses={o.licenses} instructors={o.instructors} />
        </Card>
        <Card title="Zugang zur App" className="md:col-span-2">
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="send_invite" defaultChecked className="h-5 w-5" /> Einladung per E-Mail senden (nur wenn eine E-Mail-Adresse angegeben ist)</label>
        </Card>
      </ActionForm>
    </div>
  );
}
