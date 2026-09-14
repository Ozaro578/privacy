-- 0003: Fahrerlaubnisklassen, Schüler-Ausbildungen, versionierte Regel-Engine
create table public.licenses (
  code text primary key,                       -- B, B197, B78, BE, A, A1, A2, AM, C, CE, C1, C1E, D, DE, D1, D1E
  name text not null,
  base_class text references public.licenses(code),  -- B197/B78 sind Varianten von B
  vehicle_category text not null check (vehicle_category in ('car', 'motorcycle', 'moped', 'truck', 'bus', 'trailer')),
  min_age_years integer,
  requires_theory_exam boolean not null default true,
  requires_practical_exam boolean not null default true,
  sort_order integer not null default 0,
  active boolean not null default true
);

-- Regeltypen: Prüfungsregeln, Ausbildungsanforderungen, Theorieunterricht, Stornierung (Tenant-Default), Gebühren
create type app.rule_type as enum ('exam_theory', 'exam_practical', 'training_requirements', 'theory_lessons');
create type app.review_status as enum ('draft', 'in_review', 'approved', 'published', 'retired', 'needs_verification');

create table public.rule_versions (
  id uuid primary key default gen_random_uuid(),
  rule_type app.rule_type not null,
  license_code text references public.licenses(code),
  acquisition_kind text not null default 'first' check (acquisition_kind in ('first', 'extension', 'any')),
  version integer not null,
  valid_from date not null,
  valid_until date,
  payload jsonb not null,
  source text not null,                 -- Rechtsquelle, z. B. "FeV Anlage 7, FahrschAusbO Anlage"
  legal_basis_date date,                -- Rechtsstand
  review_status app.review_status not null default 'draft',
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  created_by uuid references public.users(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rule_type, license_code, acquisition_kind, version),
  check (valid_until is null or valid_until >= valid_from)
);
-- Keine überlappenden Gültigkeitsbereiche für veröffentlichte Versionen desselben Regelschlüssels
alter table public.rule_versions add constraint rule_versions_no_overlap
  exclude using gist (
    rule_type with =,
    coalesce(license_code, '') with =,
    acquisition_kind with =,
    daterange(valid_from, coalesce(valid_until, 'infinity'::date), '[]') with &&
  ) where (review_status = 'published');
create index rule_versions_lookup_idx on public.rule_versions(rule_type, license_code, acquisition_kind, valid_from desc);
create trigger trg_rule_versions_updated before update on public.rule_versions for each row execute function app.set_updated_at();

-- Liefert die am Stichtag gültige veröffentlichte Regelversion (Fallback: acquisition_kind = 'any')
create or replace function app.rule_version_for(p_rule_type app.rule_type, p_license_code text, p_acquisition text, p_on date default current_date)
returns public.rule_versions language sql stable as $$
  select rv.* from public.rule_versions rv
  where rv.rule_type = p_rule_type
    and rv.license_code is not distinct from p_license_code
    and rv.acquisition_kind in (p_acquisition, 'any')
    and rv.review_status = 'published'
    and rv.valid_from <= p_on and (rv.valid_until is null or rv.valid_until >= p_on)
  order by case when rv.acquisition_kind = p_acquisition then 0 else 1 end, rv.version desc
  limit 1
$$;

create type app.exam_status as enum ('not_ready', 'awaiting_instructor_release', 'ready', 'requested', 'scheduled', 'passed', 'failed', 'cancelled');

-- Eine Ausbildung = Schüler + Klasse (Mehrfachausbildungen möglich, z. B. B und A1)
create table public.student_licenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  license_code text not null references public.licenses(code),
  acquisition_kind text not null default 'first' check (acquisition_kind in ('first', 'extension')),
  transmission text not null default 'manual' check (transmission in ('manual', 'automatic')),
  accompanied_driving boolean not null default false,        -- BF17
  existing_license_codes text[] not null default '{}',
  primary_instructor_id uuid references public.instructors(id) on delete set null,
  contract_id uuid,                                           -- FK wird in 0007 gesetzt
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  started_at date not null default current_date,
  theory_exam_status app.exam_status not null default 'not_ready',
  practical_exam_status app.exam_status not null default 'not_ready',
  theory_exam_passed_at date,
  practical_exam_passed_at date,
  training_rule_version_id uuid references public.rule_versions(id),
  theory_lessons_rule_version_id uuid references public.rule_versions(id),
  row_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, license_code)
);
create index student_licenses_tenant_idx on public.student_licenses(tenant_id, status);
create index student_licenses_student_idx on public.student_licenses(student_id);
create trigger trg_student_licenses_version before update on public.student_licenses for each row execute function app.bump_row_version();
create trigger trg_student_licenses_tenant before insert or update on public.student_licenses for each row execute function app.enforce_tenant_on_write();
