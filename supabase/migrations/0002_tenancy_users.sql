-- 0002: Tenants (Fahrschulen), Standorte, Nutzerprofile, Mitgliedschaften, Schüler, Fahrlehrer, Fahrzeuge
create table public.driving_schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext not null unique,
  legal_name text,
  tax_id text,
  vat_id text,
  email citext,
  phone text,
  website text,
  address_line1 text,
  address_line2 text,
  postal_code text,
  city text,
  country_code char(2) not null default 'DE',
  timezone text not null default 'Europe/Berlin',
  default_locale text not null default 'de',
  supported_locales text[] not null default array['de'],
  invoice_number_prefix text not null default 'RE',
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('trial', 'active', 'suspended', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_driving_schools_updated before update on public.driving_schools for each row execute function app.set_updated_at();

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  name text not null,
  address_line1 text,
  postal_code text,
  city text,
  latitude double precision,
  longitude double precision,
  phone text,
  email citext,
  opening_hours jsonb not null default '{}'::jsonb,
  is_primary boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index locations_tenant_idx on public.locations(tenant_id);
create trigger trg_locations_updated before update on public.locations for each row execute function app.set_updated_at();
create trigger trg_locations_tenant before insert or update on public.locations for each row execute function app.enforce_tenant_on_write();

-- Profil zu auth.users (1:1). Enthält keine sicherheitskritischen Daten.
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null,
  first_name text not null default '',
  last_name text not null default '',
  phone text,
  locale text not null default 'de',
  avatar_path text,
  is_platform_admin boolean not null default false,
  accessibility jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_users_updated before update on public.users for each row execute function app.set_updated_at();

-- Ein Nutzer kann in mehreren Fahrschulen Mitglied sein (z. B. freie Fahrlehrer). Genau eine Rolle je Tenant.
create table public.tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role app.tenant_role not null,
  status text not null default 'active' check (status in ('invited', 'active', 'disabled')),
  invited_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);
create index tenant_memberships_user_idx on public.tenant_memberships(user_id);
create trigger trg_memberships_updated before update on public.tenant_memberships for each row execute function app.set_updated_at();
create trigger trg_memberships_tenant before insert or update on public.tenant_memberships for each row execute function app.enforce_tenant_on_write();

create table public.students (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  student_number text,
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  email citext,
  phone text,
  address_line1 text,
  postal_code text,
  city text,
  preferred_locale text not null default 'de',
  guardian_name text,
  guardian_email citext,
  guardian_phone text,
  status text not null default 'lead' check (status in ('lead', 'registered', 'active', 'paused', 'completed', 'cancelled')),
  onboarding_completed_at timestamptz,
  notes_internal text,
  row_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, student_number),
  unique (tenant_id, user_id)
);
create index students_tenant_status_idx on public.students(tenant_id, status);
create index students_tenant_name_idx on public.students(tenant_id, last_name, first_name);
create trigger trg_students_version before update on public.students for each row execute function app.bump_row_version();
create trigger trg_students_tenant before insert or update on public.students for each row execute function app.enforce_tenant_on_write();

create table public.instructors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  display_name text not null,
  license_classes text[] not null default '{}',      -- Fahrlehrerlaubnis je Klasse (z. B. {BE,A,CE})
  teaches_theory boolean not null default true,
  teaches_automatic boolean not null default true,
  teaches_manual boolean not null default true,
  color text,
  lesson_default_minutes integer not null default 45 check (lesson_default_minutes between 30 and 180),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);
create index instructors_tenant_idx on public.instructors(tenant_id) where active;
create trigger trg_instructors_updated before update on public.instructors for each row execute function app.set_updated_at();
create trigger trg_instructors_tenant before insert or update on public.instructors for each row execute function app.enforce_tenant_on_write();

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  license_plate text not null,
  make text,
  model text,
  transmission text not null check (transmission in ('manual', 'automatic')),
  license_classes text[] not null default '{}',
  mileage_km integer check (mileage_km >= 0),
  status text not null default 'active' check (status in ('active', 'maintenance', 'inactive')),
  next_inspection_due date,          -- HU
  next_service_due date,             -- Wartung
  next_service_km integer,
  tire_set text,                     -- z. B. "Winter 2026"
  tire_change_due date,
  insurance_provider text,
  insurance_policy_number text,
  insurance_renewal_due date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, license_plate)
);
create index vehicles_tenant_idx on public.vehicles(tenant_id, status);
create trigger trg_vehicles_updated before update on public.vehicles for each row execute function app.set_updated_at();
create trigger trg_vehicles_tenant before insert or update on public.vehicles for each row execute function app.enforce_tenant_on_write();

-- Helfer: Student-ID des angemeldeten Schülers im aktuellen Tenant
create or replace function app.current_student_id() returns uuid
language sql stable security definer set search_path = public as $$
  select s.id from public.students s
  where s.tenant_id = app.current_tenant_id() and s.user_id = auth.uid()
  limit 1
$$;

create or replace function app.current_instructor_id() returns uuid
language sql stable security definer set search_path = public as $$
  select i.id from public.instructors i
  where i.tenant_id = app.current_tenant_id() and i.user_id = auth.uid()
  limit 1
$$;
