"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { berlinToIso, getOfficeContext } from "@/lib/data/admin";
import type { ActionResult } from "./lessons";

const opt = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const issues = (e: z.ZodError) => e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum ungültig").nullable();
const intOrNull = z.coerce.number().int().min(0).nullable();

const VehicleSchema = z.object({
  license_plate: z.string().min(2, "Kennzeichen fehlt").max(15).transform((s) => s.toUpperCase()),
  make: z.string().max(60).nullable(),
  model: z.string().max(60).nullable(),
  transmission: z.enum(["manual", "automatic"]),
  license_classes: z.array(z.string()),
  location_id: z.string().uuid().nullable(),
  mileage_km: intOrNull,
  status: z.enum(["active", "maintenance", "inactive"]),
  next_inspection_due: date,
  next_service_due: date,
  next_service_km: intOrNull,
  tire_set: z.string().max(60).nullable(),
  tire_change_due: date,
  insurance_provider: z.string().max(80).nullable(),
  insurance_policy_number: z.string().max(60).nullable(),
  insurance_renewal_due: date,
  notes: z.string().max(2000).nullable(),
});

function vehicleInput(fd: FormData) {
  return VehicleSchema.safeParse({
    license_plate: opt(fd.get("license_plate")), make: opt(fd.get("make")), model: opt(fd.get("model")), transmission: fd.get("transmission"), license_classes: fd.getAll("license_classes").map(String), location_id: opt(fd.get("location_id")),
    mileage_km: opt(fd.get("mileage_km")), status: opt(fd.get("status")) ?? "active", next_inspection_due: opt(fd.get("next_inspection_due")), next_service_due: opt(fd.get("next_service_due")), next_service_km: opt(fd.get("next_service_km")),
    tire_set: opt(fd.get("tire_set")), tire_change_due: opt(fd.get("tire_change_due")), insurance_provider: opt(fd.get("insurance_provider")), insurance_policy_number: opt(fd.get("insurance_policy_number")), insurance_renewal_due: opt(fd.get("insurance_renewal_due")), notes: opt(fd.get("notes")),
  });
}

export async function createVehicle(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const p = vehicleInput(fd);
  if (!p.success) return { ok: false, message: issues(p.error) };
  const { data, error } = await ctx.db.from("vehicles").insert({ ...p.data, tenant_id: ctx.tenantId }).select("id").single();
  if (error || !data) return { ok: false, message: error?.code === "23505" ? "Dieses Kennzeichen ist bereits angelegt." : (error?.message ?? "Fehler") };
  revalidatePath("/verwaltung/fahrzeuge");
  redirect(`/verwaltung/fahrzeuge/${data.id}`);
}

export async function updateVehicle(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const id = z.string().uuid().parse(fd.get("id"));
  const p = vehicleInput(fd);
  if (!p.success) return { ok: false, message: issues(p.error) };
  const { error } = await ctx.db.from("vehicles").update(p.data).eq("id", id);
  if (error) return { ok: false, message: error.code === "23505" ? "Dieses Kennzeichen ist bereits angelegt." : error.message };
  revalidatePath("/verwaltung/fahrzeuge");
  revalidatePath(`/verwaltung/fahrzeuge/${id}`);
  return { ok: true, message: "Fahrzeug gespeichert." };
}

export async function deleteVehicle(id: string): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const { count } = await ctx.db.from("lessons").select("id", { count: "exact", head: true }).eq("vehicle_id", id);
  if ((count ?? 0) > 0) {
    const { error } = await ctx.db.from("vehicles").update({ status: "inactive" }).eq("id", id);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/verwaltung/fahrzeuge");
    return { ok: true, message: "Fahrzeug hat Fahrstunden und wurde deshalb auf inaktiv gesetzt statt gelöscht." };
  }
  const { error } = await ctx.db.from("vehicles").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/verwaltung/fahrzeuge");
  redirect("/verwaltung/fahrzeuge");
}

const BlockSchema = z.object({ vehicle_id: z.string().uuid(), from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), from_time: z.string().regex(/^\d{2}:\d{2}$/), to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), to_time: z.string().regex(/^\d{2}:\d{2}$/), reason: z.string().min(1).max(60), note: z.string().max(300).nullable() });

/** Sperrzeit (Werkstatt, Reifenwechsel). Überschneidungen werden von der Datenbank abgelehnt. */
export async function addVehicleBlock(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const p = BlockSchema.safeParse({ vehicle_id: fd.get("vehicle_id"), from_date: fd.get("from_date"), from_time: opt(fd.get("from_time")) ?? "00:00", to_date: fd.get("to_date"), to_time: opt(fd.get("to_time")) ?? "23:59", reason: opt(fd.get("reason")) ?? "maintenance", note: opt(fd.get("note")) });
  if (!p.success) return { ok: false, message: issues(p.error) };
  const start = berlinToIso(p.data.from_date, p.data.from_time);
  const end = berlinToIso(p.data.to_date, p.data.to_time);
  if (end <= start) return { ok: false, message: "Ende muss nach dem Beginn liegen." };
  const { error } = await ctx.db.from("vehicle_blocks").insert({ tenant_id: ctx.tenantId, vehicle_id: p.data.vehicle_id, period: `[${start},${end})`, reason: p.data.reason, note: p.data.note });
  if (error) return { ok: false, message: error.code === "23P01" ? "Überschneidung mit einer bestehenden Sperrzeit." : error.message };
  revalidatePath(`/verwaltung/fahrzeuge/${p.data.vehicle_id}`);
  revalidatePath("/verwaltung/kalender");
  return { ok: true, message: "Sperrzeit eingetragen." };
}

export async function deleteVehicleBlock(id: string, vehicleId: string): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const { error } = await ctx.db.from("vehicle_blocks").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/verwaltung/fahrzeuge/${vehicleId}`);
  return { ok: true, message: "Sperrzeit gelöscht." };
}
