-- 0014: Fahrlehrer-Bereich: Prüfungsfreigabe per RPC (Fahrlehrer dürfen student_licenses sonst nicht schreiben)
--       und Insert-Policy für Benachrichtigungen durch Mitarbeiter (Praxis -> Theorie Hinweise, Chat).

-- Mitarbeiter dürfen Benachrichtigungen für Nutzer des eigenen Tenants anlegen.
create policy notifications_insert_staff on public.notifications for insert to authenticated
  with check (tenant_id = app.current_tenant_id() and app.is_staff());

-- Prüfungsfreigabe durch den zuständigen Fahrlehrer (oder Büro). Legt den Prüfungsdatensatz an oder aktualisiert
-- den offenen Versuch und setzt den Status der Ausbildung auf 'ready'.
create or replace function app.release_exam(p_student_license_id uuid, p_kind text)
returns void language plpgsql security definer set search_path = public as $$
declare v_tenant uuid; v_sl public.student_licenses; v_ins uuid; v_exam_id uuid;
begin
  v_tenant = app.current_tenant_id();
  if v_tenant is null or not app.is_staff() then raise exception 'Keine Berechtigung' using errcode = '42501'; end if;
  if p_kind not in ('theory', 'practical') then raise exception 'Unbekannte Prüfungsart' using errcode = 'P0001'; end if;
  select * into v_sl from public.student_licenses where id = p_student_license_id and tenant_id = v_tenant for update;
  if not found then raise exception 'Ausbildung nicht gefunden' using errcode = 'P0002'; end if;
  v_ins = app.current_instructor_id();
  if not app.is_office() then
    if v_ins is null then raise exception 'Kein Fahrlehrerdatensatz für diesen Nutzer' using errcode = '42501'; end if;
    if v_sl.primary_instructor_id is distinct from v_ins
       and not exists (select 1 from public.lessons l where l.student_license_id = v_sl.id and l.instructor_id = v_ins and l.status <> 'cancelled') then
      raise exception 'Nur der zuständige Fahrlehrer darf freigeben' using errcode = '42501';
    end if;
  end if;
  if p_kind = 'theory' then
    if v_sl.theory_exam_status in ('passed', 'scheduled', 'requested') then raise exception 'Theorieprüfung ist bereits % ', v_sl.theory_exam_status using errcode = 'P0001'; end if;
    select id into v_exam_id from public.theory_exams where student_license_id = v_sl.id and result is null order by attempt_no desc limit 1;
    if v_exam_id is null then
      insert into public.theory_exams (tenant_id, student_license_id, status, released_by, released_at, attempt_no)
        values (v_tenant, v_sl.id, 'ready', v_ins, now(), coalesce((select max(attempt_no) from public.theory_exams where student_license_id = v_sl.id), 0) + 1);
    else
      update public.theory_exams set status = 'ready', released_by = v_ins, released_at = now() where id = v_exam_id;
    end if;
    update public.student_licenses set theory_exam_status = 'ready' where id = v_sl.id;
  else
    if v_sl.practical_exam_status in ('passed', 'scheduled', 'requested') then raise exception 'Praktische Prüfung ist bereits %', v_sl.practical_exam_status using errcode = 'P0001'; end if;
    select id into v_exam_id from public.practical_exams where student_license_id = v_sl.id and result is null order by attempt_no desc limit 1;
    if v_exam_id is null then
      insert into public.practical_exams (tenant_id, student_license_id, status, released_by, released_at, instructor_id, attempt_no)
        values (v_tenant, v_sl.id, 'ready', v_ins, now(), coalesce(v_ins, v_sl.primary_instructor_id), coalesce((select max(attempt_no) from public.practical_exams where student_license_id = v_sl.id), 0) + 1);
    else
      update public.practical_exams set status = 'ready', released_by = v_ins, released_at = now() where id = v_exam_id;
    end if;
    update public.student_licenses set practical_exam_status = 'ready' where id = v_sl.id;
  end if;
  insert into public.notifications (tenant_id, user_id, notification_type, title, body, data, channels, dedupe_key)
    select v_tenant, s.user_id, 'exam_released',
           case when p_kind = 'theory' then 'Freigabe für die Theorieprüfung' else 'Freigabe für die praktische Prüfung' end,
           case when p_kind = 'theory' then 'Dein Fahrlehrer hat dich für die Theorieprüfung freigegeben. Die Fahrschule meldet dich zur Prüfung an.' else 'Dein Fahrlehrer hat dich für die praktische Prüfung freigegeben. Die Fahrschule vereinbart den Termin.' end,
           jsonb_build_object('student_license_id', v_sl.id, 'kind', p_kind), '{push,in_app}', 'exam_released:' || p_kind || ':' || v_sl.id
    from public.students s where s.id = v_sl.student_id and s.user_id is not null
    on conflict do nothing;
end $$;

create or replace function public.release_exam(p_student_license_id uuid, p_kind text)
returns void language sql security invoker as $$ select app.release_exam(p_student_license_id, p_kind) $$;

grant execute on function app.release_exam(uuid, text) to authenticated, service_role;
grant execute on function public.release_exam(uuid, text) to authenticated, service_role;
