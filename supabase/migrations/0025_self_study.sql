-- Selbstlern-Modus: Lernende ohne Fahrschule (App-Download) gehören zum Plattform-Mandanten "Selbstlernen".
-- Sie nutzen Lernen, Prüfungssimulation, Verkehrszeichen und Profil; Fahrstunden, Finanzen und Dokumente sind ausgeblendet.
-- Später können sie sich mit einer Fahrschule verbinden; der Lernstand wird dabei übernommen.

insert into public.driving_schools (id, name, slug, status, settings)
values ('10000000-0000-4000-8000-000000000001', 'FahrPilot Selbstlernen', 'selbstlerner', 'active', '{"self_study": true, "auto_confirm_bookings": false}'::jsonb)
on conflict (slug) do update set settings = public.driving_schools.settings || '{"self_study": true}'::jsonb, status = 'active';

create or replace function app.is_self_study_tenant(p_tenant uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select (settings ->> 'self_study')::boolean from public.driving_schools where id = p_tenant), false)
$$;

-- Wechsel von Selbstlernen zu einer Fahrschule: neuer Schüler in der Fahrschule, Lernstand (Fragenzustände, Serie, XP) wird kopiert.
create or replace function public.join_school_from_self_study(p_tenant_slug text, p_payload jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_old public.students%rowtype; v_new uuid; v_tenant uuid;
begin
  if v_user is null then raise exception 'Nicht angemeldet' using errcode = '42501'; end if;
  select s.* into v_old from public.students s join public.driving_schools d on d.id = s.tenant_id
    where s.user_id = v_user and (d.settings ->> 'self_study')::boolean order by s.created_at limit 1;
  if v_old.id is null then raise exception 'Kein Selbstlern-Profil gefunden' using errcode = 'P0002'; end if;
  select id into v_tenant from public.driving_schools where slug = p_tenant_slug and status in ('trial', 'active') and coalesce((settings ->> 'self_study')::boolean, false) = false;
  if v_tenant is null then raise exception 'Fahrschule nicht gefunden' using errcode = 'P0002'; end if;
  if exists (select 1 from public.students where user_id = v_user and tenant_id = v_tenant) then raise exception 'Du bist in dieser Fahrschule bereits angemeldet' using errcode = '23505'; end if;
  v_new := public.register_student(p_tenant_slug, p_payload || jsonb_build_object(
    'first_name', v_old.first_name, 'last_name', v_old.last_name, 'email', v_old.email, 'locale', v_old.preferred_locale,
    'date_of_birth', coalesce(p_payload ->> 'date_of_birth', v_old.date_of_birth::text)));
  -- Lernstand übernehmen
  insert into public.student_question_state (tenant_id, student_id, question_id, attempts, correct, consecutive_correct, last_correct, last_answered_at, last_confidence, avg_response_ms, ease, interval_days, due_at, mastery, bookmarked)
  select v_tenant, v_new, question_id, attempts, correct, consecutive_correct, last_correct, last_answered_at, last_confidence, avg_response_ms, ease, interval_days, due_at, mastery, bookmarked
  from public.student_question_state where student_id = v_old.id
  on conflict (student_id, question_id) do nothing;
  insert into public.student_streaks (tenant_id, student_id, current_days, longest_days, last_active_date, total_xp, level)
  select v_tenant, v_new, current_days, longest_days, last_active_date, total_xp, level from public.student_streaks where student_id = v_old.id
  on conflict (student_id) do nothing;
  insert into public.student_badges (tenant_id, student_id, badge_code)
  select v_tenant, v_new, badge_code from public.student_badges where student_id = v_old.id on conflict do nothing;
  update public.users set active_tenant_id = v_tenant where id = v_user;
  update public.students set status = 'completed' where id = v_old.id;
  insert into public.audit_logs (tenant_id, actor_id, actor_role, action, entity_table, entity_id, new_data)
    values (v_tenant, v_user, 'student', 'insert', 'students', v_new, jsonb_build_object('joined_from_self_study', v_old.id));
  return v_new;
end $$;
revoke all on function public.join_school_from_self_study(text, jsonb) from public;
grant execute on function public.join_school_from_self_study(text, jsonb) to authenticated, service_role;
grant execute on function app.is_self_study_tenant(uuid) to authenticated, service_role;
