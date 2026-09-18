import { headers } from "next/headers";
import { getInstructorContext } from "@/lib/data/instructor";
import { InstructorShell } from "@/components/nav/instructor-shell";

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getInstructorContext();
  const h = await headers();
  const current = h.get("x-pathname") ?? "/lehrer";
  const roleLabel = { office: "Büro", admin: "Administration", owner: "Inhaber" }[ctx.role] ?? "Fahrlehrer";
  return (
    <InstructorShell schoolName={ctx.school.name} instructorName={ctx.instructor?.display_name ?? roleLabel} current={current}>
      {children}
    </InstructorShell>
  );
}
