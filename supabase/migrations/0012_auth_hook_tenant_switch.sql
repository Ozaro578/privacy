-- 0012: Custom Access Token Hook (Tenant und Rolle im JWT), aktiver Tenant je Nutzer, Tenant-Wechsel, Profil-Anlage bei Registrierung
alter table public.users add column if not exists active_tenant_id uuid references public.driving_schools(id) on delete set null;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then create role supabase_auth_admin nologin; end if;
end $$;

-- Wird von Supabase Auth bei jeder Token-Ausstellung aufgerufen (Dashboard: Authentication > Hooks > Custom Access Token).
create or replace function public.custom_access_token_hook(event jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_user uuid; v_claims jsonb; v_tenant uuid; v_role text; v_platform boolean := false; v_active uuid;
begin
  v_user = (event ->> 'user_id')::uuid;
  v_claims = coalesce(event -> 'claims', '{}'::jsonb);
  select u.active_tenant_id, u.is_platform_admin into v_active, v_platform from public.users u where u.id = v_user;
  select m.tenant_id, m.role::text into v_tenant, v_role from public.tenant_memberships m
    where m.user_id = v_user and m.status = 'active'
    order by case when m.tenant_id = v_active then 0 else 1 end, m.created_at
    limit 1;
  v_claims = jsonb_set(v_claims, '{app_metadata}', coalesce(v_claims -> 'app_metadata', '{}'::jsonb)
    || jsonb_build_object('tenant_id', v_tenant, 'tenant_role', v_role, 'platform_admin', coalesce(v_platform, false)));
  return jsonb_set(event, '{claims}', v_claims);
end $$;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
grant select on public.users, public.tenant_memberships to supabase_auth_admin;
create policy users_auth_admin on public.users for select to supabase_auth_admin using (true);
create policy memberships_auth_admin on public.tenant_memberships for select to supabase_auth_admin using (true);

-- Aktiven Tenant wechseln (danach Token erneuern). Nur eigene aktive Mitgliedschaften.
create or replace function public.switch_active_tenant(p_tenant_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.tenant_memberships m where m.user_id = auth.uid() and m.tenant_id = p_tenant_id and m.status = 'active') then
    raise exception 'Keine aktive Mitgliedschaft in dieser Fahrschule' using errcode = '42501';
  end if;
  update public.users set active_tenant_id = p_tenant_id where id = auth.uid();
end $$;

-- Profilzeile automatisch anlegen, wenn Supabase Auth einen Nutzer erstellt
create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, first_name, last_name, locale)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'first_name', ''), coalesce(new.raw_user_meta_data ->> 'last_name', ''), coalesce(new.raw_user_meta_data ->> 'locale', 'de'))
  on conflict (id) do nothing;
  -- Einladungen: Schüler/Mitarbeiter, deren E-Mail bereits angelegt wurde, werden verknüpft
  update public.students s set user_id = new.id where s.user_id is null and s.email = new.email;
  update public.tenant_memberships m set status = 'active' where m.user_id = new.id and m.status = 'invited';
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();

-- Digitale Anmeldung: legt Interessent (lead) inkl. Ausbildung an; läuft mit Service-Role aus dem Server (kein Tenant im Token nötig)
create or replace function public.register_student(p_tenant_slug text, p_payload jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_tenant uuid; v_student uuid; v_license text; v_user uuid;
begin
  select id into v_tenant from public.driving_schools where slug = p_tenant_slug and status in ('trial', 'active');
  if v_tenant is null then raise exception 'Fahrschule nicht gefunden' using errcode = 'P0002'; end if;
  v_user = auth.uid();
  insert into public.students (tenant_id, user_id, location_id, first_name, last_name, date_of_birth, email, phone, address_line1, postal_code, city, preferred_locale, guardian_name, guardian_email, guardian_phone, status)
  values (v_tenant, v_user, nullif(p_payload ->> 'location_id', '')::uuid, p_payload ->> 'first_name', p_payload ->> 'last_name', nullif(p_payload ->> 'date_of_birth', '')::date,
          p_payload ->> 'email', p_payload ->> 'phone', p_payload ->> 'address_line1', p_payload ->> 'postal_code', p_payload ->> 'city', coalesce(p_payload ->> 'locale', 'de'),
          p_payload ->> 'guardian_name', p_payload ->> 'guardian_email', p_payload ->> 'guardian_phone', 'registered')
  returning id into v_student;
  v_license = coalesce(p_payload ->> 'license_code', 'B');
  insert into public.student_licenses (tenant_id, student_id, license_code, acquisition_kind, transmission, accompanied_driving, existing_license_codes)
  values (v_tenant, v_student, v_license, coalesce(p_payload ->> 'acquisition_kind', 'first'), coalesce(p_payload ->> 'transmission', 'manual'),
          coalesce((p_payload ->> 'accompanied_driving')::boolean, false), coalesce(array(select jsonb_array_elements_text(p_payload -> 'existing_license_codes')), '{}'));
  if v_user is not null then
    insert into public.tenant_memberships (tenant_id, user_id, role, status) values (v_tenant, v_user, 'student', 'active') on conflict (tenant_id, user_id) do nothing;
    update public.users set active_tenant_id = coalesce(active_tenant_id, v_tenant) where id = v_user;
  end if;
  -- Dokumenten-Checkliste aus Vorlage anlegen (Tenant-Vorlage vor Plattform-Vorlage)
  insert into public.documents (tenant_id, student_id, student_license_id, requirement_code, kind, title, status)
  select v_tenant, v_student, sl.id, r.code, r.code, r.name_i18n ->> 'de', 'missing'
  from public.student_licenses sl, public.document_requirements r
  where sl.student_id = v_student and r.active
    and (r.tenant_id = v_tenant or (r.tenant_id is null and not exists (select 1 from public.document_requirements r2 where r2.tenant_id = v_tenant and r2.code = r.code)))
    and (cardinality(r.license_codes) = 0 or v_license = any(r.license_codes))
    and (r.applies_when = '{}'::jsonb
         or (coalesce((r.applies_when ->> 'accompanied_driving')::boolean, false) = coalesce((p_payload ->> 'accompanied_driving')::boolean, false) and r.applies_when ? 'accompanied_driving')
         or (r.applies_when ? 'minor' and nullif(p_payload ->> 'date_of_birth', '')::date > current_date - interval '18 years'))
  on conflict do nothing;
  return v_student;
end $$;
grant execute on function public.switch_active_tenant(uuid), public.register_student(text, jsonb) to authenticated, service_role;
