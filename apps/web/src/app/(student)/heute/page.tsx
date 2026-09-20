import { getStudentContext } from "@/lib/data/student";
import { loadDashboard } from "@/lib/data/dashboard";
import { TodayView } from "@/components/student/today-view";

export const metadata = { title: "Heute" };

export default async function TodayPage() {
  const ctx = await getStudentContext();
  const d = await loadDashboard(ctx);
  return <TodayView firstName={ctx.student.first_name} licenseName={ctx.licenseInfo.name} transmission={ctx.license.transmission} rulesNeedVerification={ctx.rules.examTheory?.needsVerification ?? false} d={d} selfStudy={ctx.selfStudy} />;
}
