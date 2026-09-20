-- 0028: Selbstlern-Registrierung aus der App. Der Nutzer legt sein Konto per Supabase Auth an (signUp) und ruft danach
-- diese Funktion auf; sie legt Schüler, Mitgliedschaft und Einwilligungen im Selbstlern-Mandanten an. Läuft mit den
-- Rechten des angemeldeten Nutzers (auth.uid()), kein Service-Schlüssel in der App nötig.
create or replace function public.register_self_study(p_payload jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_user uuid; v_tenant uuid; v_student uuid; v_existing uuid; v_email text;
begin
  v_user = auth.uid();
  if v_user is null then raise exception 'Nicht angemeldet' using errcode = '42501'; end if;
  if coalesce((p_payload ->> 'consent_privacy')::boolean, false) is not true or coalesce((p_payload ->> 'consent_terms')::boolean, false) is not true then
    raise exception 'Datenschutzerklärung und Nutzungsbedingungen müssen akzeptiert werden' using errcode = '22023';
  end if;
  if length(coalesce(p_payload ->> 'first_name', '')) = 0 or length(coalesce(p_payload ->> 'last_name', '')) = 0 then
    raise exception 'Vor- und Nachname fehlen' using errcode = '22023';
  end if;
  select id into v_tenant from public.driving_schools where slug = 'selbstlerner' and status = 'active' and coalesce((settings ->> 'self_study')::boolean, false);
  if v_tenant is null then raise exception 'Selbstlern-Bereich ist nicht eingerichtet' using errcode = 'P0002'; end if;
  -- Wer schon irgendwo Schüler ist (Fahrschule oder Selbstlernen), bekommt keinen zweiten Datensatz.
  select s.id into v_existing from public.students s where s.user_id = v_user order by s.created_at limit 1;
  if v_existing is not null then
    update public.users set active_tenant_id = coalesce(active_tenant_id, (select tenant_id from public.students where id = v_existing)) where id = v_user;
    return v_existing;
  end if;
  select email into v_email from public.users where id = v_user;
  v_student = public.register_student('selbstlerner', p_payload || jsonb_build_object('email', coalesce(v_email, p_payload ->> 'email')));
  update public.students set status = 'active', user_id = v_user where id = v_student;
  update public.users set active_tenant_id = v_tenant,
    first_name = case when length(first_name) = 0 then p_payload ->> 'first_name' else first_name end,
    last_name = case when length(last_name) = 0 then p_payload ->> 'last_name' else last_name end
    where id = v_user;
  -- Selbstlernende führen keine Dokumenten-Checkliste
  delete from public.documents where student_id = v_student;
  insert into public.consents (tenant_id, user_id, student_id, consent_type, text_version, granted, evidence)
  values (v_tenant, v_user, v_student, 'privacy_policy', coalesce(p_payload ->> 'consent_version', '2026-09'), true, jsonb_build_object('channel', coalesce(p_payload ->> 'channel', 'app'))),
         (v_tenant, v_user, v_student, 'terms', coalesce(p_payload ->> 'consent_version', '2026-09'), true, jsonb_build_object('channel', coalesce(p_payload ->> 'channel', 'app')));
  insert into public.audit_logs (tenant_id, actor_id, actor_role, action, entity_table, entity_id, new_data)
  values (v_tenant, v_user, 'student', 'insert', 'students', v_student, jsonb_build_object('self_study_registration', true, 'channel', coalesce(p_payload ->> 'channel', 'app')));
  return v_student;
end $$;
revoke all on function public.register_self_study(jsonb) from public;
grant execute on function public.register_self_study(jsonb) to authenticated, service_role;
