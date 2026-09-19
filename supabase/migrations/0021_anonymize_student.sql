-- DSGVO-Löschung: Pseudonymisierung eines Schülers (Art. 17 DSGVO) unter Beachtung gesetzlicher Aufbewahrungspflichten.
-- Gelöscht werden Lern- und Kommunikationsdaten sowie Kontaktdaten. Behalten werden Rechnungen, Zahlungen, Verträge,
-- Fahrstunden und Prüfungen (Ausbildungsnachweis, steuerliche Aufbewahrung), jedoch ohne Personenbezug im Namen.
-- Dateien im Storage und der Auth-Benutzer werden von der Web-App (Service-Role) gelöscht; die Funktion liefert die Pfade.

create or replace function app.anonymize_student(p_student_id uuid, p_legal_hold_until date default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_student public.students%rowtype;
  v_tenant uuid;
  v_paths text[];
  v_pseudonym text;
begin
  select * into v_student from public.students where id = p_student_id;
  if not found then raise exception 'Schüler nicht gefunden' using errcode = 'P0002'; end if;
  v_tenant := v_student.tenant_id;
  if not app.is_admin() and not app.is_office() then raise exception 'Keine Berechtigung' using errcode = '42501'; end if;
  if v_tenant <> app.current_tenant_id() then raise exception 'Falscher Mandant' using errcode = '42501'; end if;
  v_pseudonym := 'gelöscht-' || left(replace(p_student_id::text, '-', ''), 8);

  -- Dateien sammeln (Löschung im Storage durch die Web-App)
  select coalesce(array_agg(storage_path), '{}') into v_paths from public.documents where student_id = p_student_id and storage_path is not null;

  -- Lern- und Kommunikationsdaten löschen
  delete from public.student_question_attempts where student_id = p_student_id;
  delete from public.student_question_state where student_id = p_student_id;
  delete from public.student_topic_mastery where student_id = p_student_id;
  delete from public.learning_sessions where student_id = p_student_id;
  delete from public.exam_simulations where student_id = p_student_id;
  delete from public.readiness_snapshots where student_license_id in (select id from public.student_licenses where student_id = p_student_id);
  delete from public.daily_goals where student_id = p_student_id;
  delete from public.student_streaks where student_id = p_student_id;
  delete from public.student_badges where student_id = p_student_id;
  delete from public.xp_events where student_id = p_student_id;
  delete from public.coach_conversations where student_id = p_student_id;
  delete from public.waitlist_entries where student_id = p_student_id;
  delete from public.documents where student_id = p_student_id;
  update public.messages set body = '[gelöscht]', attachment_path = null, deleted_at = coalesce(deleted_at, now())
    where sender_id = v_student.user_id or conversation_id in (select id from public.conversations where student_id = p_student_id);

  -- Personenbezug entfernen, Datensatz für Nachweise behalten
  update public.students set
    first_name = 'Gelöscht', last_name = v_pseudonym, date_of_birth = null, email = null, phone = null,
    address_line1 = null, postal_code = null, city = null, guardian_name = null, guardian_email = null, guardian_phone = null,
    notes_internal = null, status = 'cancelled', user_id = null
  where id = p_student_id;

  if v_student.user_id is not null then
    delete from public.push_tokens where user_id = v_student.user_id;
    delete from public.notifications where user_id = v_student.user_id;
    delete from public.notification_preferences where user_id = v_student.user_id;
    delete from public.tenant_memberships where user_id = v_student.user_id and tenant_id = v_tenant;
    update public.users set email = ('deleted+' || replace(v_student.user_id::text, '-', '') || '@invalid.local'),
      first_name = 'Gelöscht', last_name = v_pseudonym, phone = null, avatar_path = null
      where id = v_student.user_id and not exists (select 1 from public.tenant_memberships m where m.user_id = v_student.user_id);
  end if;

  update public.data_requests set status = 'completed', completed_at = now(), legal_hold_until = coalesce(p_legal_hold_until, legal_hold_until)
    where student_id = p_student_id and kind = 'deletion' and status in ('open', 'in_progress');

  insert into public.audit_logs (tenant_id, actor_id, actor_role, action, entity_table, entity_id, new_data)
  values (v_tenant, auth.uid(), 'office', 'update', 'students', p_student_id, jsonb_build_object('anonymized', true, 'legal_hold_until', p_legal_hold_until));

  return jsonb_build_object('student_id', p_student_id, 'user_id', v_student.user_id, 'storage_paths', to_jsonb(v_paths),
    'user_removed', v_student.user_id is not null and not exists (select 1 from public.tenant_memberships m where m.user_id = v_student.user_id));
end $$;

create or replace function public.anonymize_student(p_student_id uuid, p_legal_hold_until date default null)
returns jsonb language sql security definer set search_path = public as $$ select app.anonymize_student(p_student_id, p_legal_hold_until) $$;
revoke all on function app.anonymize_student(uuid, date) from public;
revoke all on function public.anonymize_student(uuid, date) from public;
grant execute on function app.anonymize_student(uuid, date) to authenticated, service_role;
grant execute on function public.anonymize_student(uuid, date) to authenticated, service_role;
