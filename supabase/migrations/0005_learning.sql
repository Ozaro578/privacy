-- 0005: Lernversuche, adaptiver Zustand, Sessions, Prüfungssimulationen, Gamification, Prüfungsreife
create type app.learning_mode as enum ('topic', 'question_list', 'exam', 'random', 'hard', 'wrong', 'bookmarked', 'unseen', 'review', 'weakness', 'daily_goal', 'generated');

create table public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  student_license_id uuid references public.student_licenses(id) on delete set null,
  mode app.learning_mode not null,
  topic_id uuid references public.topics(id),
  client_session_id uuid not null,          -- Idempotenz bei Offline-Sync
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  question_count integer not null default 0,
  correct_count integer not null default 0,
  device text,
  unique (student_id, client_session_id)
);
create index learning_sessions_student_idx on public.learning_sessions(student_id, started_at desc);
create trigger trg_learning_sessions_tenant before insert or update on public.learning_sessions for each row execute function app.enforce_tenant_on_write();

-- Append-only: jeder Versuch mit Antwortzeit, gewählten Antworten, Sicherheit
create table public.student_question_attempts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  question_id uuid not null references public.theory_questions(id),
  question_version_id uuid not null references public.question_versions(id),
  session_id uuid references public.learning_sessions(id) on delete set null,
  exam_simulation_id uuid,                  -- FK unten
  client_attempt_id uuid not null,          -- Idempotenz
  selected_positions smallint[] not null default '{}',
  numeric_answer numeric,
  is_correct boolean not null,
  points smallint not null,
  confidence smallint check (confidence between 1 and 3),   -- 1 unsicher, 2 mittel, 3 sicher
  response_ms integer check (response_ms >= 0),
  answered_at timestamptz not null default now(),
  unique (student_id, client_attempt_id)
);
create index sqa_student_time_idx on public.student_question_attempts(student_id, answered_at desc);
create index sqa_student_question_idx on public.student_question_attempts(student_id, question_id, answered_at desc);
create trigger trg_sqa_tenant before insert or update on public.student_question_attempts for each row execute function app.enforce_tenant_on_write();

-- Verdichteter adaptiver Zustand je Schüler und Frage (Spaced Repetition, Mastery)
create table public.student_question_state (
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  question_id uuid not null references public.theory_questions(id) on delete cascade,
  attempts integer not null default 0,
  correct integer not null default 0,
  consecutive_correct integer not null default 0,
  last_correct boolean,
  last_answered_at timestamptz,
  last_confidence smallint,
  avg_response_ms integer,
  ease numeric(4,2) not null default 2.50,
  interval_days numeric(7,2) not null default 0,
  due_at timestamptz not null default now(),
  mastery numeric(4,3) not null default 0 check (mastery between 0 and 1),
  bookmarked boolean not null default false,
  row_version integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (student_id, question_id)
);
create index sqs_due_idx on public.student_question_state(student_id, due_at);
create index sqs_mastery_idx on public.student_question_state(student_id, mastery);
create trigger trg_sqs_version before update on public.student_question_state for each row execute function app.bump_row_version();
create trigger trg_sqs_tenant before insert or update on public.student_question_state for each row execute function app.enforce_tenant_on_write();

-- Mastery je Thema (aus Versuchen aggregiert; Snapshot für Dashboard und Fahrlehrer)
create table public.student_topic_mastery (
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  mastery numeric(4,3) not null default 0,
  coverage numeric(4,3) not null default 0,      -- Anteil der Fragen des Themas, die mindestens einmal beantwortet wurden
  attempts integer not null default 0,
  correct integer not null default 0,
  recent_error_share numeric(4,3),               -- Anteil der letzten Fehler aus diesem Thema
  updated_at timestamptz not null default now(),
  primary key (student_id, topic_id)
);
create trigger trg_stm_tenant before insert or update on public.student_topic_mastery for each row execute function app.enforce_tenant_on_write();

create table public.exam_simulations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  student_license_id uuid references public.student_licenses(id) on delete set null,
  license_code text not null references public.licenses(code),
  rule_version_id uuid not null references public.rule_versions(id),   -- Regeln zum Zeitpunkt der Simulation (nie rückwirkend ändern)
  rule_snapshot jsonb not null,                                          -- Kopie des Payloads für Rekonstruktion
  client_session_id uuid not null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  time_limit_seconds integer,
  question_ids uuid[] not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'expired', 'abandoned')),
  passed boolean,
  error_points integer,
  correct_count integer,
  wrong_count integer,
  unsure_count integer,
  duration_seconds integer,
  fail_reasons text[] not null default '{}',
  analysis jsonb,                          -- Ergebnisanalyse (Themenfehler, Empfehlungen), vom Server berechnet
  unique (student_id, client_session_id)
);
create index exam_simulations_student_idx on public.exam_simulations(student_id, started_at desc);
create trigger trg_exam_simulations_tenant before insert or update on public.exam_simulations for each row execute function app.enforce_tenant_on_write();
alter table public.student_question_attempts add constraint sqa_exam_fk foreign key (exam_simulation_id) references public.exam_simulations(id) on delete set null;

-- Ergebnis je Frage einer Simulation (Detailansicht, Analyse)
create table public.exam_results (
  id uuid primary key default gen_random_uuid(),
  exam_simulation_id uuid not null references public.exam_simulations(id) on delete cascade,
  question_id uuid not null references public.theory_questions(id),
  question_version_id uuid not null references public.question_versions(id),
  position smallint not null,
  selected_positions smallint[] not null default '{}',
  is_correct boolean,
  points smallint not null,
  marked_unsure boolean not null default false,
  response_ms integer,
  unique (exam_simulation_id, position)
);

-- Prüfungsreife-Snapshots (0-100, Faktoren transparent gespeichert, nie als Garantie)
create table public.readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_license_id uuid not null references public.student_licenses(id) on delete cascade,
  computed_at timestamptz not null default now(),
  theory_score smallint not null check (theory_score between 0 and 100),
  practical_score smallint check (practical_score between 0 and 100),
  overall_score smallint not null check (overall_score between 0 and 100),
  factors jsonb not null,
  engine_version text not null
);
create index readiness_snapshots_idx on public.readiness_snapshots(student_license_id, computed_at desc);
create trigger trg_readiness_tenant before insert or update on public.readiness_snapshots for each row execute function app.enforce_tenant_on_write();

-- Tagesziele und Gamification
create table public.daily_goals (
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  goal_date date not null,
  target_questions integer not null default 20,
  answered integer not null default 0,
  target_minutes integer not null default 15,
  minutes integer not null default 0,
  achieved boolean not null default false,
  primary key (student_id, goal_date)
);
create trigger trg_daily_goals_tenant before insert or update on public.daily_goals for each row execute function app.enforce_tenant_on_write();

create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  kind text not null,                       -- question_correct, session_completed, exam_passed, lesson_completed, streak_day
  xp integer not null check (xp >= 0),
  ref_id uuid,
  client_event_id uuid not null,
  created_at timestamptz not null default now(),
  unique (student_id, client_event_id)
);
create index xp_events_student_idx on public.xp_events(student_id, created_at desc);
create trigger trg_xp_events_tenant before insert or update on public.xp_events for each row execute function app.enforce_tenant_on_write();

create table public.badges (
  code text primary key,
  name_i18n jsonb not null,
  description_i18n jsonb not null,
  icon text not null,
  criteria jsonb not null                   -- {"type":"streak_days","value":7}
);

create table public.student_badges (
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  badge_code text not null references public.badges(code),
  earned_at timestamptz not null default now(),
  primary key (student_id, badge_code)
);
create trigger trg_student_badges_tenant before insert or update on public.student_badges for each row execute function app.enforce_tenant_on_write();

create table public.student_streaks (
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_id uuid primary key references public.students(id) on delete cascade,
  current_days integer not null default 0,
  longest_days integer not null default 0,
  last_active_date date,
  total_xp integer not null default 0,
  level integer not null default 1,
  updated_at timestamptz not null default now()
);
create trigger trg_student_streaks_tenant before insert or update on public.student_streaks for each row execute function app.enforce_tenant_on_write();

-- KI-Coach-Dialoge (serverseitig erzeugt; Antworten tragen Quellen und Sicherheitsstufe)
create table public.coach_conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.driving_schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  context_kind text check (context_kind in ('question', 'topic', 'practical', 'photo', 'free')),
  context_ref uuid,
  locale text not null default 'de',
  created_at timestamptz not null default now()
);
create index coach_conversations_student_idx on public.coach_conversations(student_id, created_at desc);
create trigger trg_coach_conversations_tenant before insert or update on public.coach_conversations for each row execute function app.enforce_tenant_on_write();

create table public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.coach_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  style text check (style in ('simple', 'detailed', 'example', 'mnemonic')),
  sources jsonb not null default '[]'::jsonb,    -- [{"knowledge_entry_id":..., "title":..., "legal_reference":...}]
  confidence text check (confidence in ('verified', 'partial', 'uncertain')),
  model text,
  input_tokens integer,
  output_tokens integer,
  created_at timestamptz not null default now()
);
create index coach_messages_conv_idx on public.coach_messages(conversation_id, created_at);
