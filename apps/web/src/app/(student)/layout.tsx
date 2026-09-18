import { headers } from "next/headers";
import { getStudentContext } from "@/lib/data/student";
import { StudentShell } from "@/components/nav/student-shell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getStudentContext();
  const h = await headers();
  const current = h.get("x-pathname") ?? "/heute";
  return (
    <StudentShell schoolName={ctx.school.name} legalBasisDate={ctx.rules.legalBasisDate} current={current}>
      {children}
    </StudentShell>
  );
}
