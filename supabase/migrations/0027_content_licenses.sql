-- 0027: Inhaltslizenzen je Fahrschule. Lizenzierte (amtliche) Fragen sind nur sichtbar, wenn der Mandant
-- eine gültige Lizenz mit passender Lizenzkennung hat. Eigene Übungsfragen bleiben immer sichtbar.
-- Lizenzen setzt die Plattform (Vertrag mit dem Lizenzgeber, z. B. TÜV | DEKRA arge tp 21); Fahrschulen sehen ihren Stand.
create table public.tenant_content_licenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  source app.content_source not null default 'official_licensed' check (source = 'official_licensed'),
  license_id text not null,                 -- Lizenzkennung des Katalogs, entspricht theory_questions.license_id_for_source
  licensor text not null,                   -- Lizenzgeber laut Vertrag
  valid_from date not null default current_date,
  valid_until date check (valid_until is null or valid_until >= valid_from),
  seats integer check (seats is null or seats > 0),   -- vertraglich erlaubte Schülerzahl, NULL = unbegrenzt
  contract_reference text,
  note text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tenant_content_licenses_lookup_idx on public.tenant_content_licenses(tenant_id, license_id, valid_from desc);
create trigger trg_tenant_content_licenses_updated before update on public.tenant_content_licenses for each row execute function app.set_updated_at();
create trigger trg_audit_tenant_content_licenses after insert or update or delete on public.tenant_content_licenses for each row execute function app.audit_row_change();
alter table public.tenant_content_licenses enable row level security;
grant select, insert, update, delete on public.tenant_content_licenses to authenticated, service_role;

-- Fahrschule (alle Mitarbeiterrollen) sieht ihre Lizenzen; nur Plattform-Admins schreiben.
create policy tenant_content_licenses_select on public.tenant_content_licenses for select to authenticated
  using (app.is_platform_admin() or (tenant_id = app.current_tenant_id() and app.is_staff()));
create policy tenant_content_licenses_write on public.tenant_content_licenses for all to authenticated
  using (app.is_platform_admin()) with check (app.is_platform_admin());

-- Prüft, ob der aktuelle Mandant die Lizenz p_license_id heute gültig hat.
create or replace function app.has_content_license(p_license_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select p_license_id is not null and exists (
    select 1 from public.tenant_content_licenses l
    where l.tenant_id = app.current_tenant_id()
      and l.license_id = p_license_id
      and l.valid_from <= current_date
      and (l.valid_until is null or l.valid_until >= current_date))
$$;
revoke all on function app.has_content_license(text) from public;
grant execute on function app.has_content_license(text) to authenticated, service_role;

-- Sichtbarkeit der Fragen: wie bisher (veröffentlicht bzw. Redaktionsrechte) und zusätzlich Lizenzprüfung für
-- lizenzierte Fragen. Plattform-Admins sehen alles (Redaktion). Versionen und Antworten hängen über exists() daran.
drop policy if exists theory_questions_select on public.theory_questions;
create policy theory_questions_select on public.theory_questions for select to authenticated using (
  ((tenant_id is null and (status = 'published' or app.is_platform_admin()))
    or (tenant_id = app.current_tenant_id() and (status = 'published' or app.is_admin())))
  and (source <> 'official_licensed' or app.is_platform_admin() or app.has_content_license(license_id_for_source)));

-- Lizenzierte Fragen brauchen immer eine Lizenzkennung, sonst wären sie nie sichtbar.
alter table public.theory_questions add constraint theory_questions_license_id_chk
  check (source <> 'official_licensed' or license_id_for_source is not null);
