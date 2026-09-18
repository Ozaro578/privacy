-- 0016: Schlagwörter (Tags) an Theoriefragen, z. B. "rechts_vor_links", "bremsweg", "innerorts" (additiv, idempotent).
alter table public.theory_questions add column if not exists tags text[] not null default '{}';
create index if not exists theory_questions_tags_idx on public.theory_questions using gin(tags);
