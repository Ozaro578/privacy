import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { getBearerAuthFromRequest } from "@/lib/auth/bearer";

/**
 * Signierte URL für Frage-Medien aus dem privaten Bucket "content".
 * Auth: Session-Cookie (Web) oder Authorization: Bearer <access_token> (Mobile-App).
 * Signiert wird nur ein Pfad, der zu einer für den Nutzer sichtbaren Fragenversion gehört; die RLS-Regeln
 * (Mandant, Veröffentlichung, Inhaltslizenz) entscheiden damit auch über die Medien.
 * Öffentliche Fragemedien liegen unter /media/questions und brauchen diese Route nicht.
 */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path || path.length > 300 || path.includes("..") || path.startsWith("/") || /[\\\u0000-\u001f]/.test(path)) return NextResponse.json({ error: "Pfad ungültig" }, { status: 400 });
  const bearer = await getBearerAuthFromRequest();
  const db = bearer ? bearer.db : await createSupabaseServerClient();
  if (!bearer) {
    const { data: claims } = await db.auth.getClaims();
    if (!claims) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }
  const { data: version } = await db.from("question_versions").select("id").eq("media_path", path).limit(1).maybeSingle();
  if (!version) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  const { data, error } = await createSupabaseAdminClient().storage.from("content").createSignedUrl(path, 600);
  if (error || !data) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
