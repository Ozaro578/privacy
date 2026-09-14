-- 0006: Kompetenzen, Verfügbarkeiten, Fahrstunden (überschneidungsfrei), Buchungen, Bewertungen, Warteliste,
--       Theorieunterricht mit Anwesenheit, Mock-Prüfungen, Prüfungen, Stornierungsregeln
create table public.skills (
  code text primary key,                    -- vehicle_handling, observation, speed, turning, right_of_way, lane_change, parking, motorway, ...
  name_i18n jsonb not null,
  category text not null check (category in ('basic_tasks', 'traffic', 'special_drives', 'eco', 'independent')),
  license_codes text[] not null default '{}',
  sort_order integer not null default 0,
  active boolean not null default true
);

-- Bewertungsverlauf je Schüler und Kompetenz (append-only; aktueller Stand = letzter Eintrag oder gewichteter Mittelwert)
create table public.student_skill_scores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_license_id uuid not null references public.student_licenses(id) on delete cascade,
  skill_code text not null references public.skills(code),
  lesson_id uuid,                            -- FK unten
  instructor_id uuid references public.instructors(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  rated_at timestamptz not null default now()
);
create index sss_license_skill_idx on public.student_skill_scores(student_license_id, skill_code, rated_at desc);
create trigger trg_sss_tenant before insert or update on public.student_skill_scores for each row execute function app.enforce_tenant_on_write();

-- Wöchentliche Arbeitszeiten je Fahrlehrer (weekday 1 = Montag), inkl. Pausen als eigene Zeilen mit kind = 'break'
create table public.instructor_availability (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  instructor_id uuid not null references public.instructors(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  start_time time not null,
  end_time time not null,
  kind text not null default 'work' check (kind in ('work', 'break')),
  location_id uuid references public.locations(id) on delete set null,
  valid_from date not null default current_date,
  valid_until date,
  check (end_time > start_time)
);
create index instructor_availability_idx on public.instructor_availability(instructor_id, weekday);
create trigger trg_instructor_availability_tenant before insert or update on public.instructor_availability for each row execute function app.enforce_tenant_on_write();

-- Abwesenheiten (Urlaub, Krankheit, Fortbildung) und Fahrzeug-Sperrzeiten
create table public.instructor_absences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  instructor_id uuid not null references public.instructors(id) on delete cascade,
  period tstzrange not null,
  reason text not null default 'vacation' check (reason in ('vacation', 'sick', 'training', 'other')),
  note text,
  created_at timestamptz not null default now(),
  exclude using gist (instructor_id with =, period with &&)
);
create trigger trg_instructor_absences_tenant before insert or update on public.instructor_absences for each row execute function app.enforce_tenant_on_write();

create table public.vehicle_blocks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  period tstzrange not null,
  reason text not null default 'maintenance',
  note text,
  exclude using gist (vehicle_id with =, period with &&)
);
create trigger trg_vehicle_blocks_tenant before insert or update on public.vehicle_blocks for each row execute function app.enforce_tenant_on_write();

create type app.lesson_kind as enum ('practice', 'overland', 'motorway', 'night', 'special', 'exam_prep', 'practical_exam', 'manual_conversion', 'trailer');
create type app.lesson_status as enum ('open', 'booked', 'confirmed', 'completed', 'no_show', 'cancelled');

-- Fahrstunde bzw. freier Slot (student_id NULL = buchbarer Slot). Überschneidungen werden in der DB verhindert.
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  instructor_id uuid not null references public.instructors(id),
  vehicle_id uuid references public.vehicles(id) on delete set null,
  student_id uuid references public.students(id) on delete set null,
  student_license_id uuid references public.student_licenses(id) on delete set null,
  kind app.lesson_kind not null default 'practice',
  status app.lesson_status not null default 'open',
  period tstzrange not null,
  units smallint not null default 1 check (units between 1 and 4),   -- Anzahl 45-Minuten-Einheiten
  transmission text check (transmission in ('manual', 'automatic')),
  license_codes text[] not null default '{}',                          -- welche Klassen der Slot bedient
  meeting_point text,
  price_cents integer check (price_cents >= 0),
  notes_internal text,
  completed_at timestamptz,
  row_version integer not null default 1,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (upper(period) > lower(period)),
  check (status <> 'booked' or student_id is not null),
  exclude using gist (instructor_id with =, period with &&) where (status <> 'cancelled'),
  exclude using gist (vehicle_id with =, period with &&) where (status <> 'cancelled' and vehicle_id is not null),
  exclude using gist (student_id with =, period with &&) where (status <> 'cancelled' and student_id is not null)
);
create index lessons_tenant_period_idx on public.lessons using gist (tenant_id, period);
create index lessons_instructor_period_idx on public.lessons(instructor_id, lower(period));
create index lessons_student_idx on public.lessons(student_id, lower(period) desc) where student_id is not null;
create index lessons_open_idx on public.lessons(tenant_id, lower(period)) where status = 'open';
create trigger trg_lessons_version before update on public.lessons for each row execute function app.bump_row_version();
create trigger trg_lessons_tenant before insert or update on public.lessons for each row execute function app.enforce_tenant_on_write();
alter table public.student_skill_scores add constraint sss_lesson_fk foreign key (lesson_id) references public.lessons(id) on delete set null;

-- Stornierungsregeln je Fahrschule (konfigurierbar, versioniert über valid_from)
create table public.cancellation_policies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  name text not null,
  free_cancellation_hours integer not null default 24 check (free_cancellation_hours >= 0),
  late_fee_percent numeric(5,2) check (late_fee_percent between 0 and 100),
  late_fee_fixed_cents integer check (late_fee_fixed_cents >= 0),
  no_show_fee_percent numeric(5,2) check (no_show_fee_percent between 0 and 100),
  contract_clause_reference text,           -- Verweis auf Vertrags-/AGB-Klausel
  valid_from date not null default current_date,
  valid_until date,
  created_at timestamptz not null default now()
);
create index cancellation_policies_tenant_idx on public.cancellation_policies(tenant_id, valid_from desc);
create trigger trg_cancellation_policies_tenant before insert or update on public.cancellation_policies for each row execute function app.enforce_tenant_on_write();

-- Buchungsvorgänge als Historie (Anfrage, Bestätigung, Stornierung mit Regelgrundlage)
create table public.lesson_bookings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  student_license_id uuid references public.student_licenses(id) on delete set null,
  action text not null check (action in ('requested', 'confirmed', 'rejected', 'cancelled_by_student', 'cancelled_by_school', 'rescheduled', 'no_show')),
  acted_by uuid references public.users(id),
  acted_at timestamptz not null default now(),
  hours_before_start numeric(8,2),
  policy_id uuid references public.cancellation_policies(id),
  fee_cents integer check (fee_cents >= 0),
  fee_reason text,
  client_request_id uuid,
  note text,
  unique (lesson_id, client_request_id)
);
create index lesson_bookings_lesson_idx on public.lesson_bookings(lesson_id, acted_at desc);
create index lesson_bookings_student_idx on public.lesson_bookings(student_id, acted_at desc);
create trigger trg_lesson_bookings_tenant before insert or update on public.lesson_bookings for each row execute function app.enforce_tenant_on_write();

-- Warteliste: Wünsche je Schüler (Zeitfenster, Fahrlehrer, Getriebe); Benachrichtigung bei frei gewordenen Slots
create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  student_license_id uuid references public.student_licenses(id) on delete set null,
  instructor_id uuid references public.instructors(id) on delete set null,
  transmission text check (transmission in ('manual', 'automatic')),
  earliest timestamptz not null,
  latest timestamptz not null,
  weekdays smallint[] not null default '{1,2,3,4,5,6,7}',
  time_from time,
  time_to time,
  strategy text not null default 'first_come' check (strategy in ('first_come', 'priority')),
  status text not null default 'active' check (status in ('active', 'offered', 'fulfilled', 'expired', 'cancelled')),
  created_at timestamptz not null default now(),
  check (latest > earliest)
);
create index waitlist_entries_tenant_idx on public.waitlist_entries(tenant_id, status);
create trigger trg_waitlist_entries_tenant before insert or update on public.waitlist_entries for each row execute function app.enforce_tenant_on_write();

create table public.waitlist_offers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  waitlist_entry_id uuid not null references public.waitlist_entries(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  offered_at timestamptz not null default now(),
  expires_at timestamptz not null,
  response text check (response in ('accepted', 'declined', 'expired')),
  responded_at timestamptz,
  unique (waitlist_entry_id, lesson_id)
);
create trigger trg_waitlist_offers_tenant before insert or update on public.waitlist_offers for each row execute function app.enforce_tenant_on_write();

-- Dokumentation nach der Fahrstunde (Inhalte, Sterne je Kompetenz, Kommentar, KI-Entwurf mit Bestätigung)
create table public.lesson_evaluations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  lesson_id uuid not null unique references public.lessons(id) on delete cascade,
  student_license_id uuid not null references public.student_licenses(id) on delete cascade,
  instructor_id uuid not null references public.instructors(id),
  contents text[] not null default '{}',          -- gefahrene Ausbildungsinhalte (skills.code oder freie Tags)
  comment text,
  next_goals text[] not null default '{}',
  overall_rating smallint check (overall_rating between 1 and 5),
  ai_draft jsonb,                                 -- strukturierter KI-Entwurf aus Sprachnotiz
  ai_transcript text,
  ai_draft_model text,
  ai_confirmed boolean not null default false,    -- Fahrlehrer hat KI-Entwurf geprüft und übernommen
  confirmed_at timestamptz,
  shared_with_student boolean not null default true,
  row_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lesson_evaluations_license_idx on public.lesson_evaluations(student_license_id, created_at desc);
create trigger trg_lesson_evaluations_version before update on public.lesson_evaluations for each row execute function app.bump_row_version();
create trigger trg_lesson_evaluations_tenant before insert or update on public.lesson_evaluations for each row execute function app.enforce_tenant_on_write();

-- Theorieunterricht: Einheit (Lektion) an einem Termin, mit QR-Check-in
create table public.theory_classes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  instructor_id uuid references public.instructors(id) on delete set null,
  lesson_unit_code text not null,                 -- z. B. "G1".."G12" Grundstoff, "B1","B2" Zusatzstoff Klasse B
  material_kind text not null check (material_kind in ('basic', 'class_specific')),
  license_codes text[] not null default '{}',
  title text not null,
  period tstzrange not null,
  capacity integer check (capacity > 0),
  status text not null default 'planned' check (status in ('planned', 'running', 'completed', 'cancelled')),
  is_online boolean not null default false,
  created_at timestamptz not null default now(),
  check (upper(period) > lower(period))
);
create index theory_classes_tenant_period_idx on public.theory_classes(tenant_id, lower(period));
create trigger trg_theory_classes_tenant before insert or update on public.theory_classes for each row execute function app.enforce_tenant_on_write();

-- Rotierende Check-in-Codes (kurzlebig, an Unterricht und Zeitfenster gebunden; Geheimnis bleibt serverseitig)
create table public.theory_class_checkin_tokens (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  theory_class_id uuid not null references public.theory_classes(id) on delete cascade,
  token_hash text not null unique,
  valid_from timestamptz not null default now(),
  valid_until timestamptz not null,
  max_uses integer,
  uses integer not null default 0,
  created_by uuid references public.users(id)
);
create index theory_class_tokens_class_idx on public.theory_class_checkin_tokens(theory_class_id, valid_until desc);
create trigger trg_theory_class_tokens_tenant before insert or update on public.theory_class_checkin_tokens for each row execute function app.enforce_tenant_on_write();

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  theory_class_id uuid not null references public.theory_classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  student_license_id uuid references public.student_licenses(id) on delete set null,
  status text not null default 'present' check (status in ('registered', 'present', 'absent', 'excused')),
  check_in_method text check (check_in_method in ('qr', 'manual', 'online')),
  checked_in_at timestamptz,
  checked_in_by uuid references public.users(id),
  device_fingerprint text,
  geo_distance_m integer,
  unique (theory_class_id, student_id)
);
create index attendance_student_idx on public.attendance(student_id);
create trigger trg_attendance_tenant before insert or update on public.attendance for each row execute function app.enforce_tenant_on_write();

-- Simulierte praktische Prüfung durch Fahrlehrer mit Ereignismarkierung
create table public.mock_exams (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_license_id uuid not null references public.student_licenses(id) on delete cascade,
  instructor_id uuid not null references public.instructors(id),
  lesson_id uuid references public.lessons(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  overall_score smallint check (overall_score between 0 and 100),
  strengths text[] not null default '{}',
  improvements text[] not null default '{}',
  summary text,
  status text not null default 'running' check (status in ('running', 'completed', 'aborted'))
);
create index mock_exams_license_idx on public.mock_exams(student_license_id, started_at desc);
create trigger trg_mock_exams_tenant before insert or update on public.mock_exams for each row execute function app.enforce_tenant_on_write();

create table public.mock_exam_events (
  id uuid primary key default gen_random_uuid(),
  mock_exam_id uuid not null references public.mock_exams(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  skill_code text references public.skills(code),
  polarity text not null check (polarity in ('positive', 'negative')),
  severity smallint not null default 1 check (severity between 1 and 3),
  label text not null,
  note text
);
create index mock_exam_events_idx on public.mock_exam_events(mock_exam_id, occurred_at);

-- Offizielle Prüfungen (Termine und Ergebnisse) mit Statusworkflow
create table public.theory_exams (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_license_id uuid not null references public.student_licenses(id) on delete cascade,
  status app.exam_status not null default 'not_ready',
  released_by uuid references public.instructors(id),
  released_at timestamptz,
  scheduled_at timestamptz,
  examining_body text,                            -- TÜV / DEKRA (Prüforganisation)
  location_text text,
  language_code text,                             -- Prüfungssprache (nur zugelassene, konfigurierbar)
  attempt_no smallint not null default 1,
  result text check (result in ('passed', 'failed')),
  error_points integer,
  result_at timestamptz,
  rule_version_id uuid references public.rule_versions(id),
  fee_invoice_item_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index theory_exams_license_idx on public.theory_exams(student_license_id, attempt_no);
create trigger trg_theory_exams_updated before update on public.theory_exams for each row execute function app.set_updated_at();
create trigger trg_theory_exams_tenant before insert or update on public.theory_exams for each row execute function app.enforce_tenant_on_write();

create table public.practical_exams (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_license_id uuid not null references public.student_licenses(id) on delete cascade,
  status app.exam_status not null default 'not_ready',
  released_by uuid references public.instructors(id),
  released_at timestamptz,
  scheduled_at timestamptz,
  instructor_id uuid references public.instructors(id),
  vehicle_id uuid references public.vehicles(id),
  examining_body text,
  meeting_point text,
  attempt_no smallint not null default 1,
  result text check (result in ('passed', 'failed')),
  result_at timestamptz,
  examiner_feedback text,
  rule_version_id uuid references public.rule_versions(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index practical_exams_license_idx on public.practical_exams(student_license_id, attempt_no);
create trigger trg_practical_exams_updated before update on public.practical_exams for each row execute function app.set_updated_at();
create trigger trg_practical_exams_tenant before insert or update on public.practical_exams for each row execute function app.enforce_tenant_on_write();
