-- 0017: Fahrlehrer-Bereich (Web): interne Schülernotizen durch den zuständigen Fahrlehrer, Neubewertung einer Stunde
--       (Bewertungen je lesson_id ersetzen), Realtime für Anwesenheit und Nachrichten.

-- Interne Notizen zum Schüler: student_licenses/students sind für Fahrlehrer nur lesbar, deshalb per RPC mit Zuständigkeitsprüfung.
create or replace function app.update_student_notes(p_student_id uuid, p_notes text)
returns void language plpgsql security definer set search_path = public as $$
declare v_tenant uuid; v_ins uuid;
begin
  v_tenant = app.current_tenant_id();
  if v_tenant is null or not app.is_staff() then raise exception 'Keine Berechtigung' using errcode = '42501'; end if;
  if not exists (select 1 from public.students s where s.id = p_student_id and s.tenant_id = v_tenant) then
    raise exception 'Schüler nicht gefunden' using errcode = 'P0002';
  end if;
  if not app.is_office() then
    v_ins = app.current_instructor_id();
    if v_ins is null then raise exception 'Kein Fahrlehrerdatensatz für diesen Nutzer' using errcode = '42501'; end if;
    if not exists (select 1 from public.student_licenses sl where sl.student_id = p_student_id and sl.primary_instructor_id = v_ins)
       and not exists (select 1 from public.lessons l where l.student_id = p_student_id and l.instructor_id = v_ins and l.status <> 'cancelled') then
      raise exception 'Nur der zuständige Fahrlehrer darf Notizen bearbeiten' using errcode = '42501';
    end if;
  end if;
  update public.students set notes_internal = nullif(btrim(p_notes), '') where id = p_student_id;
end $$;

create or replace function public.update_student_notes(p_student_id uuid, p_notes text)
returns void language sql security invoker as $$ select app.update_student_notes(p_student_id, p_notes) $$;

grant execute on function app.update_student_notes(uuid, text) to authenticated, service_role;
grant execute on function public.update_student_notes(uuid, text) to authenticated, service_role;

-- Bewertungen einer Stunde dürfen vom bewertenden Fahrlehrer (oder Büro) ersetzt werden (Dokumentation erneut speichern).
create policy sss_delete_own_lesson on public.student_skill_scores for delete to authenticated
  using (tenant_id = app.current_tenant_id() and lesson_id is not null and (instructor_id = app.current_instructor_id() or app.is_office()));

-- Realtime: Anwesenheitsliste im laufenden Unterricht und Chat (nur wenn die Supabase-Publikation existiert).
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'attendance') then
      alter publication supabase_realtime add table public.attendance;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
      alter publication supabase_realtime add table public.messages;
    end if;
  end if;
end $$;
