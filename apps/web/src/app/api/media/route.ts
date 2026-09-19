import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { getBearerAuthFromRequest } from "@/lib/auth/bearer";

/**
 * Signierte URL für Frage-Medien aus dem privaten Bucket "content".
 * Auth: Session-Cookie (Web) oder Authorization: Bearer <access_token> (Mobile-App).
 * Öffentliche Fragemedien liegen unter /media/questions und brauchen diese Route nicht.
 */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path || path.includes("..") || path.startsWith("/")) return NextResponse.json({ error: "Pfad fehlt" }, { status: 400 });
  const bearer = await getBearerAuthFromRequest();
  if (!bearer) {
    const supabase = await createSupabaseServerClient();
    const { data: claims } = await supabase.auth.getClaims();
    if (!claims) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }
  const { data, error } = await createSupabaseAdminClient().storage.from("content").createSignedUrl(path, 600);
  if (error || !data) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
