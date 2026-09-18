-- 0013: Hilfsfunktionen für Lernsessions (atomare Zähler) und Storage-Bucket für Dokumente
create or replace function public.bump_learning_session(p_session_id uuid, p_correct boolean) returns void
language sql security invoker as $$
  update public.learning_sessions set question_count = question_count + 1, correct_count = correct_count + case when p_correct then 1 else 0 end
  where id = p_session_id and student_id = app.current_student_id();
$$;
grant execute on function public.bump_learning_session(uuid, boolean) to authenticated, service_role;

-- Privater Bucket "documents": Pfad <tenant_id>/<student_id>/<dateiname>. Schüler laden nur in den eigenen Ordner, Büro liest den Tenant.
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values ('documents', 'documents', false, 20971520, array['image/jpeg','image/png','image/webp','application/pdf'])
      on conflict (id) do nothing;
    execute $p$create policy documents_student_rw on storage.objects for all to authenticated
      using (bucket_id = 'documents' and (storage.foldername(name))[1] = app.current_tenant_id()::text and ((storage.foldername(name))[2] = app.current_student_id()::text or app.is_office()))
      with check (bucket_id = 'documents' and (storage.foldername(name))[1] = app.current_tenant_id()::text and ((storage.foldername(name))[2] = app.current_student_id()::text or app.is_office()))$p$;
  end if;
end $$;
