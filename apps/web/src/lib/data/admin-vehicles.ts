import "server-only";
import type { Tables } from "@fahrpilot/db";
import { berlinDate, getOfficeContext } from "./admin";

export interface VehicleReminder { vehicleId: string; licensePlate: string; kind: "inspection" | "service" | "tires" | "insurance" | "service_km"; label: string; dueDate: string | null; days: number | null; tone: "danger" | "warn" | "neutral" }

const daysUntil = (iso: string, today: string) => Math.round((new Date(`${iso}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86_400_000);

/** Erinnerungen aus den Datumsfeldern (HU, Wartung, Reifen, Versicherung) innerhalb von 60 Tagen oder überfällig. */
export function vehicleReminders(v: Pick<Tables<"vehicles">, "id" | "license_plate" | "next_inspection_due" | "next_service_due" | "tire_change_due" | "insurance_renewal_due" | "next_service_km" | "mileage_km">, today = berlinDate(), horizonDays = 60): VehicleReminder[] {
  const out: VehicleReminder[] = [];
  const push = (kind: VehicleReminder["kind"], name: string, date: string | null) => {
    if (!date) return;
    const days = daysUntil(date, today);
    if (days > horizonDays) return;
    const label = days < 0 ? `${name} seit ${-days} Tagen überfällig` : days === 0 ? `${name} heute fällig` : `${name} in ${days} Tagen`;
    out.push({ vehicleId: v.id, licensePlate: v.license_plate, kind, label, dueDate: date, days, tone: days < 0 ? "danger" : days <= 14 ? "warn" : "neutral" });
  };
  push("inspection", "HU", v.next_inspection_due);
  push("service", "Wartung", v.next_service_due);
  push("tires", "Reifenwechsel", v.tire_change_due);
  push("insurance", "Versicherung", v.insurance_renewal_due);
  if (v.next_service_km !== null && v.mileage_km !== null) {
    const remaining = v.next_service_km - v.mileage_km;
    if (remaining <= 1000) out.push({ vehicleId: v.id, licensePlate: v.license_plate, kind: "service_km", label: remaining < 0 ? `Wartung nach Kilometern überfällig (${-remaining} km)` : `Wartung fällig in ${remaining} km`, dueDate: null, days: null, tone: remaining < 0 ? "danger" : "warn" });
  }
  return out;
}

export async function listVehicles() {
  const ctx = await getOfficeContext();
  const [{ data: vehicles }, { data: locations }, { data: licenses }] = await Promise.all([
    ctx.db.from("vehicles").select("*, locations(name)").order("status").order("license_plate"),
    ctx.db.from("locations").select("id, name").eq("active", true).order("name"),
    ctx.db.from("licenses").select("code").eq("active", true).order("sort_order"),
  ]);
  const rows = (vehicles ?? []) as unknown as Array<Tables<"vehicles"> & { locations: { name: string } | null }>;
  const today = berlinDate();
  const reminders = rows.filter((v) => v.status !== "inactive").flatMap((v) => vehicleReminders(v, today)).sort((a, b) => (a.days ?? -1) - (b.days ?? -1));
  return { ctx, vehicles: rows, reminders, locations: locations ?? [], licenses: (licenses ?? []).map((l) => l.code) };
}

export async function getVehicle(id: string) {
  const ctx = await getOfficeContext();
  const { data: vehicle } = await ctx.db.from("vehicles").select("*").eq("id", id).maybeSingle();
  if (!vehicle) return null;
  const [{ data: blocks }, { data: locations }, { data: licenses }, { data: upcoming }] = await Promise.all([
    ctx.db.from("vehicle_blocks").select("*").eq("vehicle_id", id).order("period", { ascending: false }),
    ctx.db.from("locations").select("id, name").eq("active", true).order("name"),
    ctx.db.from("licenses").select("code").eq("active", true).order("sort_order"),
    ctx.db.from("lessons").select("id, period, status, instructors(display_name), students(first_name, last_name)").eq("vehicle_id", id).gte("period", new Date().toISOString()).neq("status", "cancelled").order("period").limit(20),
  ]);
  return { ctx, vehicle, blocks: blocks ?? [], locations: locations ?? [], licenses: (licenses ?? []).map((l) => l.code), reminders: vehicleReminders(vehicle), upcoming: (upcoming ?? []) as unknown as Array<{ id: string; period: string; status: string; instructors: { display_name: string } | null; students: { first_name: string; last_name: string } | null }> };
}
