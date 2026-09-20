import { headers } from "next/headers";
import { getOfficeContext, ROLE_LABEL } from "@/lib/data/admin";
import { getSession } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getOfficeContext();
  const session = await getSession();
  const h = await headers();
  const current = h.get("x-pathname") ?? "/verwaltung";
  return (
    <AdminShell schoolName={ctx.school.name} roleLabel={ROLE_LABEL[ctx.role] ?? ctx.role} isAdmin={ctx.isAdmin} current={current} supportSession={session?.supportSession ?? false}>
      {children}
    </AdminShell>
  );
}
