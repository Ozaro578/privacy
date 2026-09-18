import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Signierte URL für Dokumente/Rechnungen aus dem privaten Bucket "documents" (RLS entscheidet über Zugriff). */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path || path.includes("..")) return NextResponse.json({ error: "Pfad fehlt" }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 300);
  if (error || !data) return NextResponse.json({ error: "Kein Zugriff" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
