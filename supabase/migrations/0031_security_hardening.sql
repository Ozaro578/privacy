-- 0031: Sicherheitshärtung nach der Prüfung vom 21. September 2026 (Befunde siehe docs/16-sicherheitspruefung.md).

-- 1) E-Mail-Adresse im Profil ist nicht mehr selbst änderbar. Sie wird ausschließlich aus auth.users übernommen,
--    damit niemand die Adresse einer anderen Person beanspruchen und deren Einladung übernehmen kann.
revoke update on public.users from authenticated;
grant update (first_name, last_name, phone, locale, avatar_path, accessibility, active_tenant_id, last_seen_at) on public.users to authenticated;
create unique index if not exists users_email_unique_idx on public.users (email);
-- Die bisherige Update-Regel verglich is_platform_admin per Unterabfrage auf users und lief dadurch in eine
-- Endlos-Rekursion (Profiländerungen schlugen fehl). is_platform_admin ist jetzt per Spaltenrecht geschützt.
drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Ist die E-Mail in auth bestätigt? Liest die Spalte über to_jsonb, damit die Funktion auch mit dem lokalen Auth-Ersatz läuft.
create or replace function app.auth_email_confirmed(p_row jsonb) returns boolean
language sql immutable as $$
  select coalesce(p_row ->> 'email_confirmed_at', p_row ->> 'confirmed_at') is not null
$$;

-- Verknüpfung von Schülerdatensätzen und Aktivierung von Einladungen nur mit bestätigter E-Mail.
create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, first_name, last_name, locale)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'first_name', ''), coalesce(new.raw_user_meta_data ->> 'last_name', ''), coalesce(new.raw_user_meta_data ->> 'locale', 'de'))
  on conflict (id) do nothing;
  if app.auth_email_confirmed(to_jsonb(new)) then
    update public.students s set user_id = new.id where s.user_id is null and s.email = new.email;
    update public.tenant_memberships m set status = 'active' where m.user_id = new.id and m.status = 'invited';
  end if;
  return new;
end $$;

create or replace function public.handle_auth_user_signed_in() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- E-Mail-Änderungen in auth übernehmen (nach Bestätigung durch Supabase)
  update public.users u set email = new.email where u.id = new.id and new.email is not null and u.email is distinct from new.email;
  if app.auth_email_confirmed(to_jsonb(new)) then
    update public.tenant_memberships m set status = 'active' where m.user_id = new.id and m.status = 'invited';
    update public.students s set user_id = new.id where s.user_id is null and s.email is not null and s.email = new.email;
    update public.users u set active_tenant_id = coalesce(u.active_tenant_id, (select m.tenant_id from public.tenant_memberships m where m.user_id = new.id and m.status = 'active' order by m.created_at limit 1))
      where u.id = new.id;
  end if;
  return new;
end $$;
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'auth' and table_name = 'users' and column_name = 'email_confirmed_at') then
    drop trigger if exists on_auth_user_confirmed on auth.users;
    create trigger on_auth_user_confirmed after update of email_confirmed_at, email on auth.users for each row
      when (old.email_confirmed_at is distinct from new.email_confirmed_at or old.email is distinct from new.email) execute function public.handle_auth_user_signed_in();
  end if;
end $$;

-- Bestehendes Konto mit bestätigter E-Mail finden (nur Service-Role, für Einladungen).
create or replace function public.find_confirmed_user_by_email(p_email text) returns uuid
language plpgsql stable security definer set search_path = public, auth as $$
declare v_id uuid; v_row jsonb;
begin
  select to_jsonb(a), a.id into v_row, v_id from auth.users a where lower(a.email) = lower(p_email) limit 1;
  if v_id is null or not app.auth_email_confirmed(v_row) then return null; end if;
  return v_id;
end $$;
revoke all on function public.find_confirmed_user_by_email(text) from public, anon, authenticated;
grant execute on function public.find_confirmed_user_by_email(text) to service_role;

-- 3) register_student nur noch serverseitig (Service-Role) und aus den Definer-Funktionen register_self_study/join_school.
revoke all on function public.register_student(text, jsonb) from public, anon, authenticated;
grant execute on function public.register_student(text, jsonb) to service_role;

-- Fahrzeugdaten (Versicherungsnummer, Notizen) nur für Mitarbeiter
drop policy if exists vehicles_select on public.vehicles;
create policy vehicles_select on public.vehicles for select to authenticated using (tenant_id = app.current_tenant_id() and app.is_staff());

-- 6) Support-Sitzungen dürfen Freigaben und Mitgliedschaften nicht selbst ändern.
create or replace function app.in_support_session() returns boolean
language sql stable as $$ select coalesce((app.jwt_app_metadata() ->> 'support_session')::boolean, false) $$;
grant execute on function app.in_support_session() to authenticated, service_role;

drop policy if exists support_grants_insert on public.support_access_grants;
drop policy if exists support_grants_update on public.support_access_grants;
create policy support_grants_insert on public.support_access_grants for insert to authenticated
  with check (tenant_id = app.current_tenant_id() and app.is_admin() and not app.in_support_session() and granted_by = auth.uid());
create policy support_grants_update on public.support_access_grants for update to authenticated
  using (tenant_id = app.current_tenant_id() and app.is_admin() and not app.in_support_session())
  with check (tenant_id = app.current_tenant_id() and app.is_admin() and not app.in_support_session());

-- 11) und 12) Schutzregeln für Mitgliedschaften und Fahrschulstammdaten, die RLS allein nicht ausdrücken kann.
-- Gilt nur für direkte Zugriffe angemeldeter Nutzer (current_user = authenticated); Definer-Funktionen und Service-Role sind ausgenommen.
create or replace function app.guard_membership_change() returns trigger
language plpgsql as $$
begin
  if current_user <> 'authenticated' or app.is_platform_admin() then return coalesce(new, old); end if;
  if app.in_support_session() then raise exception 'In einer Support-Sitzung können Mitgliedschaften nicht geändert werden' using errcode = '42501'; end if;
  if tg_op = 'DELETE' then
    if old.user_id = auth.uid() then raise exception 'Die eigene Mitgliedschaft kann nicht gelöscht werden' using errcode = '42501'; end if;
    if old.role = 'owner' and app.current_role() <> 'owner' then raise exception 'Nur der Inhaber kann Inhaber entfernen' using errcode = '42501'; end if;
    return old;
  end if;
  if new.role = 'owner' and app.current_role() <> 'owner' and (tg_op = 'INSERT' or old.role <> 'owner') then
    raise exception 'Nur der Inhaber kann die Inhaberrolle vergeben' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' then
    if old.user_id = auth.uid() and (new.role is distinct from old.role or new.status is distinct from old.status) then
      raise exception 'Die eigene Rolle und der eigene Status können nicht geändert werden' using errcode = '42501';
    end if;
    if old.role = 'owner' and new.role <> 'owner' and app.current_role() <> 'owner' then
      raise exception 'Nur der Inhaber kann die Inhaberrolle entziehen' using errcode = '42501';
    end if;
    if new.support_grant_id is distinct from old.support_grant_id then
      raise exception 'Die Bindung an eine Support-Freigabe kann nicht geändert werden' using errcode = '42501';
    end if;
  end if;
  if tg_op = 'INSERT' and new.support_grant_id is not null then
    raise exception 'Support-Mitgliedschaften entstehen nur über start_support_session' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_membership on public.tenant_memberships;
create trigger trg_guard_membership before insert or update or delete on public.tenant_memberships for each row execute function app.guard_membership_change();

create or replace function app.guard_school_change() returns trigger
language plpgsql as $$
begin
  if current_user <> 'authenticated' or app.is_platform_admin() then return new; end if;
  if new.status is distinct from old.status then raise exception 'Der Status einer Fahrschule wird von der Plattform gesetzt' using errcode = '42501'; end if;
  if new.slug is distinct from old.slug then raise exception 'Die Kennung einer Fahrschule wird von der Plattform gesetzt' using errcode = '42501'; end if;
  if (new.settings ->> 'self_study') is distinct from (old.settings ->> 'self_study') then raise exception 'Der Selbstlern-Modus wird von der Plattform gesetzt' using errcode = '42501'; end if;
  return new;
end $$;
drop trigger if exists trg_guard_school on public.driving_schools;
create trigger trg_guard_school before update on public.driving_schools for each row execute function app.guard_school_change();

-- 9) Benachrichtigungen nur an Mitglieder des eigenen Mandanten
drop policy if exists notifications_insert_staff on public.notifications;
create policy notifications_insert_staff on public.notifications for insert to authenticated
  with check (tenant_id = app.current_tenant_id() and app.is_staff()
    and exists (select 1 from public.tenant_memberships m where m.user_id = notifications.user_id and m.tenant_id = app.current_tenant_id() and m.status in ('active', 'invited')));

-- 13) RPC-Wrapper mit Berechtigungsprüfung
create or replace function public.offer_lesson_to_waitlist(p_lesson_id uuid) returns integer
language plpgsql security invoker as $$
begin
  if not app.is_office() or not exists (select 1 from public.lessons l where l.id = p_lesson_id and l.tenant_id = app.current_tenant_id()) then
    raise exception 'Keine Berechtigung' using errcode = '42501';
  end if;
  return app.offer_lesson_to_waitlist(p_lesson_id);
end $$;
create or replace function public.special_drive_progress(p_student_license_id uuid)
returns table (kind app.lesson_kind, units integer) language plpgsql stable security invoker as $$
begin
  -- Nur Ausbildungen, die der Aufrufer per RLS sehen darf (eigene als Schüler, Mandant als Mitarbeiter)
  if not exists (select 1 from public.student_licenses sl where sl.id = p_student_license_id) then
    raise exception 'Keine Berechtigung' using errcode = '42501';
  end if;
  return query select * from app.special_drive_progress(p_student_license_id);
end $$;
revoke execute on function app.special_drive_progress(uuid), app.offer_lesson_to_waitlist(uuid) from authenticated;
grant execute on function public.special_drive_progress(uuid), public.offer_lesson_to_waitlist(uuid) to authenticated, service_role;

-- 7) Rate-Limits (Login, Registrierung, KI) als festes Zeitfenster je Schlüssel. Nur Service-Role.
create table if not exists public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;
grant all on public.rate_limits to service_role;

create or replace function public.hit_rate_limit(p_key text, p_window_seconds integer, p_max integer) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_start timestamptz; v_hits integer;
begin
  v_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.rate_limits (key, window_start, hits) values (p_key, v_start, 1)
    on conflict (key, window_start) do update set hits = public.rate_limits.hits + 1
    returning hits into v_hits;
  -- Alte Fenster gelegentlich aufräumen
  if random() < 0.01 then delete from public.rate_limits where window_start < now() - interval '2 days'; end if;
  return v_hits <= p_max;
end $$;
revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;
