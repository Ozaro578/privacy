-- 0004: Lerninhalte (Themen, Fragen mit Versionierung, Antworten, Wissensbasis) mit Freigabe-Workflow
create type app.content_source as enum ('own', 'official_licensed', 'tenant');

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.driving_schools(id) on delete cascade,  -- NULL = global
  code text not null,                       -- z. B. "vorfahrt", "geschwindigkeit"
  parent_id uuid references public.topics(id) on delete set null,
  name_i18n jsonb not null,                 -- {"de": "Vorfahrt", "en": "Right of way"}
  description_i18n jsonb not null default '{}'::jsonb,
  material_kind text not null default 'basic' check (material_kind in ('basic', 'class_specific')), -- Grundstoff / Zusatzstoff
  license_codes text[] not null default '{}',   -- leer = alle Klassen
  practical_skill_code text,                    -- Kopplung Theorie <-> Praxis (skills.code)
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index topics_code_global_idx on public.topics(code) where tenant_id is null;
create unique index topics_code_tenant_idx on public.topics(tenant_id, code) where tenant_id is not null;
create trigger trg_topics_updated before update on public.topics for each row execute function app.set_updated_at();

-- Frage = stabile Identität; Inhalte liegen in question_versions
create table public.theory_questions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.driving_schools(id) on delete cascade,  -- NULL = global
  external_ref text,                        -- z. B. amtliche Fragennummer bei lizenziertem Katalog
  source app.content_source not null default 'own',
  license_id_for_source text,               -- Lizenzkennung des Katalogs (nur official_licensed)
  topic_id uuid not null references public.topics(id),
  material_kind text not null default 'basic' check (material_kind in ('basic', 'class_specific')),
  license_codes text[] not null default '{}',   -- leer = alle Klassen des Materials
  points smallint not null check (points between 1 and 5),
  difficulty numeric(3,2) not null default 0.50 check (difficulty between 0 and 1),
  question_kind text not null default 'multiple_choice' check (question_kind in ('multiple_choice', 'numeric', 'video')),
  status app.review_status not null default 'draft',
  current_version_id uuid,                  -- FK weiter unten
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index theory_questions_topic_idx on public.theory_questions(topic_id) where status = 'published';
create index theory_questions_source_idx on public.theory_questions(source, status);
create index theory_questions_classes_idx on public.theory_questions using gin(license_codes);
create trigger trg_theory_questions_updated before update on public.theory_questions for each row execute function app.set_updated_at();

create table public.question_versions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.theory_questions(id) on delete cascade,
  version integer not null,
  locale text not null default 'de',
  text text not null,
  media_path text,                          -- Bild/Video im Storage
  media_kind text check (media_kind in ('image', 'video')),
  explanation text,                         -- geprüfte Erklärung (Quelle für Warum-Button)
  mnemonic text,                            -- Merksatz
  legal_reference text,                     -- z. B. "§ 8 StVO"
  legal_basis_date date,
  numeric_answer numeric,
  numeric_tolerance numeric,
  valid_from date not null default current_date,
  valid_until date,
  review_status app.review_status not null default 'draft',
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  source_note text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, version, locale)
);
create index question_versions_question_idx on public.question_versions(question_id, locale, version desc);
create trigger trg_question_versions_updated before update on public.question_versions for each row execute function app.set_updated_at();
alter table public.theory_questions add constraint theory_questions_current_version_fk
  foreign key (current_version_id) references public.question_versions(id) deferrable initially deferred;

create table public.question_answers (
  id uuid primary key default gen_random_uuid(),
  question_version_id uuid not null references public.question_versions(id) on delete cascade,
  position smallint not null check (position between 1 and 6),
  text text not null,
  is_correct boolean not null,
  explanation text,                         -- warum diese Antwort richtig/falsch ist
  unique (question_version_id, position)
);

-- Geprüfte Wissensbasis für den KI-Coach (Source of Truth). Jeder Eintrag ist versioniert und quellenbelegt.
create table public.knowledge_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.driving_schools(id) on delete cascade,  -- NULL = global
  slug text not null,
  topic_id uuid references public.topics(id) on delete set null,
  title text not null,
  locale text not null default 'de',
  body_markdown text not null,
  summary text,
  legal_reference text,
  legal_basis_date date not null,
  license_codes text[] not null default '{}',
  version integer not null default 1,
  valid_from date not null default current_date,
  valid_until date,
  review_status app.review_status not null default 'draft',
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  source text not null,
  search_vector tsvector generated always as (to_tsvector('german', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(body_markdown, ''))) stored,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, locale, version)
);
create index knowledge_entries_search_idx on public.knowledge_entries using gin(search_vector);
create index knowledge_entries_topic_idx on public.knowledge_entries(topic_id) where review_status = 'published';
create trigger trg_knowledge_entries_updated before update on public.knowledge_entries for each row execute function app.set_updated_at();

-- Lernkapitel (Lesestoff je Thema und Klasse) für "Lernen nach Themen"
create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.driving_schools(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  locale text not null default 'de',
  title text not null,
  body_markdown text not null,
  estimated_minutes integer not null default 10,
  license_codes text[] not null default '{}',
  version integer not null default 1,
  valid_from date not null default current_date,
  valid_until date,
  review_status app.review_status not null default 'draft',
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  source text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index chapters_topic_idx on public.chapters(topic_id, locale) where review_status = 'published';
create trigger trg_chapters_updated before update on public.chapters for each row execute function app.set_updated_at();

-- Prüfer-Fragen für die praktische Prüfung (Sicherheitskontrollen, Fahrzeugtechnik) mit Musterantwort-Stichpunkten
create table public.practical_check_questions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.driving_schools(id) on delete cascade,
  category text not null check (category in ('lighting', 'tires', 'brakes', 'fluids', 'warning_lights', 'steering', 'safety_equipment', 'general')),
  license_codes text[] not null default '{}',
  locale text not null default 'de',
  question text not null,
  expected_points text[] not null,           -- Stichpunkte, die eine vollständige Antwort enthalten muss
  explanation text,
  source text,
  review_status app.review_status not null default 'draft',
  legal_basis_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_practical_check_questions_updated before update on public.practical_check_questions for each row execute function app.set_updated_at();

-- Vollständiger Änderungsverlauf freigegebener Inhalte (Source-of-Truth-Workflow)
create table public.content_reviews (
  id uuid primary key default gen_random_uuid(),
  entity_table text not null,
  entity_id uuid not null,
  from_status app.review_status,
  to_status app.review_status not null,
  reviewer_id uuid references public.users(id),
  comment text,
  created_at timestamptz not null default now()
);
create index content_reviews_entity_idx on public.content_reviews(entity_table, entity_id, created_at desc);
