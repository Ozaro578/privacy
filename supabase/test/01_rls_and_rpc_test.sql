-- Integrationstests gegen die lokale Datenbank: Tenant-Isolation, Rollen, Überschneidungen, Buchung, Storno, Check-in, Rechnungen.
-- Jeder Block bricht mit einer Exception ab, wenn eine Erwartung verletzt ist.
\set ON_ERROR_STOP on
begin;

-- Testdaten (als Superuser, RLS wird umgangen)
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 's1@test.de'),
  ('00000000-0000-0000-0000-000000000002', 'i1@test.de'),
  ('00000000-0000-0000-0000-000000000003', 'o1@test.de'),
  ('00000000-0000-0000-0000-000000000004', 's2@test.de'),
  ('00000000-0000-0000-0000-000000000005', 'i2@test.de');
insert into public.users (id, email, first_name, last_name) values
  ('00000000-0000-0000-0000-000000000001', 's1@test.de', 'Lisa', 'Schüler'),
  ('00000000-0000-0000-0000-000000000002', 'i1@test.de', 'Max', 'Lehrer'),
  ('00000000-0000-0000-0000-000000000003', 'o1@test.de', 'Olga', 'Büro'),
  ('00000000-0000-0000-0000-000000000004', 's2@test.de', 'Sam', 'Fremd'),
  ('00000000-0000-0000-0000-000000000005', 'i2@test.de', 'Ina', 'Lehrerin')
  on conflict (id) do update set first_name = excluded.first_name, last_name = excluded.last_name;
insert into public.driving_schools (id, name, slug) values
  ('10000000-0000-0000-0000-000000000001', 'Fahrschule Nord', 'nord'),
  ('10000000-0000-0000-0000-000000000002', 'Fahrschule Süd', 'sued');
insert into public.tenant_memberships (tenant_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'student'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'instructor'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'office'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'instructor'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'student');
insert into public.students (id, tenant_id, user_id, first_name, last_name, status) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Lisa', 'Schüler', 'active'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'Sam', 'Fremd', 'active');
insert into public.instructors (id, tenant_id, user_id, display_name, license_classes) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Max Lehrer', '{B,BE}'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'Ina Lehrerin', '{A}');
insert into public.vehicles (id, tenant_id, license_plate, transmission, license_classes) values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'HH-FS 1', 'manual', '{B}');
insert into public.student_licenses (id, tenant_id, student_id, license_code, transmission) values
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'B', 'manual'),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'B', 'manual');
insert into public.cancellation_policies (tenant_id, name, free_cancellation_hours, late_fee_percent, contract_clause_reference) values
  ('10000000-0000-0000-0000-000000000001', 'Standard', 24, 50, 'Ausbildungsvertrag § 6');
insert into public.lessons (id, tenant_id, instructor_id, vehicle_id, kind, status, period, transmission, license_codes, price_cents) values
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'practice', 'open', tstzrange(date_trunc('day', now()) + interval '2 days 9 hours', date_trunc('day', now()) + interval '2 days 9 hours 45 minutes'), 'manual', '{B}', 6000),
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', null, 'practice', 'open', tstzrange(now() + interval '3 hours', now() + interval '3 hours 45 minutes'), 'manual', '{B}', 6000),
  ('60000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', null, 'practice', 'open', tstzrange(date_trunc('day', now()) + interval '4 days 9 hours', date_trunc('day', now()) + interval '4 days 9 hours 45 minutes'), 'manual', '{A}', 6000);

-- Testfrage (global)
insert into public.theory_questions (id, topic_id, material_kind, points, status) values ('b0000000-0000-0000-0000-000000000001', (select id from public.topics where code = 'vorfahrt'), 'basic', 5, 'published');
insert into public.question_versions (id, question_id, version, text, explanation, review_status) values ('b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 1, 'Testfrage', 'Erklärung', 'published');
update public.theory_questions set current_version_id = 'b0000000-0000-0000-0000-000000000002' where id = 'b0000000-0000-0000-0000-000000000001';

-- Helfer zum Einnehmen einer Identität
create or replace function pg_temp.login(p_user uuid, p_tenant uuid, p_role text, p_platform boolean default false) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated',
    'app_metadata', json_build_object('tenant_id', p_tenant, 'tenant_role', p_role, 'platform_admin', p_platform))::text, true);
  execute 'set local role authenticated';
end $$;
create or replace function pg_temp.logout() returns void language plpgsql as $$
begin execute 'reset role'; perform set_config('request.jwt.claims', '', true); end $$;

-- 1) Tenant-Isolation: Schüler aus Tenant 2 sieht keine Daten aus Tenant 1 -------------------------------
select pg_temp.login('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'student');
do $$ begin
  if (select count(*) from public.students) <> 1 then raise exception 'Isolation verletzt: Schüler sieht % Schüler', (select count(*) from public.students); end if;
  if (select count(*) from public.lessons) <> 0 then raise exception 'Isolation verletzt: fremde Fahrstunden sichtbar'; end if;
  if (select count(*) from public.instructors) <> 0 then raise exception 'Isolation verletzt: fremde Fahrlehrer sichtbar'; end if;
  if (select count(*) from public.driving_schools) <> 1 then raise exception 'Isolation verletzt: fremde Fahrschulen sichtbar'; end if;
end $$;
-- Schreibversuch in fremden Tenant scheitert
do $$ begin
  begin
    insert into public.lessons (tenant_id, instructor_id, period) values ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', tstzrange(now(), now() + interval '1 hour'));
    raise exception 'Isolation verletzt: Schreiben in fremden Tenant möglich';
  exception when insufficient_privilege or check_violation then null; end;
end $$;
select pg_temp.logout();

-- 2) Schüler sieht offene Slots und eigene Daten, aber keine Kollegen ------------------------------------
select pg_temp.login('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'student');
do $$ begin
  if (select count(*) from public.lessons where status = 'open') <> 3 then raise exception 'Schüler sieht offene Slots nicht'; end if;
  if (select count(*) from public.students) <> 1 then raise exception 'Schüler sieht fremde Schüler'; end if;
  if (select count(*) from public.cancellation_policies) <> 1 then raise exception 'Schüler sieht Stornoregel nicht'; end if;
  if (select count(*) from public.rule_versions where review_status = 'needs_verification') <> 0 then raise exception 'Unverifizierte Regeln für Schüler sichtbar'; end if;
end $$;

-- 3) Buchung durch Schüler: falsche Klasse wird abgelehnt, richtige klappt, Doppelbuchung scheitert ----------
do $$ declare v public.lessons; begin
  begin
    perform app.book_lesson('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001');
    raise exception 'Buchung mit falscher Klasse wurde akzeptiert';
  exception when others then
    if sqlerrm not like '%Klasse%' then raise; end if;
  end;
  v = app.book_lesson('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001');
  if v.status <> 'confirmed' or v.student_id <> '20000000-0000-0000-0000-000000000001' then raise exception 'Buchung fehlgeschlagen: %', v.status; end if;
  -- idempotente Wiederholung derselben Anfrage darf keine zweite Buchung erzeugen
  begin
    perform app.book_lesson('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001');
    raise exception 'Bereits gebuchte Stunde erneut buchbar';
  exception when others then if sqlerrm not like '%nicht mehr frei%' then raise; end if; end;
  if (select count(*) from public.lesson_bookings where lesson_id = '60000000-0000-0000-0000-000000000001') <> 1 then raise exception 'Buchungshistorie falsch'; end if;
end $$;

-- 4) Storno kurzfristig (3 h vor Beginn) erzeugt Gebühr nach Regel; Slot wird wieder frei ---------------------
do $$ declare v public.lessons; b public.lesson_bookings; begin
  v = app.book_lesson('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001');
  b = app.cancel_lesson('60000000-0000-0000-0000-000000000002', 'krank');
  if b.action <> 'cancelled_by_student' then raise exception 'Storno-Aktion falsch: %', b.action; end if;
  if b.fee_cents <> 3000 then raise exception 'Stornogebühr falsch: % (erwartet 3000)', b.fee_cents; end if;
  if b.fee_reason not like '%Ausbildungsvertrag § 6%' then raise exception 'Regelgrundlage nicht dokumentiert: %', b.fee_reason; end if;
  if (select status from public.lessons where id = '60000000-0000-0000-0000-000000000002') <> 'open' then raise exception 'Slot nach Storno nicht frei'; end if;
end $$;
select pg_temp.logout();

-- 5) Überschneidung: Fahrlehrer kann nicht doppelt verplant werden (DB-Constraint) ---------------------------
select pg_temp.login('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'office');
do $$ begin
  begin
    insert into public.lessons (tenant_id, instructor_id, period, status) values ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', tstzrange(date_trunc('day', now()) + interval '2 days 9 hours 20 minutes', date_trunc('day', now()) + interval '2 days 10 hours'), 'open');
    raise exception 'Überschneidung beim Fahrlehrer wurde nicht verhindert';
  exception when exclusion_violation then null; end;
  begin
    insert into public.lessons (tenant_id, instructor_id, vehicle_id, period, status) values ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', tstzrange(date_trunc('day', now()) + interval '2 days 9 hours 20 minutes', date_trunc('day', now()) + interval '2 days 10 hours'), 'open');
    raise exception 'Überschneidung beim Fahrzeug wurde nicht verhindert';
  exception when exclusion_violation then null; end;
  -- Stornierte Stunde blockiert nicht
  update public.lessons set status = 'cancelled' where id = '60000000-0000-0000-0000-000000000003';
  insert into public.lessons (tenant_id, instructor_id, period, status) values ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', tstzrange(date_trunc('day', now()) + interval '4 days 9 hours', date_trunc('day', now()) + interval '4 days 9 hours 45 minutes'), 'open');
end $$;

-- 6) Rechnung: lückenlose Nummer, ausgestellte Rechnung unveränderlich, Zahlung aktualisiert Status ----------
do $$ declare inv public.invoices; inv2 public.invoices; begin
  insert into public.invoices (id, tenant_id, student_id) values ('80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001');
  insert into public.invoice_items (invoice_id, position, description, quantity, unit_net_cents) values ('80000000-0000-0000-0000-000000000001', 1, 'Fahrstunde 45 Min', 2, 5042);
  inv = app.issue_invoice('80000000-0000-0000-0000-000000000001');
  if inv.invoice_number <> 'RE-' || extract(year from current_date)::text || '-00001' then raise exception 'Rechnungsnummer falsch: %', inv.invoice_number; end if;
  if inv.gross_cents <> 12000 then raise exception 'Bruttobetrag falsch: %', inv.gross_cents; end if;
  begin
    update public.invoices set gross_cents = 1 where id = inv.id;
    raise exception 'Ausgestellte Rechnung war änderbar';
  exception when insufficient_privilege then null; end;
  insert into public.invoices (id, tenant_id, student_id) values ('80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001');
  insert into public.invoice_items (invoice_id, position, description, unit_net_cents) values ('80000000-0000-0000-0000-000000000002', 1, 'Grundgebühr', 30000);
  inv2 = app.issue_invoice('80000000-0000-0000-0000-000000000002');
  if inv2.invoice_number not like '%-00002' then raise exception 'Nummer nicht fortlaufend: %', inv2.invoice_number; end if;
  insert into public.payments (tenant_id, student_id, invoice_id, method, amount_cents, status, paid_at) values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', inv.id, 'bank_transfer', 5000, 'succeeded', now());
  if (select status from public.invoices where id = inv.id) <> 'partially_paid' then raise exception 'Teilzahlung nicht erkannt'; end if;
  insert into public.payments (tenant_id, student_id, invoice_id, method, amount_cents, status, paid_at) values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', inv.id, 'bank_transfer', 7000, 'succeeded', now());
  if (select status from public.invoices where id = inv.id) <> 'paid' then raise exception 'Vollzahlung nicht erkannt'; end if;
end $$;

-- 7) Theorieunterricht: Token erzeugen (Fahrlehrer), Schüler checkt ein, zweiter Schüler mit gleichem Gerät scheitert
insert into public.theory_classes (id, tenant_id, instructor_id, lesson_unit_code, material_kind, title, period) values
  ('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'G5', 'basic', 'Vorfahrt', tstzrange(now() - interval '10 minutes', now() + interval '80 minutes'));
select pg_temp.logout();
select pg_temp.login('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'instructor');
select app.create_checkin_token('90000000-0000-0000-0000-000000000001', 60) as tok \gset
select pg_temp.logout();
select pg_temp.login('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'student');
select set_config('test.tok', :'tok', true);
do $$ declare a public.attendance; begin
  a = app.checkin_theory_class(current_setting('test.tok'), 'device-abc');
  if a.status <> 'present' or a.check_in_method <> 'qr' then raise exception 'Check-in fehlgeschlagen'; end if;
  begin
    perform app.checkin_theory_class('falscher-code', 'device-abc');
    raise exception 'Ungültiger Code akzeptiert';
  exception when others then if sqlerrm not like '%ungültig%' then raise; end if; end;
  if (select count(*) from public.theory_class_checkin_tokens) <> 0 then raise exception 'Schüler darf Token-Tabelle nicht lesen'; end if;
end $$;
select pg_temp.logout();

-- 8) Regel-Engine: gültige Version für B, keine veröffentlichte für D --------------------------------------
do $$ declare rv public.rule_versions; begin
  rv = app.rule_version_for('exam_theory', 'B', 'first');
  if rv.id is null or (rv.payload ->> 'max_error_points')::int <> 10 then raise exception 'Regel B nicht gefunden'; end if;
  rv = app.rule_version_for('exam_theory', 'D', 'first');
  if rv.id is not null then raise exception 'Unverifizierte Regel wurde als gültig geliefert'; end if;
  rv = app.rule_version_for_any('exam_theory', 'D', 'first');
  if rv.review_status <> 'needs_verification' then raise exception 'Fallback auf unverifizierte Regel fehlt'; end if;
  -- Überlappende veröffentlichte Version wird verhindert
  begin
    insert into public.rule_versions (rule_type, license_code, acquisition_kind, version, valid_from, payload, source, review_status)
      values ('exam_theory', 'B', 'first', 2, '2025-01-01', '{}', 'test', 'published');
    raise exception 'Überlappende Regelversion akzeptiert';
  exception when exclusion_violation then null; end;
end $$;

-- 9) Audit-Log wurde geschrieben
do $$ begin
  if (select count(*) from public.audit_logs where entity_table = 'lessons') = 0 then raise exception 'Audit-Log leer'; end if;
end $$;


-- 10) Härtung: Schüler kann Simulationen/XP/Abzeichen nicht direkt schreiben, Merken geht per Funktion, fremde Chats sind tabu
select pg_temp.login('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'student');
do $$ declare ok boolean; begin
  begin
    insert into public.exam_simulations (tenant_id, student_id, license_code, rule_version_id, rule_snapshot, client_session_id, question_ids, status, passed)
      values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'B', (select id from rule_versions where rule_type='exam_theory' and license_code='B' and review_status='published' limit 1), '{}', gen_random_uuid(), '{}', 'submitted', true);
    raise exception 'Schüler konnte Simulation direkt schreiben';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.xp_events (tenant_id, student_id, kind, xp, client_event_id) values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'question_correct', 9999, gen_random_uuid());
    raise exception 'Schüler konnte XP direkt schreiben';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.student_badges (tenant_id, student_id, badge_code) values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'streak_30');
    raise exception 'Schüler konnte Abzeichen direkt schreiben';
  exception when insufficient_privilege then null; end;
  ok = public.set_question_bookmark('b0000000-0000-0000-0000-000000000001', true);
  if not exists (select 1 from public.student_question_state where question_id = 'b0000000-0000-0000-0000-000000000001' and bookmarked) then raise exception 'Merken fehlgeschlagen'; end if;
end $$;
select pg_temp.logout();
-- Fremder Schüler (Tenant 1, zweiter Schüler) darf sich nicht in Lisas Unterhaltung eintragen
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000006', 's3@test.de');
insert into public.tenant_memberships (tenant_id, user_id, role) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'student');
insert into public.students (id, tenant_id, user_id, first_name, last_name, status) values ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'Tom', 'Dritter', 'active');
insert into public.conversations (id, tenant_id, kind, student_id) values ('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'student_office', '20000000-0000-0000-0000-000000000001');
insert into public.conversation_participants (conversation_id, user_id) values ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');
select pg_temp.login('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'student');
do $$ begin
  begin
    insert into public.conversation_participants (conversation_id, user_id) values ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006');
    raise exception 'Fremder Schüler konnte Unterhaltung beitreten';
  exception when insufficient_privilege then null; end;
  if (select count(*) from public.conversations) <> 0 then raise exception 'Fremde Unterhaltung sichtbar'; end if;
end $$;
select pg_temp.logout();

-- 11) DSGVO-Löschung: Büro pseudonymisiert den dritten Schüler; Lerndaten weg, Name ersetzt, Schüler selbst darf es nicht
select pg_temp.login('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'student');
do $$ begin
  begin
    perform public.anonymize_student('20000000-0000-0000-0000-000000000003');
    raise exception 'Schüler konnte sich selbst pseudonymisieren';
  exception when insufficient_privilege then null; end;
end $$;
select pg_temp.logout();
select pg_temp.login('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'office');
do $$ declare r jsonb; begin
  r := public.anonymize_student('20000000-0000-0000-0000-000000000003', '2036-12-31');
  if (r->>'student_id') is null then raise exception 'Kein Ergebnis'; end if;
  if exists (select 1 from public.students where id = '20000000-0000-0000-0000-000000000003' and (first_name <> 'Gelöscht' or email is not null or user_id is not null)) then raise exception 'Personenbezug nicht entfernt'; end if;
  if exists (select 1 from public.student_question_state where student_id = '20000000-0000-0000-0000-000000000003') then raise exception 'Lerndaten nicht gelöscht'; end if;
  if exists (select 1 from public.tenant_memberships where user_id = '00000000-0000-0000-0000-000000000006') then raise exception 'Mitgliedschaft nicht entfernt'; end if;
end $$;
select pg_temp.logout();

select 'ALLE TESTS BESTANDEN' as ergebnis;
rollback;
