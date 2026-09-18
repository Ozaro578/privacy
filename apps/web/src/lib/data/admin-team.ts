import "server-only";
import type { Tables } from "@fahrpilot/db";
import { getOfficeContext } from "./admin";

export interface TeamMember { id: string; user_id: string; role: string; status: string; created_at: string; users: { first_name: string; last_name: string; email: string; phone: string | null } | null }

export async function listTeam() {
  const ctx = await getOfficeContext();
  const [{ data: members }, { data: instructors }, { data: locations }] = await Promise.all([
    ctx.db.from("tenant_memberships").select("id, user_id, role, status, created_at, users(first_name, last_name, email, phone)").neq("role", "student").order("created_at"),
    ctx.db.from("instructors").select("id, user_id, display_name, license_classes, teaches_theory, teaches_manual, teaches_automatic, active, color, location_id, locations(name)"),
    ctx.db.from("locations").select("id, name").eq("active", true).order("name"),
  ]);
  const rows = (members ?? []) as unknown as TeamMember[];
  const byUser = new Map((instructors ?? []).map((i) => [i.user_id, i as typeof i & { locations: { name: string } | null }]));
  return { ctx, members: rows, instructorsByUser: byUser, locations: locations ?? [] };
}

export async function getTeamMember(membershipId: string) {
  const ctx = await getOfficeContext();
  const { data: m } = await ctx.db.from("tenant_memberships").select("id, user_id, role, status, created_at, users(first_name, last_name, email, phone)").eq("id", membershipId).maybeSingle();
  if (!m) return null;
  const member = m as unknown as TeamMember;
  const [{ data: instructor }, { data: locations }, { data: licenses }] = await Promise.all([
    ctx.db.from("instructors").select("*").eq("user_id", member.user_id).maybeSingle(),
    ctx.db.from("locations").select("id, name").eq("active", true).order("name"),
    ctx.db.from("licenses").select("code, name").eq("active", true).order("sort_order"),
  ]);
  let availability: Tables<"instructor_availability">[] = [];
  let absences: Tables<"instructor_absences">[] = [];
  if (instructor) {
    const [{ data: av }, { data: ab }] = await Promise.all([
      ctx.db.from("instructor_availability").select("*").eq("instructor_id", instructor.id).order("weekday").order("start_time"),
      ctx.db.from("instructor_absences").select("*").eq("instructor_id", instructor.id).order("period", { ascending: false }),
    ]);
    availability = av ?? [];
    absences = ab ?? [];
  }
  return { ctx, member, instructor, locations: locations ?? [], licenses: licenses ?? [], availability, absences };
}
