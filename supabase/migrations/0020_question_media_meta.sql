-- Bildmedien der Fragen: Alternativtext (Barrierefreiheit) und Quellenangabe.
-- media_path darf ein öffentlicher Pfad der Web-App sein ("/media/questions/…") oder ein Objektpfad im Bucket "content".
alter table public.question_versions
  add column if not exists media_alt text,
  add column if not exists media_credit text;

comment on column public.question_versions.media_path is 'Bild/Video: beginnt mit "/" (öffentliche Datei der Web-App) oder Objektpfad im privaten Bucket content (signierte URL über /api/media).';
comment on column public.question_versions.media_alt is 'Alternativtext für Screenreader; beschreibt die dargestellte Situation vollständig.';
comment on column public.question_versions.media_credit is 'Quellen-/Lizenzangabe des Mediums (z. B. amtliches Werk nach § 5 UrhG).';
