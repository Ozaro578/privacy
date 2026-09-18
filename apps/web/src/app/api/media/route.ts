import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Signierte URL für Frage-Medien aus dem privaten Bucket "content" (Nutzer muss angemeldet sein). */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path || path.includes("..")) return NextResponse.json({ error: "Pfad fehlt" }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  const { data, error } = await supabase.storage.from("content").createSignedUrl(path, 600);
  if (error || !data) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
