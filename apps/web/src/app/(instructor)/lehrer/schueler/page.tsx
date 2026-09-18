import { getInstructorContext, loadStudentList } from "@/lib/data/instructor";
import { StudentList } from "@/components/instructor/student-list";

export const metadata = { title: "Schüler" };

export default async function InstructorStudentsPage() {
  const ctx = await getInstructorContext();
  const students = await loadStudentList(ctx);
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Schüler</h1>
        <p className="text-sm text-ink-700">{ctx.instructor && !ctx.isOffice ? `${students.length} Schüler in deiner Betreuung (zugewiesen oder mit Fahrstunden bei dir)` : `${students.length} aktive Ausbildungen`}</p>
      </header>
      <StudentList students={students} showInstructor={ctx.isOffice} />
    </div>
  );
}
