"use client";
import { useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { markDocumentUploaded } from "@/lib/actions/profile";
import { btn } from "@/components/ui";

/** Lädt direkt in den privaten Storage-Bucket (RLS-geschützter Pfad) und meldet den Upload dem Server. */
export function DocumentUpload({ documentId, tenantId, studentId, kind }: { documentId: string; tenantId: string; studentId: string; kind: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div>
      <label className={`${btn.secondary} cursor-pointer`}>
        {pending ? "Lade hoch …" : "Datei hochladen"}
        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" disabled={pending} onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 20 * 1024 * 1024) { setMsg("Datei ist größer als 20 MB."); return; }
          start(async () => {
            const supabase = createSupabaseBrowserClient();
            const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
            const path = `${tenantId}/${studentId}/${kind}-${Date.now()}.${ext}`;
            const { error } = await supabase.storage.from("documents").upload(path, file, { contentType: file.type, upsert: false });
            if (error) { setMsg(`Upload fehlgeschlagen: ${error.message}`); return; }
            const r = await markDocumentUploaded({ documentId, storagePath: path, mimeType: file.type, sizeBytes: file.size });
            setMsg(r.message);
          });
        }} />
      </label>
      {msg && <p className="mt-1 text-sm" role="status">{msg}</p>}
    </div>
  );
}
