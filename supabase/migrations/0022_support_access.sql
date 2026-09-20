-- Support-Zugriff mit Freigabe: Ein Fahrschul-Admin erteilt der Plattform einen zeitlich befristeten Zugriff.
-- Nur mit aktiver Freigabe kann ein Plattform-Admin eine Support-Sitzung im Mandanten starten (temporäre Mitgliedschaft
-- mit Rolle admin, gebunden an die Freigabe). Ablauf oder Widerruf beendet die Sitzung; alles ist im Audit-Log.

create table public.support_access_grants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  granted_by uuid not null references public.users(id),
  reason text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revoked_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);
create index support_access_grants_tenant_idx on public.support_access_grants(tenant_id, expires_at desc);
alter table public.support_access_grants enable row level security;
grant select, insert, update on public.support_access_grants to authenticated, service_role;
create trigger trg_support_grants_tenant before insert or update on public.support_access_grants for each row execute function app.enforce_tenant_on_write();
create trigger trg_audit_support_access_grants after insert or update or delete on public.support_access_grants for each row execute function app.audit_row_change();

create policy support_grants_select on public.support_access_grants for select to authenticated
  using ((tenant_id = app.current_tenant_id() and app.is_admin()) or app.is_platform_admin());
create policy support_grants_insert on public.support_access_grants for insert to authenticated
  with check (tenant_id = app.current_tenant_id() and app.is_admin() and granted_by = auth.uid());
create policy support_grants_update on public.support_access_grants for update to authenticated
  using (tenant_id = app.current_tenant_id() and app.is_admin()) with check (tenant_id = app.current_tenant_id() and app.is_admin());

-- Support-Mitgliedschaften sind an eine Freigabe gebunden
alter table public.tenant_memberships add column support_grant_id uuid references public.support_access_grants(id) on delete cascade;
create index tenant_memberships_support_idx on public.tenant_memberships(support_grant_id) where support_grant_id is not null;

create or replace function app.grant_is_active(p_grant_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.support_access_grants g where g.id = p_grant_id and g.revoked_at is null and g.expires_at > now())
$$;

-- Plattform-Admin startet eine Support-Sitzung (nur mit aktiver Freigabe); danach Token erneuern.
create or replace function public.start_support_session(p_tenant_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_grant uuid; v_user uuid := auth.uid(); v_platform boolean;
begin
  select is_platform_admin into v_platform from public.users where id = v_user;
  if not coalesce(v_platform, false) then raise exception 'Nur Plattform-Administratoren' using errcode = '42501'; end if;
  select id into v_grant from public.support_access_grants
    where tenant_id = p_tenant_id and revoked_at is null and expires_at > now()
    order by expires_at desc limit 1;
  if v_grant is null then raise exception 'Keine aktive Support-Freigabe dieser Fahrschule' using errcode = '42501'; end if;
  if exists (select 1 from public.tenant_memberships where tenant_id = p_tenant_id and user_id = v_user and support_grant_id is null) then
    raise exception 'Nutzer ist bereits regulär Mitglied dieser Fahrschule' using errcode = '42501';
  end if;
  insert into public.tenant_memberships (tenant_id, user_id, role, status, support_grant_id)
    values (p_tenant_id, v_user, 'admin', 'active', v_grant)
    on conflict (tenant_id, user_id) do update set status = 'active', support_grant_id = excluded.support_grant_id, role = 'admin';
  update public.users set active_tenant_id = p_tenant_id where id = v_user;
  insert into public.audit_logs (tenant_id, actor_id, actor_role, action, entity_table, entity_id, new_data)
    values (p_tenant_id, v_user, 'platform_admin', 'insert', 'support_session', v_grant, jsonb_build_object('started', true));
  return v_grant;
end $$;

-- Support-Sitzung beenden (eigene Support-Mitgliedschaften entfernen)
create or replace function public.end_support_session() returns void
language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid();
begin
  insert into public.audit_logs (tenant_id, actor_id, actor_role, action, entity_table, entity_id, new_data)
    select m.tenant_id, v_user, 'platform_admin', 'delete', 'support_session', m.support_grant_id, jsonb_build_object('ended', true)
    from public.tenant_memberships m where m.user_id = v_user and m.support_grant_id is not null;
  delete from public.tenant_memberships where user_id = v_user and support_grant_id is not null;
  update public.users u set active_tenant_id = (select m.tenant_id from public.tenant_memberships m where m.user_id = v_user and m.status = 'active' order by m.created_at limit 1) where u.id = v_user;
end $$;

-- Abgelaufene oder widerrufene Freigaben beenden alle zugehörigen Support-Sitzungen (täglicher Lauf, zusätzlich beim Widerruf)
create or replace function public.expire_support_sessions() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  with gone as (
    delete from public.tenant_memberships m using public.support_access_grants g
    where m.support_grant_id = g.id and (g.revoked_at is not null or g.expires_at <= now())
    returning m.user_id, m.tenant_id)
  select count(*) into n from gone;
  update public.users u set active_tenant_id = (select m.tenant_id from public.tenant_memberships m where m.user_id = u.id and m.status = 'active' order by m.created_at limit 1)
    where u.active_tenant_id is not null and not exists (select 1 from public.tenant_memberships m where m.user_id = u.id and m.tenant_id = u.active_tenant_id and m.status = 'active');
  return n;
end $$;

-- Widerruf durch den Fahrschul-Admin beendet laufende Sitzungen sofort
create or replace function app.on_support_grant_revoked() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.revoked_at is not null and old.revoked_at is null then perform public.expire_support_sessions(); end if;
  return new;
end $$;
create trigger trg_support_grant_revoked after update on public.support_access_grants for each row execute function app.on_support_grant_revoked();

-- Token-Hook: Support-Mitgliedschaften zählen nur mit aktiver Freigabe
create or replace function public.custom_access_token_hook(event jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_user uuid; v_claims jsonb; v_tenant uuid; v_role text; v_platform boolean := false; v_active uuid; v_support boolean := false;
begin
  v_user = (event ->> 'user_id')::uuid;
  v_claims = coalesce(event -> 'claims', '{}'::jsonb);
  select u.active_tenant_id, u.is_platform_admin into v_active, v_platform from public.users u where u.id = v_user;
  select m.tenant_id, m.role::text, m.support_grant_id is not null into v_tenant, v_role, v_support from public.tenant_memberships m
    where m.user_id = v_user and m.status = 'active' and (m.support_grant_id is null or app.grant_is_active(m.support_grant_id))
    order by case when m.tenant_id = v_active then 0 else 1 end, m.created_at
    limit 1;
  v_claims = jsonb_set(v_claims, '{app_metadata}', coalesce(v_claims -> 'app_metadata', '{}'::jsonb)
    || jsonb_build_object('tenant_id', v_tenant, 'tenant_role', v_role, 'platform_admin', coalesce(v_platform, false), 'support_session', v_support));
  return jsonb_set(event, '{claims}', v_claims);
end $$;

revoke all on function public.start_support_session(uuid), public.end_support_session(), public.expire_support_sessions() from public;
grant execute on function public.start_support_session(uuid), public.end_support_session() to authenticated, service_role;
grant execute on function public.expire_support_sessions() to service_role;
grant execute on function app.grant_is_active(uuid) to authenticated, service_role, supabase_auth_admin;
grant select on public.support_access_grants to supabase_auth_admin;
