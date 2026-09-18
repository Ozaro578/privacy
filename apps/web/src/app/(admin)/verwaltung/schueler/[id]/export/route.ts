import { NextResponse } from "next/server";
import { exportStudentData } from "@/lib/data/admin-students";

/** JSON-Export der Schülerakte (Auskunft nach Art. 15 DSGVO). Nur Büro, Admin, Owner; RLS filtert nach Tenant. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
  const data = await exportStudentData(id);
  if (!data) return NextResponse.json({ error: "Schüler nicht gefunden" }, { status: 404 });
  const name = `${data.student.last_name}-${data.student.first_name}`.replace(/[^a-zA-Z0-9äöüÄÖÜß-]/g, "_");
  return new NextResponse(JSON.stringify(data, null, 2), { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="schuelerakte-${name}.json"`, "cache-control": "no-store" } });
}
