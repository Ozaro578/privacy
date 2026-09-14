-- 0001: Erweiterungen, Hilfsschema, JWT-Helfer, Trigger-Funktionen
create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";
create extension if not exists "pg_trgm";
create extension if not exists "citext";

create schema if not exists app;
grant usage on schema app to anon, authenticated, service_role;

-- Rollen innerhalb eines Tenants (Fahrschule). platform_admin verwaltet globale Inhalte/Regeln.
create type app.tenant_role as enum ('student', 'instructor', 'office', 'admin', 'owner');

-- JWT-Claims werden vom Supabase Custom Access Token Hook gesetzt:
--   app_metadata.tenant_id, app_metadata.tenant_role, app_metadata.platform_admin
create or replace function app.jwt_app_metadata() returns jsonb
language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata', '{}'::jsonb)
$$;

create or replace function app.current_tenant_id() returns uuid
language sql stable as $$
  select nullif(app.jwt_app_metadata() ->> 'tenant_id', '')::uuid
$$;

create or replace function app.current_role() returns app.tenant_role
language sql stable as $$
  select nullif(app.jwt_app_metadata() ->> 'tenant_role', '')::app.tenant_role
$$;

create or replace function app.is_platform_admin() returns boolean
language sql stable as $$
  select coalesce((app.jwt_app_metadata() ->> 'platform_admin')::boolean, false)
$$;

create or replace function app.has_any_role(variadic roles app.tenant_role[]) returns boolean
language sql stable as $$
  select app.current_role() = any(roles)
$$;

-- Mitarbeiterrollen (alles außer Schüler)
create or replace function app.is_staff() returns boolean
language sql stable as $$
  select app.has_any_role('instructor', 'office', 'admin', 'owner')
$$;

create or replace function app.is_office() returns boolean
language sql stable as $$
  select app.has_any_role('office', 'admin', 'owner')
$$;

create or replace function app.is_admin() returns boolean
language sql stable as $$
  select app.has_any_role('admin', 'owner')
$$;

create or replace function app.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Optimistic Locking: Version zählt bei jedem Update hoch (Offline-Sync, Last-Writer-Wins mit Prüfung)
create or replace function app.bump_row_version() returns trigger
language plpgsql as $$
begin
  new.row_version = coalesce(old.row_version, 0) + 1;
  new.updated_at = now();
  return new;
end $$;

-- Prüft, dass die tenant_id einer Zeile zum JWT passt (Schutz gegen tenant-übergreifendes Schreiben).
create or replace function app.enforce_tenant_on_write() returns trigger
language plpgsql as $$
begin
  if app.current_tenant_id() is not null and new.tenant_id is distinct from app.current_tenant_id() then
    raise exception 'tenant_id % gehört nicht zum aktuellen Tenant', new.tenant_id using errcode = '42501';
  end if;
  return new;
end $$;
